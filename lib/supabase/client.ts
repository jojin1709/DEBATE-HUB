import { createBrowserClient } from '@supabase/ssr'
import { mockSupabaseClient } from './mock-client'

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!url || !key || url.includes('placeholder-url') || url.includes('placeholder')) {
    return mockSupabaseClient as any
  }

  return createBrowserClient(url, key)
}
