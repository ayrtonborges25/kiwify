<script setup lang="ts">
import type { Offer } from '~/data/offers'
import { listOffersByProduct } from '~/services/offersService'

const route = useRoute()
const productId = computed(() => String(route.params.id || 'ae3c3610-f0af-11f0-b85d-45218e98c266'))
const { products, updateProduct } = useProducts()

type PixelRow = {
  id: string
  pixelId: string
  domain: string
}

type CouponRow = {
  id: string
  code: string
  discount: string
  status: 'Ativo' | 'Desativado'
}

type OrderBumpRow = {
  id: string
  order: number
  product: string
  offer: string
}

const createId = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`

const thankYouEnabled = ref(false)
const thankYouUrl = ref('')
const purchasePixEnabled = ref(false)
const purchaseBoletoEnabled = ref(false)
const couponsEnabled = ref(false)
const showOrderBumpModal = ref(false)
const showUpsellModal = ref(false)
const hydratingThankYou = ref(false)
const thankYouDirty = ref(false)
const hydratedProductId = ref('')
let thankYouPersistTimer: ReturnType<typeof setTimeout> | undefined
const upsellOffers = ref<Offer[]>([])
const upsellCopied = ref(false)

const pixels = ref<PixelRow[]>([
  {
    id: 'facebook-pixel-1',
    pixelId: '',
    domain: 'figurinhasdacopa.com'
  }
])

const coupons = ref<CouponRow[]>([])
const orderBumps = ref<OrderBumpRow[]>([])
const orderBumpDraft = reactive({
  product: '',
  offer: '',
  cta: '',
  title: '',
  description: ''
})

const availableProducts = computed(() => products.value.filter((product) => product.id !== productId.value))
const currentProduct = computed(() => products.value.find((product) => product.id === productId.value))
const upsellDraft = reactive({
  productId: '',
  offerId: '',
  acceptAction: 'offer',
  declineAction: 'members_area',
  acceptText: 'Sim, eu aceito essa oferta especial!',
  declineText: 'Não, eu gostaria de recusar essa oferta',
  color: '#2ECC70'
})
const selectedProductName = computed(() => {
  if (orderBumpDraft.product) return orderBumpDraft.product
  return availableProducts.value[0]?.name || 'Selecione o produto'
})
const selectedUpsellOffer = computed(() => upsellOffers.value.find((offer) => offer.id === upsellDraft.offerId))
const generatedUpsellHtml = computed(() => {
  const upsellUrl = upsellDraft.acceptAction === 'offer' && upsellDraft.offerId ? `/checkout/${upsellDraft.offerId}` : ''
  const downsellUrl = upsellDraft.declineAction === 'offer' && upsellDraft.offerId ? `/checkout/${upsellDraft.offerId}` : ''
  return `<div style="text-align:center" id="kiwify-upsell-${productId.value}" data-upsell-url="${upsellUrl}" data-downsell-url="${downsellUrl}">
          <button id="kiwify-upsell-trigger-${productId.value}" style="background-color:${upsellDraft.color};padding:12px 16px;cursor:pointer;color:#FFFFFF;font-weight:600;border-radius:4px;border:1px solid ${upsellDraft.color};font-size:20px;">${upsellDraft.acceptText}</button>
          <div id="kiwify-upsell-cancel-trigger-${productId.value}" style="margin-top:1rem;cursor:pointer;font-size:16px;text-decoration:underline;font-family:sans-serif;">${upsellDraft.declineText}</div>
        </div><script src="https://snippets.kiwify.com/upsell/upsell.min.js"><\\/script>`
})

const switchRootClass = (enabled: boolean) => [
  'relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none',
  enabled ? 'bg-indigo-500' : 'bg-gray-200'
]

const switchMarkClass = (enabled: boolean) => [
  'inline-block h-5 w-5 rounded-full bg-white shadow transform transition ease-in-out duration-200',
  enabled ? 'translate-x-5' : 'translate-x-0'
]

const addPixel = () => {
  if (pixels.value.length >= 50) return
  pixels.value.push({
    id: createId('pixel'),
    pixelId: '',
    domain: 'figurinhasdacopa.com'
  })
}

const removePixel = (id: string) => {
  if (pixels.value.length === 1) return
  pixels.value = pixels.value.filter((pixel) => pixel.id !== id)
}

const addCoupon = () => {
  couponsEnabled.value = true
  coupons.value.push({
    id: createId('coupon'),
    code: `CUPOM${String(coupons.value.length + 1).padStart(2, '0')}`,
    discount: '10%',
    status: 'Ativo'
  })
}

const removeCoupon = (id: string) => {
  coupons.value = coupons.value.filter((coupon) => coupon.id !== id)
}

const openOrderBumpModal = () => {
  const firstProduct = availableProducts.value[0]
  orderBumpDraft.product = firstProduct?.name || ''
  orderBumpDraft.offer = 'Oferta principal'
  orderBumpDraft.cta = 'Sim, eu aceito essa oferta especial!'
  orderBumpDraft.title = firstProduct?.name || ''
  orderBumpDraft.description = ''
  showOrderBumpModal.value = true
}

const hydrateUpsellDraft = async () => {
  const settings = currentProduct.value?.settings?.upsellSettings || {}
  upsellDraft.productId = settings.productId || availableProducts.value[0]?.id || ''
  upsellDraft.offerId = settings.offerId || ''
  upsellDraft.acceptAction = settings.acceptAction || 'offer'
  upsellDraft.declineAction = settings.declineAction || 'members_area'
  upsellDraft.acceptText = settings.acceptText || 'Sim, eu aceito essa oferta especial!'
  upsellDraft.declineText = settings.declineText || 'Não, eu gostaria de recusar essa oferta'
  upsellDraft.color = settings.color || '#2ECC70'
  if (upsellDraft.productId) {
    upsellOffers.value = await listOffersByProduct(upsellDraft.productId)
    if (!upsellDraft.offerId) upsellDraft.offerId = upsellOffers.value[0]?.id || ''
  }
}

const openUpsellModal = async () => {
  await hydrateUpsellDraft()
  upsellCopied.value = false
  showUpsellModal.value = true
}

const closeUpsellModal = () => {
  showUpsellModal.value = false
}

const saveUpsellSettings = async () => {
  thankYouEnabled.value = true
  await updateProduct(productId.value, {
    settings: {
      ...(currentProduct.value?.settings || {}),
      thankYouEnabled: true,
      thankYouUrl: thankYouUrl.value.trim(),
      upsellSettings: {
        enabled: true,
        productId: upsellDraft.productId,
        offerId: upsellDraft.offerId,
        offerUrl: selectedUpsellOffer.value?.publicUrl || (upsellDraft.offerId ? `/checkout/${upsellDraft.offerId}` : ''),
        acceptAction: upsellDraft.acceptAction,
        declineAction: upsellDraft.declineAction,
        acceptText: upsellDraft.acceptText,
        declineText: upsellDraft.declineText,
        color: upsellDraft.color
      }
    }
  })
}

const copyUpsellHtml = async () => {
  await saveUpsellSettings()
  await navigator.clipboard?.writeText(generatedUpsellHtml.value)
  upsellCopied.value = true
}

const closeOrderBumpModal = () => {
  showOrderBumpModal.value = false
}

const addOrderBump = () => {
  if (orderBumps.value.length >= 5) return
  orderBumps.value.push({
    id: createId('order-bump'),
    order: orderBumps.value.length + 1,
    product: orderBumpDraft.product || selectedProductName.value,
    offer: orderBumpDraft.offer || 'Oferta principal'
  })
  closeOrderBumpModal()
}

const removeOrderBump = (id: string) => {
  orderBumps.value = orderBumps.value
    .filter((bump) => bump.id !== id)
    .map((bump, index) => ({ ...bump, order: index + 1 }))
}

const onModalKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    closeOrderBumpModal()
    closeUpsellModal()
  }
}

watch(currentProduct, (product) => {
  if (thankYouDirty.value && hydratedProductId.value === productId.value) {
    const nextEnabled = Boolean(product?.settings?.thankYouEnabled)
    const nextUrl = product?.settings?.thankYouUrl || ''
    if (nextEnabled === thankYouEnabled.value && nextUrl === thankYouUrl.value) {
      thankYouDirty.value = false
    }
    return
  }

  hydratingThankYou.value = true
  hydratedProductId.value = productId.value
  thankYouEnabled.value = Boolean(product?.settings?.thankYouEnabled)
  thankYouUrl.value = product?.settings?.thankYouUrl || ''
  nextTick(() => {
    hydratingThankYou.value = false
  })
}, { immediate: true })

const persistThankYouSettings = () => {
  if (hydratingThankYou.value || !productId.value) return
  thankYouDirty.value = true
  if (thankYouPersistTimer) clearTimeout(thankYouPersistTimer)
  thankYouPersistTimer = setTimeout(async () => {
    const saved = await updateProduct(productId.value, {
      settings: {
        ...(currentProduct.value?.settings || {}),
        thankYouEnabled: thankYouEnabled.value,
        thankYouUrl: thankYouUrl.value.trim()
      }
    })
    const savedSettings = saved?.settings
    if (
      Boolean(savedSettings?.thankYouEnabled) === thankYouEnabled.value &&
      (savedSettings?.thankYouUrl || '') === thankYouUrl.value.trim()
    ) {
      thankYouDirty.value = false
    }
  }, 500)
}

const toggleThankYou = () => {
  thankYouEnabled.value = !thankYouEnabled.value
}

watch([thankYouEnabled, thankYouUrl], persistThankYouSettings)

watch(() => upsellDraft.productId, async (id) => {
  if (!id || !showUpsellModal.value) return
  upsellOffers.value = await listOffersByProduct(id)
  if (!upsellOffers.value.some((offer) => offer.id === upsellDraft.offerId)) {
    upsellDraft.offerId = upsellOffers.value[0]?.id || ''
  }
})

onBeforeUnmount(() => {
  if (thankYouPersistTimer) clearTimeout(thankYouPersistTimer)
})
</script>

<template>
  <div id="settings-checkout-extras">
    <div class="mt-10">
      <div class="md:grid md:grid-cols-3 md:gap-6">
        <div class="md:col-span-1">
          <h3 class="text-lg font-medium leading-6 text-gray-900">Página de obrigado e upsell</h3>
          <p class="mt-1 desc text-sm leading-5 text-gray-500">Aprenda sobre as <a href="https://ajuda.kiwify.com.br/pt-br/article/o-que-e-e-como-funcionam-as-paginas-de-obrigado-dsy5hb/" target="_blank">páginas de obrigado personalizadas</a> e também sobre a <a href="https://ajuda.kiwify.com.br/pt-br/article/o-que-e-e-como-funcionam-as-paginas-de-obrigado-dsy5hb/" target="_blank">upsell de 1 clique</a></p>
        </div>
        <div class="mt-5 md:mt-0 md:col-span-2">
          <div class="relative">
            <div class="px-4 py-5 bg-white sm:p-6 rounded-lg">
              <div class="flex item-center">
                <div class="flex items-center" @click.stop.prevent="toggleThankYou">
                  <span role="checkbox" tabindex="0" :aria-checked="thankYouEnabled" :class="switchRootClass(thankYouEnabled)" @keydown.enter.prevent="toggleThankYou" @keydown.space.prevent="toggleThankYou">
                    <span aria-hidden="true" :class="switchMarkClass(thankYouEnabled)"></span>
                  </span>
                  <label class="block text-sm font-medium leading-5 text-gray-700 ml-2 cursor-pointer">Esse produto tem uma página de obrigado personalizada ou upsell</label>
                </div>
              </div>
              <div v-show="thankYouEnabled" class="mt-6">
                <div>
                  <div>
                    <label class="block text-sm font-medium leading-5 text-gray-700 mb-1">Cartão ou Pix aprovado</label>
                    <div class="relative rounded-md shadow-sm">
                      <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="24px" height="24px" class="w-5 h-5 text-gray-400"><path fill-rule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clip-rule="evenodd"></path></svg>
                      </div>
                      <input v-model="thankYouUrl" placeholder="https://example.com/checkout" class="form-input block w-full pl-10 sm:text-sm sm:leading-5">
                    </div>
                  </div>
                </div>
                <div class="mt-4">
                  <button type="button" class="inline-flex justify-center items-center text-center font-medium rounded-md border transition ease-in-out duration-150 focus:outline-none text-gray-700 hover:text-gray-500 active:text-gray-800 bg-white active:bg-gray-50 border-gray-300 focus:border-blue-300 focus:shadow-outline-blue leading-5 text-sm px-4 py-2 gap-2 cursor-pointer shadow-sm" @click.stop="openUpsellModal">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="24px" height="24px" class="button-icon"><path fill-rule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clip-rule="evenodd"></path></svg>
                    Gerador de upsell
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="mt-10">
      <div class="md:grid md:grid-cols-3 md:gap-6">
        <div class="md:col-span-1">
          <h3 class="text-lg font-medium leading-6 text-gray-900">Pixels de conversão</h3>
          <p class="mt-1 desc text-sm leading-5 text-gray-500">Aprenda mais sobre os <a href="https://ajuda.kiwify.com.br/pt-br/article/pixels-de-conversao-tcm3mi/" target="_blank">pixels de conversão</a></p>
        </div>
        <div class="mt-5 md:mt-0 md:col-span-2">
          <div class="relative">
            <div class="px-4 py-5 bg-white sm:p-6 rounded-lg">
              <div class="flex flex-wrap w-full overflow-y-auto">
                <div class="cursor-pointer flex-shrink-0 w-32 flex justify-center relative items-center py-2 text-sm leading-5 border-b-2 font-medium focus:z-10 focus:outline-none border-indigo-500 text-indigo-500 focus:text-indigo-800 focus:border-indigo-700"><img :src="'/_nuxt/img/facebook.1882182.png'" class="w-4 mr-2"> <div>Facebook</div></div>
                <div v-for="name in ['G Ads', 'G Analytics', 'Taboola', 'Outbrain', 'TikTok', 'Pinterest', 'Kwai']" :key="name" class="cursor-pointer flex-shrink-0 w-32 flex justify-center relative items-center py-2 text-sm leading-5 border-b-2 font-medium focus:z-10 focus:outline-none">
                  <div class="w-4 mr-2"></div>
                  <div>{{ name }}</div>
                </div>
              </div>
              <div>
                <div class="mt-6 flex-wrap w-full items-center md:flex hidden">
                  <div class="pr-4 font-medium text-sm w-4/12">Pixel ID</div>
                  <div class="px-4 font-medium text-sm w-7/12 flex">
                    Domínio
                    <div class="ml-2 text-indigo-500 underline cursor-pointer">(Gerenciar domínios Facebook)</div>
                  </div>
                  <div class="px-4 w-2/12"></div>
                </div>
                <div class="mt-2">
                  <div v-for="pixel in pixels" :key="pixel.id" class="flex flex-wrap w-full mt-4 p-4 md:p-0 md:mt-0 items-center bg-gray-50 md:bg-transparent">
                    <div class="pr-2 md:w-4/12 w-full mb-2 md:mb-0">
                      <input v-model="pixel.pixelId" placeholder="Ex: 1234567890" type="number" autocomplete="off" data-lpignore="true" class="form-input block py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:shadow-outline-blue focus:border-blue-300 transition duration-150 ease-in-out sm:text-sm sm:leading-5 mask-user-input w-full">
                    </div>
                    <div class="md:px-2 md:w-6/12 w-full">
                      <div id="domainSelect" class="md:px-2 pr-2 justify-between items-center block w-full">
                        <div dir="auto" class="v-select vs--single vs--searchable">
                          <div role="combobox" aria-expanded="false" aria-label="Search for option" class="vs__dropdown-toggle">
                            <div class="vs__selected-options"><span class="vs__selected">{{ pixel.domain }}</span><input aria-autocomplete="list" type="search" autocomplete="off" class="vs__search"></div>
                            <div class="vs__actions"><button type="button" title="Clear Selected" aria-label="Clear Selected" class="vs__clear"><span></span></button><svg xmlns="http://www.w3.org/2000/svg" width="14" height="10" role="presentation" class="vs__open-indicator"><path d="M9.211364 7.59931l4.48338-4.867229c.407008-.441854.407008-1.158247 0-1.60046l-.73712-.80023c-.407008-.441854-1.066904-.441854-1.474243 0L7 5.198617 2.51662.33139c-.407008-.441853-1.066904-.441853-1.474243 0l-.737121.80023c-.407008.441854-.407008 1.158248 0 1.600461l4.48338 4.867228L7 10l2.211364-2.40069z"></path></svg></div>
                          </div>
                          <ul role="listbox" style="display: none; visibility: hidden;"></ul>
                        </div>
                      </div>
                    </div>
                    <div class="flex">
                      <div><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="24px" height="24px" class="text-gray-400 w-6 h-6 cursor-pointer md:block"><path fill-rule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd"></path></svg></div>
                      <button type="button" class="px-2" @click.stop="removePixel(pixel.id)">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="24px" height="24px" class="text-red-600 w-6 h-6 cursor-pointer md:block"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path></svg>
                      </button>
                    </div>
                  </div>
                </div>
                <div class="flex flex-wrap justify-between items-center mt-4">
                  <span class="flex items-center">
                    <div><button type="button" class="inline-flex justify-center items-center text-center font-medium rounded-md border transition ease-in-out duration-150 focus:outline-none text-white bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 border-transparent focus:border-indigo-700 focus:shadow-outline-indigo leading-4 text-sm px-3 py-2 gap-2 cursor-pointer shadow-sm" @click.stop="addPixel">Adicionar outro</button></div>
                    <i class="text-sm ml-4 text-gray-500">{{ pixels.length }}/50</i>
                  </span>
                </div>
                <div class="mt-4 text-indigo-500 text-sm md:hidden underline cursor-pointer">(Gerenciar domínios Facebook)</div>
                <div class="mt-6">
                  <div class="flex items-center" @click.stop.prevent="purchasePixEnabled = !purchasePixEnabled">
                    <span role="checkbox" tabindex="0" :aria-checked="purchasePixEnabled" :class="switchRootClass(purchasePixEnabled)"><span aria-hidden="true" :class="switchMarkClass(purchasePixEnabled)"></span></span>
                    <label class="block text-sm font-medium leading-5 text-gray-700 ml-2 cursor-pointer">Disparar evento "Purchase" ao gerar um pix? </label>
                  </div>
                </div>
                <div class="mt-6">
                  <div class="flex items-center" @click.stop.prevent="purchaseBoletoEnabled = !purchaseBoletoEnabled">
                    <span role="checkbox" tabindex="0" :aria-checked="purchaseBoletoEnabled" :class="switchRootClass(purchaseBoletoEnabled)"><span aria-hidden="true" :class="switchMarkClass(purchaseBoletoEnabled)"></span></span>
                    <label class="block text-sm font-medium leading-5 text-gray-700 ml-2 cursor-pointer">Disparar evento "Purchase" ao gerar um boleto?</label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="mt-10">
      <div class="md:grid md:grid-cols-3 md:gap-6">
        <div class="md:col-span-1">
          <h3 class="text-lg font-medium leading-6 text-gray-900">Cupons de desconto</h3>
          <p class="mt-1 desc text-sm leading-5 text-gray-500">
            Aprenda mais sobre os
            <a class="underline text-indigo-600" target="kiwifyDiscountCoupons" href="https://ajuda.kiwify.com.br/pt-br/article/cupons-de-desconto-l808xv/">cupons de desconto</a>
          </p>
        </div>
        <div class="mt-5 md:mt-0 md:col-span-2">
          <div class="relative">
            <div class="px-4 py-5 bg-white sm:p-6 rounded-lg">
              <article class="flex flex-col md:flex-row items-stretch md:items-center gap-4">
                <div class="flex-1">
                  <fieldset class="form-field transition-all ease-in-out duration-300">
                    <div class="flex flex-row items-center gap-3 min-w-0 opacity-100">
                      <div class="flex-1 relative min-w-0">
                        <label class="input-toggle__wrapper flex flex-row gap-2 items-start cursor-pointer transition-opacity ease duration-300 opacity-100" @click.stop.prevent="couponsEnabled = !couponsEnabled">
                          <span class="input-toggle__checkbox relative inline-flex flex-shrink-0">
                            <span :class="['input-toggle__checkbox__input appearance-none block h-6 w-11 border-2 border-transparent rounded-full transition-colors ease-in-out duration-200 focus:outline-none cursor-pointer', couponsEnabled ? 'bg-indigo-500' : 'bg-gray-200']"></span>
                            <span :class="['input-toggle__checkbox__mark absolute top-0.5 left-0.5 block h-5 w-5 bg-white rounded-full shadow cursor-pointer transform transition ease-in-out duration-200', couponsEnabled ? 'translate-x-5' : 'translate-x-0']"></span>
                          </span>
                          <span class="form-field__label font-medium leading-5 text-sm text-gray-700 inline-flex flex-no-wrap flex-row items-center gap-1 mb-0 input-toggle__label flex-1 text-left pt-0.5"><span>Habilitar cupons de desconto</span></span>
                        </label>
                      </div>
                    </div>
                  </fieldset>
                </div>
              </article>

              <div v-show="couponsEnabled" class="mt-6">
                <div class="w-full">
                  <div class="flex flex-col">
                    <div class="overflow-x-auto md:overflow-visible">
                      <div class="align-middle inline-block min-w-full">
                        <table class="min-w-full kiwi-table divide-y divide-gray-200">
                          <thead>
                            <tr>
                              <th class="text-left px-6 py-3 border-b border-gray-200 bg-gray-50 text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">Código</th>
                              <th class="text-left px-6 py-3 border-b border-gray-200 bg-gray-50 text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">Desconto</th>
                              <th class="text-left px-6 py-3 border-b border-gray-200 bg-gray-50 text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">Status</th>
                              <th class="text-left px-6 py-3 border-b border-gray-200 bg-gray-50 text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider"></th>
                            </tr>
                          </thead>
                          <tbody>
                            <tr v-if="!coupons.length">
                              <td colspan="4" class="p-10 text-gray-400 w-full text-center">Não há nenhum cupom de desconto</td>
                            </tr>
                            <tr v-for="coupon in coupons" :key="coupon.id" class="bg-white">
                              <td class="px-6 py-4 whitespace-no-wrap text-sm leading-5 font-medium text-gray-900">{{ coupon.code }}</td>
                              <td class="px-6 py-4 whitespace-no-wrap text-sm leading-5 text-gray-500">{{ coupon.discount }}</td>
                              <td class="px-6 py-4 whitespace-no-wrap"><span class="px-2 bg-green-100 text-green-800 inline-flex text-xs leading-5 font-semibold rounded-full capitalize">{{ coupon.status }}</span></td>
                              <td class="px-6 py-4 whitespace-no-wrap text-right">
                                <button type="button" @click.stop="removeCoupon(coupon.id)">
                                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="24px" height="24px" class="text-red-600 w-6 h-6 cursor-pointer md:block"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path></svg>
                                </button>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="flex flex-wrap justify-between items-center mt-4">
                  <span class="flex items-center">
                    <div><button type="button" class="inline-flex justify-center items-center text-center font-medium rounded-md border transition ease-in-out duration-150 focus:outline-none text-white bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 border-transparent focus:border-indigo-700 focus:shadow-outline-indigo leading-4 text-sm px-3 py-2 gap-2 cursor-pointer shadow-sm" @click.stop="addCoupon">Adicionar cupom</button></div>
                    <i class="text-sm ml-4 text-gray-500">{{ coupons.length }}/100</i>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="mt-10">
      <div class="md:grid md:grid-cols-3 md:gap-6">
        <div class="md:col-span-1">
          <h3 class="text-lg font-medium leading-6 text-gray-900">Order bump</h3>
          <p class="mt-1 desc text-sm leading-5 text-gray-500">Aprenda mais sobre os <a target="_blank" href="https://ajuda.kiwify.com.br/pt-br/article/como-funcionam-os-order-bumps-1bb22bl/?bust=1617344693589">order bumps</a></p>
        </div>
        <div class="mt-5 md:mt-0 md:col-span-2">
          <div class="relative">
            <div class="px-4 py-5 bg-white sm:p-6 rounded-lg">
              <div class="w-full">
                <div class="flex flex-col">
                  <div class="overflow-x-auto md:overflow-visible">
                    <div class="align-middle inline-block min-w-full">
                      <table class="min-w-full kiwi-table divide-y divide-gray-200">
                        <thead>
                          <tr>
                            <th class="text-left px-6 py-3 border-b border-gray-200 bg-gray-50 text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">Ordem</th>
                            <th class="text-left px-6 py-3 border-b border-gray-200 bg-gray-50 text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">Produto</th>
                            <th class="text-left px-6 py-3 border-b border-gray-200 bg-gray-50 text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider"></th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr v-if="!orderBumps.length">
                            <td colspan="3" class="p-10 text-gray-400 w-full text-center">Não há nenhum order bump</td>
                          </tr>
                          <tr v-for="bump in orderBumps" :key="bump.id" class="bg-white">
                            <td class="px-6 py-4 whitespace-no-wrap text-sm leading-5 text-gray-500">{{ bump.order }}</td>
                            <td class="px-6 py-4 whitespace-no-wrap text-sm leading-5 font-medium text-gray-900">{{ bump.product }}</td>
                            <td class="px-6 py-4 whitespace-no-wrap text-right">
                              <button type="button" @click.stop="removeOrderBump(bump.id)">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="24px" height="24px" class="text-red-600 w-6 h-6 cursor-pointer md:block"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path></svg>
                              </button>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
              <div class="flex flex-wrap justify-between items-center mt-4">
                <span class="flex items-center">
                  <div><button type="button" class="inline-flex justify-center items-center text-center font-medium rounded-md border transition ease-in-out duration-150 focus:outline-none text-white bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 border-transparent focus:border-indigo-700 focus:shadow-outline-indigo leading-4 text-sm px-3 py-2 gap-2 cursor-pointer shadow-sm" @click.stop="openOrderBumpModal">Adicionar order bump</button></div>
                  <i class="text-sm ml-4 text-gray-500">{{ orderBumps.length }}/5</i>
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div v-show="showOrderBumpModal" class="fixed md:h-auto bottom-0 z-10 inset-x-0 inset-0 flex items-center justify-center" @keydown="onModalKeydown">
      <div class="fixed inset-0 transition-opacity cursor-pointer" @click="closeOrderBumpModal"><div class="absolute inset-0 bg-gray-500 opacity-75"></div></div>
      <div role="dialog" aria-modal="true" aria-labelledby="modal-headline" class="bg-white overflow-x-auto md:rounded-lg sm:h-auto md:shadow-xl transform transition-all sm:max-w-lg w-full">
        <div class="px-4 py-3 bg-gray-50 flex justify-between">
          <h3 id="modal-headline" class="text-lg leading-6 font-medium text-gray-900">Adicionar order bump</h3>
          <button type="button" aria-label="Close" class="text-gray-400 cursor-pointer hover:text-gray-500 focus:outline-none focus:text-gray-500 transition ease-in-out duration-150" @click="closeOrderBumpModal">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" class="h-6 w-6"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
        <div>
          <div class="px-4 py-5 sm:p-6 rounded-lg">
            <div class="sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start py-2">
              <label class="text-sm font-medium flex items-center leading-5 text-gray-700 sm:mt-px sm:pt-2">Produto</label>
              <div class="mt-1 sm:mt-0 sm:col-span-2">
                <select v-model="orderBumpDraft.product" class="form-select shadow-sm block w-full pl-3 pr-10 py-2 text-base leading-6 border-gray-300 focus:outline-none focus:shadow-outline-blue focus:border-blue-300 sm:text-sm sm:leading-5 transition ease-in-out duration-150">
                  <option value="">Selecione o produto</option>
                  <option v-for="product in availableProducts" :key="product.id" :value="product.name">{{ product.name }}</option>
                </select>
              </div>
            </div>
            <div class="sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start py-2">
              <label class="text-sm font-medium flex items-center leading-5 text-gray-700 sm:mt-px sm:pt-2">Oferta</label>
              <div class="mt-1 sm:mt-0 sm:col-span-2">
                <input v-model="orderBumpDraft.offer" placeholder="Selecione a oferta" class="form-input block py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:shadow-outline-blue focus:border-blue-300 transition duration-150 ease-in-out sm:text-sm sm:leading-5 mask-user-input w-full">
              </div>
            </div>
            <div class="sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start py-2">
              <label class="text-sm font-medium flex items-center leading-5 text-gray-700 sm:mt-px sm:pt-2">Call to action</label>
              <div class="mt-1 sm:mt-0 sm:col-span-2">
                <input v-model="orderBumpDraft.cta" class="form-input block py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:shadow-outline-blue focus:border-blue-300 transition duration-150 ease-in-out sm:text-sm sm:leading-5 mask-user-input w-full">
              </div>
            </div>
            <div class="sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start py-2">
              <label class="text-sm font-medium flex items-center leading-5 text-gray-700 sm:mt-px sm:pt-2">Título</label>
              <div class="mt-1 sm:mt-0 sm:col-span-2">
                <input v-model="orderBumpDraft.title" class="form-input block py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:shadow-outline-blue focus:border-blue-300 transition duration-150 ease-in-out sm:text-sm sm:leading-5 mask-user-input w-full">
              </div>
            </div>
            <div class="sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start py-2">
              <label class="text-sm font-medium flex items-center leading-5 text-gray-700 sm:mt-px sm:pt-2">Descrição</label>
              <div class="mt-1 sm:mt-0 sm:col-span-2">
                <input v-model="orderBumpDraft.description" class="form-input block py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:shadow-outline-blue focus:border-blue-300 transition duration-150 ease-in-out sm:text-sm sm:leading-5 mask-user-input w-full">
              </div>
            </div>
          </div>
        </div>
        <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
          <span class="flex w-full rounded-md shadow-sm sm:ml-3 sm:w-auto"><button type="button" class="bg-indigo-600 hover:bg-indigo-500 focus:shadow-outline-indigo cursor-pointer inline-flex justify-center w-full rounded-md border border-transparent px-4 py-2 text-base leading-6 font-medium text-white shadow-sm focus:outline-none focus:border-red-700 transition ease-in-out duration-150 sm:text-sm sm:leading-5" @click="addOrderBump">Adicionar</button></span>
          <span class="mt-3 flex w-full rounded-md shadow-sm sm:mt-0 sm:w-auto"><button type="button" class="cursor-pointer inline-flex justify-center w-full rounded-md border border-gray-300 px-4 py-2 bg-white text-base leading-6 font-medium text-gray-700 shadow-sm hover:text-gray-500 focus:outline-none focus:border-blue-300 focus:shadow-outline-blue transition ease-in-out duration-150 sm:text-sm sm:leading-5" @click="closeOrderBumpModal">Cancelar</button></span>
        </div>
      </div>
    </div>
  </div>

  <div v-if="showUpsellModal" class="fixed h-full md:h-auto bottom-0 z-50 inset-x-0 sm:inset-0 sm:flex sm:items-center sm:justify-center">
    <div class="fixed inset-0 transition-opacity" @click="closeUpsellModal">
      <div class="absolute inset-0 bg-gray-500 opacity-75"></div>
    </div>
    <section class="bg-white h-full z-50 overflow-x-auto md:rounded-lg sm:h-auto md:shadow-xl transform transition-all sm:max-w-xl sm:w-full">
      <div class="bg-white shadow sm:rounded-lg">
        <div class="px-4 py-5 sm:px-6 pb-0 flex justify-between">
          <div>
            <h2 id="applicant-information-title" class="text-lg leading-6 font-medium text-gray-900">
              Gerador de upsell
            </h2>
            <p class="mt-1 max-w-2xl text-sm text-gray-500">
              Crie um botão de upsell para colocar na sua página de obrigado
            </p>
          </div>
          <div class="h-7 flex items-center">
            <button class="cursor-pointer text-gray-400 hover:text-gray-500 transition ease-in-out duration-150" @click="closeUpsellModal">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" class="h-6 w-6"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </div>
        </div>
        <div data-v-36ced986="" class="px-4 py-5 sm:px-6 scroll-upsell">
          <div class="sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start py-2">
            <label class="text-sm font-medium flex items-center leading-5 text-gray-700 sm:mt-px sm:pt-2">Produto upsell</label>
            <div class="mt-1 sm:mt-0 sm:col-span-2">
              <div dir="auto" class="v-select dropdown-select vs--single vs--searchable">
                <div role="combobox" aria-expanded="false" class="vs__dropdown-toggle relative">
                  <div class="vs__selected-options">
                    <span v-if="upsellDraft.productId" class="vs__selected">{{ availableProducts.find((item) => item.id === upsellDraft.productId)?.name }}</span>
                    <input v-else placeholder="Selecione o produto" aria-autocomplete="list" type="search" autocomplete="off" class="vs__search" readonly>
                  </div>
                  <div class="vs__actions">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="10" role="presentation" class="vs__open-indicator"><path d="M9.211364 7.59931l4.48338-4.867229c.407008-.441854.407008-1.158247 0-1.60046l-.73712-.80023c-.407008-.441854-1.066904-.441854-1.474243 0L7 5.198617 2.51662.33139c-.407008-.441853-1.066904-.441853-1.474243 0l-.737121.80023c-.407008.441854-.407008 1.158248 0 1.600461l4.48338 4.867228L7 10l2.211364-2.40069z"></path></svg>
                  </div>
                  <select v-model="upsellDraft.productId" class="absolute inset-0 h-full w-full opacity-0 cursor-pointer">
                    <option value="">Selecione o produto</option>
                    <option v-for="item in availableProducts" :key="item.id" :value="item.id">{{ item.name }}</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
          <div class="sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start py-2">
            <label class="text-sm font-medium flex items-center leading-5 text-gray-700 sm:mt-px sm:pt-2">Oferta upsell</label>
            <div class="mt-1 sm:mt-0 sm:col-span-2">
              <div dir="auto" class="v-select dropdown-select vs--single vs--searchable">
                <div role="combobox" aria-expanded="false" class="vs__dropdown-toggle relative">
                  <div class="vs__selected-options">
                    <span v-if="selectedUpsellOffer" class="vs__selected">{{ selectedUpsellOffer.label || selectedUpsellOffer.name }}</span>
                    <input v-else placeholder="Seleciona a oferta" aria-autocomplete="list" type="search" autocomplete="off" class="vs__search" readonly>
                  </div>
                  <div class="vs__actions">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="10" role="presentation" class="vs__open-indicator"><path d="M9.211364 7.59931l4.48338-4.867229c.407008-.441854.407008-1.158247 0-1.60046l-.73712-.80023c-.407008-.441854-1.066904-.441854-1.474243 0L7 5.198617 2.51662.33139c-.407008-.441853-1.066904-.441853-1.474243 0l-.737121.80023c-.407008.441854-.407008 1.158248 0 1.600461l4.48338 4.867228L7 10l2.211364-2.40069z"></path></svg>
                  </div>
                  <select v-model="upsellDraft.offerId" class="absolute inset-0 h-full w-full opacity-0 cursor-pointer">
                    <option value="">Seleciona a oferta</option>
                    <option v-for="offer in upsellOffers" :key="offer.id" :value="offer.id">{{ offer.label || offer.name }}</option>
                  </select>
                </div>
              </div>
            </div>
          </div>
          <div class="sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start py-2">
            <label class="text-sm font-medium flex items-center leading-5 text-gray-700 sm:mt-px sm:pt-2">Ao aceitar a upsell</label>
            <div class="mt-1 sm:mt-0 sm:col-span-2">
              <select v-model="upsellDraft.acceptAction" class="form-select block w-full rounded-md shadow-sm sm:text-sm sm:leading-5">
                <option value="offer">Redirecionar para oferta upsell</option>
                <option value="members_area">Redirecionar para área de membros</option>
              </select>
            </div>
          </div>
          <div class="sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start py-2">
            <label class="text-sm font-medium flex items-center leading-5 text-gray-700 sm:mt-px sm:pt-2">Ao recusar a upsell</label>
            <div class="mt-1 sm:mt-0 sm:col-span-2">
              <select v-model="upsellDraft.declineAction" class="form-select block w-full rounded-md shadow-sm sm:text-sm sm:leading-5">
                <option value="members_area">Redirecionar para área de membros</option>
                <option value="offer">Redirecionar para oferta upsell</option>
              </select>
            </div>
          </div>
          <div class="sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start py-2">
            <label class="text-sm font-medium flex items-center leading-5 text-gray-700 sm:mt-px sm:pt-2">Texto aceitar upsell</label>
            <div class="mt-1 sm:mt-0 sm:col-span-2">
              <input v-model="upsellDraft.acceptText" class="form-input block py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:shadow-outline-blue focus:border-blue-300 transition duration-150 ease-in-out sm:text-sm sm:leading-5 mask-user-input w-full">
            </div>
          </div>
          <div class="sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start py-2">
            <label class="text-sm font-medium flex items-center leading-5 text-gray-700 sm:mt-px sm:pt-2">Texto recusar upsell</label>
            <div class="mt-1 sm:mt-0 sm:col-span-2">
              <input v-model="upsellDraft.declineText" class="form-input block py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:shadow-outline-blue focus:border-blue-300 transition duration-150 ease-in-out sm:text-sm sm:leading-5 mask-user-input w-full">
            </div>
          </div>
          <div class="sm:grid sm:grid-cols-3 sm:gap-4 sm:items-start py-2">
            <label class="text-sm font-medium flex items-center leading-5 text-gray-700 sm:mt-px sm:pt-2">Cor</label>
            <div class="mt-1 sm:mt-0 sm:col-span-2">
              <input v-model="upsellDraft.color" type="color" class="h-12 w-24 form-input rounded-md shadow-sm">
            </div>
          </div>
          <div>
            <dt class="text-sm font-medium text-gray-500">Prévia</dt>
            <dd class="mt-1 border h-48 text-gray-900">
              <div class="w-full h-full flex flex-col justify-center">
                <div class="text-center">
                  <button type="button" :style="{ backgroundColor: upsellDraft.color, borderColor: upsellDraft.color }" style="padding:12px 16px;cursor:pointer;color:#FFFFFF;font-weight:600;border-radius:4px;border-width:1px;border-style:solid;font-size:20px;">{{ upsellDraft.acceptText }}</button>
                  <div style="margin-top:1rem;cursor:pointer;font-size:1rem;text-decoration:underline;font-family:sans-serif;">{{ upsellDraft.declineText }}</div>
                </div>
              </div>
            </dd>
          </div>
        </div>
        <div class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
          <span class="flex w-full rounded-md shadow-sm sm:ml-3 sm:w-auto">
            <button type="button" class="bg-indigo-600 hover:bg-indigo-500 focus:shadow-outline-indigo cursor-pointer inline-flex justify-center w-full rounded-md border border-transparent px-4 py-2 text-base leading-6 font-medium text-white shadow-sm focus:outline-none focus:border-red-700 transition ease-in-out duration-150 sm:text-sm sm:leading-5" @click="copyUpsellHtml">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="24px" height="24px" class="mr-3 h-5"><path fill-rule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clip-rule="evenodd"></path></svg>
              {{ upsellCopied ? 'HTML copiado' : 'Copiar HTML' }}
            </button>
          </span>
          <span class="mt-3 flex w-full rounded-md shadow-sm sm:mt-0 sm:w-auto">
            <button type="button" class="cursor-pointer inline-flex justify-center w-full rounded-md border border-gray-300 px-4 py-2 bg-white text-base leading-6 font-medium text-gray-700 shadow-sm hover:text-gray-500 focus:outline-none focus:border-blue-300 focus:shadow-outline-blue transition ease-in-out duration-150 sm:text-sm sm:leading-5" @click="closeUpsellModal">
              Fechar
            </button>
          </span>
        </div>
      </div>
    </section>
  </div>
</template>
