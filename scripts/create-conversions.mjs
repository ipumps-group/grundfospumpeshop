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

const CUST = process.env.GOOGLE_ADS_CUSTOMER_ID
const LOGIN = process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID
const DEV = process.env.GOOGLE_ADS_DEVELOPER_TOKEN
const V = 'v24'

async function token() {
  const p = new URLSearchParams({ client_id: process.env.GOOGLE_ADS_CLIENT_ID, client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET, refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN, grant_type: 'refresh_token' })
  const r = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: p.toString() })
  const d = await r.json()
  if (!r.ok) throw new Error('OAuth: ' + JSON.stringify(d))
  return d.access_token
}

async function gaql(q) {
  const t = await token()
  const h = { Authorization: 'Bearer ' + t, 'developer-token': DEV, 'Content-Type': 'application/json' }
  if (LOGIN) h['login-customer-id'] = LOGIN
  const r = await fetch('https://googleads.googleapis.com/' + V + '/customers/' + CUST + '/googleAds:search', { method: 'POST', headers: h, body: JSON.stringify({ query: q }) })
  return (await r.json()).results || []
}

async function apiPost(path, body) {
  const t = await token()
  const h = { Authorization: 'Bearer ' + t, 'developer-token': DEV, 'Content-Type': 'application/json' }
  if (LOGIN) h['login-customer-id'] = LOGIN
  const r = await fetch('https://googleads.googleapis.com/' + V + '/' + path, { method: 'POST', headers: h, body: JSON.stringify(body) })
  const d = await r.json()
  if (!r.ok) {
    console.error('API error ' + r.status + ': ' + JSON.stringify(d).slice(0, 500))
    return null
  }
  return d
}

// First check existing conversion actions
console.log('Checking existing conversion actions...')
const existing = await gaql('SELECT conversion_action.resource_name, conversion_action.name, conversion_action.status, conversion_action.type, conversion_action.category FROM conversion_action')
console.log('Existing: ' + existing.length)
existing.forEach(e => {
  const ca = e.conversionAction
  console.log('  ' + ca.name + ' [' + ca.status + '] type=' + ca.type + ' cat=' + ca.category + ' — ' + ca.resourceName)
})

// Create purchase conversion
console.log('\nCreating PURCHASE conversion action...')
const purchaseRes = await apiPost('customers/' + CUST + '/conversionActions:mutate', {
  operations: [{
    create: {
      name: 'Pumbapood Purchase',
      category: 'PURCHASE',
      type: 'WEBPAGE',
      status: 'ENABLED',
      countingType: 'ONE_PER_CLICK',
      attributionModelType: 'DATA_DRIVEN',
      valueSettings: {
        defaultValue: 0,
        alwaysUseDefaultValue: false,
      },
      // Record each conversion with its own value
      tagSnippets: [],
    },
  }],
})

if (purchaseRes?.results?.[0]) {
  const name = purchaseRes.results[0].resourceName
  console.log('Created: ' + name)
  // Now fetch the label
  const labels = await gaql("SELECT conversion_action.resource_name, conversion_action.name, conversion_action.tag_snippets FROM conversion_action WHERE conversion_action.resource_name = '" + name + "'")
  if (labels.length > 0) {
    const ca = labels[0].conversionAction
    console.log('Tag snippets:')
    ca.tagSnippets?.forEach(s => console.log('  ' + JSON.stringify(s).slice(0, 300)))
  }
}

// Create Add to Cart conversion
console.log('\nCreating ADD_TO_CART conversion action...')
const atcRes = await apiPost('customers/' + CUST + '/conversionActions:mutate', {
  operations: [{
    create: {
      name: 'Pumbapood Add to Cart',
      category: 'ADD_TO_CART',
      type: 'WEBPAGE',
      status: 'ENABLED',
      countingType: 'ONE_PER_CLICK',
      attributionModelType: 'DATA_DRIVEN',
      valueSettings: { defaultValue: 0, alwaysUseDefaultValue: false },
    },
  }],
})
if (atcRes?.results?.[0]) console.log('Created: ' + atcRes.results[0].resourceName)

// Create Contact / Lead conversion
console.log('\nCreating CONTACT/LEAD conversion action...')
const leadRes = await apiPost('customers/' + CUST + '/conversionActions:mutate', {
  operations: [{
    create: {
      name: 'Pumbapood Contact Form',
      category: 'LEAD',
      type: 'WEBPAGE',
      status: 'ENABLED',
      countingType: 'ONE_PER_CLICK',
      attributionModelType: 'DATA_DRIVEN',
      valueSettings: { defaultValue: 1, alwaysUseDefaultValue: true },
    },
  }],
})
if (leadRes?.results?.[0]) console.log('Created: ' + leadRes.results[0].resourceName)

// Final list
console.log('\n=== ALL CONVERSION ACTIONS ===')
const all = await gaql('SELECT conversion_action.resource_name, conversion_action.name, conversion_action.status, conversion_action.type, conversion_action.category, conversion_action.tag_snippets FROM conversion_action')
all.forEach(e => {
  const ca = e.conversionAction
  console.log('\n' + ca.name + ' [' + ca.status + ']')
  console.log('  Type: ' + ca.type + ' | Category: ' + ca.category)
  console.log('  Resource: ' + ca.resourceName)
  if (ca.tagSnippets) {
    ca.tagSnippets.forEach(s => {
      if (s.type === 'EVENT_SNIPPET') {
        const match = s.pageFormat?.match(/send_to.*?['"]([^'"]+)['"]/)
        if (match) console.log('  send_to: ' + match[1])
      }
      if (s.type === 'GCLID_SNIPPET') {
        const labelMatch = s.globalSiteTag?.match(/AW-\d+\/([^'"]+)/)
        if (labelMatch) console.log('  LABEL: ' + labelMatch[1])
      }
      console.log('  Snippet: ' + JSON.stringify(s).slice(0, 400))
    })
  }
})

console.log('\n=== DONE ===')
