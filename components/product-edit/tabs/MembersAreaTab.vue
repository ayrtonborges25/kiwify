<script setup lang="ts">
const route = useRoute()
const productId = computed(() => String(route.params.id || 'ae3c3610-f0af-11f0-b85d-45218e98c266'))
const { getProductById } = useProducts()
const product = computed(() => getProductById(productId.value))
const { getMembersAreaById } = useMembersArea()
const { offersEnabled, offers } = useProductOffers(productId, product)

const selectedMembersAreaId = computed(() => product.value?.membersAreaId || '')
const selectedMembersArea = computed(() => selectedMembersAreaId.value ? getMembersAreaById(selectedMembersAreaId.value) : undefined)
const selectedMembersAreaName = computed(() => selectedMembersArea.value?.name || product.value?.name || 'Área de membros')
const membersAreaEditorPath = computed(() => selectedMembersAreaId.value ? `/members-area/${selectedMembersAreaId.value}` : '/members-area')

const groupOptions = [
  { value: '', label: 'Grupo padrão (Área de membros)' },
  { value: '5287f37c-7e37-4f28-a4f5-8561d20391b8', label: '[COPY] Fotógrafo Blindado' },
  { value: '59beff5a-6412-4827-a7b8-8ded9b9c4747', label: 'Área de membros' },
  { value: '5d4c130f-03f6-4450-b212-ca2d1fb37116', label: '[COPY] Retratista Digital - NETCLIK' },
  { value: 'b547f044-2d30-4b5f-a68c-d2ac29df5913', label: 'La Casa de Pincél - Por Ayrton Borges' },
  { value: 'e21a6846-1cca-4771-8d37-7e2af0e98f4b', label: '[COPY] Robô do Lightroom -  Por Henrique Ribas' },
  { value: 'e7bfbfb7-a557-450e-a6c0-857082023a88', label: 'Clube dos fotógrafos' },
  { value: 'e8a05a98-85bd-48a9-8d34-6a47afe5be00', label: '[COPY] Orçamento FODA - para fotógrafos' }
]

const normalizePrice = (price?: string) => {
  const value = String(price || '').trim()
  if (!value) return ''
  return value.startsWith('R$') || /^[A-Z]{3}\s/.test(value) ? value : `R$ ${value}`
}

const accessRows = computed(() => {
  const currentProduct = product.value
  const productName = currentProduct?.name || 'Produto'
  const productPrice = normalizePrice(currentProduct?.price || 'R$ 0,00')

  if (!offersEnabled.value) {
    return [
      {
        id: `${productId.value}-default`,
        name: productName,
        price: productPrice
      }
    ]
  }

  const rows = offers.value
    .filter((offer) => offer.name.trim() || offer.price.trim())
    .map((offer) => ({
      id: offer.id,
      name: offer.name.trim() || productName,
      price: normalizePrice(offer.price || productPrice)
    }))

  return rows.length ? rows : [{ id: `${productId.value}-default`, name: productName, price: productPrice }]
})
</script>

<template>
  <div id="members-area">
    <div class="v-portal" style="display: none;"></div>
    <div class="mt-10">
      <div class="md:grid md:grid-cols-3 md:gap-6">
        <div class="md:col-span-1">
          <h3 class="text-lg font-medium leading-6 text-gray-900">Área de Membros</h3>
          <p class="mt-1 desc text-sm leading-5 text-gray-500">Ao comprar esse produto, o aluno será automaticamente adicionado na área de membros selecionada.</p>
        </div>
        <div class="mt-5 md:mt-0 md:col-span-2">
          <div class="relative">
            <div class="px-4 py-5 bg-white sm:p-6 rounded-lg">
              <div>
                <fieldset class="form-field transition-all ease-in-out duration-300 relative">
                  <label for="product-club_wrapper" class="form-field__label font-medium leading-5 text-sm text-gray-700 inline-flex flex-no-wrap flex-row items-center gap-1 mb-1"><div>Área de Membros</div></label>
                  <div class="flex flex-row items-center gap-3 min-w-0 opacity-100">
                    <div class="flex-1 relative min-w-0">
                      <div id="product-club" dir="auto" class="v-select vs--single vs--searchable input-vue-select w-full lg:w-1/2">
                        <div id="vs81__combobox" role="combobox" aria-expanded="false" aria-owns="vs81__listbox" aria-label="Search for option" class="vs__dropdown-toggle">
                          <div class="vs__selected-options"><span class="vs__selected">{{ selectedMembersAreaName }}</span> <input autocomplete="off" spellcheck="false" type="search" aria-autocomplete="list" aria-labelledby="vs81__combobox" aria-controls="vs81__listbox" class="vs__search"></div>
                          <div class="vs__actions"><button type="button" title="Clear Selected" aria-label="Clear Selected" class="vs__clear" style="display: none;"><svg xmlns="http://www.w3.org/2000/svg" width="10" height="10"><path d="M6.895455 5l2.842897-2.842898c.348864-.348863.348864-.914488 0-1.263636L9.106534.261648c-.348864-.348864-.914489-.348864-1.263636 0L5 3.104545 2.157102.261648c-.348863-.348864-.914488-.348864-1.263636 0L.261648.893466c-.348864.348864-.348864.914489 0 1.263636L3.104545 5 .261648 7.842898c-.348864.348863-.348864.914488 0 1.263636l.631818.631818c.348864.348864.914773.348864 1.263636 0L5 6.895455l2.842898 2.842897c.348863.348864.914772.348864 1.263636 0l.631818-.631818c.348864-.348864.348864-.914489 0-1.263636L6.895455 5z"></path></svg></button> <svg xmlns="http://www.w3.org/2000/svg" width="14" height="10" role="presentation" class="vs__open-indicator"><path d="M9.211364 7.59931l4.48338-4.867229c.407008-.441854.407008-1.158247 0-1.60046l-.73712-.80023c-.407008-.441854-1.066904-.441854-1.474243 0L7 5.198617 2.51662.33139c-.407008-.441853-1.066904-.441853-1.474243 0l-.737121.80023c-.407008.441854-.407008 1.158248 0 1.600461l4.48338 4.867228L7 10l2.211364-2.40069z"></path></svg> <div class="vs__spinner" style="display: none;">Loading...</div></div>
                        </div>
                        <ul id="vs81__listbox" role="listbox" style="display: none; visibility: hidden;"></ul>
                      </div>
                    </div>
                  </div>
                </fieldset>
              </div>
              <div class="mt-2">
                <NuxtLink :to="membersAreaEditorPath" target="_blank" color="text-indigo-500" spacing="py-0.5 px-1 -my-0.5 -mx-1" class="inline-block text-sm text-indigo-500 py-0.5 px-1 -my-0.5 -mx-1 rounded-md outline-none focus:outline-none focus:shadow-outline-indigo transition-all ease-in-out duration-300 opacity-100 cursor-pointer"><span class="inline-block underline">Abrir editor da área de membros</span> <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="24px" height="24px" class="inline-block w-4 h-4"><path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z"></path><path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z"></path></svg></NuxtLink>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="mt-10">
      <div class="md:grid md:grid-cols-3 md:gap-6">
        <div class="md:col-span-1">
          <h3 class="text-lg font-medium leading-6 text-gray-900">Controle de Acesso</h3>
          <p class="mt-1 desc text-sm leading-5 text-gray-500"></p>
        </div>
        <div class="mt-5 md:mt-0 md:col-span-2">
          <div class="relative">
            <div class="px-4 py-5 bg-white sm:p-6 rounded-lg">
              <div class="w-full access-control-table">
                <div class="flex flex-col">
                  <div class="overflow-x-auto md:overflow-visible">
                    <div class="align-middle inline-block min-w-full">
                      <table class="kiwi-table min-w-full divide-y divide-gray-200">
                        <thead>
                          <tr>
                            <th class="text-left px-6 py-3 border-b border-gray-200 bg-gray-50 text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">Oferta</th>
                            <th class="text-left px-6 py-3 border-b border-gray-200 bg-gray-50 text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">Valor</th>
                            <th class="text-left px-6 py-3 border-b border-gray-200 bg-gray-50 text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">Grupo</th>
                          </tr>
                        </thead>
                        <tbody class="bg-white divide-y divide-gray-200">
                          <tr v-for="(row, index) in accessRows" :key="row.id" :class="index % 2 ? 'bg-gray-50' : 'bg-white'">
                            <td class="w-5/12"><div class="text-sm leading-5 text-gray-900 font-medium">{{ row.name }}</div></td>
                            <td class="w-2/12"><div class="text-sm leading-5 text-gray-500">{{ row.price }}</div></td>
                            <td class="w-5/12">
                              <select class="form-select shadow-sm block w-full pl-3 pr-10 py-2 text-base sm:text-sm leading-6 sm:leading-5 border-gray-300 focus:border-blue-300 focus:outline-none focus:shadow-outline-blue transition ease-in-out duration-150">
                                <option v-for="option in groupOptions" :key="option.value" :value="option.value">{{ option.label }}</option>
                              </select>
                            </td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
                <div class="w-full"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
