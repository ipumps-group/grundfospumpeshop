// ALPHA GO küttekampaania — Google Ads AVALDAMINE (PAUSED -> ENABLED)
// Loeb kampaania + reklaamirühmad + RSA-d ning seab staatuse ENABLED.
import { readFileSync } from 'fs'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
try {
  const content = readFileSync(resolve(__dirname, '..', '.env.local'), 'utf-8')
  for (const line of content.split('\n')) {
    const t = line.trim()
    if (t && !t.startsWith('#')) {
      const eq = t.indexOf('=')
      if (eq > 0) { const k = t.slice(0, eq); let v = t.slice(eq + 1); if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1); process.env[k] = v }
    }
  }
} catch {}

const CUST = (process.env.GOOGLE_ADS_CUSTOMER_ID || '2639481819').replace(/-/g, '')
const LOGIN = (process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID || '').replace(/-/g, '')
const V = 'v24', DEV = process.env.GOOGLE_ADS_DEVELOPER_TOKEN

const CAMPAIGN_NAME = 'ALPHA GO - Küte - EE 2026 sügis'
const DRY_RUN = process.argv.includes('--dry-run')

async function token() {
  const p = new URLSearchParams({ client_id: process.env.GOOGLE_ADS_CLIENT_ID, client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET, refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN, grant_type: 'refresh_token' })
  const r = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: p.toString() })
  const d = await r.json()
  if (!d.access_token) throw new Error('OAuth failed: ' + JSON.stringify(d))
  return d.access_token
}

async function gaql(q) {
  const tk = await token()
  const hd = { Authorization: 'Bearer ' + tk, 'developer-token': DEV, 'Content-Type': 'application/json' }
  if (LOGIN) hd['login-customer-id'] = LOGIN
  const r = await fetch(`https://googleads.googleapis.com/${V}/customers/${CUST}/googleAds:search`, { method: 'POST', headers: hd, body: JSON.stringify({ query: q }) })
  const d = await r.json()
  if (d.error) throw new Error('GAQL failed: ' + JSON.stringify(d.error).slice(0, 400))
  return d.results || []
}

async function mutate(ops, ep) {
  const tk = await token()
  const hd = { Authorization: 'Bearer ' + tk, 'developer-token': DEV, 'Content-Type': 'application/json' }
  if (LOGIN) hd['login-customer-id'] = LOGIN
  const r = await fetch(`https://googleads.googleapis.com/${V}/customers/${CUST}/${ep}:mutate`, { method: 'POST', headers: hd, body: JSON.stringify({ operations: ops }) })
  return await r.json()
}

async function enableAll(rows, ep, label) {
  const paused = rows.filter(r => r.status === 'PAUSED')
  if (paused.length === 0) { console.log(`  ${label}: nothing PAUSED (${rows.length} already enabled)`); return true }
  if (DRY_RUN) { console.log(`  ${label}: DRY-RUN would enable ${paused.length}/${rows.length}`); return true }
  const ops = paused.map(r => ({ update: { resourceName: r.rn, status: 'ENABLED' }, updateMask: 'status' }))
  const res = await mutate(ops, ep)
  const ok = res?.results?.length || 0
  if (ok !== paused.length) {
    const msg = res?.error?.details?.[0]?.errors?.[0]?.message || res?.error?.message || JSON.stringify(res)
    console.log(`  FAIL ${label}: ${String(msg).slice(0, 300)}`)
    return false
  }
  console.log(`  ${label}: enabled ${ok}/${rows.length}`)
  return true
}

async function main() {
  console.log('=== PUBLISH (Google Ads): ' + CAMPAIGN_NAME + (DRY_RUN ? ' [DRY-RUN]' : '') + ' ===\n')

  // 1. Campaign
  const camps = await gaql(`SELECT campaign.resource_name, campaign.name, campaign.status FROM campaign WHERE campaign.name = "${CAMPAIGN_NAME}"`)
  if (camps.length === 0) { console.log('Campaign NOT FOUND — run scripts/create-alpha-go-google.mjs first'); process.exit(1) }
  const camp = camps[0].campaign
  console.log(`Campaign: ${camp.resourceName}`)
  console.log(`  status: ${camp.status}`)

  // 2. Ad groups
  const ags = await gaql(`SELECT ad_group.resource_name, ad_group.name, ad_group.status FROM ad_group WHERE campaign.resource_name = "${camp.resourceName}" AND ad_group.status != "REMOVED"`)
  console.log(`Ad groups: ${ags.length}`)
  for (const a of ags) console.log(`  - ${a.adGroup.name}: ${a.adGroup.status}`)

  // 3. RSAs
  const ads = await gaql(`SELECT ad_group_ad.resource_name, ad_group_ad.status, ad_group_ad.ad.id FROM ad_group_ad WHERE campaign.resource_name = "${camp.resourceName}" AND ad_group_ad.status != "REMOVED"`)
  console.log(`Ads (RSA): ${ads.length}`)

  const campRows = camps.map(c => ({ rn: c.campaign.resourceName, status: c.campaign.status }))
  const agRows = ags.map(a => ({ rn: a.adGroup.resourceName, status: a.adGroup.status }))
  const adRows = ads.map(a => ({ rn: a.adGroupAd.resourceName, status: a.adGroupAd.status }))

  console.log('\nEnabling...')
  let ok = true
  ok = (await enableAll(campRows, 'campaigns', 'campaign')) && ok
  ok = (await enableAll(agRows, 'adGroups', 'ad groups')) && ok
  ok = (await enableAll(adRows, 'adGroupAds', 'ads')) && ok
  if (!ok) { console.log('\n=== PARTIAL FAILURE — check errors above ==='); process.exit(1) }

  if (!DRY_RUN) {
    const verify = await gaql(`SELECT campaign.status FROM campaign WHERE campaign.name = "${CAMPAIGN_NAME}"`)
    console.log(`\nVERIFY: campaign status = ${verify[0]?.campaign?.status}`)
  }
  console.log('\n=== DONE ===')
}
main().catch(e => { console.error(e.message); process.exit(1) })
