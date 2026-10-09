#!/usr/bin/env node
/**
 * Generate data/git-history.json for the weekly report's "Lehekülje arendus"
 * section. Runs automatically before `next build` (prebuild) and `next dev`
 * (predev) — the deployed serverless bundle then carries the git history of
 * everything that is LIVE, and lib/reporting/site-changes.ts filters the
 * window between two reports.
 *
 * Only deployed (built) commits can appear in the report — undeployed commits
 * are not on the live site and must not be promised in the report.
 *
 * Per commit: hash, committer date, subject and changed files (name-status).
 * Never fails the build: any error is logged and the previous JSON (if any)
 * is left untouched.
 */

import { execFileSync } from "node:child_process"
import fs from "node:fs"
import path from "node:path"

const MAX_COMMITS = 300
const MAX_FILES_PER_COMMIT = 30
const OUT_FILE = path.join(process.cwd(), "data", "git-history.json")

function main() {
  const SEP = "\x1e" // record separator between commits
  const FIELD = "\x1f" // field separator inside the header line
  const log = execFileSync(
    "git",
    ["log", "--no-merges", `-n`, String(MAX_COMMITS), `--pretty=format:${SEP}%h${FIELD}%H${FIELD}%cI${FIELD}%s`, "--name-status"],
    { encoding: "utf-8", maxBuffer: 32 * 1024 * 1024 },
  )

  const commits = []
  for (const record of log.split(SEP)) {
    const trimmed = record.trim()
    if (!trimmed) continue
    const lines = trimmed.split(/\r?\n/)
    const header = lines[0].split(FIELD)
    if (header.length < 4) continue
    const [short, hash, date, subject] = header
    const files = []
    let filesTruncated = false
    for (const line of lines.slice(1)) {
      if (!line.trim()) continue
      const parts = line.split("\t")
      const status = parts[0]
      // Renames: "R100\told\tnew" — track the new path.
      const filePath = status.startsWith("R") ? parts[2] : parts[1]
      if (!filePath) continue
      if (files.length < MAX_FILES_PER_COMMIT) files.push({ s: status[0], p: filePath })
      else filesTruncated = true
    }
    commits.push({ hash: short || hash.slice(0, 7), date, subject, files, ...(filesTruncated ? { filesTruncated: true } : {}) })
  }

  fs.mkdirSync(path.dirname(OUT_FILE), { recursive: true })
  fs.writeFileSync(OUT_FILE, JSON.stringify({ generatedAt: new Date().toISOString(), commits }, null, 1), "utf-8")
  console.log(`git-history: ${commits.length} commits -> ${path.relative(process.cwd(), OUT_FILE)}`)
}

try {
  main()
} catch (error) {
  // Never break the build — the weekly report section simply stays hidden
  // and the previous JSON (when present) remains in place.
  console.error("git-history generation failed (non-fatal):", error instanceof Error ? error.message : error)
}
