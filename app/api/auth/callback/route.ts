import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get('code')
  const redirectUrl = new URL('/konto', request.url)

  if (code) {
    try {
      const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      )
      const { error } = await supabase.auth.exchangeCodeForSession(code)
      if (error) {
        console.error('Auth callback error:', error.message)
        redirectUrl.searchParams.set('error', 'auth_failed')
      }
    } catch (e) {
      console.error('Auth callback exception:', e)
      redirectUrl.searchParams.set('error', 'auth_failed')
    }
  }

  return NextResponse.redirect(redirectUrl)
}
