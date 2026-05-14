import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://sdqnzyfmanflslsjhytf.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNkcW56eWZtYW5mbHNsc2poeXRmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NTU1MDY3NSwiZXhwIjoyMDkxMTI2Njc1fQ.H3LiyHS8ZEgoqGd3TYmPoINGGwneMffASgzML2Aei8k'

const supabase = createClient(supabaseUrl, supabaseKey)

async function setupSettingsTable() {
  const headerSettings = [
    { key: 'header_phone', value: '+372 503 3978' },
    { key: 'header_email_user', value: 'info' },
    { key: 'header_email_domain', value: 'ipumps.ee' },
    { key: 'header_opening_hours', value: 'E-R 8:00–17:00' },
  ]
  
  const footerSettings = [
    { key: 'footer_company', value: 'iPumps OÜ' },
    { key: 'footer_address', value: 'Sepamäe tee 11-2' },
    { key: 'footer_city', value: '74009 Leppneeme küla, Viimsi vald, Harju maakond' },
    { key: 'footer_phone', value: '+372 503 3978' },
    { key: 'footer_reg', value: 'Reg. nr: 12345678' },
    { key: 'footer_vat', value: 'KMKR: EE123456789' },
  ]
  
  const teamMembers = [
    { key: 'footer_team_1_name', value: 'Rivo' },
    { key: 'footer_team_1_email', value: 'rivo' },
    { key: 'footer_team_1_phone', value: '+372 510 2376' },
    { key: 'footer_team_2_name', value: 'Karol' },
    { key: 'footer_team_2_email', value: 'karol' },
    { key: 'footer_team_2_phone', value: '+372 503 3978' },
    { key: 'footer_team_3_name', value: 'Jüri' },
    { key: 'footer_team_3_email', value: 'juri' },
    { key: 'footer_team_3_phone', value: '' },
  ]
  
  const allSettings = [...headerSettings, ...footerSettings, ...teamMembers]
  
  for (const setting of allSettings) {
    const { data: existing } = await supabase
      .from('settings')
      .select('key')
      .eq('key', setting.key)
      .single()
    
    if (existing) {
      await supabase
        .from('settings')
        .update({ value: setting.value })
        .eq('key', setting.key)
      console.log(`Updated: ${setting.key}`)
    } else {
      await supabase
        .from('settings')
        .insert({ key: setting.key, value: setting.value })
      console.log(`Inserted: ${setting.key}`)
    }
  }
  
  console.log('\nDone!')
}

setupSettingsTable().then(() => process.exit()).catch(e => { console.error(e); process.exit(1) })