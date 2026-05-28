<script setup lang="ts">
import type { Offer } from '~/data/offers'
import { checkoutSettingsFromProductSettings, paymentMethodsFromSetting } from '~/services/productsService'

const route = useRoute()
const { getProductById } = useProducts()
const productId = computed(() => String(route.params.id || 'ae3c3610-f0af-11f0-b85d-45218e98c266'))
const product = computed(() => getProductById(productId.value))
const { offers, createOffer, updateOffer, deleteOffer, duplicateOffer } = useOffers(productId)
const searchQuery = ref('')
const selectedLinks = ref<string[]>([])
const openMenuId = ref<string | null>(null)
const appOrigin = ref('')
const showOfferPanel = ref(false)
const editingOfferId = ref<string | null>(null)
const offerDraft = reactive({
  name: '',
  price: '',
  currency: 'BRL',
  status: 'Ativo' as 'Ativo' | 'Desativado'
})

const checkoutLinks = computed(() => {
  const firstOfferUrl = offers.value[0]?.publicUrl || `/checkout/${productId.value}-default-offer`
  const defaultCheckoutName = product.value?.name || 'Oferta principal'

  return [
    {
      id: `${productId.value}-sales-page`,
      name: 'Sales Page',
      url: firstOfferUrl,
      type: 'Página' as const,
      price: '',
      status: 'Desativado' as const
    },
    ...offers.value.map((offer) => ({
      id: offer.id,
      name: offer.isDefault ? defaultCheckoutName : (offer.label || offer.name),
      url: offer.publicUrl,
      type: 'Checkout' as const,
      price: offer.price,
      status: offer.status,
      offer
    }))
  ]
})

const projectPath = (url: string) => {
  try {
    const parsedUrl = new URL(url, appOrigin.value || 'http://localhost:3000')
    return `${parsedUrl.pathname}${parsedUrl.search}${parsedUrl.hash}`
  } catch {
    return url.startsWith('/') ? url : `/${url}`
  }
}

const fullPublicUrl = (url: string) => {
  const origin = appOrigin.value || 'http://localhost:3000'
  return `${origin}${projectPath(url)}`
}

const filteredLinks = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  if (!query) return checkoutLinks.value
  return checkoutLinks.value.filter((link) => {
    return [link.name, link.url, link.type, link.price, link.status].some((value) => String(value || '').toLowerCase().includes(query))
  })
})

const allFilteredSelected = computed(() => {
  return Boolean(filteredLinks.value.length) && filteredLinks.value.every((link) => selectedLinks.value.includes(link.id))
})

const toggleAllFiltered = () => {
  if (allFilteredSelected.value) {
    selectedLinks.value = selectedLinks.value.filter((id) => !filteredLinks.value.some((link) => link.id === id))
    return
  }

  selectedLinks.value = Array.from(new Set([...selectedLinks.value, ...filteredLinks.value.map((link) => link.id)]))
}

const toggleLink = (id: string) => {
  if (selectedLinks.value.includes(id)) {
    selectedLinks.value = selectedLinks.value.filter((selectedId) => selectedId !== id)
    return
  }

  selectedLinks.value = [...selectedLinks.value, id]
}

const setSelectedStatus = async (status: 'Ativo' | 'Desativado') => {
  await Promise.all(selectedLinks.value
    .filter((id) => !id.endsWith('-sales-page'))
    .map((id) => updateOffer(id, { status })))
}

const openCreatePanel = () => {
  editingOfferId.value = null
  offerDraft.name = 'Oferta principal'
  offerDraft.price = product.value?.price || 'R$ 0,00'
  offerDraft.currency = product.value?.currency || 'BRL'
  offerDraft.status = 'Ativo'
  showOfferPanel.value = true
}

const openEditPanel = (offer: Offer) => {
  editingOfferId.value = offer.id
  offerDraft.name = offer.name
  offerDraft.price = offer.price
  offerDraft.currency = offer.currency
  offerDraft.status = offer.status
  showOfferPanel.value = true
  openMenuId.value = null
}

const closeOfferPanel = () => {
  showOfferPanel.value = false
  editingOfferId.value = null
}

const saveOffer = async () => {
  const name = offerDraft.name.trim() || 'Oferta principal'
  if (editingOfferId.value) {
    await updateOffer(editingOfferId.value, {
      productId: productId.value,
      name,
      price: offerDraft.price,
      currency: offerDraft.currency,
      status: offerDraft.status,
      label: name
    })
  } else {
    await createOffer({
      productId: productId.value,
      name,
      price: offerDraft.price,
      currency: offerDraft.currency,
      status: offerDraft.status,
      label: name,
      paymentMethods: product.value?.settings?.paymentMethods?.length
        ? product.value.settings.paymentMethods
        : paymentMethodsFromSetting(product.value?.settings?.paymentMethod),
      settings: checkoutSettingsFromProductSettings(product.value?.settings)
    })
  }
  closeOfferPanel()
}

const removeOffer = async (id: string) => {
  await deleteOffer(id)
  selectedLinks.value = selectedLinks.value.filter((selectedId) => selectedId !== id)
  openMenuId.value = null
}

const cloneOffer = async (id: string) => {
  await duplicateOffer(id)
  openMenuId.value = null
}

const copyPublicUrl = async (url: string) => {
  if (typeof navigator !== 'undefined' && navigator.clipboard) {
    await navigator.clipboard.writeText(fullPublicUrl(url))
  }
  openMenuId.value = null
}

const copyUrlFromField = async (url: string, event: Event) => {
  const target = event.target as HTMLInputElement | null
  target?.select()
  await copyPublicUrl(url)
}

const viewCheckout = (url: string) => {
  if (typeof window !== 'undefined') {
    window.open(url, '_blank')
  }
  openMenuId.value = null
}

const badgeClass = (type: string) => {
  return type === 'Página'
    ? 'px-2 bg-green-100 text-green-800 inline-flex text-xs leading-5 font-semibold rounded-full capitalize'
    : 'px-2 bg-indigo-100 text-indigo-800 inline-flex text-xs leading-5 font-semibold rounded-full capitalize'
}

const statusClass = (status: string) => {
  return status === 'Ativo'
    ? 'inline-flex items-center rounded-full transition-colors linear duration-200 font-medium leading-4 text-xs py-0.5 px-2.5 bg-green-100 text-green-800'
    : 'inline-flex items-center rounded-full transition-colors linear duration-200 font-medium leading-4 text-xs py-0.5 px-2.5 bg-gray-200 text-gray-700'
}

onMounted(() => {
  appOrigin.value = window.location.origin
})
</script>

<template>
  <div id="links">
    <div>
      <div class="flex justify-between flex-wrap p-4 bg-white">
        <div class="w-full md:w-auto">
          <div class="relative rounded-md shadow-sm">
            <input v-model="searchQuery" placeholder="Buscar...." class="form-input block w-full pr-10 p-2 sm:text-sm sm:leading-5">
            <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="24px" height="24px" class="search h-5 w-5 text-indigo-500"><path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd"></path></svg>
            </div>
          </div>
        </div>

        <div class="mt-3 sm:mt-0 justify-end items-center flex w-full sm:w-1/2">
          <div>
            <div class="relative inline-block">
              <div slot="reference">
                <span class="rounded-md block shadow-sm relative dropdown-trigger">
                  <button id="options-menu" class="focus:outline-none" @click.stop="openMenuId = openMenuId === '__bulk' ? null : '__bulk'">
                    <span class="inline-flex rounded-md shadow-sm mr-3">
                      <button class="inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:text-gray-500 focus:outline-none focus:border-blue-300 focus:shadow-outline-blue active:text-gray-800 active:bg-gray-50 transition ease-in-out duration-150">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="24px" height="24px" class="-ml-1 mr-3 h-5 w-5 text-black"><path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"></path></svg>
                        Ações
                      </button>
                    </span>
                  </button>
                </span>
              </div>
              <div class="dropdown z-50" :style="{ display: openMenuId === '__bulk' ? 'block' : 'none' }">
                <div class="min-w-scale z-50 rounded-md shadow-lg" :style="{ display: openMenuId === '__bulk' ? 'block' : 'none' }">
                  <div class="rounded-md bg-white shadow-xs">
                    <div class="py-1 cursor-pointer">
                      <div role="menuitem" class="group flex cursor-pointer items-center px-4 py-2 gap-x-3 text-sm leading-5 text-gray-700 hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:bg-gray-100 focus:text-gray-900" @click="setSelectedStatus('Ativo')">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="24px" height="24px" class="h-5 w-5 text-gray-400 group-hover:text-gray-500 group-focus:text-gray-500" style="min-width: 20px; min-height: 20px;"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path></svg>
                        <div class="flex items-center justify-between w-full"><span>Ativar</span></div>
                      </div>
                      <div role="menuitem" class="group flex cursor-pointer items-center px-4 py-2 gap-x-3 text-sm leading-5 text-gray-700 hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:bg-gray-100 focus:text-gray-900" @click="setSelectedStatus('Desativado')">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="24px" height="24px" class="h-5 w-5 text-gray-400 group-hover:text-gray-500 group-focus:text-gray-500" style="min-width: 20px; min-height: 20px;"><path fill-rule="evenodd" d="M13.477 14.89A6 6 0 015.11 6.524l8.367 8.368zm1.414-1.414L6.524 5.11a6 6 0 018.367 8.367zM18 10a8 8 0 11-16 0 8 8 0 0116 0z" clip-rule="evenodd"></path></svg>
                        <div class="flex items-center justify-between w-full"><span>Desabilitar</span></div>
                      </div>
                    </div>
                    <div class="border-t border-gray-100"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <button type="button" class="cursor-pointer inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-500 focus:outline-none focus:border-indigo-700 focus:shadow-outline-indigo active:bg-indigo-700 transition ease-in-out duration-150" @click="openCreatePanel">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="24px" height="24px" class="-ml-1 mr-3 h-5 w-5 text-white"><path fill-rule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clip-rule="evenodd"></path></svg>
            Adicionar link
          </button>
        </div>
      </div>

      <div class="w-full">
        <div class="flex flex-col">
          <div class="overflow-x-auto md:overflow-visible">
            <div class="align-middle inline-block min-w-full">
              <table class="kiwi-table min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th width="5%" class="text-left px-6 py-3 border-b border-gray-200 bg-gray-50 text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">
                      <section class="flex items-center h-7"><input type="checkbox" :checked="allFilteredSelected" class="form-checkbox h-5 w-5 text-indigo-600 transition duration-150 ease-in-out" @change="toggleAllFiltered"></section>
                    </th>
                    <th class="text-left px-6 py-3 border-b border-gray-200 bg-gray-50 text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">Nome do link</th>
                    <th class="text-left px-6 py-3 border-b border-gray-200 bg-gray-50 text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">URL Kiwify</th>
                    <th class="text-left px-6 py-3 border-b border-gray-200 bg-gray-50 text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                    <th class="text-left px-6 py-3 border-b border-gray-200 bg-gray-50 text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">Preço</th>
                    <th class="text-left px-6 py-3 border-b border-gray-200 bg-gray-50 text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th class="text-left px-6 py-3 border-b border-gray-200 bg-gray-50 text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider"></th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                  <tr v-for="(link, index) in filteredLinks" :key="link.id" :class="index % 2 ? 'bg-gray-50' : 'bg-white'">
                    <td>
                      <section class="flex items-center h-7"><input type="checkbox" :checked="selectedLinks.includes(link.id)" class="form-checkbox h-5 w-5 text-indigo-600 transition duration-150 ease-in-out" @change="toggleLink(link.id)"></section>
                    </td>
                    <td><div class="text-sm leading-5 font-medium text-gray-900">{{ link.name }}</div></td>
                    <td style="max-width: 20rem !important;">
                      <input :value="fullPublicUrl(link.url)" readonly="readonly" title="Clique para copiar" class="form-input block w-full py-2 px-3 text-xs border border-gray-300 rounded-md shadow-sm focus:outline-none focus:shadow-outline-blue focus:border-blue-300 transition duration-150 ease-in-out sm:text-sm sm:leading-5 cursor-pointer" style="min-width: 12rem;" @click="copyUrlFromField(link.url, $event)">
                    </td>
                    <td><div><span :class="badgeClass(link.type)">{{ link.type }}</span></div></td>
                    <td><div class="text-sm leading-5 text-gray-500">{{ link.price }}</div></td>
                    <td><div class="flex"><div class="inline-flex"><span :class="statusClass(link.status)">{{ link.status }}</span></div></div></td>
                    <td>
                      <div class="flex justify-end mr-2">
                        <div class="relative inline-block">
                          <div slot="reference">
                            <span class="rounded-md block shadow-sm relative dropdown-trigger">
                              <button id="options-menu" class="inline-flex justify-center w-full rounded-md border border-gray-300 p-2 bg-white text-sm leading-5 font-medium text-gray-700 hover:text-gray-500 focus:outline-none focus:shadow-outline-indigo active:bg-gray-50 active:text-gray-800 transition ease-in-out duration-150" @click.stop="openMenuId = openMenuId === link.id ? null : link.id">
                                <svg fill="currentColor" viewBox="0 0 20 20" class="h-5 w-5"><path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"></path></svg>
                              </button>
                            </span>
                          </div>
                          <div class="dropdown z-50" :style="{ display: openMenuId === link.id ? 'block' : 'none' }">
                            <div class="min-w-scale z-50 rounded-md shadow-lg" :style="{ display: openMenuId === link.id ? 'block' : 'none' }">
                              <div class="rounded-md bg-white shadow-xs">
                                <div class="py-1 cursor-pointer">
                                  <div role="menuitem" class="group flex cursor-pointer items-center px-4 py-2 gap-x-3 text-sm leading-5 text-gray-700 hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:bg-gray-100 focus:text-gray-900" @click="copyPublicUrl(link.url)">
                                    <span>Copiar link</span>
                                  </div>
                                  <div v-if="link.type === 'Checkout'" role="menuitem" class="group flex cursor-pointer items-center px-4 py-2 gap-x-3 text-sm leading-5 text-gray-700 hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:bg-gray-100 focus:text-gray-900" @click="viewCheckout(link.url)">
                                    <span>Ver checkout</span>
                                  </div>
                                  <div v-if="link.offer" role="menuitem" class="group flex cursor-pointer items-center px-4 py-2 gap-x-3 text-sm leading-5 text-gray-700 hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:bg-gray-100 focus:text-gray-900" @click="openEditPanel(link.offer)">
                                    <span>Editar oferta</span>
                                  </div>
                                  <div v-if="link.offer" role="menuitem" class="group flex cursor-pointer items-center px-4 py-2 gap-x-3 text-sm leading-5 text-gray-700 hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:bg-gray-100 focus:text-gray-900" @click="cloneOffer(link.id)">
                                    <span>Duplicar oferta</span>
                                  </div>
                                  <div v-if="link.offer" role="menuitem" class="group flex cursor-pointer items-center px-4 py-2 gap-x-3 text-sm leading-5 text-gray-700 hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:bg-gray-100 focus:text-gray-900" @click="updateOffer(link.id, { status: link.status === 'Ativo' ? 'Desativado' : 'Ativo' }); openMenuId = null">
                                    <span>{{ link.status === 'Ativo' ? 'Desabilitar' : 'Ativar' }}</span>
                                  </div>
                                  <div v-if="link.offer" role="menuitem" class="group flex cursor-pointer items-center px-4 py-2 gap-x-3 text-sm leading-5 text-red-600 hover:bg-gray-100 focus:outline-none focus:bg-gray-100" @click="removeOffer(link.id)">
                                    <span>Excluir oferta</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                  <tr v-if="!filteredLinks.length">
                    <td colspan="7" class="text-gray-400 w-full text-center">
                      <div class="p-10">Você precisa primeiro <span class="text-indigo-500 underline">cadastrar um lote</span> para gerar os links de checkout</div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div class="w-full">
          <div class="bg-white flex items-center justify-between border-t border-gray-200 px-4 py-3 sm:px-6">
            <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p class="text-sm leading-5 text-gray-700">Exibindo <span class="font-medium">1</span> de <span class="font-medium"> 1</span> página</p>
              </div>
              <div>
                <nav class="relative z-0 inline-flex shadow-sm">
                  <button aria-label="Previous" class="relative cursor-pointer inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm leading-5 font-medium text-gray-500 hover:text-gray-400 focus:z-10 focus:outline-none focus:border-blue-300 focus:shadow-outline-blue active:bg-gray-100 active:text-gray-500 transition ease-in-out duration-150"><svg viewBox="0 0 20 20" fill="currentColor" class="h-5 w-5"><path fill-rule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clip-rule="evenodd"></path></svg></button>
                  <span class="-ml-px cursor-pointer relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm leading-5 font-medium text-gray-700 hover:text-gray-500 focus:z-10 focus:outline-none focus:border-blue-300 focus:shadow-outline-blue active:bg-gray-100 active:text-gray-700 transition ease-in-out duration-150 bg-gray-200">1</span>
                  <button aria-label="Next" class="-ml-px relative cursor-pointer inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm leading-5 font-medium text-gray-500 hover:text-gray-400 focus:z-10 focus:outline-none focus:border-blue-300 focus:shadow-outline-blue active:bg-gray-100 active:text-gray-500 transition ease-in-out duration-150"><svg viewBox="0 0 20 20" fill="currentColor" class="h-5 w-5"><path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd"></path></svg></button>
                </nav>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="py-4 flex justify-center">
        <div class="flex">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="24px" height="24px" class="text-indigo-500"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path></svg>
          <div class="ml-1">Aprenda mais sobre os <a target="_blank" href="https://ajuda.kiwify.com.br/pt-br/article/como-pegar-o-link-de-checkout-do-meu-produto-a4ufaa/" class="text-indigo-500 underline">links</a></div>
        </div>
      </div>

      <div v-if="showOfferPanel" class="fixed inset-0 z-50 overflow-y-auto">
        <div class="fixed inset-0 bg-gray-900 bg-opacity-40" @click="closeOfferPanel"></div>
        <div class="relative min-h-screen flex items-center justify-center p-4">
          <div class="relative bg-white rounded-lg shadow-xl w-full max-w-lg">
            <div class="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 class="text-lg leading-6 font-medium text-gray-900">{{ editingOfferId ? 'Editar oferta' : 'Adicionar link' }}</h3>
              <button type="button" class="text-gray-400 hover:text-gray-500" @click="closeOfferPanel">
                <svg viewBox="0 0 20 20" fill="currentColor" class="h-5 w-5"><path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"></path></svg>
              </button>
            </div>
            <div class="px-6 py-5 space-y-4">
              <div>
                <label class="block text-sm font-medium leading-5 text-gray-700">Nome do link</label>
                <input v-model="offerDraft.name" class="mt-1 form-input block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:shadow-outline-blue focus:border-blue-300 transition duration-150 ease-in-out sm:text-sm sm:leading-5">
              </div>
              <div>
                <label class="block text-sm font-medium leading-5 text-gray-700">Preço</label>
                <div class="mt-1 flex rounded-md shadow-sm">
                  <input v-model="offerDraft.price" class="form-input block w-full py-2 px-3 border border-gray-300 rounded-l-md focus:outline-none focus:shadow-outline-blue focus:border-blue-300 transition duration-150 ease-in-out sm:text-sm sm:leading-5">
                  <select v-model="offerDraft.currency" class="form-select py-2 px-3 border border-l-0 border-gray-300 rounded-r-md bg-white text-gray-700 sm:text-sm">
                    <option>BRL</option>
                    <option>USD</option>
                    <option>EUR</option>
                  </select>
                </div>
              </div>
              <div>
                <label class="block text-sm font-medium leading-5 text-gray-700">Status</label>
                <select v-model="offerDraft.status" class="mt-1 form-select block w-full py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm sm:text-sm">
                  <option>Ativo</option>
                  <option>Desativado</option>
                </select>
              </div>
            </div>
            <div class="px-6 py-4 bg-gray-50 flex justify-end gap-3 rounded-b-lg">
              <button type="button" class="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm leading-5 font-medium rounded-md text-gray-700 bg-white hover:text-gray-500 focus:outline-none" @click="closeOfferPanel">Cancelar</button>
              <button type="button" class="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm leading-5 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-500 focus:outline-none" @click="saveOffer">Salvar</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
