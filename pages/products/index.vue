<script setup lang="ts">
useHead({ title: 'Produtos' })
useLegacyKiwifyInteractions()

const { products, createProduct } = useProducts()
const { membersAreas } = useMembersArea()
const route = useRoute()

const searchQuery = ref('')
const statusFilter = ref('all')

const activeProductsTab = computed(() => String(route.query.tab || 'myproducts'))
const selectProductsTab = (event: Event) => {
  navigateTo(`/products?tab=${(event.target as HTMLSelectElement).value}`)
}

const productEditUrl = (id: string, tab = 'general') => `/products/edit/${id}?tab=${tab}`

const statusMatches = (status: string) => {
  const normalized = status.toLowerCase()
  if (statusFilter.value === 'all') return true
  if (statusFilter.value === 'active') return normalized === 'ativo'
  if (statusFilter.value === 'under_review') return normalized === 'em análise'
  if (statusFilter.value === 'rejected') return normalized === 'recusado'
  if (statusFilter.value === 'draft') return normalized === 'rascunho'
  if (statusFilter.value === 'disabled') return normalized === 'deletado'
  return true
}

const filteredProducts = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  return products.value.filter((product) => {
    const matchesSearch = !query || product.name.toLowerCase().includes(query)
    return matchesSearch && statusMatches(product.status)
  })
})

const visiblePageCount = computed(() => Math.max(1, Math.ceil(filteredProducts.value.length / 10)))
const rowClass = (index: number) => index % 2 === 0 ? 'bg-white' : 'bg-gray-50'
const statusBadgeClass = (status: string) => {
  if (status === 'Bloqueado') return 'bg-cool-gray-200 text-gray-800'
  if (status === 'Rascunho') return 'bg-gray-100 text-gray-800'
  if (status === 'Deletado') return 'bg-red-100 text-red-800'
  return 'bg-green-100 text-green-800'
}

const isCreatingProduct = ref(false)
const createModalOpen = ref(false)
const createModalStep = ref<1 | 2>(1)
const createForm = reactive({
  paymentType: 'charge',
  deliveryType: 'club',
  membersAreaChoice: 'new',
  name: '',
  description: '',
  salesPageUrl: '',
  price: '0,00',
  currency: 'BRL'
})

const openCreateProductModal = () => {
  createModalStep.value = 1
  createModalOpen.value = true
}

const closeCreateProductModal = () => {
  if (isCreatingProduct.value) return
  createModalOpen.value = false
}

const resetCreateProductForm = () => {
  createModalStep.value = 1
  createForm.paymentType = 'charge'
  createForm.deliveryType = 'club'
  createForm.membersAreaChoice = 'new'
  createForm.name = ''
  createForm.description = ''
  createForm.salesPageUrl = ''
  createForm.price = '0,00'
  createForm.currency = 'BRL'
}

const createMembersAreaMode = computed(() => {
  if (createForm.deliveryType !== 'club') return 'external'
  return createForm.membersAreaChoice === 'new' ? 'new' : 'existing'
})

const normalizeCreatePrice = () => {
  if (!createForm.price.trim()) return 'R$ 0,00'
  const numeric = Number(createForm.price.replace(/[^\d,]/g, '').replace(',', '.')) || 0
  return `R$ ${numeric.toFixed(2).replace('.', ',')}`
}

const formatCreatePrice = (event: Event) => {
  const input = event.target as HTMLInputElement
  const digits = input.value.replace(/\D/g, '')
  const cents = Number(digits || '0')
  createForm.price = (cents / 100).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })
}

const createAndOpenProduct = async () => {
  if (isCreatingProduct.value) return
  isCreatingProduct.value = true
  try {
    const product = await createProduct({
      name: createForm.name.trim() || 'Novo produto',
      description: createForm.description.trim(),
      price: normalizeCreatePrice(),
      currency: createForm.currency,
      status: 'Rascunho',
      type: createForm.deliveryType === 'club' ? 'Produto digital' : 'Pagamento',
      paymentType: createForm.paymentType as 'charge' | 'recurring',
      deliveryType: createForm.deliveryType as 'club' | 'external' | 'event' | 'payment',
      membersAreaMode: createMembersAreaMode.value as 'new' | 'existing' | 'external',
      existingMembersAreaId: createMembersAreaMode.value === 'existing' ? createForm.membersAreaChoice : undefined,
      salesPageUrl: createForm.salesPageUrl.trim()
    })
    createModalOpen.value = false
    resetCreateProductForm()
    await navigateTo(productEditUrl(product.id))
  } finally {
    isCreatingProduct.value = false
  }
}

const continueCreateProduct = () => {
  createModalStep.value = 2
}

const backCreateProduct = () => {
  createModalStep.value = 1
}

onMounted(() => {
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeCreateProductModal()
  })
})
</script>

<template>
  <KiwifyChrome>
    <div
      v-if="createModalOpen"
      data-vue-create-product-modal
      class="fixed md:h-auto bottom-0 z-50 inset-x-0 inset-0 flex items-center justify-center z-500"
      @click.self="closeCreateProductModal"
    >
      <div class="fixed inset-0 transition-opacity cursor-pointer">
        <div class="absolute inset-0 bg-gray-500 opacity-75" />
      </div>
      <div role="dialog" aria-modal="true" aria-labelledby="modal-headline" class="bg-white md:rounded-lg sm:h-auto md:shadow-xl transform transition-all sm:max-w-sm w-full z-50">
        <div class="px-4 py-3 bg-gray-50 flex justify-between md:rounded-t-lg">
          <h3 id="modal-headline" class="text-lg leading-6 font-medium text-gray-900">Criar produto</h3>
          <button type="button" aria-label="Close" class="text-gray-400 cursor-pointer hover:text-gray-500 focus:outline-none focus:text-gray-500 transition ease-in-out duration-150" @click="closeCreateProductModal">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" class="h-6 w-6">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div v-if="createModalStep === 1">
          <div class="px-4 py-5 sm:p-6 rounded-lg">
            <div class="w-auto mb-4">
              <label class="block text-sm font-medium leading-5 text-gray-700 mb-1">Tipo de pagamento</label>
              <select v-model="createForm.paymentType" class="form-select shadow-sm block w-full pl-3 pr-10 py-2 text-base leading-6 border-gray-300 focus:outline-none focus:shadow-outline-blue focus:border-blue-300 sm:text-sm sm:leading-5 transition ease-in-out duration-150">
                <option value="charge">Pagamento único</option>
                <option value="recurring">Assinatura recorrente</option>
              </select>
            </div>
            <div class="w-auto mb-4">
              <label class="block text-sm font-medium leading-5 text-gray-700 mb-1">Entrega do conteúdo</label>
              <select v-model="createForm.deliveryType" class="form-select shadow-sm block w-full pl-3 pr-10 py-2 text-base leading-6 border-gray-300 focus:outline-none focus:shadow-outline-blue focus:border-blue-300 sm:text-sm sm:leading-5 transition ease-in-out duration-150">
                <option value="club">Área de membros da Kiwify</option>
                <option value="external">Área de membros externa</option>
                <option value="event">Evento presencial</option>
                <option value="payment">Quero apenas receber pagamentos</option>
              </select>
            </div>
            <div v-if="createForm.deliveryType === 'club'" class="w-auto">
              <label class="block text-sm font-medium leading-5 text-gray-700 mb-1">Área de membros</label>
              <select v-model="createForm.membersAreaChoice" class="form-select shadow-sm block w-full pl-3 pr-10 py-2 text-base leading-6 border-gray-300 focus:outline-none focus:shadow-outline-blue focus:border-blue-300 sm:text-sm sm:leading-5 transition ease-in-out duration-150">
                <option value="new">Criar nova área de membros</option>
                <option v-for="area in membersAreas" :key="area.id" :value="area.id">{{ area.name }}</option>
              </select>
            </div>
            <div class="flex w-full mt-8">
              <button type="button" class="cursor-pointer flex justify-center items-center text-center w-full px-4 py-2 border border-transparent text-base leading-6 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-500 focus:outline-none focus:border-indigo-700 focus:shadow-outline-indigo active:bg-indigo-700 transition ease-in-out duration-150" @click.stop="continueCreateProduct">
                Continuar
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="24px" height="24px" class="ml-1 w-4">
                  <path fill-rule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clip-rule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        <div v-else>
          <div class="px-4 py-5 sm:p-6 rounded-lg">
            <button type="button" class="text-indigo-500 text-sm flex items-center mb-6" @click="backCreateProduct">
              <span class="mr-2">←</span> Voltar
            </button>
            <div class="w-auto mb-4">
              <label class="block text-sm font-medium leading-5 text-gray-700 mb-1">Nome do produto</label>
              <input v-model="createForm.name" type="text" autocomplete="off" data-lpignore="true" class="form-input block py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:shadow-outline-blue focus:border-blue-300 transition duration-150 ease-in-out sm:text-sm sm:leading-5 mask-user-input w-full">
            </div>
            <div class="w-auto mb-4">
              <label class="block text-sm font-medium leading-5 text-gray-700 mb-1">Descrição</label>
              <textarea v-model="createForm.description" placeholder="Explique o seu produto em pelo menos 100 caracteres" rows="3" maxlength="500" class="form-input w-full block py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:shadow-outline-blue focus:border-blue-300 transition duration-150 ease-in-out sm:text-sm sm:leading-5" />
              <div class="text-right text-sm text-gray-500">{{ createForm.description.length }}/500</div>
            </div>
            <div class="w-auto mb-4">
              <label class="block text-sm font-medium leading-5 text-gray-700 mb-1">Página de vendas</label>
              <p class="text-sm leading-5 text-gray-500 mb-2">Se você não tem um site, coloque o seu perfil do Instagram</p>
              <div class="relative rounded-md shadow-sm">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="24px" height="24px" class="w-5 h-5 text-gray-400">
                    <path fill-rule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clip-rule="evenodd" />
                  </svg>
                </div>
                <input v-model="createForm.salesPageUrl" placeholder="https://example.com" class="form-input block w-full pl-10 sm:text-sm sm:leading-5">
              </div>
            </div>
            <div class="w-auto mb-8">
              <label class="block text-sm font-medium leading-5 text-gray-700 mb-1">Preço</label>
              <div class="relative rounded-md shadow-sm">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span class="text-gray-500 sm:text-sm sm:leading-5">R$</span>
                </div>
                <div class="absolute inset-y-0 right-0 pr-3 pl-3 border-l rounded-r-md flex items-center pointer-events-auto">
                  <select v-model="createForm.currency" class="bg-transparent border-none text-gray-500 sm:text-sm sm:leading-5">
                    <option value="BRL">BRL</option>
                    <option value="USD">USD</option>
                  </select>
                </div>
                <input :value="createForm.price" type="tel" inputmode="numeric" class="v-money form-input block border border-gray-300 rounded-md shadow-sm focus:outline-none focus:shadow-outline-blue focus:border-blue-300 transition duration-150 ease-in-out sm:text-sm sm:leading-5 w-full pl-8 pr-20" @input="formatCreatePrice">
              </div>
            </div>
            <button type="button" :disabled="isCreatingProduct" class="cursor-pointer flex justify-center items-center text-center w-full px-4 py-2 border border-transparent text-base leading-6 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-500 focus:outline-none focus:border-indigo-700 focus:shadow-outline-indigo active:bg-indigo-700 transition ease-in-out duration-150" :class="isCreatingProduct ? 'opacity-75 cursor-wait' : ''" @click.stop="createAndOpenProduct">
              {{ isCreatingProduct ? 'Criando...' : 'Criar produto' }}
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="container mx-auto px-4 sm:px-8 py-8 lg:py-10 lg:px-20">
      <div>
        <div class="flex justify-between items-center">
          <h3 class="text-2xl leading-6 font-bold text-gray-900">Produtos</h3>
          <span class="inline-flex rounded-md shadow">
            <button
              type="button"
              :disabled="isCreatingProduct"
              class="cursor-pointer inline-flex items-center px-4 py-2 border border-transparent text-sm leading-5 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-500 focus:outline-none focus:border-indigo-700 focus:shadow-outline-indigo active:bg-indigo-700 transition ease-in-out duration-150"
              :class="isCreatingProduct ? 'opacity-75 cursor-wait' : ''"
              @click.stop="openCreateProductModal"
            >
              Criar produto
            </button>
          </span>
        </div>

        <div class="mt-8">
          <div class="px-4 py-5 sm:p-6 bg-gray-50">
            <div class="hidden sm:block">
              <nav class="-mb-px flex relative">
                <span
                  class="absolute z-0 -mt-0.5 text-indigo-700 bg-indigo-100 rounded-lg ease-out transition-transform transition-medium"
                  style="height: 32px; transform: translateX(0px); width: 0px;"
                />
                <div class="relative flex items-center" style="z-index: 1;">
                  <a
                    href="/products?tab=myproducts"
                    :class="['py-1 font-medium static text-sm leading-5 rounded-md cursor-pointer px-3', activeProductsTab === 'myproducts' ? 'text-indigo-700' : 'hover:text-gray-700 focus:outline-none']"
                  >
                    Meus produtos
                  </a>
                </div>
                <div class="relative flex items-center" style="z-index: 1;">
                  <a
                    href="/products?tab=coproductions"
                    :class="['py-1 font-medium static text-sm leading-5 rounded-md cursor-pointer px-3', activeProductsTab === 'coproductions' ? 'text-indigo-700' : 'hover:text-gray-700 focus:outline-none']"
                  >
                    Minhas co-produções
                  </a>
                </div>
                <div class="relative flex items-center" style="z-index: 1;">
                  <a
                    href="/products?tab=affiliations"
                    :class="['py-1 font-medium static text-sm leading-5 rounded-md cursor-pointer px-3', activeProductsTab === 'affiliations' ? 'text-indigo-700' : 'hover:text-gray-700 focus:outline-none']"
                  >
                    Minhas afiliações
                  </a>
                </div>
              </nav>
            </div>
            <div class="sm:hidden">
              <select
                :value="activeProductsTab"
                class="mt-1 form-select block w-full pl-3 pr-10 py-2 text-base leading-6 border-gray-300 focus:outline-none focus:shadow-outline-blue focus:border-blue-300 sm:text-sm sm:leading-5 transition ease-in-out duration-150"
                @change="selectProductsTab"
              >
                <option value="myproducts">Meus produtos</option>
                <option value="coproductions">Minhas co-produções</option>
                <option value="affiliations">Minhas afiliações</option>
              </select>
            </div>
          </div>
        </div>

        <div>
          <div class="bg-white p-4 flex flex-wrap justify-between">
            <div class="w-full md:w-auto">
              <div class="relative rounded-md shadow-sm">
                <input
                  v-model="searchQuery"
                  placeholder="Buscar...."
                  class="form-input block w-full pr-10 p-2 sm:text-sm sm:leading-5"
                >
                <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="24px" height="24px" class="search h-5 w-5 text-indigo-500">
                    <path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd" />
                  </svg>
                </div>
              </div>
            </div>
            <div>
              <select
                v-model="statusFilter"
                class="form-select shadow-sm block w-full pl-3 pr-10 py-2 text-base leading-6 border-gray-300 focus:outline-none focus:shadow-outline-blue focus:border-blue-300 sm:text-sm sm:leading-5 transition ease-in-out duration-150"
              >
                <option value="all">Todos</option>
                <option value="active">Ativo</option>
                <option value="under_review">Em análise</option>
                <option value="rejected">Recusado</option>
                <option value="draft">Rascunho</option>
                <option value="disabled">Deletado</option>
              </select>
            </div>
          </div>

          <div class="w-full">
            <div class="flex flex-col">
              <div class="overflow-x-auto md:overflow-visible">
                <div class="align-middle inline-block min-w-full">
                  <table class="kiwi-table min-w-full divide-y divide-gray-200">
                    <thead>
                      <tr>
                        <th class="text-left px-6 py-3 border-b border-gray-200 bg-gray-50 text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                        <th class="text-left px-6 py-3 border-b border-gray-200 bg-gray-50 text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">Preço</th>
                        <th class="text-left px-6 py-3 border-b border-gray-200 bg-gray-50 text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">Status</th>
                        <th class="text-left px-6 py-3 border-b border-gray-200 bg-gray-50 text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider" />
                      </tr>
                    </thead>
                    <tbody class="bg-white divide-y divide-gray-200">
                      <tr v-for="(product, index) in filteredProducts" :key="product.id" :class="rowClass(index)">
                        <td>
                          <a :href="productEditUrl(product.id)" class="hover:underline font-medium truncate text-sm max-w-sm block">
                            {{ product.name }}
                          </a>
                        </td>
                        <td>
                          <span class="text-sm leading-5 text-gray-500">{{ product.price }}</span>
                        </td>
                        <td>
                          <div>
                            <span :class="['inline-flex items-center rounded-full transition-colors linear duration-200 font-medium leading-4 text-xs py-0.5 px-2.5', statusBadgeClass(product.status)]">
                              {{ product.status }}
                            </span>
                          </div>
                        </td>
                        <td>
                          <div class="flex justify-center mr-2">
                            <div class="relative inline-block">
                              <div slot="reference">
                                <span class="rounded-md block shadow-sm relative dropdown-trigger">
                                  <button id="options-menu" class="inline-flex justify-center w-full rounded-md border border-gray-300 p-2 bg-white text-sm leading-5 font-medium text-gray-700 hover:text-gray-500 focus:outline-none focus:shadow-outline-indigo active:bg-gray-50 active:text-gray-800 transition ease-in-out duration-150">
                                    <svg fill="currentColor" viewBox="0 0 20 20" class="h-5 w-5">
                                      <path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z" />
                                    </svg>
                                  </button>
                                </span>
                              </div>
                              <div class="dropdown z-50" style="display: none;">
                                <div class="min-w-scale z-50 rounded-md shadow-lg" style="display: none;">
                                  <div class="rounded-md bg-white shadow-xs">
                                    <div class="py-1 cursor-pointer">
                                      <a :href="productEditUrl(product.id, 'links')" role="menuitem" class="group flex cursor-pointer items-center px-4 py-2 gap-x-3 text-sm leading-5 text-gray-700 hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:bg-gray-100 focus:text-gray-900">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="24px" height="24px" class="h-5 w-5 text-gray-400 group-hover:text-gray-500 group-focus:text-gray-500" style="min-width: 20px; min-height: 20px;">
                                          <path fill-rule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clip-rule="evenodd" />
                                        </svg>
                                        <span>Ver links</span>
                                      </a>
                                      <a :href="productEditUrl(product.id)" role="menuitem" class="group flex cursor-pointer items-center px-4 py-2 gap-x-3 text-sm leading-5 text-gray-700 hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:bg-gray-100 focus:text-gray-900">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="24px" height="24px" class="h-5 w-5 text-gray-400 group-hover:text-gray-500 group-focus:text-gray-500" style="min-width: 20px; min-height: 20px;">
                                          <path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" />
                                          <path fill-rule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clip-rule="evenodd" />
                                        </svg>
                                        <span>Editar</span>
                                      </a>
                                    </div>
                                    <div class="border-t border-gray-100" />
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </td>
                      </tr>
                      <tr v-if="!filteredProducts.length" class="bg-white">
                        <td colspan="4" class="px-6 py-8 text-sm leading-5 text-gray-500 text-center">
                          Nenhum produto encontrado
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            <div class="w-full">
              <div class="bg-white flex items-center justify-between border-t border-gray-200 px-4 py-3 sm:px-6">
                <div class="flex-1 flex items-center justify-between sm:hidden">
                  <div class="relative inline-flex cursor-pointer items-center px-4 py-2 border border-gray-300 text-sm leading-5 font-medium rounded-md text-gray-700 bg-white hover:text-gray-500 focus:outline-none focus:shadow-outline-blue focus:border-blue-300 active:bg-gray-100 active:text-gray-700 transition ease-in-out duration-150">Anterior</div>
                  <div class="px-2">
                    <p class="text-sm leading-5 text-gray-700">
                      <span class="font-medium">1</span> / <span class="font-medium"> {{ visiblePageCount }}</span> páginas
                    </p>
                  </div>
                  <div class="ml-3 relative inline-flex cursor-pointer items-center px-4 py-2 border border-gray-300 text-sm leading-5 font-medium rounded-md text-gray-700 bg-white hover:text-gray-500 focus:outline-none focus:shadow-outline-blue focus:border-blue-300 active:bg-gray-100 active:text-gray-700 transition ease-in-out duration-150">Próximo</div>
                </div>
                <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p class="text-sm leading-5 text-gray-700">
                      Exibindo
                      <span class="font-medium">1</span>
                      de
                      <span class="font-medium"> {{ visiblePageCount }}</span>
                      páginas
                    </p>
                  </div>
                  <div>
                    <nav class="relative z-0 inline-flex shadow-sm">
                      <button aria-label="Previous" class="relative cursor-pointer inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm leading-5 font-medium text-gray-500 hover:text-gray-400 focus:z-10 focus:outline-none focus:border-blue-300 focus:shadow-outline-blue active:bg-gray-100 active:text-gray-500 transition ease-in-out duration-150">
                        <svg viewBox="0 0 20 20" fill="currentColor" class="h-5 w-5">
                          <path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd" />
                        </svg>
                      </button>
                      <span
                        v-for="page in visiblePageCount"
                        :key="page"
                        :class="['-ml-px cursor-pointer relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm leading-5 font-medium text-gray-700 hover:text-gray-500 focus:z-10 focus:outline-none focus:border-blue-300 focus:shadow-outline-blue active:bg-gray-100 active:text-gray-700 transition ease-in-out duration-150', page === 1 ? 'bg-gray-200' : 'bg-white']"
                      >
                        {{ page }}
                      </span>
                      <button aria-label="Next" class="-ml-px relative cursor-pointer inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm leading-5 font-medium text-gray-500 hover:text-gray-400 focus:z-10 focus:outline-none focus:border-blue-300 focus:shadow-outline-blue active:bg-gray-100 active:text-gray-500 transition ease-in-out duration-150">
                        <svg viewBox="0 0 20 20" fill="currentColor" class="h-5 w-5">
                          <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd" />
                        </svg>
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            </div>

            <div class="py-4 flex justify-center">
              <div class="flex">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="24px" height="24px" class="text-indigo-500">
                  <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
                </svg>
                <div class="ml-1 help">
                  Aprenda mais sobre os
                  <a href="https://ajuda.kiwify.com.br/pt-br/article/como-cadastrar-o-seu-produto-1lxh5g7/" target="_blank">produtos</a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </KiwifyChrome>
</template>
