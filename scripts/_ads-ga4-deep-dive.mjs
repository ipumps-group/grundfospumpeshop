/**
 * Ads + GA4 deep-dive for the 2026-09-13..2026-09-19 report (read-only):
 *  1. Verify campaign impression-share numbers (52 % rank-lost Unilift etc).
 *  2. Verify QS keywords (tühjenduspump 131, drenaažipump 124, sukelpump 49,
 *     tsirkulatsioonipump 49) and find their ad groups + final URLs.
 *  3. Dump RSA headlines for those ad groups: is the keyword in a headline?
 *  4. GA4 daily sessions 2026-08-25..2026-09-19: how long has tracking been
 *     degraded, and is there recovery after the 2026-09-18 tracking rebuild?
 */
import { env } from './env.mjs'

const PERIOD = { start: '2026-09-13', end: '2026-09-19' }

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
  if (!t.access_token) { console.error('oauth failed', JSON.stringify(t).slice(0, 300)); process.exit(1) }
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
      headers: {
        Authorization: `Bearer ${token}`,
        'developer-token': env.GOOGLE_ADS_DEVELOPER_TOKEN,
        'Content-Type': 'application/json',
        ...(loginId ? { 'login-customer-id': loginId } : {}),
      },
      body: JSON.stringify({ query, ...(pageToken ? { pageToken } : {}) }),
    })
    if (!res.ok) { console.error('GAQL', res.status, (await res.text()).slice(0, 400)); process.exit(1) }
    const d = await res.json()
    rows.push(...(d.results ?? []))
    pageToken = d.nextPageToken
  } while (pageToken)
  return rows
}
const pct = (v) => (v === undefined || v === null ? '  –' : `${Math.round(Number(v) * 100)}%`)

/* --- 1. campaigns + impression share --- */
console.log('=== CAMPAIGNS', PERIOD.start, '..', PERIOD.end)
const camps = await gaql(`SELECT campaign.name, campaign.status, campaign_budget.amount_micros,
  metrics.cost_micros, metrics.clicks, metrics.impressions,
  metrics.search_impression_share, metrics.search_rank_lost_impression_share, metrics.search_budget_lost_impression_share
  FROM campaign WHERE segments.date BETWEEN '${PERIOD.start}' AND '${PERIOD.end}'
  ORDER BY metrics.cost_micros DESC`)
for (const r of camps) {
  if (!(Number(r.metrics.impressions) > 0 || Number(r.metrics.costMicros) > 0)) continue
  console.log(` ${r.campaign.name} [${r.campaign.status}] budget ${(Number(r.campaignBudget?.amountMicros ?? 0) / 1e6).toFixed(2)}€/day | cost ${(Number(r.metrics.costMicros) / 1e6).toFixed(2)}€ | IS ${pct(r.metrics.searchImpressionShare)} | rank-lost ${pct(r.metrics.searchRankLostImpressionShare)} | budget-lost ${pct(r.metrics.searchBudgetLostImpressionShare)}`)
}

/* --- 2. low-QS keywords: ad group + final url --- */
console.log('\n=== KEYWORDS QS<=4 with impressions')
const kws = await gaql(`SELECT campaign.name, ad_group.name, ad_group_criterion.keyword.text, ad_group_criterion.keyword.match_type,
  ad_group_criterion.quality_info.quality_score, ad_group_criterion.final_urls,
  metrics.impressions, metrics.clicks, metrics.cost_micros
  FROM keyword_view WHERE segments.date BETWEEN '${PERIOD.start}' AND '${PERIOD.end}'
    AND ad_group_criterion.status != 'REMOVED' AND ad_group_criterion.quality_info.quality_score <= 4
  ORDER BY metrics.impressions DESC LIMIT 30`)
const adGroups = new Set()
for (const r of kws) {
  console.log(` QS ${r.adGroupCriterion.qualityInfo?.qualityScore}/10  "${r.adGroupCriterion.keyword.text}" [${r.adGroupCriterion.keyword.matchType}]  ${r.metrics.impressions} imp, ${r.metrics.clicks} clk, ${(Number(r.metrics.costMicros) / 1e6).toFixed(2)}€  | ${r.campaign.name} / ${r.adGroup.name} | URL: ${(r.adGroupCriterion.finalUrls ?? []).join(',')}`)
  adGroups.add(`${r.campaign.name}|||${r.adGroup.name}`)
}

/* --- 3. RSA headlines of those ad groups --- */
console.log('\n=== RSA headlines in those ad groups')
for (const key of adGroups) {
  const [campaign, adGroup] = key.split('|||')
  const ads = await gaql(`SELECT ad_group_ad.ad.responsive_search_ad.headlines, ad_group_ad.ad.final_urls, ad_group_ad.status
    FROM ad_group_ad WHERE campaign.name = '${campaign.replace(/'/g, "\\'")}' AND ad_group.name = '${adGroup.replace(/'/g, "\\'")}'
      AND ad_group_ad.status != 'REMOVED' LIMIT 10`)
  console.log(` ${campaign} / ${adGroup}:`)
  for (const a of ads) {
    const heads = (a.adGroupAd?.ad?.responsiveSearchAd?.headlines ?? []).map((h) => `${h.text}${h.pinnedField ? ` [pin ${h.pinnedField}]` : ''}`)
    console.log(`   [${a.adGroupAd.status}] ${heads.join(' | ')}`)
    console.log(`   final: ${(a.adGroupAd?.ad?.finalUrls ?? []).join(', ')}`)
  }
}

/* --- 4. GA4 daily sessions for 4 weeks --- */
console.log('\n=== GA4 daily sessions 2026-08-25..2026-09-19')
const ga4 = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${env.GA4_PROPERTY_ID}:runReport`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({
    dateRanges: [{ startDate: '2026-08-25', endDate: '2026-09-19' }],
    dimensions: [{ name: 'date' }],
    metrics: [{ name: 'sessions' }],
    orderBys: [{ dimension: { dimensionName: 'date' }, desc: false }],
    limit: 40,
  }),
})
if (!ga4.ok) { console.error('GA4', ga4.status, (await ga4.text()).slice(0, 300)); process.exit(1) }
const g = await ga4.json()
for (const row of g.rows ?? []) {
  const d = row.dimensionValues[0].value
  const dow = new Date(`${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}T00:00:00Z`).getUTCDay()
  const wd = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'][dow]
  console.log(` ${d} ${wd}  ${String(row.metricValues[0].value).padStart(4)} sessions${d >= '20260918' ? '  <-- tracking rebuild deployed 09-18 ~19:00' : ''}`)
}
