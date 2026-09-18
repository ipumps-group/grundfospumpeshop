// Küttepumbad kategooria — ALPHA GO seeriad esile + kirjelduste uuendus
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } from './env.mjs'

const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

// 1) Seeriate järjekord (sort_order) — GO seeriad ette, vanad alla
const ORDER = {
  'alpha1-go': 5,
  'alpha2-go': 6,
  'grundfos-alpha1': 10,   // uus ALPHA1 — soodne, jääb kolmandaks
  'alpha1-l': 15,
  'grundfos-alpha2': 20,
  'grundfos-alpha3': 30,
  'grundfos-magna1': 40,
  'grundfos-magna3': 50,
  'grundfos-up': 55,
  'grundfos-ups': 60,
}

// 2) Seeriate kirjeldused (ET) — asendusinfo
const DESCRIPTIONS = {
  'alpha1-go': 'Asendab eraldiseisvad UPS, vana ALPHA1 ja ALPHA1 L tsirkulatsioonipumbad. Grundfos GO äpiga juhendatud asendus ja seadistus — kiire ja täpne kasutuselevõtt.',
  'alpha2-go': 'Tippmudel asenduseks — asendab ALPHA2 ja ALPHA3 ning soojuspumpade UPM3/UPM4 pumbad. Juhendatud seadistus, tasakaalustus ja täiustatud AUTOADAPT Grundfos GO äpis.',
  'grundfos-alpha1': 'Energiasäästlikud märghermeetilised tsirkulatsioonipumbad keskkütte- ja põrandaküttesüsteemidele. Soodsaim valik — ilma äpi toeta.',
  'alpha1-l': 'Asendub ALPHA1 GO seeriaga — saadaval kuni laoseisu lõpuni.',
  'grundfos-alpha2': 'Premium-klassi tsirkulatsioonipumbad AUTOADAPT funktsiooniga. Asendub ALPHA2 GO seeriaga — saadaval kuni laoseisu lõpuni.',
  'grundfos-alpha3': 'ALPHA3 koos ALPHA Reader rakendusega — küttesüsteemi tasakaalustamiseks ja optimeerimiseks. Asendub ALPHA2 GO seeriaga.',
  'grundfos-ups': 'Klassikalised kolmekiiruselised tsirkulatsioonipumbad. Asendub ALPHA1 GO seeriaga — saadaval kuni laoseisu lõpuni.',
  'grundfos-up': 'Lihtsad ja vastupidavad tsirkulatsioonipumbad sooja tarbevee ringlusesse. Saadaval kuni laoseisu lõpuni.',
}

for (const [slug, sort] of Object.entries(ORDER)) {
  const upd = { sort_order: sort }
  if (DESCRIPTIONS[slug]) upd.description = DESCRIPTIONS[slug]
  const { error } = await admin.from('product_series').update(upd).eq('slug', slug)
  if (error) { console.error(`VIGA ${slug}:`, error.message); process.exit(1) }
  console.log(`✔ ${slug} -> sort ${sort}${DESCRIPTIONS[slug] ? ' + kirjeldus' : ''}`)
}

// 3) Kategooria kirjeldus + meta
const { error: aErr } = await admin.from('activity_areas').update({
  description: 'Uued Grundfos ALPHA GO tsirkulatsioonipumbad keskkütte- ja põrandaküttesüsteemidele. ALPHA1 GO ja ALPHA2 GO asendavad enamiku vanu UPS, ALPHA1, ALPHA1 L, ALPHA2 ja ALPHA3 pumapasid — Grundfos GO äpiga on asendus ja seadistus kiire ning täpne.',
  meta_description: 'Grundfos ALPHA GO küttepumbad — ALPHA1 GO ja ALPHA2 GO asendavad UPS, ALPHA1, ALPHA1 L, ALPHA2 ja ALPHA3 tsirkulatsioonipumbad. Kiire tarne ja tasuta nõustamine.',
}).eq('slug', 'kuttepumbad')
if (aErr) { console.error('activity_area VIGA:', aErr.message); process.exit(1) }
console.log('✔ kuttepumbad kirjeldus + meta uuendatud')

console.log('\nKÜTTEPUMBAD UUENDATUD ✔')
