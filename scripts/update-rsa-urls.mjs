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
const CAMPAIGN = 'Unilift CC + Drenaaž - EE 2026 sügis'

const URL_B2B = 'https://pumbapood.ee/leht/edasimyujatele'
const URL_SERIES = 'https://pumbapood.ee/tooted/drenaazipumbad/unilift-cc'

const ADS = {
  'Unilift CC - mudelid': { h: ['Grundfos Unilift CC', 'Tühjenduspumbad Laos', 'CC5, CC7 ja CC9 Saadaval', 'Ametlik Edasimüüja Eestis', 'Hulgihinnad Paigaldajatele', 'Küsi B2B Pakkumist', 'Kiire Tarne Üle Eesti'], d: ['Grundfos Unilift CC tühjenduspumbad edasimüüjatele ja paigaldajatele. Kohe laost.', 'Hulgihinnad ettevõtetele, arvega ost ja kiire tarne üle Eesti. Küsi pakkumist täna.'] },
  'Drenaaž ja tühjendus': { h: ['Drenaažipumbad Laos', 'Tühjenduspump Sügiseks', 'Grundfos Unilift CC', 'Valmistu Märjaks Sügiseks', 'Pumbad Paigaldajatele', 'Hulgihinnad Ettevõtetele', 'Küsi Pakkumist Täna'], d: ['Drenaaži- ja tühjenduspumbad keldrisse, ehitusplatsile ja kaevu. Laos ja kohe saadaval.', 'Ametlik Grundfos edasimüüja. Hulgihinnad, tehniline tugi ja kiire tarne üle Eesti.'] },
  'B2B - edasimüüjad ja paigaldajad': { h: ['Pumbad Edasimüüjatele', 'Grundfos Hulgimüük EE', 'Unilift CC Hulgihinnad', 'B2B Partner Pumbadele', 'Tehniline Tugi ja Tarne', 'Arvega Ost Ettevõttele', 'Ametlik Grundfos Partner'], d: ['Grundfos pumbad hulgihinnaga edasimüüjatele ja paigaldajatele. Liitu partneriks täna.', 'Unilift CC seeria laos. Arvega ost, tehniline tugi ja kiire kohaletoimetamine.'] },
}

async function token() {
  const p = new URLSearchParams({ client_id: process.env.GOOGLE_ADS_CLIENT_ID, client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET, refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN, grant_type: 'refresh_token' })
  const d = await (await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: p.toString() })).json()
  if (!d.access_token) throw new Error('OAuth failed')
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

async function main() {
  console.log('=== Recreate RSAs with canonical URLs ===')
  const ads = await gaql(`SELECT ad_group_ad.resource_name, ad_group_ad.ad.id, ad_group.resource_name, ad_group.name, ad_group_ad.ad.final_urls FROM ad_group_ad WHERE campaign.name = "${CAMPAIGN}" AND ad_group_ad.status != "REMOVED"`)

  for (const r of ads) {
    const group = r.adGroup.name
    const agRn = r.adGroup.resourceName
    const target = group.startsWith('B2B') ? URL_B2B : URL_SERIES
    const current = (r.adGroupAd.ad?.finalUrls || [])[0] || ''
    const copy = ADS[group]
    if (!copy) { console.log(`  Skip unknown group: ${group}`); continue }

    if (current === target) { console.log(`  OK already: ${group}`); continue }
    // if a correct-URL ad already exists (e.g. re-run), just remove the old one
    if (!current.includes('/leht/edasimyujatele') && !current.includes('/tooted/drenaazipumbad/unilift-cc') || current.includes('/et/')) {
      const headlines = copy.h.map((text, i) => ({ text, pinnedField: i === 0 ? 'HEADLINE_1' : 'UNSPECIFIED' }))
      const createOp = { create: { adGroup: agRn, status: 'ENABLED', ad: { name: group + ' RSA v2', type: 'RESPONSIVE_SEARCH_AD', finalUrls: [target], responsiveSearchAd: { headlines, descriptions: copy.d.map(t => ({ text: t })), path1: group.startsWith('B2B') ? 'edasimyujatele' : 'drenaazipumbad', path2: group.startsWith('B2B') ? 'grundfos' : 'unilift-cc' } } } }
      const cRes = await mutate([createOp], 'adGroupAds')
      if (!cRes?.results) { console.log(`  CREATE FAIL ${group}: ` + JSON.stringify(cRes?.error?.details?.[0]?.errors?.[0]?.message || cRes).slice(0, 250)); continue }
      console.log(`  Created new RSA in ${group} -> ${target}`)

      const dRes = await mutate([{ update: { resourceName: r.adGroupAd.resourceName, status: 'REMOVED' }, updateMask: 'status' }], 'adGroupAds')
      console.log(dRes?.results ? `  Old RSA removed (${group})` : `  REMOVE FAIL ${group}: ` + JSON.stringify(dRes?.error || dRes).slice(0, 200))
    }
  }
  console.log('=== DONE ===')
}
main().catch(e => { console.error(e.message); process.exit(1) })
