import { readFileSync } from 'fs'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'
const __dirname = dirname(fileURLToPath(import.meta.url))
try {
  const content = readFileSync(resolve(__dirname, '..', '.env.local'), 'utf-8')
  for (const line of content.split('\n')) { const t = line.trim(); if (t && !t.startsWith('#')) { const eq = t.indexOf('='); if (eq > 0) { const k = t.slice(0, eq); let v = t.slice(eq + 1); if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1); process.env[k] = v } } }
} catch {}
const CUST = (process.env.GOOGLE_ADS_CUSTOMER_ID || '').replace(/-/g, ''), LOGIN = (process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID || '').replace(/-/g, ''), DEV = process.env.GOOGLE_ADS_DEVELOPER_TOKEN
async function token() { const p = new URLSearchParams({ client_id: process.env.GOOGLE_ADS_CLIENT_ID, client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET, refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN, grant_type: 'refresh_token' }); const r = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: p.toString() }); return (await r.json()).access_token }
async function gaql(q) { const tk = await token(); const hd = { Authorization: 'Bearer ' + tk, 'developer-token': DEV, 'Content-Type': 'application/json' }; if (LOGIN) hd['login-customer-id'] = LOGIN; const r = await fetch(`https://googleads.googleapis.com/v24/customers/${CUST}/googleAds:search`, { method: 'POST', headers: hd, body: JSON.stringify({ query: q }) }); return (await r.json()).results || [] }

const campRows = await gaql('SELECT campaign.name, campaign.status, campaign.start_date_time, campaign.end_date_time, campaign_budget.amount_micros, campaign.manual_cpc FROM campaign WHERE campaign.name = "Unilift CC + Drenaaž - EE 2026 sügis"')
for (const r of campRows) {
  const c = r.campaign
  const budgetMicros = r.campaignBudget?.amountMicros
  console.log('Campaign: ' + c.name)
  console.log('  status: ' + c.status)
  console.log('  period: ' + (c.startDateTime || '?') + '  ->  ' + (c.endDateTime || '?'))
  console.log('  daily budget: ' + (budgetMicros ? (Number(budgetMicros) / 1e6).toFixed(2) + ' EUR/day' : '?'))
  console.log('  bidding: manual CPC' + (c.manualCpc ? '' : ' (other)'))
}
const groups = await gaql('SELECT ad_group.name, ad_group.status, ad_group.cpc_bid_micros, metrics.clicks, metrics.impressions FROM ad_group WHERE campaign.name = "Unilift CC + Drenaaž - EE 2026 sügis"')
console.log('\nAd groups:')
for (const g of groups) {
  const ag = g.adGroup
  const bid = ag.cpcBidMicros ? (Number(ag.cpcBidMicros) / 1e6).toFixed(2) + ' EUR max CPC' : 'auto'
  console.log(`  [${ag.status}] ${ag.name}  (bid ${bid})`)
}
const kw = await gaql('SELECT metrics.clicks, metrics.impressions, metrics.cost_micros FROM campaign WHERE campaign.name = "Unilift CC + Drenaaž - EE 2026 sügis"')
console.log('\nLifetime metrics (campaign):')
for (const m of kw) {
  console.log(`  clicks=${m.metrics?.clicks ?? 0}  impressions=${m.metrics?.impressions ?? 0}  cost=${m.metrics?.costMicros ? (Number(m.metrics.costMicros)/1e6).toFixed(2) : '0.00'} EUR`)
}
