<script setup lang="ts">
import type { MembersAreaCustomization } from '~/data/membersArea'
import { uploadFile } from '~/utils/supabase'

useHead({ title: 'Editar Área de Membros' })

type EditorSlide = {
  id: string
  title: string
  imageUrl: string
}

type EditorSection = {
  id: string
  type: string
  title: string
  subtitle: string
  imageUrl: string
  visible: boolean
}

type EditorState = {
  theme: {
    primaryColor: string
    sidebarColor: string
    backgroundColor: string
    textColor: string
  }
  sidebar: {
    logoUrl: string
    brandName: string
    title: string
    collapsed: boolean
    links: {
      home: string
      instagram: string
      support: string
      instagramUrl: string
      supportUrl: string
    }
  }
  home: {
    banner: {
      title: string
      imageUrl: string
      visible: boolean
    }
    slides: EditorSlide[]
    sections: EditorSection[]
  }
  menu: Record<string, any>
  login: Record<string, any>
  settings: Record<string, any>
}

const route = useRoute()
const { getMembersAreaById, saveMembersAreaCustomization } = useMembersArea()

const membersAreaId = computed(() => String(route.params.id || '1cbe33c8-14d3-4612-81e4-b52587203765'))
const membersArea = computed(() => getMembersAreaById(membersAreaId.value))
const areaName = computed(() => membersArea.value?.name || 'Figurinhas da Copa 2026')
const coverUrl = computed(() => membersArea.value?.coverUrl || '')
const areaPath = computed(() => `/members-area/${membersAreaId.value}?tab=customizations`)
const publicClubPath = computed(() => `/club=${membersAreaId.value}?editor=1`)

const saving = ref(false)
const activeTab = ref<'home' | 'menu' | 'login' | 'settings'>('home')
const previewMode = ref<'desktop' | 'mobile'>('desktop')
const selectedItem = ref('banner')
const showCode = ref(false)
const showDesktopDropdown = ref(false)
const showMobileDropdown = ref(false)
const showSectionMenu = ref(false)
const panelMode = ref<'tree' | 'details'>('tree')
const undoStack = ref<string[]>([])
const redoStack = ref<string[]>([])
const historyLocked = ref(false)
const uploadError = ref('')

const defaultBanner = ''
const defaultFigurinhasModuleImage = ''
const blockedMemberAssetPattern = /robo|rob[oô]|lightroom|presets|ribas/i
const isCleanMemberAreaUpload = (value = '') => /member-area-covers.*clean-/i.test(value)
const safeEditorImage = (value = '', fallback = defaultBanner) => {
  if (/^(data:image|blob:)/i.test(value) || isCleanMemberAreaUpload(value)) return value
  if (value === defaultBanner || value === defaultFigurinhasModuleImage) return value
  if (blockedMemberAssetPattern.test(value)) return fallback
  if (fallback === defaultFigurinhasModuleImage) return defaultFigurinhasModuleImage
  return fallback || ''
}
const safeEditorText = (value = '', fallback = 'Figurinhas da Copa 2026') => blockedMemberAssetPattern.test(value) ? fallback : value

const createState = (): EditorState => ({
  theme: {
    primaryColor: '#4f46e5',
    sidebarColor: '#facc15',
    backgroundColor: '#080808',
    textColor: '#ffffff'
  },
  sidebar: {
    logoUrl: '',
    brandName: 'RETRATISTAS DIGITAIS',
    title: safeEditorText(areaName.value),
    collapsed: false,
    links: {
      home: 'Home',
      instagram: 'Instagram',
      support: 'Suporte',
      instagramUrl: 'https://instagram.com',
      supportUrl: 'mailto:suporte@ayrtonborgesonline.com'
    }
  },
  home: {
    banner: {
      title: safeEditorText(areaName.value),
      imageUrl: safeEditorImage(coverUrl.value, defaultBanner),
      visible: true
    },
    slides: [
      { id: 'slide-1', title: 'Slide', imageUrl: safeEditorImage(coverUrl.value, defaultBanner) }
    ],
    sections: [
      { id: 'modules', type: 'modules', title: 'Uma seção pode conter módulos', subtitle: 'Uma seção pode conter módulos, cursos e aulas.', imageUrl: safeEditorImage(coverUrl.value, defaultFigurinhasModuleImage), visible: true }
    ]
  },
  menu: {},
  login: {},
  settings: {}
})

const editor = reactive<EditorState>(createState())

const cloneState = (value: EditorState = editor) => JSON.parse(JSON.stringify(value)) as EditorState

const normalizeCustomization = (customization: MembersAreaCustomization = {}): EditorState => {
  const base = createState()
  const theme = {
    ...base.theme,
    ...(customization.theme || {}),
    primaryColor: customization.theme?.primaryColor || customization.primaryColor || base.theme.primaryColor,
    sidebarColor: customization.theme?.sidebarColor || customization.sidebarColor || base.theme.sidebarColor,
    backgroundColor: customization.theme?.backgroundColor || customization.backgroundColor || base.theme.backgroundColor,
    textColor: customization.theme?.textColor || customization.textColor || base.theme.textColor
  }
  const sidebarLinks = {
    ...base.sidebar.links,
    ...(customization.sidebar?.links || {}),
    home: customization.sidebar?.links?.home || customization.homeLabel || base.sidebar.links.home,
    instagram: customization.sidebar?.links?.instagram || customization.instagramLabel || base.sidebar.links.instagram,
    support: customization.sidebar?.links?.support || customization.supportLabel || base.sidebar.links.support
  }
  const sidebar = {
    ...base.sidebar,
    ...(customization.sidebar || {}),
    logoUrl: customization.sidebar?.logoUrl || customization.logoUrl || base.sidebar.logoUrl,
    brandName: customization.sidebar?.brandName || customization.brandName || base.sidebar.brandName,
    title: safeEditorText(customization.sidebar?.title || customization.heroTitle || base.sidebar.title),
    links: sidebarLinks
  }
  const sections = (customization.home?.sections?.length ? customization.home.sections : base.home.sections).map((section) => ({
    id: section.id,
    type: section.type || 'custom',
    title: section.title || 'Nova seção',
    subtitle: section.subtitle || '',
    imageUrl: safeEditorImage(section.imageUrl || customization.bannerUrl || coverUrl.value, section.type === 'modules' ? defaultFigurinhasModuleImage : defaultBanner),
    visible: section.visible !== false
  }))
  const home = {
    ...base.home,
    ...(customization.home || {}),
    banner: {
      ...base.home.banner,
      ...(customization.home?.banner || {}),
      title: safeEditorText(customization.home?.banner?.title || customization.heroTitle || base.home.banner.title),
      imageUrl: safeEditorImage(customization.home?.banner?.imageUrl || customization.bannerUrl || coverUrl.value, defaultBanner),
      visible: customization.home?.banner?.visible ?? (customization.visibleSections ? customization.visibleSections.includes('banner') : true)
    },
    slides: (customization.home?.slides?.length ? customization.home.slides : base.home.slides).map((slide, index) => ({
      id: slide.id || `slide-${index + 1}`,
      title: slide.title || `Slide ${index + 1}`,
      imageUrl: safeEditorImage(slide.imageUrl || customization.bannerUrl || coverUrl.value, defaultBanner)
    })),
    sections
  }

  return {
    theme,
    sidebar,
    home,
    menu: customization.menu || {},
    login: customization.login || {},
    settings: customization.settings || {}
  }
}

const serializeForSave = (): MembersAreaCustomization => ({
  theme: cloneState().theme,
  sidebar: cloneState().sidebar,
  home: cloneState().home,
  menu: cloneState().menu,
  login: cloneState().login,
  settings: cloneState().settings,
  primaryColor: editor.theme.primaryColor,
  sidebarColor: editor.theme.sidebarColor,
  backgroundColor: editor.theme.backgroundColor,
  textColor: editor.theme.textColor,
  logoUrl: editor.sidebar.logoUrl,
  bannerUrl: editor.home.banner.imageUrl,
  brandName: editor.sidebar.brandName,
  homeLabel: editor.sidebar.links.home,
  instagramLabel: editor.sidebar.links.instagram,
  supportLabel: editor.sidebar.links.support,
  heroTitle: editor.home.banner.title,
  modulesTitle: editor.home.sections.find((section) => section.type === 'modules')?.title || '',
  visibleSections: [
    ...(editor.home.banner.visible ? ['banner'] : []),
    ...editor.home.sections.filter((section) => section.visible).map((section) => section.type)
  ]
})

const hydrate = () => {
  historyLocked.value = true
  Object.assign(editor, normalizeCustomization(membersArea.value?.customization || {}))
  undoStack.value = []
  redoStack.value = []
  historyLocked.value = false
}

const pushHistory = () => {
  if (historyLocked.value) return
  undoStack.value.push(JSON.stringify(cloneState()))
  if (undoStack.value.length > 30) undoStack.value.shift()
  redoStack.value = []
}

const applyState = (state: EditorState) => {
  historyLocked.value = true
  Object.assign(editor, state)
  historyLocked.value = false
}

const mutate = (callback: () => void) => {
  pushHistory()
  callback()
}

const undo = () => {
  const previous = undoStack.value.pop()
  if (!previous) return
  redoStack.value.push(JSON.stringify(cloneState()))
  applyState(JSON.parse(previous))
}

const redo = () => {
  const next = redoStack.value.pop()
  if (!next) return
  undoStack.value.push(JSON.stringify(cloneState()))
  applyState(JSON.parse(next))
}

const selectItem = (id: string) => {
  selectedItem.value = id
  panelMode.value = 'details'
}

const addSlide = () => {
  if (editor.home.slides.length >= 3) return
  mutate(() => {
    const next = editor.home.slides.length + 1
    const slide = { id: `slide-${Date.now()}`, title: `Slide ${next}`, imageUrl: editor.home.banner.imageUrl }
    editor.home.slides.push(slide)
    selectedItem.value = slide.id
  })
}

const removeSlide = (id: string) => {
  if (editor.home.slides.length <= 1) return
  mutate(() => {
    editor.home.slides = editor.home.slides.filter((slide) => slide.id !== id)
    selectedItem.value = 'banner'
  })
}

const addSection = (type = 'custom') => {
  mutate(() => {
    const section = {
      id: `section-${Date.now()}`,
      type,
      title: type === 'modules' ? 'Módulos' : 'Nova seção',
      subtitle: '',
      imageUrl: editor.home.banner.imageUrl,
      visible: true
    }
    editor.home.sections.push(section)
    selectedItem.value = section.id
  })
}

const removeSection = (id: string) => {
  if (editor.home.sections.length <= 1) return
  mutate(() => {
    editor.home.sections = editor.home.sections.filter((section) => section.id !== id)
    selectedItem.value = 'banner'
  })
}

const duplicateSection = (section: EditorSection) => {
  mutate(() => {
    const copy = { ...section, id: `section-${Date.now()}`, title: `${section.title} cópia` }
    editor.home.sections.push(copy)
    selectedItem.value = copy.id
  })
}

const moveSection = (id: string, direction: -1 | 1) => {
  const index = editor.home.sections.findIndex((section) => section.id === id)
  const target = index + direction
  if (index < 0 || target < 0 || target >= editor.home.sections.length) return
  mutate(() => {
    const [section] = editor.home.sections.splice(index, 1)
    editor.home.sections.splice(target, 0, section)
  })
}

const selectedSlide = computed(() => editor.home.slides.find((slide) => slide.id === selectedItem.value))
const selectedSection = computed(() => editor.home.sections.find((section) => section.id === selectedItem.value))
const selectedKind = computed(() => selectedItem.value === 'banner' ? 'banner' : selectedSlide.value ? 'slide' : selectedSection.value ? 'section' : 'general')
const activeBannerImage = computed(() => editor.home.banner.imageUrl || editor.home.slides[0]?.imageUrl)
const activePanelTitle = computed(() => {
  if (selectedKind.value === 'banner') return 'Banner'
  if (selectedKind.value === 'slide') return selectedSlide.value?.title || 'Slide'
  if (selectedKind.value === 'section') return selectedSection.value?.title || 'Módulos'
  if (activeTab.value === 'menu') return 'Menu'
  if (activeTab.value === 'login') return 'Login'
  if (activeTab.value === 'settings') return 'Configurações'
  return 'Início'
})

const setTab = (tab: 'home' | 'menu' | 'login' | 'settings') => {
  activeTab.value = tab
  selectedItem.value = tab === 'home' ? 'banner' : tab
  panelMode.value = tab === 'home' ? 'tree' : 'details'
  showDesktopDropdown.value = false
  showMobileDropdown.value = false
}

const updateEditor = (callback: () => void) => mutate(callback)

const readFileAsDataUrl = (file: File) => new Promise<string>((resolve, reject) => {
  const reader = new FileReader()
  reader.onload = () => resolve(String(reader.result || ''))
  reader.onerror = () => reject(reader.error)
  reader.readAsDataURL(file)
})

const setImageValue = (target: 'banner' | 'slide' | 'section', imageUrl: string) => {
  mutate(() => {
    if (target === 'banner') {
      editor.home.banner.imageUrl = imageUrl
      if (editor.home.slides[0]) editor.home.slides[0].imageUrl = imageUrl
      return
    }
    if (target === 'slide' && selectedSlide.value) {
      selectedSlide.value.imageUrl = imageUrl
      editor.home.banner.imageUrl = imageUrl
      return
    }
    if (target === 'section' && selectedSection.value) {
      selectedSection.value.imageUrl = imageUrl
    }
  })
}

const handleImageUpload = async (event: Event | DragEvent, target: 'banner' | 'slide' | 'section') => {
  event.preventDefault()
  uploadError.value = ''
  const input = event.target as HTMLInputElement
  const dropped = 'dataTransfer' in event ? event.dataTransfer?.files?.[0] : null
  const file = dropped || input.files?.[0]
  if (!file) return

  if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
    uploadError.value = 'Use JPEG, JPG, PNG ou WEBP.'
    return
  }

  if (file.size > 2 * 1024 * 1024) {
    uploadError.value = 'Imagem deve ter ate 2 MB.'
    return
  }

  const extension = file.name.split('.').pop() || 'png'
  const key = target === 'slide' ? selectedSlide.value?.id : target === 'section' ? selectedSection.value?.id : 'banner'
  const uploaded = await uploadFile('member-area-covers', `${membersAreaId.value}/clean-${target}-${key || Date.now()}.${extension}`, file)
  const imageUrl = uploaded.data?.publicUrl || await readFileAsDataUrl(file)
  setImageValue(target, imageUrl)
  await saveMembersAreaCustomization(membersAreaId.value, serializeForSave())
  if (input?.value !== undefined) input.value = ''
}

const clearImage = (target: 'banner' | 'slide' | 'section') => {
  setImageValue(target, target === 'section' ? defaultFigurinhasModuleImage : defaultBanner)
}

const saveCustomization = async () => {
  saving.value = true
  try {
    await saveMembersAreaCustomization(membersAreaId.value, serializeForSave())
  } finally {
    saving.value = false
  }
}

watch(membersArea, hydrate, { immediate: true })
</script>

<template>
  <main>
    <div class="members-area-editor sidebar-open" style="--navbar-size: 56px; --scrollbar-width: 0px;">
      <nav class="navbar flex items-center py-2 border-b sticky top-0 left-0 right-0 z-20 bg-white">
        <NuxtLink :to="areaPath" class="inline-flex justify-center items-center text-center font-medium rounded-md border transition ease-in-out duration-150 focus:outline-none text-gray-600 bg-transparent focus-visible:bg-gray-100 hover:bg-gray-100 border border-transparent leading-5 text-sm p-2 gap-2 cursor-pointer" aria-label="Voltar">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="24px" height="24px" class="h-5 w-5"><path fill-rule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clip-rule="evenodd"></path></svg>
        </NuxtLink>
        <span class="p-2 block truncate text-sm text-gray-600 font-medium">{{ areaName }}</span>
        <div class="flex items-center gap-2 ml-auto">
          <button v-for="tab in [{ id: 'home', icon: 'fa-home', label: 'Início' }, { id: 'menu', icon: 'fa-bars', label: 'Menu' }, { id: 'login', icon: 'fa-door-open', label: 'Login' }, { id: 'settings', icon: 'fa-cog', label: 'Configurações' }]" :key="tab.id" type="button" :class="activeTab === tab.id ? 'inline-flex justify-center items-center text-center font-medium rounded-md border transition ease-in-out duration-150 focus:outline-none text-indigo-800 bg-indigo-50 focus-visible:bg-indigo-100 hover:bg-indigo-100 border border-indigo-500 leading-5 text-sm py-2 px-2.5 gap-2 cursor-pointer' : 'inline-flex justify-center items-center text-center font-medium rounded-md border transition ease-in-out duration-150 focus:outline-none text-gray-600 bg-transparent focus-visible:bg-gray-100 hover:bg-gray-100 border border-transparent leading-5 text-sm py-2 px-2.5 gap-2 cursor-pointer'" @click="setTab(tab.id as any)">
            <span aria-hidden="true" class="kiwi-icon-fa inline-block leading-0 text-center"><i :class="`fa ${tab.icon}`" style="font-size: 14px; height: 14px; min-width: 14px;"></i></span>
            {{ tab.label }}
          </button>
          <hr class="bg-gray-200 w-px h-auto self-stretch">
          <div class="flex items-center gap-0.5">
            <button type="button" :disabled="!undoStack.length" :class="!undoStack.length ? 'w-9.5 h-9.5 inline-flex justify-center items-center text-center font-medium rounded-md border transition ease-in-out duration-150 focus:outline-none text-gray-600 bg-transparent focus-visible:bg-gray-100 hover:bg-gray-100 border border-transparent leading-4 text-sm p-3 gap-2 opacity-50 cursor-not-allowed' : 'w-9.5 h-9.5 inline-flex justify-center items-center text-center font-medium rounded-md border transition ease-in-out duration-150 focus:outline-none text-gray-600 bg-transparent focus-visible:bg-gray-100 hover:bg-gray-100 border border-transparent leading-4 text-sm p-3 gap-2 cursor-pointer'" id="ce__action__undo" aria-expanded="false" @click="undo"><span aria-hidden="true" class="kiwi-icon-fa inline-block leading-0 text-center"><i class="fas fa-undo" style="font-size: 12px; height: 12px; min-width: 12px;"></i></span></button>
            <button type="button" :disabled="!redoStack.length" :class="!redoStack.length ? 'w-9.5 h-9.5 inline-flex justify-center items-center text-center font-medium rounded-md border transition ease-in-out duration-150 focus:outline-none text-gray-600 bg-transparent focus-visible:bg-gray-100 hover:bg-gray-100 border border-transparent leading-4 text-sm p-3 gap-2 opacity-50 cursor-not-allowed' : 'w-9.5 h-9.5 inline-flex justify-center items-center text-center font-medium rounded-md border transition ease-in-out duration-150 focus:outline-none text-gray-600 bg-transparent focus-visible:bg-gray-100 hover:bg-gray-100 border border-transparent leading-4 text-sm p-3 gap-2 cursor-pointer'" id="ce__action__redo" aria-expanded="false" @click="redo"><span aria-hidden="true" class="kiwi-icon-fa inline-block leading-0 text-center"><i class="fas fa-redo" style="font-size: 12px; height: 12px; min-width: 12px;"></i></span></button>
          </div>
          <hr class="bg-gray-200 w-px h-auto self-stretch">
          <div class="flex items-center gap-0.5">
            <button type="button" class="w-9.5 h-9.5 inline-flex justify-center items-center text-center font-medium rounded-md border transition ease-in-out duration-150 focus:outline-none text-gray-600 bg-transparent focus-visible:bg-gray-100 hover:bg-gray-100 border border-transparent leading-5 text-sm p-2.5 gap-2 cursor-pointer p-2 rounded-md border border-transparent outline-none focus:outline-none" aria-expanded="false" @click="showCode = !showCode">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="24px" height="24px" class="h-5 w-5"><path fill-rule="evenodd" d="M12.316 3.051a1 1 0 01.633 1.265l-4 12a1 1 0 11-1.898-.632l4-12a1 1 0 011.265-.633zM5.707 6.293a1 1 0 010 1.414L3.414 10l2.293 2.293a1 1 0 11-1.414 1.414l-3-3a1 1 0 010-1.414l3-3a1 1 0 011.414 0zm8.586 0a1 1 0 011.414 0l3 3a1 1 0 010 1.414l-3 3a1 1 0 11-1.414-1.414L16.586 10l-2.293-2.293a1 1 0 010-1.414z" clip-rule="evenodd"></path></svg>
            </button>
          </div>
          <hr class="bg-gray-200 w-px h-auto self-stretch">
          <div class="flex relative" iconsize="16">
            <button type="button" :class="previewMode === 'desktop' ? 'w-9.5 h-9.5 rounded-r-none inline-flex justify-center items-center text-center font-medium rounded-md border transition ease-in-out duration-150 focus:outline-none text-indigo-800 bg-indigo-50 focus-visible:bg-indigo-100 hover:bg-indigo-100 border border-indigo-500 leading-4 text-sm p-2.5 gap-2 cursor-pointer' : 'w-9.5 h-9.5 rounded-r-none inline-flex justify-center items-center text-center font-medium rounded-md border transition ease-in-out duration-150 focus:outline-none text-gray-600 bg-transparent focus-visible:bg-gray-100 hover:bg-gray-100 border border-transparent leading-4 text-sm p-2.5 gap-2 cursor-pointer'" id="ce__viewport__web" aria-expanded="false" @click="previewMode = 'desktop'"><span aria-hidden="true" class="kiwi-icon-fa inline-block leading-0 text-center"><i class="fa fa-desktop" style="font-size: 16px; height: 16px; min-width: 16px;"></i></span></button>
            <button type="button" :class="previewMode === 'desktop' ? 'border-l-0 rounded-l-none inline-flex justify-center items-center text-center font-medium rounded-md border transition ease-in-out duration-150 focus:outline-none text-indigo-800 bg-indigo-50 focus-visible:bg-indigo-100 hover:bg-indigo-100 border border-indigo-500 leading-4 text-sm px-1 gap-2 cursor-pointer' : 'border-l-0 rounded-l-none inline-flex justify-center items-center text-center font-medium rounded-md border transition ease-in-out duration-150 focus:outline-none text-gray-600 bg-transparent focus-visible:bg-gray-100 hover:bg-gray-100 border border-transparent leading-4 text-sm px-1 gap-2 cursor-pointer'" id="ce__viewport__web__dropdown" aria-haspopup="true" :aria-expanded="showDesktopDropdown" @click="showDesktopDropdown = !showDesktopDropdown; showMobileDropdown = false"><span aria-hidden="true" class="kiwi-icon-fa inline-block leading-0 text-center"><i class="fa fa-angle-down" style="font-size: 12px; height: 12px; min-width: 12px;"></i></span></button>
            <div class="ce-dropdown absolute bg-white shadow-md rounded-md p-3 z-10 end" :style="{ display: showDesktopDropdown ? 'block' : 'none' }">
              <label class="block cursor-pointer px-2 py-1 rounded-sm text-sm font-medium focus-within:bg-gray-200 hover:bg-gray-200" :class="{ 'bg-gray-100': previewMode === 'desktop' }">
                <input type="radio" name="viewport" class="sr-only" value="desktop" :checked="previewMode === 'desktop'" @change="previewMode = 'desktop'; showDesktopDropdown = false">
                <span class="text-sm font-medium">Desktop</span>
              </label>
              <label class="block cursor-pointer px-2 py-1 rounded-sm text-sm font-medium focus-within:bg-gray-200 hover:bg-gray-200" :class="{ 'bg-gray-100': previewMode === 'mobile' }">
                <input type="radio" name="viewport" class="sr-only" value="mobile" :checked="previewMode === 'mobile'" @change="previewMode = 'mobile'; showDesktopDropdown = false">
                <span class="text-sm font-medium">Mobile</span>
              </label>
            </div>
          </div>
          <div class="flex relative" iconsize="16">
            <button type="button" :class="previewMode === 'mobile' ? 'w-9.5 h-9.5 rounded-r-none inline-flex justify-center items-center text-center font-medium rounded-md border transition ease-in-out duration-150 focus:outline-none text-indigo-800 bg-indigo-50 focus-visible:bg-indigo-100 hover:bg-indigo-100 border border-indigo-500 leading-4 text-sm p-2.5 gap-2 cursor-pointer' : 'w-9.5 h-9.5 rounded-r-none inline-flex justify-center items-center text-center font-medium rounded-md border transition ease-in-out duration-150 focus:outline-none text-gray-600 bg-transparent focus-visible:bg-gray-100 hover:bg-gray-100 border border-transparent leading-4 text-sm p-2.5 gap-2 cursor-pointer'" id="ce__viewport__mobile_app" aria-expanded="false" @click="previewMode = 'mobile'"><span aria-hidden="true" class="kiwi-icon-fa inline-block leading-0 text-center"><i class="fa fa-mobile-alt" style="font-size: 16px; height: 16px; min-width: 16px;"></i></span></button>
            <button type="button" class="border-l-0 rounded-l-none inline-flex justify-center items-center text-center font-medium rounded-md border transition ease-in-out duration-150 focus:outline-none text-gray-600 bg-transparent focus-visible:bg-gray-100 hover:bg-gray-100 border border-transparent leading-4 text-sm px-1 gap-2 cursor-pointer" id="ce__viewport__mobile_app__dropdown" aria-haspopup="true" :aria-expanded="showMobileDropdown" @click="showMobileDropdown = !showMobileDropdown; showDesktopDropdown = false"><span aria-hidden="true" class="kiwi-icon-fa inline-block leading-0 text-center"><i class="fa fa-angle-down" style="font-size: 12px; height: 12px; min-width: 12px;"></i></span></button>
            <div class="ce-dropdown absolute bg-white shadow-md rounded-md p-3 z-10 end" :style="{ display: showMobileDropdown ? 'block' : 'none' }">
              <div>
                <div class="v-portal" style="display: none;"></div>
                <div class="flex items-center">
                  <span role="checkbox" tabindex="0" aria-checked="true" class="bg-gray-200 relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:shadow-outline bg-indigo-500">
                    <span aria-hidden="true" class="inline-block h-5 w-5 rounded-full bg-white shadow transform transition ease-in-out duration-200 translate-x-5"></span>
                  </span>
                  <label class="block text-sm font-medium leading-5 text-gray-700 ml-2 cursor-pointer">Sincronizar com a versão web</label>
                </div>
              </div>
            </div>
          </div>
          <hr class="bg-gray-200 w-px h-auto self-stretch">
          <button type="button" class="inline-flex justify-center items-center text-center font-medium rounded-md border transition ease-in-out duration-150 focus:outline-none text-white bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 border-transparent focus:border-indigo-700 focus:shadow-outline-indigo leading-5 text-sm py-2 px-8 gap-2 cursor-pointer shadow-sm" :disabled="saving" @click="saveCustomization">{{ saving ? 'Salvando...' : 'Salvar' }}</button>
        </div>
      </nav>

      <div class="flash--wrapper"><span></span></div>
      <div class="page-content relative bg-gray-200 transition-all duration-300">
        <div class="phone-container" :class="{ 'phone-enabled': previewMode === 'mobile' }">
          <div class="phone-device" :class="{ 'phone-frame-active': previewMode === 'mobile' }">
            <div v-if="previewMode === 'mobile'" class="volume-buttons"><div class="volume-up"></div><div class="volume-down"></div></div>
            <div v-if="previewMode === 'mobile'" class="power-button"></div>
            <div :class="previewMode === 'mobile' ? 'phone-frame' : 'screen'">
              <div v-if="previewMode === 'mobile'" class="dynamic-island"><div class="island-speaker"></div><div class="island-camera"></div></div>
              <iframe :src="publicClubPath" class="mx-auto w-full h-full transition-all duration-300 2xl:border 2xl:shadow-lg 2xl:rounded-lg max-w-full"></iframe>
              <div v-if="previewMode === 'mobile'" class="home-indicator"></div>
            </div>
          </div>
        </div>
      </div>

      <section role="dialog" aria-modal="true" aria-labelledby="slide-over-title" class="ce-sidebar w-24rem bg-white border-l fixed right-0 bottom-0 z-10 flex flex-row overflow-hidden" style="">
        <section class="ce-elements-tree w-full absolute inset-0 transform transition-transform duration-200 ease-in-out overflow-y-auto" :class="panelMode === 'tree' ? 'translate-x-0' : '-translate-x-full'" :aria-hidden="panelMode !== 'tree'">
          <h2 id="slide-over-title" class="flex items-center text-lg font-medium text-gray-900 bg-gray-50 border-b py-2 px-4">{{ activeTab === 'home' ? 'Início' : activeTab === 'menu' ? 'Menu' : activeTab === 'login' ? 'Login' : 'Configurações' }}</h2>
          <article class="relative py-2 px-1.5">
            <header class="py-2 px-4 -mx-1.5"><h3 id="slide-over-elements-title" class="block text-sm font-medium leading-5 text-gray-700">Seções</h3></header>
            <ul class="ce-elements-tree py-1 px-0.5 space-y-0.5 rounded-md border border-dashed border-transparent">
              <li id="section-M7IADU" aria-level="1" aria-setsize="2" aria-posinset="1" aria-expanded="true" role="treeitem" class="relative">
                <div class="ce-elements-tree__item group relative w-full flex items-center justify-between gap-1 text-left py-1 px-1.5 rounded-md text-gray-600">
                  <button type="button" tabindex="0" class="ce-elements-tree__item__button absolute inset-0 rounded-md text-left py-1 flex flex-row items-center gap-1 focus:bg-gray-200 focus:outline-none pl-8 pr-15" @click="selectItem('banner')"><span class="relative text-center w-6"><span aria-hidden="true" class="kiwi-icon-fa inline-block leading-0 text-center ce-elements-tree__item__button__icon transition-opacity duration-200 opacity-100"><i class="fas fa-images" style="font-size: 16px; height: 16px; min-width: 16px;"></i></span><span aria-hidden="true" class="kiwi-icon-fa inline-block leading-0 text-center w-6 h-6 ce-elements-tree__item__button__icon-drag cursor-move transform absolute top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2 flex items-center justify-center rounded-md bg-transparent focus:bg-gray-200 hover:bg-gray-200 transition-opacity duration-200 opacity-0" title="Arraste e solte para reordenar"><i class="fas fa-grip-vertical" style="font-size: 13px; height: 13px; min-width: 13px;"></i></span></span><span class="ce-elements-tree__item__label flex-1 min-w-0 select-none leading-4 text-sm truncate">Banner</span></button>
                  <span class="ce-elements-tree__item__toggle relative z-10 h-6 text-left"><button type="button" tabindex="0" aria-expanded="true" aria-controls="section__M7IADU__blocks" title="Minimizar" class="ce-elements-tree__item__toggle__button w-6 h-6 flex items-center justify-center rounded-md text-gray-500 bg-transparent hover:bg-gray-200 focus:outline-none"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="24px" height="24px" class="ce-elements-tree__item__toggle__button__icon w-5 h-5 flex items-center justify-center transform transition-transform duration-200 rotate-90"><path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd"></path></svg></button></span>
                  <span class="ce-elements-tree__item__actions relative ml-auto z-10 h-6 text-right opacity-0 transition-opacity duration-200"><button type="button" tabindex="0" title="Duplicar" class="ce-elements-tree__item__actions__button w-6 h-6 flex items-center justify-center rounded-md transition-all duration-200 bg-transparent focus:bg-gray-200 hover:bg-gray-200 focus:outline-none"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="24px" height="24px" class="w-4 h-4 flex items-center justify-center"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg></button></span>
                  <span class="ce-elements-tree__item__actions relative z-10 h-6 text-right opacity-0 transition-opacity duration-200"><button type="button" tabindex="0" title="Excluir" class="ce-elements-tree__item__actions__button w-6 h-6 flex items-center justify-center rounded-md transition-all duration-200 bg-transparent focus:bg-gray-200 hover:bg-gray-200 focus:outline-none"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="24px" height="24px" class="w-4 h-4 flex items-center justify-center"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button></span>
                </div>
                <div id="section__M7IADU__blocks" class="ce-elements-tree-wrapper pl-14 pb-1">
                  <ul class="ce-elements-tree rounded-md border border-dashed border-transparent">
                    <li v-for="slide in editor.home.slides" :key="slide.id" :id="`section-M7IADU-block-${slide.id}`" aria-level="2" :aria-setsize="editor.home.slides.length" role="treeitem" class="relative">
                      <div class="ce-elements-tree__item group relative w-full flex items-center justify-between gap-1 text-left py-1 px-1.5 rounded-md text-gray-600">
                        <button type="button" tabindex="0" class="ce-elements-tree__item__button absolute inset-0 rounded-md text-left py-1 flex flex-row items-center gap-1 focus:bg-gray-200 focus:outline-none pl-1.5 pr-15" @click="selectItem(slide.id)"><span class="relative text-center w-6"><span aria-hidden="true" class="kiwi-icon-fa inline-block leading-0 text-center ce-elements-tree__item__button__icon"><i class="fas fa-image" style="font-size: 16px; height: 16px; min-width: 16px;"></i></span></span><span class="ce-elements-tree__item__label flex-1 min-w-0 select-none leading-4 text-sm truncate">{{ slide.title || 'Slide' }} – <i class="text-gray-500">Slide de imagem</i></span></button>
                        <span class="ce-elements-tree__item__toggle-empty-spacer"></span>
                        <span class="ce-elements-tree__item__actions relative ml-auto z-10 h-6 text-right opacity-0 transition-opacity duration-200"><button type="button" tabindex="0" title="Duplicar" class="ce-elements-tree__item__actions__button w-6 h-6 flex items-center justify-center rounded-md transition-all duration-200 bg-transparent focus:bg-gray-200 hover:bg-gray-200 focus:outline-none"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="24px" height="24px" class="w-4 h-4 flex items-center justify-center"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg></button></span>
                        <span class="ce-elements-tree__item__actions relative z-10 h-6 text-right opacity-0 transition-opacity duration-200"><button type="button" :disabled="editor.home.slides.length <= 1" tabindex="-1" title="Não é possível excluir todos os blocos" :class="editor.home.slides.length <= 1 ? 'ce-elements-tree__item__actions__button w-6 h-6 flex items-center justify-center rounded-md transition-all duration-200 text-gray-400 focus:outline-none' : 'ce-elements-tree__item__actions__button w-6 h-6 flex items-center justify-center rounded-md transition-all duration-200 bg-transparent focus:bg-gray-200 hover:bg-gray-200 focus:outline-none'" @click="removeSlide(slide.id)"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="24px" height="24px" class="w-4 h-4 flex items-center justify-center"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button></span>
                      </div>
                    </li>
                  </ul>
                  <div class="px-px"><button type="button" tabindex="0" title="" class="ce-elements-tree__add-button w-full flex items-center justify-between gap-0.5 text-left py-1 px-1.5 focus:outline-none rounded-md border-2 border-transparent text-blue-600 bg-transparent hover:bg-gray-100 focus:bg-gray-200" :disabled="editor.home.slides.length >= 3" @click="addSlide"><span class="ce-elements-tree__add-button__icon text-center w-6 leading-0 pr-0.5"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="24px" height="24px" class="w-5 h-5 inline-block"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></span><span class="ce-elements-tree__add-button__label flex-1 min-w-0 select-none leading-4 text-sm truncate">Adicionar slide ({{ editor.home.slides.length }}/3)</span></button></div>
                </div>
              </li>
              <li v-for="(section, index) in editor.home.sections" :key="section.id" :id="`section-${section.id}`" aria-level="1" :aria-setsize="editor.home.sections.length + 1" :aria-posinset="index + 2" role="treeitem" class="relative">
                <div class="ce-elements-tree__item group relative w-full flex items-center justify-between gap-1 text-left py-1 px-1.5 rounded-md text-gray-600">
                  <button type="button" tabindex="0" class="ce-elements-tree__item__button absolute inset-0 rounded-md text-left py-1 flex flex-row items-center gap-1 focus:bg-gray-200 focus:outline-none pl-8 pr-15" @click="selectItem(section.id)"><span class="relative text-center w-6"><span aria-hidden="true" class="kiwi-icon-fa inline-block leading-0 text-center ce-elements-tree__item__button__icon transition-opacity duration-200 opacity-100"><i :class="section.type === 'modules' ? 'fas fa-sitemap' : 'fas fa-images'" style="font-size: 16px; height: 16px; min-width: 16px;"></i></span><span aria-hidden="true" class="kiwi-icon-fa inline-block leading-0 text-center w-6 h-6 ce-elements-tree__item__button__icon-drag cursor-move transform absolute top-1/2 -translate-y-1/2 left-1/2 -translate-x-1/2 flex items-center justify-center rounded-md bg-transparent focus:bg-gray-200 hover:bg-gray-200 transition-opacity duration-200 opacity-0" title="Arraste e solte para reordenar"><i class="fas fa-grip-vertical" style="font-size: 13px; height: 13px; min-width: 13px;"></i></span></span><span class="ce-elements-tree__item__label flex-1 min-w-0 select-none leading-4 text-sm truncate">{{ section.type === 'modules' ? 'Módulos' : section.title }} – <i class="text-gray-500">{{ section.title }}</i></span></button>
                  <span class="ce-elements-tree__item__toggle relative z-10 h-6 text-left"></span>
                  <span class="ce-elements-tree__item__actions relative ml-auto z-10 h-6 text-right opacity-0 transition-opacity duration-200"><button type="button" tabindex="0" title="Duplicar" class="ce-elements-tree__item__actions__button w-6 h-6 flex items-center justify-center rounded-md transition-all duration-200 bg-transparent focus:bg-gray-200 hover:bg-gray-200 focus:outline-none" @click="duplicateSection(section)"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="24px" height="24px" class="w-4 h-4 flex items-center justify-center"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg></button></span>
                  <span class="ce-elements-tree__item__actions relative z-10 h-6 text-right opacity-0 transition-opacity duration-200"><button type="button" tabindex="0" title="Excluir" class="ce-elements-tree__item__actions__button w-6 h-6 flex items-center justify-center rounded-md transition-all duration-200 bg-transparent focus:bg-gray-200 hover:bg-gray-200 focus:outline-none" @click="removeSection(section.id)"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="24px" height="24px" class="w-4 h-4 flex items-center justify-center"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button></span>
                </div>
              </li>
            </ul>
            <div class="px-0.5 border-l border-r border-transparent relative">
              <button type="button" tabindex="0" title="" class="ce-elements-tree__add-button w-full flex items-center justify-between gap-0.5 text-left py-1 pl-8 pr-1.5 focus:outline-none rounded-md border-2 border-transparent text-blue-600 bg-transparent hover:bg-gray-100 focus:bg-gray-200" @click="showSectionMenu = !showSectionMenu"><span class="ce-elements-tree__add-button__icon text-center w-6 leading-0 pr-0.5"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="24px" height="24px" class="w-5 h-5 inline-block"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg></span><span class="ce-elements-tree__add-button__label flex-1 min-w-0 select-none leading-4 text-sm truncate">Adicionar seção</span></button>
              <div class="fixed z-50 rounded-md shadow-md bg-white p-2 min-w-260px focus:outline-none" :style="{ display: showSectionMenu ? 'block' : 'none', right: '12px', top: '334px' }" role="menu" tabindex="-1">
                <div role="menuitem" tabindex="-1" class="flex items-center justify-left gap-2 w-full p-2 hover:bg-gray-100 rounded-md cursor-pointer" @click="addSection('custom'); showSectionMenu = false"><span aria-hidden="true" class="kiwi-icon-fa inline-block leading-0 text-center text-gray-600 w-4 h-4 flex-shrink-0"><i class="fas fa-images" style="font-size: 14px; height: 14px; min-width: 14px;"></i></span><span class="text-base leading-6 sm:text-sm sm:leading-5 flex-1 text-left truncate">Banner</span></div>
                <div role="menuitem" tabindex="-1" class="flex items-center justify-left gap-2 w-full p-2 hover:bg-gray-100 rounded-md cursor-pointer" @click="addSection('modules'); showSectionMenu = false"><span aria-hidden="true" class="kiwi-icon-fa inline-block leading-0 text-center text-gray-600 w-4 h-4 flex-shrink-0"><i class="fas fa-sitemap" style="font-size: 14px; height: 14px; min-width: 14px;"></i></span><span class="text-base leading-6 sm:text-sm sm:leading-5 flex-1 text-left truncate">Módulos</span></div>
                <div role="menuitem" tabindex="-1" class="flex items-center justify-left gap-2 w-full p-2 hover:bg-gray-100 rounded-md cursor-pointer" @click="addSection('courses'); showSectionMenu = false"><span aria-hidden="true" class="kiwi-icon-fa inline-block leading-0 text-center text-gray-600 w-4 h-4 flex-shrink-0"><i class="fas fa-graduation-cap" style="font-size: 14px; height: 14px; min-width: 14px;"></i></span><span class="text-base leading-6 sm:text-sm sm:leading-5 flex-1 text-left truncate">Cursos</span></div>
                <div role="menuitem" tabindex="-1" class="flex items-center justify-left gap-2 w-full p-2 hover:bg-gray-100 rounded-md cursor-pointer" @click="addSection('lessons'); showSectionMenu = false"><span aria-hidden="true" class="kiwi-icon-fa inline-block leading-0 text-center text-gray-600 w-4 h-4 flex-shrink-0"><i class="fas fa-bookmark" style="font-size: 14px; height: 14px; min-width: 14px;"></i></span><span class="text-base leading-6 sm:text-sm sm:leading-5 flex-1 text-left truncate">Aulas</span></div>
                <div role="menuitem" tabindex="-1" class="flex items-center justify-left gap-2 w-full p-2 hover:bg-gray-100 rounded-md cursor-pointer" @click="addSection('continue'); showSectionMenu = false"><span aria-hidden="true" class="kiwi-icon-fa inline-block leading-0 text-center text-gray-600 w-4 h-4 flex-shrink-0"><i class="fas fa-play-circle" style="font-size: 14px; height: 14px; min-width: 14px;"></i></span><span class="text-base leading-6 sm:text-sm sm:leading-5 flex-1 text-left truncate">Continuar assistindo</span></div>
              </div>
            </div>
          </article>
        </section>
        <section :aria-hidden="panelMode !== 'details'" class="w-full absolute inset-0 transform transition-transform duration-200 ease-in-out bg-white overflow-y-auto" :class="panelMode === 'details' ? 'translate-x-0' : 'translate-x-full'">
          <header class="flex items-center justify-between bg-gray-50 border-b py-2 pl-4 pr-2">
            <div class="flex items-center mt-0.5 mr-2">
              <button class="py-2 rounded-md border border-transparent outline-none focus:outline-none text-gray-400 focus:text-gray-600 hover:text-gray-600" @click="panelMode = 'tree'">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="24px" height="24px" class="h-5 w-5"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
              </button>
            </div>
            <h2 id="slide-over-title" class="flex-1 text-lg font-medium text-gray-900 break-all">{{ activePanelTitle }}</h2>
            <button v-if="selectedKind === 'section'" title="Excluir" type="button" class="p-2 rounded-md border border-transparent outline-none focus:outline-none text-red-500 hover:bg-red-50" @click="selectedSection && removeSection(selectedSection.id); panelMode = 'tree'">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="24px" height="24px" class="h-5 w-5"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
            </button>
            <button v-else disabled="disabled" title="Não é possível excluir todas as seções" type="button" class="p-2 rounded-md border border-transparent outline-none focus:outline-none text-red-300">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="24px" height="24px" class="h-5 w-5"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
            </button>
          </header>

          <div class="p-4 space-y-5">
            <template v-if="selectedKind === 'banner'">
              <label class="block text-sm font-medium leading-5 text-gray-700">Título</label>
              <input class="form-input block w-full rounded-md shadow-sm sm:text-sm sm:leading-5" :value="editor.home.banner.title" @input="updateEditor(() => editor.home.banner.title = ($event.target as HTMLInputElement).value)">
              <label class="block text-sm font-medium leading-5 text-gray-700">Imagem Mobile</label>
              <label for="banner-mobile-upload" class="hover:bg-gray-50 cursor-pointer flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 transition duration-300 border-dashed rounded-md h-48 items-center" @dragover.prevent @drop="handleImageUpload($event, 'banner')">
                <div class="space-y-1 text-center">
                  <svg stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true" class="mx-auto h-12 w-12 text-gray-400"><path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path></svg>
                  <div class="flex flex-col text-sm text-gray-600"><div class="relative cursor-pointer rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"><span>Selecione do computador</span><input id="banner-mobile-upload" accept="image/jpeg,image/jpg,image/png,image/webp" type="file" class="sr-only" @change="handleImageUpload($event, 'banner')"></div><p class="pl-1">ou arraste/solte aqui</p></div>
                  <p class="text-xs text-gray-500">JPEG, JPG, PNG, WEBP até 2 MB</p>
                </div>
              </label>
              <p v-if="uploadError" class="text-sm text-red-600">{{ uploadError }}</p>
              <label class="block text-sm font-medium leading-5 text-gray-700">Imagem Desktop</label>
              <div v-if="editor.home.banner.imageUrl" class="relative rounded-md overflow-hidden bg-gray-400 h-40 flex items-center justify-center">
                <img :src="editor.home.banner.imageUrl" alt="" class="w-full h-full object-cover opacity-80">
                <button type="button" class="absolute inset-0 m-auto w-10 h-10 flex items-center justify-center rounded-md text-white bg-black bg-opacity-50 hover:bg-opacity-70" @click="clearImage('banner')">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="24px" height="24px" class="h-6 w-6"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                </button>
              </div>
              <label class="flex items-center">
                <span role="checkbox" tabindex="0" :aria-checked="editor.home.banner.visible" :class="editor.home.banner.visible ? 'bg-indigo-500' : 'bg-gray-200'" class="relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none" @click="updateEditor(() => editor.home.banner.visible = !editor.home.banner.visible)"><span aria-hidden="true" :class="editor.home.banner.visible ? 'translate-x-5' : 'translate-x-0'" class="inline-block h-5 w-5 rounded-full bg-white shadow transform transition ease-in-out duration-200"></span></span>
                <span class="block text-sm font-medium leading-5 text-gray-700 ml-2 cursor-pointer">Exibir banner</span>
              </label>
            </template>

            <template v-else-if="selectedKind === 'slide' && selectedSlide">
              <label class="block text-sm font-medium leading-5 text-gray-700">Nome do slide</label>
              <input class="form-input block w-full rounded-md shadow-sm sm:text-sm sm:leading-5" :value="selectedSlide.title" @input="updateEditor(() => selectedSlide!.title = ($event.target as HTMLInputElement).value)">
              <label class="block text-sm font-medium leading-5 text-gray-700">Imagem Mobile</label>
              <label :for="`slide-upload-${selectedSlide.id}`" class="hover:bg-gray-50 cursor-pointer flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 transition duration-300 border-dashed rounded-md h-48 items-center" @dragover.prevent @drop="handleImageUpload($event, 'slide')">
                <div class="space-y-1 text-center">
                  <svg stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true" class="mx-auto h-12 w-12 text-gray-400"><path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path></svg>
                  <div class="flex flex-col text-sm text-gray-600"><div class="relative cursor-pointer rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500"><span>Selecione do computador</span><input :id="`slide-upload-${selectedSlide.id}`" accept="image/jpeg,image/jpg,image/png,image/webp" type="file" class="sr-only" @change="handleImageUpload($event, 'slide')"></div><p class="pl-1">ou arraste/solte aqui</p></div>
                  <p class="text-xs text-gray-500">JPEG, JPG, PNG, WEBP até 2 MB</p>
                </div>
              </label>
              <p v-if="uploadError" class="text-sm text-red-600">{{ uploadError }}</p>
              <label class="block text-sm font-medium leading-5 text-gray-700">Imagem Desktop</label>
              <div v-if="selectedSlide.imageUrl" class="relative rounded-md overflow-hidden bg-gray-400 h-40 flex items-center justify-center">
                <img :src="selectedSlide.imageUrl" alt="" class="w-full h-full object-cover opacity-80">
                <button type="button" class="absolute inset-0 m-auto w-10 h-10 flex items-center justify-center rounded-md text-white bg-black bg-opacity-50 hover:bg-opacity-70" @click="clearImage('slide')">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="24px" height="24px" class="h-6 w-6"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                </button>
              </div>
              <button type="button" :disabled="editor.home.slides.length <= 1" class="inline-flex justify-center items-center text-center font-medium rounded-md border transition ease-in-out duration-150 focus:outline-none text-red-600 bg-transparent focus-visible:bg-red-50 hover:bg-red-50 border border-transparent leading-5 text-sm py-2 px-3 gap-2" @click="removeSlide(selectedSlide.id); panelMode = 'tree'">Remover slide</button>
            </template>

            <template v-else-if="selectedKind === 'section' && selectedSection">
              <label class="block text-sm font-medium leading-5 text-gray-700">Tipo</label>
              <select class="form-select block w-full rounded-md shadow-sm sm:text-sm sm:leading-5" :value="selectedSection.type" @change="updateEditor(() => selectedSection!.type = ($event.target as HTMLSelectElement).value)">
                <option value="modules">Módulos</option>
                <option value="courses">Cursos</option>
                <option value="lessons">Aulas</option>
                <option value="continue">Continuar assistindo</option>
                <option value="custom">Banner</option>
              </select>
              <label class="block text-sm font-medium leading-5 text-gray-700">Título</label>
              <input class="form-input block w-full rounded-md shadow-sm sm:text-sm sm:leading-5" :value="selectedSection.title" @input="updateEditor(() => selectedSection!.title = ($event.target as HTMLInputElement).value)">
              <label class="block text-sm font-medium leading-5 text-gray-700">Texto</label>
              <textarea class="form-textarea block w-full rounded-md shadow-sm sm:text-sm sm:leading-5" rows="3" :value="selectedSection.subtitle" @input="updateEditor(() => selectedSection!.subtitle = ($event.target as HTMLTextAreaElement).value)"></textarea>
              <label class="block text-sm font-medium leading-5 text-gray-700">Imagem</label>
              <input class="form-input block w-full rounded-md shadow-sm sm:text-sm sm:leading-5" :value="selectedSection.imageUrl" @input="updateEditor(() => selectedSection!.imageUrl = ($event.target as HTMLInputElement).value)">
              <div class="flex items-center gap-2">
                <button type="button" class="inline-flex justify-center items-center text-center font-medium rounded-md border transition ease-in-out duration-150 focus:outline-none text-gray-600 bg-transparent focus-visible:bg-gray-100 hover:bg-gray-100 border border-gray-300 leading-5 text-sm py-2 px-3 gap-2" @click="moveSection(selectedSection.id, -1)">Subir</button>
                <button type="button" class="inline-flex justify-center items-center text-center font-medium rounded-md border transition ease-in-out duration-150 focus:outline-none text-gray-600 bg-transparent focus-visible:bg-gray-100 hover:bg-gray-100 border border-gray-300 leading-5 text-sm py-2 px-3 gap-2" @click="moveSection(selectedSection.id, 1)">Descer</button>
                <button type="button" class="inline-flex justify-center items-center text-center font-medium rounded-md border transition ease-in-out duration-150 focus:outline-none text-gray-600 bg-transparent focus-visible:bg-gray-100 hover:bg-gray-100 border border-gray-300 leading-5 text-sm py-2 px-3 gap-2" @click="duplicateSection(selectedSection)">Duplicar</button>
              </div>
            </template>

            <template v-else-if="activeTab === 'menu'">
              <label class="block text-sm font-medium leading-5 text-gray-700">Nome da área</label>
              <input class="form-input block w-full rounded-md shadow-sm sm:text-sm sm:leading-5" :value="editor.sidebar.title" @input="updateEditor(() => editor.sidebar.title = ($event.target as HTMLInputElement).value)">
              <label class="block text-sm font-medium leading-5 text-gray-700">Marca</label>
              <input class="form-input block w-full rounded-md shadow-sm sm:text-sm sm:leading-5" :value="editor.sidebar.brandName" @input="updateEditor(() => editor.sidebar.brandName = ($event.target as HTMLInputElement).value)">
              <label class="block text-sm font-medium leading-5 text-gray-700">Logo</label>
              <input class="form-input block w-full rounded-md shadow-sm sm:text-sm sm:leading-5" :value="editor.sidebar.logoUrl" @input="updateEditor(() => editor.sidebar.logoUrl = ($event.target as HTMLInputElement).value)">
              <label class="block text-sm font-medium leading-5 text-gray-700">Home</label>
              <input class="form-input block w-full rounded-md shadow-sm sm:text-sm sm:leading-5" :value="editor.sidebar.links.home" @input="updateEditor(() => editor.sidebar.links.home = ($event.target as HTMLInputElement).value)">
              <label class="block text-sm font-medium leading-5 text-gray-700">Instagram</label>
              <input class="form-input block w-full rounded-md shadow-sm sm:text-sm sm:leading-5" :value="editor.sidebar.links.instagram" @input="updateEditor(() => editor.sidebar.links.instagram = ($event.target as HTMLInputElement).value)">
              <label class="block text-sm font-medium leading-5 text-gray-700">Link Instagram</label>
              <input class="form-input block w-full rounded-md shadow-sm sm:text-sm sm:leading-5" :value="editor.sidebar.links.instagramUrl" @input="updateEditor(() => editor.sidebar.links.instagramUrl = ($event.target as HTMLInputElement).value)">
              <label class="block text-sm font-medium leading-5 text-gray-700">Suporte</label>
              <input class="form-input block w-full rounded-md shadow-sm sm:text-sm sm:leading-5" :value="editor.sidebar.links.support" @input="updateEditor(() => editor.sidebar.links.support = ($event.target as HTMLInputElement).value)">
              <label class="block text-sm font-medium leading-5 text-gray-700">Link Suporte</label>
              <input class="form-input block w-full rounded-md shadow-sm sm:text-sm sm:leading-5" :value="editor.sidebar.links.supportUrl" @input="updateEditor(() => editor.sidebar.links.supportUrl = ($event.target as HTMLInputElement).value)">
            </template>

            <template v-else-if="activeTab === 'login'">
              <label class="block text-sm font-medium leading-5 text-gray-700">Título do login</label>
              <input class="form-input block w-full rounded-md shadow-sm sm:text-sm sm:leading-5" :value="editor.login.title || 'Acesse sua área de membros'" @input="updateEditor(() => editor.login.title = ($event.target as HTMLInputElement).value)">
              <label class="block text-sm font-medium leading-5 text-gray-700">Texto de apoio</label>
              <textarea class="form-textarea block w-full rounded-md shadow-sm sm:text-sm sm:leading-5" rows="3" :value="editor.login.subtitle || ''" @input="updateEditor(() => editor.login.subtitle = ($event.target as HTMLTextAreaElement).value)"></textarea>
              <label class="block text-sm font-medium leading-5 text-gray-700">Imagem de fundo</label>
              <input class="form-input block w-full rounded-md shadow-sm sm:text-sm sm:leading-5" :value="editor.login.imageUrl || editor.home.banner.imageUrl" @input="updateEditor(() => editor.login.imageUrl = ($event.target as HTMLInputElement).value)">
            </template>

            <template v-else-if="activeTab === 'settings'">
              <label class="block text-sm font-medium leading-5 text-gray-700">Cor principal</label>
              <input type="color" class="form-input block w-full rounded-md shadow-sm sm:text-sm sm:leading-5 h-10" :value="editor.theme.primaryColor" @input="updateEditor(() => editor.theme.primaryColor = ($event.target as HTMLInputElement).value)">
              <label class="block text-sm font-medium leading-5 text-gray-700">Cor do menu</label>
              <input type="color" class="form-input block w-full rounded-md shadow-sm sm:text-sm sm:leading-5 h-10" :value="editor.theme.sidebarColor" @input="updateEditor(() => editor.theme.sidebarColor = ($event.target as HTMLInputElement).value)">
              <label class="block text-sm font-medium leading-5 text-gray-700">Fundo</label>
              <input type="color" class="form-input block w-full rounded-md shadow-sm sm:text-sm sm:leading-5 h-10" :value="editor.theme.backgroundColor" @input="updateEditor(() => editor.theme.backgroundColor = ($event.target as HTMLInputElement).value)">
              <label class="flex items-center">
                <span role="checkbox" tabindex="0" :aria-checked="!!editor.settings.commentsEnabled" :class="editor.settings.commentsEnabled ? 'bg-indigo-500' : 'bg-gray-200'" class="relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none" @click="updateEditor(() => editor.settings.commentsEnabled = !editor.settings.commentsEnabled)"><span aria-hidden="true" :class="editor.settings.commentsEnabled ? 'translate-x-5' : 'translate-x-0'" class="inline-block h-5 w-5 rounded-full bg-white shadow transform transition ease-in-out duration-200"></span></span>
                <span class="block text-sm font-medium leading-5 text-gray-700 ml-2 cursor-pointer">Ativar comentários</span>
              </label>
            </template>
          </div>
        </section>
      </section>
    </div>
  </main>
</template>

<style>
.phone-container{width:100%;height:100%}
.phone-enabled{display:flex;align-items:center;justify-content:center;padding:.25rem;box-sizing:border-box}
.phone-device{width:100%;height:100%}
.phone-frame-active{position:relative;--iphone-width:306;--iphone-height:642;--max-phone-height:min(calc(100vh - var(--navbar-size)),800px);--max-phone-width:calc(var(--max-phone-height)*var(--iphone-width)/var(--iphone-height));aspect-ratio:var(--iphone-width)/var(--iphone-height);width:min(100%,var(--max-phone-width));height:auto;max-height:100%;background:linear-gradient(145deg,#2a2a2a,#1a1a1a);border:solid #0f0f0f;border-radius:clamp(20px,3vw,32px);padding:clamp(1px,.2vw,2px);box-shadow:0 25px 50px -12px rgba(0,0,0,.4),0 10px 20px -5px rgba(0,0,0,.2),inset 0 1px 2px hsla(0,0%,100%,.1)}
.volume-buttons{position:absolute;left:calc(clamp(2px, .4vw, 4px)*-1 + -2px);top:15%;z-index:15}
.volume-down,.volume-up{width:clamp(1px,.3vw,3px);background:linear-gradient(90deg,#2a2a2a,#1a1a1a);border-radius:0 2px 2px 0;box-shadow:inset 0 1px 2px rgba(0,0,0,.5)}
.volume-up{height:clamp(16px,5%,24px);margin-bottom:0.25rem}
.volume-down{height:clamp(24px,7%,32px)}
.power-button{position:absolute;right:calc(clamp(2px, .4vw, 4px)*-1 + -2px);top:10%;width:clamp(1px,.3vw,3px);height:8%;background:linear-gradient(270deg,#2a2a2a,#1a1a1a);border-radius:2px 0 0 2px;box-shadow:inset 0 1px 2px rgba(0,0,0,.5);z-index:15}
.phone-frame{position:relative;width:100%;height:100%;--bg-opacity:1;background-color:#000000;background-color:rgba(0,0,0,var(--bg-opacity));overflow:hidden;border-radius:clamp(18px,2.8vw,28px)}
.dynamic-island{position:absolute;top:clamp(8px,1.5%,12px);left:50%;transform:translateX(-50%);width:25%;height:3.5%;background:linear-gradient(145deg,#0a0a0a,#1a1a1a);border-radius:clamp(12px,1.8vw,16px);border:1px solid hsla(0,0%,100%,.03);box-shadow:0 4px 12px rgba(0,0,0,.6);z-index:20}
.island-speaker{position:absolute;--bg-opacity:1;background-color:#252f3f;background-color:rgba(37,47,63,var(--bg-opacity));border-radius:0.125rem;top:50%;left:30%;transform:translate(-50%,-50%);width:clamp(20px,3vw,28px);height:clamp(2px,.3vh,3px)}
.island-camera{position:absolute;border-radius:9999px;top:50%;right:8px;transform:translateY(-50%);width:clamp(6px,1vw,9px);height:clamp(6px,1vw,9px);background:radial-gradient(circle,#0a0a0a,#2a2a2a);box-shadow:inset 0 1px 2px rgba(0,0,0,.9)}
.home-indicator{position:absolute;border-radius:0.25rem;bottom:8px;left:50%;transform:translateX(-50%);width:clamp(100px,15vw,140px);height:clamp(3px,.5vh,5px);background:hsla(0,0%,100%,.4);z-index:20}
.members-area-editor .screen{width:100%;height:100%;position:static;top:auto;left:auto;border:0;border-radius:0;background:transparent;box-sizing:border-box;cursor:auto;overflow:visible}
.ce-dropdown{--arrow-size:4px;top:calc(100% + var(--arrow-size) + 2px);width:-moz-max-content;width:max-content}
.ce-dropdown:before{content:"";position:absolute;top:calc(var(--arrow-size)*-1);width:0;height:0;border-left:var(--arrow-size) solid transparent;border-right:var(--arrow-size) solid transparent;border-bottom:var(--arrow-size) solid #fff}
.ce-dropdown.end{right:0}
.ce-dropdown.end:before{right:8px}
.max-w-24rem{max-width:24rem}
.overscroll-none{overscroll-behavior:none}
.members-area-editor{--navbar-padding-x:0.75rem;--sidebar-width:24rem;--page-content-height:calc(100vh - var(--navbar-size));--page-content-padding:0}
.members-area-editor.sidebar-open{--navbar-padding-x:calc(var(--scrollbar-width) + 0.75rem);--page-content-padding-right:var(--sidebar-width)}
.members-area-editor .navbar{min-height:3.5rem;padding-left:var(--navbar-padding-x);padding-right:var(--navbar-padding-x)}
.members-area-editor .page-content{height:var(--page-content-height);padding:var(--page-content-padding) var(--page-content-padding-right,var(--page-content-padding)) var(--page-content-padding) var(--page-content-padding)}
.ce-sidebar{top:var(--navbar-size)}
@media (min-width:1536px){.members-area-editor{--page-content-padding:0.75rem}.members-area-editor.sidebar-open .page-content{--page-content-padding-right:calc(var(--sidebar-width) + var(--page-content-padding))}}
@media (max-width:480px) or ((orientation:landscape) and (max-height:600px)){.phone-enabled{padding:.125rem}}
</style>
