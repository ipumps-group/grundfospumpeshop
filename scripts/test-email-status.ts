// Local test script for email status update
// Run: npx tsx scripts/test-email-status.ts

import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

async function testStatusEmail() {
  console.log('=== Testing Status Email ===\n')
  
  // 1. Fetch an order directly
  const orderId = process.argv[2] || 'ece64f3d-3d26-4dd0-a5ba-262f793b6ad0'
  console.log('1. Fetching order:', orderId)
  
  const orderRes = await fetch(
    `${SUPABASE_URL}/rest/v1/orders?id=eq.${orderId}&select=*`,
    {
      headers: {
        'apikey': SERVICE_KEY,
        'Authorization': `Bearer ${SERVICE_KEY}`,
      }
    }
  )
  const order = await orderRes.json()
  console.log('   Order:', order[0]?.id, order[0]?.status)
  console.log('   Customer email:', order[0]?.shipping_address?.customer_email)
  
  // 2. Test Resend directly
  console.log('\n2. Testing Resend email...')
  const resend = await import('resend')
  const R = new resend.Resend(process.env.RESEND_API_KEY!)
  
  const emailResult = await R.emails.send({
    from: 'iPumps OÜ <info@pumbapood.ee>',
    to: 'test@outline.ee',
    subject: `Test - Tellimus #${orderId?.slice(-8)} staatuse uuendus`,
    html: '<h1>Test email</h1><p>This is a test.</p>'
  })
  
  console.log('   Resend result:', emailResult)
  
  if (emailResult.error) {
    console.error('   ERROR:', emailResult.error)
  } else {
    console.log('   SUCCESS - Email sent!')
  }
}

testStatusEmail().catch(console.error)