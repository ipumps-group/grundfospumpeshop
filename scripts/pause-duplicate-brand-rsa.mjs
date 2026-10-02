// Kvaliteediparandus (02.10.2026 nädalaraport): rühmas "Brändiotsingud" on KAKS
// enabled RSA-d (GOOD + AVERAGE). Juhendi reegel: iga rühm = 1 RSA — teine RSA
// lahjendab Google'i õpet ja hajutab klikke. Pausitame AVERAGE-RSA, GOOD jääb.
// Idempotentne: kui AVERAGE-RSA on juba pausitud, ei tee midagi.
// Kasutus: node scripts/pause-duplicate-brand-rsa.mjs [--dry-run]
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
async function mutate(ops) { const tk = await token(); const hd = { Authorization: 'Bearer ' + tk, 'developer-token': DEV, 'Content-Type': 'application/json' }; if (LOGIN) hd['login-customer-id'] = LOGIN; const r = await fetch(`https://googleads.googleapis.com/v24/customers/${CUST}/adGroupAds:mutate`, { method: 'POST', headers: hd, body: JSON.stringify({ operations: ops }) }); return await r.json() }

console.log(DRY ? '=== DRY RUN ===' : '=== PAUSE DUPLICATE BRAND RSA ===')
const rows = await gaql(`
  SELECT campaign.name, ad_group.name, ad_group_ad.resource_name,
         ad_group_ad.ad_strength, ad_group_ad.status,
         ad_group_ad.ad.responsive_search_ad.headlines
  FROM ad_group_ad
  WHERE campaign.name = 'Pumbapood + Grundfos Brand Search - EE'
    AND ad_group.name = 'Brändiotsingud'
    AND ad_group_ad.status = 'ENABLED'
`)
if (rows.length === 0) { console.log('Enabled RSA-sid ei leitud - midagi pole teha'); process.exit(0) }
for (const r of rows) {
  const heads = r.adGroupAd?.ad?.responsiveSearchAd?.headlines || []
  console.log(`  leitud RSA: strength=${r.adGroupAd.adStrength} pealkirju=${heads.length} rn=${r.adGroupAd.resourceName.split('/').pop()}`)
}

const enabled = rows.filter((r) => r.adGroupAd.status === 'ENABLED')
if (enabled.length <= 1) { console.log('Rühmas on ainult 1 enabled RSA - reegel juba täidetud'); process.exit(0) }
const rank = { EXCELLENT: 4, GOOD: 3, AVERAGE: 2, POOR: 1, PENDING: 0, UNKNOWN: 0 }
const sorted = [...enabled].sort((a, b) => (rank[b.adGroupAd.adStrength] ?? 0) - (rank[a.adGroupAd.adStrength] ?? 0))
const keep = sorted[0]
const pause = sorted.slice(1)
console.log(`  jääb: strength=${keep.adGroupAd.adStrength}`)
const ops = pause.map((r) => {
  console.log(`  pausile: strength=${r.adGroupAd.adStrength} rn=${r.adGroupAd.resourceName.split('/').pop()}`)
  return { update: { resourceName: r.adGroupAd.resourceName, status: 'PAUSED' }, updateMask: 'status' }
})

if (DRY) { console.log('DRY RUN - muudatusi ei tehtud'); process.exit(0) }
const res = await mutate(ops)
if (!res?.results) { console.error('Pausitamine ebaõnnestus: ' + JSON.stringify(res).slice(0, 600)); process.exit(1) }
console.log(`OK - ${ops.length} RSA pausitud, rühmas jääb 1 enabled RSA (${keep.adGroupAd.adStrength})`)
console.log('=== DONE ===')
