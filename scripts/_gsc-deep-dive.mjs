/**
 * Deep-dive for the weekly-report GSC findings (read-only, no store/email):
 *  1. Detect the exact period the latest report covered by matching the
 *     pasted numbers (veeautomaat 41 imp/pos 27.9 vs 43/23.1; grundfos
 *     79 imp/11 clicks/pos 11.7 vs 16.0).
 *  2. For both families pull query+page rows for current AND previous week
 *     to answer: is Google switching the carrier page (maandumisleht)?
 *  3. Show which queries inside each family moved.
 */
import { env } from './env.mjs'
import { createSign } from 'crypto'

const email = env.GSC_SERVICE_ACCOUNT_EMAIL
const key = env.GSC_SERVICE_ACCOUNT_KEY
const siteUrl = env.GSC_SITE_URL || env.NEXT_PUBLIC_SITE_URL || 'https://pumbapood.ee'
if (!email || !key) { console.error('GSC creds missing'); process.exit(1) }

async function gscToken() {
  const now = Math.floor(Date.now() / 1000)
  const claims = { iss: email, scope: 'https://www.googleapis.com/auth/webmasters.readonly', aud: 'https://oauth2.googleapis.com/token', exp: now + 3600, iat: now }
  const sign = createSign('RSA-SHA256')
  const b = (o) => Buffer.from(JSON.stringify(o)).toString('base64url')
  const jwtBase = `${b({ alg: 'RS256', typ: 'JWT' })}.${b(claims)}`
  sign.update(jwtBase)
  const jwt = `${jwtBase}.${sign.sign(key.replace(/\\n/g, '\n'), 'base64url')}`
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer', assertion: jwt }).toString(),
  })
  const t = await res.json()
  if (!t.access_token) { console.error('token failed', JSON.stringify(t).slice(0, 200)); process.exit(1) }
  return t.access_token
}

const token = await gscToken()
const api = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(siteUrl)}/searchAnalytics/query`
async function gscQuery(body) {
  const res = await fetch(api, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  if (!res.ok) { console.error('GSC', res.status, (await res.text()).slice(0, 300)); process.exit(1) }
  return (await res.json()).rows ?? []
}

const FAMS = {
  veeautomaat: /veeautomaat|h[üu]drofoor|hydrofor|kastmispump|aiapump|kastmise?/i,
  grundfos: /grundfos/i,
}
const agg = (rows) => {
  let imp = 0, clicks = 0, wp = 0
  for (const r of rows) { imp += r.impressions; clicks += r.clicks; if (r.impressions > 0) wp += r.position * r.impressions }
  return { imp, clicks, pos: imp > 0 ? Math.round((wp / imp) * 10) / 10 : null }
}

/* --- 1. detect the report period -------------------------------------- */
const candidates = []
for (const endShift of [2, 3, 4]) {
  const end = new Date(); end.setDate(end.getDate() - endShift)
  const start = new Date(end); start.setDate(start.getDate() - 6)
  const prevEnd = new Date(start); prevEnd.setDate(prevEnd.getDate() - 1)
  const prevStart = new Date(prevEnd); prevStart.setDate(prevStart.getDate() - 6)
  const iso = (d) => d.toISOString().slice(0, 10)
  candidates.push({ start: iso(start), end: iso(end), prevStart: iso(prevStart), prevEnd: iso(prevEnd) })
}

let period = null
for (const c of candidates) {
  const [curQ, prevQ] = await Promise.all([
    gscQuery({ startDate: c.start, endDate: c.end, dimensions: ['query'], rowLimit: 5000 }),
    gscQuery({ startDate: c.prevStart, endDate: c.prevEnd, dimensions: ['query'], rowLimit: 5000 }),
  ])
  const curV = agg(curQ.filter((r) => FAMS.veeautomaat.test(r.keys[0])))
  const prevV = agg(prevQ.filter((r) => FAMS.veeautomaat.test(r.keys[0])))
  const curG = agg(curQ.filter((r) => FAMS.grundfos.test(r.keys[0])))
  const prevG = agg(prevQ.filter((r) => FAMS.grundfos.test(r.keys[0])))
  console.log(`period ${c.start}..${c.end}: veeautomaat ${prevV.imp}/${prevV.pos} -> ${curV.imp}/${curV.pos} | grundfos ${prevG.imp}/${prevG.pos} -> ${curG.imp}/${curG.pos} (${curG.clicks} clicks)`)
  if (curV.imp === 41 && prevV.imp === 43 && curG.imp === 79) period = c
}
if (!period) { console.error('\nCould not match pasted numbers to a period — using the 2-day-lag period anyway'); period = candidates[0] }
console.log('\n=== USING PERIOD', JSON.stringify(period), '===\n')

/* --- 2. carrier pages per family, both weeks --------------------------- */
for (const [name, re] of Object.entries(FAMS)) {
  for (const [label, s, e] of [['PREV', period.prevStart, period.prevEnd], ['CUR', period.start, period.end]]) {
    const rows = await gscQuery({
      startDate: s, endDate: e, dimensions: ['query', 'page'], rowLimit: 1000,
      dimensionFilterGroups: [{ filters: [{ dimension: 'query', operator: 'includingRegex', expression: re.source }] }],
    })
    const byPage = new Map()
    for (const r of rows) {
      const p = r.keys[1].replace(siteUrl, '')
      const a = byPage.get(p) ?? { imp: 0, clicks: 0, wp: 0 }
      a.imp += r.impressions; a.clicks += r.clicks; a.wp += r.position * r.impressions
      byPage.set(p, a)
    }
    console.log(`--- ${name} ${label} ${s}..${e}: pages by impressions`)
    ;[...byPage.entries()].sort((a, b) => b[1].imp - a[1].imp).slice(0, 6)
      .forEach(([p, a]) => console.log(`   ${String(a.imp).padStart(4)} imp  ${a.clicks} clk  pos ${(a.imp ? a.wp / a.imp : 0).toFixed(1)}  ${p}`))
    const byQuery = new Map()
    for (const r of rows) {
      const q = r.keys[0]
      const a = byQuery.get(q) ?? { imp: 0, clicks: 0, wp: 0, pages: new Set() }
      a.imp += r.impressions; a.clicks += r.clicks; a.wp += r.position * r.impressions; a.pages.add(r.keys[1].replace(siteUrl, ''))
      byQuery.set(q, a)
    }
    console.log(`   top queries:`)
    ;[...byQuery.entries()].sort((a, b) => b[1].imp - a[1].imp).slice(0, 10)
      .forEach(([q, a]) => console.log(`   ${String(a.imp).padStart(4)} imp  ${a.clicks} clk  pos ${(a.imp ? a.wp / a.imp : 0).toFixed(1)}  "${q}"  -> ${[...a.pages].join(' | ')}`))
  }
}
