// Ad Strength parandus (26.09.2026): "Your ads aren't as prominent... add images".
// Lisab kõigile kolmele kampaaniale IMAGE asset'id (image extension):
// 3 tootefotot kampaania kohta, igaüks kahes formaadis (1:1 1200x1200 + 1.91:1 1200x628).
// Tootepildid (400x450, valge taust) asetatakse valgele lõuendile (pad) ilma moonutamata.
// Kasutus: node scripts/add-image-assets.mjs [--dry-run]
import { readFileSync } from 'fs'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'
import sharp from 'sharp'
const __dirname = dirname(fileURLToPath(import.meta.url))
const ROOT = resolve(__dirname, '..')
try {
  const content = readFileSync(resolve(ROOT, '.env.local'), 'utf-8')
  for (const line of content.split('\n')) { const t = line.trim(); if (t && !t.startsWith('#')) { const eq = t.indexOf('='); if (eq > 0) { const k = t.slice(0, eq); let v = t.slice(eq + 1); if (v.startsWith('"') && v.endsWith('"')) v = v.slice(1, -1); process.env[k] = v } } }
} catch {}
const CUST = (process.env.GOOGLE_ADS_CUSTOMER_ID || '').replace(/-/g, ''), LOGIN = (process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID || '').replace(/-/g, ''), DEV = process.env.GOOGLE_ADS_DEVELOPER_TOKEN
const DRY = process.argv.includes('--dry-run')

async function token() { const p = new URLSearchParams({ client_id: process.env.GOOGLE_ADS_CLIENT_ID, client_secret: process.env.GOOGLE_ADS_CLIENT_SECRET, refresh_token: process.env.GOOGLE_ADS_REFRESH_TOKEN, grant_type: 'refresh_token' }); const r = await fetch('https://oauth2.googleapis.com/token', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: p.toString() }); const d = await r.json(); if (!d.access_token) throw new Error('OAuth failed'); return d.access_token }
async function gaql(q) { const tk = await token(); const hd = { Authorization: 'Bearer ' + tk, 'developer-token': DEV, 'Content-Type': 'application/json' }; if (LOGIN) hd['login-customer-id'] = LOGIN; const r = await fetch(`https://googleads.googleapis.com/v24/customers/${CUST}/googleAds:search`, { method: 'POST', headers: hd, body: JSON.stringify({ query: q }) }); const d = await r.json(); if (!r.ok) throw new Error('GAQL: ' + JSON.stringify(d).slice(0, 400)); return d.results || [] }
async function mutate(endpoint, ops) { const tk = await token(); const hd = { Authorization: 'Bearer ' + tk, 'developer-token': DEV, 'Content-Type': 'application/json' }; if (LOGIN) hd['login-customer-id'] = LOGIN; const r = await fetch(`https://googleads.googleapis.com/v24/customers/${CUST}/${endpoint}:mutate`, { method: 'POST', headers: hd, body: JSON.stringify({ operations: ops }) }); return await r.json() }

const STORE = 'https://sdqnzyfmanflslsjhytf.supabase.co/storage/v1/object/public/products/images'
const UNILIFT = 'Unilift CC + Drenaaž - EE 2026 sügis'
const ALPHA = 'ALPHA GO - Küte - EE 2026 sügis'
const BRAND = 'Pumbapood + Grundfos Brand Search - EE'

// iga pilt kampaania kohta: 1:1 1200x1200 + 1.91:1 1200x628, valge taust (pad)
const IMAGES = [
  { campaign: UNILIFT, key: 'cc5', src: `${STORE}/96280965.jpg`, label: 'Unilift CC5' },
  { campaign: UNILIFT, key: 'kp', src: resolve(ROOT, 'public/images/unilift/unilift-kp.jpg'), label: 'Unilift KP' },
  { campaign: UNILIFT, key: 'cc', src: resolve(ROOT, 'public/images/unilift/unilift-cc.jpg'), label: 'Unilift CC komposiit' },
  { campaign: ALPHA, key: 'alpha1-go', src: `${STORE}/93074169.jpg`, label: 'ALPHA1 GO' },
  { campaign: ALPHA, key: 'alpha2-go', src: `${STORE}/93074218.jpg`, label: 'ALPHA2 GO' },
  { campaign: ALPHA, key: 'alpha1-go-130', src: `${STORE}/93074171.jpg`, label: 'ALPHA1 GO 25-60' },
  { campaign: BRAND, key: 'cc5', src: `${STORE}/96280965.jpg`, label: 'Unilift CC5' },
  { campaign: BRAND, key: 'alpha2-go', src: `${STORE}/93074218.jpg`, label: 'ALPHA2 GO' },
  { campaign: BRAND, key: 'kp', src: resolve(ROOT, 'public/images/unilift/unilift-kp.jpg'), label: 'Unilift KP' },
]

const SIZES = [
  { suffix: 'sq', w: 1200, h: 1200 },
  { suffix: 'land', w: 1200, h: 628 },
]

async function loadBytes(src) {
  if (src.startsWith('http')) {
    const r = await fetch(src)
    if (!r.ok) throw new Error(`Allalaadimine ebaõnnestus ${src}: HTTP ${r.status}`)
    return Buffer.from(await r.arrayBuffer())
  }
  return readFileSync(src)
}

// Tootepilt valgele lõuendile (fit inside, ilma kadudeta)
async function makeImage(bytes, w, h) {
  const inner = await sharp(bytes).resize(w, h, { fit: 'inside', kernel: 'lanczos3' }).toBuffer()
  return sharp({ create: { width: w, height: h, channels: 3, background: { r: 255, g: 255, b: 255 } } })
    .composite([{ input: inner, gravity: 'center' }])
    .jpeg({ quality: 92 })
    .toBuffer()
}

console.log(DRY ? '=== DRY RUN ===' : '=== ADD IMAGE ASSETS ===')

const camps = await gaql(`SELECT campaign.name, campaign.resource_name, campaign.status FROM campaign WHERE campaign.status = 'ENABLED'`)
const campByName = new Map(camps.map((c) => [c.campaign.name, c.campaign]))

// Olemasolevad meie pildid (idempotentsus)
const existing = await gaql(`SELECT asset.name, asset.resource_name FROM asset WHERE asset.name LIKE 'adimg-%'`)
const byName = new Map(existing.map((e) => [e.asset.name, e.asset.resourceName]))
// Mis juba kampaaniaga lingitud (filter JS-poolt - v24 ei luba 'IMAGE' WHERE klause enumina)
const linked = await gaql(`SELECT campaign.name, campaign.status, asset.name FROM campaign_asset WHERE campaign.status = 'ENABLED'`)
const linkedSet = new Set(linked.filter((l) => (l.asset.name || '').startsWith('adimg-')).map((l) => `${l.campaign.name}|||${l.asset.name}`))
// Aktiivsed ad groupid iga kampaania kohta (fallback-tasemeks)
const agRows = await gaql(`SELECT campaign.name, ad_group.resource_name, ad_group.name, ad_group.status FROM ad_group WHERE campaign.status = 'ENABLED' AND ad_group.status = 'ENABLED'`)
const agsByCamp = new Map()
for (const a of agRows) { if (!agsByCamp.has(a.campaign.name)) agsByCamp.set(a.campaign.name, []); agsByCamp.get(a.campaign.name).push(a.adGroup) }

// Lingib pildi: proovi kampaaniatasemel, vajadusel ad-group tasemel
async function linkImage(camp, img, assetRes, name) {
  const r = await mutate('campaignAssets', [{ create: { campaign: camp.resourceName, asset: assetRes, fieldType: 'AD_IMAGE' } }])
  if (r?.results) return 'campaign'
  console.log('  Kampaaniataseme ebaõnnestus: ' + JSON.stringify(r).slice(0, 220))
  const ags = agsByCamp.get(img.campaign) || []
  for (const ag of ags) {
    const r2 = await mutate('adGroupAssets', [{ create: { adGroup: ag.resourceName, asset: assetRes, fieldType: 'AD_IMAGE' } }])
    if (!r2?.results) { console.error(`  Ad-group linkimine ebaõnnestus (${ag.name}): ` + JSON.stringify(r2).slice(0, 400)); process.exit(1) }
  }
  if (ags.length) return `adGroup x${ags.length}`
  throw new Error('Linkimine ebaõnnestus: ' + JSON.stringify(r).slice(0, 400))
}

let created = 0, skipped = 0
for (const img of IMAGES) {
  const camp = campByName.get(img.campaign)
  if (!camp) { console.error(`Kampaaniat ei leitud: ${img.campaign}`); process.exit(1) }
  for (const size of SIZES) {
    const name = `adimg-${img.key}-${size.suffix}`
    const linkKey = `${img.campaign}|||${name}`
    if (byName.has(name) && linkedSet.has(linkKey)) { console.log(`[=] ${name} (${img.campaign}) - juba olemas`); skipped++; continue }
    console.log(`\n[+] ${name} -> [${img.campaign}] ${img.label} ${size.w}x${size.h}`)
    if (DRY) continue

    const bytes = await loadBytes(img.src)
    const jpg = await makeImage(bytes, size.w, size.h)
    if (jpg.length > 5120 * 1024) { console.error('  Pilt liiga suur'); process.exit(1) }

    let assetRes = byName.get(name)
    if (!assetRes) {
      const r1 = await mutate('assets', [{ create: { name, imageAsset: { data: jpg.toString('base64'), mimeType: 'IMAGE_JPEG' } } }])
      if (!r1?.results) { console.error('  Asset loomine ebaõnnestus: ' + JSON.stringify(r1).slice(0, 700)); process.exit(1) }
      assetRes = r1.results[0].resourceName
      byName.set(name, assetRes)
      console.log(`  Asset loodud (${(jpg.length / 1024).toFixed(0)} KB)`)
    }
    if (!linkedSet.has(linkKey)) {
      const level = await linkImage(camp, img, assetRes, name)
      linkedSet.add(linkKey)
      console.log(`  Lingitud (${level})`)
    }
    created++
  }
}
console.log(`\n=== DONE (${created} loodud/värskendatud, ${skipped} vahele jäetud) ===`)
