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

const CUST = (process.env.GOOGLE_ADS_CUSTOMER_ID || '2639481819').replace(/-/g, '')
const LOGIN = (process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID || '').replace(/-/g, '')
const V = 'v24', DEV = process.env.GOOGLE_ADS_DEVELOPER_TOKEN
const OLD_SEARCH_CAMPAIGN_ID = '23912990830' // Pumbapood search - EE 20260604-125236
const LANDING = 'https://pumbapood.ee/et/tooted/drenaazipumbad/unilift-cc'

async function token() {
  const p = new URLSearchParams({ client_id: process.env.GOOGLE_ADS_CLIENT_ID, client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET, refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN, grant_type: 'refresh_token' })
  const r = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: p.toString() })
  const d = await r.json()
  if (!d.access_token) throw new Error('OAuth failed: ' + JSON.stringify(d))
  return d.access_token
}

async function gaql(q) {
  const tk = await token()
  const hd = { Authorization: 'Bearer ' + tk, 'developer-token': DEV, 'Content-Type': 'application/json' }
  if (LOGIN) hd['login-customer-id'] = LOGIN
  const r = await fetch(`https://googleads.googleapis.com/${V}/customers/${CUST}/googleAds:search`, { method: 'POST', headers: hd, body: JSON.stringify({ query: q }) })
  return (await r.json()).results || []
}

async function mutate(ops, ep) {
  const tk = await token()
  const hd = { Authorization: 'Bearer ' + tk, 'developer-token': DEV, 'Content-Type': 'application/json' }
  if (LOGIN) hd['login-customer-id'] = LOGIN
  const r = await fetch(`https://googleads.googleapis.com/${V}/customers/${CUST}/${ep}:mutate`, { method: 'POST', headers: hd, body: JSON.stringify({ operations: ops }) })
  return await r.json()
}

function fail(res, label) {
  const msg = res?.error?.details?.[0]?.errors?.[0]?.message || res?.error?.message || JSON.stringify(res)
  console.log(`  FAIL ${label}: ${String(msg).slice(0, 300)}`)
  return false
}

async function main() {
  console.log('=== CREATE: Unilift CC + Drenaaž - EE 2026 sügis ===\n')

  // 1. Budget 7 EUR/day (reuse if already created)
  console.log('1. Campaign budget (7 EUR/day)...')
  let budgetRn = null
  const existing = await gaql('SELECT campaign_budget.resource_name, campaign_budget.name FROM campaign_budget WHERE campaign_budget.name = "Unilift CC + Drenaaž sügis 2026 - 7EUR/päev"')
  if (existing.length > 0) {
    budgetRn = existing[0].campaignBudget.resourceName
    console.log('  Reusing existing: ' + budgetRn)
  } else {
    const bRes = await mutate([{ create: { name: 'Unilift CC + Drenaaž sügis 2026 - 7EUR/päev', amountMicros: '7000000', deliveryMethod: 'STANDARD' } }], 'campaignBudgets')
    budgetRn = bRes?.results?.[0]?.resourceName
    if (!budgetRn) { fail(bRes, 'budget'); process.exit(1) }
    console.log('  OK: ' + budgetRn)
  }

  // 2. Campaign — Google Search only, 8 Sep → 30 Nov 2026
  console.log('2. Creating campaign (start 2026-09-08, end 2026-11-30)...')
  let campRn = null
  const existingCamp = await gaql('SELECT campaign.resource_name, campaign.name, campaign.status FROM campaign WHERE campaign.name = "Unilift CC + Drenaaž - EE 2026 sügis"')
  if (existingCamp.length > 0) {
    campRn = existingCamp[0].campaign.resourceName
    console.log('  Reusing existing: ' + campRn)
  } else {
    const cRes = await mutate([{
      create: {
        name: 'Unilift CC + Drenaaž - EE 2026 sügis',
        advertisingChannelType: 'SEARCH',
        status: 'ENABLED',
        campaignBudget: budgetRn,
        startDateTime: '2026-09-08 00:00:00',
        endDateTime: '2026-11-30 23:59:59',
        manualCpc: {},
        networkSettings: { targetGoogleSearch: true, targetSearchNetwork: false, targetPartnerSearchNetwork: false },
        containsEuPoliticalAdvertising: 'DOES_NOT_CONTAIN_EU_POLITICAL_ADVERTISING',
      },
    }], 'campaigns')
    campRn = cRes?.results?.[0]?.resourceName
    if (!campRn) { fail(cRes, 'campaign'); process.exit(1) }
    console.log('  OK: ' + campRn)
  }

  // 3. Ad groups
  const GROUPS = [
    { name: 'Unilift CC - mudelid', kw: ['unilift cc', 'grundfos unilift cc', 'unilift cc5', 'unilift cc7', 'unilift cc9', 'grundfos unilift', 'grundfos unilift cc7', 'grundfos unilift cc9', 'unilift pump'] },
    { name: 'Drenaaž ja tühjendus', kw: ['drenaažipump', 'drenaažipumbad', 'tühjenduspump', 'tühjenduspumbad', 'sukelpump', 'keldripump', 'drenaaži pump', 'drenaaž pump'] },
    { name: 'B2B - edasimüüjad ja paigaldajad', kw: ['drenaažipump hulgi', 'drenaažipumbad hulgi', 'tühjenduspump hulgi', 'grundfos hulgi', 'grundfos edasimüüja', 'pumbad edasimüüjatele', 'pumbad ettevõttele', 'paigaldaja pump'] },
  ]
  const ADS = {
    'Unilift CC - mudelid': { h: ['Grundfos Unilift CC', 'Tühjenduspumbad Laos', 'CC5, CC7 ja CC9 Saadaval', 'Ametlik Edasimüüja Eestis', 'Hulgihinnad Paigaldajatele', 'Küsi B2B Pakkumist', 'Kiire Tarne Üle Eesti'], d: ['Grundfos Unilift CC tühjenduspumbad edasimüüjatele ja paigaldajatele. Kohe laost.', 'Hulgihinnad ettevõtetele, arvega ost ja kiire tarne üle Eesti. Küsi pakkumist täna.'] },
    'Drenaaž ja tühjendus': { h: ['Drenaažipumbad Laos', 'Tühjenduspump Sügiseks', 'Grundfos Unilift CC', 'Valmistu Märjaks Sügiseks', 'Pumbad Paigaldajatele', 'Hulgihinnad Ettevõtetele', 'Küsi Pakkumist Täna'], d: ['Drenaaži- ja tühjenduspumbad keldrisse, ehitusplatsile ja kaevu. Laos ja kohe saadaval.', 'Ametlik Grundfos edasimüüja. Hulgihinnad, tehniline tugi ja kiire tarne üle Eesti.'] },
    'B2B - edasimüüjad ja paigaldajad': { h: ['Pumbad Edasimüüjatele', 'Grundfos Hulgimüük EE', 'Unilift CC Hulgihinnad', 'B2B Partner Pumbadele', 'Tehniline Tugi ja Tarne', 'Arvega Ost Ettevõttele', 'Ametlik Grundfos Partner'], d: ['Grundfos pumbad hulgihinnaga edasimüüjatele ja paigaldajatele. Liitu partneriks täna.', 'Unilift CC seeria laos. Arvega ost, tehniline tugi ja kiire kohaletoimetamine.'] },
  }

  for (const g of GROUPS) {
    console.log(`3. Ad group: ${g.name}...`)
    let agRn = null
    const existingAg = await gaql(`SELECT ad_group.resource_name FROM ad_group WHERE campaign.resource_name = "${campRn}" AND ad_group.name = "${g.name}"`)
    if (existingAg.length > 0) {
      agRn = existingAg[0].adGroup.resourceName
      console.log('  Reusing existing: ' + agRn)
    } else {
      const agRes = await mutate([{ create: { name: g.name, campaign: campRn, status: 'ENABLED', type: 'SEARCH_STANDARD', cpcBidMicros: '500000' } }], 'adGroups')
      agRn = agRes?.results?.[0]?.resourceName
      if (!agRn) { fail(agRes, 'adgroup ' + g.name); continue }
      console.log('  OK: ' + agRn)
    }

    // keywords (phrase) — skip ones that already exist
    const existingKw = await gaql(`SELECT ad_group_criterion.keyword.text FROM keyword_view WHERE ad_group.resource_name = "${agRn}" AND ad_group_criterion.status != "REMOVED"`)
    const have = new Set(existingKw.map(r => (r.adGroupCriterion?.keyword?.text || '').toLowerCase()))
    const newKw = g.kw.filter(t => !have.has(t.toLowerCase()))
    if (newKw.length > 0) {
      const kwOps = newKw.map(t => ({ create: { adGroup: agRn, status: 'ENABLED', keyword: { text: t, matchType: 'PHRASE' } } }))
      const kwRes = await mutate(kwOps, 'adGroupCriteria')
      const kwOk = kwRes?.results?.length || 0
      if (kwOk !== newKw.length) fail(kwRes, 'keywords ' + g.name)
      console.log(`  Keywords added: ${kwOk} (skipped existing: ${g.kw.length - newKw.length})`)
    } else {
      console.log('  Keywords: all already present')
    }

    // RSA — skip if an enabled RSA already exists in this group
    const existingAds = await gaql(`SELECT ad_group_ad.resource_name FROM ad_group_ad WHERE ad_group.resource_name = "${agRn}" AND ad_group_ad.status != "REMOVED" AND ad_group_ad.ad.type = "RESPONSIVE_SEARCH_AD"`)
    if (existingAds.length > 0) {
      console.log('  RSA: already present, skipping')
      continue
    }
    const ad = ADS[g.name]
    const headlines = ad.h.map((text, i) => ({ text, pinnedField: i === 0 ? 'HEADLINE_1' : 'UNSPECIFIED' }))
    const adOp = { create: { adGroup: agRn, status: 'ENABLED', ad: { name: g.name + ' RSA', type: 'RESPONSIVE_SEARCH_AD', finalUrls: [LANDING], responsiveSearchAd: { headlines, descriptions: ad.d.map(t => ({ text: t })), path1: 'drenaazipumbad', path2: 'unilift-cc' } } } }
    const adRes = await mutate([adOp], 'adGroupAds')
    if (adRes?.results) console.log('  RSA: OK')
    else fail(adRes, 'RSA ' + g.name)
  }

  // 4. Campaign-level negative keywords (skip existing)
  console.log('4. Adding negative keywords...')
  const NEG = ['remont', 'remonti', 'varuosa', 'varuosad', 'tihend', 'kuidas', 'milline', 'juhend', 'manuaal', 'kasutatud', 'rent', 'üür', 'video', 'skeem']
  const existingNeg = await gaql(`SELECT campaign_criterion.keyword.text FROM campaign_criterion WHERE campaign.resource_name = "${campRn}" AND campaign_criterion.negative = TRUE AND campaign_criterion.type = "KEYWORD"`)
  const haveNeg = new Set(existingNeg.map(r => (r.campaignCriterion?.keyword?.text || '').toLowerCase()))
  const newNeg = NEG.filter(t => !haveNeg.has(t.toLowerCase()))
  if (newNeg.length > 0) {
    const negOps = newNeg.map(t => ({ create: { campaign: campRn, negative: true, keyword: { text: t, matchType: 'BROAD' } } }))
    const negRes = await mutate(negOps, 'campaignCriteria')
    const negOk = negRes?.results?.length || 0
    if (negOk !== newNeg.length) fail(negRes, 'negatives')
    console.log(`  Negatives added: ${negOk} (skipped existing: ${NEG.length - newNeg.length})`)
  } else {
    console.log('  Negatives: all already present')
  }

  // 5. Pause old generic Search campaign
  console.log('5. Pausing old generic Search campaign (' + OLD_SEARCH_CAMPAIGN_ID + ')...')
  const pRes = await mutate([{ update: { resourceName: `customers/${CUST}/campaigns/${OLD_SEARCH_CAMPAIGN_ID}`, status: 'PAUSED' }, updateMask: 'status' }], 'campaigns')
  if (pRes?.results) console.log('  OK: old Search campaign PAUSED')
  else fail(pRes, 'pause old campaign')

  console.log('\n=== DONE ===')
}
main().catch(e => { console.error(e.message); process.exit(1) })
