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

> **SEIS 22.10: punktid 1.1–1.3 TEOSTATUD** — vt allpool „Tehtud" märkused. Punkt 1.4 jääb seisma (pausitud kampaania).

### 1.1 Avalehe Grundfos-täiendus — „käeulatuses" (prioriteet 1) ✅ TEHTUD

**Seis:** perekond „Grundfos" pos **9,8** (oli 11,5), **141 näitamist/nädal** (oli 67 — kahekordistus), kandev leht on avaleht `/`. Esimesele lehele jääb puudu vähe.
**Olemas juba:** meta description parandatud + „Grundfos pumpade valik" siselingide sektsioon (21.09).

**Teha:**
1. Laienda avalehe Grundfos-sektsioon sisuliselt: tootesarjade mini-ülevaade (ALPHA tsirkulatsioon, MAGNA suuremad tsirkulatsioonid, SCALA veeautomaadid, SQ/SQE kaevupumbad, Unilift drenaaž) — igaüks hinnavahemiku „alates X €" ja märksõna-ankru lingiga kategooriasse.
2. Lisa FAQ-plokk (3–4 küsimust: „Miks valida Grundfos?", „Kuidas valida mudelit?", „Kui kiire on tarne?", „Garantii ja hooldus") + FAQPage JSON-LD.
3. Hinda meta title/description uuesti — „Grundfos" päringu snippet peab klikke tooma (pos 9,8 juures on CTR otsustav).

**Teostus:** DB `pages` tabel (slug `esilehtx`), muster nagu `scripts/update-homepage-grundfos-links.mjs` ja `scripts/update-homepage-grundfos-faq.mjs`. Nõuab ISR-i (~1 h) / deploy'd.
**Kriteerium:** „Grundfos" perekond pos ≤ 8 järgmiseks raportiks.

**Tehtud 22.10 (lõplik kujul pärast kliendi tagasisidet):** avalehe kaks sisuliselt korduvat sektsiooni („Grundfos tootesarjad ja hinnad" + „Milline Grundfos pump valida?" juhend) **ühendatud üheks 4-veeruliseks sektsiooniks koos tunnuspiltidega** — iga veerg: tootepilt (link), teema h3 ja lühitekst täpsete „alates X €" hindadega (5 keeles): Küte/tsirkulatsioon (ALPHA GO 170,05 € / MAGNA1 432,31 €) · Veeautomaat (SCALA2 657,41 € / SCALA1 452,05 € / JP 234,52 €) · Puurkaev (SQ 740,87 € / SQE) · Drenaaž (Unilift CC 172,75 € / KP / AP). „kasutatud vs uus" juhendi link jääb lingi-sektsiooni („Grundfos pumpade valik"). Skript: `scripts/merge-homepage-grundfos-guide.mjs` (idempotentne). Jõuab live'i ISR-iga (~1 h).
**Lisaks parandatud:** megamenüüst („Elamud ja ärihooned") puudus **Veeautomaat** kategooria — `Header.tsx` hardkooditud nimekirjas polnud `veeautomaadid` rida (DB-s on aktiivne). Lisatud (Droplet ikoon, 23 toodet); nõuab deploy'd.

**Viimistlus 22.10 (kliendi sõnastus):** veergude „→ valik" tekstilingid asendatud **nuppudega** (filled, #003366) ja veergude tekstid viidud kliendi sõnastusse (ALPHA GO / SCALA2-JP / SQ / Unilift CC); „kasutatud vs uus" link on lingi-sektsioonis. Skript: `scripts/update-homepage-grundfos-columns.mjs` (idempotentne). Raporti adminnis on „(müra)" sild nüüd **„(väike liiklus)"** (`app/haldus/raportid/[id]/page.tsx`).

### 1.2 Veeautomaadid — CTR ja „parim"-sisu (MITTE uus juhendileht) ✅ TEHTUD

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

**Tehtud 22.10:**
1. **Meta ümber** (live DB-s, leht on `force-dynamic` → jõustub kohe): title „Veeautomaat: põrandal seisev ja uputatav — laos | Pumbapood.ee" (parandab ka vana „| iPumps" brändijäänuki), description laoseisu + tarne 1–3 tööpäeva + hinnad alates 234,52 € / 574,57 €. Skript: `scripts/update-veeautomaadid-meta.mjs`.
2. **„Parim veeautomaat 2026 — meie kolm valikut" plokk** kategoorialehel (5 keeles): SCALA2 3-45 (657,41 € — parim eramule), JP 3-42 (234,52 € — parim hind), SBA 3-45 M (574,57 € — parim uputatav) — `lib/category-content.ts` (`picks`) + renderdus `app/[locale]/tooted/[tegevusala]/page.tsx`. Jõuab live'i deploy'ga.
3. **Seotud-kategooriate lingid** („Vaata ka: Salvkaevu- ja kastmispumbad · Puurkaevupumbad", 5 keeles) — annab siselingi tõusvale salvkaevupumpade lehele (`related`). Test: `tests/category-picks.test.ts` (6 testi).

### 1.3 Orgaanilise tõusu kinnitamine (GSC klikid +16 %) ✅ TEHTUD

**Tõusu kandjad (topPages, see nädal):** avaleht (106 näit.), `/tooted/veeautomaadid` (113 näit., pos 9,4), `/tooted/salvkaevupumbad` (29 näit., pos 7,4), ALPHA1 GO tootelehed (pos ~6,6, CTR 17 %).

**Tehtud 22.10:** siselingid lisatud kahest suunast — (a) avalehe uus „Grundfos tootesarjad ja hinnad" sektsioon lingib märksõna-ankrutega veeautomaadid (×3), salvkaevupumbad, puurkaevupumbad, kuttepumbad ja drenaažipumbad sarjadesse; (b) veeautomaatide lehe „Vaata ka" lingid salvkaevu- ja puurkaevupumpadele. ALPHA1 GO toodete tarneinfo teema jääb eraldi — vajab tootelehe malli muudatust (punk lisada, kui järgmine raport kinnitab tõusu jätkumist).

### 1.4 „tühjenduspump" QS 3/10 — SEISUB (seotud pausitud kampaaniaga)

Leid puudutab **pausitud Unilifti kampaaniat** (pausitud 14.10). QS- ja maandumislehe parandustöid (`/unilift`) praegu ei tehta — tulemus ei avalduks ilma liikluseta. Kui Unilift taasaktiveeritakse, siis: kontrollida `/unilift` LCP < 2,5 s ja lehe asjakohasus enne uuesti käivitamist. Raporti poolel on kaunistusena planeeritud: pausitud kampaaniate QS-leiud tulevikus filtreerida (müra vähendamine).

### 1.5 Küttepumpade nähtavuse audit (kliendi prioriteet — külm hooaeg) ✅ TEHTUD

**Audit (22.10, live GSC + lehe lähtekood):** kategoorialehel on kõik põhiline olemas — H1 „Küttepumbad — Grundfos tsirkulatsioonipumbad küttesüsteemile", valikujuhend mõlema täpse märksõnavormiga, hinnatabel live-hindadega, FAQ + FAQPage JSON-LD, tootelehtedel Product JSON-LD, sitemap ja hreflang korras, siselinkid avalehelt (4-veeru sektsioon), menüüst, jalusest ja ALPHA GO lehelt. Orgaaniline nähtavus üldpäringutel on siiski ~0 (28p: 1 näitamist; eelmine 28p: 13, pos 34–81) — põhjus on domeeni noorus/autoriteet vs Bauhof/Depo/Akvedukt, mitte lehe sisu.

**Parandatud 22.10:**
1. **„| iPumps" brändijäänuk → „| Pumbapood.ee"** kõigis 7 kategooria meta_title'is (SERP-is paistsis vana brändi nimi — CTR ja usaldus). Skript: `scripts/fix-category-meta-brand.mjs`.
2. **kuttepumbad meta_description** CTR-paremaks: „Küttepump ja tsirkulatsioonipump laos — Grundfos ALPHA GO asendab vanu UPS/ALPHA pumbad. Alates 170,05 €, tarne 1–3 tööpäeva, tasuta nõustamine."
3. **Kanibalisatsiooni leevendus:** „tsirkulatsioonipump" päringule osutus korra /en/ sooja-tarbevee leht — sooja-tarbevee kategoorialehele lisatud „Vaata ka: Kütte- ja tsirkulatsioonipumbad" link (5 keeles, `related` väli), mis suunab signaali õigele lehele.
4. Raporti **e-kirjas on nüüd märksõnaperekondade tabel** (küttepumbad rida oli varem nähtav ainult adminnis; e-kirjas puudus).

**Mida on-page'i raames enam teha ei saa:** täiendav tõus vajab domeeniautoriteeti (linke, aega) — realistlik tee: ALPHA GO Ads katab vahepeal nõudluse (tsirkulatsioonipump: 192 näit. + 54 kl/nädal) + mudelipõhiste pika-saba päringute orgaanika (pos ~6,6 juba toimib).

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
