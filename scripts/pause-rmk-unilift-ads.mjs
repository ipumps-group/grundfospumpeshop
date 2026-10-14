// Pausitab remarketing-kampaania "Pumbapood remarketing - EE 2026" Unilifti reklaamid
// (RMK reklaam - Unilift CC, mõlemas ad set'is). ALPHA GO reklaamid jäävad tööle.
// Kasutus: node scripts/pause-rmk-unilift-ads.mjs [--dry-run]
// Idempotentne — juba pausitud reklaamid jäetakse vahele.
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
const TOKEN = process.env.META_ACCESS_TOKEN
const V = process.env.META_GRAPH_API_VERSION || 'v25.0'
const BASE = `https://graph.facebook.com/${V}`
const CAMPAIGN_ID = '120254269929220120' // Pumbapood remarketing - EE 2026
const NAME_MATCH = /unilift/i

async function api(path, method = 'GET', body = null) {
  const url = `${BASE}/${path}${path.includes('?') ? '&' : '?'}access_token=${TOKEN}`
  const opt = { method }
  if (body) { opt.headers = { 'Content-Type': 'application/json' }; opt.body = JSON.stringify(body) }
  const r = await fetch(url, opt)
  const d = await r.json()
  if (!r.ok || d?.error) throw new Error(`Meta API ${method} ${path}: ` + JSON.stringify(d?.error || d).slice(0, 400))
  return d
}

console.log(DRY ? '=== DRY RUN ===' : '=== LIVE ===')
const adsets = (await api(`${CAMPAIGN_ID}/adsets?fields=id,name,status&limit=50`)).data || []
for (const s of adsets) {
  const ads = (await api(`${s.id}/ads?fields=id,name,status&limit=50`)).data || []
  for (const a of ads) {
    if (!NAME_MATCH.test(a.name)) { console.log(`  jätan tööle: [${a.status}] ${a.name}`); continue }
    console.log(`  [${a.status}] ${a.name} (adset: ${s.name}, id ${a.id})`)
    if (a.status === 'PAUSED') { console.log('    → juba PAUSED — vahele'); continue }
    if (DRY) { console.log('    → DRY RUN: seaksin status=PAUSED'); continue }
    await api(`${a.id}`, 'POST', { status: 'PAUSED' })
    console.log('    → OK, status=PAUSED')
  }
}
console.log('DONE')
