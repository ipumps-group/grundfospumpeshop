// Asendab avalehe (esilehtx) KKK-sektsiooni vana "heading + tekstiplokk" struktuuri
// uue 'faq' tüüpi plokiga, mis renderdub sama stiiliga nagu kategoorialehtede KKK.
// Tootenimed vastustes on lingitud e-poe lehtedele.
// Kasutus: node scripts/update-homepage-faq-block.mjs [--dry-run]
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } from './env.mjs'

const DRY = process.argv.includes('--dry-run')
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

const faqBlock = {
  id: 'faq-home-' + Math.random().toString(36).slice(2, 10),
  type: 'faq',
  title: 'Korduma kippuvad küsimused Grundfos pumpade kohta',
  title_en: 'Frequently asked questions about Grundfos pumps',
  title_ru: 'Частые вопросы о насосах Grundfos',
  title_lv: 'Bieži uzdotie jautājumi par Grundfos sūkņiem',
  title_lt: 'Dažnai užduodami klausimai apie Grundfos siurblius',
  items: [
    {
      question: 'Milliseid Grundfos pumpasi leiab Pumbapoest?',
      answer: 'Meie valikust leiad kõik peamised Grundfos seeriad: <a href="/tooted/veeautomaadid">veeautomaadid ja hüdrofoorid</a> (<a href="/tooted/veeautomaadid/grundfos-scala1">SCALA1</a>, <a href="/tooted/veeautomaadid/grundfos-scala2">SCALA2</a>, <a href="/tooted/veeautomaadid/grundfos-jp">JP</a>), <a href="/tooted/kuttepumbad">kütte- ja tsirkulatsioonipumbad</a> (<a href="/alpha-go">ALPHA GO</a>, <a href="/tooted/kuttepumbad/grundfos-magna3">MAGNA3</a>), <a href="/tooted/drenaazipumbad">drenaaži- ja tühjenduspumbad</a> (<a href="/unilift">Unilift</a>), <a href="/tooted/puurkaevupumbad">puurkaevupumbad</a> (<a href="/tooted/puurkaevupumbad/grundfos-sq">SQ</a>, <a href="/tooted/puurkaevupumbad/sqe">SQE</a>) ja <a href="/tooted/reoveepumbad">reoveepumbad</a>.',
      question_en: 'Which Grundfos pumps can I find at Pumbapood?',
      answer_en: 'Our range covers all the main Grundfos series: <a href="/en/tooted/veeautomaadid">water boosters and hydrophores</a> (<a href="/en/tooted/veeautomaadid/grundfos-scala1">SCALA1</a>, <a href="/en/tooted/veeautomaadid/grundfos-scala2">SCALA2</a>, <a href="/en/tooted/veeautomaadid/grundfos-jp">JP</a>), <a href="/en/tooted/kuttepumbad">heating and circulator pumps</a> (<a href="/en/alpha-go">ALPHA GO</a>, <a href="/en/tooted/kuttepumbad/grundfos-magna3">MAGNA3</a>), <a href="/en/tooted/drenaazipumbad">drainage and dewatering pumps</a> (<a href="/en/unilift">Unilift</a>), <a href="/en/tooted/puurkaevupumbad">borehole pumps</a> (<a href="/en/tooted/puurkaevupumbad/grundfos-sq">SQ</a>, <a href="/en/tooted/puurkaevupumbad/sqe">SQE</a>) and <a href="/en/tooted/reoveepumbad">wastewater pumps</a>.',
      question_ru: 'Какие насосы Grundfos есть в Pumbapood?',
      answer_ru: 'В нашем ассортименте все основные серии Grundfos: <a href="/ru/tooted/veeautomaadid">насосные станции и гидрофоры</a> (<a href="/ru/tooted/veeautomaadid/grundfos-scala1">SCALA1</a>, <a href="/ru/tooted/veeautomaadid/grundfos-scala2">SCALA2</a>, <a href="/ru/tooted/veeautomaadid/grundfos-jp">JP</a>), <a href="/ru/tooted/kuttepumbad">отопительные и циркуляционные насосы</a> (<a href="/ru/alpha-go">ALPHA GO</a>, <a href="/ru/tooted/kuttepumbad/grundfos-magna3">MAGNA3</a>), <a href="/ru/tooted/drenaazipumbad">дренажные насосы</a> (<a href="/ru/unilift">Unilift</a>), <a href="/ru/tooted/puurkaevupumbad">скважинные насосы</a> (<a href="/ru/tooted/puurkaevupumbad/grundfos-sq">SQ</a>, <a href="/ru/tooted/puurkaevupumbad/sqe">SQE</a>) и <a href="/ru/tooted/reoveepumbad">канализационные насосы</a>.',
      question_lv: 'Kurus Grundfos sūkņus varat atrast Pumbapood?',
      answer_lv: 'Mūsu klāstā ir visas galvenās Grundfos sērijas: <a href="/lv/tooted/veeautomaadid">ūdens automāti un hidrofori</a> (<a href="/lv/tooted/veeautomaadid/grundfos-scala1">SCALA1</a>, <a href="/lv/tooted/veeautomaadid/grundfos-scala2">SCALA2</a>, <a href="/lv/tooted/veeautomaadid/grundfos-jp">JP</a>), <a href="/lv/tooted/kuttepumbad">apkures un cirkulācijas sūkņi</a> (<a href="/lv/alpha-go">ALPHA GO</a>, <a href="/lv/tooted/kuttepumbad/grundfos-magna3">MAGNA3</a>), <a href="/lv/tooted/drenaazipumbad">drenāžas sūkņi</a> (<a href="/lv/unilift">Unilift</a>), <a href="/lv/tooted/puurkaevupumbad">urbumu sūkņi</a> (<a href="/lv/tooted/puurkaevupumbad/grundfos-sq">SQ</a>, <a href="/lv/tooted/puurkaevupumbad/sqe">SQE</a>) un <a href="/lv/tooted/reoveepumbad">notekūdeņu sūkņi</a>.',
      question_lt: 'Kurius Grundfos siurblius galite rasti Pumbapood?',
      answer_lt: 'Mūsų asortimente yra visos pagrindinės Grundfos serijos: <a href="/lt/tooted/veeautomaadid">vandens automatai ir hidroforai</a> (<a href="/lt/tooted/veeautomaadid/grundfos-scala1">SCALA1</a>, <a href="/lt/tooted/veeautomaadid/grundfos-scala2">SCALA2</a>, <a href="/lt/tooted/veeautomaadid/grundfos-jp">JP</a>), <a href="/lt/tooted/kuttepumbad">šildymo ir cirkuliaciniai siurbliai</a> (<a href="/lt/alpha-go">ALPHA GO</a>, <a href="/lt/tooted/kuttepumbad/grundfos-magna3">MAGNA3</a>), <a href="/lt/tooted/drenaazipumbad">drenažo siurbliai</a> (<a href="/lt/unilift">Unilift</a>), <a href="/lt/tooted/puurkaevupumbad">gręžinių siurbliai</a> (<a href="/lt/tooted/puurkaevupumbad/grundfos-sq">SQ</a>, <a href="/lt/tooted/puurkaevupumbad/sqe">SQE</a>) ir <a href="/lt/tooted/reoveepumbad">nuotekų siurbliai</a>.',
    },
    {
      question: 'Kas olete ametlik Grundfos edasimüüja Eestis?',
      answer: 'Jah — Pumbapood.ee (Pump OÜ) on ametlik Grundfos partner. Kõik tooted on originaalsed, kehtib tootjagarantii ja pakume tehnilist tuge.',
      question_en: 'Are you an official Grundfos reseller in Estonia?',
      answer_en: 'Yes — Pumbapood.ee (Pump OÜ) is an official Grundfos partner. All products are original, manufacturer warranty applies and we provide technical support.',
      question_ru: 'Вы официальный дилер Grundfos в Эстонии?',
      answer_ru: 'Да — Pumbapood.ee (Pump OÜ) является официальным партнёром Grundfos. Все товары оригинальные, действует гарантия производителя и техническая поддержка.',
      question_lv: 'Vai esat oficiālais Grundfos izplatītājs Igaunijā?',
      answer_lv: 'Jā — Pumbapood.ee (Pump OÜ) ir oficiālais Grundfos partneris. Visi produkti ir oriģināli, ir ražotāja garantija un tehniskais atbalsts.',
      question_lt: 'Ar esate oficialus Grundfos atstovas Estijoje?',
      answer_lt: 'Taip — Pumbapood.ee (Pump OÜ) yra oficialus Grundfos partneris. Visi produktai yra originalūs, galioja gamintojo garantija ir teikiamas techninis palaikymas.',
    },
    {
      question: 'Kui kiire on tarne?',
      answer: 'Laos olevad Grundfos pumbad jõuavad üle Eesti tavaliselt 1–3 tööpäevaga. Suurematele projektidele ja eritellimustele kokkuleppel.',
      question_en: 'How fast is delivery?',
      answer_en: 'Grundfos pumps in stock reach you across Estonia usually within 1–3 working days. Larger projects and special orders by agreement.',
      question_ru: 'Насколько быстрая доставка?',
      answer_ru: 'Насосы Grundfos в наличии доставляются по Эстонии обычно за 1–3 рабочих дня. Для крупных проектов и спецзаказов — по договорённости.',
      question_lv: 'Cik ātra ir piegāde?',
      answer_lv: 'Noliktavā esošie Grundfos sūkņi visā Igaunijā parasti tiek piegādāti 1–3 darba dienu laikā. Lielākiem projektiem un speciālpasūtījumiem — pēc vienošanās.',
      question_lt: 'Koks greitas pristatymas?',
      answer_lt: 'Sandėlyje esantys Grundfos siurbliai visoje Estijoje pristatomi dažniausiai per 1–3 darbo dienas. Didesniems projektams ir specialiems užsakymams — susitarus.',
    },
    {
      question: 'Kas aitate pumba valikul ja paigaldusel?',
      answer: 'Jah — tasuta nõustamine aitab valida õige pumba vastavalt veeallikale, kraanikohtadele ja rõhuvajadusele. Helista +372 527 4403, kirjuta info@pumbapood.ee või <a href="/leht/kontakt">võta ühendust</a>.',
      question_en: 'Do you help with pump selection and installation?',
      answer_en: 'Yes — free consultation helps you choose the right pump for your water source, taps and pressure needs. Call +372 527 4403, write info@pumbapood.ee or <a href="/en/leht/kontakt">contact us</a>.',
      question_ru: 'Вы помогаете с подбором и установкой насоса?',
      answer_ru: 'Да — бесплатная консультация поможет подобрать насос под источник воды, точки разбора и давление. Звоните +372 527 4403, пишите info@pumbapood.ee или <a href="/ru/leht/kontakt">свяжитесь с нами</a>.',
      question_lv: 'Vai palīdzat ar sūkņa izvēli un uzstādīšanu?',
      answer_lv: 'Jā — bezmaksas konsultācija palīdz izvēlēties pareizo sūkni atbilstoši ūdens avotam, krāniem un spiediena vajadzībām. Zvaniet +372 527 4403, rakstiet info@pumbapood.ee vai <a href="/lv/leht/kontakt">sazinieties ar mums</a>.',
      question_lt: 'Ar padedate parinkti ir sumontuoti siurblį?',
      answer_lt: 'Taip — nemokama konsultacija padeda parinkti tinkamą siurblį pagal vandens šaltinį, čiaupus ir slėgio poreikius. Skambinkite +372 527 4403, rašykite info@pumbapood.ee arba <a href="/lt/leht/kontakt">susisiekite</a>.',
    },
  ],
}

async function main() {
  const { data: page, error } = await supabase.from('pages').select('id, blocks').eq('slug', 'esilehtx').single()
  if (error || !page) { console.error('Lehte ei leitud:', error?.message); process.exit(1) }

  const sections = page.blocks || []
  const faqSection = sections.find(s =>
    (s.columns || []).some(c => (c.blocks || []).some(b =>
      (b.type === 'text' && (b.content || '').includes('Milliseid Grundfos')) ||
      (b.type === 'faq' && ((b.title || '').includes('Grundfos') || (b.items || []).length > 0))
    ))
  )
  if (!faqSection) { console.error('KKK sektsiooni ei leitud'); process.exit(1) }

  const existingFaq = faqSection.columns
    .flatMap(c => c.blocks || [])
    .find(b => b.type === 'faq')
  if (existingFaq) {
    console.log('FAQ plokk on juba olemas — uuendan selle sisu')
    faqBlock.id = existingFaq.id
  }

  for (const col of faqSection.columns || []) col.blocks = [faqBlock]

  if (DRY) { console.log('DRY RUN — asendaksin sektsiooni', faqSection.id, 'plokid ühe faq plokiga'); return }
  const { error: upErr } = await supabase.from('pages').update({ blocks: sections }).eq('id', page.id)
  if (upErr) { console.error('update error:', upErr.message); process.exit(1) }
  console.log('Avalehe KKK uuendatud — sektsioon', faqSection.id, 'kasutab nüüd faq plokki.')
}
main().then(() => process.exit()).catch((e) => { console.error(e); process.exit(1) })
