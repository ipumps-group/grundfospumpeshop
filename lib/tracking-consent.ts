export const CONSENT_KEY = 'pumbapood_consent'

export function hasAdvertisingConsent(): boolean {
  if (typeof window === 'undefined') return false

  try {
    const stored = window.localStorage.getItem(CONSENT_KEY)
    if (!stored) return false
    const parsed = JSON.parse(stored)
    return parsed?.state?.advertising === true
  } catch {
    return false
  }
}

export function readCookie(name: string): string | undefined {
  if (typeof document === 'undefined') return undefined
  const prefix = `${name}=`
  const value = document.cookie.split('; ').find(cookie => cookie.startsWith(prefix))
  return value ? decodeURIComponent(value.slice(prefix.length)) : undefined
}
