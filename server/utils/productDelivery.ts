type SupabaseLike = {
  from: (table: string) => any
}

type DeliverySale = {
  id: string
  product_id?: string | null
  offer_id?: string | null
  customer_email?: string | null
}

const resolveProductId = async (supabase: SupabaseLike, sale: DeliverySale) => {
  if (sale.product_id) return sale.product_id

  if (!sale.offer_id) return null

  const { data: offer, error: offerError } = await supabase
    .from('offers')
    .select('product_id')
    .eq('id', sale.offer_id)
    .maybeSingle()

  if (offerError) {
    console.error('[delivery] Erro ao resolver product_id pela oferta.', {
      saleId: sale.id,
      offerId: sale.offer_id,
      error: offerError.message
    })
  }

  return offer?.product_id || null
}

const resolveMembersAreaId = async (supabase: SupabaseLike, productId: string) => {
  const { data: course } = await supabase
    .from('courses')
    .select('members_area_id')
    .eq('product_id', productId)
    .not('members_area_id', 'is', null)
    .limit(1)
    .maybeSingle()

  if (course?.members_area_id) return course.members_area_id

  const { data: area } = await supabase
    .from('members_areas')
    .select('id')
    .eq('product_id', productId)
    .limit(1)
    .maybeSingle()

  return area?.id || null
}

export const ensureProductDelivery = async (supabase: SupabaseLike, sale: DeliverySale) => {
  if (!sale.id) return null

  const { data: existing } = await supabase
    .from('product_deliveries')
    .select('*')
    .eq('sale_id', sale.id)
    .maybeSingle()

  if (existing) return existing

  const productId = await resolveProductId(supabase, sale)

  if (!productId) {
    console.error('[delivery] Entrega nao criada: venda sem product_id e sem oferta resolvivel.', {
      saleId: sale.id,
      offerId: sale.offer_id || null
    })
    return null
  }

  const membersAreaId = await resolveMembersAreaId(supabase, productId)

  const payload = {
    sale_id: sale.id,
    product_id: productId,
    customer_email: sale.customer_email || null,
    delivery_type: 'members_area',
    access_url: `/club=${membersAreaId || productId}`,
    status: 'active'
  }

  const { data, error } = await supabase
    .from('product_deliveries')
    .insert(payload)
    .select('*')
    .single()

  if (error) throw error
  return data
}
