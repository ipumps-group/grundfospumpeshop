import { config } from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))
config({ path: resolve(__dirname, '..', '.env.local') })

async function main() {
  console.log('\n=== GOOGLE ADS CONNECTION TEST ===\n')

  // 1. Check env vars
  const required = [
    'GOOGLE_ADS_DEVELOPER_TOKEN',
    'GOOGLE_ADS_CLIENT_ID',
    'GOOGLE_ADS_CLIENT_SECRET',
    'GOOGLE_ADS_REFRESH_TOKEN',
    'GOOGLE_ADS_CUSTOMER_ID',
  ]

  let allPresent = true
  for (const key of required) {
    const val = process.env[key]
    const ok = !!val
    if (!ok) allPresent = false
    console.log(`${ok ? '✅' : '❌'} ${key} = ${val ? val.slice(0, 16) + '...' : 'MISSING'}`)
  }

  if (!allPresent) {
    console.log('\n❌ Fix missing env vars first')
    process.exit(1)
  }

  // 2. Get OAuth token
  console.log('\n--- OAuth Token ---')
  let token
  try {
    const params = new URLSearchParams({
      client_id: process.env.GOOGLE_ADS_CLIENT_ID,
      client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET,
      refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN,
      grant_type: 'refresh_token',
    })

    const res = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    })

    if (!res.ok) {
      const err = await res.text()
      console.log(`❌ OAuth failed (${res.status}): ${err}`)
      process.exit(1)
    }

    const data = await res.json()
    token = data.access_token
    console.log(`✅ Got access token (${token.slice(0, 20)}...)`)
  } catch (e) {
    console.log(`❌ OAuth error: ${e.message}`)
    process.exit(1)
  }

  // 3. Minimal GAQL query
  console.log('\n--- GAQL Query: List Customers ---')
  const customerId = process.env.GOOGLE_ADS_CUSTOMER_ID
  const devToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN
  const loginCustomerId = process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID

  const queries = [
    { label: 'Customer info', gaql: 'SELECT customer.id, customer.descriptive_name, customer.currency_code, customer.time_zone FROM customer LIMIT 1' },
    { label: 'Campaign list', gaql: 'SELECT campaign.id, campaign.name, campaign.status FROM campaign ORDER BY campaign.id LIMIT 5' },
  ]

  for (const { label, gaql } of queries) {
    const headers = {
      Authorization: `Bearer ${token}`,
      'developer-token': devToken,
      'Content-Type': 'application/json',
    }
    if (loginCustomerId) headers['login-customer-id'] = loginCustomerId

    try {
      const res = await fetch(
        `https://googleads.googleapis.com/v24/customers/${customerId}/googleAds:search`,
        { method: 'POST', headers, body: JSON.stringify({ query: gaql }) },
      )
      const body = await res.json()

      if (!res.ok) {
        const errs = body?.error?.details?.[0]?.errors || []
        for (const e of errs) {
          console.log(`❌ ${label}: ${e.errorCode ? JSON.stringify(e.errorCode) : ''} — ${e.message}`)
        }
        if (!errs.length) console.log(`❌ ${label}: HTTP ${res.status} — ${body.error?.message || JSON.stringify(body)}`)
      } else {
        const rows = body.results || []
        console.log(`✅ ${label}: ${rows.length} result(s)`)
        for (const row of rows) {
          console.log(`   ${JSON.stringify(row).slice(0, 200)}`)
        }
      }
    } catch (e) {
      console.log(`❌ ${label}: ${e.message}`)
    }
  }

  // Summary
  console.log('\n=== DONE ===')
}

main().catch(console.error)
