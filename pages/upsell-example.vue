<script setup lang="ts">
import type { Sale } from '~/data/sales'
import { getSaleById } from '~/services/salesService'
import { getProductById, type ProductDetails } from '~/services/productsService'

definePageMeta({ layout: false })

const route = useRoute()
const router = useRouter()
const sale = ref<Sale | undefined>()
const product = ref<ProductDetails | undefined>()
const loading = ref(true)
const submitting = ref(false)
const errorMessage = ref('')

const saleId = computed(() => String(route.query.saleId || ''))
const queryOfferId = computed(() => String(route.query.offerId || ''))
const upsellSettings = computed(() => product.value?.settings?.upsellSettings || {})
const upsellColor = computed(() => String(upsellSettings.value?.color || '#2ECC70'))
const acceptText = computed(() => String(upsellSettings.value?.acceptText || 'Sim, eu aceito essa oferta especial!'))
const declineText = computed(() => String(upsellSettings.value?.declineText || 'Não, eu gostaria de recusar essa oferta'))
const resolvedOfferId = computed(() => String(upsellSettings.value?.offerId || queryOfferId.value || ''))
const upsellOfferUrl = computed(() => String(upsellSettings.value?.offerUrl || (resolvedOfferId.value ? `/checkout/${resolvedOfferId.value}` : '')))
const accessUrl = computed(() => '/courses')

const acceptUpsell = async () => {
  if (!saleId.value || submitting.value) return
  submitting.value = true
  errorMessage.value = ''

  try {
    const result = await $fetch<{ saleId: string; accessUrl?: string }>('/api/upsell/one-click', {
      method: 'POST',
      body: {
        saleId: saleId.value,
        offerId: resolvedOfferId.value
      }
    })
    await router.push(result.accessUrl || `/sales?id=${result.saleId}`)
  } catch (error: any) {
    errorMessage.value = error?.data?.statusMessage || error?.statusMessage || 'Não foi possível criar a venda do upsell.'
  } finally {
    submitting.value = false
  }
}

const declineUpsell = async () => {
  await router.push(accessUrl.value)
}

onMounted(async () => {
  if (!saleId.value) {
    errorMessage.value = 'Abra essa página com ?saleId=ID_DA_VENDA.'
    loading.value = false
    return
  }

  sale.value = await getSaleById(saleId.value)
  if (sale.value?.productId) {
    product.value = await getProductById(sale.value.productId)
  }
  loading.value = false
})
</script>

<template>
  <div class="upsell-page">
    <div v-if="loading">Carregando...</div>
    <div v-else>
      <div v-if="errorMessage" class="upsell-error">{{ errorMessage }}</div>
      <div
        style="text-align:center"
        :id="`kiwify-upsell-${saleId || 'example'}`"
        :data-upsell-url="upsellOfferUrl"
        :data-downsell-url="accessUrl"
      >
        <button
          :id="`kiwify-upsell-trigger-${saleId || 'example'}`"
          :style="{ backgroundColor: upsellColor, borderColor: upsellColor }"
          style="padding:12px 16px;cursor:pointer;color:#FFFFFF;font-weight:600;border-radius:4px;border-width:1px;border-style:solid;font-size:20px;"
          type="button"
          @click="acceptUpsell"
        >
          {{ submitting ? 'Processando...' : acceptText }}
        </button>
        <div
          :id="`kiwify-upsell-cancel-trigger-${saleId || 'example'}`"
          style="margin-top:1rem;cursor:pointer;font-size:16px;text-decoration:underline;font-family:sans-serif;"
          @click="declineUpsell"
        >
          {{ declineText }}
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.upsell-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: #fff;
}

.upsell-error {
  color: #b91c1c;
  font-family: sans-serif;
  margin-bottom: 16px;
  text-align: center;
}
</style>
