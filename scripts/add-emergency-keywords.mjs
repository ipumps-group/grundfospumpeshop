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
const AD_GROUP = 'Drenaaž ja tühjendus'
const NEW_KEYWORDS = [
  'üleujutus',
  'üleujutuse pump',
  'kelder vett täis',
  'kelder täis vett',
  'vihmavee pump',
  'vihmavesi pump',
  'drenaažitööd',
  'drenaažitööde pump',
  'veekahju pump',
]

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

async function mutate(ops, ep) {
  const tk = await token()
  const hd = { Authorization: 'Bearer ' + tk, 'developer-token': DEV, 'Content-Type': 'application/json' }
  if (LOGIN) hd['login-customer-id'] = LOGIN
  const r = await fetch(`https://googleads.googleapis.com/${V}/customers/${CUST}/${ep}:mutate`, { method: 'POST', headers: hd, body: JSON.stringify({ operations: ops }) })
  return await r.json()
}

async function main() {
  console.log(`=== Adding emergency/weather keywords to "${AD_GROUP}" ===`)
  const ag = await gaql(`SELECT ad_group.resource_name FROM ad_group WHERE campaign.name = "${CAMPAIGN}" AND ad_group.name = "${AD_GROUP}"`)
  const agRn = ag[0]?.adGroup?.resourceName
  if (!agRn) { console.log('Ad group not found'); process.exit(1) }
  console.log('Ad group: ' + agRn)

  const existing = await gaql(`SELECT ad_group_criterion.keyword.text FROM keyword_view WHERE ad_group.resource_name = "${agRn}" AND ad_group_criterion.status != "REMOVED"`)
  const have = new Set(existing.map(r => (r.adGroupCriterion?.keyword?.text || '').toLowerCase()))
  const toAdd = NEW_KEYWORDS.filter(t => !have.has(t.toLowerCase()))
  console.log(`Existing: ${have.size} | to add: ${toAdd.length}`)

  if (toAdd.length > 0) {
    const ops = toAdd.map(t => ({ create: { adGroup: agRn, status: 'ENABLED', keyword: { text: t, matchType: 'PHRASE' } } }))
    const res = await mutate(ops, 'adGroupCriteria')
    const ok = res?.results?.length || 0
    if (ok !== toAdd.length) console.log('FAIL: ' + JSON.stringify(res?.error?.details?.[0]?.errors?.[0]?.message || res?.error || res).slice(0, 300))
    else for (const t of toAdd) console.log('  + "' + t + '" [PHRASE]')
    console.log(`Added ${ok}/${toAdd.length}`)
  }
  console.log('=== DONE ===')
}
main().catch(e => { console.error(e.message); process.exit(1) })
