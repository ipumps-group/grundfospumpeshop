# Reklaamide olukord ja sügise 2026 kampaania plaan — Unilift CC / drenaaž

**Ettevõte:** Pump OÜ / Pumbapood
**Veebileht:** pumbapood.ee
**Koostatud:** 2. september 2026
**Andmeallikas:** Google Ads API ja Meta Graph API live-päringud (2.09.2026), varasemad auditid `docs/`-kaustas

---

## 0. Uuendus 9.09.2026 — UNILIFT ilmapulss välja lülitatud, maandumisleht `/unilift`

### Uuendus 26.09.2026 — Ad Strength parandused: 15 pealkirja igale RSA-le + 8 sitelinki

Google Ads UI näitas Ad Strength "Poor/Average": puudusid rühma populaarsete märksõnade täpsed vormid pealkirjades, pealkirjad polnud piisavalt unikaalsed ja sitelinke oli ainult 4 (soovitus 8–10).

| Muudatus | Tulemus |
|---|---|
| **Kõik 13 RSA-d → 15 pealkirja** (3 pinned H1 märksõnavormidega + 12 unikaalset) | Lisatud täpsed märksõnavormid, mis puudusid: "Pinnavee Pump Laos", "Vihmavee Pump Laos", "Keldripump Laos", "Drenaaž Pump Laos", "Drenaažitööde Pump", "Keskkütte Pump Laos", "Põrandakütte Pump", "Küttesüsteemi Pump", "Hädapump Laos", "Veeavarii Pump", "Grundfos Edasimüüja", "Grundfos Hulgi", "ALPHA GO Hind", "Küttepumba Vahetus" jne. Kirjeldused jäid samaks (Google märkis need "unique"). Uued RSA-d märgisega `AS15` (kontrollitav `tmp/_verify-adstrength.mjs`). Skript: `scripts/improve-ad-strength.mjs` |
| **Sitelinkid 4 → 8 kampaania kohta** | Unilift: +Tühjenduspumbad, Sukelpumbad, Edasimüüjatele, Hinnad ja valik. ALPHA GO: +Tsirkulatsioonipumbad, ALPHA1 GO al 170,05 €, Vana pumba asendus, Küsi pakkumist. Kõik kahe kirjeldusreaga. Skript: `scripts/add-more-sitelinks.mjs` |
| **Pildiassetid kõigile kolmele kampaaniale** („Your ads aren't as prominent... add images") | 3 tootefotot kampaania kohta, igaüks kahes formaadis (1:1 1200×1200 + 1.91:1 1200×628, valge taust) = 12 unikaalset assetit, `AD_IMAGE` field type. Unilift: CC5, KP, CC komposiit · ALPHA GO: ALPHA1 GO, ALPHA2 GO, ALPHA1 GO 25-60 · Brand: CC5 + KP + ALPHA2 GO. Skript: `scripts/add-image-assets.mjs`. Tehniline märkus: v24 õige field type on `AD_IMAGE` (mitte `IMAGE`) ja **Google dedupib identse sisuga pilte** — CC5/CC7/CC9 kataloogipildid Supabase'is on sama fail (identne MD5), mistõttu esialgne "CC9" laaditi cc5-assetina. Kolmanda pildina kasutatud kohalik `unilift-cc.jpg`. **Soovitus: asendada e-poe CC5/CC7/CC9 tootepildid erinevate mudelite päris fotodega** (praegu sama placeholder igaühel). |

Tähelepanek: kontol on **auto-created assets** sees — Google lisas "Küttepump" RSA-le ise 2 märksõna-pealkirja ("Küttesüsteemi pump", "Põrandakütte pump"). Uued AS15 RSA-d sisaldavad neid vormide juba ise. Ad Strength hinnang uueneb UI-s tavaliselt ~päeva jooksul; QS-komponentide taastumine jätkuvalt 2–4 nädalat.

### Uuendus 25.09.2026 — nädalaraporti (18.–24.09) kvaliteediparandused: rühmade lõhestus, täis-RSA-d, laiendused, brändi CPC, maandumislehed

Diagnoos live-andmetest (25.09): kõik QS 3/10 märksõnad (`tühjenduspump`, `drenaažipump`, `sukelpump`, `tsirkulatsioonipump`) olid **ad relevance = BELOW_AVERAGE** ja peaaegu kõik `/unilift` + `/alpha-go` märksõnad **maandumislehe kogemus = BELOW_AVERAGE** (brändi avalehel ABOVE_AVERAGE). Põhjus: ühes laias rühmas (17 mks) olid kõik 3 märksõnapealkirja kinnitatud korraga H1-le — rotatsioonis näidati otsingule vale pealkirja; RSA-d olid õhukesed (7–8 pealkirja / 2 kirjeldust).

| Muudatus | Tulemus |
|---|---|
| **Reklaamirühmade lõhestus märksõnapõhiselt** | Uued kitsad rühmad: Uniliftis `Tühjenduspump` (2 mks), `Drenaažipump` (6), `Sukelpump` (3); ALPHA GO-s `Tsirkulatsioonipump` (2), `Küttepump` (6). Iga rühm = oma RSA, H1-pin alati rühma märksõna → vale pealkirja rotatsioon kaob. Hädaabi-märksõnad (üleujutus, kelder vett täis jne) → `Avariipump` rühma, vihmavee-märksõnad → `Pinnavesi` rühma. Vanad laiad rühmad (`Drenaaž ja tühjendus`, `Küttepumbad ja tsirkulatsioonipumbad`) pausitud. Skript: `scripts/split-ad-groups-quality.mjs` |
| **Kõik RSA-d laiendatud 12–13 pealkirja + 4 kirjelduseni** | Varem 7–8 pealkirja ja 2 kirjeldust (madal Ad Strength → vähem kombinatsioone). Uued RSA-d USP-dega: tegelikud hinnad, laoseis, tarne 1–3 tööpäeva, tootjagarantii, tasuta nõustamine. Kokku 13 uut RSA-t (5 uutes rühmades + 8 olemasolevas), vanad pausitud (RSA on immutable). |
| **Uued laiendused mõlemale kampaaniale** | Structured snippet (Types), price-laiendus tegelike kataloogihindadega (CC5 172,75 € / CC7 207,60 € / CC9 264,69 €; ALPHA1 GO 170,05 € / 199,12 € / ALPHA2 GO 303,26 €) ja call-laiendus +372 527 4403 → suurem "expected impact" Ad Rank'is. Märkus: price-laienduse keel on `en`, sest Google ei toeta eesti keelt (ainult "From"-silt on inglise keeles; tootenimed ja kirjeldused eesti keeles). Skript: `scripts/add-quality-extensions.mjs` |
| **Brändikampaania maxCPC tõus** | Rank-lost IS 50 % oli pakkumise (mitte kvaliteedi) probleem — QS 8–10, lpExp ABOVE_AVERAGE, aga maxCPC 0,60 € kaotas oksjoni. `grundfos pump` 0,60→1,00 €, `grundfos pumbad` 0,60→0,90 €, `grundfos eesti` 0,60→0,80 €. Päevaeelarve jääb 7 €, kulu kaitstud. Skript: `scripts/raise-brand-cpc.mjs` |
| **Maandumislehtede sisulaiendid** | `/unilift`: hinnatabel 9 CC mudeliga (live hinnad Supabase'ist, nagu `/alpha-go`-l), märksõnarikas H2 ("Tühjendus- ja drenaažipumbad"), FAQ 6 küsimust + FAQPage JSON-LD. `/alpha-go`: H1 "Kaks tsirkulatsioonipumpa paljude asemel", H2 märksõnaga, FAQ + JSON-LD. Nõuab Vercel deploy'd. |

Järelkontroll: QS on ajalooline — oodatav taastumine 2–4 nädala jooksul (kontrollpunktid 02.10 ja 09.10 nädalaraportites; QS-komponendid `tmp/_qs-audit.mjs` read-only skriptiga).

### Uuendus 21.09.2026 — nädalaraporti (13.–19.09) parandused: RSA pin-nikud, kategooria sisu, avalehe lingid

| Muudatus | Tulemus |
|---|---|
| **Märksõnapealkirjad kinnitatud HEADLINE_1 peale** | QS 3/10 märksõnade RSA-des polnud märksõna esikohale kinnitatud. Uued RSA-d: Unilift ("Drenaažipumbad Laos" / "Tühjenduspump Sügiseks" / "Sukelpumbad Laos" → H1 pin) ja ALPHA GO ("Küttepumbad Laos" + "Tsirkulatsioonipumbad" → H1 pin); vanad RSA-d pausitud. Skript: `scripts/pin-rsa-headlines.mjs`. Märkus: QS 3/10 peegeldab veel enne 18.09 parandusi tehtud ajalugu — peaks taastuma järgmiste nädalate jooksul. |
| **`/tooted/veeautomaadid` kategoorialehe sisulaiend** | GSC pere "veeautomaat / hüdrofoor" langes 23,1 → 27,9; süvaanalüüs näitas, et kandjaleht on sama (kandjavahetust pole), langus ajendatud infopäringutest ("parim veeautomaat", "veeautomaat hind", "põrandal seisev/uputatav veeautomaat"). Lehele lisatud valikujuhend, hinnatabel (tegelikud kataloogihinnad) ja FAQ 5 keeles — `lib/category-content.ts` + kategoorialehe renderdus. Nõuab Vercel deploy'd. |
| **Avalehe meta description + Grundfos siselingid** | Meta description'is oli trükk "Grunfos" ja puudusid kandvad märksõnad; nüüd "Grundfos pumbad ja lahendused ühest kohast: veeautomaadid, kütte- ja tsirkulatsioonipumbad, drenaaži- ja kaevupumbad…". Lisatud sektsioon "Grundfos pumpade valik" — siselinks märksõna-ankrutega kõigile Grundfos-kategooriatele (DB, `scripts/update-homepage-grundfos-links.mjs`; ISR ~1h). |
| **Nädalaraporti loogika parandatud** | 1) GA4 tracking-kontroll luges nulisessioonilised päevad valesti: GA4 ei tagasta ridu ilma andmeteta — nüüd loetakse puuduvad päevad 0-sessioonilisteks (13.–19.09 nädal: 4 tööpäeva täiesti ilma — vana loogika oleks öelnud "1 tööpäeva alla 20"). 2) GSC pere-languse leiud vastavad nüüd ise küsimusele "kas Google vahetab kandjalehte?" — pere kaupa top-3 kandjalehte mõlema nädala kohta (`carrierPages`), manuaalne GSC-teekond pole enam vajalik. |
| **Eelarvete ümberjaotus (eelarv neutraalne, 29 €/päev)** | Unilift 14 → 9 €/päev (rank-lost 53 % on piiravaks teguriks, mitte eelarve — kampaania kulutas nädala keskel 1–2 €/päev) · ALPHA GO 10 → 13 €/päev (budget-lost 55 %; esimesel täispäeval 19,60 € kulu 10 € limiidil, CPC 0,08 €) · Brand 5 → 7 €/päev (IS langenud 56 % → 33 %, nõudlus ~2× kasvanud). Unilifti weather-pulse'i astmed samuti −5 €: 18/14/10 → 13/9/5 € (route.ts + weather-pulse.mjs), et cron käsitsi tehtud muudatust üle ei kirjutaks. Skript: `scripts/set-budget.mjs`. |

### Uuendus 18.09.2026 — nädalaraporti QS-parandused + brändikampaania eelarve

| Muudatus | Tulemus |
|---|---|
| **Laiendused lingitud Unilift kampaaniale** | Kõik 30 sitelinki/callout'i olid seotud ainult pausitud "Pumbapood search - EE" kampaaniaga. Unilift CC kampaaniale lingitud 4 sitelinki (Unilift pumbad, Drenaažipumbad, Reoveepumbad, Küsi nõu) + 4 callout'i (Ametlik Grundfos partner, Kiire tarne üle Eesti, Tehniline nõustamine, Tootjagarantii). Skript: `scripts/link-extensions-to-campaigns.mjs`. |
| **"Sukelpumbad Laos" pealkiri drenaaži RSA-sse** | Märksõna "sukelpump" QS 3/10 — märksõna polnud RSA pealkirjades. RSA on immutable: loodi uus RSA (7 vana + 1 uus pealkiri), vana pausitud. Skript: `scripts/add-sukelpump-headline.mjs`. |
| **`/unilift` maandumislehe märksõnad** | QS 3/10 märksõnad "tühjenduspump" ja "drenaažipump" puudusid lehe tekstist (vastavalt 0x ja 2x). Hero tekst + meta description täiendatud mõlema märksõnaga (nüüd 2x ja 4x). Nõuab Vercel deploy'd. |
| **Brändikampaania eelarve 3 → 5 €/päev** | "Pumbapood + Grundfos Brand Search - EE" kaotas 53% nähtavusest eelarve tõttu — ainus kampaania, mis on reaalse ostu toonud. Skript: `scripts/fix-brand-budget.mjs`. |

### Uuendus 14.09.2026 — Display-võrk välja lülitatud, ilmapulss tagasi

| Muudatus | Tulemus |
|---|---|
| **Display-võrk (target_content_network) välja lülitatud** Unilift kampaanial | 8.–14.09 kulus Display-võrgus 57,77 € (84% kampaania eelarvest) — neist 574 klikki / ~51,7 € tuli Hiina B2B-portaalidelt (ecer.com, everychina.com) ja mobiilimängudelt/rakendustelt, mitte Eesti otsingutelt. Kogu eelarve suunatud nüüd Google otsinguvõrku (nagu algses plaanis). |
| **Ilmapulss (weather-pulse) taas sisse lülitatud** | Vihmapäevadel ületas Eesti otsingunõudlus 10 € eelarve (10.–11.09 budget-lost IS 52–66%). `vercel.json` cron taastatud (05:00 UTC, `/api/cron/weather-pulse`); kehtib järgmisest deploy'st. Tasemed: kuiv 10 €, ≥4 mm/48h → 14 €, ≥10 mm/48h → 18 €. Nõuab `CRON_SECRET` Verceli keskkonnas. |

Hiljem lisatud muudatused (kampaania `Unilift CC + Drenaaž - EE 2026 sügis`):

| Muudatus | Tulemus |
|---|---|
| **Ilmapulss (weather-pulse) välja lülitatud** | Vercel Cron `vercel.json` eemaldatud; eelarve ei pulseeru enam ilma järgi. Pumbad on otsingutes saadaval ka siis, kui ilm on kuiv (tegemist on hooajaga). |
| **Google Ads päevaeelarve** | Fikseeritud tasame **10,00 €/päev** (ilmapulsi 10–18 € loogika enam ei rakendata). |
| **Maandumisleht** | Kõik Google RSA ja Meta reklaamid suunavad nüüd `https://pumbapood.ee/unilift` (eraldi UNILIFT kampaanialeht). |
| **Meta pildiviga** | Odd-kujuga (400×450) pildid asendatud korraliku ruudukujulise 1080×1080 pildiga; „image size" vead likvideeritud. |
| **Meta ad set** | `B2B – paigaldajad ja edasimüüjad - Unilift CC` ACTIVE, korras ajakava 8.09 → 30.11.2026; vana duplikaat pausil. |

Aktiivseks jäävad: `Unilift CC + Drenaaž - EE 2026 sügis` (10 €/päev, Search) + `Pumbapood + Grundfos Brand Search` (3 €/päev).

---

## 1. Praegune reklaamide seis (live, 2.09.2026)

### Google Ads (konto 2639481819)

Aktiivsed kampaaniad, kokku **10 €/päev**:

| Kampaania | Päevaeelarve | Reklaamirühmad |
|---|---:|---|
| Pumbapood search - EE 20260604-125236 | 7,00 € | veeautomaadid ja aiapumbad; grundfos ja üldised pumbad; puurkaevu- ja kaevupumbad; drenaaži- ja reoveepumbad; Grundfos pumbad – üldine (kütte- ja ringluspumbad pausil) |
| Pumbapood + Grundfos Brand Search - EE | 3,00 € | Brändiotsingud |

**Tulemused 1.08–2.09.2026:** kulu **338,08 €**, 3 907 näitamist, 675 klikki, **0 konversiooni**.

Suurima kuluga otsinguterminid augustis (kõik 0 konversiooniga): `grundfos pump` (15,61 €), `puurkaevu pump` (14,41 €), `puurkaevupump` (14,35 €), `reoveepump` (13,44 €), `grundfos pumbad` (11,74 €), `veeautomaat` (10,35 €).

Konversioonitoimingud (ost, kontaktivorm, kassa, ostukorv) on kontol aktiivsed, kuid tulemusi ei registreerita.

### Meta Ads

| Kampaania | Eesmärk | Reklaamirühm | Päevaeelarve | Staatus |
|---|---|---|---:|---|
| Pumbapood traffic - EE | Traffic | veevarustus majas – veeautomaadid | 5,00 € | Aktiivne |
| Pumbapood traffic - EE | Traffic | puurkaevu veevarustus – SQ/SQE | 3,50 € | Aktiivne |
| Pumbapood traffic - EE | Traffic | aia kastmine – veeautomaadid | 1,50 € | Aktiivne |
| Pumbapood ostud - EE 2026 | Sales | Sales Advantage – veebikülastajad + uued ostjad | 5,00 € | Pausil |
| Pumbapood traffic - EE | Traffic | Remarketing – LP külastajad 30p | 5,00 € | Pausil |

Aktiivne päevaeelarve kokku **10,00 €**.

**Tulemused 1.08–2.09.2026:** kulu **343,52 €**, 226 384 näitamist, 4 038 lingiklikki, 2 296 maandumislehe vaatamist, **0 ostu, 0 kontakti**.

### Kokku

| Periood | Kulu | Mõõdetud konversioonid |
|---|---:|---:|
| August 2026 (Google + Meta) | ~681,60 € | 0 |
| Juuni algusest kokku | ~2 100+ € | 1 ost (327,50 €, brändiotsing, 23.07) |

### Põhiprobleemid praeguse seisuga

1. **Hooajavale fookus** — jooksvad reklaamid reklaamivad suviseid teemasid (aia kastmine, maja veevarustus, puurkaevud). Sügisel kasvav nõudlus tühjendus- ja drenaažipumpade järele on katmata.
2. **Meta optimeerib klikke, mitte tulemusi** — Traffic-eesmärk toob odavat liiklust, aga mitte ühtegi ostu ega päringut.
3. **B2C-suunatus** — sõnumid ja sihtimine on üksiktarbijale, kuigi soov on võita edasimüüjaid ja paigaldajaid.
4. **Mõõtmine endiselt nõrk** — otsekontaktide (telefon, e-kiri) omistamine reklaamidele ei ole lahenenud; platvormidel 0 konversiooni augustis.

---

## 2. Uus suund (sisend juhatuse poolt)

- Fookus: **tühjenduspumbad ja drenaaž** → **Grundfos Unilift CC seeria** (sügis ja märjad ilmad tulekul).
- Kestus: **kuni 30. november 2026**.
- Sihtrühm: **edasimüüjad ja paigaldajad (B2B)**, mitte üksikkliendid.

---

## 3. Unilift CC tootevalik e-poes (9 toodet, kõik avaldatud)

| Toode | Hind | Tooteleht |
|---|---:|---|
| Unilift CC5 - M1 1x230V 50Hz | 172,75 € | /et/toode/unilift-cc5---m1-1x230v-50hz |
| UNILIFT CC5-A1 1X220-240V SCHUKO | 183,99 € | /et/toode/unilift-cc5-a1-1x220-240v-schuko |
| Unilift CC5 - A1 float arm HU | 195,44 € | /et/toode/unilift-cc5---a1-float-arm-hu |
| Unilift CC7 - M1 | 207,60 € | /et/toode/unilift-cc7---m1 |
| Unilift CC7 - A1 1x220-240V 10m, Schuko | 216,77 € | /et/toode/unilift-cc7---a1-1x220-240v-10m-schuko |
| Unilift CC7 - A1 10m float arm HU | 227,51 € | /et/toode/unilift-cc7---a1-10m-float-arm-hu |
| Unilift CC9 - M1 | 264,69 € | /et/toode/unilift-cc9---m1 |
| Unilift CC9 - A1 1×230V 50Hz Schuko | 280,65 € | /et/toode/unilift-cc9---a1-1230v-50hz-schuko |
| Unilift CC9 - A1 10m AISI316 HU | 351,15 € | /et/toode/unilift-cc9---a1-10m-aisi316-hu |

Kontrollitud maandumislehed (kõik vastavad 200 OK, 2.09.2026):

- Seeria leht: `https://pumbapood.ee/et/tooted/drenaazipumbad/unilift-cc`
- Kategooria: `https://pumbapood.ee/et/tooted/drenaazipumbad`
- Kontakt/B2B päring: `https://pumbapood.ee/et/leht/kontakt`

Märkus: eraldi edasimüüja/B2B maandumislehte e-poes praegu ei ole — B2B sõnum suunab kontaktivormile või seerialehele.

---

## 4. Sügise kampaania plaan (ettepanek)

### Google Ads — uus kampaania

**`Unilift CC + Drenaaž - EE 2026 sügis`**

- Eelarve: **7 €/päev** (võtab üle praeguse üldise Search-kampaania eelarve)
- Lõppkuupäev: **30.11.2026** (kampaania seadetes end date)
- Võrguks ainult Google otsing; keelatud partner- ja Display-võrk
- Maandumisleht: `https://pumbapood.ee/et/tooted/drenaazipumbad/unilift-cc`

**Reklaamirühm 1: Unilift CC (mudelipõhised)**

Märksõnad (phrase): `unilift cc`, `grundfos unilift cc`, `unilift cc5`, `unilift cc7`, `unilift cc9`, `grundfos unilift`, `unilift pump`, `tühjenduspump grundfos`

**Reklaamirühm 2: Drenaaž ja tühjendus (teemapõhised)**

Märksõnad (phrase): `drenaažipump`, `tühjenduspump`, `sukelpump`, `keldripump`, `drenaaž pump`, `kelder vesi pump`, `üleujutus pump`, `drenaaži pump`

**Reklaamirühm 3: B2B — edasimüüjad ja paigaldajad**

Märksõnad (phrase): `drenaažipump hulgi`, `pumbad edasimüüjatele`, `grundfos edasimüüja`, `grundfos hulgi`, `drenaažitööde pump`, `paigaldaja pump`, `drenaažipumbad ettevõttele`

**RSA sõnumid (B2B nurk):**

- „Grundfos Unilift CC — ametlik edasimüüja Eestis"
- „Tühjenduspumbad edasimüüjatele ja paigaldajatele"
- „Hulgihinnad ja kiire tarne laost"
- „Valmistu märgadeks sügisilmadeks ette"
- „Arvega ettevõttele — küsi pakkumist"

**Praegune `Pumbapood search - EE` kampaania:** peata (7 €/päev vabaneb uuele kampaaniale). Alternatiiv: jätta tööle ainult drenaaži- ja reoveepumbad grupp — kuid dubleeriks uut kampaaniat, seega soovitus on peatada terve vana Search-kampaania.

**Brändikampaania `Pumbapood + Grundfos Brand Search` (3 €/päev):** soovitus jätta tööle — ainus kampaania, mis on reaalse ostu toonud (327,50 €, 23.07), kaitseb brändiotsinguid ja on odav. Lõplik otsus kinnitada.

### Meta Ads — uus kampaania

**`Unilift CC - Tühjendus ja drenaaž B2B - EE sügis 2026`**

- Eesmärk: Traffic (maandumislehe vaatamised) — kuni kontaktivormi konversioone on piisavalt Leads-eesmärgiks
- Kestus: käivitus ~8.09.2026, lõpp **30.11.2026** (ad set end date)
- Eelarve: **10 €/päev** kokku
- Geograafia: Eesti; vanus 25–65
- Paigutused: Facebook Feed + Instagram Feed (paigutused, mis on andnud parima maandumiskvaliteedi)

**Reklaamirühm 1: Paigaldajad (6 €/päev)**

Sihtimine huvide kaupa: Plumbing / Construction / Ehitus ja remont / Vesi ja kanalisatsioon; käitumine: ettevõtjad.

**Reklaamirühm 2: Edasimüüjad ja ehitusettevõtted (4 €/päev)**

Sihtimine: Small business owners, ehitusmaterjalid, building materials, Grundfos huvi.

**Loovmaterjalid:** Unilift CC tootepildid (Supabase storage'is olemas) + B2B tekstid:

- „Sügistormid tulevad — kas su klientidel on tühjenduspump valmis?"
- „Grundfos Unilift CC: CC5, CC7, CC9 — laos ja kohe saadaval"
- „Edasimüüjatele ja paigaldajatele: hulgihinnad, tehniline tugi, kiire tarne"
- CTA: „Küsi pakkumist" → kontaktivorm / „Vaata valikut" → seeria leht

**Peatada:** aia kastmine (1,50 €), veevarustus majas (5 €), puurkaevu (3,50 €) — hooaja lõpp. Remarketing ja Sales Advantage jäävad pausile.

### Eelarve kokku (kui kinnitatakse ülaltoodud jaotus)

| Platvorm | Päevaeelarve | Prognoos sept–nov (85 päeva) |
|---|---:|---:|
| Google Ads (Unilift CC kampaania + brändi 3 €) | 10 € | ~850 € |
| Meta Ads (B2B kampaania) | 10 € | ~850 € |
| **Kokku** | **20 €** | **~1 700 €** |

Sama päevaeelarve kui praegu — raha liigub suviselt üldiselt fookuselt sügisele drenaaži-B2B fookusele.

---

## 5. Mõõtmine ja kontrollpunktid

- B2B põhi-CTA: **„Küsi hinnapakkumist"** → kontaktivormi esitus (olemasolev Google Ads konversioonitoiming „Pumbapood contact form submit").
- Telefonikõned ja e-kirjad registreerida augusti plaani kohaselt edasi (allika küsimine).
- Kontrollpunktid: **15.09** (käivituse tehniline kontroll + otsinguterminid), **01.10**, **01.11** (tulemuste võrdlus), **30.11** (kampaania lõpetamine + kokkuvõte).
- Negatiivsed märksõnad: jätkata iganädalast otsinguterminite kontrolli (remont, varuosad, juhendid jms).

---

## 6. Otsused, mida on vaja kinnitada enne live-muudatusi

1. Kas peatada kogu praegune üldine Search-kampaania ja käivitada uus Unilift CC kampaania 7 €/päev?
2. Kas brändikampaania (3 €/päev) jääb tööle?
3. Kas Meta eelarve 10 €/päev jagada 6 € paigaldajad / 4 € edasimüüjad?
4. Kas Meta eesmärk jääb Traffic (LPV) või proovida kohe Leads?
5. Käivituse kuupäev (nt 8.09.2026) ja lõpp 30.11.2026 — kinnitatud?

---

## 7. TEOSTATUD muudatused (2.09.2026)

Kõik otsused kinnitati soovitatud kujul ja rakendati live-kontodel 2.09.2026.

### Google Ads

| Muudatus | Tulemus |
|---|---|
| Vana üldine kampaania `Pumbapood search - EE 20260604-125236` (id 23912990830) | **Pausil** |
| Brändikampaania `Pumbapood + Grundfos Brand Search - EE` (3 €/päev) | Jääb aktiivseks |
| Uus kampaania `Unilift CC + Drenaaž - EE 2026 sügis` (id 24203046624) | **Loodud, ENABLED** — 7 €/päev, ainult Google otsinguvõrk, algus 8.09.2026, lõpp 30.11.2026, manuaalne CPC (maks 0,50 €) |

Uue kampaania struktuur:

| Reklaamirühm | Märksõnu (phrase) | RSA |
|---|---:|---|
| Unilift CC - mudelid | 9 (unilift cc, grundfos unilift cc, cc5/cc7/cc9 jne) | 1 |
| Drenaaž ja tühjendus | 17 (drenaažipump, tühjenduspump, sukelpump, keldripump + **hädaabi/ilma-märksõnad**: üleujutus, kelder vett täis, vihmavee pump, drenaažitööd, veekahju pump jne) | 1 |
| B2B - edasimüüjad ja paigaldajad | 8 (drenaažipump hulgi, grundfos edasimüüja, pumbad ettevõttele jne) | 1 |

Maandumislehed: mudeli- ja drenaažigrupid → `https://pumbapood.ee/tooted/drenaazipumbad/unilift-cc`; B2B-grupp → `https://pumbapood.ee/leht/edasimyujatele` (uus B2B maandumisleht, loodud 2.09.2026 — hulgihinnad, laoseis, tehniline tugi + päringuvorm).
Kampaania-taseme negatiivsed märksõnad (14): remont, varuosad, tihend, kuidas, milline, juhend, manuaal, kasutatud, rent, üür, video, skeem jne.

### Meta Ads

| Muudatus | Tulemus |
|---|---|
| Ad set `veevarustus majas - veeautomaadid` | **Pausil** |
| Ad set `puurkaevu veevarustus - SQ/SQE` | **Pausil** |
| Ad set `aia kastmine - veeautomaadid` | **Pausil** |
| Uus kampaania `Unilift CC - Tühjendus ja drenaaž B2B - EE sügis 2026` (id 120253843650360120) | **Loodud, ACTIVE** — OUTCOME_TRAFFIC, optimeerimine maandumislehe vaatamistele |

Reklaamirühm (algus 8.09.2026, lõpp 30.11.2026, Eesti, 25–65, FB+IG feed):

| Reklaamirühm | Eelarve | Sihtimine |
|---|---:|---|
| B2B - paigaldajad ja edasimüüjad - Unilift CC (120253843655120120) | 6,00 €/päev | Plumbing, Construction, Home improvement, Renovation, Building material, Wholesale |

Märkus: algselt loodi kaks rühma (paigaldajad 6 € / edasimüüjad 4 €), kuid väikese eelarve tõttu liideti need üheks 6 €/päev rühmaks, et Meta õppefaas oleks kiirem. Eraldi rühm `Edasimüüjad ja ehitusettevõtted - Unilift CC` on pausil.

Loovmaterjalid (2 reklaami):

1. **„Unilift CC - valik laos - CC9"** → seeria leht, CTA „Vaata rohkem" (LEARN_MORE)
2. **„Unilift CC - B2B partnerleht - CC7"** → B2B maandumisleht `/leht/edasimyujatele`, CTA „Võta ühendust" (CONTACT_US)

Mõlemal lingil UTM-märgendid (`utm_source=meta&utm_medium=paid&utm_campaign=unilift_cc_sygis_2026`).

Märkus: „Small business owners" käitumissihtimist Meta API-st ei leidunud — kasutusel on huvipõhine sihtimine.

### Aktiivne päevaeelarve pärast muudatusi

| Platvorm | Aktiivne eelarve | Detail |
|---|---:|---|
| Google Ads | 13 €/päev (ilmapulsiga 13–21 €) | Unilift CC 10 € (pulseerub 10–18 € ilma järgi) + brändi 3 € |
| Meta Ads | 6 €/päev (alates 8.09) | Üks kombineeritud B2B reklaamirühm |
| **Kokku** | **19 €/päev** (maksimaalselt ~27 € tugeva vihma korral) | Prognoos sept–nov (84 päeva) ~1 600–2 200 € |

### Kontrollpunktid

- **8.09.2026** — veenduda, et uued kampaaniad lähevad käima (Google: start_date_time; Meta: ad set start_time).
- **15.09.2026** — esimene otsinguterminite ja kulutempo kontroll; lisada vajadusel negatiivseid märksõnu.
- **01.10 / 01.11.2026** — tulemuste võrdlus (LPV kvaliteet, kontaktivormi päringud, telefonikõned).
- **30.11.2026** — kampaania lõpeb automaatselt; kokkuvõte ja otsus talve jätkamise kohta.

### Ilmapõhine eelarvepulseerimine (weather-pulse)

Google Adsi Unilift CC kampaania päevaeelarvet kohandatakse automaatselt ilmateate järgi — drenaažipumpade nõudlus kasvab vihmasetel perioodidel.

- **Andmeallikas:** Open-Meteo API (tasuta, võtit pole vaja) — sademete prognoos (`precipitation_sum`, `precipitation_probability_max`) neljale linnale: Tallinn, Tartu, Pärnu, Rakvere.
- **Loogika:** võetakse linnade maksimaalne 48h sademete summa (täna+homme); kui tõenäosus < 30%, pulssi ei tehta.

| 48h sademed (max üle linnade) | Päevaeelarve | Tase |
|---:|---:|---|
| ≥ 10 mm | 13,00 € | tugev vihm |
| ≥ 4 mm | 9,00 € | vihmane |
| < 4 mm | 5,00 € | põhiline |

- **Täitmine:** `GET /api/cron/weather-pulse` (Vercel Cron, iga päev 05:00 UTC = 08:00 EEST / 07:00 EET; kaitstud `CRON_SECRET`-iga). Manuaalne/test käivitus: `node scripts/weather-pulse.mjs [--dry-run] [--force]`.
- **Piirid:** eelarve jääb vahemikku 5–13 €/päev (21.09.2026 alates; varem 10–18 € — langetati, sest kampaania on rank-lost piiratud ega suuda eelarvet täis kulutada); muudatus tehakse ainult kampaania aknas (8.09–30.11.2026); kui eelarve on juba õige, muudatust ei tehta.
- Test 2.09.2026: Pärnu prognoos 14,7 mm/48h (92%) → otsus oleks olnud 18 €/päev.

**Vajalik deploy ja Verceli seadistus:** `vercel.json` (cron) ja `CRON_SECRET` keskkonnamuutuja tuleb lisada Verceli projekti ning teha production-deploy, et cron tööle hakkaks.

### B2B tugistruktuur (2.09.2026)

- **Uus B2B maandumisleht:** `https://pumbapood.ee/leht/edasimyujatele` — hulgihinnad, laoseis, tehniline tugi + päringuvorm (kontaktivormi konversioon mõõdetav). Google B2B reklaamirühm ja Meta „küsi pakkumist" reklaam suunavad siia.
- **B2B e-kirja mall:** `emails/UniliftCCPartner.tsx` (React Email, sama stiil nagu AlphaGoInstaller/Reseller) — sügis/drenaaž teemaline otseüürikiri edasimüüjatele ja paigaldajatele. Saatmiseks on vaja adressaatide nimekirja.

---

*Dokumendi andmed pärinevad live API-päringutest 2.09.2026 (skriptid: `scripts/audit-current-state.mjs`, `scripts/create-unilift-cc-google.mjs`, `scripts/create-unilift-cc-meta.mjs`).*
