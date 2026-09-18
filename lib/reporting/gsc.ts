/**
 * Search Console pulls for the weekly report: totals, full query sets for
 * both weeks (needed for family aggregation + position movement), top pages.
 * Position per keyword family = impression-weighted average over the queries
 * in the family (same methodology as the manual weekly reports).
 *
 * Auth: Pumbapood GSC service account; property from GSC_SITE_URL
 * (defaults to NEXT_PUBLIC_SITE_URL = https://pumbapood.ee).
 */

import { getGscAccessToken, postJson, type ReportPeriod } from "./google-auth"
import { computeFamilyStats, findNewQueries } from "./keyword-families"
import type { GscData, GscPage, GscQuery, GscTotals } from "./types"

/** Full query set per period. */
const QUERY_ROW_LIMIT = 5000
/** How many current-period queries are kept in the stored snapshot. */
const SNAPSHOT_QUERY_LIMIT = 100

interface GscRow {
  keys?: string[]
  clicks: number
  impressions: number
  ctr: number
  position: number
}
interface GscResponse {
  rows?: GscRow[]
}

function daysBetween(start: string, end: string): number {
  const ms = new Date(`${end}T00:00:00Z`).getTime() - new Date(`${start}T00:00:00Z`).getTime()
  return Math.round(ms / 86_400_000) + 1
}

function toQuery(row: GscRow): GscQuery {
  return {
    query: row.keys?.[0] ?? "?",
    clicks: row.clicks,
    impressions: row.impressions,
    ctr: row.ctr,
    position: row.position,
  }
}

export async function pullGsc(period: ReportPeriod): Promise<GscData> {
  const siteUrl = process.env.GSC_SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || "https://pumbapood.ee"
  const token = await getGscAccessToken()
  const site = encodeURIComponent(siteUrl)
  const query = (body: Record<string, unknown>) =>
    postJson<GscResponse>(`https://www.googleapis.com/webmasters/v3/sites/${site}/searchAnalytics/query`, token, body)

  const toTotals = (rows: GscRow[] | undefined, days: number): GscTotals => {
    const t = rows?.[0]
    return {
      clicks: t?.clicks ?? 0,
      impressions: t?.impressions ?? 0,
      ctr: t?.ctr ?? 0,
      position: t?.position ?? 0,
      days,
    }
  }

  const [totalsCur, totalsPrev, queriesCur, queriesPrev, pagesCur] = await Promise.all([
    query({ startDate: period.start, endDate: period.end, dimensions: [] }),
    query({ startDate: period.prevStart, endDate: period.prevEnd, dimensions: [] }),
    query({ startDate: period.start, endDate: period.end, dimensions: ["query"], rowLimit: QUERY_ROW_LIMIT }),
    query({ startDate: period.prevStart, endDate: period.prevEnd, dimensions: ["query"], rowLimit: QUERY_ROW_LIMIT }),
    query({ startDate: period.start, endDate: period.end, dimensions: ["page"], rowLimit: 25 }),
  ])

  const curQueries = (queriesCur.rows ?? []).map(toQuery)
  const prevQueries = (queriesPrev.rows ?? []).map(toQuery)
  const byImpressions = [...curQueries].sort((a, b) => b.impressions - a.impressions)

  const topPages: GscPage[] = (pagesCur.rows ?? []).map((r) => ({
    page: r.keys?.[0] ?? "?",
    clicks: r.clicks,
    impressions: r.impressions,
    ctr: r.ctr,
    position: r.position,
  }))

  return {
    current: toTotals(totalsCur.rows, daysBetween(period.start, period.end)),
    previous: toTotals(totalsPrev.rows, daysBetween(period.prevStart, period.prevEnd)),
    topQueries: byImpressions.slice(0, SNAPSHOT_QUERY_LIMIT),
    prevQueries,
    topPages,
    families: computeFamilyStats(curQueries, prevQueries),
    newQueries: findNewQueries(curQueries, prevQueries).slice(0, 25),
  }
}
