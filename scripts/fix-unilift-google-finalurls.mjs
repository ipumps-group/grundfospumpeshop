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

console.log('=== GOOGLE: rebuild RSAs with /unilift landing ===\n')
const rows = await gaql('SELECT ad_group.name, ad_group_ad.resource_name, ad_group.resource_name, ad_group_ad.ad.responsive_search_ad.headlines, ad_group_ad.ad.responsive_search_ad.descriptions, ad_group_ad.ad.responsive_search_ad.path1, ad_group_ad.ad.responsive_search_ad.path2 FROM ad_group_ad WHERE campaign.name = "Unilift CC + Drenaaž - EE 2026 sügis" AND ad_group_ad.status != "REMOVED" AND ad_group_ad.ad.type = "RESPONSIVE_SEARCH_AD"')
for (const r of rows) {
  const oldRn = r.adGroupAd.resourceName
  const agRn = r.adGroup.resourceName
  const rsa = r.adGroupAd?.ad?.responsiveSearchAd || {}
  const name = r.adGroup?.name
  console.log(`\n${name}:`)

  // 1. create new RSA pointing to /unilift, keeping headlines/descriptions
  const headlines = (rsa.headlines || []).map(h => ({ text: h.text, pinnedField: h.pinnedField || 'UNSPECIFIED' }))
  const descriptions = (rsa.descriptions || []).map(d => ({ text: d.text }))
  const newAd = { create: { adGroup: agRn, status: 'ENABLED', ad: { name: name + ' RSA', type: 'RESPONSIVE_SEARCH_AD', finalUrls: [LANDING], responsiveSearchAd: { headlines, descriptions, path1: rsa.path1 || undefined, path2: rsa.path2 || undefined } } } }
  const cRes = await mutate([newAd], 'adGroupAds')
  if (!cRes?.results) { console.log('  CREATE FAIL: ' + JSON.stringify(cRes).slice(0, 300)); continue }
  console.log('  created new RSA -> ' + LANDING)

  // 2. remove the old RSA (old URLs) so only the /unilift one serves
  const rRes = await mutate([{ remove: { resourceName: oldRn } }], 'adGroupAds')
  console.log('  ' + (rRes?.results ? 'removed old RSA' : 'REMOVE FAIL ' + JSON.stringify(rRes).slice(0, 200)))
}
console.log('\n=== DONE ===')
