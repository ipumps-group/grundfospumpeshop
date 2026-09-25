// Ad Strength parandus (26.09.2026): Google Ads UI näitab "Poor/Average", sest
//   1) rühma populaarsed märksõnad pole täpsel kujul pealkirjades
//   2) pealkirjad pole piisavalt unikaalsed
// Laiendame kõik RSA-d 15 pealkirjani: 3 H1-pin (märksõnavormid) + 12 unikaalset
// pealkirja (täpsed märksõnavormid + USP/hind/CTA). Kirjeldused jäävad samaks
// (Google märkis need juba "unique" alla). RSA on immutable: uus sisse, vana pausile.
// Kasutus: node scripts/improve-ad-strength.mjs [--dry-run]
import { readFileSync } from 'fs'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'
const __dirname = dirname(fileURLToPath(import.meta.url))
try {
  const content = readFileSync(resolve(__dirname, '..', '.env.local'), 'utf-8')
  for (const line of content.split('\n')) { const t = line.trim(); if (t && !t.startsWith('#')) { const eq = t.indexOf('='); if (eq > 0) { const k = t.slice(0, eq); let v = t.slice(eq + 1); if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1); process.env[k] = v } } }
} catch {}
const CUST = (process.env.GOOGLE_ADS_CUSTOMER_ID || '').replace(/-/g, ''), LOGIN = (process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID || '').replace(/-/g, ''), DEV = process.env.GOOGLE_ADS_DEVELOPER_TOKEN
const DRY = process.argv.includes('--dry-run')

async function token() { const p = new URLSearchParams({ client_id: process.env.GOOGLE_ADS_CLIENT_ID, client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET, refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN, grant_type: 'refresh_token' }); const r = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: p.toString() }); const d = await r.json(); if (!d.access_token) throw new Error('OAuth failed'); return d.access_token }
async function gaql(q) { const tk = await token(); const hd = { Authorization: 'Bearer ' + tk, 'developer-token': DEV, 'Content-Type': 'application/json' }; if (LOGIN) hd['login-customer-id'] = LOGIN; const r = await fetch(`https://googleads.googleapis.com/v24/customers/${CUST}/googleAds:search`, { method: 'POST', headers: hd, body: JSON.stringify({ query: q }) }); const d = await r.json(); if (!r.ok) throw new Error('GAQL: ' + JSON.stringify(d).slice(0, 400)); return d.results || [] }
async function mutate(ops) { const tk = await token(); const hd = { Authorization: 'Bearer ' + tk, 'developer-token': DEV, 'Content-Type': 'application/json' }; if (LOGIN) hd['login-customer-id'] = LOGIN; const r = await fetch(`https://googleads.googleapis.com/v24/customers/${CUST}/adGroupAds:mutate`, { method: 'POST', headers: hd, body: JSON.stringify({ operations: ops }) }); return await r.json() }

const pin = (text) => ({ text, pinnedField: 'HEADLINE_1' })
const h = (text) => ({ text })

// 15 pealkirja rühma kohta: 3 pinned (märksõnavormid) + 12 unikaalset
const HEADLINES = {
  'Tühjenduspump': [
    pin('Tühjenduspump Laos'), pin('Tühjenduspumbad E-poes'), pin('Grundfos Tühjenduspump'),
    h('Unilift CC alates 172,75 €'), h('Vesi Keldrist Välja'), h('Keldri Tühjendamine'),
    h('Üleujutuse Kiirabi'), h('Tarne 1-3 Tööpäeva'), h('Ametlik Grundfos Partner'),
    h('Tootjagarantii'), h('Tasuta Nõustamine'), h('Hulgihinnad Ettevõtetele'),
    h('Küsi Pakkumist Täna'), h('Eemaldab 3 mm-ni Kuivaks'), h('Laos ja Kohe Saadaval'),
  ],
  'Drenaažipump': [
    pin('Drenaažipumbad Laos'), pin('Drenaažipump E-poes'), pin('Grundfos Drenaažipump'),
    h('Drenaaž Pump Laos'), h('Drenaažitööde Pump'), h('Drenaažitööd Lahendus'),
    h('Unilift CC alates 172,75 €'), h('Keldri Kuivana Hoidmine'), h('Pinnavee Ärajuhtimine'),
    h('Tarne 1-3 Tööpäeva'), h('Ametlik Grundfos Partner'), h('Tootjagarantii'),
    h('Tasuta Nõustamine'), h('Läbib 50 mm Osakesi'), h('Hulgihinnad Ettevõtetele'),
  ],
  'Sukelpump': [
    pin('Sukelpumbad Laos'), pin('Sukelpump E-poes'), pin('Grundfos Sukelpump'),
    h('Keldripump Laos'), h('Sukelpump Keldrisse'), h('Unilift CC alates 172,75 €'),
    h('Üleujutuse Kiirabi'), h('Vee Eemaldamine 3 mm-ni'), h('Tarne 1-3 Tööpäeva'),
    h('Ametlik Grundfos Partner'), h('Tootjagarantii'), h('Tasuta Nõustamine'),
    h('Hulgihinnad Ettevõtetele'), h('Küsi Pakkumist Täna'), h('Laos ja Kohe Saadaval'),
  ],
  'Tsirkulatsioonipump': [
    pin('Tsirkulatsioonipumbad'), pin('Tsirkulatsioonipump Laos'), pin('Grundfos Tsirkulatsioonipump'),
    h('ALPHA1 GO alates 170,05 €'), h('ALPHA2 GO Tippmudel'), h('Asendab Vana Pumba'),
    h('Energiasäästlik Mootor'), h('Kesk- ja Põrandaküttele'), h('Grundfos GO Äpp'),
    h('Tarne 1-3 Tööpäeva'), h('Ametlik Grundfos Partner'), h('Tootjagarantii'),
    h('Tasuta Nõustamine'), h('Küsi Pakkumist Täna'), h('Laos ja Kohe Saadaval'),
  ],
  'Küttepump': [
    pin('Küttepumbad Laos'), pin('Küttepump E-poes'), pin('Grundfos Küttepump'),
    h('Keskkütte Pump Laos'), h('Põrandakütte Pump'), h('Küttesüsteemi Pump'),
    h('ALPHA1 GO alates 170,05 €'), h('Energiasäästlik Valik'), h('Vana Pumba Asendus'),
    h('Grundfos GO Äpp'), h('Tarne 1-3 Tööpäeva'), h('Ametlik Grundfos Partner'),
    h('Tootjagarantii'), h('Tasuta Nõustamine'), h('Küsi Pakkumist Täna'),
  ],
  'Pinnavesi': [
    pin('Pinnavee Äraveopump'), pin('Pinnavee Pump Laos'), pin('Vihmavee Pump Laos'),
    h('Pinnavee Äravoolu Pump'), h('Vihmavesi Pump E-poes'), h('Pinnavesi Hoovis?'),
    h('Vesi Hoonest Eemale'), h('Sademevee Ärajuhtimine'), h('Unilift KP Roostevaba'),
    h('Unilift CC alates 172,75 €'), h('Tarne 1-3 Tööpäeva'), h('Ametlik Grundfos Partner'),
    h('Tootjagarantii'), h('Tasuta Nõustamine'), h('Laos - Osta E-poest'),
  ],
  'Avariipump': [
    pin('Avariipump Laos Eestis'), pin('Hädapump Laos'), pin('Üleujutuse Pump'),
    h('Veeavarii Pump'), h('Kelder Vett Täis?'), h('Veekahju Pump'),
    h('Vesi Keldrist Välja'), h('Hädaabi Pump Kohe'), h('Unilift CC alates 172,75 €'),
    h('Tarne 1-3 Tööpäeva'), h('Ametlik Grundfos Partner'), h('Tootjagarantii'),
    h('Tasuta Nõustamine'), h('Laos - Osta E-poest'), h('Eemaldab 3 mm-ni Kuivaks'),
  ],
  'Unilift CC - mudelid': [
    pin('Grundfos Unilift CC'), pin('Unilift CC Laos'), pin('Unilift Pump E-poes'),
    h('Unilift CC5, CC7, CC9'), h('CC alates 172,75 €'), h('Tühjenduspumbad Laos'),
    h('Vee Eemaldamine 3 mm-ni'), h('Kerge Komposiitpump'), h('Ametlik Edasimüüja'),
    h('Tarne 1-3 Tööpäeva'), h('Tootjagarantii'), h('Tasuta Nõustamine'),
    h('Hulgihinnad Ettevõtetele'), h('Küsi B2B Pakkumist'), h('Kiire Tarne Üle Eesti'),
  ],
  'B2B - edasimüüjad ja paigaldajad': [
    pin('Pumbad Edasimüüjatele'), pin('Grundfos Edasimüüja'), pin('Grundfos Hulgi'),
    h('Drenaažipump Hulgi'), h('Tühjenduspump Hulgi'), h('Paigaldaja Pump'),
    h('Pumbad Ettevõttele'), h('Hulgihinnad Paigaldajatele'), h('Arvega Ost Ettevõttele'),
    h('Üle 500 Toote Laos'), h('Tehniline Tugi'), h('Tarne 1-3 Tööpäeva'),
    h('Ametlik Grundfos Partner'), h('Küsi Hulgipakkumist'), h('Tootjagarantii'),
  ],
  'ALPHA GO - tooted': [
    pin('Grundfos ALPHA GO'), pin('ALPHA GO Pump'), pin('ALPHA GO Hind'),
    h('ALPHA1 GO alates 170,05 €'), h('ALPHA2 GO Tippmudel'), h('Uus Küttepumpade Seeria'),
    h('Asendab Vanu Pumpasid'), h('Kaks Pumpa Paljude Asemel'), h('Grundfos GO Äpp'),
    h('Laos ja Kohe Saadaval'), h('Tarne 1-3 Tööpäeva'), h('Ametlik Edasimüüja'),
    h('Tootjagarantii'), h('Tasuta Nõustamine'), h('Küsi Pakkumist Täna'),
  ],
  'Vana pumba asendus': [
    pin('Vana Pumba Asendus'), pin('Grundfos Pumba Asendus'), pin('Pumba Asendamine'),
    h('UPS -> ALPHA1 GO'), h('ALPHA1 Asendus'), h('ALPHA2 Asendus'),
    h('Küttepumba Vahetus'), h('Tsirkulatsioonipumba Asendus'), h('Grundfos GO Äpiga'),
    h('Lihtne ja Kiire'), h('Sama Ühendusmõõt'), h('Tarne 1-3 Tööpäeva'),
    h('Ametlik Grundfos Partner'), h('Küsi Nõu Spetsialistilt'), h('Tootjagarantii'),
  ],
  'Brändiotsingud-A': [
    pin('Pumbapood.ee - Grundfos'), pin('Grundfos Pumbad Eestis'), pin('Grundfos Pump Laos'),
    h('Ametlik Grundfos Edasimüüja'), h('Grundfos Eesti'), h('Üle 500 Toote Laos'),
    h('Küte Vesi Drenaaž'), h('Kiire Tarne 1-3 Päeva'), h('Tootjagarantii'),
    h('Tasuta Nõustamine'), h('Veeautomaadid ja Küttepumbad'), h('Hulgihinnad Ettevõtetele'),
    h('Küsi Pakkumist Täna'), h('Tehniline Tugi'), h('Originaaltooted'),
  ],
  'Brändiotsingud-B': [
    pin('Ametlik Grundfos Edasimüüja'), pin('Grundfos Pumbad Laos'), pin('Pumbapood.ee E-pood'),
    h('Grundfos Pump E-poes'), h('Pumba Pood'), h('Üle 500 Toote Laos'),
    h('Kiire Tarne Üle Eesti'), h('Tootjagarantii'), h('Tasuta Nõustamine'),
    h('Küttepumbad ja Veeautomaadid'), h('Drenaaži- ja Kaevupumbad'), h('Arvega Ost Ettevõttele'),
    h('Küsi Pakkumist Täna'), h('Tehniline Tugi'), h('Originaaltooted'),
  ],
}

// Rühm -> kasutatav pealkirjade kogu (brandil kaks RSA-d samas rühmas)
const JOBS = [
  { campaign: 'Unilift CC + Drenaaž - EE 2026 sügis', group: 'Tühjenduspump', key: 'Tühjenduspump' },
  { campaign: 'Unilift CC + Drenaaž - EE 2026 sügis', group: 'Drenaažipump', key: 'Drenaažipump' },
  { campaign: 'Unilift CC + Drenaaž - EE 2026 sügis', group: 'Sukelpump', key: 'Sukelpump' },
  { campaign: 'Unilift CC + Drenaaž - EE 2026 sügis', group: 'Pinnavesi', key: 'Pinnavesi' },
  { campaign: 'Unilift CC + Drenaaž - EE 2026 sügis', group: 'Avariipump', key: 'Avariipump' },
  { campaign: 'Unilift CC + Drenaaž - EE 2026 sügis', group: 'Unilift CC - mudelid', key: 'Unilift CC - mudelid' },
  { campaign: 'Unilift CC + Drenaaž - EE 2026 sügis', group: 'B2B - edasimüüjad ja paigaldajad', key: 'B2B - edasimüüjad ja paigaldajad' },
  { campaign: 'ALPHA GO - Küte - EE 2026 sügis', group: 'Tsirkulatsioonipump', key: 'Tsirkulatsioonipump' },
  { campaign: 'ALPHA GO - Küte - EE 2026 sügis', group: 'Küttepump', key: 'Küttepump' },
  { campaign: 'ALPHA GO - Küte - EE 2026 sügis', group: 'ALPHA GO - tooted', key: 'ALPHA GO - tooted' },
  { campaign: 'ALPHA GO - Küte - EE 2026 sügis', group: 'Vana pumba asendus', key: 'Vana pumba asendus' },
  { campaign: 'Pumbapood + Grundfos Brand Search - EE', group: 'Brändiotsingud', key: 'Brändiotsingud-A', marker: 'AS15-A' },
  { campaign: 'Pumbapood + Grundfos Brand Search - EE', group: 'Brändiotsingud', key: 'Brändiotsingud-B', marker: 'AS15-B' },
]

// Valideerimine
let invalid = 0
for (const [key, list] of Object.entries(HEADLINES)) {
  if (list.length !== 15) { console.error(`${key}: ${list.length} pealkirja (peab olema 15)`); invalid++ }
  const texts = list.map((x) => x.text)
  if (new Set(texts).size !== texts.length) { console.error(`${key}: duplikaatpealkirjad`); invalid++ }
  for (const hl of list) if ([...hl.text].length > 30) { console.error(`PEALKIRI >30 (${key}): "${hl.text}" (${[...hl.text].length})`); invalid++ }
}
if (invalid) { console.error(`\n${invalid} viga - paranda enne jätka.`); process.exit(1) }

console.log(DRY ? '=== DRY RUN ===' : '=== IMPROVE AD STRENGTH (15 HEADLINES) ===')

for (const job of JOBS) {
  const marker = job.marker || 'AS15'
  const rows = await gaql(`SELECT ad_group.resource_name, ad_group_ad.resource_name, ad_group_ad.ad.name, ad_group_ad.ad.final_urls, ad_group_ad.ad.responsive_search_ad.headlines, ad_group_ad.ad.responsive_search_ad.descriptions, ad_group_ad.ad.responsive_search_ad.path1, ad_group_ad.ad.responsive_search_ad.path2 FROM ad_group_ad WHERE campaign.name = '${job.campaign.replace(/'/g, "\\'")}' AND ad_group.name = '${job.group.replace(/'/g, "\\'")}' AND ad_group_ad.status = 'ENABLED' AND ad_group_ad.ad.type = 'RESPONSIVE_SEARCH_AD'`)
  // Idempotentsus: vaheta ainult RSA-sid, millel pole meie AS15-märgist
  const candidates = rows.filter((r) => !(r.adGroupAd.ad.name || '').startsWith('AS15'))
  const target = candidates[0]
  if (!target) {
    console.log(`[=] ${job.campaign} / ${job.group} (${job.key}) - juba AS15 versioon aktiivne, vahele`)
    continue
  }
  const rsa = target.adGroupAd.ad.responsiveSearchAd
  const newHeadlines = HEADLINES[job.key]
  console.log(`\n[~] ${job.campaign} / ${job.group} -> 15 pealkirja (3 pinned märksõna, kirjeldused säilivad ${rsa.descriptions.length})`)
  console.log(`    Pinned H1: ${newHeadlines.filter((x) => x.pinnedField).map((x) => x.text).join(' | ')}`)
  if (DRY) continue

  const createOp = {
    create: {
      adGroup: target.adGroup.resourceName,
      status: 'ENABLED',
      ad: {
        name: marker,
        type: 'RESPONSIVE_SEARCH_AD',
        finalUrls: target.adGroupAd.ad.finalUrls,
        responsiveSearchAd: {
          headlines: newHeadlines,
          descriptions: rsa.descriptions.map((d) => ({ text: d.text })),
          ...(rsa.path1 ? { path1: rsa.path1 } : {}),
          ...(rsa.path2 ? { path2: rsa.path2 } : {}),
        },
      },
    },
  }
  const r1 = await mutate([createOp])
  if (!r1?.results) { console.error('RSA loomine ebaõnnestus: ' + JSON.stringify(r1).slice(0, 600)); process.exit(1) }
  const r2 = await mutate([{ update: { resourceName: target.adGroupAd.resourceName, status: 'PAUSED' }, updateMask: 'status' }])
  if (!r2?.results) { console.error('Vana RSA pausimine ebaõnnestus: ' + JSON.stringify(r2).slice(0, 600)); process.exit(1) }
  console.log('    OK')
}
console.log('\n=== DONE ===')
