# Reklaamide kvaliteedi juhend (Google Ads)

**Kohustuslik standard kõigile uutele ja muudetavatele kampaaniatele.**
Eesmärk: kõik asset-väljad täidetud lõpuni, sh **pildid** — nii on Ad Strength "Good/Excellent",
kvaliteediskoor tõuseb, CTR ja Ad Rank paranevad ilma eelarvet tõstmata.

Kehtib alates 27.09.2026. Alus: septembri 2026 kvaliteediparanduste kogemus
(vt `reklaamide-seis-ja-sygis-2026-unilift-cc-plaan.md`, peatükk "0. Uuendus 25./26.09.2026").

---

## 1. Põhimõte: iga väli peab olema täidetud

Google'i Ad Strength karistab iga tühja/pooliku välja eest. "Poor" tekib tavaliselt liiga
väheste pealkirjade, puuduvate märksõnavormide, korduvate pealkirjade, väheste sitelinkide
ja **puuduvate piltide** tõttu. Ükski allolevatest ridadest ei tohi tühjaks jääda.

---

## 2. Uue kampaania kontrollnimekiri (copy-paste)

```
[ ] Reklaamirühmad kitsad: 2–6 märksõna rühmas, üks teema rühmas
[ ] Märksõnad phrase/exact + kampaaniataseme negatiivsed märksõnad
[ ] RSA igas rühmas: 15 pealkirja (max) + 4 kirjeldust (max)
[ ] Iga rühma täpsed märksõnavormid pealkirjades (sh käänded)
[ ] H1-pin: 2–3 rühma märksõnapealkirja (vt p 3.2 pinning'u kohta)
[ ] Pealkirjad unikaalsed: küsimused, numbrid/hinnad, CTA-d, USP-d — mitte sama sõna kordumine
[ ] Display path täidetud (märksõnarikas)
[ ] Sitelinkid: vähemalt 8, igaühel 2 kirjeldusrida (≤35 märki)
[ ] Callout'id: 4 (nt Ametlik Grundfos partner, Kiire tarne, Tootjagarantii, Tehniline nõustamine)
[ ] Structured snippet (Types/Brands)
[ ] Price-laiendus (tegelikud kataloogihinnad, kui tooted olemas)
[ ] Call-laiendus (+372 527 4403)
[ ] PILDID: ≥3 erinevat pilti, igaüks 1:1 1200×1200 + 1.91:1 1200×628  ← KOHUSTUSLIK
[ ] Maandumisleht: märksõna H1/H2-s, FAQ + JSON-LD, hinnad, selge CTA
[ ] Dry-run skriptis → kasutaja kinnitus → live
[ ] Peale live: kontrolli seisu (15H, policy APPROVED) — vt p 6
```

---

## 3. RSA-d

### 3.1 Maht ja sisu
- **15 pealkirja + 4 kirjeldust** — alati täis mahuni (Google'i maksimum).
- Iga rühma märksõnade **täpsed vormid** peavad pealkirjades esinema
  (nt rühm "Pinnavesi": "Pinnavee Pump Laos", "Vihmavee Pump Laos", "Pinnavee Äravoolu Pump").
- Unikaalsus: vältida sama sõna kordumist rohkem kui 2–3 pealkirjas. Segu:
  2–3 märksõnapealkirja + hind/arv + küsimus + CTA + USP + bränd.
- Kirjeldused unikaalsed (Google märgib need eraldi checklist-punktina).
- Limiidid: pealkiri ≤30 märki, kirjeldus ≤90 märki (skript valideerib).

### 3.2 Pinning (teadlik kompromiss)
- Vaikimisi: **2–3 märksõnapealkirja kinnitatud H1-le** — hoiab asjakohasuse (ad relevance) kõrge.
- Kitsastes rühmades (2–6 mks) on kõik pealkirjad niikuinii teemalised, seega kui Ad Strength
  kurdab "unpinning some assets" üle ja see on viimane punane punkt, võib pin'id vabastada
  (asjakohasus ei kannata).
- Laias rühmas EI tohi pin'e vabastada — rotatsioonis tuleb vale märksõnaga pealkiri ette
  (25.09 kogemus: ad relevance BELOW_AVERAGE).

### 3.3 Vormistus
- Display path täidetud märksõnaga (nt `unilift/drenaaz`, `alpha-go/kuttepump`).
- Final URL = rühma teemale vastav maandumisleht.

---

## 4. Laiendused — kõik peavad lingitud olema

| Laiendus | Maht | Märkused |
|---|---|---|
| Sitelink | **≥8 kampaania kohta** | linkText ≤25, 2 kirjeldusrida ≤35 märki; toote-, kategooria- ja kontaktilehed |
| Callout | 4 | lühikesed USP-d |
| Structured snippet | 1+ | header "Types"/"Brands" + 4 väärtust |
| Price | 1 | 3 toodet, tegelikud hinnad; keel `en` (vt p 7) |
| Call | 1 | +372 527 4403 |

Kontrolli peale muudatust, et kõik kampaaniaga lingitud oleksid (vt p 6).

---

## 5. Pildid — KOHUSTUSLIK igal uuel kampaanial

Reegel: **kampaaniat ei käivitata ilma pildiassetiteta.** "Add images" on Ad Strength'i
eraldi punkt ja pildid tõstavad CTR-i.

- **≥3 erinevat pilti kampaania kohta**, igaühes kahes formaadis:
  - 1:1 ruut — **1200×1200**
  - 1.91:1 landskap — **1200×628**
- Sisu: **valge taustaga tootefotod ilma tekstita** (tekst/poolitavad sildid → disapproval).
  Pilt peab vastama kampaania teemale (Unilift → pumbafotod, ALPHA GO → küttepumbad).
- Väiksemad tootepildid (nt 400×450) asetada valgele lõuendile (`sharp`, fit inside + white
  canvas) — skript teeb seda automaatselt.
- Fail < 5 MB, JPEG/PNG.
- **Iga pilt peab olema unikaalse sisuga** — Google dedupib identse faili (identne MD5)
  ja korduv üleslaadimine tagastab olemasoleva asseti. Kontrolli enne: `Get-FileHash -Algorithm MD5`.
  (Kogemus: CC5/CC7/CC9 kataloogipildid olid sama placeholder-fail.)
- Üleslaadimine: `scripts/add-image-assets.mjs` — lisa pilt `IMAGES` massiivi (kampaania, võti,
  allikas) ja käivita `--dry-run` → kinnitus → live. Assetide nimed `adimg-*`, korduvkäivitus ohutu.
- V24 tehniline: linkimise field type on **`AD_IMAGE`** (mitte `IMAGE`), campaignAssets või
  adGroupAssets tasemel.

---

## 6. Enne ja pärast live-muudatust

**Enne:**
1. Skript `--dry-run` režiimis → vaata väljund üle → **kasutaja kinnitus** → live.
2. Keelatud sümbolid tekstis: `~` jt (policy disapproval). Skriptid valideerivad pikkused.

**Pärast:**
1. Kontrolli seisu read-only päringuga (käivita `tmp/_live-check.mjs`):
   iga rühm = 1 RSA, 15 pealkirja, `policy=APPROVED`.
2. Kontrolli laienduste linkimist ja pildiassetite olemasolu (vt `tmp/_verify-images.mjs`).
3. Ad Strength uueneb UI-s ~päevaga; QS-komponendid 2–4 nädalat (ajalooline signaal).

---

## 7. Tuntud tehnilised eripärad (Google Ads API v24)

- **Image assets:** field type `AD_IMAGE` (enum'is `IMAGE` puudub).
- **Price-asset:** `finalUrl` (mitte `finalUrls`), `unit` väli ära jätta, `languageCode: 'en'`
  (eesti keel pole toetatud — "From"-silt jääb inglise keelde).
- **Sitelink asset:** `finalUrls` kuulub Asseti ülatasandile, mitte `sitelinkAsset` sisse.
- **Pildid dedupitakse** identse sisuhashi järgi (vt p 5).
- **RSA on immutable** — muutmiseks loo uus, vana pausile. Korduvkäivituseks kasuta
  nime-markerit (nt `AS15`) või kontrolli olemasolevaid assete.
- **GAQL:** WHERE-klauslis ei või kasutada enum-väärtust, mida enum ei sisalda;
  `campaign.name`/`campaign.status` peavad SELECT-is olema, kui WHERE viitab neile.
- **Auto-created assets:** kontol võib Google ise märksõnapealkirju lisada — uued RSA-d
  peaksid märksõnavormid ise katma, et lootus autole ei jääks.

---

## 8. Skriptid (scripts/)

| Skript | Mida teeb | Režiim |
|---|---|---|
| `split-ad-groups-quality.mjs` | Rühmade lõhestus märksõnapõhiselt + uued täis-RSA-d | `--dry-run` |
| `improve-ad-strength.mjs` | Kõik RSA-d 15 pealkirjani (+ täpsed märksõnavormid) | `--dry-run` |
| `add-quality-extensions.mjs` | Structured snippet + price + call | `--dry-run` |
| `add-more-sitelinks.mjs` | Sitelinkid 4 → 8 koos kirjeldustega | `--dry-run` |
| `add-image-assets.mjs` | Pildiassetid (2 formaati) + linkimine | `--dry-run` |
| `raise-brand-cpc.mjs` | Brändi märksõnade maxCPC | `--dry-run` |
| `pause-duplicate-brand-rsa.mjs` | Pausitab rühma üleliigse RSA (reegel: 1 RSA/rühm) | `--dry-run` |

Kõik skriptid on idempotsentsed (juba tehtud sammud jäetakse vahele) ja loevad
`.env.local` Google Ads volitusi.

---

## 9. Maandumislehe nõuded (osa kvaliteedist)

- Märksõna H1-s ja H2-des (täpsed vormid), FAQ-sektsioon + FAQPage JSON-LD.
- Tegelikud hinnad (Supabase'ist, live), selge ostu-CTA, tehniline tugi/kontakt.
- Kiire laadimine (Lighthouse: LCP < 2,5 s), mobiilisõbralik.
- Iga reklaamirühma maandumisleht peab vastama rühma teemale (maandumislehe kogemus
  on QS-komponent).
