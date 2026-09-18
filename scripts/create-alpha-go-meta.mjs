// ALPHA GO küttekampaania — Meta Ads Traffic (PAUSED — ei avaldata)
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

const CAMPAIGN_NAME = 'ALPHA GO - Küte - EE 2026 sügis'
const STATUS = 'PAUSED' // <-- ei avaldata

const UTM = 'utm_source=meta&utm_medium=paid&utm_campaign=alpha_go_sygis_2026'
const LINK_KUTTEPUMBAD = `https://pumbapood.ee/et/tooted/kuttepumbad?${UTM}`
const LINK_CONTACT = `https://pumbapood.ee/et/leht/kontakt?${UTM}`

// Showpad pildid (juba optimeeritud ja üles laaditud)
const IMG_ALPHA2_GO = 'https://sdqnzyfmanflslsjhytf.supabase.co/storage/v1/object/public/products/images/93074218.jpg'
const IMG_ALPHA1_GO = 'https://sdqnzyfmanflslsjhytf.supabase.co/storage/v1/object/public/products/images/93074171.jpg'
const IMG_HERO = 'https://sdqnzyfmanflslsjhytf.supabase.co/storage/v1/object/public/pages/bg/alpha-go-hero.jpg'

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
  console.log('=== META: ' + CAMPAIGN_NAME + ' (STATUS: ' + STATUS + ') ===\n')

  // 1. Resolve targeting interests/behaviors
  console.log('1. Resolving targeting IDs...')
  const pick = async (fn, q, match) => {
    const res = await fn(q)
    const found = res.find(i => i.name.toLowerCase() === match.toLowerCase()) || res[0]
    if (found) console.log(`  "${q}" -> ${found.name} (${found.id})`)
    else console.log(`  "${q}" -> NOT FOUND`)
    return found ? { id: found.id, name: found.name } : null
  }
  const intPlumbing = await pick(searchInterests, 'Plumbing', 'Plumbing')
  const intHeating = await pick(searchInterests, 'Heating', 'Heating')
  const intConstruction = await pick(searchInterests, 'Construction', 'Construction')
  const intHomeImprovement = await pick(searchInterests, 'Home improvement', 'Home improvement')
  const intRenovation = await pick(searchInterests, 'Renovation', 'Renovation')
  const intBuildingMaterials = await pick(searchInterests, 'Building materials', 'Building material')
  const intWholesale = await pick(searchInterests, 'Wholesale', 'Wholesale')
  const behSmallBiz = await pick(searchBehaviors, 'Small business owners', 'Small business owners')
    || await pick(searchBehaviors, 'business owners', 'Small business owners')

  const installersInterests = [intPlumbing, intHeating, intConstruction, intHomeImprovement, intRenovation].filter(Boolean)
  const resellerInterests = [intBuildingMaterials, intWholesale, intConstruction].filter(Boolean)

  // 2. Upload images
  console.log('\n2. Uploading images...')
  const hashAlpha2 = await uploadImage(IMG_ALPHA2_GO, 'alpha2-go.jpg')
  const hashAlpha1 = await uploadImage(IMG_ALPHA1_GO, 'alpha1-go.jpg')
  const hashHero = await uploadImage(IMG_HERO, 'alpha-go-hero.jpg')
  console.log('  ALPHA2 GO hash: ' + (hashAlpha2 || 'FAIL'))
  console.log('  ALPHA1 GO hash: ' + (hashAlpha1 || 'FAIL'))
  console.log('  Hero hash: ' + (hashHero || 'FAIL'))
  if (!hashAlpha2 || !hashAlpha1 || !hashHero) { console.log('Image upload failed, aborting'); process.exit(1) }

  // 3. Create campaign (idempotent)
  console.log('\n3. Creating campaign (' + STATUS + ')...')
  let campId = null
  const existingCamps = await api(`act_${ACCT}/campaigns?fields=name,status&limit=100`)
  const found = (existingCamps.data?.data || []).find(c => c.name === CAMPAIGN_NAME)
  if (found) {
    campId = found.id
    console.log('  Reusing existing campaign: ' + campId + ' (status: ' + found.status + ')')
  } else {
    const camp = await api(`act_${ACCT}/campaigns`, 'POST', {
      name: CAMPAIGN_NAME,
      objective: 'OUTCOME_TRAFFIC',
      status: STATUS,
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
      name: 'Paigaldajad - ALPHA GO',
      daily_budget: 700,
      targeting: { ...targetingBase, flexible_spec: [{ interests: installersInterests }] },
    },
    {
      name: 'Edasimüüjad ja ehitusettevõtted - ALPHA GO',
      daily_budget: 500,
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
      status: STATUS,
    })
    if (!r.ok) { console.log('  FAIL: ' + JSON.stringify(r.data).slice(0, 400)); continue }
    adsetIds.push({ id: r.data.id, name: def.name })
    console.log('  OK: ' + r.data.id)
  }

  // 5. Creatives
  console.log('\n5. Creating creatives...')
  const creativeDefs = [
    {
      name: 'ALPHA GO - tootevalik - ALPHA2 GO',
      object_story_spec: {
        page_id: PAGE,
        link_data: {
          image_hash: hashAlpha2,
          link: LINK_KUTTEPUMBAD,
          message: 'Uus Grundfos ALPHA GO seeria on saabunud!\n\nALPHA1 GO ja ALPHA2 GO asendavad enamiku vanu UPS, ALPHA1, ALPHA2 ja ALPHA3 tsirkulatsioonipumapasid. Grundfos GO äpp juhendab asenduse ja seadistuse samm-sammult.\n\nLaos ja kohe saadaval. Vaata valikut.',
          name: 'Grundfos ALPHA GO küttepumbad',
          description: 'Kaks pumpa saja asemel.',
          call_to_action: { type: 'LEARN_MORE', value: { link: LINK_KUTTEPUMBAD } },
        },
      },
    },
    {
      name: 'ALPHA GO - küsi pakkumist - ALPHA1 GO',
      object_story_spec: {
        page_id: PAGE,
        link_data: {
          image_hash: hashAlpha1,
          link: LINK_CONTACT,
          message: 'Grundfos ALPHA GO küttepumbad hulgihindadega edasimüüjatele ja paigaldajatele.\n\nValmistu küttehooajaks ette: tellimus arvega, tehniline dokumentatsioon ja kiire tarne laost.\n\nKüsi pakkumist juba täna.',
          name: 'Küsi B2B hinnapakkumist',
          description: 'Ametlik Grundfos edasimüüja Eestis.',
          call_to_action: { type: 'CONTACT_US', value: { link: LINK_CONTACT } },
        },
      },
    },
    {
      name: 'ALPHA GO - hero - äpp ja pump',
      object_story_spec: {
        page_id: PAGE,
        link_data: {
          image_hash: hashHero,
          link: LINK_KUTTEPUMBAD,
          message: 'Grundfos GO äpp teeb pumba asenduse lihtsaks.\n\nJuhendatud seadistus, täpne kasutuselevõtt ja vähem tagasikutsumisi. Uus ALPHA GO seeria on disainitud paigaldaja tööd lihtsustama.\n\nVaata tooteid ja laadi alla Grundfos GO äpp.',
          name: 'Grundfos GO äpp + ALPHA GO',
          description: 'Ajasäästlik mängumuutja.',
          call_to_action: { type: 'LEARN_MORE', value: { link: LINK_KUTTEPUMBAD } },
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

  // 6. Ads (all creatives in both ad sets, skip existing)
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
        status: STATUS,
      })
      console.log(`  ${r.ok ? 'OK ' + r.data.id : 'FAIL ' + JSON.stringify(r.data).slice(0, 300)}  ${as.name} | ${cr.name}`)
    }
  }

  console.log('\n=== DONE — kampaania on PAUSED, ei avalda ===')
}
main().catch(e => { console.error(e.message); process.exit(1) })
