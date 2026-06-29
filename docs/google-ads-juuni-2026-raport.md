# Google Ads — Juuni 2026 Raport

**Konto:** Pump OÜ (2639481819) | **Projekt:** Pumbapood.ee

---

## 1. Konto ülevaade

| Näitaja | Väärtus |
|---------|---------|
| Aktiivseid kampaaniaid | 1 |
| Reklaamigruppe | 6 (1 pausitud) |
| Reklaame | 13 (5 aktiivset, 7 eemaldatud, 1 pausitud) |
| Märksõnu | ~65 |
| Kampaania tüüp | Search (otsingureklaam) |
| Alguskuupäev | 4. juuni 2026 |
| Sihtriik | Eesti |

---

## 2. Juuni tulemused (4.-29. juuni)

### Põhinäitajad

| Mõõdik | Tulemus | Hinnang |
|--------|---------|---------|
| **Kulud** | **353.77 €** | Mõistlik testimiseelarve |
| **Näitamisi** | 4 623 | Madal — kampaanial on ruumi kasvada |
| **Klikke** | 725 | — |
| **CTR** | 15.68% | Väga hea — näitab, et märksõnad on hästi sihitud |
| **Keskmine CPC** | 0.49 € | OK — Grundfos toodete puhul konkurentsivõimeline |
| **Konversioone** | **0** | Kriitiline probleem |
| **Tulu** | 0.00 € | — |
| **ROAS** | 0.00x | — |

### Päevane kulu trend

```
4.06   10.86€ ████████████ 22 klikki
13.06  20.04€ ████████████████████████ 41 klikki — kõrgeim päev
29.06  12.33€ ████████████ 25 klikki
```

Kulu on stabiilne 10-20€ päevas, nädalavahetustel veidi kõrgem.

---

## 3. Reklaamigrupid

| Reklaamigrupp | Staatus | Bid | Märksõnu |
|---------------|---------|-----|----------|
| veeautomaadid ja aiapumbad | Aktiivne | 0.50 € | 18 |
| grundfos ja üldised pumbad | Aktiivne | 0.50 € | 9 |
| puurkaevu- ja kaevupumbad | Aktiivne | 0.50 € | 13 |
| drenaaži- ja reoveepumbad | Aktiivne | 0.50 € | 14 |
| Grundfos pumbad - üldine | Aktiivne | 0.15 € | 14 |
| **kütte- ja ringluspumbad** | **Pausitud** | 0.50 € | 8 |

---

## 4. Mida tegime juunis (veebiarendus)

- **Loodi täielik Ads Control Panel** — dashboard, kampaaniate haldus, sync, raportid, AI soovitused
- **Paigaldati Google Adsi konversioonijälgimine** — ost, ostukorv, kontaktvorm
- **GDPR cookie consent** — vastavuses EU nõuetega
- **Google Ads API ühendus** — otseandmete import Supabase'i
- **Verceli keskkond seadistatud** — kõik 38+ env muutujat sünkroniseeritud
- **Parandati kriitilised vead** — sh GA4 andmete rikutus ja jõudlusprobleemid

---

## 5. Peamised leiud ja probleemid

### Kriitiline: Konversioonijälgimine ei tööta

**725 klikki, 0 konversiooni.** See ei ole normaalne — isegi madala konversioonimääraga e-pood peaks saama 1-3% ostukonversioone.

**Tõenäolised põhjused:**
- Konversioonikood on küll koodibaasis olemas (`lib/google-ads.ts`), aga **ei pruugi olla veel Vercelisse deploytud**
- Või Google Adsis pole konversioonieesmärke (`NEXT_PUBLIC_GOOGLE_ADS_*_LABEL`) õigesti seadistatud

**Mõju:** Google Ads ei saa optimeerida konversioonide järgi. Smart Bidding ei tööta. Ei tea, kas reklaam toodab müüki.

### Struktuursed tähelepanekud

| Leid | Soovitus |
|------|----------|
| "kütte- ja ringluspumbad" on **pausitud** | Aktiveeri — küttepumbad on suur kategooria |
| 7 reklaami 13-st on **eemaldatud** | Loo uued RSA-d, igasse gruppi vähemalt 2 aktiivset |
| "Grundfos pumbad - üldine" grupis on **broad match** märksõnu | Lisa negative keywordid, et vältida ebaolulisi klikke |
| Puudub **brändikampaania** (Grundfos/Pumbapood) | Brändiotsingud on kõige kõrgema ROAS-iga |
| Puudub **remarketing** | Ostukorvi hülgajad ja tootelehe külastajad toovad parimat tulu |
| Puuduvad **Shopping reklaamid** | Grundfos tooted sobivad ideaalselt Google Shoppingusse |

### Mõõdikute analüüs

- **CTR 15.68%** on väga hea — märksõnad on täpsed ja asjakohased (nt "grundfos scala2", "puurkaevupump")
- **CPC 0.49€** on OK — Grundfos on premium bränd ja konkurents on olemas
- **Keskmiselt ~25 klikki päevas** — liiklust on, aga konversioone pole
- **Quality Score** märksõnadel on 5-10, mis on hea — reklaamid on relevantsed

---

## 6. Edasine tegevusplaan

### Kohe (sel nädalal)

1. **Deploy Vercelisse**
   Kõik parandused ja konversioonikood on lokaalses koodibaasis, aga pole veel live-serveris. Deploy on esimene prioriteet.

2. **Kontrolli konversioonijälgimist**
   Peale deploy'd — tee testost ja kontrolli Google Ads → Conversions, kas eventid tulevad läbi.

3. **Aktiveeri küttepumpade grupp**
   `kütte- ja ringluspumbad` — see on talve eel suur kategooria.

### Lähiajal (1-2 nädalat)

4. **Lisa negative keywordid**
   Search Term raport näitab, et kõik klikid tulevad asjakohastelt otsinguterminitelt — aga kui konversioone ei tule, võib osa liiklust olla uuriv/informatiivne (nt "milline pump salvkaevu" — €3.47, 0 konv). Lisa sellised fraasid negatiivseteks.

5. **Loo uued RSA reklaamid**
   Igasse aktiivsesse gruppi vähemalt 2 reklaami A/B testimiseks. Praegu on paljudes gruppides ainult 1 aktiivne reklaam.

6. **Seadista konversioonieesmärgid**
   Kui `view_item`, `search` ja `lead` konversioonid pole Google Adsis loodud — loo need ja lisa labelid Verceli.

7. **Käivita AI analüüs**
   Admin paneelis `Recommendations → Generate AI Analysis` — saad automaatsed soovitused.

### Strateegiline (1-3 kuud)

8. **Remarketing kampaania**
   Loo eraldi kampaania ostukorvi hülgajatele — e-kaubanduses toob remarketing tavaliselt parima ROAS-i.

9. **Brändikampaania**
   Eraldi kampaania "grundfos", "pumbapood", "grundfos eesti" otsingutele — kõrge CTR ja madal CPC.

10. **Google Shopping**
    Grundfos tooted koos hindade ja piltidega — visuaalne formaat toimib pumpade puhul hästi.

---

## 7. Eelarve soovitus

| Soovitus | Praegu | Soovitatav |
|----------|--------|------------|
| Päevaeelarve | ~10-20 € | 30 € (peale konversioonijälgimise toimima hakkamist) |
| CPC bid | 0.15-0.50 € | Tõsta 0.50-0.80 € konversioone tootvatele märksõnadele |
| Kuueelarve | ~350 € | 500-900 € |

**Märkus:** Ära tõsta eelarvet enne, kui konversioonijälgimine töötab. Praegu kulub raha klikkidele, aga me ei tea, kas need toovad müüki.

---

## 8. Võrdlus: mida saime 353€ eest

| Mõõdik | Väärtus |
|--------|---------|
| Näitamisi | 4 623 |
| Klikke | 725 |
| Külastajaid veebilehel | 725 (eeldusel, et kõik klikid jõudsid lehele) |
| Keskmine külastaja hind | 0.49 € |
| Konversioone (tuvastatud) | 0 |

**Kui konversioonimäär oleks 2%:** 725 × 2% = ~14 ostu. Keskmise ostukorviga 200€ = 2800€ tulu = **7.9x ROAS**.

See näitab, kui kriitiline on konversioonijälgimise töölesaamine.

---

*Raport koostatud: 29.06.2026 — otse Google Ads API andmete põhjal*
