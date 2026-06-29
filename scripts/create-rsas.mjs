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
const CID = '23912990830'

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

async function mutate(ops, ep) {
  const tk = await token()
  const hd = { Authorization: 'Bearer ' + tk, 'developer-token': DEV, 'Content-Type': 'application/json' }
  if (LOGIN) hd['login-customer-id'] = LOGIN
  const r = await fetch(`https://googleads.googleapis.com/${V}/customers/${CUST}/${ep}:mutate`, { method: 'POST', headers: hd, body: JSON.stringify({ operations: ops }) })
  return await r.json()
}

const ags = await gaql(`SELECT ad_group.id, ad_group.name FROM ad_group WHERE ad_group.status = "ENABLED" AND campaign.id = ${CID}`)

const T = {
  'veeautomaadid ja aiapumbad': [
    { u: 'https://pumbapood.ee/tooted/veeautomaadid', p: 'veeautomaadid', q: 'grundfos', h: ['Grundfos Veeautomaadid Laos', 'SCALA SBA JP Kohal', 'Püsiv Veesurve Kodule'], d: ['SCALA, SBA, JP veeautomaadid. Püsiv veesurve kodule ja aeda — telli täna!', 'Probleemid veesurvega? Grundfos lahendab. Vaata tootevalikut!'] },
    { u: 'https://pumbapood.ee/tooted/veeautomaadid', p: 'veeautomaadid', h: ['Madal Veesurve? Aitame', 'Aiapumbad Kiire Tarne', 'Veeautomaadid Lai Valik'], d: ['Veesurve probleemid? Grundfos pumbad lahendavad. Telli juba täna!', 'Aiapumbad ja kastmissüsteemid — kiire tarne ja paigaldus üle Eesti.'] },
  ],
  'puurkaevu- ja kaevupumbad': [
    { u: 'https://pumbapood.ee/tooted/puurkaevupumbad', p: 'puurkaevupumbad', q: 'grundfos', h: ['Grundfos Puurkaevupumbad SQ', 'Kvaliteetsed Kaevupumbad', 'SQE SP Komplektid Laos'], d: ['Grundfos SQ, SQE puurkaevupumbad. Töökindlad lahendused joogivee saamiseks kaevust.', 'Õige pumba valik on oluline. Aitame leida Sinu kaevule sobiva lahenduse.'] },
    { u: 'https://pumbapood.ee/tooted/puurkaevupumbad', p: 'puurkaevupumbad', h: ['Vesi Otse Kaevust Grundfos', 'Puurkaevupumba Paigaldus', 'SQE SP Komplektid Eestis'], d: ['Puurkaevu- ja salvkaevupumbad. Energiasäästlikud ja töökindlad — sobivad Eesti oludesse.', 'Vajad vett kaevust? Grundfos sügavpumbad tagavad stabiilse veevarustuse aastaringselt.'] },
  ],
  'drenaaži- ja reoveepumbad': [
    { u: 'https://pumbapood.ee/tooted/drenaazipumbad', p: 'drenaazipumbad', q: 'grundfos', h: ['Grundfos Drenaažipumbad', 'Unilift Sololift Laos', 'Keldri ja Krundi Lahendus'], d: ['Grundfos Unilift ja Sololift pumbad. Usaldusväärsed lahendused keldri ja kanalisatsiooni jaoks.', 'Drenaaži- ja reoveeprobleemid? Grundfos pumbad töötavad nõudlikes tingimustes.'] },
    { u: 'https://pumbapood.ee/tooted/drenaazipumbad', p: 'drenaazipumbad', h: ['Üleujutus? Sukelpumbad', 'Reoveepumbad Kiire Tarne', 'Drenaaž Kodule ja Ehitusele'], d: ['Üleujutus keldris? Grundfos sukelpumbad aitavad kiiresti. Vaata meie lahendusi!', 'Drenaaži- ja reoveepumbad — alati laos ja saadaval kiireks tarneks üle Eesti.'] },
  ],
  'grundfos ja üldised pumbad': [
    { u: 'https://pumbapood.ee/tooted', p: 'tooted', q: 'grundfos', h: ['Grundfos Pumbad Eestis', 'Üle 500 Toote Laos', 'Ametlik Edasimüüja'], d: ['Grundfos pumpade ametlik edasimüüja. Küte, vesi, drenaaž — lai valik ja nõustamine.', 'Vajad usaldusväärset pumpa? Grundfos tootevalikust lahendus igale vajadusele.'] },
    { u: 'https://pumbapood.ee/tooted', p: 'tooted', h: ['Otsid Pumpa? Lai Valik', 'Kütte Vee Drenaaži Pumbad', 'Kõik Ühest Kohast'], d: ['Veepumbad, küttepumbad, drenaaž — kõik Grundfos tooted ühest kohast. Küsi nõu!', 'Tutvu meie tootevalikuga — üle 500 pumba laos, kiire tarne ja professionaalne paigaldus.'] },
  ],
  'Grundfos pumbad - üldine': [
    { u: 'https://pumbapood.ee/tooted', p: 'tooted', h: ['Grundfos Suurim Valik Eestis', 'Kõik Pumbad Ühest Kohast', 'Küte Vesi Drenaaž Tööstus'], d: ['Tutvu kogu Grundfos tootevalikuga — küttepumbad, veeautomaadid, puurkaevupumbad ja palju muud.', 'Grundfos on maailma juhtiv pumbatootja. Aitame leida Sinu vajadustele vastava lahenduse.'] },
    { u: 'https://pumbapood.ee/tooted', p: 'tooted', h: ['Grundfos Pump Professionaalne', 'Leia Õige Pump — Aitame', 'Paigaldus ja Hooldus'], d: ['Professionaalne nõustamine ja paigaldus. Grundfos pumbad — kvaliteet, mis kestab aastakümneid.', 'Õige pumba valik on kriitiline. Meie eksperdid aitavad — tasuta konsultatsioon!'] },
  ],
}

let created = 0
for (const ag of ags) {
  const name = ag.adGroup?.name, id = ag.adGroup?.id
  const tmpl = T[name]
  if (!tmpl) { console.log('Skip: ' + name); continue }

  for (const ad of tmpl) {
    const headers = ad.h.map((text, i) => ({ text, pinnedField: i === 0 ? 'HEADLINE_1' : 'UNSPECIFIED' }))
    const extra = ad.q ? { path1: ad.p, path2: ad.q } : { path1: ad.p }
    const op = {
      create: {
        adGroup: `customers/${CUST}/adGroups/${id}`,
        status: 'ENABLED',
        ad: {
          name: name + ' RSA ' + (created + 1),
          type: 'RESPONSIVE_SEARCH_AD',
          finalUrls: [ad.u],
          responsiveSearchAd: {
            headlines: headers,
            descriptions: ad.d.map(t => ({ text: t })),
            ...extra,
          },
        },
      },
    }
    const res = await mutate([op], 'adGroupAds')
    if (res?.results) created++
    else console.log('  FAIL: ' + name + ' — ' + JSON.stringify(res?.error?.details?.[0]?.errors?.[0]?.message || res?.error?.message || '').slice(0, 200))
  }
}

console.log('\nNew RSAs created: ' + created)
