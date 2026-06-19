/**
 * /api/haldus/db-translate
 *
 * GET  — translation coverage stats for DB content:
 *        products (descriptions), attribute names, categories
 *
 * POST { type: 'products' | 'attributes' | 'categories', limit?: number }
 *       — translate one batch of missing DB content.
 *
 * All translation uses Claude Haiku via Anthropic API.
 */

import { NextRequest, NextResponse } from 'next/server'
import { requireSuperadmin } from '@/lib/api-auth'
import { rateLimit, AI_RATE } from '@/lib/rate-limit'

export const maxDuration = 60

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY!

const LOCALES: string[] = ['en', 'ru', 'lv', 'lt']
const LOCALE_NAMES: Record<string, string> = {
  en: 'English', ru: 'Russian', lv: 'Latvian', lt: 'Lithuanian',
}

const HEADERS = {
  apikey:        SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  'Content-Type': 'application/json',
  Prefer:        'return=representation',
}

async function sb(path: string, opts: RequestInit = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1${path}`, {
    headers: HEADERS as HeadersInit,
    ...opts,
  })
  if (!res.ok) throw new Error(`Supabase ${res.status}: ${await res.text()}`)
  const text = await res.text()
  return text ? JSON.parse(text) : null
}

// ── Claude helper ─────────────────────────────────────────────────────────────

async function claudeTranslate(text: string, locale: string): Promise<string | null> {
  if (!text?.trim()) return null
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 4096,
      messages: [{
        role: 'user',
        content:
          `Translate the following text from Estonian to ${LOCALE_NAMES[locale]}.\n` +
          `Keep brand names (Grundfos, iPumps, ALPHA, MAGNA, SCALA, JP, OÜ, etc.) and technical terms unchanged.\n` +
          `Keep HTML tags and structure unchanged if present.\n` +
          `Return ONLY the translated text, no explanation.\n\n${text}`,
      }],
    }),
  })
  if (!res.ok) return null
  const data = await res.json()
  return data.content?.[0]?.text?.trim() ?? null
}

/** Translate a flat object { key: etText } → { key: translatedText } for one locale */
async function claudeTranslateBatch(
  items: Record<string, string>,
  locale: string,
): Promise<Record<string, string>> {
  if (Object.keys(items).length === 0) return {}
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 8192,
      messages: [{
        role: 'user',
        content:
          `Translate the following JSON key-value pairs from Estonian to ${LOCALE_NAMES[locale]}.\n` +
          `Rules:\n` +
          `- Keep ALL JSON keys exactly as-is\n` +
          `- Translate only the string values\n` +
          `- Keep brand names and technical units unchanged: Grundfos, V, W, kW, m, m³/h, l/s, Hz, rpm, bar, °C, IP, OÜ\n` +
          `- Translate technical spec LABELS fully (e.g., "Nimijõudlus" → "Nominal flow")\n` +
          `- Return ONLY valid JSON, no explanation or code fences\n\n` +
          JSON.stringify(items, null, 2),
      }],
    }),
  })
  if (!res.ok) return {}
  const data = await res.json()
  const raw   = (data.content?.[0]?.text ?? '') as string
  const match = raw.match(/```(?:json)?\n?([\s\S]+?)\n?```/)
  const json  = match ? match[1].trim() : raw.trim()
  try { return JSON.parse(json) } catch { return {} }
}

// ── GET — stats ───────────────────────────────────────────────────────────────

export async function GET() {
  if (!SERVICE_KEY) return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY not set' }, { status: 500 })

  try {
    // 1. Products — count missing English description (used as indicator for all locales)
    const allProducts = await sb(
      `/products?select=id,description_et,short_description_et,description_en,short_description_en&limit=2000`
    ) as Record<string, string | null>[]

    const totalProducts  = (allProducts ?? []).length
    const missingProducts = (allProducts ?? []).filter(p =>
      (p.description_et && !p.description_en) ||
      (p.short_description_et && !p.short_description_en)
    ).length

    // 2. Attribute names — count unique ET names without EN translation
    let totalAttrs = 0, missingAttrs = 0
    try {
      const attrNames = await sb(`/attribute_name_translations?select=name_et,name_en&limit=2000`)
      totalAttrs   = (attrNames ?? []).length
      missingAttrs = (attrNames ?? []).filter((r: Record<string, string>) => !r.name_en).length

      // Also count attribute names not yet in the translation table
      const allAttrRows = await sb(
        `/product_attributes?select=attribute_name&limit=5000`
      ) as { attribute_name: string }[]
      const uniqueNames = new Set((allAttrRows ?? []).map(r => r.attribute_name))
      const knownNames  = new Set((attrNames ?? []).map((r: Record<string, string>) => r.name_et))
      const notInTable  = [...uniqueNames].filter(n => !knownNames.has(n)).length
      totalAttrs   = uniqueNames.size
      missingAttrs = missingAttrs + notInTable
    } catch { /* attribute_name_translations table may not exist yet */ }

    // 3. Categories — count missing name_ru (indicator for non-EN locales)
    let totalCats = 0, missingCats = 0
    try {
      const cats = await sb(`/categories?select=id,name_et,name_en&limit=200`) as Record<string, string | null>[]
      totalCats   = (cats ?? []).length
      missingCats = (cats ?? []).filter(c => c.name_et && !c.name_en).length
    } catch { /* ignore */ }

    return NextResponse.json({
      products:   { missing: missingProducts,  total: totalProducts },
      attributes: { missing: missingAttrs,     total: totalAttrs },
      categories: { missing: missingCats,      total: totalCats },
    })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

// ── POST — translate ──────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try { await requireSuperadmin() } catch (e) { return e as NextResponse }
  const ip = req.headers.get('x-forwarded-for') || 'unknown'
  const rl = rateLimit(ip, AI_RATE.maxRequests)
  if (rl.blocked) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })

  if (!SERVICE_KEY)                   return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY not set' }, { status: 500 })
  if (!process.env.ANTHROPIC_API_KEY) return NextResponse.json({ error: 'ANTHROPIC_API_KEY not set' }, { status: 500 })

  const { type, limit = 5 } = await req.json().catch(() => ({})) as {
    type?: 'products' | 'attributes' | 'categories'
    limit?: number
  }

  // ── Products ──────────────────────────────────────────────────────────────
  if (!type || type === 'products') {
    try {
      const COLS = [
        'description_et','description_en','description_ru','description_lv','description_lt',
        'short_description_et','short_description_en','short_description_ru','short_description_lv','short_description_lt',
      ].join(',')

      const products = await sb(
        `/products?select=id,${COLS}&or=(description_en.is.null,short_description_en.is.null)&limit=${limit}&order=id`
      ) as Record<string, string | null>[]

      let processed = 0
      for (const product of products ?? []) {
        const patch: Record<string, string | null> = {}
        await Promise.all(
          LOCALES.map(async (locale) => {
            const [desc, shortDesc] = await Promise.all([
              product.description_et    && !product[`description_${locale}`]
                ? claudeTranslate(product.description_et,       locale).catch(() => null) : null,
              product.short_description_et && !product[`short_description_${locale}`]
                ? claudeTranslate(product.short_description_et, locale).catch(() => null) : null,
            ])
            if (desc !== null)      patch[`description_${locale}`]       = desc
            if (shortDesc !== null) patch[`short_description_${locale}`] = shortDesc
          })
        )
        if (Object.keys(patch).length > 0) {
          await sb(`/products?id=eq.${product.id}`, { method: 'PATCH', body: JSON.stringify(patch) })
        }
        processed++
      }

      const remaining_rows = await sb(
        `/products?select=id,description_et,short_description_et,description_en,short_description_en&or=(description_en.is.null,short_description_en.is.null)&limit=2000`
      ) as Record<string, string | null>[]
      const remaining = (remaining_rows ?? []).filter(p =>
        (p.description_et && !p.description_en) || (p.short_description_et && !p.short_description_en)
      ).length

      return NextResponse.json({ type: 'products', processed, remaining })
    } catch (e) {
      return NextResponse.json({ error: String(e) }, { status: 500 })
    }
  }

  // ── Attribute names ───────────────────────────────────────────────────────
  if (type === 'attributes') {
    try {
      // Get all unique attribute names from product_attributes
      const allAttrRows = await sb(`/product_attributes?select=attribute_name&limit=5000`) as { attribute_name: string }[]
      const uniqueNames = [...new Set((allAttrRows ?? []).map(r => r.attribute_name))]

      // Get existing translations
      const existing = await sb(`/attribute_name_translations?select=name_et,name_en,name_ru,name_lv,name_lt&limit=2000`) as Record<string, string | null>[]
      const existingMap: Record<string, Record<string, string | null>> = {}
      for (const row of existing ?? []) existingMap[row.name_et as string] = row

      // Find names needing translation (not in table at all, or missing some locales)
      const toProcess = uniqueNames.filter(name => {
        const row = existingMap[name]
        if (!row) return true  // not in table yet
        return LOCALES.some(l => !row[`name_${l}`])  // missing some locale
      }).slice(0, limit * 5)  // process more per call since they're short strings

      if (toProcess.length === 0) return NextResponse.json({ type: 'attributes', processed: 0, remaining: 0 })

      // Translate all missing locale×name combinations in batches per locale
      const upserts: Record<string, Record<string, string>> = {}
      for (const name of toProcess) upserts[name] = { name_et: name }

      for (const locale of LOCALES) {
        const batch: Record<string, string> = {}
        for (const name of toProcess) {
          const existing_val = existingMap[name]?.[`name_${locale}`]
          if (!existing_val) batch[name] = name
        }
        if (Object.keys(batch).length === 0) continue

        const translated = await claudeTranslateBatch(batch, locale).catch(() => ({}))
        for (const [name, val] of Object.entries(translated)) {
          if (upserts[name]) upserts[name][`name_${locale}`] = val
        }
      }

      // Upsert into attribute_name_translations
      const rows = Object.values(upserts).filter(r => Object.keys(r).length > 1)
      if (rows.length > 0) {
        await sb(`/attribute_name_translations`, {
          method: 'POST',
          headers: { ...HEADERS, Prefer: 'resolution=merge-duplicates' } as HeadersInit,
          body: JSON.stringify(rows),
        })
      }

      const remaining = uniqueNames.filter(name => {
        const row = existingMap[name]
        return !row || LOCALES.some(l => !row[`name_${l}`])
      }).length - toProcess.length

      return NextResponse.json({ type: 'attributes', processed: toProcess.length, remaining: Math.max(0, remaining) })
    } catch (e) {
      return NextResponse.json({ error: String(e) }, { status: 500 })
    }
  }

  // ── Categories ────────────────────────────────────────────────────────────
  if (type === 'categories') {
    try {
      const cats = await sb(`/categories?select=id,name_et,name_en,name_ru,name_lv,name_lt&limit=200`) as Record<string, string | null>[]
      let processed = 0

      for (const cat of cats ?? []) {
        if (!cat.name_et) continue
        const patch: Record<string, string> = {}
        await Promise.all(
          LOCALES.map(async (locale) => {
            if (!cat[`name_${locale}`]) {
              const t = await claudeTranslate(cat.name_et as string, locale).catch(() => null)
              if (t) patch[`name_${locale}`] = t
            }
          })
        )
        if (Object.keys(patch).length > 0) {
          await sb(`/categories?id=eq.${cat.id}`, { method: 'PATCH', body: JSON.stringify(patch) })
          processed++
        }
      }

      return NextResponse.json({ type: 'categories', processed, remaining: 0 })
    } catch (e) {
      return NextResponse.json({ error: String(e) }, { status: 500 })
    }
  }

  return NextResponse.json({ error: 'Unknown type' }, { status: 400 })
}
