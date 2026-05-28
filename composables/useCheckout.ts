import { getCheckoutBuildersSnapshot, listCheckouts } from '~/services/checkoutService'

export function useCheckout() {
  const checkoutBuildersState = ref(getCheckoutBuildersSnapshot())

  const refreshCheckouts = async () => {
    checkoutBuildersState.value = await listCheckouts()
    return checkoutBuildersState.value
  }

  const getCheckoutById = (id: string) => checkoutBuildersState.value.find((checkout) => checkout.id === id)

  void refreshCheckouts()

  return {
    checkoutBuilders: readonly(checkoutBuildersState),
    refreshCheckouts,
    getCheckoutById
  }
}
