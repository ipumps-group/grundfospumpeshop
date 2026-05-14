#!/usr/bin/env node
/**
 * Translates all pages (Ostutingimused, Privaatsuspoliitika, Tagastamine, etc.)
 * from Estonian to EN/RU/LV/LT/PL and writes to multilingual columns.
 *
 * Requires pages table to have columns: title_en, content_en, etc.
 * Run: ANTHROPIC_API_KEY=sk-ant-... node scripts/migrate-pages.mjs
 */

const SUPABASE_URL = 'https://avfvouczlgbtrhtqgokx.supabase.co'
const SERVICE_KEY  = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF2ZnZvdWN6bGdidHJodHFnb2t4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjE5MDk2NSwiZXhwIjoyMDg3NzY2OTY1fQ.075yZg1W37Z8c6qKfxrXZQPkP3aAuF9x8x2adSBwQrw'
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY

if (!ANTHROPIC_KEY) { console.error('ERROR: ANTHROPIC_API_KEY is not set.'); process.exit(1) }

const LOCALES = ['en', 'ru', 'lv', 'lt']
const LOCALE_NAMES = { en: 'English', ru: 'Russian', lv: 'Latvian', lt: 'Lithuanian' }
const HEADERS = { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}`, 'Content-Type': 'application/json' }

async function sbFetch(path, opts = {}) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1${path}`, { headers: HEADERS, ...opts })
  if (!res.ok) throw new Error(`Supabase ${res.status}: ${await res.text()}`)
  const text = await res.text()
  return text ? JSON.parse(text) : null
}

async function translate(text, targetLang) {
  if (!text?.trim()) return null
  const res = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-api-key': ANTHROPIC_KEY, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 8192,
      messages: [{
        role: 'user',
        content: `Translate the following text from Estonian to ${LOCALE_NAMES[targetLang]}.
Keep brand names (Grundfos, iPumps, OÜ, etc.) unchanged.
Keep HTML tags and structure exactly as-is if present.
Return only the translated text, no explanation.

${text}`
      }]
    })
  })
  if (!res.ok) throw new Error(`Anthropic ${res.status}: ${await res.text()}`)
  const data = await res.json()
  return data.content?.[0]?.text?.trim() ?? null
}

async function main() {
  console.log('Fetching pages...')
  const pages = await sbFetch('/pages?select=id,slug,title,short_description,content&order=id')
  console.log(`Found ${pages.length} pages.\n`)

  for (const page of pages) {
    process.stdout.write(`[${page.slug}] `)
    const patch = {}

    for (const locale of LOCALES) {
      // title
      if (page.title) {
        try { patch[`title_${locale}`] = await translate(page.title, locale) }
        catch (e) { console.warn(`\n  ✗ title_${locale}: ${e.message}`) }
      }
      // short_description
      if (page.short_description) {
        try { patch[`short_description_${locale}`] = await translate(page.short_description, locale) }
        catch (e) { console.warn(`\n  ✗ short_description_${locale}: ${e.message}`) }
      }
      // content (can be long HTML)
      if (page.content) {
        try { patch[`content_${locale}`] = await translate(page.content, locale) }
        catch (e) { console.warn(`\n  ✗ content_${locale}: ${e.message}`) }
      }
    }

    if (Object.keys(patch).length > 0) {
      await sbFetch(`/pages?id=eq.${page.id}`, { method: 'PATCH', body: JSON.stringify(patch) })
    }
    console.log('✓')
  }
  console.log('\nDone!')
}

main().catch(e => { console.error(e); process.exit(1) })
