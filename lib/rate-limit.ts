const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

const WINDOW_MS = 60_000 // 1 minute
const MAX_REQUESTS = 30

export function rateLimit(ip: string, maxRequests = MAX_REQUESTS): { blocked: boolean; remaining: number } {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + WINDOW_MS })
    return { blocked: false, remaining: maxRequests - 1 }
  }

  entry.count++
  if (entry.count > maxRequests) {
    return { blocked: true, remaining: 0 }
  }

  return { blocked: false, remaining: maxRequests - entry.count }
}

// Cleanup stale entries every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now()
    for (const [key, val] of rateLimitMap) {
      if (now > val.resetAt) rateLimitMap.delete(key)
    }
  }, 5 * 60_000).unref?.()
}

export const STRICT_RATE = { maxRequests: 10 } // 10/min for expensive endpoints
export const AI_RATE = { maxRequests: 5 } // 5/min for AI endpoints
export const STRICT_AI_RATE = { maxRequests: 3 } // 3/min for most expensive
