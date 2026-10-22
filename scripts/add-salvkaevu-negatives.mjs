// Kliendi otsus 22.10.2026: „salvkaevu" päringud Adsis välja — raha ALPHA GO-le.
//   1) Brändikampaaniale (23988914605) negatiivsed BROAD märksõnad „salvkaevu" + „salvkaevupump"
//      (päring „grundfos salvkaevu pump" kulus 4,20 € / 0 konv nädalas 12.–18.10; teenis seda
//      phrase-märksõna „grundfos pump", mida EI TOHI pausutada — põhimärksõna).
//   2) Vana pausitud kampaania inertne märksõna „salvkaevu pump" (criterion 329537193776)
//      pannakse samuti PAUSED — et kampaania juhuslikul taasaktiveerimisel see ei teeniks.
// Kasutus: node scripts/add-salvkaevu-negatives.mjs [--dry-run]
// Idempotentne — olemasolevad negatiivsed / juba pausitud märksõnad jäetakse vahele.
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

const DRY = process.argv.includes('--dry-run')
const BRAND_CAMPAIGN = '23988914605'
const NEGATIVES = ['salvkaevu', 'salvkaevupump']
const OLD_KEYWORD = { adGroupId: '200719799961', criterionId: '329537193776', text: 'salvkaevu pump' }

const CUST = (process.env.GOOGLE_ADS_CUSTOMER_ID || '2639481819').replace(/-/g, '')
const LOGIN = (process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID || '').replace(/-/g, '')
const DEV = process.env.GOOGLE_ADS_DEVELOPER_TOKEN

async function gToken() {
  const p = new URLSearchParams({ client_id: process.env.GOOGLE_ADS_CLIENT_ID, client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET, refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN, grant_type: 'refresh_token' })
  const r = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: p.toString() })
  const d = await r.json()
  if (!d.access_token) throw new Error('Google OAuth failed')
  return d.access_token
}
async function gHeaders() {
  const h = { Authorization: 'Bearer ' + (await gToken()), 'developer-token': DEV, 'Content-Type': 'application/json' }
  if (LOGIN) h['login-customer-id'] = LOGIN
  return h
}
async function gaql(q) {
  const r = await fetch(`https://googleads.googleapis.com/v24/customers/${CUST}/googleAds:search`, { method: 'POST', headers: await gHeaders(), body: JSON.stringify({ query: q }) })
  const d = await r.json()
  if (!r.ok) throw new Error('GAQL: ' + JSON.stringify(d).slice(0, 400))
  return d.results || []
}

console.log(DRY ? '=== DRY RUN ===' : '=== LIVE ===')

// --- 1) Negatiivsed märksõnad brändikampaaniale ---
const existing = await gaql(`SELECT campaign_criterion.keyword.text FROM campaign_criterion WHERE campaign.id = ${BRAND_CAMPAIGN} AND campaign_criterion.negative = TRUE`)
const have = new Set(existing.map((r) => (r.campaignCriterion?.keyword?.text || '').toLowerCase()))
const missing = NEGATIVES.filter((n) => !have.has(n))
if (missing.length === 0) {
  console.log('Negatiivsed „salvkaevu"/„salvkaevupump" juba olemas — vahele')
} else {
  console.log(`Lisan negatiivsed (BROAD) brändikampaaniale: ${missing.map((m) => `„${m}"`).join(', ')}`)
  if (!DRY) {
    const r = await fetch(`https://googleads.googleapis.com/v24/customers/${CUST}/campaignCriteria:mutate`, {
      method: 'POST',
      headers: await gHeaders(),
      body: JSON.stringify({
        operations: missing.map((text) => ({
          create: {
            campaign: `customers/${CUST}/campaigns/${BRAND_CAMPAIGN}`,
            negative: true,
            keyword: { text, matchType: 'BROAD' },
          },
        })),
      }),
    })
    const d = await r.json()
    if (!r.ok) throw new Error('Negatiivsete lisamine ebaõnnestus: ' + JSON.stringify(d).slice(0, 400))
    console.log('  → OK')
  }
}

// --- 2) Vana kampaania inertne „salvkaevu pump" märksõna → PAUSED ---
const kw = await gaql(`SELECT ad_group_criterion.status FROM ad_group_criterion WHERE ad_group.id = ${OLD_KEYWORD.adGroupId} AND ad_group_criterion.criterion_id = ${OLD_KEYWORD.criterionId}`)
const st = kw[0]?.adGroupCriterion?.status
if (st === 'PAUSED' || st === 'REMOVED') {
  console.log(`Vana märksõna „${OLD_KEYWORD.text}" on juba ${st} — vahele`)
} else {
  console.log(`Pausutan vana kampaania märksõna „${OLD_KEYWORD.text}" (praegu ${st})`)
  if (!DRY) {
    const rn = `customers/${CUST}/adGroupCriteria/${OLD_KEYWORD.adGroupId}~${OLD_KEYWORD.criterionId}`
    const r = await fetch(`https://googleads.googleapis.com/v24/customers/${CUST}/adGroupCriteria:mutate`, {
      method: 'POST',
      headers: await gHeaders(),
      body: JSON.stringify({ operations: [{ update: { resourceName: rn, status: 'PAUSED' }, updateMask: 'status' }] }),
    })
    const d = await r.json()
    if (!r.ok) throw new Error('Märksõna pausutamine ebaõnnestus: ' + JSON.stringify(d).slice(0, 400))
    console.log('  → OK, status=PAUSED')
  }
}
console.log('DONE')
