<script setup lang="ts">
import { getSaleById } from '~/services/salesService'
import { getDeliveryBySaleId, type ProductDelivery } from '~/services/deliveriesService'
import type { Sale } from '~/data/sales'

definePageMeta({ layout: false })

const route = useRoute()
const router = useRouter()
const sale = ref<Sale | undefined>()
const delivery = ref<ProductDelivery | undefined>()
const finalAccessUrl = ref('')

const normalizedStatus = computed(() => String(sale.value?.status || '').toLowerCase())
const isApproved = computed(() => ['approved', 'pago', 'recebido', 'confirmado'].includes(normalizedStatus.value))

const accessUrl = computed(() => {
  if (finalAccessUrl.value) return finalAccessUrl.value
  if (delivery.value?.accessUrl) return delivery.value.accessUrl

  const productId = delivery.value?.productId || sale.value?.productId
  if (productId) return `/club=${productId}`

  return '/'
})

onMounted(async () => {
  const saleId = String(route.params.saleId)
  try {
    const result = await $fetch<{
      sale?: Sale
      delivery?: ProductDelivery
      clubUrl?: string
      thankYouUrl?: string
    }>(`/api/sales/${saleId}/refresh-payment`, {
      method: 'POST'
    })
    if (result.sale) sale.value = result.sale
    if (result.delivery) delivery.value = result.delivery
    finalAccessUrl.value = result.thankYouUrl || result.clubUrl || result.delivery?.accessUrl || ''
  } catch {
    sale.value = await getSaleById(saleId)
    delivery.value = await getDeliveryBySaleId(saleId)
  }

  if (!isApproved.value) {
    await router.replace(`/payment/${saleId}`)
  }
})
</script>

<template>
  <main class="thank-you-page">
    <section class="thank-you-card">
      <div class="thank-you-icon">✓</div>
      <h1>Obrigado pela compra</h1>
      <p>Seu pagamento foi aprovado e o acesso já está disponível.</p>
      <NuxtLink :to="accessUrl" class="thank-you-link">Acessar produto</NuxtLink>
    </section>
  </main>
</template>

<style scoped>
.thank-you-page {
  min-height: 100vh;
  background: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

.thank-you-card {
  width: 100%;
  max-width: 520px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.08);
  padding: 36px;
  text-align: center;
}

.thank-you-icon {
  width: 56px;
  height: 56px;
  margin: 0 auto 18px;
  border-radius: 999px;
  background: #dcfce7;
  color: #15803d;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  font-weight: 800;
}

h1 {
  margin: 0 0 8px;
  font-size: 28px;
}

p {
  color: #6b7280;
  margin: 0 0 28px;
}

.thank-you-link {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  height: 44px;
  padding: 0 18px;
  border-radius: 6px;
  background: #5850ec;
  color: #fff;
  text-decoration: none;
  font-weight: 700;
}
</style>
