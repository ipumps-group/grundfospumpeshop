import { readFileSync } from 'fs'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'
const __dirname = dirname(fileURLToPath(import.meta.url))
try {
  const content = readFileSync(resolve(__dirname, '..', '.env.local'), 'utf-8')
  for (const line of content.split('\n')) { const t = line.trim(); if (t && !t.startsWith('#')) { const eq = t.indexOf('='); if (eq > 0) { const k = t.slice(0, eq); let v = t.slice(eq + 1); if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1); process.env[k] = v } } }
} catch {}
const CUST = (process.env.GOOGLE_ADS_CUSTOMER_ID || '').replace(/-/g, ''), LOGIN = (process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID || '').replace(/-/g, ''), DEV = process.env.GOOGLE_ADS_DEVELOPER_TOKEN
const CAMP = '24203046624' // Unilift CC + Drenaaž - EE 2026 sügis
const FIXED_EUR = 10
async function token() { const p = new URLSearchParams({ client_id: process.env.GOOGLE_ADS_CLIENT_ID, client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET, refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN, grant_type: 'refresh_token' }); const r = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: p.toString() }); const d = await r.json(); if (!d.access_token) throw new Error('OAuth failed: ' + JSON.stringify(d)); return d.access_token }
async function gaql(q) { const tk = await token(); const hd = { Authorization: 'Bearer ' + tk, 'developer-token': DEV, 'Content-Type': 'application/json' }; if (LOGIN) hd['login-customer-id'] = LOGIN; const r = await fetch(`https://googleads.googleapis.com/v24/customers/${CUST}/googleAds:search`, { method: 'POST', headers: hd, body: JSON.stringify({ query: q }) }); return (await r.json()).results || [] }
async function mutate(ops, ep) { const tk = await token(); const hd = { Authorization: 'Bearer ' + tk, 'developer-token': DEV, 'Content-Type': 'application/json' }; if (LOGIN) hd['login-customer-id'] = LOGIN; const r = await fetch(`https://googleads.googleapis.com/v24/customers/${CUST}/${ep}:mutate`, { method: 'POST', headers: hd, body: JSON.stringify({ operations: ops }) }); return await r.json() }

console.log('=== GOOGLE: set flat budget (no weather pulse) ===')
const rows = await gaql(`SELECT campaign.name, campaign.campaign_budget, campaign_budget.amount_micros, campaign_budget.name FROM campaign WHERE campaign.id = ${CAMP}`)
const budgetRn = rows[0]?.campaignBudget?.resourceName
const current = Number(rows[0]?.campaignBudget?.amountMicros || 0) / 1_000_000
console.log(`Campaign: ${rows[0]?.campaign?.name}`)
console.log(`  current budget: ${current.toFixed(2)} EUR/day -> setting to ${FIXED_EUR.toFixed(2)}`)
if (Math.abs(current - FIXED_EUR) < 0.01) {
  console.log('  already at flat value, nothing to change')
} else {
  const res = await mutate([{ update: { resourceName: budgetRn, amountMicros: String(Math.round(FIXED_EUR * 1_000_000)) }, updateMask: 'amountMicros' }], 'campaignBudgets')
  console.log('  ' + (res?.results ? 'OK -> ' + FIXED_EUR.toFixed(2) + ' EUR/day' : 'FAIL ' + JSON.stringify(res).slice(0, 300)))
}
console.log('=== DONE ===')
