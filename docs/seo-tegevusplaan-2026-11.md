# SEO tegevusplaan — november 2026

**Eesmärk:** tõsta GSC-s märksõnade „küttepumbad / tsirkulatsioonipumbad", „veeautomaat / hüdrofoor", „Grundfos", „salvkaevupump" positsioone ja klikke.

**Töövoog:** kõik sisutekstid allpool on **DRAFT** — need tuleb enne implementeerimist sinu poolt üle lugeda ja kinnitada. Tehnilised sammud tehakse alles pärast tekstide kinnitust.

**Fookus:** ainult SEO. Kassa, makseviiside ja tarneviiside UI-d ei muuda.

---

## 1. Oluline avastus: `/tooted/jahutus` ei eksisteeri

Andmebaasis pole aktiivset `jahutus` tegevusala ega tooteid, mis sellele viitaksid. Seda tootekategooriat ei pakuta. Seetõttu jääb selle lehe loomine plaanist välja.

**Otsus:** loome uue SEO-lehe aadressil `/tooted/veepumbad`. See on tehniliselt võimalik staatilise Next.js lehena (`app/[locale]/tooted/veepumbad/page.tsx`), mis läheb dünaamilise `[tegevusala]` marsruudi ette.

**Lehe sisu:** kogu veepumpade valik koos juhendiga — viited olemasolevatele kategooriatele (küttepumbad, veeautomaadid, salvkaevupumbad, puurkaevupumbad) ja tootekaartide võrgustik. Märksõnad: „veepumbad", „veepump", „Grundfos veepump".

**Menüü:** soovitan mitte lisada põhimenüüsse, et see ei segaks olemasolevat struktuuri. Seda võib näidata jaluses (footer) lingina „Veepumbad" või jätta ainult otsingumootorite jaoks (sisemine sihtleht). Kui soovid, saab lisada ka „Tegevusalad" plokki avalehel üheks kaardiks.

**Küsimus sulle:** kas soovid `/tooted/veepumbad` lehe menüüsse/footersse lisada, või jätame selle ainult SEO-sihtleheks?

---

## 2. GA4 mõõtmise kontroll

Kontrollisin live-is `pumbapood.ee` avalehte brauseriga:

- ✅ `gtm.js?id=GTM-MN86P7WH` laadimine on olemas.
- ✅ `gtag/js?id=G-KD26VEJVWY` ja `gtag/js?id=AW-18154845685` laadivad.
- ✅ `window.dataLayer` sisaldab consent default, config ja `gtm.js` sündmusi.
- ✅ Konsooli vead puuduvad.

**Järeldus:** GTM/GA4 laadimine töötab hetkel. Kui DevToolsis ei näe, võib põhjuseks olla brauseri ad-blocker või vale filter.

**Märkus CSP kohta:** praegu `next.config.ts`-is puudub `Content-Security-Policy` header. Kuna see pole otseselt SEO, siis jääb see plaani välja, aga soovitan seda eraldi arutada.

---

## 3. SEO sisu — DRAFT tekstid ülevaatamiseks

> **Märkus:** allpool on ainult **eesti keele** variandid. Teised keeled tõlgitakse ja kohandatakse pärast EST tekstide kinnitust.

---

### 3.1 `/tooted/tsirkulatsioonipumbad-soe-tarbevesi` — küttepumbad / tsirkulatsioonipumbad

**Praegune seis:** lehel on hea pikk sisu (`lib/category-content.ts`), aga märksõna „küttepump" ja selle käänded puuduvad pealkirjast ja esimesest lõigust peaaegu täielikult.

#### Pakutavad muudatused

**Uus H1 (activity\_areas.h1):**\
`Küttepumbad ja sooja tarbevee tsirkulatsioonipumbad`

**Uus meta title:**\
`Küttepumbad ja tsirkulatsioonipumbad laos | Grundfos | Pumbapood.ee`

**Uus meta description:**\
`Grundfos küttepumbad ja tsirkulatsioonipumbad — ALPHA GO, COMFORT, MAGNA. Alates 121 €. Asenda vana UPS või ALPHA pump kiiresti.`

**Uus tegevusalakirjeldus (activity\_areas.description):**\
`Grundfos küttepumbad ja sooja tarbevee tsirkulatsioonipumbad — ALPHA GO, COMFORT, UPS(N) ja MAGNA seeriad. Asenda vana pump või paigalda uus ringlusliiniga süsteem.`

**Lisada esimesse lõiku (pärast teist lauset) see lause:**\
`Küttepumbana kasutatakse neid keskkütte- ja põrandaküttesüsteemides, kus nad hoiavad vee ringluses ja tagavad ühtlase soojuse.`

**Lisada uus lõik enne hinnatabelit:**\
`Kui sul on vaja asendada vana UPS, ALPHA1 või ALPHA2 pump, vaata meie [küttepumpade valikut](/tooted/kuttepumbad). Sooja tarbevee ringlusesse sobivad roostevaba korpusega COMFORT ja UPS(N) seeriad.`

**Lisada FAQ:**

**K: Kas tsirkulatsioonipumpa saab kasutada ka kütteks?**\
V: Jah — sooja tarbevee tsirkulatsioonipumpa EI tohi kasutada küttesüsteemis, aga küttepumba võib paigaldada ringlusliiniga sooja tarbevee süsteemi. Oluline on valida õige korpusega mudel: küttesüsteemi jaoks sobivad malmsed ALPHA ja MAGNA pumbad, joogivee ringlusesse ainult roostevabad N-mudelid.

**K: Milline on parim asendus vanale UPS pumbale?**\
V: Enamiku vanade UPS, ALPHA1 ja ALPHA1 L pumpade asemele sobivad Grundfos ALPHA1 GO või ALPHA2 GO — samad ühendusmõõtud ja GO äpi tugi.

#### Siselingid

Lisa lehele `related` sektsioonis link:

- [Küttepumbad](/tooted/kuttepumbad) — ankurtekst: „küttepumbad"

---

### 3.2 `/tooted/veeautomaadid` — title / meta rewrite (CTR)

**Praegune meta title:**\
`Veeautomaat: põrandal seisev ja uputatav — laos | Pumbapood.ee`

**Praegune meta description:**\
`Grundfos SCALA1, SCALA2, JP ja SBA laos. Põrandal seisev veeautomaat alates 234,52 €, uputatav alates 574,57 €. Vaata valikut!`

**Uus meta title:**\
`Veeautomaat laos | Grundfos SCALA1, SCALA2 alates 234 € | Pumbapood.ee`

**Uus meta description:**\
`Osta Grundfos veeautomaat või hüdrofoor — garantii ja tasuta nõustamine. SCALA1, SCALA2, JP ja SBA laos. Alates 234,52 €.`

**Põhjendus:** uues title'is on bränd (Grundfos), konkreetne kasu (laos, tarne) ja hind. Description lisab garantii ja nõustamise — see tõstab usaldust ja CTR-i.

**Lisaks soovitan täiendada lehe esimest juhendilõiku** ühe lausega, mis mainib otseselt „veeautomaat" ja „hüdrofoor" koos:

`Veeautomaat (ehk hüdrofoor) hoiab majas kraanivee rõhu püsivana: pump käivitub automaatselt, kui avad kraani, ja seiskub siis, kui vett enam ei võeta.`

---

### 3.3 `/tooted/salvkaevupumbad` — valikujuhendi täiendamine

**Praegune seis:** lehel on põhiline sisu, aga GSC näitab positsiooni 10.4 märksõnadel „salvkaevu pump / salvkaevupumbad". Tõstmiseks lisada spetsiifilisemat infot sügavuse, paigalduse ja laoseisu kohta.

#### Pakutavad täiendused

**Lisa lõik peale esimest:**\
`Salvkaevupumpa valides mõõda ära kaevu sügavus ja veetaseme kõrgus. Põrandal seisev pump (JP) imeb vett kuni 8 m sügavuselt; kui veetase on madalam või soovid täiesti vaikset lahendust, vali uputatav SB või SBA, mille langetad kaevu sisse.`

**Lisa lõik enne hinnatabelit:**\
`Kõik meie salvkaevupumbad on laos. Täpse tarneaja saad teada tellimuse kinnitamisel. Kui kaev on sügavam kui 8 meetrit või vajad suuremat vooluhulka, sobib paremini [puurkaevupump](/tooted/puurkaevupumbad).`

**Lisa FAQ:**

**K: Kuidas paigaldada salvkaevupumpa?**\
V: Põrandal seisev JP paigaldatakse kuiva ruumi kaevu kõrvale ja ühendatakse imutoruga. Uputatavad SB ja SBA langetatakse kaevu sisse spetsiaalse kõri abil — need ei vaja eraldi ruumi ega tee müra.

**K: Kas salvkaevupump sobib ka vihmavee jaoks?**\
V: Jah — JP, SB ja SBA sobivad hästi vihmaveemahutist kastmiseks ja majapidamisveeks. Kui peamine kasutus on kastmine, vali SBA automaatika võimalusega, et pump ei käiks tühjalt.

**K: Millal valida SB ja millal SBA?**\
V: SB on odavam, aga vajab välist juhtseadet automaatseks tööks. SBA-l on automaatika ja kuivakäimise kaitse juba sees — mugavam ja turvalisem valik.

**Uuenda hinnatabeli rida:**\
`Grundfos JP` — „klassikaline hüdrofoor — suvila, aed, soodne" → „klassikaline hüdrofoor — suvila, aed, veetase kuni 8 m"

#### Siselingid

- [Veeautomaadid ja hüdrofoorid](/tooted/veeautomaadid) — ankur „veeautomaat"
- [Puurkaevupumbad](/tooted/puurkaevupumbad) — ankur „puurkaevupumbad"

---

### 3.4 Avaleht — olemasoleva Grundfosi sektsiooni täiendus

Praegusel avalehel on juba „Grundfos pumpade valik" plokk ja „Milline Grundfos pump valida?" sektsioon koos kategoorialinkidega. Seda ei ole mõtet asendada või duplikeerida.

**Pakutud minimaalne täiendus:** avalehe meta description on juba hea, aga title võiks olla pisut konverteerivam.

**Praegune meta title (messages/et.metadata.json):**\
`Grundfos pumbad ja lahendused – Pump OÜ`

**Pakutud uus meta title:**\
`Grundfos pumbad Eestis | Veeautomaadid, küttepumbad, kaevupumbad | Pumbapood.ee`

**Pakutud uus meta description:**\
`Osta Grundfos pumbad ametlikult edasimüüjalt. Veeautomaadid, küttepumbad, tsirkulatsioonipumbad, salvkaevu- ja puurkaevupumbad laos.`

**Küsimus sulle:** kas soovid meta title/description muuta, või jätame avalehe meta praegusele kujule?

---

### 3.5 `/tooted/veepumbad` — uus SEO sihtleht

**Eesmärk:** haarata märksõna „veepumbad" ja suunata kasutajad õigetesse kategooriatesse.

**H1:**\
`Veepumbad — Grundfos veepumbad igaks vajaduseks`

**Meta title:**\
`Veepumbad | Grundfos veepump Eestis | Pumbapood.ee`

**Meta description:**\
`Grundfos veepumbad: kütte-, tsirkulatsioon-, veeautomaat-, salvkaevu- ja puurkaevupumbad. Ametlik edasimüüja Eestis, laos olevas tooted ja tasuta nõustamine.`

#### Juhend (3 lõiku)

**Lõik 1**\
Veepump liiguitab vee kaevust majja, hoiab kütte- või tarbevee ringluses või suurendab veesurvet. Õige valik sõltub kolmest asjast: kust vett võetakse, kuhu seda vaja saata ja kui palju vett korraga kasutatakse.

**Lõik 2**\
Meie valikust leiad erinevateks ülesanneteks sobivad Grundfos pumbad: [küttepumbad ja tsirkulatsioonipumbad](/tooted/kuttepumbad), [veeautomaadid](/tooted/veeautomaadid), [salvkaevupumbad](/tooted/salvkaevupumbad) ja [puurkaevupumbad](/tooted/puurkaevupumbad). Kõik tooted on originaalsed ja kehtib tootjagarantii.

**Lõik 3**\
Kui ei ole kindel, milline pump sobib, võta meiega ühendust — tasuta nõustamine aitab valida õige lahenduse vastavalt sinu kaevule, süsteemile ja vajalikule veesurvele.

#### FAQ (4 küsimust)

**K: Mis on veepump?**\
V: Veepump on seade, mis liigutab vett: tõstab selle kaevust majja, hoiab sedasooja tarbevee või kütte ringluses või suurendab veesurvet kraanis.

**K: Kuidas valida õige veepump?**\
V: Arvesta kolme asjaga: veeallikas (tsentraalvõrk, salvkaev, puurkaev), kraanide arv ja vajalik veesurve. Eramajale sobib tavaliselt veeautomaat, salvkaevule uputatav pump ja puurkaevule süvaveepump.

**K: Kas Grundfos veepumbad on laos?**\
V: Jah — populaarsemad Grundfos veepumbad on laos. Täpse tarneaja saad valida toote lehelt või tellimuse kinnitamisel.

**K: Kas aitate valida õige pumba?**\
V: Jah — pakume tasuta tehnilist nõustamist telefonil +372 527 4403 ja meilitsi info@pumbapood.ee.

#### Siselingid lehel

- [Küttepumbad](/tooted/kuttepumbad)
- [Veeautomaadid ja hüdrofoorid](/tooted/veeautomaadid)
- [Salvkaevupumbad](/tooted/salvkaevupumbad)
- [Puurkaevupumbad](/tooted/puurkaevupumbad)

---

### 3.6 Siselingid märksõna-ankrutega

Lisa järgmised siselinkide mustrid (ainult üks-kaks lehe kohta, et mitte üle pingutada):

| Lähte URL | Siht URL | Ankurtekst |
| --- | --- | --- |
| `/tooted/kuttepumbad` | `/tooted/tsirkulatsioonipumbad-soe-tarbevesi` | tsirkulatsioonipumbad |
| `/tooted/salvkaevupumbad` | `/tooted/veeautomaadid` | veeautomaat |
| `/tooted/veeautomaadid` | `/tooted/salvkaevupumbad` | salvkaevupumbad |
| `/tooted/veepumbad` | `/tooted/veeautomaadid` | veeautomaadid |
| `/tooted/veepumbad` | `/tooted/salvkaevupumbad` | salvkaevupumbad |

Avalehel on juba piisavalt kategoorialinke, seega sinna uusi ankrulinke küll ei lisata.

---

## 4. Tehniline implementatsioon

### 4.1 Failid, mida muudetakse

- `lib/category-content.ts` — uuendada `TSIRKULATSIOONIPUMBAD` ja `SALVKAEVUPUMBAD` ET tekste; lisada nendele `related` lingid.
- Andmebaas `activity_areas` — uuendada `/tooted/tsirkulatsioonipumbad-soe-tarbevesi` h1, description, meta\_title, meta\_description.
- Andmebaas `activity_areas` — uuendada `/tooted/veeautomaadid` meta\_title ja meta\_description.
- `app/[locale]/tooted/veepumbad/page.tsx` — luua uus staatiline SEO leht koos tootekaartidega (võib kuvada tooteid mitmest kategooriast või ainult juhendit).
- `components/layout/...` või footer — otsustamisel: kui soovid menüüs/footers näidata, lisatakse link `/tooted/veepumbad`.
- `messages/et.metadata.json` — vajadusel uuendada avalehe meta (kui kinnitad muudatused).

### 4.2 Ülevaatus ja kontroll

- Pärast muudatusi jooksuta `npm run build` ja `npm run lint`.
- Kontrolli, et muudetud lehed annaksid 200 ja oleksid `index,follow`.
- Kasuta GSC URL Inspection pärast live-muudatusi.

---

## 5. Ajakava ja prioriteedid

| Prioriteet | Töö | Eeldatav efekt |
| --- | --- | --- |
| 1 | `/tooted/veeautomaadid` title/meta | CTR tõus |
| 2 | Tsirkulatsioonipumba lehe täiendus | „küttepumbad" kindlam positsioon |
| 3 | Salvkaevupumba lehe täiendus | „salvkaevupumbad" TOP5 |
| 4 | `/tooted/veepumbad` lehe loomine | „veepumbad" märksõna |
| 5 | Avalehe meta (kui kinnitad) | „Grundfos" TOP5 |

---

## 6. Otsused (kinnitatud 19.11.2026)

1. **`/tooted/veepumbad`** näidatakse **jaluses (footer)** linkidena kõigis keeltes, mitte põhimenüüs.
2. **`/tooted/veepumbad`** lehel kuvatakse **ainult juhend + kategoorialingid** (Variant A).
3. **Avalehe meta title/description** uuendatakse peatükis 3.4 toodud soovituste järgi.
4. **`/tooted/kuttepumbad`** lehele lisatakse siselink **`/tooted/tsirkulatsioonipumbad-soe-tarbevesi`** ankruga „tsirkulatsioonipumbad".
5. **Tarneinfo:** ei kasutata sõnastust „tarne 1–3 päeva" ega „tarne 1-3 päeva".

## 7. Implementatsiooni staatus

- [x] `lib/category-content.ts` — tsirkulatsioonipumbad ja salvkaevupumbad ET tekstid uuendatud.
- [x] `lib/category-content.ts` — küttepumbad lehel siselink tsirkulatsioonipumpadele.
- [x] Andmebaas `activity_areas` — tsirkulatsioonipumbad h1, description, meta_title, meta_description uuendatud.
- [x] Andmebaas `activity_areas` — veeautomaadid meta_title, meta_description uuendatud.
- [x] `app/[locale]/tooted/veepumbad/page.tsx` — uus staatiline SEO leht loodud.
- [x] `components/Footer.tsx` — `/tooted/veepumbad` link lisatud.
- [x] `messages/*.json` — `waterPumps` tõlkevõti lisatud kõigis keeltes.
- [x] `messages/et.metadata.json` — avalehe meta uuendatud.
- [x] `app/sitemap.ts` — `/tooted/veepumbad` lisatud saidikaardile.
- [x] `npm run build` ja muudetud failide lint edukad.

---

*Plaan koostatud: 19.11.2026. Tekstid kinnitatud ja implementeeritud.*
