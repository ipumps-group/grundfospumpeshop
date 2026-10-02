// Remarketing-kampaania (plaani Variant D, kliendi kinnitus 02.10.2026):
// „Pumbapood remarketing - EE 2026" — OUTCOME_SALES, PURCHASE-optimeerimine,
// CBO 4 €/päev, 2 adset'i (külastajad / tootevaatajad+kampaanialehed, ostjad välistatud),
// reklaamid taaskasutavad ALPHA GO ja Unilift olemasolevaid kreatiive. Lõppkuupäev 31.10.2026.
// Idempotentne: nimepõhiselt vahelejätavad sammud ei dubleeri.
// Kasutus:
//   node scripts/create-remarketing-meta.mjs --dry-run   # kuva plaan, ei tee midagi
//   node scripts/create-remarketing-meta.mjs             # loob KÕIK PAUSED-seisus
//   node scripts/create-remarketing-meta.mjs --enable    # lülitab kampaania+adset'id+reklaamid ENABLED
import { readFileSync } from 'fs'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'
const __dirname = dirname(fileURLToPath(import.meta.url))
try {
  const content = readFileSync(resolve(__dirname, '..', '.env.local'), 'utf-8')
  for (const line of content.split('\n')) { const t = line.trim(); if (t && !t.startsWith('#')) { const eq = t.indexOf('='); if (eq > 0) { const k = t.slice(0, eq); let v = t.slice(eq + 1); if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1); process.env[k] = v } } }
} catch {}

const TOKEN = process.env.META_ACCESS_TOKEN
const ACCT = (process.env.META_AD_ACCOUNT_ID || '').replace('act_', '')
const PIXEL = process.env.META_PIXEL_ID || '2133761077401963'
const V = process.env.META_GRAPH_API_VERSION || 'v25.0'
const BASE = `https://graph.facebook.com/${V}`
const DRY = process.argv.includes('--dry-run')
const ENABLE = process.argv.includes('--enable')

const CAMPAIGN_NAME = 'Pumbapood remarketing - EE 2026'
const END_TIME = '2026-10-31T23:59:59+0200' // oktoobri lõpp (EET, DST lõppenud)
const AUD_VISITORS = 'RMK: Külastajad 30p'
const AUD_VIEWCONTENT = 'RMK: Tootevaatajad 30p'
const AUD_CAMPPAGES = 'RMK: ALPHA GO + Unilift lehed 30p'
const AUD_PURCHASERS = 'RMK: Ostjad 30p'

async function api(path, method = 'GET', body = null) {
  const url = `${BASE}/${path}${path.includes('?') ? '&' : '?'}access_token=${TOKEN}`
  const opt = { method }
  if (body) { opt.headers = { 'Content-Type': 'application/json' }; opt.body = JSON.stringify(body) }
  const r = await fetch(url, opt)
  const d = await r.json()
  if (!r.ok || d?.error) throw new Error(`Meta API ${method} ${path}: ` + JSON.stringify(d?.error || d).slice(0, 400))
  return d
}

const wcaRule = (event, extraFilters = []) => JSON.stringify({
  inclusions: {
    operator: 'or',
    rules: [{
      event_sources: [{ type: 'pixel', id: PIXEL }],
      retention_seconds: 30 * 24 * 3600,
      filter: { operator: 'and', filters: [{ field: 'event', operator: 'eq', value: event }, ...extraFilters] },
    }],
  },
})
const urlRule = (path) => JSON.stringify({
  inclusions: {
    operator: 'or',
    rules: [{
      event_sources: [{ type: 'pixel', id: PIXEL }],
      retention_seconds: 30 * 24 * 3600,
      filter: { operator: 'and', filters: [{ field: 'event', operator: 'eq', value: 'PageView' }, { field: 'url', operator: 'i_contains', value: path }] },
    }],
  },
})

const AUDIENCES = [
  { name: AUD_VISITORS, rule: wcaRule('PageView') },
  { name: AUD_VIEWCONTENT, rule: wcaRule('ViewContent') },
  { name: AUD_CAMPPAGES, rule: urlRule('/alpha-go') }, // teine reegel lisatakse allpool ühendina
  { name: AUD_PURCHASERS, rule: wcaRule('Purchase') },
]

async function findCampaignByName(name) {
  const d = await api(`act_${ACCT}/campaigns?fields=id,name,status,objective,daily_budget&limit=200`)
  return (d.data || []).find((c) => c.name === name)
}
async function findAudienceByName(name) {
  const d = await api(`act_${ACCT}/customaudiences?fields=id,name,approximate_count_lower_bound,approximate_count_upper_bound&limit=500`)
  return (d.data || []).find((a) => a.name === name)
}

async function main() {
  console.log(`=== META REMARKETING: ${CAMPAIGN_NAME} ===`)
  console.log(`režiim: ${DRY ? 'DRY RUN (muudatusi ei tehta)' : ENABLE ? 'ENABLE (lülitan sisse)' : 'LOOMINE (PAUSED)'}\n`)

  /* --- 1. Publikud --- */
  console.log('1. PUBLIKUD (WCA, 30p, prefill):')
  const audIds = {}
  for (const a of AUDIENCES) {
    let rule = a.rule
    // Kampaanialehtede publik: /alpha-go OR /unilift — ühendan kaks reeglit
    if (a.name === AUD_CAMPPAGES) {
      const one = JSON.parse(urlRule('/alpha-go')).inclusions.rules[0]
      const two = JSON.parse(urlRule('/unilift')).inclusions.rules[0]
      rule = JSON.stringify({ inclusions: { operator: 'or', rules: [one, two] } })
    }
    const existing = await findAudienceByName(a.name)
    if (existing) {
      console.log(`  ✓ olemas: ${a.name} (id ${existing.id})`)
      audIds[a.name] = existing.id
      continue
    }
    if (DRY) { console.log(`  + looksin: ${a.name}`); continue }
    const d = await api(`act_${ACCT}/customaudiences`, 'POST', {
      name: a.name,
      description: 'Remarketing-plaan 02.10.2026 (docs/meta-reklaamide-seis-ja-remarketing-plaan.md)',
      rule,
      prefill: true,
    })
    console.log(`  + loodud: ${a.name} (id ${d.id})`)
    audIds[a.name] = d.id
  }

  /* --- 2. Kampaania (CBO 4 €/päev) --- */
  console.log('\n2. KAMPAANIA:')
  let camp = await findCampaignByName(CAMPAIGN_NAME)
  if (camp) {
    console.log(`  ✓ olemas: id ${camp.id} [${camp.status}] eelarve ${camp.daily_budget ? Number(camp.daily_budget) / 100 + ' €/päev' : '–'}`)
    if (!DRY) await api(`${camp.id}`, 'POST', { bid_strategy: 'LOWEST_COST_WITHOUT_CAP' })
  } else if (DRY) {
    console.log(`  + looksin: "${CAMPAIGN_NAME}" OUTCOME_SALES, CBO 4,00 €/päev, PAUSED`)
  } else {
    camp = await api(`act_${ACCT}/campaigns`, 'POST', {
      name: CAMPAIGN_NAME,
      objective: 'OUTCOME_SALES',
      status: 'PAUSED',
      special_ad_categories: [],
      buying_type: 'AUCTION',
      daily_budget: '400',
      bid_strategy: 'LOWEST_COST_WITHOUT_CAP',
    })
    console.log(`  + loodud: id ${camp.id} (OUTCOME_SALES, CBO 4,00 €/päev, PAUSED)`)
  }

  /* --- 3. Adset'id --- */
  const ADSETS = [
    { name: 'RMK külastajad 30p (excl ostjad)', include: [AUD_VISITORS] },
    { name: 'RMK tootevaatajad + kampaanialehed 30p (excl ostjad)', include: [AUD_VIEWCONTENT, AUD_CAMPPAGES] },
  ]
  const adsetIds = {}
  console.log('\n3. ADSET’ID (PURCHASE-optimeerimine, EE, 21–65, lõpp 31.10.2026):')
  for (const s of ADSETS) {
    const existing = camp?.id ? (await api(`${camp.id}/adsets?fields=id,name,status&limit=50`)).data?.find((x) => x.name === s.name) : null
    if (existing) {
      console.log(`  ✓ olemas: ${s.name} (id ${existing.id}) [${existing.status}]`)
      adsetIds[s.name] = existing.id
      continue
    }
    if (DRY) { console.log(`  + looksin: ${s.name} (publikud: ${s.include.join(' + ')}, välistus: ${AUD_PURCHASERS})`); continue }
    const targeting = {
      geo_locations: { countries: ['EE'] },
      age_min: 21,
      age_max: 65,
      custom_audiences: s.include.map((n) => ({ id: audIds[n] })),
      excluded_custom_audiences: [{ id: audIds[AUD_PURCHASERS] }],
    }
    const d = await api(`act_${ACCT}/adsets`, 'POST', {
      name: s.name,
      campaign_id: camp.id,
      status: 'PAUSED',
      optimization_goal: 'OFFSITE_CONVERSIONS',
      billing_event: 'IMPRESSIONS',
      promoted_object: { pixel_id: PIXEL, custom_event_type: 'PURCHASE' },
      targeting,
      end_time: END_TIME,
    })
    console.log(`  + loodud: ${s.name} (id ${d.id})`)
    adsetIds[s.name] = d.id
  }

  /* --- 4. Reklaamid — taaskasuta olemasolevaid kreatiive --- */
  console.log('\n4. REKLAAMID (olemasolevad kreatiivid):')
  const srcCampaigns = ['ALPHA GO - Küte - EE 2026 sügis', 'Unilift CC - Tühjendus ja drenaaž B2B - EE sügis 2026']
  const creatives = {}
  for (const cn of srcCampaigns) {
    const c = await findCampaignByName(cn)
    if (!c) { console.log(`  ! kampaaniat ei leitud: ${cn}`); continue }
    const ads = (await api(`${c.id}/ads?fields=name,effective_status,creative{id,name}&limit=50`)).data || []
    const ad = ads.find((a) => a.effective_status === 'ACTIVE') || ads[0]
    if (ad?.creative?.id) {
      creatives[cn.includes('ALPHA') ? 'ALPHA GO' : 'Unilift CC'] = { id: ad.creative.id, fromAd: ad.name }
      console.log(`  ✓ kreatiiv: ${ad.creative.name || ad.creative.id} (reklaamist "${ad.name}")`)
    }
  }
  for (const [adsetName, adsetId] of Object.entries(adsetIds)) {
    for (const [label, cr] of Object.entries(creatives)) {
      const adName = `RMK reklaam - ${label}`
      const existing = (await api(`${adsetId}/ads?fields=id,name,status&limit=50`)).data?.find((x) => x.name === adName)
      if (existing) { console.log(`  ✓ olemas: ${adName} (${existing.id}) [${existing.status}]`); continue }
      if (DRY) { console.log(`  + looksin: ${adName} → adset "${adsetName}"`); continue }
      const d = await api(`act_${ACCT}/ads`, 'POST', {
        name: adName,
        adset_id: adsetId,
        creative: { creative_id: cr.id },
        status: 'PAUSED',
      })
      console.log(`  + loodud: ${adName} (id ${d.id})`)
    }
  }

  /* --- 5. ENABLE --- */
  if (ENABLE && !DRY) {
    console.log('\n5. LÜLITAN SISSE (ENABLED):')
    const c = await findCampaignByName(CAMPAIGN_NAME)
    if (!c) throw new Error('Kampaaniat ei leitud')
    const adsets = (await api(`${c.id}/adsets?fields=id,name,status&limit=50`)).data || []
    for (const s of adsets) {
      const ads = (await api(`${s.id}/ads?fields=id,name,status&limit=50`)).data || []
      for (const ad of ads) if (ad.status !== 'ACTIVE') { await api(`${ad.id}`, 'POST', { status: 'ACTIVE' }); console.log(`  reklaam ACTIVE: ${ad.name}`) }
      if (s.status !== 'ACTIVE') { await api(`${s.id}`, 'POST', { status: 'ACTIVE' }); console.log(`  adset ACTIVE: ${s.name}`) }
    }
    if (c.status !== 'ACTIVE') { await api(`${c.id}`, 'POST', { status: 'ACTIVE' }); console.log(`  kampaania ACTIVE: ${c.name}`) }
  }

  console.log(DRY ? '\nDRY RUN — muudatusi ei tehtud' : '\n=== DONE ===')
}

main().catch((e) => { console.error('VIGA:', e.message); process.exit(1) })
