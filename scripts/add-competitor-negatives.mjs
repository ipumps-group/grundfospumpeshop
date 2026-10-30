// LISA konkurendi-brändi negatiivsed märksõnad kampaaniasse (vaikimisi ALPHA GO - Küte).
// Põhjus: kataloogis on 0 Wilo/Atmos/Dab/Lowara/Pedrollo toodet (Grundfos-only pood),
// aga "wilo tsirkulatsioonipump" (1,60 €) ja "atmos pico 25 1 8" (0,84 €) kulutasid
// raha ilma konversioonideta nädalal 19.-25.10.2026.
//
// Kasutus:
//   node scripts/add-competitor-negatives.mjs [--dry-run] ["kampaania nimi (valikuline)"]
//
// Idempotentne: juba olemasolevad negatiivsed jäetakse vahele. Brändikampaaniat
// (Grundfos Brand) skript ei puuduta — grundfos-terminid on kaitstud bränd.
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
const nameFilter = process.argv.slice(2).find(a => a !== '--dry-run') || 'ALPHA GO - Küte - EE 2026 sügis'

// Konkurendi-brändid, mida pood EI müü (kontrollitud: 0 toodet kataloogis 30.10.2026)
const NEGATIVES = ['wilo', 'atmos', 'dab', 'lowara', 'pedrollo']

async function token() { const p = new URLSearchParams({ client_id: process.env.GOOGLE_ADS_CLIENT_ID, client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET, refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN, grant_type: 'refresh_token' }); const r = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: p.toString() }); const d = await r.json(); if (!d.access_token) throw new Error('OAuth failed'); return d.access_token }
async function gaql(q) { const tk = await token(); const hd = { Authorization: 'Bearer ' + tk, 'developer-token': DEV, 'Content-Type': 'application/json' }; if (LOGIN) hd['login-customer-id'] = LOGIN; const r = await fetch(`https://googleads.googleapis.com/v24/customers/${CUST}/googleAds:search`, { method: 'POST', headers: hd, body: JSON.stringify({ query: q }) }); const d = await r.json(); if (!r.ok) throw new Error('GAQL: ' + JSON.stringify(d).slice(0, 400)); return d.results || [] }
async function mutate(ops) { const tk = await token(); const hd = { Authorization: 'Bearer ' + tk, 'developer-token': DEV, 'Content-Type': 'application/json' }; if (LOGIN) hd['login-customer-id'] = LOGIN; const r = await fetch(`https://googleads.googleapis.com/v24/customers/${CUST}/campaignCriteria:mutate`, { method: 'POST', headers: hd, body: JSON.stringify({ operations: ops }) }); return { ok: r.ok, body: await r.json() } }

const camps = await gaql(`SELECT campaign.id, campaign.name, campaign.resource_name FROM campaign WHERE campaign.name = '${nameFilter.replace(/'/g, "\\'")}'`)
const camp = camps[0]?.campaign
if (!camp) { console.error(`Kampaaniat "${nameFilter}" ei leitud`); process.exit(1) }
console.log(`${camp.name} (id=${camp.id}) ${DRY ? '[DRY RUN]' : '[LIVE]'}`)

const existing = await gaql(`SELECT campaign_criterion.keyword.text FROM campaign_criterion WHERE campaign.id = ${camp.id} AND campaign_criterion.negative = TRUE AND campaign_criterion.status != 'REMOVED'`)
const have = new Set(existing.map(x => (x.campaignCriterion.keyword.text || '').toLowerCase()))

const missing = NEGATIVES.filter(n => !have.has(n))
if (missing.length === 0) { console.log('Kõik konkurendi-negatiivsed juba olemas — vahele'); process.exit(0) }
for (const n of missing) console.log(`  + negative [phrase]: ${n}`)
if (DRY) { console.log('DRY RUN — ei lisata'); process.exit(0) }
const ops = missing.map(n => ({ create: { campaign: camp.resourceName, negative: true, keyword: { text: n, matchType: 'PHRASE' } } }))
const res = await mutate(ops)
if (!res.ok || !res.body?.results) { console.error('FAIL: ' + JSON.stringify(res.body).slice(0, 400)); process.exit(1) }
console.log(`OK (${res.body.results.length} negatiivset lisatud)`)
