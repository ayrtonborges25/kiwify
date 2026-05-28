import { serve } from 'https://deno.land/std@0.224.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.4'

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

const json = (body: Record<string, unknown>, status = 200) => {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json'
    }
  })
}

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

const absoluteUrl = (baseUrl: string, path?: string | null) => {
  const cleanBase = (baseUrl || 'http://localhost:3000').replace(/\/+$/, '')
  const cleanPath = path || '/'
  if (/^https?:\/\//.test(cleanPath)) return cleanPath
  return `${cleanBase}${cleanPath.startsWith('/') ? cleanPath : `/${cleanPath}`}`
}

const escapeHtml = (value?: string | null) => String(value || '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#039;')

const buildDeliveryEmailHtml = (productName: string, customerEmail: string, accessUrl: string) => `
<!doctype html>
<html>
  <body style="margin:0;background:#f3f4f6;font-family:Inter,Arial,sans-serif;color:#111827;">
    <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#f3f4f6;padding:32px 16px;">
      <tr>
        <td align="center">
          <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="max-width:560px;background:#ffffff;border-radius:12px;box-shadow:0 12px 32px rgba(15,23,42,.12);overflow:hidden;">
            <tr><td style="height:8px;background:#00a868;"></td></tr>
            <tr>
              <td style="padding:32px 32px 20px;">
                <p style="margin:0 0 12px;font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:#64748b;font-weight:700;">Compra aprovada</p>
                <h1 style="margin:0;font-size:28px;line-height:1.2;color:#0f172a;">Seu acesso foi liberado</h1>
                <p style="margin:18px 0 0;font-size:16px;line-height:1.6;color:#475569;">
                  O pagamento do produto <strong style="color:#111827;">${escapeHtml(productName)}</strong> foi aprovado.
                  Use o botão abaixo para entrar na área de acesso.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px 28px;">
                <table width="100%" cellpadding="0" cellspacing="0" role="presentation" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;">
                  <tr>
                    <td style="padding:18px 20px;">
                      <p style="margin:0 0 6px;font-size:13px;color:#64748b;">Email de compra</p>
                      <p style="margin:0;font-size:15px;color:#111827;font-weight:600;">${escapeHtml(customerEmail)}</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td align="center" style="padding:0 32px 32px;">
                <a href="${escapeHtml(accessUrl)}" style="display:block;background:#5846f6;color:#ffffff;text-decoration:none;font-size:17px;font-weight:700;border-radius:8px;padding:16px 24px;">
                  Acessar produto
                </a>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`

const sendProductAccessEmail = async (
  supabase: ReturnType<typeof createClient>,
  sale: Record<string, any>,
  delivery: Record<string, any> | null
) => {
  if (!delivery || delivery.access_email_sent_at) return false

  const resendApiKey = Deno.env.get('RESEND_API_KEY') || ''
  const from = Deno.env.get('RESEND_FROM_EMAIL') || Deno.env.get('DELIVERY_EMAIL_FROM') || 'noreply@ayrtonborgesonline.com'
  const appUrl = Deno.env.get('APP_PUBLIC_URL') || Deno.env.get('APP_URL') || 'http://localhost:3000'
  const to = delivery.customer_email || sale.customer_email

  if (!resendApiKey || !to) return false

  let productName = 'Produto'
  const productId = delivery.product_id || sale.product_id
  if (productId) {
    const { data: product } = await supabase
      .from('products')
      .select('name')
      .eq('id', productId)
      .maybeSingle()

    productName = product?.name || productName
  }

  const fallbackAccessPath = delivery.product_id ? `/club=${delivery.product_id}` : '/'
  const accessUrl = absoluteUrl(appUrl, delivery.access_url || fallbackAccessPath)
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${resendApiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      from,
      to,
      subject: `Acesso liberado: ${productName}`,
      html: buildDeliveryEmailHtml(productName, to, accessUrl)
    })
  })

  if (!response.ok) return false

  await supabase
    .from('product_deliveries')
    .update({ access_email_sent_at: new Date().toISOString() })
    .eq('id', delivery.id)

  return true
}

const getProvidedToken = (request: Request) => {
  const auth = request.headers.get('authorization') || ''
  const bearer = auth.toLowerCase().startsWith('bearer ') ? auth.slice(7).trim() : ''
  return (
    request.headers.get('asaas-access-token') ||
    request.headers.get('x-asaas-webhook-token') ||
    request.headers.get('x-webhook-token') ||
    bearer ||
    ''
  )
}

const ensureProductDelivery = async (supabase: ReturnType<typeof createClient>, sale: Record<string, any>) => {
  const { data: existing, error: existingError } = await supabase
    .from('product_deliveries')
    .select('*')
    .eq('sale_id', sale.id)
    .maybeSingle()

  if (existingError) throw existingError
  if (existing) return existing

  let productId = sale.product_id || null

  if (!productId && sale.offer_id) {
    const { data: offer, error: offerError } = await supabase
      .from('offers')
      .select('product_id')
      .eq('id', sale.offer_id)
      .maybeSingle()

    if (offerError) throw offerError
    productId = offer?.product_id || null
  }

  if (!productId) {
    throw new Error(`Entrega nao criada: venda ${sale.id} sem product_id e sem oferta resolvivel.`)
  }

  let membersAreaId = null
  const { data: course } = await supabase
    .from('courses')
    .select('members_area_id')
    .eq('product_id', productId)
    .not('members_area_id', 'is', null)
    .limit(1)
    .maybeSingle()

  membersAreaId = course?.members_area_id || null

  if (!membersAreaId) {
    const { data: area } = await supabase
      .from('members_areas')
      .select('id')
      .eq('product_id', productId)
      .limit(1)
      .maybeSingle()

    membersAreaId = area?.id || null
  }

  const { data, error } = await supabase
    .from('product_deliveries')
    .insert({
      sale_id: sale.id,
      product_id: productId,
      customer_email: sale.customer_email || null,
      delivery_type: 'members_area',
      access_url: `/club=${membersAreaId || productId}`,
      status: 'active'
    })
    .select('*')
    .single()

  if (error) throw error
  return data
}

serve(async (request) => {
  if (request.method !== 'POST') {
    return json({ ok: false, error: 'Method not allowed' }, 405)
  }

  const webhookToken = Deno.env.get('ASAAS_WEBHOOK_TOKEN') || ''
  if (webhookToken && getProvidedToken(request) !== webhookToken) {
    return json({ ok: false, error: 'Webhook Asaas nao autorizado.' }, 401)
  }

  let body: AsaasWebhookPayload
  try {
    body = await request.json()
  } catch {
    return json({ ok: false, error: 'JSON invalido.' }, 400)
  }

  const payment = body.payment || {}

  if (!body.event || !handledEvents.has(body.event)) {
    return json({ ok: true, ignored: true, reason: 'Evento nao tratado.' })
  }

  if (!payment.id) {
    return json({ ok: false, error: 'Webhook Asaas sem payment.id.' }, 400)
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
  if (!supabaseUrl || !serviceRoleKey) {
    return json({ ok: false, error: 'Supabase nao configurado na Edge Function.' }, 500)
  }

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  })

  const status = eventToStatus(body.event, payment.status)
  const updatePayload: Record<string, any> = {
    status,
    payment_method: paymentMethodLabel(payment.billingType),
    invoice_url: payment.invoiceUrl || payment.invoice_url,
    boleto_url: payment.bankSlipUrl || payment.boletoUrl,
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

  if (error) return json({ ok: false, error: error.message }, 500)

  if (!data?.length) {
    return json({
      ok: true,
      updated: 0,
      providerPaymentId: payment.id
    })
  }

  let delivery = null
  let accessEmailSent = false
  if (status === 'approved') {
    try {
      delivery = await ensureProductDelivery(supabase, data[0])
      accessEmailSent = await sendProductAccessEmail(supabase, data[0], delivery)
    } catch (deliveryError) {
      return json({
        ok: false,
        error: deliveryError instanceof Error ? deliveryError.message : 'Erro ao criar entrega.'
      }, 500)
    }
  }

  return json({
    ok: true,
    updated: data.length,
    saleId: data[0].id,
    status: data[0].status,
    providerPaymentId: data[0].provider_payment_id,
    deliveryId: delivery?.id,
    accessUrl: delivery?.access_url,
    accessEmailSent
  })
})
