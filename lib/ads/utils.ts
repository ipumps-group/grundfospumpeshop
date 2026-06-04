export function formatCurrency(value: number, currency = 'EUR'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(value)
}

export function formatPercentage(value: number): string {
  return `${(value * 100).toFixed(2)}%`
}

export function formatCTR(value: number): string {
  return `${value.toFixed(2)}%`
}

export function formatCPC(value: number): string {
  return formatCurrency(value)
}

export function formatCPM(value: number): string {
  return formatCurrency(value)
}

export function formatROAS(value: number): string {
  return value.toFixed(2) + 'x'
}

export function daysAgo(days: number): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  return d.toISOString().split('T')[0]
}

export function today(): string {
  return new Date().toISOString().split('T')[0]
}

export function dateRangeToString(start: string, end: string): string {
  const fmt = (s: string) => {
    const d = new Date(s)
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }
  return `${fmt(start)} - ${fmt(end)}`
}

export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ')
}

export function statusColor(status: string): string {
  const map: Record<string, string> = {
    enabled: 'bg-green-100 text-green-800',
    active: 'bg-green-100 text-green-800',
    paused: 'bg-yellow-100 text-yellow-800',
    removed: 'bg-red-100 text-red-800',
    archived: 'bg-gray-100 text-gray-800',
    unknown: 'bg-gray-100 text-gray-800',
    pending: 'bg-blue-100 text-blue-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    executed: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
    running: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
  }
  return map[status.toLowerCase()] || 'bg-gray-100 text-gray-800'
}

export function severityColor(severity: string): string {
  const map: Record<string, string> = {
    high: 'bg-red-100 text-red-800 border-red-200',
    medium: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    low: 'bg-blue-100 text-blue-800 border-blue-200',
  }
  return map[severity] || 'bg-gray-100 text-gray-800'
}

export function getDateRangePreset(preset: string): { start: string; end: string } {
  const now = new Date()
  const end = now.toISOString().split('T')[0]
  let start: Date

  switch (preset) {
    case 'today':
      return { start: end, end }
    case 'yesterday': {
      const y = new Date(now)
      y.setDate(y.getDate() - 1)
      const s = y.toISOString().split('T')[0]
      return { start: s, end: s }
    }
    case 'last_7_days':
      start = new Date(now)
      start.setDate(start.getDate() - 7)
      break
    case 'last_14_days':
      start = new Date(now)
      start.setDate(start.getDate() - 14)
      break
    case 'last_30_days':
      start = new Date(now)
      start.setDate(start.getDate() - 30)
      break
    case 'last_90_days':
      start = new Date(now)
      start.setDate(start.getDate() - 90)
      break
    case 'this_month':
      start = new Date(now.getFullYear(), now.getMonth(), 1)
      break
    case 'last_month': {
      start = new Date(now.getFullYear(), now.getMonth() - 1, 1)
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0)
      return { start: start.toISOString().split('T')[0], end: lastMonthEnd.toISOString().split('T')[0] }
    }
    default:
      start = new Date(now)
      start.setDate(start.getDate() - 7)
  }

  return { start: start.toISOString().split('T')[0], end }
}

export function getPreviousPeriod(start: string, end: string): { start: string; end: string } {
  const s = new Date(start)
  const e = new Date(end)
  const duration = e.getTime() - s.getTime()

  const prevEnd = new Date(s.getTime() - 1)
  const prevStart = new Date(prevEnd.getTime() - duration)

  return {
    start: prevStart.toISOString().split('T')[0],
    end: prevEnd.toISOString().split('T')[0],
  }
}
