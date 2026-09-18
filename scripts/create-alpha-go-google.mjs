// ALPHA GO küttekampaania — Google Ads Search (PAUSED — ei avaldata)
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

const CAMPAIGN_NAME = 'ALPHA GO - Küte - EE 2026 sügis'
const BUDGET_NAME = 'ALPHA GO sügis 2026 - 10EUR/päev'
const LANDING = 'https://pumbapood.ee/et/tooted/kuttepumbad'
const STATUS = 'PAUSED' // <-- ei avaldata

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
  console.log('=== CREATE: ' + CAMPAIGN_NAME + ' (STATUS: ' + STATUS + ') ===\n')

  // 1. Budget 10 EUR/day
  console.log('1. Campaign budget (10 EUR/day)...')
  let budgetRn = null
  const existing = await gaql(`SELECT campaign_budget.resource_name, campaign_budget.name FROM campaign_budget WHERE campaign_budget.name = "${BUDGET_NAME}"`)
  if (existing.length > 0) {
    budgetRn = existing[0].campaignBudget.resourceName
    console.log('  Reusing existing: ' + budgetRn)
  } else {
    const bRes = await mutate([{ create: { name: BUDGET_NAME, amountMicros: '10000000', deliveryMethod: 'STANDARD' } }], 'campaignBudgets')
    budgetRn = bRes?.results?.[0]?.resourceName
    if (!budgetRn) { fail(bRes, 'budget'); process.exit(1) }
    console.log('  OK: ' + budgetRn)
  }

  // 2. Campaign — Google Search only, PAUSED
  console.log('2. Creating campaign (' + STATUS + ')...')
  let campRn = null
  const existingCamp = await gaql(`SELECT campaign.resource_name, campaign.name, campaign.status FROM campaign WHERE campaign.name = "${CAMPAIGN_NAME}"`)
  if (existingCamp.length > 0) {
    campRn = existingCamp[0].campaign.resourceName
    console.log('  Reusing existing: ' + campRn + ' (status: ' + existingCamp[0].campaign.status + ')')
  } else {
    const cRes = await mutate([{
      create: {
        name: CAMPAIGN_NAME,
        advertisingChannelType: 'SEARCH',
        status: STATUS,
        campaignBudget: budgetRn,
        manualCpc: {},
        networkSettings: { targetGoogleSearch: true, targetSearchNetwork: false, targetPartnerSearchNetwork: false },
        containsEuPoliticalAdvertising: 'DOES_NOT_CONTAIN_EU_POLITICAL_ADVERTISING',
      },
    }], 'campaigns')
    campRn = cRes?.results?.[0]?.resourceName
    if (!campRn) { fail(cRes, 'campaign'); process.exit(1) }
    console.log('  OK: ' + campRn)
  }

  // 3. Ad groups + keywords + RSA
  const GROUPS = [
    { name: 'ALPHA GO - tooted', kw: ['alpha go', 'grundfos alpha go', 'alpha1 go', 'alpha2 go', 'grundfos alpha1 go', 'grundfos alpha2 go', 'alpha go hind', 'alpha go pump'] },
    { name: 'Küttepumbad ja tsirkulatsioonipumbad', kw: ['küttepump', 'küttepumbad', 'tsirkulatsioonipump', 'tsirkulatsioonipumbad', 'keskkütte pump', 'põrandakütte pump', 'küttesüsteemi pump', 'grundfos küttepump'] },
    { name: 'Vana pumba asendus', kw: ['grundfos ups asendus', 'alpha1 asendus', 'alpha2 asendus', 'alpha1l asendus', 'küttepumba vahetus', 'tsirkulatsioonipumba asendus', 'pumba asendamine', 'grundfos pumba asendus'] },
  ]
  const ADS = {
    'ALPHA GO - tooted': { h: ['Grundfos ALPHA GO', 'Uus Küttepumpade Seeria', 'ALPHA1 GO ja ALPHA2 GO', 'Asendab Vanu Pumapasid', 'Grundfos GO Äpp', 'Laos ja Kohe Saadaval', 'Ametlik Edasimüüja'], d: ['Uued ALPHA GO küttepumbad asendavad enamiku vanu UPS, ALPHA1, ALPHA2 ja ALPHA3 pumapasid. Laos.', 'Grundfos GO äpp juhendab asenduse ja seadistuse. Küsi nõu spetsialistidelt.'] },
    'Küttepumbad ja tsirkulatsioonipumbad': { h: ['Küttepumbad Laos', 'Tsirkulatsioonipumbad', 'Grundfos ALPHA GO', 'Kiire Tarne Üle Eesti', 'Tasuta Nõustamine', 'Küsi Pakkumist Täna', 'Ametlik Grundfos Partner'], d: ['ALPHA GO tsirkulatsioonipumbad keskkütte- ja põrandaküttesüsteemidele. Laos ja koheselt saadaval.', 'Ametlik Grundfos edasimüüja. Tehniline tugi, hinnapakkumine ja kiire tarne.'] },
    'Vana pumba asendus': { h: ['Vana Pumba Asendus', 'UPS -> ALPHA1 GO', 'ALPHA2/3 -> ALPHA2 GO', 'Lihtne ja Kiire Asendus', 'Grundfos GO Äpiga', 'Säästa Aega ja Raha', 'Küsi Nõu Spetsialistilt'], d: ['ALPHA1 GO asendab UPS, vana ALPHA1 ja ALPHA1 L. ALPHA2 GO asendab ALPHA2, ALPHA3 ja soojuspumba pumbad.', 'Grundfos GO äpp teeb asenduse lihtsaks — juhendatud seadistus ühe käiguga.'] },
  }

  // Google Ads limiidid: headline max 30, description max 90 märki
  for (const [name, ad] of Object.entries(ADS)) {
    ad.h = ad.h.map(t => t.length > 30 ? t.slice(0, 30) : t)
    ad.d = ad.d.map(t => t.length > 90 ? t.slice(0, 87) + '...' : t)
  }

  for (const g of GROUPS) {
    console.log(`3. Ad group: ${g.name}...`)
    let agRn = null
    const existingAg = await gaql(`SELECT ad_group.resource_name FROM ad_group WHERE campaign.resource_name = "${campRn}" AND ad_group.name = "${g.name}"`)
    if (existingAg.length > 0) {
      agRn = existingAg[0].adGroup.resourceName
      console.log('  Reusing existing: ' + agRn)
    } else {
      const agRes = await mutate([{ create: { name: g.name, campaign: campRn, status: STATUS, type: 'SEARCH_STANDARD', cpcBidMicros: '600000' } }], 'adGroups')
      agRn = agRes?.results?.[0]?.resourceName
      if (!agRn) { fail(agRes, 'adgroup ' + g.name); continue }
      console.log('  OK: ' + agRn)
    }

    // keywords (phrase)
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

    // RSA
    const existingAds = await gaql(`SELECT ad_group_ad.resource_name FROM ad_group_ad WHERE ad_group.resource_name = "${agRn}" AND ad_group_ad.status != "REMOVED" AND ad_group_ad.ad.type = "RESPONSIVE_SEARCH_AD"`)
    if (existingAds.length > 0) {
      console.log('  RSA: already present, skipping')
      continue
    }
    const ad = ADS[g.name]
    const headlines = ad.h.map((text, i) => ({ text, pinnedField: i === 0 ? 'HEADLINE_1' : 'UNSPECIFIED' }))
    const adOp = { create: { adGroup: agRn, status: STATUS, ad: { name: g.name + ' RSA', type: 'RESPONSIVE_SEARCH_AD', finalUrls: [LANDING], responsiveSearchAd: { headlines, descriptions: ad.d.map(t => ({ text: t })), path1: 'kuttepumbad', path2: 'alpha-go' } } } }
    const adRes = await mutate([adOp], 'adGroupAds')
    if (adRes?.results) console.log('  RSA: OK')
    else fail(adRes, 'RSA ' + g.name)
  }

  // 4. Negative keywords
  console.log('4. Adding negative keywords...')
  const NEG = ['remont', 'remonti', 'varuosa', 'varuosad', 'tihend', 'kuidas', 'juhend', 'manuaal', 'kasutatud', 'rent', 'üür', 'video', 'skeem', 'tööpakkumine', 'töökoht']
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

  console.log('\n=== DONE — kampaania on PAUSED, ei avalda ===')
}
main().catch(e => { console.error(e.message); process.exit(1) })
