// Avalehe (pages.slug = 'esilehtx') SEO-parandused nädalaraporti järgi:
//  1. meta_description: paranda "Grunfos" trükk + too sisse kandevad märksõnad
//     (avaleht kannab "grundfos" päringuid — pos 5–10, snippet peab klikke tooma).
//  2. Uus sektsioon "Grundfos pumpade valik" pärast kategooriate ruudustikku:
//     siselingid märksõna-ankrutega Grundfos-kategooriatele (raport: "lisa
//     siselinke avalehelt" + "1–2 siselist linki märksõna-ankruga").
// Kasutus: node scripts/update-homepage-grundfos-links.mjs [--dry-run]
import { createClient } from '@supabase/supabase-js'
import { env } from './env.mjs'

const DRY = process.argv.includes('--dry-run')
const s = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

const META_DESCRIPTION =
  'Grundfos pumbad ja lahendused ühest kohast: veeautomaadid, kütte- ja tsirkulatsioonipumbad, drenaaži- ja kaevupumbad. Nõustamine, kiire tarne ja paigaldus.'

const uid = () => Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10)

const HEADING = {
  et: 'Grundfos pumpade valik',
  en: 'The Grundfos pump range',
  ru: 'Ассортимент насосов Grundfos',
  lv: 'Grundfos sūkņu klāsts',
  lt: 'Grundfos siurblių asortimentas',
}
const TEXT = {
  et: '<p>Grundfos pumbad igaks vajaduseks — ametlik partner, kiire tarne üle Eesti: <a href="/tooted/veeautomaadid">veeautomaadid ja hüdrofoorid</a> · <a href="/tooted/kuttepumbad">küttepumbad</a> · <a href="/tooted/tsirkulatsioonipumbad-soe-tarbevesi">tsirkulatsioonipumbad</a> · <a href="/tooted/puurkaevupumbad">puurkaevupumbad</a> · <a href="/tooted/salvkaevupumbad">salvkaevu- ja kastmispumbad</a> · <a href="/tooted/drenaazipumbad">drenaažipumbad</a> · <a href="/tooted/rohutostepumbad">rõhutõstepumbad</a> · <a href="/tooted/reoveepumbad">reoveepumbad</a></p>',
  en: '<p>Grundfos pumps for every need — official partner, fast delivery across Estonia: <a href="/tooted/veeautomaadid">water boosters and hydrophores</a> · <a href="/tooted/kuttepumbad">heating pumps</a> · <a href="/tooted/tsirkulatsioonipumbad-soe-tarbevesi">circulation pumps</a> · <a href="/tooted/puurkaevupumbad">borehole pumps</a> · <a href="/tooted/salvkaevupumbad">shallow-well and irrigation pumps</a> · <a href="/tooted/drenaazipumbad">drainage pumps</a> · <a href="/tooted/rohutostepumbad">pressure boosting pumps</a> · <a href="/tooted/reoveepumbad">wastewater pumps</a></p>',
  ru: '<p>Насосы Grundfos для любых задач — официальный партнёр, быстрая доставка по Эстонии: <a href="/tooted/veeautomaadid">насосные станции и гидрофоры</a> · <a href="/tooted/kuttepumbad">отопительные насосы</a> · <a href="/tooted/tsirkulatsioonipumbad-soe-tarbevesi">циркуляционные насосы</a> · <a href="/tooted/puurkaevupumbad">скважинные насосы</a> · <a href="/tooted/salvkaevupumbad">колодезные и поливочные насосы</a> · <a href="/tooted/drenaazipumbad">дренажные насосы</a> · <a href="/tooted/rohutostepumbad">насосы повышения давления</a> · <a href="/tooted/reoveepumbad">канализационные насосы</a></p>',
  lv: '<p>Grundfos sūkņi katrai vajadzībai — oficiālais partneris, ātra piegāde visā Igaunijā: <a href="/tooted/veeautomaadid">ūdens automāti un hidrofori</a> · <a href="/tooted/kuttepumbad">apkures sūkņi</a> · <a href="/tooted/tsirkulatsioonipumbad-soe-tarbevesi">cirkulācijas sūkņi</a> · <a href="/tooted/puurkaevupumbad">urbumu sūkņi</a> · <a href="/tooted/salvkaevupumbad">akas un laistīšanas sūkņi</a> · <a href="/tooted/drenaazipumbad">drenāžas sūkņi</a> · <a href="/tooted/rohutostepumbad">spiediena paaugstināšanas sūkņi</a> · <a href="/tooted/reoveepumbad">notekūdeņu sūkņi</a></p>',
  lt: '<p>Grundfos siurbliai kiekvienam poreikiui — oficialus partneris, greitas pristatymas visoje Estijoje: <a href="/tooted/veeautomaadid">vandens automatai ir hidroforai</a> · <a href="/tooted/kuttepumbad">šildymo siurbliai</a> · <a href="/tooted/tsirkulatsioonipumbad-soe-tarbevesi">cirkuliaciniai siurbliai</a> · <a href="/tooted/puurkaevupumbad">gręžinių siurbliai</a> · <a href="/tooted/salvkaevupumbad">šulinių ir laistymo siurbliai</a> · <a href="/tooted/drenaazipumbad">drenažo siurbliai</a> · <a href="/tooted/rohutostepumbad">slėgio didinimo siurbliai</a> · <a href="/tooted/reoveepumbad">nuotekų siurbliai</a></p>',
}

const newSection = {
  id: uid(),
  type: 'section',
  order: -1, // renumbered below
  columns: [
    {
      id: uid(),
      width: 100,
      vertical_align: 'top',
      blocks: [
        { id: uid(), type: 'heading', level: 'h3', text: HEADING.et, text_en: HEADING.en, text_ru: HEADING.ru, text_lv: HEADING.lv, text_lt: HEADING.lt, alignment: 'left', color: '#003366' },
        { id: uid(), type: 'spacer', height: 12 },
        { id: uid(), type: 'text', content: TEXT.et, content_en: TEXT.en, content_ru: TEXT.ru, content_lv: TEXT.lv, content_lt: TEXT.lt, alignment: 'left', color: '#374151' },
      ],
    },
  ],
  settings: {
    width: 'boxed',
    padding_top: 'small',
    padding_bottom: 'medium',
    background_type: 'color',
    background_color: '#ffffff',
    background_overlay: 0.4,
    background_image_url: null,
  },
}

const { data: page, error } = await s.from('pages').select('id, meta_description, blocks').eq('slug', 'esilehtx').single()
if (error) { console.error(error.message); process.exit(1) }

console.log('Praegune meta_description:', page.meta_description)
console.log('Uus meta_description:   ', META_DESCRIPTION)

const blocks = [...(page.blocks ?? [])]
if (blocks.some((b) => b.id === newSection.id || b.columns?.[0]?.blocks?.some((x) => x.text === HEADING.et))) {
  console.log('Grundfos-lingisektsioon on juba olemas — ei lisata uuesti.')
} else {
  // Aseta kategooriate ruudustiku (order 4, "tegevusalad") järele
  const gridIdx = blocks.findIndex((b) => b.columns?.some((c) => c.blocks?.some((x) => x.type === 'tegevusalad')))
  const at = gridIdx >= 0 ? gridIdx + 1 : blocks.length
  blocks.splice(at, 0, newSection)
  console.log(`Sektsioon lisatud positsioonile ${at} (${blocks.length} sektsiooni kokku)`)
}
const renumbered = blocks.map((b, i) => ({ ...b, order: i }))

if (DRY) { console.log('DRY RUN — muudatusi ei salvestatud'); process.exit(0) }
const { error: upErr } = await s.from('pages').update({ meta_description: META_DESCRIPTION, blocks: renumbered }).eq('id', page.id)
if (upErr) { console.error('Uuendus ebaõnnestus:', upErr.message); process.exit(1) }
console.log('OK — meta_description ja blokid uuendatud')
