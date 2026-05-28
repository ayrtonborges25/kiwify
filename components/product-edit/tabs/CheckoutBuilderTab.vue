<template>
  <div id="checkout-builder">
    <div>
      <div class="bg-white p-4 flex flex-wrap justify-between">
        <div class="w-full md:w-auto">
          <div class="relative rounded-md shadow-sm">
            <input placeholder="Buscar...." class="form-input block w-full pr-10 p-2 sm:text-sm sm:leading-5">
            <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="24px" height="24px" class="search h-5 w-5 text-indigo-500"><path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd"></path></svg>
            </div>
          </div>
        </div>
        <button type="button" class="cursor-pointer inline-flex items-center px-3 py-2 border border-gray-300 text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:text-gray-500 focus:outline-none focus:border-blue-300 focus:shadow-outline-blue active:text-gray-800 active:bg-gray-50 transition ease-in-out duration-150">
          Criar novo checkout
        </button>
      </div>
      <div class="w-full">
        <div class="flex flex-col">
          <div class="overflow-x-auto md:overflow-visible">
            <div class="align-middle inline-block min-w-full">
              <table class="kiwi-table min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th class="text-left px-6 py-3 border-b border-gray-200 bg-gray-50 text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                    <th class="text-left px-6 py-3 border-b border-gray-200 bg-gray-50 text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">Oferta</th>
                    <th class="text-left px-6 py-3 border-b border-gray-200 bg-gray-50 text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider"></th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                  <tr class="bg-white">
                    <td>
                      <div class="flex items-center">
                        <span class="text-sm leading-5 font-medium text-gray-900">Checkout A</span>
                        <span class="ml-3 inline-flex items-center rounded-full transition-colors linear duration-200 font-medium leading-4 text-xs py-0.5 px-2.5 bg-indigo-100 text-indigo-800">Padrão</span>
                      </div>
                    </td>
                    <td>
                      <div class="text-sm leading-5 text-gray-500"></div>
                    </td>
                    <td>
                      <div class="flex justify-end mr-2">
                        <div class="relative inline-block">
                          <div slot="reference">
                            <span class="rounded-md block shadow-sm relative dropdown-trigger">
                              <button id="options-menu" class="inline-flex justify-center w-full rounded-md border border-gray-300 p-2 bg-white text-sm leading-5 font-medium text-gray-700 hover:text-gray-500 focus:outline-none focus:shadow-outline-indigo active:bg-gray-50 active:text-gray-800 transition ease-in-out duration-150">
                                <svg fill="currentColor" viewBox="0 0 20 20" class="h-5 w-5"><path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"></path></svg>
                              </button>
                            </span>
                          </div>
                          <div class="dropdown z-50" style="display: none;">
                            <div class="min-w-scale z-50 rounded-md shadow-lg" style="display: none;">
                              <div class="rounded-md bg-white shadow-xs">
                                <div class="py-1 cursor-pointer">
                                  <div role="menuitem" class="group flex cursor-pointer items-center px-4 py-2 gap-x-3 text-sm leading-5 text-gray-700 hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:bg-gray-100 focus:text-gray-900">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="24px" height="24px" class="h-5 w-5 text-gray-400 group-hover:text-gray-500 group-focus:text-gray-500" style="min-width: 20px; min-height: 20px;"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z"></path><path fill-rule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clip-rule="evenodd"></path></svg>
                                    <div class="flex items-center justify-between w-full"><span>Editar</span></div>
                                  </div>
                                </div>
                                <div class="border-t border-gray-100"></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
      <div class="py-4 flex justify-center">
        <div class="flex">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="24px" height="24px" class="text-indigo-500"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path></svg>
          <div class="ml-1">
            Aprenda mais sobre o
            <a target="_blank" href="https://ajuda.kiwify.com.br/pt-br/article/como-usar-o-checkout-builder-1gc0v6j/" class="text-indigo-500 underline">checkout builder</a>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
