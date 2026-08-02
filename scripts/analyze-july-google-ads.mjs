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
        process.env[k] = v
      }
    }
  }
} catch {}

const CUST = '2639481819', LOGIN = '6134277350', V = 'v24', DEV = process.env.GOOGLE_ADS_DEVELOPER_TOKEN
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

function usd(n) { return Number(n || 0) / 1000000 }
function fmt(n) { return Number(n || 0).toFixed(2) }

async function main() {
  console.log('=== GOOGLE ADS — JULY 1-9, 2026 ===\n')

  // Campaign performance July
  console.log('CAMPAIGN PERFORMANCE:')
  const cp = await gaql('SELECT campaign.name, campaign.status, metrics.impressions, metrics.clicks, metrics.ctr, metrics.average_cpc, metrics.cost_micros, metrics.conversions, metrics.conversions_value FROM campaign WHERE segments.date BETWEEN "2026-07-01" AND "2026-07-09" AND campaign.status != "REMOVED"')
  let ts = 0, ti = 0, tc = 0, tconv = 0, tv = 0
  for (const r of cp) {
    const c = r.campaign; const m = r.metrics || {}
    const s = usd(m.costMicros); const cl = Number(m.clicks || 0); const imp = Number(m.impressions || 0)
    const conv = Number(m.conversions || 0); const cv = Number(m.conversionsValue || 0)
    ts += s; ti += imp; tc += cl; tconv += conv; tv += cv
    console.log('  ' + c.name + ' [' + c.status + ']')
    console.log('    Spend: ' + fmt(s) + ' | Impr: ' + imp + ' | Clicks: ' + cl + ' | CTR: ' + fmt(m.ctr) + '% | CPC: ' + fmt(usd(m.averageCpc)) + ' | Conv: ' + conv + ' | Value: ' + fmt(cv))
    const roas = s > 0 ? fmt(cv / s) : '0.00'
    if (cl > 0) console.log('    ROAS: ' + roas + 'x')
  }
  if (cp.length > 0) {
    console.log('\n  TOTALS: Spend: ' + fmt(ts) + ' | Impr: ' + ti + ' | Clicks: ' + tc + ' | CTR: ' + (ti > 0 ? fmt(tc / ti * 100) : '0') + '% | CPC: ' + (tc > 0 ? fmt(ts / tc) : '0') + ' | Conv: ' + tconv + ' | ROAS: ' + (ts > 0 ? fmt(tv / ts) : '0') + 'x')
  }

  // Daily July
  console.log('\nDAILY PERFORMANCE:')
  const daily = await gaql('SELECT segments.date, metrics.cost_micros, metrics.clicks, metrics.impressions, metrics.conversions, metrics.ctr FROM campaign WHERE segments.date BETWEEN "2026-07-01" AND "2026-07-09" AND campaign.status != "REMOVED" ORDER BY segments.date')
  let ds = 0, dc = 0, di = 0, dconv = 0
  for (const r of daily) {
    const m = r.metrics || {}
    const s = usd(m.costMicros); const cl = Number(m.clicks || 0); const imp = Number(m.impressions || 0); const conv = Number(m.conversions || 0)
    ds += s; dc += cl; di += imp; dconv += conv
    const bar = ''.padEnd(Math.max(1, Math.round(s * 8)), '\u2588')
    console.log('  ' + r.segments.date + '  ' + fmt(s).padStart(7) + '  ' + bar + '  ' + cl + ' clk  ' + conv + ' conv')
  }
  console.log('\n  JULY TOTALS: Spend: ' + fmt(ds) + ' | Impr: ' + di + ' | Clicks: ' + dc + ' | Conv: ' + dconv)

  // Search terms July
  console.log('\nTOP SEARCH TERMS (by spend):')
  const st = await gaql('SELECT search_term_view.search_term, campaign.name, metrics.cost_micros, metrics.clicks, metrics.ctr, metrics.conversions FROM search_term_view WHERE segments.date BETWEEN "2026-07-01" AND "2026-07-09" AND metrics.impressions > 0 ORDER BY metrics.cost_micros DESC LIMIT 15')
  for (const r of st) {
    const m = r.metrics || {}
    const s = usd(m.costMicros); const cl = Number(m.clicks || 0); const conv = Number(m.conversions || 0)
    const flag = s > 3 && conv === 0 ? '  NO CONV' : ''
    console.log('  "' + r.searchTermView?.searchTerm + '" | Spend:' + fmt(s) + ' | Clicks:' + cl + ' | CTR:' + fmt(m.ctr) + '% | Conv:' + conv + flag + ' | ' + r.campaign?.name)
  }

  console.log('\n=== DONE ===')
}
main().catch(e => { console.error(e.message); process.exit(1) })
