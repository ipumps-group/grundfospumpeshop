# Nädalaraporti tegevusplaan — 22.10.2026

**Ettevõte:** Pump OÜ / Pumbapood
**Veebileht:** pumbapood.ee
**Koostatud:** 22. oktoober 2026
**Alus:** iganädalase raporti leiud (raport id=19, periood 12.10–18.10 vs 05.10–11.10; GA4, Google Ads, GSC, DB tellimused) + LLM-i analüütiline kokkuvõte (esimene raport, kus see on kaasas).

---

## 0. Täna juba tehtud (22.10.2026)

### 0.1 Unilifti kulu — kontrollitud, tegevuseta

Raport näitas Unilifti kulu, kuid live-kontroll kinnitas: **mõlemad kampaaniad on PAUSED alates 14.10** ja kulu pärast seda on 0 €. Raportis nähtav kulu (Google 19,06 € + Meta 27,31 €) on nädala esimese poole (12.–14.10) õigustatud kulu enne pausi. Järgmises raportis (19.–25.10) on Unilifti kulu 0 €.

### 0.2 Raportisüsteemi parandused (kinnitati kliendi direktiiv „grundfos pump on põhimärksõna")

| Muudatus | Fail | Tulemus |
|---|---|---|
| Brändi-klassifikatsioon laiendatud: **grundfos-terminid = kaitstud bränd** — neid ei esitata kunagi „kulutab ilma konversioonideta → lisa negatiivseks" leidudes | `lib/reporting/ads.ts` (`isBrandTerm`), eraldi kitsas `isOwnBrandTerm` brändieelarve-leiule | Vale „grundfos pump raiskab" soovitus kadunud; brand/non-brand jaotus kajastab strateegiat |
| LLM-i süsteemprompt: range bränditerminite reegel (negatiivseks võib pakkuda ainult modifikaatoreid nt „kasutatud", mitte brändi ennast) | `lib/reporting/llm.ts` | LLM ei paku topTerms-toorandmetest bränditermineid enam isegi kaudselt |
| LLM-i torujuhe: `temperature 0`, **parandusring** (number-auditi läbikukkumisel palub mudel tekst kohe ümber kirjutada), max_tokens 2500→4000, timeout 90→120 s | `lib/reporting/llm.ts` | Narrative ei kuku enam stabiilselt audiidist läbi ega lõiku pooleli |
| Regressioontestid brändi-klassifikatsioonile | `tests/reporting-brand-terms.test.ts` (21 testi) | 123/123 testi lähevad |
| Raport id=19 taasesitatud: parandatud leiud (11→10) + esimene LLM-i kokkuvõte (6251 tähte, number-audit läbitud) | Supabase `weekly_reports` id=19 | `/haldus/raportid/19` näitab parandatud sisu; hommikune e-kiri läks vana sisuga (tagasiulatuvalt muuta ei saa) |

**Avatud punkt:** neljapäevane cron (Vercel) saab narrative'i automaatselt ainult siis, kui `ANTHROPIC_API_KEY` on ka **Verceli production-keskkonnas** — kontrollida Verceli seadetest.

### 0.3 Salvkaevu päringud välja, raha ALPHA GO-le (kliendi otsus, live 22.10)

Diagnoos: „grundfos salvkaevu pump" (4,20 €, 6 klikki, 0 konv) teenis phrase-märksõna **„grundfos pump"** brändikampaanias — seega eraldi märksõna pausutada polnud võimalik (ja põhimärksõna „grundfos pump" ei tohi kunagi pausutada ega negatiivseks panna).

| Muudatus | Tulemus |
|---|---|
| Negatiivsed BROAD märksõnad brändikampaaniale: **„salvkaevu"**, **„salvkaevupump"** (sama konventsioon nagu olemasolevad 25 negatiivset) | Salvkaevu-päringud ei teeni enam brändikulu. Toodekategooria jääb orgaaniliselt müüki (GSC: salvkaevupumbad pos 7,4 ja tõusmas — orgaanika kannab selle) |
| Vana pausitud kampaania inertne märksõna „salvkaevu pump" → PAUSED | Kaitse juhusliku taasaktiveerimise vastu |
| ALPHA GO eelarve 20,00 → **20,60 €/päev** (+salvkaevu nädalakulu 4,20 € ÷ 7) | Raha liigutatud nagu küsitud |

Skriptid: `scripts/add-salvkaevu-negatives.mjs` (idempotentne), `scripts/set-budget.mjs`. Järelkontroll tehtud: negatiivsed olemas, eelarve 20,60 €/päev.

---

## 1. SEO- ja sisuplaan (raporti leidude põhjal, täpsustatud olemasoleva sisu suhtes)

### 1.1 Avalehe Grundfos-täiendus — „käeulatuses" (prioriteet 1)

**Seis:** perekond „Grundfos" pos **9,8** (oli 11,5), **141 näitamist/nädal** (oli 67 — kahekordistus), kandev leht on avaleht `/`. Esimesele lehele jääb puudu vähe.
**Olemas juba:** meta description parandatud + „Grundfos pumpade valik" siselingide sektsioon (21.09).

**Teha:**
1. Laienda avalehe Grundfos-sektsioon sisuliselt: tootesarjade mini-ülevaade (ALPHA tsirkulatsioon, MAGNA suuremad tsirkulatsioonid, SCALA veeautomaadid, SQ/SQE kaevupumbad, Unilift drenaaž) — igaüks hinnavahemiku „alates X €" ja märksõna-ankru lingiga kategooriasse.
2. Lisa FAQ-plokk (3–4 küsimust: „Miks valida Grundfos?", „Kuidas valida mudelit?", „Kui kiire on tarne?", „Garantii ja hooldus") + FAQPage JSON-LD.
3. Hinda meta title/description uuesti — „Grundfos" päringu snippet peab klikke tooma (pos 9,8 juures on CTR otsustav).

**Teostus:** DB `pages` tabel (slug `esilehtx`), muster nagu `scripts/update-homepage-grundfos-links.mjs` ja `scripts/update-homepage-grundfos-faq.mjs`. Nõuab ISR-i (~1 h) / deploy'd.
**Kriteerium:** „Grundfos" perekond pos ≤ 8 järgmiseks raportiks.

### 1.2 Veeautomaadid — CTR ja „parim"-sisu (MITTE uus juhendileht)

**Seis ja täpsustus:** kategoorialehel `/tooted/veeautomaadid` on juba 21.09 lisatud valikujuhend + hinnatabel + FAQ (`lib/category-content.ts`). LLM-i soovitus „kirjuta juhend" on seega osaliselt dubleeriv — tegelik lünk on mujal:

| Päring | Pos | Näitamisi | Klikke | Probleem |
|---|---:|---:|---:|---|
| põrandal seisev veeautomaat | **4,8** | 18 | **0** | CTR — esilehel, aga keegi ei klõpsa |
| parim veeautomaat | 14,9 | 11 | 1 | striking distance |
| veeautomaadid | 54,4 | 26 | 0 | lahtine üldpäring (müra piiril) |

**Teha:**
1. **CTR-parandus:** kategoorialehe title/meta kirjeldus ümber — konkreetne kasu („laos, tarne 1–3 tööpäeva"), hinnavahemik ja „põrandal seisev" sõnena metas; FAQ-sse eraldi küsimus „Põrandal seisev või uputatav veeautomaat?".
2. **„Parim veeautomaat 2026 — meie valik"** plokk kategoorialehele: 3 konkreetset valikut olukorra kaupa (nt SCALA2 eramu, SCA­LA1 väiksem, SBA madalale kaevupinnale) hindadega — vastab otse „parim veeautomaat" kavatsusele.
3. Eraldi lehte „põrandal seisev veeautomaat" jaoks **EI TEE** — 18 näitamist/nädal on liiga väike maht; küsimus lahendatakse kategoorialehe sektsiooni + meta tasemel.

**Teostus:** `lib/category-content.ts` (5 keelt) + kategoorialehe metadata. Kontrollida, et tõlkevõtmed ja JSON-LD säiliksid.
**Kriteerium:** „põrandal seisev veeautomaat" CTR > 0 (esimene klikk); „parim veeautomaat" pos ≤ 10.

### 1.3 Orgaanilise tõusu kinnitamine (GSC klikid +16 %)

**Tõusu kandjad (topPages, see nädal):** avaleht (106 näit.), `/tooted/veeautomaadid` (113 näit., pos 9,4), `/tooted/salvkaevupumbad` (29 näit., pos 7,4), ALPHA1 GO tootelehed (pos ~6,6, CTR 17 %).

**Teha:**
1. Siselinkide audit: avalehelt ja kategooriahub'idelt lisada 1–2 märksõna-ankru linki tõusvatele lehtedele (veeautomaadid, salvkaevupumbad, alpha1-go tooted).
2. Tootedelehtede väike täiendus: ALPHA1 GO 25-80 leht (müüja nädalal) — tarneinfo ja laoseis esilehe osa lähemale (toetab ka konversiooni).

**Teostus:** DB sisuplokid + kategooriate mallid. Väike töö (~1 h).

### 1.4 „tühjenduspump" QS 3/10 — SEISUB (seotud pausitud kampaaniaga)

Leid puudutab **pausitud Unilifti kampaaniat** (pausitud 14.10). QS- ja maandumislehe parandustöid (`/unilift`) praegu ei tehta — tulemus ei avalduks ilma liikluseta. Kui Unilift taasaktiveeritakse, siis: kontrollida `/unilift` LCP < 2,5 s ja lehe asjakohasus enne uuesti käivitamist. Raporti poolel on kaunistusena planeeritud: pausitud kampaaniate QS-leiud tulevikus filtreerida (müra vähendamine).

---

## 2. Ads — avatud otsused

| # | Teema | Soovitus | Seis |
|---|---|---|---|
| 2.1 | **ALPHA GO eelarve 20,60 → 30 €/päev** | Budget-lost IS raportinädalal 44–69 %/päev; kampaania tõi 12,8 konv (Ads-mõõtmine). Astmeline tõus + kontroll nädala pärast; kui tellimused ei järgne, jääda madalamale. Google'i simulaator ALPHA GO-le soovitust ei anna. | **Ootab kinnitust** |
| 2.2 | Meta CAPI: purchase/add_to_cart jõudmine | Meta 141,08 €/nädal, 0 ostu; kontrollida Events Manageris sündmuste jõudmine (sh CAPI), muidu on SALES-eesmärk pime. | Avatud (käsitsi kontroll) |
| 2.3 | Brändikampaania eelarve | Google'i simulaator soovitab 12 → 22 €/päev (+10 % klikke). Bränd on strateegiliselt kaitstud — otsus kliendil. | Avatud |
| 2.4 | Meta ALPHA GO TRAFFIC → osa eelarvest Google'i otsingusse | 86,86 €/nädal TRAFFIC-kulu, 0 ostu — sama raha ostukavatsusega liiklusel tõenäoliselt tulusam. | Avatud |

---

## 3. Järelkontroll (raport 29.10.2026, periood 19.–25.10)

1. **Unilifti kulu = 0 €** (mõlemal platvormil).
2. **Salvkaevu-päringute kulu = 0 €** brändikampaanias (otsinguterminite kontroll).
3. **ALPHA GO** budget-lost IS trend pärast 20,60 €/päev (ja kui kinnitatud, 30 €/päev).
4. **„Grundfos" perekond pos ≤ 8** pärast avalehe täiendust.
5. **Narrative olemas raportis** (kui Verceli env on täiendatud) — muidu ikka rules-only.

---

*Koostatud koostöös raporti LLM-kokkuvõttega; kõik numbrid raportist id=19 või live API-päringutest 22.10.2026.*
