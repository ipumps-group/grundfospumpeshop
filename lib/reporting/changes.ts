/**
 * Week-over-week comparison ("muutused eelmise nädalaga"). Every stored
 * report carries a `changes` list: headline metrics of the current week
 * compared against the previous week — BOTH periods read from the SAME
 * freshly pulled snapshot.
 *
 * Why not the previous STORED report as the baseline? GSC data finalizes
 * late (days); a stored snapshot's "current week" was measured before
 * finalization and is never refreshed, so a stored-vs-stored comparison
 * mixes differently-revised numbers and disagrees with the scorecards
 * (report 16.10: cards -13 % WoW vs table +20 % vs stored). Comparing
 * within one snapshot makes the table and the cards consistent by
 * construction — and robust to skipped weeks and re-generations.
 *
 * The first report has no previous-period data → metrics fall back to null
 * and render as "–" (the GSC/GA4/Ads/orders pulls always include the
 * previous week, so in practice only brand-new sources lack a baseline).
 */

import type { ReportChange, ReportSnapshot } from "./types"

/** |delta| below this is "muutusteta" (stability, not noise-chasing). */
const STABLE_PCT = 5

interface MetricDef {
  id: string
  label: string
  unit: "" | "€" | "%"
  /** higherBetter=false: position/cost — a drop is an improvement. */
  higherBetter: boolean
  current: (s: ReportSnapshot) => number | null
  previous: (s: ReportSnapshot) => number | null
}

const METRICS: MetricDef[] = [
  {
    id: "gscClicksPerDay",
    label: "GSC klikke/päevas",
    unit: "",
    higherBetter: true,
    current: (s) => (s.gsc ? s.gsc.current.clicks / s.gsc.current.days : null),
    previous: (s) => (s.gsc ? s.gsc.previous.clicks / s.gsc.previous.days : null),
  },
  {
    id: "gscImpressionsPerDay",
    label: "GSC näitamisi/päevas",
    unit: "",
    higherBetter: true,
    current: (s) => (s.gsc ? s.gsc.current.impressions / s.gsc.current.days : null),
    previous: (s) => (s.gsc ? s.gsc.previous.impressions / s.gsc.previous.days : null),
  },
  {
    id: "gscPosition",
    label: "GSC keskmine positsioon",
    unit: "",
    higherBetter: false,
    current: (s) => (s.gsc && s.gsc.current.position > 0 ? s.gsc.current.position : null),
    previous: (s) => (s.gsc && s.gsc.previous.position > 0 ? s.gsc.previous.position : null),
  },
  {
    id: "ga4Sessions",
    label: "GA4 sessioonid",
    unit: "",
    higherBetter: true,
    current: (s) => (s.ga4 ? s.ga4.current.sessions : null),
    previous: (s) => (s.ga4 ? s.ga4.previous.sessions : null),
  },
  {
    id: "ga4Engagement",
    label: "GA4 kaasatus",
    unit: "%",
    higherBetter: true,
    current: (s) => (s.ga4 ? s.ga4.current.engagementRate * 100 : null),
    previous: (s) => (s.ga4 ? s.ga4.previous.engagementRate * 100 : null),
  },
  {
    id: "adsClicks",
    label: "Ads klikid",
    unit: "",
    higherBetter: true,
    current: (s) => (s.ads?.available ? s.ads.totals.clicks : null),
    previous: (s) => (s.ads?.available && s.ads.prevTotals ? s.ads.prevTotals.clicks : null),
  },
  {
    id: "adsConversions",
    label: "Ads konversioonid",
    unit: "",
    higherBetter: true,
    current: (s) => (s.ads?.available ? s.ads.totals.conversions : null),
    previous: (s) => (s.ads?.available && s.ads.prevTotals ? s.ads.prevTotals.conversions : null),
  },
  {
    id: "orders",
    label: "Tellimused (DB)",
    unit: "",
    higherBetter: true,
    current: (s) => (s.orders ? s.orders.current.orders : null),
    previous: (s) => (s.orders ? s.orders.previous.orders : null),
  },
  {
    id: "revenue",
    label: "Käive (DB)",
    unit: "€",
    higherBetter: true,
    current: (s) => (s.orders ? s.orders.current.revenue : null),
    previous: (s) => (s.orders ? s.orders.previous.revenue : null),
  },
  {
    id: "avgOrderValue",
    label: "Keskmine tellimus",
    unit: "€",
    higherBetter: true,
    current: (s) => (s.orders && s.orders.current.orders > 0 ? s.orders.current.avgOrderValue : null),
    previous: (s) => (s.orders && s.orders.previous.orders > 0 ? s.orders.previous.avgOrderValue : null),
  },
]

const r1 = (n: number) => Math.round(n * 10) / 10

/**
 * Compare the snapshot's current week against its previous week.
 * Sorted: improvements first, then regressions, then unchanged (report
 * readers care about movement, not stability).
 */
export function computeChanges(snapshot: ReportSnapshot): ReportChange[] {
  const changes: ReportChange[] = []
  for (const m of METRICS) {
    const current = m.current(snapshot)
    const prev = m.previous(snapshot)
    if (current === null && prev === null) continue

    let deltaPct: number | null = null
    if (current !== null && prev !== null && prev !== 0) {
      deltaPct = r1(((current - prev) / prev) * 100)
    }

    let direction: ReportChange["direction"] = "unchanged"
    if (deltaPct !== null && Math.abs(deltaPct) >= STABLE_PCT) {
      const improved = m.higherBetter ? deltaPct > 0 : deltaPct < 0
      direction = improved ? "improved" : "worsened"
    } else if (deltaPct === null && current !== null && (prev === null || prev === 0)) {
      direction = current > 0 ? "improved" : "unchanged"
    }

    changes.push({
      id: m.id,
      label: m.label,
      unit: m.unit,
      previous: prev === null ? null : r1(prev),
      current: current === null ? null : r1(current),
      deltaPct,
      direction,
    })
  }

  const rank: Record<ReportChange["direction"], number> = { improved: 0, worsened: 1, unchanged: 2 }
  return changes.sort((a, b) => rank[a.direction] - rank[b.direction])
}

/** One-line Estonian summary for the email subject area / admin list. */
export function summarizeChanges(changes: ReportChange[]): string {
  const improved = changes.filter((c) => c.direction === "improved").length
  const worsened = changes.filter((c) => c.direction === "worsened").length
  if (changes.length === 0) return "Võrdlusandmed puuduvad"
  if (improved === 0 && worsened === 0) return "Eelmise nädalaga võrreldes olulisi muutusi pole"
  const parts: string[] = []
  if (improved > 0) parts.push(`${improved} näitajat paranenud`)
  if (worsened > 0) parts.push(`${worsened} näitajat halvenenud`)
  return `Eelmise nädalaga võrreldes: ${parts.join(", ")}`
}
