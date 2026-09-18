/**
 * GA4 Data API pulls for the weekly report (structured data, not markdown).
 * Includes a per-day session series for the tracking-health check (a broken
 * CSP/consent/GTM deploy shows up as dead weekdays, not as "less traffic").
 *
 * Auth: Pumbapood Google OAuth (see google-auth.ts) + GA4_PROPERTY_ID.
 */

import { getGoogleOAuthToken, postJson, type ReportPeriod } from "./google-auth"
import type { Ga4Channel, Ga4Daily, Ga4Data, Ga4Page, MetricSet } from "./types"

interface Ga4Row {
  dimensionValues?: { value: string }[]
  metricValues?: { value: string }[]
}
interface Ga4Report {
  rows?: Ga4Row[]
  totals?: { metricValues?: { value: string }[] }[]
}

const num = (v: string | undefined) => (v ? Number(v) : 0)

export async function pullGa4(period: ReportPeriod): Promise<Ga4Data> {
  const propertyId = process.env.GA4_PROPERTY_ID
  if (!propertyId) throw new Error("GA4_PROPERTY_ID is not set (Pumbapood GA4 property)")
  const token = await getGoogleOAuthToken()
  const run = (body: Record<string, unknown>) =>
    postJson<Ga4Report>(`https://analyticsdata.googleapis.com/v1beta/properties/${propertyId}:runReport`, token, body)

  const current = { startDate: period.start, endDate: period.end, name: "current" }
  const previous = { startDate: period.prevStart, endDate: period.prevEnd, name: "previous" }

  const overview = await run({
    dateRanges: [current, previous],
    metrics: [
      { name: "sessions" },
      { name: "totalUsers" },
      { name: "newUsers" },
      { name: "engagementRate" },
      { name: "keyEvents" },
    ],
  })
  const toMetricSet = (vals?: { value: string }[]): MetricSet => ({
    sessions: num(vals?.[0]?.value),
    users: num(vals?.[1]?.value),
    newUsers: num(vals?.[2]?.value),
    engagementRate: num(vals?.[3]?.value),
    keyEvents: num(vals?.[4]?.value),
  })
  const curRow = overview.rows?.find((r) => r.dimensionValues?.[0]?.value === "current")?.metricValues
  const prevRow = overview.rows?.find((r) => r.dimensionValues?.[0]?.value === "previous")?.metricValues

  const channelsReport = await run({
    dateRanges: [{ startDate: period.start, endDate: period.end }],
    dimensions: [{ name: "sessionDefaultChannelGroup" }],
    metrics: [{ name: "sessions" }, { name: "keyEvents" }],
    orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
    limit: 10,
  })
  const channels: Ga4Channel[] = (channelsReport.rows ?? []).map((r) => ({
    channel: r.dimensionValues?.[0]?.value ?? "?",
    sessions: num(r.metricValues?.[0]?.value),
    keyEvents: num(r.metricValues?.[1]?.value),
  }))

  const pagesReport = await run({
    dateRanges: [{ startDate: period.start, endDate: period.end }],
    dimensions: [{ name: "pagePath" }],
    metrics: [{ name: "sessions" }],
    orderBys: [{ metric: { metricName: "sessions" }, desc: true }],
    limit: 15,
  })
  const topPages: Ga4Page[] = (pagesReport.rows ?? []).map((r) => ({
    path: r.dimensionValues?.[0]?.value ?? "?",
    sessions: num(r.metricValues?.[0]?.value),
  }))

  const dailyReport = await run({
    dateRanges: [{ startDate: period.start, endDate: period.end }],
    dimensions: [{ name: "date" }],
    metrics: [{ name: "sessions" }],
    orderBys: [{ dimension: { dimensionName: "date" }, desc: false }],
    limit: 31,
  })
  const daily: Ga4Daily[] = (dailyReport.rows ?? []).map((r) => ({
    date: r.dimensionValues?.[0]?.value ?? "",
    sessions: num(r.metricValues?.[0]?.value),
  }))

  return {
    current: toMetricSet(curRow ?? overview.totals?.[0]?.metricValues),
    previous: toMetricSet(prevRow),
    channels,
    topPages,
    daily,
  }
}
