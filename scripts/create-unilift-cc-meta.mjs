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

const START = '2026-09-08T00:00:00+0300' // EEST
const END = '2026-11-30T23:59:59+0200'   // EET

const UTM = 'utm_source=meta&utm_medium=paid&utm_campaign=unilift_cc_sygis_2026'
const LINK_SERIES = `https://pumbapood.ee/et/tooted/drenaazipumbad/unilift-cc?${UTM}`
const LINK_CONTACT = `https://pumbapood.ee/et/leht/kontakt?${UTM}`

const IMG_CC9 = 'https://sdqnzyfmanflslsjhytf.supabase.co/storage/v1/object/public/products/images/96280970.jpg'
const IMG_CC7 = 'https://sdqnzyfmanflslsjhytf.supabase.co/storage/v1/object/public/products/images/98624463.jpg'

async function api(path, method = 'GET', body = null) {
  const url = `${BASE}/${path}${path.includes('?') ? '&' : '?'}access_token=${TOKEN}`
  const opt = { method }
  if (body) { opt.headers = { 'Content-Type': 'application/json' }; opt.body = JSON.stringify(body) }
  const r = await fetch(url, opt)
  const d = await r.json()
  return { ok: r.ok, data: d }
}

async function searchInterests(q) {
  const r = await api(`search?type=adinterest&q=${encodeURIComponent(q)}&limit=8&locale=en_US`)
  return r.data?.data || []
}

async function searchBehaviors(q) {
  const r = await api(`search?type=adbehavior&q=${encodeURIComponent(q)}&limit=8&locale=en_US`)
  return r.data?.data || []
}

async function uploadImage(url, name) {
  const buf = Buffer.from(await (await fetch(url)).arrayBuffer())
  const fd = new FormData()
  fd.append('filename', new Blob([buf], { type: 'image/jpeg' }), name)
  fd.append('access_token', TOKEN)
  const r = await fetch(`${BASE}/act_${ACCT}/adimages`, { method: 'POST', body: fd })
  const d = await r.json()
  const hash = d?.images?.[name]?.hash
  if (!hash) console.log('  IMG FAIL ' + name + ': ' + JSON.stringify(d).slice(0, 250))
  return hash
}

async function main() {
  console.log('=== META: Unilift CC B2B campaign ===\n')

  // 0. Pause old summer ad sets
  console.log('0. Pausing old traffic ad sets...')
  for (const [id, label] of [
    ['120250484533180120', 'veevarustus majas - veeautomaadid'],
    ['120250484536490120', 'puurkaevu veevarustus - SQ/SQE'],
    ['120250475772890120', 'aia kastmine - veeautomaadid'],
  ]) {
    const r = await api(id, 'POST', { status: 'PAUSED' })
    console.log(`  ${r.ok ? 'PAUSED' : 'FAIL ' + JSON.stringify(r.data).slice(0, 200)}  ${label}`)
  }

  // 1. Resolve targeting interests/behaviors
  console.log('\n1. Resolving targeting IDs...')
  const pick = async (fn, q, match) => {
    const res = await fn(q)
    const found = res.find(i => i.name.toLowerCase() === match.toLowerCase()) || res[0]
    if (found) console.log(`  "${q}" -> ${found.name} (${found.id})`)
    else console.log(`  "${q}" -> NOT FOUND`)
    return found ? { id: found.id, name: found.name } : null
  }
  const intPlumbing = await pick(searchInterests, 'Plumbing', 'Plumbing')
  const intConstruction = await pick(searchInterests, 'Construction', 'Construction')
  const intHomeImprovement = await pick(searchInterests, 'Home improvement', 'Home improvement')
  const intRenovation = await pick(searchInterests, 'Renovation', 'Renovation')
  const intBuildingMaterials = await pick(searchInterests, 'Building materials', 'Building material')
  const intWholesale = await pick(searchInterests, 'Wholesale', 'Wholesale')
  const behSmallBiz = await pick(searchBehaviors, 'Small business owners', 'Small business owners')
    || await pick(searchBehaviors, 'business owners', 'Small business owners')

  const installersInterests = [intPlumbing, intConstruction, intHomeImprovement, intRenovation].filter(Boolean)
  const resellerInterests = [intBuildingMaterials, intWholesale, intConstruction].filter(Boolean)

  // 2. Upload images
  console.log('\n2. Uploading images...')
  const hashCC9 = await uploadImage(IMG_CC9, 'unilift-cc9.jpg')
  const hashCC7 = await uploadImage(IMG_CC7, 'unilift-cc7.jpg')
  console.log('  CC9 hash: ' + (hashCC9 || 'FAIL'))
  console.log('  CC7 hash: ' + (hashCC7 || 'FAIL'))
  if (!hashCC9 || !hashCC7) { console.log('Image upload failed, aborting'); process.exit(1) }

  // 3. Create campaign (idempotent)
  console.log('\n3. Creating campaign...')
  const CAMP_NAME = 'Unilift CC - Tühjendus ja drenaaž B2B - EE sügis 2026'
  let campId = null
  const existingCamps = await api(`act_${ACCT}/campaigns?fields=name,status&limit=100`)
  const found = (existingCamps.data?.data || []).find(c => c.name === CAMP_NAME)
  if (found) {
    campId = found.id
    console.log('  Reusing existing campaign: ' + campId)
  } else {
    const camp = await api(`act_${ACCT}/campaigns`, 'POST', {
      name: CAMP_NAME,
      objective: 'OUTCOME_TRAFFIC',
      status: 'ACTIVE',
      special_ad_categories: [],
      buying_type: 'AUCTION',
      is_adset_budget_sharing_enabled: false,
    })
    if (!camp.ok) { console.log('  FAIL: ' + JSON.stringify(camp.data).slice(0, 400)); process.exit(1) }
    campId = camp.data.id
    console.log('  OK campaign: ' + campId)
  }

  // 4. Ad sets
  const targetingBase = {
    age_min: 25,
    age_max: 65,
    geo_locations: { countries: ['EE'], location_types: ['home', 'recent'] },
    publisher_platforms: ['facebook', 'instagram'],
    facebook_positions: ['feed'],
    instagram_positions: ['stream'],
  }

  const adsetDefs = [
    {
      name: 'Paigaldajad - Unilift CC',
      daily_budget: 600,
      targeting: { ...targetingBase, flexible_spec: [{ interests: installersInterests }] },
    },
    {
      name: 'Edasimüüjad ja ehitusettevõtted - Unilift CC',
      daily_budget: 400,
      targeting: { ...targetingBase, flexible_spec: [{ interests: resellerInterests }, ...(behSmallBiz ? [{ behaviors: [behSmallBiz] }] : [])] },
    },
  ]

  const adsetIds = []
  const existingSets = await api(`act_${ACCT}/adsets?fields=name,status,daily_budget&limit=100`)
  for (const def of adsetDefs) {
    console.log(`4. Ad set: ${def.name} (${(def.daily_budget / 100).toFixed(2)} EUR/day)...`)
    const ex = (existingSets.data?.data || []).find(s => s.name === def.name)
    if (ex) {
      adsetIds.push({ id: ex.id, name: def.name })
      console.log('  Reusing existing: ' + ex.id)
      continue
    }
    const r = await api(`act_${ACCT}/adsets`, 'POST', {
      name: def.name,
      campaign_id: campId,
      daily_budget: def.daily_budget,
      billing_event: 'IMPRESSIONS',
      optimization_goal: 'LANDING_PAGE_VIEWS',
      bid_strategy: 'LOWEST_COST_WITHOUT_CAP',
      destination_type: 'WEBSITE',
      targeting: def.targeting,
      start_time: START,
      end_time: END,
      status: 'ACTIVE',
    })
    if (!r.ok) { console.log('  FAIL: ' + JSON.stringify(r.data).slice(0, 400)); continue }
    adsetIds.push({ id: r.data.id, name: def.name })
    console.log('  OK: ' + r.data.id)
  }

  // 5. Creatives
  console.log('\n5. Creating creatives...')
  const creativeDefs = [
    {
      name: 'Unilift CC - valik laos - CC9',
      object_story_spec: {
        page_id: PAGE,
        link_data: {
          image_hash: hashCC9,
          link: LINK_SERIES,
          message: 'Sügis toob vihma ja märja ilma — kas Sinu klientidel on tühjenduspump valmis?\n\nGrundfos Unilift CC5, CC7 ja CC9 on kohe laos saadaval. Ametlik Grundfos edasimüüja Eestis: hulgihinnad, tehniline tugi ja kiire tarne üle Eesti.\n\nVaata valikut ja küsi B2B pakkumist.',
          name: 'Unilift CC tühjenduspumbad laos',
          description: 'Edasimüüjatele ja paigaldajatele.',
          call_to_action: { type: 'LEARN_MORE', value: { link: LINK_SERIES } },
        },
      },
    },
    {
      name: 'Unilift CC - küsi pakkumist - CC7',
      object_story_spec: {
        page_id: PAGE,
        link_data: {
          image_hash: hashCC7,
          link: LINK_CONTACT,
          message: 'Grundfos Unilift CC tühjenduspumbad hulgihindadega edasimüüjatele ja paigaldajatele.\n\nValmistu märgadeks sügisilmadeks ette: tellimus arvega, tehniline dokumentatsioon ja kiire tarne laost.\n\nKüsi pakkumist juba täna.',
          name: 'Küsi B2B hinnapakkumist',
          description: 'Ametlik Grundfos edasimüüja Eestis.',
          call_to_action: { type: 'CONTACT_US', value: { link: LINK_CONTACT } },
        },
      },
    },
  ]

  const creativeIds = []
  const existingCreatives = await api(`act_${ACCT}/adcreatives?fields=name&limit=100`)
  for (const c of creativeDefs) {
    const ex = (existingCreatives.data?.data || []).find(x => x.name === c.name)
    if (ex) {
      creativeIds.push({ id: ex.id, name: c.name })
      console.log('  Reusing existing: ' + c.name + ' -> ' + ex.id)
      continue
    }
    const r = await api(`act_${ACCT}/adcreatives`, 'POST', c)
    if (!r.ok) { console.log('  CREATIVE FAIL ' + c.name + ': ' + JSON.stringify(r.data).slice(0, 400)); continue }
    creativeIds.push({ id: r.data.id, name: c.name })
    console.log('  OK: ' + c.name + ' -> ' + r.data.id)
  }

  // 6. Ads (both creatives in both ad sets, skip existing)
  console.log('\n6. Creating ads...')
  const existingAds = await api(`act_${ACCT}/ads?fields=name,adset_id,creative{id}&limit=200`)
  for (const as of adsetIds) {
    for (const cr of creativeIds) {
      const dup = (existingAds.data?.data || []).find(a => a.adset_id === as.id && a.creative?.id === cr.id)
      if (dup) { console.log(`  Skip existing: ${as.name} | ${cr.name}`); continue }
      const r = await api(`act_${ACCT}/ads`, 'POST', {
        name: `${as.name} | ${cr.name}`,
        adset_id: as.id,
        creative: { creative_id: cr.id },
        status: 'ACTIVE',
      })
      console.log(`  ${r.ok ? 'OK ' + r.data.id : 'FAIL ' + JSON.stringify(r.data).slice(0, 300)}  ${as.name} | ${cr.name}`)
    }
  }

  console.log('\n=== DONE ===')
}
main().catch(e => { console.error(e.message); process.exit(1) })
