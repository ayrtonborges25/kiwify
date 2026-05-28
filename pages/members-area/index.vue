<script setup lang="ts">
useHead({ title: 'Área de Membros' })
useLegacyKiwifyInteractions()

const { membersAreas } = useMembersArea()
const route = useRoute()
const memberSearch = ref('')

const memberTabs = ['clubs', 'courses', 'schools'] as const
type MemberTab = typeof memberTabs[number]
const activeMembersTab = computed<MemberTab>(() => {
  const tab = String(route.query.tab || 'clubs')
  return memberTabs.includes(tab as MemberTab) ? tab as MemberTab : 'clubs'
})
const membersTabClass = (tab: MemberTab) => [
  'py-1 font-medium static text-sm leading-5 rounded-md cursor-pointer px-3 transition-colors',
  activeMembersTab.value === tab ? 'text-indigo-700 bg-indigo-100' : 'text-gray-600 hover:text-gray-700 focus:outline-none'
]
const filteredMembersAreas = computed(() => {
  const search = memberSearch.value.trim().toLowerCase()
  return membersAreas.value.filter((area) => !search || area.name.toLowerCase().includes(search))
})

const selectMembersTab = (event: Event) => {
  navigateTo(`/members-area?tab=${(event.target as HTMLSelectElement).value}`)
}
</script>

<template>
  <KiwifyChrome>
    <div class="container mx-auto px-4 sm:px-8 py-8 lg:py-10 lg:px-20">
      <div class="page-header mb-8" style="height: 42px;">
        <h3 class="page-title">Área de Membros</h3>
      </div>

      <div>
        <div class="px-4 py-5 sm:p-6 bg-gray-50">
          <div class="hidden sm:block">
            <nav class="-mb-px flex relative">
              <span class="absolute z-0 -mt-0.5 text-indigo-700 bg-indigo-100 rounded-lg ease-out transition-transform transition-medium" style="height: 32px; transform: translateX(0px); width: 0px;"></span>
              <div class="relative flex items-center" style="z-index: 1;">
                <a href="/members-area?tab=clubs" :class="membersTabClass('clubs')">Áreas de membros</a>
              </div>
              <div class="relative flex items-center" style="z-index: 1;">
                <a href="/members-area?tab=courses" :class="membersTabClass('courses')">Cursos</a>
              </div>
              <div class="relative flex items-center" style="z-index: 1;">
                <a href="/members-area?tab=schools" :class="membersTabClass('schools')">Escolas</a>
              </div>
            </nav>
          </div>
          <div class="sm:hidden">
            <select :value="activeMembersTab" @change="selectMembersTab" class="mt-1 form-select block w-full pl-3 pr-10 py-2 text-base leading-6 border-gray-300 focus:outline-none focus:shadow-outline-blue focus:border-blue-300 sm:text-sm sm:leading-5 transition ease-in-out duration-150">
              <option value="clubs">Áreas de membros</option>
              <option value="courses">Cursos</option>
              <option value="schools">Escolas</option>
            </select>
          </div>
        </div>
      </div>

      <div>
        <div class="bg-white p-4 flex flex-wrap justify-between">
          <div class="w-full md:w-auto">
            <div class="relative rounded-md shadow-sm">
              <input v-model="memberSearch" placeholder="Buscar...." class="form-input block w-full pr-10 p-2 sm:text-sm sm:leading-5">
              <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="24px" height="24px" class="search h-5 w-5 text-indigo-500"><path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd"></path></svg>
              </div>
            </div>
          </div>
          <button type="button" class="md:mt-0 mt-2 inline-flex justify-center items-center text-center font-medium rounded-md border transition ease-in-out duration-150 focus:outline-none text-white bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 border-transparent focus:border-indigo-700 focus:shadow-outline-indigo leading-5 text-sm px-4 py-2 gap-2 cursor-pointer shadow-sm">Criar área de membros</button>
        </div>

        <div class="w-full">
          <div class="flex flex-col">
            <div class="overflow-x-auto md:overflow-visible">
              <div class="align-middle inline-block min-w-full">
                <table class="kiwi-table min-w-full divide-y divide-gray-200">
                  <thead>
                    <tr>
                      <th class="text-left px-6 py-3 border-b border-gray-200 bg-gray-50 text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">Nome</th>
                      <th class="text-left px-6 py-3 border-b border-gray-200 bg-gray-50 text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">URL</th>
                      <th class="text-left px-6 py-3 border-b border-gray-200 bg-gray-50 text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">Alunos</th>
                    </tr>
                  </thead>
                  <tbody class="bg-white divide-y divide-gray-200">
                    <tr v-for="(area, index) in filteredMembersAreas" :key="area.id" :class="index % 2 ? 'bg-gray-50' : 'bg-white'">
                      <td>
                        <NuxtLink :to="`/members-area/${area.id}?tab=courses`" class="hover:underline font-medium truncate text-sm max-w-sm block">{{ area.name }}</NuxtLink>
                      </td>
                      <td>
                        <input readonly="readonly" :value="`/members-area/${area.id}`" class="form-input block w-full py-2 px-3 text-sm border border-gray-300 rounded-md shadow-sm focus:outline-none focus:shadow-outline-blue focus:border-blue-300 transition duration-150 ease-in-out sm:text-sm sm:leading-5" style="min-width: 8rem;">
                      </td>
                      <td><span class="text-sm leading-5 text-gray-500">{{ area.students }}</span></td>
                    </tr>
                    <tr v-if="!filteredMembersAreas.length" class="bg-white">
                      <td colspan="3" class="px-6 py-8 text-center text-sm text-gray-500">Nenhuma área de membros encontrada</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <div class="w-full">
            <div class="bg-white flex items-center justify-between border-t border-gray-200 px-4 py-3 sm:px-6">
              <div class="flex-1 flex items-center justify-between sm:hidden">
                <div class="relative inline-flex cursor-pointer items-center px-4 py-2 border border-gray-300 text-sm leading-5 font-medium rounded-md text-gray-700 bg-white hover:text-gray-500 focus:outline-none focus:shadow-outline-blue focus:border-blue-300 active:bg-gray-100 active:text-gray-700 transition ease-in-out duration-150">Anterior</div>
                <div class="px-2"><p class="text-sm leading-5 text-gray-700"><span class="font-medium">1</span> / <span class="font-medium">1</span> página</p></div>
                <div class="ml-3 relative inline-flex cursor-pointer items-center px-4 py-2 border border-gray-300 text-sm leading-5 font-medium rounded-md text-gray-700 bg-white hover:text-gray-500 focus:outline-none focus:shadow-outline-blue focus:border-blue-300 active:bg-gray-100 active:text-gray-700 transition ease-in-out duration-150">Próximo</div>
              </div>
              <div class="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                <div><p class="text-sm leading-5 text-gray-700">Exibindo <span class="font-medium">1</span> de <span class="font-medium">1</span> página</p></div>
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
            <div class="ml-1">Aprenda mais sobre a <a target="_blank" href="https://ajuda.kiwify.com.br/pt-br/article/area-de-membros-bd1g7w/?1604494742535" class="text-indigo-500 underline">área de membros</a></div>
          </div>
        </div>
      </div>
    </div>
  </KiwifyChrome>
</template>
