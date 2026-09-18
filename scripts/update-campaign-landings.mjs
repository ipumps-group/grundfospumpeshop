// Point all ALPHA GO campaign ads at the new /alpha-go landing page.
// Google: recreate RSAs with new final URL (final_urls change = new ad + remove old).
// Meta: creatives are immutable -> clone creative with new link, repoint the ad.
// Usage: node scripts/update-campaign-landings.mjs          (dry-run)
//        node scripts/update-campaign-landings.mjs --apply  (live changes)
import { readFileSync } from 'fs'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'
const __dirname = dirname(fileURLToPath(import.meta.url))
try {
  const content = readFileSync(resolve(__dirname, '..', '.env.local'), 'utf-8')
  for (const line of content.split('\n')) { const t = line.trim(); if (t && !t.startsWith('#')) { const eq = t.indexOf('='); if (eq > 0) { const k = t.slice(0, eq); let v = t.slice(eq + 1); if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1); process.env[k] = v } } }
} catch {}

const APPLY = process.argv.includes('--apply')
console.log(APPLY ? '!!! APPLY MODE — live changes !!!' : 'DRY-RUN (pass --apply to execute)')

const GOOGLE_TARGET = 'https://pumbapood.ee/alpha-go'
const META_TARGET = 'https://pumbapood.ee/alpha-go?utm_source=meta&utm_medium=paid&utm_campaign=alpha_go_sygis_2026'
const GOOGLE_CAMPAIGN = 'ALPHA GO - Küte - EE 2026 sügis'
const META_CAMPAIGN_ID = '120253844082790120'

// ── Google Ads ──────────────────────────────────────────────────────────────
const CUST = (process.env.GOOGLE_ADS_CUSTOMER_ID || '').replace(/-/g, ''), LOGIN = (process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID || '').replace(/-/g, ''), DEV = process.env.GOOGLE_ADS_DEVELOPER_TOKEN
async function token() { const p = new URLSearchParams({ client_id: process.env.GOOGLE_ADS_CLIENT_ID, client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET, refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN, grant_type: 'refresh_token' }); const r = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: p.toString() }); const d = await r.json(); if (!d.access_token) throw new Error('OAuth failed'); return d.access_token }
async function gaql(q) { const tk = await token(); const hd = { Authorization: 'Bearer ' + tk, 'developer-token': DEV, 'Content-Type': 'application/json' }; if (LOGIN) hd['login-customer-id'] = LOGIN; const r = await fetch(`https://googleads.googleapis.com/v24/customers/${CUST}/googleAds:search`, { method: 'POST', headers: hd, body: JSON.stringify({ query: q }) }); const j = await r.json(); if (j.error) console.error('GAQL ERR', JSON.stringify(j.error).slice(0, 300)); return j.results || [] }
async function mutate(ops, ep) { const tk = await token(); const hd = { Authorization: 'Bearer ' + tk, 'developer-token': DEV, 'Content-Type': 'application/json' }; if (LOGIN) hd['login-customer-id'] = LOGIN; const r = await fetch(`https://googleads.googleapis.com/v24/customers/${CUST}/${ep}:mutate`, { method: 'POST', headers: hd, body: JSON.stringify({ operations: ops }) }); return await r.json() }

console.log('\n═══ GOOGLE: ' + GOOGLE_CAMPAIGN + ' -> ' + GOOGLE_TARGET + ' ═══')
const rows = await gaql(`SELECT ad_group.name, ad_group.resource_name, ad_group_ad.resource_name, ad_group_ad.ad.final_urls, ad_group_ad.ad.responsive_search_ad.headlines, ad_group_ad.ad.responsive_search_ad.descriptions FROM ad_group_ad WHERE campaign.name = "${GOOGLE_CAMPAIGN}" AND ad_group_ad.status = "ENABLED" AND ad_group_ad.ad.type = "RESPONSIVE_SEARCH_AD"`)
for (const r of rows) {
  const name = r.adGroup?.name
  const current = (r.adGroupAd?.ad?.finalUrls || [])[0] || ''
  if (current === GOOGLE_TARGET) { console.log(`  OK already: ${name}`); continue }
  console.log(`  ${name}: ${current} -> ${GOOGLE_TARGET}`)
  if (!APPLY) continue
  const rsa = r.adGroupAd?.ad?.responsiveSearchAd || {}
  const headlines = (rsa.headlines || []).map(h => ({ text: h.text, pinnedField: h.pinnedField || 'UNSPECIFIED' }))
  const descriptions = (rsa.descriptions || []).map(d => ({ text: d.text }))
  const createOp = { create: { adGroup: r.adGroup.resourceName, status: 'ENABLED', ad: { name: name + ' RSA', type: 'RESPONSIVE_SEARCH_AD', finalUrls: [GOOGLE_TARGET], responsiveSearchAd: { headlines, descriptions, path1: 'alpha-go', path2: 'kuttepumbad' } } } }
  const cRes = await mutate([createOp], 'adGroupAds')
  if (!cRes?.results) { console.log('    CREATE FAIL: ' + JSON.stringify(cRes).slice(0, 300)); continue }
  console.log('    created new RSA')
  const rRes = await mutate([{ remove: { resourceName: r.adGroupAd.resourceName } }], 'adGroupAds')
  console.log('    ' + (rRes?.results ? 'removed old RSA' : 'REMOVE FAIL ' + JSON.stringify(rRes).slice(0, 200)))
}

// ── Meta Ads ────────────────────────────────────────────────────────────────
const TOKEN = process.env.META_ACCESS_TOKEN
const ACCT = (process.env.META_AD_ACCOUNT_ID || '').replace('act_', '')
const PAGE = process.env.META_PAGE_ID
const V = process.env.META_GRAPH_API_VERSION || 'v25.0'
const BASE = `https://graph.facebook.com/${V}`
async function api(path, method = 'GET', body = null) {
  const url = `${BASE}/${path}${path.includes('?') ? '&' : '?'}access_token=${TOKEN}`
  const opt = { method }
  if (body) { opt.headers = { 'Content-Type': 'application/json' }; opt.body = JSON.stringify(body) }
  const r = await fetch(url, opt)
  return { ok: r.ok, data: await r.json() }
}

console.log('\n═══ META: ' + META_CAMPAIGN_ID + ' -> ' + META_TARGET + ' ═══')
const adsRes = await api(`${META_CAMPAIGN_ID}/ads?fields=name,status,creative{id,name,object_story_spec{page_id,link_data}}&limit=100`)
const ads = (adsRes.data?.data || []).filter(a => a.status !== 'DELETED' && a.status !== 'ARCHIVED')
for (const a of ads) {
  const c = a.creative || {}
  const ld = c.object_story_spec?.link_data || {}
  const pageId = c.object_story_spec?.page_id || PAGE
  if (ld.link === META_TARGET) { console.log(`  OK already: ${a.name}`); continue }
  console.log(`  ${a.name}\n    ${ld.link} -> ${META_TARGET}`)
  if (!APPLY) continue
  if (!ld.image_hash) { console.log('    SKIP: no image_hash on creative, manual check needed'); continue }
  const newLd = {
    image_hash: ld.image_hash,
    link: META_TARGET,
    message: ld.message,
    name: ld.name,
    description: ld.description,
    call_to_action: { type: ld.call_to_action?.type || 'LEARN_MORE', value: { link: META_TARGET } },
  }
  const cr = await api(`act_${ACCT}/adcreatives`, 'POST', { name: (c.name || a.name) + ' -> alpha-go', object_story_spec: { page_id: pageId, link_data: newLd } })
  if (!cr.ok) { console.log('    CREATIVE FAIL: ' + JSON.stringify(cr.data).slice(0, 300)); continue }
  const upd = await api(`${a.id}`, 'POST', { creative: { creative_id: cr.data.id } })
  console.log('    ' + (upd.ok ? `new creative ${cr.data.id} assigned` : 'AD UPDATE FAIL ' + JSON.stringify(upd.data).slice(0, 300)))
}
console.log('\n=== DONE ===')
process.exit(0)
