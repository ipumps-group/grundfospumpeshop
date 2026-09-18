// Lisa "Sukelpumbad Laos" pealkiri Unilift-kampaania "Drenaaž ja tühjendus" RSA-sse.
// RSA on immutable: loon uue RSA olemasolevate pealkirjade/kirjeldustega + uus pealkiri,
// vana RSA pannakse pausile. Märksõna "sukelpump" QS 3/10 — märksõna peab olema ka pealkirjas.
// Kasutus: node scripts/add-sukelpump-headline.mjs [--dry-run]
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
const NEW_HEADLINE = 'Sukelpumbad Laos'

async function token() { const p = new URLSearchParams({ client_id: process.env.GOOGLE_ADS_CLIENT_ID, client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET, refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN, grant_type: 'refresh_token' }); const r = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: p.toString() }); const d = await r.json(); if (!d.access_token) throw new Error('OAuth failed'); return d.access_token }
async function gaql(q) { const tk = await token(); const hd = { Authorization: 'Bearer ' + tk, 'developer-token': DEV, 'Content-Type': 'application/json' }; if (LOGIN) hd['login-customer-id'] = LOGIN; const r = await fetch(`https://googleads.googleapis.com/v24/customers/${CUST}/googleAds:search`, { method: 'POST', headers: hd, body: JSON.stringify({ query: q }) }); const d = await r.json(); if (!r.ok) throw new Error('GAQL: ' + JSON.stringify(d).slice(0, 400)); return d.results || [] }
async function mutate(ops) { const tk = await token(); const hd = { Authorization: 'Bearer ' + tk, 'developer-token': DEV, 'Content-Type': 'application/json' }; if (LOGIN) hd['login-customer-id'] = LOGIN; const r = await fetch(`https://googleads.googleapis.com/v24/customers/${CUST}/adGroupAds:mutate`, { method: 'POST', headers: hd, body: JSON.stringify({ operations: ops }) }); return await r.json() }

console.log(DRY ? '=== DRY RUN ===' : '=== ADD SUKELPUMP HEADLINE ===')

const rows = await gaql(`SELECT ad_group.resource_name, ad_group.name, ad_group_ad.resource_name, ad_group_ad.ad.name, ad_group_ad.ad.final_urls, ad_group_ad.ad.responsive_search_ad.headlines, ad_group_ad.ad.responsive_search_ad.descriptions, ad_group_ad.ad.responsive_search_ad.path1, ad_group_ad.ad.responsive_search_ad.path2 FROM ad_group_ad WHERE campaign.name = 'Unilift CC + Drenaaž - EE 2026 sügis' AND ad_group.name = 'Drenaaž ja tühjendus' AND ad_group_ad.status = 'ENABLED'`)
const ad = rows[0]
if (!ad) { console.error('Aktiivset RSA-d ei leitud'); process.exit(1) }

const rsa = ad.adGroupAd.ad.responsiveSearchAd
const headlines = rsa.headlines.map(h => h.text)
console.log('Olemasolevad pealkirjad:')
headlines.forEach(h => console.log(`  - ${h}`))

if (headlines.some(h => h.toLowerCase().includes('sukelpump'))) {
  console.log('Sukelpump-pealkiri on juba olemas, midagi ei tehta.')
  process.exit(0)
}
if (headlines.length >= 15) { console.error('RSA-s on juba 15 pealkirja (max)'); process.exit(1) }

const newHeadlines = [...rsa.headlines.map(h => ({ text: h.text })), { text: NEW_HEADLINE }]
console.log(`+ uus pealkiri: "${NEW_HEADLINE}"`)

if (DRY) { console.log('DRY RUN — muudatusi ei tehtud'); process.exit(0) }

// 1) Loo uus RSA
const createOp = {
  create: {
    adGroup: ad.adGroup.resourceName,
    status: 'ENABLED',
    ad: {
      name: (ad.adGroupAd.ad.name || 'Drenaaž ja tühjendus') + ' v2',
      type: 'RESPONSIVE_SEARCH_AD',
      finalUrls: ad.adGroupAd.ad.finalUrls,
      responsiveSearchAd: {
        headlines: newHeadlines,
        descriptions: rsa.descriptions.map(d => ({ text: d.text })),
        ...(rsa.path1 ? { path1: rsa.path1 } : {}),
        ...(rsa.path2 ? { path2: rsa.path2 } : {}),
      },
    },
  },
}
const res1 = await mutate([createOp])
if (!res1?.results) { console.error('Uue RSA loomine ebaõnnestus: ' + JSON.stringify(res1).slice(0, 600)); process.exit(1) }
console.log('Uus RSA loodud: ' + res1.results[0].resourceName)

// 2) Vana RSA pausile
const pauseOp = { update: { resourceName: ad.adGroupAd.resourceName, status: 'PAUSED' }, updateMask: 'status' }
const res2 = await mutate([pauseOp])
if (!res2?.results) { console.error('Vana RSA pausimine ebaõnnestus: ' + JSON.stringify(res2).slice(0, 600)); process.exit(1) }
console.log('Vana RSA pausitud')
console.log('=== DONE ===')
