# Meta reklaamide seis ja remarketing-plaan — otsused ja oodatavad tulemused

**Ettevõte:** Pump OÜ / Pumbapood
**Veebileht:** pumbapood.ee
**Koostatud:** 2. oktoober 2026
**Andmeallikas:** Meta Marketing API + Google Ads API + GA4 + tellimuste andmebaas live-päringud (2.10.2026), nädalaraport id=13 (periood 24.–30.09.2026)
**Otsustada:** (1) kas Metat üldse kasutada, (2) kas ja mida muuta praeguse seisu suhtes, (3) milliseid tulemusi on oodata.

---

## 0. Teostus — 2.10.2026 (kliendi kinnitus, Variant D)

Klient kinnitas: Meta reklaamid jäävad alles muutumatult (Variant D — traffic-eelarveid EI kärbita) ja remarketing käivitatakse perioodiks kuni 31.10.2026.

Teostatud (`scripts/create-remarketing-meta.mjs`, idempotentne, dry-run → live → verify; seis 02.10.2026: **kõik ACTIVE**):

| Samm | Tulemus |
|---|---|
| 4 WCA-publikut (30p, prefill) | `RMK: Külastajad 30p` · `RMK: Tootevaatajad 30p` · `RMK: ALPHA GO + Unilift lehed 30p` · `RMK: Ostjad 30p` (välistuseks). Mahud prefill-töötlemisel — täienevad 24–72 h jooksul |
| Kampaania `Pumbapood remarketing - EE 2026` | **ACTIVE** · OUTCOME_SALES, CBO 4,00 €/päev, LOWEST_COST_WITHOUT_CAP |
| 2 adset'i | **ACTIVE** · `RMK külastajad 30p (excl ostjad)` · `RMK tootevaatajad + kampaanialehed 30p (excl ostjad)` — PURCHASE-optimeerimine (pixel + CAPI), EE 21–65, **end_time 31.10.2026 23:59** |
| 4 reklaami | **ACTIVE** · ALPHA GO hero + Unilift KP Avariipump kreatiivid taaskasutuses (2 reklaami adset'i kohta) |

Tehnilised märkused (API v25): `customaudiences` loomisel `subtype`-parameeter pole enam toetatud (WEBSITE on vaikimisi); CBO-kampaania `bid_strategy` tuleb seada kampaania tasandil (`LOWEST_COST_WITHOUT_CAP`), muidu nõuab API adset'il `bid_amount`-i; staatusemuid on v25-s `ACTIVE` (kampaania/adset/reklaam, mitte `ENABLED`).

---

## 1. Praegune Meta seis (faktid, 24.–30.09.2026)

| Kampaania | Eesmärk (objective) | Optimeerimine | Kulu/nädal | Klikid | LP-vaated | Tootevaated | Ostukorvid | Ostud |
|---|---|---|---|---|---|---|---|---|
| ALPHA GO - Küte - EE 2026 sügis | **TRAFFIC** | maandumislehe vaated | 86,22 € (~12 €/päev) | 1214 | 664 | 0 | 0 | 0 |
| Unilift CC - Tühjendus ja drenaaž B2B | **TRAFFIC** | maandumislehe vaated | 71,35 € (10 €/päev) | 959 | 502 | 34 | 0 | 0 |
| **Kokku** | | | **157,57 € (~22,5 €/päev ≈ 675 €/kuu)** | 2173 | 1166 | 34 | **0** | **0** |

Täiendavad faktid:

- **Ükski Meta kampaania ei optimeeri ostjaid.** Mõlemad on TRAFFIC-eesmärgiga — Meta algoritm otsib inimesi, kes tõenäoliselt laadivad lehe, mitte neid, kes ostaks. „0 ostu" on seega osaliselt seadistuse, mitte ainult kanali tulemus.
- **Meta on saidi suurim liiklusallikas** (GA4 nädal 24.–30.09: Paid Social 124 sessiooni > Paid Search 96 > Organic 26). Klikk on väga odav: CPC 0,07 € vs Google'i ~0,5–0,6 €.
- Sessiooni hind: **Meta 1,27 €** (157,57 € / 124 sess) vs **Google 1,91 €** (183,14 € / 96 sess) — aga Google tõi konversioone (nt „grundfos alpha2 25 60 180": 2 konv @ 2 €), Meta mitte ühtegi.
- Klihiev väljalangemisprotsent: Meta 2173 klikist realiseerub GA4-sessioonina ~6–25 % (nõusolekurežiim + kogemusklikid). Maandumislehe vaadete mõõt (1166) on täpsem — neist kaasatud sessioone 73 %.
- Pausitud kampaaniate hulgas on **korrektselt seadistatud SALES-mall** („Pumbapood ostud - EE 2026": OUTCOME_SALES + PURCHASE-pikslisündmus) ja draft-remarketing adset („Remarketing - LP külastajad 30p") — mõlemat saab taaskasutada.
- Pixel (2133761077401963) + CAPI (serveripoolne) on seadistatud ja sündmused liiguvad (tootevaated registreeruvad).

---

## 2. Kolm võimalikku teed

### Variant A — Metast loobuda täielikult (sääst ~675 €/kuu)

**Poolt:** kohene kulutusseisak kanalilt, mille omistatud müük on 0 €.
**Vastu:**
- Kaob ~1/3 kogu saidi liiklusest (124 sessiooni/nädal) ja ainus **teadlikkuse tasand** — ALPHA GO on uudistoode oma müügihooaja tipus; Google otsing konverteerib vaid olemasolevat nõudlust, ei loo uut.
- B2B-sihtrühm (paigaldajad, edasimüüjad) ei osta esimesel kokkupuutel — ilma korduva nähtavuseta väheneb ka Google'i ja otsekanali tulevane nõudlus (META-sessioonide kaasatus on 73 %, st külastused pole juhuslikud).
- 2.10.2026 seisuga nädalaraport mõõdab Metat automaatselt — kanali hindamine on nüüd andmepõhine, „pime kulu" argument kaob.

### Variant B — jätkata nagu praegu (157,57 €/nädal, ainult TRAFFIC)

**Poolt:** null tööd, liiklus säilib.
**Vastu:** eelarve optimeerib klikke, mitte ostjaid — ostuomistus jääb 0-ks ka edaspidi ja küsimus „kas Meta on kasulik" jääb igavesti vastamata. Kallis viis teadlikkuse eest, odavamad alternatiivid puuduvad, aga müüki see ei mõõda.

### Variant C — ümberstruktureerimine: kärpe laia liiklust + remarketing soojale publikule **(soovitus)**

Põhimõte: lai külm liiklus kahanemas, raha liigub sinna, kus kavatsus on kõrgeim — **inimesed, kes on saidil juba käinud** (sh Google Ads'ist ja orgaanikast tulnud). Meta Pixel märgistab kõik nõustunud külastajad allikast sõltumata, seega **Meta remarketing tabab ka Googlest tulnud külastajaid** — Google toob ostukavatsuse, Meta hoiab kliendi otsustusajal nähtaval.

| Kampaania | Praegu | Uus | Muutuse loogika |
|---|---|---|---|
| ALPHA GO (traffic) | ~12 €/päev | **8 €/päev** | Teadlikkus säilib hooaja tipus, ülejäänud lõigatakse |
| Unilift B2B (traffic) | 10 €/päev | **5 €/päev** | B2B-tutvustus säilib väiksema mahuga |
| **UUS: Remarketing (SALES)** | – | **4 €/päev** | Soe publik (kõik külastajad 30p, tootevaatajad, /alpha-go + /unilift külastajad), optimeerimine PURCHASE-sündmusele, ostjad 30p välistatud |
| **Kokku** | ~22,5 €/päev | **17 €/päev (~510 €/kuu, −165 €/kuu)** | |

Miks mitte SALES-eesmärk kohe kogu külma liikluse peale: Meta õppefaas vajab ~50 konversiooni nädalas adset'i kohta — meie poe maht on ~1–5 tellimust nädalas, seega külmal publikul jääks kampaania „learning limited" seisu ilma tulemusta. Soojal publikul on konversioonitihedus kõrgeim ja see on ainus koht, kus SALES-optimeerimisel on reaalne võimalus töötada.

### Variant D — jätkata praegusega + remarketing LISAKS (B + remarketing)

Praegused traffic-kampaaniad jäävad täismahus (22,5 €/päev), remarketing lisatakse peale (4 €/päev) → kokku **~26,5 €/päev (~795 €/kuu, +120 €/kuu)**.

**D eelised C ees:**
- **Puhtam test** — muutub ainult üks muutuja (remarketing lisandub). Kui kärpime samaaegselt liiklust JA lisame remarketingu (C) ning tellimused langevad, ei tea, kumb põhjustas. D korral on 4- ja 8-nädala otsusepunktide järeldused üheselt tõlgendatavad.
- **Publik ei kahane** — remarketing-publikku toidab kogu saidi liiklus; Meta traffic on 1/3 sessioonidest. Täismahus sissetoru = maksimaalne 30-päevane publik.
- **ALPHA GO hooaega ei ohustata** — uudistootega ei katkestata teadlikkuse hoogu müügihooaja tipus.

**D miinused C ees:**
- Kogukulu kasvab ~120 €/kuu (+18 %) enne, kui remarketingu müügiväärtus on tõestatud.
- Kui remarketing ebaõnnestub (pessimistlik stsenaarium), on kulutatud rohkem kui C korral.

**C või D — otsus sõltub eelarveruumist:** kui turunduseelarvet saab ajutiselt +120 €/kuu tõsta, on D parem valik (puhas katse, täis lihter); kui eelarve on fikseeritud, tee C (ümberjaotus). Remarketingu ülesehitus, mõõtmine ja otsusepunktid on mõlemal identsed — erinevus on ainult selles, kas traffic-kampaaniaid kärbitakse. Praktikas remarketing tõenäliselt ei kuluta kogu 4 €/päev limiiti (väike publik), seega D reaalne lisakulu on tõenäolisemalt ~60–120 €/kuu.

---

## 3. Oodatavad tulemused (praeguse statistika põhjal)

**Publiku maht:** GA4 näitab ~374 sessiooni/nädal → 30-päevane külastajapublik ~1200–1600 unikaalset, nõusolekuga ~700–1100 pixeli-märgistatut. Remarketing-eelarve 4 €/päev on sellele piisav — praeguse CPM-i (2,24 €) juures ostab 28 €/nädal ~12 500 näitamist, st sagedus ~8–10 näitamist inimese kohta nädalas (ülempiir; Meta piirab kulu tõenäoliselt ise, reaalne kulu 2–4 €/päev).

**Liiklus:** praegune CTR (3 %) on külma publiku tase; soojal publikul on tavapärane 1,5–2× parem → oodatav CTR 3–5 %, CPC 0,05–0,10 €. Remarketing toob hinnanguliselt **15–30 sessiooni nädalas** — väike maht, aga kavatsuselt saidi tugevaim liiklus.

**Müük (aus ootus):** saidi praegune konversioonimäär on ~0,3 % (1 tellimus / 374 sessiooni). Sooj liiklus konverteerib tüüpiliselt 2–4× külma paremini → 0,5–1 %, mis tähendab **0–1 omistatud ostu 1–2 nädala jooksul** esimesel kuul. Esimese 4 nädala peamine väärtus on seega **mõõtmine, mitte kohene müügikasv**:
1. €/ostu saab Metas esimest korda mõõdetavaks (nädalaraport kajastab automaatselt).
2. Tootevaade → ostukorv → ost -lihter hakkab täituma (praegu 34 tootevaadet, 0 ostukorvi).
3. DB tellimuste nädalamaht on lõplik tõde — korduva nähtavuse efekt peaks kajastuma seal.

**Stsenaariumid 8 nädala peale (remarketingu kulu ~110–220 €, sõltuvalt Meta kulumisest):**

| Stsenaarium | Tulemus | Järeltegevus |
|---|---|---|
| Realistlik | 1–3 omistatud ostu, €/ostu 45–135 € | Kui €/ostu ≤ keskmine tellimuse marginaal, skaleeri eelarvet; muul juhul hoia 4 €/päev „digitaalse vitriinina" |
| Optimistlik | ostud + ostukorvid regulaarsed, €/ostu < Google'i oma | Nihiida veel 3–5 €/päev laialt liikluselt remarketingule |
| Pessimistlik | 0 ostu JA 0 ostukorvi 4 nädalaga | Lülita optimeerimine tootevaatele (view_content) või peata remarketing; teadlikkuskampaaniad jätkuvad senises mahus |

---

## 4. Mõõtmine ja otsusepunktid

- **Iganädalane jälgimine:** nädalaraport sisaldab alates 2.10.2026 Meta kulu, LP-vaateid, tootevaateid, ostukorve, ostu ja kanalite €/sessiooni võrdlust (Meta vs Google). Manuaalset aruandlust pole vaja.
- **Otsusepunkt 1 — 4 nädalat (30.10 raport):** kui 0 ostu JA 0 ostukorvi → optimeerimine vahepealse sündmuse peale või peatus (pessimistlik stsenaarium).
- **Otsusepunkt 2 — 8 nädalat (27.11 raport):** €/ostu võrdlus Google Ads'iga ja DB tellimuste trend → skaleerimine või lõpetamine.
- **Tõe reegel:** DB tellimused > GA4 key events > Meta omistus (nõusolekurežiim alahindab kõiki platvorme võrdselt).

## 5. Riskid (teadlikult)

- **„Learning limited"** — väikese konversioonimahu tõttu ei välju Meta õppefaasist; väikse poe juures aktsepteeritav, tulemused kõiguvad nädalast nädalasse.
- **Nõusolekupõrand** — pixel näeb ~50–70 % külastajatest; publik on väiksem ja omistus alahinnatud. CAPI leevendab, ei kõrvalda.
- **Väike publik** — sagedus võib kasvada liiga kõrgeks (väsimus); seisata kreatiivide rotatsiooniga iga 3–4 nädala tagant.
- **iOS/ATT** — osa Apple'i kasutajatest pole jälitatavad; see on juba praegustes numbrites sees.

## 6. Teostus (alles kliendi kinnituse järel)

1. Custom audience'id: kõik külastajad 30p · tootevaatajad 30p · /alpha-go + /unilift külastajad 30p · ostjad 30p (välistuseks).
2. Uus kampaania „Pumbapood remarketing - EE 2026": OUTCOME_SALES, adset'id publikuti, optimeerimine PURCHASE (pixel + CAPI), olemasolevad kreatiivid/pildid taaskasutusele.
3. Ainult Variandi C korral — eelarvete langetus: ALPHA GO → 8 €/päev, Unilift B2B → 5 €/päev. Variandi D korral traffic-eelarved puutumata.
4. Kontroll: Events Manager'is purchase/add_to_cart sündmuste voog; 15 min pärast live-minekut seisukontroll.
5. Esimesed järeldused 30.10 nädalarapist.
