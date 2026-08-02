import type { NextRequest } from 'next/server'
import { POST as handleCanonicalWebhook } from '../webhooks/montonio/route'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

// Backwards-compatible endpoint for older Montonio orders. Keep this URL
// active, but run it through the same strict signature and access-key checks
// as the canonical webhook.
export async function POST(request: NextRequest) {
  return handleCanonicalWebhook(request)
}
