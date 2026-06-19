import { createClient } from '@supabase/supabase-js'
import { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY } from './env.mjs'

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Missing env vars: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY in .env.local')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

// Test updating to processing
const orderId = '141cad2f-2d5f-46fb-a776-2d187e55bd06'
const { error } = await supabase.from('orders').update({ status: 'processing' }).eq('id', orderId)

if (error) {
  console.log('Error:', error.message)
} else {
  console.log('OK - updated to processing')
}