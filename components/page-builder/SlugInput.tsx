'use client'

import { useEffect, useRef, useState } from 'react'
import { supabase } from '@/lib/supabase'

export function toSlug(str: string): string {
  const map: Record<string, string> = { ä:'a', ö:'o', ü:'u', õ:'o', Ä:'a', Ö:'o', Ü:'u', Õ:'o' }
  return str.split('').map(c => map[c] ?? c).join('')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

interface Props {
  value: string
  onChange: (slug: string) => void
  title: string
  excludeId?: string
}

export default function SlugInput({ value, onChange, title, excludeId }: Props) {
  const [checking, setChecking] = useState(false)
  const [taken, setTaken] = useState(false)
  const editedRef = useRef(!!excludeId)

  useEffect(() => {
    if (!editedRef.current) onChange(toSlug(title))
  }, [title]) // eslint-disable-line react-hooks/exhaustive-deps

  async function checkUnique(slug: string) {
    if (!slug) return
    setChecking(true)
    let q = supabase.from('pages').select('id').eq('slug', slug)
    if (excludeId) q = q.neq('id', excludeId)
    const { data } = await q
    setTaken(!!(data && data.length > 0))
    setChecking(false)
  }

  const cls = `w-full border rounded-xl px-3 py-2.5 text-[15px] outline-none transition-colors ${
    taken ? 'border-red-400 bg-red-50' : 'border-gray-200 focus:border-[#003366]'
  }`

  return (
    <div>
      <label className="block text-[13px] font-medium text-gray-700 mb-1">
        Slug *{' '}
        <span className="font-normal text-gray-400">— /leht/<em>{value || '...'}</em></span>
      </label>
      <input
        type="text"
        value={value}
        className={cls}
        placeholder="lehe-slug"
        onChange={e => {
          editedRef.current = true
          setTaken(false)
          onChange(e.target.value)
        }}
        onBlur={() => checkUnique(value)}
      />
      {checking && <p className="text-[12px] text-gray-400 mt-1">Kontrollin...</p>}
      {taken && <p className="text-[12px] text-red-500 mt-1">See slug on juba kasutusel.</p>}
      <p className="text-[12px] text-gray-400 mt-1">
        Eelvaade: <span className="font-mono">ipumps.ee/leht/{value || '...'}</span>
      </p>
    </div>
  )
}
