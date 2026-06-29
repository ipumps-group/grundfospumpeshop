# Google Ads — Juuni 2026 Kokkuvõte

**Konto:** Pump OÜ (2639481819) | **Leht:** pumbapood.ee

---

## Juuni tulemused

| Mõõdik | Tulemus |
|--------|---------|
| **Kulu** | **355.23 €** |
| Näitamisi | 4 654 |
| Klikke | 728 |
| CTR | 15.6% |
| Keskmine CPC | 0.49 € |
| Konversioone | 0 |
| ROAS | — |

Kampaania käivitus 4. juunil. Kulu stabiilne 10-20 € päevas. Liiklust tuleb asjakohastelt otsinguterminitelt — "puurkaevupump", "reoveepump", "veeautomaat", "grundfos pump" jne. Konversioonijälgimine sai töökorda kuu lõpuks.

---

## Mida tegime

### Veebiarendus

- **Konversioonijälgimine** — Google Ads ostu-, ostukorvi- ja kontaktivormi eventid saidi koodis. GDPR cookie consent.
- **Admin paneel** — `/haldus/ads` dashboard koos kampaanialehtede, sync'i, raportite ja AI soovitustega.
- **Google Ads API ühendus** — otseandmete import Supabase'i.
- **Verceli seadistus** — 38 keskkonnamuutujat sünkroniseeritud, sh kõik Google Ads API võtmed.
- **GTM + GA4 + Meta Pixel** — kõik tracking skriptid saidil.

### Google Ads konto

| Muudatus | Detail |
|----------|--------|
| **Pausitud 7 madala QS-iga märksõna** | "drenaazipump" (QS=1), "veesurve tõstmine" (QS=1), "aiapump" (QS=3), "rõhutõstepump" (QS=3), "veeautomaadid" (QS=3), "tsirkulatsioonipump" (QS=3), "septiku pump" (QS=3) |
| **Lisatud 25 negatiivset märksõna** | "milline", "kuidas", "remont", "hooldus", "hind", "odav", "varuosa", "tihend" jne — filtreerivad informatiivsed otsingud |
| **Loodud brändikampaania** | "Pumbapood Brand Search - EE" — 20 €/päev, 9 märksõna, 2 RSA-d |
| **Loodud 9 uut RSA reklaami** | Igas aktiivses grupis nüüd 2-3 reklaami testimiseks |
| **Parandatud kampaania nimi** | Testi käigus tekkinud "Brand DOES_NOT_C" → korrektne nimi |

### Konto struktuur

| Kampaania | Grupid | RSA-d | Märksõnu | Eelarve |
|-----------|--------|-------|----------|---------|
| Pumbapood Search EE | 5 aktiivset + 1 pausitud | 10+ | ~60 | 15 €/päev |
| **Pumbapood Brand Search** | 1 | 2 | 9 | 20 €/päev |

**Kokku: 2 kampaaniat, 6 aktiivset gruppi, 17 aktiivset reklaami, ~70 märksõna, 35 €/päev**

---

## Olulisemad tähelepanekud

**CTR 15.6%** — väga hea. Näitab, et märksõnad on täpselt sihitud ja reklaamid relevantsed. Grundfos spetsiifilised otsingud (nt "grundfos scala2", "puurkaevupump") toovad kvaliteetset liiklust.

**CPC 0.49 €** — konkurentsivõimeline. Grundfos on premium bränd, konkurente on, aga hind on mõistlik.

**0 konversiooni** — konversioonijälgimine ei olnud juuni jooksul töös. See on nüüd parandatud ja esimesed konversioonid peaksid tulema juulis.

**Impression Share puudub** — API ei tagasta impression share andmeid, mis viitab madalale näitamismahule. Eelarve tõstmine võib aidata.

**Brändikampaania on uus** — loodud 29. juunil, andmeid veel pole. Brändiotsingutel on tavaliselt kõrgeim konversioonimäär.

---

## Kuidas edasi jälgime

### Igapäevane

- **Admin paneel** `/haldus/ads` — ülevaade kuludest, klikkidest, konversioonidest
- **Sync nupp** — tõmba värsked andmed Google Ads API-st
- **Recommendations → Generate AI Analysis** — automaatsed soovitused optimeerimiseks

### Iganädalane

- Kontrolli **Search Terms** raportit — kas on uusi termined, mida negatiivseks lisada või exact matchiks tõsta
- Kontrolli **Quality Score** muutust — paranevad või halvenevad märksõnad
- Võrdle **brändi vs üldise kampaania** tulemusi

### Igakuine

- **Raportite genereerimine** admin paneelis — Executive Summary, Campaign Performance, ROAS Report
- Eelarve ülevaatus — kas tõsta päevaeelarvet kui konversioonid tulevad

### Automaatne (soovitatav seadistada)

- **Vercel Cron Job** (iga 6h) — automaatne andmete sync, ei vaja käsitsi käivitamist
- **AI soovitused** (kord nädalas) — automaatne analüüs ja soovituste genereerimine

---

## Soovitused juuliks

1. **Jälgi konversioone** — kui tracking töötab, jälgi millised märksõnad ja grupid toovad oste
2. **Aktiveeri küttepumpade grupp septembris** — praegu suvel pole mõtet
3. **Tõsta eelarvet** konversioone tootvatel kampaaniatel — kui ROAS on positiivne
4. **Kaalu Google Shopping kampaaniat** — Grundfos tooted koos piltide ja hindadega
5. **Remarketing** — loo kampaania ostukorvi hülgajatele (kõrgeim ROAS e-kaubanduses)

---

*29.06.2026 — andmed otse Google Ads API-st*
