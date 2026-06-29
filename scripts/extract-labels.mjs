import { readFileSync } from 'fs'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const envPath = resolve(__dirname, '..', '.env.local')
try {
  const content = readFileSync(envPath, 'utf-8')
  for (const line of content.split('\n')) {
    const t = line.trim()
    if (t && !t.startsWith('#')) {
      const eq = t.indexOf('=')
      if (eq > 0) {
        const k = t.slice(0, eq)
        let v = t.slice(eq + 1)
        if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1)
        if (k !== 'Vercel token') process.env[k] = v
      }
    }
  }
} catch { console.log('No .env.local') }

const CUST = '2639481819'
const LOGIN = '6134277350'
const DEV = process.env.GOOGLE_ADS_DEVELOPER_TOKEN
const V = 'v24'

async function token() {
  const p = new URLSearchParams({ client_id: process.env.GOOGLE_ADS_CLIENT_ID, client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET, refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN, grant_type: 'refresh_token' })
  const r = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: p.toString() })
  return (await r.json()).access_token
}

async function gaql(q) {
  const t = await token()
  const h = { Authorization: 'Bearer ' + t, 'developer-token': DEV, 'Content-Type': 'application/json' }
  if (LOGIN) h['login-customer-id'] = LOGIN
  const r = await fetch('https://googleads.googleapis.com/' + V + '/customers/' + CUST + '/googleAds:search', { method: 'POST', headers: h, body: JSON.stringify({ query: q }) })
  const d = await r.json()
  return d.results || []
}

const all = await gaql('SELECT conversion_action.id, conversion_action.name, conversion_action.status, conversion_action.category, conversion_action.tag_snippets FROM conversion_action')

console.log('=== CONVERSION LABELS ===\n')
for (const e of all) {
  const ca = e.conversionAction
  console.log(ca.name + ' [' + ca.status + ']  ID: ' + ca.id)
  
  if (ca.tagSnippets) {
    for (const s of ca.tagSnippets) {
      // Look for event snippet with AW-XXXX/YYYY format
      if (s.type === 'WEBPAGE' || s.type === 'EVENT_SNIPPET') {
        const evt = s.eventSnippet || ''
        // Extract label from: send_to: 'AW-18154845685/XXXXXXXXXXXXX'
        const m = evt.match(/AW-\d+\/([A-Za-z0-9_\-]+)/)
        if (m) {
          console.log('  LABEL: ' + m[1])
          console.log('  FULL:  AW-18154845685/' + m[1])
        }
      }
    }
  }
  console.log('')
}

console.log('=== ENV VARS TO UPDATE ===')
// Now find which env vars need updating
const envMap = {
  'NEXT_PUBLIC_GOOGLE_ADS_PURCHASE_LABEL': 'Pumbapood purchase',
  'NEXT_PUBLIC_GOOGLE_ADS_CONTACT_LABEL': 'Pumbapood contact form submit',
  'NEXT_PUBLIC_GOOGLE_ADS_CHECKOUT_LABEL': 'Pumbapood begin checkout',
  'NEXT_PUBLIC_GOOGLE_ADS_ATC_LABEL': 'Pumbapood add to cart',
}

for (const [envKey, name] of Object.entries(envMap)) {
  const match = all.find(e => e.conversionAction.name === name)
  if (match) {
    const ca = match.conversionAction
    const snippets = ca.tagSnippets || []
    for (const s of snippets) {
      if (s.type === 'WEBPAGE') {
        const m = (s.eventSnippet || '').match(/AW-\d+\/([A-Za-z0-9_\-]+)/)
        if (m) {
          const current = process.env[envKey] || '(not set)'
          const match_icon = m[1] === current ? ' OK' : ' MISMATCH'
          console.log(match_icon + ' ' + envKey + '=' + m[1] + '  (current=' + current + ')')
        }
      }
    }
  }
}
