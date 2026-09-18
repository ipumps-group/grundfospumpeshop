/**
 * Report-to-report comparison ("muutused eelmise raportiga"). Every stored
 * report carries a `changes` list: headline metrics of THIS report compared
 * against the LAST stored report (not just this-week vs last-week inside the
 * snapshot) — the running sequence of improvements and regressions.
 *
 * The first report has no predecessor → empty list (UI/email show a note).
 */

import type { ReportChange, ReportSnapshot, StoredReport } from "./types"

/** |delta| below this is "muutusteta" (stability, not noise-chasing). */
const STABLE_PCT = 5

interface MetricDef {
  id: string
  label: string
  unit: "" | "€" | "%"
  /** higherBetter=false: position/cost — a drop is an improvement. */
  higherBetter: boolean
  extract: (s: ReportSnapshot) => number | null
}

const METRICS: MetricDef[] = [
  {
    id: "gscClicksPerDay",
    label: "GSC klikke/päevas",
    unit: "",
    higherBetter: true,
    extract: (s) => (s.gsc ? s.gsc.current.clicks / s.gsc.current.days : null),
  },
  {
    id: "gscImpressionsPerDay",
    label: "GSC näitamisi/päevas",
    unit: "",
    higherBetter: true,
    extract: (s) => (s.gsc ? s.gsc.current.impressions / s.gsc.current.days : null),
  },
  {
    id: "gscPosition",
    label: "GSC keskmine positsioon",
    unit: "",
    higherBetter: false,
    extract: (s) => (s.gsc && s.gsc.current.position > 0 ? s.gsc.current.position : null),
  },
  {
    id: "ga4Sessions",
    label: "GA4 sessioonid",
    unit: "",
    higherBetter: true,
    extract: (s) => (s.ga4 ? s.ga4.current.sessions : null),
  },
  {
    id: "ga4Engagement",
    label: "GA4 kaasatus",
    unit: "%",
    higherBetter: true,
    extract: (s) => (s.ga4 ? s.ga4.current.engagementRate * 100 : null),
  },
  {
    id: "adsClicks",
    label: "Ads klikid",
    unit: "",
    higherBetter: true,
    extract: (s) => (s.ads?.available ? s.ads.totals.clicks : null),
  },
  {
    id: "adsConversions",
    label: "Ads konversioonid",
    unit: "",
    higherBetter: true,
    extract: (s) => (s.ads?.available ? s.ads.totals.conversions : null),
  },
  {
    id: "orders",
    label: "Tellimused (DB)",
    unit: "",
    higherBetter: true,
    extract: (s) => (s.orders ? s.orders.current.orders : null),
  },
  {
    id: "revenue",
    label: "Käive (DB)",
    unit: "€",
    higherBetter: true,
    extract: (s) => (s.orders ? s.orders.current.revenue : null),
  },
  {
    id: "avgOrderValue",
    label: "Keskmine tellimus",
    unit: "€",
    higherBetter: true,
    extract: (s) => (s.orders && s.orders.current.orders > 0 ? s.orders.current.avgOrderValue : null),
  },
]

const r1 = (n: number) => Math.round(n * 10) / 10

/**
 * Compare this snapshot against the previously stored report.
 * Sorted: improvements first, then regressions, then unchanged (report
 * readers care about movement, not stability).
 */
export function computeChanges(snapshot: ReportSnapshot, previous: StoredReport | null): ReportChange[] {
  if (!previous) return []
  const prevSnapshot = previous.snapshot

  const changes: ReportChange[] = []
  for (const m of METRICS) {
    const current = m.extract(snapshot)
    const prev = m.extract(prevSnapshot)
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
  if (changes.length === 0) return "Esimene raport — võrdluspunkti pole"
  if (improved === 0 && worsened === 0) return "Eelmise raportiga võrreldes olulisi muutusi pole"
  const parts: string[] = []
  if (improved > 0) parts.push(`${improved} näitajat paranenud`)
  if (worsened > 0) parts.push(`${worsened} näitajat halvenenud`)
  return `Eelmise raportiga võrreldes: ${parts.join(", ")}`
}
