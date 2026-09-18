/** Trigger the weekly-report cron route on the local dev server and print the result. */
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

const t0 = Date.now()
console.log('calling /api/cron/weekly-report?send=0 ...')
try {
  const res = await fetch('http://localhost:3000/api/cron/weekly-report?send=0', {
    headers: { Authorization: `Bearer ${env.CRON_SECRET}` },
    signal: AbortSignal.timeout(540_000),
  })
  const text = await res.text()
  console.log(`HTTP ${res.status} in ${Math.round((Date.now() - t0) / 1000)}s`)
  console.log(text.slice(0, 2000))
} catch (e) {
  console.error(`FAILED after ${Math.round((Date.now() - t0) / 1000)}s:`, e.message)
  process.exit(1)
}
process.exit(0)
