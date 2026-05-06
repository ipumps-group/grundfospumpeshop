'use client'

import { useState } from 'react'
import {
  Flame, Snowflake, Thermometer, Drill, Waves,
  ArrowUpCircle, Filter, CircleDot,
} from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Link } from '@/i18n/navigation'
import type { TegevusaladBlock } from './types'

const CATEGORIES = [
  { nameKey: 'heating',  icon: Flame,         slug: 'kute' },
  { nameKey: 'cooling',  icon: Snowflake,      slug: 'jahutus' },
  { nameKey: 'hotWater', icon: Thermometer,    slug: 'sooja-tarbevee-tsirkulatsioonipump' },
  { nameKey: 'borewell', icon: Drill,          slug: 'puurkaevud' },
  { nameKey: 'drainage', icon: Waves,          slug: 'drenaaz' },
  { nameKey: 'wells',    icon: CircleDot,      slug: 'salvkaevud' },
  { nameKey: 'pressure', icon: ArrowUpCircle,  slug: 'rohutoste' },
  { nameKey: 'sewage',   icon: Filter,         slug: 'reovesi' },
]

const ICON_PX: Record<TegevusaladBlock['icon_size'], number> = {
  small: 20, medium: 32, large: 48,
}

const COL_CLASS: Record<number, string> = {
  2: 'grid-cols-2',
  3: 'grid-cols-2 sm:grid-cols-3',
  4: 'grid-cols-2 sm:grid-cols-4',
  5: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5',
  6: 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-6',
}

const SHADOW_CSS: Record<string, string> = {
  none: 'none',
  sm:   '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  md:   '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  lg:   '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
}

function buildCardStyle(block: TegevusaladBlock, hovered: boolean): React.CSSProperties {
  const hasBg     = block.card_has_bg     ?? (block.card_style === 'filled')
  const hasBorder = block.card_has_border ?? (block.card_style === 'outlined')

  const bgVal = hovered && block.card_hover_bg
    ? block.card_hover_bg
    : (hasBg ? (block.card_bg_color || 'transparent') : 'transparent')

  const borderColor = hasBorder ? (block.card_border_color || '#e5e7eb') : null
  const borderIsGradient = !!borderColor?.startsWith('linear-gradient')

  const style: React.CSSProperties = {
    boxShadow:  SHADOW_CSS[hovered ? (block.card_hover_shadow ?? 'none') : (block.card_shadow ?? 'none')],
    transition: 'all 0.2s ease',
  }

  if (block.card_height) style.height = `${block.card_height}px`

  if (borderColor) {
    if (borderIsGradient) {
      // gradient border via background-clip technique
      style.background  = `${bgVal} padding-box, ${borderColor} border-box`
      style.border      = '1px solid transparent'
    } else {
      if (bgVal !== 'transparent') style.background = bgVal
      style.border = `1px solid ${borderColor}`
    }
  } else if (bgVal !== 'transparent') {
    style.background = bgVal
  }

  return style
}

// ─── Single card ─────────────────────────────────────────────────────────────

function CategoryCard({ cat, block, iconPx }: {
  cat: typeof CATEGORIES[number]
  block: TegevusaladBlock
  iconPx: number
}) {
  const tCat = useTranslations('categories')
  const [hovered, setHovered] = useState(false)
  const style = buildCardStyle(block, hovered)

  return (
    <Link
      href={`/tooted?tegevusala=${cat.slug}`}
      className="flex flex-col items-center gap-2.5 px-4 py-5 rounded-xl group"
      style={style}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <cat.icon
        size={iconPx}
        className="flex-shrink-0 text-[#003366] group-hover:text-[#01a0dc] transition-colors"
      />
      <span className="text-[14px] font-medium text-gray-800 group-hover:text-[#003366] transition-colors text-center leading-tight">
        {tCat(cat.nameKey)}
      </span>
    </Link>
  )
}

// ─── Block renderer ───────────────────────────────────────────────────────────

export default function TegevusaladBlockRenderer({ block }: { block: TegevusaladBlock }) {
  const iconPx   = ICON_PX[block.icon_size]
  const colClass = COL_CLASS[block.columns] ?? 'grid-cols-2 sm:grid-cols-4'

  return (
    <div className={`grid ${colClass} gap-3`}>
      {CATEGORIES.map(cat => (
        <CategoryCard key={cat.slug} cat={cat} block={block} iconPx={iconPx} />
      ))}
    </div>
  )
}
