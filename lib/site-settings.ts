import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Create a client for server-side usage
export const createServerClient = () => 
  createClient(supabaseUrl, supabaseAnonKey)

export interface SiteSettings {
  // Header
  header_phone: string
  header_email: string
  header_opening_hours: string
  // Footer
  footer_company: string
  footer_address: string
  footer_city: string
  footer_phone: string
  footer_reg: string
  footer_vat: string
  // Team
  footer_team_1_name: string
  footer_team_1_email: string
  footer_team_1_phone: string
  footer_team_2_name: string
  footer_team_2_email: string
  footer_team_2_phone: string
  footer_team_3_name: string
  footer_team_3_email: string
  footer_team_3_phone: string
}

export async function getSiteSettings(): Promise<SiteSettings> {
  const supabase = createServerClient()
  const { data } = await supabase.from('settings').select('key, value')
  
  const settings: Record<string, string> = {
    header_phone: '',
    header_email: '',
    header_opening_hours: '',
    footer_company: '',
    footer_address: '',
    footer_city: '',
    footer_phone: '',
    footer_reg: '',
    footer_vat: '',
    footer_team_1_name: '',
    footer_team_1_email: '',
    footer_team_1_phone: '',
    footer_team_2_name: '',
    footer_team_2_email: '',
    footer_team_2_phone: '',
    footer_team_3_name: '',
    footer_team_3_email: '',
    footer_team_3_phone: '',
  }
  
  if (data) {
    data.forEach((item: { key: string; value: string }) => {
      if (item.key in settings) {
        settings[item.key] = item.value
      }
    })
  }
  
  return settings as unknown as SiteSettings
}