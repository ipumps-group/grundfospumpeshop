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
You are an expert digital advertising analyst. Analyze the following ad performance data and provide insights.

Platform: ${data.platform}
Period: ${data.period.start} to ${data.period.end}

Aggregated metrics:
${JSON.stringify(data.aggregated, null, 2)}

Period-over-period comparison:
${JSON.stringify(data.comparison, null, 2)}

Campaigns (top level):
${JSON.stringify(data.campaigns.slice(0, 20), null, 2)}

Respond in JSON format with exactly this structure:
{
  "summary": "2-3 sentence executive summary",
  "recommendations": [
    {
      "title": "Short recommendation title",
      "severity": "low|medium|high",
      "category": "budget|creative|targeting|pause|duplicate",
      "reason": "Why this recommendation",
      "expectedImpact": "Expected outcome",
      "suggestedAction": "What to do",
      "confidenceScore": 0-100
    }
  ],
  "problems": ["List of detected problems"],
  "opportunities": ["List of identified opportunities"],
  "actionPlan": "Step-by-step action plan in 3-5 bullet points"
}
`

  const content = await callOpenAI([
    { role: 'system', content: 'You are an expert digital advertising analyst. Respond only with valid JSON.' },
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
You are an expert advertising report writer. Generate a professional report summary and action plan.

Title: ${reportData.title}
Type: ${reportData.type}
Period: ${reportData.dateRange}

Key Metrics:
${JSON.stringify(reportData.metrics, null, 2)}

Top Campaigns: ${reportData.topCampaigns.join(', ')}
Worst Campaigns: ${reportData.worstCampaigns.join(', ')}

Changes vs Previous Period:
${JSON.stringify(reportData.changes, null, 2)}

Respond in JSON:
{
  "summary": "Professional 3-4 paragraph executive report summary with key findings",
  "actionPlan": "Numbered action plan with 3-5 specific next steps"
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
You are an expert advertising auditor. Perform a comprehensive audit of the following ad account.

Platform: ${auditData.platform}
Period: ${auditData.period}

Total Campaigns: ${auditData.campaigns.length}
Total Ads: ${auditData.ads.length}

Campaigns data:
${JSON.stringify(auditData.campaigns.slice(0, 30), null, 2)}

Key insights:
${JSON.stringify(auditData.insights.slice(0, 30), null, 2)}

Provide a thorough audit report covering:
1. Account structure & organization
2. Campaign performance & efficiency
3. Ad creative quality & fatigue signs
4. Budget allocation & waste
5. Targeting effectiveness
6. Conversion tracking setup
7. Landing page experience (if available)
8. Specific recommendations with priorities
9. Quick wins
10. Strategic opportunities

Write in a professional consultant style, 800-1200 words.
`

  return await callOpenAI([
    { role: 'system', content: 'You are a senior digital advertising consultant performing an audit.' },
    { role: 'user', content: prompt },
  ], 'gpt-4o-mini', 0.5)
}
