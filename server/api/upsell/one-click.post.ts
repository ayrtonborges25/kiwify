import { sendProductAccessEmail } from '~/server/utils/deliveryEmail'
import { ensureProductDelivery } from '~/server/utils/productDelivery'
import { getSupabaseServerClient } from '~/server/utils/supabaseServer'

type OneClickUpsellPayload = {
  saleId?: string
  offerId?: string
}

const formatPaymentMethod = (value?: string | null) => {
  const method = String(value || '').trim()
  return method || 'Cartão de crédito'
}

export default defineEventHandler(async (event) => {
  const payload = await readBody<OneClickUpsellPayload>(event)
  const supabase = getSupabaseServerClient()

  if (!supabase) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Supabase nao configurado no servidor.'
    })
  }

  if (!payload.saleId) {
    throw createError({ statusCode: 400, statusMessage: 'Venda original obrigatoria.' })
  }

  const { data: originalSale, error: saleError } = await supabase
    .from('sales')
    .select('id,product_id,customer_name,customer_email,status,payment_method')
    .eq('id', payload.saleId)
    .maybeSingle()

  if (saleError || !originalSale) {
    throw createError({ statusCode: 404, statusMessage: 'Venda original nao encontrada.' })
  }

  if (String(originalSale.status || '').toLowerCase() !== 'approved') {
    throw createError({ statusCode: 422, statusMessage: 'Upsell 1-click exige venda original aprovada.' })
  }

  const { data: settings } = await supabase
    .from('product_settings')
    .select('upsell_settings')
    .eq('product_id', originalSale.product_id)
    .maybeSingle()

  const upsellSettings = settings?.upsell_settings || {}
  const offerId = payload.offerId || upsellSettings.offerId

  if (!offerId) {
    throw createError({ statusCode: 422, statusMessage: 'Oferta de upsell nao configurada.' })
  }

  const { data: offer, error: offerError } = await supabase
    .from('offers')
    .select('id,product_id,name,price,currency')
    .eq('id', offerId)
    .maybeSingle()

  if (offerError || !offer) {
    throw createError({ statusCode: 404, statusMessage: 'Oferta de upsell nao encontrada.' })
  }

  const { data: sale, error: insertError } = await supabase
    .from('sales')
    .insert({
      product_id: offer.product_id,
      offer_id: offer.id,
      customer_name: originalSale.customer_name,
      customer_email: originalSale.customer_email,
      amount: Number(offer.price || 0),
      currency: offer.currency || 'BRL',
      status: 'approved',
      payment_method: formatPaymentMethod(originalSale.payment_method),
      provider: 'kiwify_upsell',
      provider_payment_id: `upsell_${originalSale.id}_${Date.now()}`,
      paid_at: new Date().toISOString(),
      raw_provider_response: {
        type: 'one_click_upsell',
        sourceSaleId: originalSale.id,
        sourcePaymentMethod: formatPaymentMethod(originalSale.payment_method),
        upsellSettings
      }
    })
    .select('id,status,product_id,offer_id,customer_email')
    .single()

  if (insertError || !sale) {
    throw createError({
      statusCode: 500,
      statusMessage: insertError?.message || 'Nao foi possivel salvar a venda do upsell.'
    })
  }

  const delivery = await ensureProductDelivery(supabase, sale)
  await sendProductAccessEmail(supabase, sale, delivery)

  return {
    saleId: sale.id,
    status: sale.status,
    accessUrl: delivery?.access_url || (sale.product_id ? `/club=${sale.product_id}` : '/')
  }
})
