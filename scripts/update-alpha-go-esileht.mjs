// ALPHA GO küttekampaania — esilehe (esilehtx) blokkide uuendus
// 1) Hero kütte-teemaliseks  2) Promo-bänner ALPHA GO  3) Paigaldus -> Tehniline tugi  4) Eeliste rida
import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } from './env.mjs'

const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
const BANNER_URL = `${SUPABASE_URL}/storage/v1/object/public/pages/bg/alpha-go-kampaania.jpg`

function id() { return Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2) }

// ─── Sisud ────────────────────────────────────────────────────────────────

const HERO_HEADING = {
  text: 'Küttehooaeg algab siit — Grundfos ALPHA GO',
  text_en: 'Heating season starts here — Grundfos ALPHA GO',
  text_ru: 'Отопительный сезон начинается здесь — Grundfos ALPHA GO',
  text_lv: 'Apkures sezona sākas šeit — Grundfos ALPHA GO',
  text_lt: 'Šildymo sezonas prasideda čia — Grundfos ALPHA GO',
}

const HERO_TEXT = {
  content: 'Uued ALPHA1 GO ja ALPHA2 GO asendavad enamiku vanadest tsirkulatsioonipumpadest. Grundfos GO äpp, ekspertnõustamine ja kiire tarne üle Eesti.',
  content_en: 'The new ALPHA1 GO and ALPHA2 GO replace most old circulator pumps. Grundfos GO app, expert advice and fast delivery across Estonia.',
  content_ru: 'Новые ALPHA1 GO и ALPHA2 GO заменяют большинство старых циркуляционных насосов. Приложение Grundfos GO, консультации экспертов и быстрая доставка по всей Эстонии.',
  content_lv: 'Jaunie ALPHA1 GO un ALPHA2 GO aizstāj lielāko daļu veco cirkulācijas sūkņu. Grundfos GO lietotne, ekspertu konsultācijas un ātra piegāde visā Igaunijā.',
  content_lt: 'Naujieji ALPHA1 GO ir ALPHA2 GO pakeičia daugumą senų cirkuliacinių siurblių. Grundfos GO programėlė, ekspertų konsultacijos ir greitas pristatymas visoje Estijoje.',
}

const PROMO_TEXT = {
  content: '<h2>Uus Grundfos<br>ALPHA GO seeria</h2><br><p>Kaks pumpa saja asemel — ALPHA1 GO ja ALPHA2 GO asendavad enamiku eraldiseisvatest ja integreeritud tsirkulatsioonipumpadest. Grundfos GO äpp juhendab asenduse ja seadistuse samm-sammult.</p><ul><li><p><strong>ALPHA2 GO</strong> — asendab ALPHA2, ALPHA3 ja soojuspumpade pumbad (UPM3/UPM4)</p></li><li><p><strong>ALPHA1 GO</strong> — asendab UPS, vana ALPHA1 ja ALPHA1 L</p></li><li><p><strong>Uus ALPHA1</strong> — soodsaim valik ilma äpi toeta</p></li></ul>',
  content_en: '<h2>New Grundfos<br>ALPHA GO range</h2><br><p>Two pumps instead of a hundred — ALPHA1 GO and ALPHA2 GO replace most stand-alone and integrated circulator pumps. The Grundfos GO app guides replacement and setup step by step.</p><ul><li><p><strong>ALPHA2 GO</strong> — replaces ALPHA2, ALPHA3 and heat pump circulators (UPM3/UPM4)</p></li><li><p><strong>ALPHA1 GO</strong> — replaces UPS, old ALPHA1 and ALPHA1 L</p></li><li><p><strong>New ALPHA1</strong> — the most affordable choice without app support</p></li></ul>',
  content_ru: '<h2>Новая серия Grundfos<br>ALPHA GO</h2><br><p>Два насоса вместо сотни — ALPHA1 GO и ALPHA2 GO заменяют большинство отдельно стоящих и встроенных циркуляционных насосов. Приложение Grundfos GO пошагово ведёт замену и настройку.</p><ul><li><p><strong>ALPHA2 GO</strong> — заменяет ALPHA2, ALPHA3 и насосы тепловых насосов (UPM3/UPM4)</p></li><li><p><strong>ALPHA1 GO</strong> — заменяет UPS, старые ALPHA1 и ALPHA1 L</p></li><li><p><strong>Новый ALPHA1</strong> — самый доступный вариант без поддержки приложения</p></li></ul>',
  content_lv: '<h2>Jaunā Grundfos<br>ALPHA GO sērija</h2><br><p>Divi sūkņi simta vietā — ALPHA1 GO un ALPHA2 GO aizstāj lielāko daļu atsevišķi stāvošo un integrēto cirkulācijas sūkņu. Grundfos GO lietotne soli pa solim vada nomaiņu un iestatīšanu.</p><ul><li><p><strong>ALPHA2 GO</strong> — aizstāj ALPHA2, ALPHA3 un siltumsūkņu sūkņus (UPM3/UPM4)</p></li><li><p><strong>ALPHA1 GO</strong> — aizstāj UPS, veco ALPHA1 un ALPHA1 L</p></li><li><p><strong>Jaunais ALPHA1</strong> — izdevīgākā izvēle bez lietotnes atbalsta</p></li></ul>',
  content_lt: '<h2>Nauja Grundfos<br>ALPHA GO serija</h2><br><p>Du siurbliai vietoj šimto — ALPHA1 GO ir ALPHA2 GO pakeičia daugumą atskirai stovinčių ir integruotų cirkuliacinių siurblių. Grundfos GO programėlė žingsnis po žingsnio veda per keitimą ir nustatymą.</p><ul><li><p><strong>ALPHA2 GO</strong> — pakeičia ALPHA2, ALPHA3 ir šilumos siurblių siurblius (UPM3/UPM4)</p></li><li><p><strong>ALPHA1 GO</strong> — pakeičia UPS, seną ALPHA1 ir ALPHA1 L</p></li><li><p><strong>Naujas ALPHA1</strong> — pigiausias pasirinkimas be programėlės palaikymo</p></li></ul>',
}

const PROMO_BTN1 = {
  text: 'Vaata ALPHA GO tooteid',
  text_en: 'View ALPHA GO products',
  text_ru: 'Смотреть товары ALPHA GO',
  text_lv: 'Skatīt ALPHA GO produktus',
  text_lt: 'Žiūrėti ALPHA GO gaminius',
}

const PROMO_BTN2 = {
  text: 'Grundfosi kampaanialeht ↗',
  text_en: 'Grundfos campaign page ↗',
  text_ru: 'Страница кампании Grundfos ↗',
  text_lv: 'Grundfos kampaņas lapa ↗',
  text_lt: 'Grundfos kampanijos puslapis ↗',
}

const SUPPORT_HEADING = {
  text: 'Tehniline tugi ja konsultatsioon',
  text_en: 'Technical support and consultation',
  text_ru: 'Техническая поддержка и консультация',
  text_lv: 'Tehniskais atbalsts un konsultācijas',
  text_lt: 'Techninė pagalba ir konsultacijos',
}

const SUPPORT_TEXT = {
  content: 'Meie spetsialistid aitavad valida õige pumba, jagavad tehnilist nõu ja teevad hinnapakkumisi.<br><br><ul><li><strong>Küte:</strong> Jüri Masing · <a href="tel:+37253984499">+372 53 98 4499</a> · <a href="mailto:juri@ipumps.ee">juri@ipumps.ee</a></li><li><strong>Küte ja veevarustus:</strong> Rivo Randmäe · <a href="tel:+3725102376">+372 510 2376</a> · <a href="mailto:rivo@ipumps.ee">rivo@ipumps.ee</a></li><li><strong>E-poe tellimused ja üldinfo:</strong> <a href="tel:+3725274403">+372 527 4403</a> · <a href="mailto:info@pumbapood.ee">info@pumbapood.ee</a><br>(hinnad, laoseisud ja tellimiste vastuvõtt)</li></ul>',
  content_en: 'Our specialists help you choose the right pump, provide technical advice and prepare quotes.<br><br><ul><li><strong>Heating:</strong> Jüri Masing · <a href="tel:+37253984499">+372 53 98 4499</a> · <a href="mailto:juri@ipumps.ee">juri@ipumps.ee</a></li><li><strong>Heating and water supply:</strong> Rivo Randmäe · <a href="tel:+3725102376">+372 510 2376</a> · <a href="mailto:rivo@ipumps.ee">rivo@ipumps.ee</a></li><li><strong>E-shop orders and general info:</strong> <a href="tel:+3725274403">+372 527 4403</a> · <a href="mailto:info@pumbapood.ee">info@pumbapood.ee</a><br>(prices, stock and order intake)</li></ul>',
  content_ru: 'Наши специалисты помогут выбрать подходящий насос, дадут техническую консультацию и подготовят ценовое предложение.<br><br><ul><li><strong>Отопление:</strong> Jüri Masing · <a href="tel:+37253984499">+372 53 98 4499</a> · <a href="mailto:juri@ipumps.ee">juri@ipumps.ee</a></li><li><strong>Отопление и водоснабжение:</strong> Rivo Randmäe · <a href="tel:+3725102376">+372 510 2376</a> · <a href="mailto:rivo@ipumps.ee">rivo@ipumps.ee</a></li><li><strong>Заказы и общая информация:</strong> <a href="tel:+3725274403">+372 527 4403</a> · <a href="mailto:info@pumbapood.ee">info@pumbapood.ee</a><br>(цены, склад и приём заказов)</li></ul>',
  content_lv: 'Mūsu speciālisti palīdz izvēlēties pareizo sūkni, sniedz tehniskas konsultācijas un sagatavo cenu piedāvājumus.<br><br><ul><li><strong>Apkure:</strong> Jüri Masing · <a href="tel:+37253984499">+372 53 98 4499</a> · <a href="mailto:juri@ipumps.ee">juri@ipumps.ee</a></li><li><strong>Apkure un ūdens apgāde:</strong> Rivo Randmäe · <a href="tel:+3725102376">+372 510 2376</a> · <a href="mailto:rivo@ipumps.ee">rivo@ipumps.ee</a></li><li><strong>E-veikala pasūtījumi un vispārīga informācija:</strong> <a href="tel:+3725274403">+372 527 4403</a> · <a href="mailto:info@pumbapood.ee">info@pumbapood.ee</a><br>(cenas, noliktava un pasūtījumu pieņemšana)</li></ul>',
  content_lt: 'Mūsų specialistai padeda išsirinkti tinkamą siurblį, teikia technines konsultacijas ir rengia kainų pasiūlymus.<br><br><ul><li><strong>Šildymas:</strong> Jüri Masing · <a href="tel:+37253984499">+372 53 98 4499</a> · <a href="mailto:juri@ipumps.ee">juri@ipumps.ee</a></li><li><strong>Šildymas ir vandens tiekimas:</strong> Rivo Randmäe · <a href="tel:+3725102376">+372 510 2376</a> · <a href="mailto:rivo@ipumps.ee">rivo@ipumps.ee</a></li><li><strong>Užsakymai el. parduotuvėje ir bendroji informacija:</strong> <a href="tel:+3725274403">+372 527 4403</a> · <a href="mailto:info@pumbapood.ee">info@pumbapood.ee</a><br>(kainos, sandėlys ir užsakymų priėmimas)</li></ul>',
}

const SUPPORT_BTN = {
  text: 'Võta ühendust +372 527 4403',
  text_en: 'Contact us +372 527 4403',
  text_ru: 'Связаться с нами +372 527 4403',
  text_lv: 'Sazināties ar mums +372 527 4403',
  text_lt: 'Susisiekite su mumis +372 527 4403',
}

const BENEFIT2_HEADING = {
  text: '🔧 Tehniline tugi',
  text_en: '🔧 Technical support',
  text_ru: '🔧 Техподдержка',
  text_lv: '🔧 Tehniskais atbalsts',
  text_lt: '🔧 Techninė pagalba',
}

const BENEFIT2_TEXT = {
  content: 'Tasuta nõustamine',
  content_en: 'Free consultation',
  content_ru: 'Бесплатная консультация',
  content_lv: 'Bezmaksas konsultācija',
  content_lt: 'Nemokama konsultacija',
}

// ─── Uuendused ────────────────────────────────────────────────────────────

const { data: page } = await admin.from('pages').select('id,blocks').eq('slug', 'esilehtx').single()
if (!page) { console.error('esilehtx not found'); process.exit(1) }
const blocks = page.blocks

// --- 1) Hero (sektsioon 0) ---
{
  const col = blocks[0].columns[0]
  for (const b of col.blocks) {
    if (b.type === 'heading') Object.assign(b, HERO_HEADING)
    if (b.type === 'text') Object.assign(b, HERO_TEXT)
  }
  const before = col.blocks.length
  col.blocks = col.blocks.filter(b => !(b.type === 'image' && !b.url))
  console.log(`hero: heading+text uuendatud, eemaldatud tühje pildiplokke: ${before - col.blocks.length}`)
}

// --- 2) Promo-bänner (sektsioon 2) ---
{
  const sec = blocks[2]
  sec.settings.background_image_url = BANNER_URL
  sec.settings.background_overlay = 0
  const col = sec.columns[0]
  const textBlock = col.blocks.find(b => b.type === 'text')
  if (textBlock) Object.assign(textBlock, PROMO_TEXT)

  // Nupud (idempotentne — uuenda kui olemas, lisa kui pole)
  let btn1 = col.blocks.find(b => b.type === 'button' && b.url === '/tooted/kuttepumbad')
  if (!btn1) {
    btn1 = { id: id(), type: 'button', url: '/tooted/kuttepumbad', target: '_self', style: 'filled', color: '#01a0dc', alignment: 'left' }
    col.blocks.push({ id: id(), type: 'spacer', height: 20 }, btn1)
  }
  Object.assign(btn1, PROMO_BTN1)

  let btn2 = col.blocks.find(b => b.type === 'button' && String(b.url).includes('grundfos.com'))
  if (!btn2) {
    btn2 = { id: id(), type: 'button', url: 'https://www.grundfos.com/ee/campaign/the-new-alpha-go-range', target: '_blank', style: 'outline', color: '#ffffff', alignment: 'left' }
    const i = col.blocks.indexOf(btn1)
    col.blocks.splice(i + 1, 0, { id: id(), type: 'spacer', height: 12 }, btn2)
  }
  Object.assign(btn2, PROMO_BTN2)
  console.log('promo: bänner + tekst + nupud uuendatud')
}

// --- 3) Paigaldus -> Tehniline tugi (sektsioon 7) ---
{
  const col = blocks[7].columns[0]
  for (const b of col.blocks) {
    if (b.type === 'heading') Object.assign(b, SUPPORT_HEADING)
    if (b.type === 'text') Object.assign(b, SUPPORT_TEXT)
    if (b.type === 'button') Object.assign(b, SUPPORT_BTN)
  }
  console.log('tehniline tugi: sektsioon 7 uuendatud')
}

// --- 4) Eeliste rida (sektsioon 9, 2. veerg) ---
{
  const col = blocks[9].columns[1]
  for (const b of col.blocks) {
    if (b.type === 'heading') Object.assign(b, BENEFIT2_HEADING)
    if (b.type === 'text') Object.assign(b, BENEFIT2_TEXT)
  }
  console.log('eelised: "Paigaldus" -> "Tehniline tugi"')
}

// --- Salvesta ---
const { error } = await admin.from('pages')
  .update({ blocks, updated_at: new Date().toISOString() })
  .eq('id', page.id)

if (error) { console.error('VIGA:', error.message); process.exit(1) }
console.log('\nESILEHT UUENDATUD ✔')
