import { readFileSync } from 'fs'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'
const __dirname = dirname(fileURLToPath(import.meta.url))
try {
  const content = readFileSync(resolve(__dirname, '..', '.env.local'), 'utf-8')
  for (const line of content.split('\n')) { const t = line.trim(); if (t && !t.startsWith('#')) { const eq = t.indexOf('='); if (eq > 0) { const k = t.slice(0, eq); let v = t.slice(eq + 1); if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1); process.env[k] = v } } }
} catch {}
const TOKEN = process.env.META_ACCESS_TOKEN
const ACCT = (process.env.META_AD_ACCOUNT_ID || '').replace('act_', '')
const V = process.env.META_GRAPH_API_VERSION || 'v25.0'
const BASE = `https://graph.facebook.com/${V}`
const SQUARE = '5035414e433923da4a913c8a2aaec297'
async function api(p) { const r = await fetch(`${BASE}/${p}&access_token=${TOKEN}`); return r.json() }
const ads = await api(`act_${ACCT}/ads?fields=name,status,campaign_id,creative{object_story_spec{link_data{link,image_hash}}}&limit=300`)
const list = ads.data?.data || []
let allGood = true
for (const a of list) {
  if (a.campaign_id !== '120253843650360120' || a.status !== 'ACTIVE') continue
  const ld = a.creative?.object_story_spec?.link_data || {}
  const ok = ld.image_hash === SQUARE && ld.link === 'https://pumbapood.ee/unilift'
  if (!ok) allGood = false
  console.log(`${ok ? 'OK ' : 'BAD'}  ${a.name}  link=${ld.link}  hash=${ld.image_hash}`)
}
console.log(allGood ? '\nALL ACTIVE UNILIFT ADS -> /unilift with square image' : '\nSOME ADS NOT FIXED')
