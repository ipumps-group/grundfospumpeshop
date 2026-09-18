// Cleanup: remove old ALPHA GO RSAs still pointing at /et/tooted/kuttepumbad
import { readFileSync } from 'fs'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'
const __dirname = dirname(fileURLToPath(import.meta.url))
try {
  const content = readFileSync(resolve(__dirname, '..', '.env.local'), 'utf-8')
  for (const line of content.split('\n')) { const t = line.trim(); if (t && !t.startsWith('#')) { const eq = t.indexOf('='); if (eq > 0) { const k = t.slice(0, eq); let v = t.slice(eq + 1); if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1); process.env[k] = v } } }
} catch {}
const CUST = (process.env.GOOGLE_ADS_CUSTOMER_ID || '').replace(/-/g, ''), LOGIN = (process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID || '').replace(/-/g, ''), DEV = process.env.GOOGLE_ADS_DEVELOPER_TOKEN
async function token() { const p = new URLSearchParams({ client_id: process.env.GOOGLE_ADS_CLIENT_ID, client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET, refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN, grant_type: 'refresh_token' }); const r = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: p.toString() }); const d = await r.json(); if (!d.access_token) throw new Error('OAuth failed'); return d.access_token }
async function gaql(q) { const tk = await token(); const hd = { Authorization: 'Bearer ' + tk, 'developer-token': DEV, 'Content-Type': 'application/json' }; if (LOGIN) hd['login-customer-id'] = LOGIN; const r = await fetch(`https://googleads.googleapis.com/v24/customers/${CUST}/googleAds:search`, { method: 'POST', headers: hd, body: JSON.stringify({ query: q }) }); return (await r.json()).results || [] }
async function mutate(ops, ep) { const tk = await token(); const hd = { Authorization: 'Bearer ' + tk, 'developer-token': DEV, 'Content-Type': 'application/json' }; if (LOGIN) hd['login-customer-id'] = LOGIN; const r = await fetch(`https://googleads.googleapis.com/v24/customers/${CUST}/${ep}:mutate`, { method: 'POST', headers: hd, body: JSON.stringify({ operations: ops }) }); return await r.json() }

const rows = await gaql('SELECT ad_group.name, ad_group_ad.resource_name, ad_group_ad.ad.final_urls FROM ad_group_ad WHERE campaign.name = "ALPHA GO - Küte - EE 2026 sügis" AND ad_group_ad.status != "REMOVED" AND ad_group_ad.ad.type = "RESPONSIVE_SEARCH_AD"')
for (const r of rows) {
  const url = (r.adGroupAd?.ad?.finalUrls || [])[0] || ''
  if (url === 'https://pumbapood.ee/alpha-go') { console.log(`  KEEP  ${r.adGroup?.name} -> ${url}`); continue }
  console.log(`  REMOVE ${r.adGroup?.name} -> ${url}`)
  const res = await mutate([{ remove: r.adGroupAd.resourceName }], 'adGroupAds')
  console.log('    ' + (res?.results ? 'removed' : 'FAIL ' + JSON.stringify(res).slice(0, 250)))
}
process.exit(0)
