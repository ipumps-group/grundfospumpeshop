'use client'

import { useMemo } from 'react'

interface ChartProps {
  data: { date: string; value: number; secondary?: number }[]
  height?: number
  color?: string
  secondaryColor?: string
  loading?: boolean
  format?: 'currency' | 'number' | 'percentage'
}

export function SparkChart({
  data,
  height = 80,
  color = '#3b82f6',
  secondaryColor = '#10b981',
  loading = false,
  format = 'number',
}: ChartProps) {
  if (loading) {
    return (
      <div className="animate-pulse bg-gray-100 rounded" style={{ height }} />
    )
  }

  if (!data.length) {
    return (
      <div className="flex items-center justify-center text-gray-400 text-sm" style={{ height }}>
        No data
      </div>
    )
  }

  const maxVal = Math.max(...data.map(d => d.value), ...data.filter(d => d.secondary).map(d => d.secondary || 0))
  const minVal = Math.min(...data.map(d => d.value), ...data.filter(d => d.secondary).map(d => d.secondary || 0))
  const range = maxVal - minVal || 1

  const points = data.map((d, i) => ({
    x: (i / (data.length - 1)) * 100,
    y: ((d.value - minVal) / range) * height,
    secondary: d.secondary ? ((d.secondary - minVal) / range) * height : null,
    date: d.date,
    value: d.value,
    secondaryValue: d.secondary,
  }))

  const path = points.map((p, i) =>
    `${i === 0 ? 'M' : 'L'} ${p.x} ${height - p.y}`
  ).join(' ')

  const secPath = points
    .filter(p => p.secondary !== null)
    .map((p, i) =>
      `${i === 0 ? 'M' : 'L'} ${p.x} ${height - (p.secondary || 0)}`
    ).join(' ')

  return (
    <svg
      viewBox={`0 0 100 ${height}`}
      preserveAspectRatio="none"
      className="w-full"
      style={{ height }}
    >
      <path
        d={path}
        fill="none"
        stroke={color}
        strokeWidth="2"
        vectorEffect="non-scaling-stroke"
      />
      {secPath && (
        <path
          d={secPath}
          fill="none"
          stroke={secondaryColor}
          strokeWidth="2"
          vectorEffect="non-scaling-stroke"
          strokeDasharray="4 2"
        />
      )}
    </svg>
  )
}

export function BarChart({
  data,
  height = 200,
  color = '#3b82f6',
  loading = false,
}: {
  data: { label: string; value: number }[]
  height?: number
  color?: string
  loading?: boolean
}) {
  if (loading) {
    return (
      <div className="animate-pulse bg-gray-100 rounded" style={{ height }} />
    )
  }

  if (!data.length) {
    return (
      <div className="flex items-center justify-center text-gray-400 text-sm" style={{ height }}>
        No data
      </div>
    )
  }

  const maxVal = Math.max(...data.map(d => d.value))

  return (
    <div className="flex items-end gap-2" style={{ height }}>
      {data.map((d, i) => {
        const pct = maxVal > 0 ? (d.value / maxVal) * 100 : 0
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1 h-full justify-end">
            <span className="text-xs text-gray-500">{d.value.toLocaleString()}</span>
            <div
              className="w-full rounded-t"
              style={{
                height: `${Math.max(pct, 2)}%`,
                backgroundColor: color,
                opacity: 0.6 + (pct / 100) * 0.4,
              }}
            />
            <span className="text-xs text-gray-600 truncate w-full text-center">{d.label}</span>
          </div>
        )
      })}
    </div>
  )
}
