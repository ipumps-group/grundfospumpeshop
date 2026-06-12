'use client'

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'

const CONSENT_KEY = 'pumbapood_consent'
const CONSENT_VERSION = 1

export interface ConsentState {
  analytics: boolean
  advertising: boolean
  functional: boolean
}

interface ConsentContextValue {
  consent: ConsentState
  hasConsent: boolean
  setConsent: (state: ConsentState) => void
  consentGiven: boolean
  consentVersion: number
}

const defaultConsent: ConsentState = { analytics: false, advertising: false, functional: false }

const ConsentContext = createContext<ConsentContextValue>({
  consent: defaultConsent,
  hasConsent: false,
  setConsent: () => {},
  consentGiven: false,
  consentVersion: CONSENT_VERSION,
})

export function useConsent() {
  return useContext(ConsentContext)
}

export function ConsentProvider({ children }: { children: ReactNode }) {
  const [consent, setConsentState] = useState<ConsentState>(() => {
    if (typeof window === 'undefined') return defaultConsent
    try {
      const stored = localStorage.getItem(CONSENT_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        if (parsed.v === CONSENT_VERSION) {
          return parsed.state
        }
      }
    } catch {}
    return defaultConsent
  })

  const [consentGiven, setConsentGiven] = useState(() => {
    if (typeof window === 'undefined') return false
    try {
      const stored = localStorage.getItem(CONSENT_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        return parsed.v === CONSENT_VERSION
      }
    } catch {}
    return false
  })

  const hasConsent = consent.advertising || consent.analytics

  const setConsent = useCallback((state: ConsentState) => {
    setConsentState(state)
    setConsentGiven(true)
    localStorage.setItem(CONSENT_KEY, JSON.stringify({ v: CONSENT_VERSION, state }))
  }, [])

  return (
    <ConsentContext.Provider value={{ consent, hasConsent, setConsent, consentGiven, consentVersion: CONSENT_VERSION }}>
      {children}
    </ConsentContext.Provider>
  )
}
