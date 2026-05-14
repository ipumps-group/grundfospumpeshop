import { NextRequest, NextResponse } from 'next/server'

export const maxDuration = 60

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY!
const LOCALES      = ['en', 'ru', 'lv', 'lt'] as const
const LOCALE_NAMES: Record<string, string> = {
  en: 'English', ru: 'Russian', lv: 'Latvian', lt: 'Lithuanian',
}

const DB_HEADERS = {
  apikey: SERVICE_KEY,
  Authorization: `Bearer ${SERVICE_KEY}`,
  'Content-Type': 'application/json',
}

// All translation columns so we can check which are NULL
const TRANSLATION_COLS = [
  'description_et', 'description_en', 'description_ru', 'description_lv', 'description_lt',
  'short_description_et', 'short_description_en', 'short_description_ru', 'short_description_lv', 'short_description_lt',
].join(',')

async function sbFetch(path: string, opts: RequestInit = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1${path}`, { headers: DB_HEADERS as HeadersInit, ...opts })
  if (!res.ok) throw new Error(`Supabase ${res.status}: ${await res.text()}`)
  const text = await res.text()
  return text ? JSON.parse(text) : null
}

async function translateText(text: string, targetLang: string): Promise<string | null> {
  if (!text?.trim()) return null
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-3-5-haiku-latest',
      max_tokens: 4096,
      messages: [{
        role: 'user',
        content: `Translate the following text from Estonian to ${LOCALE_NAMES[targetLang]}.
Keep brand names (Grundfos, iPumps, ALPHA, MAGNA, SCALA, JP, OÜ, etc.) and technical terms unchanged.
Keep HTML tags and structure unchanged if present.
Return only the translated text, no explanation.

${text}`,
      }],
    }),
  })
  if (!res.ok) return null
  const data = await res.json()
  return data.content?.[0]?.text?.trim() ?? null
}

function needsTranslation(p: Record<string, string | null>) {
  return (
    (p.description_et && !p.description_en) ||
    (p.short_description_et && !p.short_description_en)
  )
}

/** GET /api/translate-missing — returns count of products needing translation */
export async function GET() {
  if (!SERVICE_KEY) return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY not set' }, { status: 500 })

  try {
    // Fetch products where EN is null but ET content exists (EN used as indicator for all locales)
    const products = await sbFetch(
      `/products?select=id,description_et,short_description_et,description_en,short_description_en` +
      `&or=(description_en.is.null,short_description_en.is.null)&limit=1000`
    )
    const missing = (products ?? []).filter(needsTranslation).length
    return NextResponse.json({ missing })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

/**
 * POST /api/translate-missing — translate one batch of products with missing translations.
 * Body: { limit?: number }  (default 5)
 * Returns: { processed: number, remaining: number }
 */
export async function POST(req: NextRequest) {
  if (!SERVICE_KEY)                  return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY not set' }, { status: 500 })
  if (!process.env.ANTHROPIC_API_KEY) return NextResponse.json({ error: 'ANTHROPIC_API_KEY not set' }, { status: 500 })

  const { limit = 5 } = await req.json().catch(() => ({})) as { limit?: number }

  try {
    // Fetch a batch of products needing translation (check all locale columns)
    const products: Record<string, string | null>[] = await sbFetch(
      `/products?select=id,${TRANSLATION_COLS}` +
      `&or=(description_en.is.null,short_description_en.is.null)&limit=${limit}&order=id`
    )

    if (!products || products.length === 0) {
      return NextResponse.json({ processed: 0, remaining: 0 })
    }

    // Process each product (sequential) with all locales in parallel
    let processed = 0
    for (const product of products) {
      const patch: Record<string, string | null> = {}

      await Promise.all(
        LOCALES.map(async (locale) => {
          const [desc, shortDesc] = await Promise.all([
            product.description_et && !product[`description_${locale}`]
              ? translateText(product.description_et, locale).catch(() => null)
              : Promise.resolve(null),
            product.short_description_et && !product[`short_description_${locale}`]
              ? translateText(product.short_description_et, locale).catch(() => null)
              : Promise.resolve(null),
          ])
          if (desc !== null)      patch[`description_${locale}`]       = desc
          if (shortDesc !== null) patch[`short_description_${locale}`] = shortDesc
        })
      )

      if (Object.keys(patch).length > 0) {
        await sbFetch(`/products?id=eq.${product.id}`, {
          method: 'PATCH',
          body: JSON.stringify(patch),
        })
      }
      processed++
    }

    // Count remaining after this batch
    const remaining_products: Record<string, string | null>[] = await sbFetch(
      `/products?select=id,description_et,short_description_et,description_en,short_description_en` +
      `&or=(description_en.is.null,short_description_en.is.null)&limit=1000`
    )
    const remaining = (remaining_products ?? []).filter(needsTranslation).length

    return NextResponse.json({ processed, remaining })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
