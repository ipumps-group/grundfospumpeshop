import { verifyOrderViewToken } from './order-view-token'

interface RetryOrderIdentity {
  orderNumber: string
  orderUserId?: string | null
  callerUserId?: string | null
  suppliedToken?: string | null
}

export function canRetryOrder({
  orderNumber,
  orderUserId,
  callerUserId,
  suppliedToken,
}: RetryOrderIdentity): boolean {
  if (callerUserId && orderUserId && callerUserId === orderUserId) return true

  return Boolean(suppliedToken && verifyOrderViewToken(orderNumber, suppliedToken))
}
