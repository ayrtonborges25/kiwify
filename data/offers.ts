export type OfferStatus = 'Ativo' | 'Desativado'

export interface Offer {
  id: string
  productId: string
  checkoutId?: string
  name: string
  slug: string
  price: string
  currency: string
  paymentMethods: string[]
  settings: Record<string, unknown>
  isDefault: boolean
  status: OfferStatus
  publicUrl: string
  label: string
  createdAt?: string
  updatedAt?: string
}

export const offers: Offer[] = [
  {
    id: 'offer-ae3c3610-default',
    productId: 'ae3c3610-f0af-11f0-b85d-45218e98c266',
    name: 'Figurinhas da copa 2026',
    slug: 'figurinhas-da-copa-2026',
    price: 'R$ 19,00',
    currency: 'BRL',
    paymentMethods: ['credit_card', 'pix', 'boleto'],
    settings: { repeatEmailEnabled: true, collectPhone: true, collectDocument: true },
    isDefault: true,
    status: 'Desativado',
    publicUrl: '/checkout/offer-ae3c3610-default',
    label: 'Figurinhas da Co...'
  },
  {
    id: 'offer-1121e0c0-default',
    productId: '1121e0c0-3cb7-11f0-be25-e58a6462d605',
    name: 'Clube dos Fotógrafos - Ayrton Borges',
    slug: 'clube-dos-fotografos-ayrton-borges',
    price: 'R$ 187,00',
    currency: 'BRL',
    paymentMethods: ['credit_card', 'pix', 'boleto'],
    settings: { repeatEmailEnabled: true, collectPhone: true, collectDocument: true },
    isDefault: true,
    status: 'Ativo',
    publicUrl: '/checkout/offer-1121e0c0-default',
    label: 'Checkout A'
  }
]
