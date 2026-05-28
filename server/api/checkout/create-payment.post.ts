import { getSupabaseServerClient } from '~/server/utils/supabaseServer'
import { normalizeAsaasPixQrCode, resolveAsaasRuntime } from '~/server/utils/asaas'
import { ensureProductDelivery } from '~/server/utils/productDelivery'
import { sendProductAccessEmail } from '~/server/utils/deliveryEmail'
import { resolveApprovedRedirect } from '~/server/utils/approvedRedirect'

type CheckoutPaymentMethod = 'CREDIT_CARD' | 'PIX' | 'BOLETO'

type CheckoutPaymentPayload = {
  offerId?: string
  productId?: string
  customer?: {
    name?: string
    email?: string
    cpfCnpj?: string
    phone?: string
  }
  paymentMethod?: CheckoutPaymentMethod
  installments?: number
  card?: {
    holderName?: string
    number?: string
    expiryMonth?: string
    expiryYear?: string
    ccv?: string
  }
}

const paymentLabel: Record<CheckoutPaymentMethod, string> = {
  CREDIT_CARD: 'Cartão de crédito',
  PIX: 'Pix',
  BOLETO: 'Boleto'
}

const normalizeStatus = (status?: string, method?: CheckoutPaymentMethod) => {
  if (['RECEIVED', 'CONFIRMED'].includes(String(status))) return 'approved'
  if (['OVERDUE', 'REFUNDED', 'REFUND_REQUESTED', 'CHARGEBACK_REQUESTED', 'CHARGEBACK_DISPUTE', 'AWAITING_CHARGEBACK_REVERSAL'].includes(String(status))) return 'failed'
  return method === 'CREDIT_CARD' && status === 'PENDING' ? 'pending' : 'pending'
}

const onlyDigits = (value = '') => value.replace(/\D/g, '')
const defaultOfferSuffix = '-default-offer'
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

const parseProductPrice = (price?: string | number | null) => {
  if (typeof price === 'number') return price
  return Number(String(price || '0').replace(/[^\d,.-]/g, '').replace('.', '').replace(',', '.')) || 0
}

const paymentMethodsFromSetting = (paymentMethod?: string) => {
  const normalized = String(paymentMethod || '3').toLowerCase()

  if (normalized === '1' || normalized.includes('cartão de crédito e boleto')) return ['credit_card', 'boleto']
  if (normalized === '4' || normalized.includes('cartão de crédito e pix')) return ['credit_card', 'pix']
  if (normalized === '2' || normalized.includes('apenas cartão')) return ['credit_card']
  return ['credit_card', 'boleto', 'pix']
}

const checkoutSettingsFromProductSettings = (settings?: Record<string, any>) => ({
  repeatEmailEnabled: settings?.repeat_email_enabled ?? true,
  collectPhone: true,
  collectDocument: true,
  installments: settings?.installments || 12,
  boletoValidityDays: settings?.boleto_validity_days || 3,
  cardStatement: settings?.card_statement || '',
  twoCardsEnabled: Boolean(settings?.two_cards_enabled),
  cardPixEnabled: Boolean(settings?.card_pix_enabled),
  smartInstallmentsEnabled: Boolean(settings?.smart_installments_enabled)
})

const saoPauloDateParts = () => {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).formatToParts(new Date())

  return {
    year: Number(parts.find((part) => part.type === 'year')?.value),
    month: Number(parts.find((part) => part.type === 'month')?.value),
    day: Number(parts.find((part) => part.type === 'day')?.value)
  }
}

const todayPlusDays = (days: number) => {
  const { year, month, day } = saoPauloDateParts()
  const date = new Date(Date.UTC(year, month - 1, day))
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

const positiveIntegerOrUndefined = (value: unknown) => {
  const numberValue = Number(value)
  if (!Number.isFinite(numberValue) || numberValue <= 0) return undefined
  return Math.floor(numberValue)
}

const resolveMaxInstallments = (offer: Record<string, any>) => {
  const settings = offer.settings || {}
  const installments = positiveIntegerOrUndefined(settings.installments)
  return Math.max(1, Math.min(12, installments || 12))
}

const resolveBoletoValidityDays = async (
  supabase: NonNullable<ReturnType<typeof getSupabaseServerClient>>,
  offer: Record<string, any>
) => {
  const offerSettings = offer.settings || {}
  const offerValidity = positiveIntegerOrUndefined(
    offerSettings.boletoValidityDays ?? offerSettings.boleto_validity_days
  )
  if (offerValidity) return offerValidity

  if (offer.product_id) {
    const { data } = await supabase
      .from('product_settings')
      .select('boleto_validity_days')
      .eq('product_id', offer.product_id)
      .maybeSingle()

    const productValidity = positiveIntegerOrUndefined(data?.boleto_validity_days)
    if (productValidity) return productValidity
  }

  return 3
}

const asaasFetch = async <T>(path: string, options: Record<string, any> = {}) => {
  const { apiKey, baseUrl } = resolveAsaasRuntime()

  try {
    return await $fetch<T>(`${baseUrl}${path}`, {
      ...options,
      headers: {
        access_token: apiKey,
        'Content-Type': 'application/json',
        ...(options.headers || {})
      }
    })
  } catch (error: any) {
    const message = error?.data?.errors?.[0]?.description || error?.data?.message || error?.message || 'Erro ao comunicar com o Asaas.'
    throw createError({
      statusCode: error?.statusCode || error?.response?.status || 502,
      statusMessage: message
    })
  }
}

const findOrCreateCustomer = async (customer: NonNullable<CheckoutPaymentPayload['customer']>) => {
  const cpfCnpj = onlyDigits(customer.cpfCnpj)
  const query = cpfCnpj ? `cpfCnpj=${encodeURIComponent(cpfCnpj)}` : `email=${encodeURIComponent(customer.email || '')}`

  const found = await asaasFetch<{ data?: Array<{ id: string }> }>(`/customers?${query}&limit=1`)
  if (found.data?.[0]?.id) return found.data[0]

  return asaasFetch<{ id: string }>('/customers', {
    method: 'POST',
    body: {
      name: customer.name,
      email: customer.email,
      cpfCnpj,
      mobilePhone: onlyDigits(customer.phone),
      phone: onlyDigits(customer.phone)
    }
  })
}

const resolveCheckoutOffer = async (supabase: NonNullable<ReturnType<typeof getSupabaseServerClient>>, offerId: string) => {
  if (uuidPattern.test(offerId)) {
    const { data, error } = await supabase
      .from('offers')
      .select('id, product_id, name, price, currency, payment_methods, settings, products(id,name)')
      .eq('id', offerId)
      .maybeSingle()

    if (error || !data) return null
    return data
  }

  const defaultProductId = offerId.endsWith(defaultOfferSuffix)
    ? offerId.slice(0, -defaultOfferSuffix.length)
    : ''

  if (!defaultProductId) return null

  const { data: existingOffer } = await supabase
    .from('offers')
    .select('id, product_id, name, price, currency, payment_methods, settings, products(id,name)')
    .eq('product_id', defaultProductId)
    .order('is_default', { ascending: false })
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle()

  if (existingOffer) return existingOffer

  const { data: product, error: productError } = await supabase
    .from('products')
    .select('id, name, price, currency, product_settings(*)')
    .eq('id', defaultProductId)
    .maybeSingle()

  if (productError || !product) return null

  const price = parseProductPrice(product.price)
  const productSettings = Array.isArray(product.product_settings) ? product.product_settings[0] : undefined
  const paymentMethods = paymentMethodsFromSetting(productSettings?.payment_method)
  const checkoutSettings = checkoutSettingsFromProductSettings(productSettings)
  const { data: createdOffer, error: createOfferError } = await supabase
    .from('offers')
    .insert({
      product_id: product.id,
      name: product.name || 'Oferta principal',
      slug: `${String(product.name || product.id).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'oferta'}-${String(product.id).slice(0, 8)}`,
      price,
      currency: product.currency || 'BRL',
      payment_methods: paymentMethods,
      settings: checkoutSettings,
      is_default: true,
      status: 'active'
    })
    .select('id, product_id, name, price, currency, payment_methods, settings, products(id,name)')
    .single()

  if (createOfferError || !createdOffer) return null

  await supabase.from('product_links').insert({
    product_id: product.id,
    offer_id: createdOffer.id,
    public_url: `/checkout/${createdOffer.id}`,
    label: product.name || 'Oferta principal',
    title: product.name || 'Oferta principal',
    url: `/checkout/${createdOffer.id}`,
    type: 'Checkout',
    status: 'Ativo'
  })

  return createdOffer
}

export default defineEventHandler(async (event) => {
  const payload = await readBody<CheckoutPaymentPayload>(event)
  const supabase = getSupabaseServerClient()

  if (!supabase) {
    throw createError({
      statusCode: 500,
      statusMessage: 'Supabase nao configurado no servidor.'
    })
  }

  if (!payload.offerId) throw createError({ statusCode: 400, statusMessage: 'Oferta obrigatoria.' })
  if (!payload.customer?.name || !payload.customer?.email) throw createError({ statusCode: 400, statusMessage: 'Dados do comprador incompletos.' })
  if (!payload.customer?.cpfCnpj) throw createError({ statusCode: 400, statusMessage: 'CPF/CNPJ obrigatorio.' })
  if (!payload.customer?.phone) throw createError({ statusCode: 400, statusMessage: 'Telefone obrigatorio.' })
  if (!payload.paymentMethod || !['CREDIT_CARD', 'PIX', 'BOLETO'].includes(payload.paymentMethod)) {
    throw createError({ statusCode: 400, statusMessage: 'Metodo de pagamento invalido.' })
  }

  const offer = await resolveCheckoutOffer(supabase, payload.offerId)

  if (!offer) throw createError({ statusCode: 404, statusMessage: 'Oferta nao encontrada.' })

  const configuredPaymentMethods = Array.isArray(offer.payment_methods) && offer.payment_methods.length
    ? offer.payment_methods
    : ['credit_card', 'pix', 'boleto']
  const requestedPaymentMethod = payload.paymentMethod === 'CREDIT_CARD'
    ? 'credit_card'
    : payload.paymentMethod === 'PIX'
      ? 'pix'
      : 'boleto'

  if (!configuredPaymentMethods.includes(requestedPaymentMethod)) {
    throw createError({ statusCode: 400, statusMessage: 'Metodo de pagamento indisponivel para essa oferta.' })
  }

  const productId = offer.product_id
  if (!productId) {
    throw createError({
      statusCode: 422,
      statusMessage: 'Oferta sem produto vinculado. Corrija o vinculo antes de vender.'
    })
  }

  const customer = await findOrCreateCustomer(payload.customer)
  const amount = Number(offer.price || 0)
  const maxInstallments = resolveMaxInstallments(offer)
  const creditCardInstallments = payload.paymentMethod === 'CREDIT_CARD'
    ? Math.min(maxInstallments, positiveIntegerOrUndefined(payload.installments) || maxInstallments)
    : 1
  const boletoValidityDays = await resolveBoletoValidityDays(supabase, offer)
  const boletoDueDate = payload.paymentMethod === 'BOLETO' ? todayPlusDays(boletoValidityDays) : null
  const dueDate = boletoDueDate || todayPlusDays(1)

  const paymentBody: Record<string, any> = {
    customer: customer.id,
    billingType: payload.paymentMethod,
    value: amount,
    dueDate,
    description: offer.name || offer.products?.name || 'Compra',
    externalReference: offer.id
  }

  if (payload.paymentMethod === 'CREDIT_CARD' && creditCardInstallments > 1) {
    delete paymentBody.value
    paymentBody.installmentCount = creditCardInstallments
    paymentBody.totalValue = amount
  }

  if (payload.paymentMethod === 'CREDIT_CARD') {
    const card = payload.card || {}
    paymentBody.creditCard = {
      holderName: card.holderName || payload.customer.name,
      number: onlyDigits(card.number),
      expiryMonth: card.expiryMonth,
      expiryYear: card.expiryYear,
      ccv: card.ccv
    }
    paymentBody.creditCardHolderInfo = {
      name: payload.customer.name,
      email: payload.customer.email,
      cpfCnpj: onlyDigits(payload.customer.cpfCnpj),
      phone: onlyDigits(payload.customer.phone),
      mobilePhone: onlyDigits(payload.customer.phone),
      postalCode: '01310930',
      addressNumber: '100'
    }
  }

  const payment = await asaasFetch<Record<string, any>>('/payments', {
    method: 'POST',
    body: paymentBody
  })

  let pixQrCode: string | undefined
  let pixCopyPaste: string | undefined
  if (payload.paymentMethod === 'PIX' && payment.id) {
    try {
      const pix = await asaasFetch<Record<string, any>>(`/payments/${payment.id}/pixQrCode`)
      const normalizedPix = normalizeAsaasPixQrCode(pix)
      pixQrCode = normalizedPix.pixQrCode
      pixCopyPaste = normalizedPix.pixCopyPaste
    } catch {
      // A cobranca Pix foi criada; a tela de obrigado ainda mostra o link da fatura.
    }
  }

  const salePayload = {
    product_id: productId,
    offer_id: offer.id,
    customer_name: payload.customer.name,
    customer_email: payload.customer.email,
    amount,
    currency: offer.currency || 'BRL',
    status: normalizeStatus(payment.status, payload.paymentMethod),
    payment_method: paymentLabel[payload.paymentMethod],
    provider: 'asaas',
    provider_payment_id: payment.id,
    invoice_url: payment.invoiceUrl || payment.invoice_url,
    pix_qr_code: pixQrCode,
    pix_copy_paste: pixCopyPaste,
    boleto_url: payment.bankSlipUrl || payment.boletoUrl,
    boleto_due_date: boletoDueDate,
    paid_at: ['RECEIVED', 'CONFIRMED'].includes(String(payment.status)) ? new Date().toISOString() : null,
    raw_provider_response: {
      request: {
        installments: creditCardInstallments,
        paymentBody: {
          ...paymentBody,
          creditCard: paymentBody.creditCard ? '[redacted]' : undefined,
          creditCardHolderInfo: paymentBody.creditCardHolderInfo ? '[redacted]' : undefined
        }
      },
      payment,
      pix: pixQrCode || pixCopyPaste ? { pixQrCode, pixCopyPaste } : null
    }
  }

  const { data: sale, error: saleError } = await supabase
    .from('sales')
    .insert(salePayload)
    .select('id,status,product_id,offer_id,customer_email,invoice_url,pix_qr_code,pix_copy_paste,boleto_url,boleto_due_date')
    .single()

  if (saleError || !sale) {
    throw createError({
      statusCode: 500,
      statusMessage: saleError?.message || 'Pagamento criado, mas nao foi possivel salvar a venda.'
    })
  }

  let delivery = null
  if (sale.status === 'approved') {
    delivery = await ensureProductDelivery(supabase, sale)
    await sendProductAccessEmail(supabase, sale, delivery)
  }

  const redirect = sale.status === 'approved'
    ? await resolveApprovedRedirect(supabase, sale, delivery)
    : {
        accessUrl: `/payment/${sale.id}`,
        clubUrl: delivery?.access_url || '',
        thankYouUrl: '',
        usesThankYou: false
      }

  return {
    saleId: sale.id,
    status: sale.status,
    invoiceUrl: sale.invoice_url,
    pixQrCode: sale.pix_qr_code,
    pixCopyPaste: sale.pix_copy_paste,
    boletoUrl: sale.boleto_url,
    boletoDueDate: sale.boleto_due_date,
    dueDate,
    providerPaymentId: payment.id,
    accessUrl: redirect.accessUrl,
    clubUrl: redirect.clubUrl,
    thankYouUrl: redirect.thankYouUrl,
    usesThankYou: redirect.usesThankYou
  }
})
