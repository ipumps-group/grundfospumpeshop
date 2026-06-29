import { readFileSync } from 'fs'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const envPath = resolve(__dirname, '..', '.env.local')
try {
  const content = readFileSync(envPath, 'utf-8')
  for (const line of content.split('\n')) {
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
} catch { console.log('No .env.local') }

const CUST = '2639481819'
const LOGIN = '6134277350'
const V = 'v24'
const DEV = process.env.GOOGLE_ADS_DEVELOPER_TOKEN
let _token = null, _exp = 0

async function token() {
  if (_token && Date.now() < _exp - 60000) return _token
  const p = new URLSearchParams({ client_id: process.env.GOOGLE_ADS_CLIENT_ID, client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET, refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN, grant_type: 'refresh_token' })
  const r = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: p.toString() })
  const d = await r.json()
  if (!r.ok) throw new Error('OAuth: ' + JSON.stringify(d))
  _token = d.access_token
  _exp = Date.now() + (d.expires_in || 3600) * 1000
  return _token
}

async function gaql(q) {
  const t = await token()
  const h = { Authorization: 'Bearer ' + t, 'developer-token': DEV, 'Content-Type': 'application/json' }
  if (LOGIN) h['login-customer-id'] = LOGIN
  const r = await fetch('https://googleads.googleapis.com/' + V + '/customers/' + CUST + '/googleAds:search', { method: 'POST', headers: h, body: JSON.stringify({ query: q }) })
  const d = await r.json()
  if (!r.ok) {
    const errs = d?.error?.details?.[0]?.errors || []
    for (const e of errs) console.error('  API error: ' + (e.message || ''))
    return []
  }
  return d.results || []
}

function $(m) { return (Number(m || 0) / 1000000) }
function p(n) { return Number(n || 0).toFixed(2) }

async function main() {
  console.log('=== GOOGLE ADS ANALYSIS — Pump OU ===')
  console.log('Account: ' + CUST + ' | Currency: EUR | Timezone: Europe/Tallinn\n')

  // 1. Campaigns (no metrics — just structure)
  console.log('1. CAMPAIGNS')
  const c1 = await gaql('SELECT campaign.id, campaign.name, campaign.status, campaign.advertising_channel_type, campaign.start_date, campaign_budget.amount_micros, campaign_budget.type, campaign.bidding_strategy_type FROM campaign WHERE campaign.status != "REMOVED"')
  if (c1.length === 0) console.log('  No campaigns found.\n')
  for (const r of c1) {
    const c = r.campaign; const b = r.campaignBudget
    console.log('  ' + c.name + ' [' + c.status + ']')
    console.log('    ID: ' + c.id + ' | Type: ' + c.advertisingChannelType + ' | Bidding: ' + c.biddingStrategyType)
    console.log('    Budget: ' + p($(b?.amountMicros)) + '/day (' + (b?.type || '?') + ') | Start: ' + (c.startDate || '?'))
    console.log('')
  }

  // 2. Ad Groups
  console.log('2. AD GROUPS')
  const ag = await gaql('SELECT ad_group.id, ad_group.name, ad_group.status, ad_group.type, ad_group.cpc_bid_micros, campaign.name FROM ad_group WHERE ad_group.status != "REMOVED"')
  if (ag.length === 0) console.log('  No ad groups found.\n')
  for (const r of ag) {
    const a = r.adGroup
    console.log('  ' + a.name + ' [' + a.status + '] | Type: ' + a.type + ' | Bid: ' + p($(a.cpcBidMicros)) + ' | Campaign: ' + r.campaign?.name)
  }
  console.log('')

  // 3. Ads
  console.log('3. ADS')
  const ads = await gaql('SELECT ad_group_ad.ad.id, ad_group_ad.ad.name, ad_group_ad.ad.type, ad_group_ad.ad.final_urls, ad_group_ad.status, ad_group.name FROM ad_group_ad WHERE campaign.status != "REMOVED"')
  if (ads.length === 0) console.log('  No ads found.\n')
  for (const r of ads) {
    const a = r.adGroupAd?.ad
    console.log('  "' + (a?.name||'?') + '" (' + (a?.type||'?') + ') [' + r.adGroupAd?.status + '] | AG: ' + r.adGroup?.name + ' | URL: ' + (a?.finalUrls?.[0]||'N/A'))
  }
  console.log('')

  // 4. Keywords
  console.log('4. KEYWORDS')
  const kw = await gaql('SELECT ad_group.name, ad_group_criterion.keyword.text, ad_group_criterion.keyword.match_type, ad_group_criterion.status, ad_group_criterion.cpc_bid_micros, ad_group_criterion.quality_info.quality_score FROM keyword_view WHERE campaign.status != "REMOVED" AND ad_group_criterion.status != "REMOVED"')
  if (kw.length === 0) console.log('  No keywords found.\n')
  for (const r of kw) {
    const k = r.adGroupCriterion?.keyword; const qi = r.adGroupCriterion?.qualityInfo
    console.log('  [' + (k?.matchType||'?') + '] "' + (k?.text||'') + '" | QS: ' + (qi?.qualityScore||'?') + ' | Bid: ' + p($(r.adGroupCriterion?.cpcBidMicros)) + ' | AG: ' + r.adGroup?.name + ' | Status: ' + r.adGroupCriterion?.status)
  }
  console.log('')

  // 5. Performance — lifetime metrics per campaign
  console.log('5. CAMPAIGN PERFORMANCE (all time)')
  const cp = await gaql('SELECT campaign.name, campaign.status, metrics.impressions, metrics.clicks, metrics.ctr, metrics.average_cpc, metrics.cost_micros, metrics.conversions, metrics.conversions_value, metrics.cost_per_conversion, metrics.impression_share, metrics.search_impression_share, metrics.search_budget_lost_impression_share, metrics.search_rank_lost_impression_share FROM campaign WHERE campaign.status != "REMOVED"')
  if (cp.length === 0) console.log('  No performance data.\n')
  for (const r of cp) {
    const c = r.campaign; const m = r.metrics || {}
    const s = $(m.costMicros); const cl = Number(m.clicks||0); const imp = Number(m.impressions||0)
    const conv = Number(m.conversions||0); const cv = Number(m.conversionsValue||0)
    const roas = s > 0 ? p(cv/s) : '0.00'
    console.log('  ' + c.name + ' [' + c.status + ']')
    console.log('    Spend: ' + p(s) + ' | Impr: ' + imp + ' | Clicks: ' + cl + ' | CTR: ' + p(m.ctr) + '%')
    console.log('    CPC: ' + p($(m.averageCpc)) + ' | Conv: ' + conv + ' | Value: ' + p(cv) + ' | CPA: ' + p($(m.costPerConversion)) + ' | ROAS: ' + roas + 'x')
    console.log('    Impr.Share: ' + p(m.impressionShare) + '% | Lost(Budget): ' + p(m.searchBudgetLostImpressionShare) + '% | Lost(Rank): ' + p(m.searchRankLostImpressionShare) + '%')
    console.log('')
  }

  // 6. Keyword performance (top by spend)
  console.log('6. KEYWORD PERFORMANCE (top 15 by spend)')
  const kp = await gaql('SELECT ad_group.name, ad_group_criterion.keyword.text, ad_group_criterion.keyword.match_type, ad_group_criterion.quality_info.quality_score, metrics.impressions, metrics.clicks, metrics.ctr, metrics.average_cpc, metrics.cost_micros, metrics.conversions, metrics.conversions_value, metrics.impression_share FROM keyword_view WHERE campaign.status != "REMOVED" AND ad_group_criterion.status != "REMOVED" AND metrics.impressions > 0 ORDER BY metrics.cost_micros DESC LIMIT 15')
  if (kp.length === 0) console.log('  No keyword performance data.\n')
  for (const r of kp) {
    const k = r.adGroupCriterion?.keyword; const qi = r.adGroupCriterion?.qualityInfo; const m = r.metrics || {}
    const s = $(m.costMicros); const cl = Number(m.clicks||0); const conv = Number(m.conversions||0); const cv = Number(m.conversionsValue||0)
    const roas = s > 0 ? (cv/s).toFixed(1) : '0.0'
    const flag = s > 5 && conv === 0 ? '  NO CONVERSIONS!' : ''
    console.log('  [' + (k?.matchType||'?') + '] "' + (k?.text||'') + '" QS:' + (qi?.qualityScore||'?') + ' | Spend:' + p(s) + ' | Clicks:' + cl + ' | Conv:' + conv + ' | ROAS:' + roas + 'x' + flag)
  }
  console.log('')

  // 7. Search Terms (June 2026)
  console.log('7. SEARCH TERMS — June 2026 (top 15 by spend)')
  const st = await gaql('SELECT search_term_view.search_term, campaign.name, metrics.impressions, metrics.clicks, metrics.ctr, metrics.average_cpc, metrics.cost_micros, metrics.conversions, metrics.conversions_value FROM search_term_view WHERE segments.date BETWEEN "2026-06-01" AND "2026-06-29" AND campaign.status != "REMOVED" AND metrics.impressions > 0 ORDER BY metrics.cost_micros DESC LIMIT 15')
  if (st.length === 0) console.log('  No search term data for June.\n')
  for (const r of st) {
    const m = r.metrics || {}
    const s = $(m.costMicros); const cl = Number(m.clicks||0); const conv = Number(m.conversions||0)
    const flag = s > 3 && conv === 0 ? '  NO CONVERSIONS' : ''
    console.log('  "' + r.searchTermView?.searchTerm + '" | Spend:' + p(s) + ' | Clicks:' + cl + ' | CTR:' + p(m.ctr) + '% | CPC:' + p($(m.averageCpc)) + ' | Conv:' + conv + flag)
  }
  console.log('')

  // 8. Daily performance June 2026
  console.log('8. DAILY PERFORMANCE — June 2026')
  const daily = await gaql('SELECT segments.date, metrics.impressions, metrics.clicks, metrics.ctr, metrics.average_cpc, metrics.cost_micros, metrics.conversions, metrics.conversions_value FROM campaign WHERE segments.date BETWEEN "2026-06-01" AND "2026-06-29" AND campaign.status != "REMOVED" ORDER BY segments.date')
  let ts = 0, ti = 0, tc = 0, tconv = 0, tv = 0
  if (daily.length === 0) console.log('  No daily data for June.\n')
  for (const r of daily) {
    const m = r.metrics || {}
    const s = $(m.costMicros); const cl = Number(m.clicks||0); const imp = Number(m.impressions||0)
    const conv = Number(m.conversions||0); const cv = Number(m.conversionsValue||0)
    ts += s; ti += imp; tc += cl; tconv += conv; tv += cv
    const bar = ''.padEnd(Math.max(1, Math.round(s * 10)), '\u2588')
    console.log('  ' + r.segments.date + '  ' + p(s).padStart(7) + '  ' + bar + '  ' + cl + ' clk  ' + conv + ' conv')
  }
  if (daily.length > 0) {
    console.log('\n  JUNE 2026 TOTALS:')
    console.log('  Spend:    ' + p(ts))
    console.log('  Impr:     ' + ti)
    console.log('  Clicks:   ' + tc)
    console.log('  CTR:      ' + (ti > 0 ? p(tc/ti*100) : '0.00') + '%')
    console.log('  CPC:      ' + (tc > 0 ? p(ts/tc) : '0.00'))
    console.log('  Conv:     ' + tconv)
    console.log('  Value:    ' + p(tv))
    console.log('  CPA:      ' + (tconv > 0 ? p(ts/tconv) : 'N/A'))
    console.log('  ROAS:     ' + (ts > 0 ? p(tv/ts) : '0.00') + 'x')
  }

  console.log('\n=== DONE ===')
}

main().catch(e => { console.error(e.message); process.exit(1) })
