export interface GscSearchAnalyticsRow {
  id: string
  date: string
  dimension_type: 'query' | 'page'
  dimension_value: string
  clicks: number
  impressions: number
  ctr: number
  avg_position: number
  created_at: string
}

export interface GscQueryData {
  query: string
  clicks: number
  impressions: number
  ctr: number
  avg_position: number
}

export interface GscPageData {
  page: string
  clicks: number
  impressions: number
  ctr: number
  avg_position: number
}

export interface GscSyncResult {
  success: boolean
  queriesImported: number
  pagesImported: number
  recommendationsCreated: number
  durationSeconds: number
  error?: string
}

export interface GscAnalysisResult {
  summary: string
  topPerformers: {
    queries: Array<{ query: string; clicks: number; impressions: number; ctr: number; position: number }>
    pages: Array<{ page: string; clicks: number; impressions: number; ctr: number; position: number }>
  }
  improvementOpportunities: Array<{
    title: string
    severity: 'low' | 'medium' | 'high'
    category: string
    description: string
    expectedImpact: string
    suggestedAction: string
    dataEvidence: string
  }>
  contentGaps: Array<{
    query: string
    impressions: number
    avgPosition: number
    suggestion: string
  }>
  decliningPages: Array<{
    page: string
    prevClicks: number
    currentClicks: number
    changePct: number
    suggestion: string
  }>
  technicalSeoIssues: string[]
  actionPlan: string
}
