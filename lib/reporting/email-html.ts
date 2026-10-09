/**
 * Weekly report e-mail rendering: compact HTML (inline styles, table layout —
 * mail-client safe) + plain-text fallback. Content: scorecard, changes vs the
 * previous stored report (improvements/regressions), week's orders, LLM
 * narrative (when present), grouped insights, link to the full admin report.
 */

import type { Insight, OrderRow, ReportChange, SiteChanges, StoredReport } from "./types"
import { summarizeChanges } from "./changes"

const BRAND = "#003366"
const ACCENT = "#3abeff"
const INK = "#1a2b3c"
const MUTED = "#5a6474"
const BORDER = "#e5eaf0"

const SEV_META: Record<Insight["severity"], { label: string; color: string; bg: string }> = {
  negative: { label: "Kriitiline", color: "#b91c1c", bg: "#fee2e2" },
  warning: { label: "Tähelepanu", color: "#92400e", bg: "#fef3c7" },
  opportunity: { label: "Võimalus", color: "#1d4ed8", bg: "#dbeafe" },
  positive: { label: "Positiivne", color: "#166534", bg: "#dcfce7" },
}

const AREA_LABELS: Record<Insight["area"], string> = {
  seo: "SEO / GSC",
  ads: "Google Ads",
  ga4: "Liiklus (GA4)",
  orders: "Tellimused",
  strategy: "Strateegia",
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
}

/** Minimal markdown -> HTML for the LLM narrative (##, ###, **, -, 1., paragraphs). */
export function markdownToHtml(md: string): string {
  const lines = md.split(/\r?\n/)
  const html: string[] = []
  let listOpen: "ul" | "ol" | null = null
  const closeList = () => {
    if (listOpen) {
      html.push(listOpen === "ul" ? "</ul>" : "</ol>")
      listOpen = null
    }
  }
  const inline = (s: string) =>
    escapeHtml(s).replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>").replace(/`([^`]+)`/g, "<code>$1</code>")

  for (const raw of lines) {
    const line = raw.trimEnd()
    if (!line.trim()) {
      closeList()
      continue
    }
    const h = line.match(/^(#{2,4})\s+(.*)$/)
    if (h) {
      closeList()
      const size = h[1].length === 2 ? "18px" : "16px"
      html.push(`<h2 style="font-size:${size};color:${BRAND};margin:20px 0 8px;font-family:Arial,sans-serif">${inline(h[2])}</h2>`)
      continue
    }
    const ul = line.match(/^[-*]\s+(.*)$/)
    if (ul) {
      if (listOpen !== "ul") {
        closeList()
        html.push('<ul style="margin:6px 0;padding-left:22px">')
        listOpen = "ul"
      }
      html.push(`<li style="margin:4px 0;font-size:15px;line-height:1.5;color:#2d3748">${inline(ul[1])}</li>`)
      continue
    }
    const ol = line.match(/^\d+[.)]\s+(.*)$/)
    if (ol) {
      if (listOpen !== "ol") {
        closeList()
        html.push('<ol style="margin:6px 0;padding-left:22px">')
        listOpen = "ol"
      }
      html.push(`<li style="margin:4px 0;font-size:15px;line-height:1.5;color:#2d3748">${inline(ol[1])}</li>`)
      continue
    }
    closeList()
    html.push(`<p style="margin:8px 0;font-size:15px;line-height:1.55;color:#2d3748">${inline(line)}</p>`)
  }
  closeList()
  return html.join("\n")
}

function scoreCard(label: string, value: string, sub: string): string {
  return (
    `<td style="width:25%;padding:4px">` +
    `<div style="background:#f8fafc;border:1px solid ${BORDER};border-radius:12px;padding:12px 14px">` +
    `<div style="font-size:13px;color:${MUTED};font-family:Arial,sans-serif">${escapeHtml(label)}</div>` +
    `<div style="font-size:22px;font-weight:bold;color:${BRAND};font-family:Arial,sans-serif;margin:2px 0">${escapeHtml(value)}</div>` +
    `<div style="font-size:12px;color:${MUTED};font-family:Arial,sans-serif">${sub}</div>` +
    `</div></td>`
  )
}

function deltaSub(cur: number, prev: number): string {
  if (prev === 0 && cur === 0) return "eelmine nädal: –"
  if (prev === 0) return "eelmine nädal: 0"
  const pct = Math.round(((cur - prev) / prev) * 100)
  const good = pct > 0
  const arrow = pct === 0 ? "■" : pct > 0 ? "▲" : "▼"
  const color = pct === 0 ? MUTED : good ? "#166534" : "#b91c1c"
  return `<span style="color:${color}">${arrow} ${pct > 0 ? "+" : ""}${pct} %</span> eelmise nädalaga`
}

/* ---------- changes vs the previous stored report ---------- */

const CHANGE_META: Record<ReportChange["direction"], { label: string; color: string; bg: string; arrow: string }> = {
  improved: { label: "Paranes", color: "#166534", bg: "#dcfce7", arrow: "▲" },
  worsened: { label: "Halvenes", color: "#b91c1c", bg: "#fee2e2", arrow: "▼" },
  unchanged: { label: "Stabiilne", color: MUTED, bg: "#f1f5f9", arrow: "■" },
}

function fmtChangeValue(c: ReportChange, v: number | null): string {
  if (v === null) return "–"
  const s = String(v).replace(".", ",")
  return c.unit === "€" ? `${s} €` : c.unit === "%" ? `${s} %` : s
}

function changesSection(changes: ReportChange[]): { html: string; text: string[] } {
  const summary = summarizeChanges(changes)
  if (changes.length === 0) {
    return {
      html: `<h2 style="font-size:18px;color:${BRAND};margin:24px 0 4px">Muutused eelmise raportiga</h2>` +
        `<p style="font-size:14px;color:${MUTED};margin:4px 0 8px">${escapeHtml(summary)}.</p>`,
      text: ["MUUTUSED EELMISE RAPORTIGA", summary, ""],
    }
  }
  const rows = changes
    .map((c) => {
      const m = CHANGE_META[c.direction]
      const delta = c.deltaPct === null ? "–" : `${c.deltaPct > 0 ? "+" : ""}${String(c.deltaPct).replace(".", ",")} %`
      return (
        `<tr>` +
        `<td style="padding:6px 8px;border-top:1px solid #edf0f4;font-size:14px;color:${INK}">${escapeHtml(c.label)}</td>` +
        `<td style="padding:6px 8px;border-top:1px solid #edf0f4;font-size:14px;color:${MUTED};text-align:right">${escapeHtml(fmtChangeValue(c, c.previous))}</td>` +
        `<td style="padding:6px 8px;border-top:1px solid #edf0f4;font-size:14px;color:${INK};font-weight:bold;text-align:right">${escapeHtml(fmtChangeValue(c, c.current))}</td>` +
        `<td style="padding:6px 8px;border-top:1px solid #edf0f4;font-size:13px;color:${m.color};text-align:right">${escapeHtml(delta)}</td>` +
        `<td style="padding:6px 8px;border-top:1px solid #edf0f4;text-align:right"><span style="display:inline-block;background:${m.bg};color:${m.color};font-size:12px;font-weight:bold;border-radius:8px;padding:2px 8px">${m.arrow} ${m.label}</span></td>` +
        `</tr>`
      )
    })
    .join("\n")
  const html =
    `<h2 style="font-size:18px;color:${BRAND};margin:24px 0 4px">Muutused eelmise raportiga</h2>` +
    `<p style="font-size:14px;color:${MUTED};margin:4px 0 8px">${escapeHtml(summary)}.</p>` +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${BORDER};border-radius:12px;overflow:hidden">${rows}</table>`
  const text = [
    "MUUTUSED EELMISE RAPORTIGA",
    summary,
    ...changes.map((c) => {
      const m = CHANGE_META[c.direction]
      const delta = c.deltaPct === null ? "–" : `${c.deltaPct > 0 ? "+" : ""}${c.deltaPct} %`
      return `- [${m.label}] ${c.label}: ${fmtChangeValue(c, c.previous)} → ${fmtChangeValue(c, c.current)} (${delta})`
    }),
    "",
  ]
  return { html, text }
}

/* ---------- „Lehekülje arendus" (git-põhised täiendused kahe raporti vahel) ---------- */

const SITE_CHANGE_GROUP_LABELS: Record<SiteChanges["groups"][number]["key"], string> = {
  content: "Sisu ja lehed",
  seo: "SEO ja nähtavus",
  technical: "Tehnilised täiendused",
}

const etCount = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`

/**
 * „Lehekülje arendus" reeglipõhine kokkuvõte (fallback LLM-summaryle).
 * Jagatud admin-UIga — admin kasutab samu ridu, kui summary puudub.
 */
export function siteChangesFallbackLines(changes: SiteChanges): string[] {
  return changes.groups.map((group) => {
    if (group.key === "technical") {
      return `${SITE_CHANGE_GROUP_LABELS[group.key]}: ${etCount(group.count, "muudatus", "muudatust")}.`
    }
    const shown = group.items.slice(0, 4)
    const rest = group.count - shown.length
    return `${SITE_CHANGE_GROUP_LABELS[group.key]}: ${etCount(group.count, "muudatus", "muudatust")} — ${shown.join("; ")}${rest > 0 ? ` (ja ${rest} veel)` : ""}.`
  })
}

/** „Lehekülje arendus" sektsioon: LLM-summary kui olemas, muidu struktureeritud read. */
function siteChangesSection(changes: SiteChanges): { html: string; text: string[] } {
  const since = changes.since.slice(0, 10).split("-").reverse().join(".")
  const heading = `Lehekülje arendus (alates ${since})`
  if (changes.commits === 0) {
    const note = "Ülevaatusperioodil poel muudatusi ei tehtud."
    return {
      html: `<h2 style="font-size:18px;color:${BRAND};margin:24px 0 4px">${escapeHtml(heading)}</h2>` +
        `<p style="font-size:15px;color:#2d3748;margin:4px 0 8px">${escapeHtml(note)}</p>`,
      text: [heading.toUpperCase(), note, ""],
    }
  }
  if (changes.summary) {
    return {
      html: `<h2 style="font-size:18px;color:${BRAND};margin:24px 0 4px">${escapeHtml(heading)}</h2>` + markdownToHtml(changes.summary),
      text: [heading.toUpperCase(), changes.summary, ""],
    }
  }
  const lines = siteChangesFallbackLines(changes)
  return {
    html:
      `<h2 style="font-size:18px;color:${BRAND};margin:24px 0 4px">${escapeHtml(heading)}</h2>` +
      `<ul style="margin:6px 0;padding-left:22px">` +
      lines.map((l) => `<li style="margin:4px 0;font-size:15px;line-height:1.5;color:#2d3748">${escapeHtml(l)}</li>`).join("") +
      `</ul>`,
    text: [heading.toUpperCase(), ...lines.map((l) => `- ${l}`), ""],
  }
}

/* ---------- week's orders ---------- */

const STATUS_LABELS: Record<string, string> = {
  pending: "Ootel",
  paid: "Makstud",
  processing: "Töötlemisel",
  shipped: "Saadetud",
  delivered: "Kohale toimetatud",
  cancelled: "Tühistatud",
  failed: "Ebaõnnestunud",
}

function ordersSection(orders: OrderRow[], window?: { start: string; end: string }): { html: string; text: string[] } {
  if (orders.length === 0) return { html: "", text: [] }
  const rows = orders
    .slice(0, 15)
    .map((o) => {
      const date = o.createdAt.slice(0, 10).split("-").reverse().slice(0, 2).join(".")
      return (
        `<tr>` +
        `<td style="padding:6px 8px;border-top:1px solid #edf0f4;font-size:14px;color:${MUTED};white-space:nowrap">${escapeHtml(date)}</td>` +
        `<td style="padding:6px 8px;border-top:1px solid #edf0f4;font-size:14px;color:${BRAND};font-weight:bold">${escapeHtml(o.customer || "—")}</td>` +
        `<td style="padding:6px 8px;border-top:1px solid #edf0f4;font-size:14px;color:${INK};text-align:right;white-space:nowrap">${o.total.toFixed(2).replace(".", ",")} €</td>` +
        `<td style="padding:6px 8px;border-top:1px solid #edf0f4;font-size:13px;color:${MUTED}">${escapeHtml(STATUS_LABELS[o.status] ?? o.status)}</td>` +
        `</tr>` +
        `<tr><td colspan="4" style="padding:0 8px 8px;font-size:13px;color:#4a5568">${escapeHtml(o.summary)}</td></tr>`
      )
    })
    .join("\n")
  /* Tellimused on arvestatud kuni raporti koostamiseni (reede hommik) — Google'i
   * ~2-päevane viivitus ei tohi päris tellimusi raportist välja jätta. */
  const windowNote = window
    ? `Tellimuste aken: ${window.start} – ${window.end} (kõik tellimused kuni raporti koostamiseni; Google'i statistika lõppeb ~2 päeva varem).`
    : null
  const html =
    `<h2 style="font-size:18px;color:${BRAND};margin:24px 0 4px">Nädala tellimused</h2>` +
    `<p style="font-size:15px;color:#2d3748;margin:4px 0 8px"><strong>${orders.length} tellimust</strong> — DB on konversioonide tõde (GA4/Ads konversioonid on nõusolekurežiimi tõttu alampiir).${windowNote ? ` ${escapeHtml(windowNote)}` : ""}</p>` +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${BORDER};border-radius:12px;overflow:hidden">${rows}</table>`
  const text = [
    "NÄDALA TELLIMUSED",
    `${orders.length} tellimust`,
    ...(windowNote ? [windowNote] : []),
    ...orders.slice(0, 15).map((o) => {
      const date = o.createdAt.slice(0, 10).split("-").reverse().slice(0, 2).join(".")
      return `- ${date} ${o.customer || "—"} [${o.total.toFixed(2)} €; ${STATUS_LABELS[o.status] ?? o.status}] ${o.summary}`
    }),
    "",
  ]
  return { html, text }
}

/* ---------- channel comparison (Meta vs Google) ---------- */

function channelsSection(report: StoredReport): { html: string; text: string[] } {
  const s = report.snapshot
  const meta = s.meta?.available ? s.meta : null
  const ads = s.ads?.available ? s.ads : null
  if (!meta && !ads) return { html: "", text: [] }

  const paidSocial = s.ga4?.channels.find((c) => c.channel === "Paid Social")?.sessions ?? null
  const paidSearch = s.ga4?.channels.find((c) => c.channel === "Paid Search")?.sessions ?? null
  const money = (n: number) => `${n.toFixed(2).replace(".", ",")} €`
  const cps = (cost: number, sessions: number | null) =>
    sessions !== null && sessions > 0 ? money(cost / sessions) : "–"

  const rows: string[] = []
  const textRows: string[] = []
  const addRow = (channel: string, cost: number, sessions: number | null, platformClicks: string, conv: string) => {
    rows.push(
      `<tr>` +
      `<td style="padding:6px 8px;border-top:1px solid #edf0f4;font-size:14px;color:${INK};font-weight:bold">${escapeHtml(channel)}</td>` +
      `<td style="padding:6px 8px;border-top:1px solid #edf0f4;font-size:14px;color:${INK};text-align:right">${money(cost)}</td>` +
      `<td style="padding:6px 8px;border-top:1px solid #edf0f4;font-size:14px;color:${INK};text-align:right">${sessions === null ? "–" : Math.round(sessions)}</td>` +
      `<td style="padding:6px 8px;border-top:1px solid #edf0f4;font-size:14px;color:${INK};text-align:right">${cps(cost, sessions)}</td>` +
      `<td style="padding:6px 8px;border-top:1px solid #edf0f4;font-size:14px;color:${MUTED};text-align:right">${escapeHtml(platformClicks)}</td>` +
      `<td style="padding:6px 8px;border-top:1px solid #edf0f4;font-size:14px;color:${MUTED};text-align:right">${escapeHtml(conv)}</td>` +
      `</tr>`,
    )
    textRows.push(
      `- ${channel}: kulu ${money(cost)}, GA4 sessioonid ${sessions === null ? "–" : Math.round(sessions)}, €/sessioon ${cps(cost, sessions)}, ${platformClicks}, ${conv}`,
    )
  }
  if (meta) {
    addRow("Meta (FB/IG)", meta.totals.cost, paidSocial, `${meta.totals.clicks} klikki · ${meta.totals.landingPageViews} LP-vaadet`, `${meta.totals.purchases} ostu (Meta)`)
  }
  if (ads) {
    addRow("Google Ads", ads.totals.cost, paidSearch, `${ads.totals.clicks} klikki`, `${ads.totals.conversions.toFixed(1).replace(".", ",")} konv (Ads)`)
  }

  const html =
    `<h2 style="font-size:18px;color:${BRAND};margin:24px 0 4px">Kanalite võrdlus</h2>` +
    `<p style="font-size:14px;color:${MUTED};margin:4px 0 8px">€/sessioon = kanali kulu / GA4 sessioonid. Odav sessioon ei tähenda müüki — konversioonitõde on DB tellimused (nõusolekurežiim piirab platvormide omistust).</p>` +
    `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${BORDER};border-radius:12px;overflow:hidden">` +
    `<tr style="background:#f8fafc">` +
    `<td style="padding:6px 8px;font-size:13px;color:${MUTED}">Kanal</td>` +
    `<td style="padding:6px 8px;font-size:13px;color:${MUTED};text-align:right">Kulu</td>` +
    `<td style="padding:6px 8px;font-size:13px;color:${MUTED};text-align:right">GA4 sess.</td>` +
    `<td style="padding:6px 8px;font-size:13px;color:${MUTED};text-align:right">€/sessioon</td>` +
    `<td style="padding:6px 8px;font-size:13px;color:${MUTED};text-align:right">Platvorm</td>` +
    `<td style="padding:6px 8px;font-size:13px;color:${MUTED};text-align:right">Konversioonid</td>` +
    `</tr>${rows.join("")}</table>`
  return { html, text: ["KANALITE VÕRDLUS", ...textRows, ""] }
}

export function buildReportEmail(report: StoredReport, adminUrl: string): { subject: string; html: string; text: string } {
  const s = report.snapshot
  const subject = `Pumbapood nädalaraport ${s.period.start} – ${s.period.end}`

  const gscClicks = s.gsc ? s.gsc.current.clicks / s.gsc.current.days : null
  const gscPrevClicks = s.gsc ? s.gsc.previous.clicks / s.gsc.previous.days : null
  const cards: string[] = []
  if (s.gsc) {
    cards.push(scoreCard("GSC klikke/päevas", gscClicks!.toFixed(1).replace(".", ","), deltaSub(gscClicks!, gscPrevClicks!)))
  }
  if (s.ga4) {
    cards.push(scoreCard("Sessioonid (GA4)", String(Math.round(s.ga4.current.sessions)), deltaSub(s.ga4.current.sessions, s.ga4.previous.sessions)))
  }
  if (s.ads?.available) {
    cards.push(scoreCard("Ads kulu", `${s.ads.totals.cost.toFixed(0)} €`, `${s.ads.totals.clicks} klikki · ${s.ads.totals.conversions.toFixed(1).replace(".", ",")} konv (Ads)`))
  }
  if (s.meta?.available) {
    cards.push(scoreCard("Meta kulu", `${s.meta.totals.cost.toFixed(0)} €`, `${s.meta.totals.clicks} klikki · ${s.meta.totals.purchases} ostu (Meta)`))
  }
  if (s.orders) {
    cards.push(scoreCard("Tellimused", String(s.orders.current.orders), deltaSub(s.orders.current.orders, s.orders.previous.orders) + ` · ${s.orders.current.revenue.toFixed(0)} €`))
  }

  const insightsByArea = new Map<Insight["area"], Insight[]>()
  for (const ins of report.insights) {
    const list = insightsByArea.get(ins.area) ?? []
    list.push(ins)
    insightsByArea.set(ins.area, list)
  }

  const insightSections: string[] = []
  for (const [area, items] of insightsByArea) {
    const rows = items
      .map((ins) => {
        const meta = SEV_META[ins.severity]
        return (
          `<tr><td style="padding:8px 10px;border-top:1px solid #edf0f4;vertical-align:top">` +
          `<span style="display:inline-block;background:${meta.bg};color:${meta.color};font-size:12px;font-weight:bold;border-radius:8px;padding:2px 8px;margin-bottom:4px">${meta.label}</span>` +
          `<div style="font-size:15px;font-weight:bold;color:${BRAND};font-family:Arial,sans-serif">${escapeHtml(ins.title)}</div>` +
          `<div style="font-size:14px;color:#4a5568;font-family:Arial,sans-serif;margin-top:2px">${escapeHtml(ins.detail)}</div>` +
          `<div style="font-size:14px;color:#1d4ed8;font-family:Arial,sans-serif;margin-top:4px"><strong>Järgmine samm:</strong> ${escapeHtml(ins.action)}</div>` +
          `</td></tr>`
        )
      })
      .join("\n")
    insightSections.push(
      `<h3 style="font-size:16px;color:${BRAND};margin:22px 0 4px;font-family:Arial,sans-serif">${AREA_LABELS[area]}</h3>` +
      `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${BORDER};border-radius:12px;overflow:hidden">${rows}</table>`,
    )
  }

  const narrativeHtml = report.narrative ? markdownToHtml(report.narrative) : ""
  const changes = changesSection(report.changes ?? [])
  const ordersHtml = ordersSection(s.orders?.orders ?? [], s.orders?.window)
  const channels = channelsSection(report)
  const siteChanges = s.siteChanges ? siteChangesSection(s.siteChanges) : null
  const errorsNote = s.errors.length
    ? `<p style="font-size:13px;color:#92400e;background:#fef3c7;border-radius:8px;padding:8px 12px">Osaliselt puuduvad andmed: ${escapeHtml(s.errors.join(" · "))}</p>`
    : ""

  const html = `<!doctype html>
<html><body style="margin:0;background:#eceef1;padding:16px;font-family:Arial,sans-serif">
<div style="max-width:680px;margin:0 auto;background:#ffffff;border-radius:16px;padding:24px 28px;border:1px solid ${BORDER}">
  <div style="border-bottom:3px solid ${ACCENT};padding-bottom:12px;margin-bottom:16px">
    <div style="font-size:20px;font-weight:bold;color:${BRAND}">Pumbapood — nädalaraport</div>
    <div style="font-size:14px;color:${MUTED}">${s.period.start} → ${s.period.end} (võrdlus: ${s.period.prevStart} → ${s.period.prevEnd})</div>
  </div>
  ${errorsNote}
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>${cards.join("")}</tr></table>
  ${changes.html}
  ${siteChanges ? siteChanges.html : ""}
  ${channels.html}
  ${ordersHtml.html}
  ${narrativeHtml}
  <h2 style="font-size:18px;color:${BRAND};margin:24px 0 4px">Leiud ja järgmised sammud</h2>
  ${insightSections.join("\n")}
  <p style="margin-top:24px;font-size:14px;color:${MUTED}">
    Täisraport tabelite ja trendidega: <a href="${escapeHtml(adminUrl)}" style="color:#1d4ed8">${escapeHtml(adminUrl)}</a>
  </p>
  <p style="font-size:12px;color:#9aa5b1;margin-top:16px;border-top:1px solid #edf0f4;padding-top:10px">
    Automaatne nädalaraport (reede 09:00) · Andmed: GSC, GA4, Google Ads API, Meta Marketing API, tellimuste andmebaas · GSC/GA4/Ads/Meta andmed lõppevad ~2 päeva tagasi (Google'i viive); tellimused ja poe täiendused on arvestatud kuni raporti koostamiseni.
  </p>
</div>
</body></html>`

  const textLines: string[] = [
    `Pumbapood — nädalaraport ${s.period.start} – ${s.period.end}`,
    "",
  ]
  textLines.push(...changes.text)
  if (siteChanges) textLines.push(...siteChanges.text)
  textLines.push(...channels.text)
  textLines.push(...ordersHtml.text)
  if (report.narrative) {
    textLines.push(report.narrative.replace(/\*\*/g, "").replace(/^#{2,4}\s*/gm, ""), "")
  }
  textLines.push("LEIUD JA JÄRGMISED SAMMUD")
  for (const [area, items] of insightsByArea) {
    textLines.push("", `— ${AREA_LABELS[area]} —`)
    for (const ins of items) {
      textLines.push(`[${SEV_META[ins.severity].label}] ${ins.title}`, `  ${ins.detail}`, `  Järgmine samm: ${ins.action}`)
    }
  }
  textLines.push("", `Täisraport: ${adminUrl}`)

  return { subject, html, text: textLines.join("\n") }
}
