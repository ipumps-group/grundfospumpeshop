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

## 📊 Ads Control Panel

A production-ready advertising management panel built into the admin (`/haldus/ads`).

### Access

Navigate to `/haldus/ads` after authentication. The panel requires `ads_role` set in the user's profile.

### Setup

1. **Run the SQL migration** in Supabase SQL Editor:
   - Open `migrations/001_ads_schema.sql`
   - Execute in Supabase Dashboard → SQL Editor

2. **Set environment variables** in `.env.local` (see `.env.example`):
   - Google Ads: `GOOGLE_ADS_DEVELOPER_TOKEN`, `GOOGLE_ADS_CLIENT_ID`, `GOOGLE_ADS_CLIENT_SECRET`, `GOOGLE_ADS_REFRESH_TOKEN`, `GOOGLE_ADS_LOGIN_CUSTOMER_ID`
   - Meta Ads: `META_ACCESS_TOKEN`, `META_AD_ACCOUNT_ID`, `META_BUSINESS_ID`, `META_API_VERSION`
   - GA4: `GA4_PROPERTY_ID`
   - OpenAI: `OPENAI_API_KEY`

3. **Link ad accounts** via `/haldus/ads/settings/integrations`

4. **Import data** via `/haldus/ads/sync`

### Architecture

```
app/haldus/ads/           ← Pages
  page.tsx                  Dashboard
  campaigns/                Campaign list & detail
  ads/                      All ads
  accounts/                 Account management
  recommendations/          AI recommendations
  reports/                  Report generation
  change-log/               Approval workflow & history
  sync/                     Manual data sync
  settings/integrations/    Platform connections

app/api/ads/               ← API routes
  sync/                     Data import endpoints
  recommendations/          AI analysis
  reports/                  Report generation & export
  change-requests/          Approval workflow
  mutations/                Campaign mutations
  insights/                 Aggregated data

lib/ads/                   ← Services
  types.ts                  TypeScript types
  supabase.ts               Database queries
  google-ads.ts             Google Ads API
  meta-ads.ts               Meta Ads API
  ga4.ts                    GA4 Data API
  openai.ts                 AI analysis
  sync.ts                   Sync orchestrator
  mutations.ts              Mutation execution
  export.ts                 CSV/XLSX export
  utils.ts                  Formatting helpers

components/ads/            ← UI components
  metric-card.tsx           KPI display
  data-table.tsx            Sortable/searchable table
  status-badge.tsx          Status labels
  chart.tsx                 Spark/bar charts

migrations/                ← SQL schema
  001_ads_schema.sql        Full database schema
```

### Key Features

- **Multi-platform**: Google Ads + Meta Ads + GA4
- **Approval workflow**: All mutations require approval
- **AI recommendations**: OpenAI-powered analysis
- **Full reporting**: 12 report types with CSV/XLSX export
- **Change history**: Complete audit trail
- **Period comparison**: Current vs previous period metrics

### TODO: API Credentials & Permissions

- Google Ads: Apply for Developer Token (basic or standard access)
- Google Ads: Set up OAuth 2.0 credentials in Google Cloud Console
- Meta: Generate long-lived System User Token with `ads_management` permission
- OpenAI: Get API key from platform.openai.com

## 📝 License

Eraomand — iPumps OÜ