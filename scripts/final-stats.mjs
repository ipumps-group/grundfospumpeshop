import { readFileSync } from 'fs'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
try {
  const c = readFileSync(resolve(__dirname, '..', '.env.local'), 'utf-8')
  for (const line of c.split('\n')) {
    const t = line.trim()
    if (t && !t.startsWith('#')) {
      const eq = t.indexOf('=')
      if (eq > 0) {
        const k = t.slice(0, eq)
        let v = t.slice(eq + 1)
        if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1)
        if (k !== 'Vercel token') process.env[k] = v
      }
    }
  }
} catch {}

const CUST = '2639481819', LOGIN = '6134277350', V = 'v24', DEV = process.env.GOOGLE_ADS_DEVELOPER_TOKEN

async function token() {
  const p = new URLSearchParams({ client_id: process.env.GOOGLE_ADS_CLIENT_ID, client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET, refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN, grant_type: 'refresh_token' })
  return (await (await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: p.toString() })).json()).access_token
}

async function gaql(q) {
  const tk = await token()
  const hd = { Authorization: 'Bearer ' + tk, 'developer-token': DEV, 'Content-Type': 'application/json' }
  if (LOGIN) hd['login-customer-id'] = LOGIN
  const r = await fetch(`https://googleads.googleapis.com/${V}/customers/${CUST}/googleAds:search`, { method: 'POST', headers: hd, body: JSON.stringify({ query: q }) })
  const d = await r.json()
  if (!r.ok) { console.error(d?.error?.message?.slice(0, 200)); return [] }
  return d.results || []
}

const M = (m) => {
  const s = Number(m?.costMicros || 0) / 1000000
  return { s, i: Number(m?.impressions || 0), c: Number(m?.clicks || 0), ctr: Number(m?.ctr || 0), cpc: Number(m?.averageCpc || 0) / 1000000, conv: Number(m?.conversions || 0), v: Number(m?.conversionsValue || 0) || 0, cpa: Number(m?.costPerConversion || 0) / 1000000 }
}

console.log('=== CAMPAIGNS ===')
let r = await gaql('SELECT campaign.id, campaign.name, campaign.status, campaign_budget.amount_micros, campaign.start_date, metrics.impressions, metrics.clicks, metrics.ctr, metrics.average_cpc, metrics.cost_micros, metrics.conversions, metrics.conversions_value, metrics.cost_per_conversion, metrics.impression_share, metrics.search_budget_lost_impression_share FROM campaign WHERE campaign.status != "REMOVED"')
for (const e of r) {
  const c = e.campaign, b = e.campaignBudget, m = M(e.metrics)
  console.log(c.name + ' [' + c.status + ']')
  console.log('  Budget=' + (Number(b?.amountMicros || 0) / 1000000).toFixed(0) + '/day | Start=' + (c.startDate || '?'))
  console.log('  Spend=' + m.s.toFixed(2) + ' | Impr=' + m.i + ' | Clicks=' + m.c + ' | CTR=' + m.ctr.toFixed(1) + '% | CPC=' + m.cpc.toFixed(2))
  console.log('  Conv=' + m.conv + ' | Value=' + m.v.toFixed(2) + ' | ROAS=' + (m.s > 0 ? (m.v / m.s).toFixed(2) : '0.00'))
  console.log('  IS=' + (Number(e.metrics?.impressionShare || 0)).toFixed(0) + '% | LostBudget=' + (Number(e.metrics?.searchBudgetLostImpressionShare || 0)).toFixed(0) + '%')
}

console.log('\n=== DAILY TREND (June) ===')
r = await gaql('SELECT segments.date, metrics.impressions, metrics.clicks, metrics.cost_micros, metrics.conversions FROM campaign WHERE segments.date BETWEEN "2026-06-01" AND "2026-06-29" AND campaign.status != "REMOVED" ORDER BY segments.date')
let ts = 0, ti = 0, tc = 0, tconv = 0
const daily = []
for (const e of r) {
  const seg = e.segments, m = M(e.metrics)
  ts += m.s; ti += m.i; tc += m.c; tconv += m.conv
  daily.push({ d: seg.date, s: m.s, c: m.c, conv: m.conv })
}
console.log('Total' + ts.toFixed(2).padStart(8) + ' | ' + ti + ' impr | ' + tc + ' clicks | ' + tconv + ' conv')
console.log('CTR=' + (ti > 0 ? (tc / ti * 100).toFixed(1) : '0') + '% | CPC=' + (tc > 0 ? (ts / tc).toFixed(2) : '0') + ' | ROAS=' + (ts > 0 ? '0.00' : '0.00'))
for (const d of daily) {
  console.log('  ' + d.d + ' ' + d.s.toFixed(2).padStart(7) + ' ' + d.c.toString().padStart(3) + ' clk ' + (d.conv > 0 ? '+ ' + d.conv : ''))
}

console.log('\n=== AD GROUPS ===')
r = await gaql('SELECT ad_group.id, ad_group.name, ad_group.status, campaign.name FROM ad_group ORDER BY campaign.id, ad_group.name')
for (const e of r) {
  const ag = e.adGroup
  console.log(ag.status.padEnd(9) + ' | ' + ag.name + ' | ' + e.campaign?.name)
}

console.log('\n=== ADS COUNT ===')
r = await gaql('SELECT ad_group_ad.ad.name, ad_group_ad.status, ad_group.name FROM ad_group_ad WHERE campaign.status != "REMOVED"')
let enabled = 0, paused = 0, removed = 0
for (const e of r) {
  const s = e.adGroupAd?.status
  if (s === 'ENABLED') enabled++
  else if (s === 'PAUSED') paused++
  else removed++
}
console.log('Enabled: ' + enabled + ' | Paused: ' + paused + ' | Removed: ' + removed)

console.log('\n=== SEARCH TERMS (top 10 by spend, June) ===')
r = await gaql('SELECT search_term_view.search_term, metrics.cost_micros, metrics.clicks, metrics.conversions FROM search_term_view WHERE segments.date BETWEEN "2026-06-01" AND "2026-06-29" AND campaign.status != "REMOVED" ORDER BY metrics.cost_micros DESC LIMIT 10')
for (const e of r) {
  const st = e.searchTermView, m = M(e.metrics)
  console.log('  "' + st?.searchTerm + '" | ' + m.s.toFixed(2) + ' | ' + m.c + ' clk | conv=' + m.conv)
}

console.log('\n=== KEYWORDS (by QS) ===')
r = await gaql('SELECT ad_group_criterion.keyword.text, ad_group_criterion.quality_info.quality_score, ad_group_criterion.status, ad_group.name FROM keyword_view WHERE campaign.status != "REMOVED" AND ad_group_criterion.status != "REMOVED" ORDER BY ad_group_criterion.quality_info.quality_score')
const qsDist = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0, 6: 0, 7: 0, 8: 0, 9: 0, 10: 0, unknown: 0 }
for (const e of r) {
  const qs = e.adGroupCriterion?.qualityInfo?.qualityScore || 0
  if (qs >= 1 && qs <= 10) qsDist[qs]++
  else qsDist.unknown++
}
console.log('QS distribution: 1=' + qsDist[1] + ' 2=' + qsDist[2] + ' 3=' + qsDist[3] + ' 4=' + qsDist[4] + ' 5=' + qsDist[5] + ' 6=' + qsDist[6] + ' 7=' + qsDist[7] + ' 8=' + qsDist[8] + ' 10=' + qsDist[10] + ' ?=' + qsDist.unknown)
r = await gaql('SELECT ad_group_criterion.keyword.text, ad_group_criterion.quality_info.quality_score FROM keyword_view WHERE ad_group_criterion.status = "PAUSED" AND ad_group_criterion.quality_info.quality_score <= 3')
console.log('Paused due to low QS: ' + r.length)
for (const e of r) console.log('  ' + e.adGroupCriterion?.keyword?.text + ' (QS=' + e.adGroupCriterion?.qualityInfo?.qualityScore + ')')
