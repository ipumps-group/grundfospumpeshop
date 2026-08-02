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

async function main() {
  console.log('=== FIXING GOOGLE ADS BRAND CAMPAIGN BUDGET ===\n')

  // Get brand campaign budget resource name
  console.log('1. Finding brand campaign budget...')
  const camp = await gaql('SELECT campaign.id, campaign.name, campaign_budget.resource_name, campaign_budget.amount_micros FROM campaign WHERE campaign.id = 23988914605')
  if (camp.length === 0) { console.log('  Brand campaign not found!'); return }

  const c = camp[0]
  const budgetResource = c.campaignBudget?.resourceName
  const currentBudget = Number(c.campaignBudget?.amountMicros || 0) / 1000000
  console.log('  Campaign: ' + c.campaign?.name)
  console.log('  Current budget: ' + currentBudget.toFixed(2) + '/day')
  console.log('  Budget resource: ' + budgetResource)

  // Set to 5 EUR/day
  console.log('\n2. Setting budget to 5.00/day...')
  const t = await token()
  const h = { Authorization: 'Bearer ' + t, 'developer-token': DEV, 'Content-Type': 'application/json' }
  if (LOGIN) h['login-customer-id'] = LOGIN
  const r = await fetch('https://googleads.googleapis.com/' + V + '/customers/' + CUST + '/campaignBudgets:mutate', {
    method: 'POST', headers: h,
    body: JSON.stringify({
      operations: [{
        updateMask: 'amountMicros',
        update: { resourceName: budgetResource, amountMicros: '5000000' },
      }],
    }),
  })
  const d = await r.json()
  if (!r.ok) { console.error('  ERROR: ' + JSON.stringify(d)); return }
  console.log('  SUCCESS: Brand campaign budget set to 5.00/day')

  console.log('\n=== DONE ===')
}
main().catch(e => { console.error(e.message); process.exit(1) })
