import {
  cancelSubscription as serviceCancelSubscription,
  chargeSale as serviceChargeSale,
  getDashboardMetricsSnapshot,
  getSalesSnapshot,
  listDashboardMetrics,
  listSales,
  refundSale as serviceRefundSale
} from '~/services/salesService'

export function useSales() {
  const salesState = ref(getSalesSnapshot())
  const metricsState = ref(getDashboardMetricsSnapshot())

  const refreshSales = async () => {
    salesState.value = await listSales()
    return salesState.value
  }

  const refreshMetrics = async () => {
    metricsState.value = await listDashboardMetrics()
    return metricsState.value
  }

  const getSaleById = (id: string) => salesState.value.find((sale) => sale.id === id)

  const refundSale = async (id: string) => {
    const sale = await serviceRefundSale(id)
    await refreshSales()
    return sale
  }

  const chargeSale = async (id: string) => {
    const sale = await serviceChargeSale(id)
    await refreshSales()
    return sale
  }

  const cancelSubscription = async (id: string) => {
    const sale = await serviceCancelSubscription(id)
    await refreshSales()
    return sale
  }

  void refreshSales()
  void refreshMetrics()

  return {
    sales: readonly(salesState),
    metrics: readonly(metricsState),
    refreshSales,
    refreshMetrics,
    getSaleById,
    refundSale,
    chargeSale,
    cancelSubscription
  }
}
