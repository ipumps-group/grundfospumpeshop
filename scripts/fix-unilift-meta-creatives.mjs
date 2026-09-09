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
const PAGE = process.env.META_PAGE_ID
const V = process.env.META_GRAPH_API_VERSION || 'v25.0'
const BASE = `https://graph.facebook.com/${V}`
const CAMP_ID = '120253843650360120'
// Square 1080x1080 (good for feed + most placements)
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

console.log('=== META: rebuild Unilift creatives with square image ===\n')
console.log('1. Upload square image...')
const hash = await uploadImage(SQUARE_IMG, 'unilift-square.png')
console.log('  hash: ' + (hash || 'FAIL'))
if (!hash) { process.exit(1) }

// Pull active ads in the campaign
const adsRes = await api(`act_${ACCT}/ads?fields=name,status,campaign_id,creative{id,object_story_spec{page_id,link_data}}&limit=300`)
const ads = adsRes.data?.data || []
const activeAds = ads.filter(a => a.campaign_id === CAMP_ID && a.status === 'ACTIVE')

for (const a of activeAds) {
  const c = a.creative || {}
  const ld = c.object_story_spec?.link_data || {}
  const pageId = c.object_story_spec?.page_id || PAGE
  if (!ld.link) { console.log('  skip ' + a.name); continue }
  // build a NEW creative with same copy but square image
  const newLd = { ...ld, image_hash: hash }
  if (newLd.call_to_action) newLd.call_to_action = { type: ld.call_to_action.type, value: { link: ld.call_to_action.value?.link || ld.link } }
  const body = { name: (a.name.split('|').pop()?.trim() || a.name) + ' (square)', object_story_spec: { page_id: pageId, link_data: newLd } }
  const cr = await api(`act_${ACCT}/adcreatives`, 'POST', body)
  if (!cr.ok) { console.log(`  CREATIVE FAIL ${a.name}: ${JSON.stringify(cr.data).slice(0, 300)}`); continue }
  const newCid = cr.data.id
  // point the ad to the new creative
  const upd = await api(`${a.id}`, 'POST', { creative: { creative_id: newCid } })
  console.log(`  ${upd.ok ? 'OK new creative ' + newCid : 'FAIL ' + JSON.stringify(upd.data).slice(0, 300)}  <- ${a.name}`)
}
console.log('\n=== DONE ===')
