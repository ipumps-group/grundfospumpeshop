#!/usr/bin/env node
/**
 * Adds multilingual description columns to the products table and
 * translates all Estonian descriptions using the Anthropic Claude API.
 *
 * Step 1 — Run this SQL in Supabase Dashboard > SQL Editor:
 *
 *   ALTER TABLE products
 *     ADD COLUMN IF NOT EXISTS short_description_en TEXT,
 *     ADD COLUMN IF NOT EXISTS short_description_ru TEXT,
 *     ADD COLUMN IF NOT EXISTS short_description_lv TEXT,
 *     ADD COLUMN IF NOT EXISTS short_description_lt TEXT,
 *     ADD COLUMN IF NOT EXISTS description_en TEXT,
 *     ADD COLUMN IF NOT EXISTS description_ru TEXT,
 *     ADD COLUMN IF NOT EXISTS description_lv TEXT,
 *     ADD COLUMN IF NOT EXISTS description_lt TEXT;
 *
 * Step 2 — Run this script:
 *   ANTHROPIC_API_KEY=sk-ant-... node scripts/migrate-multilingual.mjs
 */

const SUPABASE_URL = 'https://avfvouczlgbtrhtqgokx.supabase.co'
const SERVICE_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2ZnZvdWN6bGdidHJodHFnb2t4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjE5MDk2NSwiZXhwIjoyMDg3NzY2OTY1fQ.075yZg1W37Z8c6qKfxrXZQPkP3aAuF9x8x2adSBwQrw'
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY

if (!ANTHROPIC_KEY) {
  console.error('ERROR: ANTHROPIC_API_KEY is not set.')
  process.exit(1)
}

const LOCALES = ['en', 'ru', 'lv', 'lt']
const LOCALE_NAMES = { en: 'English', ru: 'Russian', lv: 'Latvian', lt: 'Lithuanian' }
const HEADERS = { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, 'Content-Type': 'application/json' }

async function sbFetch(path, opts = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1${path}`, { headers: HEADERS, ...opts })
  if (!res.ok) throw new Error(`Supabase error ${res.status}: ${await res.text()}`)
  const text = await res.text()
  return text ? JSON.parse(text) : null
}

async function translateText(text, targetLang) {
  if (!text || !text.trim()) return null
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': ANTHROPIC_KEY, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({
      model: 'claude-3-5-haiku-latest',
      max_tokens: 1024,
      messages: [{
        role: 'user',
        content: `Translate the following product description from Estonian to ${LOCALE_NAMES[targetLang]}. Keep brand names (Grundfos, ALPHA, MAGNA, SCALA, JP, etc.) and technical terms unchanged. Return only the translated text, no explanation:\n\n${text}`
      }]
    })
  })
  if (!res.ok) throw new Error(`Anthropic error ${res.status}: ${await res.text()}`)
  const data = await res.json()
  return data.content?.[0]?.text?.trim() || null
}

async function main() {
  console.log('Fetching products with descriptions...')

  // Fetch all locale columns so we can skip already-translated fields
  const products = await sbFetch(
    '/products?select=id,slug,' +
    'description_et,description_en,description_ru,description_lv,description_lt,' +
    'short_description_et,short_description_en,short_description_ru,short_description_lv,short_description_lt' +
    '&order=id'
  )

  const toTranslate = products.filter(p => p.description_et || p.short_description_et)
  console.log(`Found ${toTranslate.length} products with descriptions.`)
  console.log('Skipping fields that are already translated (safe to re-run).\n')

  let done = 0
  let skipped = 0
  let failed = 0

  for (const product of toTranslate) {
    process.stdout.write(`[${done + 1}/${toTranslate.length}] ${product.slug} ... `)

    const patch = {}

    for (const locale of LOCALES) {
      // Only translate if the target column is NULL
      if (product.description_et && !product[`description_${locale}`]) {
        try {
          patch[`description_${locale}`] = await translateText(product.description_et, locale)
        } catch (e) {
          console.warn(`\n  ✗ description_${locale}: ${e.message}`)
          failed++
        }
      } else if (product[`description_${locale}`]) {
        skipped++
      }

      if (product.short_description_et && !product[`short_description_${locale}`]) {
        try {
          patch[`short_description_${locale}`] = await translateText(product.short_description_et, locale)
        } catch (e) {
          console.warn(`\n  ✗ short_description_${locale}: ${e.message}`)
          failed++
        }
      } else if (product[`short_description_${locale}`]) {
        skipped++
      }
    }

    if (Object.keys(patch).length > 0) {
      await sbFetch(`/products?id=eq.${product.id}`, {
        method: 'PATCH',
        body: JSON.stringify(patch),
      })
      console.log(`✓ (${Object.keys(patch).length} fields)`)
    } else {
      console.log('— already done')
    }

    done++
  }

  console.log(`\nDone! ${done} products processed. ${skipped} fields already had translations. ${failed} errors.`)
}

main().catch(e => { console.error(e); process.exit(1) })
