import { NextRequest, NextResponse } from 'next/server'
import ExcelJS from 'exceljs'
import { supabaseAdmin } from '@/lib/supabase-admin'

// GET /api/haldus/export — exports all products as a formatted .xlsx file

export async function GET(req: NextRequest) {
  // ── Auth ───────────────────────────────────────────────────────────────────
  const token = (req.headers.get('authorization') ?? '').replace('Bearer ', '').trim()
  if (token) {
    const { data: { user } } = await supabaseAdmin.auth.getUser(token)
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const { data: profile } = await supabaseAdmin
      .from('profiles').select('role').eq('id', user.id).single()
    if (profile?.role !== 'superadmin')
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // ── Fetch data ─────────────────────────────────────────────────────────────
  const [
    { data: products, error },
    { data: pcs },
    { data: cats },
    { data: docsRaw },
  ] = await Promise.all([
    supabaseAdmin
      .from('products')
      .select('id, sku, name, short_description_et, price, sale_price, in_stock, published, image_url, weight_kg, length_cm, width_cm, height_cm, slug, tags, importance, curve_url, drawing_url, category_gf, url_gf')
      .order('name').limit(10000),
    supabaseAdmin.from('product_categories').select('product_id, category_slug').limit(10000),
    supabaseAdmin.from('categories').select('slug, name_et').limit(1000),
    supabaseAdmin.from('product_documents').select('sku, label').order('label').limit(50000),
  ])

  // Fetch all attributes via pagination (PostgREST max_rows=1000 per request)
  const attrs: Array<{ product_id: string; attribute_name: string; attribute_value: string }> = []
  let from = 0
  while (true) {
    const { data: batch, error: bErr } = await supabaseAdmin
      .from('product_attributes')
      .select('product_id, attribute_name, attribute_value')
      .order('attribute_name')
      .range(from, from + 999)
    if (bErr || !batch || batch.length === 0) break
    attrs.push(...batch)
    if (batch.length < 1000) break
    from += 1000
  }

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // ── Lookup maps ────────────────────────────────────────────────────────────
  const catMap   = Object.fromEntries((cats ?? []).map(c  => [c.slug,       c.name_et]))
  const pcMap    = Object.fromEntries((pcs  ?? []).map(pc => [String(pc.product_id), pc.category_slug]))

  // Group documents by SKU
  const docsBySku: Record<string, string[]> = {}
  for (const d of (docsRaw ?? [])) {
    if (!docsBySku[d.sku]) docsBySku[d.sku] = []
    docsBySku[d.sku].push(d.label)
  }

  // Group attributes by product_id
  const attrsByProduct: Record<string, Array<{ name: string; value: string }>> = {}
  for (const a of (attrs ?? [])) {
    const pid = String(a.product_id)
    if (!attrsByProduct[pid]) attrsByProduct[pid] = []
    attrsByProduct[pid].push({ name: a.attribute_name, value: a.attribute_value })
  }

  // Collect all unique attribute names (sorted) for column headers
  const allAttrNames = Array.from(
    new Set((attrs ?? []).map(a => a.attribute_name))
  ).sort((a, b) => a.localeCompare(b, 'et'))

  // ── Build workbook ─────────────────────────────────────────────────────────
  const wb = new ExcelJS.Workbook()
  wb.creator  = 'iPumps'
  wb.created  = new Date()
  wb.modified = new Date()

  // ── Single sheet: all product data + technical attributes ──────────────────
  const ws = wb.addWorksheet('Tooted', {
    views: [{ state: 'frozen', xSplit: 2, ySplit: 1 }],  // freeze SKU + Nimi columns + header row
  })

  const BLUE         = '003366'
  const WHITE        = 'FFFFFF'
  const GREEN_LIGHT  = 'E8F5E9'
  const BLUE_LIGHT   = 'E3F0FB'
  const GRAY_LIGHT   = 'F5F5F5'
  const ORANGE_LIGHT = 'FFF3E0'
  const PURPLE_LIGHT = 'F3E5F5'

  // Fixed columns (SKU and Name first — they will be frozen)
  const FIXED_COLS: { key: string; header: string; width: number }[] = [
    { key: 'sku',          header: 'SKU',                  width: 14  },
    { key: 'name',         header: 'Nimi',                 width: 40  },
    { key: 'category',     header: 'Kategooria',           width: 24  },
    { key: 'importance',   header: 'Tähtsus (1–10)',       width: 14  },
    { key: 'price',        header: 'Hind (€)',             width: 12  },
    { key: 'sale_price',   header: 'Müügihind (€)',        width: 14  },
    { key: 'in_stock',     header: 'Laos',                 width: 10  },
    { key: 'published',    header: 'Avaldatud',            width: 12  },
    { key: 'short_desc',   header: 'Lühikirjeldus',        width: 50  },
    { key: 'tags',         header: 'Sildid',               width: 40  },
    { key: 'weight_kg',    header: 'Kaal (kg)',            width: 12  },
    { key: 'length_cm',    header: 'Pikkus (cm)',          width: 12  },
    { key: 'width_cm',     header: 'Laius (cm)',           width: 12  },
    { key: 'height_cm',    header: 'Kõrgus (cm)',          width: 12  },
    { key: 'slug',         header: 'Slug',                 width: 44  },
    { key: 'image_url',    header: 'Pilt URL',             width: 60  },
    { key: 'curve_url',    header: 'Kõver URL',            width: 60  },
    { key: 'drawing_url',  header: 'Joonis URL',           width: 60  },
    { key: 'category_gf',  header: 'Grundfos kategooria',  width: 28  },
    { key: 'url_gf',       header: 'Grundfos URL',         width: 70  },
    { key: 'docs_count',   header: 'Dok arv',              width: 10  },
    { key: 'docs_labels',  header: 'Dokumendid',           width: 80  },
  ]

  // Dynamic attribute columns appended after fixed columns
  const ATTR_COLS: { key: string; header: string; width: number }[] = allAttrNames.map(n => ({
    key: `attr__${n}`, header: n, width: 22,
  }))

  const COLS = [...FIXED_COLS, ...ATTR_COLS]

  ws.columns = COLS.map(c => ({ key: c.key, header: c.header, width: c.width }))

  // ── Header styling ─────────────────────────────────────────────────────────
  const headerRow = ws.getRow(1)
  headerRow.height = 22

  COLS.forEach((col, i) => {
    const cell = headerRow.getCell(i + 1)
    // Attribute columns get a slightly different header colour to distinguish them
    const isAttr = col.key.startsWith('attr__')
    cell.font      = { bold: true, color: { argb: WHITE }, name: 'Arial', size: 10 }
    cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: isAttr ? '4A235A' : BLUE } }
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: false }
    cell.border    = {
      bottom: { style: 'thin', color: { argb: '5580AA' } },
      right:  { style: 'thin', color: { argb: '5580AA' } },
    }
  })

  ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: COLS.length } }

  // ── Importance colour scale helper ─────────────────────────────────────────
  function importanceColour(v: number | null): string {
    if (!v) return GRAY_LIGHT
    if (v >= 8) return 'C8E6C9'
    if (v >= 6) return 'DCEDC8'
    if (v >= 4) return 'FFF9C4'
    if (v >= 2) return 'FFE0B2'
    return 'FFCDD2'
  }

  // ── Data rows ──────────────────────────────────────────────────────────────
  const priceFormat = '#,##0.00 "€"'
  const boolLabel   = (v: boolean) => v ? 'Jah' : 'Ei'

  ;(products ?? []).forEach(p => {
    const prodId  = String(p.id)
    const catSlug = pcMap[prodId] ?? ''
    const catName = catMap[catSlug] ?? catSlug
    const pAttrs  = attrsByProduct[prodId] ?? []
    const attrMap = Object.fromEntries(pAttrs.map(a => [a.name, a.value]))
    const pDocs   = docsBySku[p.sku ?? ''] ?? []

    const rowData: Record<string, string | number | null> = {
      sku:         p.sku         ?? '',
      name:        p.name        ?? '',
      category:    catName,
      importance:  p.importance  ?? null,
      price:       p.price       ?? null,
      sale_price:  p.sale_price  ?? null,
      in_stock:    boolLabel(p.in_stock),
      published:   boolLabel(p.published),
      short_desc:  p.short_description_et ?? '',
      tags:        p.tags        ?? '',
      weight_kg:   p.weight_kg   ?? null,
      length_cm:   p.length_cm   ?? null,
      width_cm:    p.width_cm    ?? null,
      height_cm:   p.height_cm   ?? null,
      slug:        p.slug        ?? '',
      image_url:   p.image_url   ?? '',
      curve_url:   p.curve_url   ?? '',
      drawing_url: p.drawing_url ?? '',
      category_gf: p.category_gf ?? '',
      url_gf:      p.url_gf      ?? '',
      docs_count:  pDocs.length || null,
      docs_labels: pDocs.join('; ') || '',
    }
    for (const n of allAttrNames) rowData[`attr__${n}`] = attrMap[n] ?? ''

    const row = ws.addRow(rowData)
    row.height    = 18
    row.font      = { name: 'Arial', size: 10 }
    row.alignment = { vertical: 'middle' }

    // Price formatting
    const priceCol     = COLS.findIndex(c => c.key === 'price')     + 1
    const salePriceCol = COLS.findIndex(c => c.key === 'sale_price') + 1
    row.getCell(priceCol).numFmt     = priceFormat
    row.getCell(salePriceCol).numFmt = priceFormat

    // Column background colours
    COLS.forEach((col, i) => {
      const cell = row.getCell(i + 1)
      let bg = 'FFFFFF'
      if (col.key === 'sku')                                        bg = GRAY_LIGHT
      else if (col.key === 'name')                                  bg = GRAY_LIGHT
      else if (['price', 'sale_price'].includes(col.key))           bg = GREEN_LIGHT
      else if (['category', 'tags'].includes(col.key))              bg = BLUE_LIGHT
      else if (['curve_url', 'drawing_url'].includes(col.key))      bg = ORANGE_LIGHT
      else if (['docs_count', 'docs_labels'].includes(col.key))    bg = 'E0F7FA'
      else if (col.key.startsWith('attr__'))                        bg = PURPLE_LIGHT
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: bg } }
    })

    // Importance cell
    const impIdx  = COLS.findIndex(c => c.key === 'importance') + 1
    const impCell = row.getCell(impIdx)
    impCell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: importanceColour(p.importance ?? null) } }
    impCell.alignment = { horizontal: 'center', vertical: 'middle' }
    impCell.font      = { bold: true, name: 'Arial', size: 10 }

    // Stock cell
    const stockIdx  = COLS.findIndex(c => c.key === 'in_stock') + 1
    const stockCell = row.getCell(stockIdx)
    stockCell.font      = { bold: true, color: { argb: p.in_stock ? '2E7D32' : 'C62828' }, name: 'Arial', size: 10 }
    stockCell.alignment = { horizontal: 'center', vertical: 'middle' }

    // Docs count — centered and bold if > 0
    const docsCountIdx = COLS.findIndex(c => c.key === 'docs_count') + 1
    const docsCountCell = row.getCell(docsCountIdx)
    docsCountCell.alignment = { horizontal: 'center', vertical: 'middle' }
    if (pDocs.length > 0) docsCountCell.font = { bold: true, name: 'Arial', size: 10 }

    // Docs labels — wrap text
    const docsLabelsIdx = COLS.findIndex(c => c.key === 'docs_labels') + 1
    row.getCell(docsLabelsIdx).alignment = { vertical: 'top', wrapText: false }

    // SKU bold
    row.getCell(1).font = { bold: true, name: 'Arial', size: 10 }
  })

  // ── Serialise and return ───────────────────────────────────────────────────
  const buffer = await wb.xlsx.writeBuffer()
  const date   = new Date().toISOString().slice(0, 10)

  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      'Content-Type':        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="tooted-${date}.xlsx"`,
    },
  })
}
