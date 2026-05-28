import { computed, reactive, type ComputedRef } from 'vue'
import type { ProductDetails } from '~/services/productsService'

export type ProductOffer = {
  id: string
  name: string
  price: string
  currency: string
  status: 'Ativo' | 'Desativado'
}

export type ProductCheckoutLink = {
  id: string
  name: string
  url: string
  type: 'Página' | 'Checkout'
  price: string
  status: 'Ativo' | 'Desativado'
  offerId?: string
}

type OffersState = {
  enabledByProduct: Record<string, boolean>
  offersByProduct: Record<string, ProductOffer[]>
}

const offersState = reactive<OffersState>({
  enabledByProduct: {},
  offersByProduct: {}
})

const currencies = ['BRL', 'AED', 'ARS', 'AUD', 'CAD', 'CLP', 'COP', 'EUR', 'GBP', 'JPY', 'MXN', 'PEN', 'USD']

const createId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID()
  return `offer-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

const normalizePrice = (price?: string) => {
  if (!price) return ''
  const text = String(price).trim()
  if (!text) return ''
  const onlyNumber = text.replace(/[^\d,.-]/g, '')
  return onlyNumber || text
}

const displayPrice = (price?: string, currency = 'BRL') => {
  const value = normalizePrice(price)
  if (!value) return ''
  return currency === 'BRL' ? `R$ ${value}` : `${currency} ${value}`
}

const shortCode = (seed: string) => seed.replace(/[^a-zA-Z0-9]/g, '').slice(0, 6) || 'checkout'

const ensureProductOffers = (productId: string, product?: ProductDetails) => {
  if (!(productId in offersState.enabledByProduct)) {
    offersState.enabledByProduct[productId] = false
  }

  if (!offersState.offersByProduct[productId]) {
    offersState.offersByProduct[productId] = [
      {
        id: `${productId}-offer-1`,
        name: '',
        price: '0,00',
        currency: product?.currency || 'BRL',
        status: 'Desativado'
      }
    ]
  }
}

export function useProductOffers(productId: ComputedRef<string>, product?: ComputedRef<ProductDetails | undefined>) {
  const currentProduct = computed(() => product?.value)
  const ensureCurrent = () => ensureProductOffers(productId.value, currentProduct.value)

  const offersEnabled = computed(() => {
    ensureCurrent()
    return offersState.enabledByProduct[productId.value]
  })

  const offers = computed(() => {
    ensureCurrent()
    return offersState.offersByProduct[productId.value]
  })

  const checkoutLinks = computed<ProductCheckoutLink[]>(() => {
    ensureCurrent()
    const current = currentProduct.value
    const baseName = current?.name || 'Produto'
    const basePrice = current?.price || 'R$ 0,00'
    const baseCurrency = current?.currency || 'BRL'
    const activeOffers = offersEnabled.value
      ? offers.value
      : [{
          id: `${productId.value}-default-checkout`,
          name: baseName,
          price: normalizePrice(basePrice),
          currency: baseCurrency,
          status: 'Desativado' as const
        }]

    return [
      {
        id: `${productId.value}-sales-page`,
        name: 'Sales Page',
        url: `https://kiwify.app/${shortCode(productId.value)}`,
        type: 'Página',
        price: '',
        status: 'Desativado'
      },
      ...activeOffers
        .filter((offer) => offer.name.trim() || offer.price.trim())
        .map((offer) => ({
          id: `${offer.id}-checkout`,
          name: offer.name.trim() || baseName,
          url: `https://pay.kiwify.com.br/${shortCode(offer.id)}`,
          type: 'Checkout' as const,
          price: displayPrice(offer.price, offer.currency),
          status: offer.status,
          offerId: offer.id
        }))
    ]
  })

  const setOffersEnabled = (value: boolean) => {
    ensureCurrent()
    offersState.enabledByProduct[productId.value] = value
  }

  const toggleOffersEnabled = () => setOffersEnabled(!offersEnabled.value)

  const addOffer = () => {
    ensureCurrent()
    offersState.enabledByProduct[productId.value] = true
    offersState.offersByProduct[productId.value].push({
      id: createId(),
      name: '',
      price: '',
      currency: currentProduct.value?.currency || 'BRL',
      status: 'Desativado'
    })
  }

  const updateOffer = (offerId: string, patch: Partial<ProductOffer>) => {
    ensureCurrent()
    const offer = offersState.offersByProduct[productId.value].find((item) => item.id === offerId)
    if (offer) Object.assign(offer, patch)
  }

  const removeOffer = (offerId: string) => {
    ensureCurrent()
    offersState.offersByProduct[productId.value] = offersState.offersByProduct[productId.value].filter((offer) => offer.id !== offerId)
  }

  const setLinkStatus = (linkId: string, status: 'Ativo' | 'Desativado') => {
    ensureCurrent()
    const offer = offersState.offersByProduct[productId.value].find((item) => `${item.id}-checkout` === linkId)
    if (offer) offer.status = status
  }

  return {
    currencies,
    offersEnabled,
    offers,
    checkoutLinks,
    setOffersEnabled,
    toggleOffersEnabled,
    addOffer,
    updateOffer,
    removeOffer,
    setLinkStatus
  }
}
