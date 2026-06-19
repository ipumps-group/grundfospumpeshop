import { readFileSync } from 'fs'
import { resolve, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const raw = readFileSync(resolve(__dirname, '..', '.env.local'), 'utf-8')
export const env = Object.fromEntries(
  raw.split('\n')
    .filter(l => l.includes('='))
    .map(l => { const i = l.indexOf('='); return [l.substring(0, i).trim(), l.substring(i + 1).trim().replace(/^["']|["']$/g, '')] })
)
export const SUPABASE_URL = env.NEXT_PUBLIC_SUPABASE_URL
export const SUPABASE_SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY
export const SUPABASE_ANON_KEY = env.NEXT_PUBLIC_SUPABASE_ANON_KEY
