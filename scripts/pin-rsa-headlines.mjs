// Nädalaraporti parandus: QS 3/10 märksõnad (tühjenduspump 131 imp, drenaažipump 124,
// sukelpump 49, tsirkulatsioonipump 49) + Unilift rank-lost IS 52 %.
// Märksõnad ON juba pealkirjades ja maandumislehtedel, aga aktiivsetes RSA-des pole
// märksõna-pealkirjad HEADLINE_1 positsioonile kinnitatud (pausil olevatel vanadel oli).
// Kinnitame märksõnapealkirjad esikohale → parem reklaami asjakohasus → parem ad rank.
// RSA on immutable: loon uue RSA pin-nikutega, vana pannakse pausile.
// Kasutus: node scripts/pin-rsa-headlines.mjs [--dry-run]
import { readFileSync } from 'fs'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'
const __dirname = dirname(fileURLToPath(import.meta.url))
try {
  const content = readFileSync(resolve(__dirname, '..', '.env.local'), 'utf-8')
  for (const line of content.split('\n')) { const t = line.trim(); if (t && !t.startsWith('#')) { const eq = t.indexOf('='); if (eq > 0) { const k = t.slice(0, eq); let v = t.slice(eq + 1); if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1); process.env[k] = v } } }
} catch {}
const CUST = (process.env.GOOGLE_ADS_CUSTOMER_ID || '').replace(/-/g, ''), LOGIN = (process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID || '').replace(/-/g, ''), DEV = process.env.GOOGLE_ADS_DEVELOPER_TOKEN
const DRY = process.argv.includes('--dry-run')

async function token() { const p = new URLSearchParams({ client_id: process.env.GOOGLE_ADS_CLIENT_ID, client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET, refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN, grant_type: 'refresh_token' }); const r = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: p.toString() }); const d = await r.json(); if (!d.access_token) throw new Error('OAuth failed'); return d.access_token }
async function gaql(q) { const tk = await token(); const hd = { Authorization: 'Bearer ' + tk, 'developer-token': DEV, 'Content-Type': 'application/json' }; if (LOGIN) hd['login-customer-id'] = LOGIN; const r = await fetch(`https://googleads.googleapis.com/v24/customers/${CUST}/googleAds:search`, { method: 'POST', headers: hd, body: JSON.stringify({ query: q }) }); const d = await r.json(); if (!r.ok) throw new Error('GAQL: ' + JSON.stringify(d).slice(0, 400)); return d.results || [] }
async function mutate(ops) { const tk = await token(); const hd = { Authorization: 'Bearer ' + tk, 'developer-token': DEV, 'Content-Type': 'application/json' }; if (LOGIN) hd['login-customer-id'] = LOGIN; const r = await fetch(`https://googleads.googleapis.com/v24/customers/${CUST}/adGroupAds:mutate`, { method: 'POST', headers: hd, body: JSON.stringify({ operations: ops }) }); return await r.json() }

// Kampaania → ad group → pealkirjad, mis kinnitada HEADLINE_1 peale
const JOBS = [
  {
    campaign: 'Unilift CC + Drenaaž - EE 2026 sügis',
    adGroup: 'Drenaaž ja tühjendus',
    pinToH1: ['Drenaažipumbad Laos', 'Tühjenduspump Sügiseks', 'Sukelpumbad Laos'],
  },
  {
    campaign: 'ALPHA GO - Küte - EE 2026 sügis',
    adGroup: 'Küttepumbad ja tsirkulatsioonipumbad',
    pinToH1: ['Küttepumbad Laos', 'Tsirkulatsioonipumbad'],
  },
]

console.log(DRY ? '=== DRY RUN ===' : '=== PIN RSA HEADLINES ===')

for (const job of JOBS) {
  console.log(`\n${job.campaign} / ${job.adGroup}`)
  const rows = await gaql(`SELECT ad_group.resource_name, ad_group.name, ad_group_ad.resource_name, ad_group_ad.ad.name, ad_group_ad.ad.final_urls, ad_group_ad.ad.responsive_search_ad.headlines, ad_group_ad.ad.responsive_search_ad.descriptions, ad_group_ad.ad.responsive_search_ad.path1, ad_group_ad.ad.responsive_search_ad.path2 FROM ad_group_ad WHERE campaign.name = '${job.campaign.replace(/'/g, "\\'")}' AND ad_group.name = '${job.adGroup.replace(/'/g, "\\'")}' AND ad_group_ad.status = 'ENABLED'`)
  const ad = rows[0]
  if (!ad) { console.error('  Aktiivset RSA-d ei leitud — vahele'); continue }

  const rsa = ad.adGroupAd.ad.responsiveSearchAd
  const currentPins = new Set(rsa.headlines.filter((h) => h.pinnedField === 'HEADLINE_1').map((h) => h.text))
  const missing = job.pinToH1.filter((t) => !currentPins.has(t))
  if (missing.length === 0) { console.log('  Kõik märksõnapealkirjad on juba H1 peal — midagi ei tehta'); continue }
  for (const m of missing) {
    if (!rsa.headlines.some((h) => h.text === m)) { console.error(`  Pealkirja "${m}" pole RSA-s — katkestame`); process.exit(1) }
  }

  const newHeadlines = rsa.headlines.map((h) => {
    const pin = job.pinToH1.includes(h.text) ? { pinnedField: 'HEADLINE_1' } : {}
    return { text: h.text, ...pin }
  })
  console.log('  Uued pealkirjad (★ = H1 pin):')
  newHeadlines.forEach((h) => console.log(`   ${h.pinnedField ? '★' : '-'} ${h.text}`))

  if (DRY) { console.log('  DRY RUN — muudatusi ei tehtud'); continue }

  const createOp = {
    create: {
      adGroup: ad.adGroup.resourceName,
      status: 'ENABLED',
      ad: {
        name: (ad.adGroupAd.ad.name || job.adGroup) + ' pinned',
        type: 'RESPONSIVE_SEARCH_AD',
        finalUrls: ad.adGroupAd.ad.finalUrls,
        responsiveSearchAd: {
          headlines: newHeadlines,
          descriptions: rsa.descriptions.map((d) => ({ text: d.text })),
          ...(rsa.path1 ? { path1: rsa.path1 } : {}),
          ...(rsa.path2 ? { path2: rsa.path2 } : {}),
        },
      },
    },
  }
  const res1 = await mutate([createOp])
  if (!res1?.results) { console.error('  Uue RSA loomine ebaõnnestus: ' + JSON.stringify(res1).slice(0, 600)); process.exit(1) }
  console.log('  Uus RSA loodud: ' + res1.results[0].resourceName)

  const pauseOp = { update: { resourceName: ad.adGroupAd.resourceName, status: 'PAUSED' }, updateMask: 'status' }
  const res2 = await mutate([pauseOp])
  if (!res2?.results) { console.error('  Vana RSA pausimine ebaõnnestus: ' + JSON.stringify(res2).slice(0, 600)); process.exit(1) }
  console.log('  Vana RSA pausitud')
}
console.log('\n=== DONE ===')
