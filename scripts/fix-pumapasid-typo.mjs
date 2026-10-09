// Parandab live-reklaamides trükivea "pumapasi(d)" -> "pumpasi(d)".
// Google Ads: RSA tekst on muutumatu — loome parandatud tekstiga asendus-RSA
// (sama ad group, staatus, URL, path, pin'id) ja märkime vana REMOVED.
// Meta: kreatiiv on muutumatu — loome parandatud tekstiga uue kreatiivi ja
// suuname reklaami(d) sellele (vana kreatiiv jääb kasutamata alles).
// Kasutus:
//   node scripts/fix-pumapasid-typo.mjs --dry-run
//   node scripts/fix-pumapasid-typo.mjs
import { readFileSync } from 'fs'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
try {
  const content = readFileSync(resolve(__dirname, '..', '.env.local'), 'utf-8')
  for (const line of content.split('\n')) {
    const t = line.trim()
    if (t && !t.startsWith('#')) {
      const eq = t.indexOf('=')
      if (eq > 0) { const k = t.slice(0, eq); let v = t.slice(eq + 1); if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1); process.env[k] = v }
    }
  }
} catch {}

const DRY = process.argv.includes('--dry-run')
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const TYPO = /pumapas/i
function fixText(s) {
  if (typeof s !== 'string') return s
  return s.replace(/pumapas/gi, (m) => (m[0] === 'P' ? 'Pumpas' : 'pumpas'))
}

// ─── GOOGLE ADS ─────────────────────────────────────────────────────────────

const CUST = (process.env.GOOGLE_ADS_CUSTOMER_ID || '2639481819').replace(/-/g, '')
const LOGIN = (process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID || '').replace(/-/g, '')
const V = 'v24', DEV = process.env.GOOGLE_ADS_DEVELOPER_TOKEN

async function gToken() {
  const p = new URLSearchParams({ client_id: process.env.GOOGLE_ADS_CLIENT_ID, client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET, refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN, grant_type: 'refresh_token' })
  const r = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: p.toString() })
  const d = await r.json()
  if (!d.access_token) throw new Error('OAuth failed: ' + JSON.stringify(d))
  return d.access_token
}

async function gaql(q) {
  const tk = await gToken()
  const hd = { Authorization: 'Bearer ' + tk, 'developer-token': DEV, 'Content-Type': 'application/json' }
  if (LOGIN) hd['login-customer-id'] = LOGIN
  const r = await fetch(`https://googleads.googleapis.com/${V}/customers/${CUST}/googleAds:search`, { method: 'POST', headers: hd, body: JSON.stringify({ query: q }) })
  return (await r.json()).results || []
}

async function gMutate(ops, ep) {
  const tk = await gToken()
  const hd = { Authorization: 'Bearer ' + tk, 'developer-token': DEV, 'Content-Type': 'application/json' }
  if (LOGIN) hd['login-customer-id'] = LOGIN
  const r = await fetch(`https://googleads.googleapis.com/${V}/customers/${CUST}/${ep}:mutate`, { method: 'POST', headers: hd, body: JSON.stringify({ operations: ops }) })
  return await r.json()
}

// ─── META ───────────────────────────────────────────────────────────────────

const TOKEN = process.env.META_ACCESS_TOKEN
const ACCT = (process.env.META_AD_ACCOUNT_ID || '').replace('act_', '')
const MV = process.env.META_GRAPH_API_VERSION || 'v25.0'
const BASE = `https://graph.facebook.com/${MV}`

async function mApi(path, method = 'GET', body = null) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    const url = `${BASE}/${path}${path.includes('?') ? '&' : '?'}access_token=${TOKEN}`
    const opt = { method }
    if (body) { opt.headers = { 'Content-Type': 'application/json' }; opt.body = JSON.stringify(body) }
    const r = await fetch(url, opt)
    const d = await r.json()
    if (d?.error?.code === 17) { console.log('  rate-limit, ootan 60s...'); await sleep(60_000); continue }
    if (!r.ok || d?.error) throw new Error(`Meta API ${method} ${path}: ` + JSON.stringify(d?.error || d).slice(0, 400))
    return d
  }
  throw new Error('rate-limit püsib')
}

// ─── MAIN ───────────────────────────────────────────────────────────────────

console.log(`=== PUMAPASI -> PUMPASI typo fix ===  režiim: ${DRY ? 'DRY RUN' : 'LIVE'}\n`)

// --- Google Ads ---
console.log('--- GOOGLE ADS ---')
const rows = await gaql(`
  SELECT ad_group_ad.resource_name, ad_group_ad.status, ad_group_ad.ad.id, ad_group_ad.ad.name,
         ad_group_ad.ad.final_urls, ad_group_ad.ad.responsive_search_ad.headlines,
         ad_group_ad.ad.responsive_search_ad.descriptions,
         ad_group_ad.ad.responsive_search_ad.path1, ad_group_ad.ad.responsive_search_ad.path2,
         ad_group.resource_name, ad_group.name, campaign.name
  FROM ad_group_ad
  WHERE ad_group_ad.status != 'REMOVED' AND ad_group_ad.ad.type = 'RESPONSIVE_SEARCH_AD'
`)

const bad = []
for (const r of rows) {
  const rsa = r.adGroupAd?.ad?.responsiveSearchAd
  if (!rsa) continue
  const hit =
    (rsa.headlines || []).some((h) => TYPO.test(h.text)) ||
    (rsa.descriptions || []).some((d) => TYPO.test(d.text))
  if (hit) bad.push(r)
}
console.log(`Leitud ${bad.length} RSA(d) trükiveaga\n`)

for (const r of bad) {
  const a = r.adGroupAd
  const rsa = a.ad.responsiveSearchAd
  console.log(`• ${r.campaign.name} / ${r.adGroup.name} / ad#${a.ad.id} (${a.status})`)
  const headlines = (rsa.headlines || []).map((h) => {
    const fixed = fixText(h.text)
    if (fixed !== h.text) console.log(`    H: "${h.text}" -> "${fixed}"`)
    const out = { text: fixed }
    if (h.pinnedField && h.pinnedField !== 'UNSPECIFIED') out.pinnedField = h.pinnedField
    return out
  })
  const descriptions = (rsa.descriptions || []).map((d) => {
    const fixed = fixText(d.text)
    if (fixed !== d.text) console.log(`    D: "${d.text}" -> "${fixed}"`)
    return { text: fixed }
  })
  // Idempotentsus: kui samas ad groupis on juba identne parandatud RSA, ära loo duplikaati
  const fixedKey = JSON.stringify([headlines.map((h) => h.text), descriptions.map((d) => d.text)])
  const duplicate = rows.some((o) => {
    if (o.adGroupAd.resourceName === a.resourceName) return false
    if (o.adGroup.resourceName !== r.adGroup.resourceName) return false
    const orsa = o.adGroupAd?.ad?.responsiveSearchAd
    if (!orsa) return false
    const oKey = JSON.stringify([(orsa.headlines || []).map((h) => h.text), (orsa.descriptions || []).map((d) => d.text)])
    return oKey === fixedKey
  })
  if (DRY) {
    console.log(`    [dry] ${duplicate ? 'parandatud RSA juba olemas —' : 'looksin asendus-RSA ja'} eemaldaksin vana (remove)`)
    continue
  }
  let newRn = null
  if (duplicate) {
    console.log(`    ✓ parandatud RSA on juba olemas — ei loo duplikaati`)
  } else {
    const createOp = {
      create: {
        adGroup: r.adGroup.resourceName,
        status: a.status,
        ad: {
          ...(a.ad.name ? { name: a.ad.name } : {}),
          type: 'RESPONSIVE_SEARCH_AD',
          finalUrls: a.ad.finalUrls,
          responsiveSearchAd: {
            headlines,
            descriptions,
            ...(rsa.path1 ? { path1: rsa.path1 } : {}),
            ...(rsa.path2 ? { path2: rsa.path2 } : {}),
          },
        },
      },
    }
    const cRes = await gMutate([createOp], 'adGroupAds')
    newRn = cRes?.results?.[0]?.resourceName
    if (!newRn) { console.log('    FAIL create:', JSON.stringify(cRes).slice(0, 400)); process.exit(1) }
    console.log(`    + asendus loodud: ${newRn}`)
    await sleep(1500)
  }
  const dRes = await gMutate([{ remove: a.resourceName }], 'adGroupAds')
  if (dRes?.error) { console.log('    FAIL remove vana:', JSON.stringify(dRes).slice(0, 400)); process.exit(1) }
  console.log(`    + vana eemaldatud (remove)`)
  await sleep(1500)
}

// --- Meta ---
console.log('\n--- META ---')
const mAds = (await mApi(`act_${ACCT}/ads?fields=id,name,status,creative{id,name,object_story_spec}&limit=500`)).data || []
const mBad = []
for (const ad of mAds) {
  const ld = ad.creative?.object_story_spec?.link_data
  if (!ld) continue
  if (TYPO.test(ld.message || '') || TYPO.test(ld.name || '') || TYPO.test(ld.description || '')) {
    mBad.push(ad)
  }
}
console.log(`Leitud ${mBad.length} Meta reklaami trükiveaga\n`)

for (const ad of mBad) {
  const spec = ad.creative.object_story_spec
  const ld = spec.link_data
  console.log(`• ${ad.name} (${ad.status}) — kreatiiv "${ad.creative.name}"`)
  const fixedLd = {
    ...ld,
    ...(ld.message ? { message: fixText(ld.message) } : {}),
    ...(ld.name ? { name: fixText(ld.name) } : {}),
    ...(ld.description ? { description: fixText(ld.description) } : {}),
  }
  if (ld.message && TYPO.test(ld.message)) console.log(`    message: ...${fixText(ld.message).split('\n').find((l) => /pumpas/i.test(l))}`)
  const newName = `${ad.creative.name} (pumpasid fix)`
  if (DRY) {
    console.log(`    [dry] looksin kreatiivi "${newName}" ja suunaksin reklaami sellele`)
    continue
  }
  const existing = (await mApi(`act_${ACCT}/adcreatives?fields=id,name&limit=500`)).data || []
  let cid = existing.find((c) => c.name === newName)?.id
  if (!cid) {
    const d = await mApi(`act_${ACCT}/adcreatives`, 'POST', { name: newName, object_story_spec: { ...spec, link_data: fixedLd } })
    cid = d.id
    console.log(`    + kreatiiv loodud: ${cid}`)
    await sleep(2000)
  } else {
    console.log(`    ✓ kreatiiv juba olemas: ${cid}`)
  }
  await mApi(`${ad.id}`, 'POST', { creative: { creative_id: cid } })
  console.log(`    + reklaam suunatud uuele kreatiivile`)
  await sleep(2000)
}

console.log(DRY ? '\nDRY RUN — muudatusi ei tehtud' : '\n=== DONE ===')
