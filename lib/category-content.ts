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

const KUTTEPUMBAD: Record<Locale, CategoryContentSection> = {
  et: {
    guideTitle: "Kuidas valida küttepump küttesüsteemi?",
    guideParagraphs: [
      "Küttepump ehk tsirkulatsioonipump liigutab vett keskkütte- ja põrandaküttesüsteemis. Õige valik sõltub süsteemi tüübist (radiaator- või põrandaküte), vajalikust tõstest ja vooluhulgast ning pumba ühendusmõõdust — uutel Grundfos ALPHA pumpadel on sama 130 mm või 180 mm ühendusmõõt mis vanadel UPS mudelitel, seega vahetus käib ilma torustikku ümber tegemata.",
      "Kui majas on vana kolme käiguga UPS pump, on otseste asendustena kaks valikut: soodne ALPHA1 L (lihtne käiguvahetus) või intelligentsed ALPHA1 GO ja ALPHA2 GO, mille AUTOADAPT-režiim seab pumba tööpunkti ise ja Grundfos GO äpp juhendab paigalduse samm-sammult.",
      "Radiaatorküttega eramusse piisab enamasti ALPHA1 GO-st; põrandaküttele ja suurematesse süsteemidesse sobib ALPHA2 GO. Kortermajade, ärihoonete ja tööstuse suuremate vooluhulkade ja tõstete jaoks on MAGNA1 ja MAGNA3 seeriad.",
      "Uus elektrooniline pump tarbib vana 60–90 W asemel tüüpiliselt 5–45 W — elektrisääst on kuni 80 % ja pump maksab end enamasti 1–3 aastaga tagasi.",
    ],
    priceTitle: "Küttepumba hind",
    priceIntro:
      "Hind sõltub seeriast ja võimsusest. Allpool on meie valiku hinnavahemikud koos soovitusega, millal kumbki seeria kõige paremini sobib.",
    priceTable: {
      head: ["Seeria", "Sobivus", "Hinnavahemik"],
      rows: [
        ["ALPHA1 L", "vana pumba lihtsaim asendus — käiguvahetusega", "170–226 €"],
        ["ALPHA1 GO", "asendab enamik vanu UPS ja ALPHA1 pumaid — eramu radiaatorküte", "170–249 €"],
        ["ALPHA2 GO", "tippmudel — põrandaküte ja suuremad süsteemid, GO äpp", "264–457 €"],
        ["Grundfos ALPHA2", "klassikaline elektrooniline pump suurematele süsteemidele", "264–863 €"],
        ["MAGNA1", "kortermajad ja ärihooned — suured vooluhulgad", "432–1681 €"],
        ["MAGNA3", "ärihooned ja tööstus — kõrgeim tõste ja juhtimisvõimalused", "534–2456 €"],
      ],
    },
    faqTitle: "Korduma kippuvad küsimused",
    faq: [
      {
        q: "Milline on parim küttepump eramusse?",
        a: "Enamike eramute radiaatorküttesüsteemi jaoks on parim valik ALPHA1 GO — see asendab enamik vanu UPS ja ALPHA1 pumpasid sama ühendusmõõduga ja AUTOADAPT seab tööpunkti automaatselt. Põrandaküttele ja suurematele süsteemidele sobib ALPHA2 GO.",
      },
      {
        q: "Kui palju maksab küttepump?",
        a: "Kodused mudelid maksavad meie valikus 170–457 € (ALPHA1 L ja ALPHA1 GO alates 170 €, ALPHA2 GO kuni 457 €). Suurematesse hoonetesse mõeldud MAGNA1 algab 432 € ja MAGNA3 534 €.",
      },
      {
        q: "Mis vahe on ALPHA1 GO ja ALPHA2 GO mudelil?",
        a: "Mõlemad on intelligentsed tsirkulatsioonipumbad koos Grundfos GO äpi toega. ALPHA1 GO sobib enamikele eramute radiaatorküttesüsteemidele, ALPHA2 GO on võimsam ja sobib põrandaküttele, suurematele süsteemidele ning kohtadesse, kus on vaja kõrgemat tõstet.",
      },
      {
        q: "Kas uus ALPHA GO sobib vana UPS pumba asemele?",
        a: "Jah — ALPHA1 GO ja ALPHA2 GO on saadaval samade 130 mm ja 180 mm ühendusmõõtudega mis vanad UPS ja ALPHA mudelid, seega torustikku pole vaja ümber teha. Grundfos GO äpp juhendab asenduse ja seadistuse samm-sammult.",
      },
      {
        q: "Kui palju uus küttepump elektrit säästab?",
        a: "Vana kolme käiguga pump tarbib tüüpiliselt 60–90 W, uus elektrooniline ALPHA vaid 5–45 W — sääst on kuni 80 %. Kuna küttepump töötab küttehooajal pidevalt, maksab uus pump end enamasti 1–3 aastaga tagasi.",
      },
      {
        q: "Millist küttepumpa soovitatakse põrandaküttele?",
        a: "Põrandaküttesüsteemidele, kus pump töötab pidevalt väikese võimsusega, sobib ALPHA2 GO — täpne juhtimine hoiab vooluhulga ühtlasena ja tarbib vähe elektrit. Suuremate põrandaküttesüsteemide ja ärihoonete jaoks on õige valik MAGNA1 või MAGNA3.",
      },
    ],
  },
  en: {
    guideTitle: "How to choose a heating circulator pump?",
    guideParagraphs: [
      "A heating pump (circulator) moves water around central heating and underfloor heating systems. The right choice depends on the system type (radiators or underfloor), the required head and flow, and the pump's port-to-port length — new Grundfos ALPHA pumps share the same 130 mm or 180 mm dimensions as old UPS models, so replacement needs no pipework changes.",
      "If the house has an old three-speed UPS, there are two direct replacements: the affordable ALPHA1 L (simple speed selection) or the intelligent ALPHA1 GO and ALPHA2 GO, whose AUTOADAPT mode sets the duty point automatically while the Grundfos GO app guides installation step by step.",
      "For a radiator-heated house, ALPHA1 GO is usually enough; ALPHA2 GO suits underfloor heating and larger systems. For apartment blocks, commercial buildings and industry with larger flows and heads, there are the MAGNA1 and MAGNA3 ranges.",
      "A new electronic pump typically uses 5–45 W instead of the old 60–90 W — electricity savings of up to 80%, so the pump usually pays for itself within 1–3 years.",
    ],
    priceTitle: "Heating pump prices",
    priceIntro:
      "The price depends on the series and capacity. Below are the price ranges of our selection with a recommendation on when each series fits best.",
    priceTable: {
      head: ["Series", "Best for", "Price range"],
      rows: [
        ["ALPHA1 L", "the simplest replacement for an old pump — speed selection", "170–226 €"],
        ["ALPHA1 GO", "replaces most old UPS and ALPHA1 pumps — radiator heating in houses", "170–249 €"],
        ["ALPHA2 GO", "top model — underfloor heating and larger systems, GO app", "264–457 €"],
        ["Grundfos ALPHA2", "classic electronic pump for larger systems", "264–863 €"],
        ["MAGNA1", "apartment blocks and commercial buildings — large flows", "432–1681 €"],
        ["MAGNA3", "commercial and industrial — highest head and control options", "534–2456 €"],
      ],
    },
    faqTitle: "Frequently asked questions",
    faq: [
      {
        q: "Which heating pump is best for a house?",
        a: "For most radiator-heated houses the best choice is ALPHA1 GO — it replaces most old UPS and ALPHA1 pumps with the same port-to-port length and AUTOADAPT sets the duty point automatically. For underfloor heating and larger systems, choose ALPHA2 GO.",
      },
      {
        q: "How much does a heating pump cost?",
        a: "Domestic models in our range cost 170–457 € (ALPHA1 L and ALPHA1 GO from 170 €, ALPHA2 GO up to 457 €). MAGNA1 for larger buildings starts at 432 € and MAGNA3 at 534 €.",
      },
      {
        q: "What is the difference between ALPHA1 GO and ALPHA2 GO?",
        a: "Both are intelligent circulators with the Grundfos GO app. ALPHA1 GO suits most radiator systems in houses; ALPHA2 GO is more powerful and suits underfloor heating, larger systems and applications needing a higher head.",
      },
      {
        q: "Does the new ALPHA GO fit in place of an old UPS pump?",
        a: "Yes — ALPHA1 GO and ALPHA2 GO are available in the same 130 mm and 180 mm port-to-port lengths as the old UPS and ALPHA models, so no pipework changes are needed. The Grundfos GO app guides replacement and setup step by step.",
      },
      {
        q: "How much electricity does a new heating pump save?",
        a: "An old three-speed pump typically uses 60–90 W, a new electronic ALPHA only 5–45 W — savings of up to 80%. As the circulator runs continuously through the heating season, the new pump usually pays for itself within 1–3 years.",
      },
      {
        q: "Which heating pump is recommended for underfloor heating?",
        a: "For underfloor systems, where the pump runs continuously at low power, ALPHA2 GO fits well — precise control keeps the flow even and electricity use low. For larger underfloor systems and commercial buildings, MAGNA1 or MAGNA3 is the right choice.",
      },
    ],
  },
  ru: {
    guideTitle: "Как выбрать циркуляционный насос для отопления?",
    guideParagraphs: [
      "Насос отопления (циркуляционный насос) перемещает воду в системе радиаторного отопления и тёплого пола. Правильный выбор зависит от типа системы (радиаторы или тёплый пол), требуемого напора и расхода, а также монтажной длины насоса — у новых Grundfos ALPHA те же 130 или 180 мм, что и у старых UPS, поэтому замена не требует переделки труб.",
      "Если в доме стоит старый трёхскоростной UPS, есть две прямые замены: доступная ALPHA1 L (простой выбор ступени) или интеллектуальные ALPHA1 GO и ALPHA2 GO с режимом AUTOADAPT, который сам настраивает рабочую точку, а приложение Grundfos GO ведёт установку шаг за шагом.",
      "Для дома с радиаторным отоплением обычно достаточно ALPHA1 GO; для тёплого пола и больших систем подходит ALPHA2 GO. Для многоквартирных и коммерческих зданий с большими расходами и напорами — серии MAGNA1 и MAGNA3.",
      "Новый электронный насос потребляет обычно 5–45 Вт вместо старых 60–90 Вт — экономия электричества до 80 %, поэтому насос обычно окупается за 1–3 года.",
    ],
    priceTitle: "Цена насоса отопления",
    priceIntro:
      "Цена зависит от серии и мощности. Ниже — диапазоны цен нашего ассортимента с рекомендацией, когда какая серия подходит лучше.",
    priceTable: {
      head: ["Серия", "Применение", "Диапазон цен"],
      rows: [
        ["ALPHA1 L", "простейшая замена старого насоса — выбор ступени", "170–226 €"],
        ["ALPHA1 GO", "заменяет большинство старых UPS и ALPHA1 — радиаторное отопление дома", "170–249 €"],
        ["ALPHA2 GO", "топ-модель — тёплый пол и большие системы, приложение GO", "264–457 €"],
        ["Grundfos ALPHA2", "классический электронный насос для больших систем", "264–863 €"],
        ["MAGNA1", "многоквартирные и коммерческие здания — большие расходы", "432–1681 €"],
        ["MAGNA3", "коммерческие и промышленные объекты — максимальный напор и управление", "534–2456 €"],
      ],
    },
    faqTitle: "Часто задаваемые вопросы",
    faq: [
      {
        q: "Какой насос отопления лучший для частного дома?",
        a: "Для большинства домов с радиаторами лучший выбор — ALPHA1 GO: он заменяет большинство старых UPS и ALPHA1 с той же монтажной длиной, а AUTOADAPT сам настраивает рабочую точку. Для тёплого пола и больших систем выбирайте ALPHA2 GO.",
      },
      {
        q: "Сколько стоит насос отопления?",
        a: "Бытовые модели в нашем ассортименте стоят 170–457 € (ALPHA1 L и ALPHA1 GO от 170 €, ALPHA2 GO до 457 €). MAGNA1 для больших зданий начинается от 432 €, MAGNA3 — от 534 €.",
      },
      {
        q: "Чем отличаются ALPHA1 GO и ALPHA2 GO?",
        a: "Оба — интеллектуальные циркуляционные насосы с приложением Grundfos GO. ALPHA1 GO подходит большинству радиаторных систем дома, ALPHA2 GO мощнее и подходит для тёплого пола, больших систем и там, где нужен больший напор.",
      },
      {
        q: "Подойдёт ли новый ALPHA GO вместо старого UPS?",
        a: "Да — ALPHA1 GO и ALPHA2 GO выпускаются с теми же монтажными длинами 130 и 180 мм, что старые UPS и ALPHA, поэтому трубы переделывать не нужно. Приложение Grundfos GO ведёт замену и настройку шаг за шагом.",
      },
      {
        q: "Сколько электричества экономит новый насос отопления?",
        a: "Старый трёхскоростной насос потребляет обычно 60–90 Вт, новый электронный ALPHA — всего 5–45 Вт, экономия до 80 %. Так как насос работает весь отопительный сезон, новый насос обычно окупается за 1–3 года.",
      },
      {
        q: "Какой насос рекомендуется для тёплого пола?",
        a: "Для систем тёплого пола, где насос работает постоянно на малой мощности, подходит ALPHA2 GO — точное управление держит расход равномерным и потребляет мало электричества. Для больших систем и коммерческих зданий правильный выбор — MAGNA1 или MAGNA3.",
      },
    ],
  },
  lv: {
    guideTitle: "Kā izvēlēties apkures cirkulācijas sūkni?",
    guideParagraphs: [
      "Apkures sūknis (cirkulācijas sūknis) pārvieto ūdeni radiatoru un grīdas apkures sistēmās. Pareizā izvēle ir atkarīga no sistēmas veida (radiatori vai grīdas apsilde), vajadzīgā pacēluma un plūsmas, kā arī sūkņa uzstādīšanas garuma — jaunajiem Grundfos ALPHA sūkņiem ir tādi paši 130 mm vai 180 mm izmēri kā vecajiem UPS modeļiem, tāpēc nomaiņai nav jāpārtaisa cauruļvadi.",
      "Ja mājā ir vecs trīs ātrumu UPS sūknis, ir divas tiešas aizstāšanas iespējas: pieejamais ALPHA1 L (vienkārša ātruma izvēle) vai viedie ALPHA1 GO un ALPHA2 GO, kuru AUTOADAPT režīms pats iestata darba punktu, bet Grundfos GO lietotne vada uzstādīšanu soli pa solim.",
      "Mājai ar radiatoru apkuri parasti pietiek ar ALPHA1 GO; grīdas apkurei un lielākām sistēmām der ALPHA2 GO. Dzīvojamām un komercēkām ar lielākām plūsmām un pacēlumiem paredzētas MAGNA1 un MAGNA3 sērijas.",
      "Jaunais elektroniskais sūknis patērē parasti 5–45 W vecā 60–90 W vietā — elektroenerģijas ietaupījums līdz 80 %, tāpēc sūknis parasti atmaksājas 1–3 gados.",
    ],
    priceTitle: "Apkures sūkņa cena",
    priceIntro:
      "Cena ir atkarīga no sērijas un jaudas. Zemāk ir mūsu klāsta cenu diapazoni ar ieteikumu, kad kura sērija der vislabāk.",
    priceTable: {
      head: ["Sērija", "Pielietojums", "Cenu diapazons"],
      rows: [
        ["ALPHA1 L", "vienkāršākā vecā sūkņa aizstāšana — ātruma izvēle", "170–226 €"],
        ["ALPHA1 GO", "aizstāj lielāko daļu veco UPS un ALPHA1 — mājas radiatoru apkure", "170–249 €"],
        ["ALPHA2 GO", "topmodelis — grīdas apsilde un lielākas sistēmas, GO lietotne", "264–457 €"],
        ["Grundfos ALPHA2", "klasiskais elektroniskais sūknis lielākām sistēmām", "264–863 €"],
        ["MAGNA1", "dzīvojamās un komercēkas — lielās plūsmas", "432–1681 €"],
        ["MAGNA3", "komercēkas un rūpniecība — augstākais pacēlums un vadība", "534–2456 €"],
      ],
    },
    faqTitle: "Bieži uzdotie jautājumi",
    faq: [
      {
        q: "Kurš apkures sūknis ir labākais privātmājai?",
        a: "Vairumam māju ar radiatoru apkuri labākā izvēle ir ALPHA1 GO — tas aizstāj lielāko daļu veco UPS un ALPHA1 sūkņu ar tādu pašu uzstādīšanas garumu, un AUTOADAPT automātiski iestata darba punktu. Grīdas apkurei un lielākām sistēmām izvēlieties ALPHA2 GO.",
      },
      {
        q: "Cik maksā apkures sūknis?",
        a: "Mājsaimniecības modeļi mūsu klāstā maksā 170–457 € (ALPHA1 L un ALPHA1 GO no 170 €, ALPHA2 GO līdz 457 €). MAGNA1 lielākām ēkām sākas no 432 € un MAGNA3 no 534 €.",
      },
      {
        q: "Kāda ir atšķirība starp ALPHA1 GO un ALPHA2 GO?",
        a: "Abi ir viedie cirkulācijas sūkņi ar Grundfos GO lietotni. ALPHA1 GO der vairumam mājas radiatoru sistēmu, ALPHA2 GO ir jaudīgāks un der grīdas apkurei, lielākām sistēmām un vietām, kur vajadzīgs lielāks pacēlums.",
      },
      {
        q: "Vai jaunais ALPHA GO der vecā UPS vietā?",
        a: "Jā — ALPHA1 GO un ALPHA2 GO ir pieejami tādos pašos 130 mm un 180 mm uzstādīšanas garumos kā veciem UPS un ALPHA modeļiem, tāpēc cauruļvadi nav jāpārtaisa. Grundfos GO lietotne vada nomaiņu un iestatīšanu soli pa solim.",
      },
      {
        q: "Cik daudz elektroenerģijas jaunais apkures sūknis ietaupa?",
        a: "Vecais trīs ātrumu sūknis parasti patērē 60–90 W, jaunais elektroniskais ALPHA tikai 5–45 W — ietaupījums līdz 80 %. Tā kā sūknis visu apkures sezonu darbojas nepārtraukti, jaunais sūknis parasti atmaksājas 1–3 gados.",
      },
      {
        q: "Kādu apkures sūkni iesaka grīdas apkurei?",
        a: "Grīdas apkures sistēmām, kur sūknis nepārtraukti darbojas mazā jaudā, der ALPHA2 GO — precīza vadība uztur vienmērīgu plūsmu un patērē maz elektroenerģijas. Lielākām sistēmām un komercēkām pareizā izvēle ir MAGNA1 vai MAGNA3.",
      },
    ],
  },
  lt: {
    guideTitle: "Kaip išsirinkti šildymo cirkuliacinį siurblį?",
    guideParagraphs: [
      "Šildymo siurblys (cirkuliacinis siurblys) varo vandenį radiatorių ir grindinio šildymo sistemose. Tinkamas pasirinkimas priklauso nuo sistemos tipo (radiatoriai ar grindinis šildymas), reikiamo slėgio ir srauto bei siurblio montavimo ilgio — naujieji Grundfos ALPHA turi tuos pačius 130 mm arba 180 mm matmenis kaip seni UPS modeliai, todėl vamzdynų perdarinėti nereikia.",
      "Jei name yra senas trigreitis UPS, yra du tiesioginiai pakaitalai: prieinamas ALPHA1 L (paprastas pakopos pasirinkimas) arba išmanieji ALPHA1 GO ir ALPHA2 GO, kurių AUTOADAPT režimas pats nustato darbo tašką, o Grundfos GO programėlė veda montavimą žingsnis po žingsnio.",
      "Namui su radiatorių šildymu paprastai užtenka ALPHA1 GO; grindiniam šildymui ir didesnėms sistemoms tinka ALPHA2 GO. Daugiabučiams ir komerciniams pastatams su didesniais srautais ir slėgiais skirtos MAGNA1 ir MAGNA3 serijos.",
      "Naujas elektroninis siurblys paprastai naudoja 5–45 W vietoj senųjų 60–90 W — elektros santaupos siekia iki 80 %, todėl siurblys dažniausiai atsiperka per 1–3 metus.",
    ],
    priceTitle: "Šildymo siurblio kaina",
    priceIntro:
      "Kaina priklauso nuo serijos ir galingumo. Žemiau pateikiami mūsų asortimento kainų diapazonai su rekomendacija, kada kuri serija tinka geriausiai.",
    priceTable: {
      head: ["Serija", "Paskirtis", "Kainų diapazonas"],
      rows: [
        ["ALPHA1 L", "paprasčiausias seno siurblio pakaitalas — pakopos pasirinkimas", "170–226 €"],
        ["ALPHA1 GO", "pakeičia daugumą senų UPS ir ALPHA1 — namų radiatorių šildymas", "170–249 €"],
        ["ALPHA2 GO", "top modelis — grindinis šildymas ir didesnės sistemos, GO programėlė", "264–457 €"],
        ["Grundfos ALPHA2", "klasikinis elektroninis siurblys didesnėms sistemoms", "264–863 €"],
        ["MAGNA1", "daugiabučiai ir komerciniai pastatai — dideli srautai", "432–1681 €"],
        ["MAGNA3", "komerciniai ir pramoniniai objektai — didžiausias slėgis ir valdymas", "534–2456 €"],
      ],
    },
    faqTitle: "Dažnai užduodami klausimai",
    faq: [
      {
        q: "Kuris šildymo siurblys geriausias individualiam namui?",
        a: "Daugumai namų su radiatorių šildymu geriausias pasirinkimas yra ALPHA1 GO — jis pakeičia daugumą senų UPS ir ALPHA1 siurblių tuo pačiu montavimo ilgiu, o AUTOADAPT automatiškai nustato darbo tašką. Grindiniam šildymui ir didesnėms sistemoms rinkitės ALPHA2 GO.",
      },
      {
        q: "Kiek kainuoja šildymo siurblys?",
        a: "Buitiniai modeliai mūsų asortimente kainuoja 170–457 € (ALPHA1 L ir ALPHA1 GO nuo 170 €, ALPHA2 GO iki 457 €). MAGNA1 didesniems pastatams prasideda nuo 432 €, MAGNA3 — nuo 534 €.",
      },
      {
        q: "Kuo skiriasi ALPHA1 GO ir ALPHA2 GO?",
        a: "Abu yra išmanieji cirkuliaciniai siurbliai su Grundfos GO programėle. ALPHA1 GO tinka daugumai namų radiatorių sistemų, ALPHA2 GO galingesnis ir tinka grindiniam šildymui, didesnėms sistemoms ir ten, kur reikia didesnio slėgio.",
      },
      {
        q: "Ar naujas ALPHA GO tinka seno UPS vietoje?",
        a: "Taip — ALPHA1 GO ir ALPHA2 GO gaminami su tais pačiais 130 mm ir 180 mm montavimo ilgiais kaip seni UPS ir ALPHA modeliai, todėl vamzdynų perdarinėti nereikia. Grundfos GO programėlė veda keitimą ir nustatymą žingsnis po žingsnio.",
      },
      {
        q: "Kiek elektros sutaupo naujas šildymo siurblys?",
        a: "Senas trigreitis siurblys paprastai naudoja 60–90 W, naujas elektroninis ALPHA — tik 5–45 W, santaupos iki 80 %. Kadangi siurblys visą šildymo sezoną dirba nepaliaujamai, naujas siurblys dažniausiai atsiperka per 1–3 metus.",
      },
      {
        q: "Kokį šildymo siurblį rekomenduojama grindiniam šildymui?",
        a: "Grindinio šildymo sistemoms, kuriose siurblys nuolat dirba maža galia, tinka ALPHA2 GO — tikslus valdymas palaiko tolygų srautą ir naudoja mažai elektros. Didesnėms sistemoms ir komerciniams pastatams tinkamas pasirinkimas yra MAGNA1 arba MAGNA3.",
      },
    ],
  },
}

const DRENAAZIPUMBAD: Record<Locale, CategoryContentSection> = {
  et: {
    guideTitle: "Kuidas valida drenaažipump keldrile ja kaevikule?",
    guideParagraphs: [
      "Drenaažipump hoiab keldrid, kaevikud ja hoovid kuivana — see juhib pinnase- ja sademevee hoonest eemale. Õige valik sõltub vee puhtusest (puhas vs saastunud), vee mahust ja sellest, kas pump on ajutiseks hädaabiks või püsivasse paigalduseks.",
      "Unilift CC on kerge komposiitpump koduseks kasutamiseks ja hädaabiks — see eemaldab vee kuni 3 mm jäätasemeni, seega jääb põrand praktiliselt kuivaks. Sisseehitatud ujuvlüliti käivitab ja seiskab pumba automaatselt.",
      "Unilift KP on roostevabast terasest pump püsivasse paigalduseks drenaažikaevikusse või keldrisse — vastupidav konstruktsioon talub ka pidevat tööd sademeterohkel perioodil.",
      "Kui vesi on saastunud või vaja suurt vooluhulka (drenaaž, kaevikud, ka reovesi), on õige valik Unilift AP, mis läbib osakesi kuni 50 mm.",
    ],
    priceTitle: "Drenaažipumba hind",
    priceIntro:
      "Hind sõltub seeriast ja võimsusest. Allpool on meie valiku hinnavahemikud koos soovitusega, millal kumbki seeria kõige paremini sobib.",
    priceTable: {
      head: ["Seeria", "Sobivus", "Hinnavahemik"],
      rows: [
        ["Unilift CC", "kerge komposiitpump — kodune kasutus ja hädaabi, imab kuni 3 mm-ni", "173–351 €"],
        ["Unilift KP", "roostevaba pump püsivasse paigalduseks kaevikusse või keldrisse", "279–531 €"],
        ["Unilift AP", "suur vooluhulk ja osakesed kuni 50 mm — ka saastunud vesi ja reovesi", "551–937 €"],
      ],
    },
    faqTitle: "Korduma kippuvad küsimused",
    faq: [
      {
        q: "Milline on parim drenaažipump keldrile?",
        a: "Püsivasse paigalduseks keldri või kaeviku kuivana hoidmiseks on parim valik roostevabast terasest Unilift KP. Hädaabiks ja ajutiseks kasutamiseks sobib kerge Unilift CC, mis imab vee kuni 3 mm jäätasemeni.",
      },
      {
        q: "Kui palju maksab drenaažipump?",
        a: "Meie valikus algavad drenaažipumba hinnad 173 eurot (Unilift CC), roostevaba Unilift KP maksab 279–531 € ja suuremahuline Unilift AP 551–937 €.",
      },
      {
        q: "Mis vahe on Unilift CC ja KP seerial?",
        a: "CC on kerge komposiitpump, mis on mõeldud eelkõige mobiilseks kasutamiseks ja hädaabiks — see imab vee kuni 3 mm tasemeni. KP on roostevabast terasest ja vastupidavam, mõeldud püsivasse paigalduseks kaevikusse või keldrisse.",
      },
      {
        q: "Kas drenaažipump töötab automaatselt?",
        a: "Jah — ujuvlülitiga mudelid käivituvad ja seiskuvad veetaseme järgi automaatselt. Nii võib pumba jätta kaevikusse püsivalt tööle ja see hoiab ruumi kuivana ka siis, kui kedagi kohal pole.",
      },
      {
        q: "Milline pump sobib saastunud vee või reovee jaoks?",
        a: "Kui vees on osakesi või tegemist on reoveega, vali Unilift AP, mis läbib osakesi kuni 50 mm. Tugevama reoveelahenduse jaoks (nt septikust kanalisatsiooni) vaata meie reoveepumpade valikut.",
      },
      {
        q: "Kui madalale drenaažipump vee imab?",
        a: "Unilift CC eemaldab vee kuni 3 mm jäätasemeni — põrand jääb praktiliselt kuivaks. See teeb CC-st parima valiku üleujutuse järelseks kuivatamiseks.",
      },
    ],
  },
  en: {
    guideTitle: "How to choose a drainage pump for a basement or sump?",
    guideParagraphs: [
      "A drainage pump keeps basements, sumps and yards dry — it moves ground and rain water away from the building. The right choice depends on how clean the water is, the volume, and whether the pump is for emergency use or a permanent installation.",
      "Unilift CC is a lightweight composite pump for home and emergency use — it removes water down to a 3 mm level, so the floor is left practically dry. The built-in float switch starts and stops the pump automatically.",
      "Unilift KP is a stainless steel pump for permanent installation in a drainage sump or basement — the durable construction tolerates continuous work through wet seasons.",
      "If the water is dirty or a large flow is needed (drainage, sumps, even sewage), the right choice is Unilift AP, which passes particles up to 50 mm.",
    ],
    priceTitle: "Drainage pump prices",
    priceIntro:
      "The price depends on the series and capacity. Below are the price ranges of our selection with a recommendation on when each series fits best.",
    priceTable: {
      head: ["Series", "Best for", "Price range"],
      rows: [
        ["Unilift CC", "light composite pump — home and emergency use, drains to 3 mm", "173–351 €"],
        ["Unilift KP", "stainless steel pump for permanent installation in a sump or basement", "279–531 €"],
        ["Unilift AP", "large flow and particles up to 50 mm — dirty water and sewage too", "551–937 €"],
      ],
    },
    faqTitle: "Frequently asked questions",
    faq: [
      {
        q: "Which drainage pump is best for a basement?",
        a: "For a permanent installation keeping a basement or sump dry, the best choice is the stainless steel Unilift KP. For emergencies and temporary use, the lightweight Unilift CC fits well and drains water down to 3 mm.",
      },
      {
        q: "How much does a drainage pump cost?",
        a: "In our range, drainage pumps start at 173 € (Unilift CC); the stainless Unilift KP costs 279–531 € and the high-capacity Unilift AP 551–937 €.",
      },
      {
        q: "What is the difference between Unilift CC and KP?",
        a: "CC is a lightweight composite pump mainly for mobile use and emergencies — it drains to a 3 mm level. KP is stainless steel and more durable, made for permanent installation in a sump or basement.",
      },
      {
        q: "Does a drainage pump work automatically?",
        a: "Yes — models with a float switch start and stop automatically with the water level. The pump can be left working in the sump permanently and keeps the room dry even when nobody is around.",
      },
      {
        q: "Which pump suits dirty water or sewage?",
        a: "If the water contains particles or it is sewage, choose Unilift AP, which passes particles up to 50 mm. For a heavier sewage solution (e.g. pumping from a septic tank to the sewer), see our sewage pump selection.",
      },
      {
        q: "How low does a drainage pump drain?",
        a: "Unilift CC removes water down to a 3 mm level — the floor is left practically dry. That makes CC the best choice for drying out after a flood.",
      },
    ],
  },
  ru: {
    guideTitle: "Как выбрать дренажный насос для подвала или колодца?",
    guideParagraphs: [
      "Дренажный насос держит подвалы, колодцы и дворы сухими — он отводит грунтовую и дождевую воду от здания. Правильный выбор зависит от чистоты воды, объёма и того, нужен насос для аварийного случая или для постоянной установки.",
      "Unilift CC — лёгкий композитный насос для дома и аварийных ситуаций: он удаляет воду до уровня 3 мм, поэтому пол остаётся практически сухим. Встроенный поплавковый выключатель включает и выключает насос автоматически.",
      "Unilift KP — насос из нержавеющей стали для постоянной установки в дренажный колодец или подвал; прочная конструкция выдерживает непрерывную работу в дождливый сезон.",
      "Если вода загрязнена или нужен большой расход (дренаж, колодцы, даже канализация), правильный выбор — Unilift AP, пропускающий частицы до 50 мм.",
    ],
    priceTitle: "Цена дренажного насоса",
    priceIntro:
      "Цена зависит от серии и мощности. Ниже — диапазоны цен нашего ассортимента с рекомендацией, когда какая серия подходит лучше.",
    priceTable: {
      head: ["Серия", "Применение", "Диапазон цен"],
      rows: [
        ["Unilift CC", "лёгкий композитный насос — дом и аварийные случаи, откачивает до 3 мм", "173–351 €"],
        ["Unilift KP", "насос из нержавеющей стали для постоянной установки в колодец или подвал", "279–531 €"],
        ["Unilift AP", "большой расход и частицы до 50 мм — загрязнённая вода и канализация", "551–937 €"],
      ],
    },
    faqTitle: "Часто задаваемые вопросы",
    faq: [
      {
        q: "Какой дренажный насос лучший для подвала?",
        a: "Для постоянной установки, держащей подвал или колодец сухим, лучший выбор — Unilift KP из нержавеющей стали. Для аварийных случаев подходит лёгкий Unilift CC, откачивающий воду до 3 мм.",
      },
      {
        q: "Сколько стоит дренажный насос?",
        a: "В нашем ассортименте дренажные насосы начинаются от 173 € (Unilift CC); нержавеющий Unilift KP стоит 279–531 €, а производительный Unilift AP — 551–937 €.",
      },
      {
        q: "Чем отличаются Unilift CC и KP?",
        a: "CC — лёгкий композитный насос в основном для мобильного и аварийного применения, откачивает до уровня 3 мм. KP — из нержавеющей стали и долговечнее, предназначен для постоянной установки в колодец или подвал.",
      },
      {
        q: "Работает ли дренажный насос автоматически?",
        a: "Да — модели с поплавковым выключателем включаются и выключаются по уровню воды автоматически. Насос можно оставить в колодце постоянно, и он будет держать помещение сухим даже в ваше отсутствие.",
      },
      {
        q: "Какой насос подходит для грязной воды или канализации?",
        a: "Если в воде есть частицы или это сточные воды, выбирайте Unilift AP, пропускающий частицы до 50 мм. Для более серьёзных задач (например, откачка из септика в канализацию) смотрите наш выбор фекальных насосов.",
      },
      {
        q: "До какого уровня откачивает дренажный насос?",
        a: "Unilift CC удаляет воду до уровня 3 мм — пол остаётся практически сухим. Поэтому CC — лучший выбор для осушения после затопления.",
      },
    ],
  },
  lv: {
    guideTitle: "Kā izvēlēties drenāžas sūkni pagrabam vai akai?",
    guideParagraphs: [
      "Drenāžas sūknis uztur pagrabus, akas un pagalmus sausus — tas novada grunts un lietus ūdeni prom no ēkas. Pareizā izvēle ir atkarīga no ūdens tīrības, apjoma un no tā, vai sūknis vajadzīgs avārijas gadījumiem vai pastāvīgai uzstādīšanai.",
      "Unilift CC ir viegls kompozīta sūknis mājas un avārijas lietošanai — tas izsūknē ūdeni līdz 3 mm līmenim, tāpēc grīda paliek praktiski sausa. Iebūvētais pludiņslēdzis sūkni ieslēdz un izslēdz automātiski.",
      "Unilift KP ir nerūsējošā tērauda sūknis pastāvīgai uzstādīšanai drenāžas akā vai pagrabā — izturīgā konstrukcija iztur nepārtrauktu darbu mitrā sezonā.",
      "Ja ūdens ir netīrs vai vajadzīga liela plūsma (drenāža, akas, pat notekūdeņi), pareizā izvēle ir Unilift AP, kas izlaiž līdz 50 mm lielās daļiņas.",
    ],
    priceTitle: "Drenāžas sūkņa cena",
    priceIntro:
      "Cena ir atkarīga no sērijas un jaudas. Zemāk ir mūsu klāsta cenu diapazoni ar ieteikumu, kad kura sērija der vislabāk.",
    priceTable: {
      head: ["Sērija", "Pielietojums", "Cenu diapazons"],
      rows: [
        ["Unilift CC", "viegls kompozīta sūknis — mājas un avārijas lietošana, izsūknē līdz 3 mm", "173–351 €"],
        ["Unilift KP", "nerūsējošā tērauda sūknis pastāvīgai uzstādīšanai akā vai pagrabā", "279–531 €"],
        ["Unilift AP", "liela plūsma un daļiņas līdz 50 mm — arī netīrs ūdens un notekūdeņi", "551–937 €"],
      ],
    },
    faqTitle: "Bieži uzdotie jautājumi",
    faq: [
      {
        q: "Kurš drenāžas sūknis ir labākais pagrabam?",
        a: "Pastāvīgai uzstādīšanai, kas uztur pagrabu vai aku sausu, labākā izvēle ir nerūsējošā tērauda Unilift KP. Avārijām un īslaicīgai lietošanai der vieglais Unilift CC, kas izsūknē ūdeni līdz 3 mm.",
      },
      {
        q: "Cik maksā drenāžas sūknis?",
        a: "Mūsu klāstā drenāžas sūkņu cenas sākas no 173 € (Unilift CC); nerūsējošā tērauda Unilift KP maksā 279–531 € un jaudīgais Unilift AP 551–937 €.",
      },
      {
        q: "Kāda ir atšķirība starp Unilift CC un KP?",
        a: "CC ir viegls kompozīta sūknis galvenokārt mobilai un avārijas lietošanai — izsūknē līdz 3 mm līmenim. KP ir no nerūsējošā tērauda un izturīgāks, paredzēts pastāvīgai uzstādīšanai akā vai pagrabā.",
      },
      {
        q: "Vai drenāžas sūknis darbojas automātiski?",
        a: "Jā — modeļi ar pludiņslēdzi ieslēdzas un izslēdzas automātiski atkarībā no ūdens līmeņa. Sūkni var atstāt akā pastāvīgi, un tas uztur telpu sausu arī tad, kad neviens nav klāt.",
      },
      {
        q: "Kurš sūknis der netīram ūdenim vai notekūdeņiem?",
        a: "Ja ūdenī ir daļiņas vai tie ir notekūdeņi, izvēlieties Unilift AP, kas izlaiž daļiņas līdz 50 mm. Jaudīgākam risinājumam (piemēram, no septiķa uz kanalizāciju) skatiet mūsu notekūdeņu sūkņu klāstu.",
      },
      {
        q: "Cik zemu drenāžas sūknis izsūknē ūdeni?",
        a: "Unilift CC izsūknē ūdeni līdz 3 mm līmenim — grīda paliek praktiski sausa. Tāpēc CC ir labākā izvēle žāvēšanai pēc plūdiem.",
      },
    ],
  },
  lt: {
    guideTitle: "Kaip išsirinkti drenažinį siurblį rūsiui ar šuliniui?",
    guideParagraphs: [
      "Drenažinis siurblys palaiko rūsius, šulinius ir kiemus sausus — jis nuveda gruntinį ir lietaus vandenį nuo pastato. Tinkamas pasirinkimas priklauso nuo vandens švaros, kiekio ir to, ar siurblys reikalingas avarijai, ar nuolatiniam montavimui.",
      "Unilift CC yra lengvas kompozitinis siurblys buitiniam ir avariniam naudojimui — jis išsiurbia vandenį iki 3 mm lygio, todėl grindys lieka praktiškai sausos. Integruotas plūdinis jungiklis siurblį įjungia ir išjungia automatiškai.",
      "Unilift KP yra nerūdijančiojo plieno siurblys nuolatiniam montavimui drenažo šulinyje ar rūsyje — tvirta konstrukcija atlaiko nuolatinį darbą drėgnuoju sezonu.",
      "Jei vanduo nešvarus ar reikia didelio srauto (drenažas, šuliniai, net nuotekos), tinkamas pasirinkimas yra Unilift AP, praleidžiantis iki 50 mm daleles.",
    ],
    priceTitle: "Drenažinio siurblio kaina",
    priceIntro:
      "Kaina priklauso nuo serijos ir galingumo. Žemiau pateikiami mūsų asortimento kainų diapazonai su rekomendacija, kada kuri serija tinka geriausiai.",
    priceTable: {
      head: ["Serija", "Paskirtis", "Kainų diapazonas"],
      rows: [
        ["Unilift CC", "lengvas kompozitinis siurblys — buitis ir avarijos, išsiurbia iki 3 mm", "173–351 €"],
        ["Unilift KP", "nerūdijančiojo plieno siurblys nuolatiniam montavimui šulinyje ar rūsyje", "279–531 €"],
        ["Unilift AP", "didelis srautas ir dalelės iki 50 mm — nešvarus vanduo ir nuotekos", "551–937 €"],
      ],
    },
    faqTitle: "Dažnai užduodami klausimai",
    faq: [
      {
        q: "Kuris drenažinis siurblys geriausias rūsiui?",
        a: "Nuolatiniam montavimui, palaikančiam rūsį ar šulinį sausą, geriausias pasirinkimas yra nerūdijančiojo plieno Unilift KP. Avarijoms ir laikiniems darbams tinka lengvas Unilift CC, išsiurbiantis vandenį iki 3 mm.",
      },
      {
        q: "Kiek kainuoja drenažinis siurblys?",
        a: "Mūsų asortimente drenažinių siurblių kainos prasideda nuo 173 € (Unilift CC); nerūdijančiojo plieno Unilift KP kainuoja 279–531 €, o galingas Unilift AP — 551–937 €.",
      },
      {
        q: "Kuo skiriasi Unilift CC ir KP?",
        a: "CC yra lengvas kompozitinis siurblys, skirtas daugiausia mobiliojam ir avariniam naudojimui — išsiurbia iki 3 mm lygio. KP yra nerūdijančiojo plieno ir tvirtesnis, skirtas nuolatiniam montavimui šulinyje ar rūsyje.",
      },
      {
        q: "Ar drenažinis siurblys veikia automatiškai?",
        a: "Taip — modeliai su plūdiniu jungikliu įsijungia ir išsijungia automatiškai pagal vandens lygį. Siurblį galima palikti šulinyje nuolat, ir jis palaikys patalpą sausą net niekam nesant.",
      },
      {
        q: "Kuris siurblys tinka nešvariam vandeniui ar nuotekoms?",
        a: "Jei vandenyje yra dalelių arba tai nuotekos, rinkitės Unilift AP, praleidžiantį daleles iki 50 mm. Galingesniam sprendimui (pvz., iš septiko į kanalizaciją) žiūrėkite mūsų nuotekų siurblių asortimentą.",
      },
      {
        q: "Iki kokio lygio drenažinis siurblys išsiurbia vandenį?",
        a: "Unilift CC išsiurbia vandenį iki 3 mm lygio — grindys lieka praktiškai sausos. Todėl CC yra geriausias pasirinkimas džiovinimui po potvynio.",
      },
    ],
  },
}

const PUURKAEVUPUMBAD: Record<Locale, CategoryContentSection> = {
  et: {
    guideTitle: "Kuidas valida puurkaevupump?",
    guideParagraphs: [
      "Puurkaevupump (süvaveepump) langetatakse kaevu ja tõstab vee maa sügavusest majja. Õige valik sõltub kaevu sisediameetrist (3-tollised SQ ja SQE kitsastesse kaevudesse, 4-tollised SP laiematesse), kaevu sügavusest ja vajalikust vooluhulgast.",
      "Grundfos SQ on kõik-ühes lahendus eramu kaevule — pumbal on sisseehitatud kuivakäimise kaitse ja pehme käivitus, seega eraldi juhtkasti pole vaja.",
      "Grundfos SQE on SQ muutuva pööretega versioon: koos CU301 juhtkarbiga hoiab see veerõhu püsivana ka siis, kui tarbimine kõigub (üks kraan või mitu korraga).",
      "Suuremate vooluhulkade ja tõstete jaoks — talud, suured aiad, kastmine ja tööstus — on Grundfos SP seeria, mida on saadaval paljudes võimsustes.",
    ],
    priceTitle: "Puurkaevupumba hind",
    priceIntro:
      "Hind sõltub seeriast ja võimsusest. Allpool on meie valiku hinnavahemikud koos soovitusega, millal kumbki seeria kõige paremini sobib.",
    priceTable: {
      head: ["Seeria", "Sobivus", "Hinnavahemik"],
      rows: [
        ["Grundfos SQ", "3-tolline kõik-ühes pump eramu kaevule — integreeritud kaitse", "741–1334 €"],
        ["Grundfos SQE", "muutuv pööre + CU301 — püsiv veerõhk", "810–1447 €"],
        ["Grundfos SQE komplektid", "pump koos juhtkarbiga ja tarvikutega", "400–1676 €"],
        ["Grundfos SP", "suured vooluhulgad ja tõsted — talud, kastmine, tööstus", "694–2172 €"],
      ],
    },
    faqTitle: "Korduma kippuvad küsimused",
    faq: [
      {
        q: "Milline on parim puurkaevupump eramu kaevule?",
        a: "Enamike eramute kaevude jaoks on parim valik Grundfos SQ — see on kitsas 3-tolline pump koos sisseehitatud kuivakäimise kaitse ja pehme käivitusega. Kui soovid püsivat veerõhku ka muutuva tarbimise korral, vali SQE koos CU301 juhtkarbiga.",
      },
      {
        q: "Kui palju maksab puurkaevupump?",
        a: "Eramu kaevule mõeldud Grundfos SQ maksab meie valikus 741–1334 € ja SQE 810–1447 € sõltuvalt võimsusest. Suuremate vooluhulkade jaoks mõeldud SP seeria on 694–2172 €.",
      },
      {
        q: "Mis vahe on Grundfos SQ ja SQE pumbal?",
        a: "SQ töötab püsiva pöörete arvuga ja sel on kogu kaitse sisseehitatud — eraldi juhtkasti pole vaja. SQE on muutuva pööretega versioon, mis koos CU301 juhtkarbiga hoiab veerõhu täpselt püsivana olenemata sellest, kui palju kraane korraga avatud on.",
      },
      {
        q: "Kas SQ sobib minu kaevu?",
        a: "SQ välisläbimõõt on 74 mm, seega sobib see 3-tollisesse (76 mm) ja suurematesse kaevudesse. Mõõda kaevu sisediameeter ja sügavus — nende andmetega leiame mudeli, mis annab vajaliku tõste ja vooluhulga.",
      },
      {
        q: "Kas pumbal on kuivakäimise kaitse?",
        a: "Jah — Grundfos SQ ja SQE pumpadel on kuivakäimise kaitse sisseehitatud: kui kaevu vesi lõppeb, pump seiskub automaatselt ja kaitseb end kahjustuste eest.",
      },
      {
        q: "Kui sügavalt puurkaevupump vett tõstab?",
        a: "Tõste sõltub mudelist: SQ ja SQE mudelivalikus on pumpe kuni 150 m tõstega. Õige mudeli leiab kaevu sügavuse, veetaseme ja vajaliku vooluhulga järgi — aitame valikuga tasuta.",
      },
    ],
  },
  en: {
    guideTitle: "How to choose a borehole pump?",
    guideParagraphs: [
      "A borehole (deep well) pump is lowered into the borehole and lifts water up to the house. The right choice depends on the borehole's inner diameter (3-inch SQ and SQE for narrow wells, 4-inch SP for wider ones), the depth and the required flow.",
      "Grundfos SQ is an all-in-one solution for a house well — the pump has built-in dry-running protection and soft start, so no separate control box is needed.",
      "Grundfos SQE is the variable-speed version of the SQ: together with the CU301 control unit it keeps water pressure constant even when consumption varies (one tap or several at once).",
      "For larger flows and heads — farms, big gardens, irrigation and industry — there is the Grundfos SP range, available in many capacities.",
    ],
    priceTitle: "Borehole pump prices",
    priceIntro:
      "The price depends on the series and capacity. Below are the price ranges of our selection with a recommendation on when each series fits best.",
    priceTable: {
      head: ["Series", "Best for", "Price range"],
      rows: [
        ["Grundfos SQ", "3-inch all-in-one pump for house wells — built-in protection", "741–1334 €"],
        ["Grundfos SQE", "variable speed + CU301 — constant pressure", "810–1447 €"],
        ["Grundfos SQE kits", "pump with control unit and accessories", "400–1676 €"],
        ["Grundfos SP", "large flows and heads — farms, irrigation, industry", "694–2172 €"],
      ],
    },
    faqTitle: "Frequently asked questions",
    faq: [
      {
        q: "Which borehole pump is best for a house well?",
        a: "For most house wells the best choice is the Grundfos SQ — a narrow 3-inch pump with built-in dry-running protection and soft start. If you want constant pressure even with varying consumption, choose SQE with the CU301 control unit.",
      },
      {
        q: "How much does a borehole pump cost?",
        a: "The Grundfos SQ for house wells costs 741–1334 € and the SQE 810–1447 € depending on capacity in our range. The SP range for larger flows costs 694–2172 €.",
      },
      {
        q: "What is the difference between Grundfos SQ and SQE?",
        a: "The SQ runs at fixed speed with all protection built in — no separate control box needed. The SQE is the variable-speed version which, with the CU301 control unit, keeps the water pressure exactly constant regardless of how many taps are open.",
      },
      {
        q: "Does the SQ fit my borehole?",
        a: "The SQ's outer diameter is 74 mm, so it fits 3-inch (76 mm) and larger boreholes. Measure the borehole's inner diameter and depth — with those figures we can find the model giving the required head and flow.",
      },
      {
        q: "Does the pump have dry-running protection?",
        a: "Yes — Grundfos SQ and SQE pumps have dry-running protection built in: if the well runs out of water, the pump stops automatically and protects itself from damage.",
      },
      {
        q: "From how deep can a borehole pump lift water?",
        a: "The head depends on the model: the SQ and SQE selection includes pumps with heads up to 150 m. The right model is chosen by borehole depth, water level and required flow — we help with the selection free of charge.",
      },
    ],
  },
  ru: {
    guideTitle: "Как выбрать скважинный насос?",
    guideParagraphs: [
      "Скважинный (глубинный) насос опускается в скважину и поднимает воду в дом. Правильный выбор зависит от внутреннего диаметра скважины (3-дюймовые SQ и SQE для узких, 4-дюймовые SP для более широких), глубины и требуемого расхода.",
      "Grundfos SQ — решение «всё в одном» для дома: у насоса встроены защита от сухого хода и плавный пуск, поэтому отдельный блок управления не нужен.",
      "Grundfos SQE — версия SQ с переменной частотой вращения: вместе с блоком CU301 он держит давление постоянным даже при изменяющемся расходе (один кран или несколько одновременно).",
      "Для больших расходов и напоров — фермы, большие сады, полив и промышленность — предназначена серия Grundfos SP, доступная во многих мощностях.",
    ],
    priceTitle: "Цена скважинного насоса",
    priceIntro:
      "Цена зависит от серии и мощности. Ниже — диапазоны цен нашего ассортимента с рекомендацией, когда какая серия подходит лучше.",
    priceTable: {
      head: ["Серия", "Применение", "Диапазон цен"],
      rows: [
        ["Grundfos SQ", "3-дюймовый насос «всё в одном» для дома — встроенная защита", "741–1334 €"],
        ["Grundfos SQE", "переменная частота + CU301 — постоянное давление", "810–1447 €"],
        ["Комплекты Grundfos SQE", "насос с блоком управления и принадлежностями", "400–1676 €"],
        ["Grundfos SP", "большие расходы и напоры — фермы, полив, промышленность", "694–2172 €"],
      ],
    },
    faqTitle: "Часто задаваемые вопросы",
    faq: [
      {
        q: "Какой скважинный насос лучший для дома?",
        a: "Для большинства домашних скважин лучший выбор — Grundfos SQ: узкий 3-дюймовый насос со встроенной защитой от сухого хода и плавным пуском. Если нужно постоянное давление при меняющемся расходе, выбирайте SQE с блоком CU301.",
      },
      {
        q: "Сколько стоит скважинный насос?",
        a: "Grundfos SQ для дома стоит в нашем ассортименте 741–1334 €, SQE — 810–1447 € в зависимости от мощности. Серия SP для больших расходов стоит 694–2172 €.",
      },
      {
        q: "Чем отличаются Grundfos SQ и SQE?",
        a: "SQ работает с постоянной частотой и имеет всю защиту встроенной — отдельный блок управления не нужен. SQE — версия с переменной частотой, которая вместе с блоком CU301 держит давление точно постоянным независимо от числа открытых кранов.",
      },
      {
        q: "Подойдёт ли SQ в мою скважину?",
        a: "Внешний диаметр SQ — 74 мм, поэтому он подходит для скважин от 3 дюймов (76 мм) и больше. Измерьте внутренний диаметр и глубину скважины — по этим данным подберём модель с нужным напором и расходом.",
      },
      {
        q: "Есть ли у насоса защита от сухого хода?",
        a: "Да — у Grundfos SQ и SQE защита от сухого хода встроена: если вода в скважине заканчивается, насос автоматически останавливается и защищается от повреждений.",
      },
      {
        q: "С какой глубины поднимает воду скважинный насос?",
        a: "Напор зависит от модели: в линейке SQ и SQE есть насосы с напором до 150 м. Правильная модель выбирается по глубине скважины, уровню воды и нужному расходу — поможем с выбором бесплатно.",
      },
    ],
  },
  lv: {
    guideTitle: "Kā izvēlēties urbuma sūkni?",
    guideParagraphs: [
      "Urbuma (grunts) sūkni nolaiž urbumā, un tas paceļ ūdeni mājā. Pareizā izvēle ir atkarīga no urbuma iekšējā diametra (3 collu SQ un SQE šaurām urbjuma caurulēm, 4 collu SP platākām), dziļuma un vajadzīgās plūsmas.",
      "Grundfos SQ ir „viss vienā” risinājums mājas urbumam — sūknim ir iebūvēta aizsardzība pret sauso gājienu un maigā palaišana, tāpēc atsevišķa vadības kaste nav vajadzīga.",
      "Grundfos SQE ir SQ versija ar mainīgu apgriezienu skaitu: kopā ar CU301 vadības ierīci tā uztur nemainīgu spiedienu arī tad, kad patēriņš svārstās (viens krāns vai vairāki vienlaikus).",
      "Lielākām plūsmām un pacēlumiem — saimniecībām, lieliem dārziem, apūdeņošanai un rūpniecībai — paredzēta Grundfos SP sērija, kas pieejama daudzās jaudās.",
    ],
    priceTitle: "Urbuma sūkņa cena",
    priceIntro:
      "Cena ir atkarīga no sērijas un jaudas. Zemāk ir mūsu klāsta cenu diapazoni ar ieteikumu, kad kura sērija der vislabāk.",
    priceTable: {
      head: ["Sērija", "Pielietojums", "Cenu diapazons"],
      rows: [
        ["Grundfos SQ", "3 collu „viss vienā” sūknis mājas urbumam — iebūvēta aizsardzība", "741–1334 €"],
        ["Grundfos SQE", "mainīgs ātrums + CU301 — nemainīgs spiediens", "810–1447 €"],
        ["Grundfos SQE komplekti", "sūknis ar vadības ierīci un piederumiem", "400–1676 €"],
        ["Grundfos SP", "lielas plūsmas un pacēlumi — saimniecības, apūdeņošana, rūpniecība", "694–2172 €"],
      ],
    },
    faqTitle: "Bieži uzdotie jautājumi",
    faq: [
      {
        q: "Kurš urbuma sūknis ir labākais mājas urbumam?",
        a: "Vairumam mājas urbumu labākā izvēle ir Grundfos SQ — šaurs 3 collu sūknis ar iebūvētu aizsardzību pret sauso gājienu un maigo palaišanu. Ja vēlaties nemainīgu spiedienu pie mainīga patēriņa, izvēlieties SQE ar CU301 vadības ierīci.",
      },
      {
        q: "Cik maksā urbuma sūknis?",
        a: "Grundfos SQ mājas urbumam mūsu klāstā maksā 741–1334 € un SQE 810–1447 € atkarībā no jaudas. SP sērija lielākām plūsmām maksā 694–2172 €.",
      },
      {
        q: "Kāda ir atšķirība starp Grundfos SQ un SQE?",
        a: "SQ darbojas ar nemainīgu ātrumu, un visa aizsardzība ir iebūvēta — atsevišķa vadības kaste nav vajadzīga. SQE ir versija ar mainīgu ātrumu, kas kopā ar CU301 uztur precīzi nemainīgu spiedienu neatkarīgi no atvērto krānu skaita.",
      },
      {
        q: "Vai SQ der manam urbumam?",
        a: "SQ ārējais diametrs ir 74 mm, tāpēc tas der 3 collu (76 mm) un lielākās urbjuma caurulēs. Izmēriet urbuma iekšējo diametru un dziļumu — pēc šiem datiem atradīsim modeli ar vajadzīgo pacēlumu un plūsmu.",
      },
      {
        q: "Vai sūknim ir aizsardzība pret sauso gājienu?",
        a: "Jā — Grundfos SQ un SQE sūkņiem aizsardzība pret sauso gājienu ir iebūvēta: ja urbumā beidzas ūdens, sūknis automātiski apstājas un aizsargā sevi no bojājumiem.",
      },
      {
        q: "No cik liela dziļuma urbuma sūknis paceļ ūdeni?",
        a: "Pacēlums ir atkarīgs no modeļa: SQ un SQE klāstā ir sūkņi ar pacēlumu līdz 150 m. Pareizo modeli izvēlas pēc urbuma dziļuma, ūdens līmeņa un vajadzīgās plūsmas — palīdzam izvēlēties bez maksas.",
      },
    ],
  },
  lt: {
    guideTitle: "Kaip išsirinkti gręžinio siurblį?",
    guideParagraphs: [
      "Gręžinio (giluminis) siurblys nuleidžiamas į gręžinį ir kelia vandenį į namą. Tinkamas pasirinkimas priklauso nuo gręžinio vidinio skersmens (3 colių SQ ir SQE siauriems, 4 colių SP platesniems), gylio ir reikiamo srauto.",
      "Grundfos SQ yra sprendimas „viskas viename“ namo gręžiniui — siurblys turi integruotą apsaugą nuo sausojo eigos ir švelnų paleidimą, todėl atskiros valdymo dėžutės nereikia.",
      "Grundfos SQE yra SQ versija su kintamaisiais sūkiais: kartu su CU301 valdymo bloku jis palaiko pastovų slėgį net kintant vandens sunaudojimui (vienas čiaupas ar keli vienu metu).",
      "Didesniems srautams ir slėgiams — ūkiams, dideliems sodams, laistymui ir pramonei — skirta Grundfos SP serija, kurioje yra daug galingumo variantų.",
    ],
    priceTitle: "Gręžinio siurblio kaina",
    priceIntro:
      "Kaina priklauso nuo serijos ir galingumo. Žemiau pateikiami mūsų asortimento kainų diapazonai su rekomendacija, kada kuri serija tinka geriausiai.",
    priceTable: {
      head: ["Serija", "Paskirtis", "Kainų diapazonas"],
      rows: [
        ["Grundfos SQ", "3 colių „viskas viename“ siurblys namo gręžiniui — integruota apsauga", "741–1334 €"],
        ["Grundfos SQE", "kintamieji sūkiai + CU301 — pastovus slėgis", "810–1447 €"],
        ["Grundfos SQE rinkiniai", "siurblys su valdymo bloku ir priedais", "400–1676 €"],
        ["Grundfos SP", "dideli srautai ir slėgiai — ūkiai, laistymas, pramonė", "694–2172 €"],
      ],
    },
    faqTitle: "Dažnai užduodami klausimai",
    faq: [
      {
        q: "Kuris gręžinio siurblys geriausias namo gręžiniui?",
        a: "Daugumai namų gręžinių geriausias pasirinkimas yra Grundfos SQ — plonas 3 colių siurblys su integruota apsauga nuo sausojo eigos ir švelniu paleidimu. Jei norite pastovaus slėgio kintant sunaudojimui, rinkitės SQE su CU301 valdymo bloku.",
      },
      {
        q: "Kiek kainuoja gręžinio siurblys?",
        a: "Grundfos SQ namo gręžiniui mūsų asortimente kainuoja 741–1334 €, SQE — 810–1447 € priklausomai nuo galingumo. SP serija didesniems srautams kainuoja 694–2172 €.",
      },
      {
        q: "Kuo skiriasi Grundfos SQ ir SQE?",
        a: "SQ dirba pastoviu greičiu, o visa apsauga integruota — atskiros valdymo dėžutės nereikia. SQE yra kintamojo greičio versija, kuri kartu su CU301 bloku palaiko tiksliai pastovų slėgį nepriklausomai nuo atidarytų čiaupų skaičiaus.",
      },
      {
        q: "Ar SQ tinka mano gręžiniui?",
        a: "SQ išorinis skersmuo yra 74 mm, todėl jis tinka 3 colių (76 mm) ir didesniems gręžiniams. Išmatuokite gręžinio vidinį skersmenį ir gylį — pagal šiuos duomenis parinksime modelį su reikiamu slėgiu ir srautu.",
      },
      {
        q: "Ar siurblys turi apsaugą nuo sausojo eigos?",
        a: "Taip — Grundfos SQ ir SQE siurbliai turi integruotą apsaugą nuo sausojo eigos: gręžiniui pritrūkus vandens siurblys automatiškai sustoja ir apsisaugo nuo gedimų.",
      },
      {
        q: "Iš kokio gylio gręžinio siurblys kelia vandenį?",
        a: "Slėgis priklauso nuo modelio: SQ ir SQE linijoje yra siurblių su slėgiu iki 150 m. Tinkamas modelis parenkamas pagal gręžinio gylį, vandens lygį ir reikiamo srauto — padėsime išsirinkti nemokamai.",
      },
    ],
  },
}

const REOVEEPUMBAD: Record<Locale, CategoryContentSection> = {
  et: {
    guideTitle: "Kuidas valida reovee- ehk kanalisatsioonipump?",
    guideParagraphs: [
      "Reoveepump on vaja, kui kanalisatsioonitoru on kõrgemal kui madalaim veevõtu koht või kui reovesi tuleb septikust kaugemale pumpata. Õige valik sõltub sellest, kas pumpad ühe seadme (WC, dušš) vett või kogu maja reovett kaevikust.",
      "Sololift2 on kompaktne lahendus WC, duši või valamu lisamiseks kohtadesse, kus gravitatsiooniline kanalisatsioon puudub — näiteks keldri või garaazhi WC. Pump koos mahutiga paigaldatakse otse seadme taha.",
      "Unilift AP on reovee- ja drenaažipump kaevikusse ja septikusse — see läbib osakesi kuni 50 mm ja pumpab saastunud vee ülekanalisse või puhastusseadmesse.",
      "Kui survejuhis on pikk või tõste suur, on õige valik lõikuriga Unilift APG, mis peenendab reovee ja suudab seda kaugemale ja kõrgemale pumpata.",
    ],
    priceTitle: "Reoveepumba hind",
    priceIntro:
      "Hind sõltub seeriast ja võimsusest. Allpool on meie valiku hinnavahemikud koos soovitusega, millal kumbki seeria kõige paremini sobib.",
    priceTable: {
      head: ["Seeria", "Sobivus", "Hinnavahemik"],
      rows: [
        ["Sololift2", "WC, duši ja valamu reovee pumpamiseks — kompaktne, seadme taha", "396–555 €"],
        ["Unilift AP", "reovee ja saastunud vee kaevikust — osakesed kuni 50 mm", "551–937 €"],
        ["Unilift APG", "lõikuriga — pikk survejuhis ja suur tõste", "817–1007 €"],
      ],
    },
    faqTitle: "Korduma kippuvad küsimused",
    faq: [
      {
        q: "Milline pump sobib keldri või garaazhi WC jaoks?",
        a: "Keldri või garaazhi WC, duši ja valamu jaoks, kus gravitatsiooniline kanalisatsioon puudub, on parim valik Sololift2 — kompaktne pump koos mahutiga, mis paigaldatakse otse seadme taha ja pumpab reovee kanalisatsiooni.",
      },
      {
        q: "Kui palju maksab reoveepump?",
        a: "Sololift2 komplektid maksavad meie valikus 396–555 €, kaevikusse mõeldud Unilift AP 551–937 € ja lõikuriga Unilift APG 817–1007 €.",
      },
      {
        q: "Mis vahe on Sololift2 ja Unilift AP pumbal?",
        a: "Sololift2 on väike sisepump ühe sanitaarseadme (WC, dušš, valamu) reovee jaoks. Unilift AP paigaldatakse kaevikusse või septikusse ja pumpab kogu maja reovett — see läbib osakesi kuni 50 mm.",
      },
      {
        q: "Millal valida lõikuriga Unilift APG?",
        a: "Lõikuriga APG on õige valik siis, kui survejuhis on pikk, tõste suur või toru väikese läbimõõduga — lõikur peenendab reovee ja pump suudab seda tõhusalt edasi liigutada. Lühikese juhtme ja tavalise kaeviku jaoks piisab Unilift AP-st.",
      },
      {
        q: "Kas reoveepump käib septiku ja kanalisatsiooni vahele?",
        a: "Jah — Unilift AP ja APG on mõeldud ka reovee pumpamiseks septikust kaugemale ülekanalisse või puhastusseadmesse, kui gravitatsiooniline lahendus ei ole võimalik.",
      },
      {
        q: "Kas reoveepump vajab hooldust?",
        a: "Pumbad on praktiliselt hooldusvabad — soovitav on aeg-ajalt kontrollida ujuvlüliti vaba liikumist ja loputada kaevik puhta veega, et vältida setete kogunemist.",
      },
    ],
  },
  en: {
    guideTitle: "How to choose a sewage pump?",
    guideParagraphs: [
      "A sewage pump is needed when the sewer pipe is higher than the lowest drain point, or when sewage has to be pumped further from a septic tank. The right choice depends on whether you pump a single fixture (WC, shower) or the whole house's sewage from a sump.",
      "Sololift2 is a compact solution for adding a WC, shower or basin where gravity drainage is not available — for example a basement or garage WC. The pump and tank unit is installed right behind the fixture.",
      "Unilift AP is a sewage and drainage pump for sumps and septic tanks — it passes particles up to 50 mm and pumps dirty water to the main sewer or treatment unit.",
      "If the discharge line is long or the head is high, the right choice is the Unilift APG with a grinder — it macerates the sewage and can pump it further and higher.",
    ],
    priceTitle: "Sewage pump prices",
    priceIntro:
      "The price depends on the series and capacity. Below are the price ranges of our selection with a recommendation on when each series fits best.",
    priceTable: {
      head: ["Series", "Best for", "Price range"],
      rows: [
        ["Sololift2", "pumping sewage from a WC, shower or basin — compact, behind the fixture", "396–555 €"],
        ["Unilift AP", "sewage and dirty water from a sump — particles up to 50 mm", "551–937 €"],
        ["Unilift APG", "with grinder — long discharge lines and high heads", "817–1007 €"],
      ],
    },
    faqTitle: "Frequently asked questions",
    faq: [
      {
        q: "Which pump suits a basement or garage WC?",
        a: "For a basement or garage WC, shower or basin without gravity drainage, the best choice is Sololift2 — a compact pump-and-tank unit installed right behind the fixture that pumps the sewage to the sewer.",
      },
      {
        q: "How much does a sewage pump cost?",
        a: "Sololift2 units in our range cost 396–555 €, the sump-installed Unilift AP 551–937 € and the Unilift APG with grinder 817–1007 €.",
      },
      {
        q: "What is the difference between Sololift2 and Unilift AP?",
        a: "Sololift2 is a small indoor unit for a single sanitary fixture (WC, shower, basin). Unilift AP is installed in a sump or septic tank and pumps the whole house's sewage — it passes particles up to 50 mm.",
      },
      {
        q: "When to choose the Unilift APG with grinder?",
        a: "The APG with grinder is the right choice when the discharge line is long, the head is high or the pipe diameter is small — the grinder macerates the sewage and the pump moves it efficiently onwards. For a short line and a normal sump, the Unilift AP is enough.",
      },
      {
        q: "Can a sewage pump go between a septic tank and the sewer?",
        a: "Yes — Unilift AP and APG are designed for pumping sewage from a septic tank onwards to the main sewer or a treatment unit when a gravity solution is not possible.",
      },
      {
        q: "Does a sewage pump need maintenance?",
        a: "The pumps are practically maintenance-free — it is advisable to occasionally check the free movement of the float switch and rinse the sump with clean water to avoid sediment build-up.",
      },
    ],
  },
  ru: {
    guideTitle: "Как выбрать фекальный (канализационный) насос?",
    guideParagraphs: [
      "Фекальный насос нужен, когда канализационная труба выше нижней точки слива или когда стоки надо перекачать из септика дальше. Правильный выбор зависит от того, качаете ли вы воду одного прибора (унитаз, душ) или все стоки дома из колодца.",
      "Sololift2 — компактное решение для установки унитаза, душа или раковины там, где нет самотёчной канализации — например, в подвале или гараже. Насос с баком монтируется прямо за прибором.",
      "Unilift AP — фекальный и дренажный насос для колодцев и септиков: он пропускает частицы до 50 мм и перекачивает загрязнённую воду в общую канализацию или очистное сооружение.",
      "Если напорная линия длинная или высота подъёма большая, правильный выбор — Unilift APG с измельчителем: он измельчает стоки и может перекачивать их дальше и выше.",
    ],
    priceTitle: "Цена фекального насоса",
    priceIntro:
      "Цена зависит от серии и мощности. Ниже — диапазоны цен нашего ассортимента с рекомендацией, когда какая серия подходит лучше.",
    priceTable: {
      head: ["Серия", "Применение", "Диапазон цен"],
      rows: [
        ["Sololift2", "откачка стоков унитаза, душа или раковины — компактно, за прибором", "396–555 €"],
        ["Unilift AP", "стоки и грязная вода из колодца — частицы до 50 мм", "551–937 €"],
        ["Unilift APG", "с измельчителем — длинные напорные линии и большой напор", "817–1007 €"],
      ],
    },
    faqTitle: "Часто задаваемые вопросы",
    faq: [
      {
        q: "Какой насос подходит для унитаза в подвале или гараже?",
        a: "Для унитаза, душа или раковины в подвале или гараже без самотёчной канализации лучший выбор — Sololift2: компактный агрегат с насосом и баком, монтируемый прямо за прибором и перекачивающий стоки в канализацию.",
      },
      {
        q: "Сколько стоит фекальный насос?",
        a: "Комплекты Sololift2 в нашем ассортименте стоят 396–555 €, устанавливаемый в колодец Unilift AP — 551–937 €, а Unilift APG с измельчителем — 817–1007 €.",
      },
      {
        q: "Чем отличаются Sololift2 и Unilift AP?",
        a: "Sololift2 — небольшой агрегат для одного сантехприбора (унитаз, душ, раковина). Unilift AP устанавливается в колодец или септик и перекачивает все стоки дома — он пропускает частицы до 50 мм.",
      },
      {
        q: "Когда выбирать Unilift APG с измельчителем?",
        a: "APG с измельчителем — правильный выбор, когда напорная линия длинная, подъём большой или труба малого диаметра: измельчитель дробит стоки, и насос эффективно перекачивает их дальше. Для короткой линии и обычного колодца достаточно Unilift AP.",
      },
      {
        q: "Можно ли качать насосом из септика в канализацию?",
        a: "Да — Unilift AP и APG предназначены в том числе для перекачки стоков из септика в общую канализацию или очистное сооружение, когда самотёчное решение невозможно.",
      },
      {
        q: "Нужно ли обслуживать фекальный насос?",
        a: "Насосы практически не требуют обслуживания — рекомендуется время от времени проверять свободный ход поплавкового выключателя и промывать колодец чистой водой, чтобы избежать накопления осадка.",
      },
    ],
  },
  lv: {
    guideTitle: "Kā izvēlēties notekūdeņu sūkni?",
    guideParagraphs: [
      "Notekūdeņu sūknis ir vajadzīgs, kad kanalizācijas caurule atrodas augstāk par zemāko noteces punktu vai kad notekūdeņi no septiķa jāpārsūknē tālāk. Pareizā izvēle ir atkarīga no tā, vai sūknējat vienas ierīces (tualetes, dušas) ūdeni vai visas mājas notekas no akas.",
      "Sololift2 ir kompakts risinājums tualetes, dušas vai izlietnes ierīkošanai vietās, kur nav gravitācijas kanalizācijas — piemēram, pagraba vai garāžas tualetei. Sūkņa un tvertnes agregāts uzstādāms tieši aiz ierīces.",
      "Unilift AP ir notekūdeņu un drenāžas sūknis akām un septiķiem — tas izlaiž līdz 50 mm lielās daļiņas un pārsūknē netīro ūdeni uz kopējo kanalizāciju vai attīrīšanas iekārtu.",
      "Ja spiedvads ir garš vai pacēlums liels, pareizā izvēle ir Unilift APG ar smalcinātāju — tas sasmalcina notekas un spēj tās pārsūknēt tālāk un augstāk.",
    ],
    priceTitle: "Notekūdeņu sūkņa cena",
    priceIntro:
      "Cena ir atkarīga no sērijas un jaudas. Zemāk ir mūsu klāsta cenu diapazoni ar ieteikumu, kad kura sērija der vislabāk.",
    priceTable: {
      head: ["Sērija", "Pielietojums", "Cenu diapazons"],
      rows: [
        ["Sololift2", "tualetes, dušas vai izlietnes noteku sūknēšanai — kompakts, aiz ierīces", "396–555 €"],
        ["Unilift AP", "notekas un netīrais ūdens no akas — daļiņas līdz 50 mm", "551–937 €"],
        ["Unilift APG", "ar smalcinātāju — gari spiedvadi un lieli pacēlumi", "817–1007 €"],
      ],
    },
    faqTitle: "Bieži uzdotie jautājumi",
    faq: [
      {
        q: "Kurš sūknis der pagraba vai garāžas tualetei?",
        a: "Pagraba vai garāžas tualetei, dušai vai izlietnei bez gravitācijas kanalizācijas labākā izvēle ir Sololift2 — kompakts sūkņa un tvertnes agregāts, ko uzstāda tieši aiz ierīces un kas pārsūknē notekas kanalizācijā.",
      },
      {
        q: "Cik maksā notekūdeņu sūknis?",
        a: "Sololift2 komplekti mūsu klāstā maksā 396–555 €, akā uzstādāmais Unilift AP 551–937 € un Unilift APG ar smalcinātāju 817–1007 €.",
      },
      {
        q: "Kāda ir atšķirība starp Sololift2 un Unilift AP?",
        a: "Sololift2 ir neliels iekštelpu agregāts vienai sanitārajai ierīcei (tualete, duša, izlietne). Unilift AP uzstāda akā vai septiķī un tas pārsūknē visas mājas notekas — izlaiž daļiņas līdz 50 mm.",
      },
      {
        q: "Kad izvēlēties Unilift APG ar smalcinātāju?",
        a: "APG ar smalcinātāju ir pareizā izvēle, ja spiedvads ir garš, pacēlums liels vai caurule mazā diametrā — smalcinātājs sasmalcina notekas un sūknis tās efektīvi pārvada tālāk. Īsam vadam un parastai akai pietiek ar Unilift AP.",
      },
      {
        q: "Vai sūkni var izmantot starp septiķi un kanalizāciju?",
        a: "Jā — Unilift AP un APG ir paredzēti arī notekūdeņu pārsūknēšanai no septiķa uz kopējo kanalizāciju vai attīrīšanas iekārtu, ja gravitācijas risinājums nav iespējams.",
      },
      {
        q: "Vai notekūdeņu sūknim vajadzīga apkope?",
        a: "Sūkņi praktiski nav jāapkopj — ieteicams laiku pa laikam pārbaudīt pludiņslēdža brīvu kustību un izskalot aku ar tīru ūdeni, lai izvairītos no nogulumu uzkrāšanās.",
      },
    ],
  },
  lt: {
    guideTitle: "Kaip išsirinkti nuotekų (fekalinį) siurblį?",
    guideParagraphs: [
      "Nuotekų siurblys reikalingas, kai kanalizacijos vamzdis yra aukščiau už žemiausią nutekėjimo tašką arba kai nuotekas reikia perpumpuoti iš septiko toliau. Tinkamas pasirinkimas priklauso nuo to, ar pumpuojate vieno prietaiso (WC, dušo) vandenį, ar viso namo nuotekas iš šulinio.",
      "Sololift2 yra kompaktiškas sprendimas tualetui, dušui ar kriauklei įrengti ten, kur nėra savaiminio nutekėjimo — pavyzdžiui, rūsio ar garažo tualetui. Siurblio ir bakelio agregatas montuojamas tiesiai už prietaiso.",
      "Unilift AP yra nuotekų ir drenažo siurblys šuliniams ir septikams — jis praleidžia iki 50 mm daleles ir perpumpuoja nešvarų vandenį į bendrą kanalizaciją ar valymo įrenginį.",
      "Jei slėginis vamzdis ilgas arba slėgis didelis, tinkamas pasirinkimas yra Unilift APG su smulkintuvu — jis smulkina nuotekas ir gali jas pumpuoti toliau ir aukščiau.",
    ],
    priceTitle: "Nuotekų siurblio kaina",
    priceIntro:
      "Kaina priklauso nuo serijos ir galingumo. Žemiau pateikiami mūsų asortimento kainų diapazonai su rekomendacija, kada kuri serija tinka geriausiai.",
    priceTable: {
      head: ["Serija", "Paskirtis", "Kainų diapazonas"],
      rows: [
        ["Sololift2", "tualeto, dušo ar kriauklės nuotekoms — kompaktiškas, už prietaiso", "396–555 €"],
        ["Unilift AP", "nuotekos ir nešvarus vanduo iš šulinio — dalelės iki 50 mm", "551–937 €"],
        ["Unilift APG", "su smulkintuvu — ilgi slėginiai vamzdžiai ir didelis slėgis", "817–1007 €"],
      ],
    },
    faqTitle: "Dažnai užduodami klausimai",
    faq: [
      {
        q: "Kuris siurblys tinka rūsio ar garažo tualetui?",
        a: "Rūsio ar garažo tualetui, dušui ar kriauklei be savaiminio nutekėjimo geriausias pasirinkimas yra Sololift2 — kompaktiškas siurblio ir bakelio agregatas, montuojamas tiesiai už prietaiso ir perpumpuojantis nuotekas į kanalizaciją.",
      },
      {
        q: "Kiek kainuoja nuotekų siurblys?",
        a: "Sololift2 komplektai mūsų asortimente kainuoja 396–555 €, į šulinį montuojamas Unilift AP — 551–937 €, o Unilift APG su smulkintuvu — 817–1007 €.",
      },
      {
        q: "Kuo skiriasi Sololift2 ir Unilift AP?",
        a: "Sololift2 yra mažas vidaus agregatas vienam sanitariniam prietaisui (tualetas, dušas, kriauklė). Unilift AP montuojamas šulinyje arba septike ir pumpuoja visas namo nuotekas — praleidžia daleles iki 50 mm.",
      },
      {
        q: "Kada rinktis Unilift APG su smulkintuvu?",
        a: "APG su smulkintuvu yra tinkamas pasirinkimas, kai slėginis vamzdis ilgas, pakėlimas didelis arba vamzdis mažo skersmens — smulkintuvas susmulkina nuotekas ir siurblys jas efektyviai perpumpuoja. Trumpam vamzdžiui ir įprastam šuliniui pakanka Unilift AP.",
      },
      {
        q: "Ar siurblį galima naudoti tarp septiko ir kanalizacijos?",
        a: "Taip — Unilift AP ir APG skirti ir nuotekų perpumpavimui iš septiko į bendrą kanalizaciją ar valymo įrenginį, kai savaiminis sprendimas neįmanomas.",
      },
      {
        q: "Ar nuotekų siurbliui reikalinga priežiūra?",
        a: "Siurbliai praktiškai nereikalauja priežiūros — rekomenduojama kartkartėmis patikrinti laisvą plūdinio jungiklio judėjimą ir praplauti šulinį švariu vandeniu, kad nekauptųsi nuosėdos.",
      },
    ],
  },
}

const SALVKAEVUPUMBAD: Record<Locale, CategoryContentSection> = {
  et: {
    guideTitle: "Kuidas valida salvkaevupump?",
    guideParagraphs: [
      "Salvkaevupump toob vett avatud kaevust või salvkaevust majja, aita või kastmisseadmesse. Õige valik sõltub imusügavusest (põrandal seisev pump imeb kuni 8 m sügavuselt), sellest, kas vaja varustada ka maja, ja soovitud müratasemest.",
      "Grundfos JP on klassikaline ja soodne lahendus — pump koos rõhumahuti ja automaatikaga (hüdrofoor), mis sobib hästi suvilasse ja aeda.",
      "Grundfos SB on põrandal seisev veeautomaat, mis imeb vett kuni 8 m sügavuselt — hea valik kastmiseks ja väiksema maja veevarustuseks.",
      "Kui veetase on madalamal või soovid täiesti vaikset lahendust, on õige valik uputatav Grundfos SBA, mis langetatakse kaevu sisse ega vaja eraldi paigaldusruumi.",
    ],
    priceTitle: "Salvkaevupumba hind",
    priceIntro:
      "Hind sõltub seeriast ja võimsusest. Allpool on meie valiku hinnavahemikud koos soovitusega, millal kumbki seeria kõige paremini sobib.",
    priceTable: {
      head: ["Seeria", "Sobivus", "Hinnavahemik"],
      rows: [
        ["Grundfos JP", "klassikaline hüdrofoor — suvila ja aed, soodne", "235–553 €"],
        ["Grundfos SB", "põrandal seisev veeautomaat — kastmine ja väiksem maja", "521–602 €"],
        ["Grundfos SBA", "uputatav pump kaevu sisse — täiesti vaikne", "575–716 €"],
      ],
    },
    faqTitle: "Korduma kippuvad küsimused",
    faq: [
      {
        q: "Milline on parim pump salvkaevu jaoks?",
        a: "Kui kaevu veetase on kuni 8 m sügavusel, on hea valik põrandal seisev Grundfos SB. Kui veetase on madalamal või soovid vaikset lahendust, vali uputatav SBA. Kõige soodsam variant on klassikaline JP hüdrofoor.",
      },
      {
        q: "Kui palju maksab salvkaevupump?",
        a: "Klassikaline JP hüdrofoor maksab meie valikus 235–553 €, põrandal seisev SB veeautomaat 521–602 € ja uputatav SBA 575–716 €.",
      },
      {
        q: "Mis vahe on SB ja SBA seerial?",
        a: "SB on põrandal seisev pump, mis paigaldatakse kuiva ruumi ja imeb vett kuni 8 m sügavuselt. SBA on uputatav — see langetatakse kaevu sisse, on täiesti vaikne ja sobib ka madalama veetasemega kaevudesse.",
      },
      {
        q: "Kui sügavalt salvkaevupump vett imeb?",
        a: "Põrandal seisev pump (JP, SB) suudab imeda vett kuni 8 m sügavuselt. Kui veetase on madalamal, tuleb valida uputatav pump (SBA) või puurkaevupump — aitame valikuga tasuta.",
      },
      {
        q: "Kas salvkaevupump sobib ka maja veevarustuseks?",
        a: "Jah — SB ja SBA toimivad täisväärtusliku veeautomaadina ja JP koos rõhumahutiga samuti. Kui maja veevarustus on põhikasutus, vaata ka meie veeautomaatide valikut (SCALA1, SCALA2).",
      },
      {
        q: "Kas salvkaevupumpa saab kasutada vihmavee pumpamiseks?",
        a: "Jah — JP, SB ja SBA sobivad hästi ka vihmavee kogumismahutist kastmiseks ja majapidamisveeks pumpamiseks.",
      },
    ],
  },
  en: {
    guideTitle: "How to choose a well pump?",
    guideParagraphs: [
      "A well pump brings water from an open or shallow well to the house, garden or irrigation system. The right choice depends on the suction depth (a surface pump draws from up to 8 m), whether the house needs water too, and the desired noise level.",
      "Grundfos JP is the classic and affordable solution — a pump with a pressure tank and automatics (hydrofor) that fits summer houses and gardens well.",
      "Grundfos SB is a surface-mounted water automatic that draws water from up to 8 m deep — a good choice for irrigation and supplying a smaller house.",
      "If the water level is lower or you want a completely silent solution, the right choice is the submersible Grundfos SBA, which is lowered into the well and needs no separate installation space.",
    ],
    priceTitle: "Well pump prices",
    priceIntro:
      "The price depends on the series and capacity. Below are the price ranges of our selection with a recommendation on when each series fits best.",
    priceTable: {
      head: ["Series", "Best for", "Price range"],
      rows: [
        ["Grundfos JP", "classic hydrofor — summer house and garden, affordable", "235–553 €"],
        ["Grundfos SB", "surface water automatic — irrigation and a smaller house", "521–602 €"],
        ["Grundfos SBA", "submersible pump inside the well — completely silent", "575–716 €"],
      ],
    },
    faqTitle: "Frequently asked questions",
    faq: [
      {
        q: "Which pump is best for a well?",
        a: "If the well's water level is up to 8 m deep, the surface-mounted Grundfos SB is a good choice. If the level is lower or you want a silent solution, choose the submersible SBA. The most affordable option is the classic JP hydrofor.",
      },
      {
        q: "How much does a well pump cost?",
        a: "The classic JP hydrofor costs 235–553 € in our range, the surface SB water automatic 521–602 € and the submersible SBA 575–716 €.",
      },
      {
        q: "What is the difference between SB and SBA?",
        a: "SB is a surface pump installed in a dry room that draws water from up to 8 m deep. SBA is submersible — lowered into the well, completely silent and suitable for wells with a lower water level.",
      },
      {
        q: "From how deep does a well pump draw water?",
        a: "A surface pump (JP, SB) can draw water from up to 8 m deep. If the water level is lower, you need a submersible pump (SBA) or a borehole pump — we help with the selection free of charge.",
      },
      {
        q: "Does a well pump suit house water supply too?",
        a: "Yes — SB and SBA work as a full water automatic, and JP with its pressure tank as well. If house supply is the main use, also see our water automatics selection (SCALA1, SCALA2).",
      },
      {
        q: "Can a well pump be used for rain water?",
        a: "Yes — JP, SB and SBA are also well suited for pumping water from a rainwater collection tank for irrigation and household use.",
      },
    ],
  },
  ru: {
    guideTitle: "Как выбрать колодезный насос?",
    guideParagraphs: [
      "Колодезный насос подаёт воду из открытого или неглубокого колодца в дом, сад или систему полива. Правильный выбор зависит от глубины всасывания (поверхностный насос качает с глубины до 8 м), от того, нужно ли снабжать и дом, и от желаемого уровня шума.",
      "Grundfos JP — классическое и доступное решение: насос с гидроаккумулятором и автоматикой (гидрофор), хорошо подходящий для дачи и сада.",
      "Grundfos SB — поверхностный водяной автомат, качающий воду с глубины до 8 м — хороший выбор для полива и водоснабжения небольшого дома.",
      "Если уровень воды ниже или нужно полностью бесшумное решение, правильный выбор — погружной Grundfos SBA, который опускается в колодец и не требует отдельного места для установки.",
    ],
    priceTitle: "Цена колодезного насоса",
    priceIntro:
      "Цена зависит от серии и мощности. Ниже — диапазоны цен нашего ассортимента с рекомендацией, когда какая серия подходит лучше.",
    priceTable: {
      head: ["Серия", "Применение", "Диапазон цен"],
      rows: [
        ["Grundfos JP", "классический гидрофор — дача и сад, доступный", "235–553 €"],
        ["Grundfos SB", "поверхностный водяной автомат — полив и небольшой дом", "521–602 €"],
        ["Grundfos SBA", "погружной насос в колодец — полностью бесшумный", "575–716 €"],
      ],
    },
    faqTitle: "Часто задаваемые вопросы",
    faq: [
      {
        q: "Какой насос лучший для колодца?",
        a: "Если уровень воды в колодце до 8 м, хороший выбор — поверхностный Grundfos SB. Если уровень ниже или нужно бесшумное решение, выбирайте погружной SBA. Самый доступный вариант — классический гидрофор JP.",
      },
      {
        q: "Сколько стоит колодезный насос?",
        a: "Классический гидрофор JP в нашем ассортименте стоит 235–553 €, поверхностный автомат SB — 521–602 €, погружной SBA — 575–716 €.",
      },
      {
        q: "Чем отличаются SB и SBA?",
        a: "SB — поверхностный насос, устанавливаемый в сухом помещении и качающий воду с глубины до 8 м. SBA — погружной: опускается в колодец, полностью бесшумен и подходит для колодцев с более низким уровнем воды.",
      },
      {
        q: "С какой глубины всасывает колодезный насос?",
        a: "Поверхностный насос (JP, SB) качает воду с глубины до 8 м. Если уровень ниже, нужен погружной насос (SBA) или скважинный насос — поможем с выбором бесплатно.",
      },
      {
        q: "Подходит ли колодезный насос для водоснабжения дома?",
        a: "Да — SB и SBA работают как полноценный водяной автомат, как и JP с гидроаккумулятором. Если водоснабжение дома — основная задача, посмотрите также наш выбор водяных автоматов (SCALA1, SCALA2).",
      },
      {
        q: "Можно ли использовать колодезный насос для дождевой воды?",
        a: "Да — JP, SB и SBA отлично подходят и для перекачки воды из накопительной ёмкости дождевой воды для полива и хозяйственных нужд.",
      },
    ],
  },
  lv: {
    guideTitle: "Kā izvēlēties akas sūkni?",
    guideParagraphs: [
      "Akas sūknis piegādā ūdeni no atklātās vai seklas akas mājai, dārzam vai laistīšanas sistēmai. Pareizā izvēle ir atkarīga no iesūkšanas dziļuma (virszemes sūknis sūc līdz 8 m dziļumam), vai jāapgādā arī māja, un no vēlamā trokšņa līmeņa.",
      "Grundfos JP ir klasiskais un pieejamākais risinājums — sūknis ar spiedtvertni un automātiku (hidrofors), kas labi der vasarnīcai un dārzam.",
      "Grundfos SB ir virszemes ūdens automāts, kas sūc ūdeni no līdz 8 m dziļuma — laba izvēle laistīšanai un mazākas mājas apgādei.",
      "Ja ūdens līmenis ir zemāks vai vēlaties pilnīgi klusu risinājumu, pareizā izvēle ir iegremdējamais Grundfos SBA, ko nolaiž akā un kam nav vajadzīga atsevišķa uzstādīšanas vieta.",
    ],
    priceTitle: "Akas sūkņa cena",
    priceIntro:
      "Cena ir atkarīga no sērijas un jaudas. Zemāk ir mūsu klāsta cenu diapazoni ar ieteikumu, kad kura sērija der vislabāk.",
    priceTable: {
      head: ["Sērija", "Pielietojums", "Cenu diapazons"],
      rows: [
        ["Grundfos JP", "klasiskais hidrofors — vasarnīca un dārzs, pieejams", "235–553 €"],
        ["Grundfos SB", "virszemes ūdens automāts — laistīšana un mazāka māja", "521–602 €"],
        ["Grundfos SBA", "iegremdējamais sūknis akā — pilnīgi kluss", "575–716 €"],
      ],
    },
    faqTitle: "Bieži uzdotie jautājumi",
    faq: [
      {
        q: "Kurš sūknis ir labākais akai?",
        a: "Ja akas ūdens līmenis ir līdz 8 m dziļumā, laba izvēle ir virszemes Grundfos SB. Ja līmenis ir zemāks vai vēlaties klusu risinājumu, izvēlieties iegremdējamo SBA. Pieejamākā izvēle ir klasiskais JP hidrofors.",
      },
      {
        q: "Cik maksā akas sūknis?",
        a: "Klasiskais JP hidrofors mūsu klāstā maksā 235–553 €, virszemes SB ūdens automāts 521–602 € un iegremdējamais SBA 575–716 €.",
      },
      {
        q: "Kāda ir atšķirība starp SB un SBA?",
        a: "SB ir virszemes sūknis, ko uzstāda sausā telpā un kas sūc ūdeni no līdz 8 m dziļuma. SBA ir iegremdējamais — to nolaiž akā, tas ir pilnīgi kluss un der akām ar zemāku ūdens līmeni.",
      },
      {
        q: "No cik liela dziļuma akas sūknis sūc ūdeni?",
        a: "Virszemes sūknis (JP, SB) spēj sūkt ūdeni no līdz 8 m dziļuma. Ja ūdens līmenis ir zemāks, jāizvēlas iegremdējamais sūknis (SBA) vai urbuma sūknis — palīdzam izvēlēties bez maksas.",
      },
      {
        q: "Vai akas sūknis der arī mājas ūdens apgādei?",
        a: "Jā — SB un SBA darbojas kā pilnvērtīgs ūdens automāts, tāpat JP ar spiedtvertni. Ja mājas apgāde ir galvenais uzdevums, skatiet arī mūsu ūdens automātu klāstu (SCALA1, SCALA2).",
      },
      {
        q: "Vai akas sūkni var izmantot lietus ūdenim?",
        a: "Jā — JP, SB un SBA lieliski der arī ūdens sūknēšanai no lietus ūdens savākšanas tvertnes laistīšanai un saimniecības vajadzībām.",
      },
    ],
  },
  lt: {
    guideTitle: "Kaip išsirinkti šulinio siurblį?",
    guideParagraphs: [
      "Šulinio siurblys tiekia vandenį iš atviro ar negilaus šulinio namui, sodui ar laistymo sistemai. Tinkamas pasirinkimas priklauso nuo siurbimo gylio (paviršinis siurblys siurbia iki 8 m gylio), ar reikia aprūpinti ir namą, bei norimo triukšmo lygio.",
      "Grundfos JP yra klasikinis ir prieinamas sprendimas — siurblys su slėgine talpa ir automatika (hidroforas), gerai tinkantis sodybai ir sodui.",
      "Grundfos SB yra paviršinis vandens automatas, siurbiantis vandenį iš iki 8 m gylio — geras pasirinkimas laistymui ir mažesnio namo vandens tiekimui.",
      "Jei vandens lygis žemesnis arba norite visiškai tylaus sprendimo, tinkamas pasirinkimas yra panardinamas Grundfos SBA, kuris nuleidžiamas į šulinį ir nereikalauja atskiros montavimo vietos.",
    ],
    priceTitle: "Šulinio siurblio kaina",
    priceIntro:
      "Kaina priklauso nuo serijos ir galingumo. Žemiau pateikiami mūsų asortimento kainų diapazonai su rekomendacija, kada kuri serija tinka geriausiai.",
    priceTable: {
      head: ["Serija", "Paskirtis", "Kainų diapazonas"],
      rows: [
        ["Grundfos JP", "klasikinis hidroforas — sodyba ir sodas, prieinamas", "235–553 €"],
        ["Grundfos SB", "paviršinis vandens automatas — laistymas ir mažesnis namas", "521–602 €"],
        ["Grundfos SBA", "panardinamas siurblys šulinyje — visiškai tylus", "575–716 €"],
      ],
    },
    faqTitle: "Dažnai užduodami klausimai",
    faq: [
      {
        q: "Kuris siurblys geriausias šuliniui?",
        a: "Jei šulinio vandens lygis iki 8 m gylyje, geras pasirinkimas yra paviršinis Grundfos SB. Jei lygis žemesnis arba norite tylaus sprendimo, rinkitės panardinamą SBA. Prieinamiausias variantas — klasikinis JP hidroforas.",
      },
      {
        q: "Kiek kainuoja šulinio siurblys?",
        a: "Klasikinis JP hidroforas mūsų asortimente kainuoja 235–553 €, paviršinis SB vandens automatas 521–602 €, o panardinamas SBA — 575–716 €.",
      },
      {
        q: "Kuo skiriasi SB ir SBA?",
        a: "SB yra paviršinis siurblys, montuojamas sausoje patalpoje ir siurbiantis vandenį iš iki 8 m gylio. SBA yra panardinamas — nuleidžiamas į šulinį, visiškai tylus ir tinka šuliniams su žemesniu vandens lygiu.",
      },
      {
        q: "Iš kokio gylio siurbia šulinio siurblys?",
        a: "Paviršinis siurblys (JP, SB) gali siurbti vandenį iš iki 8 m gylio. Jei vandens lygis žemesnis, reikia rinktis panardinamą siurblį (SBA) arba gręžinio siurblį — padėsime išsirinkti nemokamai.",
      },
      {
        q: "Ar šulinio siurblys tinka ir namo vandens tiekimui?",
        a: "Taip — SB ir SBA veikia kaip pilnavertis vandens automatas, kaip ir JP su slėgine talpa. Jei namo tiekimas yra pagrindinė užduotis, taip pat žiūrėkite mūsų vandens automatų asortimentą (SCALA1, SCALA2).",
      },
      {
        q: "Ar šulinio siurblį galima naudoti lietaus vandeniui?",
        a: "Taip — JP, SB ir SBA puikiai tinka ir vandens pumpavimui iš lietaus vandens surinkimo talpos laistymui ir ūkio reikmėms.",
      },
    ],
  },
}

const ROHUTOSTEPUMBAD: Record<Locale, CategoryContentSection> = {
  et: {
    guideTitle: "Kuidas valida rõhutõstepump?",
    guideParagraphs: [
      "Rõhutõstepump lahendab madala veerõhu probleemi — kui dušš on nõrk või boiler saab aeglaselt täis. Õige valik sõltub sellest, kas tõsta tuleb ühe tarbija (boiler, dušš) või kogu maja rõhku, vajalikust vooluhulgast ja müratasemest.",
      "Grundfos UPA on väike ja kompaktne tõstepump, mis paigaldatakse torusse otse boileri või duši ette — kiire lahendus ühe tarbija rõhu parandamiseks.",
      "Kogu maja veerõhu tõstmiseks on õige valik SCALA1 või SCALA2 kõik-ühes veeautomaat. SCALA2 hoiab rõhu täiesti püsivana ka mitme avatud kraani korral ja on praktiliselt vaikne.",
      "Suurematesse hoonetesse — kortermajad, ärihooned, suured vooluhulgad — on mitmepakkorjelised CMBE ja CMBE TWIN rõhutõstesüsteemid.",
    ],
    priceTitle: "Rõhutõstepumba hind",
    priceIntro:
      "Hind sõltub seeriast ja võimsusest. Allpool on meie valiku hinnavahemikud koos soovitusega, millal kumbki seeria kõige paremini sobib.",
    priceTable: {
      head: ["Seeria", "Sobivus", "Hinnavahemik"],
      rows: [
        ["Grundfos UPA", "kompaktne tõste boileri või duši ette", "156–299 €"],
        ["Grundfos SCALA1", "kõik-ühes veeautomaat kogu majale", "452–571 €"],
        ["Grundfos SCALA2", "püsiv rõhk ja väga vaikne — parim valik eramule", "u 657 €"],
        ["CMBE / CMBE TWIN", "kortermajad ja ärihooned — suured vooluhulgad", "1443–4802 €"],
      ],
    },
    faqTitle: "Korduma kippuvad küsimused",
    faq: [
      {
        q: "Miks on mu majas veerõhk madal?",
        a: "Tüüpilised põhjused on nõrk rõhk linnavõrgus, ummistunud filter või liiga pikk ja kitsas torustik. Kui põhjus on võrgu rõhks, lahendab probleemi rõhutõstepump — ühe tarbija jaoks UPA, kogu maja jaoks SCALA1 või SCALA2.",
      },
      {
        q: "Milline on parim rõhutõstepump eramusse?",
        a: "Kogu maja veerõhu tõstmiseks on parim valik Grundfos SCALA2 — see hoiab rõhu püsivana ka siis, kui mitu kraani on korraga avatud, ja on praktiliselt vaikne. Kui eelarve on tähtsam, pakub SCALA1 sama automaatikat soodsamalt.",
      },
      {
        q: "Kui palju maksab rõhutõstepump?",
        a: "Väike UPA tõstepump maksab meie valikus 156–299 €, kogu maja jaoks SCALA1 452–571 € ja SCALA2 u 657 €. Suurematesse hoonetesse mõeldud CMBE süsteemid algavad 1443 €.",
      },
      {
        q: "Mis vahe on SCALA1 ja SCALA2 vahel?",
        a: "Mõlemad on kõik-ühes veeautomaadid kogu maja veerõhu tõstmiseks. SCALA2 hoiab rõhu täiesti püsivana olenemata sellest, kui palju kraane korraga avatud on, ja on vaiksem; SCALA1 on soodsam ja sobib väiksemasse majja vähema tarbimisega.",
      },
      {
        q: "Kas rõhutõstepump sobib ka korterisse?",
        a: "Jah — kompaktne UPA paigaldatakse torusse boileri või duši ette ja SCALA1/SCALA2 leiavad koha köögi- või tehnoruumi kapis. Vaikne töö teeb need sobivaks ka korterisse.",
      },
      {
        q: "Kas rõhutõstepump käivitub automaatselt?",
        a: "Jah — kõik loetletud mudelid käivituvad ja seiskuvad automaatselt veevõtu järgi. SCALA-mudelid reguleerivad ka pööreid nii, et rõhk püsib tasasel.",
      },
    ],
  },
  en: {
    guideTitle: "How to choose a pressure booster pump?",
    guideParagraphs: [
      "A pressure booster pump solves low water pressure — when the shower is weak or the tank fills slowly. The right choice depends on whether you need to boost one consumer (boiler, shower) or the whole house, the required flow and the noise level.",
      "Grundfos UPA is a small, compact booster installed in the pipe right before a boiler or shower — a quick fix to improve the pressure of a single consumer.",
      "To boost the whole house's water pressure, the right choice is the SCALA1 or SCALA2 all-in-one water automatic. SCALA2 keeps the pressure perfectly constant even with several taps open and is practically silent.",
      "For larger buildings — apartment blocks, commercial buildings, large flows — there are the multi-stage CMBE and CMBE TWIN booster systems.",
    ],
    priceTitle: "Pressure booster pump prices",
    priceIntro:
      "The price depends on the series and capacity. Below are the price ranges of our selection with a recommendation on when each series fits best.",
    priceTable: {
      head: ["Series", "Best for", "Price range"],
      rows: [
        ["Grundfos UPA", "compact boost before a boiler or shower", "156–299 €"],
        ["Grundfos SCALA1", "all-in-one water automatic for the whole house", "452–571 €"],
        ["Grundfos SCALA2", "constant pressure, very quiet — the best choice for a house", "approx. 657 €"],
        ["CMBE / CMBE TWIN", "apartment blocks and commercial buildings — large flows", "1443–4802 €"],
      ],
    },
    faqTitle: "Frequently asked questions",
    faq: [
      {
        q: "Why is the water pressure low in my house?",
        a: "Typical reasons are weak mains pressure, a clogged filter or long, narrow piping. If the cause is mains pressure, a booster pump solves it — UPA for a single consumer, SCALA1 or SCALA2 for the whole house.",
      },
      {
        q: "Which is the best booster pump for a house?",
        a: "For boosting the whole house's water pressure, the best choice is Grundfos SCALA2 — it keeps the pressure constant even with several taps open and is practically silent. If budget matters more, SCALA1 offers the same automatics at a lower price.",
      },
      {
        q: "How much does a booster pump cost?",
        a: "The small UPA booster costs 156–299 € in our range, SCALA1 for the whole house 452–571 € and SCALA2 approx. 657 €. CMBE systems for larger buildings start at 1443 €.",
      },
      {
        q: "What is the difference between SCALA1 and SCALA2?",
        a: "Both are all-in-one water automatics for boosting the whole house's pressure. SCALA2 keeps the pressure perfectly constant regardless of consumption and is quieter; SCALA1 is more affordable and suits a smaller house with lower consumption.",
      },
      {
        q: "Does a booster pump suit an apartment?",
        a: "Yes — the compact UPA is installed in the pipe before a boiler or shower, and SCALA1/SCALA2 fit into a kitchen or utility cupboard. Quiet operation makes them suitable for apartments too.",
      },
      {
        q: "Does the pump start automatically?",
        a: "Yes — all listed models start and stop automatically with water draw. The SCALA models also adjust their speed so the pressure stays even.",
      },
    ],
  },
  ru: {
    guideTitle: "Как выбрать насос повышения давления?",
    guideParagraphs: [
      "Насос повышения давления решает проблему низкого напора воды — когда душ слабый или бак наполняется медленно. Правильный выбор зависит от того, нужно ли поднять давление одному потребителю (бойлер, душ) или всему дому, от требуемого расхода и уровня шума.",
      "Grundfos UPA — небольшой компактный насос, устанавливаемый в трубу прямо перед бойлером или душем — быстрое решение для улучшения напора одного потребителя.",
      "Для повышения давления во всём доме правильный выбор — водяной автомат «всё в одном» SCALA1 или SCALA2. SCALA2 держит давление абсолютно постоянным даже при нескольких открытых кранах и практически бесшумна.",
      "Для больших зданий — многоквартирных домов, коммерческих объектов, больших расходов — предназначены многоступенчатые системы CMBE и CMBE TWIN.",
    ],
    priceTitle: "Цена насоса повышения давления",
    priceIntro:
      "Цена зависит от серии и мощности. Ниже — диапазоны цен нашего ассортимента с рекомендацией, когда какая серия подходит лучше.",
    priceTable: {
      head: ["Серия", "Применение", "Диапазон цен"],
      rows: [
        ["Grundfos UPA", "компактное повышение перед бойлером или душем", "156–299 €"],
        ["Grundfos SCALA1", "водяной автомат «всё в одном» для всего дома", "452–571 €"],
        ["Grundfos SCALA2", "постоянное давление, очень тихая — лучший выбор для дома", "ок. 657 €"],
        ["CMBE / CMBE TWIN", "многоквартирные и коммерческие здания — большие расходы", "1443–4802 €"],
      ],
    },
    faqTitle: "Часто задаваемые вопросы",
    faq: [
      {
        q: "Почему в моём доме низкое давление воды?",
        a: "Типичные причины — слабый напор в городской сети, засорившийся фильтр или длинный и узкий трубопровод. Если причина в напоре сети, проблему решает насос повышения давления — UPA для одного потребителя, SCALA1 или SCALA2 для всего дома.",
      },
      {
        q: "Какой насос повышения давления лучший для дома?",
        a: "Для повышения давления во всём доме лучший выбор — Grundfos SCALA2: она держит давление постоянным даже при нескольких открытых кранах и практически бесшумна. Если важнее бюджет, SCALA1 предлагает ту же автоматику дешевле.",
      },
      {
        q: "Сколько стоит насос повышения давления?",
        a: "Небольшой насос UPA в нашем ассортименте стоит 156–299 €, SCALA1 для всего дома — 452–571 €, SCALA2 — около 657 €. Системы CMBE для больших зданий начинаются от 1443 €.",
      },
      {
        q: "Чем отличаются SCALA1 и SCALA2?",
        a: "Обе — водяные автоматы «всё в одном» для повышения давления во всём доме. SCALA2 держит давление абсолютно постоянным независимо от расхода и тише; SCALA1 доступнее и подходит для дома меньшего размера с меньшим расходом.",
      },
      {
        q: "Подходит ли насос повышения давления для квартиры?",
        a: "Да — компактная UPA устанавливается в трубу перед бойлером или душем, а SCALA1/SCALA2 помещаются в кухонный или технический шкаф. Тихая работа делает их подходящими и для квартиры.",
      },
      {
        q: "Включается ли насос автоматически?",
        a: "Да — все перечисленные модели включаются и выключаются автоматически при разборе воды. Модели SCALA также регулируют обороты, чтобы давление оставалось ровным.",
      },
    ],
  },
  lv: {
    guideTitle: "Kā izvēlēties spiediena palielināšanas sūkni?",
    guideParagraphs: [
      "Spiediena palielināšanas sūknis risina zema ūdens spiediena problēmu — kad duša ir vāja vai tvertne piepildās lēni. Pareizā izvēle ir atkarīga no tā, vai jāpalielina spiediens vienam patērētājam (boilerim, dušai) vai visai mājai, vajadzīgās plūsmas un trokšņa līmeņa.",
      "Grundfos UPA ir mazs, kompakts sūknis, ko uzstāda caurulē tieši pirms boilera vai dušas — ātrs risinājums viena patērētāja spiediena uzlabošanai.",
      "Lai palielinātu spiedienu visā mājā, pareizā izvēle ir „viss vienā” ūdens automāts SCALA1 vai SCALA2. SCALA2 uztur spiedienu pilnīgi nemainīgu arī ar vairākiem atvērtiem krāniem un ir praktiski klusa.",
      "Lielākām ēkām — dzīvojamām mājām, komercēkām, lielām plūsmām — paredzētas daudzpakāpju CMBE un CMBE TWIN sistēmas.",
    ],
    priceTitle: "Spiediena palielināšanas sūkņa cena",
    priceIntro:
      "Cena ir atkarīga no sērijas un jaudas. Zemāk ir mūsu klāsta cenu diapazoni ar ieteikumu, kad kura sērija der vislabāk.",
    priceTable: {
      head: ["Sērija", "Pielietojums", "Cenu diapazons"],
      rows: [
        ["Grundfos UPA", "kompakts spiediena palielinājums pirms boilera vai dušas", "156–299 €"],
        ["Grundfos SCALA1", "„viss vienā” ūdens automāts visai mājai", "452–571 €"],
        ["Grundfos SCALA2", "nemainīgs spiediens, ļoti klusa — labākā izvēle mājai", "apm. 657 €"],
        ["CMBE / CMBE TWIN", "dzīvojamās un komercēkas — lielās plūsmas", "1443–4802 €"],
      ],
    },
    faqTitle: "Bieži uzdotie jautājumi",
    faq: [
      {
        q: "Kāpēc manā mājā ir zems ūdens spiediens?",
        a: "Tipiski iemesli ir vājš spiediens pilsētas tīklā, aizsērējis filtrs vai gara un šaura cauruļvadu sistēma. Ja iemesls ir tīkla spiediens, problēmu risina spiediena palielināšanas sūknis — UPA vienam patērētājam, SCALA1 vai SCALA2 visai mājai.",
      },
      {
        q: "Kurš spiediena palielināšanas sūknis ir labākais mājai?",
        a: "Spiediena palielināšanai visā mājā labākā izvēle ir Grundfos SCALA2 — tā uztur spiedienu nemainīgu arī ar vairākiem vienlaikus atvērtiem krāniem un ir praktiski klusa. Ja svarīgāka ir cena, SCALA1 piedāvā to pašu automātiku lētāk.",
      },
      {
        q: "Cik maksā spiediena palielināšanas sūknis?",
        a: "Mazais UPA sūknis mūsu klāstā maksā 156–299 €, SCALA1 visai mājai 452–571 € un SCALA2 apmēram 657 €. CMBE sistēmas lielākām ēkām sākas no 1443 €.",
      },
      {
        q: "Kāda ir atšķirība starp SCALA1 un SCALA2?",
        a: "Abas ir „viss vienā” ūdens automāti spiediena palielināšanai visā mājā. SCALA2 uztur spiedienu pilnīgi nemainīgu neatkarīgi no patēriņa un ir klusāka; SCALA1 ir pieejamāka un der mazākai mājai ar mazāku patēriņu.",
      },
      {
        q: "Vai spiediena palielināšanas sūknis der dzīvoklim?",
        a: "Jā — kompakto UPA uzstāda caurulē pirms boilera vai dušas, un SCALA1/SCALA2 atradīs vietu virtuves vai tehniskajā skapī. Klusā darbība padara tās piemērotas arī dzīvoklim.",
      },
      {
        q: "Vai sūknis ieslēdzas automātiski?",
        a: "Jā — visi uzskaitītie modeļi ieslēdzas un izslēdzas automātiski ūdens patēriņa brīdī. SCALA modeļi regulē arī apgriezienus, lai spiediens paliktu vienmērīgs.",
      },
    ],
  },
  lt: {
    guideTitle: "Kaip išsirinkti slėgio didinimo siurblį?",
    guideParagraphs: [
      "Slėgio didinimo siurblys sprendžia žemo vandens slėgio problemą — kai dušas silpnas arba bakas prisipildo lėtai. Tinkamas pasirinkimas priklauso nuo to, ar slėgį reikia kelti vienam vartotojui (boileriui, dušui), ar visam namui, reikiamo srauto ir triukšmo lygio.",
      "Grundfos UPA yra mažas kompaktiškas siurblys, montuojamas vamzdyje tiesiai prieš boilerį ar dušą — greitas sprendimas vieno vartotojo slėgiui pagerinti.",
      "Viso namo vandens slėgiui kelti tinkamas pasirinkimas yra „viskas viename“ vandens automatas SCALA1 arba SCALA2. SCALA2 palaiko visiškai pastovų slėgį net atidarius kelis čiaupus vienu metu ir yra praktiškai tylus.",
      "Didesniems pastatams — daugiabučiams, komerciniams objektams, dideliems srautams — skirtos daugiapakopės CMBE ir CMBE TWIN sistemos.",
    ],
    priceTitle: "Slėgio didinimo siurblio kaina",
    priceIntro:
      "Kaina priklauso nuo serijos ir galingumo. Žemiau pateikiami mūsų asortimento kainų diapazonai su rekomendacija, kada kuri serija tinka geriausiai.",
    priceTable: {
      head: ["Serija", "Paskirtis", "Kainų diapazonas"],
      rows: [
        ["Grundfos UPA", "kompaktiškas slėgio padidinimas prieš boilerį ar dušą", "156–299 €"],
        ["Grundfos SCALA1", "„viskas viename“ vandens automatas visam namui", "452–571 €"],
        ["Grundfos SCALA2", "pastovus slėgis, labai tylus — geriausias pasirinkimas namui", "apie 657 €"],
        ["CMBE / CMBE TWIN", "daugiabučiai ir komerciniai pastatai — dideli srautai", "1443–4802 €"],
      ],
    },
    faqTitle: "Dažnai užduodami klausimai",
    faq: [
      {
        q: "Kodėl mano name žemas vandens slėgis?",
        a: "Tipinės priežastys — silpnas slėgis miesto tinkle, užsikimšęs filtras arba ilgas ir siauras vamzdynas. Jei priežastis yra tinklo slėgis, problemą sprendžia slėgio didinimo siurblys — UPA vienam vartotojui, SCALA1 arba SCALA2 visam namui.",
      },
      {
        q: "Kuris slėgio didinimo siurblys geriausias namui?",
        a: "Viso namo slėgiui kelti geriausias pasirinkimas yra Grundfos SCALA2 — jis palaiko pastovų slėgį net atidarius kelis čiaupus vienu metu ir yra praktiškai tylus. Jei svarbiau biudžetas, SCALA1 siūlo tą pačią automatiką pigiau.",
      },
      {
        q: "Kiek kainuoja slėgio didinimo siurblys?",
        a: "Mažas UPA siurblys mūsų asortimente kainuoja 156–299 €, SCALA1 visam namui — 452–571 €, SCALA2 — apie 657 €. CMBE sistemos didesniems pastatams prasideda nuo 1443 €.",
      },
      {
        q: "Kuo skiriasi SCALA1 ir SCALA2?",
        a: "Abu yra „viskas viename“ vandens automatai viso namo slėgiui kelti. SCALA2 palaiko visiškai pastovų slėgį nepriklausomai nuo sunaudojimo ir yra tylesnis; SCALA1 pigesnis ir tinka mažesniam namui su mažesniu sunaudojimu.",
      },
      {
        q: "Ar slėgio didinimo siurblys tinka butui?",
        a: "Taip — kompaktiškas UPA montuojamas vamzdyje prieš boilerį ar dušą, o SCALA1/SCALA2 tilps į virtuvės ar techninę spintą. Tylus veikimas daro juos tinkamus ir butui.",
      },
      {
        q: "Ar siurblys įsijungia automatiškai?",
        a: "Taip — visi išvardyti modeliai įsijungia ir išsijungia automatiškai atidarius vandenį. SCALA modeliai taip pat reguliuoja sūkius, kad slėgis išliktų tolygus.",
      },
    ],
  },
}

const TSIRKULATSIOONIPUMBAD: Record<Locale, CategoryContentSection> = {
  et: {
    guideTitle: "Kuidas valida sooja tarbevee tsirkulatsioonipump?",
    guideParagraphs: [
      "Sooja tarbevee tsirkulatsioonipump hoiab kuuma vee torustikus ringluses, nii et soe vesi tuleb kraanist kohe — ilma et peaksid vett ja aega raisates ootama. Õige valik sõltub maja suurusest, torustiku pikkusest ja sellest, kas majas on tagasivooluliin (ringlusliin) või mitte.",
      "Eramusse ja korterisse on parim valik COMFORT seeria pump — COMFORT AUTOADAPT-iga õpib sinu majapidamise veetarbimise harjumused ja lülitub sisse ainult siis, kui sooja vett tõenäoliselt vaja on, mis hoiab elektri- ja soojakulu minimaalsena. Kui majas pole tagasivooluliini, lahendab selle COMFORT BX koos termostaatventiiliga, mis paigaldatakse kaugeima veevõtupunkti juurde.",
      "Klassikalises ringlusliiniga süsteemis töötab roostevaba korpusega UPS(N) — see on mõeldud just sooja tarbevee jaoks, sest tavaline malmpump hakkab joogivees roostetama. Sama N-korpusega on saadaval ka ALPHA1 ja ALPHA2 mudelid, mis reguleerivad võimsust automaatselt ja tarbivad märgatavalt vähem elektrit.",
      "Suurtesse hoonetesse — kortermajadesse, hotellidesse, spordikeskustesse — kus ringlusliinid on pikad ja vooluhulgad suured, on õiged valikud MAGNA1 ja MAGNA3, mis hoiavad rõhu ja temperatuuri ühtlasena kogu hoones. Kui soojal kraanil jääb lihtsalt rõhku vajaka, lisab selle juurde kompaktne UPA rõhutõstepump.",
    ],
    priceTitle: "Sooja tarbevee tsirkulatsioonipumba hind",
    priceIntro:
      "Hind sõltub seeriast ja võimsusest. Allpool on meie valiku hinnavahemikud koos soovitusega, millal kumbki seeria kõige paremini sobib.",
    priceTable: {
      head: ["Seeria", "Sobivus", "Hinnavahemik"],
      rows: [
        ["Grundfos COMFORT", "kohene soe vesi kraanist — eramud ja korterid", "145–278 €"],
        ["Grundfos UPA", "kompaktne rõhutõstepump kraani või boileari juurde", "156–299 €"],
        ["UPS(N)", "klassikaline roostevaba ringluspump tagasivooluliiniga süsteemi", "276–859 €"],
        ["Grundfos ALPHA1 N", "energiasäästlik ringluspump väiksemasse majja", "376–488 €"],
        ["Grundfos ALPHA2 N", "AUTOADAPT-juhtimisega tippmudel eramusse", "496–863 €"],
        ["Grundfos MAGNA1", "kortermajad ja ärihooned — suured ringlusliinid", "432–1515 €"],
        ["Grundfos MAGNA3", "tippmudel suurtesse hoonetesse — FLOWADAPT ja juhtimine", "534–2456 €"],
      ],
    },
    faqTitle: "Korduma kippuvad küsimused",
    faq: [
      {
        q: "Mis vahe on küttepumbal ja sooja tarbevee tsirkulatsioonipumbal?",
        a: "Küttepump liigutab vett radiaatorite või põrandakütte ringes ja selle korpus võib olla malmist. Sooja tarbevee pump puutub kokku joogiveega, seepärast peab korpus olema roostevaba (N-mudelid) — näiteks UPS(N), ALPHA1 N või COMFORT. Malmpumpa tarbevee ringluses kasutada ei tohi, sest vesi hakkab roostetama.",
      },
      {
        q: "Milline on parim sooja tarbevee tsirkulatsioonipump eramule?",
        a: "Enamikele eramutele on parim valik COMFORT AUTOADAPT-iga — pump õpib, millal majas tavaliselt sooja vett tarbitakse, ja käib ainult siis, seega soe vesi on kraanis kohe olemas, aga pump ei tööta asjatult. Kui tagasivooluliini pole, sobib COMFORT BX koos termostaatventiiliga.",
      },
      {
        q: "Kui palju maksab sooja tarbevee tsirkulatsioonipump?",
        a: "Meie valikus algavad hinnad 145 eurot (COMFORT 15-14 M) ja tavaline eramu lahendus jääb 145–278 € vahele. Roostevaba UPS(N) maksab 276–859 €, ALPHA mudelid 376–863 € ja suurte hoonete MAGNA seeriad 432 € kuni 2456 €.",
      },
      {
        q: "Kui palju tsirkulatsioonipump energiat säästab?",
        a: "Ilma ringluspumbata lastakse sooja vee ootamiseks kanalisatsiooni iga päev kümneid liitreid maha jahutunud vett — see on raisatud vesi ja kütteenergia. COMFORT AUTOADAPT tarbib töötades vaid üksikuid vatte ja käib ainult vajaduse korral, seega tema aastane elektrikulu jääb mõne euro kanti.",
      },
      {
        q: "Kas pump töötab ka siis, kui majas pole tagasivooluliini?",
        a: "Jah — sellisesse majja vali COMFORT BX variant, mis paigaldatakse koos termostaatventiiliga kaugeima veevõtupunkti juurde. Ventiil laseb soojal veel külma vee liini mööda tagasi liikuda, kuni soe vesi kraani jõuab, ja eraldi ringlusliini pole vaja ehitada.",
      },
      {
        q: "Millal tuleks vaadata UPS(N), ALPHA või MAGNA pumpa?",
        a: "Kui majas on juba olemas tagasivooluliin ja soovid lihtsat ning töökindlat lahendust, on UPS(N) hea valik. ALPHA1 N ja ALPHA2 N reguleerivad võimsust automaatselt ja säästavad elektrit. MAGNA1 ja MAGNA3 on mõeldud kortermajadele, hotellidele ja muudesse suurtesse hoonetesse pikkade ringlusliinidega.",
      },
    ],
  },
  en: {
    guideTitle: "How to choose a domestic hot water circulation pump?",
    guideParagraphs: [
      "A domestic hot water circulation pump keeps hot water moving through the pipes, so hot water comes from the tap instantly — without wasting water and time waiting. The right choice depends on the size of the home, the pipe lengths and whether the house has a dedicated return line or not.",
      "For houses and apartments the best choice is the COMFORT series — COMFORT with AUTOADAPT learns your household's hot water habits and only runs when hot water is likely needed, keeping electricity and heat loss to a minimum. If the house has no return line, COMFORT BX with a thermal bypass valve installed at the furthest tap solves it.",
      "In a classic system with a return line, the stainless-steel UPS(N) does the job — it is made specifically for domestic hot water, because a standard cast-iron pump would rust in drinking water. The ALPHA1 and ALPHA2 models are also available with the same N housing, adjusting their output automatically and using noticeably less electricity.",
      "For larger buildings — apartment blocks, hotels, sports centres — where circulation lines are long and flows large, MAGNA1 and MAGNA3 are the right choices, keeping pressure and temperature even across the building. And if a hot tap simply lacks pressure, the compact UPA booster pump adds it.",
    ],
    priceTitle: "Hot water circulation pump prices",
    priceIntro:
      "The price depends on the series and capacity. Below are the price ranges of our selection with a recommendation on when each series fits best.",
    priceTable: {
      head: ["Series", "Best for", "Price range"],
      rows: [
        ["Grundfos COMFORT", "instant hot water at the tap — houses and apartments", "€145–278"],
        ["Grundfos UPA", "compact booster pump for a tap or water heater", "€156–299"],
        ["UPS(N)", "classic stainless circulator for systems with a return line", "€276–859"],
        ["Grundfos ALPHA1 N", "energy-saving circulator for a smaller home", "€376–488"],
        ["Grundfos ALPHA2 N", "top model with AUTOADAPT control for houses", "€496–863"],
        ["Grundfos MAGNA1", "apartment blocks and commercial buildings — long circuits", "€432–1515"],
        ["Grundfos MAGNA3", "top model for large buildings — FLOWADAPT and controls", "€534–2456"],
      ],
    },
    faqTitle: "Frequently asked questions",
    faq: [
      {
        q: "What is the difference between a heating circulator and a hot water circulator?",
        a: "A heating circulator moves water around radiators or underfloor heating and may have a cast-iron housing. A domestic hot water circulator is in contact with drinking water, so its housing must be stainless steel (the N models) — for example UPS(N), ALPHA1 N or COMFORT. A cast-iron pump must not be used for domestic hot water, as the water would start to rust.",
      },
      {
        q: "Which is the best hot water circulation pump for a house?",
        a: "For most houses the best choice is COMFORT with AUTOADAPT — the pump learns when hot water is typically used and only runs then, so hot water is instant at the tap without the pump running needlessly. If there is no return line, choose COMFORT BX with a thermal bypass valve.",
        },
      {
        q: "How much does a hot water circulation pump cost?",
        a: "In our range prices start at €145 (COMFORT 15-14 M) and a typical house solution stays within €145–278. The stainless UPS(N) costs €276–859, the ALPHA models €376–863 and the MAGNA ranges for large buildings €432 to €2456.",
      },
      {
        q: "How much energy does a circulation pump save?",
        a: "Without a circulator, tens of litres of cooled water are poured down the drain every day while waiting for hot water — wasted water and heating energy. COMFORT with AUTOADAPT uses only a few watts and runs only when needed, so its annual electricity cost is just a few euros.",
      },
      {
        q: "Does the pump work if the house has no return line?",
        a: "Yes — in that case choose the COMFORT BX variant, installed with a thermal bypass valve at the furthest tap. The valve lets hot water push back along the cold line until it reaches the tap, so no separate return pipe needs to be built.",
      },
      {
        q: "When should I look at UPS(N), ALPHA or MAGNA?",
        a: "If the house already has a return line and you want a simple, reliable solution, UPS(N) is a good choice. ALPHA1 N and ALPHA2 N adjust their output automatically and save electricity. MAGNA1 and MAGNA3 are meant for apartment blocks, hotels and other large buildings with long circulation lines.",
      },
    ],
  },
  ru: {
    guideTitle: "Как выбрать циркуляционный насос горячего водоснабжения?",
    guideParagraphs: [
      "Циркуляционный насос ГВС поддерживает движение горячей воды в трубах, поэтому горячая вода идёт из крана сразу — без ожидания и лишнего расхода. Правильный выбор зависит от размера дома, длины труб и наличия обратной линии (циркуляционного стояка).",
      "Для частного дома и квартиры лучший выбор — серия COMFORT: COMFORT с AUTOADAPT запоминает привычки потребления горячей воды и включается только тогда, когда она действительно нужна, поэтому расход электричества и теплопотери минимальны. Если обратной линии нет, задачу решает COMFORT BX с термостатическим клапаном у самой дальней точки разбора.",
      "В классической системе с обратной линией работает UPS(N) в нержавеющем корпусе — он создан именно для горячей санитарной воды, ведь обычный чугунный насос в питьевой воде начал бы ржаветь. С таким же N-корпусом доступны и модели ALPHA1 и ALPHA2, которые автоматически регулируют мощность и заметно экономят электричество.",
      "Для больших зданий — многоквартирных домов, отелей, спортивных центров — с длинными циркуляционными линиями и большими расходами правильный выбор MAGNA1 и MAGNA3: они держат давление и температуру равномерными по всему зданию. А если горячему крану просто не хватает давления, его добавит компактный повысительный насос UPA.",
    ],
    priceTitle: "Цена циркуляционного насоса ГВС",
    priceIntro:
      "Цена зависит от серии и мощности. Ниже — диапазоны цен нашего ассортимента с рекомендацией, когда какая серия подходит лучше.",
    priceTable: {
      head: ["Серия", "Применение", "Диапазон цен"],
      rows: [
        ["Grundfos COMFORT", "мгновенная горячая вода из крана — дома и квартиры", "145–278 €"],
        ["Grundfos UPA", "компактный повысительный насос к крану или бойлеру", "156–299 €"],
        ["UPS(N)", "классический нержавеющий циркуляционный насос с обратной линией", "276–859 €"],
        ["Grundfos ALPHA1 N", "энергосберегающий насос для небольшого дома", "376–488 €"],
        ["Grundfos ALPHA2 N", "топ-модель с AUTOADAPT для дома", "496–863 €"],
        ["Grundfos MAGNA1", "многоквартирные и коммерческие здания — длинные линии", "432–1515 €"],
        ["Grundfos MAGNA3", "топ-модель для больших зданий — FLOWADAPT и управление", "534–2456 €"],
      ],
    },
    faqTitle: "Часто задаваемые вопросы",
    faq: [
      {
        q: "Чем отличается циркуляционный насос отопления от насоса ГВС?",
        a: "Насос отопления перемещает воду в контуре радиаторов или тёплого пола и может иметь чугунный корпус. Насос ГВС контактирует с питьевой водой, поэтому его корпус должен быть нержавеющим (модели N) — например UPS(N), ALPHA1 N или COMFORT. Чугунный насос для санитарной воды использовать нельзя: вода начнёт ржаветь.",
      },
      {
        q: "Какой насос ГВС лучший для частного дома?",
        a: "Для большинства домов лучший выбор — COMFORT с AUTOADAPT: насос запоминает, когда обычно расходуется горячая вода, и работает только в это время, поэтому горячая вода в кране появляется сразу, а насос не работает впустую. Если обратной линии нет, подходит COMFORT BX с термостатическим клапаном.",
      },
      {
        q: "Сколько стоит циркуляционный насос ГВС?",
        a: "В нашем ассортименте цены начинаются от 145 евро (COMFORT 15-14 M), типичное решение для дома укладывается в 145–278 €. Нержавеющий UPS(N) стоит 276–859 €, модели ALPHA — 376–863 €, а серии MAGNA для больших зданий — от 432 до 2456 €.",
      },
      {
        q: "Сколько энергии экономит циркуляционный насос?",
        a: "Без циркуляционного насоса в ожидании горячей воды в канализацию ежедневно сливаются десятки литров остывшей воды — это потраченные впустую вода и тепло. COMFORT с AUTOADAPT потребляет всего несколько ватт и работает только при необходимости, поэтому его годовой расход электричества составляет считанные евро.",
      },
      {
        q: "Работает ли насос, если в доме нет обратной линии?",
        a: "Да — в таком случае выбирайте вариант COMFORT BX, который устанавливается с термостатическим клапаном у самой дальней точки разбора. Клапан пускает горячую воду по обратке холодной линии, пока она не дойдёт до крана, поэтому отдельную циркуляционную трубу прокладывать не нужно.",
      },
      {
        q: "Когда стоит смотреть на UPS(N), ALPHA или MAGNA?",
        a: "Если в доме уже есть обратная линия и нужно простое надёжное решение, хороший выбор — UPS(N). ALPHA1 N и ALPHA2 N автоматически регулируют мощность и экономят электричество. MAGNA1 и MAGNA3 предназначены для многоквартирных домов, отелей и других больших зданий с длинными циркуляционными линиями.",
      },
    ],
  },
  lv: {
    guideTitle: "Kā izvēlēties karstā ūdens cirkulācijas sūkni?",
    guideParagraphs: [
      "Karstā ūdens cirkulācijas sūknis uztur karsto ūdeni kustībā cauruļvados, tāpēc karstais ūdens nāk no krāna uzreiz — bez gaidīšanas un lieka ūdens izliešanas. Pareizā izvēle ir atkarīga no mājas lieluma, cauruļvadu garuma un tā, vai mājā ir atgriezes līnija (cirkulācijas stāvvads).",
      "Privātmājai un dzīvoklim labākā izvēle ir COMFORT sērija — COMFORT ar AUTOADAPT iemācās jūsu mājsaimniecības karstā ūdens patēriņa paradumus un ieslēdzas tikai tad, kad karstais ūdens tiešām ir vajadzīgs, tāpēc elektroenerģijas un siltuma zudumi ir minimāli. Ja atgriezes līnijas nav, problēmu atrisina COMFORT BX ar termostatisko vārstu pie tālākā ūdens ņemšanas punkta.",
      "Klasiskajā sistēmā ar atgriezes līniju darbojas UPS(N) ar nerūsējošā tērauda korpusu — tas ir veidots tieši karstajam lietošanas ūdenim, jo parastais čuguna sūknis dzeramajā ūdenī sāktu rūsēt. Ar tādu pašu N korpusu pieejami arī ALPHA1 un ALPHA2 modeļi, kas automātiski regulē jaudu un ievērojami taupa elektroenerģiju.",
      "Lielām ēkām — daudzdzīvokļu mājām, viesnīcām, sporta centriem — ar garām cirkulācijas līnijām un lielām plūsmām pareizā izvēle ir MAGNA1 un MAGNA3, kas uztur spiedienu un temperatūru vienmērīgu visā ēkā. Un ja karstajam krānam vienkārši pietrūkst spiediena, to pievieno kompaktais UPA spiediena paaugstināšanas sūknis.",
    ],
    priceTitle: "Karstā ūdens cirkulācijas sūkņa cena",
    priceIntro:
      "Cena ir atkarīga no sērijas un jaudas. Zemāk ir mūsu klāsta cenu diapazoni ar ieteikumu, kad kura sērija der vislabāk.",
    priceTable: {
      head: ["Sērija", "Pielietojums", "Cenu diapazons"],
      rows: [
        ["Grundfos COMFORT", "tūlītējs karstais ūdens no krāna — mājas un dzīvokļi", "145–278 €"],
        ["Grundfos UPA", "kompaktais spiediena paaugstināšanas sūknis krānam vai boilerim", "156–299 €"],
        ["UPS(N)", "klasiskais nerūsējošā tērauda cirkulācijas sūknis ar atgriezes līniju", "276–859 €"],
        ["Grundfos ALPHA1 N", "enerģiju taupošs sūknis mazākai mājai", "376–488 €"],
        ["Grundfos ALPHA2 N", "topmodelis ar AUTOADAPT vadību mājai", "496–863 €"],
        ["Grundfos MAGNA1", "daudzdzīvokļu un komercēkas — garas līnijas", "432–1515 €"],
        ["Grundfos MAGNA3", "topmodelis lielām ēkām — FLOWADAPT un vadība", "534–2456 €"],
      ],
    },
    faqTitle: "Bieži uzdotie jautājumi",
    faq: [
      {
        q: "Kāda ir atšķirība starp apkures cirkulācijas sūkni un karstā ūdens cirkulācijas sūkni?",
        a: "Apkures sūknis pārvieto ūdeni radiatoru vai grīdas apkures kontūrā, un tam var būt čuguna korpuss. Karstā lietošanas ūdens sūknis saskaras ar dzeramo ūdeni, tāpēc tā korpusam jābūt nerūsējošā tēraudā (N modeļiem) — piemēram, UPS(N), ALPHA1 N vai COMFORT. Čuguna sūkni lietošanas ūdenim nedrīkst izmantot, jo ūdens sāktu rūsēt.",
      },
      {
        q: "Kurš ir labākais karstā ūdens cirkulācijas sūknis privātmājai?",
        a: "Vairumam māju labākā izvēle ir COMFORT ar AUTOADAPT — sūknis iemācās, kad mājā parasti tiek patērēts karstais ūdens, un darbojas tikai tad, tāpēc karstais ūdens krānā ir uzreiz, bet sūknis nedarbojas velti. Ja atgriezes līnijas nav, der COMFORT BX ar termostatisko vārstu.",
      },
      {
        q: "Cik maksā karstā ūdens cirkulācijas sūknis?",
        a: "Mūsu klāstā cenas sākas no 145 eiro (COMFORT 15-14 M), un tipisks mājas risinājums paliek robežās 145–278 €. Nerūsējošā tērauda UPS(N) maksā 276–859 €, ALPHA modeļi — 376–863 €, bet MAGNA sērijas lielām ēkām — no 432 līdz 2456 €.",
      },
      {
        q: "Cik daudz enerģijas cirkulācijas sūknis ietaupa?",
        a: "Bez cirkulācijas sūkņa, gaidot karsto ūdeni, kanalizācijā katru dienu izlej desmitiem litru atdzisuša ūdens — tā ir izšķiests ūdens un siltumenerģija. COMFORT ar AUTOADAPT patērē tikai dažus vatus un darbojas tikai vajadzības gadījumā, tāpēc tā gada elektroenerģijas izmaksas ir nieka daži eiro.",
      },
      {
        q: "Vai sūknis strādā, ja mājā nav atgriezes līnijas?",
        a: "Jā — šādā gadījumā izvēlieties COMFORT BX variantu, kas tiek uzstādīts ar termostatisko vārstu pie tālākā ūdens ņemšanas punkta. Vārsts ļauj karstajam ūdenim izspiest aukstās līnijas ūdeni atpakaļ, līdz karstais ūdens nonāk krānā, tāpēc atsevišķa cirkulācijas caurule nav jābūvē.",
      },
      {
        q: "Kad vajadzētu skatīt UPS(N), ALPHA vai MAGNA sūkni?",
        a: "Ja mājā jau ir atgriezes līnija un vēlaties vienkāršu un uzticamu risinājumu, UPS(N) ir laba izvēle. ALPHA1 N un ALPHA2 N automātiski regulē jaudu un taupa elektroenerģiju. MAGNA1 un MAGNA3 ir paredzēti daudzdzīvokļu mājām, viesnīcām un citām lielām ēkām ar garām cirkulācijas līnijām.",
      },
    ],
  },
  lt: {
    guideTitle: "Kaip išsirinkti karšto vandens cirkuliacinį siurblį?",
    guideParagraphs: [
      "Karšto vandens cirkuliacinis siurblys palaiko karšto vandens judėjimą vamzdynuose, todėl karštas vanduo iš čiaupo teka iškart — nereikia laukti ir švaistyti vandens. Tinkamas pasirinkimas priklauso nuo namo dydžio, vamzdynų ilgio ir to, ar name yra grįžtamoji linija (cirkuliacinis stovas).",
      "Namui ar butui geriausias pasirinkimas yra COMFORT serija — COMFORT su AUTOADAPT išmoksta jūsų šeimos karšto vandens vartojimo įpročius ir įsijungia tik tada, kai karšto vandens tikriausiai reikia, todėl elektros ir šilumos nuostoliai minimalūs. Jei grįžtamosios linijos nėra, problemą išsprendžia COMFORT BX su termostatine sklende, montuojama prie tolimiausio vandens paėmimo taško.",
      "Klasikinėje sistemoje su grįžtamąja linija dirba UPS(N) su nerūdijančiojo plieno korpusu — jis sukurtas būtent karštam buitiniam vandeniui, nes įprastas ketaus siurblys geriamajame vandenyje pradėtų rūdyti. Su tokiu pačiu N korpusu galimi ir ALPHA1 bei ALPHA2 modeliai, kurie automatiškai reguliuoja galią ir pastebimai taupo elektrą.",
      "Dideliems pastatams — daugiabučiams, viešbučiams, sporto centrams — su ilgomis cirkuliacinėmis linijomis ir dideliais srautais tinkamas pasirinkimas yra MAGNA1 ir MAGNA3, kurie palaiko tolygų slėgį ir temperatūrą visame pastate. O jei karštam čiaupui tiesiog trūksta slėgio, jį padidina kompaktiškas UPA slėgio didinimo siurblys.",
    ],
    priceTitle: "Karšto vandens cirkuliacinio siurblio kaina",
    priceIntro:
      "Kaina priklauso nuo serijos ir galingumo. Žemiau pateikiami mūsų asortimento kainų diapazonai su rekomendacija, kada kuri serija tinka geriausiai.",
    priceTable: {
      head: ["Serija", "Paskirtis", "Kainų diapazonas"],
      rows: [
        ["Grundfos COMFORT", "karštas vanduo iš čiaupo iš karto — namai ir butai", "145–278 €"],
        ["Grundfos UPA", "kompaktiškas slėgio didinimo siurblys prie čiaupo ar boilerio", "156–299 €"],
        ["UPS(N)", "klasikinis nerūdijančiojo plieno cirkuliacinis siurblys su grįžtamąja linija", "276–859 €"],
        ["Grundfos ALPHA1 N", "energiją taupantis siurblys mažesniam namui", "376–488 €"],
        ["Grundfos ALPHA2 N", "top modelis su AUTOADAPT valdymu namui", "496–863 €"],
        ["Grundfos MAGNA1", "daugiabučiai ir komerciniai pastatai — ilgos linijos", "432–1515 €"],
        ["Grundfos MAGNA3", "top modelis dideliems pastatams — FLOWADAPT ir valdymas", "534–2456 €"],
      ],
    },
    faqTitle: "Dažnai užduodami klausimai",
    faq: [
      {
        q: "Kuo skiriasi šildymo cirkuliacinis siurblys nuo karšto vandens cirkuliacinio siurblio?",
        a: "Šildymo siurblys varo vandenį radiatorių ar grindinio šildymo kontūre, ir jo korpusas gali būti ketaus. Karšto buitinio vandens siurblys liečiasi su geriamuoju vandeniu, todėl jo korpusas turi būti nerūdijančiojo plieno (N modeliai) — pavyzdžiui, UPS(N), ALPHA1 N ar COMFORT. Ketaus siurblio buitiniam vandeniui naudoti negalima, nes vanduo pradėtų rūdyti.",
      },
      {
        q: "Kuris karšto vandens cirkuliacinis siurblys geriausias individualiam namui?",
        a: "Daugumai namų geriausias pasirinkimas yra COMFORT su AUTOADAPT — siurblys išmoksta, kada namuose paprastai naudojamas karštas vanduo, ir dirba tik tuo metu, todėl karštas vanduo čiaupe atsiranda iškart, o siurblys nedirba veltui. Jei grįžtamosios linijos nėra, tinka COMFORT BX su termostatine sklende.",
      },
      {
        q: "Kiek kainuoja karšto vandens cirkuliacinis siurblys?",
        a: "Mūsų asortimente kainos prasideda nuo 145 eurų (COMFORT 15-14 M), o tipiškas namo sprendimas telpa į 145–278 €. Nerūdijančiojo plieno UPS(N) kainuoja 276–859 €, ALPHA modeliai — 376–863 €, o MAGNA serijos dideliems pastatams — nuo 432 iki 2456 €.",
      },
      {
        q: "Kiek energijos sutaupo cirkuliacinis siurblys?",
        a: "Be cirkuliacinio siurblio, laukiant karšto vandens, į kanalizaciją kasdien išleidžiami dešimtys litrų atvėsusio vandens — tai iššvaistytas vanduo ir šiluma. COMFORT su AUTOADAPT naudoja tik kelis vatus ir dirba tik prireikus, todėl jo metinės elektros išlaidos yra vos keli eurai.",
      },
      {
        q: "Ar siurblys veikia, jei name nėra grįžtamosios linijos?",
        a: "Taip — tokiu atveju rinkitės COMFORT BX variantą, kuris montuojamas su termostatine sklende prie tolimiausio vandens paėmimo taško. Sklendė leidžia karštam vandeniui išstumti šaltos linijos vandenį atgal, kol karštas vanduo pasiekia čiaupą, todėl atskiros cirkuliacinės linijos tiesi nereikia.",
      },
      {
        q: "Kada verta rinktis UPS(N), ALPHA ar MAGNA siurblį?",
        a: "Jei name jau yra grįžtamoji linija ir norite paprasto bei patikimo sprendimo, UPS(N) yra geras pasirinkimas. ALPHA1 N ir ALPHA2 N automatiškai reguliuoja galią ir taupo elektrą. MAGNA1 ir MAGNA3 skirti daugiabučiams, viešbučiams ir kitiems dideliems pastatams su ilgomis cirkuliacinėmis linijomis.",
      },
    ],
  },
}

const CONTENT: Record<string, Record<Locale, CategoryContentSection>> = {
  veeautomaadid: VEEAUTOMAADID,
  kuttepumbad: KUTTEPUMBAD,
  drenaazipumbad: DRENAAZIPUMBAD,
  puurkaevupumbad: PUURKAEVUPUMBAD,
  reoveepumbad: REOVEEPUMBAD,
  salvkaevupumbad: SALVKAEVUPUMBAD,
  rohutostepumbad: ROHUTOSTEPUMBAD,
  'tsirkulatsioonipumbad-soe-tarbevesi': TSIRKULATSIOONIPUMBAD,
}

/** Editorial content for a category slug in the given locale (ET fallback). */
export function getCategoryContent(slug: string, locale: string): CategoryContentSection | null {
  const byLocale = CONTENT[slug]
  if (!byLocale) return null
  return byLocale[(locale as Locale)] ?? byLocale.et
}

/**
 * Product / series names mentioned in the editorial content mapped to their
 * e-shop pages. The category page turns these names into links (see
 * lib/linkify-products.tsx) — names are brand names, so they are identical
 * in every locale. Longest match wins (SBA before SB, SQE before SQ).
 */
const PRODUCT_LINKS: Record<string, Record<string, string>> = {
  veeautomaadid: {
    SCALA2: '/tooted/veeautomaadid/grundfos-scala2',
    SCALA1: '/tooted/veeautomaadid/grundfos-scala1',
    SBA: '/tooted/veeautomaadid/grundfos-sba',
    SB: '/tooted/veeautomaadid/grundfos-sb',
    JP: '/tooted/veeautomaadid/grundfos-jp',
    CMB: '/tooted/rohutostepumbad',
  },
  kuttepumbad: {
    'ALPHA1 GO': '/tooted/kuttepumbad/alpha1-go',
    'ALPHA2 GO': '/tooted/kuttepumbad/alpha2-go',
    'ALPHA GO': '/alpha-go',
    'ALPHA1 L': '/tooted/kuttepumbad/alpha1-l',
    ALPHA1: '/tooted/kuttepumbad/grundfos-alpha1',
    ALPHA2: '/tooted/kuttepumbad/grundfos-alpha2',
    MAGNA1: '/tooted/kuttepumbad/grundfos-magna1',
    MAGNA3: '/tooted/kuttepumbad/grundfos-magna3',
  },
  drenaazipumbad: {
    'Unilift CC': '/tooted/drenaazipumbad/unilift-cc',
    'Unilift KP': '/tooted/drenaazipumbad/unilift-kp',
    'Unilift AP': '/tooted/drenaazipumbad/unilift-ap',
    Unilift: '/unilift',
    CC: '/tooted/drenaazipumbad/unilift-cc',
    KP: '/tooted/drenaazipumbad/unilift-kp',
  },
  puurkaevupumbad: {
    SQE: '/tooted/puurkaevupumbad/sqe',
    SQ: '/tooted/puurkaevupumbad/grundfos-sq',
    SP: '/tooted/puurkaevupumbad/grundfos-sp',
  },
  reoveepumbad: {
    Sololift2: '/tooted/reoveepumbad/grundfos-sololift2',
    'Unilift APG': '/tooted/reoveepumbad/unilift-apg',
    'Unilift AP': '/tooted/reoveepumbad/unilift-ap',
    Unilift: '/unilift',
    APG: '/tooted/reoveepumbad/unilift-apg',
  },
  salvkaevupumbad: {
    SCALA2: '/tooted/veeautomaadid/grundfos-scala2',
    SCALA1: '/tooted/veeautomaadid/grundfos-scala1',
    SBA: '/tooted/salvkaevupumbad/grundfos-sba',
    SB: '/tooted/salvkaevupumbad/grundfos-sb',
    JP: '/tooted/salvkaevupumbad/grundfos-jp',
  },
  rohutostepumbad: {
    'CMBE TWIN': '/tooted/rohutostepumbad/cmbe-twin',
    CMBE: '/tooted/rohutostepumbad/cmbe',
    SCALA2: '/tooted/rohutostepumbad/grundfos-scala2',
    SCALA1: '/tooted/rohutostepumbad/grundfos-scala1',
    UPA: '/tooted/rohutostepumbad/grundfos-upa',
  },
  'tsirkulatsioonipumbad-soe-tarbevesi': {
    'UPS(N)': '/tooted/tsirkulatsioonipumbad-soe-tarbevesi/ups-n',
    COMFORT: '/tooted/tsirkulatsioonipumbad-soe-tarbevesi/grundfos-comfort',
    UPA: '/tooted/tsirkulatsioonipumbad-soe-tarbevesi/grundfos-upa',
    ALPHA1: '/tooted/tsirkulatsioonipumbad-soe-tarbevesi/grundfos-alpha1',
    ALPHA2: '/tooted/tsirkulatsioonipumbad-soe-tarbevesi/grundfos-alpha2',
    MAGNA1: '/tooted/tsirkulatsioonipumbad-soe-tarbevesi/grundfos-magna1',
    MAGNA3: '/tooted/tsirkulatsioonipumbad-soe-tarbevesi/grundfos-magna3',
  },
}

/** Product name → shop page map for a category slug ({} when none). */
export function getCategoryProductLinks(slug: string): Record<string, string> {
  return PRODUCT_LINKS[slug] ?? {}
}

export interface CategoryGuideImage {
  src: string
  alt: string
  href: string
}

/** Representative catalog image used to illustrate each category guide. */
const GUIDE_IMAGES: Record<string, CategoryGuideImage> = {
  veeautomaadid: {
    src: 'https://sdqnzyfmanflslsjhytf.supabase.co/storage/v1/object/public/products/images/93013252.jpg',
    alt: 'Grundfos SCALA2 veeautomaat',
    href: '/tooted/veeautomaadid/grundfos-scala2',
  },
  kuttepumbad: {
    src: 'https://sdqnzyfmanflslsjhytf.supabase.co/storage/v1/object/public/products/images/93074225.jpg',
    alt: 'Grundfos ALPHA2 GO küttepump',
    href: '/tooted/kuttepumbad/alpha2-go',
  },
  drenaazipumbad: {
    src: 'https://sdqnzyfmanflslsjhytf.supabase.co/storage/v1/object/public/products/images/96280965.jpg',
    alt: 'Grundfos Unilift CC drenaažipump',
    href: '/tooted/drenaazipumbad/unilift-cc',
  },
  puurkaevupumbad: {
    src: 'https://sdqnzyfmanflslsjhytf.supabase.co/storage/v1/object/public/products/images/96510199.jpg',
    alt: 'Grundfos SQ puurkaevupump',
    href: '/tooted/puurkaevupumbad/grundfos-sq',
  },
  reoveepumbad: {
    src: 'https://sdqnzyfmanflslsjhytf.supabase.co/storage/v1/object/public/products/images/97775317.jpg',
    alt: 'Grundfos Sololift2 reoveepump',
    href: '/tooted/reoveepumbad/grundfos-sololift2',
  },
  salvkaevupumbad: {
    src: 'https://sdqnzyfmanflslsjhytf.supabase.co/storage/v1/object/public/products/images/92712340.jpg',
    alt: 'Grundfos SB salvkaevupump',
    href: '/tooted/salvkaevupumbad/grundfos-sb',
  },
  rohutostepumbad: {
    src: 'https://sdqnzyfmanflslsjhytf.supabase.co/storage/v1/object/public/products/images/93013252.jpg',
    alt: 'Grundfos SCALA2 rõhutõstepump',
    href: '/tooted/rohutostepumbad/grundfos-scala2',
  },
  'tsirkulatsioonipumbad-soe-tarbevesi': {
    src: 'https://sdqnzyfmanflslsjhytf.supabase.co/storage/v1/object/public/products/images/97916772.jpg',
    alt: 'Grundfos COMFORT sooja tarbevee tsirkulatsioonipump',
    href: '/tooted/tsirkulatsioonipumbad-soe-tarbevesi/grundfos-comfort',
  },
}

/** Illustration for the category buying guide (null when none). */
export function getCategoryGuideImage(slug: string): CategoryGuideImage | null {
  return GUIDE_IMAGES[slug] ?? null
}
