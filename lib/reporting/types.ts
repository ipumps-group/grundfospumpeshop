/**
 * Shared types for the weekly marketing report (lib/reporting/*).
 * The snapshot is the full structured data pull for one week; it is stored
 * as JSONB in weekly_reports (or data/weekly-reports.json as fallback) so
 * week-over-week trends survive beyond GSC's 16-month window.
 *
 * Pumbapood is an e-shop: Supabase `orders` are the conversion ground truth
 * (the SPS report used contact-form submissions the same way).
 */

export interface ReportPeriod {
  start: string
  end: string
  prevStart: string
  prevEnd: string
}

export interface MetricSet {
  sessions: number
  users: number
  newUsers: number
  engagementRate: number
  keyEvents: number
}

export interface Ga4Channel {
  channel: string
  sessions: number
  keyEvents: number
}

export interface Ga4Page {
  path: string
  sessions: number
}

/** Per-day session counts - used for the tracking-health check (outages). */
export interface Ga4Daily {
  date: string
  sessions: number
}

export interface Ga4Data {
  current: MetricSet
  previous: MetricSet
  channels: Ga4Channel[]
  topPages: Ga4Page[]
  daily: Ga4Daily[]
}

export interface GscTotals {
  clicks: number
  impressions: number
  ctr: number
  position: number
  /** Days in the period, for per-day averages. */
  days: number
}

export interface GscQuery {
  query: string
  clicks: number
  impressions: number
  ctr: number
  position: number
}

export interface GscPage {
  page: string
  clicks: number
  impressions: number
  ctr: number
  position: number
}

/** Aggregated stats for one tracked keyword family (märksõnapere). */
export interface KeywordFamilyStat {
  id: string
  label: string
  current: { impressions: number; clicks: number; position: number | null }
  previous: { impressions: number; clicks: number; position: number | null }
}

export interface GscData {
  current: GscTotals
  previous: GscTotals
  /** Current period queries by impressions (up to ~100 kept in the snapshot). */
  topQueries: GscQuery[]
  /** Previous period queries, kept whole for position-movement matching. */
  prevQueries: GscQuery[]
  topPages: GscPage[]
  families: KeywordFamilyStat[]
  /** Queries present now but absent (or ~invisible) in the previous period. */
  newQueries: GscQuery[]
}

export interface AdsCampaign {
  name: string
  status: string
  cost: number
  clicks: number
  impressions: number
  ctr: number
  avgCpc: number
  conversions: number
  allConversions: number
  impressionShare: number | null
  rankLostIS: number | null
  budgetLostIS: number | null
  topIS: number | null
  absTopIS: number | null
}

export interface AdsTerm {
  term: string
  campaign: string
  cost: number
  clicks: number
  impressions: number
  conversions: number
}

export interface AdsKeyword {
  keyword: string
  matchType: string
  qualityScore: number | null
  campaign: string
  cost: number
  clicks: number
  impressions: number
  conversions: number
}

export interface AdsData {
  available: boolean
  campaigns: AdsCampaign[]
  brand: { cost: number; clicks: number; conversions: number }
  nonBrand: { cost: number; clicks: number; conversions: number }
  topTerms: AdsTerm[]
  keywords: AdsKeyword[]
  totals: { cost: number; clicks: number; impressions: number; conversions: number }
}

export interface OrdersPeriod {
  /** Real orders (all statuses except cancelled/failed). */
  orders: number
  revenue: number
  avgOrderValue: number
  cancelled: number
  failed: number
}

export interface OrderRow {
  id: string
  createdAt: string
  customer: string
  total: number
  status: string
  /** Item summary: "2× Grundfos UPS 25-60; 1× ..." (one line, ~160 chars). */
  summary: string
}

export interface OrdersData {
  current: OrdersPeriod
  previous: OrdersPeriod
  topProducts: { name: string; quantity: number; revenue: number }[]
  /** Nädala tellimused kvaliteedikontrolliks — uusimad ees. */
  orders: OrderRow[]
}

export interface ReportSnapshot {
  generatedAt: string
  period: { start: string; end: string; prevStart: string; prevEnd: string }
  ga4: Ga4Data | null
  gsc: GscData | null
  ads: AdsData | null
  orders: OrdersData | null
  /** Per-source failure notes (a failing API must not kill the whole report). */
  errors: string[]
}

export type InsightArea = "seo" | "ads" | "ga4" | "orders" | "strategy"
export type InsightSeverity = "negative" | "warning" | "opportunity" | "positive"

export interface Insight {
  area: InsightArea
  severity: InsightSeverity
  title: string
  detail: string
  /** Järgmine samm - concrete next action. */
  action: string
}

export interface StoredReport {
  id: number
  weekStart: string
  weekEnd: string
  createdAt: string
  snapshot: ReportSnapshot
  insights: Insight[]
  /** LLM-written Estonian narrative ("" when ANTHROPIC_API_KEY is unset). */
  narrative: string
  /** Headline-metric changes vs the previous STORED report (see changes.ts). */
  changes: ReportChange[]
  emailSentAt: string | null
  emailError: string
}

/** One headline metric compared against the previous stored report. */
export interface ReportChange {
  id: string
  label: string
  unit: "" | "€" | "%"
  previous: number | null
  current: number | null
  /** Percent change (null when no baseline). */
  deltaPct: number | null
  direction: "improved" | "worsened" | "unchanged"
}
