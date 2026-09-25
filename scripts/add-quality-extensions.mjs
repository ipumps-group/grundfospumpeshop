// Kvaliteediparandus (25.09.2026): laienduste lisamine -> suurem "expected impact"
// Ad Rank'is ilma eelarvet tõstmata. Lisab mõlemale kampaaniale:
//   - structured snippet (Types)
//   - price-laiendus (3 toodet, tegelikud kataloogihinnad)
//   - call-laiendus (+372 527 4403)
// Kasutus: node scripts/add-quality-extensions.mjs [--dry-run]
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

async function token() { const p = new URLSearchParams({ client_id: process.env.GOOGLE_ADS_CLIENT_ID, client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET, refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN, grant_type: 'refresh_token' }); const r = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: p.toString() }); const d = await r.json(); if (!d.access_token) throw new Error('OAuth failed'); return d.access_token }
async function gaql(q) { const tk = await token(); const hd = { Authorization: 'Bearer ' + tk, 'developer-token': DEV, 'Content-Type': 'application/json' }; if (LOGIN) hd['login-customer-id'] = LOGIN; const r = await fetch(`https://googleads.googleapis.com/v24/customers/${CUST}/googleAds:search`, { method: 'POST', headers: hd, body: JSON.stringify({ query: q }) }); const d = await r.json(); if (!r.ok) throw new Error('GAQL: ' + JSON.stringify(d).slice(0, 400)); return d.results || [] }
async function mutate(endpoint, ops) { const tk = await token(); const hd = { Authorization: 'Bearer ' + tk, 'developer-token': DEV, 'Content-Type': 'application/json' }; if (LOGIN) hd['login-customer-id'] = LOGIN; const r = await fetch(`https://googleads.googleapis.com/v24/customers/${CUST}/${endpoint}:mutate`, { method: 'POST', headers: hd, body: JSON.stringify({ operations: ops }) }); return await r.json() }

const SHOP = 'https://pumbapood.ee'
const micros = (eur) => String(Math.round(eur * 1e6))

const ASSETS = [
  // ── Unilift ──
  { campaign: 'Unilift CC + Drenaaž - EE 2026 sügis', fieldType: 'STRUCTURED_SNIPPET', asset: { structuredSnippetAsset: { header: 'Types', values: ['Tühjenduspumbad', 'Drenaažipumbad', 'Sukelpumbad', 'Reoveepumbad'] } }, label: 'Types: Tühjenduspumbad, Drenaažipumbad, Sukelpumbad, Reoveepumbad' },
  { campaign: 'Unilift CC + Drenaaž - EE 2026 sügis', fieldType: 'PRICE', asset: { priceAsset: { type: 'PRODUCT_CATEGORIES', priceQualifier: 'FROM', languageCode: 'en', priceOfferings: [
      { header: 'Unilift CC5', description: 'Tühjenduspump', finalUrl: `${SHOP}/toode/unilift-cc5---m1-1x230v-50hz`, price: { amountMicros: micros(172.75), currencyCode: 'EUR' } },
      { header: 'Unilift CC7', description: 'Tühjenduspump', finalUrl: `${SHOP}/toode/unilift-cc7---m1`, price: { amountMicros: micros(207.6), currencyCode: 'EUR' } },
      { header: 'Unilift CC9', description: 'Tühjenduspump', finalUrl: `${SHOP}/toode/unilift-cc9---m1`, price: { amountMicros: micros(264.69), currencyCode: 'EUR' } },
    ] } }, label: 'Price: CC5 172,75 EUR / CC7 207,60 EUR / CC9 264,69 EUR' },
  { campaign: 'Unilift CC + Drenaaž - EE 2026 sügis', fieldType: 'CALL', asset: { callAsset: { countryCode: 'EE', phoneNumber: '+372 527 4403' } }, label: 'Call: +372 527 4403' },
  // ── ALPHA GO ──
  { campaign: 'ALPHA GO - Küte - EE 2026 sügis', fieldType: 'STRUCTURED_SNIPPET', asset: { structuredSnippetAsset: { header: 'Types', values: ['Tsirkulatsioonipumbad', 'Küttepumbad', 'Keskküttepumbad', 'Põrandakütte pumbad'] } }, label: 'Types: Tsirkulatsioonipumbad, Küttepumbad, Keskküttepumbad, Põrandakütte pumbad' },
  { campaign: 'ALPHA GO - Küte - EE 2026 sügis', fieldType: 'PRICE', asset: { priceAsset: { type: 'PRODUCT_CATEGORIES', priceQualifier: 'FROM', languageCode: 'en', priceOfferings: [
      { header: 'ALPHA1 GO 25-40', description: 'Tsirkulatsioonipump', finalUrl: `${SHOP}/toode/alpha1-go-25-40-130-220-240v-9h-ab0`, price: { amountMicros: micros(170.05), currencyCode: 'EUR' } },
      { header: 'ALPHA1 GO 25-80', description: 'Tsirkulatsioonipump', finalUrl: `${SHOP}/toode/alpha1-go-25-80-130-220-240v-9h-ac0`, price: { amountMicros: micros(199.12), currencyCode: 'EUR' } },
      { header: 'ALPHA2 GO 25-60', description: 'Tsirkulatsioonipump', finalUrl: `${SHOP}/toode/alpha2-go-25-60-130-220-240v-9h-af0`, price: { amountMicros: micros(303.26), currencyCode: 'EUR' } },
    ] } }, label: 'Price: ALPHA1 GO 25-40 170,05 EUR / 25-80 199,12 EUR / ALPHA2 GO 25-60 303,26 EUR' },
  { campaign: 'ALPHA GO - Küte - EE 2026 sügis', fieldType: 'CALL', asset: { callAsset: { countryCode: 'EE', phoneNumber: '+372 527 4403' } }, label: 'Call: +372 527 4403' },
]

console.log(DRY ? '=== DRY RUN ===' : '=== ADD QUALITY EXTENSIONS ===')

const camps = await gaql(`SELECT campaign.name, campaign.resource_name, campaign.status FROM campaign WHERE campaign.status = 'ENABLED'`)
const campByName = new Map(camps.map((c) => [c.campaign.name, c.campaign]))

// Kontrolli, millised laiendustüübid juba lingitud (et ei dubleeriks)
const existing = await gaql(`SELECT campaign.name, campaign.status, campaign_asset.field_type FROM campaign_asset WHERE campaign.status = 'ENABLED'`)
const existingTypes = new Set(existing.map((e) => `${e.campaign.name}|||${e.campaignAsset.fieldType}`))

for (const a of ASSETS) {
  const camp = campByName.get(a.campaign)
  if (!camp) { console.error(`Kampaaniat ei leitud: ${a.campaign}`); process.exit(1) }
  const key = `${a.campaign}|||${a.fieldType}`
  if (existingTypes.has(key)) { console.log(`Juba olemas: [${a.campaign}] ${a.fieldType} - jätan vahele`); continue }
  console.log(`\n[+] [${a.campaign}] ${a.fieldType}: ${a.label}`)
  if (DRY) continue
  const r1 = await mutate('assets', [{ create: a.asset }])
  if (!r1?.results) { console.error('Asset loomine ebaõnnestus: ' + JSON.stringify(r1).slice(0, 600)); process.exit(1) }
  const assetRes = r1.results[0].resourceName
  const r2 = await mutate('campaignAssets', [{ create: { campaign: camp.resourceName, asset: assetRes, fieldType: a.fieldType } }])
  if (!r2?.results) { console.error('Laienduse linkimine ebaõnnestus: ' + JSON.stringify(r2).slice(0, 600)); process.exit(1) }
  console.log('    Lingitud')
}
console.log('\n=== DONE ===')
