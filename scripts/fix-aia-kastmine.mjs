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
const V = process.env.META_GRAPH_API_VERSION || 'v25.0'
const BASE = `https://graph.facebook.com/${V}`
const ADSET_AIA = '120250475772890120'
const ADSET_VEEVARUSTUS = '120250484533180120'

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
}

async function main() {
  console.log('=== Aia kastmine: pause + reallocate ===\n')

  // Pause Aia kastmine
  console.log('1. Pausing Aia kastmine (83% bounce rate, feed-only rejected)...')
  await post(ADSET_AIA, { status: 'PAUSED' })

  // Add its €2.50 to Veevarustus majas (best volume performer, 58.6% LP rate)
  console.log('\n2. Adding freed €2.50 to Veevarustus majas budget (10.00 → 12.50)...')
  await post(ADSET_VEEVARUSTUS, { daily_budget: 1250 })

  console.log('\n=== DONE ===')
}
main().catch(e => { console.error(e.message); process.exit(1) })
