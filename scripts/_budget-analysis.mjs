/**
 * Budget-sizing analysis for the two budget-limited campaigns:
 *  - last 6 weeks per campaign: cost, impressions, IS, budget-lost, rank-lost, avg CPC
 *  - daily spend distribution for the report week (is the cap hit early?)
 * Goal: derive the daily budget that captures (most of) the budget-lost IS.
 */
import { env } from './env.mjs'

async function oauthToken() {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: env.GOOGLE_ADS_CLIENT_ID,
      client_secret: env.GOOGLE_ADS_CLIENT_SECRET,
      refresh_token: env.GOOGLE_ADS_REFRESH_TOKEN,
      grant_type: 'refresh_token',
    }).toString(),
  })
  const t = await res.json()
  if (!t.access_token) throw new Error('oauth failed')
  return t.access_token
}
const token = await oauthToken()
const customerId = (env.GOOGLE_ADS_CUSTOMER_ID || '').replace(/-/g, '')
const loginId = (env.GOOGLE_ADS_LOGIN_CUSTOMER_ID || '').replace(/-/g, '')
async function gaql(query) {
  const rows = []
  let pageToken
  do {
    const res = await fetch(`https://googleads.googleapis.com/v24/customers/${customerId}/googleAds:search`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'developer-token': env.GOOGLE_ADS_DEVELOPER_TOKEN, 'Content-Type': 'application/json', ...(loginId ? { 'login-customer-id': loginId } : {}) },
      body: JSON.stringify({ query, ...(pageToken ? { pageToken } : {}) }),
    })
    if (!res.ok) { console.error('GAQL', res.status, (await res.text()).slice(0, 400)); process.exit(1) }
    const d = await res.json()
    rows.push(...(d.results ?? []))
    pageToken = d.nextPageToken
  } while (pageToken)
  return rows
}
const eur = (micros) => (Number(micros ?? 0) / 1e6).toFixed(2)
const pct = (v) => (v === undefined || v === null ? ' –' : `${Math.round(Number(v) * 100)}%`)

console.log('=== WEEKLY TREND (last 6 weeks) ===')
const weekly = await gaql(`SELECT campaign.name, segments.week, campaign_budget.amount_micros,
  metrics.cost_micros, metrics.clicks, metrics.impressions, metrics.average_cpc,
  metrics.search_impression_share, metrics.search_rank_lost_impression_share, metrics.search_budget_lost_impression_share,
  metrics.conversions, metrics.all_conversions
  FROM campaign WHERE segments.date BETWEEN '2026-08-10' AND '2026-09-19'
    AND campaign.status = 'ENABLED' ORDER BY campaign.name, segments.week`)
for (const r of weekly) {
  const m = r.metrics
  console.log(`${r.segments.week}  ${r.campaign.name.padEnd(45)}  budget ${eur(r.campaignBudget?.amountMicros)}€/d  cost ${eur(m.costMicros)}€  imp ${String(m.impressions).padStart(4)}  CPC ${eur(m.averageCpc)}€  IS ${pct(m.searchImpressionShare)}  b-lost ${pct(m.searchBudgetLostImpressionShare)}  r-lost ${pct(m.searchRankLostImpressionShare)}  conv ${Number(m.allConversions ?? 0).toFixed(1)}`)
}

console.log('\n=== DAILY SPEND, report week 13.–19.09 ===')
const daily = await gaql(`SELECT campaign.name, segments.date, metrics.cost_micros, metrics.impressions, metrics.clicks
  FROM campaign WHERE segments.date BETWEEN '2026-09-13' AND '2026-09-19' AND campaign.status = 'ENABLED' ORDER BY campaign.name, segments.date`)
for (const r of daily) {
  console.log(`${r.segments.date}  ${r.campaign.name.padEnd(45)}  ${eur(r.metrics.costMicros)}€  imp ${String(r.metrics.impressions).padStart(4)}  clk ${r.metrics.clicks}`)
}
