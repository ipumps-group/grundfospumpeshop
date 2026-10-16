import { describe, it, expect } from "vitest"
import { computeChanges } from "@/lib/reporting/changes"
import type { ReportSnapshot } from "@/lib/reporting/types"

/**
 * Regressioonitest 16.10.2026 veale: kaardid näitasid GSC klikke -13 % WoW,
 * muutuste tabel +20 % — tabel võrdles eelmise SALVESTATUD raportiga, mille
 * nädal oli GSC viivituse tõttu poolikult mõõdetud (5,7/p vs lõplik 7,9/p).
 * computeChanges peab kasutama SAMA snapshoti eelmist perioodi.
 */

const gscTotals = (clicks: number, impressions: number, position: number) => ({
  clicks,
  impressions,
  ctr: impressions > 0 ? clicks / impressions : 0,
  position,
  days: 7,
})

function snapshot(over: {
  gscCur?: { clicks: number; impressions: number; position: number }
  gscPrev?: { clicks: number; impressions: number; position: number }
  ga4CurSessions?: number
  ga4PrevSessions?: number
  adsCurClicks?: number
  adsPrevClicks?: number | null
  ordersCur?: { orders: number; revenue: number }
  ordersPrev?: { orders: number; revenue: number }
}): ReportSnapshot {
  const gscCur = over.gscCur ?? { clicks: 48, impressions: 530, position: 10.4 }
  const gscPrev = over.gscPrev ?? { clicks: 55, impressions: 589, position: 12.7 }
  return {
    generatedAt: "2026-10-16T06:00:00.000Z",
    period: { start: "2026-10-06", end: "2026-10-12", prevStart: "2026-09-29", prevEnd: "2026-10-05" },
    gsc: {
      current: gscTotals(gscCur.clicks, gscCur.impressions, gscCur.position),
      previous: gscTotals(gscPrev.clicks, gscPrev.impressions, gscPrev.position),
      topQueries: [],
      prevQueries: [],
      topPages: [],
      families: [],
      newQueries: [],
    },
    ga4: {
      current: { sessions: over.ga4CurSessions ?? 300, users: 250, newUsers: 200, engagementRate: 0.75, keyEvents: 10 },
      previous: { sessions: over.ga4PrevSessions ?? 310, users: 260, newUsers: 210, engagementRate: 0.74, keyEvents: 9 },
      channels: [],
      topPages: [],
      daily: [],
    },
    ads:
      over.adsCurClicks === undefined
        ? null
        : {
            available: true,
            campaigns: [],
            brand: { cost: 0, clicks: 0, conversions: 0 },
            nonBrand: { cost: 0, clicks: 0, conversions: 0 },
            topTerms: [],
            keywords: [],
            totals: { cost: 100, clicks: over.adsCurClicks, impressions: 5000, conversions: 3 },
            ...(over.adsPrevClicks === null || over.adsPrevClicks === undefined
              ? {}
              : { prevTotals: { cost: 90, clicks: over.adsPrevClicks, conversions: 2 } }),
          },
    meta: null,
    orders:
      over.ordersCur === undefined
        ? null
        : {
            current: {
              orders: over.ordersCur.orders,
              revenue: over.ordersCur.revenue,
              avgOrderValue: over.ordersCur.orders > 0 ? over.ordersCur.revenue / over.ordersCur.orders : 0,
              cancelled: 0,
              failed: 0,
            },
            previous: {
              orders: over.ordersPrev?.orders ?? 0,
              revenue: over.ordersPrev?.revenue ?? 0,
              avgOrderValue:
                over.ordersPrev && over.ordersPrev.orders > 0 ? over.ordersPrev.revenue / over.ordersPrev.orders : 0,
              cancelled: 0,
              failed: 0,
            },
            topProducts: [],
            orders: [],
          },
    errors: [],
  }
}

const byId = (changes: ReturnType<typeof computeChanges>, id: string) => changes.find((c) => c.id === id)!

describe("computeChanges (WoW snapshoti sees)", () => {
  it("GSC klikid võrreldakse snapshoti eelmise perioodiga, mitte salvestatud raportiga", () => {
    // 48/7=6,9/p vs 55/7=7,9/p → -12,7 % halvenemine (päris WoW),
    // EI +20 % nagu salvestatud 5,7/p alusega juhtus.
    const changes = computeChanges(snapshot({}))
    const c = byId(changes, "gscClicksPerDay")
    expect(c.previous).toBeCloseTo(7.9, 1)
    expect(c.current).toBeCloseTo(6.9, 1)
    expect(c.deltaPct).toBeCloseTo(-12.7, 0)
    expect(c.direction).toBe("worsened")
  })

  it("positsiooni langus on paranemine (higherBetter=false)", () => {
    const changes = computeChanges(snapshot({}))
    const c = byId(changes, "gscPosition")
    expect(c.previous).toBeCloseTo(12.7, 1)
    expect(c.current).toBeCloseTo(10.4, 1)
    expect(c.deltaPct).toBeLessThan(0)
    expect(c.direction).toBe("improved")
  })

  it("alla 5 % muutus on stabiilne", () => {
    const changes = computeChanges(snapshot({ ga4CurSessions: 300, ga4PrevSessions: 310 }))
    const c = byId(changes, "ga4Sessions")
    expect(Math.abs(c.deltaPct!)).toBeLessThan(5)
    expect(c.direction).toBe("unchanged")
  })

  it("Ads klikid kasutavad sama snapshoti prevTotals-väärtust", () => {
    const changes = computeChanges(snapshot({ adsCurClicks: 1000, adsPrevClicks: 1200 }))
    const c = byId(changes, "adsClicks")
    expect(c.previous).toBe(1200)
    expect(c.deltaPct).toBeCloseTo(-16.7, 0)
    expect(c.direction).toBe("worsened")
  })

  it("tellimuste ja käibe WoW tuleb snapshoti orders-plokist", () => {
    const changes = computeChanges(
      snapshot({ ordersCur: { orders: 2, revenue: 1000 }, ordersPrev: { orders: 1, revenue: 500 } }),
    )
    expect(byId(changes, "orders").direction).toBe("improved")
    expect(byId(changes, "revenue").deltaPct).toBe(100)
    expect(byId(changes, "avgOrderValue").direction).toBe("unchanged")
  })
})
