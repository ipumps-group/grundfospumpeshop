// Seadista kampaania päevaeelarve. Kasutus:
//   node scripts/set-budget.mjs "ALPHA GO - Küte - EE 2026 sügis" 13 [--dry-run]
// NB: Unilifti eelarvet haldab weather-pulse cron (5/9/13 € astmed) — käsitsi
// seatud väärtus kirjutatakse järgmise hommikuse cron'i käigus üle.
import { readFileSync } from 'fs'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'
const __dirname = dirname(fileURLToPath(import.meta.url))
try {
  const content = readFileSync(resolve(__dirname, '..', '.env.local'), 'utf-8')
  for (const line of content.split('\n')) { const t = line.trim(); if (t && !t.startsWith('#')) { const eq = t.indexOf('='); if (eq > 0) { const k = t.slice(0, eq); let v = t.slice(eq + 1); if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1); process.env[k] = v } } }
} catch {}
const CUST = (process.env.GOOGLE_ADS_CUSTOMER_ID || '').replace(/-/g, ''), LOGIN = (process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID || '').replace(/-/g, ''), DEV = process.env.GOOGLE_ADS_DEVELOPER_TOKEN

const args = process.argv.slice(2).filter((a) => a !== '--dry-run')
const DRY = process.argv.includes('--dry-run')
const [campaignName, eurStr] = args
const EUR = Number(eurStr)
if (!campaignName || !Number.isFinite(EUR) || EUR <= 0) {
  console.error('Kasutus: node scripts/set-budget.mjs "<kampaania nimi>" <eur/päev> [--dry-run]')
  process.exit(1)
}

async function token() { const p = new URLSearchParams({ client_id: process.env.GOOGLE_ADS_CLIENT_ID, client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET, refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN, grant_type: 'refresh_token' }); const r = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: p.toString() }); const d = await r.json(); if (!d.access_token) throw new Error('OAuth failed'); return d.access_token }
async function gaql(q) { const tk = await token(); const hd = { Authorization: 'Bearer ' + tk, 'developer-token': DEV, 'Content-Type': 'application/json' }; if (LOGIN) hd['login-customer-id'] = LOGIN; const r = await fetch(`https://googleads.googleapis.com/v24/customers/${CUST}/googleAds:search`, { method: 'POST', headers: hd, body: JSON.stringify({ query: q }) }); const d = await r.json(); if (!r.ok) throw new Error('GAQL: ' + JSON.stringify(d).slice(0, 400)); return d.results || [] }
async function mutate(ops) { const tk = await token(); const hd = { Authorization: 'Bearer ' + tk, 'developer-token': DEV, 'Content-Type': 'application/json' }; if (LOGIN) hd['login-customer-id'] = LOGIN; const r = await fetch(`https://googleads.googleapis.com/v24/customers/${CUST}/campaignBudgets:mutate`, { method: 'POST', headers: hd, body: JSON.stringify({ operations: ops }) }); return await r.json() }

const rows = await gaql(`SELECT campaign.name, campaign_budget.resource_name, campaign_budget.amount_micros FROM campaign WHERE campaign.name = '${campaignName.replace(/'/g, "\\'")}'`)
const row = rows[0]
if (!row) { console.error(`Kampaaniat "${campaignName}" ei leitud`); process.exit(1) }
const budgetRn = row.campaignBudget?.resourceName
const current = Number(row.campaignBudget?.amountMicros || 0) / 1_000_000
console.log(`${row.campaign.name}: ${current.toFixed(2)} €/päev → ${EUR.toFixed(2)} €/päev`)
if (Math.abs(current - EUR) < 0.01) { console.log('Juba õige — midagi ei muudeta'); process.exit(0) }
if (DRY) { console.log('DRY RUN — muudatust ei tehtud'); process.exit(0) }
const res = await mutate([{ update: { resourceName: budgetRn, amountMicros: String(Math.round(EUR * 1_000_000)) }, updateMask: 'amount_micros' }])
if (!res?.results) { console.error('FAIL: ' + JSON.stringify(res).slice(0, 400)); process.exit(1) }
console.log('OK')
