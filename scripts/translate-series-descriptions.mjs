import { createClient } from '@supabase/supabase-js'
import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'
import { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } from './env.mjs'

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing env vars: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const envPath = resolve(dirname(fileURLToPath(import.meta.url)), '..', '.env.local')
const envContent = readFileSync(envPath, 'utf-8')
const ANTHROPIC_API_KEY = envContent.match(/^ANTHROPIC_API_KEY=(.+)$/m)?.[1]?.trim()
if (!ANTHROPIC_API_KEY) { console.error('ANTHROPIC_API_KEY not found in .env.local'); process.exit(1) }

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

const LOCALES = ['en', 'ru', 'lv', 'lt']
const LOCALE_NAMES = { en: 'English', ru: 'Russian', lv: 'Latvian', lt: 'Lithuanian' }

async function translate(text, targetLang) {
  const resp = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 500,
      messages: [{
        role: 'user',
        content: `Translate the following Estonian text to ${LOCALE_NAMES[targetLang]}. Return ONLY the translated text, nothing else.

Text: ${text}`
      }]
    })
  })

  if (!resp.ok) {
    const err = await resp.text()
    throw new Error(`Translation API error (${resp.status}): ${err}`)
  }

  const data = await resp.json()
  return data.content[0].text.trim()
}

async function main() {
  const { data: seriesList } = await supabase
    .from('product_series')
    .select('id, slug, name, description, description_en, description_ru, description_lv, description_lt')

  if (!seriesList || seriesList.length === 0) {
    console.log('No series found')
    return
  }

  console.log(`Found ${seriesList.length} series`)
  let totalTranslated = 0

  for (const s of seriesList) {
    const desc = s.description
    if (!desc) {
      console.log(`  ${s.slug}: SKIP (no description)`)
      continue
    }

    const updates = {}
    for (const locale of LOCALES) {
      const field = `description_${locale}`
      if (!s[field]) {
        try {
          const translated = await translate(desc, locale)
          updates[field] = translated
          console.log(`  ${s.slug} → ${locale}: "${translated.substring(0, 60)}..."`)
          await new Promise(r => setTimeout(r, 500))
        } catch (e) {
          console.error(`  ${s.slug} → ${locale}: ERROR ${e.message}`)
        }
      }
    }

    if (Object.keys(updates).length > 0) {
      const { error } = await supabase
        .from('product_series')
        .update(updates)
        .eq('id', s.id)

      if (error) {
        console.log(`  ERROR saving ${s.slug}: ${error.message}`)
      } else {
        totalTranslated += Object.keys(updates).length
      }
    }
  }

  console.log(`\nDone. Translated ${totalTranslated} descriptions across ${seriesList.length} series.`)
  process.exit(0)
}

main().catch(e => { console.error(e); process.exit(1) })
