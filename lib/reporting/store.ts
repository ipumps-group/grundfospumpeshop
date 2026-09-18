/**
 * Storage for weekly marketing reports. Primary: weekly_reports table in
 * Supabase (migration migrations/006_weekly_reports.sql). Fallback:
 * data/weekly-reports.json when Supabase is unreachable (same pattern as
 * the SPS report's JSON fallback). One report per week — re-generating the
 * same week upserts (replaces) it.
 */

import { supabaseAdmin } from "@/lib/supabase-admin"
import type { Insight, ReportChange, ReportSnapshot, StoredReport } from "./types"

const MAX_STORED = 156 // ~3 years of weekly reports
const TABLE = "weekly_reports"

/* ---------- JSON fallback (dev / DB outage) ---------- */

async function jsonFilePath(): Promise<string> {
  const path = await import("path")
  return path.join(process.cwd(), "data", "weekly-reports.json")
}

async function readJsonReports(): Promise<StoredReport[]> {
  const { promises: fs } = await import("fs")
  try {
    const raw = await fs.readFile(await jsonFilePath(), "utf-8")
    const parsed = JSON.parse(raw)
    const rows = Array.isArray(parsed) ? parsed : parsed?.reports
    return Array.isArray(rows) ? rows : []
  } catch {
    return []
  }
}

async function writeJsonReports(rows: StoredReport[]): Promise<void> {
  const { promises: fs } = await import("fs")
  const path = await import("path")
  const file = await jsonFilePath()
  await fs.mkdir(path.dirname(file), { recursive: true })
  await fs.writeFile(file, JSON.stringify({ reports: rows }, null, 2), "utf-8")
}

/* ---------- row <-> report mapping ---------- */

interface ReportRowShape {
  id: number
  week_start: string
  week_end: string
  created_at: string
  snapshot: unknown
  insights: unknown
  narrative: string | null
  changes: unknown
  email_sent_at: string | null
  email_error: string | null
}

function rowToReport(row: ReportRowShape): StoredReport {
  return {
    id: row.id,
    weekStart: row.week_start,
    weekEnd: row.week_end,
    createdAt: row.created_at,
    snapshot: row.snapshot as ReportSnapshot,
    insights: (Array.isArray(row.insights) ? row.insights : []) as Insight[],
    narrative: row.narrative ?? "",
    changes: (Array.isArray(row.changes) ? row.changes : []) as ReportChange[],
    emailSentAt: row.email_sent_at ?? null,
    emailError: row.email_error ?? "",
  }
}

export interface SaveReportInput {
  weekStart: string
  weekEnd: string
  snapshot: ReportSnapshot
  insights: Insight[]
  narrative: string
  changes: ReportChange[]
}

/** Insert or replace the report for the given week. Returns the stored row. */
export async function saveWeeklyReport(input: SaveReportInput): Promise<StoredReport> {
  try {
    const { data, error } = await supabaseAdmin
      .from(TABLE)
      .upsert(
        {
          week_start: input.weekStart,
          week_end: input.weekEnd,
          created_at: new Date().toISOString(),
          snapshot: input.snapshot,
          insights: input.insights,
          narrative: input.narrative,
          changes: input.changes,
          email_sent_at: null,
          email_error: "",
        },
        { onConflict: "week_start,week_end" },
      )
      .select()
      .single()
    if (error) throw error
    return rowToReport(data as ReportRowShape)
  } catch (error) {
    console.error("DB report save failed, falling back to JSON storage:", error)
  }

  const rows = await readJsonReports()
  const nextId = rows.reduce((max, r) => Math.max(max, Number(r.id) || 0), 0) + 1
  const report: StoredReport = {
    id: nextId,
    weekStart: input.weekStart,
    weekEnd: input.weekEnd,
    createdAt: new Date().toISOString(),
    snapshot: input.snapshot,
    insights: input.insights,
    narrative: input.narrative,
    changes: input.changes,
    emailSentAt: null,
    emailError: "",
  }
  const rest = rows.filter((r) => !(r.weekStart === input.weekStart && r.weekEnd === input.weekEnd))
  rest.unshift(report)
  await writeJsonReports(rest.slice(0, MAX_STORED))
  return report
}

/** Newest first. `limit` guards the JSON fallback file growth on reads. */
export async function listWeeklyReports(limit = 104): Promise<StoredReport[]> {
  try {
    const { data, error } = await supabaseAdmin
      .from(TABLE)
      .select("*")
      .order("week_end", { ascending: false })
      .limit(limit)
    if (error) throw error
    return (data ?? []).map((r) => rowToReport(r as ReportRowShape))
  } catch (error) {
    console.error("DB report list failed, falling back to JSON storage:", error)
  }
  const rows = await readJsonReports()
  return rows
    .sort((a, b) => b.weekEnd.localeCompare(a.weekEnd))
    .slice(0, limit)
}

export async function getWeeklyReport(id: number): Promise<StoredReport | null> {
  try {
    const { data, error } = await supabaseAdmin.from(TABLE).select("*").eq("id", id).maybeSingle()
    if (error) throw error
    return data ? rowToReport(data as ReportRowShape) : null
  } catch (error) {
    console.error("DB report read failed, falling back to JSON storage:", error)
  }
  const rows = await readJsonReports()
  return rows.find((r) => Number(r.id) === Number(id)) ?? null
}

/**
 * The most recent stored report BEFORE the given week (the comparison
 * baseline for the changes sequence). Null for the very first report.
 */
export async function getPreviousReport(weekStart: string): Promise<StoredReport | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from(TABLE)
      .select("*")
      .lt("week_start", weekStart)
      .order("week_start", { ascending: false })
      .limit(1)
      .maybeSingle()
    if (error) throw error
    return data ? rowToReport(data as ReportRowShape) : null
  } catch (error) {
    console.error("DB previous-report read failed, falling back to JSON storage:", error)
  }
  const rows = await readJsonReports()
  return rows
    .filter((r) => r.weekStart < weekStart)
    .sort((a, b) => b.weekStart.localeCompare(a.weekStart))[0] ?? null
}

/** Delete reports by id. Returns the number of deleted rows. */
export async function deleteWeeklyReports(ids: number[]): Promise<number> {
  const unique = [...new Set(ids)]
  if (unique.length === 0) return 0
  try {
    const { data, error } = await supabaseAdmin.from(TABLE).delete().in("id", unique).select("id")
    if (error) throw error
    return data?.length ?? 0
  } catch (error) {
    console.error("DB report delete failed, falling back to JSON storage:", error)
  }
  const rows = await readJsonReports()
  const keep = rows.filter((r) => !unique.includes(Number(r.id)))
  await writeJsonReports(keep)
  return rows.length - keep.length
}

export async function markReportEmailSent(id: number, error?: string): Promise<void> {
  const sentAt = error ? null : new Date().toISOString()
  const errorText = error ?? ""
  try {
    const { error: dbError } = await supabaseAdmin
      .from(TABLE)
      .update({ email_sent_at: sentAt, email_error: errorText })
      .eq("id", id)
    if (dbError) throw dbError
    return
  } catch (err) {
    console.error("DB report email-mark failed, falling back to JSON storage:", err)
  }
  const rows = await readJsonReports()
  const row = rows.find((r) => Number(r.id) === Number(id))
  if (row) {
    row.emailSentAt = sentAt
    row.emailError = errorText
    await writeJsonReports(rows)
  }
}

/**
 * Report e-mail recipients: Supabase settings key `report_email_recipients`
 * (editable in /haldus/seaded), fallback info@pumbapood.ee.
 */
export async function getReportRecipients(): Promise<string> {
  try {
    const { data } = await supabaseAdmin
      .from("settings")
      .select("value")
      .eq("key", "report_email_recipients")
      .maybeSingle()
    if (data?.value) return data.value
  } catch {
    // fallback
  }
  return "info@pumbapood.ee"
}
