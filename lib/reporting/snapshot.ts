/**
 * Snapshot orchestrator: pulls GSC + GA4 + Ads + Supabase orders for the
 * weekly period and merges them into one ReportSnapshot. Each source is
 * isolated - a failing API (expired Ads token, missing GA4 property id, ...)
 * is recorded in `errors` and never aborts the rest of the report.
 */

import { pullGa4 } from "./ga4"
import { pullGsc } from "./gsc"
import { pullAds } from "./ads"
import { pullOrders } from "./orders"
import { weeklyPeriod } from "./google-auth"
import type { ReportSnapshot } from "./types"

async function attempt<T>(errors: string[], label: string, fn: () => Promise<T>): Promise<T | null> {
  try {
    return await fn()
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error)
    errors.push(`${label}: ${message.slice(0, 300)}`)
    return null
  }
}

export async function collectSnapshot(now: Date = new Date()): Promise<ReportSnapshot> {
  const period = weeklyPeriod(now)
  const errors: string[] = []

  // Sources are independent pulls; run in parallel but failures stay isolated.
  const [gsc, ga4, ads, orders] = await Promise.all([
    attempt(errors, "GSC", () => pullGsc(period)),
    attempt(errors, "GA4", () => pullGa4(period)),
    attempt(errors, "Ads", () => pullAds(period)),
    attempt(errors, "Tellimused", () => pullOrders(period)),
  ])

  return {
    generatedAt: now.toISOString(),
    period,
    ga4,
    gsc,
    ads,
    orders,
    errors,
  }
}
