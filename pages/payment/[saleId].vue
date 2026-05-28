<script setup lang="ts">
import { getSaleById } from '~/services/salesService'
import { getDeliveryBySaleId, type ProductDelivery } from '~/services/deliveriesService'
import type { Sale } from '~/data/sales'

definePageMeta({ layout: false })

const route = useRoute()
const router = useRouter()
const sale = ref<Sale | undefined>()
const delivery = ref<ProductDelivery | undefined>()
const approvedAccessUrl = ref('')
let refreshTimer: ReturnType<typeof setInterval> | undefined

const normalizedStatus = computed(() => String(sale.value?.status || '').toLowerCase())
const isApproved = computed(() => ['approved', 'pago', 'recebido', 'confirmado'].includes(normalizedStatus.value))
const isFailed = computed(() => ['failed', 'recusado', 'falhou', 'cancelado'].includes(normalizedStatus.value))
const isPix = computed(() => String(sale.value?.method || '').toLowerCase().includes('pix'))
const isBoleto = computed(() => String(sale.value?.method || '').toLowerCase().includes('boleto'))
const boletoDueDateLabel = computed(() => {
  if (!sale.value?.boletoDueDate) return ''
  return new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(new Date(sale.value.boletoDueDate))
})
const title = computed(() => {
  if (isApproved.value) return 'Pagamento aprovado'
  if (isFailed.value) return 'Pagamento recusado'
  if (isPix.value) return 'Pix gerado'
  if (isBoleto.value) return 'Boleto gerado'
  return 'Pedido criado'
})
const description = computed(() => {
  if (isApproved.value) return 'Seu pagamento foi aprovado com sucesso.'
  if (isFailed.value) return 'Não foi possível aprovar esse pagamento.'
  if (isPix.value) return 'Use o QR Code ou copia e cola para concluir o pagamento.'
  if (isBoleto.value) return 'Abra o boleto para concluir o pagamento. O status fica pendente ate a compensacao.'
  return 'Finalize o pagamento para liberar o acesso.'
})
const pixQrImageSrc = computed(() => {
  const qrCode = String(sale.value?.pixQrCode || '')
  if (!qrCode || qrCode.startsWith('000201')) return ''
  if (qrCode.startsWith('data:image')) return qrCode
  return `data:image/png;base64,${qrCode}`
})

const accessUrl = computed(() => {
  if (approvedAccessUrl.value) return approvedAccessUrl.value
  if (delivery.value?.accessUrl) return delivery.value.accessUrl

  const productId = delivery.value?.productId || sale.value?.productId
  if (productId) return `/club=${productId}`

  return '/'
})

const redirectIfApproved = async () => {
  if (!isApproved.value) return
  await router.replace(accessUrl.value)
}

const loadSale = async (refreshPayment = false) => {
  if (refreshPayment) {
    try {
      const result = await $fetch<{ sale?: Sale; delivery?: ProductDelivery; accessUrl?: string }>(`/api/sales/${route.params.saleId}/refresh-payment`, {
        method: 'POST'
      })
      if (result.sale) sale.value = result.sale
      if (result.delivery) delivery.value = result.delivery
      if (result.accessUrl) approvedAccessUrl.value = result.accessUrl
    } catch {
      sale.value = await getSaleById(String(route.params.saleId))
      delivery.value = await getDeliveryBySaleId(String(route.params.saleId))
    }
  } else {
    sale.value = await getSaleById(String(route.params.saleId))
    delivery.value = await getDeliveryBySaleId(String(route.params.saleId))
  }

  await redirectIfApproved()

  if ((isApproved.value || isFailed.value) && refreshTimer) {
    clearInterval(refreshTimer)
    refreshTimer = undefined
  }
}

onMounted(async () => {
  sale.value = await getSaleById(String(route.params.saleId))
  delivery.value = await getDeliveryBySaleId(String(route.params.saleId))
  await loadSale(true)

  if (!isApproved.value && !isFailed.value) {
    refreshTimer = setInterval(() => {
      loadSale(true)
    }, 4000)
  }
})

onBeforeUnmount(() => {
  if (refreshTimer) {
    clearInterval(refreshTimer)
    refreshTimer = undefined
  }
})
</script>

<template>
  <main class="payment-status-page">
    <section class="payment-status-card">
      <div class="payment-status-icon" :class="{ failed: isFailed }">{{ isFailed ? '!' : '✓' }}</div>
      <h1>{{ title }}</h1>
      <p>{{ description }}</p>

      <div class="payment-status-summary">
        <div><span>Pedido</span><strong>{{ route.params.saleId }}</strong></div>
        <div v-if="sale"><span>Status</span><strong>{{ sale.status }}</strong></div>
        <div v-if="sale"><span>Valor</span><strong>{{ sale.value }}</strong></div>
        <div v-if="isBoleto && boletoDueDateLabel"><span>Vencimento</span><strong>{{ boletoDueDateLabel }}</strong></div>
        <div v-if="sale?.providerPaymentId"><span>Asaas</span><strong>{{ sale.providerPaymentId }}</strong></div>
      </div>

      <div v-if="sale?.pixQrCode || sale?.pixCopyPaste" class="payment-result">
        <img v-if="pixQrImageSrc" :src="pixQrImageSrc" alt="QR Code Pix">
        <textarea v-if="sale.pixCopyPaste" readonly :value="sale.pixCopyPaste" />
      </div>

      <div v-if="isBoleto" class="boleto-status-note">Status pendente</div>
      <a v-if="sale?.boletoUrl" :href="sale.boletoUrl" target="_blank" rel="noreferrer" class="payment-status-link secondary">Abrir boleto</a>
      <a v-else-if="sale?.invoiceUrl && !sale?.pixCopyPaste" :href="sale.invoiceUrl" target="_blank" rel="noreferrer" class="payment-status-link secondary">Abrir fatura</a>
      <NuxtLink v-if="isApproved" :to="accessUrl" class="payment-status-link">Acessar produto</NuxtLink>
    </section>
  </main>
</template>

<style scoped>
.payment-status-page {
  min-height: 100vh;
  background: #f3f4f6;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

.payment-status-card {
  width: 100%;
  max-width: 520px;
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.08);
  padding: 36px;
  text-align: center;
}

.payment-status-icon {
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

.payment-status-icon.failed {
  background: #fee2e2;
  color: #b91c1c;
}

h1 {
  margin: 0 0 8px;
  font-size: 28px;
}

p {
  color: #6b7280;
  margin: 0;
}

.payment-status-summary {
  margin: 28px 0;
  border-top: 1px solid #e5e7eb;
  border-bottom: 1px solid #e5e7eb;
  padding: 16px 0;
  text-align: left;
}

.payment-status-summary div {
  display: flex;
  justify-content: space-between;
  gap: 18px;
  padding: 8px 0;
  color: #4b5563;
}

.payment-status-summary strong {
  color: #111827;
  word-break: break-word;
  text-align: right;
}

.payment-status-link {
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
  margin: 0 6px;
}

.payment-status-link.secondary {
  background: #111827;
}

.payment-result {
  margin: 0 0 22px;
}

.payment-result img {
  width: 180px;
  height: 180px;
  object-fit: contain;
  display: block;
  margin: 0 auto 14px;
}

.payment-result textarea {
  width: 100%;
  min-height: 86px;
  resize: vertical;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  padding: 12px;
  font: inherit;
  color: #374151;
}

.boleto-status-note {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 32px;
  padding: 0 12px;
  margin: 0 8px 14px;
  border-radius: 999px;
  background: #fef3c7;
  color: #92400e;
  font-weight: 700;
  font-size: 14px;
}
</style>
