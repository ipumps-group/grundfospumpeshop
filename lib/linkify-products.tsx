import type { ReactNode } from 'react'
import { Link } from '@/i18n/navigation'

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

/**
 * Turn product / series names in plain text into links to the e-shop.
 * `links` maps the exact name (e.g. "SCALA2", "ALPHA1 GO") to its shop URL.
 * Longest names win ("SBA" before "SB"); names match only on word boundaries
 * so inflections like "JP-st" link the name and keep the ending.
 */
export function linkifyProducts(text: string, links: Record<string, string>): ReactNode {
  const names = Object.keys(links).sort((a, b) => b.length - a.length)
  if (names.length === 0) return text

  const re = new RegExp(`(?<![A-Za-z0-9])(${names.map(escapeRegex).join('|')})(?![A-Za-z0-9])`, 'g')
  const out: ReactNode[] = []
  let last = 0
  let key = 0
  let m: RegExpExecArray | null
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) out.push(text.slice(last, m.index))
    out.push(
      <Link
        key={key++}
        href={links[m[1]]}
        className="text-[#003366] font-medium underline decoration-[#003366]/30 underline-offset-2 hover:text-[#01a0dc] hover:decoration-[#01a0dc]/50 transition-colors"
      >
        {m[1]}
      </Link>
    )
    last = m.index + m[0].length
  }
  if (out.length === 0) return text
  out.push(text.slice(last))
  return out
}
