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
  if (!r.ok) { console.error('ERROR: ' + d?.error?.message?.slice(0, 200)); return [] }
  return d.results || []
}

// 1. Simple conversion actions
console.log('=== CONVERSIONS ===')
let r = await gaql('SELECT conversion_action.id, conversion_action.name, conversion_action.status, conversion_action.type, conversion_action.category FROM conversion_action')
for (const e of r) {
  const ca = e.conversionAction
  console.log(ca.id + ' | ' + ca.name + ' | ' + ca.status + ' | ' + ca.type + ' | ' + ca.category)
}

// Check if primary
r = await gaql('SELECT conversion_action.name, conversion_action.primary_for_goal FROM conversion_action')
for (const e of r) {
  const ca = e.conversionAction
  console.log(ca.name + ' -> primary_for_goal: ' + ca.primaryForGoal)
}

// 2. Campaign performance with conversions
console.log('\n=== CAMPAIGN PERFORMANCE ===')
r = await gaql('SELECT campaign.id, campaign.name, campaign.status, campaign_budget.amount_micros, metrics.impressions, metrics.clicks, metrics.ctr, metrics.average_cpc, metrics.cost_micros, metrics.conversions, metrics.conversions_value FROM campaign WHERE campaign.status != "REMOVED"')
for (const e of r) {
  const c = e.campaign, b = e.campaignBudget, m = e.metrics || {}
  const s = (Number(m.costMicros || 0) / 1000000).toFixed(2)
  const clk = Number(m.clicks || 0), imp = Number(m.impressions || 0)
  const conv = Number(m.conversions || 0), cv = Number(m.conversionsValue || 0) || 0
  console.log(c.id + ' ' + c.name + ' [' + c.status + ']')
  console.log('  Budget: ' + (Number(b?.amountMicros || 0) / 1000000).toFixed(2) + '/day')
  console.log('  Spend=' + s + ' | Impr=' + imp + ' | Clicks=' + clk + ' | CTR=' + (Number(m.ctr || 0)).toFixed(1) + '% | CPC=' + (Number(m.averageCpc || 0) / 1000000).toFixed(2))
  console.log('  Conv=' + conv + ' | Value=' + cv.toFixed(2) + ' | ROAS=' + (Number(s) > 0 ? (cv / Number(s)).toFixed(2) : '0.00'))
  if (conv > 0) console.log('  >>> HAS CONVERSIONS!')
}

// 3. Last 3 days daily
console.log('\n=== LAST 3 DAYS ===')
r = await gaql('SELECT segments.date, campaign.name, metrics.impressions, metrics.clicks, metrics.cost_micros, metrics.conversions, metrics.conversions_value FROM campaign WHERE segments.date BETWEEN "2026-06-27" AND "2026-06-29" AND campaign.status != "REMOVED" ORDER BY segments.date, campaign.id')
for (const e of r) {
  const seg = e.segments, m = e.metrics || {}
  const s = (Number(m.costMicros || 0) / 1000000).toFixed(2)
  const conv = Number(m.conversions || 0)
  console.log(seg.date + ' | ' + e.campaign?.name?.slice(0, 25) + ' | spend=' + s + ' | clicks=' + Number(m.clicks || 0) + ' | conv=' + conv + (conv > 0 ? ' <<<' : ''))
}

// 4. Account-level conversion count
console.log('\n=== TOTAL CONVERSIONS (account) ===')
r = await gaql('SELECT metrics.conversions, metrics.conversions_value, metrics.all_conversions FROM customer WHERE customer.id = ' + CUST)
for (const e of r) {
  const m = e.metrics || {}
  console.log('Total conv=' + Number(m.conversions || 0) + ' | all_conv=' + Number(m.allConversions || 0) + ' | value=' + Number(m.conversionsValue || 0).toFixed(2))
}

// 5. Check campaign lifecycle goals
console.log('\n=== CAMPAIGN GOALS ===')
r = await gaql('SELECT campaign.id, campaign.name, campaign.optimization_goal_setting.optimization_goal_type FROM campaign WHERE campaign.status != "REMOVED"')
for (const e of r) {
  const c = e.campaign
  console.log(c.id + ' ' + c.name + ' -> goal: ' + (c.optimizationGoalSetting?.optimizationGoalType || 'NOT SET'))
}
