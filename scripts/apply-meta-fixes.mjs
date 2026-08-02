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
      if (eq > 0) { const k = t.slice(0, eq); let v = t.slice(eq + 1); if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1); process.env[k] = v }
    }
  }
} catch {}

const TOKEN = process.env.META_ACCESS_TOKEN
const AD_ACCOUNT = (process.env.META_AD_ACCOUNT_ID || '').replace('act_', '')
const V = process.env.META_GRAPH_API_VERSION || 'v25.0'
const BASE = `https://graph.facebook.com/${V}`
const ADSET_SALES = '120252457134380120'
const ADSET_PUURKAEV = '120250484536490120'
const ADSET_AIA = '120250475772890120'

async function post(path, body) {
  const url = `${BASE}/${path}?access_token=${TOKEN}`
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  const data = await res.json()
  if (!res.ok) console.error(`  ERROR: ${JSON.stringify(data)}`)
  else console.log(`  SUCCESS: ${JSON.stringify(data)}`)
  return data
}

async function main() {
  console.log('=== APPLYING META ADS OPTIMIZATIONS ===\n')

  // 1. Pause Sales Advantage ad set
  console.log('1. Pausing Sales Advantage ad set...')
  await post(ADSET_SALES, { status: 'PAUSED' })

  // 2. Increase Puurkaevu budget: 333 → 833 cents (€8.33/day)
  console.log('\n2. Increasing Puurkaevu SQ/SQE budget to €8.33/day...')
  await post(ADSET_PUURKAEV, { daily_budget: 833 })

  // 3. Fix Aia kastmine placements to Facebook Feed only
  console.log('\n3. Fixing Aia kastmine placements to Facebook Feed only...')
  await post(ADSET_AIA, {
    targeting: {
      age_max: 65,
      age_min: 30,
      geo_locations: { countries: ['EE'], location_types: ['home', 'recent'] },
      interests: [{ id: '6003198084682', name: 'Vegetable Gardening' }],
      publisher_platforms: ['facebook'],
      facebook_positions: ['feed'],
      device_platforms: ['mobile', 'desktop'],
    },
  })

  console.log('\n=== DONE ===')
}
main().catch(e => { console.error(e.message); process.exit(1) })
