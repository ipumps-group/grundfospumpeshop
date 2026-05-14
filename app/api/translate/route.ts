import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'

const LOCALES = ['en', 'ru', 'lv', 'lt'] as const
const LOCALE_NAMES: Record<string, string> = {
  en: 'English',
  ru: 'Russian',
  lv: 'Latvian',
  lt: 'Lithuanian',
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_KEY  = process.env.SUPABASE_SERVICE_ROLE_KEY!

const anthropic = new Anthropic()

async function translateText(text: string, targetLang: string): Promise<string | null> {
  if (!text?.trim()) return null
  try {
    const response = await anthropic.messages.create({
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
    })
    const block = response.content[0]
    return block.type === 'text' ? block.text.trim() : null
  } catch (e) {
    console.error('Anthropic error:', e)
    return null
  }
}

async function updateDB(table: string, id: number, patch: Record<string, string | null>) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?id=eq.${id}`, {
    method: 'PATCH',
    headers: {
      apikey: SERVICE_KEY,
      Authorization: `Bearer ${SERVICE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal',
    },
    body: JSON.stringify(patch),
  })
  if (!res.ok) throw new Error(`DB update failed: ${await res.text()}`)
}

/**
 * POST /api/translate
 *
 * Body: {
 *   table:  'products' | 'pages'         — DB table name
 *   id:     number                        — row id
 *   fields: { fieldName: 'text in ET' }  — e.g. { description: '...', short_description: '...' }
 * }
 *
 * Translates each field from ET to all 5 locales and writes to DB.
 * Columns must exist: fieldName_en, fieldName_ru, etc.
 */
export async function POST(req: NextRequest) {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) return NextResponse.json({ error: 'ANTHROPIC_API_KEY not set' }, { status: 500 })
  if (!SERVICE_KEY) return NextResponse.json({ error: 'SUPABASE_SERVICE_ROLE_KEY not set' }, { status: 500 })

  let body: { table: string; id: number | string; fields: Record<string, string> }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const { table, id: rawId, fields } = body
  const id = Number(rawId)
  if (!table || !id || !fields || typeof fields !== 'object') {
    return NextResponse.json({ error: 'Required: table, id, fields' }, { status: 400 })
  }

  const patch: Record<string, string | null> = {}
  const results: Record<string, Record<string, string | null>> = {}

  // Translate all fields × all locales in parallel
  await Promise.all(
    Object.entries(fields).map(async ([fieldName, text]) => {
      results[fieldName] = {}
      await Promise.all(
        LOCALES.map(async (locale) => {
          const translated = await translateText(text, locale)
          patch[`${fieldName}_${locale}`] = translated
          results[fieldName][locale] = translated
        })
      )
    })
  )

  try {
    await updateDB(table, id, patch)
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }

  return NextResponse.json({ ok: true, results })
}
