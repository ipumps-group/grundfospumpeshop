/** Show data streams (measurement IDs) for the two candidate GA4 properties. */
import { readFileSync } from 'fs'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const env = {}
for (const line of readFileSync(resolve(__dirname, '..', '.env.local'), 'utf-8').split('\n')) {
  const t = line.trim()
  if (t && !t.startsWith('#')) {
    const eq = t.indexOf('=')
    if (eq > 0) env[t.slice(0, eq)] = t.slice(eq + 1).replace(/^["']|["']$/g, '')
  }
}
const SITE_STREAM = env.NEXT_PUBLIC_GA4_MEASUREMENT_ID

const tok = await (await fetch('https://oauth2.googleapis.com/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({
    client_id: env.GOOGLE_ADS_CLIENT_ID,
    client_secret: env.GOOGLE_ADS_CLIENT_SECRET,
    refresh_token: env.GOOGLE_ADS_REFRESH_TOKEN,
    grant_type: 'refresh_token',
  }).toString(),
})).json()

for (const prop of ['538283046', '537076075']) {
  const res = await fetch(`https://analyticsadmin.googleapis.com/v1beta/properties/${prop}/dataStreams`, {
    headers: { Authorization: `Bearer ${tok.access_token}` },
  })
  const body = await res.text()
  if (!res.ok) { console.log(`property ${prop}: HTTP ${res.status} ${body.slice(0, 200)}`); continue }
  const data = JSON.parse(body)
  for (const s of data.dataStreams ?? []) {
    const hit = s.webStreamData?.measurementId === SITE_STREAM ? '   <== SITE USES THIS ONE' : ''
    console.log(`property ${prop}: stream "${s.displayName}" measurementId ${s.webStreamData?.measurementId ?? '-'} url ${s.webStreamData?.defaultUri ?? '-'}${hit}`)
  }
}
process.exit(0)
