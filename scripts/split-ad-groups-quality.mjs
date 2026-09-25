// Kvaliteediparandus (25.09.2026 nädalaraport): QS 3/10 märksõnadel on ad relevance
// BELOW_AVERAGE, sest ühes rühmas on palju erinevaid märksõnu ja kõik märksõna-
// pealkirjad kinnitatud korraga H1-le -> rotatsioonis näidatakse vale pealkirja.
// Lahendus: lõhestame rühmad märksõnapõhiselt (iga rühm = oma RSA, H1-pin alati
// rühma märksõna) ja laiendame kõik RSA-d 12-15 pealkirja + 4 kirjelduseni.
// Samuti liigutame hädaabi-/vihmavee-märksõnad sobivatesse olemasolevatesse rühmadesse.
// Kasutus: node scripts/split-ad-groups-quality.mjs [--dry-run]
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
async function mutate(endpoint, ops) { const tk = await token(); const hd = { Authorization: 'Bearer ' + tk, 'developer-token': DEV, 'Content-Type': 'application/json' }; if (LOGIN) hd['login-customer-id'] = LOGIN; const r = await fetch(`https://googleads.googleapis.com/v24/customers/${CUST}/${endpoint}:mutate`, { method: 'POST', headers: hd, body: JSON.stringify({ operations: ops }) }); return await r.json() }

const pin = (text) => ({ text, pinnedField: 'HEADLINE_1' })
const h = (text) => ({ text })

// ─── RSA sisu (12-15 pealkirja, 4 kirjeldust; H1-pin ainult rühma märksõna) ───
const RSA = {
  tühjenduspump: {
    headlines: [
      pin('Tühjenduspump Laos'), pin('Tühjenduspumbad Laos'), pin('Grundfos Tühjenduspumbad'),
      h('Keldri Tühjendamine Kiireks'), h('Unilift CC alates 172,75 €'), h('Vesi Keldrist Välja'),
      h('Tarne 1-3 Tööpäeva'), h('Ametlik Grundfos Partner'), h('Tootjagarantii'),
      h('Tasuta Nõustamine'), h('Sukelpumbad Hädaabiks'), h('Hulgihinnad Ettevõtetele'),
      h('Küsi Pakkumist Täna'),
    ],
    descriptions: [
      'Grundfos UNILIFT tühjenduspumbad keldri, basseini ja mahutite tühjendamiseks. Laos.',
      'CC eemaldab vee kuni 3 mm jääktasemeni. Ametlik edasimüüja, tarne 1-3 tööpäeva.',
      'Tasuta nõustamine valikuks - aitame leida õige tühjenduspumba. Küsi pakkumist!',
      'Hulgihinnad paigaldajatele ja edasimüüjatele. Arvega ost ettevõttele.',
    ],
  },
  drenaažipump: {
    headlines: [
      pin('Drenaažipumbad Laos'), pin('Drenaažipump E-poes'), pin('Grundfos Drenaažipumbad'),
      h('Drenaaživee Ärajuhtimine'), h('Unilift CC alates 172,75 €'), h('Keldri Kuivana Hoidmine'),
      h('Tarne 1-3 Tööpäeva'), h('Ametlik Grundfos Partner'), h('Tootjagarantii'),
      h('Tasuta Nõustamine'), h('Läbib kuni 50 mm Osakesi'), h('Hulgihinnad Ettevõtetele'),
      h('Küsi Pakkumist Täna'),
    ],
    descriptions: [
      'Drenaažipumbad hoone ümbruse vee ärajuhtimiseks. UNILIFT CC, KP ja AP laos.',
      'Roostevabast terasest ja komposiidist drenaažipumbad. Tootjagarantii ja tugi.',
      'Aitame valida õige drenaažipumba - tasuta nõustamine ja kiire hinnapakkumine.',
      'Hulgihinnad paigaldajatele ja edasimüüjatele. Arvega ost ettevõttele.',
    ],
  },
  sukelpump: {
    headlines: [
      pin('Sukelpumbad Laos'), pin('Sukelpump E-poes'), pin('Grundfos Sukelpumbad'),
      h('Sukelpump Keldrisse'), h('Unilift CC alates 172,75 €'), h('Üleujutuse Kiirabi'),
      h('Tarne 1-3 Tööpäeva'), h('Ametlik Grundfos Partner'), h('Tootjagarantii'),
      h('Tasuta Nõustamine'), h('Vee Eemaldamine 3 mm-ni'), h('Hulgihinnad Ettevõtetele'),
      h('Küsi Pakkumist Täna'),
    ],
    descriptions: [
      'Grundfos UNILIFT sukelpumbad drenaaži-, heit- ja reovee eemaldamiseks. Laos.',
      'Kompaktsed ja võimsad sukelpumbad koduseks hädaabiks ja püsipaigalduseks.',
      'Tasuta nõustamine - aitame valida õige sukelpumba. Tarne 1-3 tööpäeva.',
      'Hulgihinnad paigaldajatele ja edasimüüjatele. Arvega ost ettevõttele.',
    ],
  },
  tsirkulatsioonipump: {
    headlines: [
      pin('Tsirkulatsioonipumbad'), pin('Tsirkulatsioonipump Laos'), pin('Grundfos Tsirkulatsioonipump'),
      h('ALPHA1 GO ja ALPHA2 GO'), h('Asendab Vana Pumba'), h('Energiasäästlik Mootor'),
      h('Tarne 1-3 Tööpäeva'), h('Ametlik Grundfos Partner'), h('Tootjagarantii'),
      h('Tasuta Nõustamine'), h('Grundfos GO Äpp'), h('Kesk- ja Põrandaküttele'),
      h('Küsi Pakkumist Täna'),
    ],
    descriptions: [
      'ALPHA GO tsirkulatsioonipumbad keskkütte- ja põrandaküttesüsteemidele. Laos.',
      'Asendab enamiku vanadest UPS, ALPHA1 ja ALPHA2 pumpadest. GO äpp aitab.',
      'Tasuta nõustamine asenduseks - leiame õige tsirkulatsioonipumba kohe.',
      'Ametlik Grundfos edasimüüja. Tootjagarantii ja tarne 1-3 tööpäeva.',
    ],
  },
  küttepump: {
    headlines: [
      pin('Küttepumbad Laos'), pin('Küttepump E-poes'), pin('Grundfos Küttepumbad'),
      h('Keskkütte ja Põrandaküte'), h('ALPHA1 GO ja ALPHA2 GO'), h('Energiasäästlikud Pumbad'),
      h('Tarne 1-3 Tööpäeva'), h('Ametlik Grundfos Partner'), h('Tootjagarantii'),
      h('Tasuta Nõustamine'), h('Vana Pumba Asendus'), h('Grundfos GO Äpp'),
      h('Küsi Pakkumist Täna'),
    ],
    descriptions: [
      'Energiasäästlikud Grundfos küttepumbad keskküttesüsteemi ja põrandaküttele.',
      'ALPHA GO asendab enamiku vanu küttepumpasid - sama ühendusmõõt, lihtne vahetus.',
      'Tasuta nõustamine ja kiire hinnapakkumine. Küsi õige küttepump juba täna.',
      'Ametlik Grundfos edasimüüja. Tootjagarantii ja tarne 1-3 tööpäeva.',
    ],
  },
  'unilift-mudelid': {
    headlines: [
      pin('Grundfos Unilift CC'),
      h('Unilift CC5, CC7, CC9'), h('Tühjenduspumbad Laos'), h('CC alates 172,75 €'),
      h('Ametlik Edasimüüja Eestis'), h('Vee Eemaldamine 3 mm-ni'), h('Tarne 1-3 Tööpäeva'),
      h('Tootjagarantii'), h('Tasuta Nõustamine'), h('Hulgihinnad Ettevõtetele'),
      h('Küsi B2B Pakkumist'), h('Kiire Tarne Üle Eesti'),
    ],
    descriptions: [
      'Grundfos Unilift CC tühjenduspumbad - CC5, CC7 ja CC9 laos, kohe saadaval.',
      'Kerge komposiitpump, eemaldab vee kuni 3 mm jääktasemeni. Ametlik partner.',
      'Hulgihinnad ettevõtetele, arvega ost ja kiire tarne üle Eesti. Küsi pakkumist.',
      'Tasuta nõustamine mudeli valikuks - CC5 väikesteks, CC9 suuremateks töödeks.',
    ],
  },
  b2b: {
    headlines: [
      pin('Pumbad Edasimüüjatele'),
      h('Grundfos Hulgimüük EE'), h('Unilift CC Hulgihinnad'), h('B2B Partner Pumbadele'),
      h('Tehniline Tugi ja Tarne'), h('Arvega Ost Ettevõttele'), h('Ametlik Grundfos Partner'),
      h('Üle 500 Toote Laos'), h('Tarne 1-3 Tööpäeva'), h('Tootjagarantii'),
      h('Küsi Hulgipakkumist'), h('Hinnad Ettevõtetele'),
    ],
    descriptions: [
      'Grundfos pumbad hulgihinnaga edasimüüjatele ja paigaldajatele. Küsi pakkumist.',
      'Unilift CC seeria laos. Arvega ost, tehniline tugi ja kiire tarne üle Eesti.',
      'Ametlik Grundfos partner Eestis - üle 500 toote laos ja B2B tingimused.',
      'Liitu partneriks: hulgihinnad, laoinfo ja müügimaterjalid paigaldajatele.',
    ],
  },
  avariipump: {
    headlines: [
      pin('Avariipump Laos Eestis'),
      h('Kelder Vett Täis?'), h('Grundfos Unilift KP'), h('Hädapump Üleujutuseks'),
      h('Sukelpump Kiireks Abiks'), h('Laos - Osta E-poest'), h('Tarne 1-3 Tööpäeva'),
      h('Vesi Keldrist Välja'), h('Tootjagarantii'), h('Tasuta Nõustamine'),
      h('Unilift CC alates 172,75 €'), h('Ametlik Grundfos Partner'),
    ],
    descriptions: [
      'Grundfos Unilift avariipumbad: vesi kiiresti keldrist välja. Laos, osta e-poest.',
      'Paduvihm ujutas keldri üle? Unilift pump pumbab vee ära - tarne 1-3 päeva.',
      'Hädapump veeavariiks ja üleujutuseks. CC eemaldab vee kuni 3 mm tasemeni.',
      'Ametlik Grundfos edasimüüja. Tootjagarantii ja tasuta nõustamine.',
    ],
  },
  pinnavesi: {
    headlines: [
      pin('Pinnavee Äraveopump'),
      h('Pinnavesi Hoovis?'), h('Grundfos Unilift KP'), h('Vihmavee Ärajuhtimine'),
      h('Drenaažipump Pinnaveele'), h('Laos - Osta E-poest'), h('Tarne 1-3 Tööpäeva'),
      h('Vesi Hoonest Eemale'), h('Tootjagarantii'), h('Tasuta Nõustamine'),
      h('Ametlik Grundfos Partner'), h('Unilift CC alates 172,75 €'),
    ],
    descriptions: [
      'Grundfos Unilift pinnavee äravooluks hoovist ja hoonest. Laos, osta e-poest.',
      'Vihma- ja pinnavesi hoonest eemale. Unilift KP ja AP pumbad kohe laost.',
      'Sademevesi ujutab hoovi üle? Leiame õige pumba - tasuta nõustamine.',
      'Ametlik Grundfos edasimüüja. Tootjagarantii ja tarne 1-3 tööpäeva.',
    ],
  },
  'alpha-tooted': {
    headlines: [
      pin('Grundfos ALPHA GO'),
      h('Uus Küttepumpade Seeria'), h('ALPHA1 GO ja ALPHA2 GO'), h('Asendab Vanu Pumpasid'),
      h('Grundfos GO Äpp'), h('Laos ja Kohe Saadaval'), h('Ametlik Edasimüüja'),
      h('Tarne 1-3 Tööpäeva'), h('Tootjagarantii'), h('Tasuta Nõustamine'),
      h('Kaks Pumpa Paljude Asemel'), h('Küsi Pakkumist Täna'),
    ],
    descriptions: [
      'Uued ALPHA GO küttepumbad asendavad enamiku vanu UPS ja ALPHA pumapasid.',
      'Grundfos GO äpp juhendab asenduse ja seadistuse. Küsi nõu spetsialistidelt.',
      'ALPHA1 GO 25-80 ja ALPHA2 GO 25-75 katavad ligikaudu 70% integreeritud pumpadest.',
      'Ametlik Grundfos edasimüüja. Laos Eestis, tarne 1-3 tööpäeva.',
    ],
  },
  asendus: {
    headlines: [
      pin('Vana Pumba Asendus'),
      h('UPS -> ALPHA1 GO'), h('ALPHA2/3 -> ALPHA2 GO'), h('Lihtne ja Kiire Asendus'),
      h('Grundfos GO Äpiga'), h('Säästa Aega ja Raha'), h('Sama Ühendusmõõt'),
      h('Tarne 1-3 Tööpäeva'), h('Tootjagarantii'), h('Tasuta Nõustamine'),
      h('Ametlik Grundfos Partner'), h('Küsi Nõu Spetsialistilt'),
    ],
    descriptions: [
      'ALPHA1 GO asendab UPS, vana ALPHA1 ja ALPHA1 L. ALPHA2 GO asendab ALPHA2/3.',
      'Grundfos GO äpp teeb asenduse lihtsaks - juhendatud seadistus ühe käiguga.',
      'Vanad UPS ja ALPHA mudelid lõppevad. Leiame õige asenduse kohe - küsi nõu.',
      'Ametlik Grundfos edasimüüja. Laos Eestis, tarne 1-3 tööpäeva.',
    ],
  },
  'brand-a': {
    headlines: [
      pin('Pumbapood.ee - Grundfos'), pin('Grundfos Pumbad Eestis'), pin('Ametlik Grundfos Edasimüüja'),
      h('Üle 500 Toote Laos'), h('Küte Vesi Drenaaž'), h('Kiire Tarne 1-3 Päeva'),
      h('Tootjagarantii'), h('Tasuta Nõustamine'), h('Veeautomaadid ja Küttepumbad'),
      h('Hulgihinnad Ettevõtetele'), h('Küsi Pakkumist Täna'), h('Tehniline Tugi'),
    ],
    descriptions: [
      'Ametlik Grundfos edasimüüja Eestis. Üle 500 toote laos, tasuta konsultatsioon.',
      'Kütte-, vee-, drenaaži- ja kaevupumbad. Kiire tarne üle Eesti 1-3 tööpäeva.',
      'Tootjagarantii ja originaaltooted. Küsi pakkumist - vastame kiiresti.',
      'Hulgihinnad paigaldajatele ja edasimüüjatele. Arvega ost ettevõttele.',
    ],
  },
  'brand-b': {
    headlines: [
      pin('Ametlik Grundfos Edasimüüja'), pin('Grundfos Pumbad Laos'), pin('Pumbapood.ee E-pood'),
      h('Üle 500 Toote Laos'), h('Kiire Tarne Üle Eesti'), h('Tootjagarantii'),
      h('Tasuta Nõustamine'), h('Küttepumbad ja Veeautomaadid'), h('Drenaaži- ja Kaevupumbad'),
      h('Arvega Ost Ettevõttele'), h('Küsi Pakkumist Täna'), h('Tehniline Tugi'),
    ],
    descriptions: [
      'Parimad Grundfos pumbad Eestis. Konsultatsioon, müük ja tugi ühest kohast.',
      'Otsid töökindlat pumpa? Vaata valikut ja hindu e-poes - tarne 1-3 päeva.',
      'Üle 500 Grundfos toote laos: veeautomaadid, kütte-, drenaaži- ja reoveepumbad.',
      'Ametlik partner - tootjagarantii, tehniline tugi ja B2B tingimused.',
    ],
  },
}

// ─── Tegevusplaan ───
const UNILIFT = 'Unilift CC + Drenaaž - EE 2026 sügis'
const ALPHA = 'ALPHA GO - Küte - EE 2026 sügis'
const BRAND = 'Pumbapood + Grundfos Brand Search - EE'
const URL_UNILIFT = 'https://pumbapood.ee/unilift'
const URL_ALPHA = 'https://pumbapood.ee/alpha-go'

const NEW_GROUPS = [
  { campaign: UNILIFT, name: 'Tühjenduspump', cpc: 500000, kw: ['tühjenduspump', 'tühjenduspumbad'], rsa: RSA['tühjenduspump'], url: URL_UNILIFT, path1: 'unilift', path2: 'tyhjendus' },
  { campaign: UNILIFT, name: 'Drenaažipump', cpc: 500000, kw: ['drenaažipump', 'drenaažipumbad', 'drenaaž pump', 'drenaaži pump', 'drenaažitööde pump', 'drenaažitööd'], rsa: RSA['drenaažipump'], url: URL_UNILIFT, path1: 'unilift', path2: 'drenaaz' },
  { campaign: UNILIFT, name: 'Sukelpump', cpc: 500000, kw: ['sukelpump', 'sukelpumbad', 'keldripump'], rsa: RSA['sukelpump'], url: URL_UNILIFT, path1: 'unilift', path2: 'sukelpump' },
  { campaign: ALPHA, name: 'Tsirkulatsioonipump', cpc: 600000, kw: ['tsirkulatsioonipump', 'tsirkulatsioonipumbad'], rsa: RSA['tsirkulatsioonipump'], url: URL_ALPHA, path1: 'alpha-go', path2: 'tsirkulatsioon' },
  { campaign: ALPHA, name: 'Küttepump', cpc: 600000, kw: ['küttepump', 'küttepumbad', 'keskkütte pump', 'küttesüsteemi pump', 'põrandakütte pump', 'grundfos küttepump'], rsa: RSA['küttepump'], url: URL_ALPHA, path1: 'alpha-go', path2: 'kuttepump' },
]

const MOVES = [
  { campaign: UNILIFT, to: 'Avariipump', kw: ['üleujutus', 'kelder vett täis', 'kelder täis vett', 'veekahju pump', 'üleujutuse pump'] },
  { campaign: UNILIFT, to: 'Pinnavesi', kw: ['vihmavee pump', 'vihmavesi pump'] },
]

const EXPAND = [
  { campaign: UNILIFT, group: 'Unilift CC - mudelid', rsa: RSA['unilift-mudelid'] },
  { campaign: UNILIFT, group: 'B2B - edasimüüjad ja paigaldajad', rsa: RSA['b2b'] },
  { campaign: UNILIFT, group: 'Avariipump', rsa: RSA['avariipump'] },
  { campaign: UNILIFT, group: 'Pinnavesi', rsa: RSA['pinnavesi'] },
  { campaign: ALPHA, group: 'ALPHA GO - tooted', rsa: RSA['alpha-tooted'] },
  { campaign: ALPHA, group: 'Vana pumba asendus', rsa: RSA['asendus'] },
  { campaign: BRAND, group: 'Brändiotsingud', rsa: RSA['brand-a'] },
  { campaign: BRAND, group: 'Brändiotsingud', rsa: RSA['brand-b'] },
]

const OLD_GROUPS = [
  { campaign: UNILIFT, name: 'Drenaaž ja tühjendus' },
  { campaign: ALPHA, name: 'Küttepumbad ja tsirkulatsioonipumbad' },
]

// ─── Valideerimine ───
let invalid = 0
for (const [key, rsa] of Object.entries(RSA)) {
  for (const hl of rsa.headlines) if ([...hl.text].length > 30) { console.error(`PEALKIRI >30 (${key}): "${hl.text}" (${[...hl.text].length})`); invalid++ }
  for (const d of rsa.descriptions) if ([...d].length > 90) { console.error(`KIRJELDUS >90 (${key}): "${d}" (${[...d].length})`); invalid++ }
}
if (invalid) { console.error(`\n${invalid} tekstilimiidi viga - paranda enne jätka.`); process.exit(1) }

console.log(DRY ? '=== DRY RUN ===' : '=== SPLIT AD GROUPS + FULL RSAs ===')

// Ressurside hankimine
const camps = await gaql(`SELECT campaign.id, campaign.name, campaign.resource_name, campaign.status FROM campaign WHERE campaign.status = 'ENABLED'`)
const campByName = new Map(camps.map((c) => [c.campaign.name, c.campaign]))
const groups = await gaql(`SELECT campaign.name, ad_group.id, ad_group.name, ad_group.resource_name, ad_group.status FROM ad_group WHERE campaign.status = 'ENABLED'`)
const groupKey = (c, g) => `${c}|||${g}`
const groupByKey = new Map(groups.map((g) => [groupKey(g.campaign.name, g.adGroup.name), g.adGroup]))
const kws = await gaql(`SELECT campaign.name, ad_group.name, ad_group_criterion.criterion_id, ad_group_criterion.resource_name, ad_group_criterion.keyword.text, ad_group_criterion.status FROM keyword_view WHERE campaign.status = 'ENABLED' AND ad_group.status = 'ENABLED'`)
const rsas = await gaql(`SELECT campaign.name, ad_group.name, ad_group.resource_name, ad_group_ad.resource_name, ad_group_ad.ad.final_urls, ad_group_ad.ad.responsive_search_ad.headlines, ad_group_ad.ad.responsive_search_ad.path1, ad_group_ad.ad.responsive_search_ad.path2, ad_group_ad.status FROM ad_group_ad WHERE campaign.status = 'ENABLED' AND ad_group_ad.status = 'ENABLED' AND ad_group_ad.ad.type = 'RESPONSIVE_SEARCH_AD'`)

const esc = (s) => s.replace(/'/g, "\\'")

// 1) Uued rühmad + märksõnad + RSA
for (const g of NEW_GROUPS) {
  const camp = campByName.get(g.campaign)
  if (!camp) { console.error(`Kampaaniat ei leitud: ${g.campaign}`); process.exit(1) }
  if (groupByKey.has(groupKey(g.campaign, g.name))) { console.log(`Rühm "${g.name}" on juba olemas - jätan vahele`); continue }
  console.log(`\n[+] Uus rühm: ${g.campaign} / ${g.name} (maxCPC ${(g.cpc / 1e6).toFixed(2)} EUR)`)
  console.log(`    Märksõnad: ${g.kw.join(', ')}`)
  console.log(`    RSA: ${g.rsa.headlines.length} pealkirja (${g.rsa.headlines.filter((x) => x.pinnedField).length} pinned H1), ${g.rsa.descriptions.length} kirjeldust -> ${g.url}`)
  if (DRY) continue

  const r1 = await mutate('adGroups', [{ create: { campaign: camp.resourceName, name: g.name, status: 'ENABLED', cpcBidMicros: String(g.cpc) } }])
  if (!r1?.results) { console.error('Rühma loomine ebaõnnestus: ' + JSON.stringify(r1).slice(0, 500)); process.exit(1) }
  const agRes = r1.results[0].resourceName
  console.log(`    Loodud: ${agRes}`)

  const kwOps = g.kw.map((text) => ({ create: { adGroup: agRes, status: 'ENABLED', keyword: { text, matchType: 'PHRASE' } } }))
  const r2 = await mutate('adGroupCriteria', kwOps)
  if (!r2?.results) { console.error('Märksõnade loomine ebaõnnestus: ' + JSON.stringify(r2).slice(0, 500)); process.exit(1) }
  console.log(`    Märksõnad lisatud (${kwOps.length})`)

  const rsaOp = { create: { adGroup: agRes, status: 'ENABLED', ad: { type: 'RESPONSIVE_SEARCH_AD', finalUrls: [g.url], responsiveSearchAd: { headlines: g.rsa.headlines, descriptions: g.rsa.descriptions.map((t) => ({ text: t })), path1: g.path1, path2: g.path2 } } } }
  const r3 = await mutate('adGroupAds', [rsaOp])
  if (!r3?.results) { console.error('RSA loomine ebaõnnestus: ' + JSON.stringify(r3).slice(0, 500)); process.exit(1) }
  console.log(`    RSA loodud`)
}

// 2) Märksõnade liigutused olemasolevatesse rühmadesse
for (const m of MOVES) {
  const target = groupByKey.get(groupKey(m.campaign, m.to))
  if (!target) { console.error(`Sihtrühma ei leitud: ${m.to}`); process.exit(1) }
  console.log(`\n[>] Liigutan ${m.kw.length} märksõna -> ${m.to}: ${m.kw.join(', ')}`)
  if (DRY) continue
  const existing = new Set(kws.filter((k) => k.campaign.name === m.campaign && k.adGroup.name === m.to).map((k) => k.adGroupCriterion.keyword.text))
  const ops = m.kw.filter((t) => !existing.has(t)).map((text) => ({ create: { adGroup: target.resourceName, status: 'ENABLED', keyword: { text, matchType: 'PHRASE' } } }))
  if (ops.length === 0) { console.log('    Kõik juba olemas - vahele'); continue }
  const r = await mutate('adGroupCriteria', ops)
  if (!r?.results) { console.error('Liigutamine ebaõnnestus: ' + JSON.stringify(r).slice(0, 500)); process.exit(1) }
  console.log(`    Lisatud ${ops.length} märksõna`)
}

// 3) Vanade rühmade märksõnade eemaldamine + RSA/rühma pausile
for (const og of OLD_GROUPS) {
  const grp = groupByKey.get(groupKey(og.campaign, og.name))
  if (!grp) { console.log(`Vana rühma "${og.name}" ei leitud (või juba eemaldatud)`); continue }
  const oldKws = kws.filter((k) => k.campaign.name === og.campaign && k.adGroup.name === og.name)
  const oldAds = rsas.filter((a) => a.campaign.name === og.campaign && a.adGroup.name === og.name)
  console.log(`\n[-] Vana rühm: ${og.name} - eemaldan ${oldKws.length} märksõna, pausin ${oldAds.length} RSA ja rühma`)
  if (DRY) continue
  if (oldKws.length) {
    const r = await mutate('adGroupCriteria', oldKws.map((k) => ({ remove: k.adGroupCriterion.resourceName })))
    if (!r?.results) { console.error('Märksõnade eemaldamine ebaõnnestus: ' + JSON.stringify(r).slice(0, 500)); process.exit(1) }
  }
  for (const a of oldAds) {
    const r = await mutate('adGroupAds', [{ update: { resourceName: a.adGroupAd.resourceName, status: 'PAUSED' }, updateMask: 'status' }])
    if (!r?.results) { console.error('RSA pausimine ebaõnnestus: ' + JSON.stringify(r).slice(0, 500)); process.exit(1) }
  }
  const r = await mutate('adGroups', [{ update: { resourceName: grp.resourceName, status: 'PAUSED' }, updateMask: 'status' }])
  if (!r?.results) { console.error('Rühma pausimine ebaõnnestus: ' + JSON.stringify(r).slice(0, 500)); process.exit(1) }
  console.log('    OK')
}

// 4) Olemasolevate rühmade RSA-de laiendamine (uus RSA sisse, vana pausile)
for (const e of EXPAND) {
  const grp = groupByKey.get(groupKey(e.campaign, e.group))
  if (!grp) { console.error(`Rühma ei leitud: ${e.group}`); process.exit(1) }
  const oldAds = rsas.filter((a) => a.campaign.name === e.campaign && a.adGroup.name === e.group)
  // Idempotentsus: kui rühmas on juba laiendatud RSA (>=10 pealkirja), jätame vahele
  if (oldAds.some((a) => (a.adGroupAd?.ad?.responsiveSearchAd?.headlines || []).length >= 10)) {
    console.log(`\n[=] ${e.campaign} / ${e.group} - laiendatud RSA juba olemas, jätan vahele`)
    continue
  }
  const old = oldAds[0]
  const finalUrls = old?.adGroupAd?.ad?.finalUrls || [e.campaign === ALPHA ? URL_ALPHA : URL_UNILIFT]
  console.log(`\n[~] RSA laiendus: ${e.campaign} / ${e.group} -> ${e.rsa.headlines.length} pealkirja, ${e.rsa.descriptions.length} kirjeldust (vanu RSA-sid: ${oldAds.length})`)
  if (DRY) continue
  const rsaOp = { create: { adGroup: grp.resourceName, status: 'ENABLED', ad: { type: 'RESPONSIVE_SEARCH_AD', finalUrls, responsiveSearchAd: { headlines: e.rsa.headlines, descriptions: e.rsa.descriptions.map((t) => ({ text: t })), ...(old?.adGroupAd?.ad?.responsiveSearchAd?.path1 ? { path1: old.adGroupAd.ad.responsiveSearchAd.path1 } : {}), ...(old?.adGroupAd?.ad?.responsiveSearchAd?.path2 ? { path2: old.adGroupAd.ad.responsiveSearchAd.path2 } : {}) } } } }
  const r = await mutate('adGroupAds', [rsaOp])
  if (!r?.results) { console.error('RSA loomine ebaõnnestus: ' + JSON.stringify(r).slice(0, 600)); process.exit(1) }
  for (const a of oldAds) {
    const r2 = await mutate('adGroupAds', [{ update: { resourceName: a.adGroupAd.resourceName, status: 'PAUSED' }, updateMask: 'status' }])
    if (!r2?.results) { console.error('Vana RSA pausimine ebaõnnestus: ' + JSON.stringify(r2).slice(0, 500)); process.exit(1) }
  }
  console.log('    OK')
}

console.log('\n=== DONE ===')
