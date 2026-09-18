// ALPHA GO - Küte - EE 2026 sügis: diagnoos — miks kulu 0 €, kuigi raport väidab budget-lost IS 85%?
import { readFileSync } from 'fs'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'
const __dirname = dirname(fileURLToPath(import.meta.url))
try {
  const content = readFileSync(resolve(__dirname, '..', '.env.local'), 'utf-8')
  for (const line of content.split('\n')) { const t = line.trim(); if (t && !t.startsWith('#')) { const eq = t.indexOf('='); if (eq > 0) { const k = t.slice(0, eq); let v = t.slice(eq + 1); if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1); process.env[k] = v } } }
} catch {}
const CUST = (process.env.GOOGLE_ADS_CUSTOMER_ID || '').replace(/-/g, ''), LOGIN = (process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID || '').replace(/-/g, ''), DEV = process.env.GOOGLE_ADS_DEVELOPER_TOKEN
async function token() { const p = new URLSearchParams({ client_id: process.env.GOOGLE_ADS_CLIENT_ID, client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET, refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN, grant_type: 'refresh_token' }); const r = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: p.toString() }); const d = await r.json(); if (!d.access_token) throw new Error('OAuth failed'); return d.access_token }
async function gaql(q) { const tk = await token(); const hd = { Authorization: 'Bearer ' + tk, 'developer-token': DEV, 'Content-Type': 'application/json' }; if (LOGIN) hd['login-customer-id'] = LOGIN; const r = await fetch(`https://googleads.googleapis.com/v24/customers/${CUST}/googleAds:search`, { method: 'POST', headers: hd, body: JSON.stringify({ query: q }) }); const d = await r.json(); if (!r.ok) { console.error('GAQL err:', JSON.stringify(d).slice(0, 300)); return [] } return d.results || [] }

const CAMP = `ALPHA GO - Küte - EE 2026 sügis`

console.log('=== KAMPAANIA SEADED ===')
const c = await gaql(`SELECT campaign.name, campaign.status, campaign.start_date, campaign.end_date, campaign.bidding_strategy_type, campaign_budget.amount_micros, campaign.network_settings.target_google_search, campaign.network_settings.target_search_network, campaign.network_settings.target_content_network FROM campaign WHERE campaign.name = '${CAMP}'`)
for (const r of c) console.log(JSON.stringify({ status: r.campaign.status, algus: r.campaign.startDate, lopp: r.campaign.endDate, bidding: r.campaign.biddingStrategyType, eelarve: Number(r.campaignBudget.amountMicros) / 1e6, vork: r.campaign.networkSettings }, null, 1))

console.log('\n=== REKLAAMIRÜHMAD JA PAKKUMISED ===')
const ag = await gaql(`SELECT ad_group.name, ad_group.status, ad_group.cpc_bid_micros, ad_group.target_cpa_micros FROM ad_group WHERE campaign.name = '${CAMP}'`)
for (const r of ag) console.log(`  ${r.adGroup.name}: status=${r.adGroup.status} cpc_bid=${(Number(r.adGroup.cpcBidMicros || 0) / 1e6).toFixed(2)} € target_cpa=${(Number(r.adGroup.targetCpaMicros || 0) / 1e6).toFixed(2)} €`)

console.log('\n=== MÄRKSÕNAD (status + QS) ===')
const kw = await gaql(`SELECT ad_group.name, ad_group_criterion.keyword.text, ad_group_criterion.keyword.match_type, ad_group_criterion.status, ad_group_criterion.quality_info.quality_score, ad_group_criterion.approval_status FROM keyword_view WHERE campaign.name = '${CAMP}'`)
for (const r of kw) console.log(`  [${r.adGroup.name}] "${r.adGroupCriterion.keyword?.text}" (${r.adGroupCriterion.keyword?.matchType}) status=${r.adGroupCriterion.status} QS=${r.adGroupCriterion.qualityInfo?.qualityScore ?? '?'} approval=${r.adGroupCriterion.approvalStatus ?? '?'}`)

console.log('\n=== REKLAAMIDE STAATUS ===')
const ads = await gaql(`SELECT ad_group.name, ad_group_ad.status, ad_group_ad.ad.name, ad_group_ad.policy_summary.approval_status, ad_group_ad.policy_summary.review_status FROM ad_group_ad WHERE campaign.name = '${CAMP}' AND ad_group_ad.status != 'REMOVED'`)
for (const r of ads) console.log(`  [${r.adGroup.name}] "${r.adGroupAd.ad.name}" status=${r.adGroupAd.status} approval=${r.adGroupAd.policySummary?.approvalStatus ?? '?'} review=${r.adGroupAd.policySummary?.reviewStatus ?? '?'}`)

console.log('\n=== TULEMUSED: viimased 7 päeva ===')
const m7 = await gaql(`SELECT campaign.name, metrics.impressions, metrics.clicks, metrics.cost_micros, metrics.search_impression_share, metrics.search_budget_lost_impression_share, metrics.search_rank_lost_impression_share FROM campaign WHERE campaign.name = '${CAMP}' AND segments.date DURING LAST_7_DAYS`)
for (const r of m7) console.log(`  näitamised=${r.metrics.impressions} klikid=${r.metrics.clicks} kulu=${(Number(r.metrics.costMicros) / 1e6).toFixed(2)} € IS=${((r.metrics.searchImpressionShare ?? 0) * 100).toFixed(0)}% budget-lost=${((r.metrics.searchBudgetLostImpressionShare ?? 0) * 100).toFixed(0)}% rank-lost=${((r.metrics.searchRankLostImpressionShare ?? 0) * 100).toFixed(0)}%`)

console.log('\n=== TULEMUSED: viimased 30 päeva ===')
const m30 = await gaql(`SELECT campaign.name, metrics.impressions, metrics.clicks, metrics.cost_micros FROM campaign WHERE campaign.name = '${CAMP}' AND segments.date DURING LAST_30_DAYS`)
for (const r of m30) console.log(`  näitamised=${r.metrics.impressions} klikid=${r.metrics.clicks} kulu=${(Number(r.metrics.costMicros) / 1e6).toFixed(2)} €`)

console.log('\n=== PÄEVA KAUPA (viimased 7 päeva) ===')
const daily = await gaql(`SELECT segments.date, metrics.impressions, metrics.clicks, metrics.cost_micros FROM campaign WHERE campaign.name = '${CAMP}' AND segments.date DURING LAST_7_DAYS ORDER BY segments.date`)
for (const r of daily) console.log(`  ${r.segments.date}: näitamised=${r.metrics.impressions} klikid=${r.metrics.clicks} kulu=${(Number(r.metrics.costMicros) / 1e6).toFixed(2)} €`)
