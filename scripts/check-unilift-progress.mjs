// Progress check for Unilift CC autumn 2026 campaigns (Google + Meta)
// Usage: node scripts/check-unilift-progress.mjs [SINCE] [UNTIL]
import { readFileSync } from 'fs'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
try {
  const content = readFileSync(resolve(__dirname, '..', '.env.local'), 'utf-8')
  for (const line of content.split('\n')) {
    const t = line.trim()
    if (t && !t.startsWith('#')) {
      const eq = t.indexOf('=')
      if (eq > 0) { const k = t.slice(0, eq); let v = t.slice(eq + 1); if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1); process.env[k] = v }
    }
  }
} catch {}

const SINCE = process.argv[2] || '2026-09-08'
const UNTIL = process.argv[3] || '2026-09-14'
const CUST = (process.env.GOOGLE_ADS_CUSTOMER_ID || '2639481819').replace(/-/g, '')
const LOGIN = (process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID || '').replace(/-/g, '')
const V = 'v24', DEV = process.env.GOOGLE_ADS_DEVELOPER_TOKEN
let _token = null, _exp = 0

async function token() {
  if (_token && Date.now() < _exp - 60000) return _token
  const p = new URLSearchParams({ client_id: process.env.GOOGLE_ADS_CLIENT_ID, client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET, refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN, grant_type: 'refresh_token' })
  const r = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: p.toString() })
  const d = await r.json()
  if (!r.ok) throw new Error('OAuth: ' + JSON.stringify(d))
  _token = d.access_token; _exp = Date.now() + (d.expires_in || 3600) * 1000; return _token
}

async function gaql(q) {
  const t = await token()
  const h = { Authorization: 'Bearer ' + t, 'developer-token': DEV, 'Content-Type': 'application/json' }
  if (LOGIN) h['login-customer-id'] = LOGIN
  const r = await fetch('https://googleads.googleapis.com/' + V + '/customers/' + CUST + '/googleAds:search', { method: 'POST', headers: h, body: JSON.stringify({ query: q }) })
  const d = await r.json()
  if (!r.ok) { const errs = d?.error?.details?.[0]?.errors || []; for (const e of errs) console.error('  API error: ' + (e.message || '')); return [] }
  return d.results || []
}

function eur(n) { return Number(n || 0) / 1000000 }
function fmt(n) { return Number(n || 0).toFixed(2) }

async function google() {
  console.log('############################################')
  console.log(`# GOOGLE ADS — UNILIFT PROGRESS (${SINCE} .. ${UNTIL})`)
  console.log('############################################\n')

  console.log('--- CAMPAIGNS (config) ---')
  const camps = await gaql('SELECT campaign.name, campaign.status, campaign.id, campaign.start_date, campaign.end_date, campaign_budget.amount_micros, campaign.advertising_channel_type FROM campaign WHERE campaign.status != "REMOVED"')
  for (const r of camps) console.log(`  [${r.campaign.status}] ${r.campaign.name} | budget: ${fmt(eur(r.campaignBudget?.amountMicros))} EUR/day | ${r.campaign.startDate || ''} -> ${r.campaign.endDate || '-'} | id ${r.campaign.id}`)

  console.log('\n--- UNILIFT AD GROUPS ---')
  const ags = await gaql('SELECT ad_group.name, ad_group.status, campaign.name FROM ad_group WHERE campaign.name LIKE "%Unilift%" AND ad_group.status != "REMOVED"')
  for (const r of ags) console.log(`  [${r.adGroup.status}] ${r.adGroup.name}  (${r.campaign.name})`)

  console.log(`\n--- ACCOUNT PERFORMANCE BY CAMPAIGN ${SINCE} .. ${UNTIL} ---`)
  const perf = await gaql(`SELECT campaign.name, metrics.impressions, metrics.clicks, metrics.ctr, metrics.average_cpc, metrics.cost_micros, metrics.conversions, metrics.conversions_value FROM campaign WHERE segments.date BETWEEN "${SINCE}" AND "${UNTIL}" AND campaign.status != "REMOVED"`)
  let ts = 0
  for (const r of perf) {
    const m = r.metrics || {}
    const s = eur(m.costMicros); ts += s
    console.log(`  ${r.campaign.name}: spend ${fmt(s)} | impr ${m.impressions} | clicks ${m.clicks} | CTR ${(Number(m.ctr || 0) * 100).toFixed(2)}% | avgCPC ${fmt(eur(m.averageCpc))} | conv ${m.conversions} | value ${fmt(m.conversionsValue)}`)
  }
  console.log(`  TOTAL spend: ${fmt(ts)}`)

  console.log(`\n--- UNILIFT DAILY BREAKDOWN ---`)
  const daily = await gaql(`SELECT segments.date, campaign.name, metrics.impressions, metrics.clicks, metrics.cost_micros, metrics.conversions, metrics.search_impression_share, metrics.search_budget_lost_impression_share FROM campaign WHERE segments.date BETWEEN "${SINCE}" AND "${UNTIL}" AND campaign.name LIKE "%Unilift%" ORDER BY segments.date`)
  for (const r of daily) {
    const m = r.metrics || {}
    console.log(`  ${r.segments.date}: spend ${fmt(eur(m.costMicros))} | impr ${m.impressions} | clicks ${m.clicks} | conv ${m.conversions} | IS ${(Number(m.searchImpressionShare || 0) * 100).toFixed(0)}% | budget-lost IS ${(Number(m.searchBudgetLostImpressionShare || 0) * 100).toFixed(0)}%`)
  }

  console.log(`\n--- UNILIFT BY AD GROUP ---`)
  const agp = await gaql(`SELECT ad_group.name, metrics.impressions, metrics.clicks, metrics.cost_micros, metrics.conversions, metrics.average_cpc FROM ad_group WHERE segments.date BETWEEN "${SINCE}" AND "${UNTIL}" AND campaign.name LIKE "%Unilift%"`)
  for (const r of agp) {
    const m = r.metrics || {}
    console.log(`  ${r.adGroup.name}: spend ${fmt(eur(m.costMicros))} | impr ${m.impressions} | clicks ${m.clicks} | avgCPC ${fmt(eur(m.averageCpc))} | conv ${m.conversions}`)
  }

  console.log(`\n--- UNILIFT KEYWORDS ---`)
  const kw = await gaql(`SELECT ad_group_criterion.keyword.text, ad_group.name, metrics.impressions, metrics.clicks, metrics.cost_micros, metrics.conversions FROM keyword_view WHERE segments.date BETWEEN "${SINCE}" AND "${UNTIL}" AND campaign.name LIKE "%Unilift%" AND metrics.impressions > 0 ORDER BY metrics.cost_micros DESC`)
  for (const r of kw) {
    const m = r.metrics || {}
    console.log(`  "${r.adGroupCriterion.keyword.text}" (${r.adGroup.name}): spend ${fmt(eur(m.costMicros))} | impr ${m.impressions} | clicks ${m.clicks} | conv ${m.conversions}`)
  }

  console.log(`\n--- UNILIFT SEARCH TERMS ---`)
  const st = await gaql(`SELECT search_term_view.search_term, ad_group.name, metrics.impressions, metrics.clicks, metrics.cost_micros, metrics.conversions FROM search_term_view WHERE segments.date BETWEEN "${SINCE}" AND "${UNTIL}" AND campaign.name LIKE "%Unilift%" AND metrics.impressions > 0 ORDER BY metrics.cost_micros DESC LIMIT 40`)
  for (const r of st) {
    const m = r.metrics || {}
    console.log(`  "${r.searchTermView?.searchTerm}" | spend ${fmt(eur(m.costMicros))} | clicks ${m.clicks} | conv ${m.conversions} | ${r.adGroup?.name}`)
  }

  console.log('\n--- CONVERSION ACTIONS ---')
  const ca = await gaql('SELECT conversion_action.name, conversion_action.status, conversion_action.category FROM conversion_action')
  for (const r of ca) console.log(`  [${r.conversionAction.status}] ${r.conversionAction.name} (${r.conversionAction.category})`)
}

// ---------------- META ----------------
const MTOKEN = process.env.META_ACCESS_TOKEN
const ACCT = (process.env.META_AD_ACCOUNT_ID || '').replace('act_', '')
const MV = process.env.META_GRAPH_API_VERSION || 'v25.0'
const MBASE = `https://graph.facebook.com/${MV}`

async function mget(path, params = {}) {
  const qs = new URLSearchParams({ access_token: MTOKEN, ...params })
  const r = await fetch(`${MBASE}/${path}?${qs}`)
  const d = await r.json()
  if (!r.ok) { console.error('  Meta API error: ' + JSON.stringify(d?.error || d)); return d?.data ? d : { data: [] } }
  return d
}

async function meta() {
  console.log('\n############################################')
  console.log(`# META ADS — UNILIFT PROGRESS (${SINCE} .. ${UNTIL})`)
  console.log('############################################\n')

  console.log('--- CAMPAIGNS ---')
  const camps = await mget(`act_${ACCT}/campaigns`, { fields: 'name,status,objective,daily_budget,created_time', limit: '50' })
  for (const c of camps.data || []) console.log(`  [${c.status}] ${c.name} | obj: ${c.objective || '-'} | daily: ${c.daily_budget ? (c.daily_budget / 100).toFixed(2) + ' EUR' : '-'} | id ${c.id}`)

  console.log('\n--- AD SETS (Unilift) ---')
  const sets = await mget(`act_${ACCT}/adsets`, { fields: 'name,status,daily_budget,campaign_id,start_time,end_time,optimization_goal', limit: '50' })
  for (const s of sets.data || []) {
    if (!/unilift/i.test(s.name || '')) continue
    console.log(`  [${s.status}] ${s.name} | daily: ${s.daily_budget ? (s.daily_budget / 100).toFixed(2) + ' EUR' : '-'} | opt: ${s.optimization_goal || '-'} | ${s.start_time || ''} -> ${s.end_time || '-'} | id ${s.id}`)
  }

  console.log(`\n--- ACCOUNT INSIGHTS BY CAMPAIGN ${SINCE} .. ${UNTIL} ---`)
  const ins = await mget(`act_${ACCT}/insights`, { fields: 'campaign_name,spend,impressions,clicks,inline_link_clicks,cpc,cpm,actions', time_range: JSON.stringify({ since: SINCE, until: UNTIL }), level: 'campaign', limit: '50' })
  let ts = 0
  for (const r of ins.data || []) {
    const spend = Number(r.spend || 0); ts += spend
    const acts = r.actions || []
    const lpv = acts.find(a => a.action_type === 'landing_page_view')?.value || 0
    const purch = acts.find(a => a.action_type === 'purchase' || a.action_type === 'omni_purchase')?.value || 0
    const contact = acts.find(a => a.action_type === 'contact')?.value || 0
    console.log(`  ${r.campaign_name}: spend ${fmt(spend)} | impr ${r.impressions} | clicks ${r.clicks} | linkClicks ${r.inline_link_clicks} | CPC ${r.cpc || '-'} | CPM ${r.cpm || '-'} | LPV ${lpv} | purchase ${purch} | contact ${contact}`)
  }
  console.log(`  TOTAL spend: ${fmt(ts)}`)

  console.log(`\n--- UNILIFT DAILY INSIGHTS ---`)
  const daily = await mget(`act_${ACCT}/insights`, { fields: 'spend,impressions,inline_link_clicks,actions', time_range: JSON.stringify({ since: SINCE, until: UNTIL }), level: 'campaign', time_increment: '1', filtering: JSON.stringify([{ field: 'campaign.name', operator: 'CONTAIN', value: 'Unilift' }]), limit: '50' })
  for (const r of daily.data || []) {
    const lpv = (r.actions || []).find(a => a.action_type === 'landing_page_view')?.value || 0
    console.log(`  ${r.date_start}: spend ${fmt(r.spend)} | impr ${r.impressions} | linkClicks ${r.inline_link_clicks} | LPV ${lpv}`)
  }

  console.log(`\n--- UNILIFT AD-LEVEL INSIGHTS ---`)
  const adIns = await mget(`act_${ACCT}/insights`, { fields: 'ad_name,adset_name,spend,impressions,inline_link_clicks,ctr,cpc,actions', time_range: JSON.stringify({ since: SINCE, until: UNTIL }), level: 'ad', filtering: JSON.stringify([{ field: 'campaign.name', operator: 'CONTAIN', value: 'Unilift' }]), limit: '50' })
  for (const r of adIns.data || []) {
    const lpv = (r.actions || []).find(a => a.action_type === 'landing_page_view')?.value || 0
    console.log(`  ${r.ad_name} (${r.adset_name}): spend ${fmt(r.spend)} | impr ${r.impressions} | linkClicks ${r.inline_link_clicks} | CTR ${r.ctr || '-'}% | CPC ${r.cpc || '-'} | LPV ${lpv}`)
  }
}

async function main() {
  await google()
  await meta()
  console.log('\n=== DONE ===')
}
main().catch(e => { console.error(e.message); process.exit(1) })
