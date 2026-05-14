/**
 * Upload Grundfos PDFs to Supabase Storage and populate product_documents table.
 *
 * Usage:
 *   node scripts/upload-pdfs-to-supabase.mjs            # full run
 *   node scripts/upload-pdfs-to-supabase.mjs --resume   # skip already-uploaded files
 *   node scripts/upload-pdfs-to-supabase.mjs --test     # first 3 SKUs only
 *
 * Reads:  scripts/grundfos-scraper/output/pdf_manifest.json
 * Reads:  scripts/grundfos-scraper/output/pdfs/{sku}/{filename}.pdf
 * Writes: scripts/grundfos-scraper/output/upload_manifest.json  (resume checkpoint)
 */

import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import os from 'os'
import { execSync } from 'child_process'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// ─── Config ────────────────────────────────────────────────────────────────

const SUPABASE_URL      = 'https://avfvouczlgbtrhtqgokx.supabase.co'
const SERVICE_ROLE_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2ZnZvdWN6bGdidHJodHFnb2t4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjE5MDk2NSwiZXhwIjoyMDg3NzY2OTY1fQ.075yZg1W37Z8c6qKfxrXZQPkP3aAuF9x8x2adSBwQrw'
const BUCKET            = 'product-documents'
const CONCURRENCY       = 4   // overridden below to 1 when --skus flag is used
const SAVE_EVERY        = 20  // save upload manifest every N uploads

const MANIFEST_PATH        = path.join(__dirname, 'grundfos-scraper/output/pdf_manifest.json')
const PDFS_DIR             = path.join(__dirname, 'grundfos-scraper/output/pdfs')
const UPLOAD_MANIFEST_PATH = path.join(__dirname, 'grundfos-scraper/output/upload_manifest.json')

// ─── CLI flags ──────────────────────────────────────────────────────────────

const RESUME = process.argv.includes('--resume')
const TEST   = process.argv.includes('--test')

// --skus 97924244,97924245,... — only process these SKUs
const skusArg = process.argv.find(a => a.startsWith('--skus='))
const ONLY_SKUS = skusArg
  ? new Set(skusArg.replace('--skus=', '').split(',').map(s => s.trim()))
  : null

// ─── Init ──────────────────────────────────────────────────────────────────

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

const pdfManifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'))

let uploadManifest = {}
if (fs.existsSync(UPLOAD_MANIFEST_PATH)) {
  uploadManifest = JSON.parse(fs.readFileSync(UPLOAD_MANIFEST_PATH, 'utf8'))
}

function saveUploadManifest() {
  fs.writeFileSync(UPLOAD_MANIFEST_PATH, JSON.stringify(uploadManifest, null, 2))
}

function labelFromFilename(file) {
  return path.basename(file, '.pdf').replace(/_/g, ' ')
}

// ─── PDF compression via Ghostscript ───────────────────────────────────────

const GS_CMD = process.platform === 'win32' ? 'gswin64c' : 'gs'
const SIZE_LIMIT = 45 * 1024 * 1024 // 45 MB — compress anything approaching the 50MB cap

// Try progressively more aggressive compression levels until file fits
const COMPRESS_LEVELS = [
  { setting: '/ebook',  dpi: 150 },
  { setting: '/screen', dpi: 72  },
  { setting: '/screen', dpi: 72, extra: '-dColorImageResolution=50 -dGrayImageResolution=50 -dMonoImageResolution=100' },
]

function compressPdf(inputBuffer, level = 0) {
  if (level >= COMPRESS_LEVELS.length) return inputBuffer
  const { setting, extra = '' } = COMPRESS_LEVELS[level]
  const tmpInput  = path.join(os.tmpdir(), `gf_in_${Date.now()}.pdf`)
  const tmpOutput = path.join(os.tmpdir(), `gf_out_${Date.now()}.pdf`)
  try {
    fs.writeFileSync(tmpInput, inputBuffer)
    execSync(
      `"${GS_CMD}" -sDEVICE=pdfwrite -dCompatibilityLevel=1.4 -dPDFSETTINGS=${setting} ${extra} -dNOPAUSE -dQUIET -dBATCH -sOutputFile="${tmpOutput}" "${tmpInput}"`,
      { timeout: 120_000, stdio: 'pipe' }
    )
    const compressed = fs.readFileSync(tmpOutput)
    return compressed.length < inputBuffer.length ? compressed : inputBuffer
  } catch {
    return inputBuffer
  } finally {
    try { fs.unlinkSync(tmpInput)  } catch {}
    try { fs.unlinkSync(tmpOutput) } catch {}
  }
}

// ─── Build work list ────────────────────────────────────────────────────────

// Collect unique upload tasks: deduplicate by `file` path within each SKU
const tasks = []
let skuList = Object.keys(pdfManifest)
if (TEST) skuList = skuList.slice(0, 3)
if (ONLY_SKUS) skuList = skuList.filter(s => ONLY_SKUS.has(s))

for (const sku of skuList) {
  const data = pdfManifest[sku]
  if (!data?.pdfs?.length) continue

  const seenFiles = new Set()
  for (const pdf of data.pdfs) {
    if (!pdf.file) continue
    if (seenFiles.has(pdf.file)) continue
    seenFiles.add(pdf.file)

    // Use the original label; for "pdf-from-*" entries use the filename instead
    const label = pdf.label.startsWith('pdf-from-') ? labelFromFilename(pdf.file) : pdf.label

    tasks.push({ sku, file: pdf.file, label, storagePath: pdf.file, originalUrl: pdf.url })
  }
}

// Filter for resume
const pending = RESUME
  ? tasks.filter(t => !uploadManifest[t.storagePath])
  : tasks

console.log(`\nGroundfos PDF → Supabase Uploader`)
console.log(`Mode   : ${RESUME ? 'RESUME' : 'FULL'}${TEST ? ' | TEST' : ''}`)
console.log(`Files  : ${pending.length} to upload (${tasks.length - pending.length} already done)`)
console.log(`Bucket : ${BUCKET}\n`)

// ─── SKU → product_id cache ─────────────────────────────────────────────────

const productIdCache = {}
async function getProductId(sku) {
  if (productIdCache[sku] !== undefined) return productIdCache[sku]
  const { data } = await supabase.from('products').select('id').eq('sku', sku).single()
  productIdCache[sku] = data?.id ?? null
  return productIdCache[sku]
}

// ─── Upload worker ──────────────────────────────────────────────────────────

let uploaded = 0, skippedCount = 0, errorCount = 0
const total = pending.length

async function processTask(task, idx) {
  const localPath = path.join(PDFS_DIR, task.file)

  if (!fs.existsSync(localPath)) {
    process.stdout.write(`[${idx}/${total}] MISSING  ${task.storagePath}\n`)
    errorCount++
    return
  }

  try {
    let fileBuffer = fs.readFileSync(localPath)

    // Compress progressively until it fits under the limit
    let compressLevel = 0
    while (fileBuffer.length > SIZE_LIMIT && compressLevel < COMPRESS_LEVELS.length) {
      const beforeKB = Math.round(fileBuffer.length / 1024)
      const { setting } = COMPRESS_LEVELS[compressLevel]
      process.stdout.write(`[${idx}/${total}] COMPRESS L${compressLevel + 1} (${setting}) ${beforeKB}KB → ${task.storagePath}\n`)
      fileBuffer = compressPdf(fileBuffer, compressLevel)
      const afterKB = Math.round(fileBuffer.length / 1024)
      process.stdout.write(`[${idx}/${total}] COMPRESS L${compressLevel + 1} result: ${afterKB}KB\n`)
      compressLevel++
    }

    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(task.storagePath, fileBuffer, {
        contentType: 'application/pdf',
        upsert: true,
      })

    if (uploadError) {
      if (uploadError.message?.includes('maximum allowed size') && task.originalUrl) {
        // File too large even after compression — fall back to original Grundfos URL
        const sizeKB = Math.round(fileBuffer.length / 1024)
        process.stdout.write(`[${idx}/${total}] FALLBACK to original URL (${sizeKB}KB too large) — ${task.label}\n`)

        const productId = await getProductId(task.sku)
        await supabase.from('product_documents').upsert({
          sku: task.sku,
          product_id: productId,
          label: task.label,
          storage_path: task.storagePath,
          public_url: task.originalUrl,
        }, { onConflict: 'storage_path' })

        uploadManifest[task.storagePath] = { public_url: task.originalUrl, uploaded_at: new Date().toISOString(), fallback: true }
        uploaded++
        return
      }
      throw uploadError
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(task.storagePath)

    // Get product_id
    const productId = await getProductId(task.sku)

    // Upsert into product_documents
    const { error: dbError } = await supabase
      .from('product_documents')
      .upsert({
        sku: task.sku,
        product_id: productId,
        label: task.label,
        storage_path: task.storagePath,
        public_url: publicUrl,
      }, { onConflict: 'storage_path' })

    if (dbError) throw dbError

    uploadManifest[task.storagePath] = { public_url: publicUrl, uploaded_at: new Date().toISOString() }
    uploaded++

    const sizeKB = Math.round(fileBuffer.length / 1024)
    process.stdout.write(`[${idx}/${total}] OK  ${task.sku} — ${task.label.slice(0, 60)} (${sizeKB}KB)\n`)

  } catch (err) {
    process.stdout.write(`[${idx}/${total}] ERR ${task.storagePath}: ${err.message}\n`)
    errorCount++
  }

  if ((uploaded + errorCount) % SAVE_EVERY === 0) saveUploadManifest()
}

// ─── Run with concurrency ───────────────────────────────────────────────────

async function runQueue() {
  let i = 0
  const concurrency = ONLY_SKUS ? 1 : CONCURRENCY
  const workers = Array.from({ length: concurrency }, async () => {
    while (i < pending.length) {
      const idx = ++i
      const task = pending[idx - 1]
      await processTask(task, idx)
    }
  })
  await Promise.all(workers)
}

await runQueue()
saveUploadManifest()

console.log(`\n${'─'.repeat(60)}`)
console.log(`Uploaded : ${uploaded}`)
console.log(`Errors   : ${errorCount}`)
console.log(`Total    : ${uploaded + errorCount}/${total}`)
console.log(`\nUpload manifest saved to:\n  ${UPLOAD_MANIFEST_PATH}`)
