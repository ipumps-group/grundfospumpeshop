/**
 * upload-assets.mjs
 *
 * Uploads all normalised curve and drawing images from upload-ready/ to
 * Supabase Storage and updates the products table with the public URLs.
 *
 * Storage paths:
 *   products/curves/{SKU}_curve.png
 *   products/drawings/{SKU}_drawing.png
 *
 * DB columns added (run SQL first):
 *   products.curve_url    TEXT
 *   products.drawing_url  TEXT
 *
 * Usage:
 *   node upload-assets.mjs                            # upload curves + drawings
 *   node upload-assets.mjs --test                     # first 3 SKUs only
 *   node upload-assets.mjs --curves-only              # skip drawings
 *   node upload-assets.mjs --drawings-only            # skip curves
 *   node upload-assets.mjs --curves-dir=path/to/dir   # custom curves folder
 *   node upload-assets.mjs --drawings-dir=path/to/dir # custom drawings folder
 *   node upload-assets.mjs --curves-suffix=_curve.png # custom file suffix
 */

import { createClient }    from '@supabase/supabase-js'
import { readFileSync, readdirSync } from 'fs'
import { join, dirname }  from 'path'
import { fileURLToPath }  from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

// ── Config ─────────────────────────────────────────────────────────────────────
// Set these via environment variables or paste directly for a one-off run
const SUPABASE_URL      = process.env.NEXT_PUBLIC_SUPABASE_URL
                       ?? 'https://avfvouczlgbtrhtqgokx.supabase.co'
const SERVICE_ROLE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY
                       ?? 'PASTE_YOUR_SERVICE_ROLE_KEY_HERE'

const BUCKET    = 'products'
const BASE_URL  = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}`

// ── CLI flags ──────────────────────────────────────────────────────────────────
const ARGV          = process.argv.slice(2)
const ARGS          = new Set(ARGV)
const TEST          = ARGS.has('--test')
const CURVES_ONLY   = ARGS.has('--curves-only')
const DRAWINGS_ONLY = ARGS.has('--drawings-only')
const TEST_LIMIT    = 3

const getCLIArg = (prefix) => ARGV.find(a => a.startsWith(prefix))?.replace(prefix, '') ?? null

const CURVES_DIR_ARG   = getCLIArg('--curves-dir=')
const DRAWINGS_DIR_ARG = getCLIArg('--drawings-dir=')
const CURVES_SUFFIX    = getCLIArg('--curves-suffix=') ?? '_curve.png'

const CURVES_DIR   = CURVES_DIR_ARG   ?? join(__dirname, 'upload-ready', 'curves')
const DRAWINGS_DIR = DRAWINGS_DIR_ARG ?? join(__dirname, 'upload-ready', 'drawings')

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})

const sleep = ms => new Promise(r => setTimeout(r, ms))

// ── Upload one file ────────────────────────────────────────────────────────────
async function uploadFile(localPath, storagePath) {
  const buffer = readFileSync(localPath)
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(storagePath, buffer, {
      contentType: 'image/png',
      upsert: true,
    })
  if (error) throw new Error(error.message)
  return `${BASE_URL}/${storagePath}`
}

// ── Main ───────────────────────────────────────────────────────────────────────
async function main() {
  console.log('\nGrundfos Asset Uploader')
  console.log(`Mode: ${TEST ? `TEST (${TEST_LIMIT} SKUs)` : 'FULL'} | ${CURVES_ONLY ? 'curves only' : DRAWINGS_ONLY ? 'drawings only' : 'curves + drawings'}`)

  if (SERVICE_ROLE_KEY === 'PASTE_YOUR_SERVICE_ROLE_KEY_HERE') {
    console.error('\n❌  Set SUPABASE_SERVICE_ROLE_KEY env variable first:')
    console.error('   $env:SUPABASE_SERVICE_ROLE_KEY="eyJ..."  # PowerShell')
    console.error('   export SUPABASE_SERVICE_ROLE_KEY="eyJ..."  # bash')
    process.exit(1)
  }

  const curveFiles   = DRAWINGS_ONLY ? [] : readdirSync(CURVES_DIR).filter(f => f.endsWith(CURVES_SUFFIX))
  const drawingFiles = CURVES_ONLY   ? [] : readdirSync(DRAWINGS_DIR).filter(f => f.endsWith('_drawing.png'))

  // Collect all unique SKUs
  const curveBySku   = Object.fromEntries(curveFiles.map(f   => [f.replace(CURVES_SUFFIX, ''),  f]))
  const drawingBySku = Object.fromEntries(drawingFiles.map(f => [f.replace('_drawing.png', ''), f]))

  let allSkus = [...new Set([...Object.keys(curveBySku), ...Object.keys(drawingBySku)])]
  if (TEST) allSkus = allSkus.slice(0, TEST_LIMIT)

  console.log(`\nSKUs to process: ${allSkus.length}`)

  let ok = 0, failed = 0
  const failures = []

  for (const sku of allSkus) {
    process.stdout.write(`  ${sku} ... `)
    const updates = {}

    try {
      // Upload curve
      if (curveBySku[sku] && !DRAWINGS_ONLY) {
        const localPath   = join(CURVES_DIR, curveBySku[sku])
        const storagePath = `curves/${sku}_curve.png`
        updates.curve_url = await uploadFile(localPath, storagePath)
      }

      // Upload drawing
      if (drawingBySku[sku] && !CURVES_ONLY) {
        const localPath   = join(DRAWINGS_DIR, drawingBySku[sku])
        const storagePath = `drawings/${sku}_drawing.png`
        updates.drawing_url = await uploadFile(localPath, storagePath)
      }

      // Update DB
      if (Object.keys(updates).length > 0) {
        const { error } = await supabase
          .from('products')
          .update(updates)
          .eq('sku', sku)
        if (error) throw new Error(`DB update failed: ${error.message}`)
      }

      const parts = []
      if (updates.curve_url)   parts.push('curve ✓')
      if (updates.drawing_url) parts.push('drawing ✓')
      console.log(parts.join(', ') || 'nothing to upload')
      ok++

    } catch (err) {
      console.log(`❌  ${err.message}`)
      failures.push({ sku, error: err.message })
      failed++
    }

    await sleep(100)  // be gentle on storage API
  }

  console.log(`\n── Summary ──────────────────────────────────────────────────────────`)
  console.log(`  OK      : ${ok}`)
  console.log(`  Failed  : ${failed}`)
  if (failures.length) {
    console.log('\nFailed SKUs:')
    failures.forEach(f => console.log(`  ${f.sku}: ${f.error}`))
  }
}

main().catch(console.error)
