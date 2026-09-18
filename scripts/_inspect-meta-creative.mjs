import { readFileSync } from 'fs'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'
const __dirname = dirname(fileURLToPath(import.meta.url))
try {
  const content = readFileSync(resolve(__dirname, '..', '.env.local'), 'utf-8')
  for (const line of content.split('\n')) {
    const t = line.trim()
    if (t && !t.startsWith('#')) { const eq = t.indexOf('='); if (eq > 0) { const k = t.slice(0, eq); let v = t.slice(eq + 1); if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1); process.env[k] = v } }
  }
} catch {}
const TOKEN = process.env.META_ACCESS_TOKEN
const ACCT = (process.env.META_AD_ACCOUNT_ID || '').replace('act_', '')
const V = process.env.META_GRAPH_API_VERSION || 'v25.0'
const BASE = `https://graph.facebook.com/${V}`
async function api(path) { const r = await fetch(`${BASE}/${path}${path.includes('?') ? '&' : '?'}access_token=${TOKEN}`); return r.json() }

// All active ads with their creative link_data
const ads = await api(`act_${ACCT}/ads?fields=name,status,adset_id,creative{id,name,object_story_spec{link_data{link,image_hash,name,call_to_action}},thumbnail_url}&limit=200`)
for (const a of (ads.data || [])) {
  if (a.status !== 'ACTIVE') continue
  const c = a.creative || {}
  const ld = c.object_story_spec?.link_data || {}
  console.log(`[${a.status}] ${a.name}`)
  console.log(`   creative id: ${c.id} | name: ${c.name}`)
  console.log(`   link: ${ld.link || '(none)'} | image_hash: ${ld.image_hash || '(none)'} | cta: ${ld.call_to_action?.type || '-'}`)
  console.log('')
}
