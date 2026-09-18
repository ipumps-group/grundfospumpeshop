/**
 * Verify which OAuth scopes the current GOOGLE_ADS_REFRESH_TOKEN in
 * .env.local actually carries. Run: node scripts/check-token-scopes.mjs
 */
import { readFileSync } from 'fs'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const env = {}
for (const line of readFileSync(resolve(__dirname, '..', '.env.local'), 'utf-8').split('\n')) {
  const t = line.trim()
  if (t && !t.startsWith('#')) {
    const eq = t.indexOf('=')
    if (eq > 0) env[t.slice(0, eq)] = t.slice(eq + 1).replace(/^["']|["']$/g, '')
  }
}

const rt = env.GOOGLE_ADS_REFRESH_TOKEN
console.log(`Token in .env.local: ${rt.slice(0, 6)}… (length ${rt.length})`)

const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({
    client_id: env.GOOGLE_ADS_CLIENT_ID,
    client_secret: env.GOOGLE_ADS_CLIENT_SECRET,
    refresh_token: rt,
    grant_type: 'refresh_token',
  }).toString(),
})
const tokenData = await tokenRes.json()
if (!tokenData.access_token) {
  console.error('TOKEN EXCHANGE FAILED:', JSON.stringify(tokenData))
  process.exit(1)
}

const info = await (await fetch(`https://oauth2.googleapis.com/tokeninfo?access_token=${tokenData.access_token}`)).json()
const scopes = (info.scope ?? '').split(' ').filter(Boolean)
console.log('\nScopes granted to this token:')
for (const s of scopes) console.log(`  - ${s}`)

const hasAds = scopes.includes('https://www.googleapis.com/auth/adwords')
const hasGa4 = scopes.includes('https://www.googleapis.com/auth/analytics.readonly')
console.log(`\nadwords (Google Ads):       ${hasAds ? 'YES' : 'MISSING'}`)
console.log(`analytics.readonly (GA4):   ${hasGa4 ? 'YES' : 'MISSING — re-run: node scripts/get-google-ads-token.mjs'}`)
process.exit(hasAds && hasGa4 ? 0 : 2)
