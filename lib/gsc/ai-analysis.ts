/* eslint-disable @typescript-eslint/no-explicit-any */
import type { GscQueryData, GscPageData } from './types'

function getOpenAIKey(): string {
  const key = process.env.OPENAI_API_KEY
  if (!key) throw new Error('OPENAI_API_KEY not configured')
  return key
}

async function callOpenAI(messages: any[], model = 'gpt-4o-mini', temperature = 0.3): Promise<string> {
  const key = getOpenAIKey()

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ model, messages, temperature }),
  })

  if (!res.ok) {
    const err = await res.text()
    throw new Error(`OpenAI API error (${res.status}): ${err}`)
  }

  const data = await res.json()
  return data.choices?.[0]?.message?.content || ''
}

// ─── SEARCH PERFORMANCE ANALYSIS ─────────────────────
export async function analyzeSearchPerformance(
  queryData: GscQueryData[],
  pageData: GscPageData[],
  siteUrl: string,
  period: { start: string; end: string },
): Promise<{
  summary: string
  recommendations: Array<{
    title: string
    severity: 'low' | 'medium' | 'high'
    category: string
    reason: string
    expectedImpact: string
    suggestedAction: string
    confidenceScore: number
    dataEvidence: Record<string, unknown>
  }>
  contentGaps: string[]
  optimizationOpportunities: string[]
  technicalSuggestions: string[]
  actionPlan: string
}> {
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

  const prompt = `
You are an expert SEO analyst and e-commerce consultant specializing in industrial/technical products. You are analyzing Google Search Console data for ${siteUrl}, a Grundfos pump e-commerce store serving Baltic customers (Estonia, Latvia, Lithuania).

Period: ${period.start} to ${period.end}

CONTEXT: This store sells Grundfos water pumps — industrial and residential pumps (heating, circulation, borewell, drainage, sewage, booster). The audience speaks Estonian, English, Russian, Latvian, and Lithuanian. Products are technical with long consideration cycles.

=== TOP SEARCH QUERIES (by impressions) ===
${JSON.stringify(topQueries, null, 2)}

=== LOW-CTR QUERIES (high impressions, low clickthrough) ===
${JSON.stringify(lowCtrQueries, null, 2)}

=== TOP PAGES (by clicks) ===
${JSON.stringify(topPages, null, 2)}

=== LOW-CTR PAGES (high impressions, low clickthrough) ===
${JSON.stringify(lowCtrPages, null, 2)}

Analyze this data thoroughly and provide:

1. **Executive Summary** (3-4 sentences): What's working well? What are the main problems? Overall SEO health assessment.

2. **Content Gap Analysis**: Search queries with significant impressions (>100) but weak position (>15) — these represent content the site could rank better for. What specific pages or content should be created?

3. **CTR Optimization**: For queries/pages with strong impressions but low CTR (<3%), diagnose why: are meta titles/descriptions weak? Is the page irrelevant to the query? Are competitors outranking?

4. **Page-Level Opportunities**: Which pages have strong impressions but could rank even higher with improvements? Consider page speed, content depth, internal linking, and structured data.

5. **Technical SEO**: Based on the data patterns, identify likely technical issues: duplicate content patterns, thin content pages, missing structured data opportunities, mobile usability concerns.

6. **Pump-Specific Insights**: Look for pump-specific queries (e.g., "tsirkulatsioonipump", "borewell pump", "soojuspump", "drenaažipump", "santehnika") — how well is the site capturing industry-specific traffic?

IMPORTANT: Focus on actionable development/site-improvement recommendations, not Google Ads campaign advice. This is about making the website itself perform better in organic search.

Respond in JSON format with exactly this structure:
{
  "summary": "2-4 sentence executive summary with key SEO findings",
  "recommendations": [
    {
      "title": "Short, specific recommendation (e.g., 'Create dedicated page for query X' or 'Improve meta title for page Y')",
      "severity": "low|medium|high",
      "category": "content|technical|on-page|internal-linking|structured-data|mobile|speed|keyword-targeting|meta|multilingual",
      "reason": "Data-driven reason with specific numbers from the analysis",
      "expectedImpact": "Estimated impact on organic traffic or rankings",
      "suggestedAction": "Specific step-by-step instructions for the development team",
      "confidenceScore": 0-100,
      "dataEvidence": { "query": "...", "impressions": 000, "currentPosition": 0.0 }
    }
  ],
  "contentGaps": ["List of most important missing content identified"],
  "optimizationOpportunities": ["List of specific on-page/technical improvements"],
  "technicalSuggestions": ["Technical SEO fixes recommended based on data patterns"],
  "actionPlan": "Prioritized 5-8 step action plan ordered by estimated impact"
}
`

  const content = await callOpenAI([
    {
      role: 'system',
      content: 'You are an expert technical SEO consultant and e-commerce developer. You analyze Search Console data to make specific, actionable site improvement recommendations. Respond only with valid JSON. Be data-driven — reference actual queries, pages, and numbers from the data.',
    },
    { role: 'user', content: prompt },
  ])

  try {
    return JSON.parse(content)
  } catch {
    return {
      summary: content.slice(0, 500),
      recommendations: [],
      contentGaps: [],
      optimizationOpportunities: [],
      technicalSuggestions: [],
      actionPlan: 'Manual review recommended — AI analysis parsing failed.',
    }
  }
}

// ─── QUERY-LEVEL DEEP ANALYSIS ───────────────────────
export async function analyzeQueryOpportunities(
  queries: GscQueryData[],
  siteUrl: string,
): Promise<{
  highPotentialQueries: Array<{ query: string; reason: string; suggestedAction: string }>
  decliningQueries: Array<{ query: string; issue: string; fix: string }>
  analysis: string
}> {
  const prompt = `
You are an SEO keyword analyst for ${siteUrl}, a Grundfos pump e-commerce store.

Analyze these search queries and their performance data:
${JSON.stringify(queries.slice(0, 100), null, 2)}

Identify:
1. **High-potential queries**: Terms with high impressions (>100) but low position (>8) that could be targeted with dedicated landing pages or content optimization.
2. **Declining queries**: Patterns suggesting queries losing rankings — low CTR despite good position, indicating competitors are taking clicks.
3. **Quick wins**: Queries where small changes (meta title/description updates, internal linking) could significantly improve rankings.

Respond in JSON:
{
  "highPotentialQueries": [{"query": "...", "reason": "...", "suggestedAction": "..."}],
  "decliningQueries": [{"query": "...", "issue": "...", "fix": "..."}],
  "analysis": "Brief narrative analysis"
}
`

  const content = await callOpenAI([
    { role: 'system', content: 'You are an SEO keyword research specialist. Respond only with valid JSON.' },
    { role: 'user', content: prompt },
  ])

  try {
    return JSON.parse(content)
  } catch {
    return {
      highPotentialQueries: [],
      decliningQueries: [],
      analysis: content.slice(0, 500),
    }
  }
}
