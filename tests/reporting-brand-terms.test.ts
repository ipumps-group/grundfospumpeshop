/**
 * Regression tests (22.10.2026): „grundfos pump" on poe PÕHIMÄRKSÕNA —
 * bränditermineid (pumbapood + grundfos) ei tohi kunagi esitada
 * „kulutab ilma konversioonideta → lisa negatiivseks" leidudes.
 * Eraldi: brändieelarve kärpimise leid põhineb ainult OMA brändil
 * (pumbapood), sest Grundfos-terminite orgaaniline positsioon (~10)
 * ei kata klikke orgaaniliselt.
 */
import { describe, it, expect } from 'vitest'
import { isBrandTerm, isOwnBrandTerm } from '@/lib/reporting/ads'
import { buildInsights } from '@/lib/reporting/insights'
import type { AdsData, ReportSnapshot } from '@/lib/reporting/types'

describe('isBrandTerm (lai — kaitstud bränditerminid)', () => {
  it.each(['grundfos pump', 'Grundfos SQE 2-55', 'GRUNDFOS', 'pump grundfos manual', 'pumbapood', 'pumba pood', 'Pump OÜ'])(
    'kaitstud: %s',
    (term) => expect(isBrandTerm(term)).toBe(true),
  )
  it.each(['tsirkulatsioonipump', 'veeautomaat', 'tühjenduspump', 'drenaažipump'])(
    'mitte-bränd: %s',
    (term) => expect(isBrandTerm(term)).toBe(false),
  )
})

describe('isOwnBrandTerm (kitsas — ainult oma bränd)', () => {
  it.each(['pumbapood', 'pumba pood', 'pump oü'])('oma bränd: %s', (term) => expect(isOwnBrandTerm(term)).toBe(true))
  it.each(['grundfos pump', 'grundfos', 'tsirkulatsioonipump'])('EI ole oma bränd: %s', (term) =>
    expect(isOwnBrandTerm(term)).toBe(false),
  )
})

function snapshotWithAds(ads: AdsData): ReportSnapshot {
  return {
    generatedAt: new Date().toISOString(),
    period: { start: '2026-10-12', end: '2026-10-18', prevStart: '2026-10-05', prevEnd: '2026-10-11' },
    ga4: null,
    gsc: null,
    ads,
    meta: null,
    orders: null,
    errors: [],
  }
}

function adsFixture(topTerms: AdsData['topTerms']): AdsData {
  const brand = { cost: 0, clicks: 0, conversions: 0 }
  const ownBrand = { cost: 0, clicks: 0, conversions: 0 }
  const nonBrand = { cost: 0, clicks: 0, conversions: 0 }
  for (const t of topTerms) {
    const b = isBrandTerm(t.term) ? brand : nonBrand
    b.cost += t.cost
    b.clicks += t.clicks
    b.conversions += t.conversions
    if (isOwnBrandTerm(t.term)) {
      ownBrand.cost += t.cost
      ownBrand.clicks += t.clicks
      ownBrand.conversions += t.conversions
    }
  }
  return {
    available: true,
    campaigns: [],
    brand,
    ownBrand,
    nonBrand,
    topTerms,
    keywords: [],
    totals: { cost: brand.cost + nonBrand.cost, clicks: 100, impressions: 1000, conversions: 0 },
  }
}

describe('„kulutab ilma konversioonideta" leid', () => {
  it('ei paku grundfos-termeid kunagi negatiivseteks kandidaatideks', () => {
    const ads = adsFixture([
      { term: 'grundfos pump', campaign: 'Pumbapood + Grundfos Brand Search - EE', cost: 75.37, clicks: 90, impressions: 705, conversions: 0 },
      { term: 'tsirkulatsioonipump', campaign: 'ALPHA GO - Küte - EE 2026 sügis', cost: 42.67, clicks: 54, impressions: 192, conversions: 0 },
    ])
    const insights = buildInsights(snapshotWithAds(ads))
    const wasted = insights.find((i) => i.title.includes('ilma konversioonideta'))
    expect(wasted).toBeTruthy()
    expect(wasted!.detail).not.toMatch(/grundfos/i)
    expect(wasted!.detail).toMatch(/tsirkulatsioonipump/)
  })

  it('kõik grundfos-terminid lähevad brändi- (mitte mitte-brändi) kogumisse', () => {
    const ads = adsFixture([
      { term: 'grundfos pump', campaign: 'Brand', cost: 10, clicks: 10, impressions: 100, conversions: 0 },
      { term: 'pumbapood', campaign: 'Brand', cost: 5, clicks: 5, impressions: 50, conversions: 0 },
      { term: 'veeautomaat', campaign: 'Muu', cost: 8, clicks: 8, impressions: 80, conversions: 0 },
    ])
    expect(ads.brand.cost).toBe(15)
    expect(ads.ownBrand!.cost).toBe(5)
    expect(ads.nonBrand.cost).toBe(8)
  })
})

describe('brändieelarve kärpimise leid', () => {
  it('põhineb ainult oma brändil — pelk grundfos-kulu seda ei käivita', () => {
    // Palju grundfos-kulu, oma brändi kulu < 10 € künnis → leidu ei tohi tulla.
    const ads = adsFixture([
      { term: 'grundfos pump', campaign: 'Brand', cost: 60, clicks: 60, impressions: 600, conversions: 0 },
      { term: 'grundfos pumbad', campaign: 'Brand', cost: 30, clicks: 30, impressions: 300, conversions: 0 },
      { term: 'pumbapood', campaign: 'Brand', cost: 2, clicks: 4, impressions: 20, conversions: 0 },
      { term: 'veeautomaat', campaign: 'Muu', cost: 40, clicks: 40, impressions: 400, conversions: 0 },
    ])
    const insights = buildInsights(snapshotWithAds(ads))
    expect(insights.find((i) => i.title.includes('brändipäringutele'))).toBeUndefined()
  })

  it('käivitub, kui OMA brändi kulu ületab künnise', () => {
    const ads = adsFixture([
      { term: 'pumbapood', campaign: 'Brand', cost: 30, clicks: 40, impressions: 200, conversions: 0 },
      { term: 'grundfos pump', campaign: 'Brand', cost: 20, clicks: 20, impressions: 200, conversions: 0 },
      { term: 'veeautomaat', campaign: 'Muu', cost: 40, clicks: 40, impressions: 400, conversions: 0 },
    ])
    const insights = buildInsights(snapshotWithAds(ads))
    expect(insights.find((i) => i.title.includes('oma brändipäringutele'))).toBeTruthy()
  })
})
