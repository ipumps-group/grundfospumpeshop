# ALPHA GO küttekampaania — plaan ja ülevaade

**Kuupäev:** 02.09.2026
**Eesmärk:** Pumbapood.ee küttehooaja kampaania, fookuses Grundfos ALPHA GO seeria.

---

## 1. Kampaania sõnum (Grundfos materjalidest)

Allikad:
- ALPHA GO Showpad (tootepildid, 26 faili): https://grundfosdk.showpad.com/share/D6oYZnWqXs9bE1S582Vj6
- Grundfos kampaanialeht: https://www.grundfos.com/ee/campaign/the-new-alpha-go-range

**Põhisõnum:** "Kaks pumpa saja asemel" — ALPHA1 GO ja ALPHA2 GO asendavad ~70% integreeritud
Grundfosi tsirkulatsioonipumpadest ja enamiku eraldiseisvatest pumpadest. Grundfos GO äpp
(GO Replace + Guided Setup) teeb asenduse ja kasutuselevõtu kiireks ja täpseks — ühe
kliendikülastusega, ilma tagasikutsumisteta.

**Kolmeastmeline valik poes:**

| Seeria | Positsioneerimine | Asendab | Äpp |
|---|---|---|---|
| **ALPHA2 GO** | Tippvalik — juhendatud seadistus, tasakaalustus, õhu tuvastus, täiustatud AUTOADAPT | ALPHA2, ALPHA3, soojuspumpade UPM3/UPM4 | Grundfos GO |
| **ALPHA1 GO** | Kvaliteetne põhivalik — iseõhutus, kuivalt töötamise kaitse, jõuline käivitus | UPS, vana ALPHA1, ALPHA1 L | Grundfos GO |
| **Uus ALPHA1** | Soodsaim valik | UPS, vana ALPHA1, ALPHA1 L | ei ole |

Vanad mudelid (UPS, UP, ALPHA1 L, ALPHA2, ALPHA3) on tootmisest lõppemas — laoseisud
müüakse lõpuni, kuid neid ei toodeta juurde. Seetõttu tõstetakse ALPHA GO kõikjal esile.

---

## 2. Tehtavad tööd

### 2.0 Maandumisleht `/alpha-go` — TEHTUD 18.09.2026
- [x] Eraldi kampaanialeht `app/[locale]/alpha-go/page.tsx` (UNILIFT-lehe muster):
  hero ("Kaks pumpa paljude asemel"), 3 eelise kaarti, 3 seeria kaarti
  (ALPHA2 GO / ALPHA1 GO / Uus ALPHA1), kompaktsed mudelitabelid (12 SKU-d,
  hinnad live Supabase'ist, ISR 3600), asendustabel (vana pump -> GO pump +
  adapterid), Grundfos GO äpi sektsioon (Google Play / App Store lingid),
  kontaktiplokk. Meta 5 keeles, OG-pilt `pages/bg/alpha-go-hero.jpg`.
  Kampaania pildid (Grundfosi kampaanialehe Scene7 key visual'id) on lokaalselt
  `public/images/alpha-go/` (3 eelise thumbnaili + äpi mobiilivaade app-phone.png).
- [x] ~~(Valikuline) Suuna Google/Meta reklaamide final URL-id `/tooted/kuttepumbad` -> `/alpha-go`~~
  **TEHTUD 18.09.2026** — Google: 3 RSA-d taasloodud uue final URL-iga `https://pumbapood.ee/alpha-go`
  (path alpha-go/kuttepumbad), vanad eemaldatud. Meta: 6 aktiivset kuulutust said uue kreatiivi
  lingiga `https://pumbapood.ee/alpha-go?utm_source=meta&utm_medium=paid&utm_campaign=alpha_go_sygis_2026`.
  Skriptid: `scripts/update-campaign-landings.mjs`, `_audit-campaign-landings.mjs` (read-only kontroll).

### 2.1 Esileht (CMS `pages` tabel, slug `esilehtx`)
- [x] **Promo-bänneri nupp 2 (18.09.2026):** "Grundfosi kampaanialeht ↗" (väline grundfos.com link,
  `_blank`) → **"ALPHA GO pakkumised"** → `/alpha-go` (`_self`; skript `scripts/update-esileht-alpha-go-nupp.mjs`)
- [x] **Hero (sektsioon 0):** kütte-teemaline pealkiri ja tekst + 5 keeles tõlked
- [x] **Promo-bänner (sektsioon 2):** suvine aia-bänner → ALPHA GO bänner
  (uus taustapilt genereeritakse ja laaditakse storage'sse `pages/bg/`), tekstid +
  nupud: "Vaata ALPHA GO tooteid" → /tooted/kuttepumbad ja link Grundfosi kampaanialehele
- [x] **Slider (sektsioon 5):** `esiletostetud` kategooria sisu → ALPHA GO tooted
  (6× ALPHA1 GO + 6× ALPHA2 GO) + slideri pealkirjade tõlked küttekampaaniale
- [x] **Sektsioon 7:** "Telli meilt professionaalne paigaldus" → **"Tehniline tugi ja konsultatsioon"**:
  - Küte: Jüri Masing +372 53 98 4499, juri@ipumps.ee
  - Küte ja veevarustus: Rivo Randmäe +372 510 2376, rivo@ipumps.ee
  - E-poe tellimused/üldinfo: +372 527 4403, info@pumbapood.ee (hinnad, ladu, tellimused)
- [x] **Sektsioon 9 (eelised):** "Paigaldus / Kogenud tehnikud" → "Tehniline tugi / Tasuta nõustamine"

### 2.2 Küttepumbad kategooria (/tooted/kuttepumbad)
- [x] Seeriate järjekord: ALPHA1 GO ja ALPHA2 GO esimeseks, uus ALPHA1 kolmandaks
- [x] GO seeriatele asendus-info kirjeldustes; vanadele seeriatele "asendub …" märkus
- [x] Kategooria kirjeldus + meta uuendatud ALPHA GO-le

### 2.3 Koodi kooskõla
- [x] `app/api/seed-homepage/route.ts` — seemne uuendatud, et reset ei tooks tagasi vana sisu

---

## 3. Reklaamid

**Uuendus 16.09.2026:** kampaaniad on **avaldatud (live)** — Google Ads ENABLED, Meta Ads ACTIVE
(skriptid: `scripts/publish-alpha-go-google.mjs`, `scripts/publish-alpha-go-meta.mjs`).
Päevaeelarve kokku: Google 10 € + Meta 12 €.

### 3.1 Google Ads — "ALPHA GO - Küte - EE 2026 sügis"
- **Tüüp:** Search, ainult Google Search (ei partnervõrgustikku)
- **Eelarve:** 10 EUR/päev
- **Status:** ENABLED (avaldatud 16.09.2026; kampaania id 24214062841)
- **Landing:** https://pumbapood.ee/alpha-go (18.09.2026 alates; varem `/et/tooted/kuttepumbad`)
- **Ad groupid:**
  1. `ALPHA GO - tooted` — alpha go, grundfos alpha go, alpha1 go, alpha2 go jne (8 märksõna, phrase)
  2. `Küttepumbad ja tsirkulatsioonipumbad` — küttepump, tsirkulatsioonipump, keskkütte pump jne (8 märksõna, phrase)
  3. `Vana pumba asendus` — grundfos ups asendus, alpha1 asendus, küttepumba vahetus jne (8 märksõna, phrase)
- **Iga ad groupi all:** RSA (responsive search ad) 7 headline + 2 description
- **Negatiivsed:** remont, varuosa, juhend, manuaal, kasutatud, rent, video jne (15 tk)
- **Skript:** `scripts/create-alpha-go-google.mjs`

**Uuendus 18.09.2026 (nädalaraport):** kampaaniale lingiti 4 sitelinki (Küttepumbad, Kõik Grundfos pumbad,
Võta ühendust, Küsi nõu) + 4 callout'i (Ametlik Grundfos partner, Kiire tarne üle Eesti, Tootjagarantii,
Originaaltooted) — varem olid kõik laiendused ainult pausitud "Pumbapood search - EE" kampaanias
(skript `scripts/link-extensions-to-campaigns.mjs`).

**Diagnoos 18.09.2026 (nädalaraporti "kulu 0 €" kohta):** kampaania käivitus 16.09, esimene tõeline
kulupäev 17.09 (3962 näitamist, 325 klikki, 19,98 € — 2× ülepaisutamine 10 € eelarvest). Raporti
"kulu 0 €/nädal" oli seega aegunud andmetest (enne kulude algust). Budget-lost IS 83% on reaalne —
eelarve saab päevas täis. 18.09 taasloodud `/alpha-go` RSA-d on staatuses REVIEW_IN_PROGRESS
(tavaline, kuni ~1 tööpäev). Soovitus: jälgida 2–3 päeva pärast reklaamide kinnitamist; alles siis
kaaluda eelarve tõstmist 10 → 15 €/päev (skript `scripts/_diag-alpha-go.mjs`).

### 3.2 Meta Ads — "ALPHA GO - Küte - EE 2026 sügis"
- **Eesmärk:** Traffic (OUTCOME_TRAFFIC)
- **Status:** ACTIVE (avaldatud 16.09.2026; kampaania id 120253844082790120)
- **Ad setid:**
  1. `Paigaldajad - ALPHA GO` — 7 EUR/päev — huvid: Plumbing, Central heating, Construction, Home improvement, Renovation
  2. `Edasimüüjad ja ehitusettevõtted - ALPHA GO` — 5 EUR/päev — huvid: Building material, Wholesale, Construction
- **Kreatiivid (3):**
  - ALPHA GO - tootevalik - ALPHA2 GO (tootepilt + link küttepumpade lehele)
  - ALPHA GO - küsi pakkumist - ALPHA1 GO (tootepilt + link kontaktilehele)
  - ALPHA GO - hero - äpp ja pump (Showpad hero pilt + link küttepumpade lehele)
- **Skript:** `scripts/create-alpha-go-meta.mjs`

### 3.3 E-kirjad

**Uuendus 18.09.2026:** e-kirjade planeerimine kliendiga pooleli — mallid ja saatmise API
ei ole veel repos (ootab kliendi kinnitust).

Kaks kampaania e-kirja malli:

| Mall | Sihtrühm | Sisu |
|---|---|---|
| `emails/AlphaGoInstaller.tsx` | Paigaldajad | ALPHA GO äpp, asendusvõimalus, vanad mudelid lõppevad |
| `emails/AlphaGoReseller.tsx` | Edasimüüjad | Hulgihinnad, B2B pakkumine, kolmeastmeline valik |

**Saatmine:** `POST /api/campaign/alpha-go`
```json
{ "type": "installer", "to": "klient@example.ee", "customerName": "Jüri", "dryRun": true }
```
- `dryRun: true` — testib ilma saatmata
- `dryRun: false` — saadab Resend kaudu

**Test-vorm:** `GET /api/campaign/alpha-go` (admin)

### 3.4 Aktiveerimine
Kampaaniad **aktiveeriti 16.09.2026** skriptidega `scripts/publish-alpha-go-google.mjs` ja
`scripts/publish-alpha-go-meta.mjs` (mõlemal `--dry-run` režiim kontrolliks).

Peatamiseks / haldamiseks:
- Google Ads: Google Ads Manager -> kampaania -> Pause
- Meta Ads: Meta Ads Manager -> kampaania -> Pause
- Või admin paneelist `/haldus/ads` (kui sync on tehtud)

---

## 4. Järelsammud (manuaalsed / tulevikus)

1. ~~**Google Ads / Meta kampaania** — aktiveeri~~ **TEHTUD 16.09.2026** (vt p 3.4)
2. **E-kirjade saatmine** — vali sihtrühm ja saada `/api/campaign/alpha-go` kaudu
3. **Showpad materjalid** — vajadusel laadida alla tootepildid/pdf-id ja lisada toodetele
   (`product-documents`).
4. **Jälgimine** — GA4 sündmus kampaanialehe klikkidele; müüginumbrite võrdlus
   (ALPHA GO vs vanad mudelid) kuu aja pärast.
