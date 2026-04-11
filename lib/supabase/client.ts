import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  // Fallback placeholders allow the client to be instantiated during SSR/build
  // without throwing. Actual network calls only happen in the browser where
  // the real env vars are always injected by Next.js.
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key'
  )
}
