/**
 * Editorial SEO content for category (activity area) pages — rendered below
 * the series grid by app/[locale]/tooted/[tegevusala]/page.tsx.
 *
 * Why here and not in the CMS: the category grid is DB-driven, but long-form
 * buying guides are editorial content that ships with the codebase (same
 * pattern as the /unilift and /alpha-go landing pages).
 *
 * Content targets the keyword families the weekly report tracks: for
 * "veeautomaadid" the GSC queries are „parim veeautomaat“, „veeautomaat
 * hind“, „põrandal seisev veeautomaat“, „uputatav veeautomaat“ — the guide,
 * price table and FAQ answer exactly those intents. Price ranges come from
 * the live catalog (scripts/_veeautomaat-prices.mjs, Sep 2026) — keep them
 * in sync when prices move.
 */

export interface CategoryFaq {
  q: string
  a: string
}

export interface CategoryContentSection {
  guideTitle: string
  guideParagraphs: string[]
  priceTitle: string
  priceIntro: string
  priceTable: { head: [string, string, string]; rows: [string, string, string][] }
  faqTitle: string
  faq: CategoryFaq[]
}

type Locale = "et" | "en" | "ru" | "lv" | "lt"

const VEEAUTOMAADID: Record<Locale, CategoryContentSection> = {
  et: {
    guideTitle: "Kuidas valida veeautomaat kodu veevarustuseks?",
    guideParagraphs: [
      "Veeautomaat (hüdrofoor) hoiab majas veerõhu püsivana: pump käivitub ja seiskub automaatselt vastavalt veevõtule. Õige valik sõltub eelkõige veeallikast (kaev, salvkaev või tsentraalvõrk), vajalikust vooluhulgast ehk kraanikohtade arvust ja müratasemest.",
      "Põrandal seisev veeautomaat (SCALA1, SCALA2, JP) paigaldatakse kuiva ruumi ja imeb vett kaevust kuni 8 m sügavuselt. Kui kaevupind on madalamal või soovid pumpa kaevu sisse, on õige valik uputatav veeautomaat SBA, mis töötab vaikselt ja ei vaja kuiva paigaldusruumi.",
      "Eramule 3–6 kraanikohaga on parim valik SCALA2, mis hoiab rõhu täiesti püsivana ka mitme tarbija korral. Soodsam alternatiiv on SCALA1 või klassikaline JP hüdrofoor, suvilasse ja aeda piisab enamasti JP-st.",
      "Kontorisse ja ärihoonesse vali vaikne veeautomaat, mis peab vastu üheaegsele kasutusele — 5–20 töötajaga kontorisse sobib hästi Grundfos SCALA2 nii köögi, tualettruumi kui ka muudeks veevõttudeks; väiksemasse kontorisse piisab SCALA1-st.",
    ],
    priceTitle: "Veeautomaadi hind",
    priceIntro:
      "Hind sõltub seeriast ja võimsusest. Allpool on meie valiku hinnavahemikud koos soovitusega, millal kumbki seeria kõige paremini sobib.",
    priceTable: {
      head: ["Seeria", "Sobivus", "Hinnavahemik"],
      rows: [
        ["Grundfos JP", "põrandal seisev hüdrofoor — suvila, aed, väiksem maja", "235–550 €"],
        ["Grundfos SCALA1", "kompaktne ja vaikne veeautomaat väiksemale koju", "450–570 €"],
        ["Grundfos SCALA2", "täiesti püsiv rõhk, väga vaikne — eramu 3–6 kraanikohta", "u 660 €"],
        ["Grundfos SB", "põrandal seisev, imeb kaevust kuni 8 m", "520–600 €"],
        ["Grundfos SBA", "uputatav veeautomaat kaevu sisse", "575–720 €"],
      ],
    },
    faqTitle: "Korduma kippuvad küsimused",
    faq: [
      {
        q: "Milline on parim veeautomaat eramu jaoks?",
        a: "Enamike eramute jaoks on parim valik Grundfos SCALA2, sest see hoiab veerõhu püsivana ka siis, kui korraga on avatud mitu kraani, ja on praktiliselt vaikne. Kui eelarve on tähtsam, pakub SCALA1 sama automaatikat soodsamalt, ja kaevu sisse uputatavana on parim SBA.",
      },
      {
        q: "Kui palju maksab veeautomaat?",
        a: "Meie valikus algavad veeautomaadi hinnad u 235 eurot (Grundfos JP hüdrofoorid) ja jõuavad u 720 euroni (uputatav SBA). Kõige populaarsem valik SCALA1 maksab 450–570 € ja SCALA2 u 660 €. Hind sisaldab automaatikat — eraldi rõhumahutit pole vaja.",
      },
      {
        q: "Mis vahe on põrandal seisval ja uputataval veeautomaadil?",
        a: "Põrandal seisev veeautomaat (SCALA1, SCALA2, JP, SB) paigaldatakse kuiva ruumi — tehnoruumi või saunakambrisse — ja imeb vett kaevust kuni 8 m sügavuselt. Uputatav veeautomaat (SBA) langetatakse kaevu sisse: see on täiesti vaikne, ei võta ruumi ja sobib ka sügavamatesse kaevudesse.",
      },
      {
        q: "Mis vahe on veeautomaadil ja hüdrofooril?",
        a: "Mõisted kattuvad. Hüdrofoor on klassikaline lahendus: pump koos rõhumahuti ja automaatikaga (nt Grundfos JP). Veeautomaat on kompaktne kõik-ühes seade, kus pump, automaatika ja kaitse on integreeritud (nt SCALA1, SCALA2). Mõlemad hoiavad majas veerõhku automaatselt.",
      },
      {
        q: "Kas veeautomaati saab kasutada ka aiakastmiseks?",
        a: "Jah — SCALA1 ja JP sobivad hästi ka aiakastmiseks ja vihmavee kasutamiseks. Kui kastmine on peamine kasutus, vaata ka meie kastmispumpasid salvkaevupumpade valikus (SB, SBA, JP).",
      },
      {
        q: "Milline veeautomaat sobib kontorisse?",
        a: "Kontorisse sobib vaikne ja automaatne veeautomaat, mis hoiab ühtlase veerõhu ka siis, kui mitu kraani on korraga avatud. 5–20 töötajaga kontorisse soovitame Grundfos SCALA2 — vaikne, püsiva rõhuga ja integreeritud automaatikaga. Väiksemasse kontorisse või äripinnale piisab SCALA1-st, suurematesse hoonetesse sobib ka CMB rõhutõstepump.",
      },
    ],
  },
  en: {
    guideTitle: "How to choose a water booster (hydrophore) for your home?",
    guideParagraphs: [
      "A water booster keeps the water pressure in your home constant: the pump starts and stops automatically as you use water. The right choice depends mainly on the water source (borehole, shallow well or mains), the required flow (number of taps) and the noise level.",
      "A floor-standing booster (SCALA1, SCALA2, JP) is installed in a dry room and draws water from wells up to 8 m deep. If the water level is deeper or you want the pump inside the well, the submersible SBA booster is the right choice — silent and needing no dry installation space.",
      "For a detached house with 3–6 taps, SCALA2 is the best choice, keeping the pressure perfectly constant even with several simultaneous users. A more affordable alternative is SCALA1 or the classic JP hydrophore; for a summer cottage or garden, JP is usually enough.",
      "For an office or commercial building choose a quiet booster that handles simultaneous use — Grundfos SCALA2 suits a 5–20 person office for the kitchen, restrooms and other taps; a smaller office is fine with SCALA1.",
    ],
    priceTitle: "Water booster prices",
    priceIntro:
      "The price depends on the series and capacity. Below are the price ranges of our range with a recommendation on when each series fits best.",
    priceTable: {
      head: ["Series", "Best for", "Price range"],
      rows: [
        ["Grundfos JP", "floor-standing hydrophore — cottage, garden, smaller house", "€235–550"],
        ["Grundfos SCALA1", "compact and quiet booster for a smaller home", "€450–570"],
        ["Grundfos SCALA2", "perfectly constant pressure, very quiet — house with 3–6 taps", "≈ €660"],
        ["Grundfos SB", "floor-standing, draws from wells up to 8 m", "€520–600"],
        ["Grundfos SBA", "submersible booster installed inside the well", "€575–720"],
      ],
    },
    faqTitle: "Frequently asked questions",
    faq: [
      {
        q: "What is the best water booster for a detached house?",
        a: "For most detached houses the best choice is Grundfos SCALA2: it keeps the pressure constant even when several taps are open and is practically silent. On a tighter budget, SCALA1 offers the same automation for less, and for installation inside a well the submersible SBA is best.",
      },
      {
        q: "How much does a water booster cost?",
        a: "In our range, prices start at about €235 (Grundfos JP hydrophores) and go up to about €720 (submersible SBA). The most popular SCALA1 costs €450–570 and SCALA2 ≈ €660. The price includes the automation — no separate pressure vessel is needed.",
      },
      {
        q: "What is the difference between a floor-standing and a submersible booster?",
        a: "A floor-standing booster (SCALA1, SCALA2, JP, SB) is installed in a dry room — a utility room or a sauna chamber — and draws water from wells up to 8 m deep. A submersible booster (SBA) is lowered into the well: completely silent, takes no indoor space and suits deeper wells.",
      },
      {
        q: "What is the difference between a water booster and a hydrophore?",
        a: "The terms overlap. A hydrophore is the classic setup: a pump with a pressure vessel and automation (e.g. Grundfos JP). A water booster is a compact all-in-one unit with pump, automation and protection integrated (e.g. SCALA1, SCALA2). Both keep your home's water pressure automatic.",
      },
      {
        q: "Can a water booster be used for garden irrigation?",
        a: "Yes — SCALA1 and JP are well suited for garden irrigation and rainwater reuse. If irrigation is the main use, also see our irrigation pumps in the shallow-well pump range (SB, SBA, JP).",
      },
      {
        q: "Which water booster suits an office?",
        a: "An office needs a quiet, automatic booster that keeps pressure steady when several taps run at once. For a 5–20 person office we recommend Grundfos SCALA2 — quiet, constant pressure, integrated automation. A smaller office or retail space is fine with SCALA1; larger buildings can use a CMB booster set.",
      },
    ],
  },
  ru: {
    guideTitle: "Как выбрать насосную станцию для водоснабжения дома?",
    guideParagraphs: [
      "Насосная станция (гидрофор) поддерживает постоянное давление воды в доме: насос включается и выключается автоматически по мере разбора воды. Правильный выбор зависит от источника воды (скважина, колодец или центральная сеть), требуемого расхода (числа точек разбора) и уровня шума.",
      "Напольная станция (SCALA1, SCALA2, JP) устанавливается в сухом помещении и забирает воду из скважины глубиной до 8 м. Если зеркало воды глубже или насос нужен внутри скважины, правильный выбор — погружная станция SBA: бесшумная и не требующая сухого помещения.",
      "Для частного дома с 3–6 точками разбора лучший выбор — SCALA2: давление остаётся полностью постоянным даже при нескольких одновременно открытых кранах. Более доступная альтернатива — SCALA1 или классический гидрофор JP; для дачи и сада обычно достаточно JP.",
      "Для офиса и коммерческого здания выберите бесшумную станцию, выдерживающую одновременное потребление — Grundfos SCALA2 подходит для офиса на 5–20 сотрудников (кухня, санузлы и другие точки); в небольшой офис достаточно SCALA1.",
    ],
    priceTitle: "Цена насосной станции",
    priceIntro:
      "Цена зависит от серии и производительности. Ниже — ценовые диапазоны нашего ассортимента с рекомендацией, когда какая серия подходит лучше всего.",
    priceTable: {
      head: ["Серия", "Назначение", "Диапазон цен"],
      rows: [
        ["Grundfos JP", "напольный гидрофор — дача, сад, небольшой дом", "235–550 €"],
        ["Grundfos SCALA1", "компактная и тихая станция для небольшого дома", "450–570 €"],
        ["Grundfos SCALA2", "полностью постоянное давление, очень тихая — дом с 3–6 кранами", "≈ 660 €"],
        ["Grundfos SB", "напольная, забор воды из скважины до 8 м", "520–600 €"],
        ["Grundfos SBA", "погружная станция внутрь скважины", "575–720 €"],
      ],
    },
    faqTitle: "Часто задаваемые вопросы",
    faq: [
      {
        q: "Какая насосная станция лучше для частного дома?",
        a: "Для большинства домов лучший выбор — Grundfos SCALA2: давление остаётся постоянным даже при нескольких открытых кранах, а работает она практически бесшумно. При ограниченном бюджете SCALA1 предлагает ту же автоматику дешевле, а для установки внутрь скважины лучше всего подходит погружная SBA.",
      },
      {
        q: "Сколько стоит насосная станция?",
        a: "В нашем ассортименте цены начинаются примерно от 235 € (гидрофоры Grundfos JP) и доходят примерно до 720 € (погружная SBA). Самая популярная SCALA1 стоит 450–570 €, а SCALA2 — около 660 €. Цена включает автоматику — отдельный гидроаккумулятор не нужен.",
      },
      {
        q: "В чём разница между напольной и погружной станцией?",
        a: "Напольная станция (SCALA1, SCALA2, JP, SB) устанавливается в сухом помещении и забирает воду из скважины глубиной до 8 м. Погружная станция (SBA) опускается в скважину: полностью бесшумна, не занимает места и подходит для более глубоких скважин.",
      },
      {
        q: "Чем отличается насосная станция от гидрофора?",
        a: "Понятия пересекаются. Гидрофор — классическое решение: насос с гидроаккумулятором и автоматикой (например, Grundfos JP). Насосная станция — компактное устройство «всё в одном» со встроенной автоматикой и защитой (например, SCALA1, SCALA2). Обе автоматически поддерживают давление в доме.",
      },
      {
        q: "Можно ли использовать станцию для полива сада?",
        a: "Да — SCALA1 и JP хорошо подходят для полива и использования дождевой воды. Если полив — основное применение, посмотрите также поливочные насосы в разделе колодезных насосов (SB, SBA, JP).",
      },
      {
        q: "Какая насосная станция подходит для офиса?",
        a: "В офис нужна тихая автоматическая станция, поддерживающая постоянное давление при одновременно открытых кранах. Для офиса на 5–20 сотрудников рекомендуем Grundfos SCALA2 — тихая, с постоянным давлением и встроенной автоматикой. В небольшой офис или магазин достаточно SCALA1; для крупных зданий подойдёт повысительный насос CMB.",
      },
    ],
  },
  lv: {
    guideTitle: "Kā izvēlēties ūdens automātu (hidroforu) mājas ūdensapgādei?",
    guideParagraphs: [
      "Ūdens automāts uztur pastāvīgu ūdens spiedienu mājā: sūknis ieslēdzas un izslēdzas automātiski atbilstoši ūdens patēriņam. Pareizā izvēle galvenokārt atkarīga no ūdens avota (urbums, akas vai centrālais tīkls), nepieciešamās plūsmas (krānu skaits) un trokšņa līmeņa.",
      "Uz grīdas novietojams automāts (SCALA1, SCALA2, JP) tiek uzstādīts sausā telpā un sūc ūdeni no akas līdz 8 m dziļumam. Ja ūdens līmenis ir dziļāks vai sūknis jānovieto akā, pareizā izvēle ir iegremdējamais SBA automāts — kluss un bez sausas uzstādīšanas vietas.",
      "Privātmājai ar 3–6 krāniem labākā izvēle ir SCALA2, kas uztur spiedienu pilnīgi nemainīgu pat vairākiem vienlaicīgiem lietotājiem. Lētāka alternatīva ir SCALA1 vai klasiskais JP hidrofors; vasarnīcai vai dārzam parasti pietiek ar JP.",
      "Birojam un komerciālai ēkai izvēlieties klusu ūdens automātu, kas iztur vienlaicīgu ūdens ņemšanu — Grundfos SCALA2 ir piemērots 5–20 darbinieku birojam (virtuvei, tualetēm un citiem punktiem); mazākam birojam pietiek ar SCALA1.",
    ],
    priceTitle: "Ūdens automāta cena",
    priceIntro:
      "Cena atkarīga no sērijas un jaudas. Zemāk ir mūsu klāsta cenu diapazoni kopā ar ieteikumu, kad kura sērija der vislabāk.",
    priceTable: {
      head: ["Sērija", "Piemērotība", "Cenu diapazons"],
      rows: [
        ["Grundfos JP", "uz grīdas stāvošs hidrofors — vasarnīca, dārzs, mazāka māja", "235–550 €"],
        ["Grundfos SCALA1", "kompakts un kluss automāts mazākai mājai", "450–570 €"],
        ["Grundfos SCALA2", "pilnīgi nemainīgs spiediens, ļoti kluss — māja ar 3–6 krāniem", "≈ 660 €"],
        ["Grundfos SB", "uz grīdas stāvošs, sūc no akas līdz 8 m", "520–600 €"],
        ["Grundfos SBA", "iegremdējams automāts akas iekšpusē", "575–720 €"],
      ],
    },
    faqTitle: "Biežāk uzdotie jautājumi",
    faq: [
      {
        q: "Kurš ūdens automāts ir labākais privātmājai?",
        a: "Vairumam privātmāju labākā izvēle ir Grundfos SCALA2 — spiediens paliek nemainīgs pat vairākiem vienlaikus atvērtiem krāniem un tā ir praktiski klusa. Ja svarīgāka ir cena, SCALA1 piedāvā to pašu automātiku lētāk, un uzstādīšanai akas iekšpusē labākā ir iegremdējamā SBA.",
      },
      {
        q: "Cik maksā ūdens automāts?",
        a: "Mūsu klāstā cenas sākas no aptuveni 235 € (Grundfos JP hidrofori) un sniedzas līdz aptuveni 720 € (iegremdējamā SBA). Populārākā SCALA1 maksā 450–570 €, SCALA2 — ap 660 €. Cenā iekļauta automātika — atsevišķs spiedkatls nav nepieciešams.",
      },
      {
        q: "Kāda ir atšķirība starp uz grīdas stāvošu un iegremdējamu automātu?",
        a: "Uz grīdas stāvošs automāts (SCALA1, SCALA2, JP, SB) tiek uzstādīts sausā telpā un sūc ūdeni no akas līdz 8 m dziļumam. Iegremdējamais automāts (SBA) tiek nolaists akā: pilnīgi kluss, neaizņem vietas un der arī dziļākām akām.",
      },
      {
        q: "Kāda ir atšķirība starp ūdens automātu un hidroforu?",
        a: "Jēdzieni pārklājas. Hidrofors ir klasiskais risinājums: sūknis ar spiedkatlu un automātiku (piem., Grundfos JP). Ūdens automāts ir kompakta «viss vienā» ierīce ar integrētu automātiku un aizsardzību (piem., SCALA1, SCALA2). Abi automātiski uztur ūdens spiedienu mājā.",
      },
      {
        q: "Vai ūdens automātu var izmantot dārza laistīšanai?",
        a: "Jā — SCALA1 un JP lieliski der dārza laistīšanai un lietus ūdens izmantošanai. Ja laistīšana ir galvenais mērķis, skatiet arī laistīšanas sūkņus akas sūkņu klāstā (SB, SBA, JP).",
      },
      {
        q: "Kurš ūdens automāts ir piemērots birojam?",
        a: "Birojam vajag klusu, automātisku ūdens automātu, kas uztur stabilu spiedienu arī tad, ja vienlaikus ir atvērti vairāki krāni. 5–20 darbinieku birojam iesakām Grundfos SCALA2 — kluss, ar stabilu spiedienu un integrētu automātiku. Mazākam birojam vai telpai pietiek ar SCALA1; lielākām ēkām der CMB spiediena paaugstināšanas sūknis.",
      },
    ],
  },
  lt: {
    guideTitle: "Kaip išsirinkti vandens automatą (hidroforą) namo vandentiekiui?",
    guideParagraphs: [
      "Vandens automatas palaiko pastovų vandens slėgį name: siurblys įsijungia ir išsijungia automatiškai pagal vandens sunaudojimą. Tinkamas pasirinkimas priklauso nuo vandens šaltinio (gręžinys, šulinys arba centrinis tinklas), reikalingo srauto (čiaupų skaičiaus) ir triukšmo lygio.",
      "Ant grindų statomas automatas (SCALA1, SCALA2, JP) montuojamas sausoje patalpoje ir siurbia vandenį iš iki 8 m gylio šulinio. Jei vandens lygis gilesnis arba siurblio reikia pačiame šulinyje, tinkamas pasirinkimas – panardinamas automatas SBA: tylus ir jam nereikia sausos patalpos.",
      "Individualiam namui su 3–6 čiaupais geriausias pasirinkimas – SCALA2: slėgis išlieka visiškai pastovus net esant keliems vienu metu atidarytiems čiaupams. Pigesnė alternatyva – SCALA1 arba klasikinis JP hidroforas; vasarnamiui ar sodui dažniausiai pakanka JP.",
      "Biurui ir komerciniam pastui rinkitės tylų vandens automatą, atlaikantį vienalaikį naudojimą – Grundfos SCALA2 tinka 5–20 darbuotojų biurui (virtuvei, tualetams ir kitiems taškams); mažesniam biurui pakanka SCALA1.",
    ],
    priceTitle: "Vandens automato kaina",
    priceIntro:
      "Kaina priklauso nuo serijos ir galingumo. Žemiau – mūsų asortimento kainų intervalai su rekomendacija, kada kuri serija tinka geriausiai.",
    priceTable: {
      head: ["Serija", "Paskirtis", "Kainų intervalas"],
      rows: [
        ["Grundfos JP", "ant grindų statomas hidroforas – vasarnamis, sodas, mažesnis namas", "235–550 €"],
        ["Grundfos SCALA1", "kompaktiškas ir tylus automatas mažesniam namui", "450–570 €"],
        ["Grundfos SCALA2", "visiškai pastovus slėgis, labai tylus – namas su 3–6 čiaupais", "≈ 660 €"],
        ["Grundfos SB", "ant grindų statomas, siurbia iš šulinio iki 8 m", "520–600 €"],
        ["Grundfos SBA", "panardinamas automatas šulinio viduje", "575–720 €"],
      ],
    },
    faqTitle: "Dažnai užduodami klausimai",
    faq: [
      {
        q: "Kuris vandens automatas geriausias individualiam namui?",
        a: "Daugumai namų geriausias pasirinkimas – Grundfos SCALA2: slėgis išlieka pastovus net atidarius kelis čiaupus vienu metu, o jis praktiškai tylus. Jei svarbiau biudžetas, SCALA1 siūlo tą pačią automatiką pigiau, o montuoti šulinio viduje geriausia tinka panardinama SBA.",
      },
      {
        q: "Kiek kainuoja vandens automatas?",
        a: "Mūsų asortimente kainos prasideda maždaug nuo 235 € (Grundfos JP hidroforai) ir siekia apie 720 € (panardinama SBA). Populiariausia SCALA1 kainuoja 450–570 €, SCALA2 – apie 660 €. Kaina apima automatiką – atskiro slėginio indo nereikia.",
      },
      {
        q: "Kuo skiriasi ant grindų statomas ir panardinamas automatas?",
        a: "Ant grindų statomas automatas (SCALA1, SCALA2, JP, SB) montuojamas sausoje patalpoje ir siurbia vandenį iš iki 8 m gylio šulinio. Panardinamas automatas (SBA) leidžiamas į šulinį: visiškai tylus, neužima vietos ir tinka gilesniems šuliniams.",
      },
      {
        q: "Kuo skiriasi vandens automatas ir hidroforas?",
        a: "Sąvokos persidengia. Hidroforas – klasikinis sprendimas: siurblys su slėginiu indu ir automatika (pvz., Grundfos JP). Vandens automatas – kompaktiškas „viskas viename“ įrenginys su integruota automatika ir apsauga (pvz., SCALA1, SCALA2). Abu automatiškai palaiko vandens slėgį name.",
      },
      {
        q: "Ar vandens automatą galima naudoti sodo laistymui?",
        a: "Taip – SCALA1 ir JP puikiai tinka sodo laistymui ir lietaus vandens naudojimui. Jei laistymas yra pagrindinis tikslas, taip pat žiūrėkite laistymo siurblius šulininių siurblių skyriuje (SB, SBA, JP).",
      },
      {
        q: "Kuris vandens automatas tinka biurui?",
        a: "Biurui reikia tylaus, automatinio vandens automato, išlaikančio stabilų slėgį net atidarius kelis čiaupus. 5–20 darbuotojų biurui rekomenduojame Grundfos SCALA2 – tylų, su stabiliu slėgiu ir integruota automatika. Mažesniam biurui ar patalpai pakanka SCALA1; didesniems pastatams tinka CMB slėgio didinimo siurblys.",
      },
    ],
  },
}

const CONTENT: Record<string, Record<Locale, CategoryContentSection>> = {
  veeautomaadid: VEEAUTOMAADID,
}

/** Editorial content for a category slug in the given locale (ET fallback). */
export function getCategoryContent(slug: string, locale: string): CategoryContentSection | null {
  const byLocale = CONTENT[slug]
  if (!byLocale) return null
  return byLocale[(locale as Locale)] ?? byLocale.et
}
