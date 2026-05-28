import { checkoutBuilders as mockCheckoutBuilders, type CheckoutBuilder } from '~/data/checkout'
import { getSupabaseClient } from '~/utils/supabase'

export type CheckoutSettingsPayload = {
  checkoutId?: string
  name?: string
  primaryColor?: string
  backgroundColor?: string
  logoUrl?: string
  settings?: Record<string, any>
}

const checkoutBuildersStore: CheckoutBuilder[] = [...mockCheckoutBuilders]
const checkoutSettingsStore: Record<string, CheckoutSettingsPayload> = {}

const mapCheckoutFromSupabase = (row: Record<string, any>): CheckoutBuilder => ({
  id: row.id,
  name: row.name || 'Checkout'
})

export const getCheckoutBuildersSnapshot = () => checkoutBuildersStore

export const listCheckouts = async () => {
  try {
    const supabase = getSupabaseClient()
    if (!supabase) return checkoutBuildersStore

    const { data, error } = await supabase
      .from('product_checkouts')
      .select('*')
      .order('created_at', { ascending: false })

    if (error || !data?.length) return checkoutBuildersStore

    return data.map(mapCheckoutFromSupabase)
  } catch {
    return checkoutBuildersStore
  }
}

export const getCheckoutById = async (id: string) => {
  try {
    const supabase = getSupabaseClient()
    if (!supabase) return checkoutBuildersStore.find((checkout) => checkout.id === id)

    const { data, error } = await supabase
      .from('product_checkouts')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (error || !data) return checkoutBuildersStore.find((checkout) => checkout.id === id)

    return mapCheckoutFromSupabase(data)
  } catch {
    return checkoutBuildersStore.find((checkout) => checkout.id === id)
  }
}

export const updateCheckoutSettings = async (checkoutId: string, payload: CheckoutSettingsPayload = {}) => {
  try {
    const supabase = getSupabaseClient()
    if (supabase) {
      const { data, error } = await supabase
        .from('checkout_settings')
        .upsert({
          checkout_id: checkoutId,
          name: payload.name,
          primary_color: payload.primaryColor,
          background_color: payload.backgroundColor,
          logo_url: payload.logoUrl,
          settings: payload.settings ?? {}
        }, { onConflict: 'checkout_id' })
        .select('*')
        .single()

      if (!error && data) {
        checkoutSettingsStore[checkoutId] = {
          checkoutId,
          name: data.name || payload.name,
          primaryColor: data.primary_color || payload.primaryColor,
          backgroundColor: data.background_color || payload.backgroundColor,
          logoUrl: data.logo_url || payload.logoUrl,
          settings: data.settings || payload.settings
        }
        return checkoutSettingsStore[checkoutId]
      }
    }
  } catch {
    // fallback abaixo
  }

  checkoutSettingsStore[checkoutId] = { ...checkoutSettingsStore[checkoutId], checkoutId, ...payload }
  return checkoutSettingsStore[checkoutId]
}
