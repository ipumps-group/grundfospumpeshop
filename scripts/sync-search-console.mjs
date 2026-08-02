// Google Search Console — Weekly Sync & AI Analysis
// Run: node scripts/sync-search-console.mjs
// Scheduled: GitHub Actions (weekly on Mondays at 04:00 UTC)

import { readFileSync } from 'fs'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'
import jwt from 'jsonwebtoken'
import { createClient } from '@supabase/supabase-js'
import { createHash } from 'crypto'

const __dirname = dirname(fileURLToPath(import.meta.url))
const envPath = resolve(__dirname, '..', '.env.local')
try {
  const content = readFileSync(envPath, 'utf-8')
  for (const line of content.split('\n')) {
    const t = line.trim()
    if (t && !t.startsWith('#')) {
      const eq = t.indexOf('=')
      if (eq > 0) {
        const k = t.slice(0, eq)
        let v = t.slice(eq + 1)
        if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1)
        process.env[k] = v
      }
    }
  }
} catch { console.log('No .env.local found, using process.env') }

// ─── CONFIG ───────────────────────────────────────────
const SITE_URL = process.env.GSC_SITE_URL || process.env.NEXT_PUBLIC_SITE_URL || 'https://pumbapood.ee'
const GSC_EMAIL = process.env.GSC_SERVICE_ACCOUNT_EMAIL
const GSC_KEY = (process.env.GSC_SERVICE_ACCOUNT_KEY || '').replace(/\\n/g, '\n')
const OPENAI_KEY = process.env.OPENAI_API_KEY
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const COMPANY_ID = process.env.GSC_COMPANY_ID   // optional: set this to filter recommendations

const GSC_API = 'https://www.googleapis.com/webmasters/v3'
const DAYS_TO_FETCH = 7
const QUERY_LIMIT = 1000
const PAGE_LIMIT = 1000

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { persistSession: false },
})

// ─── UTILS ────────────────────────────────────────────
function daysAgo(n) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().split('T')[0]
}

function p(n) { return Number(n || 0).toFixed(2) }

// ─── GSC AUTH ─────────────────────────────────────────
let cachedToken = null, cachedExpiry = 0

async function getAccessToken() {
  if (cachedToken && Date.now() < cachedExpiry - 60000) return cachedToken

  if (!GSC_EMAIL || !GSC_KEY) throw new Error('GSC_SERVICE_ACCOUNT_EMAIL and GSC_SERVICE_ACCOUNT_KEY must be set')

  const now = Math.floor(Date.now() / 1000)
  const assertion = jwt.sign(
    {
      iss: GSC_EMAIL,
      scope: 'https://www.googleapis.com/auth/webmasters.readonly',
      aud: 'https://oauth2.googleapis.com/token',
      exp: now + 3600,
      iat: now,
    },
    GSC_KEY,
    { algorithm: 'RS256' },
  )

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`GSC auth failed: ${err}`)
  }

  const data = await res.json()
  cachedToken = data.access_token
  cachedExpiry = Date.now() + (data.expires_in || 3600) * 1000
  return cachedToken
}

// ─── GSC QUERY ────────────────────────────────────────
async function searchAnalytics(token, body) {
  const url = `${GSC_API}/sites/${encodeURIComponent(SITE_URL)}/searchAnalytics/query`

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })

      if (res.status === 429) {
        const delay = Math.pow(2, attempt) * 2000
        await new Promise(r => setTimeout(r, delay))
        continue
      }

      if (!res.ok) {
        const err = await res.text()
        throw new Error(`GSC API error (${res.status}): ${err}`)
      }

      const data = await res.json()
      return data.rows || []
    } catch (err) {
      if (attempt < 2) {
        await new Promise(r => setTimeout(r, Math.pow(2, attempt) * 1000))
        continue
      }
      throw err
    }
  }
  return []
}

function parseRows(rows, dimPrefix) {
  return rows.map(r => ({
    clicks: Number(r.clicks || 0),
    impressions: Number(r.impressions || 0),
    ctr: Number(r.ctr || 0),
    position: Number(r.position || 0),
    key: String(r.keys?.[0] || ''),
  })).filter(r => r.key)
}

// ─── FETCH GSC DATA ───────────────────────────────────
async function fetchQueryData(token, dateStart, dateEnd) {
  console.log(`  Fetching query data (${dateStart} → ${dateEnd})...`)
  const rows = await searchAnalytics(token, {
    startDate: dateStart,
    endDate: dateEnd,
    dimensions: ['query'],
    rowLimit: QUERY_LIMIT,
    aggregationType: 'auto',
  })
  const parsed = parseRows(rows, 'query')
  console.log(`  → ${parsed.length} queries fetched`)
  return parsed
}

async function fetchPageData(token, dateStart, dateEnd) {
  console.log(`  Fetching page data (${dateStart} → ${dateEnd})...`)
  const rows = await searchAnalytics(token, {
    startDate: dateStart,
    endDate: dateEnd,
    dimensions: ['page'],
    rowLimit: PAGE_LIMIT,
    aggregationType: 'auto',
  })
  const parsed = parseRows(rows, 'page')
  console.log(`  → ${parsed.length} pages fetched`)
  return parsed
}

// ─── STORE IN SUPABASE ────────────────────────────────
async function storeData(date, rows, dimensionType) {
  let saved = 0
  for (const row of rows) {
    const { error } = await supabase
      .from('gsc_search_analytics')
      .upsert({
        date,
        dimension_type: dimensionType,
        dimension_value: row.key,
        clicks: row.clicks,
        impressions: row.impressions,
        ctr: row.ctr,
        avg_position: row.position,
        created_at: new Date().toISOString(),
      }, { onConflict: 'date, dimension_type, dimension_value' })

    if (!error) saved++
  }
  return saved
}

// ─── AI ANALYSIS ──────────────────────────────────────
async function callOpenAI(messages, model = 'gpt-4o-mini', temperature = 0.3) {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: { Authorization: `Bearer ${OPENAI_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model, messages, temperature }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`OpenAI API error (${res.status}): ${err}`)
  }

  const data = await res.json()
  return data.choices?.[0]?.message?.content || ''
}

async function analyzeWithAI(queryData, pageData, dateStart, dateEnd) {
  console.log('\n--- AI Analysis ---')

  const topQueries = queryData
    .sort((a, b) => b.impressions - a.impressions)
    .slice(0, 50)

  const lowCtrQueries = queryData
    .filter(q => q.impressions >= 50 && q.ctr < 0.03)
    .sort((a, b) => b.impressions - a.impressions)
    .slice(0, 30)

  const topPages = pageData
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 50)

  const lowCtrPages = pageData
    .filter(p => p.impressions >= 20 && p.ctr < 0.02)
    .sort((a, b) => b.impressions - a.impressions)
    .slice(0, 30)

  const prompt = `You are an expert SEO analyst and e-commerce consultant specializing in industrial/technical products. You are analyzing Google Search Console data for ${SITE_URL}, a Grundfos pump e-commerce store serving Baltic customers (Estonia, Latvia, Lithuania).

Period: ${dateStart} to ${dateEnd}

CONTEXT: This store sells Grundfos water pumps — industrial and residential pumps (heating, circulation, borewell, drainage, sewage, booster). The audience speaks Estonian, English, Russian, Latvian, and Lithuanian. Products are technical with long consideration cycles.

=== TOP SEARCH QUERIES (by impressions) ===
${JSON.stringify(topQueries, null, 2)}

=== LOW-CTR QUERIES (high impressions, low clickthrough) ===
${JSON.stringify(lowCtrQueries, null, 2)}

=== TOP PAGES (by clicks) ===
${JSON.stringify(topPages, null, 2)}

=== LOW-CTR PAGES (high impressions, low clickthrough) ===
${JSON.stringify(lowCtrPages, null, 2)}

Analyze this data thoroughly and provide specific, actionable recommendations for the DEVELOPMENT team to improve the site's organic search performance. This is NOT about Google Ads — it's about making the website itself rank better.

Focus on:
1. Content gaps: What high-impression queries have no dedicated page?
2. CTR optimization: Queries with high impressions but low CTR — likely meta title/description issues
3. Page-level improvements: Pages that could rank higher with better content, internal linking, or structured data
4. Multilingual opportunities: Are there missed opportunities in non-Estonian languages?
5. Technical SEO issues: Patterns suggesting duplicate content, thin pages, or missing structured data
6. Pump-specific insights: How well does the site capture industry-specific traffic?

IMPORTANT: Make every recommendation specific, actionable, and include concrete data. The recommendations should be implementable by a web developer.

Respond in JSON format with exactly this structure:
{
  "summary": "2-4 sentence executive summary with key findings",
  "recommendations": [
    {
      "title": "Short, specific recommendation",
      "severity": "low|medium|high",
      "category": "content|technical|on-page|internal-linking|structured-data|mobile|speed|keyword-targeting|meta|multilingual",
      "reason": "Data-driven reason with specific numbers from the analysis",
      "expectedImpact": "Estimated impact on organic traffic or rankings",
      "suggestedAction": "Specific step-by-step instructions for the development team",
      "confidenceScore": 0-100,
      "dataEvidence": { "query": "...", "impressions": 0, "currentPosition": 0.0 }
    }
  ],
  "contentGaps": ["List of most important missing content identified"],
  "optimizationOpportunities": ["List of specific on-page/technical improvements"],
  "technicalSuggestions": ["Technical SEO fixes recommended based on data patterns"],
  "actionPlan": "Prioritized 5-8 step action plan ordered by estimated impact"
}`

  console.log('  Calling OpenAI (gpt-4o-mini)...')
  const content = await callOpenAI([
    { role: 'system', content: 'You are an expert technical SEO consultant and e-commerce developer. Respond only with valid JSON. Be data-driven.' },
    { role: 'user', content: prompt },
  ])

  try {
    return JSON.parse(content)
  } catch {
    console.log('  Warning: Could not parse AI response as JSON, returning fallback')
    return {
      summary: content.slice(0, 500),
      recommendations: [],
      contentGaps: [],
      optimizationOpportunities: [],
      technicalSuggestions: [],
      actionPlan: 'Manual review recommended.',
    }
  }
}

// ─── STORE RECOMMENDATIONS ────────────────────────────
async function storeRecommendations(analysis, companyId) {
  if (!analysis.recommendations || analysis.recommendations.length === 0) {
    if (!companyId) {
      console.log('  No company_id found — recommendations will be stored without company association')
    }
    return 0
  }

  let created = 0
  for (const rec of analysis.recommendations) {
    const payload = {
      title: rec.title,
      description: rec.reason,
      severity: rec.severity,
      platform: 'gsc',
      category: `seo_${rec.category || 'general'}`,
      reason: rec.reason,
      data_evidence: rec.dataEvidence || {},
      expected_impact: rec.expectedImpact,
      suggested_action: rec.suggestedAction,
      confidence_score: Math.min(1, Math.max(0, (rec.confidenceScore || 50) / 100)),
      status: 'open',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    if (companyId) {
      payload.company_id = companyId
    } else {
      const { data: companies } = await supabase.from('companies').select('id').limit(1)
      if (companies && companies[0]) payload.company_id = companies[0].id
    }

    const { error } = await supabase
      .from('recommendations')
      .upsert(payload, { onConflict: 'company_id, title', ignoreDuplicates: false })

    if (!error) created++
  }

  return created
}

// ─── GET COMPANY ID ───────────────────────────────────
async function getCompanyId() {
  if (COMPANY_ID) return COMPANY_ID

  const hasTable = await supabase.from('companies').select('id').limit(1)
  if (hasTable.data && hasTable.data[0]) return hasTable.data[0].id

  return null
}

// ─── LOG SYNC ─────────────────────────────────────────
async function createSyncLog(status, startedAt, results) {
  const completedAt = new Date().toISOString()
  const duration = (Date.now() - startedAt) / 1000

  await supabase.from('gsc_sync_logs').insert({
    sync_type: process.env.GITHUB_ACTIONS === 'true' ? 'scheduled' : 'manual',
    status,
    date_start: results.dateStart,
    date_end: results.dateEnd,
    started_at: new Date(startedAt).toISOString(),
    completed_at: completedAt,
    duration_seconds: p(duration),
    queries_imported: results.queriesSaved || 0,
    pages_imported: results.pagesSaved || 0,
    recommendations_created: results.recsCreated || 0,
    error_message: results.error || null,
  })

  await supabase.from('gsc_sync_state').upsert({
    site_url: SITE_URL,
    last_sync_date: results.dateEnd,
    full_sync_completed: true,
    updated_at: completedAt,
  }, { onConflict: 'site_url' })
}

// ─── MAIN ─────────────────────────────────────────────
async function main() {
  console.log('=== GOOGLE SEARCH CONSOLE SYNC ===')
  console.log(`Site: ${SITE_URL}`)
  console.log(`Time: ${new Date().toISOString()}\n`)

  const startedAt = Date.now()
  const dateEnd = daysAgo(0)
  const dateStart = daysAgo(DAYS_TO_FETCH)
  const results = { dateStart, dateEnd, queriesSaved: 0, pagesSaved: 0, recsCreated: 0, error: null }

  try {
    // 1. Get access token
    console.log('1. Authenticating with GSC...')
    const token = await getAccessToken()
    console.log('   Token acquired\n')

    // 2. Verify site access
    console.log('2. Verifying site access...')
    const siteRes = await fetch(`${GSC_API}/sites/${encodeURIComponent(SITE_URL)}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    if (!siteRes.ok) {
      const err = await siteRes.text()
      throw new Error(`Site not accessible: ${err}`)
    }
    const siteInfo = await siteRes.json()
    console.log(`   Permission level: ${siteInfo.permissionLevel || 'unknown'}\n`)

    // 3. Fetch data
    console.log('3. Fetching Search Console data...')
    const [queryData, pageData] = await Promise.all([
      fetchQueryData(token, dateStart, dateEnd),
      fetchPageData(token, dateStart, dateEnd),
    ])

    // 4. Store raw data in Supabase
    console.log('\n4. Storing data in Supabase...')
    results.queriesSaved = await storeData(dateEnd, queryData, 'query')
    results.pagesSaved = await storeData(dateEnd, pageData, 'page')
    console.log(`   Saved ${results.queriesSaved} queries, ${results.pagesSaved} pages`)

    // 5. AI Analysis
    if (!OPENAI_KEY) {
      console.log('\n5. Skipping AI analysis (OPENAI_API_KEY not set)')
    } else {
      console.log('5. Running AI analysis...')
      const analysis = await analyzeWithAI(queryData, pageData, dateStart, dateEnd)

      console.log(`\n--- AI SUMMARY ---`)
      console.log(analysis.summary)
      console.log(`\nRecommendations: ${analysis.recommendations?.length || 0}`)
      console.log(`Content gaps: ${analysis.contentGaps?.length || 0}`)
      console.log(`Optimization opportunities: ${analysis.optimizationOpportunities?.length || 0}`)
      console.log(`Technical suggestions: ${analysis.technicalSuggestions?.length || 0}`)

      if (analysis.recommendations?.length > 0) {
        console.log('\nTop recommendations:')
        for (const r of analysis.recommendations.slice(0, 5)) {
          console.log(`  [${r.severity?.toUpperCase()}] ${r.title}`)
        }
      }

      // 6. Store recommendations
      console.log('\n6. Storing recommendations in Supabase...')
      const companyId = await getCompanyId()
      results.recsCreated = await storeRecommendations(analysis, companyId)
      console.log(`   Created ${results.recsCreated} recommendations`)
    }

    // Log success
    await createSyncLog('completed', startedAt, results)

    const elapsed = p((Date.now() - startedAt) / 1000)
    console.log(`\n=== SYNC COMPLETE (${elapsed}s) ===`)
    console.log(`Queries: ${results.queriesSaved} | Pages: ${results.pagesSaved} | Recommendations: ${results.recsCreated}`)
  } catch (err) {
    console.error(`\nSYNC FAILED: ${err.message}`)
    results.error = err.message
    try { await createSyncLog('failed', startedAt, results) } catch {}
    process.exit(1)
  }
}

main()
