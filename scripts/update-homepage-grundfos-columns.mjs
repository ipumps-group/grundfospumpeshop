// Avalehe Grundfos 4-veeru sektsiooni täiendus (kliendi sõnastus 22.10.2026):
//   1. veergude „→ valik" tekstlingid asendatakse NUPPUDEga (button block, filled #003366)
//   2. veergude tekstid uue sõnastusega (ET täpselt kliendi tekst, muud keeled: eemaldatud
//      lõpu-link, sisu sama mis enne)
// Idempotentne — nuppe/tekste uuendatakse, mitte ei dubleerita.
// Kasutus: node scripts/update-homepage-grundfos-columns.mjs [--dry-run]
import { createClient } from '@supabase/supabase-js'
import { env } from './env.mjs'

const DRY = process.argv.includes('--dry-run')
const s = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)
const uid = () => Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10)

/* Kliendi sõnastus (ET), hind live-kataloogist; tärnihind jääb esile tõstetuna */
const ET_TEXT = [
  'Uus ALPHA GO seeria asendab enamiku vanu UPS- ja ALPHA-pumpasid (<strong>alates 170,05 €</strong>). Suurematesse süsteemidesse MAGNA1 ja MAGNA3.',
  'Eramule parim valik SCALA2 (<strong>alates 657,41 €</strong>). Soodsamad SCALA1 (alates 452,05 €) ja klassikaline JP hüdrofoor (alates 234,52 €).',
  '3-tollise kaevu jaoks Grundfos SQ (<strong>alates 740,87 €</strong>) või juhtmeta SQE (810–1447 €).',
  'Üleujutuse või drenaaživee korral Unilift CC (<strong>alates 172,75 €</strong>) ja Unilift KP. Reovee korral Unilift AP.',
]

const BUTTONS = [
  { url: '/tooted/kuttepumbad', et: 'Küttepumpade valik →', en: 'All heating pumps →', ru: 'Все насосы для отопления →', lv: 'Visi apkures sūkņi →', lt: 'Visi šildymo siurbliai →' },
  { url: '/tooted/veeautomaadid', et: 'Veeautomaatide valik →', en: 'All water boosters →', ru: 'Все водяные автоматы →', lv: 'Visi ūdens automāti →', lt: 'Visi vandens automatai →' },
  { url: '/tooted/puurkaevupumbad', et: 'Puurkaevupumpade valik →', en: 'All borehole pumps →', ru: 'Все скважинные насосы →', lv: 'Visi urbumu sūkņi →', lt: 'Visi gręžinių siurbliai →' },
  { url: '/tooted/drenaazipumbad', et: 'Drenaažipumpade valik →', en: 'All drainage pumps →', ru: 'Все дренажные насосы →', lv: 'Visi drenāžas sūkņi →', lt: 'Visi drenažo siurbliai →' },
]

const { data: page, error } = await s.from('pages').select('id, blocks').eq('slug', 'esilehtx').single()
if (error) { console.error(error.message); process.exit(1) }
const blocks = [...(page.blocks ?? [])]

// Leia 4-veeruline Grundfos sektsioon (ALPHA pilt 93074225.jpg)
const section = blocks.find((b) =>
  (b.columns ?? []).length === 4 &&
  (b.columns ?? []).some((c) => (c.blocks ?? []).some((x) => x.type === 'image' && String(x.url).includes('93074225'))),
)
if (!section) { console.error('4-veeru Grundfos sektsiooni ei leitud — käivita esmalt merge-skript'); process.exit(1) }

let changes = 0
section.columns.forEach((col, i) => {
  const tb = (col.blocks ?? []).find((x) => x.type === 'text')
  if (tb) {
    // ET: kliendi uus sõnastus; muud keeled: eemalda lõpu „→ valik" link (asendub nupuga)
    if (tb.content !== ET_TEXT[i]) { tb.content = ET_TEXT[i]; changes++ }
    for (const loc of ['en', 'ru', 'lv', 'lt']) {
      const key = `content_${loc}`
      const cleaned = String(tb[key] ?? '').replace(/<br>\s*<a href="[^"]*">[^<]*→<\/a>\s*$/i, '')
      if (cleaned !== tb[key]) { tb[key] = cleaned; changes++ }
    }
  }
  // Nupp veeru lõppu (või uuenda olemasolevat)
  let btn = (col.blocks ?? []).find((x) => x.type === 'button')
  if (!btn) {
    btn = { id: uid(), type: 'button', style: 'filled', color: '#003366', target: '_self', alignment: 'left' }
    col.blocks.push({ id: uid(), type: 'spacer', height: 12 }, btn)
    changes++
  }
  const want = { url: BUTTONS[i].url, text: BUTTONS[i].et, text_en: BUTTONS[i].en, text_ru: BUTTONS[i].ru, text_lv: BUTTONS[i].lv, text_lt: BUTTONS[i].lt }
  for (const [k, v] of Object.entries(want)) if (btn[k] !== v) { btn[k] = v; changes++ }
})

console.log(`muudatusi: ${changes}`)
for (const [i, c] of section.columns.entries()) {
  const b = c.blocks.find((x) => x.type === 'button')
  const t = c.blocks.find((x) => x.type === 'text')
  console.log(`  veerg ${i + 1}: nupp „${b?.text}" → ${b?.url} · tekst: ${(t?.content ?? '').slice(0, 70)}…`)
}
if (changes === 0) { console.log('Kõik juba õiges seisus — midagi ei muudeta'); process.exit(0) }
if (DRY) { console.log('DRY RUN — muudatusi ei salvestatud'); process.exit(0) }
const { error: upErr } = await s.from('pages').update({ blocks }).eq('id', page.id)
if (upErr) { console.error('Uuendus ebaõnnestus:', upErr.message); process.exit(1) }
console.log('OK — nupud ja uus sõnastus live')
