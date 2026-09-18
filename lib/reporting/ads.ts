/**
 * Google Ads API (GAQL) pulls for the weekly report — Pumbapood's own
 * account (GOOGLE_ADS_CUSTOMER_ID / GOOGLE_ADS_LOGIN_CUSTOMER_ID), same
 * OAuth credentials as lib/ads/google-ads.ts. Campaigns incl. impression
 * share (the competitor-pressure proxy: rank-lost vs budget-lost), search
 * terms with brand/non-brand split, keywords with quality score.
 *
 * Read-only: only googleAds:search is called.
 */

import { getGoogleOAuthToken, type ReportPeriod } from "./google-auth"
import type { AdsCampaign, AdsData, AdsKeyword, AdsTerm } from "./types"

/** Bump when Google sunsets this version (a 404 HTML error means: bump). */
const ADS_API_VERSION = "v24"

type Row = Record<string, Record<string, unknown> | undefined>

/** The REST API returns camelCase keys; normalize to proto snake_case. */
function snakeKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(snakeKeys)
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([k, v]) => [
        k.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`),
        snakeKeys(v),
      ]),
    )
  }
  return value
}

const num = (v: unknown) => (v === undefined || v === null ? 0 : Number(v))
const micros = (v: unknown) => num(v) / 1e6
const nullable = (v: unknown): number | null => (v === undefined || v === null ? null : Number(v))

async function gaql(token: string, customerId: string, developerToken: string, query: string): Promise<Row[]> {
  const url = `https://googleads.googleapis.com/${ADS_API_VERSION}/customers/${customerId}/googleAds:search`
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    "developer-token": developerToken,
    "Content-Type": "application/json",
  }
  const loginCustomerId = (process.env.GOOGLE_ADS_LOGIN_CUSTOMER_ID ?? "").replace(/-/g, "")
  if (loginCustomerId) headers["login-customer-id"] = loginCustomerId

  const rows: Row[] = []
  let pageToken: string | undefined
  do {
    const res = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify({ query, ...(pageToken ? { pageToken } : {}) }),
    })
    if (!res.ok) {
      const text = await res.text()
      throw new Error(`GAQL failed (${res.status}): ${text.slice(0, 500)}`)
    }
    const data = (await res.json()) as { results?: Row[]; nextPageToken?: string }
    rows.push(...(data.results ?? []).map((r) => snakeKeys(r) as Row))
    pageToken = data.nextPageToken
  } while (pageToken)
  return rows
}

const field = (row: Row, resource: string, name: string): unknown => row[resource]?.[name]

/** Pumbapood brand terms (brand clicks would mostly come organically anyway). */
export const isBrandTerm = (t: string) => /pumba\s?pood|pumbapood|\bpump\s?oü\b/i.test(t)

export async function pullAds(period: ReportPeriod): Promise<AdsData> {
  const developerToken = process.env.GOOGLE_ADS_DEVELOPER_TOKEN
  const customerId = (process.env.GOOGLE_ADS_CUSTOMER_ID ?? "").replace(/-/g, "")
  if (!developerToken || !customerId) {
    throw new Error("GOOGLE_ADS_DEVELOPER_TOKEN / GOOGLE_ADS_CUSTOMER_ID are not set")
  }
  const token = await getGoogleOAuthToken()
  const between = `segments.date BETWEEN '${period.start}' AND '${period.end}'`
  const run = (q: string) => gaql(token, customerId, developerToken, q)

  /* --- campaigns incl. impression share --- */
  const campaignRows = await run(
    `SELECT campaign.name, campaign.status,
            metrics.cost_micros, metrics.clicks, metrics.impressions, metrics.ctr, metrics.average_cpc,
            metrics.conversions, metrics.all_conversions,
            metrics.search_impression_share, metrics.search_rank_lost_impression_share,
            metrics.search_budget_lost_impression_share,
            metrics.search_top_impression_share, metrics.search_absolute_top_impression_share
     FROM campaign
     WHERE ${between}
     ORDER BY metrics.cost_micros DESC`,
  )
  const campaigns: AdsCampaign[] = campaignRows
    .filter((r) => num(field(r, "metrics", "cost_micros")) > 0 || num(field(r, "metrics", "impressions")) > 0)
    .map((r) => {
      const m = r.metrics ?? {}
      return {
        name: String(field(r, "campaign", "name") ?? "?"),
        status: String(field(r, "campaign", "status") ?? "?"),
        cost: micros(m.cost_micros),
        clicks: num(m.clicks),
        impressions: num(m.impressions),
        ctr: num(m.ctr),
        avgCpc: micros(m.average_cpc),
        conversions: num(m.conversions),
        allConversions: num(m.all_conversions),
        impressionShare: nullable(m.search_impression_share),
        rankLostIS: nullable(m.search_rank_lost_impression_share),
        budgetLostIS: nullable(m.search_budget_lost_impression_share),
        topIS: nullable(m.search_top_impression_share),
        absTopIS: nullable(m.search_absolute_top_impression_share),
      }
    })

  /* --- search terms (brand vs non-brand) --- */
  const termRows = await run(
    `SELECT search_term_view.search_term, campaign.name,
            metrics.impressions, metrics.clicks, metrics.cost_micros, metrics.all_conversions
     FROM search_term_view
     WHERE ${between}
     ORDER BY metrics.cost_micros DESC
     LIMIT 300`,
  )
  const topTerms: AdsTerm[] = termRows.map((r) => {
    const m = r.metrics ?? {}
    return {
      term: String(field(r, "search_term_view", "search_term") ?? "?"),
      campaign: String(field(r, "campaign", "name") ?? "?"),
      cost: micros(m.cost_micros),
      clicks: num(m.clicks),
      impressions: num(m.impressions),
      conversions: num(m.all_conversions),
    }
  })
  const brand = { cost: 0, clicks: 0, conversions: 0 }
  const nonBrand = { cost: 0, clicks: 0, conversions: 0 }
  for (const t of topTerms) {
    const bucket = isBrandTerm(t.term) ? brand : nonBrand
    bucket.cost += t.cost
    bucket.clicks += t.clicks
    bucket.conversions += t.conversions
  }

  /* --- keywords + quality score --- */
  let keywordRows: Row[]
  try {
    keywordRows = await run(
      `SELECT campaign.name, ad_group_criterion.keyword.text,
              ad_group_criterion.keyword.match_type,
              ad_group_criterion.quality_info.quality_score,
              metrics.impressions, metrics.clicks, metrics.cost_micros, metrics.conversions
       FROM keyword_view
       WHERE ${between} AND ad_group_criterion.status != 'REMOVED'
       ORDER BY metrics.cost_micros DESC
       LIMIT 100`,
    )
  } catch {
    /* quality_info is not always combinable with date segments - retry without it */
    keywordRows = await run(
      `SELECT campaign.name, ad_group_criterion.keyword.text,
              ad_group_criterion.keyword.match_type,
              metrics.impressions, metrics.clicks, metrics.cost_micros, metrics.conversions
       FROM keyword_view
       WHERE ${between} AND ad_group_criterion.status != 'REMOVED'
       ORDER BY metrics.cost_micros DESC
       LIMIT 100`,
    )
  }
  const keywords: AdsKeyword[] = keywordRows.map((r) => {
    const m = r.metrics ?? {}
    const c = r.ad_group_criterion ?? {}
    const kw = (c.keyword ?? {}) as Record<string, unknown>
    const qi = (c.quality_info ?? {}) as Record<string, unknown> | undefined
    return {
      keyword: String(kw.text ?? "?"),
      matchType: String(kw.match_type ?? "?"),
      qualityScore: qi?.quality_score === undefined ? null : num(qi.quality_score),
      campaign: String(field(r, "campaign", "name") ?? "?"),
      cost: micros(m.cost_micros),
      clicks: num(m.clicks),
      impressions: num(m.impressions),
      conversions: num(m.conversions),
    }
  })

  const totals = {
    cost: campaigns.reduce((s, c) => s + c.cost, 0),
    clicks: campaigns.reduce((s, c) => s + c.clicks, 0),
    impressions: campaigns.reduce((s, c) => s + c.impressions, 0),
    conversions: campaigns.reduce((s, c) => s + c.allConversions, 0),
  }

  return { available: true, campaigns, brand, nonBrand, topTerms, keywords, totals }
}
