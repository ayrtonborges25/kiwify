import { sendProductAccessEmail } from '~/server/utils/deliveryEmail'
import { ensureProductDelivery } from '~/server/utils/productDelivery'
import { getSupabaseServerClient } from '~/server/utils/supabaseServer'
import { resolveApprovedRedirect } from '~/server/utils/approvedRedirect'

const normalizeStatus = (status?: string) => {
  if (status === 'RECEIVED' || status === 'CONFIRMED') return 'approved'
  if (status === 'OVERDUE' || status === 'REFUNDED' || status === 'DELETED') return 'failed'
  return 'pending'
}

const formatCurrency = (amount?: number | null, currency = 'BRL') => {
  const value = Number(amount || 0)
  if (currency === 'BRL') return `R$ ${value.toFixed(2).replace('.', ',')}`
  return `${currency} ${value.toFixed(2)}`
}

const formatDate = (date?: string | null) => {
  if (!date) return ''
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(date)).replace(',', '')
}

const formatStatus = (status?: string | null) => {
  const value = String(status || '').toLowerCase()
  if (value === 'approved') return 'Pago'
  if (value === 'pending') return 'Aguardando pagamento'
  if (value === 'failed') return 'Recusado'
  return status || ''
}

const paymentMethodLabel = (billingType?: string, fallback?: string | null) => {
  if (billingType === 'PIX') return 'Pix'
  if (billingType === 'BOLETO') return 'Boleto'
  if (billingType === 'CREDIT_CARD') return 'Cartão de crédito'
  return fallback || ''
}

const mapSale = (row: Record<string, any>) => ({
  id: row.id,
  productId: row.product_id || undefined,
  offerId: row.offer_id || undefined,
  product: row.products?.name || 'Produto',
  customer: row.customer_name || row.customer_email || 'Cliente',
  customerEmail: row.customer_email || undefined,
  method: row.payment_method || '',
  value: formatCurrency(row.amount, row.currency || 'BRL'),
  status: formatStatus(row.status),
  createdAt: formatDate(row.created_at),
  provider: row.provider || undefined,
  providerPaymentId: row.provider_payment_id || undefined,
  invoiceUrl: row.invoice_url || undefined,
  pixQrCode: row.pix_qr_code || undefined,
  pixCopyPaste: row.pix_copy_paste || undefined,
  boletoUrl: row.boleto_url || undefined,
  boletoDueDate: row.boleto_due_date || undefined,
  paidAt: row.paid_at || undefined
})

const mapDelivery = (row: Record<string, any> | null | undefined) => {
  if (!row) return null

  return {
    id: row.id,
    saleId: row.sale_id,
    productId: row.product_id || undefined,
    customerEmail: row.customer_email || undefined,
    deliveryType: row.delivery_type || 'members_area',
    accessUrl: row.access_url || (row.product_id ? `/club=${row.product_id}` : '/'),
    status: row.status || 'active',
    createdAt: row.created_at || undefined
  }
}

const asaasFetch = async <T>(path: string) => {
  const config = useRuntimeConfig()
  const apiKey = String(config.asaasApiKey || '')
  const baseUrl = String(config.asaasBaseUrl || 'https://api.asaas.com/v3').replace(/\/$/, '')

  if (!apiKey) {
    throw createError({
      statusCode: 500,
      statusMessage: 'ASAAS_API_KEY nao configurada no servidor.'
    })
  }

  return $fetch<T>(`${baseUrl}${path}`, {
    headers: {
      access_token: apiKey,
      'Content-Type': 'application/json'
    }
  })
}

export default defineEventHandler(async (event) => {
  const saleId = String(getRouterParam(event, 'saleId') || '')
  const supabase = getSupabaseServerClient()

  if (!saleId) throw createError({ statusCode: 400, statusMessage: 'Venda obrigatoria.' })
  if (!supabase) throw createError({ statusCode: 500, statusMessage: 'Supabase nao configurado no servidor.' })

  const { data: sale, error: saleError } = await supabase
    .from('sales')
    .select('*, products(name)')
    .eq('id', saleId)
    .maybeSingle()

  if (saleError || !sale) {
    throw createError({
      statusCode: 404,
      statusMessage: saleError?.message || 'Venda nao encontrada.'
    })
  }

  if (!sale.provider_payment_id || sale.provider !== 'asaas') {
    const { data: delivery } = await supabase
      .from('product_deliveries')
      .select('*')
      .eq('sale_id', saleId)
      .maybeSingle()

    const redirect = String(sale.status).toLowerCase() === 'approved'
      ? await resolveApprovedRedirect(supabase, sale, delivery)
      : {
          accessUrl: `/payment/${saleId}`,
          clubUrl: delivery?.access_url || '',
          thankYouUrl: '',
          usesThankYou: false
        }

    return {
      sale: mapSale(sale),
      delivery: mapDelivery(delivery),
      ...redirect
    }
  }

  const payment = await asaasFetch<Record<string, any>>(`/payments/${sale.provider_payment_id}`)
  const status = normalizeStatus(payment.status)

  let pixQrCode = sale.pix_qr_code
  let pixCopyPaste = sale.pix_copy_paste
  if (String(payment.billingType) === 'PIX' && status !== 'approved') {
    try {
      const pix = await asaasFetch<Record<string, any>>(`/payments/${sale.provider_payment_id}/pixQrCode`)
      pixQrCode = pix.encodedImage || pix.qrCode || pix.payload || pixQrCode
      pixCopyPaste = pix.payload || pixCopyPaste
    } catch {
      // Mantem os dados Pix ja salvos.
    }
  }

  const updatePayload: Record<string, any> = {
    status,
    payment_method: paymentMethodLabel(payment.billingType, sale.payment_method),
    invoice_url: payment.invoiceUrl || payment.invoice_url || sale.invoice_url,
    boleto_url: payment.bankSlipUrl || payment.boletoUrl || sale.boleto_url,
    boleto_due_date: payment.dueDate || sale.boleto_due_date,
    pix_qr_code: pixQrCode,
    pix_copy_paste: pixCopyPaste,
    paid_at: status === 'approved' ? (payment.paymentDate || payment.clientPaymentDate || sale.paid_at || new Date().toISOString()) : sale.paid_at,
    raw_provider_response: {
      ...(sale.raw_provider_response || {}),
      refreshPayment: payment
    }
  }

  const { data: updatedSale, error: updateError } = await supabase
    .from('sales')
    .update(updatePayload)
    .eq('id', saleId)
    .select('*, products(name)')
    .single()

  if (updateError || !updatedSale) {
    throw createError({
      statusCode: 500,
      statusMessage: updateError?.message || 'Nao foi possivel atualizar a venda.'
    })
  }

  let delivery = null
  if (status === 'approved') {
    delivery = await ensureProductDelivery(supabase, updatedSale)
    await sendProductAccessEmail(supabase, updatedSale, delivery)
  } else {
    const { data } = await supabase
      .from('product_deliveries')
      .select('*')
      .eq('sale_id', saleId)
      .maybeSingle()
    delivery = data
  }

  const redirect = status === 'approved'
    ? await resolveApprovedRedirect(supabase, updatedSale, delivery)
    : {
        accessUrl: `/payment/${saleId}`,
        clubUrl: delivery?.access_url || '',
        thankYouUrl: '',
        usesThankYou: false
      }

  return {
    sale: mapSale(updatedSale),
    delivery: mapDelivery(delivery),
    ...redirect
  }
})
