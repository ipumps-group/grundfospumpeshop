import { createClient } from '@supabase/supabase-js'
import XLSX from 'xlsx'
import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } from './env.mjs'

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing env vars: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

const FILE = fileURLToPath(new URL('tooted-2026-06-01_kategooria_seeria_esiletostetud.xlsx', import.meta.url))

const CATEGORY_MAP = {
  'Küte': 'kuttepumbad',
  'Puurkaev': 'puurkaevupumbad',
  'Rõhutõste': 'rohutostepumbad',
  'Salvkaev': 'salvkaevupumbad',
  'Drenaaz': 'drenaazipumbad',
  'Reovesi': 'reoveepumbad',
  'Sooja tarbevee tsirkulatsioon': 'tsirkulatsioonipumbad-soe-tarbevesi',
  'Veeautomaat': 'veeautomaadid',
}

async function ensureActivityArea(slug) {
  const { data } = await supabase.from('activity_areas').select('id').eq('slug', slug).maybeSingle()
  return data
}

async function ensureProductSeries(slug, name, areaId) {
  // First try by slug
  let { data: existing } = await supabase.from('product_series').select('id').eq('slug', slug).maybeSingle()
  if (existing) return existing

  // Then try by series_code (unique constraint)
  const series_code = name.replace(/[^A-Za-z0-9]/g, '').toUpperCase().substring(0, 20)
  const { data: existingByCode } = await supabase.from('product_series').select('id').eq('series_code', series_code).maybeSingle()
  if (existingByCode) return existingByCode

  const { data, error } = await supabase.from('product_series').insert({
    slug,
    name,
    series_code,
    sort_order: 50,
    primary_activity_area_id: areaId,
    is_active: true,
  }).select('id').maybeSingle()

  if (error) {
    console.log(`  DEBUG insert error: ${error.message} (slug=${slug}, code=${series_code})`)
    return null
  }
  return data
}

async function ensureSeriesActivityArea(seriesId, areaId) {
  const { data: existing } = await supabase
    .from('series_activity_areas')
    .select('series_id, activity_area_id')
    .eq('series_id', seriesId)
    .eq('activity_area_id', areaId)
    .maybeSingle()
  if (!existing) {
    await supabase.from('series_activity_areas').insert({ series_id: seriesId, activity_area_id: areaId })
  }
}

async function getSeriesName(name) {
  const slug = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
  return { slug, name }
}

async function main() {
  console.log('Reading Excel file...')
  const workbook = XLSX.readFile(FILE)
  const sheet = workbook.Sheets[workbook.SheetNames[0]]
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1 })

  console.log(`Total rows: ${rows.length}`)
  let updated = 0
  let skipped = 0
  let created = 0
  let errors = 0

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i]
    if (!row || row.length < 5) continue

    const sku = String(row[0] || '').trim()
    const name = String(row[1] || '').trim()
    const catRaw = String(row[2] || '').trim()
    const seriesName = String(row[3] || '').trim()
    const featured = String(row[4] || '').trim()
    const importance = row[5] !== undefined ? String(row[5]) : ''
    const shortDesc = String(row[10] || '').trim()
    const tags = String(row[11] || '').trim()
    const weight = row[12] !== undefined ? Number(row[12]) : null
    const length_cm = row[13] !== undefined ? Number(row[13]) : null
    const width = row[14] !== undefined ? Number(row[14]) : null
    const height = row[15] !== undefined ? Number(row[15]) : null
    const slug = String(row[16] || '').trim()
    const imageUrl = String(row[17] || '').trim()
    const curveUrl = String(row[18] || '').trim()
    const drawingUrl = String(row[19] || '').trim()
    const gfCat = String(row[20] || '').trim()
    const gfUrl = String(row[21] || '').trim()

    // Skip header row
    if (catRaw === 'Kategooria') {
      console.log(`  Row ${i + 1}: SKIP (header row)`)
      skipped++
      continue
    }

    if (!sku) {
      skipped++
      continue
    }

    console.log(`\nRow ${i + 1}: SKU=${sku} Name=${name} Cat=${catRaw} Series=${seriesName}`)

    // Parse categories (comma-separated)
    const catParts = catRaw.split(',').map(c => c.trim()).filter(Boolean)
    const areaSlugs = catParts.map(c => CATEGORY_MAP[c]).filter(Boolean)

    if (areaSlugs.length === 0) {
      console.log(`  SKIP: No matching category for "${catRaw}"`)
      skipped++
      continue
    }

    // Get series slug
    const seriesSlug = seriesName
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .replace(/-kpl$/, '')

    // Ensure activity areas and series exist
    const primarySlug = areaSlugs[0]
    const primaryArea = await ensureActivityArea(primarySlug)
    if (!primaryArea) {
      console.log(`  ERROR: Activity area "${primarySlug}" not found`)
      errors++
      continue
    }

    const series = await ensureProductSeries(seriesSlug, seriesName, primaryArea.id)
    if (!series) {
      console.log(`  ERROR: Could not create/find series "${seriesSlug}"`)
      errors++
      continue
    }

    // Link series to all categories
    for (const areaSlug of areaSlugs) {
      const area = await ensureActivityArea(areaSlug)
      if (area) {
        await ensureSeriesActivityArea(series.id, area.id)
      }
    }

    // Find existing product
    const { data: existingProducts } = await supabase
      .from('products')
      .select('id, price, sale_price')
      .eq('sku', sku)

    const productData = {
      name,
      slug: slug || undefined,
      short_description_et: shortDesc || null,
      tags: tags || null,
      weight_kg: isNaN(weight) ? null : weight,
      length_cm: isNaN(length_cm) ? null : length_cm,
      width_cm: isNaN(width) ? null : width,
      height_cm: isNaN(height) ? null : height,
      image_url: imageUrl || null,
      curve_url: curveUrl || null,
      drawing_url: drawingUrl || null,
      category_gf: gfCat || null,
      url_gf: gfUrl || null,
      series_slug: seriesSlug,
      primary_activity_area_slug: primarySlug,
      importance: importance ? Number(importance) : 5,
      published: true,
      in_stock: true,
    }

    let productId = null

    if (existingProducts && existingProducts.length > 0) {
      // Keep existing prices
      const existing = existingProducts[0]
      productId = existing.id
      const { error } = await supabase
        .from('products')
        .update(productData)
        .eq('id', existing.id)

      if (error) {
        console.log(`  ERROR updating ${sku}: ${error.message}`)
        errors++
        continue
      } else {
        console.log(`  UPDATED ${sku} (kept price: ${existing.price})`)
        updated++
      }
    } else {
      const { data: inserted, error } = await supabase
        .from('products')
        .insert(productData)
        .select('id')
        .single()

      if (error) {
        console.log(`  ERROR inserting ${sku}: ${error.message}`)
        errors++
        continue
      } else {
        productId = inserted.id
        console.log(`  CREATED ${sku}`)
        created++
      }
    }

    // Handle featured (Esiletõstetud) — manage product_categories with 'esiletostetud'
    const FEATURED_SLUG = 'esiletostetud'
    if (featured === 'Jah' || featured === 'jAH' || featured === 'Yes') {
      const { data: existingFeatured } = await supabase
        .from('product_categories')
        .select('product_id')
        .eq('product_id', productId)
        .eq('category_slug', FEATURED_SLUG)
        .single()
      if (!existingFeatured) {
        await supabase.from('product_categories').insert({ product_id: productId, category_slug: FEATURED_SLUG })
        console.log(`  FEATURED added`)
      }
    } else {
      await supabase
        .from('product_categories')
        .delete()
        .eq('product_id', productId)
        .eq('category_slug', FEATURED_SLUG)
    }
  }

  console.log(`\n=== DONE ===`)
  console.log(`Updated: ${updated}`)
  console.log(`Created: ${created}`)
  console.log(`Skipped: ${skipped}`)
  console.log(`Errors: ${errors}`)
  process.exit(0)
}

main().catch(e => { console.error(e); process.exit(1) })
