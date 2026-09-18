/**
 * Weekly report pipeline: collect snapshot → fetch the previous stored report
 * → compute the changes sequence (improvements/regressions vs that report)
 * → rule-based insights → LLM narrative (when ANTHROPIC_API_KEY is set) →
 * store. E-mail delivery lives in notify.ts — callers: the weekly cron route
 * and the admin reports API (manual "generate now").
 */

import { collectSnapshot } from "./snapshot"
import { buildInsights } from "./insights"
import { computeChanges } from "./changes"
import { generateNarrative } from "./llm"
import { getPreviousReport, saveWeeklyReport } from "./store"
import type { StoredReport } from "./types"

export async function generateWeeklyReport(): Promise<StoredReport> {
  const snapshot = await collectSnapshot()
  const previous = await getPreviousReport(snapshot.period.start)
  const changes = computeChanges(snapshot, previous)
  const insights = buildInsights(snapshot)
  const narrative = (await generateNarrative(snapshot, insights, changes)) ?? ""

  return saveWeeklyReport({
    weekStart: snapshot.period.start,
    weekEnd: snapshot.period.end,
    snapshot,
    insights,
    narrative,
    changes,
  })
}
