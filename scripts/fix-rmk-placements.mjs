// Remarketing-ad set'ide paigutuste piirang: Advantage+ (auto) -> FB/IG feed+stream.
// Põhjus: nädalaraport 19.-25.10 — 293 klikki, aga ainult 34 maandumislehe vaadet (12 %),
// mis viitab Audience Networki juhuslikele mobiiliklikkidele. Ülejäänud ad set'id
// kontol kasutavad juba fb/ig feed+stream.
//
// NB! Meta API asendab KOGU targeting-objekti — seega loeme olemasoleva,
// lisame paigutusväljad juurde ja saadame terve tagasi (sihrühmad jäävad samaks).
//
// Kasutus:
//   node scripts/fix-rmk-placements.mjs --dry-run   # kuva muudatus, ei tee midagi
//   node scripts/fix-rmk-placements.mjs             # rakenda ACTIVE RMK ad set'idele
import { readFileSync } from 'fs'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'
const __dirname = dirname(fileURLToPath(import.meta.url))
try {
  const content = readFileSync(resolve(__dirname, '..', '.env.local'), 'utf-8')
  for (const line of content.split('\n')) { const t = line.trim(); if (t && !t.startsWith('#')) { const eq = t.indexOf('='); if (eq > 0) { const k = t.slice(0, eq); let v = t.slice(eq + 1); if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1); process.env[k] = v } } }
} catch {}
const TOKEN = process.env.META_ACCESS_TOKEN
const ACCT = (process.env.META_AD_ACCOUNT_ID || '').replace('act_', '')
const V = process.env.META_GRAPH_API_VERSION || 'v25.0'
const BASE = `https://graph.facebook.com/${V}`
const DRY = process.argv.includes('--dry-run')
const CAMPAIGN_NAME = 'Pumbapood remarketing - EE 2026'

async function api(path, method = 'GET', body = null) {
  const r = await fetch(`${BASE}/${path}${path.includes('?') ? '&' : '?'}access_token=${TOKEN}`, body ? { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : { method })
  const d = await r.json()
  if (!r.ok || d?.error) throw new Error(`Meta API ${method} ${path}: ` + JSON.stringify(d?.error || d).slice(0, 400))
  return d
}

const camps = await api(`act_${ACCT}/campaigns?fields=name,status&effective_status=["ACTIVE"]&limit=50`)
const camp = (camps.data || []).find(c => c.name === CAMPAIGN_NAME)
if (!camp) { console.error(`Kampaaniat "${CAMPAIGN_NAME}" ei leitud aktiivsete hulgas`); process.exit(1) }
console.log(`${camp.name} (${camp.id}) ${DRY ? '[DRY RUN]' : '[LIVE]'}\n`)

const sets = await api(`${camp.id}/adsets?fields=name,status,targeting&limit=50`)
let changed = 0
for (const s of sets.data || []) {
  if (s.status !== 'ACTIVE') { console.log(`  ${s.name}: ${s.status} — vahele`); continue }
  const t = s.targeting || {}
  const already = Array.isArray(t.publisher_platforms) && t.publisher_platforms.includes('facebook') && !t.publisher_platforms.includes('audience_network')
  if (already) { console.log(`  ${s.name}: paigutused juba piiratud (${t.publisher_platforms.join('+')}) — vahele`); continue }
  const newTargeting = { ...t, publisher_platforms: ['facebook', 'instagram'], facebook_positions: ['feed'], instagram_positions: ['stream'] }
  console.log(`  ${s.name} (${s.id})`)
  console.log(`    enne: publisher_platforms=${JSON.stringify(t.publisher_platforms || 'auto')}, positions=${JSON.stringify(t.facebook_positions || 'auto')}`)
  console.log(`    pärast: publisher_platforms=["facebook","instagram"], fb=["feed"], ig=["stream"] (sihrühm ja geo muutmata)`)
  if (DRY) { console.log('    DRY RUN — ei muudeta'); continue }
  await api(`${s.id}`, 'POST', { targeting: newTargeting })
  changed++
  console.log('    OK')
}
console.log(`\nDONE — ${DRY ? 'muudatusi ootel' : changed + ' ad set\'i uuendatud'}`)
process.exit(0)
