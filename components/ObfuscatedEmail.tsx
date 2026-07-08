'use client'

import { useState, useEffect, type ReactNode } from 'react'

interface Props {
  /** Full email address (e.g. "info@ipumps.ee") - preferred */
  email?: string
  /** Separate user and domain - used if email is not provided */
  user?: string
  domain?: string
  className?: string
  /** Optional node rendered before the email address (e.g. an icon) */
  prefix?: ReactNode
  /** Extra class for the email text span (e.g. "hidden sm:inline") */
  textClassName?: string
}

/**
 * Renders an email address as a mailto link, but only after the JS runtime
 * has hydrated the page.  During server-rendering and for most bots the
 * element is empty, which prevents address harvesting.
 */
export default function ObfuscatedEmail({ email: fullEmail, user, domain, className, prefix, textClassName }: Props) {
  const [email, setEmail] = useState('')

  useEffect(() => {
    if (fullEmail) {
      setEmail(fullEmail)
    } else if (user && domain) {
      setEmail(`${user}@${domain}`)
    }
  }, [fullEmail, user, domain])

  if (!email) {
    return <span className={className}>{prefix}</span>
  }

  return (
    <a href={`mailto:${email}`} className={className}>
      {prefix}<span className={textClassName}>{email}</span>
    </a>
  )
}
