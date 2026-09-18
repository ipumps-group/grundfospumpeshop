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
      if (eq > 0) { const k = t.slice(0, eq); let v = t.slice(eq + 1); if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1); process.env[k] = v }
    }
  }
} catch {}

const SINCE = '2026-08-01', UNTIL = '2026-09-02'
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
  console.log('# GOOGLE ADS — CURRENT STATE (2 Sep 2026)')
  console.log('############################################\n')

  console.log('--- CAMPAIGNS (config) ---')
  const camps = await gaql('SELECT campaign.name, campaign.status, campaign.id, campaign_budget.amount_micros, campaign.advertising_channel_type FROM campaign WHERE campaign.status != "REMOVED"')
  for (const r of camps) console.log(`  [${r.campaign.status}] ${r.campaign.name} | ${r.campaign.advertisingChannelType} | budget: ${fmt(eur(r.campaignBudget?.amountMicros))} EUR/day | id ${r.campaign.id}`)

  console.log('\n--- AD GROUPS ---')
  const ags = await gaql('SELECT ad_group.name, ad_group.status, campaign.name FROM ad_group WHERE campaign.status != "REMOVED" AND ad_group.status != "REMOVED"')
  for (const r of ags) console.log(`  [${r.adGroup.status}] ${r.adGroup.name}   (${r.campaign.name})`)

  console.log('\n--- KEYWORDS (non-removed) ---')
  const kws = await gaql('SELECT ad_group_criterion.keyword.text, ad_group_criterion.keyword.match_type, ad_group_criterion.status, campaign.name, ad_group.name FROM keyword_view WHERE campaign.status != "REMOVED" AND ad_group.status != "REMOVED" AND ad_group_criterion.status != "REMOVED"')
  for (const r of kws) console.log(`  [${r.adGroupCriterion.status}] "${r.adGroupCriterion.keyword.text}" [${r.adGroupCriterion.keyword.matchType}]  ${r.campaign.name} / ${r.adGroup.name}`)

  console.log('\n--- PERFORMANCE ' + SINCE + ' .. ' + UNTIL + ' ---')
  const perf = await gaql(`SELECT campaign.name, metrics.impressions, metrics.clicks, metrics.ctr, metrics.average_cpc, metrics.cost_micros, metrics.conversions, metrics.conversions_value FROM campaign WHERE segments.date BETWEEN "${SINCE}" AND "${UNTIL}" AND campaign.status != "REMOVED"`)
  let ts = 0, ti = 0, tc = 0, tconv = 0, tv = 0
  for (const r of perf) {
    const m = r.metrics || {}
    const s = eur(m.costMicros), cl = Number(m.clicks || 0), imp = Number(m.impressions || 0), conv = Number(m.conversions || 0), cv = Number(m.conversionsValue || 0)
    ts += s; ti += imp; tc += cl; tconv += conv; tv += cv
    console.log(`  ${r.campaign.name}: spend ${fmt(s)} | impr ${imp} | clicks ${cl} | conv ${conv} | value ${fmt(cv)}`)
  }
  console.log(`  TOTAL: spend ${fmt(ts)} | impr ${ti} | clicks ${tc} | conv ${tconv} | value ${fmt(tv)}`)

  console.log('\n--- TOP SEARCH TERMS ' + SINCE + ' .. ' + UNTIL + ' ---')
  const st = await gaql(`SELECT search_term_view.search_term, campaign.name, metrics.cost_micros, metrics.clicks, metrics.impressions, metrics.conversions FROM search_term_view WHERE segments.date BETWEEN "${SINCE}" AND "${UNTIL}" AND metrics.impressions > 0 ORDER BY metrics.cost_micros DESC LIMIT 25`)
  for (const r of st) {
    const m = r.metrics || {}
    console.log(`  "${r.searchTermView?.searchTerm}" | spend ${fmt(eur(m.costMicros))} | clicks ${m.clicks} | conv ${m.conversions} | ${r.campaign?.name}`)
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
  console.log('# META ADS — CURRENT STATE (2 Sep 2026)')
  console.log('############################################\n')

  console.log('--- CAMPAIGNS ---')
  const camps = await mget(`act_${ACCT}/campaigns`, { fields: 'name,status,objective,daily_budget,lifetime_budget,created_time', limit: '50' })
  for (const c of camps.data || []) console.log(`  [${c.status}] ${c.name} | obj: ${c.objective || '-'} | daily: ${c.daily_budget ? (c.daily_budget / 100).toFixed(2) + ' EUR' : '-'} | id ${c.id}`)

  console.log('\n--- AD SETS ---')
  const sets = await mget(`act_${ACCT}/adsets`, { fields: 'name,status,daily_budget,lifetime_budget,campaign_id,start_time,end_time,targeting', limit: '50' })
  for (const s of sets.data || []) {
    const t = s.targeting || {}
    const inter = (t.flexible_spec || []).flatMap(f => (f.interests || []).map(i => i.name)).join(', ')
    console.log(`  [${s.status}] ${s.name} | daily: ${s.daily_budget ? (s.daily_budget / 100).toFixed(2) + ' EUR' : '-'} | campaign ${s.campaign_id} | id ${s.id}`)
    console.log(`      geo: ${(t.geo_locations?.countries || []).join(',')} | age ${t.age_min || '?'}-${t.age_max || '?'} | interests: ${inter || '-'}`)
    if (s.end_time) console.log(`      end_time: ${s.end_time}`)
  }

  console.log('\n--- ADS ---')
  const ads = await mget(`act_${ACCT}/ads`, { fields: 'name,status,adset_id,creative{name,object_story_spec}', limit: '50' })
  for (const a of ads.data || []) console.log(`  [${a.status}] ${a.name} | adset ${a.adset_id} | creative: ${a.creative?.name || '-'}`)

  console.log('\n--- INSIGHTS ' + SINCE + ' .. ' + UNTIL + ' (ad set level) ---')
  const ins = await mget(`act_${ACCT}/insights`, { fields: 'campaign_name,adset_name,spend,impressions,clicks,inline_link_clicks,actions,action_values', time_range: JSON.stringify({ since: SINCE, until: UNTIL }), level: 'adset', limit: '50' })
  let ts = 0
  for (const r of ins.data || []) {
    const spend = Number(r.spend || 0); ts += spend
    const acts = r.actions || []
    const lpv = acts.find(a => a.action_type === 'landing_page_view')?.value || 0
    const purch = acts.find(a => a.action_type === 'purchase' || a.action_type === 'omni_purchase')?.value || 0
    const contact = acts.find(a => a.action_type === 'contact')?.value || 0
    console.log(`  ${r.campaign_name} / ${r.adset_name}: spend ${fmt(spend)} | impr ${r.impressions} | clicks ${r.clicks} | link clicks ${r.inline_link_clicks} | LPV ${lpv} | purchase ${purch} | contact ${contact}`)
  }
  console.log(`  TOTAL spend: ${fmt(ts)}`)
}

async function main() {
  await google()
  await meta()
  console.log('\n=== DONE ===')
}
main().catch(e => { console.error(e.message); process.exit(1) })
