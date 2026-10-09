// Rank-lost IS vastane pakkumiste tõus (09.10.2026 plaan):
// ALPHA GO kaotab 53% ja Unilift 45% nähtavusest Ad Rank'i (QS × pakkumine)
// tõttu — QS on ajalooline ja taastub 2-4 nädalaga, ainus kohene hoob on maxCPC.
// Analoogia: brändikampaania maxCPC tõus 25.09 lahendas rank-lost 50% probleemi.
// Märksõnataseme pakkumisi pole seatud → tõstame reklaamirühma (ad group) pakkumisi.
// Päevaeelarved jäävad samaks (13 € Unilift / 13 € ALPHA GO) — kulu on kaitstud.
// Kasutus: node scripts/raise-nonbrand-cpc.mjs [--dry-run]
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
async function mutate(ops) { const tk = await token(); const hd = { Authorization: 'Bearer ' + tk, 'developer-token': DEV, 'Content-Type': 'application/json' }; if (LOGIN) hd['login-customer-id'] = LOGIN; const r = await fetch(`https://googleads.googleapis.com/v24/customers/${CUST}/adGroups:mutate`, { method: 'POST', headers: hd, body: JSON.stringify({ operations: ops }) }); return await r.json() }

const NEW_BIDS = [
  // Unilift — mahukaimad rühmad (QS 3-7, lpExp taastumisel): 0.50 -> 0.75
  { campaign: 'Unilift CC + Drenaaž - EE 2026 sügis', group: 'Tühjenduspump', eur: 0.75 },
  { campaign: 'Unilift CC + Drenaaž - EE 2026 sügis', group: 'Drenaažipump', eur: 0.75 },
  { campaign: 'Unilift CC + Drenaaž - EE 2026 sügis', group: 'Sukelpump', eur: 0.75 },
  // Unilift — ülejäänud müügirühmad: 0.50 -> 0.60
  { campaign: 'Unilift CC + Drenaaž - EE 2026 sügis', group: 'Pinnavesi', eur: 0.60 },
  { campaign: 'Unilift CC + Drenaaž - EE 2026 sügis', group: 'Avariipump', eur: 0.60 },
  { campaign: 'Unilift CC + Drenaaž - EE 2026 sügis', group: 'Unilift CC - mudelid', eur: 0.60 },
  // ALPHA GO — rank-lost 53%: mahukaimad rühmad 0.60 -> 0.85
  { campaign: 'ALPHA GO - Küte - EE 2026 sügis', group: 'Tsirkulatsioonipump', eur: 0.85 },
  { campaign: 'ALPHA GO - Küte - EE 2026 sügis', group: 'Küttepump', eur: 0.85 },
  // ALPHA GO — toote- ja asendusrühmad: 0.60 -> 0.70
  { campaign: 'ALPHA GO - Küte - EE 2026 sügis', group: 'ALPHA GO - tooted', eur: 0.70 },
  { campaign: 'ALPHA GO - Küte - EE 2026 sügis', group: 'Vana pumba asendus', eur: 0.70 },
]

console.log(DRY ? '=== DRY RUN ===' : '=== RAISE NON-BRAND CPC ===')
const rows = await gaql(`SELECT campaign.name, ad_group.name, ad_group.resource_name, ad_group.cpc_bid_micros, ad_group.status FROM ad_group WHERE campaign.status = 'ENABLED' AND ad_group.status = 'ENABLED'`)

const ops = []
for (const b of NEW_BIDS) {
  const row = rows.find((r) => r.campaign.name === b.campaign && r.adGroup.name === b.group)
  if (!row) { console.error(`Rühma ei leitud: [${b.campaign}] ${b.group}`); process.exit(1) }
  const old = Number(row.adGroup.cpcBidMicros || 0) / 1e6
  if (Math.abs(old - b.eur) < 0.005) { console.log(`  [${b.campaign}] ${b.group}: juba ${b.eur.toFixed(2)} € — vahele`); continue }
  console.log(`  [${b.campaign}] ${b.group}: ${old.toFixed(2)} -> ${b.eur.toFixed(2)} €`)
  ops.push({ update: { resourceName: row.adGroup.resourceName, cpcBidMicros: String(Math.round(b.eur * 1e6)) }, updateMask: 'cpc_bid_micros' })
}

if (ops.length === 0) { console.log('Kõik pakkumised juba õiged — midagi ei muudeta'); process.exit(0) }
if (DRY) { console.log('DRY RUN — muudatusi ei tehtud'); process.exit(0) }
const res = await mutate(ops)
if (!res?.results) { console.error('CPC tõus ebaõnnestus: ' + JSON.stringify(res).slice(0, 600)); process.exit(1) }
console.log(`OK — ${ops.length} rühma maxCPC tõstetud`)
console.log('=== DONE ===')
