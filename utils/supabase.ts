import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { useRuntimeConfig } from '#app'

let supabaseClient: SupabaseClient | null = null

export const getSupabaseConfig = () => {
  const config = useRuntimeConfig()
  const supabaseUrl = String(config.public.supabaseUrl || '')
  const supabaseAnonKey = String(config.public.supabaseAnonKey || '')

  return {
    supabaseUrl,
    supabaseAnonKey,
    isSupabaseConfigured: Boolean(supabaseUrl && supabaseAnonKey)
  }
}

export const getSupabaseClient = () => {
  const { supabaseUrl, supabaseAnonKey, isSupabaseConfigured } = getSupabaseConfig()
  if (!isSupabaseConfigured) return null

  if (!supabaseClient) {
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true
      }
    })
  }

  return supabaseClient
}

export const uploadFile = async (bucket: string, path: string, file: File) => {
  try {
    const supabase = getSupabaseClient()
    if (!supabase) {
      return {
        data: null,
        error: new Error('Supabase nao configurado')
      }
    }

    const { data, error } = await supabase.storage.from(bucket).upload(path, file, {
      cacheControl: '3600',
      upsert: true
    })

    if (error) return { data: null, error }

    const { data: publicUrl } = supabase.storage.from(bucket).getPublicUrl(data.path)

    return {
      data: {
        ...data,
        publicUrl: publicUrl.publicUrl
      },
      error: null
    }
  } catch (error) {
    return {
      data: null,
      error
    }
  }
}
