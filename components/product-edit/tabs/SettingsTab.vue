<script setup lang="ts">
import PaymentSettingsExtras from './PaymentSettingsExtras.vue'
</script>

<template>
  <div id="settings">
    <div class="mt-10">
      <div class="md:grid md:grid-cols-3 md:gap-6">
        <div class="md:col-span-1">
          <h3 class="text-lg font-medium leading-6 text-gray-900">Pagamento</h3>
          <p class="mt-1 desc text-sm leading-5 text-gray-500">
            Aprenda sobre as configurações de
            <a href="https://ajuda.kiwify.com.br/pt-br/article/como-funciona-o-parcelamento-no-checkout-1um5p52/" target="_blank">parcelamento</a>
            no checkout
          </p>
        </div>

        <div class="mt-5 md:mt-0 md:col-span-2">
          <div class="relative">
            <div class="px-4 py-5 bg-white sm:p-6 rounded-lg">
              <div class="grid grid-cols-1 gap-6">
                <div>
                  <label class="block text-sm font-medium leading-5 text-gray-700 mb-1">Método de pagamento</label>
                  <select data-setting="payment-method" class="form-select shadow-sm block w-full pl-3 pr-10 py-2 text-base leading-6 border-gray-300 focus:outline-none focus:shadow-outline-blue focus:border-blue-300 sm:text-sm sm:leading-5 transition ease-in-out duration-150">
                    <option value="3">Cartão de crédito, boleto e Pix</option>
                    <option value="1">Cartão de crédito e boleto</option>
                    <option value="4">Cartão de crédito e Pix</option>
                    <option value="2">Apenas cartão de crédito</option>
                  </select>
                </div>

                <div class="w-full">
                  <div class="flex items-center">
                    <div class="block text-sm font-medium leading-5 text-gray-700 mb-1">Descrição na fatura do cartão</div>
                    <div aria-expanded="false">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="24px" height="24px" class="text-gray-300 ml-1 w-5 mb-1"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd"></path></svg>
                    </div>
                  </div>
                  <div class="flex items-start">
                    <span class="text-gray-500 text-sm mr-3 sm:leading-5 mt-2.5">KIWIFY*</span>
                    <div>
                      <div style="max-width: 200px;">
                        <input data-setting="card-statement" type="text" class="form-input block py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:shadow-outline-blue focus:border-blue-300 transition duration-150 ease-in-out sm:text-sm sm:leading-5 w-full">
                      </div>
                    </div>
                  </div>
                </div>

                <div class="w-full">
                  <label class="block text-sm font-medium leading-5 text-gray-700 mb-1">Parcelamento</label>
                  <select data-setting="installments" class="mt-1 form-select block w-full pl-3 pr-10 py-2 text-base leading-6 border-gray-300 focus:outline-none focus:shadow-outline-blue focus:border-blue-300 sm:text-sm sm:leading-5 transition ease-in-out duration-150">
                    <option value="1">Apenas a vista</option>
                    <option value="2">Até 2x</option>
                    <option value="3">Até 3x</option>
                    <option value="4">Até 4x</option>
                    <option value="5">Até 5x</option>
                    <option value="6">Até 6x</option>
                    <option value="7">Até 7x</option>
                    <option value="8">Até 8x</option>
                    <option value="9">Até 9x</option>
                    <option value="10">Até 10x</option>
                    <option value="11">Até 11x</option>
                    <option value="12">Até 12x</option>
                  </select>
                </div>

                <div class="flex">
                  <div>
                    <div class="flex items-center">
                      <div>
                        <div class="w-44">
                          <label class="block text-sm font-medium leading-5 text-gray-700 mb-1">Validade do boleto</label>
                          <input data-setting="boleto-validity-days" type="tel" class="form-input block py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:shadow-outline-blue focus:border-blue-300 transition duration-150 ease-in-out sm:text-sm sm:leading-5 w-full">
                        </div>
                      </div>
                      <span class="text-gray-500 ml-3 mt-6 text-sm sm:leading-5">dias corridos</span>
                    </div>
                  </div>
                </div>

                <div>
                  <div class="flex items-center">
                    <span role="checkbox" tabindex="0" aria-checked="false" class="bg-gray-200 relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:shadow-outline">
                      <span aria-hidden="true" class="inline-block h-5 w-5 rounded-full bg-white shadow transform transition ease-in-out duration-200 translate-x-0"></span>
                    </span>
                    <label class="block text-sm font-medium leading-5 text-gray-700 ml-2 cursor-pointer">Habilitar pagamento com 2 cartões</label>
                  </div>
                </div>

                <div class="flex items-center">
                  <div class="flex items-center" id="checkout.enable_card_pix_payments">
                    <span role="checkbox" tabindex="0" aria-checked="false" class="bg-gray-200 relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:shadow-outline">
                      <span aria-hidden="true" class="inline-block h-5 w-5 rounded-full bg-white shadow transform transition ease-in-out duration-200 translate-x-0"></span>
                    </span>
                    <label class="block text-sm font-medium leading-5 text-gray-700 ml-2 cursor-pointer">Habilitar pagamento com Cartão + Pix</label>
                  </div>
                </div>

                <div>
                  <div class="flex items-center">
                    <span role="checkbox" tabindex="0" aria-checked="false" class="bg-gray-200 relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:shadow-outline">
                      <span aria-hidden="true" class="inline-block h-5 w-5 rounded-full bg-white shadow transform transition ease-in-out duration-200 translate-x-0"></span>
                    </span>
                    <label class="block text-sm font-medium leading-5 text-gray-700 ml-2 cursor-pointer">Habilitar parcelamento inteligente</label>
                    <a target="_blank" href="https://ajuda.kiwify.com.br/pt-br/article/parcelamento-inteligente-razn2x/">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="24px" height="24px" class="text-gray-300 ml-1 w-5"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd"></path></svg>
                    </a>
                  </div>
                </div>

                <div>
                  <div class="flex items-center">
                    <span role="checkbox" tabindex="0" aria-checked="true" class="bg-indigo-500 relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:shadow-outline">
                      <span aria-hidden="true" class="inline-block h-5 w-5 rounded-full bg-white shadow transform transition ease-in-out duration-200 translate-x-5"></span>
                    </span>
                    <label class="block text-sm font-medium leading-5 text-gray-700 ml-2 cursor-pointer">Pedir para o comprador repetir o e-mail</label>
                  </div>
                </div>

                <div>
                  <div class="flex items-center">
                    <span role="checkbox" tabindex="0" aria-checked="false" class="bg-gray-200 relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:shadow-outline">
                      <span aria-hidden="true" class="inline-block h-5 w-5 rounded-full bg-white shadow transform transition ease-in-out duration-200 translate-x-0"></span>
                    </span>
                    <label class="block text-sm font-medium leading-5 text-gray-700 ml-2 cursor-pointer">Coletar o endereço do comprador</label>
                  </div>
                </div>

                <div>
                  <div class="flex items-center">
                    <span role="checkbox" tabindex="0" aria-checked="false" class="bg-gray-200 relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:shadow-outline">
                      <span aria-hidden="true" class="inline-block h-5 w-5 rounded-full bg-white shadow transform transition ease-in-out duration-200 translate-x-0"></span>
                    </span>
                    <label class="block text-sm font-medium leading-5 text-gray-700 ml-2 cursor-pointer">Coletar o Instagram do comprador</label>
                  </div>
                </div>

                <div class="flex items-center">
                  <span role="checkbox" tabindex="0" aria-checked="false" class="bg-gray-200 relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:shadow-outline">
                    <span aria-hidden="true" class="inline-block h-5 w-5 rounded-full bg-white shadow transform transition ease-in-out duration-200 translate-x-0"></span>
                  </span>
                  <label class="block text-sm font-medium leading-5 text-gray-700 ml-2 cursor-pointer">Conversão automática de moedas (recomendado)</label>
                  <div aria-expanded="false">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="24px" height="24px" class="text-gray-300 ml-1 w-5"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd"></path></svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <PaymentSettingsExtras />
  </div>
</template>
