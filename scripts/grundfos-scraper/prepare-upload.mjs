/**
 * prepare-upload.mjs
 *
 * Normalises all curve and drawing filenames to a consistent system:
 *   curves/cropped/   → upload-ready/curves/{SKU}_curve.png
 *   Drawings/drawings/ → upload-ready/drawings/{SKU}_drawing.png
 *
 * Special cases handled:
 *   - {SKU}.png without suffix     → {SKU}_curve.png  (prefer larger file if both exist)
 *   - {SKU} (1).png / {SKU}(1).png → {SKU}_curve.png  (use (1) variant, skip (2))
 *
 * Usage:
 *   node prepare-upload.mjs
 */

import { copyFileSync, mkdirSync, existsSync, statSync, readdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const CURVES_SRC   = join(__dirname, 'curves', 'cropped')
const DRAWINGS_SRC = join(__dirname, 'Drawings', 'drawings')
const CURVES_OUT   = join(__dirname, 'upload-ready', 'curves')
const DRAWINGS_OUT = join(__dirname, 'upload-ready', 'drawings')

mkdirSync(CURVES_OUT,   { recursive: true })
mkdirSync(DRAWINGS_OUT, { recursive: true })

// ── Extract SKU from a curve filename ──────────────────────────────────────────
// Handles:
//   99452178_curve.png        → 99452178
//   013N1900.png              → 013N1900
//   98699180 (1).png          → 98699180  (first variant only)
//   98699181(2).png           → skip (second variant)
function parseCurveFilename(filename) {
  // Already correct format
  const standard = filename.match(/^(.+)_curve\.png$/i)
  if (standard) return { sku: standard[1], skip: false }

  // Variant (2) / (2) – skip
  const variant2 = filename.match(/^(.+)\s*\(2\)\.png$/i)
  if (variant2) return { sku: variant2[1].trim(), skip: true }

  // Variant (1) – keep as primary
  const variant1 = filename.match(/^(.+)\s*\(1\)\.png$/i)
  if (variant1) return { sku: variant1[1].trim(), skip: false }

  // Plain {SKU}.png (no suffix)
  const plain = filename.match(/^(.+)\.png$/i)
  if (plain) return { sku: plain[1], skip: false }

  return null
}

// ── Normalise curves ───────────────────────────────────────────────────────────
console.log('\n── Curves ──────────────────────────────────────────────────────────')
const curveFiles = readdirSync(CURVES_SRC).filter(f => /\.png$/i.test(f))

const curveCandidates = {}   // sku → { file, size }

for (const file of curveFiles) {
  const parsed = parseCurveFilename(file)
  if (!parsed) continue
  if (parsed.skip) { console.log(`  SKIP  (2nd variant) : ${file}`); continue }

  const fullPath = join(CURVES_SRC, file)
  const size = statSync(fullPath).size

  const existing = curveCandidates[parsed.sku]
  if (!existing || size > existing.size) {
    // Prefer larger file (better quality screenshot)
    curveCandidates[parsed.sku] = { file, size }
  }
}

let copiedCurves = 0, skippedCurves = 0
for (const [sku, { file, size }] of Object.entries(curveCandidates)) {
  const src  = join(CURVES_SRC, file)
  const dest = join(CURVES_OUT, `${sku}_curve.png`)
  copyFileSync(src, dest)
  const label = file === `${sku}_curve.png` ? '' : `  ← from ${file}`
  console.log(`  OK  ${sku}_curve.png  (${Math.round(size/1024)}KB)${label}`)
  copiedCurves++
}

// ── Normalise drawings ─────────────────────────────────────────────────────────
console.log('\n── Drawings ─────────────────────────────────────────────────────────')
const drawingFiles = readdirSync(DRAWINGS_SRC).filter(f => /\.png$/i.test(f))

let copiedDrawings = 0
for (const file of drawingFiles) {
  const match = file.match(/^(.+)_drawing\.png$/i)
  if (!match) { console.log(`  WARN  unexpected name: ${file}`); continue }
  const sku  = match[1]
  const src  = join(DRAWINGS_SRC, file)
  const dest = join(DRAWINGS_OUT, `${sku}_drawing.png`)
  copyFileSync(src, dest)
  const size = statSync(src).size
  console.log(`  OK  ${sku}_drawing.png  (${Math.round(size/1024)}KB)`)
  copiedDrawings++
}

// ── Summary ───────────────────────────────────────────────────────────────────
console.log(`\n── Summary ──────────────────────────────────────────────────────────`)
console.log(`  Curves copied   : ${copiedCurves}`)
console.log(`  Drawings copied : ${copiedDrawings}`)
console.log(`  Ready in        : scripts/grundfos-scraper/upload-ready/`)
console.log(`\nNext step: node upload-assets.mjs`)
