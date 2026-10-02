// Remarketing-kreatiivide vahetus (kasutaja tagasiside 02.10.2026): traffic-kampaaniast
// taaskasutatud kreatiivid olid teadlikkuse-tekstidega ja Stories-formaadis jääb
// primary text nähtamatu. Loome 2 UUT põhjalikku, kasu müüvat kreatiivi
// (ALPHA GO + Unilift) ja suuname 4 RMK reklaami neile. Vanad kreatiivid jäävad
// traffic-kampaaniatele puutumata (jagatud kreatiiv = jagatud sotsiaalne tõestus).
// Idempotentne. Kasutus:
//   node scripts/update-remarketing-creatives.mjs --dry-run
//   node scripts/update-remarketing-creatives.mjs
import { readFileSync } from 'fs'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'
const __dirname = dirname(fileURLToPath(import.meta.url))
try {
  const content = readFileSync(resolve(__dirname, '..', '.env.local'), 'utf-8')
  for (const line of content.split('\n')) { const t = line.trim(); if (t && !t.startsWith('#')) { const eq = t.indexOf('='); if (eq > 0) { const k = t.slice(0, eq); let v = t.slice(eq + 1); if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1); process.env[k] = v } } }
} catch {}

const TOKEN = process.env.META_ACCESS_TOKEN
const ACCT = (process.env.META_AD_ACCOUNT_ID || '').replace('act_', '')
const PAGE = process.env.META_PAGE_ID
const V = process.env.META_GRAPH_API_VERSION || 'v25.0'
const BASE = `https://graph.facebook.com/${V}`
const DRY = process.argv.includes('--dry-run')
const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

const CAMPAIGN_NAME = 'Pumbapood remarketing - EE 2026'
const UTM = 'utm_source=meta&utm_medium=paid&utm_campaign=remarketing_2026'

const COPY = {
  'ALPHA GO': {
    creativeName: 'RMK 2.0 - ALPHA GO - põhjalik',
    message: [
      'Vaatasid Grundfos ALPHA GO tsirkulatsioonipumpasid?',
      '',
      'Kolm põhjust, miks need paigaldaja tööriistakotti kuuluvad:',
      '• ALPHA1 GO ja ALPHA2 GO asendavad ligikaudu 70% integreeritud Grundfosi tsirkulatsioonipumpadest — asendus lahendatud enamasti esimesel külastusel',
      '• Grundfos GO äpp juhendab pumba valikut ja seadistust samm-sammult',
      '• Energiasäästlik mootor — kliendi elektriarve väiksem',
      '',
      'Laos Eestis, tarne 1–3 tööpäeva, tootjagarantii. Ametlik Grundfos partner.',
    ].join('\n'),
    name: 'Asendab ligikaudu 70% vanadest pumpadest',
    description: 'Laos · tarne 1–3 tööpäeva',
    cta: 'LEARN_MORE',
    link: `https://pumbapood.ee/alpha-go?${UTM}`,
  },
  'Unilift CC': {
    creativeName: 'RMK 2.0 - Unilift CC - põhjalik',
    message: [
      'Vaatasid Unilift sukelpumpasid? Lühidalt, mida nad ära teevad:',
      '',
      '• Tühjendavad keldri, basseini või mahuti — Unilift CC eemaldab vee kuni 3 mm jääktasemeni, praktiliselt kuivaks',
      '• Üks pump kolmeks tööks: drenaaživesi, heitvesi ja reovesi',
      '• Sügisvihmad on keldriüleujutuste tipp — pump käepärast tähendab, et kahju jääb ära',
      '',
      'Unilift CC al 172,75 €. Laos, tarne 1–3 tööpäeva. Ametlik Grundfos edasimüüja, tootjagarantii ja tehniline tugi.',
    ].join('\n'),
    name: 'Unilift CC — eemaldab vee kuni 3 mm-ni',
    description: 'Al 172,75 € · laos',
    cta: 'SHOP_NOW',
    link: `https://pumbapood.ee/unilift?${UTM}`,
  },
}

async function api(path, method = 'GET', body = null) {
  for (let attempt = 1; attempt <= 3; attempt++) {
    const url = `${BASE}/${path}${path.includes('?') ? '&' : '?'}access_token=${TOKEN}`
    const opt = { method }
    if (body) { opt.headers = { 'Content-Type': 'application/json' }; opt.body = JSON.stringify(body) }
    const r = await fetch(url, opt)
    const d = await r.json()
    if (d?.error?.code === 17) { console.log('  rate-limit, ootan 120s...'); await sleep(120_000); continue }
    if (!r.ok || d?.error) throw new Error(`Meta API ${method} ${path}: ` + JSON.stringify(d?.error || d).slice(0, 400))
    return d
  }
  throw new Error('rate-limit püsib')
}

console.log(`=== RMK KREATIIVIDE VAHETUS ===  režiim: ${DRY ? 'DRY RUN' : 'LIVE'}\n`)

// 1. Remarketing-kampaania reklaamid + praegused kreatiivid
const camps = await api(`act_${ACCT}/campaigns?fields=id,name&limit=200`)
const camp = (camps.data || []).find((x) => x.name === CAMPAIGN_NAME)
if (!camp) throw new Error('Remarketing-kampaaniat ei leitud')
await sleep(2000)
const ads = (await api(`${camp.id}/ads?fields=id,name,status,creative{id,name,object_story_spec}&limit=50`)).data || []

// 2. Täielikud pildihashid + instagram actor praegustest kreatiividest
const sourceSpec = {}
for (const ad of ads) {
  const key = ad.name.includes('ALPHA GO') ? 'ALPHA GO' : ad.name.includes('Unilift') ? 'Unilift CC' : null
  const ld = ad.creative?.object_story_spec?.link_data
  if (key && ld?.image_hash && !sourceSpec[key]) {
    sourceSpec[key] = {
      image_hash: ld.image_hash,
      instagram_actor_id: ad.creative.object_story_spec.instagram_actor_id,
      instagram_user_id: ad.creative.object_story_spec.instagram_user_id,
    }
    console.log(`✓ lähtekreatiiv (${key}): image_hash ${ld.image_hash.slice(0, 12)}…`)
  }
}
for (const key of Object.keys(COPY)) {
  if (!sourceSpec[key]) throw new Error(`Lähtekreatiivi ei leitud: ${key} (pildihash puudub)`)
}

// 3. Uued kreatiivid (või olemasolevate leidmine nime järgi)
console.log('\nUued kreatiivid:')
const existingCreatives = (await api(`act_${ACCT}/adcreatives?fields=id,name&limit=500`)).data || []
const creativeIds = {}
for (const [key, spec] of Object.entries(COPY)) {
  const existing = existingCreatives.find((c) => c.name === spec.creativeName)
  if (existing) {
    console.log(`  ✓ olemas: ${spec.creativeName} (id ${existing.id})`)
    creativeIds[key] = existing.id
    continue
  }
  if (DRY) {
    console.log(`  + looksin: ${spec.creativeName}`)
    console.log(`    message: ${spec.message.split('\n')[0]} … (${spec.message.length} märki)`)
    console.log(`    headline: ${spec.name} | desc: ${spec.description} | CTA: ${spec.cta}`)
    continue
  }
  const object_story_spec = {
    page_id: PAGE,
    ...(sourceSpec[key].instagram_actor_id ? { instagram_actor_id: sourceSpec[key].instagram_actor_id } : {}),
    link_data: {
      image_hash: sourceSpec[key].image_hash,
      link: spec.link,
      message: spec.message,
      name: spec.name,
      description: spec.description,
      call_to_action: { type: spec.cta, value: { link: spec.link } },
    },
  }
  const d = await api(`act_${ACCT}/adcreatives`, 'POST', { name: spec.creativeName, object_story_spec })
  console.log(`  + loodud: ${spec.creativeName} (id ${d.id})`)
  creativeIds[key] = d.id
  await sleep(2000)
}

// 4. Suuna reklaamid uutele kreatiividele
console.log('\nReklaamide ümbersuunamine:')
for (const ad of ads) {
  const key = ad.name.includes('ALPHA GO') ? 'ALPHA GO' : ad.name.includes('Unilift') ? 'Unilift CC' : null
  if (!key) continue
  const currentCreativeName = ad.creative?.name || ''
  if (ad.creative?.id === creativeIds[key] || currentCreativeName === COPY[key].creativeName) {
    console.log(`  ✓ juba õige: ${ad.name}`)
    continue
  }
  if (DRY) { console.log(`  + suunaksin: ${ad.name} → ${COPY[key].creativeName}`); continue }
  await api(`${ad.id}`, 'POST', { creative: { creative_id: creativeIds[key] } })
  console.log(`  + suunatud: ${ad.name} → ${COPY[key].creativeName}`)
  await sleep(2000)
}

console.log(DRY ? '\nDRY RUN — muudatusi ei tehtud' : '\n=== DONE ===')
