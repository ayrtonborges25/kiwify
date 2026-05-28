<script setup lang="ts">
import { getOfferById } from '~/services/offersService'
import { getProductById, type ProductDetails } from '~/services/productsService'
import type { Offer } from '~/data/offers'

definePageMeta({ layout: false })

const route = useRoute()
const router = useRouter()

const offer = ref<Offer | undefined>()
const product = ref<ProductDetails | undefined>()
const loading = ref(true)
const submitting = ref(false)
const errors = ref<string[]>([])
const paymentError = ref('')
const paymentMethod = ref<'credit_card' | 'pix' | 'boleto'>('credit_card')
const selectedInstallments = ref(1)
const form = reactive({
  name: '',
  email: '',
  confirmEmail: '',
  document: '',
  phone: '',
  cardNumber: '',
  cardExpiryMonth: '',
  cardExpiryYear: '',
  cardCvv: ''
})

const paymentLabels: Record<string, string> = {
  credit_card: 'Cartão de crédito',
  pix: 'Pix',
  boleto: 'Boleto'
}

const asaasPaymentMethods: Record<'credit_card' | 'pix' | 'boleto', 'CREDIT_CARD' | 'PIX' | 'BOLETO'> = {
  credit_card: 'CREDIT_CARD',
  pix: 'PIX',
  boleto: 'BOLETO'
}

const availablePaymentMethods = computed(() => {
  const methods = offer.value?.paymentMethods?.length ? offer.value.paymentMethods : ['credit_card', 'pix', 'boleto']
  const supportedMethods = methods.filter((method) => ['credit_card', 'pix', 'boleto'].includes(method))
  const orderedMethods = ['credit_card', 'pix', 'boleto'].filter((method) => supportedMethods.includes(method))
  return orderedMethods.length ? orderedMethods : ['credit_card']
})

const repeatEmailEnabled = computed(() => offer.value?.settings?.repeatEmailEnabled !== false)
const collectPhone = computed(() => offer.value?.settings?.collectPhone !== false)
const collectDocument = computed(() => offer.value?.settings?.collectDocument !== false)
const maxInstallments = computed(() => Math.max(1, Math.min(12, Number(offer.value?.settings?.installments || 12) || 12)))
const price = computed(() => offer.value?.price || product.value?.price || 'R$ 0,00')
const priceAmount = computed(() => {
  return Number(String(price.value).replace(/[^\d,.-]/g, '').replace('.', '').replace(',', '.')) || 0
})
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value)
}
const installmentOptions = computed(() => {
  return Array.from({ length: maxInstallments.value }, (_, index) => {
    const installments = index + 1
    const amount = installments === 1 ? priceAmount.value : priceAmount.value / installments
    const valueLabel = formatCurrency(amount)
    const label = installments === 1
      ? `À vista ${valueLabel}`
      : installments === maxInstallments.value
        ? `Até ${installments}x de ${valueLabel}`
        : `${installments}x de ${valueLabel}`

    return {
      installments,
      label
    }
  })
})
const companyName = 'DIGITAL BORGES LTDA'
const defaultOfferSuffix = '-default-offer'
const productIdFromDefaultOfferId = (id: string) => {
  return id.endsWith(defaultOfferSuffix) ? id.slice(0, -defaultOfferSuffix.length) : ''
}

const loadCheckout = async () => {
  loading.value = true
  const routeOfferId = String(route.params.offerId)
  offer.value = await getOfferById(routeOfferId)

  if (!offer.value) {
    const defaultProductId = productIdFromDefaultOfferId(routeOfferId)
    if (defaultProductId) {
      product.value = await getProductById(defaultProductId)
      offer.value = {
        id: routeOfferId,
        productId: defaultProductId,
        name: product.value?.name || 'Produto',
        slug: routeOfferId,
        price: product.value?.price || 'R$ 0,00',
        currency: product.value?.currency || 'BRL',
        paymentMethods: ['credit_card', 'pix', 'boleto'],
        settings: { repeatEmailEnabled: true, collectPhone: true, collectDocument: true },
        isDefault: true,
        status: product.value?.status === 'Deletado' ? 'Desativado' : 'Ativo',
        publicUrl: `/checkout/${routeOfferId}`,
        label: 'Checkout A'
      }
    }
  }

  if (offer.value?.productId) {
    product.value = await getProductById(offer.value.productId)
  }
  if (!availablePaymentMethods.value.includes(paymentMethod.value)) {
    paymentMethod.value = availablePaymentMethods.value[0] as 'credit_card' | 'pix' | 'boleto'
  }
  selectedInstallments.value = maxInstallments.value
  loading.value = false
}

watch(maxInstallments, (value) => {
  if (selectedInstallments.value > value || selectedInstallments.value < 1) {
    selectedInstallments.value = value
  }
})

const validate = () => {
  const nextErrors: string[] = []
  paymentError.value = ''
  if (!offer.value) nextErrors.push('Oferta não encontrada.')
  if (!form.name.trim()) nextErrors.push('Informe seu nome.')
  if (!form.email.trim()) nextErrors.push('Informe seu e-mail.')
  if (repeatEmailEnabled.value && form.email.trim() !== form.confirmEmail.trim()) nextErrors.push('A confirmação de e-mail precisa ser igual ao e-mail.')
  if (collectDocument.value && !form.document.trim()) nextErrors.push('Informe CPF/CNPJ.')
  if (collectPhone.value && !form.phone.trim()) nextErrors.push('Informe seu telefone.')
  if (paymentMethod.value === 'credit_card') {
    if (!form.cardNumber.trim()) nextErrors.push('Informe o número do cartão.')
    if (!form.cardExpiryMonth.trim()) nextErrors.push('Informe o mês do cartão.')
    if (!form.cardExpiryYear.trim()) nextErrors.push('Informe o ano do cartão.')
    if (!form.cardCvv.trim()) nextErrors.push('Informe o CVV.')
  }
  errors.value = nextErrors
  return !nextErrors.length
}

const submitOrder = async () => {
  if (!validate() || !offer.value) return
  submitting.value = true
  paymentError.value = ''

  try {
    const expiryMonth = form.cardExpiryMonth.trim()
    const expiryYearRaw = form.cardExpiryYear.trim()
    const expiryYear = expiryYearRaw.length === 2 ? `20${expiryYearRaw}` : expiryYearRaw
    const result = await $fetch<{ saleId: string; status?: string; accessUrl?: string }>('/api/checkout/create-payment', {
      method: 'POST',
      body: {
        offerId: offer.value.id,
        productId: offer.value.productId,
        customer: {
          name: form.name,
          email: form.email,
          cpfCnpj: form.document,
          phone: form.phone
        },
        paymentMethod: asaasPaymentMethods[paymentMethod.value],
        installments: paymentMethod.value === 'credit_card' ? selectedInstallments.value : undefined,
        card: paymentMethod.value === 'credit_card'
          ? {
              holderName: form.name,
              number: form.cardNumber,
              expiryMonth,
              expiryYear,
              ccv: form.cardCvv
            }
          : undefined
      }
    })

    if (result.status === 'approved' && result.accessUrl) {
      await router.push(result.accessUrl)
      return
    }

    await router.push(`/payment/${result.saleId}`)
  } catch (error: any) {
    paymentError.value = error?.data?.statusMessage || error?.statusMessage || 'Não foi possível criar o pagamento agora.'
  } finally {
    submitting.value = false
  }
}

onMounted(loadCheckout)

useHead({
  title: computed(() => offer.value ? `${offer.value.name} | Checkout` : 'Checkout')
})
</script>

<template>
  <div class="checkout-public">
    <main class="main">
      <div class="content">
        <div v-if="loading" class="checkoutblock">Carregando checkout...</div>

        <div v-else class="checkout-column">
          <div class="product-header">
            <img v-if="product?.imageUrl" :src="product.imageUrl" :alt="product.name">
            <div v-else class="product-image-fallback">{{ (product?.name || offer?.name || 'P').slice(0, 1) }}</div>
            <div class="product-copy">
              <h3>{{ product?.name || offer?.name || 'Produto' }}</h3>
              <p>{{ companyName }}</p>
            </div>
          </div>

          <section id="checkoutblock" class="checkoutblock">
            <button type="button" class="apple-pay-button">Pagar com <strong>Pay</strong></button>
            <div class="checkout-divider"><span>ou</span></div>
            <div class="country-row">
              <span class="country-flag">🇧🇷</span>
              <span>Alterar país</span>
              <span class="country-arrow">⌄</span>
            </div>

            <div v-if="errors.length || paymentError" class="checkout-errors">
              <div v-if="paymentError">{{ paymentError }}</div>
              <div v-for="error in errors" :key="error">{{ error }}</div>
            </div>

            <div class="pb-3">
              <div class="kiwi-input">
                <input v-model="form.name" type="text" autocomplete="name" placeholder="Nome" class="kiwi-input-field">
              </div>
            </div>

            <div class="pb-3">
              <div class="kiwi-input">
                <input v-model="form.email" type="email" autocomplete="email" placeholder="E-mail" class="kiwi-input-field">
              </div>
            </div>

            <div v-if="repeatEmailEnabled" class="pb-3">
              <div class="kiwi-input">
                <input v-model="form.confirmEmail" type="email" autocomplete="email" placeholder="Confirmar e-mail" class="kiwi-input-field">
              </div>
            </div>

            <div class="checkout-field-grid pb-3">
              <div v-if="collectDocument" class="kiwi-input">
                <input v-model="form.document" type="tel" placeholder="CPF/CNPJ" class="kiwi-input-field">
              </div>
              <div v-if="collectPhone" class="kiwi-input phone-input">
                <span class="phone-prefix">🇧🇷 +55</span>
                <input v-model="form.phone" type="tel" autocomplete="tel" placeholder="Telefone" class="kiwi-input-field phone-field">
              </div>
            </div>

            <div class="payment-methods">
              <button
                v-for="method in availablePaymentMethods"
                :key="method"
                type="button"
                :class="{ selected: paymentMethod === method }"
                @click="paymentMethod = method as 'credit_card' | 'pix' | 'boleto'"
              >
                <span class="payment-icon">{{ method === 'credit_card' ? '▣' : method === 'boleto' ? '▥' : '✤' }}</span>
                <span>{{ method === 'credit_card' ? 'Cartão' : paymentLabels[method] }}</span>
                <span v-if="paymentMethod === method" class="payment-check">✓</span>
              </button>
            </div>

            <div v-if="paymentMethod === 'credit_card'" class="card-box">
              <div class="pb-3">
                <div class="kiwi-input">
                  <input v-model="form.cardNumber" type="tel" inputmode="numeric" placeholder="Número do cartão" class="kiwi-input-field">
                  <span class="input-icon">▣</span>
                </div>
              </div>
              <div class="card-field-grid pb-3">
                <div class="kiwi-input">
                  <input v-model="form.cardExpiryMonth" type="text" inputmode="numeric" placeholder="Mês" class="kiwi-input-field">
                </div>
                <div class="kiwi-input">
                  <input v-model="form.cardExpiryYear" type="text" inputmode="numeric" placeholder="Ano" class="kiwi-input-field">
                </div>
                <div class="kiwi-input">
                  <input v-model="form.cardCvv" type="tel" inputmode="numeric" placeholder="Cód. segurança" class="kiwi-input-field">
                  <span class="input-icon">?</span>
                </div>
              </div>
              <div class="kiwi-input installments-field">
                <select v-model.number="selectedInstallments" class="kiwi-input-field installments-select">
                  <option
                    v-for="option in installmentOptions"
                    :key="option.installments"
                    :value="option.installments"
                  >
                    {{ option.label }}
                  </option>
                </select>
                <span class="installments-label">Parcelas</span>
                <span class="input-icon">⌄</span>
              </div>
            </div>

            <div v-else-if="paymentMethod === 'pix'" class="checkout-info-box">
              O Pix será gerado depois da confirmação dos dados.
            </div>

            <div v-else class="checkout-info-box">
              O boleto será gerado depois da confirmação dos dados.
            </div>

            <div class="save-card">
              <span class="save-checkbox">✓</span>
              <span>Salvar dados para as próximas compras</span>
            </div>

            <div class="security-row">
              <span>▣</span>
              <span>Protegemos seus dados de pagamento com criptografia para garantir segurança bancária.</span>
            </div>

            <button type="button" class="button" :disabled="submitting" @click="submitOrder">
              {{ submitting ? 'Processando...' : 'Pagar agora' }}
            </button>

            <footer class="checkout-footer">
              <p>
                Ao clicar em 'Pagar agora', eu declaro que estou ciente que a Kiwify está processando essa compra em nome de
                <strong>{{ companyName }}</strong> e que não possui responsabilidade pelo conteúdo, oferta, e nem faz controle prévio do infoproduto.
              </p>
              <p>Termos de Compra, Termos de Uso, Política de Privacidade.</p>
              <p>Denunciar esse produto.</p>
              <p>*Parcelamento com acréscimo.</p>
              <p>Este site está protegido pelo Google reCAPTCHA.</p>
            </footer>
          </section>
        </div>
      </div>
    </main>
  </div>
</template>

<style scoped>
.checkout-public {
  min-height: 100vh;
  background: #eff1f3;
  color: #000;
  font-family: "Open Sans", system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
}

.main {
  margin: 0;
  padding: 8px;
  position: relative;
}

.content {
  max-width: 1000px;
  margin: 0 auto;
}

.checkout-column {
  max-width: 688px;
  margin: 0 auto;
}

.product-header {
  width: 100%;
  padding: 16px;
  display: flex;
  align-items: center;
  background: transparent;
}

.product-header img,
.product-image-fallback {
  position: relative;
  border-radius: 6px;
  max-height: 128px;
  height: auto;
  width: auto;
  max-width: 128px;
}

.product-image-fallback {
  width: 128px;
  height: 128px;
  background: linear-gradient(90deg, #0e9f4f, #040707);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 42px;
  font-weight: 800;
}

.product-copy {
  z-index: 10;
  position: relative;
  width: 75%;
  margin-left: 16px;
}

.product-copy h3 {
  font-weight: 700;
  font-size: 24px;
  line-height: 32px;
  margin: 0;
  color: #000;
}

.product-copy p {
  margin: 2px 0 0;
  color: #000;
  font-size: 16px;
}

.checkoutblock {
  color: #000;
  background: #fff;
  border-radius: 6px;
  padding: 16px 24px;
  width: 100%;
  margin-bottom: 16px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06);
  border: 1px solid #cbd5e1;
}

.pb-3 {
  padding-bottom: 12px;
}

.apple-pay-button {
  width: 400px;
  min-width: 0;
  min-height: 44px;
  display: block;
  margin: 12px auto;
  border: 0;
  border-radius: 6px;
  background: #000;
  color: #fff;
  font-size: 18px;
  font-weight: 500;
  cursor: pointer;
  line-height: 1;
  padding: 12px 16px;
}

.apple-pay-button strong {
  font-size: 20px;
}

.checkout-divider {
  display: flex;
  align-items: center;
  gap: 14px;
  color: #9ca3af;
  font-size: 12px;
  margin: 16px 0 8px;
}

.checkout-divider::before,
.checkout-divider::after {
  content: "";
  flex: 1;
  height: 1px;
  background: #e5e7eb;
}

.country-row {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: 7px;
  font-size: 16px;
  margin: -8px 0 -12px;
  position: relative;
  z-index: 1;
}

.country-flag {
  font-size: 18px;
}

.country-arrow {
  font-size: 22px;
}

.kiwi-input {
  position: relative;
}

.kiwi-input-field {
  width: 100%;
  min-height: 48px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  padding: 8px 14px;
  font-size: 16px;
  outline: none;
  background: #fff;
  color: #111827;
}

.kiwi-input-field::placeholder {
  color: #7b8190;
}

.kiwi-input-field:focus {
  border-color: #247ef3;
  box-shadow: #247ef3 0 0 0 1px;
}

.checkout-field-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.phone-input {
  position: relative;
}

.phone-prefix {
  position: absolute;
  z-index: 1;
  top: 14px;
  left: 14px;
  font-size: 16px;
  color: #6b7280;
}

.phone-field {
  padding-left: 96px;
}

.payment-methods {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
  margin: 24px 0 16px;
}

.payment-methods button {
  height: 64px;
  max-width: 200px;
  border: 1px solid #d1d5db;
  border-radius: 4px;
  background: #fff;
  color: #111827;
  font-size: 14px;
  cursor: pointer;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.14);
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.payment-methods button.selected {
  border-color: #247ef3;
  box-shadow: 0 0 0 1px #247ef3;
  color: #4a90e2;
}

.payment-icon {
  font-size: 18px;
}

.payment-check {
  position: absolute;
  top: -10px;
  right: -8px;
  width: 20px;
  height: 20px;
  border-radius: 999px;
  background: #4fc08d;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 700;
}

.card-box {
  border: 1px solid #93c5fd;
  border-radius: 4px;
  background: #fff;
  padding: 12px 16px;
  margin-bottom: 16px;
}

.card-field-grid {
  display: grid;
  grid-template-columns: 1fr 1fr 1.7fr;
  gap: 12px;
}

.input-icon {
  position: absolute;
  right: 14px;
  top: 15px;
  font-size: 16px;
  color: #111827;
}

.installments-field {
  margin-top: 2px;
}

.installments-field .kiwi-input-field {
  padding-top: 18px;
  font-size: 16px;
}

.installments-select {
  appearance: none;
  cursor: pointer;
}

.installments-label {
  position: absolute;
  left: 20px;
  top: 9px;
  font-size: 12px;
  color: #7b8190;
}

.save-card {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 16px;
  margin: 16px 0 18px 8px;
}

.save-checkbox {
  width: 20px;
  height: 20px;
  border-radius: 5px;
  background: #4a90e2;
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 700;
}

.security-row {
  display: flex;
  align-items: center;
  gap: 11px;
  color: #8390a6;
  font-size: 13px;
  margin: 0 0 28px 8px;
}

.button {
  width: 100%;
  height: 64px;
  padding: 0 8px;
  border-radius: 6px;
  text-align: center;
  color: #fff;
  font-size: 20px;
  font-weight: 600;
  cursor: pointer;
  background-color: #28b463;
  border: 0;
  transition: opacity 0.075s;
  margin-top: 0;
}

.button:hover {
  opacity: 0.75;
}

.button:disabled {
  opacity: 0.7;
  cursor: wait;
}

.checkout-errors,
.checkout-info-box {
  border-radius: 6px;
  padding: 8px;
  margin-bottom: 9px;
}

.checkout-errors {
  background: #fef2f2;
  border: 1px solid #fecaca;
  color: #b91c1c;
}

.checkout-info-box {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  color: #4b5563;
}

.checkout-footer {
  text-align: center;
  color: #a7b1c4;
  font-size: 12px;
  line-height: 1.45;
  padding: 22px 3px 0;
}

.checkout-footer p {
  margin: 5px 0;
}

@media (max-width: 860px) {
  .checkout-field-grid,
  .payment-methods {
    grid-template-columns: 1fr;
  }

  .product-header {
    padding: 0 8px 28px;
  }

  .product-header img,
  .product-image-fallback {
    width: 116px;
    height: 116px;
    max-width: 116px;
  }

  .product-copy h3 {
    font-size: 24px;
    line-height: 30px;
  }

  .checkoutblock {
    padding: 24px 18px;
  }

  .apple-pay-button {
    min-width: 0;
    width: 100%;
  }

  .card-field-grid {
    grid-template-columns: 1fr;
  }
}
</style>
