'use client'

import { useState } from 'react'
import { Search } from 'lucide-react'
import { useRouter } from 'next/navigation'
import type { SearchBarBlock } from './types'

export default function SearchBarBlockRenderer({ block }: { block: SearchBarBlock }) {
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
          placeholder="Otsi tooteid..."
          className="flex-1 px-3 py-3.5 text-[15px] outline-none bg-transparent placeholder-current"
          style={{ color: block.text_color, opacity: 1 }}
        />
        <button
          onClick={handleSearch}
          className="px-6 py-3.5 text-[14px] font-semibold transition-opacity hover:opacity-85"
          style={{ backgroundColor: block.btn_color, color: '#ffffff' }}
        >
          Otsi
        </button>
      </div>
    </div>
  )
}
