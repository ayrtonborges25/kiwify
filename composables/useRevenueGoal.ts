const revenueGoalLevels = [10000, 100000, 1000000, 5000000, 10000000]
const fallbackMockSaleIds = new Set([
  'f87bbc92-be55-4fc0-9d21-a56a49b672de',
  'cb24b6ec-1bf5-46a2-8606-9ab4ee1a6b88',
  'd4161e70-32d9-4324-a527-c0f93c5f2c9b',
  '7dfa4c4b-4d69-42f1-807c-5dc43ced79fc'
])

const parseSaleCurrency = (value?: string) => {
  if (!value) return 0
  return Number(value.replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.')) || 0
}

const formatBRL = (value: number) => new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL'
}).format(value)

const formatGoalValue = (value: number) => {
  if (value >= 1000000) {
    const millions = value / 1000000
    return `R$ ${Number.isInteger(millions) ? millions : millions.toFixed(1)}M`
  }

  if (value >= 1000) {
    const thousands = value / 1000
    return `R$ ${Number.isInteger(thousands) ? thousands : thousands.toFixed(1)}K`
  }

  return formatBRL(value)
}

export function useRevenueGoal() {
  const { sales } = useSales()

  const revenueSales = computed(() => sales.value.filter((sale) => !fallbackMockSaleIds.has(sale.id)))
  const approvedSales = computed(() => revenueSales.value.filter((sale) => sale.status === 'Pago'))
  const grossRevenue = computed(() => approvedSales.value.reduce((total, sale) => total + parseSaleCurrency(sale.value), 0))
  const goal = computed(() => revenueGoalLevels.find((level) => grossRevenue.value < level) || revenueGoalLevels[revenueGoalLevels.length - 1])
  const progressPercent = computed(() => {
    if (!goal.value) return 0
    return Math.min((grossRevenue.value / goal.value) * 100, 100)
  })

  const levelLabel = computed(() => `${formatGoalValue(grossRevenue.value)} / ${formatGoalValue(goal.value)}`)
  const levelProgress = computed(() => `${progressPercent.value.toFixed(4)}%`)

  return {
    revenueSales: readonly(revenueSales),
    approvedSales: readonly(approvedSales),
    grossRevenue: readonly(grossRevenue),
    goal: readonly(goal),
    levelLabel,
    levelProgress
  }
}
