# Nädalaraporti tegevusplaan — 09.10.2026

**Ettevõte:** Pump OÜ / Pumbapood
**Veebileht:** pumbapood.ee
**Koostatud:** 9. oktoober 2026
**Alus:** iganädalase raporti leiud (GA4, Google Ads, GSC, DB tellimused)

---

## 0. Terminoloogia muudatused (jõustunud 09.10.2026)

| Vana | Uus | Kus muudetud |
|---|---|---|
| kandjaleht | **maandumisleht** | `lib/reporting/insights.ts` (kõik raporti leiud), `lib/reporting/types.ts`, `lib/reporting/gsc.ts`, `scripts/_gsc-deep-dive.mjs` kommentaarid |
| Löögkaugusel | **Käeulatuses** | `lib/reporting/insights.ts` — GSC positsiooni-võimaluse leiu pealkiri |

NB: maandumislehe termin on nüüd ühtne GSC- ja Ads-kontekstis (QS-i „maandumislehe kogemus" ja GSC pere maandumisleht on sama leht — parandused mõjuvad mõlemale korraga).

---

## 0.1 Täitmise seis (09.10.2026)

### Tehtud

| Töö | Tulemus |
|---|---|
| **Terminoloogia** | „kandjaleht" → „maandumisleht" ja „Löögkaugusel" → „Käeulatuses" raportikoodis (`lib/reporting/insights.ts` jt). Testid 78/78, tsc puhas. |
| **QS-audit** (`tmp/_qs-audit.mjs`, 30 päeva) | Domineeriv probleem on **maandumislehe kogemus BELOW_AVERAGE** 10+ märksõnal `/unilift` ja `/alpha-go` lehtedel (ka QS 7–8 märksõnadel!). Ad relevance on ABOVE_AVERAGE peaaegu kõikjal peale „tühjenduspump" ja „tsirkulatsioonipump" (QS 3) — need kaks on tõenäoliselt veel 25.09 eelne ajalugu. Järeldus: sisutöö maandumislehtedel + aeg; pakkumised ainsaks koheseks hoobaks. |
| **Kategooriate sisulaiendused** | 6 kategooriat said veeautomaatide-mustris sisu (valikujuhend + hinnatabel live-DB hindadest + FAQ 6 tk, **kõik 5 keeles**): `kuttepumbad`, `drenaazipumbad`, `puurkaevupumbad`, `reoveepumbad`, `salvkaevupumbad`, `rohutostepumbad` — `lib/category-content.ts`. Lisatud ka **FAQPage JSON-LD** kategoorialehele (oli puudu — rich result võimalus). **Nõuab Vercel deploy'd.** |
| **„Grundfos" /en kandja uurimine** (`tmp/_grundfos-carrier.mjs`, 28 päeva) | `/en` **ei ole viga**: see kannab ingliskeelseid päringuid („grundfos pump" 42 imp, pos 6,1) — hreflang töötab. Eesti brändipäringud kannab `/` pos 4,8–6,1 (heas seisus). Pere keskmist positsiooni 11,6 tõmbab alla **„kasutatud grundfos pumbad" (39 imp, pos 38,9)** — kavatsus, mida me ei teeni (kasutatud pumpasid ei müüda). Võimalus: juhend „Kasutatud vs uus Grundfos pump" (leht olemasolevate lehtede sekka) või jätta realiseerimata. Otsus: küsida kasutajalt. |
| **GA4 kanalite languse allikas** (`tmp/_ga4-channels-wow.mjs`) | Kokku 375 → 319 (-15 %). Langus **EI ole orgaaniline** (Organic Search 26 → 31, **+19 %**) ega Google Ads (96 → 93, -3 %). Põhiline langus: **Meta Paid Social 124 → 80 (-35 %)** ja Referral 22 → 8 (-64 %). Orgaaniline kasvab — SEO-töö läheb õiges suunas. |

### Live viidud (kinnitatud + verifitseeritud 09.10)

| Muudatus | Tulemus |
|---|---|
| **maxCPC tõus rank-lost IS vastu** (`scripts/raise-nonbrand-cpc.mjs`) | 10 rühma tõstetud ja verifitseeritud (`tmp/_verify-0910-changes.mjs`): Unilift Tühjenduspump/Drenaažipump/Sukelpump **0,75 €**, Pinnavesi/Avariipump/CC-mudelid **0,60 €**; ALPHA GO Tsirkulatsioonipump/Küttepump **0,85 €**, tooted/asendus **0,70 €**. Eelarved muutumatad — kulu kaitstud. |
| **Brändikampaania eelarve 7 → 12 €/päev** (`scripts/set-budget.mjs`) | Verifitseeritud: 12,00 €/päev. Kontrollpunkt järgmisel raportil: IS ≥60 %, budget-lost <15 %. |
| **„Kasutatud vs uus Grundfos pump" juhend** (`scripts/create-kasutatud-vs-uus-page.mjs`) | Leht `/leht/kasutatud-vs-uus-grundfos-pump` loodud ja live (HTTP 200, **FAQPage JSON-LD renderdub**), sisu 5 keeles, siselinkidega kõigisse põhikategooriatesse. Vastab „kasutatud grundfos pumbad" (39 imp/nädal) kavatsusele ausalt — tõmbab pere keskmise positsiooni üles. |
| **Avalehe siseling juhendile** (`scripts/add-homepage-kasutatud-link.mjs`) | „Grundfos pumpade valik" sektsiooni lisatud märksõna-ankruga link 5 keeles (ISR ~1h). |

### Raportisüsteemi täiendused (09.10, SPS-raporti mustri järgi)

| Täiendus | Lahendus |
|---|---|
| **„Lehekülje arendus" sektsioon** — raport kajastab süsteemi täiendused, mis said tehtud enne järgmist raportit | Git-põhine: `scripts/generate-git-history.mjs` (prebuild/predev) → `data/git-history.json` → uus moodul `lib/reporting/site-changes.ts` (klassifikatsioon content/seo/technical, LLM-kokkuvõte Pumbapoe brändinguga + number-audit gate, fallback struktureeritud read). Aken = eelmise nädala raporti genereerimisaeg → selle raporti oma. Renderdus e-kirjas ja admin-UI-s (`/haldus/raportid/[id]`). Tracing `next.config.ts`-s (cron + `/api/haldus/reports`). |
| **„Reede hommikune seis"** — raport kajastab andmeid kuni koostamiseni, mitte 7 päeva tagant | Google'i andmed (GSC/GA4/Ads/Meta) lõppevad endiselt ~2 päeva tagasi (API viive), aga **reaalajas tellimused (DB)** laiendatud aknasse `orders.ts ordersWindow(period, now)` — aken period.start → genereerimispäev (reede ~9 päeva), eelmine aken sama pikk. E-kirjas ja leiu detailis nähtav aken; tellimuste eesmärk skaleeritakse akna pikkusega (5/nädal → 6/9 päeva). Testid: `tests/reporting-orders-window.test.ts`. |
| **SPS-lekke kontroll** | SPS-viited esinevad vaid koodikommentaarides (raporti väljunditesse ei jõua); kõik promdid, e-kirja tekstid ja leiu-sõnastused on Pumbapoe brändinguga; site-changes LLM-prompt keelab teiste ettevõtete nimetamise. |

### „Kasutatud vs uus" juhendi ümberkirjutamine (09.10 õhtul)

Lehe sisu kirjutatud ümber voolavaks, inimlikuks proosaks (kliendi tagasiside: eelmine versioon kasutas liiga palju kooloneid, sidekriipse ja hakitud lauseid) — kõik 5 keelt, FAQ säilib `<h3>+<p>` kujul (FAQPage JSON-LD verifitseeritud live-is). Skript: `scripts/create-kasutatud-vs-uus-page.mjs` (upsert).

---

## 1. Nädala probleemid prioriteedi järjekorras

| # | Probleem | Allikas | Mõju |
|---|---|---|---|
| P0 | Tellimusi 1 nädalas (eesmärk ≥5) | DB | Otsene käive |
| P1 | „Grundfos" orgaaniline pos 11,6 — napilt väljas esimeselt lehelt | GSC | 64 näitamist/nädal konverteerival brändipäringul |
| P1 | ALPHA GO kaotab 53 % nähtavusest rank-lost IS tõttu | Ads | Konkurendid võidavad oksjoni kvaliteedi/hinnaga |
| P1 | Unilift CC kaotab 45 % nähtavusest rank-lost IS tõttu | Ads | Sama |
| P1 | QS 3/10 „tsirkulatsioonipump", 3/10 „tühjenduspump", 4/10 „drenaažipump" | Ads | Kallim CPC, madalam koht |
| P2 | Brändikampaania kaotab 40 % nähtavusest eelarve tõttu (IS 33 %) | Ads | Ainus tõestatult konverteeriv kampaania |
| P2 | Sessioonid -15 % (374 → 317) | GA4 | Vähem müügivõimalusi |
| P3 | „veeautomaat / hüdrofoor" pos 21,2 (sisuauk) | GSC | 27 näitamist/nädal realiseerimata |

---

## 2. P0 — Tellimused (1/nädal): konversiooni kontrollnimekiri

Liiklust on (Ads tõi klikke, orgaaniline töötab), aga tellimusi ei tule → probleem on konversioonis, mitte nõudluses. Kontrollida selles järjekorras:

1. **Laoseis ja hinnad top-toodetel** — kas kampaaniate maandumislehtede tooted (ALPHA GO, Unilift CC) on laos ja hinnad konkurentsivõimelised (võrdle 2–3 konkurentsiga).
2. **Ostuvoolu käsittest** — toode → ostukorv → Montonio makse, mobiilis ja arvutis, lõpuni läbi.
3. **Tarneinfo tootelehel** — tarneaeg ja hind peab olema näha enne ostukorvi (peidetud tarnetasu on tüüpiline kassa hülgamise põhjus).
4. **Kassa lihtsustamine** — väljade arv, külalise ost, veateated.

---

## 3. P1 — Kuidas saada märksõnade positsioonid esimesele lehele

Positsiooni määravad viis hooba. „Radikaalne" tõus = kõigi viie samaaegne tõmbamine, mitte ühe triki otsimine.

### 3.1 Kiireimad võidud: „Käeulatuses" perekonnad (pos 4–15)

Raport märgib need iganädalaselt automaatselt (pos 4–15 + ≥30 näitamist) — see on meie tööjärjekord. Positsioonilt 4–15 piisab esimesele lehele tõusuks tavaliselt sisu- ja lingitööst, välislinke ei ole vaja.

**Käesolev nädal: „Grundfos" pos 11,6 (64 näitamist/nädal), maandumisleht `/en`.**

- [ ] Täienda maandumislehte: laienda sisu (valikujuhised, mahud, hinnavahemik, FAQ), optimeeri title/meta.
- [ ] **Kontrolli, miks kannab `/en` leht** — eestikeelsete „grundfos"-päringute kandja peaks olema eesti avaleht või Grundfos-hub. Kontrolli hreflang-paari ja kas eesti lehel on piisavalt Grundfos-sisu + siselinke (avalehe „Grundfos pumpade valik" sektsioon lisatud 21.09 — verifitseeri, et sektsioon on live ja ankrud märksõnarikkad).
- [ ] Lisa 2–3 siselist linki märksõna-ankruga („Grundfos pumbad", „Grundfos veeautomaadid") lehtedelt, kus neid veel pole.

### 3.2 Kategooriate sisulaiendused (tõestatud muster)

Veeautomaatide muster (`lib/category-content.ts` + kategoorialehe renderdus, deploy 21.09): valikujuhend + hinnatabel tegelike kataloogihindadega + FAQ 5 keeles. Tulemus juba näha: pere „veeautomaat / hüdrofoor" taastus 27,9 → 21,2 (töötamine jätkub).

**Kordame sama mustri ülejäänud perekondadele, raporti näitajate järjekorras:**

| Jrk | Kategooria | Pere | Märkus |
|---|---|---|---|
| 1 | küttepumbad / tsirkulatsioonipumbad | QS 3/10 Ads'is + ALPHA GO kampaania maandumisleht | Ads LP-kogemus ja orgaaniline paranevad korraga |
| 2 | drenaažipumbad / tühjenduspumbad | QS 3–4/10 + Unilift kampaania maandumisleht | Sama synergia |
| 3 | puurkaevupumbad / sukelpumbad | GSC pere olemas | — |
| 4 | reoveepumbad | GSC pere olemas | — |
| 5 | salvkaevupumbad, rõhutõstepumbad | GSC pere olemas | — |

Iga kategooria: juhend (vastab infopäringutele „kuidas valida", „milline pump"), hinnavahemikud reaalsetest hindadest, FAQ + FAQPage JSON-LD, kõik 5 keeles.

### 3.3 Üks leht = üks kavatsus (kannibaliseerimise kontroll)

Raporti „Maandumisleht vahetus" leiud (pere top-3 maandumislehed nädalakaupa) on kontrollmehhanism — kui Google hakkab perele teist lehte järjestama, suunatakse siselinkidega tagasi. Reegel: iga perekond saab täpselt ühe põhilehe ja kõik siselingid viivad sinna märksõna-ankruga.

### 3.4 CTR ja rich snippetid (positsioon 1–5 → klikid)

- Product/offer struktureeritud andmed (hind, laoseis) tootelehtedel → hinna ja laoseisu näitamine SERP-is tõstab CTR-i.
- Madala CTR-iga lehed hea positsioonil (raport märgib need automaatselt, künnis ≥60 näitamist ja CTR <1,5 %): title + meta ümber kirjutada — konkreetne kasu, hind, „laos, tarne 1–3 päeva".

### 3.5 Tehniline alus

- LCP < 2,5 s maandumislehtedel (mõjutab nii orgaanilist järjestust kui Ads'i maandumislehe kogemust — topeltvõit). Kontroll: `npm run lh`.
- GSC Pages: kõik kategooria- ja tootelehed indekseeritud.
- hreflang: et/en/ru/lv/lt paarid korrektsed (vt 3.1 — `/en` kandja „grundfos" perele).

### 3.6 Mõõtmine

Nädalaraporti „Käeulatuses" + perepeatabel = iganädalane tööjärjekord. Eesmärk: iga jälgitud pere pos ≤10, brändipäringud pos ≤3. Oodatav efekt: sisu- ja lingitöö kajastub GSC-s 2–6 nädalaga.

---

## 4. P1 — Ads: rank-lost impression share (ALPHA GO 53 %, Unilift 45 %)

Rank-lost IS = kaotame oksjoni Ad Rank'i (QS × pakkumine) tõttu, mitte eelarve tõttu. Töö käsitsi tehtud 25.–26.09 (rühmade lõhestus, 15 pealkirja, sitelinkid, pildiassetid) — QS on mahajääv signaal ja uueneb 2–4 nädalaga, seega osa raporti QS 3/10 näitudest on veel vana ajalugu.

- [ ] Verifitseeri praegune seis: `tmp/_qs-audit.mjs` (read-only) — kas ad relevance / LP-kogemus on BELOW_AVERAGE-ist taastunud.
- [ ] Kui LP-kogemus on endiselt BELOW_AVERAGE („tsirkulatsioonipump" → `/alpha-go`, „tühjenduspump" → `/unilift`): kontrolli, et märksõna on lehe H1-s ja esimeses lõigus, ja mõõda LCP (<2,5 s).
- [ ] **Pakkumised:** kuni QS taastub, kaalu maxCPC tõstmist ALPHA GO ja Unilift kampaania top-märksõnadel (analoogia: brändikampaania maxCPC tõus 25.09 lahendas rank-lost 50 % probleemi). See on ainus kohene hoob, sest QS ei tõuse käsitsi.
- [ ] Töö käigus järgi `docs/reklaamide-kvaliteedi-juhend.md` ja AGENTS.md reeglit: skript `--dry-run` → väljundi kinnitus → live → seisu kontroll (15H, policy APPROVED).

---

## 5. P2 — Brändikampaania eelarve

„Pumbapood + Grundfos Brand Search - EE": budget-lost 40 %, IS 33 %, kulu 59,34 €/nädal, ainus tõestatult konverteeriv kampaania („grundfos pump" 1 konv).

- [ ] Tõsta päevaeelarvet (praegu ~8,5 €/päev → 12–14 €/päev) — kaotatud näitamised on otseselt kaotatud tellimused. Skript: `scripts/set-budget.mjs` (dry-run → kinnitus → live).
- [ ] Kontrolli nädal pärast: IS peaks tõusma >60 %, budget-lost <15 %.

## 6. P2 — Liikluse langus -15 % (374 → 317 sessiooni)

- [ ] Võrdle kanalite lõikes (GA4 kanalite tabel raportis): kui langus on orgaanilises → vaata GSC perepeatabeli langenud perekondi; kui tasulises → Ads kampaaniate seis ja eelarved (Unilift weather-pulse'i astmed langetati 21.09 → osa langusest on teadlik eelarvekokkuhoid).
- [ ] Hooajalisus: oktoobri algus vs septembri lõpp — võrdle ka aasta tagust, kui andmed olemas.

## 7. P3 — Meta vs Google

Meta 2,16 €/sessioon vs Google 1,95 €/sessioon. Õiglane €/tellimus võrdlus on võimalik alles siis, kui Meta optimeerib ostudele.

- [ ] Otsus: kas Meta jääb teadlikkuse kanaliks (mõõda LP-vaate ja kaasatud sessiooni hinda) või lülitada üks kampaania SALES-eesmärgile (CAPI ostusündmus on seadistatud).

---

## 8. Järgmise raporti kontrollpunktid (16.10.2026)

1. QS-komponendid („tsirkulatsioonipump", „tühjenduspump", „drenaažipump") — kas ad relevance / LP-kogemus on taastunud.
2. „Grundfos" pere positsioon — eesmärk ≤10.
3. „veeautomaat / hüdrofoor" — eesmärk ≤20 (sisu laienemise jätk).
4. Brändikampaania IS ≥60 %.
5. Tellimused ≥2 (P0 konversiooni-paranduste esimene efekt).
