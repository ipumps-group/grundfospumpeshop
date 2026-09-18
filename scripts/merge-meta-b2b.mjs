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
const PAGE = process.env.META_PAGE_ID
const V = process.env.META_GRAPH_API_VERSION || 'v25.0'
const BASE = `https://graph.facebook.com/${V}`

const ADSET_KEEP = '120253843655120120'   // Paigaldajad - Unilift CC
const ADSET_DROP = '120253843655460120'   // Edasimüüjad ja ehitusettevõtted - Unilift CC
const IMG_CC7_HASH = '78d66325b41303f02361c59b69b943ff'
const UTM = 'utm_source=meta&utm_medium=paid&utm_campaign=unilift_cc_sygis_2026'
const LINK_B2B = `https://pumbapood.ee/leht/edasimyujatele?${UTM}`

const INTERESTS = [
  { id: '6003469754863', name: 'Plumbing' },
  { id: '6003395414271', name: 'Construction' },
  { id: '6003234413249', name: 'Home improvement' },
  { id: '6002979893723', name: 'Renovation' },
  { id: '6002951756355', name: 'Building material' },
  { id: '6003107626192', name: 'Wholesale' },
]

async function api(path, method = 'GET', body = null) {
  const url = `${BASE}/${path}${path.includes('?') ? '&' : '?'}access_token=${TOKEN}`
  const opt = { method }
  if (body) { opt.headers = { 'Content-Type': 'application/json' }; opt.body = JSON.stringify(body) }
  const r = await fetch(url, opt)
  return { ok: r.ok, data: await r.json() }
}

async function main() {
  console.log('=== META: merge B2B ad sets + B2B-page creative ===\n')

  // 1. Update the ad set we keep: combined audience, 6 EUR/day, new name
  console.log('1. Updating kept ad set (combined audience, 6 EUR/day)...')
  const u = await api(ADSET_KEEP, 'POST', {
    name: 'B2B - paigaldajad ja edasimüüjad - Unilift CC',
    daily_budget: 600,
    targeting: {
      age_min: 25,
      age_max: 65,
      geo_locations: { countries: ['EE'], location_types: ['home', 'recent'] },
      flexible_spec: [{ interests: INTERESTS }],
      publisher_platforms: ['facebook', 'instagram'],
      facebook_positions: ['feed'],
      instagram_positions: ['stream'],
    },
  })
  console.log(u.ok ? '  OK' : '  FAIL: ' + JSON.stringify(u.data).slice(0, 300))

  // 2. Pause the split-out reseller ad set
  console.log('2. Pausing split-out reseller ad set...')
  const p = await api(ADSET_DROP, 'POST', { status: 'PAUSED' })
  console.log(p.ok ? '  OK' : '  FAIL: ' + JSON.stringify(p.data).slice(0, 300))

  // 3. New creative pointing to the B2B landing page
  console.log('3. Creating B2B-page creative...')
  const c = await api(`act_${ACCT}/adcreatives`, 'POST', {
    name: 'Unilift CC - B2B partnerleht - CC7',
    object_story_spec: {
      page_id: PAGE,
      link_data: {
        image_hash: IMG_CC7_HASH,
        link: LINK_B2B,
        message: 'Grundfos Unilift CC tühjenduspumbad hulgihindadega edasimüüjatele ja paigaldajatele.\n\nValmistu märgadeks sügisilmadeks ette: tellimus arvega, tehniline tugi ja kiire tarne laost.\n\nKüsi B2B hinnakirja või saada päring — vastame ühe tööpäeva jooksul.',
        name: 'Küsi B2B hinnakirja',
        description: 'Ametlik Grundfos edasimüüja Eestis.',
        call_to_action: { type: 'CONTACT_US', value: { link: LINK_B2B } },
      },
    },
  })
  if (!c.ok) { console.log('  FAIL: ' + JSON.stringify(c.data).slice(0, 400)); process.exit(1) }
  const creativeId = c.data.id
  console.log('  OK creative: ' + creativeId)

  // 4. Swap "küsi pakkumist" ads (both ad sets) to the new creative
  console.log('4. Swapping ads to the new creative...')
  const ads = await api(`act_${ACCT}/ads?fields=name,adset_id&limit=100`)
  for (const a of ads.data?.data || []) {
    if (!a.name.includes('küsi pakkumist')) continue
    if (a.adset_id !== ADSET_KEEP && a.adset_id !== ADSET_DROP) continue
    const r = await api(a.id, 'POST', { creative: { creative_id: creativeId } })
    console.log(`  ${r.ok ? 'OK' : 'FAIL ' + JSON.stringify(r.data).slice(0, 250)}  ${a.name}`)
  }

  console.log('\n=== DONE ===')
}
main().catch(e => { console.error(e.message); process.exit(1) })
