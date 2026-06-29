export type Platform = 'google_ads' | 'meta_ads' | 'ga4' | 'all'

export type ChangeRequestStatus = 'pending' | 'approved' | 'rejected' | 'executed' | 'failed'
export type ChangeRequestSource = 'manual' | 'ai_recommendation'
export type TargetType = 'campaign' | 'ad_group' | 'ad_set' | 'ad'
export type Severity = 'low' | 'medium' | 'high'
export type SyncType = 'manual' | 'scheduled' | 'webhook'
export type SyncStatus = 'running' | 'completed' | 'failed' | 'partial'
export type ReportFrequency = 'daily' | 'weekly' | 'monthly'
export type ReportType =
  | 'executive_summary'
  | 'campaign_performance'
  | 'channel_comparison'
  | 'budget_efficiency'
  | 'conversion'
  | 'roas'
  | 'lead_generation'
  | 'creative_performance'
  | 'search_terms'
  | 'audience_placement'
  | 'landing_page'
  | 'ai_audit'

export interface Company {
  id: string
  name: string
  slug: string | null
  logo_url: string | null
  created_at: string
  updated_at: string
}

export interface AdPlatform {
  id: string
  name: string
  slug: string
  enabled: boolean
  created_at: string
}

export interface AdAccount {
  id: string
  company_id: string
  platform_id: string
  platform_account_id: string
  account_name: string
  account_currency: string
  account_timezone: string
  status: string
  credentials: Record<string, string> | null
  connected_at: string | null
  last_sync_at: string | null
  created_at: string
  updated_at: string
  platform?: AdPlatform
}

export interface Campaign {
  id: string
  account_id: string
  platform_campaign_id: string
  campaign_name: string
  platform: 'google_ads' | 'meta_ads'
  status: string
  objective: string | null
  daily_budget: number | null
  lifetime_budget: number | null
  budget_type: 'daily' | 'lifetime' | null
  start_date: string | null
  end_date: string | null
  targeting: Record<string, unknown> | null
  raw_data: Record<string, unknown> | null
  last_sync_at: string | null
  created_at: string
  updated_at: string
}

export interface AdGroup {
  id: string
  campaign_id: string
  platform_ad_group_id: string
  ad_group_name: string
  status: string
  type: string | null
  daily_budget: number | null
  targeting: Record<string, unknown> | null
  raw_data: Record<string, unknown> | null
  last_sync_at: string | null
  created_at: string
  updated_at: string
}

export interface AdSet {
  id: string
  campaign_id: string
  platform_ad_set_id: string
  ad_set_name: string
  status: string
  daily_budget: number | null
  lifetime_budget: number | null
  budget_type: 'daily' | 'lifetime' | null
  targeting: Record<string, unknown> | null
  raw_data: Record<string, unknown> | null
  last_sync_at: string | null
  created_at: string
  updated_at: string
}

export interface Ad {
  id: string
  campaign_id: string
  ad_group_id: string | null
  ad_set_id: string | null
  platform_ad_id: string
  ad_name: string
  status: string
  ad_type: string | null
  platform: 'google_ads' | 'meta_ads'
  raw_data: Record<string, unknown> | null
  last_sync_at: string | null
  created_at: string
  updated_at: string
}

export interface Creative {
  id: string
  ad_id: string
  platform_creative_id: string | null
  headline: string | null
  description: string | null
  cta: string | null
  image_url: string | null
  video_url: string | null
  thumbnail_url: string | null
  destination_url: string | null
  display_url: string | null
  creative_type: string | null
  creative_template: string | null
  raw_data: Record<string, unknown> | null
  created_at: string
  updated_at: string
}

export interface DailyInsight {
  id: string
  date: string
  platform: 'google_ads' | 'meta_ads' | 'ga4'
  account_id: string
  campaign_id: string | null
  ad_group_id: string | null
  ad_set_id: string | null
  ad_id: string | null
  spend: number
  impressions: number
  reach: number
  frequency: number
  clicks: number
  link_clicks: number
  ctr: number
  cpc: number
  cpm: number
  conversions: number
  conversion_value: number
  cost_per_conversion: number
  roas: number
  leads: number
  purchases: number
  add_to_cart: number
  landing_page_views: number
  engagement: number
  video_views: number
  custom_events: Record<string, unknown>
  raw_data: Record<string, unknown>
  created_at: string
}

export interface ConversionEvent {
  id: string
  account_id: string
  platform: 'google_ads' | 'meta_ads' | 'ga4'
  platform_event_id: string | null
  event_name: string
  event_category: string | null
  count: number
  value: number
  last_occurrence: string | null
  created_at: string
  updated_at: string
}

export interface Recommendation {
  id: string
  company_id: string
  title: string
  description: string | null
  severity: Severity
  platform: Platform | null
  category: string | null
  affected_campaign_id: string | null
  affected_ad_group_id: string | null
  affected_ad_set_id: string | null
  affected_ad_id: string | null
  reason: string | null
  data_evidence: Record<string, unknown> | null
  expected_impact: string | null
  suggested_action: string | null
  confidence_score: number | null
  change_request_payload: Record<string, unknown> | null
  status: 'open' | 'applied' | 'dismissed'
  created_at: string
  updated_at: string
}

export interface ChangeRequest {
  id: string
  company_id: string
  title: string
  description: string | null
  platform: 'google_ads' | 'meta_ads'
  action_type: string
  target_type: TargetType
  target_id: string | null
  target_platform_id: string | null
  before_values: Record<string, unknown> | null
  after_values: Record<string, unknown> | null
  status: ChangeRequestStatus
  created_by: string | null
  reviewed_by: string | null
  reviewed_at: string | null
  executed_at: string | null
  api_response: Record<string, unknown> | null
  error_message: string | null
  rollback_notes: string | null
  source: ChangeRequestSource | null
  recommendation_id: string | null
  created_at: string
  updated_at: string
}

export interface ChangeLog {
  id: string
  company_id: string
  change_request_id: string | null
  platform: 'google_ads' | 'meta_ads'
  action_type: string
  target_type: string
  target_name: string | null
  target_platform_id: string | null
  before_values: Record<string, unknown> | null
  after_values: Record<string, unknown> | null
  result: 'success' | 'partial' | 'failed'
  api_response: Record<string, unknown> | null
  error_message: string | null
  performed_by: string | null
  performed_at: string
  rollback_notes: string | null
  created_at: string
}

export interface ReportTemplate {
  id: string
  company_id: string
  name: string
  description: string | null
  report_type: ReportType
  config: Record<string, unknown>
  is_default: boolean
  created_by: string | null
  created_at: string
  updated_at: string
}

export interface GeneratedReport {
  id: string
  company_id: string
  template_id: string | null
  title: string
  report_type: ReportType
  date_start: string
  date_end: string
  compare_start: string | null
  compare_end: string | null
  platforms: string[] | null
  filters: Record<string, unknown>
  summary: Record<string, unknown>
  sections: ReportSection[]
  ai_summary: string | null
  ai_action_plan: string | null
  html_content: string | null
  pdf_url: string | null
  created_by: string | null
  created_at: string
}

export interface ReportSection {
  id: string
  report_id: string
  section_type: string
  title: string
  content: Record<string, unknown>
  sort_order: number
}

export interface ScheduledReport {
  id: string
  company_id: string
  template_id: string | null
  name: string
  frequency: 'daily' | 'weekly' | 'monthly'
  day_of_week: number | null
  day_of_month: number | null
  recipients: string[]
  format: 'pdf' | 'html' | 'csv'
  enabled: boolean
  last_sent_at: string | null
  created_at: string
  updated_at: string
}

export interface SyncLog {
  id: string
  account_id: string
  platform: 'google_ads' | 'meta_ads' | 'ga4'
  sync_type: SyncType
  status: SyncStatus
  date_start: string | null
  date_end: string | null
  started_at: string
  completed_at: string | null
  duration_seconds: number | null
  rows_imported: number
  error_message: string | null
  error_details: Record<string, unknown> | null
  created_at: string
}

export interface ApiErrorLog {
  id: string
  account_id: string | null
  platform: 'google_ads' | 'meta_ads' | 'ga4'
  endpoint: string | null
  request_body: Record<string, unknown> | null
  response_body: Record<string, unknown> | null
  status_code: number | null
  error_code: string | null
  error_message: string | null
  is_permission_error: boolean
  created_at: string
}

export interface AggregatedInsight {
  platform: string
  account_id: string
  campaign_id: string
  total_spend: number
  total_impressions: number
  total_clicks: number
  total_conversions: number
  total_conversion_value: number
  avg_ctr: number
  avg_cpc: number
  avg_cpm: number
  avg_cpa: number
  avg_roas: number
  total_leads: number
  total_purchases: number
}

export interface PeriodComparison {
  metric: string
  current_value: number
  previous_value: number
  change_pct: number | null
}

export interface MutationPayload {
  action:
    | 'pause_campaign'
    | 'resume_campaign'
    | 'update_budget'
    | 'pause_ad_group'
    | 'resume_ad_group'
    | 'pause_ad_set'
    | 'resume_ad_set'
    | 'update_ad_set_budget'
    | 'pause_ad'
    | 'resume_ad'
    | 'create_ad_variant'
    | 'duplicate_campaign'
    | 'duplicate_ad'
    | 'duplicate_ad_set'
  target_type: TargetType
  target_id: string
  platform: 'google_ads' | 'meta_ads'
  values: Record<string, unknown>
}

export interface GoogleAdsCredentials {
  developerToken: string
  clientId: string
  clientSecret: string
  refreshToken: string
  loginCustomerId: string
}

export interface MetaAdsCredentials {
  accessToken: string
  adAccountId: string
  businessId: string
  apiVersion: string
}

export interface IntegrationStatus {
  google_ads: {
    connected: boolean
    error: string | null
    lastSync: string | null
    permissions: string[]
  }
  meta_ads: {
    connected: boolean
    error: string | null
    lastSync: string | null
    permissions: string[]
  }
  ga4: {
    connected: boolean
    error: string | null
    lastSync: string | null
    propertyId: string | null
  }
}

export interface SyncResult {
  success: boolean
  platform: Platform
  rowsImported: number
  durationSeconds: number
  errors: string[]
}

export interface ReportFilter {
  field: string
  operator: 'eq' | 'neq' | 'contains' | 'gt' | 'gte' | 'lt' | 'lte' | 'in'
  value: unknown
}

export interface ReportConfig {
  reportType: ReportType
  title: string
  dateStart: string
  dateEnd: string
  compareStart?: string
  compareEnd?: string
  platforms: Platform[]
  accountIds: string[]
  campaignIds: string[]
  filters: ReportFilter[]
  sections: string[]
}

export interface ChartDataPoint {
  date: string
  platform?: string
  campaign?: string
  spend?: number
  impressions?: number
  clicks?: number
  conversions?: number
  revenue?: number
  roas?: number
  ctr?: number
  cpc?: number
}

export interface MetricCardData {
  label: string
  value: number
  previousValue: number
  format: 'currency' | 'number' | 'percentage' | 'ratio'
  change: number
  trend: 'up' | 'down' | 'neutral'
}

export interface SearchTerm {
  id: string
  account_id: string
  campaign_id: string | null
  query_text: string
  match_type: string | null
  impressions: number
  clicks: number
  ctr: number
  cpc: number
  spend: number
  conversions: number
  conversion_value: number
  cost_per_conversion: number
  roas: number
  date_range_start: string
  date_range_end: string
  raw_data: Record<string, unknown> | null
  created_at: string
}

export interface Keyword {
  id: string
  account_id: string
  campaign_id: string | null
  keyword_text: string
  match_type: string | null
  status: string | null
  cpc_bid_micros: number
  quality_score: number | null
  impressions: number
  clicks: number
  ctr: number
  cpc: number
  spend: number
  conversions: number
  conversion_value: number
  impression_share: number
  date_range_start: string
  date_range_end: string
  raw_data: Record<string, unknown> | null
  created_at: string
}

export interface AuctionInsight {
  id: string
  account_id: string
  campaign_id: string | null
  competitor_domain: string
  impression_share: number
  avg_position: number
  overlap_rate: number
  position_above_rate: number
  top_of_page_rate: number
  outranking_share: number
  date_range_start: string
  date_range_end: string
  raw_data: Record<string, unknown> | null
  created_at: string
}

export interface BudgetAlert {
  id: string
  account_id: string
  campaign_id: string
  alert_type: 'overspend' | 'underspend' | 'budget_capped' | 'budget_exhausted' | 'roas_drop' | 'cpa_spike'
  severity: 'low' | 'medium' | 'high' | 'critical'
  message: string
  current_value: number
  threshold_value: number | null
  is_active: boolean
  acknowledged_at: string | null
  created_at: string
}
