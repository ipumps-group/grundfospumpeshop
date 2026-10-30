/**
 * Regression tests for the weekly-report insights engine additions
 * (30.10.2026): Display-network (CONTENT) click-leak detection in Ads and
 * the Meta click→landing-page-view drop-off alert (placement quality).
 * Background: week 19.-25.10.2026 — ALPHA GO spent 71 % of budget on
 * CONTENT junk clicks (1950 clicks, 0 conv) and RMK Meta had 293 clicks →
 * 34 LP views (12 %); neither was visible in the report at the time.
 */
import { describe, it, expect } from 'vitest'
import { buildInsights } from '@/lib/reporting/insights'
import type { AdsData, MetaData, ReportSnapshot } from '@/lib/reporting/types'

function baseSnapshot(): ReportSnapshot {
  return {
    generatedAt: new Date().toISOString(),
    period: { start: '2026-10-19', end: '2026-10-25', prevStart: '2026-10-12', prevEnd: '2026-10-18' },
    ga4: null,
    gsc: null,
    ads: null,
    meta: null,
    orders: null,
    errors: [],
  }
}

function adsWithContentLeak(): AdsData {
  return {
    available: true,
    campaigns: [],
    brand: { cost: 0, clicks: 0, conversions: 0 },
    nonBrand: { cost: 100, clicks: 50, conversions: 0 },
    topTerms: [],
    keywords: [],
    networks: [
      { campaign: 'ALPHA GO - Küte - EE 2026 sügis', network: 'SEARCH', cost: 44.13, clicks: 57, impressions: 298, conversions: 0 },
      { campaign: 'ALPHA GO - Küte - EE 2026 sügis', network: 'CONTENT', cost: 109.21, clicks: 1950, impressions: 53464, conversions: 0 },
      { campaign: 'Pumbapood + Grundfos Brand Search - EE', network: 'SEARCH', cost: 62, clicks: 74, impressions: 645, conversions: 0 },
    ],
    totals: { cost: 215.34, clicks: 2081, impressions: 54436, conversions: 3 },
  }
}

function metaWithLpvDrop(): MetaData {
  return {
    available: true,
    campaigns: [],
    totals: {
      cost: 112.85,
      prevCost: 141.08,
      clicks: 1158,
      impressions: 45361,
      landingPageViews: 400,
      viewContent: 22,
      addToCart: 1,
      purchases: 1,
      purchaseValue: 200,
    },
  }
}

describe('Ads võrgu-lõike insight (Display leke)', () => {
  it('hoiatab, kui Search-kampaania ≥20 % klikkidest tuleb CONTENT-võrgust (≥10 €)', () => {
    const s = baseSnapshot()
    s.ads = adsWithContentLeak()
    const insights = buildInsights(s)
    const leak = insights.find((i) => i.title.includes('Display-võrgust'))
    expect(leak).toBeDefined()
    expect(leak!.severity).toBe('warning')
    // 1950 / 2007 = 97 %
    expect(leak!.title).toContain('97 %')
    expect(leak!.detail).toContain('109,21 €')
    expect(leak!.action).toContain('set-network-settings.mjs')
  })

  it('ei hoiata, kui CONTENT-osakaal on väike või networks väli puudub (vanad snapshotid)', () => {
    const s = baseSnapshot()
    s.ads = adsWithContentLeak()
    s.ads.networks = [{ campaign: 'X', network: 'CONTENT', cost: 12, clicks: 15, impressions: 900, conversions: 0 }, { campaign: 'X', network: 'SEARCH', cost: 40, clicks: 185, impressions: 900, conversions: 1 }]
    let insights = buildInsights(s)
    expect(insights.find((i) => i.title.includes('Display-võrgust'))).toBeUndefined()

    s.ads.networks = undefined
    insights = buildInsights(s)
    expect(insights.find((i) => i.title.includes('Display-võrgust'))).toBeUndefined()
  })
})

describe('Meta klikk→LPV kokkukukkumise insight', () => {
  it('hoiatab, kui <40 % klikkidest jõuab maandumisleheni (≥100 klikki)', () => {
    const s = baseSnapshot()
    s.meta = metaWithLpvDrop()
    // 400 / 1158 = 34,5 %
    const insights = buildInsights(s)
    const drop = insights.find((i) => i.title.includes('maandumisleheni'))
    expect(drop).toBeDefined()
    expect(drop!.severity).toBe('warning')
    expect(drop!.title).toContain('35 %')
    expect(drop!.action).toContain('fix-rmk-placements.mjs')
  })

  it('ei hoiata, kui LPV-määr on korras või klikke vähe', () => {
    const s = baseSnapshot()
    s.meta = metaWithLpvDrop()
    s.meta.totals.landingPageViews = 700
    let insights = buildInsights(s)
    expect(insights.find((i) => i.title.includes('maandumisleheni'))).toBeUndefined()

    s.meta.totals.clicks = 50
    s.meta.totals.landingPageViews = 10
    insights = buildInsights(s)
    expect(insights.find((i) => i.title.includes('maandumisleheni'))).toBeUndefined()
  })
})
