<script setup lang="ts">
import { complexFieldState, openImagePicker } from '~/composables/useComplexFieldMocks'

const route = useRoute()
const { getProductById } = useProducts()
const productId = computed(() => String(route.params.id || 'ae3c3610-f0af-11f0-b85d-45218e98c266'))
const product = computed(() => getProductById(productId.value))
const { currencies, offersEnabled, offers, addOffer, removeOffer, updateOffer, toggleOffersEnabled } = useProductOffers(productId, product)
const productImage = computed(() => complexFieldState.files['product-image'] || product.value?.imageUrl || '')

const updateOfferField = (offerId: string, field: 'name' | 'price' | 'currency', event: Event) => {
  const target = event.target as HTMLInputElement | HTMLSelectElement
  updateOffer(offerId, { [field]: target.value })
}

const removeProductImage = () => {
  complexFieldState.files['product-image'] = ''
  delete complexFieldState.fileObjects['product-image']
}
</script>

<template>
  <div id="general">
    <div class="mt-10">
      <div class="md:grid md:grid-cols-3 md:gap-6">
        <div class="md:col-span-1">
          <h3 class="text-lg font-medium leading-6 text-gray-900">Produto</h3>
          <p class="mt-1 desc text-sm leading-5 text-gray-500">Você pode cadastrar o produto e já começar a vender. <br> A imagem do produto será exibida na área de membros e no seu programa de afiliados.</p>
        </div>
        <div class="mt-5 md:mt-0 md:col-span-2">
          <div class="relative">
            <div class="px-4 py-5 bg-white sm:p-6 rounded-lg">
              <div>
                <div>
                  <label for="255e6d99-599e-4615-8da9-dcf0f12a8171" class="flex items-center text-sm font-medium leading-5 text-gray-700 mb-1">Nome do produto</label>
                  <input id="255e6d99-599e-4615-8da9-dcf0f12a8171" type="text" autocomplete="off" data-lpignore="true" class="form-input block py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:shadow-outline-blue focus:border-blue-300 transition duration-150 ease-in-out sm:text-sm sm:leading-5 mask-user-input w-full">
                </div>
              </div>
              <div class="mt-4">
                <div class="w-full">
                  <label class="block text-sm font-medium leading-5 text-gray-700 mb-1">Descrição</label>
                  <textarea placeholder="Explique o seu produto em pelo menos 100 caracteres" rows="3" class="form-input w-full block py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:shadow-outline-blue focus:border-blue-300 transition duration-150 ease-in-out sm:text-sm sm:leading-5"></textarea>
                </div>
              </div>
              <div class="w-auto max-w-xs mt-6">
                <div>
                  <label class="block text-sm font-medium leading-5 text-gray-700 mb-1"> Categoria </label>
                  <select class="form-select shadow-sm block w-full pl-3 pr-10 py-2 text-base leading-6 border-gray-300 focus:outline-none focus:shadow-outline-blue focus:border-blue-300 sm:text-sm sm:leading-5 transition ease-in-out duration-150">
                    <option value="999">Selecione uma categoria</option>
                    <option value="0">Saúde e Esportes</option>
                    <option value="1">Finanças e Investimentos</option>
                    <option value="2">Relacionamentos</option>
                    <option value="3">Negócios e Carreira</option>
                    <option value="4">Espiritualidade</option>
                    <option value="5">Sexualidade</option>
                    <option value="6">Entretenimento</option>
                    <option value="7">Culinária e Gastronomia</option>
                    <option value="8">Idiomas</option>
                    <option value="9">Direito</option>
                    <option value="10">Apps &amp; Software</option>
                    <option value="11">Literatura</option>
                    <option value="12">Casa e Construção</option>
                    <option value="13">Desenvolvimento Pessoal</option>
                    <option value="14">Moda e Beleza</option>
                    <option value="15">Animais e Plantas</option>
                    <option value="16">Educacional</option>
                    <option value="17">Hobbies</option>
                    <option value="18">Internet</option>
                    <option value="19">Ecologia e Meio Ambiente</option>
                    <option value="20">Música e Artes</option>
                    <option value="21">Tecnologia da Informação</option>
                    <option value="22">Empreendedorismo Digital</option>
                    <option value="23">Outros</option>
                  </select>
                </div>
              </div>
              <div class="mt-6">
                <label class="label">Imagem do produto</label>
                <template v-if="productImage">
                  <img :src="productImage" :alt="productImage" class="w-48 cursor-pointer" @click.stop="openImagePicker('product-image')">
                  <button type="button" class="mt-2 text-sm text-indigo-600 underline cursor-pointer" @click.stop="removeProductImage">Remover imagem</button>
                </template>
                <button v-else type="button" id="fileproduct-image" class="hover:bg-gray-50 cursor-pointer flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 transition duration-300 border-dashed rounded-md items-center w-full" style="height: 250px;" @click.stop="openImagePicker('product-image')">
                  <div class="space-y-1 text-center">
                    <svg stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true" class="mx-auto h-12 w-12 text-gray-400">
                      <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28m0 0l-4-4a4 4 0 00-5.656 0L8 34m20-6l4 4m0 0l8-8m-8 8v-8" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
                    </svg>
                    <div class="flex text-sm text-gray-600 justify-center">
                      <span>Arraste aqui ou&nbsp;</span>
                      <span class="font-medium text-indigo-600 hover:text-indigo-500">selecione do computador</span>
                    </div>
                  </div>
                </button>
                <div class="mt-2 bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-8">
                  <div class="flex items-center">
                    <div class="flex-shrink-0">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="24px" height="24px" class="text-yellow-400"><path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z"></path></svg>
                    </div>
                    <div class="ml-3">
                      <p class="text-sm leading-5 text-yellow-700">Tamanho recomendado: 300x250 pixels</p>
                    </div>
                  </div>
                </div>
              </div>
              <div class="mt-6 w-60">
                <div class="flex items-center mb-1">
                  <label class="block text-sm font-medium leading-5 text-gray-700">Idioma dos emails</label>
                  <div aria-expanded="false"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="24px" height="24px" class="text-gray-300 ml-1 w-5"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd"></path></svg></div>
                </div>
                <div>
                  <select class="form-select shadow-sm block w-full pl-3 pr-10 py-2 text-base leading-6 border-gray-300 focus:outline-none focus:shadow-outline-blue focus:border-blue-300 sm:text-sm sm:leading-5 transition ease-in-out duration-150">
                    <option value="PT">Português</option>
                    <option value="EN">English</option>
                    <option value="ES">Espanhol</option>
                  </select>
                </div>
              </div>
              <div class="mt-6 w-60">
                <label class="block text-sm font-medium leading-5 text-gray-700 mb-1">Página de vendas</label>
                <div class="relative rounded-md shadow-sm">
                  <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="24px" height="24px" class="w-5 h-5 text-gray-400"><path fill-rule="evenodd" d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 101.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" clip-rule="evenodd"></path></svg></div>
                  <input placeholder="https://example.com" class="form-input block w-full pl-10 sm:text-sm sm:leading-5">
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
          <h3 class="text-lg font-medium leading-6 text-gray-900">Preços</h3>
          <p class="mt-1 desc text-sm leading-5 text-gray-500"></p>
        </div>
        <div class="mt-5 md:mt-0 md:col-span-2">
          <div class="relative">
            <div class="px-4 py-5 bg-white sm:p-6 rounded-lg">
              <div class="grid grid-cols-12 gap-4">
                <div class="col-span-9 sm:col-span-4">
                  <fieldset>
                    <label class="form-field__label font-medium leading-5 text-sm text-gray-700 inline-flex flex-no-wrap flex-row items-center gap-1 mb-1">Preço</label>
                    <div class="relative">
                      <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><span class="text-gray-500 sm:text-sm sm:leading-5">R$</span></div>
                      <div class="absolute inset-y-0 right-0 pr-3 pl-3 border-l rounded-r-md flex items-center pointer-events-auto">
                        <select class="bg-transparent border-none text-gray-500 sm:text-sm sm:leading-5">
                          <option v-for="currency in currencies" :key="currency" :value="currency">{{ currency }}</option>
                        </select>
                      </div>
                      <input type="tel" class="v-money form-input block border border-gray-300 rounded-md shadow-sm focus:outline-none focus:shadow-outline-blue focus:border-blue-300 transition duration-150 ease-in-out sm:text-sm sm:leading-5 w-full pl-8 pr-20" symbol="R$" minvalue="5" maxvalue="500000" formattedmin="R$ 5,00" formattedmax="R$ 500.000,00">
                    </div>
                  </fieldset>
                </div>
              </div>

              <div>
                <div class="mt-6">
                  <fieldset class="form-field transition-all ease-in-out duration-300">
                    <div class="flex flex-row items-center gap-3 min-w-0 opacity-100">
                      <div class="flex-1 relative min-w-0">
                        <label class="input-toggle__wrapper flex flex-row gap-2 items-start cursor-pointer transition-opacity ease duration-300 opacity-100" @click.stop.prevent="toggleOffersEnabled">
                          <span class="input-toggle__checkbox relative inline-flex flex-shrink-0">
                            <span id="product__offers__toggle" class="input-toggle__checkbox__input appearance-none block h-6 w-11 border-2 border-transparent rounded-full transition-colors ease-in-out duration-200 focus:outline-none cursor-pointer" :class="offersEnabled ? 'bg-indigo-500' : 'bg-gray-200'"></span>
                            <span class="input-toggle__checkbox__mark absolute top-0.5 left-0.5 block h-5 w-5 bg-white rounded-full shadow cursor-pointer transform transition ease-in-out duration-200" :class="offersEnabled ? 'translate-x-5' : 'translate-x-0'"></span>
                          </span>
                          <span class="form-field__label font-medium leading-5 text-sm text-gray-700 inline-flex flex-no-wrap flex-row items-center gap-1 mb-0 input-toggle__label flex-1 text-left pt-0.5"><span>Esse produto tem diferentes ofertas</span></span>
                        </label>
                      </div>
                    </div>
                  </fieldset>
                </div>

                <div v-show="offersEnabled" class="mt-8">
                  <div class="k-scroll k-scroll--vertical relative bg-white">
                    <div class="k-scroll__content relative overflow-y-auto k-scroll__content--light" style="max-height: 29.125rem;">
                      <div class="grid grid-cols-12 gap-4 items-end">
                        <div class="col-span-12">
                          <div class="block text-sm font-medium leading-5 text-gray-700 mb-1">Ofertas</div>
                        </div>
                        <div class="col-span-5">
                          <label class="block text-sm font-medium leading-5 text-gray-700 mb-1">Nome</label>
                        </div>
                        <div class="col-span-5">
                          <label class="block text-sm font-medium leading-5 text-gray-700 mb-1">Preço</label>
                        </div>
                        <div class="col-span-2"></div>
                      </div>
                      <div v-for="offer in offers" :key="offer.id" class="grid grid-cols-12 gap-4 items-center mt-4">
                        <div class="col-span-5">
                          <input :value="offer.name" type="text" autocomplete="off" data-lpignore="true" class="form-input block py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:shadow-outline-blue focus:border-blue-300 transition duration-150 ease-in-out sm:text-sm sm:leading-5 mask-user-input w-full" @input="updateOfferField(offer.id, 'name', $event)">
                        </div>
                        <div class="col-span-5">
                          <fieldset>
                            <div class="relative">
                              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none"><span class="text-gray-500 sm:text-sm sm:leading-5">R$</span></div>
                              <div class="absolute inset-y-0 right-0 pr-3 pl-3 border-l rounded-r-md flex items-center pointer-events-auto">
                                <select :value="offer.currency" class="bg-transparent border-none text-gray-500 sm:text-sm sm:leading-5" @change="updateOfferField(offer.id, 'currency', $event)">
                                  <option v-for="currency in currencies" :key="currency" :value="currency">{{ currency }}</option>
                                </select>
                              </div>
                              <input :value="offer.price" type="tel" class="v-money form-input block border border-gray-300 rounded-md shadow-sm focus:outline-none focus:shadow-outline-blue focus:border-blue-300 transition duration-150 ease-in-out sm:text-sm sm:leading-5 w-full pl-8 pr-20" symbol="R$" minvalue="5" maxvalue="500000" formattedmin="R$ 5,00" formattedmax="R$ 500.000,00" @input="updateOfferField(offer.id, 'price', $event)">
                            </div>
                          </fieldset>
                        </div>
                        <div class="flex justify-start col-span-2">
                          <button type="button" class="px-2" @click.stop="removeOffer(offer.id)">
                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="24px" height="24px" class="text-red-600 w-6 h-6 cursor-pointer md:block"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path></svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                  <span class="mt-6 flex items-center justify-between gap-2">
                    <div class="flex items-center gap-4">
                      <button id="product-offers__add" type="button" class="inline-flex justify-center items-center text-center font-medium rounded-md border transition ease-in-out duration-150 focus:outline-none text-white bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 border-transparent focus:border-indigo-700 focus:shadow-outline-indigo leading-4 text-sm px-3 py-2 gap-2 cursor-pointer shadow-sm" @click.stop="addOffer">Adicionar outro</button>
                      <i class="text-sm text-gray-500">{{ offers.length }}/300</i>
                    </div>
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
