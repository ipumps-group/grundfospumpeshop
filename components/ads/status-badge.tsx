'use client'

import { cn, statusColor } from '@/lib/ads/utils'

interface StatusBadgeProps {
  status: string
  className?: string
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  return (
    <span className={cn(
      'inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium',
      statusColor(status),
      className,
    )}>
      {status}
    </span>
  )
}
