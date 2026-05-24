import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'

const raw = readFileSync('.env.local', 'utf-8')
const env = Object.fromEntries(
  raw.split('\n')
    .filter(l => l.includes('='))
    .map(l => { const i = l.indexOf('='); return [l.substring(0, i).trim(), l.substring(i + 1).trim().replace(/^["']|["']$/g, '')] })
)

const admin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

const t = {
  en: {
    // Hero
    'Grundfos pumbad ja veeautomaatika': 'Grundfos pumps and water automatics',
    'Laos üle 500 toote. Kiire tarne, ekspertnõustamine ja paigaldus üle Eesti.': 'Over 500 products in stock. Fast delivery, expert advice and installation across Estonia.',
    'Üle 500 toote laost. Kiire tarne, ekspertnõustamine ja paigaldus üle Eesti.': 'Over 500 products in stock. Fast delivery, expert advice and installation across Estonia.',
    'Vaata tooteid': 'View products',
    // Categories
    'Tegevusalad': 'Categories',
    'Tootekategooriad': 'Product categories',
    'Vali sobiv kategooria või otsi konkreetset toodet.': 'Choose a suitable category or search for a specific product.',
    'Vaata kõiki kategooriaid': 'View all categories',
    'Vaata kõiki tooteid': 'View all products',
    // HTML promo block
    '<h2>Alusta varakult<br>aiatoimetustega</h2><br><p>Varusta end enne hooaega —&nbsp;<br>JP veeautomaadid, aiasprinklerid ja põhjavee lahendused on laos ja koheselt saadavad.</p><ul><li><p>&nbsp; &nbsp;Laotoodetel tarne kuni 5 tööpäeva</p></li><li><p>&nbsp; &nbsp;Tasuta tehniline nõustamine</p></li></ul>': '<h2>Start early<br>with gardening</h2><br><p>Get prepared before the season —&nbsp;<br>JP water automatics, garden sprinklers and groundwater solutions are in stock and available immediately.</p><ul><li><p>&nbsp; &nbsp;In-stock items delivery up to 5 business days</p></li><li><p>&nbsp; &nbsp;Free technical consultation</p></li></ul>',
    // HTML categories block
    '<h2>Tegevusalad</h2>': '<h2>Categories</h2>',
    // HTML installation block
    'Meie kogenud tehnikud paigaldavad pumba korrektselt ning tagavad selle töökindluse ja maksimaalse efektiivsuse. Teenindame kliente üle kogu Eesti!<br><br><ul><li>&nbsp; &nbsp; Tasuta konsultatsioon ja hinnapakkumine</li><li>&nbsp; &nbsp; Garantii paigaldustöödele&nbsp;</li><li>&nbsp; &nbsp; Järelhooldus ja tehniline tugi</li></ul>': 'Our experienced technicians will install the pump correctly and ensure its reliability and maximum efficiency. We serve customers all over Estonia!<br><br><ul><li>&nbsp; &nbsp; Free consultation and quote</li><li>&nbsp; &nbsp; Warranty on installation work&nbsp;</li><li>&nbsp; &nbsp; Aftercare and technical support</li></ul>',
    // Installation
    'Professionaalne paigaldus': 'Professional installation',
    'Telli meilt professionaalne paigaldus': 'Order professional installation from us',
    'Telli meilt\nprofessionaalne paigaldus': 'Order professional\ninstallation from us',
    'Meie sertifitseeritud tehnikud paigaldavad ja seadistavad teie pumbasüsteemi.': 'Our certified technicians will install and configure your pump system.',
    'Meie kogenud tehnikud paigaldavad pumba korrektselt ning tagavad selle töökindluse ja maksimaalse efektiivsuse. Teenindame kliente üle kogu Eesti!': 'Our experienced technicians will install the pump correctly and ensure its reliability and maximum efficiency. We serve customers all over Estonia!',
    '✓ Üle 15 aasta kogemust\n✓ Garantii kõikidele töödele\n✓ Kiire reageerimine\n✓ Üle-eestiline teenindus': '✓ Over 15 years of experience\n✓ Warranty on all work\n✓ Fast response\n✓ Nationwide service',
    'Tasuta konsultatsioon ja hinnapakkumine': 'Free consultation and quote',
    'Tasuta konsultatsioon ja hinnapakkumus': 'Free consultation and quote',
    'Paigaldus 1-3 tööpäeva jooksul': 'Installation within 1-3 business days',
    'Garantii paigaldustöödele 2 aastat': '2-year warranty on installation work',
    'Garantii paigaldustöödele': 'Warranty on installation work',
    'Järelhooldus ja tehniline tugi': 'Aftercare and technical support',
    '+372 503 3978': '+372 503 3978',
    'Telli paigaldus +372 510 2376': 'Order installation +372 510 2376',
    // Location
    'Meie asukoht': 'Our location',
    '📍 Vana-Narva mnt 3, Tallinn': '📍 Vana-Narva mnt 3, Tallinn',
    '📍 Vana-Narva mnt 3, Maardu linn': '📍 Vana-Narva mnt 3, Maardu',
    '🕐 E–R 8:00–17:00': '🕐 Mon–Fri 8:00–17:00',
    '🕐Kokkuleppel': '🕐 By appointment',
    '📞 +372 503 3978': '📞 +372 503 3978',
    '📞 +372 527 4403': '📞 +372 527 4403',
    '✉️ [email]': '✉️ [email]',
    '✉️ info@pumbapood.ee': '✉️ info@pumbapood.ee',
    'Vaata Google Mapsis': 'View on Google Maps',
    // Benefits
    '🚚 Tasuta tarne': '🚚 Free delivery',
    'Tellimustele üle 200€': 'For orders over 200€',
    '🔧 Paigaldus': '🔧 Installation',
    'Kogenud tehnikud': 'Experienced technicians',
    'Sertifitseeritud tehnikud': 'Certified technicians',
    '🛡 Garantii': '🛡 Warranty',
    'Kuni 5 aasta garantii': 'Up to 5-year warranty',
    '2 aastane garantii': '2-year warranty',
    '🕐 Tugi': '🕐 Support',
    'Tööpäeviti 8–17': 'Weekdays 8–17',
    'Tööpäeviti 9:00–16:30': 'Weekdays 9:00–16:30',
  },
  ru: {
    'Grundfos pumbad ja veeautomaatika': 'Насосы Grundfos и водная автоматика',
    'Laos üle 500 toote. Kiire tarne, ekspertnõustamine ja paigaldus üle Eesti.': 'Более 500 товаров на складе. Быстрая доставка, экспертная консультация и установка по всей Эстонии.',
    'Üle 500 toote laost. Kiire tarne, ekspertnõustamine ja paigaldus üle Eesti.': 'Более 500 товаров со склада. Быстрая доставка, экспертная консультация и установка по всей Эстонии.',
    'Vaata tooteid': 'Смотреть товары',
    'Tegevusalad': 'Категории',
    'Tootekategooriad': 'Категории товаров',
    'Vaata kõiki kategooriaid': 'Смотреть все категории',
    'Vaata kõiki tooteid': 'Смотреть все товары',
    'Vali sobiv kategooria või otsi konkreetset toodet.': 'Выберите подходящую категорию или найдите конкретный товар.',
    '<h2>Alusta varakult<br>aiatoimetustega</h2><br><p>Varusta end enne hooaega —&nbsp;<br>JP veeautomaadid, aiasprinklerid ja põhjavee lahendused on laos ja koheselt saadavad.</p><ul><li><p>&nbsp; &nbsp;Laotoodetel tarne kuni 5 tööpäeva</p></li><li><p>&nbsp; &nbsp;Tasuta tehniline nõustamine</p></li></ul>': '<h2>Начните сезон<br>садовых работ заранее</h2><br><p>Подготовьтесь до начала сезона —&nbsp;<br>водная автоматика JP, садовые спринклеры и решения для грунтовых вод на складе и доступны сразу.</p><ul><li><p>&nbsp; &nbsp;Доставка складских товаров до 5 рабочих дней</p></li><li><p>&nbsp; &nbsp;Бесплатная техническая консультация</p></li></ul>',
    '<h2>Tegevusalad</h2>': '<h2>Категории</h2>',
    'Meie kogenud tehnikud paigaldavad pumba korrektselt ning tagavad selle töökindluse ja maksimaalse efektiivsuse. Teenindame kliente üle kogu Eesti!<br><br><ul><li>&nbsp; &nbsp; Tasuta konsultatsioon ja hinnapakkumine</li><li>&nbsp; &nbsp; Garantii paigaldustöödele&nbsp;</li><li>&nbsp; &nbsp; Järelhooldus ja tehniline tugi</li></ul>': 'Наши опытные техники правильно установят насос и обеспечат его надёжность и максимальную эффективность. Обслуживаем клиентов по всей Эстонии!<br><br><ul><li>&nbsp; &nbsp; Бесплатная консультация и расчёт стоимости</li><li>&nbsp; &nbsp; Гарантия на монтажные работы&nbsp;</li><li>&nbsp; &nbsp; Техническое обслуживание и поддержка</li></ul>',
    'Vaata kõiki kategooriaid': 'Смотреть все категории',
    'Vaata kõiki tooteid': 'Смотреть все товары',
    'Professionaalne paigaldus': 'Профессиональная установка',
    'Telli meilt professionaalne paigaldus': 'Закажите у нас профессиональную установку',
    'Telli meilt\nprofessionaalne paigaldus': 'Закажите у нас\nпрофессиональную установку',
    'Meie sertifitseeritud tehnikud paigaldavad ja seadistavad teie pumbasüsteemi.': 'Наши сертифицированные техники установят и настроят вашу насосную систему.',
    'Meie kogenud tehnikud paigaldavad pumba korrektselt ning tagavad selle töökindluse ja maksimaalse efektiivsuse. Teenindame kliente üle kogu Eesti!': 'Наши опытные техники правильно установят насос и обеспечат его надёжность и максимальную эффективность. Обслуживаем клиентов по всей Эстонии!',
    '✓ Üle 15 aasta kogemust\n✓ Garantii kõikidele töödele\n✓ Kiire reageerimine\n✓ Üle-eestiline teenindus': '✓ Более 15 лет опыта\n✓ Гарантия на все работы\n✓ Быстрое реагирование\n✓ Обслуживание по всей Эстонии',
    'Tasuta konsultatsioon ja hinnapakkumine': 'Бесплатная консультация и расчёт стоимости',
    'Tasuta konsultatsioon ja hinnapakkumus': 'Бесплатная консультация и расчёт стоимости',
    'Paigaldus 1-3 tööpäeva jooksul': 'Установка в течение 1-3 рабочих дней',
    'Garantii paigaldustöödele 2 aastat': 'Гарантия на монтажные работы 2 года',
    'Garantii paigaldustöödele': 'Гарантия на монтажные работы',
    'Järelhooldus ja tehniline tugi': 'Техническое обслуживание и поддержка',
    '+372 503 3978': '+372 503 3978',
    'Telli paigaldus +372 510 2376': 'Заказать установку +372 510 2376',
    'Meie asukoht': 'Наше местоположение',
    '📍 Vana-Narva mnt 3, Tallinn': '📍 Vana-Narva mnt 3, Таллинн',
    '📍 Vana-Narva mnt 3, Maardu linn': '📍 Vana-Narva mnt 3, Маарду',
    '🕐 E–R 8:00–17:00': '🕐 Пн–Пт 8:00–17:00',
    '🕐Kokkuleppel': '🕐 По договорённости',
    '📞 +372 503 3978': '📞 +372 503 3978',
    '📞 +372 527 4403': '📞 +372 527 4403',
    '✉️ [email]': '✉️ [email]',
    '✉️ info@pumbapood.ee': '✉️ info@pumbapood.ee',
    'Vaata Google Mapsis': 'Смотреть в Google Maps',
    '🚚 Tasuta tarne': '🚚 Бесплатная доставка',
    'Tellimustele üle 200€': 'При заказе свыше 200€',
    '🔧 Paigaldus': '🔧 Установка',
    'Kogenud tehnikud': 'Опытные техники',
    'Sertifitseeritud tehnikud': 'Сертифицированные техники',
    '🛡 Garantii': '🛡 Гарантия',
    'Kuni 5 aasta garantii': 'Гарантия до 5 лет',
    '2 aastane garantii': 'Гарантия 2 года',
    '🕐 Tugi': '🕐 Поддержка',
    'Tööpäeviti 8–17': 'Будние дни 8–17',
    'Tööpäeviti 9:00–16:30': 'Будние дни 9:00–16:30',
  },
  lv: {
    'Grundfos pumbad ja veeautomaatika': 'Grundfos sūkņi un ūdens automātika',
    'Laos üle 500 toote. Kiire tarne, ekspertnõustamine ja paigaldus üle Eesti.': 'Vairāk nekā 500 preču noliktavā. Ātra piegāde, ekspertu konsultācijas un uzstādīšana visā Igaunijā.',
    'Üle 500 toote laost. Kiire tarne, ekspertnõustamine ja paigaldus üle Eesti.': 'Vairāk nekā 500 preču no noliktavas. Ātra piegāde, ekspertu konsultācijas un uzstādīšana visā Igaunijā.',
    'Vaata tooteid': 'Skatīt preces',
    'Tegevusalad': 'Kategorijas',
    'Tootekategooriad': 'Preču kategorijas',
    'Vali sobiv kategorija või otsi konkreetset toodet.': 'Izvēlieties piemērotu kategoriju vai meklējiet konkrētu preci.',
    'Vaata kõiki kategorijaid': 'Skatīt visas kategorijas',
    'Vaata kõiki tooteid': 'Skatīt visas preces',
    '<h2>Alusta varakult<br>aiatoimetustega</h2><br><p>Varusta end enne hooaega —&nbsp;<br>JP veeautomaadid, aiasprinklerid ja põhjavee lahendused on laos ja koheselt saadavad.</p><ul><li><p>&nbsp; &nbsp;Laotoodetel tarne kuni 5 tööpäeva</p></li><li><p>&nbsp; &nbsp;Tasuta tehniline nõustamine</p></li></ul>': '<h2>Sāciet agri<br>ar dārza darbiem</h2><br><p>Sagatavojieties pirms sezonas —&nbsp;<br>JP ūdens automātika, dārza sprinkleri un gruntsūdens risinājumi ir noliktavā un pieejami tūlīt.</p><ul><li><p>&nbsp; &nbsp;Piegāde noliktavas precēm līdz 5 darbdienām</p></li><li><p>&nbsp; &nbsp;Bezmaksas tehniskā konsultācija</p></li></ul>',
    '<h2>Tegevusalad</h2>': '<h2>Kategorijas</h2>',
    'Meie kogenud tehnikud paigaldavad pumba korrektselt ning tagavad selle töökindluse ja maksimaalse efektiivsuse. Teenindame kliente üle kogu Eesti!<br><br><ul><li>&nbsp; &nbsp; Tasuta konsultatsioon ja hinnapakkumine</li><li>&nbsp; &nbsp; Garantii paigaldustöödele&nbsp;</li><li>&nbsp; &nbsp; Järelhooldus ja tehniline tugi</li></ul>': 'Mūsu pieredzējušie tehniķi pareizi uzstādīs sūkni un nodrošinās tā uzticamību un maksimālo efektivitāti. Apkalpojam klientus visā Igaunijā!<br><br><ul><li>&nbsp; &nbsp; Bezmaksas konsultācija un cenas piedāvājums</li><li>&nbsp; &nbsp; Garantija uzstādīšanas darbiem&nbsp;</li><li>&nbsp; &nbsp; Apkope un tehniskais atbalsts</li></ul>',
    'Professionaalne paigaldus': 'Profesionāla uzstādīšana',
    'Telli meilt professionaalne paigaldus': 'Pasūtiet profesionālu uzstādīšanu pie mums',
    'Telli meilt\nprofessionaalne paigaldus': 'Pasūtiet pie mums\nprofesionālu uzstādīšanu',
    'Meie sertifitseeritud tehnikud paigaldavad ja seadistavad teie pumbasüsteemi.': 'Mūsu sertificētie tehniķi uzstādīs un konfigurēs jūsu sūkņu sistēmu.',
    'Meie kogenud tehnikud paigaldavad pumba korrektselt ning tagavad selle töökindluse ja maksimaalse efektiivsuse. Teenindame kliente üle kogu Eesti!': 'Mūsu pieredzējušie tehniķi pareizi uzstādīs sūkni un nodrošinās tā uzticamību un maksimālo efektivitāti. Apkalpojam klientus visā Igaunijā!',
    '✓ Üle 15 aasta kogemust\n✓ Garantii kõikidele töödele\n✓ Kiire reageerimine\n✓ Üle-eestiline teenindus': '✓ Vairāk nekā 15 gadu pieredze\n✓ Garantija visiem darbiem\n✓ Ātra reaģēšana\n✓ Pakalpojumi visā Igaunijā',
    'Tasuta konsultatsioon ja hinnapakkumine': 'Bezmaksas konsultācija un cenas piedāvājums',
    'Tasuta konsultatsioon ja hinnapakkumus': 'Bezmaksas konsultācija un cenas piedāvājums',
    'Paigaldus 1-3 tööpäeva jooksul': 'Uzstādīšana 1-3 darbdienu laikā',
    'Garantii paigaldustöödele 2 aastat': 'Garantija uzstādīšanas darbiem 2 gadi',
    'Garantii paigaldustöödele': 'Garantija uzstādīšanas darbiem',
    'Järelhooldus ja tehniline tugi': 'Apkope un tehniskais atbalsts',
    '+372 503 3978': '+372 503 3978',
    'Telli paigaldus +372 510 2376': 'Pasūtīt uzstādīšanu +372 510 2376',
    'Meie asukoht': 'Mūsu atrašanās vieta',
    '📍 Vana-Narva mnt 3, Tallinn': '📍 Vana-Narva mnt 3, Tallina',
    '📍 Vana-Narva mnt 3, Maardu linn': '📍 Vana-Narva mnt 3, Mārdu',
    '🕐 E–R 8:00–17:00': '🕐 P–Pk 8:00–17:00',
    '🕐Kokkuleppel': '🕐 Pēc vienošanās',
    '📞 +372 527 4403': '📞 +372 527 4403',
    '📞 +372 503 3978': '📞 +372 503 3978',
    '✉️ [email]': '✉️ [email]',
    '✉️ info@pumbapood.ee': '✉️ info@pumbapood.ee',
    'Vaata Google Mapsis': 'Skatīt Google Maps',
    '🚚 Tasuta tarne': '🚚 Bezmaksas piegāde',
    'Tellimustele üle 200€': 'Pasūtījumiem virs 200€',
    '🔧 Paigaldus': '🔧 Uzstādīšana',
    'Kogenud tehnikud': 'Pieredzējuši tehniķi',
    'Sertifitseeritud tehnikud': 'Sertificēti tehniķi',
    '🛡 Garantii': '🛡 Garantija',
    'Kuni 5 aasta garantii': 'Garantija līdz 5 gadiem',
    '2 aastane garantii': '2 gadu garantija',
    '🕐 Tugi': '🕐 Atbalsts',
    'Tööpäeviti 8–17': 'Darbdienās 8–17',
    'Tööpäeviti 9:00–16:30': 'Darbdienās 9:00–16:30',
  },
  lt: {
    'Grundfos pumbad ja veeautomaatika': 'Grundfos siurbliai ir vandens automatika',
    'Laos üle 500 toote. Kiire tarne, ekspertnõustamine ja paigaldus üle Eesti.': 'Daugiau nei 500 prekių sandėlyje. Greitas pristatymas, ekspertų konsultacijos ir montavimas visoje Estijoje.',
    'Üle 500 toote laost. Kiire tarne, ekspertnõustamine ja paigaldus üle Eesti.': 'Daugiau nei 500 prekių iš sandėlio. Greitas pristatymas, ekspertų konsultacijos ir montavimas visoje Estijoje.',
    'Vaata tooteid': 'Žiūrėti prekes',
    'Tegevusalad': 'Kategorijos',
    'Tootekategooriad': 'Prekių kategorijos',
    'Vali sobiv kategorija või otsi konkreetset toodet.': 'Pasirinkite tinkamą kategoriją arba ieškokite konkrečios prekės.',
    'Vaata kõiki kategorijaid': 'Žiūrėti visas kategorijas',
    'Vaata kõiki tooteid': 'Žiūrėti visas prekes',
    '<h2>Alusta varakult<br>aiatoimetustega</h2><br><p>Varusta end enne hooaega —&nbsp;<br>JP veeautomaadid, aiasprinklerid ja põhjavee lahendused on laos ja koheselt saadavad.</p><ul><li><p>&nbsp; &nbsp;Laotoodetel tarne kuni 5 tööpäeva</p></li><li><p>&nbsp; &nbsp;Tasuta tehniline nõustamine</p></li></ul>': '<h2>Pradėkite anksti<br>sodo darbus</h2><br><p>Pasiruoškite prieš sezoną —&nbsp;<br>JP vandens automatika, sodo purkštuvai ir požeminio vandens sprendimai yra sandėlyje ir prieinami iš karto.</p><ul><li><p>&nbsp; &nbsp;Sandėlio prekių pristatymas iki 5 darbo dienų</p></li><li><p>&nbsp; &nbsp;Nemokama techninė konsultacija</p></li></ul>',
    '<h2>Tegevusalad</h2>': '<h2>Kategorijos</h2>',
    'Meie kogenud tehnikud paigaldavad pumba korrektselt ning tagavad selle töökindluse ja maksimaalse efektiivsuse. Teenindame kliente üle kogu Eesti!<br><br><ul><li>&nbsp; &nbsp; Tasuta konsultatsioon ja hinnapakkumine</li><li>&nbsp; &nbsp; Garantii paigaldustöödele&nbsp;</li><li>&nbsp; &nbsp; Järelhooldus ja tehniline tugi</li></ul>': 'Mūsų patyrę technikai teisingai sumontuos siurblį ir užtikrins jo patikimumą bei maksimalų efektyvumą. Aptarnaujame klientus visoje Estijoje!<br><br><ul><li>&nbsp; &nbsp; Nemokama konsultacija ir kainos pasiūlymas</li><li>&nbsp; &nbsp; Garantija montavimo darbams&nbsp;</li><li>&nbsp; &nbsp; Techninė priežiūra ir pagalba</li></ul>',
    'Professionaalne paigaldus': 'Profesionalus montavimas',
    'Telli meilt professionaalne paigaldus': 'Užsisakykite profesionalų montavimą pas mus',
    'Telli meilt\nprofessionaalne paigaldus': 'Užsisakykite pas mus\nprofesionalų montavimą',
    'Meie sertifitseeritud tehnikud paigaldavad ja seadistavad teie pumbasüsteemi.': 'Mūsų sertifikuoti technikai sumontuos ir sukonfigūruos jūsų siurblių sistemą.',
    'Meie kogenud tehnikud paigaldavad pumba korrektselt ning tagavad selle töökindluse ja maksimaalse efektiivsuse. Teenindame kliente üle kogu Eesti!': 'Mūsų patyrę technikai teisingai sumontuos siurblį ir užtikrins jo patikimumą bei maksimalų efektyvumą. Aptarnaujame klientus visoje Estijoje!',
    '✓ Üle 15 aasta kogemust\n✓ Garantii kõikidele töödele\n✓ Kiire reageerimine\n✓ Üle-eestiline teenindus': '✓ Daugiau nei 15 metų patirtis\n✓ Garantija visiems darbams\n✓ Greitas reagavimas\n✓ Aptarnavimas visoje Estijoje',
    'Tasuta konsultatsioon ja hinnapakkumine': 'Nemokama konsultacija ir kainos pasiūlymas',
    'Tasuta konsultatsioon ja hinnapakkumus': 'Nemokama konsultacija ir kainos pasiūlymas',
    'Paigaldus 1-3 tööpäeva jooksul': 'Montavimas per 1-3 darbo dienas',
    'Garantii paigaldustöödele 2 aastat': 'Garantija montavimo darbams 2 metai',
    'Garantii paigaldustöödele': 'Garantija montavimo darbams',
    'Järelhooldus ja tehniline tugi': 'Techninė priežiūra ir pagalba',
    '+372 503 3978': '+372 503 3978',
    'Telli paigaldus +372 510 2376': 'Užsakyti montavimą +372 510 2376',
    'Meie asukoht': 'Mūsų vieta',
    '📍 Vana-Narva mnt 3, Tallinn': '📍 Vana-Narva mnt 3, Talinas',
    '📍 Vana-Narva mnt 3, Maardu linn': '📍 Vana-Narva mnt 3, Mārdū',
    '🕐 E–R 8:00–17:00': '🕐 Pr–Pn 8:00–17:00',
    '🕐Kokkuleppel': '🕐 Susitarus',
    '📞 +372 503 3978': '📞 +372 503 3978',
    '📞 +372 527 4403': '📞 +372 527 4403',
    '✉️ [email]': '✉️ [email]',
    '✉️ info@pumbapood.ee': '✉️ info@pumbapood.ee',
    'Vaata Google Mapsis': 'Žiūrėti Google Maps',
    '🚚 Tasuta tarne': '🚚 Nemokamas pristatymas',
    'Tellimustele üle 200€': 'Užsakymams virš 200€',
    '🔧 Paigaldus': '🔧 Montavimas',
    'Kogenud tehnikud': 'Patyrę technikai',
    'Sertifitseeritud tehnikud': 'Sertifikuoti technikai',
    '🛡 Garantii': '🛡 Garantija',
    'Kuni 5 aasta garantii': 'Garantija iki 5 metų',
    '2 aastane garantii': '2 metų garantija',
    '🕐 Tugi': '🕐 Pagalba',
    'Tööpäeviti 8–17': 'Darbo dienomis 8–17',
    'Tööpäeviti 9:00–16:30': 'Darbo dienomis 9:00–16:30',
  },
}

function translateBlock(block, lang) {
  const dict = t[lang]
  if (!dict) return
  if (block.type === 'heading' || block.type === 'button') {
    const src = block.text || ''
    const tr = dict[src]
    if (tr) block[`text_${lang}`] = tr
  } else if (block.type === 'text') {
    const src = block.content || ''
    const tr = dict[src]
    if (tr) block[`content_${lang}`] = tr
  }
}

function walkBlocks(section) {
  for (const col of section.columns || []) {
    for (const block of col.blocks || []) {
      for (const lang of ['en', 'ru', 'lv', 'lt']) {
        translateBlock(block, lang)
      }
    }
  }
  return section
}

async function main() {
  const { data: page } = await admin.from('pages').select('id,title,blocks').eq('slug', 'esilehtx').single()
  if (!page) { console.log('Page not found'); return }

  console.log(`Translating blocks for page "${page.title}" (${page.id})`)
  const blocks = (page.blocks || []).map(s => walkBlocks(s))

  let untranslated = 0
  for (const s of blocks) {
    for (const c of s.columns || []) {
      for (const b of c.blocks || []) {
        if (b.type === 'heading' || b.type === 'button') {
          if (b.text && !b.text_en) { console.log(`  ⚠ No EN translation for: "${b.text.substring(0,60)}"`); untranslated++ }
        } else if (b.type === 'text') {
          if (b.content && !b.content_en) { console.log(`  ⚠ No EN translation for: "${b.content.substring(0,60)}"`); untranslated++ }
        }
      }
    }
  }

  if (untranslated > 0) {
    console.log(`\n${untranslated} blocks with missing translations. Please add them to the dictionary.`)
    return
  }

  const { error } = await admin.from('pages').update({ blocks, updated_at: new Date().toISOString() }).eq('id', page.id)
  if (error) console.log('Update error:', error.message)
  else console.log('Blocks translated successfully!')
}

main()
