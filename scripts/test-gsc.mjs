/** GSC service-account check: 1) JWT->token exchange (validates email+key), 2) query pumbapood.ee (needs the SA added as GSC user). */
import { readFileSync } from 'fs'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'
import { createSign } from 'crypto'

const __dirname = dirname(fileURLToPath(import.meta.url))
const env = {}
for (const line of readFileSync(resolve(__dirname, '..', '.env.local'), 'utf-8').split('\n')) {
  const t = line.trim()
  if (t && !t.startsWith('#')) {
    const eq = t.indexOf('=')
    if (eq > 0) env[t.slice(0, eq)] = t.slice(eq + 1).replace(/^["']|["']$/g, '')
  }
}

const email = env.GSC_SERVICE_ACCOUNT_EMAIL
const key = env.GSC_SERVICE_ACCOUNT_KEY
const siteUrl = env.GSC_SITE_URL || env.NEXT_PUBLIC_SITE_URL || 'https://pumbapood.ee'

if (!email || !key) { console.error('GSC_SERVICE_ACCOUNT_EMAIL / GSC_SERVICE_ACCOUNT_KEY missing in .env.local'); process.exit(1) }
console.log('1/3 service account:', email)

const now = Math.floor(Date.now() / 1000)
const claims = { iss: email, scope: 'https://www.googleapis.com/auth/webmasters.readonly', aud: 'https://oauth2.googleapis.com/token', exp: now + 3600, iat: now }
const sign = createSign('RSA-SHA256')
const jwtBase = `${Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url')}.${Buffer.from(JSON.stringify(claims)).toString('base64url')}`
sign.update(jwtBase)
const jwt = `${jwtBase}.${sign.sign(key.replace(/\\n/g, '\n'), 'base64url')}`

const tokRes = await fetch('https://oauth2.googleapis.com/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: jwt }).toString(),
})
const tok = await tokRes.json()
if (!tok.access_token) {
  console.error('2/3 TOKEN EXCHANGE FAILED (key pair invalid):', JSON.stringify(tok).slice(0, 300))
  process.exit(1)
}
console.log('2/3 access token OK — email+key pair is valid')

const q = await fetch(`https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`, {
  method: 'POST',
  headers: { Authorization: `Bearer ${tok.access_token}`, 'Content-Type': 'application/json' },
  body: JSON.stringify({ startDate: '2026-09-03', endDate: '2026-09-16', dimensions: ['query'], rowLimit: 5 }),
})
const body = await q.text()
if (!q.ok) {
  console.log(`3/3 GSC query HTTP ${q.status}:`, body.slice(0, 300))
  if (q.status === 403 || q.status === 401) {
    console.log('\n=> Key is VALID but the service account is not a user on the GSC property yet.')
    console.log('   When you can: Search Console → pumbapood.ee → Settings → Users and permissions → Add user →', email, '(Restricted)')
  }
  process.exit(2)
}
const data = JSON.parse(body)
console.log('3/3 GSC QUERY WORKS — sample rows:', JSON.stringify((data.rows ?? []).slice(0, 5)).slice(0, 500))
process.exit(0)
