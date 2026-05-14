/**
 * Import technical specs from technical_data.json → Supabase product_attributes
 *
 * Usage:
 *   node import-specs.mjs              # import all SKUs with specs
 *   node import-specs.mjs --test       # first 5 SKUs only
 *   node import-specs.mjs --sku=93074187,99199551  # specific SKUs only
 *
 * Requires: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY env variables
 *   set SUPABASE_URL=https://xxxx.supabase.co
 *   set SUPABASE_SERVICE_ROLE_KEY=eyJ...
 */

import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://avfvouczlgbtrhtqgokx.supabase.co'
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SERVICE_KEY) {
  console.error('❌  Set SUPABASE_SERVICE_ROLE_KEY env variable first:')
  console.error('   $env:SUPABASE_SERVICE_ROLE_KEY="eyJ..."  # PowerShell')
  console.error('   set SUPABASE_SERVICE_ROLE_KEY=eyJ...     # CMD')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
})

const DATA_FILE = join(__dirname, 'output', 'technical_data.json')

// CLI flags
const ARGS    = process.argv.slice(2)
const TEST    = ARGS.includes('--test')
const SKU_ARG = ARGS.find(a => a.startsWith('--sku='))
const ONLY_SKUS = SKU_ARG ? SKU_ARG.replace('--sku=', '').split(',').map(s => s.trim()) : null

// Labels to skip — not real technical specs
const SKIP_LABELS = new Set([
  'Toote nimi', 'Toote nr.', 'EAN number', 'Hind', 'Tootegrupp',
  'Product name', 'Product number', 'EAN', 'Price', 'Product group',
])

async function main() {
  console.log('\nGrundfos Spec Importer → Supabase product_attributes')

  const raw  = JSON.parse(readFileSync(DATA_FILE, 'utf-8'))
  let skus = ONLY_SKUS
    ? ONLY_SKUS
    : Object.keys(raw).filter(sku => raw[sku]?.specs?.length > 0)

  if (TEST) skus = skus.slice(0, 5)

  const modeLabel = ONLY_SKUS ? `TARGETED (${skus.length})` : TEST ? `TEST (5)` : `FULL (${skus.length})`
  console.log(`Mode   : ${modeLabel}\n`)

  let ok = 0, skipped = 0, failed = 0

  for (const sku of skus) {
    const entry = raw[sku]
    if (!entry?.specs?.length) { skipped++; continue }

    // Find product id by SKU
    const { data: prod, error: prodErr } = await supabase
      .from('products')
      .select('id')
      .eq('sku', sku)
      .single()

    if (prodErr || !prod) {
      console.log(`  ✗  ${sku} — not found in products table`)
      skipped++
      continue
    }

    // Filter and deduplicate specs
    const specs = entry.specs
      .filter(s => s.label && s.value && !SKIP_LABELS.has(s.label))
      .reduce((acc, s) => {
        if (!acc.find(a => a.attribute_name === s.label)) {
          acc.push({ product_id: prod.id, attribute_name: s.label, attribute_value: s.value })
        }
        return acc
      }, [])

    if (specs.length === 0) { skipped++; continue }

    // Delete existing attributes for this product, then insert fresh
    await supabase.from('product_attributes').delete().eq('product_id', prod.id)

    const { error: insErr } = await supabase.from('product_attributes').insert(specs)

    if (insErr) {
      console.log(`  ✗  ${sku} — insert error: ${insErr.message}`)
      failed++
    } else {
      console.log(`  ✓  ${sku} — ${specs.length} specs`)
      ok++
    }
  }

  console.log(`\n── Summary ${'─'.repeat(50)}`)
  console.log(`  Imported : ${ok}`)
  console.log(`  Skipped  : ${skipped}`)
  console.log(`  Failed   : ${failed}`)
}

main().catch(err => { console.error(err); process.exit(1) })
