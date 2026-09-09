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
const CAMP_ID = '120253843650360120' // Unilift CC - Tühjendus ja drenaaž B2B - EE sügis 2026
// Proper 1080x1080 square image (fixes Meta "image size" errors)
const SQUARE_IMG = 'https://pumbapood.ee/images/unilift/unilift-hero.png'

async function api(path, method = 'GET', body = null) {
  const url = `${BASE}/${path}${path.includes('?') ? '&' : '?'}access_token=${TOKEN}`
  const opt = { method }
  if (body) { opt.headers = { 'Content-Type': 'application/json' }; opt.body = JSON.stringify(body) }
  const r = await fetch(url, opt)
  const d = await r.json()
  return { ok: r.ok, data: d }
}
async function uploadImage(url, name) {
  const buf = Buffer.from(await (await fetch(url)).arrayBuffer())
  const fd = new FormData()
  fd.append('filename', new Blob([buf], { type: 'image/png' }), name)
  fd.append('access_token', TOKEN)
  const r = await fetch(`${BASE}/act_${ACCT}/adimages`, { method: 'POST', body: fd })
  const d = await r.json()
  const hash = d?.images?.[name]?.hash
  if (!hash) console.log('  IMG FAIL ' + name + ': ' + JSON.stringify(d).slice(0, 250))
  return hash
}

console.log('=== META Unilift campaign fix ===\n')

// 1. Upload a proper square image
console.log('1. Uploading 1080x1080 square image...')
const squareHash = await uploadImage(SQUARE_IMG, 'unilift-square.png')
console.log('  hash: ' + (squareHash || 'FAIL'))
if (!squareHash) { console.log('Aborting'); process.exit(1) }

// 2. Fix ad sets: keep the B2B one, activate it, normalize times; pause the duplicate
console.log('\n2. Fixing ad sets...')
const KEEP = { id: '120253843655120120', label: 'B2B - paigaldajad ja edasimüüjad - Unilift CC' }
const DROP = { id: '120253843655460120', label: 'Edasimüüjad ja ehitusettevõtted - Unilift CC' }

let r = await api(KEEP.id, 'POST', { status: 'ACTIVE', start_time: '2026-09-08T00:00:00+0300', end_time: '2026-11-30T23:59:59+0200' })
console.log(`  ${r.ok ? 'ACTIVE' : 'FAIL ' + JSON.stringify(r.data).slice(0, 300)}  ${KEEP.label}`)
r = await api(DROP.id, 'POST', { status: 'PAUSED' })
console.log(`  ${r.ok ? 'PAUSED (duplicate)' : 'FAIL ' + JSON.stringify(r.data).slice(0, 300)}  ${DROP.label}`)

// 3. Point every ACTIVE Unilift ad creative to the square image
console.log('\n3. Re-linking active Unilift ad creatives to square image...')
const adsRes = await api(`act_${ACCT}/ads?fields=name,status,campaign_id,creative{id,name,object_story_spec{link_data}}&limit=300`)
const adsList = adsRes.data?.data
if (!Array.isArray(adsList)) { console.log('  ADS QUERY ERROR: ' + JSON.stringify(adsRes.data).slice(0, 400)); process.exit(1) }
for (const a of adsList) {
  if (a.campaign_id !== CAMP_ID || a.status !== 'ACTIVE') continue
  const c = a.creative || {}
  const ld = c.object_story_spec?.link_data || {}
  const pageId = c.object_story_spec?.page_id
  if (!c.id || !ld.link) { console.log(`  skip (no link_data): ${a.name}`); continue }
  if (ld.image_hash === squareHash) { console.log(`  already square: ${a.name}`); continue }

  // rebuild link_data preserving message/name/description/cta but swapping image hash
  const newLinkData = { ...ld, image_hash: squareHash }
  if (newLinkData.call_to_action) newLinkData.call_to_action = { type: ld.call_to_action.type, value: { link: ld.call_to_action.value?.link || ld.link } }
  const body = { name: c.name, object_story_spec: { page_id: pageId, link_data: newLinkData } }
  const upd = await api(`${c.id}`, 'POST', body)
  console.log(`  ${upd.ok ? 'OK' : 'FAIL ' + JSON.stringify(upd.data).slice(0, 300)}  ${a.name}`)
}

// 4. Report final active campaign structure
console.log('\n4. Verifying campaign...')
const camp = await api(`${CAMP_ID}?fields=name,status`)
console.log('  Campaign: ' + (camp.data?.status || '?') + '  ' + (camp.data?.name || ''))
const sets = await api(`${CAMP_ID}/adsets?fields=name,status,start_time,end_time`)
for (const s of (sets.data || [])) console.log(`  adset: [${s.status}] ${s.name}  ${s.start_time} -> ${s.end_time}`)

console.log('\n=== META DONE ===')
