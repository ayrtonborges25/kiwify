import { offers as mockOffers, type Offer, type OfferStatus } from '~/data/offers'
import {
  checkoutSettingsFromProductSettings,
  getProductById,
  paymentMethodsFromSetting,
  type ProductDetails
} from '~/services/productsService'
import { getSupabaseClient } from '~/utils/supabase'

export type OfferPayload = {
  productId: string
  checkoutId?: string
  name: string
  slug?: string
  price: string
  currency?: string
  paymentMethods?: string[]
  settings?: Record<string, unknown>
  isDefault?: boolean
  status?: OfferStatus
  label?: string
}

const offersStore: Offer[] = [...mockOffers]

const createId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `offer-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

const normalizeSlug = (value: string) => {
  const normalized = value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return normalized || `oferta-${Date.now()}`
}

const uniqueSlug = (value: string) => `${normalizeSlug(value)}-${createId().slice(0, 8)}`

const parsePrice = (price?: string) => {
  if (!price) return 0
  return Number(String(price).replace(/[^\d,.-]/g, '').replace('.', '').replace(',', '.')) || 0
}

const formatPrice = (amount?: number | string | null, currency = 'BRL') => {
  if (typeof amount === 'string') return amount.startsWith('R$') || /^[A-Z]{3}\s/.test(amount) ? amount : `R$ ${amount}`
  const value = Number(amount || 0)
  if (currency === 'BRL') return `R$ ${value.toFixed(2).replace('.', ',')}`
  return `${currency} ${value.toFixed(2)}`
}

export const offerAmount = (offer?: Pick<Offer, 'price'>) => parsePrice(offer?.price)

const publicUrlFor = (id: string) => `/checkout/${id}`

const shortLabel = (name: string) => name.length > 24 ? `${name.slice(0, 21)}...` : name

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
const defaultOfferSuffix = '-default-offer'

const productIdFromDefaultOfferId = (id: string) => {
  return id.endsWith(defaultOfferSuffix) ? id.slice(0, -defaultOfferSuffix.length) : ''
}

const mapOfferFromSupabase = (row: Record<string, any>): Offer => {
  const name = row.name || 'Oferta'

  return {
    id: row.id,
    productId: row.product_id,
    checkoutId: row.checkout_id || undefined,
    name,
    slug: row.slug || normalizeSlug(name || row.id),
    price: formatPrice(row.price, row.currency || 'BRL'),
    currency: row.currency || 'BRL',
    paymentMethods: Array.isArray(row.payment_methods) ? row.payment_methods : ['credit_card', 'pix', 'boleto'],
    settings: row.settings || {},
    isDefault: Boolean(row.is_default),
    status: row.status === 'inactive' || row.status === 'Desativado' ? 'Desativado' : 'Ativo',
    publicUrl: row.product_links?.[0]?.public_url || publicUrlFor(row.id),
    label: Boolean(row.is_default) ? shortLabel(name) : (row.product_links?.[0]?.label || shortLabel(name)),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }
}

const productToDefaultOffer = (product: ProductDetails): Offer => ({
  id: `${product.id}-default-offer`,
  productId: product.id,
  name: product.name,
  slug: normalizeSlug(product.name),
  price: product.price || 'R$ 0,00',
  currency: product.currency || 'BRL',
  paymentMethods: product.settings?.paymentMethods?.length
    ? product.settings.paymentMethods
    : paymentMethodsFromSetting(product.settings?.paymentMethod),
  settings: checkoutSettingsFromProductSettings(product.settings),
  isDefault: true,
  status: product.status === 'Ativo' ? 'Ativo' : 'Desativado',
  publicUrl: publicUrlFor(`${product.id}-default-offer`),
  label: shortLabel(product.name)
})

const ensureFallbackOffers = async (productId: string) => {
  const existing = offersStore.filter((offer) => offer.productId === productId)
  if (existing.length) return existing

  const product = await getProductById(productId)
  if (!product) return []

  const offer = productToDefaultOffer(product)
  offersStore.push(offer)
  return [offer]
}

export const listOffersByProduct = async (productId: string) => {
  try {
    const supabase = getSupabaseClient()
    if (supabase) {
      const { data, error } = await supabase
        .from('offers')
        .select('*, product_links(public_url,label,status)')
        .eq('product_id', productId)
        .order('created_at', { ascending: true })

      if (!error && data?.length) return data.map(mapOfferFromSupabase)
    }
  } catch {
    // fallback abaixo
  }

  return ensureFallbackOffers(productId)
}

export const getOfferById = async (id: string) => {
  const defaultProductId = productIdFromDefaultOfferId(id)
  if (defaultProductId) {
    const product = await getProductById(defaultProductId)
    return product ? productToDefaultOffer(product) : undefined
  }

  try {
    const supabase = getSupabaseClient()
    if (supabase && uuidPattern.test(id)) {
      const { data, error } = await supabase
        .from('offers')
        .select('*, product_links(public_url,label,status)')
        .eq('id', id)
        .maybeSingle()

      if (!error && data) return mapOfferFromSupabase(data)
    }
  } catch {
    // fallback abaixo
  }

  return offersStore.find((offer) => offer.id === id) || getOfferBySlug(id)
}

export const getOfferBySlug = async (slug: string) => {
  try {
    const supabase = getSupabaseClient()
    if (supabase) {
      const { data, error } = await supabase
        .from('offers')
        .select('*, product_links(public_url,label,status)')
        .eq('slug', slug)
        .maybeSingle()

      if (!error && data) return mapOfferFromSupabase(data)
    }
  } catch {
    // fallback abaixo
  }

  return offersStore.find((offer) => offer.slug === slug)
}

export const createOffer = async (payload: OfferPayload) => {
  const slug = payload.slug ? normalizeSlug(payload.slug) : uniqueSlug(payload.name)
  const status = payload.status || 'Ativo'

  try {
    const supabase = getSupabaseClient()
    if (supabase) {
      const { data, error } = await supabase
        .from('offers')
        .insert({
          product_id: payload.productId,
          checkout_id: payload.checkoutId,
          name: payload.name,
          slug,
          price: parsePrice(payload.price),
          currency: payload.currency || 'BRL',
          payment_methods: payload.paymentMethods || ['credit_card', 'pix', 'boleto'],
          settings: payload.settings || {},
          is_default: Boolean(payload.isDefault),
          status: status === 'Ativo' ? 'active' : 'inactive'
        })
        .select('*')
        .single()

      if (!error && data) {
        const offer = mapOfferFromSupabase(data)
        await supabase.from('product_links').insert({
          product_id: payload.productId,
          offer_id: offer.id,
          public_url: offer.publicUrl,
          label: payload.label || shortLabel(payload.name),
          title: payload.label || shortLabel(payload.name),
          url: offer.publicUrl,
          type: 'Checkout',
          status
        })
        return { ...offer, label: payload.label || shortLabel(payload.name) }
      }
    }
  } catch {
    // fallback abaixo
  }

  const id = createId()
  const offer: Offer = {
    id,
    productId: payload.productId,
    checkoutId: payload.checkoutId,
    name: payload.name,
    slug,
    price: formatPrice(payload.price, payload.currency || 'BRL'),
    currency: payload.currency || 'BRL',
    paymentMethods: payload.paymentMethods || ['credit_card', 'pix', 'boleto'],
    settings: payload.settings || {},
    isDefault: Boolean(payload.isDefault),
    status,
    publicUrl: publicUrlFor(id),
    label: payload.label || shortLabel(payload.name)
  }

  offersStore.push(offer)
  return offer
}

export const updateOffer = async (id: string, payload: Partial<OfferPayload>) => {
  try {
    const supabase = getSupabaseClient()
    if (supabase) {
      const updatePayload: Record<string, any> = {}
      if (payload.name !== undefined) updatePayload.name = payload.name
      if (payload.slug !== undefined || payload.name !== undefined) updatePayload.slug = normalizeSlug(payload.slug || payload.name || id)
      if (payload.price !== undefined) updatePayload.price = parsePrice(payload.price)
      if (payload.currency !== undefined) updatePayload.currency = payload.currency
      if (payload.paymentMethods !== undefined) updatePayload.payment_methods = payload.paymentMethods
      if (payload.settings !== undefined) updatePayload.settings = payload.settings
      if (payload.isDefault !== undefined) updatePayload.is_default = payload.isDefault
      if (payload.status !== undefined) updatePayload.status = payload.status === 'Ativo' ? 'active' : 'inactive'

      const { data, error } = await supabase
        .from('offers')
        .update(updatePayload)
        .eq('id', id)
        .select('*, product_links(public_url,label,status)')
        .maybeSingle()

      if (!error && data) return mapOfferFromSupabase(data)
    }
  } catch {
    // fallback abaixo
  }

  const offer = offersStore.find((item) => item.id === id)
  if (!offer) return undefined

  Object.assign(offer, {
    ...payload,
    slug: payload.slug || (payload.name ? normalizeSlug(payload.name) : offer.slug),
    price: payload.price ? formatPrice(payload.price, payload.currency || offer.currency) : offer.price,
    currency: payload.currency || offer.currency,
    publicUrl: offer.publicUrl
  })
  return offer
}

export const deleteOffer = async (id: string) => {
  try {
    const supabase = getSupabaseClient()
    if (supabase) {
      await supabase.from('product_links').delete().eq('offer_id', id)
      const { error } = await supabase.from('offers').delete().eq('id', id)
      if (!error) return true
    }
  } catch {
    // fallback abaixo
  }

  const index = offersStore.findIndex((offer) => offer.id === id)
  if (index === -1) return false
  offersStore.splice(index, 1)
  return true
}

export const duplicateOffer = async (id: string) => {
  const source = await getOfferById(id)
  if (!source) return undefined

  return createOffer({
    productId: source.productId,
    checkoutId: source.checkoutId,
    name: `${source.name} (cópia)`,
    price: source.price,
    currency: source.currency,
    paymentMethods: source.paymentMethods,
    settings: source.settings,
    isDefault: false,
    status: source.status,
    label: `${source.label} cópia`
  })
}
