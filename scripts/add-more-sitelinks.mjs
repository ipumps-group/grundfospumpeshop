// Ad Strength parandus (26.09.2026): Google soovitab rohkem sitelinke
// (praegu 4 kampaania kohta, soovitus 8-10). Lisame 4 uut sitelinki
// kirjeldustega mõlemale kampaaniale (kokku 8 kampaania kohta).
// Kasutus: node scripts/add-more-sitelinks.mjs [--dry-run]
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

const SHOP = 'https://pumbapood.ee'
const UNILIFT = 'Unilift CC + Drenaaž - EE 2026 sügis'
const ALPHA = 'ALPHA GO - Küte - EE 2026 sügis'
const BRAND = 'Pumbapood + Grundfos Brand Search - EE'

// linkText <=25, description1/2 <=35
const SITELINKS = [
  { campaign: UNILIFT, linkText: 'Tühjenduspumbad', desc1: 'Tühjenduspumbad kohe laost', desc2: 'Tarne 1-3 tööpäeva', url: `${SHOP}/tooted/drenaazipumbad/unilift-cc` },
  { campaign: UNILIFT, linkText: 'Sukelpumbad', desc1: 'Sukelpumbad igaks juhuks', desc2: 'Ametlik Grundfos partner', url: `${SHOP}/tooted/drenaazipumbad` },
  { campaign: UNILIFT, linkText: 'Edasimüüjatele', desc1: 'Hulgihinnad ja B2B tugi', desc2: 'Küsi pakkumist täna', url: `${SHOP}/leht/kontakt` },
  { campaign: UNILIFT, linkText: 'Hinnad ja valik', desc1: 'Hinnad alates 172,75 €', desc2: 'Laos ja kohe saadaval', url: `${SHOP}/unilift` },
  { campaign: ALPHA, linkText: 'Tsirkulatsioonipumbad', desc1: 'Tsirkulatsioonipumbad laos', desc2: 'Tarne 1-3 tööpäeva', url: `${SHOP}/alpha-go` },
  { campaign: ALPHA, linkText: 'ALPHA1 GO al 170,05 €', desc1: 'ALPHA1 GO alates 170,05 €', desc2: 'ALPHA2 GO tippmudel', url: `${SHOP}/alpha-go` },
  { campaign: ALPHA, linkText: 'Vana pumba asendus', desc1: 'Asendab vanu pumpasid', desc2: 'Grundfos GO äpiga', url: `${SHOP}/alpha-go` },
  { campaign: ALPHA, linkText: 'Küsi pakkumist', desc1: 'Hulgihinnad ettevõtetele', desc2: 'Arvega ost ettevõttele', url: `${SHOP}/leht/kontakt` },
  // Brand: 8 sitelinki (kvaliteedistandard)
  { campaign: BRAND, linkText: 'Küttepumbad', desc1: 'Grundfos küttepumbad', desc2: 'ALPHA GO ja ALPHA1', url: `${SHOP}/tooted/kuttepumbad` },
  { campaign: BRAND, linkText: 'Drenaažipumbad', desc1: 'Unilift CC, KP ja AP', desc2: 'Laos ja kohe saadaval', url: `${SHOP}/tooted/drenaazipumbad` },
  { campaign: BRAND, linkText: 'Veeautomaadid', desc1: 'Veeautomaadid ja hüdrofoorid', desc2: 'Hinnad alates 235 €', url: `${SHOP}/tooted/veeautomaadid` },
  { campaign: BRAND, linkText: 'Puurkaevupumbad', desc1: 'SQ ja SQE seeria', desc2: 'Tehniline nõustamine', url: `${SHOP}/tooted/puurkaevupumbad` },
  { campaign: BRAND, linkText: 'Reoveepumbad', desc1: 'Purustiga pumbad', desc2: 'Sololift lahendused', url: `${SHOP}/tooted/reoveepumbad` },
  { campaign: BRAND, linkText: 'ALPHA GO pakkumised', desc1: 'Uued küttepumbad', desc2: 'Asendab vanu mudeleid', url: `${SHOP}/alpha-go` },
  { campaign: BRAND, linkText: 'Küsi nõu', desc1: 'Tasuta konsultatsioon', desc2: 'Vastame kiiresti', url: `${SHOP}/leht/kontakt` },
  { campaign: BRAND, linkText: 'Kõik tooted', desc1: 'Üle 500 toote', desc2: 'Hinnad ja mudelid', url: `${SHOP}/tooted` },
]

// Katkised URL-id (nt /leht/edasimyujatele annab 404) -> suunatakse ümber
const URL_FIXES = [{ from: '/leht/edasimyujatele', to: `${SHOP}/leht/kontakt` }]

// Valideerimine
for (const s of SITELINKS) {
  if ([...s.linkText].length > 25) { console.error(`linkText >25: "${s.linkText}"`); process.exit(1) }
  if ([...s.desc1].length > 35 || [...s.desc2].length > 35) { console.error(`desc >35: "${s.linkText}"`); process.exit(1) }
}

console.log(DRY ? '=== DRY RUN ===' : '=== ADD MORE SITELINKS ===')

const camps = await gaql(`SELECT campaign.name, campaign.resource_name, campaign.status FROM campaign WHERE campaign.status = 'ENABLED'`)
const campByName = new Map(camps.map((c) => [c.campaign.name, c.campaign]))
const existing = await gaql(`SELECT campaign.name, campaign.status, campaign_asset.field_type, asset.resource_name, asset.sitelink_asset.link_text, asset.final_urls FROM campaign_asset WHERE campaign.status = 'ENABLED' AND campaign_asset.field_type = 'SITELINK'`)
const existingTexts = new Set(existing.map((e) => `${e.campaign.name}|||${e.asset?.sitelinkAsset?.linkText}`))

// Paranda katkised sitelinkide URL-id (nt /leht/edasimyujatele = 404)
for (const e of existing) {
  const urls = e.asset?.finalUrls || []
  for (const fix of URL_FIXES) {
    if (!urls.some((u) => u.includes(fix.from))) continue
    console.log(`\n[!] Parandan katkise URL-i: "${e.asset.sitelinkAsset.linkText}" ${urls.join(',')} -> ${fix.to}`)
    if (DRY) continue
    const r = await mutate('assets', [{ update: { resourceName: e.asset.resourceName, finalUrls: [fix.to] }, updateMask: 'finalUrls' }])
    if (!r?.results) { console.error('  URL-i parandus ebaõnnestus: ' + JSON.stringify(r).slice(0, 500)); process.exit(1) }
    console.log('  Parandatud')
  }
}

for (const s of SITELINKS) {
  const camp = campByName.get(s.campaign)
  if (!camp) { console.error(`Kampaaniat ei leitud: ${s.campaign}`); process.exit(1) }
  if (existingTexts.has(`${s.campaign}|||${s.linkText}`)) { console.log(`Juba olemas: [${s.campaign}] "${s.linkText}" - vahele`); continue }
  console.log(`\n[+] [${s.campaign}] "${s.linkText}" -> ${s.url}`)
  console.log(`    "${s.desc1}" / "${s.desc2}"`)
  if (DRY) continue
  const r1 = await mutate('assets', [{ create: { finalUrls: [s.url], sitelinkAsset: { linkText: s.linkText, description1: s.desc1, description2: s.desc2 } } }])
  if (!r1?.results) { console.error('Sitelink asset loomine ebaõnnestus: ' + JSON.stringify(r1).slice(0, 600)); process.exit(1) }
  const r2 = await mutate('campaignAssets', [{ create: { campaign: camp.resourceName, asset: r1.results[0].resourceName, fieldType: 'SITELINK' } }])
  if (!r2?.results) { console.error('Sitelinki linkimine ebaõnnestus: ' + JSON.stringify(r2).slice(0, 600)); process.exit(1) }
  console.log('    Lingitud')
}
console.log('\n=== DONE ===')
