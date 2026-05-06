#!/usr/bin/env node
/**
 * Auto-translation script: translates messages/et.json to all other locales
 * using the Anthropic Claude API.
 *
 * Usage:
 *   ANTHROPIC_API_KEY=sk-ant-... npm run translate
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const messagesDir = path.join(__dirname, '..', 'messages')

const LOCALES = ['en', 'ru', 'lv', 'lt']
const LANGUAGE_NAMES = {
  en: 'English',
  ru: 'Russian',
  lv: 'Latvian',
  lt: 'Lithuanian',
}

const apiKey = process.env.ANTHROPIC_API_KEY
if (!apiKey) {
  console.error('ERROR: ANTHROPIC_API_KEY environment variable is not set.')
  process.exit(1)
}

const etJson = JSON.parse(
  fs.readFileSync(path.join(messagesDir, 'et.json'), 'utf8')
)

/**
 * Extract JSON from Claude's response (handles code blocks and plain JSON).
 */
function extractJson(text) {
  const codeBlock = text.match(/```(?:json)?\n?([\s\S]+?)\n?```/)
  if (codeBlock) return codeBlock[1].trim()
  return text.trim()
}

/**
 * Translate the ET messages object to the given locale using Claude.
 */
async function translate(locale) {
  const langName = LANGUAGE_NAMES[locale]
  console.log(`\nTranslating to ${langName} (${locale})...`)

  const prompt = `Translate the following JSON file from Estonian to ${langName}.

Rules:
- Keep ALL JSON keys exactly as-is (do NOT translate keys)
- Translate only the string values
- Keep brand names unchanged: Grundfos, iPumps, Intelligent Pump Solutions OÜ, JP, MAGNA3, Alpha, SCALA, COMFORT
- Keep addresses, phone numbers, registration numbers, URLs unchanged
- Keep template placeholders unchanged: {shown}, {total}, etc.
- Keep emoji characters unchanged
- Keep technical abbreviations unchanged: SKU, E-R, KMKR, OÜ
- Return ONLY valid JSON, no explanation or code fences

${JSON.stringify(etJson, null, 2)}`

  const response = await fetch('https://api.anthropic.com/v1/messages', {
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

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`API error ${response.status}: ${err}`)
  }

  const data = await response.json()
  const raw = data.content?.[0]?.text ?? ''

  try {
    const jsonStr = extractJson(raw)
    const parsed = JSON.parse(jsonStr)
    const outPath = path.join(messagesDir, `${locale}.json`)
    fs.writeFileSync(outPath, JSON.stringify(parsed, null, 2) + '\n', 'utf8')
    console.log(`  ✓  messages/${locale}.json written`)
  } catch (err) {
    console.error(`  ✗  Failed to parse JSON for ${locale}:`, err.message)
    // Write raw response for debugging
    fs.writeFileSync(
      path.join(messagesDir, `${locale}.json.raw`),
      raw,
      'utf8'
    )
    console.error(`  Raw response saved to messages/${locale}.json.raw`)
  }
}

// Run translations sequentially to avoid rate limits
for (const locale of LOCALES) {
  await translate(locale)
}

console.log('\nDone! All translations complete.')
