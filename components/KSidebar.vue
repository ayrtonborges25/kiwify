<script setup lang="ts">
const route = useRoute()
const { currentUser } = useCurrentUser()
const kiwifyLogo = computed(() => currentUser.value.branding.kiwifyLogo)
const companyName = computed(() => currentUser.value.company)
const teamMenuOpen = ref(false)

const toggleTeamMenu = () => {
  teamMenuOpen.value = !teamMenuOpen.value
}

onMounted(() => {
  document.addEventListener('click', () => {
    teamMenuOpen.value = false
  })
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') teamMenuOpen.value = false
  })
})

const items = [
  { label: 'Dashboard', to: '/dashboard', activeFor: ['/dashboard'], path: 'M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z' },
  { label: 'Produtos', to: '/products', activeFor: ['/products'], path: 'M17.707 9.293a1 1 0 010 1.414l-7 7a1 1 0 01-1.414 0l-7-7A.997.997 0 012 10V5a3 3 0 013-3h5c.256 0 .512.098.707.293l7 7zM5 6a1 1 0 100-2 1 1 0 000 2z' },
  { label: 'Área de Membros', to: '/members-area', activeFor: ['/members-area'], path: 'M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z' },
  { label: 'Marketplace', to: '/marketplace', activeFor: ['/marketplace'], path: 'M3 1a1 1 0 000 2h1.22l.305 1.222a.997.997 0 00.01.042l1.358 5.43-.893.892C3.74 11.846 4.632 14 6.414 14H15a1 1 0 000-2H6.414l1-1H14a1 1 0 00.894-.553l3-6A1 1 0 0017 3H6.28l-.31-1.243A1 1 0 005 1H3zM16 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM6.5 18a1.5 1.5 0 100-3 1.5 1.5 0 000 3z' },
  { label: 'Meus Afiliados', to: '/myaffiliates', activeFor: ['/myaffiliates'], path: 'M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z' },
  { label: 'Vendas', to: '/sales', activeFor: ['/sales'], path: 'M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z' },
  { label: 'Assinaturas', to: '/subscriptions', activeFor: ['/subscriptions'], path: 'M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z' },
  { label: 'Financeiro', to: '/finance', activeFor: ['/finance'], path: 'M4 4a2 2 0 00-2 2v1h16V6a2 2 0 00-2-2H4zM18 9H2v5a2 2 0 002 2h12a2 2 0 002-2V9zM4 13a1 1 0 011-1h1a1 1 0 110 2H5a1 1 0 01-1-1zm5-1a1 1 0 100 2h1a1 1 0 100-2H9z' },
  { label: 'Relatórios', to: '/reports', activeFor: ['/reports'], path: 'M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z' },
  { label: 'Colaboradores', to: '/team-members', activeFor: ['/team-members'], path: 'M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z' },
  { label: 'Apps', to: '/apps', activeFor: ['/apps'], path: 'M11 17a1 1 0 001.447.894l4-2A1 1 0 0017 15V9.236a1 1 0 00-1.447-.894l-4 2a1 1 0 00-.553.894V17zM15.211 6.276a1 1 0 000-1.788l-4.764-2.382a1 1 0 00-.894 0L4.789 4.488a1 1 0 000 1.788l4.764 2.382a1 1 0 00.894 0l4.764-2.382zM4.447 8.342A1 1 0 003 9.236V15a1 1 0 00.553.894l4 2A1 1 0 009 17v-5.764a1 1 0 00-.553-.894l-4-2z' },
  { label: 'Ajuda', to: '/dashboard', activeFor: [], path: 'M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z' }
]
</script>

<template>
  <div class="hidden sticky top-0 h-screen md:flex md:flex-shrink-0">
    <div class="flex flex-col w-64">
      <div class="flex flex-col flex-grow overflow-y-auto bg-green-600">
        <div class="flex items-center flex-shrink-0 px-2 py-1">
          <button type="button" class="px-2 w-full rounded-md focus:outline-none text-white leading-5 font-medium transition ease-in-out duration-150 hover:bg-green-500" :aria-expanded="teamMenuOpen" @click.stop="toggleTeamMenu">
            <div class="flex flex-shrink-0 items-center w-full py-2">
              <img :src="kiwifyLogo" alt="Workflow" class="h-10 w-auto mr-2">
              <div class="truncate w-36 text-left">{{ companyName }}</div>
              <svg viewBox="0 0 20 20" fill="currentColor" class="h-5 ml-2 block"><path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"></path></svg>
            </div>
          </button>
          <div v-if="teamMenuOpen" class="dropdown z-500" style="position: absolute; inset: 58px auto auto 8px; margin: 0px; display: block;">
            <div class="mr-6 z-500" style="display: block;">
              <fieldset>
                <a href="/dashboard" class="bg-white block border -space-y-px hover:bg-indigo-50 cursor-pointer bg-indigo-50 border-indigo-200 z-10 rounded-t-md rounded-b-md" style="width: 250px;" @click.stop="teamMenuOpen = false">
                  <div class="relative p-4 flex">
                    <div class="flex items-center h-5">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="24px" height="24px" class="text-indigo-500"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path></svg>
                    </div>
                    <label class="ml-3 cursor-pointer truncate"><span class="block text-sm leading-5 font-medium truncate text-indigo-500">{{ companyName }}</span></label>
                  </div>
                </a>
              </fieldset>
            </div>
          </div>
        </div>
        <div class="flex-1 flex flex-col">
          <nav class="flex-1 px-2 pt-2 relative bg-gray-800">
            <NuxtLink
              v-for="item in items"
              :key="item.label"
              :to="item.to"
              class="group flex items-center hover:scale-105 transform px-2 py-2 text-sm leading-5 font-medium rounded-md focus:outline-none transition ease-in-out duration-150 cursor-pointer mt-1 text-gray-200 hover:bg-gray-700 hover:text-white focus:outline-none"
              :class="{ 'bg-gray-900 text-white': item.activeFor.some((path) => route.path === path || route.path.startsWith(`${path}/`)) }"
            >
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="24px" height="24px" class="mr-3 h-6 w-6 text-gray-400 group-hover:text-gray-300 group-focus:text-gray-300 transition ease-in-out duration-150">
                <path fill-rule="evenodd" clip-rule="evenodd" :d="item.path"></path>
              </svg>
              {{ item.label }}
            </NuxtLink>
          </nav>
        </div>
      </div>
    </div>
  </div>
</template>
