import {
  createOffer as serviceCreateOffer,
  deleteOffer as serviceDeleteOffer,
  duplicateOffer as serviceDuplicateOffer,
  getOfferById,
  getOfferBySlug,
  listOffersByProduct,
  updateOffer as serviceUpdateOffer,
  type OfferPayload
} from '~/services/offersService'
import type { Offer } from '~/data/offers'

export function useOffers(productId?: Ref<string> | ComputedRef<string>) {
  const offers = ref<Offer[]>([])
  const loading = ref(false)

  const refreshOffers = async () => {
    if (!productId?.value) return offers.value
    loading.value = true
    offers.value = await listOffersByProduct(productId.value)
    loading.value = false
    return offers.value
  }

  const createOffer = async (payload: OfferPayload) => {
    const offer = await serviceCreateOffer(payload)
    await refreshOffers()
    return offer
  }

  const updateOffer = async (id: string, payload: Partial<OfferPayload>) => {
    const offer = await serviceUpdateOffer(id, payload)
    await refreshOffers()
    return offer
  }

  const deleteOffer = async (id: string) => {
    const deleted = await serviceDeleteOffer(id)
    await refreshOffers()
    return deleted
  }

  const duplicateOffer = async (id: string) => {
    const offer = await serviceDuplicateOffer(id)
    await refreshOffers()
    return offer
  }

  if (productId) void refreshOffers()

  return {
    offers: readonly(offers),
    loading: readonly(loading),
    refreshOffers,
    getOfferById,
    getOfferBySlug,
    createOffer,
    updateOffer,
    deleteOffer,
    duplicateOffer
  }
}
