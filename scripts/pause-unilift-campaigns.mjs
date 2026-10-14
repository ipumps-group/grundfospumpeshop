// Pausitab Unilifti reklaamid mõlemal platvormil (kampaania tasemel):
//   Google Ads: "Unilift CC + Drenaaž - EE 2026 sügis" (id 24203046624)
//   Meta:       "Unilift CC - Tühjendus ja drenaaž B2B - EE sügis 2026" (id 120253843650360120)
// Kasutus: node scripts/pause-unilift-campaigns.mjs [--dry-run]
// Idempotentne — juba pausitud kampaaniad jäetakse vahele.
// NB: weather-pulse cron muudab Google'i kampaania eelarvet, aga EI aktiveeri
// pausitud kampaaniat uuesti (budget-update ei puuduta statuset).
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

const DRY = process.argv.includes('--dry-run')
const GOOGLE_CAMPAIGN_ID = '24203046624'
const META_CAMPAIGN_ID = '120253843650360120'

const CUST = (process.env.GOOGLE_ADS_CUSTOMER_ID || '2639481819').replace(/-/g, '')
const LOGIN = (process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID || '').replace(/-/g, '')
const DEV = process.env.GOOGLE_ADS_DEVELOPER_TOKEN

async function gToken() {
  const p = new URLSearchParams({ client_id: process.env.GOOGLE_ADS_CLIENT_ID, client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET, refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN, grant_type: 'refresh_token' })
  const r = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: p.toString() })
  const d = await r.json()
  if (!d.access_token) throw new Error('Google OAuth failed')
  return d.access_token
}
async function gHeaders() {
  const h = { Authorization: 'Bearer ' + (await gToken()), 'developer-token': DEV, 'Content-Type': 'application/json' }
  if (LOGIN) h['login-customer-id'] = LOGIN
  return h
}
async function gaql(q) {
  const r = await fetch(`https://googleads.googleapis.com/v24/customers/${CUST}/googleAds:search`, { method: 'POST', headers: await gHeaders(), body: JSON.stringify({ query: q }) })
  const d = await r.json()
  if (!r.ok) throw new Error('GAQL: ' + JSON.stringify(d).slice(0, 400))
  return d.results || []
}

async function pauseGoogle() {
  const rows = await gaql(`SELECT campaign.id, campaign.name, campaign.status, campaign.resource_name FROM campaign WHERE campaign.id = ${GOOGLE_CAMPAIGN_ID}`)
  const c = rows[0]?.campaign
  if (!c) { console.log(`GOOGLE: kampaaniat ${GOOGLE_CAMPAIGN_ID} ei leitud`); return }
  console.log(`GOOGLE: [${c.status}] ${c.name} (id ${c.id})`)
  if (c.status === 'PAUSED') { console.log('  → juba PAUSED — vahele'); return }
  if (DRY) { console.log('  → DRY RUN: seaksin status=PAUSED'); return }
  const r = await fetch(`https://googleads.googleapis.com/v24/customers/${CUST}/campaigns:mutate`, {
    method: 'POST',
    headers: await gHeaders(),
    body: JSON.stringify({ operations: [{ update: { resourceName: c.resourceName, status: 'PAUSED' }, updateMask: 'status' }] }),
  })
  const d = await r.json()
  if (!r.ok) throw new Error('Google mutate: ' + JSON.stringify(d).slice(0, 400))
  console.log('  → OK, status=PAUSED')
}

// ---------------- META ----------------
const MTOKEN = process.env.META_ACCESS_TOKEN
const MV = process.env.META_GRAPH_API_VERSION || 'v25.0'
const MBASE = `https://graph.facebook.com/${MV}`

async function pauseMeta() {
  const r = await fetch(`${MBASE}/${META_CAMPAIGN_ID}?fields=name,status&access_token=${MTOKEN}`)
  const c = await r.json()
  if (c.error) throw new Error('Meta GET: ' + JSON.stringify(c.error).slice(0, 300))
  console.log(`META: [${c.status}] ${c.name} (id ${c.id})`)
  if (c.status === 'PAUSED') { console.log('  → juba PAUSED — vahele'); return }
  if (DRY) { console.log('  → DRY RUN: seaksin status=PAUSED (kampaania + ad set\'id + reklaamid)'); return }
  const pr = await fetch(`${MBASE}/${META_CAMPAIGN_ID}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ status: 'PAUSED', access_token: MTOKEN }),
  })
  const pd = await pr.json()
  if (!pr.ok || pd.error) throw new Error('Meta POST: ' + JSON.stringify(pd.error || pd).slice(0, 300))
  console.log('  → OK, status=PAUSED (kampaania-taseme paus peatab ka ad set\'id ja reklaamid)')
}

console.log(DRY ? '=== DRY RUN ===' : '=== LIVE ===')
await pauseGoogle()
await pauseMeta()
console.log('DONE')
