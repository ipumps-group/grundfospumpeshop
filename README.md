# iPumps — Grundfos E-pood

Grundfos pumpade ametlik edasimüüja Eestis. Next.js 16 e-kaubanduse platvorm.

## 🚀 Käivitamine

```bash
npm install
npm run dev
```

Ava http://localhost:3000

## 🔧 Production Build

```bash
npm run build
npm run start
```

## 📊 SEO & Monitoring

### Vercel Speed Insights
Reaalajas Core Web Vitals jälgimine. Saadaval Verceli projekti dashboardil:
- **URL**: https://vercel.com/[your-project]/insights

### Vercel Analytics
Lehe külastused ja kasutajate käitumine. Saadaval Verceli projekti dashboardil:
- **URL**: https://vercel.com/[your-project]/analytics

### Lighthouse CI (Local)

Käivita Lighthouse test kohapeal:

```bash
# 1. Käivita dev server teises terminalis
npm run dev

# 2. Käivita Lighthouse CI (uues terminalis)
npm run lh
```

Testi käib läbi:
- Avaleht (http://localhost:3000/et)
- Kategooria (http://localhost:3000/et/tooted?tegevusala=kute)
- Toode (http://localhost:3000/et/toode/magna3-25-100-180)

Tulemused näitavad:
- Performance (siht: ≥80)
- Accessibility (siht: ≥90)
- Best Practices (siht: ≥90)
- SEO (siht: ≥90)

### Search Console'id (SEO Verification)

Meta sildid on seadistatud `app/layout.tsx`. Vaja lisada tegelikud tokenid:

1. **Google Search Console**
   - Lisa `metadata.verification.google` token
   
2. **Bing Webmaster Tools**
   - Lisa `metadata.verification.other['msvalidate.01']` token

3. **Yandex Webmaster**
   - Lisa `metadata.verification.yandex` token

Kontrolli oma domeeni:
- Google: https://search.google.com/search-console
- Bing: https://www.bing.com/webmasters
- Yandex: https://webmaster.yandex.com

## 🌐 Lokalisatsioon

Toetatud keeled: ET, EN, RU, LV, LT, PL

Tõlkimine:
```bash
npm run translate
```

## 📁 Projekt

```
app/                    # Next.js 16 App Router
├── [locale]/          # Lokaliseeritud lehed
│   ├── page.tsx       # Avaleht
│   ├── tooted/        # Kategooriad
│   ├── toode/         # Toote lehed
│   └── leht/          # Sisulehed
├── api/               # API routes
└── haldus/            # Admin panel

components/            # React komponendid
lib/                   # Utility funktsioonid
messages/              # Tõlked (JSON)
```

## 📝 License

Eraomand — iPumps OÜ