// Display-võrgu (CONTENT) väljalülitamine Search-kampaaniatelt.
// Põhjus: nädalaraport 2026-10-19..25 näitas, et ALPHA GO - Küte kulutas 71%
// eelarvest (109,21 €) CONTENT-võrku — 1950 klikki 53464 näitamisest, 0 conv
// ja vaid murdosa jõudis GA4 sessioonideni (juhuslikud mobiiliäppi bänneriklikid).
//
// Kasutus:
//   node scripts/set-network-settings.mjs [--dry-run] ["kampaania nimi (valikuline filter)"]
//
// Idempotentne: kampaaniad, kus content-võrk juba väljas, jäetakse vahele.
// Google Search ja search partners seadeid skript EI muuda.
// Tagasipööramiseks: Google Ads UI → Kampaania seaded → Võrgud → Display Network.
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
const nameFilter = process.argv.slice(2).find(a => a !== '--dry-run')

async function token() { const p = new URLSearchParams({ client_id: process.env.GOOGLE_ADS_CLIENT_ID, client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET, refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN, grant_type: 'refresh_token' }); const r = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: p.toString() }); const d = await r.json(); if (!d.access_token) throw new Error('OAuth failed'); return d.access_token }
async function gaql(q) { const tk = await token(); const hd = { Authorization: 'Bearer ' + tk, 'developer-token': DEV, 'Content-Type': 'application/json' }; if (LOGIN) hd['login-customer-id'] = LOGIN; const r = await fetch(`https://googleads.googleapis.com/v24/customers/${CUST}/googleAds:search`, { method: 'POST', headers: hd, body: JSON.stringify({ query: q }) }); const d = await r.json(); if (!r.ok) throw new Error('GAQL: ' + JSON.stringify(d).slice(0, 400)); return d.results || [] }
async function mutate(ops) { const tk = await token(); const hd = { Authorization: 'Bearer ' + tk, 'developer-token': DEV, 'Content-Type': 'application/json' }; if (LOGIN) hd['login-customer-id'] = LOGIN; const r = await fetch(`https://googleads.googleapis.com/v24/customers/${CUST}/campaigns:mutate`, { method: 'POST', headers: hd, body: JSON.stringify({ operations: ops }) }); return { ok: r.ok, body: await r.json() } }

let where = `campaign.status = 'ENABLED'`
if (nameFilter) where = `campaign.name = '${nameFilter.replace(/'/g, "\\'")}'`
const camps = await gaql(`SELECT campaign.id, campaign.name, campaign.resource_name, campaign.status, campaign.network_settings.target_google_search, campaign.network_settings.target_search_network, campaign.network_settings.target_content_network, campaign.network_settings.target_partner_search_network FROM campaign WHERE ${where}`)
if (camps.length === 0) { console.error('Sobivaid ENABLED kampaaniaid ei leitud'); process.exit(1) }

console.log(`=== Google Ads: Display-võrk (CONTENT) VÄLJAS ${DRY ? '[DRY RUN]' : '[LIVE]'} ===\n`)

for (const e of camps) {
  const camp = e.campaign
  const ns = camp.networkSettings || {}
  const fmt = (b) => (b === undefined ? '?' : b ? 'ON' : 'off')
  console.log(`${camp.name} (id=${camp.id})`)
  console.log(`  praegu: google_search=${fmt(ns.targetGoogleSearch)} search_partners=${fmt(ns.targetSearchNetwork)} content=${fmt(ns.targetContentNetwork)} partner_search=${fmt(ns.targetPartnerSearchNetwork)}`)
  if (ns.targetContentNetwork !== true) { console.log('  Content-võrk juba väljas — vahele\n'); continue }
  console.log('  → network_settings.target_content_network = false')
  if (DRY) { console.log('  DRY RUN — ei muudeta\n'); continue }
  const res = await mutate([{ update: { resourceName: camp.resourceName, networkSettings: { targetContentNetwork: false } }, updateMask: 'network_settings.target_content_network' }])
  if (!res.ok || !res.body?.results) { console.error('  FAIL: ' + JSON.stringify(res.body).slice(0, 400)); process.exit(1) }
  console.log('  OK\n')
}
console.log('DONE')
