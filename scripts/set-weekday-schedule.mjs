// Nädalavahetuste eemaldamine Google Ads'ist: lisab igale ENABLED kampaaniale
// ad schedule kriteeriumid E–R 00:00–24:00. Kui kampaanial on vähemalt üks
// ajakava-kriteerium, näitab Google reklaame AINULT nendes akendes — seega
// laupäev ja pühapäev jäävad reklaamivabaks. Bid modifier'it ei seata (1.0).
//
// Kasutus:
//   node scripts/set-weekday-schedule.mjs [--dry-run] ["kampaania nimi (valikuline filter)"]
//
// Idempotentne: päevad, millel ajakava juba olemas, jäetakse vahele.
// Tühistamiseks eemalda AD_SCHEDULE kriteeriumid (Google Ads UI: Kampaaania →
// Ajakava) — ilma nendeta jooksevad reklaamid jälle 24/7.
import { readFileSync } from 'fs'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'
const __dirname = dirname(fileURLToPath(import.meta.url))
try {
  const content = readFileSync(resolve(__dirname, '..', '.env.local'), 'utf-8')
  for (const line of content.split('\n')) { const t = line.trim(); if (t && !t.startsWith('#')) { const eq = t.indexOf('='); if (eq > 0) { const k = t.slice(0, eq); let v = t.slice(eq + 1); if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1); process.env[k] = v } } }
} catch {}
const CUST = (process.env.GOOGLE_ADS_CUSTOMER_ID || '').replace(/-/g, ''), LOGIN = (process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID || '').replace(/-/g, ''), DEV = process.env.GOOGLE_ADS_DEVELOPER_TOKEN

const DRY = process.argv.includes('--dry-run')
const nameFilter = process.argv.slice(2).find(a => a !== '--dry-run')

const WEEKDAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY']

async function token() { const p = new URLSearchParams({ client_id: process.env.GOOGLE_ADS_CLIENT_ID, client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET, refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN, grant_type: 'refresh_token' }); const r = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: p.toString() }); const d = await r.json(); if (!d.access_token) throw new Error('OAuth failed'); return d.access_token }
async function gaql(q) { const tk = await token(); const hd = { Authorization: 'Bearer ' + tk, 'developer-token': DEV, 'Content-Type': 'application/json' }; if (LOGIN) hd['login-customer-id'] = LOGIN; const r = await fetch(`https://googleads.googleapis.com/v24/customers/${CUST}/googleAds:search`, { method: 'POST', headers: hd, body: JSON.stringify({ query: q }) }); const d = await r.json(); if (!r.ok) throw new Error('GAQL: ' + JSON.stringify(d).slice(0, 400)); return d.results || [] }
async function mutate(ops) { const tk = await token(); const hd = { Authorization: 'Bearer ' + tk, 'developer-token': DEV, 'Content-Type': 'application/json' }; if (LOGIN) hd['login-customer-id'] = LOGIN; const r = await fetch(`https://googleads.googleapis.com/v24/customers/${CUST}/campaignCriteria:mutate`, { method: 'POST', headers: hd, body: JSON.stringify({ operations: ops }) }); return { ok: r.ok, body: await r.json() } }

let where = `campaign.status = 'ENABLED'`
if (nameFilter) where = `campaign.name = '${nameFilter.replace(/'/g, "\\'")}'`
const camps = await gaql(`SELECT campaign.id, campaign.name, campaign.resource_name, campaign.status FROM campaign WHERE ${where}`)
if (camps.length === 0) { console.error('Sobivaid ENABLED kampaaniaid ei leitud'); process.exit(1) }

console.log(`=== Google Ads: E–R 00:00–24:00 ajakava (nädalavahetused väljas) ${DRY ? '[DRY RUN]' : '[LIVE]'} ===\n`)

for (const e of camps) {
  const camp = e.campaign
  console.log(`${camp.name} (id=${camp.id})`)
  const existing = await gaql(`SELECT campaign_criterion.ad_schedule.day_of_week FROM campaign_criterion WHERE campaign.id = ${camp.id} AND campaign_criterion.type = 'AD_SCHEDULE' AND campaign_criterion.status != 'REMOVED'`)
  const have = new Set(existing.map(x => x.campaignCriterion.adSchedule.dayOfWeek))
  const missing = WEEKDAYS.filter(d => !have.has(d))
  if (missing.length === 0) { console.log('  E–R ajakavad juba olemas — vahele\n'); continue }
  for (const d of missing) console.log(`  + ${d} 00:00–24:00`)
  if (DRY) { console.log('  DRY RUN — ei lisata\n'); continue }
  const ops = missing.map(d => ({ create: { campaign: camp.resourceName, adSchedule: { dayOfWeek: d, startHour: 0, startMinute: 'ZERO', endHour: 24, endMinute: 'ZERO' } } }))
  const res = await mutate(ops)
  if (!res.ok || !res.body?.results) { console.error('  FAIL: ' + JSON.stringify(res.body).slice(0, 400)); process.exit(1) }
  console.log(`  OK (${res.body.results.length} ajakava lisatud)\n`)
}
console.log('DONE')
