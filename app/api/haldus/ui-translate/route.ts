/**
 * /api/haldus/ui-translate
 *
 * GET  — returns per-locale coverage stats (translated / total keys)
 * POST { locale?: string, force?: boolean }
 *       — translates missing UI keys for all locales (or one locale).
 *         force=true retranslates even keys that already exist.
 *
 * Translations are stored in the Supabase `ui_translations` table and
 * merged on top of the static messages/*.json files at runtime.
 */

import { NextRequest, NextResponse } from 'next/server'
import { createClient }             from '@supabase/supabase-js'

import etJson from '@/messages/et.json'
import enJson from '@/messages/en.json'
import ruJson from '@/messages/ru.json'
import lvJson from '@/messages/lv.json'
import ltJson from '@/messages/lt.json'

// ── Types ─────────────────────────────────────────────────────────────────────

type Msg = Record<string, unknown>

const STATIC: Record<string, Msg> = {
  en: enJson as Msg,
  ru: ruJson as Msg,
  lv: lvJson as Msg,
  lt: ltJson as Msg,
}

const LOCALES    = ['en', 'ru', 'lv', 'lt'] as const
const LANG_NAMES: Record<string, string> = {
  en: 'English',
  ru: 'Russian',
  lv: 'Latvian',
  lt: 'Lithuanian',
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Flatten nested JSON to dot-path keys */
function flattenKeys(obj: Msg, prefix = ''): Record<string, string> {
  const result: Record<string, string> = {}
  for (const [key, value] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key
    if (typeof value === 'string') {
      result[fullKey] = value
    } else if (typeof value === 'object' && value !== null) {
      Object.assign(result, flattenKeys(value as Msg, fullKey))
    }
  }
  return result
}

/** Set a dot-path key in a nested object (mutates obj) */
function setNested(obj: Msg, path: string, value: string): void {
  const parts = path.split('.')
  let cur = obj
  for (let i = 0; i < parts.length - 1; i++) {
    if (typeof cur[parts[i]] !== 'object' || cur[parts[i]] === null) {
      cur[parts[i]] = {}
    }
    cur = cur[parts[i]] as Msg
  }
  cur[parts[parts.length - 1]] = value
}

/** Deep-merge override on top of base (non-mutating) */
function deepMerge(base: Msg, override: Msg): Msg {
  const result = { ...base }
  for (const [k, v] of Object.entries(override)) {
    if (
      typeof v === 'object' && v !== null && !Array.isArray(v) &&
      typeof result[k] === 'object' && result[k] !== null
    ) {
      result[k] = deepMerge(result[k] as Msg, v as Msg)
    } else {
      result[k] = v
    }
  }
  return result
}

/** Returns ET key-value pairs that are missing from target */
function getMissingKeys(
  etFlat: Record<string, string>,
  targetFlat: Record<string, string>,
  force: boolean,
): Record<string, string> {
  const missing: Record<string, string> = {}
  for (const [key, value] of Object.entries(etFlat)) {
    if (force || !(key in targetFlat)) {
      missing[key] = value
    }
  }
  return missing
}

/** Call Claude to translate a flat key-value object from ET to target locale */
async function translateWithClaude(
  missing: Record<string, string>,
  locale: string,
): Promise<Record<string, string>> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY not set')

  const prompt = `Translate the following JSON key-value pairs from Estonian to ${LANG_NAMES[locale]}.

Rules:
- Keep ALL JSON keys exactly as-is (do NOT translate keys)
- Translate only the string values
- Keep brand names unchanged: Grundfos, iPumps, Intelligent Pump Solutions OÜ, JP, MAGNA3, Alpha, SCALA, COMFORT
- Keep addresses, phone numbers, registration numbers, URLs unchanged
- Keep template placeholders unchanged: {shown}, {total}, {count}, {email}, {amount}
- Keep emoji characters unchanged
- Keep technical abbreviations unchanged: SKU, E-R, KMKR, OÜ, KM, KM (24%)
- Return ONLY valid JSON, no explanation or code fences

${JSON.stringify(missing, null, 2)}`

  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 8192,
      messages: [{ role: 'user', content: prompt }],
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Claude API error ${res.status}: ${err}`)
  }

  const data  = await res.json()
  const raw   = (data.content?.[0]?.text ?? '') as string
  const match = raw.match(/```(?:json)?\n?([\s\S]+?)\n?```/)
  const json  = match ? match[1].trim() : raw.trim()

  return JSON.parse(json)
}

/** Supabase service-role client */
function supa() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } },
  )
}

// ── GET — coverage stats ───────────────────────────────────────────────────────

export async function GET() {
  const etFlat   = flattenKeys(etJson as Msg)
  const total    = Object.keys(etFlat).length

  // Load DB overrides
  const { data: rows } = await supa()
    .from('ui_translations')
    .select('locale, messages')

  const dbMap: Record<string, Msg> = {}
  for (const row of rows ?? []) dbMap[row.locale] = row.messages as Msg

  const stats: Record<string, { translated: number; missing: number; total: number }> = {}

  for (const locale of LOCALES) {
    const merged     = deepMerge(STATIC[locale], dbMap[locale] ?? {})
    const mergedFlat = flattenKeys(merged)

    let translated = 0
    for (const [key, etVal] of Object.entries(etFlat)) {
      if (key in mergedFlat && mergedFlat[key] !== etVal) translated++
    }

    stats[locale] = { translated, missing: total - translated, total }
  }

  return NextResponse.json({ stats, total })
}

// ── POST — translate missing keys ─────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({})) as { locale?: string; force?: boolean }
  const locales = body.locale ? [body.locale] : [...LOCALES]
  const force   = body.force ?? false

  const db    = supa()
  const etFlat = flattenKeys(etJson as Msg)

  // Load existing DB translations
  const { data: rows } = await db.from('ui_translations').select('locale, messages')
  const dbMap: Record<string, Msg> = {}
  for (const row of rows ?? []) dbMap[row.locale] = row.messages as Msg

  const results: Record<string, { translated: number; error?: string }> = {}

  for (const locale of locales) {
    if (!(locale in STATIC)) {
      results[locale] = { translated: 0, error: 'Unknown locale' }
      continue
    }
    try {
      // Current effective translation = static file + any prior DB override
      const current     = deepMerge(STATIC[locale], dbMap[locale] ?? {})
      const currentFlat = flattenKeys(current)
      const missing     = getMissingKeys(etFlat, currentFlat, force)

      if (Object.keys(missing).length === 0) {
        results[locale] = { translated: 0 }
        continue
      }

      const translated = await translateWithClaude(missing, locale)

      // Build updated DB payload: existing DB record + new translations
      const newDb: Msg = { ...(dbMap[locale] ?? {}) }
      for (const [flatKey, value] of Object.entries(translated)) {
        setNested(newDb, flatKey, value)
      }

      await db
        .from('ui_translations')
        .upsert(
          { locale, messages: newDb, updated_at: new Date().toISOString() },
          { onConflict: 'locale' },
        )

      results[locale] = { translated: Object.keys(translated).length }
    } catch (err) {
      results[locale] = { translated: 0, error: String(err) }
    }
  }

  return NextResponse.json({ results })
}
