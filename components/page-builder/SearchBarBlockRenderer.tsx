'use client'

import { useState } from 'react'
import { Search } from 'lucide-react'
import { useRouter } from '@/i18n/navigation'
import { useTranslations } from 'next-intl'
import type { SearchBarBlock } from './types'

function readableTextColor(background: string): string {
  const match = background.match(/^#([0-9a-f]{6})$/i)
  if (!match) return '#001f40'
  const channels = [0, 2, 4].map(offset => parseInt(match[1].slice(offset, offset + 2), 16) / 255)
  const luminance = channels
    .map(channel => channel <= 0.04045 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4)
    .reduce((sum, channel, index) => sum + channel * [0.2126, 0.7152, 0.0722][index], 0)
  return (1.05 / (luminance + 0.05)) >= 4.5 ? '#ffffff' : '#001f40'
}

export default function SearchBarBlockRenderer({ block }: { block: SearchBarBlock }) {
  const t = useTranslations('nav')
  const [query, setQuery] = useState('')
  const router = useRouter()

  function handleSearch() {
    if (query.trim()) {
      router.push(`/tooted?q=${encodeURIComponent(query.trim())}`)
    }
  }

  const wrapperStyle = block.max_width ? { maxWidth: block.max_width, margin: '0 auto' } : undefined

  return (
    <div style={wrapperStyle} className="w-full">
      <div
        className="flex items-center rounded-xl overflow-hidden shadow-sm"
        style={{ backgroundColor: block.bg_color }}
      >
        <Search size={18} className="ml-4 flex-shrink-0" style={{ color: block.text_color, opacity: 0.5 }} />
        <input
          type="text"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSearch()}
          placeholder={t('searchPlaceholder')}
          className="flex-1 px-3 py-3.5 text-[15px] outline-none bg-transparent placeholder-current"
          style={{ color: block.text_color, opacity: 1 }}
        />
        <button
          onClick={handleSearch}
          className="px-6 py-3.5 text-[14px] font-semibold transition-opacity hover:opacity-85"
          style={{ backgroundColor: block.btn_color, color: readableTextColor(block.btn_color) }}
        >
          {t('search')}
        </button>
      </div>
    </div>
  )
}
