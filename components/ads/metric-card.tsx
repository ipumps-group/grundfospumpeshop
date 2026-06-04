'use client'

import { cn, formatCurrency, formatNumber, formatPercentage } from '@/lib/ads/utils'
import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

interface MetricCardProps {
  label: string
  value: number
  previousValue?: number
  format?: 'currency' | 'number' | 'percentage' | 'ratio'
  change?: number | null
  loading?: boolean
  className?: string
}

export function MetricCard({
  label,
  value,
  previousValue,
  format = 'number',
  change,
  loading = false,
  className,
}: MetricCardProps) {
  const displayChange = change ?? (previousValue !== undefined && previousValue !== 0
    ? ((value - previousValue) / previousValue) * 100
    : null)

  const trend = displayChange !== null
    ? displayChange > 0 ? 'up' : displayChange < 0 ? 'down' : 'neutral'
    : 'neutral'

  const formattedValue = () => {
    if (format === 'currency') return formatCurrency(value)
    if (format === 'percentage') return formatPercentage(value)
    if (format === 'ratio') return value.toFixed(2)
    return formatNumber(value)
  }

  if (loading) {
    return (
      <div className={cn('bg-white rounded-xl border border-gray-200 p-5 animate-pulse', className)}>
        <div className="h-4 bg-gray-200 rounded w-24 mb-3" />
        <div className="h-8 bg-gray-200 rounded w-32 mb-2" />
        <div className="h-3 bg-gray-200 rounded w-20" />
      </div>
    )
  }

  return (
    <div className={cn('bg-white rounded-xl border border-gray-200 p-5', className)}>
      <p className="text-sm font-medium text-gray-500 mb-1">{label}</p>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold text-gray-900">{formattedValue()}</span>
      </div>
      {displayChange !== null && (
        <div className="flex items-center gap-1 mt-2">
          {trend === 'up' && <TrendingUp className="w-4 h-4 text-green-500" />}
          {trend === 'down' && <TrendingDown className="w-4 h-4 text-red-500" />}
          {trend === 'neutral' && <Minus className="w-4 h-4 text-gray-400" />}
          <span className={cn(
            'text-sm font-medium',
            trend === 'up' && 'text-green-600',
            trend === 'down' && 'text-red-600',
            trend === 'neutral' && 'text-gray-500',
          )}>
            {Math.abs(displayChange).toFixed(1)}%
          </span>
          <span className="text-xs text-gray-400 ml-1">vs previous period</span>
        </div>
      )}
    </div>
  )
}
