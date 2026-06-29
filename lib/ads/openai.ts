/* eslint-disable @typescript-eslint/no-explicit-any */
export function getOpenAIKey(): string {
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

// ─── ANALYSIS ────────────────────────────────────────
export async function analyzePerformance(data: {
  platform: string
  period: { start: string; end: string }
  campaigns: any[]
  aggregated: any
  comparison: any[]
}): Promise<{
  summary: string
  recommendations: any[]
  problems: string[]
  opportunities: string[]
  actionPlan: string
}> {
  const prompt = `
You are an expert digital advertising analyst specializing in pump/e-commerce advertising. Analyze the following ${data.platform} ad performance data.

Context: This is a Grundfos pump e-commerce store (pumbapood.ee) targeting Baltic customers (EE, LV, LT, PL). Products are industrial/consumer pumps — high consideration purchases with longer sales cycles. Average CPC in this industry is typically €0.50-2.00. Good ROAS benchmark is 3-5x. CTR above 2% is strong for search, above 0.5% for display.

Platform: ${data.platform}
Period: ${data.period.start} to ${data.period.end}

Aggregated metrics:
${JSON.stringify(data.aggregated, null, 2)}

Period-over-period comparison:
${JSON.stringify(data.comparison, null, 2)}

Campaigns (top level):
${JSON.stringify(data.campaigns.slice(0, 20), null, 2)}

Analyze thoroughly and look for:
1. **Budget inefficiencies**: Campaigns spending with zero conversions, overspending vs budget, campaigns limited by budget
2. **Performance outliers**: Campaigns with unusually high/low CPC, CTR, CPA, ROAS vs the account average
3. **Trend problems**: Declining CTR/ROAS over time, sudden cost spikes, conversion drops
4. **Structural issues**: Too many/few campaigns, missing campaign types (remarketing, brand, competitor), conflicting targeting
5. **Seasonality patterns**: Are we entering/leaving a peak season for pump purchases?
6. **Bidding issues**: Manual CPC campaigns that could benefit from automated bidding
7. **Pacing**: Campaigns that will exhaust budget before period end or underspend significantly

Respond in JSON format with exactly this structure:
{
  "summary": "2-4 sentence executive summary with key metrics and overall assessment in the context of this pump business",
  "recommendations": [
    {
      "title": "Short, specific recommendation title (e.g., 'Pause low-ROAS Search campaign X' or 'Increase budget on top-performing Shopping campaign Y')",
      "severity": "low|medium|high",
      "category": "budget|creative|targeting|pause|bidding|structure|remarketing|seasonal|keyword",
      "reason": "Specific data-driven reason with numbers from the data",
      "expectedImpact": "Quantified expected outcome (e.g., 'Could save €50/week' or 'Estimated 20% conversion lift')",
      "suggestedAction": "Step-by-step what exactly to do in Google/Meta Ads",
      "confidenceScore": 0-100
    }
  ],
  "problems": ["List of specific detected problems with supporting data"],
  "opportunities": ["List of identified opportunities unique to pump e-commerce"],
  "actionPlan": "Prioritized step-by-step action plan in 4-6 bullet points, ordered by impact"
}
`

  const content = await callOpenAI([
    { role: 'system', content: 'You are an expert digital advertising analyst specializing in industrial/commercial product e-commerce (pumps, machinery). Respond only with valid JSON. Be specific and data-driven. Reference actual numbers from the data.' },
    { role: 'user', content: prompt },
  ])

  try {
    const parsed = JSON.parse(content)
    return parsed
  } catch {
    // Fallback if JSON parsing fails
    return {
      summary: content.slice(0, 500),
      recommendations: [],
      problems: ['Could not parse AI response'],
      opportunities: [],
      actionPlan: 'Review data manually.',
    }
  }
}

// ─── REPORT WRITING ──────────────────────────────────
export async function generateReportSummary(reportData: {
  title: string
  type: string
  dateRange: string
  metrics: Record<string, number>
  campaigns: any[]
  topCampaigns: string[]
  worstCampaigns: string[]
  changes: Record<string, number>
}): Promise<{ summary: string; actionPlan: string }> {
  const prompt = `
You are an expert advertising report writer for a pump/industrial equipment e-commerce business.

Report: ${reportData.title}
Type: ${reportData.type}
Period: ${reportData.dateRange}

Key Metrics:
${JSON.stringify(reportData.metrics, null, 2)}

Top Performing Campaigns: ${reportData.topCampaigns.join(', ')}
Underperforming Campaigns: ${reportData.worstCampaigns.join(', ')}

Changes vs Previous Period:
${JSON.stringify(reportData.changes, null, 2)}

Write a professional report that:
1. Highlights the most important metric changes and what they mean for the business
2. Calls out winning and losing campaigns by name
3. Provides context on whether performance is above/below industry benchmarks
4. Makes specific, actionable recommendations

Respond in JSON:
{
  "summary": "Professional 2-3 paragraph executive report summary with key findings, naming specific campaigns and metrics",
  "actionPlan": "Numbered action plan with 4-6 specific next steps prioritized by impact"
}
`

  const content = await callOpenAI([
    { role: 'system', content: 'You are an expert advertising report writer. Respond only with valid JSON.' },
    { role: 'user', content: prompt },
  ])

  try {
    return JSON.parse(content)
  } catch {
    return {
      summary: content.slice(0, 1000),
      actionPlan: '1. Review report data manually.',
    }
  }
}

// ─── CHANGE REQUEST ANALYSIS ─────────────────────────
export async function analyzeChangeImpact(changeData: {
  action: string
  targetType: string
  targetName: string
  beforeValues: Record<string, unknown>
  afterValues: Record<string, unknown>
  platform: string
}): Promise<{
  risk: 'low' | 'medium' | 'high'
  expectedImpact: string
  warnings: string[]
  rollbackPossible: boolean
}> {
  const prompt = `
Analyze this advertising change request and provide risk assessment:

Action: ${changeData.action}
Target: ${changeData.targetType} - ${changeData.targetName}
Platform: ${changeData.platform}
Before: ${JSON.stringify(changeData.beforeValues)}
After: ${JSON.stringify(changeData.afterValues)}

Respond in JSON:
{
  "risk": "low|medium|high",
  "expectedImpact": "Describe the expected impact of this change",
  "warnings": ["List any warnings or considerations"],
  "rollbackPossible": true|false
}
`

  const content = await callOpenAI([
    { role: 'system', content: 'You are a risk assessment AI for ad operations. Respond only with valid JSON.' },
    { role: 'user', content: prompt },
  ])

  try {
    return JSON.parse(content)
  } catch {
    return {
      risk: 'medium',
      expectedImpact: 'Unable to assess automatically.',
      warnings: ['AI analysis failed; review manually.'],
      rollbackPossible: true,
    }
  }
}

// ─── AUDIT ───────────────────────────────────────────
export async function generateAuditReport(auditData: {
  platform: string
  campaigns: any[]
  adGroups: any[]
  ads: any[]
  insights: any[]
  period: string
}): Promise<string> {
  const prompt = `
You are a senior Google Ads auditor performing a comprehensive audit for a Grundfos pump e-commerce store (pumbapood.ee) targeting Baltic countries. Write in a professional consultant style, 800-1200 words.

Platform: ${auditData.platform}
Period: ${auditData.period}

Total Campaigns: ${auditData.campaigns.length}
Total Ads: ${auditData.ads.length}

Campaigns data:
${JSON.stringify(auditData.campaigns.slice(0, 30), null, 2)}

Key insights:
${JSON.stringify(auditData.insights.slice(0, 30), null, 2)}

Audit checklist — cover ALL of these sections:

1. **Account Structure & Organization** — Are campaigns logically grouped? Is there a clear naming convention? Are there separate campaigns for brand vs generic vs competitor? Shopping vs Search vs Display vs Remarketing?

2. **Campaign Performance** — Identify top 3 and bottom 3 campaigns by ROAS. Which campaigns have high spend but zero conversions? Any campaigns limited by budget? Are conversion tracking values set correctly?

3. **Budget Allocation** — Is spend proportional to ROAS? Are high-ROAS campaigns underfunded? Any daily budget caps hitting limits and losing impression share? What % of budget goes to brand vs non-brand?

4. **Bidding Strategy** — Manual vs automated bidding? Are campaigns using appropriate bid strategies (Target CPA, Target ROAS, Maximize Conversions)? Any campaigns that would benefit from switching strategies?

5. **Ad & Creative Quality** — Ad relevance? Are there at least 3 ads per ad group for testing? RSA coverage? Any ads with 'Poor' or 'Average' ratings? Creative fatigue signs?

6. **Keyword & Search Term Analysis** — Are negative keywords being used? Are there irrelevant search terms wasting budget? Are exact match keywords capturing high-intent traffic? Broad match overspend?

7. **Landing Page Experience** — Are ads pointing to relevant product/category pages? Any broken links? Mobile optimization status?

8. **Conversion Tracking Health** — Are all conversion actions tracking correctly? Any discrepancies between Google Ads conversions and actual sales? Attribution model review.

9. **Audience & Remarketing** — Are remarketing audiences set up? RLSA campaigns? Customer match lists? Any audience exclusions?

10. **Competitive Position** — Impression share analysis. Are competitors outbidding on key terms? Search lost IS (budget vs rank)?

Format your response as a structured audit report with numbered sections, specific findings with data evidence, severity ratings (🔴 Critical / 🟡 Important / 🟢 Good), and prioritized recommendations.
`

  return await callOpenAI([
    { role: 'system', content: 'You are a senior digital advertising consultant specializing in industrial B2B/B2C e-commerce. Be specific and reference actual data.' },
    { role: 'user', content: prompt },
  ], 'gpt-4o-mini', 0.5)
}

// ─── KEYWORD / SEARCH TERM ANALYSIS ──────────────────
export async function analyzeSearchTerms(searchTermData: {
  searchTerms: Array<{
    query: string
    impressions: number
    clicks: number
    cost: number
    conversions: number
    conversionValue: number
    ctr: number
    cpc: number
    matchType: string
  }>
  campaignName: string
}): Promise<{
  negativeKeywords: string[]
  exactMatchOpportunities: string[]
  wastedSpend: string[]
  highValueTerms: string[]
  analysis: string
}> {
  const prompt = `
You are an expert Google Ads search term analyst for a pump e-commerce store.

Campaign: ${searchTermData.campaignName}

Search term performance data:
${JSON.stringify(searchTermData.searchTerms.slice(0, 100), null, 2)}

Analyze these search terms and identify:
1. **Negative keywords**: Search terms that trigger ads but are irrelevant to selling pumps (e.g., free, repair, job, manual, diagram). List the exact keyword phrases to add as negatives.
2. **Exact match opportunities**: High-converting search terms currently on broad/phrase match that should be added as exact match keywords with higher bids.
3. **Wasted spend**: Terms with significant spend (>€10) but zero conversions. Show the exact query and wasted amount.
4. **High-value terms**: Terms with ROAS > 200% that should get more budget/bid.

Respond in JSON:
{
  "negativeKeywords": ["exact phrase to negate", ...],
  "exactMatchOpportunities": ["high-converting query", ...],
  "wastedSpend": ["query (€X.XX wasted)", ...],
  "highValueTerms": ["query (ROAS X.Xx)", ...],
  "analysis": "Brief narrative analysis with top findings and recommendations"
}
`

  const content = await callOpenAI([
    { role: 'system', content: 'You are a search term analysis specialist. Respond only with valid JSON.' },
    { role: 'user', content: prompt },
  ])

  try {
    return JSON.parse(content)
  } catch {
    return {
      negativeKeywords: [],
      exactMatchOpportunities: [],
      wastedSpend: [],
      highValueTerms: [],
      analysis: content.slice(0, 500),
    }
  }
}

// ─── BUDGET PACING ANALYSIS ──────────────────────────
export async function analyzeBudgetPacing(pacingData: {
  campaignName: string
  dailyBudget: number
  daysElapsed: number
  daysInPeriod: number
  totalSpend: number
  avgDailySpend: number
  projectedSpend: number
  conversions: number
  projectedConversions: number
  impressionShare: number
  budgetLostImpressionShare: number
}): Promise<{
  status: 'under' | 'on_track' | 'over' | 'capped'
  recommendation: string
  projectedEndSpend: number
  budgetAdjustment: number
}> {
  const prompt = `
Analyze this campaign budget pacing data for a pump e-commerce store:

Campaign: ${pacingData.campaignName}
Daily Budget: €${pacingData.dailyBudget}
Days Elapsed: ${pacingData.daysElapsed}/${pacingData.daysInPeriod}
Total Spend: €${pacingData.totalSpend.toFixed(2)}
Avg Daily Spend: €${pacingData.avgDailySpend.toFixed(2)}
Projected Period Spend: €${pacingData.projectedSpend.toFixed(2)}
Conversions: ${pacingData.conversions}
Projected Conversions: ${pacingData.projectedConversions}
Impression Share: ${pacingData.impressionShare}%
Budget Lost IS: ${pacingData.budgetLostImpressionShare}%

Determine if this campaign is under-spending, on-track, overspending, or capped (limited by budget).
If capped with positive ROAS, recommend budget increase.
If overspending with negative ROAS, recommend budget decrease or pausing.

Respond in JSON:
{
  "status": "under|on_track|over|capped",
  "recommendation": "Specific actionable recommendation",
  "projectedEndSpend": number,
  "budgetAdjustment": number (positive = increase budget, negative = decrease)
}
`

  const content = await callOpenAI([
    { role: 'system', content: 'You are a budget optimization specialist. Respond only with valid JSON.' },
    { role: 'user', content: prompt },
  ])

  try {
    return JSON.parse(content)
  } catch {
    return {
      status: 'on_track',
      recommendation: 'Unable to analyze. Review manually.',
      projectedEndSpend: pacingData.projectedSpend,
      budgetAdjustment: 0,
    }
  }
}
