/**
 * Regression tests for the weekly-report insights engine additions
 * (02.10.2026): QS components in the low-Quality-Score insight, the Meta
 * source insights (funnel + objective framing) and the Meta vs Google
 * channel cost-per-session comparison.
 */
import { describe, it, expect } from 'vitest'
import { buildInsights } from '@/lib/reporting/insights'
import type { AdsData, Ga4Data, MetaData, ReportSnapshot } from '@/lib/reporting/types'

function baseSnapshot(): ReportSnapshot {
  return {
    generatedAt: new Date().toISOString(),
    period: { start: '2026-09-24', end: '2026-09-30', prevStart: '2026-09-17', prevEnd: '2026-09-23' },
    ga4: null,
    gsc: null,
    ads: null,
    meta: null,
    orders: null,
    errors: [],
  }
}

function adsWithLowQs(): AdsData {
  return {
    available: true,
    campaigns: [],
    brand: { cost: 0, clicks: 0, conversions: 0 },
    nonBrand: { cost: 50, clicks: 100, conversions: 0 },
    topTerms: [],
    keywords: [
      {
        keyword: 'tsirkulatsioonipump',
        matchType: 'PHRASE',
        qualityScore: 3,
        predictedCtr: 'AVERAGE',
        adRelevance: 'BELOW_AVERAGE',
        lpExperience: 'BELOW_AVERAGE',
        campaign: 'ALPHA GO - Küte - EE 2026 sügis',
        cost: 19.01,
        clicks: 32,
        impressions: 139,
        conversions: 0,
      },
    ],
    totals: { cost: 190, clicks: 180, impressions: 900, conversions: 2 },
  }
}

function metaTrafficOnly(): MetaData {
  return {
    available: true,
    campaigns: [
      {
        name: 'ALPHA GO - Küte - EE 2026 sügis',
        status: 'ACTIVE',
        objective: 'OUTCOME_TRAFFIC',
        dailyBudget: null,
        cost: 86.35,
        clicks: 1194,
        impressions: 39698,
        landingPageViews: 320,
        viewContent: 10,
        addToCart: 0,
        purchases: 0,
        purchaseValue: 0,
      },
    ],
    totals: {
      cost: 157.38,
      prevCost: 140,
      clicks: 2078,
      impressions: 70123,
      landingPageViews: 578,
      viewContent: 17,
      addToCart: 0,
      purchases: 0,
      purchaseValue: 0,
    },
  }
}

function ga4WithChannels(): Ga4Data {
  return {
    current: { sessions: 400, users: 300, newUsers: 200, engagementRate: 0.75, keyEvents: 0 },
    previous: { sessions: 380, users: 290, newUsers: 190, engagementRate: 0.74, keyEvents: 0 },
    channels: [
      { channel: 'Paid Social', sessions: 124, keyEvents: 0 },
      { channel: 'Paid Search', sessions: 96, keyEvents: 0 },
      { channel: 'Organic Search', sessions: 26, keyEvents: 0 },
    ],
    topPages: [],
    daily: [{ date: '20260928', sessions: 80 }],
  }
}

describe('QS-komponentide insight', () => {
  it('näitab QS-komponente ja nimetab nõrgad komponendid', () => {
    const s = baseSnapshot()
    s.ads = adsWithLowQs()
    const insights = buildInsights(s)
    const qs = insights.find((i) => i.title.includes('Quality Score 3/10'))
    expect(qs).toBeDefined()
    expect(qs!.detail).toContain('oodatud CTR keskmine')
    expect(qs!.detail).toContain('reklaami asjakohasus alla keskmise')
    expect(qs!.detail).toContain('maandumisleht alla keskmise')
    expect(qs!.action).toContain('asjakohasus')
    expect(qs!.action).toContain('maandumisleht')
    expect(qs!.action).toContain('2–4 nädalaga')
  })
})

describe('Meta insightid', () => {
  it('TRAFFIC-eesmärk + 0 ostukorvi/ostu → hoiatus funneliga', () => {
    const s = baseSnapshot()
    s.meta = metaTrafficOnly()
    const insights = buildInsights(s)
    const funnel = insights.find((i) => i.title.includes('Meta kulu'))
    expect(funnel).toBeDefined()
    expect(funnel!.severity).toBe('warning')
    expect(funnel!.detail).toContain('TRAFFIC')
    expect(funnel!.detail).toContain('maandumislehe vaadet')
    expect(funnel!.action).toContain('SALES')
  })

  it('kanalite €/sessioon võrdlus ilmub strateegia alla', () => {
    const s = baseSnapshot()
    s.meta = metaTrafficOnly()
    s.ads = adsWithLowQs()
    s.ga4 = ga4WithChannels()
    const insights = buildInsights(s)
    const cmp = insights.find((i) => i.title.includes('Kanalite hind'))
    expect(cmp).toBeDefined()
    expect(cmp!.area).toBe('strategy')
    // 157.38 € / 124 sessiooni = 1.27 €/sessioon; 190 € / 96 sessiooni = 1.98 €/sessioon
    expect(cmp!.detail).toContain('1,27 €/sessioon')
    expect(cmp!.detail).toContain('1,98 €/sessioon')
  })

  it('Meta ostude korral positiivne leid ostu hinnaga', () => {
    const s = baseSnapshot()
    s.meta = metaTrafficOnly()
    s.meta.totals.purchases = 2
    s.meta.totals.purchaseValue = 400
    const insights = buildInsights(s)
    const pos = insights.find((i) => i.title.includes('Meta tõi 2 ostu'))
    expect(pos).toBeDefined()
    expect(pos!.severity).toBe('positive')
    // 157.38 / 2 = 78.69 € per ost
    expect(pos!.detail).toContain('78,69 €')
  })

  it('Meta puudumisel Meta-leide ei teki', () => {
    const s = baseSnapshot()
    const insights = buildInsights(s)
    expect(insights.find((i) => i.title.includes('Meta'))).toBeUndefined()
  })
})
