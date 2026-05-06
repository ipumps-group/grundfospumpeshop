import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://sdqnzyfmanflslsjhytf.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNkcW56eWZtYW5mbHNsc2poeXRmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTU1MDY3NSwiZXhwIjoyMDkxMTI2Njc1fQ.H3LiyHS8ZEgoqGd3TYmPoINGGwneMffASgzML2Aei8k'

const supabase = createClient(supabaseUrl, supabaseKey)

// Test updating to processing
const orderId = '141cad2f-2d5f-46fb-a776-2d187e55bd06'
const { error } = await supabase.from('orders').update({ status: 'processing' }).eq('id', orderId)

if (error) {
  console.log('Error:', error.message)
} else {
  console.log('OK - updated to processing')
}