import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { rateLimit, AI_RATE } from '@/lib/rate-limit'

const client = new Anthropic()

// Activity area slug → display name translations for prompt use
const AREA_NAMES: Record<string, { et: string; en: string; ru: string; lv: string; lt: string }> = {
  'kuttepumbad':                              { et: 'Küte', en: 'Heating', ru: 'Отопление', lv: 'Apkure', lt: 'Šildymas' },
  'tsirkulatsioonipumbad-soe-tarbevesi':      { et: 'Soe tarbevesi', en: 'Hot water', ru: 'Горячая вода', lv: 'Karstais ūdens', lt: 'Karštas vanduo' },
  'puurkaevupumbad':                          { et: 'Puurkaev', en: 'Borewell', ru: 'Скважина', lv: 'Urbums', lt: 'Gręžinys' },
  'drenaazipumbad':                           { et: 'Drenaaž', en: 'Drainage', ru: 'Дренаж', lv: 'Drenāža', lt: 'Drenažas' },
  'salvkaevupumbad':                          { et: 'Salvkaev', en: 'Well', ru: 'Колодец', lv: 'Aka', lt: 'Šulinys' },
  'veeautomaadid':                            { et: 'Veeautomaat', en: 'Garden watering', ru: 'Гидрофор', lv: 'Dārza laistīšana', lt: 'Sodo laistymas' },
  'rohutostepumbad':                          { et: 'Rõhutõste', en: 'Pressure booster', ru: 'Повышение давления', lv: 'Spiediena paaugstināšana', lt: 'Slėgio didinimas' },
  'reoveepumbad':                             { et: 'Reovesi', en: 'Sewage', ru: 'Канализация', lv: 'Notekūdeņi', lt: 'Nuotekos' },
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get('x-forwarded-for') || 'unknown'
  const rl = rateLimit(ip, AI_RATE.maxRequests)
  if (rl.blocked) return NextResponse.json({ error: 'Too many requests' }, { status: 429 })

  const { query } = await req.json().catch(() => ({}))
  if (!query?.trim()) return NextResponse.json({ categorySlug: null, categoryType: null })

  const normalized = query.trim().toLowerCase()
  const cacheKey   = `search:${normalized}`

  // 1. Check synonym cache in settings table (validate cached slugs still exist)
  const { data: cached } = await supabaseAdmin
    .from('settings')
    .select('value, updated_at')
    .eq('key', cacheKey)
    .single()

  if (cached) {
    // Expire "none" caches after 24h so future searches can retry
    if (cached.value === 'none') {
      const age = Date.now() - new Date(cached.updated_at || 0).getTime()
      if (age < 86400000) {
        return NextResponse.json({ categorySlug: null, categoryType: null })
      }
      // Expired — fall through to re-query Claude
    } else {
      const parts = cached.value.split(':')
      const cachedSlug = parts.length === 2 ? parts[1] : cached.value
      const cachedType = parts.length === 2 ? parts[0] as 'tegevusala' | 'seeria' : 'tegevusala'
      // Validate cached slug against current DB state
      if (cachedType === 'tegevusala' && AREA_NAMES[cachedSlug]) {
        return NextResponse.json({ categorySlug: cachedSlug, categoryType: cachedType })
      }
      if (cachedType === 'seeria') {
        const { data: validSeries } = await supabaseAdmin
          .from('product_series')
          .select('slug')
          .eq('slug', cachedSlug)
          .eq('is_active', true)
          .single()
        if (validSeries) {
          return NextResponse.json({ categorySlug: cachedSlug, categoryType: cachedType })
        }
      }
      // Cache is stale — invalidate it
      await supabaseAdmin.from('settings').update({ value: 'none' }).eq('key', cacheKey)
    }
  }

  // 2. Fetch all products with their names, descriptions, and category/series info
  let productCatalog = ''
  try {
    const { data: products } = await supabaseAdmin
      .from('products')
      .select('name, short_description_et, short_description_en, short_description_ru, short_description_lv, short_description_lt, series_slug, primary_activity_area_slug')
      .eq('published', true)
      .order('name')

    if (products && products.length > 0) {
      const byArea: Record<string, { names: string[]; descs: string[] }> = {}
      for (const p of products) {
        const area = p.primary_activity_area_slug || 'other'
        if (!byArea[area]) byArea[area] = { names: [], descs: [] }
        byArea[area].names.push(p.name.replace(/Grundfos\s*/g, ''))
        for (const d of [p.short_description_et, p.short_description_en, p.short_description_ru, p.short_description_lv, p.short_description_lt]) {
          if (d) byArea[area].descs.push(d)
        }
      }
      const lines: string[] = []
      for (const [slug, data] of Object.entries(byArea)) {
        const areaName = AREA_NAMES[slug]
        const langLabels = areaName ? `${areaName.et} / ${areaName.en} / ${areaName.ru} / ${areaName.lv} / ${areaName.lt}` : slug
        lines.push(`=== ${slug} (${langLabels}) ===`)
        const uniqueNames = [...new Set(data.names)].slice(0, 20)
        lines.push(`  Products: ${uniqueNames.join(' | ')}`)
        const uniqueDescs = [...new Set(data.descs)].slice(0, 3)
        for (const desc of uniqueDescs) {
          lines.push(`  • ${desc}`)
        }
      }
      productCatalog = lines.join('\n')
    }
  } catch {
    // non-fatal
  }

  // 3. Fetch active product series
  let seriesLines = ''
  let seriesSlugs = ''
  try {
    const { data: series } = await supabaseAdmin
      .from('product_series')
      .select('slug, name')
      .eq('is_active', true)
      .order('sort_order')
    if (series && series.length > 0) {
      seriesLines = series.map(s => s.name).join(', ')
      seriesSlugs = series.map(s => s.slug).join(', ')
    }
  } catch {
    // non-fatal
  }

  // 4. Ask Claude to analyze the catalog and return matching products
  let resultSlug: string | null = null
  let resultType: 'tegevusala' | 'seeria' | null = null
  try {
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1500,
      messages: [{
        role: 'user',
        content: `You are an intelligent product search and categorization assistant for a pump store.

Below is a product catalogue containing product names, categories, and descriptions.

Your task: match the search term to the best category or series, even if the term is misspelled, in a different language, or uses phonetic variations.

${productCatalog}

Product series: ${seriesLines || 'none listed'}

VALID CATEGORY SLUGS (use ONLY one of these):
kuttepumbad, tsirkulatsioonipumbad-soe-tarbevesi, puurkaevupumbad, drenaazipumbad, salvkaevupumbad, veeautomaadid, rohutostepumbad, reoveepumbad

VALID SERIES SLUGS (use ONLY one of these):
${seriesSlugs || 'none'}

SEARCH TERM: "${normalized}"

CRITICAL RULES:
1. The search term might be MISSPELLED (e.g. "Skaala" = "Scala", "unlift" = "Unilift", "Alfa" = "Alpha"). Use phonetic and visual similarity to guess what the user meant.
2. The term might be in Estonian, English, Russian, Latvian, or Lithuanian — translate it in your head first.
3. Look at PRODUCT NAMES in the catalogue — match the search term to product names even if spelled slightly differently.
4. If the search term matches a product series name (or a close variant), return that series slug.
5. If it matches multiple products in a category, return that category slug.
6. NEVER invent slugs — use ONLY from the VALID lists above.
7. NEVER return "none" if there is ANY plausible match. Try your best.
8. Only return "none" if the term is completely unrelated to pumps (e.g. "kala" = fish, "auto" = car).

Reply with ONLY the category slug (e.g. "kuttepumbad") or series slug (e.g. "grundfos-scala").
If absolutely nothing matches, reply with "none".`,
      }],
    })

    const text = response.content[0].type === 'text'
      ? response.content[0].text.trim().toLowerCase()
      : 'none'

    if (text !== 'none') {
      if (AREA_NAMES[text]) {
        resultSlug = text
        resultType = 'tegevusala'
      } else {
        // Try exact slug match first
        const { data: seriesCheck } = await supabaseAdmin
          .from('product_series')
          .select('slug')
          .eq('slug', text)
          .eq('is_active', true)
          .single()
        if (seriesCheck) {
          resultSlug = text
          resultType = 'seeria'
        } else {
          // Try name-based lookup (Claude might have returned a name variant)
          const { data: byName } = await supabaseAdmin
            .from('product_series')
            .select('slug')
            .eq('is_active', true)
            .or(`name.ilike.%${text}%,slug.ilike.%${text}%`)
            .limit(1)
          if (byName && byName.length > 0) {
            resultSlug = byName[0].slug
            resultType = 'seeria'
          }
        }
      }
    }
  } catch (e) {
    console.error('Claude search-ai error:', e)
    return NextResponse.json({ categorySlug: null, categoryType: null })
  }

  // 5. Cache result
  const cacheValue = resultSlug && resultType ? `${resultType}:${resultSlug}` : 'none'
  await supabaseAdmin.from('settings').upsert(
    { key: cacheKey, value: cacheValue, updated_at: new Date().toISOString() },
    { onConflict: 'key' },
  )

  return NextResponse.json({
    categorySlug: resultSlug,
    categoryType: resultType,
  })
}
