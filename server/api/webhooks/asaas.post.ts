import { getSupabaseServerClient } from '~/server/utils/supabaseServer'
import { ensureProductDelivery } from '~/server/utils/productDelivery'
import { sendProductAccessEmail } from '~/server/utils/deliveryEmail'

type AsaasWebhookPayload = {
  event?: string
  payment?: Record<string, any>
}

const handledEvents = new Set([
  'PAYMENT_CREATED',
  'PAYMENT_CONFIRMED',
  'PAYMENT_RECEIVED',
  'PAYMENT_OVERDUE',
  'PAYMENT_REFUNDED',
  'PAYMENT_DELETED',
  'PAYMENT_RESTORED'
])

const eventToStatus = (event?: string, paymentStatus?: string) => {
  if (event === 'PAYMENT_CONFIRMED' || event === 'PAYMENT_RECEIVED') return 'approved'
  if (event === 'PAYMENT_OVERDUE' || event === 'PAYMENT_REFUNDED' || event === 'PAYMENT_DELETED') return 'failed'
  if (paymentStatus === 'RECEIVED' || paymentStatus === 'CONFIRMED') return 'approved'
  if (paymentStatus === 'OVERDUE' || paymentStatus === 'REFUNDED' || paymentStatus === 'DELETED') return 'failed'
  return 'pending'
}

const paymentMethodLabel = (billingType?: string) => {
  if (billingType === 'PIX') return 'Pix'
  if (billingType === 'BOLETO') return 'Boleto'
  if (billingType === 'CREDIT_CARD') return 'Cartão de crédito'
  return undefined
}

const getProvidedToken = (event: any) => {
  const auth = getHeader(event, 'authorization') || ''
  const bearer = auth.toLowerCase().startsWith('bearer ') ? auth.slice(7).trim() : ''
  return (
    getHeader(event, 'asaas-access-token') ||
    getHeader(event, 'x-asaas-webhook-token') ||
    getHeader(event, 'x-webhook-token') ||
    bearer ||
    ''
  )
}

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const webhookToken = String(config.asaasWebhookToken || '')

  if (webhookToken && getProvidedToken(event) !== webhookToken) {
    throw createError({
      statusCode: 401,
      statusMessage: 'Webhook Asaas nao autorizado.'
    })
  }

  const body = await readBody<AsaasWebhookPayload>(event)
  const payment = body.payment || {}

  if (!body.event || !handledEvents.has(body.event)) {
    return {
      ok: true,
      ignored: true,
      reason: 'Evento nao tratado.'
    }
  }

  if (!payment.id) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Webhook Asaas sem payment.id.'
    })
  }

  const supabase = getSupabaseServerClient()
  if (!supabase) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Supabase nao configurado no servidor.'
    })
  }

  const status = eventToStatus(body.event, payment.status)
  const updatePayload: Record<string, any> = {
    status,
    payment_method: paymentMethodLabel(payment.billingType),
    invoice_url: payment.invoiceUrl || payment.invoice_url,
    boleto_url: payment.bankSlipUrl || payment.boletoUrl,
    boleto_due_date: payment.dueDate,
    pix_qr_code: payment.pixQrCode || payment.pixQrCodeEncodedImage,
    pix_copy_paste: payment.pixCopyPaste || payment.pixPayload || payment.payload,
    paid_at: status === 'approved' ? (payment.paymentDate || payment.clientPaymentDate || new Date().toISOString()) : null,
    raw_provider_response: body
  }

  Object.keys(updatePayload).forEach((key) => {
    if (updatePayload[key] === undefined) delete updatePayload[key]
  })

  const { data, error } = await supabase
    .from('sales')
    .update(updatePayload)
    .eq('provider_payment_id', payment.id)
    .select('id,status,provider_payment_id,product_id,offer_id,customer_email')

  if (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error.message
    })
  }

  if (!data?.length) {
    return {
      ok: true,
      updated: 0,
      providerPaymentId: payment.id
    }
  }

  let delivery = null
  let accessEmailSent = false
  if (status === 'approved') {
    delivery = await ensureProductDelivery(supabase, data[0])
    accessEmailSent = await sendProductAccessEmail(supabase, data[0], delivery)
  }

  return {
    ok: true,
    updated: data.length,
    saleId: data[0].id,
    status: data[0].status,
    providerPaymentId: data[0].provider_payment_id,
    deliveryId: delivery?.id,
    accessUrl: delivery?.access_url,
    accessEmailSent
  }
})
