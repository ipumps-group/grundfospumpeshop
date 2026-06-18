import Anthropic from '@anthropic-ai/sdk'
import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase-admin'

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
        const uniqueDescs = [...new Set(data.descs)].slice(0, 5)
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
        content: `You are an intelligent product search and categorization assistant.

Below is a product catalogue containing product names, descriptions, categories, and series.

Your task is to analyze the catalogue and determine the best matching category or series for the search term.

${productCatalog}

Product series: ${seriesLines || 'none listed'}

VALID CATEGORY SLUGS (use ONLY one of these for category matches):
kuttepumbad, tsirkulatsioonipumbad-soe-tarbevesi, puurkaevupumbad, drenaazipumbad, salvkaevupumbad, veeautomaadid, rohutostepumbad, reoveepumbad

VALID SERIES SLUGS (use ONLY one of these for series matches):
${seriesSlugs || 'none'}

SEARCH TERM:
"${normalized}"

The search term may:
- directly match the product name
- be a synonym or related concept
- describe a use case
- describe a product type
- partially match category names or descriptions
- be in Estonian, English, Russian, Latvian, or Lithuanian

Instructions:
1. First, think about what the search term means. For example, "kaevupump" means "well pump" in Estonian — it relates to borewell/well water extraction.
2. Then, analyze ALL product names and descriptions across ALL categories with that understanding.
3. Consider semantic meaning, not only exact keyword matches.
4. The user is looking for products — find which category or series contains relevant products.
5. If multiple categories could match, pick the most relevant one.
6. Ignore clearly unrelated categories.
7. You MUST reply with a slug from the VALID lists above. Do NOT invent or modify slugs.
8. Check that the category or series you pick actually has products listed under it in the catalogue above.
9. If the best-matching category has no products listed, try the next best category.
10. Never return a slug that does not appear in the VALID lists.
11. If the search term does not appear verbatim in the catalogue, still do your best to map it to the closest category based on meaning and purpose. Only reply "none" if the term is completely unrelated to any product category.

Reply with ONLY the category slug (e.g. "kuttepumbad") or series slug (e.g. "grundfos-ups") of the best match.
If nothing matches after careful analysis, reply with "none".`,
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
