'use client'

import React, { useMemo } from 'react'
import DOMPurify from 'dompurify'
import FeaturedProductsSlider from './FeaturedProductsSlider'
import PumpCalculator from './PumpCalculator'
import ContactForm from './ContactForm'
import ObfuscatedEmail from './ObfuscatedEmail'
import { COMPANY } from '@/lib/config'

// Supported shortcodes:  [slider]  [calculator]  [contact_form]

const SHORTCODE_RE = /(\[[a-z_]+\])/g

interface Props {
  html: string
  className?: string
  style?: React.CSSProperties
  pageId?: string
}

function sanitize(html: string): string {
  if (typeof window !== 'undefined') {
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'p', 'br', 'ul', 'ol', 'li', 'a', 'strong', 'b', 'em', 'i', 'u', 'span', 'div', 'img', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'hr', 'blockquote', 'pre', 'code', 'sub', 'sup'],
      ALLOWED_ATTR: ['href', 'target', 'rel', 'src', 'alt', 'class', 'id', 'style', 'width', 'height', 'colspan', 'rowspan'],
    })
  }
  return html
}

export default function ShortcodeRenderer({ html, className, style, pageId }: Props) {
  const safeHtml = useMemo(() => sanitize(html), [html])
  const parts = safeHtml.split(SHORTCODE_RE)

  const hasShortcode = parts.some(p => /^\[[a-z_]+\]$/.test(p))

  if (!hasShortcode) {
    return <div className={className} style={style} dangerouslySetInnerHTML={{ __html: safeHtml }} />
  }

  return (
    <div className={className} style={style}>
      {parts.map((part, i) => {
        const match = part.match(/^\[([a-z_]+)\]$/)
        if (match) {
          switch (match[1]) {
            case 'slider':       return <FeaturedProductsSlider key={i} />
            case 'calculator':   return <PumpCalculator key={i} />
            case 'contact_form': return <ContactForm key={i} pageId={pageId} />
            case 'email':        return <ObfuscatedEmail key={i} email={COMPANY.email} />
            default:             return <span key={i}>{part}</span>
          }
        }
        return part ? <div key={i} dangerouslySetInnerHTML={{ __html: sanitize(part) }} /> : null
      })}
    </div>
  )
}
