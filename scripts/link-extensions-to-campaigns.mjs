// Lingi olemasolevad sitelink/callout assetid Unilift CC ja ALPHA GO kampaaniatega.
// Praegu on kõik 30 laiendust seotud ainult vanas pausitud "Pumbapood search - EE" kampaaniaga.
// Kasutus: node scripts/link-extensions-to-campaigns.mjs [--dry-run]
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
async function mutate(ops) { const tk = await token(); const hd = { Authorization: 'Bearer ' + tk, 'developer-token': DEV, 'Content-Type': 'application/json' }; if (LOGIN) hd['login-customer-id'] = LOGIN; const r = await fetch(`https://googleads.googleapis.com/v24/customers/${CUST}/campaignAssets:mutate`, { method: 'POST', headers: hd, body: JSON.stringify({ operations: ops }) }); return await r.json() }

// Millised assetid kummalegi kampaaniale (link_text / callout_text väärtuste järgi)
const PLAN = {
  'Unilift CC + Drenaaž - EE 2026 sügis': {
    sitelinks: ['Unilift pumbad', 'Drenaažipumbad', 'Reoveepumbad', 'Küsi nõu'],
    callouts: ['Ametlik Grundfos partner', 'Kiire tarne üle Eesti', 'Tehniline nõustamine', 'Tootjagarantii'],
  },
  'ALPHA GO - Küte - EE 2026 sügis': {
    sitelinks: ['Küttepumbad', 'Kõik Grundfos pumbad', 'Võta ühendust', 'Küsi nõu'],
    callouts: ['Ametlik Grundfos partner', 'Kiire tarne üle Eesti', 'Tootjagarantii', 'Originaaltooted'],
  },
}

console.log(DRY ? '=== DRY RUN ===' : '=== LINKING EXTENSIONS ===')

// 1) Kampaaniad (filtreeri JS-is — GAQL IN-päring unicode nimede peal on ebakindel)
const camps = await gaql(`SELECT campaign.id, campaign.name, campaign.resource_name FROM campaign WHERE campaign.status != 'REMOVED'`)
const campByName = Object.fromEntries(camps.filter(c => PLAN[c.campaign.name]).map(c => [c.campaign.name, c.campaign]))
for (const n of Object.keys(PLAN)) if (!campByName[n]) { console.error(`Kampaaniat ei leitud: ${n}`); process.exit(1) }

// 2) Assetid (dedupe teksti järgi)
const assets = await gaql(`SELECT asset.resource_name, asset.type, asset.final_urls, asset.sitelink_asset.link_text, asset.callout_asset.callout_text FROM asset WHERE asset.type IN ('SITELINK','CALLOUT')`)
const sitelinkByText = {}, calloutByText = {}
for (const a of assets) {
  if (a.asset.type === 'SITELINK') { const t = a.asset.sitelinkAsset?.linkText; if (t && !sitelinkByText[t]) sitelinkByText[t] = a.asset }
  if (a.asset.type === 'CALLOUT') { const t = a.asset.calloutAsset?.calloutText; if (t && !calloutByText[t]) calloutByText[t] = a.asset }
}
console.log(`Assete kontol: ${Object.keys(sitelinkByText).length} sitelinki, ${Object.keys(calloutByText).length} callout'i`)

// 3) Olemasolevad lingid (et ei dubleeriks)
const existing = await gaql(`SELECT campaign.name, campaign.status, campaign_asset.asset FROM campaign_asset WHERE campaign.status != 'REMOVED'`)
const already = new Set(existing.map(e => `${e.campaign.name}|${e.campaignAsset.asset}`))

// 4) Lingi
for (const [campName, plan] of Object.entries(PLAN)) {
  const camp = campByName[campName]
  const ops = []
  for (const t of plan.sitelinks) {
    const a = sitelinkByText[t]
    if (!a) { console.log(`  ! sitelink puudub: "${t}"`); continue }
    if (already.has(`${campName}|${a.resourceName}`)) { console.log(`  = juba lingitud: ${t}`); continue }
    ops.push({ create: { campaign: camp.resourceName, asset: a.resourceName, fieldType: 'SITELINK' } })
    console.log(`  + sitelink "${t}" (${a.finalUrls?.[0]})`)
  }
  for (const t of plan.callouts) {
    const a = calloutByText[t]
    if (!a) { console.log(`  ! callout puudub: "${t}"`); continue }
    if (already.has(`${campName}|${a.resourceName}`)) { console.log(`  = juba lingitud: ${t}`); continue }
    ops.push({ create: { campaign: camp.resourceName, asset: a.resourceName, fieldType: 'CALLOUT' } })
    console.log(`  + callout "${t}"`)
  }
  console.log(`${campName}: ${ops.length} uut linki`)
  if (ops.length && !DRY) {
    const res = await mutate(ops)
    if (res?.results) console.log(`  OK (${res.results.length} linki loodud)`)
    else console.log('  VIGA: ' + JSON.stringify(res).slice(0, 500))
  }
}
console.log('=== DONE ===')
