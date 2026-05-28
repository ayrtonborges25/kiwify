import { getSupabaseClient } from '~/utils/supabase'

export type ProductDelivery = {
  id: string
  saleId: string
  productId?: string
  customerEmail?: string
  deliveryType: string
  accessUrl: string
  status: string
  productName?: string
  createdAt?: string
}

const mapDeliveryFromSupabase = (row: Record<string, any>): ProductDelivery => ({
  id: row.id,
  saleId: row.sale_id,
  productId: row.product_id || undefined,
  customerEmail: row.customer_email || undefined,
  deliveryType: row.delivery_type || 'members_area',
  accessUrl: row.access_url || (row.product_id ? `/club=${row.product_id}` : '/'),
  status: row.status || 'active',
  productName: row.products?.name || row.sales?.products?.name || undefined,
  createdAt: row.created_at || undefined
})

export const getDeliveryBySaleId = async (saleId: string) => {
  try {
    const supabase = getSupabaseClient()
    if (!supabase) return undefined

    const { data, error } = await supabase
      .from('product_deliveries')
      .select('*, products(name)')
      .eq('sale_id', saleId)
      .eq('status', 'active')
      .maybeSingle()

    if (error || !data) return undefined
    return mapDeliveryFromSupabase(data)
  } catch {
    return undefined
  }
}
