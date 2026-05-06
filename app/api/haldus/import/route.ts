import { NextRequest, NextResponse } from 'next/server'
import ExcelJS from 'exceljs'
import { supabaseAdmin } from '@/lib/supabase-admin'

// POST /api/haldus/import — streams SSE progress while importing
// Events: { phase, msg?, current?, total?, pct?, updated?, unchanged?, skipped?, errors?, total_errors? }

const BOOL_FALSE = new Set(['false', '0', 'ei', 'otsas', 'no'])

function parseBool(v: unknown): boolean {
  if (typeof v === 'boolean') return v
  if (typeof v === 'number') return v !== 0
  return !BOOL_FALSE.has(String(v ?? '').toLowerCase().trim())
}

function parseNum(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null
  const n = parseFloat(String(v).replace(',', '.'))
  return isNaN(n) ? null : n
}

function parseStr(v: unknown): string | null {
  const s = String(v ?? '').trim()
  return s === '' ? null : s
}

function eq(a: unknown, b: unknown): boolean {
  if (a === b) return true
  if (a == null && b == null) return true
  if (a == null || b == null) return false
  return String(a) === String(b)
}

const HEADER_TO_FIELD: Record<string, string> = {
  'SKU': 'sku', 'Nimi': 'name', 'Kategooria': 'category',
  'Tähtsus (1–10)': 'importance', 'Hind (€)': 'price', 'Müügihind (€)': 'sale_price',
  'Laos': 'in_stock', 'Avaldatud': 'published', 'Lühikirjeldus': 'short_description_et',
  'Sildid': 'tags', 'Kaal (kg)': 'weight_kg', 'Pikkus (cm)': 'length_cm',
  'Laius (cm)': 'width_cm', 'Kõrgus (cm)': 'height_cm', 'Slug': 'slug',
  'Pilt URL': 'image_url', 'Kõver URL': 'curve_url', 'Joonis URL': 'drawing_url',
  'Grundfos kategooria': 'category_gf', 'Grundfos URL': 'url_gf',
}
const FIXED_KEYS = new Set(Object.keys(HEADER_TO_FIELD))

export async function POST(req: NextRequest) {
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

  // ── Parse file before stream starts ───────────────────────────────────────
  let arrayBuf: ArrayBuffer
  try {
    const form = await req.formData()
    const file = form.get('file') as File | null
    if (!file) return NextResponse.json({ error: 'Fail puudub' }, { status: 400 })
    arrayBuf = await file.arrayBuffer()
  } catch {
    return NextResponse.json({ error: 'Faili lugemine ebaõnnestus' }, { status: 400 })
  }

  // ── Stream processing ─────────────────────────────────────────────────────
  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      const push = (data: object) => {
        try { controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`)) }
        catch { /* stream closed */ }
      }

      try {
        // Phase 1: read xlsx
        push({ phase: 'reading', msg: 'Loeb xlsx faili...' })

        const wb = new ExcelJS.Workbook()
        await wb.xlsx.load(arrayBuf)
        const ws = wb.worksheets[0]
        if (!ws) { push({ phase: 'error', msg: 'Tühi fail — töölehte ei leitud' }); return }

        const headerRow = ws.getRow(1)
        const headers: string[] = []
        headerRow.eachCell({ includeEmpty: true }, (cell, col) => {
          headers[col - 1] = String(cell.value ?? '').trim()
        })

        const colMap: Array<{ type: 'fixed' | 'attr'; field: string }> = headers.map(h => {
          if (HEADER_TO_FIELD[h]) return { type: 'fixed', field: HEADER_TO_FIELD[h] }
          if (h && !FIXED_KEYS.has(h)) return { type: 'attr', field: h }
          return { type: 'fixed', field: '' }
        })
        const hasAttrCols = colMap.some(c => c.type === 'attr')
        const skuIdx = headers.indexOf('SKU')

        const rows: { sku: string; cells: unknown[] }[] = []
        for (let r = 2; r <= ws.rowCount; r++) {
          const row = ws.getRow(r)
          const cells: unknown[] = []
          row.eachCell({ includeEmpty: true }, (cell, col) => { cells[col - 1] = cell.value })
          const sku = parseStr(cells[skuIdx])
          if (sku) rows.push({ sku, cells })
        }

        push({ phase: 'reading', msg: `Failis ${rows.length} rida` })

        // Phase 2: batch fetch DB state
        push({ phase: 'fetching', msg: 'Laeb tooted andmebaasist...' })

        const { data: dbProducts } = await supabaseAdmin
          .from('products')
          .select('id, sku, name, slug, short_description_et, tags, image_url, curve_url, drawing_url, category_gf, url_gf, price, sale_price, weight_kg, length_cm, width_cm, height_cm, importance, in_stock, published')
          .in('sku', rows.map(r => r.sku))

        const productBySku = Object.fromEntries((dbProducts ?? []).map(p => [p.sku ?? '', p]))
        const productIds = (dbProducts ?? []).map(p => p.id as number)

        push({ phase: 'fetching', msg: `Leitud ${dbProducts?.length ?? 0} toodet — laeb tehnilisi andmeid...` })

        const allCurrentAttrs: Array<{ product_id: number; attribute_name: string; attribute_value: string }> = []
        if (hasAttrCols && productIds.length > 0) {
          let from = 0
          while (true) {
            const { data: batch } = await supabaseAdmin
              .from('product_attributes')
              .select('product_id, attribute_name, attribute_value')
              .in('product_id', productIds)
              .range(from, from + 999)
            if (!batch || batch.length === 0) break
            allCurrentAttrs.push(...batch)
            if (batch.length < 1000) break
            from += 1000
          }
        }

        const currentAttrsByPid: Record<number, Record<string, string>> = {}
        for (const a of allCurrentAttrs) {
          if (!currentAttrsByPid[a.product_id]) currentAttrsByPid[a.product_id] = {}
          currentAttrsByPid[a.product_id][a.attribute_name] = a.attribute_value
        }

        push({ phase: 'fetching', msg: `Andmed laetud — alustan võrdlemist...` })

        // Phase 3: process rows
        let updated = 0, skipped = 0, unchanged = 0
        const errors: string[] = []
        const total = rows.length

        for (let i = 0; i < total; i++) {
          const { sku, cells } = rows[i]
          const pct = Math.round(((i + 1) / total) * 100)

          // Send progress every 5 rows
          if (i % 5 === 0 || i === total - 1) {
            push({ phase: 'processing', current: i + 1, total, pct, msg: `Töötlen toodet ${i + 1} / ${total}` })
          }

          const prod = productBySku[sku]
          if (!prod) { skipped++; continue }

          const productUpdate: Record<string, unknown> = {}
          const attrUpdates: Array<{ name: string; value: string }> = []

          colMap.forEach((col, ci) => {
            if (!col.field || col.field === 'category') return
            const raw = cells[ci]
            if (col.type === 'fixed') {
              switch (col.field) {
                case 'sku': break
                case 'slug': case 'name': case 'short_description_et': case 'tags':
                case 'image_url': case 'curve_url': case 'drawing_url':
                case 'category_gf': case 'url_gf':
                  productUpdate[col.field] = parseStr(raw); break
                case 'price': case 'sale_price': case 'weight_kg': case 'length_cm':
                case 'width_cm': case 'height_cm': case 'importance':
                  productUpdate[col.field] = parseNum(raw); break
                case 'in_stock': case 'published':
                  productUpdate[col.field] = parseBool(raw); break
              }
            } else if (col.type === 'attr') {
              const val = parseStr(raw)
              if (val) attrUpdates.push({ name: col.field, value: val })
            }
          })

          const prodChanged = Object.entries(productUpdate).some(
            ([k, v]) => !eq((prod as Record<string, unknown>)[k], v)
          )

          let attrsChanged = false
          if (hasAttrCols) {
            const cur = currentAttrsByPid[prod.id as number] ?? {}
            const newMap = Object.fromEntries(attrUpdates.map(a => [a.name, a.value]))
            const curKeys = Object.keys(cur).sort()
            const newKeys = Object.keys(newMap).sort()
            attrsChanged = curKeys.join() !== newKeys.join() || curKeys.some(k => cur[k] !== newMap[k])
          }

          if (!prodChanged && !attrsChanged) { unchanged++; continue }

          try {
            if (prodChanged) {
              const { error: pErr } = await supabaseAdmin
                .from('products')
                .update({ ...productUpdate, updated_at: new Date().toISOString() })
                .eq('id', prod.id)
              if (pErr) { errors.push(`${sku}: ${pErr.message}`); continue }
            }
            if (hasAttrCols && attrsChanged) {
              await supabaseAdmin.from('product_attributes').delete().eq('product_id', prod.id)
              if (attrUpdates.length > 0) {
                await supabaseAdmin.from('product_attributes').insert(
                  attrUpdates.map(a => ({ product_id: prod.id, attribute_name: a.name, attribute_value: a.value }))
                )
              }
            }
            updated++
          } catch (e) {
            errors.push(`${sku}: ${e instanceof Error ? e.message : 'Tundmatu viga'}`)
          }
        }

        push({ phase: 'done', updated, unchanged, skipped, errors: errors.slice(0, 20), total_errors: errors.length })
      } catch (e) {
        push({ phase: 'error', msg: e instanceof Error ? e.message : 'Tundmatu viga' })
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      'X-Accel-Buffering': 'no',
    },
  })
}
