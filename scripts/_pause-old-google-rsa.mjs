import { readFileSync } from 'fs'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'
const __dirname = dirname(fileURLToPath(import.meta.url))
try {
  const content = readFileSync(resolve(__dirname, '..', '.env.local'), 'utf-8')
  for (const line of content.split('\n')) { const t = line.trim(); if (t && !t.startsWith('#')) { const eq = t.indexOf('='); if (eq > 0) { const k = t.slice(0, eq); let v = t.slice(eq + 1); if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1); process.env[k] = v } } }
} catch {}
const CUST = (process.env.GOOGLE_ADS_CUSTOMER_ID || '').replace(/-/g, ''), LOGIN = (process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID || '').replace(/-/g, ''), DEV = process.env.GOOGLE_ADS_DEVELOPER_TOKEN
const LANDING = 'https://pumbapood.ee/unilift'
async function token() { const p = new URLSearchParams({ client_id: process.env.GOOGLE_ADS_CLIENT_ID, client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET, refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN, grant_type: 'refresh_token' }); const r = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: p.toString() }); const d = await r.json(); if (!d.access_token) throw new Error('OAuth failed: ' + JSON.stringify(d)); return d.access_token }
async function gaql(q) { const tk = await token(); const hd = { Authorization: 'Bearer ' + tk, 'developer-token': DEV, 'Content-Type': 'application/json' }; if (LOGIN) hd['login-customer-id'] = LOGIN; const r = await fetch(`https://googleads.googleapis.com/v24/customers/${CUST}/googleAds:search`, { method: 'POST', headers: hd, body: JSON.stringify({ query: q }) }); return (await r.json()).results || [] }
async function mutate(ops, ep) { const tk = await token(); const hd = { Authorization: 'Bearer ' + tk, 'developer-token': DEV, 'Content-Type': 'application/json' }; if (LOGIN) hd['login-customer-id'] = LOGIN; const r = await fetch(`https://googleads.googleapis.com/v24/customers/${CUST}/${ep}:mutate`, { method: 'POST', headers: hd, body: JSON.stringify({ operations: ops }) }); return await r.json() }

// List all non-removed RSAs in the campaign and PAUSE the ones NOT pointing to /unilift
console.log('=== GOOGLE: pause non-/unilift RSAs ===\n')
const rows = await gaql('SELECT ad_group.name, ad_group_ad.resource_name, ad_group_ad.ad.final_urls, ad_group_ad.status FROM ad_group_ad WHERE campaign.name = "Unilift CC + Drenaaž - EE 2026 sügis" AND ad_group_ad.status != "REMOVED" AND ad_group_ad.ad.type = "RESPONSIVE_SEARCH_AD"')
const GOOD = new Set()
const BAD = []
for (const r of rows) {
  const urls = r.adGroupAd?.ad?.finalUrls || []
  const rn = r.adGroupAd.resourceName
  if (urls.length === 1 && urls[0] === LANDING) { GOOD.add(rn); console.log(`  KEEP (good url): ${r.adGroup.name}`) }
  else BAD.push([rn, r.adGroup.name, urls])
}
for (const [rn, name, urls] of BAD) {
  const res = await mutate([{ update: { resourceName: rn, status: 'PAUSED' }, updateMask: 'status' }], 'adGroupAds')
  console.log(`  ${res?.results ? 'PAUSED old' : 'FAIL ' + JSON.stringify(res).slice(0, 200)}  ${name} (was ${JSON.stringify(urls)})`)
}
console.log('\n=== DONE ===')
