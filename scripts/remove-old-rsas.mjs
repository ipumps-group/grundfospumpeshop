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
const CAMPAIGN = 'Unilift CC + Drenaaž - EE 2026 sügis'

async function token() {
  const p = new URLSearchParams({ client_id: process.env.GOOGLE_ADS_CLIENT_ID, client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET, refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN, grant_type: 'refresh_token' })
  const d = await (await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: p.toString() })).json()
  if (!d.access_token) throw new Error('OAuth failed')
  return d.access_token
}

async function gaql(q) {
  const tk = await token()
  const hd = { Authorization: 'Bearer ' + tk, 'developer-token': DEV, 'Content-Type': 'application/json' }
  if (LOGIN) hd['login-customer-id'] = LOGIN
  const r = await fetch(`https://googleads.googleapis.com/${V}/customers/${CUST}/googleAds:search`, { method: 'POST', headers: hd, body: JSON.stringify({ query: q }) })
  return (await r.json()).results || []
}

async function main() {
  const ads = await gaql(`SELECT ad_group_ad.resource_name, ad_group.name, ad_group_ad.ad.final_urls FROM ad_group_ad WHERE campaign.name = "${CAMPAIGN}" AND ad_group_ad.status != "REMOVED"`)
  console.log(`Found ${ads.length} non-removed ads`)
  const tk = await token()
  for (const r of ads) {
    const url = (r.adGroupAd.ad?.finalUrls || [])[0] || ''
    if (!url.includes('/et/')) { console.log(`  KEEP  ${r.adGroup.name} -> ${url}`); continue }
    const hd = { Authorization: 'Bearer ' + tk, 'developer-token': DEV, 'Content-Type': 'application/json' }
    if (LOGIN) hd['login-customer-id'] = LOGIN
    const res = await fetch(`https://googleads.googleapis.com/${V}/customers/${CUST}/adGroupAds:mutate`, {
      method: 'POST', headers: hd,
      body: JSON.stringify({ operations: [{ remove: r.adGroupAd.resourceName }] }),
    })
    const body = await res.json()
    console.log(res.ok ? `  REMOVED ${r.adGroup.name} (${url})` : `  FAIL ${r.adGroup.name}: ` + JSON.stringify(body?.error?.details?.[0]?.errors?.[0]?.message || body).slice(0, 250))
  }
}
main().catch(e => { console.error(e.message); process.exit(1) })
