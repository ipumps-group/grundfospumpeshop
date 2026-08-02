import ExcelJS from 'exceljs'
import type { DailyInsight, Campaign, AggregatedInsight } from './types'

// ─── CSV ─────────────────────────────────────────────
export function insightsToCSV(insights: DailyInsight[]): string {
  const headers = [
    'Date', 'Platform', 'Campaign ID', 'Spend', 'Impressions', 'Clicks',
    'CTR', 'CPC', 'CPM', 'Conversions', 'Revenue', 'ROAS', 'Leads', 'Purchases',
  ]

  const rows = insights.map(i => [
    i.date, i.platform, i.campaign_id, i.spend, i.impressions, i.clicks,
    i.ctr, i.cpc, i.cpm, i.conversions, i.conversion_value, i.roas, i.leads, i.purchases,
  ])

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
}

export function campaignsToCSV(campaigns: Campaign[]): string {
  const headers = [
    'Name', 'Platform', 'Status', 'Objective', 'Daily Budget',
    'Lifetime Budget', 'Start Date', 'End Date',
  ]

  const rows = campaigns.map(c => [
    `"${c.campaign_name}"`, c.platform, c.status, c.objective || '',
    c.daily_budget || 0, c.lifetime_budget || 0,
    c.start_date || '', c.end_date || '',
  ])

  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
}

// ─── XLSX ────────────────────────────────────────────
export async function insightsToXLSX(insights: DailyInsight[], title = 'Ads Insights'): Promise<Buffer> {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'Pump OÜ'
  wb.title = title

  // Summary sheet
  const summaryData = [
    { Metric: 'Total Spend', Value: insights.reduce((s, i) => s + i.spend, 0) },
    { Metric: 'Total Impressions', Value: insights.reduce((s, i) => s + i.impressions, 0) },
    { Metric: 'Total Clicks', Value: insights.reduce((s, i) => s + i.clicks, 0) },
    { Metric: 'Total Conversions', Value: insights.reduce((s, i) => s + i.conversions, 0) },
    { Metric: 'Total Revenue', Value: insights.reduce((s, i) => s + i.conversion_value, 0) },
    { Metric: 'Total Leads', Value: insights.reduce((s, i) => s + i.leads, 0) },
    { Metric: 'Total Purchases', Value: insights.reduce((s, i) => s + i.purchases, 0) },
  ]

  const summaryWs = wb.addWorksheet('Summary')
  summaryWs.columns = [{ header: 'Metric', key: 'Metric', width: 24 }, { header: 'Value', key: 'Value', width: 18 }]
  summaryWs.addRows(summaryData)

  // Detail sheet
  const detailRows = insights.map(i => ({
    Date: i.date,
    Platform: i.platform,
    Spend: i.spend,
    Impressions: i.impressions,
    Clicks: i.clicks,
    CTR: i.ctr,
    CPC: i.cpc,
    CPM: i.cpm,
    Conversions: i.conversions,
    Revenue: i.conversion_value,
    ROAS: i.roas,
    Leads: i.leads,
    Purchases: i.purchases,
  }))

  const detailWs = wb.addWorksheet('Daily Insights')
  const detailHeaders = Object.keys(detailRows[0] || { Date: '', Platform: '', Spend: '' })
  detailWs.columns = detailHeaders.map(key => ({ header: key, key, width: Math.max(12, key.length + 3) }))
  detailWs.addRows(detailRows)

  for (const sheet of wb.worksheets) {
    sheet.getRow(1).font = { bold: true }
    sheet.views = [{ state: 'frozen', ySplit: 1 }]
  }
  return Buffer.from(await wb.xlsx.writeBuffer())
}

// ─── AGGREGATED TO XLSX ─────────────────────────────
export async function aggregatedToXLSX(data: AggregatedInsight[], campaigns: Campaign[]): Promise<Buffer> {
  const wb = new ExcelJS.Workbook()
  wb.creator = 'Pump OÜ'

  const campMap = new Map(campaigns.map(c => [c.id, c.campaign_name]))

  const rows = data.map(d => ({
    Campaign: campMap.get(d.campaign_id) || d.campaign_id,
    Platform: d.platform,
    Spend: d.total_spend,
    Impressions: d.total_impressions,
    Clicks: d.total_clicks,
    Conversions: d.total_conversions,
    Revenue: d.total_conversion_value,
    CTR: d.avg_ctr,
    CPC: d.avg_cpc,
    CPM: d.avg_cpm,
    CPA: d.avg_cpa,
    ROAS: d.avg_roas,
    Leads: d.total_leads,
    Purchases: d.total_purchases,
  }))

  const ws = wb.addWorksheet('Campaign Performance')
  const headers = Object.keys(rows[0] || { Campaign: '', Platform: '', Spend: '' })
  ws.columns = headers.map(key => ({ header: key, key, width: Math.max(12, key.length + 3) }))
  ws.addRows(rows)
  ws.getRow(1).font = { bold: true }
  ws.views = [{ state: 'frozen', ySplit: 1 }]
  return Buffer.from(await wb.xlsx.writeBuffer())
}

export function generateCSV(data: Record<string, unknown>[], filename: string): string {
  if (!data.length) return ''
  const headers = Object.keys(data[0])
  const rows = data.map(row => headers.map(h => {
    const v = row[h]
    if (v === null || v === undefined) return ''
    const s = String(v)
    return s.includes(',') || s.includes('"') || s.includes('\n') ? `"${s.replace(/"/g, '""')}"` : s
  }))
  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
}
