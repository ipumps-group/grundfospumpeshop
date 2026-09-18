// Read-only audit: list landing URLs of all ads in the ALPHA GO and UNILIFT campaigns
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
async function gaql(q) { const tk = await token(); const hd = { Authorization: 'Bearer ' + tk, 'developer-token': DEV, 'Content-Type': 'application/json' }; if (LOGIN) hd['login-customer-id'] = LOGIN; const r = await fetch(`https://googleads.googleapis.com/v24/customers/${CUST}/googleAds:search`, { method: 'POST', headers: hd, body: JSON.stringify({ query: q }) }); const j = await r.json(); if (j.error) console.error('GAQL ERR', JSON.stringify(j.error).slice(0, 300)); return j.results || [] }

const GOOGLE_CAMPAIGNS = ['Unilift CC + Drenaaž - EE 2026 sügis', 'ALPHA GO - Küte - EE 2026 sügis']

console.log('════════ GOOGLE ADS ════════')
for (const c of GOOGLE_CAMPAIGNS) {
  console.log(`\n### ${c}`)
  const rows = await gaql(`SELECT ad_group.name, ad_group_ad.ad.id, ad_group_ad.status, ad_group_ad.ad.final_urls, ad_group_ad.ad.responsive_search_ad.path1, ad_group_ad.ad.responsive_search_ad.path2 FROM ad_group_ad WHERE campaign.name = "${c}" AND ad_group_ad.status != "REMOVED"`)
  if (rows.length === 0) console.log('  (no ads)')
  for (const r of rows) console.log(`  ${r.adGroupAd.status}  ${r.adGroup?.name}  ad#${r.adGroupAd?.ad?.id}  ->  ${JSON.stringify(r.adGroupAd?.ad?.finalUrls)}  path: ${r.adGroupAd?.ad?.responsiveSearchAd?.path1}/${r.adGroupAd?.ad?.responsiveSearchAd?.path2}`)
}

// ── Meta ──
const TOKEN = process.env.META_ACCESS_TOKEN
const ACCT = (process.env.META_AD_ACCOUNT_ID || '').replace('act_', '')
const V = process.env.META_GRAPH_API_VERSION || 'v25.0'
const BASE = `https://graph.facebook.com/${V}`
async function api(p) { const r = await fetch(`${BASE}/${p}${p.includes('?') ? '&' : '?'}access_token=${TOKEN}`); return r.json() }

const META_CAMPAIGNS = { '120253843650360120': 'UNILIFT Meta', '120253844082790120': 'ALPHA GO Meta' }

console.log('\n════════ META ADS ════════')
for (const [id, label] of Object.entries(META_CAMPAIGNS)) {
  console.log(`\n### ${label} (${id})`)
  const d = await api(`${id}/ads?fields=name,status,adset{name},creative{id,name,object_story_spec{page_id,link_data{link,name,call_to_action}}}&limit=100`)
  const ads = d.data || []
  if (ads.length === 0) console.log('  (no ads)', JSON.stringify(d).slice(0, 200))
  for (const a of ads) {
    const ld = a.creative?.object_story_spec?.link_data || {}
    console.log(`  ${a.status}  [${a.adset?.name}] ${a.name}`)
    console.log(`      link: ${ld.link}`)
    console.log(`      cta : ${ld.call_to_action?.type} -> ${ld.call_to_action?.value?.link}`)
  }
}
process.exit(0)
