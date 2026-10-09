// Nädalaraporti SEO: "Grundfos" tõusu (14,2 -> 9,0) kinnistus avalehel.
//  1. meta_title: too sisse kandevad märksõnad (veeautomaadid, kütte-, drenaažipumbad).
//  2. Uus FAQ-sektsioon "Grunduma kippuvad küsimused Grundfos pumpade kohta":
//     siselingid märksõna-ankrutega + E-E-A-T (ametlik edasimüüja, tarne, tugi).
//     Sama sisu kajastub FAQPage JSON-LD-s app/[locale]/page.tsx-is.
// Kasutus: node scripts/update-homepage-grundfos-faq.mjs [--dry-run]
import { createClient } from '@supabase/supabase-js'
import { env } from './env.mjs'

const DRY = process.argv.includes('--dry-run')
const s = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

const META_TITLE = 'Grundfos pumbad — veeautomaadid, kütte- ja drenaažipumbad | Pumbapood.ee'

const uid = () => Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10)

const HEADING = {
  et: 'Korduma kippuvad küsimused Grundfos pumpade kohta',
  en: 'Frequently asked questions about Grundfos pumps',
  ru: 'Частые вопросы о насосах Grundfos',
  lv: 'Biežāk uzdotie jautājumi par Grundfos sūkņiem',
  lt: 'Dažnai užduodami klausimai apie Grundfos siurblius',
}
const TEXT = {
  et: '<p><strong>Milliseid Grundfos pumpasi leiab Pumbapoest?</strong><br>Meie valikust leiad kõik peamised Grundfos seeriad: <a href="/tooted/veeautomaadid">veeautomaadid ja hüdrofoorid</a> (SCALA1, SCALA2, JP), <a href="/tooted/kuttepumbad">kütte- ja tsirkulatsioonipumbad</a> (ALPHA GO, MAGNA3), <a href="/tooted/drenaazipumbad">drenaaži- ja tühjenduspumbad</a> (Unilift), <a href="/tooted/puurkaevupumbad">puurkaevupumbad</a> (SQ, SQE) ja <a href="/tooted/reoveepumbad">reoveepumbad</a>.</p><p><strong>Kas olete ametlik Grundfos edasimüüja Eestis?</strong><br>Jah — Pumbapood.ee (Pump OÜ) on ametlik Grundfos partner. Kõik tooted on originaalsed, kehtib tootjagarantii ja pakume tehnilist tuge.</p><p><strong>Kui kiire on tarne?</strong><br>Laos olevad Grundfos pumbad jõuavad üle Eesti tavaliselt 1–3 tööpäevaga. Suurematele projektidele ja eritellimustele kokkuleppel.</p><p><strong>Kas aitate pumba valikul ja paigaldusel?</strong><br>Jah — tasuta nõustamine aitab valida õige pumba vastavalt veeallikale, kraanikohtadele ja rõhuvajadusele. Helista +372 527 4403, kirjuta info@pumbapood.ee või <a href="/leht/kontakt">võta ühendust</a>.</p>',
  en: '<p><strong>Which Grundfos pumps can I find at Pumbapood?</strong><br>Our range covers all the main Grundfos series: <a href="/tooted/veeautomaadid">water boosters and hydrophores</a> (SCALA1, SCALA2, JP), <a href="/tooted/kuttepumbad">heating and circulator pumps</a> (ALPHA GO, MAGNA3), <a href="/tooted/drenaazipumbad">drainage and dewatering pumps</a> (Unilift), <a href="/tooted/puurkaevupumbad">borehole pumps</a> (SQ, SQE) and <a href="/tooted/reoveepumbad">wastewater pumps</a>.</p><p><strong>Are you an official Grundfos reseller in Estonia?</strong><br>Yes — Pumbapood.ee (Pump OÜ) is an official Grundfos partner. All products are original, manufacturer warranty applies and we provide technical support.</p><p><strong>How fast is delivery?</strong><br>Grundfos pumps in stock reach you across Estonia usually within 1–3 working days. Larger projects and special orders by agreement.</p><p><strong>Do you help with pump selection and installation?</strong><br>Yes — free consultation helps you choose the right pump for your water source, taps and pressure needs. Call +372 527 4403, write info@pumbapood.ee or <a href="/leht/kontakt">contact us</a>.</p>',
  ru: '<p><strong>Какие насосы Grundfos есть в Pumbapood?</strong><br>В нашем ассортименте все основные серии Grundfos: <a href="/tooted/veeautomaadid">насосные станции и гидрофоры</a> (SCALA1, SCALA2, JP), <a href="/tooted/kuttepumbad">отопительные и циркуляционные насосы</a> (ALPHA GO, MAGNA3), <a href="/tooted/drenaazipumbad">дренажные насосы</a> (Unilift), <a href="/tooted/puurkaevupumbad">скважинные насосы</a> (SQ, SQE) и <a href="/tooted/reoveepumbad">канализационные насосы</a>.</p><p><strong>Вы официальный дилер Grundfos в Эстонии?</strong><br>Да — Pumbapood.ee (Pump OÜ) является официальным партнёром Grundfos. Все товары оригинальные, действует гарантия производителя и техническая поддержка.</p><p><strong>Насколько быстрая доставка?</strong><br>Насосы Grundfos в наличии доставляются по Эстонии обычно за 1–3 рабочих дня. Для крупных проектов и спецзаказов — по договорённости.</p><p><strong>Вы помогаете с подбором и установкой насоса?</strong><br>Да — бесплатная консультация поможет подобрать насос под источник воды, точки разбора и давление. Звоните +372 527 4403, пишите info@pumbapood.ee или <a href="/leht/kontakt">свяжитесь с нами</a>.</p>',
  lv: '<p><strong>Kurus Grundfos sūkņus varat atrast Pumbapood?</strong><br>Mūsu klāstā ir visas galvenās Grundfos sērijas: <a href="/tooted/veeautomaadid">ūdens automāti un hidrofori</a> (SCALA1, SCALA2, JP), <a href="/tooted/kuttepumbad">apkures un cirkulācijas sūkņi</a> (ALPHA GO, MAGNA3), <a href="/tooted/drenaazipumbad">drenāžas sūkņi</a> (Unilift), <a href="/tooted/puurkaevupumbad">urbumu sūkņi</a> (SQ, SQE) un <a href="/tooted/reoveepumbad">notekūdeņu sūkņi</a>.</p><p><strong>Vai esat oficiālais Grundfos izplatītājs Igaunijā?</strong><br>Jā — Pumbapood.ee (Pump OÜ) ir oficiālais Grundfos partneris. Visi produkti ir oriģināli, ir ražotāja garantija un tehniskais atbalsts.</p><p><strong>Cik ātra ir piegāde?</strong><br>Noliktavā esošie Grundfos sūkņi visā Igaunijā parasti tiek piegādāti 1–3 darba dienu laikā. Lielākiem projektiem un speciālpasūtījumiem — pēc vienošanās.</p><p><strong>Vai palīdzat ar sūkņa izvēli un uzstādīšanu?</strong><br>Jā — bezmaksas konsultācija palīdz izvēlēties pareizo sūkni atbilstoši ūdens avotam, krāniem un spiediena vajadzībām. Zvaniet +372 527 4403, rakstiet info@pumbapood.ee vai <a href="/leht/kontakt">sazinieties ar mums</a>.</p>',
  lt: '<p><strong>Kurius Grundfos siurblius galite rasti Pumbapood?</strong><br>Mūsų asortimente yra visos pagrindinės Grundfos serijos: <a href="/tooted/veeautomaadid">vandens automatai ir hidroforai</a> (SCALA1, SCALA2, JP), <a href="/tooted/kuttepumbad">šildymo ir cirkuliaciniai siurbliai</a> (ALPHA GO, MAGNA3), <a href="/tooted/drenaazipumbad">drenažo siurbliai</a> (Unilift), <a href="/tooted/puurkaevupumbad">gręžinių siurbliai</a> (SQ, SQE) ir <a href="/tooted/reoveepumbad">nuotekų siurbliai</a>.</p><p><strong>Ar esate oficialus Grundfos atstovas Estijoje?</strong><br>Taip — Pumbapood.ee (Pump OÜ) yra oficialus Grundfos partneris. Visi produktai yra originalūs, galioja gamintojo garantija ir teikiamas techninis palaikymas.</p><p><strong>Koks greitas pristatymas?</strong><br>Sandėlyje esantys Grundfos siurbliai visoje Estijoje pristatomi dažniausiai per 1–3 darbo dienas. Didesniems projektams ir specialiems užsakymams — susitarus.</p><p><strong>Ar padedate parinkti ir sumontuoti siurblį?</strong><br>Taip — nemokama konsultacija padeda parinkti tinkamą siurblį pagal vandens šaltinį, čiaupus ir slėgio poreikius. Skambinkite +372 527 4403, rašykite info@pumbapood.ee arba <a href="/leht/kontakt">susisiekite</a>.</p>',
}

const newSection = {
  id: uid(),
  type: 'section',
  order: -1,
  columns: [
    {
      id: uid(),
      width: 100,
      vertical_align: 'top',
      blocks: [
        { id: uid(), type: 'heading', level: 'h2', text: HEADING.et, text_en: HEADING.en, text_ru: HEADING.ru, text_lv: HEADING.lv, text_lt: HEADING.lt, alignment: 'left', color: '#003366' },
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
    background_color: '#f8fafc',
    background_overlay: 0.4,
    background_image_url: null,
  },
}

const { data: page, error } = await s.from('pages').select('id, meta_title, blocks').eq('slug', 'esilehtx').single()
if (error) { console.error(error.message); process.exit(1) }

console.log('Praegune meta_title:', page.meta_title)
console.log('Uus meta_title:     ', META_TITLE)

const blocks = [...(page.blocks ?? [])]
if (blocks.some((b) => b.columns?.some((c) => c.blocks?.some((x) => x.text === HEADING.et)))) {
  console.log('Grundfos-FAQ sektsioon on juba olemas — ei lisata uuesti.')
} else {
  // Lisa lehe lõppu (enne kontakti, kui selline sektsioon olemas)
  const contactIdx = blocks.findIndex((b) => b.columns?.some((c) => c.blocks?.some((x) => x.type === 'kontakt' || x.type === 'contact')))
  const at = contactIdx >= 0 ? contactIdx : blocks.length
  blocks.splice(at, 0, newSection)
  console.log(`FAQ-sektsioon lisatud positsioonile ${at} (${blocks.length} sektsiooni kokku)`)
}
const renumbered = blocks.map((b, i) => ({ ...b, order: i }))

if (DRY) { console.log('DRY RUN — muudatusi ei salvestatud'); process.exit(0) }
const { error: upErr } = await s.from('pages').update({ meta_title: META_TITLE, blocks: renumbered }).eq('id', page.id)
if (upErr) { console.error('Uuendus ebaõnnestus:', upErr.message); process.exit(1) }
console.log('OK — meta_title ja FAQ-sektsioon uuendatud')
