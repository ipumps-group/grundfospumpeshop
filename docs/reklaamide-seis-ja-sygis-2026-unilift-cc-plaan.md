# Reklaamide olukord ja sügise 2026 kampaania plaan — Unilift CC / drenaaž

**Ettevõte:** Pump OÜ / Pumbapood
**Veebileht:** pumbapood.ee
**Koostatud:** 2. september 2026
**Andmeallikas:** Google Ads API ja Meta Graph API live-päringud (2.09.2026), varasemad auditid `docs/`-kaustas

---

## 0. Uuendus 9.09.2026 — UNILIFT ilmapulss välja lülitatud, maandumisleht `/unilift`

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
| ≥ 10 mm | 18,00 € | tugev vihm |
| ≥ 4 mm | 14,00 € | vihmane |
| < 4 mm | 10,00 € | põhiline |

- **Täitmine:** `GET /api/cron/weather-pulse` (Vercel Cron, iga päev 05:00 UTC = 08:00 EEST / 07:00 EET; kaitstud `CRON_SECRET`-iga). Manuaalne/test käivitus: `node scripts/weather-pulse.mjs [--dry-run] [--force]`.
- **Piirid:** eelarve jääb vahemikku 10–18 €/päev; muudatus tehakse ainult kampaania aknas (8.09–30.11.2026); kui eelarve on juba õige, muudatust ei tehta.
- Test 2.09.2026: Pärnu prognoos 14,7 mm/48h (92%) → otsus oleks olnud 18 €/päev.

**Vajalik deploy ja Verceli seadistus:** `vercel.json` (cron) ja `CRON_SECRET` keskkonnamuutuja tuleb lisada Verceli projekti ning teha production-deploy, et cron tööle hakkaks.

### B2B tugistruktuur (2.09.2026)

- **Uus B2B maandumisleht:** `https://pumbapood.ee/leht/edasimyujatele` — hulgihinnad, laoseis, tehniline tugi + päringuvorm (kontaktivormi konversioon mõõdetav). Google B2B reklaamirühm ja Meta „küsi pakkumist" reklaam suunavad siia.
- **B2B e-kirja mall:** `emails/UniliftCCPartner.tsx` (React Email, sama stiil nagu AlphaGoInstaller/Reseller) — sügis/drenaaž teemaline otseüürikiri edasimüüjatele ja paigaldajatele. Saatmiseks on vaja adressaatide nimekirja.

---

*Dokumendi andmed pärinevad live API-päringutest 2.09.2026 (skriptid: `scripts/audit-current-state.mjs`, `scripts/create-unilift-cc-google.mjs`, `scripts/create-unilift-cc-meta.mjs`).*
