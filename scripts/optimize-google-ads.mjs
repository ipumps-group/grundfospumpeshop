import { readFileSync } from 'fs'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
try {
  const c = readFileSync(resolve(__dirname, '..', '.env.local'), 'utf-8')
  for (const line of c.split('\n')) {
    const t = line.trim()
    if (t && !t.startsWith('#')) {
      const eq = t.indexOf('=')
      if (eq > 0) {
        const k = t.slice(0, eq)
        let v = t.slice(eq + 1)
        if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1)
        if (k !== 'Vercel token') process.env[k] = v
      }
    }
  }
} catch {}

const CUST = '2639481819', LOGIN = '6134277350', V = 'v24', DEV = process.env.GOOGLE_ADS_DEVELOPER_TOKEN

async function token() {
  const p = new URLSearchParams({ client_id: process.env.GOOGLE_ADS_CLIENT_ID, client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET, refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN, grant_type: 'refresh_token' })
  return (await (await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: p.toString() })).json()).access_token
}

async function gaql(q) {
  const tk = await token()
  const hd = { Authorization: 'Bearer ' + tk, 'developer-token': DEV, 'Content-Type': 'application/json' }
  if (LOGIN) hd['login-customer-id'] = LOGIN
  const r = await fetch(`https://googleads.googleapis.com/${V}/customers/${CUST}/googleAds:search`, { method: 'POST', headers: hd, body: JSON.stringify({ query: q }) })
  return (await r.json()).results || []
}

async function mutate(ops, entityPath) {
  const tk = await token()
  const hd = { Authorization: 'Bearer ' + tk, 'developer-token': DEV, 'Content-Type': 'application/json' }
  if (LOGIN) hd['login-customer-id'] = LOGIN
  const url = `https://googleads.googleapis.com/${V}/customers/${CUST}/${entityPath}:mutate`
  const r = await fetch(url, { method: 'POST', headers: hd, body: JSON.stringify({ operations: ops }) })
  const d = await r.json()
  if (!r.ok) {
    const errs = d?.error?.details?.[0]?.errors || []
    if (errs.length > 0) console.error('  ' + errs.map(e => e.message).join('; '))
    else console.error('  Error: ' + JSON.stringify(d).slice(0, 400))
    return null
  }
  return d
}

const campaignId = '23912990830'

// ═══════════════════════════════════════════════
// STEP 1: Pause low QS keywords
// ═══════════════════════════════════════════════
console.log('=== STEP 1: Pausing low QS keywords ===')
const lowQS = await gaql('SELECT ad_group_criterion.resource_name, ad_group_criterion.keyword.text, ad_group_criterion.quality_info.quality_score FROM keyword_view WHERE campaign.status != "REMOVED" AND ad_group_criterion.status = "ENABLED" AND ad_group_criterion.quality_info.quality_score <= 3')

let paused = 0
for (const r of lowQS) {
  const kw = r.adGroupCriterion, qs = kw?.qualityInfo?.qualityScore || 0, text = kw?.keyword?.text || ''
  if (!text.toLowerCase().includes('grundfos')) {
    console.log(`  Pausing QS=${qs}: "${text}"`)
    await mutate([{ updateMask: 'status', update: { resourceName: kw.resourceName, status: 'PAUSED' } }], 'adGroupCriteria')
    paused++
  }
}
console.log(`  Paused: ${paused}\n`)

// ═══════════════════════════════════════════════
// STEP 2: Campaign negative keywords  
// ═══════════════════════════════════════════════
console.log('=== STEP 2: Adding campaign negative keywords ===')
const negatives = [
  'milline','kuidas','ise','remont','hooldus','juhis','õpetus',
  'hind','odav','soodne','kasutatud','töö','tööpakkumine','cv',
  'diagramm','juhend','paigaldusjuhend','kasutusjuhend',
  'mootor','varuosa','varuosad','tihend','tihendid','laager','laagrid',
]

const negOps = negatives.map((kw, i) => ({
  create: {
    campaign: `customers/${CUST}/campaigns/${campaignId}`,
    negative: true,
    keyword: { text: kw, matchType: 'BROAD' },
  },
}))
const negRes = await mutate(negOps, 'campaignCriteria')
console.log(`  Added: ${negRes?.results?.length || 0} negative keywords\n`)

// ═══════════════════════════════════════════════
// STEP 3: Create Brand campaign
// ═══════════════════════════════════════════════
console.log('=== STEP 3: Creating Brand campaign ===')

// Create campaign budget first
const budgetRes = await mutate([{
  create: {
    name: 'Brand Campaign Budget',
    amountMicros: '20000000',
    deliveryMethod: 'STANDARD',
    explicitlyShared: false,
  },
}], 'campaignBudgets')

if (!budgetRes?.results?.[0]) { console.error('Failed budget'); process.exit(1) }
const budgetResource = budgetRes.results[0].resourceName
console.log('  Budget: ' + budgetResource)

// Create campaign
const campRes = await mutate([{
  create: {
    name: 'Pumbapood Brand Search - EE 20260629',
    status: 'ENABLED',
    advertisingChannelType: 'SEARCH',
    campaignBudget: budgetResource,
    biddingStrategyConfiguration: { biddingStrategyType: 'MAXIMIZE_CONVERSIONS' },
    manualCpc: { enhancedCpcEnabled: false },
    startDate: '20260629',
    networkSettings: { targetGoogleSearch: true, targetSearchNetwork: true, targetContentNetwork: false, targetPartnerSearchNetwork: false },
    geoLocationType: 'PRESENCE',
    language: 'et',
  },
}], 'campaigns')

if (!campRes?.results?.[0]) { console.error('Failed campaign'); process.exit(1) }
const brandCampId = campRes.results[0].resourceName.split('/').pop()
console.log('  Campaign ID: ' + brandCampId)

// Add campaign-level negative keywords for brand campaign too
await mutate(negatives.map(kw => ({
  create: {
    campaign: `customers/${CUST}/campaigns/${brandCampId}`,
    negative: true,
    keyword: { text: kw, matchType: 'BROAD' },
  },
})), 'campaignCriteria')
console.log('  Campaign negatives added')

// Create ad group
const agRes = await mutate([{
  create: {
    name: 'Brändiotsingud',
    status: 'ENABLED',
    campaign: `customers/${CUST}/campaigns/${brandCampId}`,
    type: 'SEARCH_STANDARD',
    cpcBidMicros: '600000',
  },
}], 'adGroups')
const brandAgId = agRes.results[0].resourceName.split('/').pop()
console.log('  Ad Group ID: ' + brandAgId)

// Create brand keywords
const brandKeywords = [
  { text: 'pumbapood', matchType: 'EXACT', bid: '800000' },
  { text: 'pump ou', matchType: 'EXACT', bid: '800000' },
  { text: 'grundfos eesti', matchType: 'PHRASE', bid: '600000' },
  { text: 'grundfos pumbad', matchType: 'PHRASE', bid: '600000' },
  { text: 'pumba pood', matchType: 'PHRASE', bid: '500000' },
  { text: 'grundfos edasimüüja', matchType: 'PHRASE', bid: '600000' },
  { text: 'pumbad tallinn', matchType: 'PHRASE', bid: '400000' },
  { text: 'grundfos pump', matchType: 'PHRASE', bid: '600000' },
  { text: 'pump', matchType: 'BROAD', bid: '400000' },
]
const kwRes = await mutate(brandKeywords.map(kw => ({
  create: {
    adGroup: `customers/${CUST}/adGroups/${brandAgId}`,
    status: 'ENABLED',
    keyword: { text: kw.text, matchType: kw.matchType },
    cpcBidMicros: kw.bid,
  },
})), 'adGroupCriteria')
console.log('  Keywords: ' + (kwRes?.results?.length || 0))

// Create 2 RSA ads
const headlines1 = ['Pumbapood.ee | Grundfos Ametlik Edasimüüja', 'Grundfos Pumbad Eestis — Üle 500 Toote Laos', 'Grundfos Pumbad — Kiire Tarne ja Paigaldus']
const desc1 = ['Ametlik Grundfos edasimüüja Eestis. Üle 500 toote laos, tasuta konsultatsioon ja paigaldus.', 'Grundfos kütte-, puurkaevu-, drenaaži- ja veeautomaadid. Kiire tarne üle Eesti.']

const headlines2 = ['Pumbapood — Sinu Usaldusväärne Pumpade Tarnija', 'Küte, Vesi, Drenaaž | Grundfos Pumbad Kohapeal', 'Vajad Pumpa? Vaata Meie Valikut — Pumbapood.ee']
const desc2 = ['Parimad Grundfos pumbad Eestis. Konsultatsioon, müük ja paigaldus ühest kohast — Pumbapood.ee.', 'Otsid töökindlat pumpa? Grundfos pumbad laos — vaata hinda ja telli kohe! Küsi nõu meie ekspertidelt.']

const adRes = await mutate([
  { create: { adGroup: `customers/${CUST}/adGroups/${brandAgId}`, status: 'ENABLED', ad: { name: 'Brand RSA v1', type: 'RESPONSIVE_SEARCH_AD', finalUrls: ['https://pumbapood.ee/'], responsiveSearchAd: { headlines: headlines1.map((h, i) => ({ text: h, pinnedField: i === 0 ? 'HEADLINE_1' : 'UNSPECIFIED' })), descriptions: desc1.map(d => ({ text: d })), path1: 'grundfos', path2: 'pumbad' } } } },
  { create: { adGroup: `customers/${CUST}/adGroups/${brandAgId}`, status: 'ENABLED', ad: { name: 'Brand RSA v2', type: 'RESPONSIVE_SEARCH_AD', finalUrls: ['https://pumbapood.ee/'], responsiveSearchAd: { headlines: headlines2.map((h, i) => ({ text: h, pinnedField: i === 0 ? 'HEADLINE_1' : 'UNSPECIFIED' })), descriptions: desc2.map(d => ({ text: d })), path1: 'pumbad', path2: 'eesti' } } } },
], 'adGroupAds')
console.log('  Ads: ' + (adRes?.results?.length || 0))

console.log('\nBRAND CAMPAIGN: ✓')
console.log('  Campaign: customers/' + CUST + '/campaigns/' + brandCampId)
console.log('  Ad Group: ' + brandAgId)

// ═══════════════════════════════════════════════
// STEP 4: Additional RSAs for existing groups
// ═══════════════════════════════════════════════
console.log('\n=== STEP 4: Additional RSAs for active ad groups ===')

const ags = await gaql(`SELECT ad_group.id, ad_group.name FROM ad_group WHERE ad_group.status = "ENABLED" AND campaign.id = ${campaignId}`)

const templates = {
  'veeautomaadid ja aiapumbad': {
    ads: [
      { h: ['Grundfos Veeautomaadid | Pump OÜ', 'Rõhutõstepumbad Laos', 'SCALA, SBA, JP — Kohal'], d: ['Grundfos SCALA, SBA, JP veeautomaadid. Püsiv veesurve kodule — telli juba täna!'], url: 'https://pumbapood.ee/tooted/veeautomaadid', p1: 'veeautomaadid', p2: 'grundfos' },
      { h: ['Madal Veesurve? | Grundfos Aitab', 'Aiapumbad | Kiire Tarne', 'Veeautomaadid — Lai Valik'], d: ['Probleemid veesurvega? Meie Grundfos pumbad lahendavad selle. Vaata tootevalikut!'], url: 'https://pumbapood.ee/tooted/veeautomaadid', p1: 'veeautomaadid', p2: '' },
    ],
  },
  'puurkaevu- ja kaevupumbad': {
    ads: [
      { h: ['Grundfos Puurkaevupumbad | SQ, SQE', 'Kvaliteetsed Kaevupumbad Laos', 'Puurkaevupumbad — Pump OÜ'], d: ['Grundfos SQ, SQE puurkaevupumbad. Töökindlad ja energiasäästlikud lahendused joogivee saamiseks.'], url: 'https://pumbapood.ee/tooted/puurkaevupumbad', p1: 'puurkaevupumbad', p2: 'grundfos' },
      { h: ['Vesi Otse Kaevust | Grundfos Pumbad', 'Puurkaevupumba Valik ja Paigaldus', 'SQE, SP Komplektid — Pump OÜ'], d: ['Õige puurkaevupumba valik on oluline. Aitame leida Sinu kaevule sobiva Grundfos pumba.'], url: 'https://pumbapood.ee/tooted/puurkaevupumbad', p1: 'puurkaevupumbad', p2: '' },
    ],
  },
  'drenaaži- ja reoveepumbad': {
    ads: [
      { h: ['Grundfos Drenaažipumbad | Unilift', 'Reoveepumbad — Pump OÜ', 'Drenaažilahendused Kodule'], d: ['Grundfos Unilift ja Sololift pumbad. Usaldusväärsed lahendused keldri, krundi ja kanalisatsiooni jaoks.'], url: 'https://pumbapood.ee/tooted/drenaazipumbad', p1: 'drenaazipumbad', p2: 'grundfos' },
      { h: ['Üleujutus? | Grundfos Sukelpumbad', 'Reoveepumbad Laos | Kiire Tarne', 'Drenaaž ja Reovesi — Lahendused'], d: ['Drenaaži- ja reoveeprobleemid? Grundfos pumbad töötavad ka kõige nõudlikumates tingimustes.'], url: 'https://pumbapood.ee/tooted/drenaazipumbad', p1: 'drenaazipumbad', p2: '' },
    ],
  },
  'grundfos ja üldised pumbad': {
    ads: [
      { h: ['Grundfos Pumbad Eestis | Üle 500 Toote', 'Ametlik Grundfos Edasimüüja', 'Pumbad Kodule, Aeda, Tööstusele'], d: ['Grundfos pumpade ametlik edasimüüja. Küte, vesi, drenaaž — lai valik ja asjatundlik nõustamine.'], url: 'https://pumbapood.ee/tooted', p1: 'tooted', p2: 'grundfos' },
      { h: ['Otsid Pumpa? | Grundfos Lai Valik', 'Veepumbad, Küttepumbad, Drenaaž', 'Kõik Ühest Kohast — Pump OÜ'], d: ['Vajad usaldusväärset pumpa? Grundfos tootevalikust lahendus igale vajadusele. Tasuta konsultatsioon!'], url: 'https://pumbapood.ee/tooted', p1: 'tooted', p2: '' },
    ],
  },
  'Grundfos pumbad - üldine': {
    ads: [
      { h: ['Grundfos Pumbad | Suurim Valik Eestis', 'Kõik Grundfos Pumbad Ühest Kohast', 'Küte, Vesi, Drenaaž, Tööstus'], d: ['Tutvu kogu Grundfos tootevalikuga — küttepumbad, veeautomaadid, puurkaevupumbad ja palju muud.'], url: 'https://pumbapood.ee/tooted', p1: 'tooted', p2: '' },
      { h: ['Grundfos Pump | Profesionaalne Nõustamine', 'Leia Õige Pump — Aitame Valida', 'Paigaldus ja Hooldus — Pump OÜ'], d: ['Grundfos on maailma juhtiv pumbatootja. Aitame leida Sinu vajadustele vastava lahenduse.'], url: 'https://pumbapood.ee/tooted', p1: 'tooted', p2: '' },
    ],
  },
}

let created = 0
for (const ag of ags) {
  const name = ag.adGroup?.name, id = ag.adGroup?.id
  const tmpl = templates[name]
  if (!tmpl) { console.log('  Skipping: ' + name); continue }

  for (const ad of tmpl.ads) {
    const res = await mutate([{ create: {
      adGroup: `customers/${CUST}/adGroups/${id}`,
      status: 'ENABLED',
      ad: {
        name: name + ' RSA v' + (created + 1),
        type: 'RESPONSIVE_SEARCH_AD',
        finalUrls: [ad.url],
        responsiveSearchAd: {
          headlines: ad.h.map((h, i) => ({ text: h, pinnedField: i === 0 ? 'HEADLINE_1' : 'UNSPECIFIED' })),
          descriptions: ad.d.map(d => ({ text: d })),
        },
      },
    } }], 'adGroupAds')
    if (res?.results) created++
  }
}
console.log('  Created: ' + created + ' new RSAs\n')

console.log('=== COMPLETE ===')
console.log('Low QS paused: ' + paused)
console.log('Negative keywords: campaign-level added')
console.log('Brand campaign: customers/' + CUST + '/campaigns/' + brandCampId)
console.log('New RSAs: ' + created)
