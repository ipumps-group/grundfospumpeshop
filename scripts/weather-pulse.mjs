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

// ─── Config ──────────────────────────────────────────────
const CAMPAIGN_ID = '24203046624' // Unilift CC + Drenaaž - EE 2026 sügis
const CAMPAIGN_START = '2026-09-08'
const CAMPAIGN_END = '2026-11-30'
const BASE_BUDGET = 10.0
const TIERS = [
  { minRain48h: 10.0, budget: 18.0, label: 'tugev vihm' },
  { minRain48h: 4.0, budget: 14.0, label: 'vihmane' },
  { minRain48h: 0.0, budget: 10.0, label: 'põhiline' },
]
const CITIES = [
  { name: 'Tallinn', latitude: 59.437, longitude: 24.7536 },
  { name: 'Tartu', latitude: 58.378, longitude: 26.729 },
  { name: 'Pärnu', latitude: 58.3859, longitude: 24.4971 },
  { name: 'Rakvere', latitude: 59.3464, longitude: 26.3558 },
]
const MIN_PROBABILITY = 30 // % — vihma peab ka tõenäoliselt tulema

const DRY_RUN = process.argv.includes('--dry-run')
const FORCE = process.argv.includes('--force') // bypasses campaign date window (for testing)

const CUST = (process.env.GOOGLE_ADS_CUSTOMER_ID || '2639481819').replace(/-/g, '')
const LOGIN = (process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID || '').replace(/-/g, '')
const V = 'v24', DEV = process.env.GOOGLE_ADS_DEVELOPER_TOKEN

async function token() {
  const p = new URLSearchParams({ client_id: process.env.GOOGLE_ADS_CLIENT_ID, client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET, refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN, grant_type: 'refresh_token' })
  const d = await (await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: p.toString() })).json()
  if (!d.access_token) throw new Error('OAuth failed')
  return d.access_token
}

async function gaql(q) {
  const tk = await token()
  const hd = { Authorization: 'Bearer ' + tk, 'developer-token': DEV, 'Content-Type': 'application/json' }
  if (LOGIN) hd['login-customer-id'] = LOGIN
  const r = await fetch(`https://googleads.googleapis.com/${V}/customers/${CUST}/googleAds:search`, { method: 'POST', headers: hd, body: JSON.stringify({ query: q }) })
  return (await r.json()).results || []
}

async function setBudget(budgetResourceName, eur) {
  const tk = await token()
  const hd = { Authorization: 'Bearer ' + tk, 'developer-token': DEV, 'Content-Type': 'application/json' }
  if (LOGIN) hd['login-customer-id'] = LOGIN
  const r = await fetch(`https://googleads.googleapis.com/${V}/customers/${CUST}/campaignBudgets:mutate`, {
    method: 'POST',
    headers: hd,
    body: JSON.stringify({ operations: [{ update: { resourceName: budgetResourceName, amountMicros: String(Math.round(eur * 1_000_000)) }, updateMask: 'amount_micros' }] }),
  })
  return { ok: r.ok, body: await r.json() }
}

async function cityForecast(c) {
  const u = `https://api.open-meteo.com/v1/forecast?latitude=${c.latitude}&longitude=${c.longitude}&daily=precipitation_sum,precipitation_probability_max&timezone=Europe%2FTallinn&forecast_days=3`
  const d = await (await fetch(u)).json()
  const days = d.daily
  return {
    city: c.name,
    today: { date: days.time[0], mm: days.precipitation_sum[0], prob: days.precipitation_probability_max[0] },
    tomorrow: { date: days.time[1], mm: days.precipitation_sum[1], prob: days.precipitation_probability_max[1] },
    dayAfter: { date: days.time[2], mm: days.precipitation_sum[2], prob: days.precipitation_probability_max[2] },
  }
}

async function main() {
  const today = new Date().toLocaleDateString('sv-SE', { timeZone: 'Europe/Tallinn' })
  console.log(`=== WEATHER PULSE — ${today} (Europe/Tallinn) ===`)

  if (!FORCE && (today < CAMPAIGN_START || today > CAMPAIGN_END)) {
    console.log(`Kampaania ei ole aktiivne (${CAMPAIGN_START} – ${CAMPAIGN_END}). Eelarvet ei muudeta.`)
    return
  }

  const forecasts = await Promise.all(CITIES.map(cityForecast))
  let maxRain48 = 0, maxProb = 0, driver = ''
  for (const f of forecasts) {
    const rain48 = (f.today.mm || 0) + (f.tomorrow.mm || 0)
    const prob = Math.max(f.today.prob || 0, f.tomorrow.prob || 0)
    console.log(`  ${f.city.padEnd(8)} täna ${String(f.today.mm).padStart(5)} mm (${f.today.prob}%) | homme ${String(f.tomorrow.mm).padStart(5)} mm (${f.tomorrow.prob}%) | 48h: ${rain48.toFixed(1)} mm`)
    if (rain48 > maxRain48) { maxRain48 = rain48; maxProb = prob; driver = f.city }
  }

  let tier = TIERS[TIERS.length - 1]
  if (maxProb >= MIN_PROBABILITY) {
    for (const t of TIERS) if (maxRain48 >= t.minRain48h) { tier = t; break }
  }
  console.log(`\nOtsus: ${maxRain48.toFixed(1)} mm / 48h (${driver}), tõenäosus ${maxProb}% → tase "${tier.label}" → ${tier.budget.toFixed(2)} €/päev`)

  const rows = await gaql(`SELECT campaign.campaign_budget, campaign_budget.amount_micros FROM campaign WHERE campaign.id = ${CAMPAIGN_ID}`)
  const budgetRn = rows[0]?.campaignBudget?.resourceName || rows[0]?.campaign?.campaignBudget
  const currentEur = Number(rows[0]?.campaignBudget?.amountMicros || 0) / 1_000_000
  console.log(`Praegune eelarve: ${currentEur.toFixed(2)} €/päev (${budgetRn})`)

  if (Math.abs(currentEur - tier.budget) < 0.01) {
    console.log('Eelarve juba õige — muudatust pole vaja.')
    return
  }
  if (DRY_RUN) {
    console.log(`DRY RUN: seadaksin eelarve ${tier.budget.toFixed(2)} €/päev`)
    return
  }
  const res = await setBudget(budgetRn, tier.budget)
  console.log(res.ok ? `OK: eelarve muudetud ${currentEur.toFixed(2)} → ${tier.budget.toFixed(2)} €/päev` : 'FAIL: ' + JSON.stringify(res.body).slice(0, 300))
}
main().catch(e => { console.error(e.message); process.exit(1) })
