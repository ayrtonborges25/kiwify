import { createClient } from '@supabase/supabase-js'

export const getSupabaseServerClient = () => {
  const config = useRuntimeConfig()
  const supabaseUrl = String(config.public.supabaseUrl || '')
  const serverKey = String(config.supabaseServiceRoleKey || config.public.supabaseAnonKey || '')

  if (!supabaseUrl || !serverKey) return null

  return createClient(supabaseUrl, serverKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  })
}
