/**
 * One-off: mint a new Google OAuth refresh token with BOTH scopes the weekly
 * report needs (Google Ads + GA4 read), using the existing OAuth client.
 *
 * Flow: starts a localhost listener -> opens the consent screen in your browser
 * -> you log in with the Google account that has access to BOTH the GA4
 * property and the Google Ads account -> script exchanges the code, saves the
 * refresh token into .env.local and verifies GA4 + Ads access.
 *
 * Run: node scripts/get-google-refresh-token.mjs
 *
 * If Google shows "redirect_uri_mismatch": add http://localhost:8899 as an
 * authorized redirect URI on the OAuth client in Google Cloud Console, retry.
 */
import http from 'http'
import { readFileSync, writeFileSync } from 'fs'
import { exec } from 'child_process'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const envPath = resolve(__dirname, '..', '.env.local')
const env = {}
for (const line of readFileSync(envPath, 'utf-8').split('\n')) {
  const t = line.trim()
  if (t && !t.startsWith('#')) {
    const eq = t.indexOf('=')
    if (eq > 0) env[t.slice(0, eq)] = t.slice(eq + 1).replace(/^["']|["']$/g, '')
  }
}

const PORT = 8899
const REDIRECT = `http://localhost:${PORT}`
const SCOPES = [
  'https://www.googleapis.com/auth/adwords',
  'https://www.googleapis.com/auth/analytics.readonly',
].join(' ')

if (!env.GOOGLE_ADS_CLIENT_ID || !env.GOOGLE_ADS_CLIENT_SECRET) {
  console.error('GOOGLE_ADS_CLIENT_ID / GOOGLE_ADS_CLIENT_SECRET missing in .env.local')
  process.exit(1)
}

const authUrl =
  'https://accounts.google.com/o/oauth2/v2/auth?' +
  new URLSearchParams({
    client_id: env.GOOGLE_ADS_CLIENT_ID,
    redirect_uri: REDIRECT,
    response_type: 'code',
    scope: SCOPES,
    access_type: 'offline',
    prompt: 'consent', // force a fresh refresh token even if granted before
  }).toString()

let done = false
const server = http.createServer(async (req, res) => {
  const url = new URL(req.url ?? '/', REDIRECT)
  const error = url.searchParams.get('error')
  const code = url.searchParams.get('code')

  if (error) {
    res.end(`Authorization failed: ${error}. You can close this tab.`)
    finish(1, `Google returned error: ${error}`)
    return
  }
  if (!code || done) {
    res.end('Waiting for authorization...')
    return
  }
  done = true

  try {
    console.log('Authorization code received, exchanging for tokens...')
    const tokRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: env.GOOGLE_ADS_CLIENT_ID,
        client_secret: env.GOOGLE_ADS_CLIENT_SECRET,
        code,
        grant_type: 'authorization_code',
        redirect_uri: REDIRECT,
      }).toString(),
    })
    const tokens = await tokRes.json()
    if (!tokens.refresh_token) {
      res.end('Token exchange failed - see terminal.')
      finish(1, `Token exchange failed: ${JSON.stringify(tokens).slice(0, 400)}`)
      return
    }
    console.log('Refresh token received.')

    // Save into .env.local
    const content = readFileSync(envPath, 'utf-8')
    const updated = content.replace(
      /^GOOGLE_ADS_REFRESH_TOKEN=.*$/m,
      `GOOGLE_ADS_REFRESH_TOKEN=${tokens.refresh_token}`,
    )
    writeFileSync(envPath, updated)
    console.log('.env.local updated: GOOGLE_ADS_REFRESH_TOKEN')

    // Verify: mint an access token and hit GA4 + Google Ads
    const at = await getAccessToken(tokens.refresh_token)
    await verifyGa4(at)
    await verifyAds(at)

    res.end('All done! New refresh token saved and verified. You can close this tab.')
    finish(0, 'SUCCESS')
  } catch (err) {
    res.end('Error - see terminal.')
    finish(1, String(err))
  }
})

function finish(code, msg) {
  console.log(msg)
  setTimeout(() => process.exit(code), 500)
}

async function getAccessToken(refreshToken) {
  const r = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: env.GOOGLE_ADS_CLIENT_ID,
      client_secret: env.GOOGLE_ADS_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type: 'refresh_token',
    }).toString(),
  })
  const d = await r.json()
  if (!d.access_token) throw new Error(`refresh-token exchange failed: ${JSON.stringify(d).slice(0, 300)}`)
  return d.access_token
}

async function verifyGa4(accessToken) {
  const propertyId = env.GA4_PROPERTY_ID
  if (!propertyId) { console.log('GA4_PROPERTY_ID not set, skipping GA4 verify'); return }
  const r = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      dateRanges: [{ startDate: '7daysAgo', endDate: 'yesterday' }],
      metrics: [{ name: 'sessions' }],
      limit: 1,
    }),
  })
  if (r.ok) {
    const d = await r.json()
    console.log(`GA4 OK — sessions (last 7d): ${d.rows?.[0]?.metricValues?.[0]?.value ?? '0'}`)
  } else {
    console.log(`GA4 FAILED (${r.status}): ${(await r.text()).slice(0, 300)}`)
  }
}

async function verifyAds(accessToken) {
  const devToken = env.GOOGLE_ADS_DEVELOPER_TOKEN
  if (!devToken) { console.log('GOOGLE_ADS_DEVELOPER_TOKEN not set, skipping Ads verify'); return }
  const r = await fetch('https://googleads.googleapis.com/v24/customers:listAccessibleCustomers', {
    headers: { Authorization: `Bearer ${accessToken}`, 'developer-token': devToken },
  })
  if (r.ok) {
    const d = await r.json()
    console.log(`Google Ads OK — accessible customers: ${(d.resourceNames ?? []).join(', ') || '(none)'}`)
  } else {
    console.log(`Google Ads FAILED (${r.status}): ${(await r.text()).slice(0, 300)}`)
  }
}

server.listen(PORT, () => {
  console.log(`\nListening on ${REDIRECT}`)
  console.log('Opening the Google consent screen in your browser...')
  console.log('Log in with the Google account that has access to BOTH the GA4 property AND the Google Ads account.\n')
  console.log(`If the browser did not open, visit:\n${authUrl}\n`)
  exec(`start "" "${authUrl}"`)
})

setTimeout(() => { console.error('Timed out waiting for authorization (5 min)'); process.exit(1) }, 5 * 60 * 1000)
