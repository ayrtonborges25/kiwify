import { dashboardMetrics as mockDashboardMetrics, sales as mockSales, type Sale } from '~/data/sales'
import { getSupabaseClient } from '~/utils/supabase'

const salesStore: Sale[] = [...mockSales]
const dashboardMetricsStore = [...mockDashboardMetrics]

export type CreateSalePayload = {
  productId?: string
  offerId?: string
  customerName: string
  customerEmail: string
  amount: number
  currency?: string
  status: string
  paymentMethod: string
  provider?: string
  providerPaymentId?: string
  invoiceUrl?: string
  pixQrCode?: string
  pixCopyPaste?: string
  boletoUrl?: string
  boletoDueDate?: string
  paidAt?: string
  rawProviderResponse?: Record<string, unknown>
}

const createMockId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `sale-${Date.now()}-${Math.random().toString(16).slice(2)}`
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

const mapSaleFromSupabase = (row: Record<string, any>): Sale => ({
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

const fallbackSales = () => salesStore

export const getSalesSnapshot = () => getSupabaseClient() ? [] : salesStore

export const getDashboardMetricsSnapshot = () => dashboardMetricsStore

export const listSales = async () => {
  try {
    const supabase = getSupabaseClient()
    if (!supabase) return fallbackSales()

    const { data, error } = await supabase
      .from('sales')
      .select('*, products(name)')
      .order('created_at', { ascending: false })

    if (error) return fallbackSales()

    return data.map(mapSaleFromSupabase)
  } catch {
    return fallbackSales()
  }
}

export const listDashboardMetrics = async () => dashboardMetricsStore

export const getSaleById = async (id: string) => {
  try {
    const supabase = getSupabaseClient()
    if (!supabase) return salesStore.find((sale) => sale.id === id)

    const { data, error } = await supabase
      .from('sales')
      .select('*, products(name)')
      .eq('id', id)
      .maybeSingle()

    if (error || !data) return salesStore.find((sale) => sale.id === id)

    return mapSaleFromSupabase(data)
  } catch {
    return salesStore.find((sale) => sale.id === id)
  }
}

const updateSaleStatus = async (id: string, status: string) => {
  try {
    const supabase = getSupabaseClient()
    if (supabase) {
      const { data, error } = await supabase
        .from('sales')
        .update({ status })
        .eq('id', id)
        .select('*, products(name)')
        .maybeSingle()

      if (!error && data) return mapSaleFromSupabase(data)
    }
  } catch {
    // fallback abaixo
  }

  const sale = salesStore.find((item) => item.id === id)
  if (!sale) return undefined

  sale.status = status
  return sale
}

export const refundSale = async (id: string) => updateSaleStatus(id, 'Reembolsado')

export const chargeSale = async (id: string) => updateSaleStatus(id, 'Pago')

export const cancelSubscription = async (id: string) => updateSaleStatus(id, 'Assinatura cancelada')

export const createSale = async (payload: CreateSalePayload) => {
  try {
    const supabase = getSupabaseClient()
    if (supabase) {
      const insertPayload: Record<string, any> = {
        product_id: payload.productId,
        customer_name: payload.customerName,
        customer_email: payload.customerEmail,
        amount: payload.amount,
        currency: payload.currency || 'BRL',
        status: payload.status,
        payment_method: payload.paymentMethod,
        provider: payload.provider,
        provider_payment_id: payload.providerPaymentId,
        invoice_url: payload.invoiceUrl,
        pix_qr_code: payload.pixQrCode,
        pix_copy_paste: payload.pixCopyPaste,
        boleto_url: payload.boletoUrl,
        boleto_due_date: payload.boletoDueDate,
        paid_at: payload.paidAt,
        raw_provider_response: payload.rawProviderResponse || {}
      }

      if (payload.offerId) insertPayload.offer_id = payload.offerId

      let result = await supabase
        .from('sales')
        .insert(insertPayload)
        .select('*, products(name)')
        .single()

      if (result.error && String(result.error.message || '').includes('offer_id')) {
        delete insertPayload.offer_id
        result = await supabase
          .from('sales')
          .insert(insertPayload)
          .select('*, products(name)')
          .single()
      }

      if (!result.error && result.data) return mapSaleFromSupabase(result.data)
    }
  } catch {
    // fallback abaixo
  }

  const sale: Sale = {
    id: createMockId(),
    productId: payload.productId,
    offerId: payload.offerId,
    product: payload.productId || 'Produto',
    customer: payload.customerName || payload.customerEmail,
    customerEmail: payload.customerEmail,
    method: payload.paymentMethod,
    value: formatCurrency(payload.amount, payload.currency || 'BRL'),
    status: payload.status,
    createdAt: formatDate(new Date().toISOString()),
    provider: payload.provider,
    providerPaymentId: payload.providerPaymentId,
    invoiceUrl: payload.invoiceUrl,
    pixQrCode: payload.pixQrCode,
    pixCopyPaste: payload.pixCopyPaste,
    boletoUrl: payload.boletoUrl,
    boletoDueDate: payload.boletoDueDate,
    paidAt: payload.paidAt
  }

  salesStore.unshift(sale)
  return sale
}
