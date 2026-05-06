import { NextRequest, NextResponse } from 'next/server'
import { sendOrderEmail } from '@/lib/send-email'

// POST /api/test/email - Test email sending
export async function POST(req: NextRequest) {
  const { orderId, type = 'statusUpdate', status = 'processing' } = await req.json().catch(() => ({}))
  
  console.log('[test-email] Received:', { orderId, type, status })
  
  try {
    await sendOrderEmail(orderId, 'statusUpdate', { newStatus: status })
    return NextResponse.json({ ok: true, message: 'Email sent' })
  } catch (err: any) {
    console.error('[test-email] Error:', err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

// GET /api/test/email - Form to test
export async function GET() {
  const html = `
    <!DOCTYPE html>
    <html><body>
      <h1>Test Email</h1>
      <form method="POST" action="/api/test/email">
        <input name="orderId" placeholder="Order ID" value="ece64f3d-3d26-4dd0-a5ba-262f793b6ad0"><br>
        <input name="status" placeholder="Status" value="processing"><br>
        <button type="submit">Test Email</button>
      </form>
    </body></html>
  `
  return new Response(html, { headers: { 'Content-Type': 'text/html' } })
}