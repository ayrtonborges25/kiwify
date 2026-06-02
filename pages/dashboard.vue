<script setup lang="ts">
import { signOut } from '~/services/authService'
import { setLastContext } from '~/services/sessionContextService'

useHead({ title: 'Dashboard' })
useLegacyKiwifyInteractions()
const { currentUser } = useCurrentUser()
const { products } = useProducts()
const { revenueSales, levelLabel, levelProgress } = useRevenueGoal()

const kiwifyLogo = '/img/kiwify-green-logo.3059fc8.svg'
const bronzeMedal = computed(() => currentUser.value.level.medalIcon)
const avatarUrl = computed(() => currentUser.value.avatarUrl)
const avatarInitial = computed(() => (currentUser.value.company || currentUser.value.name || 'U').slice(0, 1).toUpperCase())
const companyName = computed(() => currentUser.value.company)
const avatarMenuOpen = ref(false)
const openFilter = ref<string | null>(null)
const selectedPeriod = ref('Hoje')
const selectedProduct = ref('Todos os produtos')
const selectedCurrency = ref('Todas as moedas')

const periodOptions = ['Hoje', 'Ontem', 'Últimos 7 dias', 'Este mês']
const productOptions = computed(() => ['Todos os produtos', ...products.value.map((product) => product.name)])
const currencyOptions = ['Todas as moedas', 'BRL', 'USD', 'EUR']
const parseDashboardCurrency = (value?: string) => {
  if (!value) return 0
  return Number(value.replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.')) || 0
}
const formatDashboardBRL = (value: number) => new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL'
}).format(value)

const selectedSales = computed(() => {
  return revenueSales.value.filter((sale) => {
    const productMatch = selectedProduct.value === 'Todos os produtos' || sale.product === selectedProduct.value
    const currencyMatch = selectedCurrency.value === 'Todas as moedas' || sale.value.includes(selectedCurrency.value) || selectedCurrency.value === 'BRL'
    return productMatch && currencyMatch
  })
})
const selectedApprovedSales = computed(() => selectedSales.value.filter((sale) => sale.status === 'Pago'))
const selectedRevenue = computed(() => selectedApprovedSales.value.reduce((total, sale) => total + parseDashboardCurrency(sale.value), 0))
const selectedSalesCount = computed(() => selectedApprovedSales.value.length)
const cardSales = computed(() => selectedApprovedSales.value.filter((sale) => sale.method.toLowerCase().includes('cart')))
const cardApproval = computed(() => cardSales.value.length ? '100 %' : '0 %')
const boletoSales = computed(() => selectedSales.value.filter((sale) => sale.method.toLowerCase().includes('boleto')))
const paidBoletoSales = computed(() => boletoSales.value.filter((sale) => sale.status === 'Pago'))
const boletoConversion = computed(() => boletoSales.value.length ? `${Math.round((paidBoletoSales.value.length / boletoSales.value.length) * 100)} %` : '0 %')
const netValueLabel = computed(() => formatDashboardBRL(selectedRevenue.value))
const chartMaxValue = computed(() => Math.max(selectedRevenue.value, 1))
const chartValueLabel = computed(() => formatDashboardBRL(selectedRevenue.value).replace(',00', ''))
const chartPeakY = computed(() => {
  if (!selectedRevenue.value) return 102.73
  return Math.max(22.96, 102.73 - Math.min(selectedRevenue.value / chartMaxValue.value, 1) * 79.77)
})

const toggleFilter = (name: string) => {
  openFilter.value = openFilter.value === name ? null : name
}

const selectFilter = (name: string, value: string) => {
  if (name === 'period') selectedPeriod.value = value
  if (name === 'product') selectedProduct.value = value
  if (name === 'currency') selectedCurrency.value = value
  openFilter.value = null
}

const closeDashboardFilters = () => {
  openFilter.value = null
}

const closeAvatarMenu = () => {
  avatarMenuOpen.value = false
}

const switchToCourses = async () => {
  closeAvatarMenu()
  setLastContext('student')
  await navigateTo('/courses')
}

const logout = async () => {
  closeAvatarMenu()
  await signOut()
  await navigateTo('/login')
}

onMounted(() => {
  document.addEventListener('click', () => {
    closeDashboardFilters()
    closeAvatarMenu()
  })
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeDashboardFilters()
      closeAvatarMenu()
    }
  })
})

const navItems = [
  {
    label: 'Dashboard',
    to: '/dashboard',
    active: true,
    paths: ['M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z']
  },
  {
    label: 'Produtos',
    to: '/products',
    paths: ['M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z'],
    rule: 'evenodd'
  },
  {
    label: 'Área de Membros',
    to: '/members-area',
    paths: ['M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z']
  },
  {
    label: 'Marketplace',
    to: '/marketplace',
    paths: ['M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z']
  },
  {
    label: 'Meus Afiliados',
    to: '/myaffiliates',
    paths: ['M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z'],
    rule: 'evenodd'
  },
  {
    label: 'Vendas',
    to: '/sales',
    paths: ['M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z'],
    rule: 'evenodd'
  },
  {
    label: 'Assinaturas',
    to: '/subscriptions',
    paths: ['M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z'],
    rule: 'evenodd'
  },
  {
    label: 'Financeiro',
    to: '/finance',
    paths: ['M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z', 'M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z'],
    rule: 'evenodd'
  },
  {
    label: 'Relatórios',
    to: '/reports',
    paths: ['M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z']
  },
  {
    label: 'Colaboradores',
    to: '/team-members',
    paths: ['M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z']
  },
  {
    label: 'Apps',
    to: '/apps',
    paths: ['M11 17a1 1 0 001.447.894l4-2A1 1 0 0017 15V9.236a1 1 0 00-1.447-.894l-4 2a1 1 0 00-.553.894V17zM15.211 6.276a1 1 0 000-1.788l-4.764-2.382a1 1 0 00-.894 0L4.789 4.488a1 1 0 000 1.788l4.764 2.382a1 1 0 00.894 0l4.764-2.382zM4.447 8.342A1 1 0 003 9.236V15a1 1 0 00.553.894l4 2A1 1 0 009 17v-5.764a1 1 0 00-.553-.894l-4-2z']
  },
  {
    label: 'Ajuda',
    to: 'https://ajuda.kiwify.com.br/',
    paths: ['M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z'],
    rule: 'evenodd'
  }
]

const metricsTop = computed(() => [
  {
    title: 'Valor líquido',
    value: netValueLabel.value,
    paths: ['M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z', 'M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z'],
    rule: 'evenodd'
  },
  {
    title: 'Vendas',
    value: String(selectedSalesCount.value),
    paths: ['M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z'],
    rule: 'evenodd'
  }
])

const metricsLeft = computed(() => [
  {
    title: 'Aprovação cartão',
    value: cardApproval.value,
    paths: ['M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4z', 'M18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z'],
    rule: 'evenodd'
  },
  {
    title: 'Reembolso',
    value: '0 %',
    paths: ['M5 2a2 2 0 00-2 2v14l3.5-2 3.5 2 3.5-2 3.5 2V4a2 2 0 00-2-2H5zm4.707 3.707a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L8.414 9H10a3 3 0 010 6 1 1 0 100 2 5 5 0 000-10H8.414l1.293-1.293z'],
    rule: 'evenodd'
  },
  {
    title: 'Chargeback',
    value: '0 %',
    paths: ['M10 18a8 8 0 100-16 8 8 0 000 16zM4.93 4.93a7 7 0 019.9 9.9l-9.9-9.9z']
  }
])

const metricsRight = computed(() => [
  {
    title: 'Vendas 1-click da rede Kiwify',
    value: 'R$ 0,00',
    extra: '0 %',
    paths: ['M4.083 9h1.946c.089-1.546.383-2.97.837-4.118A6.004 6.004 0 004.083 9zM10 2a8 8 0 100 16 8 8 0 000-16zm0 2c-.076 0-.232.032-.465.262-.238.234-.497.623-.737 1.182-.389.907-.673 2.142-.766 3.556h3.936c-.093-1.414-.377-2.649-.766-3.556-.24-.56-.5-.948-.737-1.182C10.232 4.032 10.076 4 10 4zm3.971 5c-.089-1.546-.383-2.97-.837-4.118A6.004 6.004 0 0115.917 9h-1.946zm-2.003 2H8.032c.093 1.414.377 2.649.766 3.556.24.56.5.948.737 1.182.233.23.389.262.465.262.076 0 .232-.032.465-.262.238-.234.498-.623.737-1.182.389-.907.673-2.142.766-3.556zm1.166 4.118c.454-1.147.748-2.572.837-4.118h1.946a6.004 6.004 0 01-2.783 4.118zm-6.268 0C6.412 13.97 6.118 12.546 6.03 11H4.083a6.004 6.004 0 002.783 4.118z'],
    rule: 'evenodd'
  },
  {
    title: 'Conversão boleto',
    value: boletoConversion.value,
    paths: ['M5 2a2 2 0 00-2 2v14l3.5-2 3.5 2 3.5-2 3.5 2V4a2 2 0 00-2-2H5zm2.5 3a1.5 1.5 0 100 3 1.5 1.5 0 000-3zm6.207.293a1 1 0 00-1.414 0l-6 6a1 1 0 101.414 1.414l6-6a1 1 0 000-1.414zM12.5 10a1.5 1.5 0 100 3 1.5 1.5 0 000-3z'],
    rule: 'evenodd'
  },
  {
    title: 'Boletos gerados',
    value: String(boletoSales.value.length),
    paths: ['M9.243 3.03a1 1 0 01.727 1.213L9.53 6h2.94l.56-2.243a1 1 0 111.94.486L14.53 6H17a1 1 0 110 2h-2.97l-1 4H15a1 1 0 110 2h-2.47l-.56 2.242a1 1 0 11-1.94-.485L10.47 14H7.53l-.56 2.242a1 1 0 11-1.94-.485L5.47 14H3a1 1 0 110-2h2.97l1-4H5a1 1 0 110-2h2.47l.56-2.243a1 1 0 011.213-.727zM9.03 8l-1 4h2.938l1-4H9.031z'],
    rule: 'evenodd'
  }
])
</script>

<template>
  <div class="min-h-screen flex bg-gray-100">
    <div class="hidden sticky top-0 h-screen md:flex md:flex-shrink-0">
      <div class="flex flex-col w-64">
        <div class="flex flex-col flex-grow overflow-y-auto bg-green-600">
          <div class="flex items-center flex-shrink-0 px-2 py-1">
            <div class="w-full flex items-center">
              <div class="relative inline-block text-left w-full">
                <div class="dropdown-trigger cursor-pointer w-full">
                  <span class="rounded-md shadow-sm">
                    <button type="button" aria-haspopup="true" aria-expanded="true" class="px-2 w-full rounded-md focus:outline-none text-white leading-5 font-medium transition ease-in-out duration-150 hover:bg-green-500">
                      <div class="flex flex-shrink-0 items-center w-full py-2">
                        <img :src="kiwifyLogo" alt="" class="h-10 w-auto mr-2">
                        <div class="truncate w-36">{{ companyName }}</div>
                        <svg viewBox="0 0 20 20" fill="currentColor" class="h-5 ml-2 block"><path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"></path></svg>
                      </div>
                    </button>
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div class="flex-1 flex flex-col">
            <nav class="flex-1 px-2 pt-2 relative bg-gray-800">
              <span class="absolute w-11/12 text-white rounded-lg shadow ease-out transition-all transition-medium bg-gray-900" style="transform: translateY(calc(0%)); height: 39px;"></span>
              <div>
                <NuxtLink
                  v-for="item in navItems"
                  :key="item.label"
                  :to="item.to"
                  :target="item.to.startsWith('http') ? '_blank' : undefined"
                  :class="[
                    'group flex items-center hover:scale-105 transform px-2 py-2 text-sm leading-5 font-medium rounded-md focus:outline-none transition ease-in-out duration-150 cursor-pointer',
                    item.active ? 'text-white' : 'mt-1 text-gray-200 hover:bg-gray-700 hover:text-white focus:outline-none'
                  ]"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="24px" height="24px" class="mr-3 h-6 w-6 text-gray-400 group-hover:text-gray-300 group-focus:text-gray-300 transition ease-in-out duration-150">
                    <path v-for="path in item.paths" :key="path" :fill-rule="item.rule" :clip-rule="item.rule" :d="path"></path>
                  </svg>
                  {{ item.label }}
                </NuxtLink>
              </div>
            </nav>
          </div>
        </div>
      </div>
    </div>

    <div class="flex flex-col w-0 flex-1 overflow-hidden">
      <main tabindex="0" class="flex-1 relative z-0 focus:outline-none">
        <div class="flex-shrink-0 flex h-16 shadow md:z-20 w-full bg-green-600">
          <button aria-label="Open sidebar" class="px-4 focus:outline-none md:hidden cursor-pointer">
            <svg stroke="currentColor" fill="none" viewBox="0 0 24 24" class="h-6 w-6 text-white"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h7"></path></svg>
          </button>
          <div class="flex items-center justify-end w-full">
            <div class="flex items-center">
              <div class="level w-56 md:w-64 h-12 p-1 inline-flex flex-col justify-end items-center rounded-md focus:outline-none px-2 cursor-pointer transition duration-200 hover:bg-green-500 bg-green-600">
                <div class="text-white text-sm font-bold leading-none w-full text-right">{{ levelLabel }}</div>
                <div class="flex items-center w-full">
                  <img :src="bronzeMedal" class="w-6 mr-2">
                  <div class="overflow-hidden h-2 text-xs flex rounded bg-white w-full mt-1">
                    <div class="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-green-800" :style="{ width: levelProgress }"></div>
                  </div>
                </div>
              </div>
            </div>
            <div class="flex items-center md:mr-6 relative">
              <button type="button" class="inline-block rounded-full overflow-hidden bg-gray-100 h-10 w-10 cursor-pointer focus:outline-none" :aria-expanded="avatarMenuOpen" @click.stop="avatarMenuOpen = !avatarMenuOpen">
                <img v-if="avatarUrl" :src="avatarUrl" class="object-cover h-10 w-10">
                <span v-else class="object-cover h-10 w-10 flex items-center justify-center text-sm leading-5 font-medium text-gray-700">{{ avatarInitial }}</span>
              </button>
              <div v-if="avatarMenuOpen" class="dropdown z-50" style="display: block; position: absolute; right: 0px; top: 48px;" @click.stop>
                <div class="min-w-scale z-50 rounded-md shadow-lg" style="display: block; min-width: 14rem;">
                  <div class="rounded-md bg-white shadow-xs">
                    <div class="py-1 cursor-pointer">
                      <button type="button" role="menuitem" class="group flex cursor-pointer items-center px-4 py-2 gap-x-3 text-sm leading-5 text-gray-700 hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:bg-gray-100 focus:text-gray-900 w-full text-left" @click="switchToCourses">Mudar para meus cursos</button>
                      <NuxtLink to="/myprofile" role="menuitem" class="group flex cursor-pointer items-center px-4 py-2 gap-x-3 text-sm leading-5 text-gray-700 hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:bg-gray-100 focus:text-gray-900" @click="closeAvatarMenu">Meu perfil</NuxtLink>
                      <button type="button" role="menuitem" class="group flex cursor-pointer items-center px-4 py-2 gap-x-3 text-sm leading-5 text-gray-700 hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:bg-gray-100 focus:text-gray-900 w-full text-left" @click="logout">Sair</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="container mx-auto px-4 sm:px-8 py-8 lg:py-10 lg:px-20 relative">
          <div>
            <header class="w-full gap-4 flex flex-col xl:flex-row items-stretch xl:items-center xl:justify-between py-px mb-8">
              <h3 class="font-bold leading-6 text-2xl text-gray-900 flex flex-row gap-4 flex-1 md:flex-grow-0">
                Dashboard
              </h3>
              <div class="gap-4 flex flex-col lg:flex-row lg:items-center items-stretch justify-center">
                <div class="flex-1">
                  <div class="w-full m-0 w-full lg:w-56 xl:w-64">
                    <div class="relative inline-block text-left w-full">
                      <div class="dropdown-trigger cursor-pointer w-full">
                        <span class="rounded-md shadow-sm">
                          <button type="button" aria-haspopup="true" :aria-expanded="openFilter === 'period'" class="inline-flex justify-between w-full rounded-md border border-gray-300 px-4 py-2 bg-white text-sm leading-5 font-medium text-gray-700 hover:text-gray-500 focus:outline-none focus:shadow-outline-indigo active:bg-gray-50 active:text-gray-800 transition ease-in-out duration-150" @click.stop="toggleFilter('period')">
                            <span class="flex" style="padding: 0px 5.5px; color: rgb(51, 51, 51);">{{ selectedPeriod }}</span>
                            <div class="vs_actions" style="display: flex; align-items: center; padding: 6px 6px 0px 10px;"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="10" role="presentation" class="vs__open-indicator"><path d="M9.211364 7.59931l4.48338-4.867229c.407008-.441854.407008-1.158247 0-1.60046l-.73712-.80023c-.407008-.441854-1.066904-.441854-1.474243 0L7 5.198617 2.51662.33139c-.407008-.441853-1.066904-.441853-1.474243 0l-.737121.80023c-.407008.441854-.407008 1.158248 0 1.600461l4.48338 4.867228L7 10l2.211364-2.40069z"></path></svg></div>
                          </button>
                        </span>
                      </div>
                      <div v-if="openFilter === 'period'" class="dropdown z-50" style="display: block; position: absolute; inset: 0px auto auto 0px; margin: 0px; transform: translate3d(0px, 42px, 0px); min-width: 100%;">
                        <div class="min-w-scale z-50 rounded-md shadow-lg" style="display: block;"><div class="rounded-md bg-white shadow-xs"><div class="py-1 cursor-pointer"><div v-for="option in periodOptions" :key="option" role="menuitem" class="group flex cursor-pointer items-center px-4 py-2 gap-x-3 text-sm leading-5 text-gray-700 hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:bg-gray-100 focus:text-gray-900" @click.stop="selectFilter('period', option)"><div class="flex items-center justify-between w-full"><span>{{ option }}</span></div></div></div></div></div>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="flex-1">
                  <div class="w-full m-0 w-full lg:w-56 xl:w-80">
                    <div class="relative inline-block text-left w-full">
                      <div class="dropdown-trigger cursor-pointer w-full">
                        <span class="rounded-md shadow-sm">
                          <button type="button" aria-haspopup="true" :aria-expanded="openFilter === 'product'" class="inline-flex justify-between w-full rounded-md border border-gray-300 px-4 py-2 bg-white text-sm leading-5 font-medium text-gray-700 hover:text-gray-500 focus:outline-none focus:shadow-outline-indigo active:bg-gray-50 active:text-gray-800 transition ease-in-out duration-150" @click.stop="toggleFilter('product')">
                            <span class="flex" style="padding: 0px 5.5px; color: rgb(51, 51, 51);">{{ selectedProduct }}</span>
                            <div class="vs_actions" style="display: flex; align-items: center; padding: 6px 6px 0px 10px;"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="10" role="presentation" class="vs__open-indicator"><path d="M9.211364 7.59931l4.48338-4.867229c.407008-.441854.407008-1.158247 0-1.60046l-.73712-.80023c-.407008-.441854-1.066904-.441854-1.474243 0L7 5.198617 2.51662.33139c-.407008-.441853-1.066904-.441853-1.474243 0l-.737121.80023c-.407008.441854-.407008 1.158248 0 1.600461l4.48338 4.867228L7 10l2.211364-2.40069z"></path></svg></div>
                          </button>
                        </span>
                      </div>
                      <div v-if="openFilter === 'product'" class="dropdown z-50" style="display: block; position: absolute; inset: 0px auto auto 0px; margin: 0px; transform: translate3d(0px, 42px, 0px); min-width: 100%;">
                        <div class="min-w-scale z-50 rounded-md shadow-lg" style="display: block;"><div class="rounded-md bg-white shadow-xs"><div class="py-1 cursor-pointer"><div v-for="option in productOptions" :key="option" role="menuitem" class="group flex cursor-pointer items-center px-4 py-2 gap-x-3 text-sm leading-5 text-gray-700 hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:bg-gray-100 focus:text-gray-900" @click.stop="selectFilter('product', option)"><div class="flex items-center justify-between w-full"><span>{{ option }}</span></div></div></div></div></div>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="flex-1">
                  <div class="w-full m-0 w-full lg:w-56 xl:w-64">
                    <div class="relative inline-block text-left w-full">
                      <div class="dropdown-trigger cursor-pointer w-full">
                        <span class="rounded-md shadow-sm">
                          <button type="button" aria-haspopup="true" :aria-expanded="openFilter === 'currency'" class="inline-flex justify-between w-full rounded-md border border-gray-300 px-4 py-2 bg-white text-sm leading-5 font-medium text-gray-700 hover:text-gray-500 focus:outline-none focus:shadow-outline-indigo active:bg-gray-50 active:text-gray-800 transition ease-in-out duration-150" @click.stop="toggleFilter('currency')">
                            <span class="flex" style="padding: 0px 5.5px; color: rgb(51, 51, 51);">{{ selectedCurrency }}</span>
                            <div class="vs_actions" style="display: flex; align-items: center; padding: 6px 6px 0px 10px;"><svg xmlns="http://www.w3.org/2000/svg" width="14" height="10" role="presentation" class="vs__open-indicator"><path d="M9.211364 7.59931l4.48338-4.867229c.407008-.441854.407008-1.158247 0-1.60046l-.73712-.80023c-.407008-.441854-1.066904-.441854-1.474243 0L7 5.198617 2.51662.33139c-.407008-.441853-1.066904-.441853-1.474243 0l-.737121.80023c-.407008.441854-.407008 1.158248 0 1.600461l4.48338 4.867228L7 10l2.211364-2.40069z"></path></svg></div>
                          </button>
                        </span>
                      </div>
                      <div v-if="openFilter === 'currency'" class="dropdown z-50" style="display: block; position: absolute; inset: 0px auto auto 0px; margin: 0px; transform: translate3d(0px, 42px, 0px); min-width: 100%;">
                        <div class="min-w-scale z-50 rounded-md shadow-lg" style="display: block;"><div class="rounded-md bg-white shadow-xs"><div class="py-1 cursor-pointer"><div v-for="option in currencyOptions" :key="option" role="menuitem" class="group flex cursor-pointer items-center px-4 py-2 gap-x-3 text-sm leading-5 text-gray-700 hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:bg-gray-100 focus:text-gray-900" @click.stop="selectFilter('currency', option)"><div class="flex items-center justify-between w-full"><span>{{ option }}</span></div></div></div></div></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </header>
            <div>
              <div class="flex flex-wrap lg:flex-no-wrap lg:flex-row flex-col-reverse">
                <div class="w-full lg:w-1/2">
                  <div id="chart-dashboard" class="bg-white shadow rounded-lg" style="position: relative;">
                    <div style="min-height: 197px;">
                      <svg width="100%" height="197" viewBox="0 0 398 182" xmlns="http://www.w3.org/2000/svg" style="background: transparent;">
                        <g transform="translate(52, 40)">
                          <line x1="0" y1="103.73" x2="267.3046875" y2="103.73" stroke="#e0e0e0" stroke-width="1"></line>
                          <path :d="`M0 102.73L11.62 102.73L23.24 102.73L34.86 102.73L46.48 102.73L58.10 102.73L69.73 102.73L81.35 102.73L92.97 102.73L104.59 102.73L116.21 102.73L127.84 ${chartPeakY}`" fill="none" stroke="rgba(88,80,236,1)" stroke-width="2"></path>
                          <path :d="`M127.84 ${chartPeakY}L139.46 102.73`" fill="none" stroke="rgba(88,80,236,1)" stroke-width="2" stroke-dasharray="3"></path>
                          <text x="0" y="131.73" text-anchor="middle" font-size="13" font-family="Helvetica, Arial, sans-serif" fill="#6a7383">Hoje, 0:00</text>
                          <text x="267.30" y="131.73" text-anchor="middle" font-size="13" font-family="Helvetica, Arial, sans-serif" fill="#6a7383">Hoje, 23:59</text>
                          <text x="278" y="31" font-size="13" font-family="Helvetica, Arial, sans-serif" fill="#6a7383">{{ chartValueLabel }}</text>
                          <text x="278" y="103.73" font-size="13" font-family="Helvetica, Arial, sans-serif" fill="#6a7383">R$ 0</text>
                        </g>
                      </svg>
                    </div>
                  </div>
                </div>

                <div class="w-full lg:w-1/2 lg:ml-4 mt-4 mb-4 lg:mb-0 lg:mt-0">
                  <div class="grid grid-cols-1 gap-5">
                    <div v-for="metric in metricsTop" :key="metric.title" class="bg-white overflow-hidden shadow rounded-lg">
                      <div class="p-5">
                        <div class="flex items-center">
                          <div class="flex-shrink-0">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="24px" height="24px" class="h-6 w-6 text-cool-gray-400">
                              <path v-for="path in metric.paths" :key="path" :fill-rule="metric.rule" :clip-rule="metric.rule" :d="path"></path>
                            </svg>
                          </div>
                          <div class="ml-5 w-0 flex-1">
                            <dl>
                              <dt class="text-sm leading-5 font-medium text-cool-gray-500 truncate">{{ metric.title }}</dt>
                              <dd><div class="text-lg leading-7 font-medium text-cool-gray-900">{{ metric.value }}</div></dd>
                            </dl>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div class="w-full mt-4">
                <div class="flex flex-wrap lg:flex-no-wrap">
                  <div class="w-full lg:w-1/2">
                    <div class="mt-2 lg:mt-0 grid gap-5 grid-cols-1">
                      <div v-for="metric in metricsLeft" :key="metric.title" class="bg-white overflow-hidden shadow rounded-lg">
                        <div class="p-5">
                          <div class="flex items-center">
                            <div class="flex-shrink-0">
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="24px" height="24px" class="h-6 w-6 text-cool-gray-400">
                                <path v-for="path in metric.paths" :key="path" :fill-rule="metric.rule" :clip-rule="metric.rule" :d="path"></path>
                              </svg>
                            </div>
                            <div class="ml-5 w-0 flex-1">
                              <dl>
                                <dt class="text-sm leading-5 font-medium text-cool-gray-500 truncate">{{ metric.title }}</dt>
                                <dd><div class="text-lg leading-7 font-medium text-cool-gray-900">{{ metric.value }}</div></dd>
                              </dl>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div class="w-full lg:w-1/2 lg:ml-4 mt-4 lg:mt-0">
                    <div class="grid gap-5 grid-cols-1">
                      <div v-for="metric in metricsRight" :key="metric.title" class="bg-white overflow-hidden shadow rounded-lg">
                        <div class="p-5">
                          <div class="flex items-center">
                            <div class="flex-shrink-0">
                              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="24px" height="24px" class="h-6 w-6 text-cool-gray-400">
                                <path v-for="path in metric.paths" :key="path" :fill-rule="metric.rule" :clip-rule="metric.rule" :d="path"></path>
                              </svg>
                            </div>
                            <div class="ml-5 w-0 flex-1">
                              <dl>
                                <dt class="text-sm leading-5 font-medium text-cool-gray-500 truncate">{{ metric.title }}</dt>
                                <dd>
                                  <div class="flex items-center">
                                    <div class="text-lg leading-7 font-medium text-cool-gray-900">{{ metric.value }}</div>
                                    <div v-if="metric.extra" class="text-sm text-cool-gray-500 ml-4">{{ metric.extra }}</div>
                                  </div>
                                </dd>
                              </dl>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="fixed right-4 bottom-4">
          <button class="rounded-full bg-black text-white shadow-lg w-16 h-16 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-7 h-7"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.286 3.957a1 1 0 00.95.69h4.16c.969 0 1.371 1.24.588 1.81l-3.366 2.445a1 1 0 00-.364 1.118l1.286 3.957c.3.921-.755 1.688-1.54 1.118l-3.366-2.445a1 1 0 00-1.176 0l-3.366 2.445c-.784.57-1.838-.197-1.539-1.118l1.285-3.957a1 1 0 00-.363-1.118L2.06 9.384c-.783-.57-.38-1.81.588-1.81h4.16a1 1 0 00.95-.69l1.291-3.957z"></path></svg>
          </button>
        </div>
      </main>
    </div>
  </div>
</template>
