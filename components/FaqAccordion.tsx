import type { ReactNode } from 'react'

export interface FaqAccordionItem {
  q: ReactNode
  a: ReactNode
}

/**
 * Shared FAQ accordion used by the category buying guides and the page-builder
 * FAQ block — keeps the same look everywhere (details/summary, "+" toggle).
 */
export default function FaqAccordion({ items }: { items: FaqAccordionItem[] }) {
  return (
    <div className="mt-4 divide-y divide-gray-100">
      {items.map((f, i) => (
        <details key={i} className="group py-4">
          <summary className="cursor-pointer list-none flex items-center justify-between gap-4 font-semibold text-gray-800 group-open:text-[#003366]">
            <span className="flex-1 text-left">{f.q}</span>
            <span className="shrink-0 text-[#01a0dc] transition-transform group-open:rotate-45">+</span>
          </summary>
          <div className="mt-3 text-[15px] text-gray-600 leading-relaxed max-w-3xl [&_a]:text-[#003366] [&_a]:underline [&_a:hover]:text-[#01a0dc]">
            {f.a}
          </div>
        </details>
      ))}
    </div>
  )
}
