// Kvaliteediparandus (25.09.2026): brändikampaania rank-lost IS 50% on PAKKUMISE
// probleem, mitte kvaliteedi (QS 8-10, lpExp ABOVE_AVERAGE, maxCPC 0.60-0.80 EUR).
// Konkurendid pakuvad "grundfos" märksõnadele rohkem. Tõstame 3 grundfos-märksõna
// maxCPC-d; päevaeelarve jääb 7 EUR, kulu on seega kaitstud.
// Kasutus: node scripts/raise-brand-cpc.mjs [--dry-run]
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
async function mutate(ops) { const tk = await token(); const hd = { Authorization: 'Bearer ' + tk, 'developer-token': DEV, 'Content-Type': 'application/json' }; if (LOGIN) hd['login-customer-id'] = LOGIN; const r = await fetch(`https://googleads.googleapis.com/v24/customers/${CUST}/adGroupCriteria:mutate`, { method: 'POST', headers: hd, body: JSON.stringify({ operations: ops }) }); return await r.json() }

const NEW_BIDS = [
  { kw: 'grundfos pump', micros: '1000000' },    // 0.60 -> 1.00 EUR
  { kw: 'grundfos pumbad', micros: '900000' },   // 0.60 -> 0.90 EUR
  { kw: 'grundfos eesti', micros: '800000' },    // 0.60 -> 0.80 EUR
]

console.log(DRY ? '=== DRY RUN ===' : '=== RAISE BRAND CPC ===')
const rows = await gaql(`SELECT campaign.name, ad_group.name, ad_group_criterion.resource_name, ad_group_criterion.keyword.text, ad_group_criterion.cpc_bid_micros, ad_group_criterion.status FROM keyword_view WHERE campaign.name = 'Pumbapood + Grundfos Brand Search - EE' AND ad_group_criterion.status = 'ENABLED'`)

const ops = []
for (const b of NEW_BIDS) {
  const row = rows.find((r) => r.adGroupCriterion.keyword.text === b.kw)
  if (!row) { console.error(`Märksõna ei leitud: ${b.kw}`); process.exit(1) }
  const old = (Number(row.adGroupCriterion.cpcBidMicros || 0) / 1e6).toFixed(2)
  console.log(`  ${b.kw}: ${old} -> ${(Number(b.micros) / 1e6).toFixed(2)} EUR`)
  ops.push({ update: { resourceName: row.adGroupCriterion.resourceName, cpcBidMicros: b.micros }, updateMask: 'cpc_bid_micros' })
}

if (DRY) { console.log('DRY RUN - muudatusi ei tehtud'); process.exit(0) }
const res = await mutate(ops)
if (!res?.results) { console.error('CPC tõus ebaõnnestus: ' + JSON.stringify(res).slice(0, 600)); process.exit(1) }
console.log('OK - brändi märksõnade maxCPC tõstetud')
console.log('=== DONE ===')
