type SupabaseLike = {
  from: (table: string) => any
}

type SaleRedirectInput = {
  id: string
  product_id?: string | null
}

type DeliveryRedirectInput = {
  access_url?: string | null
  product_id?: string | null
} | null | undefined

const normalizeConfiguredUrl = (url?: string | null) => {
  const value = String(url || '').trim()
  if (!value) return ''
  if (/^(https?:)?\/\//i.test(value) || value.startsWith('/') || value.startsWith('#')) return value
  return `https://${value}`
}

export const resolveApprovedRedirect = async (
  supabase: SupabaseLike,
  sale: SaleRedirectInput,
  delivery?: DeliveryRedirectInput
) => {
  const productId = delivery?.product_id || sale.product_id || null
  const clubUrl = delivery?.access_url || (productId ? `/club=${productId}` : '/')

  if (!productId) {
    return {
      accessUrl: clubUrl,
      clubUrl,
      thankYouUrl: '',
      usesThankYou: false
    }
  }

  const { data: settings } = await supabase
    .from('product_settings')
    .select('thank_you_enabled, thank_you_url')
    .eq('product_id', productId)
    .maybeSingle()

  const thankYouUrl = normalizeConfiguredUrl(settings?.thank_you_url)
  const usesThankYou = Boolean(settings?.thank_you_enabled && thankYouUrl)

  return {
    accessUrl: usesThankYou ? `/thank-you/${sale.id}` : clubUrl,
    clubUrl,
    thankYouUrl: usesThankYou ? thankYouUrl : '',
    usesThankYou
  }
}
