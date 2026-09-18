import { readFileSync } from 'fs'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'
const __dirname = dirname(fileURLToPath(import.meta.url))
try {
  const content = readFileSync(resolve(__dirname, '..', '.env.local'), 'utf-8')
  for (const line of content.split('\n')) { const t = line.trim(); if (t && !t.startsWith('#')) { const eq = t.indexOf('='); if (eq > 0) { const k = t.slice(0, eq); let v = t.slice(eq + 1); if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1); process.env[k] = v } } }
} catch {}
const TOKEN = process.env.META_ACCESS_TOKEN
const V = process.env.META_GRAPH_API_VERSION || 'v25.0'
const BASE = `https://graph.facebook.com/${V}`
const ids = ['120253843655120120', '120253843655460120']
async function api(p) { const r = await fetch(`${BASE}/${p}&access_token=${TOKEN}`); return r.json() }
for (const id of ids) {
  const d = await api(`${id}?fields=name,status,configured_status,start_time,end_time,daily_budget`)
  console.log('=== ' + id + ' ===')
  console.log(JSON.stringify(d, null, 1))
}
