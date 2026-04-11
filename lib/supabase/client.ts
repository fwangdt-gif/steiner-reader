import { createBrowserClient } from '@supabase/ssr'

// Safe fallback used during build/SSR when env vars are absent or malformed.
// All real Supabase calls happen client-side (useEffect / event handlers) where
// the actual values are always available.
const PLACEHOLDER_URL = 'https://placeholder.supabase.co'
const PLACEHOLDER_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJwbGFjZWhvbGRlciJ9.placeholder'

function sanitize(value: string | undefined): string {
  if (!value) return ''
  // Strip accidental surrounding quotes and whitespace
  return value.trim().replace(/^["']|["']$/g, '')
}

function isValidUrl(url: string): boolean {
  try {
    new URL(url)
    return true
  } catch {
    return false
  }
}

export function createClient() {
  const url = sanitize(process.env.NEXT_PUBLIC_SUPABASE_URL)
  const key = sanitize(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

  try {
    return createBrowserClient(
      isValidUrl(url) ? url : PLACEHOLDER_URL,
      key || PLACEHOLDER_KEY
    )
  } catch {
    return createBrowserClient(PLACEHOLDER_URL, PLACEHOLDER_KEY)
  }
}
