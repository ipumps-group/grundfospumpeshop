/**
 * Meta (Facebook/Instagram) Marketing API pulls for the weekly report —
 * Pumbapood's own ad account (META_ACCESS_TOKEN / META_AD_ACCOUNT_ID),
 * same credentials as lib/ads/meta-ads.ts. Campaigns with objective
 * (TRAFFIC vs SALES määrab, milleks Meta optimeerib) + per-campaign
 * spend/clicks and the funnel actions (landing_page_view → view_content →
 * add_to_cart → purchase) for the current and previous week.
 *
 * Read-only: only GET /campaigns and GET /insights are called.
 */

import type { ReportPeriod } from "./google-auth"
import type { MetaCampaign, MetaData } from "./types"

interface MetaAction {
  action_type?: string
  value?: string | number
}
interface MetaInsightRow {
  campaign_id?: string
  campaign_name?: string
  spend?: string
  impressions?: string
  clicks?: string
  actions?: MetaAction[]
  action_values?: MetaAction[]
}
interface MetaCampaignRow {
  id?: string
  name?: string
  status?: string
  objective?: string
  daily_budget?: string
}

const GRAPH_VERSION = () => process.env.META_GRAPH_API_VERSION || "v25.0"

async function metaGet<T>(path: string, params: Record<string, string>): Promise<T> {
  const token = process.env.META_ACCESS_TOKEN
  const accountId = (process.env.META_AD_ACCOUNT_ID ?? "").replace(/^act_/, "")
  if (!token || !accountId) {
    throw new Error("META_ACCESS_TOKEN / META_AD_ACCOUNT_ID are not set")
  }
  const url = new URL(`https://graph.facebook.com/${GRAPH_VERSION()}${path.replace("{acc}", accountId)}`)
  url.searchParams.set("access_token", token)
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v)
  const res = await fetch(url)
  const data = (await res.json()) as T & { error?: { code?: number; message?: string } }
  if (data.error) throw new Error(`Meta API (${data.error.code}): ${(data.error.message ?? "").slice(0, 300)}`)
  return data
}

/** Meta reports the same event under plain and omni_ action types — sum both. */
function actionSum(actions: MetaAction[] | undefined, ...types: string[]): number {
  if (!actions) return 0
  let sum = 0
  for (const a of actions) {
    if (a.action_type && types.includes(a.action_type)) sum += Number(a.value ?? 0)
  }
  return sum
}

const landingViews = (a?: MetaAction[]) => actionSum(a, "landing_page_view", "omni_landing_page_view")
const viewContent = (a?: MetaAction[]) => actionSum(a, "view_content", "omni_view_content")
const addToCart = (a?: MetaAction[]) => actionSum(a, "add_to_cart", "omni_add_to_cart")
const purchases = (a?: MetaAction[]) => actionSum(a, "purchase", "omni_purchase")

async function pullInsights(since: string, until: string): Promise<MetaInsightRow[]> {
  const data = await metaGet<{ data?: MetaInsightRow[] }>(`/act_{acc}/insights`, {
    fields: "campaign_id,campaign_name,spend,impressions,clicks,actions,action_values",
    time_range: JSON.stringify({ since, until }),
    level: "campaign",
    limit: "100",
  })
  return data.data ?? []
}

export async function pullMeta(period: ReportPeriod): Promise<MetaData> {
  /* --- campaign metadata (status, objective, budget) --- */
  const campData = await metaGet<{ data?: MetaCampaignRow[] }>(`/act_{acc}/campaigns`, {
    fields: "id,name,status,objective,daily_budget",
    limit: "100",
  })
  const meta = new Map<string, MetaCampaignRow>()
  for (const c of campData.data ?? []) {
    if (c.id) meta.set(c.id, c)
  }

  /* --- insights: current + previous week --- */
  const [current, previous] = await Promise.all([
    pullInsights(period.start, period.end),
    pullInsights(period.prevStart, period.prevEnd),
  ])

  const campaigns: MetaCampaign[] = current
    .filter((r) => Number(r.spend ?? 0) > 0 || Number(r.impressions ?? 0) > 0)
    .map((r) => {
      const c = r.campaign_id ? meta.get(r.campaign_id) : undefined
      return {
        name: String(r.campaign_name ?? c?.name ?? "?"),
        status: String(c?.status ?? "?"),
        objective: c?.objective ?? null,
        dailyBudget: c?.daily_budget ? Number(c.daily_budget) / 100 : null,
        cost: Number(r.spend ?? 0),
        clicks: Number(r.clicks ?? 0),
        impressions: Number(r.impressions ?? 0),
        landingPageViews: landingViews(r.actions),
        viewContent: viewContent(r.actions),
        addToCart: addToCart(r.actions),
        purchases: purchases(r.actions),
        purchaseValue: purchases(r.action_values),
      }
    })
    .sort((a, b) => b.cost - a.cost)

  const totals = {
    cost: campaigns.reduce((s, c) => s + c.cost, 0),
    prevCost: previous.reduce((s, r) => s + Number(r.spend ?? 0), 0),
    clicks: campaigns.reduce((s, c) => s + c.clicks, 0),
    impressions: campaigns.reduce((s, c) => s + c.impressions, 0),
    landingPageViews: campaigns.reduce((s, c) => s + c.landingPageViews, 0),
    viewContent: campaigns.reduce((s, c) => s + c.viewContent, 0),
    addToCart: campaigns.reduce((s, c) => s + c.addToCart, 0),
    purchases: campaigns.reduce((s, c) => s + c.purchases, 0),
    purchaseValue: campaigns.reduce((s, c) => s + c.purchaseValue, 0),
  }

  return { available: true, campaigns, totals }
}
