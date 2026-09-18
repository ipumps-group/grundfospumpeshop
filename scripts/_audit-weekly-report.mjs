// Kiire audit nädalaraporti teemadel: eelarved, laiendused, RSA pealkirjad
import { readFileSync } from 'fs'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'
const __dirname = dirname(fileURLToPath(import.meta.url))
try {
  const content = readFileSync(resolve(__dirname, '..', '.env.local'), 'utf-8')
  for (const line of content.split('\n')) { const t = line.trim(); if (t && !t.startsWith('#')) { const eq = t.indexOf('='); if (eq > 0) { const k = t.slice(0, eq); let v = t.slice(eq + 1); if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1); process.env[k] = v } } }
} catch {}
const CUST = (process.env.GOOGLE_ADS_CUSTOMER_ID || '').replace(/-/g, ''), LOGIN = (process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID || '').replace(/-/g, ''), DEV = process.env.GOOGLE_ADS_DEVELOPER_TOKEN
async function token() { const p = new URLSearchParams({ client_id: process.env.GOOGLE_ADS_CLIENT_ID, client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET, refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN, grant_type: 'refresh_token' }); const r = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: p.toString() }); const d = await r.json(); if (!d.access_token) throw new Error('OAuth failed'); return d.access_token }
async function gaql(q) { const tk = await token(); const hd = { Authorization: 'Bearer ' + tk, 'developer-token': DEV, 'Content-Type': 'application/json' }; if (LOGIN) hd['login-customer-id'] = LOGIN; const r = await fetch(`https://googleads.googleapis.com/v24/customers/${CUST}/googleAds:search`, { method: 'POST', headers: hd, body: JSON.stringify({ query: q }) }); const d = await r.json(); if (!r.ok) { console.error('API err:', JSON.stringify(d).slice(0, 300)); return [] } return d.results || [] }

console.log('=== EELARVED ===')
const camps = await gaql(`SELECT campaign.name, campaign.status, campaign_budget.amount_micros FROM campaign WHERE campaign.status = 'ENABLED'`)
for (const c of camps) console.log(`  ${c.campaign.name}: ${(Number(c.campaignBudget.amountMicros) / 1e6).toFixed(2)} €/päev`)

console.log('\n=== LAIENDUSED (sitelink / callout) ===')
const assets = await gaql(`SELECT asset.name, asset.type, asset.sitelink_asset.link_text, asset.callout_asset.callout_text FROM asset WHERE asset.type IN ('SITELINK','CALLOUT')`)
console.log(`  kontol kokku: ${assets.length}`)
for (const a of assets) console.log(`  [${a.asset.type}] ${a.asset.sitelinkAsset?.linkText || a.asset.calloutAsset?.calloutText || a.asset.name}`)
const links = await gaql(`SELECT campaign.name, campaign_asset.asset, asset.type FROM campaign_asset WHERE asset.type IN ('SITELINK','CALLOUT')`)
console.log(`  kampaania-sidemed: ${links.length}`)
for (const l of links) console.log(`    ${l.campaign?.name} -> ${l.asset?.type}`)

console.log('\n=== RSA pealkirjad: Drenaaž ja tühjendus ===')
const ads = await gaql(`SELECT ad_group.name, ad_group_ad.ad.responsive_search_ad.headlines, ad_group_ad.status FROM ad_group_ad WHERE ad_group.name LIKE '%Drenaaž ja t%' AND ad_group_ad.status = 'ENABLED'`)
for (const a of ads) {
  console.log(`  [${a.adGroup.name}]`)
  for (const h of a.adGroupAd.ad.responsiveSearchAd.headlines) console.log(`    - ${h.text}`)
}
console.log('\n=== RSA pealkirjad: Unilift CC - mudelid ===')
const ads2 = await gaql(`SELECT ad_group.name, ad_group_ad.ad.responsive_search_ad.headlines, ad_group_ad.status FROM ad_group_ad WHERE ad_group.name LIKE '%Unilift CC - mudelid%' AND ad_group_ad.status = 'ENABLED'`)
for (const a of ads2) {
  for (const h of a.adGroupAd.ad.responsiveSearchAd.headlines) console.log(`    - ${h.text}`)
}
