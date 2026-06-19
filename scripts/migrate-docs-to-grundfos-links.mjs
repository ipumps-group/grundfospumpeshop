/**
 * Migrate product_documents from Supabase storage → original api.grundfos.com links
 *
 * For every document that is stored as an uploaded file in Supabase:
 *  1. Look up the original Grundfos URL from pdf_manifest.json (matched by storage_path)
 *  2. Update the DB record: set public_url = original URL, storage_path = null
 *  3. Delete the file from Supabase storage
 *
 * Documents that already point to an external URL (fallbacks from upload script)
 * are also cleaned up: storage_path is set to null.
 *
 * Usage:
 *   node scripts/migrate-docs-to-grundfos-links.mjs           # dry-run (no changes)
 *   node scripts/migrate-docs-to-grundfos-links.mjs --commit  # apply changes
 */

import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { SUPABASE_URL as _SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } from './env.mjs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

if (!_SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing env vars: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

// ─── Config ────────────────────────────────────────────────────────────────
const SUPABASE_URL     = _SUPABASE_URL
const SERVICE_ROLE_KEY = SUPABASE_SERVICE_ROLE_KEY
const BUCKET           = 'product-documents'
const MANIFEST_PATH    = path.join(__dirname, 'grundfos-scraper/output/pdf_manifest.json')
const SUPABASE_STORAGE_URL = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/`

const COMMIT = process.argv.includes('--commit')

// ─── Init ──────────────────────────────────────────────────────────────────
const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

// Build map: storagePath → originalUrl
const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'))
const urlByStoragePath = {}
for (const entry of Object.values(manifest)) {
  if (!entry.pdfs) continue
  const seen = new Set()
  for (const pdf of entry.pdfs) {
    if (!pdf.file || !pdf.url) continue
    if (seen.has(pdf.file)) continue
    seen.add(pdf.file)
    urlByStoragePath[pdf.file] = pdf.url
  }
}
console.log(`Manifest entries loaded: ${Object.keys(urlByStoragePath).length} storage paths mapped`)

// ─── Fetch all documents with a storage_path ───────────────────────────────
const { data: docs, error } = await supabase
  .from('product_documents')
  .select('id, sku, label, storage_path, public_url')
  .not('storage_path', 'is', null)
  .limit(10000)

if (error) { console.error('Failed to fetch documents:', error.message); process.exit(1) }
console.log(`Documents with storage_path in DB: ${docs.length}\n`)

// ─── Process each document ─────────────────────────────────────────────────
let matched = 0, alreadyExternal = 0, unmatched = 0, errors = 0

const unmatchedList = []

for (const doc of docs) {
  const isAlreadyExternal = !doc.public_url.startsWith(SUPABASE_STORAGE_URL)
  const originalUrl = urlByStoragePath[doc.storage_path]

  if (isAlreadyExternal) {
    // Already points to grundfos — just need to clear storage_path
    console.log(`[EXTERNAL] ${doc.storage_path}`)
    console.log(`           URL already: ${doc.public_url}`)
    alreadyExternal++

    if (COMMIT) {
      // Try to remove file from storage (may not exist for fallbacks)
      await supabase.storage.from(BUCKET).remove([doc.storage_path])
      // storage_path will be cleared by the SQL migration (storage_path = NULL where external URL)
      console.log(`  ✓ storage_path will be cleared by SQL migration`)
    }

  } else if (originalUrl) {
    // Has a Supabase-hosted file AND we know the original URL
    console.log(`[MIGRATE ] ${doc.storage_path}`)
    console.log(`           → ${originalUrl}`)
    matched++

    if (COMMIT) {
      const { error: storageErr } = await supabase.storage.from(BUCKET).remove([doc.storage_path])
      if (storageErr) console.warn(`  ⚠ Storage delete: ${storageErr.message}`)
      else console.log(`  ✓ Storage file deleted`)

      // Update public_url only — storage_path will be cleared by the SQL migration
      const { error: dbErr } = await supabase
        .from('product_documents')
        .update({ public_url: originalUrl })
        .eq('id', doc.id)
      if (dbErr) { console.error(`  ✗ DB update failed: ${dbErr.message}`); errors++ }
      else console.log(`  ✓ DB updated (public_url → grundfos link)`)
    }

  } else {
    // Supabase-hosted but not in manifest — needs manual attention
    console.log(`[UNMATCHED] ${doc.storage_path} (SKU: ${doc.sku}, label: "${doc.label}")`)
    unmatched++
    unmatchedList.push({ id: doc.id, sku: doc.sku, label: doc.label, storage_path: doc.storage_path, public_url: doc.public_url })
  }
}

// ─── Summary ───────────────────────────────────────────────────────────────
console.log(`\n${'─'.repeat(60)}`)
console.log(COMMIT ? 'CHANGES APPLIED' : 'DRY-RUN (use --commit to apply)')
console.log(`─`.repeat(60))
console.log(`Already external URL (storage_path cleared) : ${alreadyExternal}`)
console.log(`Migrated to original Grundfos URL           : ${matched}`)
console.log(`Unmatched (not in manifest)                 : ${unmatched}`)
if (errors > 0) console.log(`Errors                                      : ${errors}`)
console.log(`─`.repeat(60))

if (unmatchedList.length > 0) {
  console.log(`\nUnmatched documents — set URL manually in admin:`)
  for (const u of unmatchedList) {
    console.log(`  [id:${u.id}] SKU ${u.sku} — "${u.label}"`)
    console.log(`    storage: ${u.storage_path}`)
    console.log(`    current: ${u.public_url}`)
  }
}

if (!COMMIT) {
  console.log(`\nRun with --commit to apply all changes.`)
}
