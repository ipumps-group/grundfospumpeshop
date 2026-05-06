/**
 * Supabase Migration Script
 * Migrates all table data + storage from old project to new project.
 *
 * Run: node scripts/migrate-to-new-supabase.mjs
 */

import { createClient } from '@supabase/supabase-js'

// ── Credentials ───────────────────────────────────────────────────────────────
const OLD = {
  url: 'https://avfvouczlgbtrhtqgokx.supabase.co',
  key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2ZnZvdWN6bGdidHJodHFnb2t4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjE5MDk2NSwiZXhwIjoyMDg3NzY2OTY1fQ.075yZg1W37Z8c6qKfxrXZQPkP3aAuF9x8x2adSBwQrw',
}

const NEW = {
  url: 'https://sdqnzyfmanflslsjhytf.supabase.co',
  key: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNkcW56eWZtYW5mbHNsc2poeXRmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTU1MDY3NSwiZXhwIjoyMDkxMTI2Njc1fQ.H3LiyHS8ZEgoqGd3TYmPoINGGwneMffASgzML2Aei8k',
}

// ── Table migration order (respects foreign key dependencies) ─────────────────
const TABLES = [
  'profiles',
  'categories',
  'settings',
  'pages',
  'products',
  'product_attributes',
  'product_categories',
  'bulk_pricing',
  'product_documents',
  'addresses',
  'coupons',
  'orders',
  'order_items',
  'order_status_history',
  'coupon_usage',
  'contact_submissions',
  'attribute_name_translations',
  'ui_translations',
]

// ── Storage buckets ───────────────────────────────────────────────────────────
const BUCKETS = [
  { id: 'products', public: true },
  { id: 'pages', public: true },
  { id: 'product-documents', public: true },
]

const BATCH_SIZE = 1000

const oldDb = createClient(OLD.url, OLD.key, { auth: { persistSession: false } })
const newDb = createClient(NEW.url, NEW.key, { auth: { persistSession: false } })

// ── Helpers ───────────────────────────────────────────────────────────────────
function log(msg) { console.log(`[${new Date().toISOString()}] ${msg}`) }
function err(msg) { console.error(`[ERROR] ${msg}`) }

async function fetchAllRows(table) {
  let rows = []
  let from = 0
  while (true) {
    const { data, error } = await oldDb
      .from(table)
      .select('*')
      .range(from, from + BATCH_SIZE - 1)
    if (error) throw new Error(`Fetch ${table}: ${error.message}`)
    if (!data || data.length === 0) break
    rows = rows.concat(data)
    if (data.length < BATCH_SIZE) break
    from += BATCH_SIZE
  }
  return rows
}

async function insertRows(table, rows) {
  if (rows.length === 0) return
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE)
    const { error } = await newDb.from(table).insert(batch)
    if (error) throw new Error(`Insert ${table}: ${error.message}`)
  }
}

// ── Migrate tables ────────────────────────────────────────────────────────────
async function migrateTables() {
  log('=== MIGRATING TABLES ===')
  for (const table of TABLES) {
    try {
      const rows = await fetchAllRows(table)
      await insertRows(table, rows)
      log(`✓ ${table}: ${rows.length} rows`)
    } catch (e) {
      err(`${table}: ${e.message}`)
    }
  }
}

// ── Migrate storage ───────────────────────────────────────────────────────────
async function listAllFiles(bucket, folder = '') {
  const { data, error } = await oldDb.storage.from(bucket).list(folder, { limit: 1000 })
  if (error) throw new Error(`List ${bucket}/${folder}: ${error.message}`)
  if (!data) return []

  let files = []
  for (const item of data) {
    if (item.metadata) {
      // It's a file
      files.push(folder ? `${folder}/${item.name}` : item.name)
    } else {
      // It's a folder — recurse
      const subFiles = await listAllFiles(bucket, folder ? `${folder}/${item.name}` : item.name)
      files = files.concat(subFiles)
    }
  }
  return files
}

async function migrateStorage() {
  log('=== MIGRATING STORAGE ===')

  for (const bucket of BUCKETS) {
    // Create bucket in new project
    const { error: createErr } = await newDb.storage.createBucket(bucket.id, { public: bucket.public })
    if (createErr && !createErr.message.includes('already exists')) {
      err(`Create bucket ${bucket.id}: ${createErr.message}`)
      continue
    }
    log(`Bucket "${bucket.id}" ready`)

    // List all files
    let files = []
    try {
      files = await listAllFiles(bucket.id)
    } catch (e) {
      err(`Listing ${bucket.id}: ${e.message}`)
      continue
    }
    log(`  Found ${files.length} files in "${bucket.id}"`)

    let copied = 0
    let failed = 0
    for (const filePath of files) {
      try {
        // Download from old
        const { data: fileData, error: dlErr } = await oldDb.storage.from(bucket.id).download(filePath)
        if (dlErr) throw new Error(dlErr.message)

        // Upload to new
        const { error: ulErr } = await newDb.storage.from(bucket.id).upload(filePath, fileData, {
          upsert: true,
          contentType: fileData.type,
        })
        if (ulErr) throw new Error(ulErr.message)
        copied++
      } catch (e) {
        err(`  File ${filePath}: ${e.message}`)
        failed++
      }
    }
    log(`  ✓ ${bucket.id}: ${copied} copied, ${failed} failed`)
  }
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main() {
  log('Starting Supabase migration...')
  log(`OLD: ${OLD.url}`)
  log(`NEW: ${NEW.url}`)
  console.log()

  await migrateTables()
  console.log()
  await migrateStorage()
  console.log()
  log('Migration complete!')
  log('Next: update your Vercel environment variables to point to the new Supabase project.')
}

main().catch(e => { err(e.message); process.exit(1) })
