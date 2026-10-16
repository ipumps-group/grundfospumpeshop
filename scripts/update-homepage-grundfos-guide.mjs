// Avalehe Grundfosi-osa laiendus (SEO Töö 1, raport 17: „Grundfos" pos 11,3 → ≤10):
//   1) uus juhendi-sektsioon „Milline Grundfos pump valida?" peale „Grundfos pumpade valik" sektsiooni
//      (4 teemat: küte/tsirkulatsioon, veeautomaat, puurkaev, drenaaž — hinnavahemikud live-DB-st, siselingid)
//   2) KKK-plokk 4 → 6 küsimust (küttesüsteemi pump + veeautomaadi valik — sihib ka „parim veeautomaat" päringut)
//   3) meta_description täpsustatud (laoseis + tarne-konkreetika → CTR)
// Kõik 5 keeles. Idempotentne (markerite järgi uuendab, ei dubleeri).
// Kasutus: node scripts/update-homepage-grundfos-guide.mjs [--dry-run]
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } from './env.mjs'

const DRY = process.argv.includes('--dry-run')
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
const rid = () => Math.random().toString(36).slice(2, 10)

const MARKER = 'Milline Grundfos pump valida'
const META_DESCRIPTION = 'Grundfos pumbad ja lahendused ühest kohast: veeautomaadid, kütte- ja tsirkulatsioonipumbad, drenaaži- ja kaevupumbad. Üle 500 toote laos, tarne 1–3 tööpäeva ja tasuta nõustamine.'

/* ---------- 1) Juhendi-sektsioon (hinnad: live-DB 16.10.2026) ---------- */
const GUIDE = {
  heading: {
    et: 'Milline Grundfos pump valida?',
    en: 'Which Grundfos pump to choose?',
    ru: 'Какой насос Grundfos выбрать?',
    lv: 'Kuru Grundfos sūkni izvēlēties?',
    lt: 'Kurį Grundfos siurblį rinktis?',
  },
  content: {
    et: `<p><strong>Küte ja tsirkulatsioon.</strong> Keskkütte- või põrandaküttesüsteemi jaoks vali tsirkulatsioonipump — uus <a href="/alpha-go">ALPHA GO seeria</a> (170–457 €) asendab enamiku vanu UPS- ja ALPHA-pumpasid ning suurematesse süsteemidesse sobib <a href="/tooted/kuttepumbad/grundfos-magna3">MAGNA3</a> (534–2456 €). Vaata kogu <a href="/tooted/kuttepumbad">küttepumpade valikut</a>.</p>
<p><strong>Veeautomaat ja hüdrofoor.</strong> Püsiva veerõhu jaoks on eramusse parim valik <a href="/tooted/veeautomaadid/grundfos-scala2">SCALA2</a> (u 657 €); soodsamad alternatiivid on <a href="/tooted/veeautomaadid/grundfos-scala1">SCALA1</a> (452–571 €) ja klassikaline <a href="/tooted/veeautomaadid/grundfos-jp">JP hüdrofoor</a> (235–553 €). Vaata kogu <a href="/tooted/veeautomaadid">veeautomaatide valikut</a>.</p>
<p><strong>Puurkaev.</strong> 3-tollise kaevu jaoks on õige valik <a href="/tooted/puurkaevupumbad/grundfos-sq">Grundfos SQ</a> (741–1334 €) või juhtmeta <a href="/tooted/puurkaevupumbad/sqe">SQE</a> (810–1447 €). Vaata kogu <a href="/tooted/puurkaevupumbad">puurkaevupumpade valikut</a>.</p>
<p><strong>Drenaaž ja tühjendus.</strong> Üleujutuse või drenaaživee korral aitavad <a href="/tooted/drenaazipumbad/unilift-cc">Unilift CC</a> (173–351 €) ja <a href="/tooted/drenaazipumbad/unilift-kp">Unilift KP</a> (279–531 €) ning reovee korral <a href="/tooted/drenaazipumbad/unilift-ap">Unilift AP</a> (551–937 €). Vaata kogu <a href="/tooted/drenaazipumbad">drenaažipumpade valikut</a>.</p>
<p>Kui kahtled, kas osta uus või kasutatud pump, loe meie juhendit: <a href="/leht/kasutatud-vs-uus-grundfos-pump">kasutatud vs uus Grundfos pump</a>.</p>`,
    en: `<p><strong>Heating and circulation.</strong> For a central or underfloor heating system choose a circulator pump — the new <a href="/alpha-go">ALPHA GO series</a> (€170–457) replaces most old UPS and ALPHA pumps, and for larger systems there is <a href="/tooted/kuttepumbad/grundfos-magna3">MAGNA3</a> (€534–2456). See all <a href="/tooted/kuttepumbad">heating pumps</a>.</p>
<p><strong>Water boosters.</strong> For constant water pressure in a detached house the best choice is <a href="/tooted/veeautomaadid/grundfos-scala2">SCALA2</a> (≈ €657); more affordable alternatives are <a href="/tooted/veeautomaadid/grundfos-scala1">SCALA1</a> (€452–571) and the classic <a href="/tooted/veeautomaadid/grundfos-jp">JP hydrophore</a> (€235–553). See all <a href="/tooted/veeautomaadid">water boosters</a>.</p>
<p><strong>Boreholes.</strong> For a 3-inch borehole the right choice is <a href="/tooted/puurkaevupumbad/grundfos-sq">Grundfos SQ</a> (€741–1334) or the cable-free <a href="/tooted/puurkaevupumbad/sqe">SQE</a> (€810–1447). See all <a href="/tooted/puurkaevupumbad">borehole pumps</a>.</p>
<p><strong>Drainage and dewatering.</strong> For flooding or drainage water, <a href="/tooted/drenaazipumbad/unilift-cc">Unilift CC</a> (€173–351) and <a href="/tooted/drenaazipumbad/unilift-kp">Unilift KP</a> (€279–531) help, and for wastewater <a href="/tooted/drenaazipumbad/unilift-ap">Unilift AP</a> (€551–937). See all <a href="/tooted/drenaazipumbad">drainage pumps</a>.</p>
<p>Unsure whether to buy new or used? Read our guide: <a href="/leht/kasutatud-vs-uus-grundfos-pump">used vs new Grundfos pump</a>.</p>`,
    ru: `<p><strong>Отопление и циркуляция.</strong> Для системы центрального или тёплого пола выбирайте циркуляционный насос — новая серия <a href="/alpha-go">ALPHA GO</a> (170–457 €) заменяет большинство старых насосов UPS и ALPHA, а для больших систем подходит <a href="/tooted/kuttepumbad/grundfos-magna3">MAGNA3</a> (534–2456 €). Смотрите все <a href="/tooted/kuttepumbad">насосы для отопления</a>.</p>
<p><strong>Водяные автоматы и гидрофоры.</strong> Для постоянного давления воды в частном доме лучший выбор — <a href="/tooted/veeautomaadid/grundfos-scala2">SCALA2</a> (ок. 657 €); более доступные альтернативы — <a href="/tooted/veeautomaadid/grundfos-scala1">SCALA1</a> (452–571 €) и классический <a href="/tooted/veeautomaadid/grundfos-jp">гидрофор JP</a> (235–553 €). Смотрите все <a href="/tooted/veeautomaadid">водяные автоматы</a>.</p>
<p><strong>Скважина.</strong> Для 3-дюймовой скважины правильный выбор — <a href="/tooted/puurkaevupumbad/grundfos-sq">Grundfos SQ</a> (741–1334 €) или бескабельная <a href="/tooted/puurkaevupumbad/sqe">SQE</a> (810–1447 €). Смотрите все <a href="/tooted/puurkaevupumbad">скважинные насосы</a>.</p>
<p><strong>Дренаж и откачка.</strong> При подтоплении или дренажной воде помогают <a href="/tooted/drenaazipumbad/unilift-cc">Unilift CC</a> (173–351 €) и <a href="/tooted/drenaazipumbad/unilift-kp">Unilift KP</a> (279–531 €), а для сточных вод — <a href="/tooted/drenaazipumbad/unilift-ap">Unilift AP</a> (551–937 €). Смотрите все <a href="/tooted/drenaazipumbad">дренажные насосы</a>.</p>
<p>Сомневаетесь, новый или б/у насос? Читайте наш гид: <a href="/leht/kasutatud-vs-uus-grundfos-pump">б/у vs новый насос Grundfos</a>.</p>`,
    lv: `<p><strong>Apkure un cirkulācija.</strong> Centrālapkurei vai grīdas apkurei izvēlieties cirkulācijas sūkni — jaunā <a href="/alpha-go">ALPHA GO sērija</a> (170–457 €) aizstāj lielāko daļu veco UPS un ALPHA sūkņu, un lielākām sistēmām der <a href="/tooted/kuttepumbad/grundfos-magna3">MAGNA3</a> (534–2456 €). Skatiet visus <a href="/tooted/kuttepumbad">apkures sūkņus</a>.</p>
<p><strong>Ūdens automāti un hidrofori.</strong> Pastāvīgam ūdens spiedienam privātmājā labākā izvēle ir <a href="/tooted/veeautomaadid/grundfos-scala2">SCALA2</a> (ap 657 €); lētākas alternatīvas ir <a href="/tooted/veeautomaadid/grundfos-scala1">SCALA1</a> (452–571 €) un klasiskais <a href="/tooted/veeautomaadid/grundfos-jp">JP hidrofors</a> (235–553 €). Skatiet visus <a href="/tooted/veeautomaadid">ūdens automātus</a>.</p>
<p><strong>Urbumi.</strong> 3 collu urbumam pareizā izvēle ir <a href="/tooted/puurkaevupumbad/grundfos-sq">Grundfos SQ</a> (741–1334 €) vai bezvadu <a href="/tooted/puurkaevupumbad/sqe">SQE</a> (810–1447 €). Skatiet visus <a href="/tooted/puurkaevupumbad">urbumu sūkņus</a>.</p>
<p><strong>Drenāža un izsūknēšana.</strong> Plūdu vai drenāžas ūdens gadījumā palīdz <a href="/tooted/drenaazipumbad/unilift-cc">Unilift CC</a> (173–351 €) un <a href="/tooted/drenaazipumbad/unilift-kp">Unilift KP</a> (279–531 €), bet notekūdeņiem — <a href="/tooted/drenaazipumbad/unilift-ap">Unilift AP</a> (551–937 €). Skatiet visus <a href="/tooted/drenaazipumbad">drenāžas sūkņus</a>.</p>
<p>Nezināt, jaunu vai lietotu sūkni? Lasiet mūsu ceļvedi: <a href="/leht/kasutatud-vs-uus-grundfos-pump">lietots vs jauns Grundfos sūknis</a>.</p>`,
    lt: `<p><strong>Šildymas ir cirkuliacija.</strong> Centriniam ar grindiniam šildymui rinkitės cirkuliacinį siurblį — nauja <a href="/alpha-go">ALPHA GO serija</a> (170–457 €) pakeičia daugumą senų UPS ir ALPHA siurblių, o didesnėms sistemoms tinka <a href="/tooted/kuttepumbad/grundfos-magna3">MAGNA3</a> (534–2456 €). Žr. visus <a href="/tooted/kuttepumbad">šildymo siurblius</a>.</p>
<p><strong>Vandens automatai ir hidroforai.</strong> Pastoviam vandens slėgiui nuosavame name geriausias pasirinkimas — <a href="/tooted/veeautomaadid/grundfos-scala2">SCALA2</a> (apie 657 €); pigesnės alternatyvos — <a href="/tooted/veeautomaadid/grundfos-scala1">SCALA1</a> (452–571 €) ir klasikinis <a href="/tooted/veeautomaadid/grundfos-jp">JP hidroforas</a> (235–553 €). Žr. visus <a href="/tooted/veeautomaadid">vandens automatus</a>.</p>
<p><strong>Gręžiniai.</strong> 3 colių gręžiniui tinkamas pasirinkimas — <a href="/tooted/puurkaevupumbad/grundfos-sq">Grundfos SQ</a> (741–1334 €) arba belaidis <a href="/tooted/puurkaevupumbad/sqe">SQE</a> (810–1447 €). Žr. visus <a href="/tooted/puurkaevupumbad">gręžinių siurblius</a>.</p>
<p><strong>Drenažas ir išsiurbimas.</strong> Potvynio ar drenažinio vandens atveju padeda <a href="/tooted/drenaazipumbad/unilift-cc">Unilift CC</a> (173–351 €) ir <a href="/tooted/drenaazipumbad/unilift-kp">Unilift KP</a> (279–531 €), o nuotekoms — <a href="/tooted/drenaazipumbad/unilift-ap">Unilift AP</a> (551–937 €). Žr. visus <a href="/tooted/drenaazipumbad">drenažo siurblius</a>.</p>
<p>Nežinote, naują ar naudotą siurblį? Skaitykite mūsų gidą: <a href="/leht/kasutatud-vs-uus-grundfos-pump">naudotas vs naujas Grundfos siurblys</a>.</p>`,
  },
}

/* ---------- 2) KKK täiendus (2 uut küsimust) ---------- */
const FAQ_ADD = [
  {
    question: 'Milline Grundfos pump sobib küttesüsteemi?',
    answer: 'Keskkütte- ja põrandaküttesüsteemi jaoks vali tsirkulatsioonipump. Uus <a href="/alpha-go">ALPHA GO seeria</a> asendab enamiku vanu UPS- ja ALPHA-pumpasid: <a href="/tooted/kuttepumbad/alpha1-go">ALPHA1 GO</a> (170–249 €) põhitöödeks ja <a href="/tooted/kuttepumbad/alpha2-go">ALPHA2 GO</a> (264–457 €) nõudlikumatele süsteemidele; suurtesse süsteemidesse sobib <a href="/tooted/kuttepumbad/grundfos-magna3">MAGNA3</a>. Kogu valik: <a href="/tooted/kuttepumbad">küttepumbad</a>.',
    question_en: 'Which Grundfos pump suits a heating system?',
    answer_en: 'For central or underfloor heating choose a circulator pump. The new <a href="/alpha-go">ALPHA GO series</a> replaces most old UPS and ALPHA pumps: <a href="/tooted/kuttepumbad/alpha1-go">ALPHA1 GO</a> (€170–249) for standard jobs and <a href="/tooted/kuttepumbad/alpha2-go">ALPHA2 GO</a> (€264–457) for demanding systems; for large systems <a href="/tooted/kuttepumbad/grundfos-magna3">MAGNA3</a> fits. Full range: <a href="/tooted/kuttepumbad">heating pumps</a>.',
    question_ru: 'Какой насос Grundfos подходит для системы отопления?',
    answer_ru: 'Для центрального или тёплого пола выбирайте циркуляционный насос. Новая серия <a href="/alpha-go">ALPHA GO</a> заменяет большинство старых UPS и ALPHA: <a href="/tooted/kuttepumbad/alpha1-go">ALPHA1 GO</a> (170–249 €) для стандартных работ и <a href="/tooted/kuttepumbad/alpha2-go">ALPHA2 GO</a> (264–457 €) для требовательных систем; для больших систем подходит <a href="/tooted/kuttepumbad/grundfos-magna3">MAGNA3</a>. Весь выбор: <a href="/tooted/kuttepumbad">насосы для отопления</a>.',
    question_lv: 'Kurš Grundfos sūknis der apkures sistēmai?',
    answer_lv: 'Centrālapkurei vai grīdas apkurei izvēlieties cirkulācijas sūkni. Jaunā <a href="/alpha-go">ALPHA GO sērija</a> aizstāj lielāko daļu veco UPS un ALPHA sūkņu: <a href="/tooted/kuttepumbad/alpha1-go">ALPHA1 GO</a> (170–249 €) parastajiem darbiem un <a href="/tooted/kuttepumbad/alpha2-go">ALPHA2 GO</a> (264–457 €) prasīgākām sistēmām; lielām sistēmām der <a href="/tooted/kuttepumbad/grundfos-magna3">MAGNA3</a>. Viss klāsts: <a href="/tooted/kuttepumbad">apkures sūkņi</a>.',
    question_lt: 'Kuris Grundfos siurblys tinka šildymo sistemai?',
    answer_lt: 'Centriniam ar grindiniam šildymui rinkitės cirkuliacinį siurblį. Nauja <a href="/alpha-go">ALPHA GO serija</a> pakeičia daugumą senų UPS ir ALPHA siurblių: <a href="/tooted/kuttepumbad/alpha1-go">ALPHA1 GO</a> (170–249 €) įprastiems darbams ir <a href="/tooted/kuttepumbad/alpha2-go">ALPHA2 GO</a> (264–457 €) reiklesnėms sistemoms; didelėms sistemoms tinka <a href="/tooted/kuttepumbad/grundfos-magna3">MAGNA3</a>. Visa įvairovė: <a href="/tooted/kuttepumbad">šildymo siurbliai</a>.',
  },
  {
    question: 'Kuidas valida õige veeautomaat?',
    answer: 'Valik sõltub veeallikast ja kraanikohtade arvust: eramusse 3–6 kraanikohaga on parim <a href="/tooted/veeautomaadid/grundfos-scala2">SCALA2</a> (püsiv rõhk, väga vaikne), soodsam on <a href="/tooted/veeautomaadid/grundfos-scala1">SCALA1</a> ning suvilasse ja aeda piisab <a href="/tooted/veeautomaadid/grundfos-jp">JP hüdrofoorist</a>. Kui vesi tuleb salvkaevust, on õige valik uputatav <a href="/tooted/salvkaevupumbad/grundfos-sba">SBA</a>. Kogu valik: <a href="/tooted/veeautomaadid">veeautomaadid</a>.',
    question_en: 'How to choose the right water booster?',
    answer_en: 'The choice depends on the water source and the number of taps: for a detached house with 3–6 taps <a href="/tooted/veeautomaadid/grundfos-scala2">SCALA2</a> is best (constant pressure, very quiet), <a href="/tooted/veeautomaadid/grundfos-scala1">SCALA1</a> is the affordable option, and for a cottage or garden the <a href="/tooted/veeautomaadid/grundfos-jp">JP hydrophore</a> is enough. If water comes from a shallow well, the submersible <a href="/tooted/salvkaevupumbad/grundfos-sba">SBA</a> is right. Full range: <a href="/tooted/veeautomaadid">water boosters</a>.',
    question_ru: 'Как выбрать правильный водяной автомат?',
    answer_ru: 'Выбор зависит от источника воды и количества точек разбора: для частного дома с 3–6 кранами лучший выбор — <a href="/tooted/veeautomaadid/grundfos-scala2">SCALA2</a> (постоянное давление, очень тихий), доступнее — <a href="/tooted/veeautomaadid/grundfos-scala1">SCALA1</a>, а для дачи и сада достаточно <a href="/tooted/veeautomaadid/grundfos-jp">гидрофора JP</a>. Если вода из неглубокого колодца, правильный выбор — погружной <a href="/tooted/salvkaevupumbad/grundfos-sba">SBA</a>. Весь выбор: <a href="/tooted/veeautomaadid">водяные автоматы</a>.',
    question_lv: 'Kā izvēlēties pareizo ūdens automātu?',
    answer_lv: 'Izvēle ir atkarīga no ūdens avota un krānu skaita: privātmājai ar 3–6 krāniem labākais ir <a href="/tooted/veeautomaadid/grundfos-scala2">SCALA2</a> (pastāvīgs spiediens, ļoti kluss), lētākais variants ir <a href="/tooted/veeautomaadid/grundfos-scala1">SCALA1</a>, bet vasarnīcai un dārzam pietiek ar <a href="/tooted/veeautomaadid/grundfos-jp">JP hidroforu</a>. Ja ūdens nāk no seklas akas, pareizā izvēle ir iegremdējamais <a href="/tooted/salvkaevupumbad/grundfos-sba">SBA</a>. Viss klāsts: <a href="/tooted/veeautomaadid">ūdens automāti</a>.',
    question_lt: 'Kaip išsirinkti tinkamą vandens automatą?',
    answer_lt: 'Pasirinkimas priklauso nuo vandens šaltinio ir čiaupų skaičiaus: nuosavam namui su 3–6 čiaupais geriausias — <a href="/tooted/veeautomaadid/grundfos-scala2">SCALA2</a> (pastovus slėgis, labai tylus), pigesnis — <a href="/tooted/veeautomaadid/grundfos-scala1">SCALA1</a>, o vasarnamiui ir sodui užtenka <a href="/tooted/veeautomaadid/grundfos-jp">JP hidroforo</a>. Jei vanduo iš seklaus šulinio, tinkamas panardinamas <a href="/tooted/salvkaevupumbad/grundfos-sba">SBA</a>. Visa įvairovė: <a href="/tooted/veeautomaadid">vandens automatai</a>.',
  },
]

async function main() {
  const { data: page, error } = await supabase.from('pages').select('id, blocks, meta_description').eq('slug', 'esilehtx').single()
  if (error || !page) { console.error('Lehte ei leitud:', error?.message); process.exit(1) }
  const sections = page.blocks || []
  const changes = []

  /* --- 1) Juhendi-sektsioon --- */
  const guideSection = {
    id: 'gv-guide-' + rid(),
    type: 'section',
    order: 0,
    columns: [{
      id: rid(), width: 100,
      blocks: [
        { id: rid(), type: 'heading', color: '#003366', level: 'h2', alignment: 'left',
          text: GUIDE.heading.et, text_en: GUIDE.heading.en, text_ru: GUIDE.heading.ru, text_lv: GUIDE.heading.lv, text_lt: GUIDE.heading.lt },
        { id: rid(), type: 'spacer', height: 12 },
        { id: rid(), type: 'text', color: '#374151', alignment: 'left',
          content: GUIDE.content.et, content_en: GUIDE.content.en, content_ru: GUIDE.content.ru, content_lv: GUIDE.content.lv, content_lt: GUIDE.content.lt },
      ],
    }],
  }
  const valikIdx = sections.findIndex(s =>
    (s.columns || []).some(c => (c.blocks || []).some(b => (b.text || '').includes('Grundfos pumpade valik'))))
  const existingIdx = sections.findIndex(s =>
    (s.columns || []).some(c => (c.blocks || []).some(b => (b.text || '').includes(MARKER) || (b.content || '').includes(MARKER))))
  if (existingIdx >= 0) {
    guideSection.id = sections[existingIdx].id
    guideSection.columns[0].id = sections[existingIdx].columns?.[0]?.id ?? guideSection.columns[0].id
    sections[existingIdx] = guideSection
    changes.push(`juhendi-sektsioon UUENDATUD (id ${guideSection.id})`)
  } else if (valikIdx >= 0) {
    sections.splice(valikIdx + 1, 0, guideSection)
    changes.push(`juhendi-sektsioon LISATUD peale „Grundfos pumpade valik" (pos ${valikIdx + 1})`)
  } else {
    console.error('„Grundfos pumpade valik" sektsiooni ei leitud — juhendit ei lisatud')
  }
  sections.forEach((s, i) => { s.order = i })

  /* --- 2) KKK 4 → 6 --- */
  const faqBlock = sections
    .flatMap(s => (s.columns || []).flatMap(c => c.blocks || []))
    .find(b => b.type === 'faq')
  if (faqBlock) {
    let added = 0
    for (const q of FAQ_ADD) {
      if (!(faqBlock.items || []).some(it => (it.question || '').includes(q.question.slice(0, 25)))) {
        faqBlock.items.push(q); added++
      }
    }
    changes.push(added > 0 ? `KKK: lisatud ${added} küsimust (kokku ${faqBlock.items.length})` : 'KKK: küsimused juba olemas')
  } else {
    console.error('KKK-plokki ei leitud')
  }

  /* --- 3) meta_description --- */
  if (page.meta_description !== META_DESCRIPTION) changes.push('meta_description uuendatud')

  console.log(DRY ? '=== DRY RUN ===' : '=== LIVE ===')
  for (const c of changes) console.log(' •', c)
  if (DRY) {
    console.log('\nJuhendi ET sisu eelvaade:\n' + GUIDE.content.et.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').slice(0, 400) + '…')
    return
  }
  const { error: upErr } = await supabase.from('pages').update({ blocks: sections, meta_description: META_DESCRIPTION }).eq('id', page.id)
  if (upErr) { console.error('update error:', upErr.message); process.exit(1) }
  console.log('Valmis — avaleht uuendatud (ISR ~1 h).')
}
main().then(() => process.exit()).catch((e) => { console.error(e); process.exit(1) })
