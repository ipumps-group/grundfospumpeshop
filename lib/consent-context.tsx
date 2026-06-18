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

function readStored(): { given: boolean; state: ConsentState } {
  try {
    const stored = localStorage.getItem(CONSENT_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      if (parsed.v === CONSENT_VERSION) {
        return { given: true, state: parsed.state }
      }
    }
  } catch {}
  return { given: false, state: defaultConsent }
}

export function ConsentProvider({ children }: { children: ReactNode }) {
  const [consent, setConsentState] = useState<ConsentState>(() => {
    if (typeof window === 'undefined') return defaultConsent
    return readStored().state
  })

  const [consentGiven, setConsentGiven] = useState(() => {
    if (typeof window === 'undefined') return false
    return readStored().given
  })

  const hasConsent = consent.advertising || consent.analytics

  const setConsent = useCallback((state: ConsentState) => {
    setConsentState(state)
    setConsentGiven(true)
    try {
      localStorage.setItem(CONSENT_KEY, JSON.stringify({ v: CONSENT_VERSION, state }))
    } catch {}
  }, [])

  return (
    <ConsentContext.Provider value={{ consent, hasConsent, setConsent, consentGiven, consentVersion: CONSENT_VERSION }}>
      {children}
    </ConsentContext.Provider>
  )
}
