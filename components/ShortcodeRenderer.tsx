import React from 'react'
import { sanitizeCmsHtml } from '@/lib/sanitize-cms-html'
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

export default function ShortcodeRenderer({ html, className, style, pageId }: Props) {
  const safeHtml = sanitizeCmsHtml(html)
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
        return part ? <div key={i} dangerouslySetInnerHTML={{ __html: sanitizeCmsHtml(part) }} /> : null
      })}
    </div>
  )
}
