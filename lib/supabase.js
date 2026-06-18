'use client'
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  // Fallback vacío para que no tire durante build/pre-render.
  // Las llamadas reales (useEffect) solo ocurren en el browser donde las vars ya existen.
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key'
  return createBrowserClient(url, key)
}
