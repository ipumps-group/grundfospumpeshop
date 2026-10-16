# Nädalaraporti tegevusplaan — 16.10.2026

**Ettevõte:** Pump OÜ / Pumbapood
**Veebileht:** pumbapood.ee
**Koostatud:** 16. oktoober 2026
**Alus:** iganädalase raporti leiud (raport id=17, periood 06.10–12.10 vs 29.09–05.10; GA4, Google Ads, GSC, DB tellimused). Alates N 22.10 on raportinädal **esmaspäev → pühapäev** ja raport saabub neljapäeval (vt p 0.3).

---

## 0. Raportisüsteemi parandused (jõustunud 16.10.2026)

Raportis oli kaks loogikaviga — mõlemad parandatud ja verifitseeritud.

### 0.1 GSC klikkide konflikt: üleval -13 %, all +20 %

**Põhjus (kaheastmeline):**

1. **GSC andmed valmivad ~3–4 päevaga**, aga raporti periood lõppes 2 päeva enne koostamist. Iga raporti jooksev nädal oli süstemaatiliselt ~20 % alamõõdetud (nt 14.10 andmed polnud 16.10 hommikul GSC-s veel olemas) ja salvestatud raporteid hiljem ei värskendatud.
2. **Erinevad võrdlusalused:** ülemised kaardid võrdlesid eelmise nädalaga (juba lõplik), alumine tabel eelmise *salvestatud* raportiga (omakorda poolikult mõõdetud). -13 % ja +20 % olid mõlemad "õiged" — erinevate aluste suhtes.

**Parandus:**

| Muudatus | Fail | Tulemus |
|---|---|---|
| Andmeviive 2 → 4 päeva — mõlemad võrreldavad nädalad on genereerimisel lõplikud | `lib/reporting/google-auth.ts` (`weeklyPeriod`) | WoW-võrdlus õiglane, valepositiivsed "langus"-leiud kaovad |
| Muutuste tabel arvutab WoW **sama snapshoti sees** (mitte salvestatud raporti vastu) | `lib/reporting/changes.ts` + `lib/reporting/ads.ts` (Ads'i eelmise perioodi kogud `prevTotals`) | Kaardid ja tabel **ei saa enam kunagi lahkneda** — sama alus, samad andmed |
| Pealkirjad/tekstid: „Muutused eelmise nädalaga" | `app/haldus/raportid/[id]/page.tsx`, `lib/reporting/email-html.ts`, `lib/reporting/llm.ts`, `lib/reporting/types.ts` | Terminoloogia ühtne |

**Kontroll (raport 17, päris andmed):** GSC klikke/päevas **+36 %** (6,7 → 9,1) — kaardid ja tabel näitavad sama. Tegelik tulemus on positiivne: orgaanika kasvab.

### 0.2 Keskmine positsioon: roheline „▼ -18 %"

Positsiooni numbri langus on SEO mõttes **paranemine** (madalam number = parem koht). Varem kuvas kaart paranemist rohelise „▼ -X %"-na, mis nägi välja nagu langus.

**Parandus** (`app/haldus/raportid/[id]/page.tsx` `Delta`): pööratud metrikute puhul (positsioon) kuvatakse kvaliteedi suunda — paranemine **roheline „▲ +X %"**, halvenemine **punane „▼ -X %"** — kooskõlas muutuste tabeli „▲ Paranes / ▼ Halvenes" loogikaga.

### 0.3 Raporti periood: esmaspäev → pühapäev, raport neljapäeval (otsus 16.10)

Raportinädal on nüüd **esmaspäev → pühapäev** (kalendernädal) ja raport saabub **neljapäeval 09:00** (cron `0 6 * * 4`). Põhjus: Google'i (GSC/GA4) andmed jõuavad API-sse ~3–4 päeva hiljem — neljapäevaseks koostamiseks on pühapäevane nädalalõpp lõplik, seega on **mõlemad võrreldavad nädalad alati täielikud** ja WoW täpne. Varemalt (reede raport, 2-päevane viive) jäi jooksva nädala lõpp alati poolikuks (sama viga, mis p 0.1).

- `weeklyPeriod` on ankurdatud pühapäeva külge (lõpp = viimane pühapäev ≥4 päeva tagasi) — ka käsitsi genereerides tuleb alati sama E→P nädal (`lib/reporting/google-auth.ts`, test `tests/reporting-period.test.ts`).
- Tellimuste aken ulatub endiselt raporti koostamiseni (neljapäeva hommik).
- **Järgmine raport: N 22.10.2026**, periood 12.10–18.10 vs 05.10–11.10.

### 0.4 Tehniline seis

- Testid: **102/102** (sh uued `tests/reporting-changes.test.ts` ja `tests/reporting-period.test.ts`), `tsc --noEmit` puhas.
- Vigane raport (id=16, nädal 08.10–14.10 — poolik jooksva nädala andmestik) **kustutatud**; raport 17 (06.10–12.10, mõlemad nädalad lõplikud) taasesitatud ja verifitseeritud.
- Üleminekumärkus: raporti 17 periood (06.10–12.10) ja neljapäevase raporti periood (12.10–18.10) kattuvad ühel päeval — ühekordne üleminek; WoW-võrdlused on snapshoti-sisesed, seega numbrid jäävad õigeks.

---

## 1. Nädala seis (raport 17: 06.10–12.10 vs 29.09–05.10)

| Näitaja | Eelmine | See | Muutus | Hinnang |
|---|---|---|---|---|
| GSC klikke/päevas | 6,7 | 9,1 | **+36 %** | ▲ Paranes |
| GSC näitamisi/päevas | 82,1 | 89,9 | +9 % | ▲ Paranes |
| GSC keskmine positsioon | 13,1 | 10,2 | -22 % | ▲ Paranes |
| GA4 sessioonid | 340 | 283 | -17 % | ▼ Halvenes |
| Ads klikid | 1201 | 1058 | -12 % | ▼ Halvenes |
| Ads konversioonid | 6 | 6 | 0 % | ■ Stabiilne |
| Tellimused (DB aken) | 2 | 2 | 0 % | ■ Stabiilne |
| Käive (DB aken) | 2325,52 € | 1064,79 € | **-54 %** | ▼ Halvenes |
| Meta kulu | 173,57 € | 174,14 € | 0 ostu, 0 ostukorvi | ▼ Halvenes |

---

## 2. Raporti 17 leiud → tegevus → staatus

**Täitmise seis 16.10 õhtul** — ülevaade enne detaili:

| Töö | Seis |
|---|---|
| **Meta P0 diagnostika** | ✅ Tehtud. Jälgimine on korras: Meta saab `view_content` sündmusi (20/nädal) ja CAPI ostusaated töötavad (viimased 4 makstud tellimust kõik Meta'sse jõudnud). Päris probleem: kogu saidil oli nädalas ainult **3 ostukorvi lisamist** — külastajad ei jõua maandumislehelt toodeteni. Jälgimisviga leiti ja parandati mujal: GA4 `view_item` sündmust ei saadetud üldse (funktsioon oli olemas, kutsujat mitte) — nüüd saadetakse (`components/ProductDetailClient.tsx`). |
| **Konversiooni-kontrollnimekiri** | ✅ Kontrollitud. Laoseis korras (89 ALPHA-toodet laos, hinnad 121–863 €), tarneinfo on tootelehel olemas, ostuvool toimib (2 tellimust 15.–16.10 jõudsid süsteemi ja Meta'sse). Koodi-vigu ei leitud. |
| **ALPHA GO eelarve 15 → 20 €/päev** | ✅ **Live ja verifitseeritud 16.10** (`set-budget.mjs`; kinnitatud 20,00 €/päev). Kontrollpunkt N 22.10 raportis: IS ≥ 50 %, budget-lost < 20 %. |
| **Unilift CC rank-lost / QS töö** | ⛔ Jääb peatatuks (otsus 16.10). Kui kampaania kunagi tagasi lülitatakse: `/unilift` H1-sse lisada „tühjenduspump" (praegu puudub) ja kontrollida QS-komponente. |
| **QS 3/10 kontroll** | ✅ Tehtud (QS-audit 30 päeva). RSA-d ja maandumislehed on kvaliteedistandardi järgi korras (täpsed märksõnavormid pinned-H1des, märksõna lehe H1-s, FAQ+JSON-LD) — madal skoor on ajalooline signaal, komponendid tõusevad 2–4 nädalaga. |
| **SEO Töö 1: avalehe Grundfos-osa** | ✅ **Live** (ISR ~1 h). Uus juhendi-sektsioon „Milline Grundfos pump valida?" (4 teemat, live-hinnavahemikud, siselingid, 5 keeles) + KKK 4 → 6 küsimust + meta_description täpsustatud. Skript: `scripts/update-homepage-grundfos-guide.mjs`. |
| **SEO Töö 1: siselingid** | ✅ Koodis (`lib/category-content.ts`) — 3 kategoorialehte (kütte-, veeautomaat-, puurkaevupumbad) saiad juhendi lõppu lingid avalehe Grundfos-juhendile, 5 keeles; linkify-kontroll 15/15. **Vajab deploy'd**, et live jõuaks. |
| **SEO Töö 2: veeautomaadid** | ✅ Kontrollitud + kaetud. Korduvad küsimused katavad juba päringud „parim veeautomaat" ja „põrandal seisev veeautomaat"; hinnatabel on live-hindadega synchroonis (drifti pole); siselingid olemas (avalehe juhend + KKK + kasutatud-vs-uus leht viitab 4×). |
| **SEO Töö 3: uued päringud** | ✅ Hinnatud — sel nädalal uusi päringuid ei tekkinud; top-päringud on olemasoleva sisuga kaetud. Uut juhendit ei vaja. |

| # | Raporti leid | Tegevus (detailne kirjeldus allpool) | Staatus |
|---|---|---|---|
| P0 | **Meta 174,14 € — 0 ostukorvi, 0 ostu** (1632 klikki → 908 LP-vaadet → 20 tootevaadet) | Events Manager/CAPI sündmuste kontroll + maandumislehtede LP→toode tee läbivaatus (p 3) | ✅ diagnostika tehtud — jälgimine korras; järgmine: LP→toode tee tugevdamine |
| P0 | Tellimusi 2 (eesmärk ≥8/11 p), käive -54 % (AOV 1163 → 532 €) | Konversiooniraja kontrollnimekiri: laoseis/hinnad, ostuvoolu test, tarneinfo, kassa (p 4) | ✅ kontrollitud — koodi- ja laoseisuvigu pole |
| P1 | ALPHA GO budget-lost 37 % (IS 35 %, 5 konv, 94,56 €/nädal) | Päevaeelarve tõus (+50 %): `set-budget.mjs` dry-run → live (p 5.1) | ✅ live 16.10 — 20,00 €/päev |
| P1 | Unilift CC rank-lost 38 % (IS 62 %, 0 konv 38,15 € pealt) | QS-audit; RSA asjakohasuse kontroll; maandumislehe `/unilift` konversioonivõime (p 5.2) | ⛔ jääb peatatuks (otsus 16.10) |
| P1 | QS 3/10 „tsirkulatsioonipump" (201 näit) + „tühjenduspump" (181 näit); LP-kogemus BELOW_AVERAGE 10+ märksõnal | Märksõna H1-s/esimeses lõigus + LCP < 2,5 s kontroll (p 5.3) | ✅ auditeeritud — komponendid korras, skoor ajalooline |
| P1 | „Grundfos" pos 11,3 (71 näit/nädal), maandumisleht `/` | Laiendame avalehe Grundfosi-osa valikujuhendi, hindade ja korduvate küsimustega ning lisame kolm siselist linki (p 6, Töö 1) | ✅ tehtud 16.10 (live ~1 h + deploy) |
| P1 | „grundfos pump" — 1 konv, 13,63 € (mitte-brändi, konverteerib!) | Orgaanilise maandumislehe tugevdamine (p 5.3); EI panna negatiivseks | ✅ kaetud avalehe juhendiga |
| P2 | „veeautomaat / hüdrofoor" 22,8 → 19,8 | Värskendame veeautomaatide kategoorialehte (hinnad, korduvad küsimused, pildid) ja lisame kaks siselist linki (p 6, Töö 2) | ✅ tehtud/kontrollitud 16.10 |
| P2 | Sessioonid -17 % (340 → 283) | Kanalite lõikes analüüs (p 7) | ✅ analüüsitud — põhjus Meta/Unilift peatatud reklaamides |
| — | Orgaanilised klikid +36 % (6,7 → 9,1/päev) | Positiivne — jätkata sama sisutöö kursi | — |
| — | Meta vs Google: 2,68 € vs 2,27 € /sessioon | Strateegiaotsus: kas üks Meta kampaania SALES-eesmärgile (p 3.3) | otsus ootel |

Märkus eelmise (kustutatud) raporti leiu kohta: „grundfos pump" (15,12 € ilma konversioonita) — uuel perioodil on sama päring **1 konversiooniga (13,63 €)**. Negatiivseks märksõnaks seda EI tohi panna; vastupidi — vt p 5.3.

---

## 3. P0 — Meta: 174 €, 0 ostukorvi, 0 ostu

Lehter: 1632 klikki → 908 LP-vaadet (56 %) → **20 tootevaadet (1,2 % klikkidest!)** → 0 ostukorvi → 0 ostu.
Kaks võimalikku põhjust — kontrollida mõlemad selles järjekorras:

1. **Sündmuste voog katki** — kas `view_content`/`add_to_cart`/`purchase` jõuavad Metani:
   - [ ] Meta Events Manager: kontrolli `add_to_cart` ja `purchase` sündmuste laekumist (Pixel **ja** CAPI — meil on CAPI olemas, `lib/meta-capi`, test `tests/meta-capi.test.ts`).
   - [ ] Test: tee testostukorv → kontrolli Events Manageris „Test events", kas ATC registreerub.
   - [ ] Kui CAPI saadab, aga Pixel ei näita: dedupikatsioon (`event_id`) kontrolli.
2. **Maandumisleht ei vii toote juurde** — 908 LP-vaadet, aga vaid 20 tootevaadet:
   - [ ] Kuhu Meta kampaaniad tegelikult viivad? (ALPHA GO → 466 LPV, Unilift B2B → 412 LPV, remarketing → 30 LPV.) Kontrolli, et laaduv leht näitab toodet + hinda + ostunuppu esimesel ekraanil (mobiil!).
   - [ ] Laadimiskiirus mobiilis (Meta liiklus on ~kõik mobiil): LCP < 2,5 s (`npm run lh`).
   - [ ] Remarketing (26,51 €, 218 klikki → 30 LPV = 14 %!) — klikk/LPV suhe eriti nõrk: kontrolli reklaamide linke ja lehe laadimist.
3. **Otsus Meta strateegiast** (jääb 09.10 plaanist lahtiseks): TRAFFIC-eesmärk optimeerib klikke, mitte ostjaid. Kui sündmused töötavad, lülita vähemalt üks kampaania **SALES**-eesmärgile või vähenda kulu, kuni voolaud on tõestatud.

## 4. P0 — Tellimused 2 / käive -54 %

Keskmine tellimus langes 1162,8 € → 532,4 € — käivelangus on AOV-langus, mitte ainult tellimuste arv.

- [ ] Kontrolli, millest koosnesid eelmise akna 2 suurt tellimust (~1160 € keskmine) — juhuslik B2B-eritellimus vs korduv muster (raporti „Nädala tellimused" tabel).
- [ ] 09.10 plaani konversiooni-kontrollnimekiri kehtib edasi: laoseis ja hinnad top-toodetel (ALPHA GO, Unilift CC), ostuvoolu käsittest mobiilis, tarneinfo enne ostukorvi, kassa lihtsus.
- [ ] Seo Meta-parandused (p 3) ja konversioonirada — 1695+ klikki/nädal tasulistest kanalitest peab andma >2 tellimust.

## 5. P1 — Google Ads

### 5.1 ALPHA GO: budget-lost 37 % (IS 35 %, 5 konv, 94,56 €/nädal)

Kampaania konverteerib (5 konv Ads'i omistusel) ja kaotab üle kolmandiku nähtavusest **eelarve** tõttu — see on otsene kaotatud müük.

- [ ] Tõsta päevaeelarvet (nt +50 %): `scripts/set-budget.mjs` — dry-run → kinnitus → live. Hinnang: 94,56 € / 0,35 IS → täisnähtavus ~270 €/nädal; tasuvuskünnis = kas 5 konv kulu 94,56 € pealt on marginaalis (CPC ~0,11 € on väga odav — tõenäoliselt tasuv).
- [ ] Kontrollpunkt järgmisel raportil: IS ≥ 50 %, budget-lost < 20 %, konversioonide arv.

### 5.2 Unilift CC: rank-lost 38 % (IS 62 %, budget-lost 0 %)

Rank-lost = kaotame oksjoni Ad Rank'i (QS × pakkumine) pärast. 09.10 maxCPC tõusud (0,75 € / 0,60 €) on tehtud — IS 62 % näitab osalist toimet.

- [ ] `tmp/_qs-audit.mjs` (read-only): kas ad relevance on „tühjenduspump" rühmades taastunud; kui ei → RSA pealkirjade täpsed märksõnavormid uuesti üle kontrollida (juhend p 3.1).
- [ ] Kui QS-komponendid ei liigu 2 nädalaga: kaalu maxCPC tõstmist top-märksõnadel (ainus kohene hoob).
- [ ] Kampaania 0 konversiooni 38,15 € pealt — kontrolli maandumislehte `/unilift` konversioonivõimekust (laoseis, hind, CTA).

### 5.3 QS 3/10: „tsirkulatsioonipump" + „tühjenduspump" — LP-kogemus on süsteemne nõrk koht

Mõlemal: oodatud CTR keskmine, **asjakohasus alla keskmise, maandumisleht alla keskmise**. Lisaks on `post_click_quality_score = BELOW_AVERAGE` enam kui 10 märksõnal (sukelpump, küttepump, veeautomaat, kastmispump, veepumbad, salvkaevu pump, grundfos sololift...) — see pole üksiku märksõna, vaid **maandumislehtede üldine probleem**.

- [ ] Kontrolli, et märksõna on maandumislehe H1-s ja esimeses lõigus (`/alpha-go`, `/unilift` — 09.10 kategooriate sisulaiendused peaksid seda katma; verifitseeri live-is).
- [ ] **LCP < 2,5 s** maandumislehtedel (`npm run lh`) — LP-kogemus ja orgaaniline järjestus paranevad korraga (topeltvõit).
- [ ] „grundfos pump" (1 konv, 13,63 €) — konverteeriv mitte-brändi päring: kontrolli selle orgaaniline maandumisleht ja positsioon; täienda lehte (Ads tõestab konversiooni).
- [ ] QS on mahajääv signaal (uueneb 2–4 nädalat) — hinda komponentide liikumist, mitte skoori ennast.

## 6. SEO tööd raporti leidude põhjal

Viimases raportis on kaks SEO-leidu. Mõlemast allpool pikemalt — mis täpselt muutub, kus see muutub ja miks see aitab.

### Töö 1: tõugame „Grundfosi" otsingutulemused esimesele lehele

**Millest lähtume.** Inimesed otsivad Googles Grundfosi pumpasid meie poega seotud päringutega umbes 71 korda nädalas. Meie keskmine koht nendel päringutel on praegu 11,3 — see tähendab, et oleme esimese lehe (kümne tulemuse) piiri peal, aga enamasti teisel lehel. Google suunab „grundfos"-päringute maandumisleheks meie avalehe. Esimesele lehele jõudmiseks piisab tavaliselt sisutööst — välislinke ei ole vaja.

**Mida teeme.** Laiendame avalehe Grundfosi-osa sama mustri järgi, mis veeautomaatide lehel juba töötas (seal tõusis positsioon mõne nädalaga 27,9 → 19,8). Avalehele lisandub Grundfosi valikujuhend lihtsa eesti keeles: milline seeria milleks sobib (küttepumbad, puurkaevupumbad, drenaažipumbad, veeautomaadid), millised on tegelikud hinnavahemikud poes, ja 4–6 korduvat küsimust koos vastustega. Kõik tekstid kirjutatakse viies keeles nagu mujal poes. Lehe tehnilisse osasse lisandub ka struktureeritud andmete plokk (FAQPage JSON-LD), mis võimaldab Google'il kuvada küsimusi ja vastuseid otse otsingutulemustes — see suurendab meie nähtavust ja läbiklikkimist.

**Lisaks optimeerime avalehe pealkirja ja kirjeldust** (need on tekstid, mida Google otsingutulemustes näitab), et need vastaksid täpselt päringule „grundfos pump" ja kutsuksid klikkima — praegune koht 11,3 annab meile näitamisi, aga klikke saaks sama positsiooni juures rohkem, kui tekst on köitvam.

**Kolmas osa on siselingid.** Lisame kolm uut linki teistelt lehtedelt avalehe Grundfosi-osasse — küttepumpade, veeautomaatide ja puurkaevupumpade kategoorialehtedelt. Linkide tekstiks on päris märksõnad (näiteks „Grundfos küttepumbad"), sest Google loeb lingitekstist, mille käsus sihtleht on, ja tõstab seda nende päringute peal.

**Mida ootame.** Perekonna „Grundfos" keskmine positsioon langeb alla 10 (esimene leht) ja klikid kasvavad praeguselt 6–11 nädalas. Sisutöö kajastub Google'is tavaliselt 2–6 nädalaga — kontrollime seisu 22.10 ja 29.10 raportitest.

### Töö 2: kinnitame veeautomaatide tõusu

**Millest lähtume.** Perekond „veeautomaat / hüdrofoor" on tõusnud 22,8 → 19,8 ehk liigub õiges suunas, aga on veel teisel lehel. Tõus tuleb septembri lõpus tehtud sisulaiendusest — nüüd tuleb see kinnistada, et see tagasi ei vajuks.

**Mida teeme.** Värskendame veeautomaatide kategoorialehte: hinnatabel uute hindadega, laiendame korduvaid küsimusi raporti „Uued päringud" tabeli päris päringutega (need on sõnad, mida inimesed täna päriselt googeldavad) ja kontrollime tootepiltide kvaliteeti. Lisaks viivad lehele kaks uut siselinki — üks avalehe Grundfosi-osast ja teine „kasutatud vs uus pump" juhendist.

**Mida ootame.** Positsioon püsib ≤ 19 järgmises raportis (22.10) ja langeb ≤ 15 kuu lõpuks.

### Töö 3: iganädalane päringute jälgimine

Iga raport toob välja „Uued päringud" — sõnad, mida inimesed hakkasid meie lehe kaudu Googles leidma. Käime need iga nädal läbi ja kui mõni päring kordub või on müügikavatsusega, kirjutame sellele juhendi või laiendame vastavat kategoorialehte. Näiteks nii sündis „Kasutatud vs uus Grundfos pump" juhend, mis tõmbas kogu Grundfosi perekonna positsiooni üles.

**Kuidas tööjärjekord käib.** Raport märgib iga nädal automaatselt „Käeulatuses" perekonnad (positsioon 4–15 ja vähemalt 30 näitamist) — need on järjekorras esimesed, sest seal piisab esimesele lehele jõudmiseks sisutööst. Põhitabel näitab kõigi perekondade positsiooni liikumist nädalast nädalasse.

## 7. P2 — Sessioonid -17 % (340 → 283)

- [ ] Võrdle GA4 kanalite lõikes: kui langus on Paid Social → seotud Meta lehtriprobleemiga (p 3); kui orgaaniline → GSC peatabeli perekonnad. Orgaanilised klikid kasvavad (+36 %) — tõenäoline langus on tasulistes/sotsiaalkanalites.
- [ ] Ads klikid -12 % (1201 → 1058) — seos ALPHA GO eelarvepiiranguga (p 5.1 lahendab osaliselt).

---

## 8. Järgmise raporti kontrollpunktid (N 22.10.2026, periood 12.10–18.10)

1. **Kooskõla kontroll:** kaartide „vs eelmine nädal" == muutuste tabel (peab klappima täpselt — uus loogika).
2. Meta Events Manager: ATC/purchase sündmused laekuvad (Pixel + CAPI); LC→VC suhe tõusmas üle 10 %.
3. ALPHA GO: IS ≥ 50 %, budget-lost < 20 % (kui eelarvet tõsteti).
4. QS-komponendid („tsirkulatsioonipump", „tühjenduspump"): ad relevance / LP-kogemus taastumas.
5. „Grundfos" pere ≤ 10; „veeautomaat / hüdrofoor" ≤ 19.
6. Tellimused ≥ 3 (11-päevane aken).
