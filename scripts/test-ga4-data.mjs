/** Check whether GA4_PROPERTY_ID has ANY data (7/30/90 days) — isolates wrong-property-id vs no-traffic. */
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

console.log('GA4 property:', env.GA4_PROPERTY_ID, '| site measurement id:', env.NEXT_PUBLIC_GA4_MEASUREMENT_ID)

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

for (const range of ['7daysAgo', '30daysAgo', '90daysAgo']) {
  const res = await fetch(`https://analyticsdata.googleapis.com/v1beta/properties/${env.GA4_PROPERTY_ID}:runReport`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${tok.access_token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      dateRanges: [{ startDate: range, endDate: 'yesterday' }],
      metrics: [{ name: 'sessions' }, { name: 'totalUsers' }, { name: 'screenPageViews' }],
    }),
  })
  const d = await res.json()
  const vals = (d.totals?.[0]?.metricValues ?? []).map((v) => v.value)
  console.log(`${range} -> sessions: ${vals[0] ?? '-'} users: ${vals[1] ?? '-'} pageviews: ${vals[2] ?? '-'}`)
}
process.exit(0)
