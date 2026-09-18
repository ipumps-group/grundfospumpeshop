// ALPHA GO küttekampaania — Meta Ads AVALDAMINE (PAUSED -> ACTIVE)
// Loeb kampaania + ad setid + reklaamid ning seab staatuse ACTIVE.
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

const TOKEN = process.env.META_ACCESS_TOKEN
const ACCT = (process.env.META_AD_ACCOUNT_ID || '').replace('act_', '')
const V = process.env.META_GRAPH_API_VERSION || 'v25.0'
const BASE = `https://graph.facebook.com/${V}`

const CAMPAIGN_NAME = 'ALPHA GO - Küte - EE 2026 sügis'
const DRY_RUN = process.argv.includes('--dry-run')

async function api(path, method = 'GET', body = null) {
  const url = `${BASE}/${path}${path.includes('?') ? '&' : '?'}access_token=${TOKEN}`
  const opt = { method }
  if (body) { opt.headers = { 'Content-Type': 'application/json' }; opt.body = JSON.stringify(body) }
  const r = await fetch(url, opt)
  const d = await r.json()
  return { ok: r.ok, data: d }
}

async function setStatus(id, status, label) {
  if (DRY_RUN) { console.log(`  DRY-RUN would set ${label} ${id} -> ${status}`); return true }
  const r = await api(id, 'POST', { status })
  if (!r.ok || r.data?.error) {
    console.log(`  FAIL ${label} ${id}: ${JSON.stringify(r.data?.error || r.data).slice(0, 300)}`)
    return false
  }
  console.log(`  OK ${label} ${id} -> ${status}`)
  return true
}

async function main() {
  console.log('=== PUBLISH (Meta): ' + CAMPAIGN_NAME + (DRY_RUN ? ' [DRY-RUN]' : '') + ' ===\n')

  // 1. Find campaign
  const camps = await api(`act_${ACCT}/campaigns?fields=name,status,daily_budget&limit=100`)
  const camp = (camps.data?.data || []).find(c => c.name === CAMPAIGN_NAME)
  if (!camp) { console.log('Campaign NOT FOUND — run scripts/create-alpha-go-meta.mjs first'); process.exit(1) }
  console.log(`Campaign: ${camp.id}  status: ${camp.status}`)

  // 2. Ad sets in campaign
  const sets = await api(`${camp.id}/adsets?fields=name,status,daily_budget,end_time&limit=100`)
  const adsets = sets.data?.data || []
  console.log(`Ad sets: ${adsets.length}`)
  for (const s of adsets) console.log(`  - ${s.name}: ${s.status} (${((s.daily_budget || 0) / 100).toFixed(2)} EUR/day, end: ${s.end_time || 'none'})`)

  // 3. Ads per ad set
  const adsBySet = []
  for (const s of adsets) {
    const ads = await api(`${s.id}/ads?fields=name,status&limit=100`)
    const list = ads.data?.data || []
    adsBySet.push(...list)
    console.log(`  Ads in "${s.name}": ${list.length}`)
  }

  console.log('\nActivating (bottom-up: ads -> ad sets -> campaign)...')
  let ok = true
  for (const a of adsBySet) if (a.status !== 'ACTIVE') ok = (await setStatus(a.id, 'ACTIVE', 'ad')) && ok
  for (const s of adsets) if (s.status !== 'ACTIVE') ok = (await setStatus(s.id, 'ACTIVE', 'adset')) && ok
  if (camp.status !== 'ACTIVE') ok = (await setStatus(camp.id, 'ACTIVE', 'campaign')) && ok
  if (!ok) { console.log('\n=== PARTIAL FAILURE — check errors above ==='); process.exit(1) }

  if (!DRY_RUN) {
    const verify = await api(`${camp.id}?fields=name,status,effective_status`)
    console.log(`\nVERIFY: campaign status = ${verify.data?.status} (effective: ${verify.data?.effective_status})`)
  }
  console.log('\n=== DONE ===')
}
main().catch(e => { console.error(e.message); process.exit(1) })
