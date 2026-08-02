import { createServer } from 'http'
import { readFileSync, writeFileSync } from 'fs'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'
import { exec } from 'child_process'

const __dirname = dirname(fileURLToPath(import.meta.url))
const envPath = resolve(__dirname, '..', '.env.local')

function loadEnv() {
  const content = readFileSync(envPath, 'utf-8')
  const env = {}
  for (const line of content.split('\n')) {
    const t = line.trim()
    if (t && !t.startsWith('#')) {
      const eq = t.indexOf('=')
      if (eq > 0) {
        const k = t.slice(0, eq)
        let v = t.slice(eq + 1)
        if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1)
        env[k] = v
      }
    }
  }
  return { content, env }
}

function updateEnv(newRefreshToken) {
  const { content } = loadEnv()
  const newContent = content.replace(
    /^GOOGLE_ADS_REFRESH_TOKEN=.*$/m,
    `GOOGLE_ADS_REFRESH_TOKEN=${newRefreshToken}`
  )
  writeFileSync(envPath, newContent, 'utf-8')
  console.log('\n\u2713 .env.local updated with new GOOGLE_ADS_REFRESH_TOKEN')
}

const { env } = loadEnv()
const CLIENT_ID = env.GOOGLE_ADS_CLIENT_ID
const CLIENT_SECRET = env.GOOGLE_ADS_CLIENT_SECRET
const PORT = 3005
const REDIRECT_URI = `http://localhost:${PORT}`
const SCOPE = 'https://www.googleapis.com/auth/adwords'

if (!CLIENT_ID || !CLIENT_SECRET) {
  console.error('ERROR: GOOGLE_ADS_CLIENT_ID or GOOGLE_ADS_CLIENT_SECRET missing in .env.local')
  process.exit(1)
}

const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}&response_type=code&scope=${encodeURIComponent(SCOPE)}&access_type=offline&prompt=consent`

console.log('\n=== GOOGLE ADS TOKEN REFRESH ===\n')
console.log('Before continuing, make sure you added this redirect URI to GCP:')
console.log(`  ${REDIRECT_URI}\n`)

const server = createServer(async (req, res) => {
  const url = new URL(req.url, REDIRECT_URI)
  const code = url.searchParams.get('code')
  const error = url.searchParams.get('error')

  if (error) {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
    res.end(`<h1>Error</h1><p>${error}</p>`)
    console.error(`\nAuthorization error: ${error}`)
    server.close()
    process.exit(1)
    return
  }

  if (!code) {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
    res.end('<h1>No authorization code received</h1>')
    return
  }

  try {
    console.log('Exchanging authorization code for tokens...')
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
        redirect_uri: REDIRECT_URI,
        grant_type: 'authorization_code',
      }).toString(),
    })

    const tokenData = await tokenRes.json()

    if (!tokenRes.ok) {
      throw new Error(`Token exchange failed: ${JSON.stringify(tokenData)}`)
    }

    if (!tokenData.refresh_token) {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
      res.end('<h1>No refresh token returned</h1><p>Google may have already issued one. Revoke access in your Google Account settings and try again.</p>')
      console.error('\nNo refresh token in response:', JSON.stringify(tokenData, null, 2))
      console.error('\nThis happens if you previously authorized. Go to https://myaccount.google.com/permissions, remove the app, then re-run this script.')
      server.close()
      process.exit(1)
      return
    }

    updateEnv(tokenData.refresh_token)

    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
    res.end('<h1>Success!</h1><p>Refresh token saved to .env.local</p><p>You can close this window.</p>')

    console.log(`Access token expires: ${new Date(Date.now() + tokenData.expires_in * 1000).toLocaleString()}`)
    console.log(`Refresh token expires: ${tokenData.expires_in ? 'Never (unless revoked)' : 'Check GCP'}`)
    console.log('\nYou can now run: node scripts/test-google-ads.mjs')

    server.close()
    process.exit(0)
  } catch (err) {
    console.error(`\n${err.message}`)
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' })
    res.end(`<h1>Error</h1><p>${err.message}</p>`)
    server.close()
    process.exit(1)
  }
})

server.listen(PORT, () => {
  console.log(`Opening browser for authorization...`)
  console.log(`\nIf browser doesn't open, go to:\n${authUrl}\n`)

  const cmd = process.platform === 'win32'
    ? `start "" "${authUrl}"`
    : process.platform === 'darwin'
      ? `open "${authUrl}"`
      : `xdg-open "${authUrl}"`

  exec(cmd, (err) => {
    if (err) console.log('Could not open browser automatically. Use the URL above.')
  })
})
