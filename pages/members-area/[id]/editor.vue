<script setup lang="ts">
useHead({ title: 'Editar Área de Membros' })

const route = useRoute()
const { getMembersAreaById, saveMembersAreaCustomization } = useMembersArea()

const membersAreaId = computed(() => String(route.params.id || 'c6d46bd7-9ced-4fb2-a4a0-ae033e3b612a'))
const membersArea = computed(() => getMembersAreaById(membersAreaId.value))
const areaName = computed(() => membersArea.value?.name || 'Figurinhas da Copa 2026')
const coverUrl = computed(() => membersArea.value?.coverUrl || '')
const areaPath = computed(() => `/members-area/${membersAreaId.value}?tab=settings`)
const saving = ref(false)
const customization = reactive({
  logoUrl: '',
  bannerUrl: '',
  primaryColor: '#4f46e5',
  sidebarColor: '#facc15',
  backgroundColor: '#080808',
  textColor: '#ffffff',
  brandName: 'RETRATISTAS DIGITAIS',
  homeLabel: 'Home',
  instagramLabel: 'Instagram',
  supportLabel: 'Suporte',
  heroTitle: '',
  modulesTitle: 'Uma seção pode conter módulos',
  visibleSections: ['banner', 'modules'] as string[]
})
const activeBannerUrl = computed(() => customization.bannerUrl || coverUrl.value)
const hasSection = (section: string) => customization.visibleSections.includes(section)
const toggleSection = (section: string) => {
  customization.visibleSections = hasSection(section)
    ? customization.visibleSections.filter((item) => item !== section)
    : [...customization.visibleSections, section]
}
const hydrateCustomization = () => {
  Object.assign(customization, {
    ...customization,
    ...(membersArea.value?.customization || {}),
    heroTitle: membersArea.value?.customization?.heroTitle || areaName.value,
    bannerUrl: membersArea.value?.customization?.bannerUrl || coverUrl.value
  })
}
const saveCustomization = async () => {
  saving.value = true
  try {
    await saveMembersAreaCustomization(membersAreaId.value, { ...customization })
  } finally {
    saving.value = false
  }
}

watch(membersArea, hydrateCustomization, { immediate: true })
</script>

<template>
  <div class="min-h-screen bg-white text-gray-900 editor-shell">
    <header class="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6">
      <div class="flex items-center min-w-0 gap-5">
        <NuxtLink :to="areaPath" class="text-gray-600 hover:text-gray-900">
          <svg class="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>
        </NuxtLink>
        <span class="truncate text-base font-medium text-gray-700">{{ areaName }}</span>
      </div>

      <nav class="hidden lg:flex items-center h-full text-gray-600">
        <button type="button" class="h-10 px-4 rounded-md border border-indigo-500 text-indigo-600 bg-indigo-50 flex items-center gap-2 font-medium">
          <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7A1 1 0 003 11h1v5a1 1 0 001 1h3v-4h4v4h3a1 1 0 001-1v-5h1a1 1 0 00.707-1.707l-7-7z"></path></svg>
          Início
        </button>
        <button type="button" class="h-10 px-4 flex items-center gap-2 font-medium">
          <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm1 4a1 1 0 100 2h12a1 1 0 100-2H4z" clip-rule="evenodd"></path></svg>
          Menu
        </button>
        <button type="button" class="h-10 px-4 flex items-center gap-2 font-medium">
          <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20"><path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6zM16.5 7.5a1 1 0 00-1 1V10H14a1 1 0 100 2h1.5v1.5a1 1 0 102 0V12H19a1 1 0 100-2h-1.5V8.5a1 1 0 00-1-1z"></path></svg>
          Login
        </button>
        <button type="button" class="h-10 px-4 flex items-center gap-2 font-medium">
          <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.53 1.53 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106a1.53 1.53 0 01-.947 2.287c-1.561.379-1.561 2.6 0 2.978a1.53 1.53 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.53 1.53 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.53 1.53 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.53 1.53 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.53 1.53 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.53 1.53 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd"></path></svg>
          Configurações
        </button>
      </nav>

      <div class="flex items-center gap-4">
        <div class="hidden md:flex items-center border-l border-gray-200 pl-4 gap-3 text-gray-500">
          <button type="button" class="p-2"><svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h10a5 5 0 015 5v2M3 10l5-5M3 10l5 5"></path></svg></button>
          <button type="button" class="p-2 text-gray-300"><svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 10H11a5 5 0 00-5 5v2m15-7l-5-5m5 5l-5 5"></path></svg></button>
          <button type="button" class="p-2 border-l border-gray-200 pl-5">&lt;/&gt;</button>
        </div>
        <div class="hidden xl:flex items-center gap-2">
          <button type="button" class="h-10 w-12 rounded-l-md border border-indigo-500 bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20h6l-.75-3M4 4h16v12H4z"></path></svg>
          </button>
          <button type="button" class="h-10 w-12 border border-gray-200 text-gray-600 flex items-center justify-center">
            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18h.01M8 2h8a1 1 0 011 1v18a1 1 0 01-1 1H8a1 1 0 01-1-1V3a1 1 0 011-1z"></path></svg>
          </button>
        </div>
        <button type="button" class="h-10 px-8 rounded-md bg-indigo-600 text-white font-medium shadow-sm" :disabled="saving" @click="saveCustomization">{{ saving ? 'Salvando...' : 'Salvar' }}</button>
      </div>
    </header>

    <main class="flex h-[calc(100vh-4rem)] overflow-hidden">
      <aside class="w-64 flex-none border-r-2 border-emerald-500 flex flex-col text-gray-950" :style="{ backgroundColor: customization.sidebarColor }">
        <div class="relative h-36 flex items-center justify-center border-b border-yellow-600/40 px-8">
          <img v-if="customization.logoUrl" :src="customization.logoUrl" alt="" class="h-14 max-w-40 object-contain mb-4">
          <h1 class="text-2xl leading-tight text-center">{{ customization.heroTitle || areaName }}</h1>
          <button type="button" class="absolute right-4 top-5 text-gray-900">
            <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path></svg>
          </button>
        </div>
        <nav class="py-6 space-y-2 text-lg">
          <a class="flex items-center gap-4 px-6 py-3 font-medium" href="#">
            <svg class="h-6 w-6" fill="currentColor" viewBox="0 0 20 20"><path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7A1 1 0 003 11h1v5a1 1 0 001 1h3v-4h4v4h3a1 1 0 001-1v-5h1a1 1 0 00.707-1.707l-7-7z"></path></svg>
            {{ customization.homeLabel }}
          </a>
          <a class="flex items-center gap-4 px-6 py-3 font-medium" href="#">
            <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><rect width="16" height="16" x="4" y="4" rx="4" stroke-width="2"></rect><path stroke-linecap="round" stroke-width="2" d="M16.5 7.5h.01"></path><circle cx="12" cy="12" r="3.5" stroke-width="2"></circle></svg>
            {{ customization.instagramLabel }}
          </a>
          <a class="flex items-center gap-4 px-6 py-3 font-medium" href="#">
            <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 10a6 6 0 00-12 0v5a3 3 0 003 3h1v-6H7v-2a5 5 0 0110 0v2h-3v6h1a3 3 0 003-3v-5z"></path></svg>
            {{ customization.supportLabel }}
          </a>
        </nav>
        <div class="mt-auto border-t border-yellow-600/40 p-4 flex items-center gap-3">
          <div class="h-12 w-12 rounded-full bg-white flex items-center justify-center text-gray-500">RD</div>
          <div class="font-medium truncate">{{ customization.brandName }}</div>
          <svg class="h-5 w-5 ml-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"></path></svg>
        </div>
      </aside>

      <section class="flex-1 overflow-auto relative" :style="{ backgroundColor: customization.backgroundColor, color: customization.textColor }">
        <div v-if="hasSection('banner')" class="relative border-2 border-emerald-500 border-l-0">
          <div class="absolute left-0 top-1/2 -translate-y-1/2 h-10 w-10 bg-emerald-500 text-white flex items-center justify-center z-10">
            <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7 7 7M12 3v18"></path></svg>
          </div>
          <div class="h-80 bg-gradient-to-r from-cyan-400 via-teal-300 to-yellow-300 flex items-center justify-center overflow-hidden">
            <img v-if="activeBannerUrl" :src="activeBannerUrl" alt="" class="h-full w-full object-cover">
            <div v-else class="text-center">
              <div class="text-6xl font-black text-blue-800">FIGURINHAS DA</div>
              <div class="text-7xl font-black text-yellow-300 drop-shadow">COPA 2026</div>
            </div>
          </div>
          <div class="absolute right-0 bottom-0 flex bg-emerald-500 text-white">
            <button type="button" class="h-10 w-10 flex items-center justify-center">
              <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.53 1.53 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106a1.53 1.53 0 01-.947 2.287c-1.561.379-1.561 2.6 0 2.978a1.53 1.53 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.53 1.53 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.53 1.53 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.53 1.53 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.53 1.53 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.53 1.53 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd"></path></svg>
            </button>
            <button type="button" class="h-10 w-10 flex items-center justify-center">
              <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20"><path d="M7 3a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0016.414 6L14 3.586A2 2 0 0012.586 3H7z"></path><path d="M3 7a2 2 0 012-2v10H3V7z"></path></svg>
            </button>
            <button type="button" class="h-10 w-10 flex items-center justify-center">
              <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd"></path></svg>
            </button>
          </div>
        </div>

        <div v-if="hasSection('modules')" class="px-16 py-12">
          <h2 class="text-2xl font-bold text-white">{{ customization.modulesTitle }}</h2>
          <div class="mt-6 w-72 overflow-hidden rounded-md bg-gray-800">
            <div class="h-[420px] bg-gradient-to-br from-cyan-400 via-lime-300 to-yellow-400 flex items-end">
              <img v-if="activeBannerUrl" :src="activeBannerUrl" alt="" class="h-full w-full object-cover">
              <div v-else class="p-6 text-white text-4xl font-black">BAIXAR FIGURINHAS</div>
            </div>
          </div>
        </div>
      </section>

      <aside class="w-[385px] flex-none bg-white border-l border-gray-200">
        <div class="h-20 border-b border-gray-200 flex items-center px-7">
          <h2 class="text-2xl font-medium text-gray-900">Início</h2>
        </div>
        <div class="p-7">
          <h3 class="text-base font-medium text-gray-700">Seções</h3>
          <div class="mt-7 space-y-6 text-gray-600">
            <div class="flex items-center gap-3">
              <svg class="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
              <svg class="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4-4 4 4 4-4 4 4M4 20h16M6 4h12v10H6z"></path></svg>
              <span class="font-medium">Banner</span>
            </div>
            <div class="flex items-center gap-3 pl-9">
              <svg class="h-6 w-6 text-gray-500" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clip-rule="evenodd"></path></svg>
              <span>Slide - <em>Slide e imagem</em></span>
            </div>
            <button type="button" class="flex items-center gap-3 pl-9 text-blue-600">
              <span class="h-6 w-6 rounded-full border-2 border-blue-600 flex items-center justify-center font-bold">+</span>
              Adicionar slide (1/3)
            </button>
            <div class="flex items-center gap-3">
              <svg class="h-6 w-6 text-gray-500" fill="currentColor" viewBox="0 0 20 20"><path d="M2 11a2 2 0 012-2h2V7a2 2 0 012-2h4a2 2 0 012 2v2h2a2 2 0 012 2v5h-4v-4h-3v4H7v-4H4v4H2v-5z"></path></svg>
              <span>Módulos - <em>Uma seção pode conter ...</em></span>
            </div>
            <button type="button" class="flex items-center gap-3 text-blue-600">
              <span class="h-6 w-6 rounded-full border-2 border-blue-600 flex items-center justify-center font-bold">+</span>
              Adicionar seção
            </button>
          </div>

          <div class="mt-10 border-t border-gray-200 pt-6 space-y-4">
            <label class="block text-sm font-medium text-gray-700">Logo</label>
            <input v-model="customization.logoUrl" class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" placeholder="https://...">
            <label class="block text-sm font-medium text-gray-700">Banner</label>
            <input v-model="customization.bannerUrl" class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm" placeholder="https://...">
            <label class="block text-sm font-medium text-gray-700">Marca</label>
            <input v-model="customization.brandName" class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm">
            <label class="block text-sm font-medium text-gray-700">Título</label>
            <input v-model="customization.heroTitle" class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm">
            <label class="block text-sm font-medium text-gray-700">Título dos módulos</label>
            <input v-model="customization.modulesTitle" class="w-full rounded-md border border-gray-300 px-3 py-2 text-sm">
            <div class="grid grid-cols-2 gap-3">
              <label class="block text-sm font-medium text-gray-700">Sidebar<input v-model="customization.sidebarColor" type="color" class="mt-1 h-10 w-full"></label>
              <label class="block text-sm font-medium text-gray-700">Fundo<input v-model="customization.backgroundColor" type="color" class="mt-1 h-10 w-full"></label>
            </div>
            <label class="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" :checked="hasSection('banner')" @change="toggleSection('banner')">
              Banner visível
            </label>
            <label class="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" :checked="hasSection('modules')" @change="toggleSection('modules')">
              Módulos visíveis
            </label>
          </div>
        </div>
      </aside>
    </main>

    <button type="button" class="fixed right-7 bottom-7 h-16 w-16 rounded-full bg-black text-white shadow-lg flex items-center justify-center">
      <svg class="h-8 w-8" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.84 8.84 0 01-4.083-.98L2 17l1.338-3.123A6.94 6.94 0 012 10c0-3.866 3.582-7 8-7s8 3.134 8 7zm-9-2a1 1 0 012 0v1h1a1 1 0 110 2h-1v1a1 1 0 11-2 0v-1H8a1 1 0 110-2h1V8z" clip-rule="evenodd"></path></svg>
    </button>
  </div>
</template>

<style scoped>
.editor-shell {
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}
</style>
