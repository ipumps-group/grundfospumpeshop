// Avalehe Grundfos-sektsioonide ühendamine (kliendi tagasiside 22.10.2026):
// „Grundfos tootesarjad ja hinnad" (lisatud samal päeval) ja „Milline Grundfos pump valida?"
// olid sisuliselt sama asi → ühendatakse üheks 4-veeruliseks sektsiooniks koos
// tunnuspiltidega (ALPHA GO / SCALA2 / SQ / Unilift CC tootepildid + hinnainfo).
//   1. eemaldab „Grundfos tootesarjad ja hinnad" sektsiooni
//   2. juhendi sektsioonist eemaldatakse pikk tekstiplokk (sisu kolib veergudesse), pealkiri jääb
//   3. lisab uue 4-veerulise sektsiooni kohe juhendi pealkirja järele (5 keeles)
//   4. „kasutatud vs uus" juhendi link kolib lingi-sektsiooni („Grundfos pumpade valik") lõppu
// Kasutus: node scripts/merge-homepage-grundfos-guide.mjs [--dry-run]  (idempotentne)
import { createClient } from '@supabase/supabase-js'
import { env } from './env.mjs'

const DRY = process.argv.includes('--dry-run')
const s = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)
const uid = () => Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10)
const IMG = (f) => `https://sdqnzyfmanflslsjhytf.supabase.co/storage/v1/object/public/products/images/${f}`

/* --- veeru sisu 5 keeles (täpsed „alates" hinnad live-kataloogist 22.10.2026) --- */
const COLS = [
  {
    img: { url: IMG('93074225.jpg'), alt: 'Grundfos ALPHA GO tsirkulatsioonipump', link: '/alpha-go' },
    h3: { et: 'Küte ja tsirkulatsioon', en: 'Heating and circulation', ru: 'Отопление и циркуляция', lv: 'Apkure un cirkulācija', lt: 'Šildymas ir cirkuliacija' },
    text: {
      et: 'Uus <a href="/alpha-go">ALPHA GO seeria</a> (<strong>alates 170,05 €</strong>) asendab enamiku vanu UPS- ja ALPHA-pumpasid; suurematesse süsteemidesse <a href="/tooted/kuttepumbad/grundfos-magna1">MAGNA1</a> ja <a href="/tooted/kuttepumbad/grundfos-magna3">MAGNA3</a>.<br><a href="/tooted/kuttepumbad">Küttepumpade valik →</a>',
      en: 'The new <a href="/alpha-go">ALPHA GO series</a> (<strong>from €170.05</strong>) replaces most old UPS and ALPHA pumps; for larger systems <a href="/tooted/kuttepumbad/grundfos-magna1">MAGNA1</a> and <a href="/tooted/kuttepumbad/grundfos-magna3">MAGNA3</a>.<br><a href="/tooted/kuttepumbad">All heating pumps →</a>',
      ru: 'Новая серия <a href="/alpha-go">ALPHA GO</a> (<strong>от 170,05 €</strong>) заменяет большинство старых UPS и ALPHA; для больших систем — <a href="/tooted/kuttepumbad/grundfos-magna1">MAGNA1</a> и <a href="/tooted/kuttepumbad/grundfos-magna3">MAGNA3</a>.<br><a href="/tooted/kuttepumbad">Все насосы для отопления →</a>',
      lv: 'Jaunā <a href="/alpha-go">ALPHA GO sērija</a> (<strong>no 170,05 €</strong>) aizstāj lielāko daļu veco UPS un ALPHA sūkņu; lielākām sistēmām — <a href="/tooted/kuttepumbad/grundfos-magna1">MAGNA1</a> un <a href="/tooted/kuttepumbad/grundfos-magna3">MAGNA3</a>.<br><a href="/tooted/kuttepumbad">Visi apkures sūkņi →</a>',
      lt: 'Nauja <a href="/alpha-go">ALPHA GO serija</a> (<strong>nuo 170,05 €</strong>) pakeičia daugumą senų UPS ir ALPHA siurblių; didesnėms sistemoms — <a href="/tooted/kuttepumbad/grundfos-magna1">MAGNA1</a> ir <a href="/tooted/kuttepumbad/grundfos-magna3">MAGNA3</a>.<br><a href="/tooted/kuttepumbad">Visi šildymo siurbliai →</a>',
    },
  },
  {
    img: { url: IMG('93013252.jpg'), alt: 'Grundfos SCALA2 veeautomaat', link: '/tooted/veeautomaadid' },
    h3: { et: 'Veeautomaat ja hüdrofoor', en: 'Water boosters', ru: 'Водяные автоматы и гидрофоры', lv: 'Ūdens automāti un hidrofori', lt: 'Vandens automatai ir hidroforai' },
    text: {
      et: 'Eramule parim valik <a href="/tooted/veeautomaadid/grundfos-scala2">SCALA2</a> (<strong>alates 657,41 €</strong>); soodsamad <a href="/tooted/veeautomaadid/grundfos-scala1">SCALA1</a> (alates 452,05 €) ja klassikaline <a href="/tooted/veeautomaadid/grundfos-jp">JP hüdrofoor</a> (alates 234,52 €).<br><a href="/tooted/veeautomaadid">Veeautomaatide valik →</a>',
      en: 'Best for a detached house: <a href="/tooted/veeautomaadid/grundfos-scala2">SCALA2</a> (<strong>from €657.41</strong>); more affordable <a href="/tooted/veeautomaadid/grundfos-scala1">SCALA1</a> (from €452.05) and the classic <a href="/tooted/veeautomaadid/grundfos-jp">JP hydrophore</a> (from €234.52).<br><a href="/tooted/veeautomaadid">All water boosters →</a>',
      ru: 'Для частного дома лучший выбор — <a href="/tooted/veeautomaadid/grundfos-scala2">SCALA2</a> (<strong>от 657,41 €</strong>); доступнее — <a href="/tooted/veeautomaadid/grundfos-scala1">SCALA1</a> (от 452,05 €) и классический <a href="/tooted/veeautomaadid/grundfos-jp">гидрофор JP</a> (от 234,52 €).<br><a href="/tooted/veeautomaadid">Все водяные автоматы →</a>',
      lv: 'Privātmājai labākā izvēle — <a href="/tooted/veeautomaadid/grundfos-scala2">SCALA2</a> (<strong>no 657,41 €</strong>); lētākas alternatīvas — <a href="/tooted/veeautomaadid/grundfos-scala1">SCALA1</a> (no 452,05 €) un klasiskais <a href="/tooted/veeautomaadid/grundfos-jp">JP hidrofors</a> (no 234,52 €).<br><a href="/tooted/veeautomaadid">Visi ūdens automāti →</a>',
      lt: 'Individualiam namui geriausias pasirinkimas — <a href="/tooted/veeautomaadid/grundfos-scala2">SCALA2</a> (<strong>nuo 657,41 €</strong>); pigesnės alternatyvos — <a href="/tooted/veeautomaadid/grundfos-scala1">SCALA1</a> (nuo 452,05 €) ir klasikinis <a href="/tooted/veeautomaadid/grundfos-jp">JP hidroforas</a> (nuo 234,52 €).<br><a href="/tooted/veeautomaadid">Visi vandens automatai →</a>',
    },
  },
  {
    img: { url: IMG('96510199.jpg'), alt: 'Grundfos SQ puurkaevupump', link: '/tooted/puurkaevupumbad' },
    h3: { et: 'Puurkaev', en: 'Boreholes', ru: 'Скважина', lv: 'Urbumi', lt: 'Gręžiniai' },
    text: {
      et: '3-tollise kaevu jaoks <a href="/tooted/puurkaevupumbad/grundfos-sq">Grundfos SQ</a> (<strong>alates 740,87 €</strong>) või juhtmeta <a href="/tooted/puurkaevupumbad/sqe">SQE</a> (810–1447 €).<br><a href="/tooted/puurkaevupumbad">Puurkaevupumpade valik →</a>',
      en: 'For a 3-inch borehole: <a href="/tooted/puurkaevupumbad/grundfos-sq">Grundfos SQ</a> (<strong>from €740.87</strong>) or the cable-free <a href="/tooted/puurkaevupumbad/sqe">SQE</a> (€810–1447).<br><a href="/tooted/puurkaevupumbad">All borehole pumps →</a>',
      ru: 'Для 3-дюймовой скважины — <a href="/tooted/puurkaevupumbad/grundfos-sq">Grundfos SQ</a> (<strong>от 740,87 €</strong>) или бескабельная <a href="/tooted/puurkaevupumbad/sqe">SQE</a> (810–1447 €).<br><a href="/tooted/puurkaevupumbad">Все скважинные насосы →</a>',
      lv: '3 collu urbumam — <a href="/tooted/puurkaevupumbad/grundfos-sq">Grundfos SQ</a> (<strong>no 740,87 €</strong>) vai bezvadu <a href="/tooted/puurkaevupumbad/sqe">SQE</a> (810–1447 €).<br><a href="/tooted/puurkaevupumbad">Visi urbumu sūkņi →</a>',
      lt: '3 colių gręžiniui — <a href="/tooted/puurkaevupumbad/grundfos-sq">Grundfos SQ</a> (<strong>nuo 740,87 €</strong>) arba belaidis <a href="/tooted/puurkaevupumbad/sqe">SQE</a> (810–1447 €).<br><a href="/tooted/puurkaevupumbad">Visi gręžinių siurbliai →</a>',
    },
  },
  {
    img: { url: IMG('96280965.jpg'), alt: 'Grundfos Unilift CC drenaažipump', link: '/tooted/drenaazipumbad' },
    h3: { et: 'Drenaaž ja tühjendus', en: 'Drainage and dewatering', ru: 'Дренаж и откачка', lv: 'Drenāža un izsūknēšana', lt: 'Drenažas ir išsiurbimas' },
    text: {
      et: 'Üleujutuse või drenaaživee korral <a href="/tooted/drenaazipumbad/unilift-cc">Unilift CC</a> (<strong>alates 172,75 €</strong>) ja <a href="/tooted/drenaazipumbad/unilift-kp">Unilift KP</a>; reovee korral <a href="/tooted/drenaazipumbad/unilift-ap">Unilift AP</a>.<br><a href="/tooted/drenaazipumbad">Drenaažipumpade valik →</a>',
      en: 'For flooding or drainage water: <a href="/tooted/drenaazipumbad/unilift-cc">Unilift CC</a> (<strong>from €172.75</strong>) and <a href="/tooted/drenaazipumbad/unilift-kp">Unilift KP</a>; for wastewater <a href="/tooted/drenaazipumbad/unilift-ap">Unilift AP</a>.<br><a href="/tooted/drenaazipumbad">All drainage pumps →</a>',
      ru: 'При подтоплении или дренажной воде — <a href="/tooted/drenaazipumbad/unilift-cc">Unilift CC</a> (<strong>от 172,75 €</strong>) и <a href="/tooted/drenaazipumbad/unilift-kp">Unilift KP</a>; для сточных вод — <a href="/tooted/drenaazipumbad/unilift-ap">Unilift AP</a>.<br><a href="/tooted/drenaazipumbad">Все дренажные насосы →</a>',
      lv: 'Plūdu vai drenāžas ūdens gadījumā — <a href="/tooted/drenaazipumbad/unilift-cc">Unilift CC</a> (<strong>no 172,75 €</strong>) un <a href="/tooted/drenaazipumbad/unilift-kp">Unilift KP</a>; notekūdeņiem — <a href="/tooted/drenaazipumbad/unilift-ap">Unilift AP</a>.<br><a href="/tooted/drenaazipumbad">Visi drenāžas sūkņi →</a>',
      lt: 'Potvynio ar drenažinio vandens atveju — <a href="/tooted/drenaazipumbad/unilift-cc">Unilift CC</a> (<strong>nuo 172,75 €</strong>) ir <a href="/tooted/drenaazipumbad/unilift-kp">Unilift KP</a>; nuotekoms — <a href="/tooted/drenaazipumbad/unilift-ap">Unilift AP</a>.<br><a href="/tooted/drenaazipumbad">Visi drenažo siurbliai →</a>',
    },
  },
]

/* „kasutatud vs uus" juhendi link kolib lingi-sektsiooni lõppu (5 keeles) */
const USED_VS_NEW = {
  et: ' Kui kahtled, kas osta uus või kasutatud pump, loe juhendit: <a href="/leht/kasutatud-vs-uus-grundfos-pump">kasutatud vs uus Grundfos pump</a>.',
  en: ' Unsure whether to buy new or used? Read our guide: <a href="/leht/kasutatud-vs-uus-grundfos-pump">used vs new Grundfos pump</a>.',
  ru: ' Сомневаетесь, новый или б/у насос? Читайте наш гид: <a href="/leht/kasutatud-vs-uus-grundfos-pump">б/у vs новый насос Grundfos</a>.',
  lv: ' Nezināt, jaunu vai lietotu sūkni? Lasiet ceļvedi: <a href="/leht/kasutatud-vs-uus-grundfos-pump">lietots vs jauns Grundfos sūknis</a>.',
  lt: ' Nežinote, naują ar naudotą siurblį? Skaitykite mūsų gidą: <a href="/leht/kasutatud-vs-uus-grundfos-pump">naudotas vs naujas Grundfos siurblys</a>.',
}

const newColumnsSection = {
  id: uid(),
  type: 'section',
  order: -1,
  columns: COLS.map((c) => ({
    id: uid(),
    width: 25,
    vertical_align: 'top',
    blocks: [
      { id: uid(), type: 'image', url: c.img.url, alt: c.img.alt, link_url: c.img.link, link_target: '_self', object_fit: 'contain' },
      { id: uid(), type: 'spacer', height: 12 },
      { id: uid(), type: 'heading', level: 'h3', text: c.h3.et, text_en: c.h3.en, text_ru: c.h3.ru, text_lv: c.h3.lv, text_lt: c.h3.lt, alignment: 'left', color: '#003366' },
      { id: uid(), type: 'text', content: c.text.et, content_en: c.text.en, content_ru: c.text.ru, content_lv: c.text.lv, content_lt: c.text.lt, alignment: 'left', color: '#374151' },
    ],
  })),
  settings: { width: 'boxed', padding_top: 'small', padding_bottom: 'medium', background_type: 'color', background_color: '#ffffff', background_overlay: 0.4, background_image_url: null },
}

const { data: page, error } = await s.from('pages').select('id, blocks').eq('slug', 'esilehtx').single()
if (error) { console.error(error.message); process.exit(1) }
let blocks = [...(page.blocks ?? [])]
const headings = (b) => (b.columns ?? []).flatMap((c) => c.blocks ?? []).filter((x) => x.type === 'heading').map((x) => x.text)

// 1) eemalda „Grundfos tootesarjad ja hinnad"
const before = blocks.length
blocks = blocks.filter((b) => !headings(b).includes('Grundfos tootesarjad ja hinnad'))
console.log(blocks.length < before ? '1) „Tootesarjad ja hinnad" sektsioon eemaldatud' : '1) „Tootesarjad ja hinnad" sektsiooni polnud (juba eemaldatud)')

// 2) juhendi sektsioonist pikk tekst eemale (pealkiri jääb)
const guide = blocks.find((b) => headings(b).includes('Milline Grundfos pump valida?'))
if (!guide) { console.error('Juhendi sektsiooni ei leitud!'); process.exit(1) }
for (const col of guide.columns ?? []) {
  const n0 = (col.blocks ?? []).length
  col.blocks = (col.blocks ?? []).filter((x) => x.type !== 'text')
  if ((col.blocks ?? []).length < n0) console.log('2) juhendi pikk tekstiplokk eemaldatud (sisu kolib veergudesse)')
}

// 3) uus 4-veeruline sektsioon kohe pärast juhendi pealkirja-sektsiooni
const hasColumns = blocks.some((b) => (b.columns ?? []).some((c) => (c.blocks ?? []).some((x) => x.type === 'image' && String(x.url).includes('93074225'))))
if (hasColumns) {
  console.log('3) 4-veeruline tunnuspiltide sektsioon juba olemas — vahele')
} else {
  const gi = blocks.findIndex((b) => b === guide)
  blocks.splice(gi + 1, 0, newColumnsSection)
  console.log(`3) 4-veeruline sektsioon lisatud positsioonile ${gi + 1}`)
}

// 4) „kasutatud vs uus" link lingi-sektsiooni lõppu
const links = blocks.find((b) => headings(b).includes('Grundfos pumpade valik'))
if (links) {
  for (const col of links.columns ?? []) {
    const tb = (col.blocks ?? []).find((x) => x.type === 'text')
    if (tb && !String(tb.content).includes('kasutatud-vs-uus')) {
      for (const [loc, sentence] of Object.entries(USED_VS_NEW)) {
        const key = loc === 'et' ? 'content' : `content_${loc}`
        tb[key] = String(tb[key] ?? '') + sentence
      }
      console.log('4) „kasutatud vs uus" link lisatud lingi-sektsiooni lõppu (5 keeles)')
    } else if (tb) {
      console.log('4) „kasutatud vs uus" link juba olemas — vahele')
    }
  }
}

const renumbered = blocks.map((b, i) => ({ ...b, order: i }))
console.log(`sektsioone kokku: ${renumbered.length}`)
if (DRY) { console.log('DRY RUN — muudatusi ei salvestatud'); process.exit(0) }
const { error: upErr } = await s.from('pages').update({ blocks: renumbered }).eq('id', page.id)
if (upErr) { console.error('Uuendus ebaõnnestus:', upErr.message); process.exit(1) }
console.log('OK — avalehe Grundfos-sektsioonid ühendatud 4-veeruliseks tunnuspiltidega sektsiooniks')
