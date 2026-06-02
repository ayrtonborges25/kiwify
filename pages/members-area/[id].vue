<script setup lang="ts">
import type { MembersAreaLesson, MembersAreaLessonAttachment, MembersAreaModule } from '~/data/membersArea'
import { defaultFigurinhasModuleImage } from '~/data/memberClub'
import { uploadFile } from '~/utils/supabase'

useHead({ title: 'Área de Membros Produto' })
useLegacyKiwifyInteractions()
useComplexFieldMocks()

const route = useRoute()
const router = useRouter()
const {
  getMembersAreaById,
  listMembersAreaCourses,
  listCourseModules,
  listMembersAreaStudents,
  listMembersAreaGroups,
  saveMembersAreaGroups,
  saveMembersAreaSettings,
  createModule,
  updateModule,
  deleteModule,
  saveLesson,
  deleteLesson
} = useMembersArea()

const membersAreaId = computed(() => String(route.params.id || 'c6d46bd7-9ced-4fb2-a4a0-ae033e3b612a'))
const courseId = computed(() => String(route.query.course || ''))
const activeTab = computed(() => String(route.query.tab || 'courses'))
const membersArea = computed(() => getMembersAreaById(membersAreaId.value))
const areaName = computed(() => membersArea.value?.name || 'Figurinhas da Copa 2026')
const coverUrl = computed(() => membersArea.value?.coverUrl || '')
const defaultCourseId = computed(() => membersArea.value?.courseId || 'ff3e052e-bc89-466f-9392-d1cf3fe738dc')
const courses = ref<any[]>([])
const courseModules = ref<MembersAreaModule[]>([])
const students = ref<any[]>([])
const groups = ref<any[]>([])
const membersDataLoading = ref(false)
const settingsSaving = ref(false)
const moduleImageUploading = ref(false)
const groupDraft = ref('')
const openModuleMenuId = ref('')
const showModuleModal = ref(false)
const showAddMenu = ref(false)
const moduleDraft = reactive({
  id: '',
  title: '',
  imageUrl: ''
})
const editingLesson = ref<MembersAreaLesson | null>(null)
const lessonForm = reactive({
  id: '',
  moduleId: '',
  title: '',
  description: '',
  videoUrl: '',
  thumbnailUrl: '',
  content: '',
  attachments: [] as MembersAreaLessonAttachment[],
  releaseType: 'immediate' as 'immediate' | 'days' | 'date',
  releaseDays: 0,
  releaseDate: '',
  durationLimited: false,
  status: 'Publicado'
})
const settingsForm = reactive({
  type: 'complete' as 'lite' | 'complete',
  commentsEnabled: false
})
const selectedCourse = computed(() => courses.value[0])
const moduleCount = computed(() => courseModules.value.length || Math.max(1, Number((membersArea.value as any)?.modules || courses.value.length || 1)))
const isCourseOpen = computed(() => activeTab.value === 'courses' && Boolean(courseId.value))
const isEditingContent = computed(() => isCourseOpen.value && Boolean(route.query.content))
const publicClubPath = computed(() => `/club=${membersAreaId.value}`)
const editorPath = computed(() => `/members-area/${membersAreaId.value}/editor`)
const activeCourseId = computed(() => courseId.value || selectedCourse.value?.id || defaultCourseId.value)
const selectedModule = computed(() => courseModules.value.find((module) => module.id === moduleDraft.id))
const modulePreviewImage = computed(() => moduleDraft.imageUrl)

const tabs = [
  { key: 'courses', label: 'Cursos', icon: 'M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z' },
  { key: 'students', label: 'Alunos', icon: 'M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z' },
  { key: 'groups', label: 'Grupos', icon: 'M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM13 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2h-2zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM13 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2h-2z' },
  { key: 'settings', label: 'Configurações', icon: 'M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947z' },
  { key: 'customizations', label: 'Personalizações', icon: 'M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z' }
]

const tabPath = (tab: string) => tab === 'customizations'
  ? editorPath.value
  : `/members-area/${membersAreaId.value}?tab=${tab}${tab === 'courses' && courseId.value ? `&course=${courseId.value}` : ''}`
const coursePath = (id = defaultCourseId.value) => `/members-area/${membersAreaId.value}?tab=courses&course=${id}`
const contentEditPath = (lessonId: string) => `/members-area/${membersAreaId.value}?tab=courses&course=${activeCourseId.value}&content=${lessonId}`

const goBack = () => {
  if (isCourseOpen.value) router.push(`/members-area/${membersAreaId.value}?tab=courses`)
  else router.push('/members-area')
}

const loadMembersAreaData = async () => {
  membersDataLoading.value = true
  try {
    const [courseRows, studentRows, groupRows] = await Promise.all([
      listMembersAreaCourses(membersAreaId.value),
      listMembersAreaStudents(membersAreaId.value),
      listMembersAreaGroups(membersAreaId.value)
    ])
    courses.value = courseRows
    const targetCourseId = String(courseId.value || courseRows[0]?.id || defaultCourseId.value || '')
    courseModules.value = targetCourseId ? await listCourseModules(targetCourseId) : []
    const contentId = String(route.query.content || '')
    if (contentId && contentId !== 'new') {
      const lesson = courseModules.value.flatMap((module) => module.contents || []).find((item) => item.id === contentId)
      if (lesson) {
        editingLesson.value = lesson
        fillLessonForm(lesson)
      }
    }
    students.value = studentRows
    groups.value = groupRows
    Object.assign(settingsForm, {
      type: membersArea.value?.settings?.type || 'complete',
      commentsEnabled: Boolean(membersArea.value?.settings?.commentsEnabled)
    })
  } finally {
    membersDataLoading.value = false
  }
}

const reloadCourseModules = async () => {
  if (!activeCourseId.value) return
  courseModules.value = await listCourseModules(activeCourseId.value)
}

const openCreateModuleModal = () => {
  Object.assign(moduleDraft, { id: '', title: 'Novo módulo', imageUrl: '' })
  showModuleModal.value = true
  showAddMenu.value = false
}

const openEditModuleModal = (module: MembersAreaModule) => {
  Object.assign(moduleDraft, {
    id: module.id || '',
    title: module.title,
    imageUrl: module.imageUrl === defaultFigurinhasModuleImage ? '' : (module.imageUrl || '')
  })
  showModuleModal.value = true
  openModuleMenuId.value = ''
}

const fileToDataUrl = (file: File) => new Promise<string>((resolve, reject) => {
  const reader = new FileReader()
  reader.onload = () => resolve(String(reader.result || ''))
  reader.onerror = () => reject(reader.error)
  reader.readAsDataURL(file)
})

const handleModuleImageUpload = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  moduleImageUploading.value = true
  try {
    const safeName = file.name.replace(/[^\w.-]+/g, '-')
    const path = `modules/${activeCourseId.value}/${moduleDraft.id || 'new'}-${Date.now()}-${safeName}`
    const { data, error } = await uploadFile('member-area-covers', path, file)
    moduleDraft.imageUrl = !error && data?.publicUrl ? data.publicUrl : await fileToDataUrl(file)
  } finally {
    moduleImageUploading.value = false
    input.value = ''
  }
}

const handleModuleCropComplete = (event: Event) => {
  const detail = (event as CustomEvent<{ key?: string; url?: string }>).detail
  if (!detail?.url) return

  const key = detail.key || ''
  if (key === 'moduleimageupload' || key === 'module-image-upload') {
    moduleDraft.imageUrl = detail.url
  }
}

const saveModuleDraft = async () => {
  if (moduleDraft.id) {
    await updateModule(activeCourseId.value, moduleDraft.id, {
      title: moduleDraft.title || 'Novo módulo',
      imageUrl: moduleDraft.imageUrl
    })
  } else {
    await createModule(activeCourseId.value, {
      title: moduleDraft.title || 'Novo módulo',
      imageUrl: moduleDraft.imageUrl
    })
  }
  showModuleModal.value = false
  await reloadCourseModules()
}

const removeModule = async (module: MembersAreaModule) => {
  if (!module.id) return
  await deleteModule(activeCourseId.value, module.id)
  openModuleMenuId.value = ''
  await reloadCourseModules()
}

const blankLesson = (moduleId: string): MembersAreaLesson => ({
  id: '',
  courseId: activeCourseId.value,
  moduleId,
  title: 'Novo conteúdo',
  description: '',
  content: '',
  videoUrl: '',
  thumbnailUrl: '',
  attachments: [],
  releaseType: 'immediate',
  releaseDays: 0,
  releaseDate: '',
  durationLimited: false,
  position: 1,
  status: 'Publicado'
})

const fillLessonForm = (lesson: MembersAreaLesson) => {
  Object.assign(lessonForm, {
    id: lesson.id || '',
    moduleId: lesson.moduleId,
    title: lesson.title || 'Novo conteúdo',
    description: lesson.description || '',
    videoUrl: lesson.videoUrl || '',
    thumbnailUrl: lesson.thumbnailUrl || '',
    content: lesson.content || '',
    attachments: [...(lesson.attachments || [])],
    releaseType: lesson.releaseType || 'immediate',
    releaseDays: Number(lesson.releaseDays || 0),
    releaseDate: lesson.releaseDate || '',
    durationLimited: Boolean(lesson.durationLimited),
    status: lesson.status || 'Publicado'
  })
}

const startCreateLesson = async (moduleId?: string) => {
  const targetModuleId = moduleId || courseModules.value[0]?.id
  if (!targetModuleId) {
    await createModule(activeCourseId.value, { title: 'Novo módulo' })
    await reloadCourseModules()
  }
  const finalModuleId = targetModuleId || courseModules.value[0]?.id || ''
  const lesson = blankLesson(finalModuleId)
  fillLessonForm(lesson)
  editingLesson.value = lesson
  showAddMenu.value = false
  await router.push(`/members-area/${membersAreaId.value}?tab=courses&course=${activeCourseId.value}&content=new`)
}

const handleToolbarUploadClick = async () => {
  await startCreateLesson()
}

const openLessonEditor = async (lesson: MembersAreaLesson) => {
  editingLesson.value = lesson
  fillLessonForm(lesson)
  await router.push(contentEditPath(lesson.id))
}

const closeLessonEditor = async () => {
  editingLesson.value = null
  await router.push(`/members-area/${membersAreaId.value}?tab=courses&course=${activeCourseId.value}`)
}

const saveContent = async () => {
  const saved = await saveLesson(activeCourseId.value, {
    ...lessonForm,
    moduleId: lessonForm.moduleId || courseModules.value[0]?.id || '',
    title: lessonForm.title || 'Novo conteúdo',
    attachments: lessonForm.attachments
  })
  await reloadCourseModules()
  if (saved) {
    editingLesson.value = saved
    fillLessonForm(saved)
    await router.replace(contentEditPath(saved.id))
  }
}

const removeContent = async () => {
  if (!lessonForm.id || !lessonForm.moduleId) return
  await deleteLesson(activeCourseId.value, lessonForm.moduleId, lessonForm.id)
  await reloadCourseModules()
  await closeLessonEditor()
}

const readFileAsDataUrl = (file: File) => new Promise<string>((resolve, reject) => {
  const reader = new FileReader()
  reader.onload = () => resolve(String(reader.result || ''))
  reader.onerror = () => reject(reader.error)
  reader.readAsDataURL(file)
})

const uploadMemberFile = async (file: File, kind: 'video' | 'thumbnail' | 'attachment') => {
  const extension = file.name.split('.').pop() || 'file'
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '-')
  const bucket = kind === 'attachment' ? 'course-videos' : 'course-videos'
  const uploaded = await uploadFile(bucket, `${membersAreaId.value}/${activeCourseId.value}/${Date.now()}-${safeName}`, file)
  return uploaded.data?.publicUrl || await readFileAsDataUrl(file)
}

const handleVideoUpload = async (event: Event | DragEvent) => {
  event.preventDefault()
  const input = event.target as HTMLInputElement
  const dropped = 'dataTransfer' in event ? event.dataTransfer?.files?.[0] : null
  const file = dropped || input.files?.[0]
  if (!file) return
  lessonForm.videoUrl = await uploadMemberFile(file, 'video')
  if (input?.value !== undefined) input.value = ''
}

const handleThumbnailUpload = async (event: Event | DragEvent) => {
  event.preventDefault()
  const input = event.target as HTMLInputElement
  const dropped = 'dataTransfer' in event ? event.dataTransfer?.files?.[0] : null
  const file = dropped || input.files?.[0]
  if (!file) return
  lessonForm.thumbnailUrl = await uploadMemberFile(file, 'thumbnail')
  if (input?.value !== undefined) input.value = ''
}

const handleAttachmentUpload = async (event: Event | DragEvent) => {
  event.preventDefault()
  const input = event.target as HTMLInputElement
  const files = [...(('dataTransfer' in event ? event.dataTransfer?.files : input.files) || [])].slice(0, 10)
  const uploaded = await Promise.all(files.map(async (file) => ({
    id: `file-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    name: file.name,
    size: file.size,
    type: file.type,
    url: await uploadMemberFile(file, 'attachment')
  })))
  lessonForm.attachments = [...lessonForm.attachments, ...uploaded].slice(0, 10)
  if (input?.value !== undefined) input.value = ''
}

const useYoutubeVideo = () => {
  const url = window.prompt('URL do YouTube')
  if (url) lessonForm.videoUrl = url
}

const removeAttachment = (attachmentId: string) => {
  lessonForm.attachments = lessonForm.attachments.filter((attachment) => attachment.id !== attachmentId)
}

watch(() => route.query.content, (contentId) => {
  if (!contentId || !isCourseOpen.value) return
  if (contentId === 'new') {
    if (!editingLesson.value) void startCreateLesson()
    return
  }
  const lesson = courseModules.value.flatMap((module) => module.contents || []).find((item) => item.id === contentId)
  if (lesson) {
    editingLesson.value = lesson
    fillLessonForm(lesson)
  }
})

const addGroup = async () => {
  const name = groupDraft.value.trim() || `Grupo ${String.fromCharCode(65 + groups.value.length)}`
  const nextGroups = [...groups.value, { id: `group-${Date.now()}`, name, students: 0, isDefault: false }]
  groups.value = await saveMembersAreaGroups(membersAreaId.value, nextGroups)
  groupDraft.value = ''
}

const removeGroup = async (groupId: string) => {
  const nextGroups = groups.value.filter((group) => group.id !== groupId || group.isDefault)
  groups.value = await saveMembersAreaGroups(membersAreaId.value, nextGroups)
}

const saveSettings = async () => {
  settingsSaving.value = true
  try {
    await saveMembersAreaSettings(membersAreaId.value, {
      type: settingsForm.type,
      commentsEnabled: settingsForm.commentsEnabled
    })
  } finally {
    settingsSaving.value = false
  }
}

watch(membersAreaId, loadMembersAreaData)
watch(courseId, reloadCourseModules)

onMounted(() => {
  loadMembersAreaData()
  window.addEventListener('kiwify:crop-complete', handleModuleCropComplete)
})

onBeforeUnmount(() => {
  window.removeEventListener('kiwify:crop-complete', handleModuleCropComplete)
})
</script>

<template>
  <NuxtPage v-if="route.name === 'members-area-id-editor'" />
  <KiwifyChrome v-else :hide-topbar="isEditingContent">
    <div class="container mx-auto px-4 sm:px-8 py-8 lg:py-10 lg:px-20">
      <header v-if="!isEditingContent" class="w-full flex flex-row gap-4 items-center justify-items-stretch page-header mb-8">
        <button type="button" class="p-1.5 -m-1.5 rounded-md cursor-pointer bg-transparent outline-none focus:outline-none transition-all ease-in-out duration-200 focus:bg-gray-200 hover:bg-gray-200" title="Voltar" @click="goBack">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="24px" height="24px" class="w-6 h-6"><path fill-rule="evenodd" d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z" clip-rule="evenodd"></path></svg>
        </button>
        <h3 class="font-bold leading-6 text-2xl text-gray-900 flex flex-col flex-1">{{ areaName }}</h3>
        <NuxtLink :to="publicClubPath" target="_blank" class="inline-flex justify-center items-center text-center font-medium rounded-md border transition ease-in-out duration-150 focus:outline-none text-gray-700 hover:text-gray-500 active:text-gray-800 bg-white active:bg-gray-50 border-gray-300 focus:border-blue-300 focus:shadow-outline-blue leading-5 text-sm px-4 py-2 gap-2 cursor-pointer shadow-sm">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="24px" height="24px" class="h-5 w-5"><path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z"></path><path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z"></path></svg>
          <div class="hidden md:block">Pré-visualizar</div>
        </NuxtLink>
      </header>

      <div v-if="!isEditingContent" class="w-full bg-gray-50 rounded-lg shadow">
        <div class="md:hidden">
          <select :value="activeTab" class="mt-1 form-select block w-full pl-3 pr-10 py-2 text-base leading-6 border-gray-300 focus:outline-none focus:shadow-outline-blue focus:border-blue-300 sm:text-sm sm:leading-5 transition ease-in-out duration-150" @change="router.push(tabPath(($event.target as HTMLSelectElement).value))">
            <option value="courses">Cursos</option>
            <option value="students">Alunos</option>
            <option value="groups">Grupos</option>
            <option value="settings">Configurações</option>
            <option value="customizations">Personalizações</option>
          </select>
        </div>
        <div class="hidden md:block">
          <div class="border-b border-gray-200">
            <nav data-cy="navigation-tabs" class="flex px-8 gap-8 -mb-px relative">
              <span class="absolute bottom-0 z-0 border-b-2 border-indigo-500 ease-out transition-transform transition-medium" style="height: 1px; transform: translateX(-32px); width: 0px;"></span>
              <div v-for="tab in tabs" :key="tab.key">
                <NuxtLink
                  :to="tabPath(tab.key)"
                  class="min-w-0 cursor-pointer group flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm leading-5 focus:outline-none"
                  :class="activeTab === tab.key ? 'text-indigo-600 border-indigo-500' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="24px" height="24px" class="-ml-0.5 h-5 w-5" :class="activeTab === tab.key ? 'text-indigo-500 group-focus:text-indigo-600' : 'text-gray-400 group-hover:text-gray-500 group-focus:text-gray-600'">
                    <path :d="tab.icon"></path>
                  </svg>
                  <span class="flex-1 min-w-0 select-none truncate">{{ tab.label }}</span>
                </NuxtLink>
              </div>
            </nav>
          </div>
        </div>
      </div>

      <template v-if="!isCourseOpen && activeTab === 'courses'">
        <div class="mt-8 md:px-10">
          <div class="page-header flex-wrap">
            <div class="page-title" style="padding-block: 7px;">Cursos</div>
            <div class="flex items-center">
              <button type="button" class="mr-2 inline-flex justify-center items-center text-center font-medium rounded-md border transition ease-in-out duration-150 focus:outline-none text-gray-700 hover:text-gray-500 active:text-gray-800 bg-white active:bg-gray-50 border-gray-300 focus:border-blue-300 focus:shadow-outline-blue leading-5 text-sm px-4 py-2 gap-2 cursor-pointer shadow-sm">Importar curso</button>
              <button type="button" class="inline-flex justify-center items-center text-center font-medium rounded-md border transition ease-in-out duration-150 focus:outline-none text-white bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 border-transparent focus:border-indigo-700 focus:shadow-outline-indigo leading-5 text-sm px-4 py-2 gap-2 cursor-pointer shadow-sm">Criar curso</button>
            </div>
          </div>

          <ul class="mt-3 grid grid-cols-1 gap-5 sm:gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <li class="col-span-1 bg-white shadow-md rounded-md overflow-hidden">
              <NuxtLink :to="coursePath()" class="block">
                <div class="w-full img-cover-pattern relative overflow-hidden bg-white" style="padding-bottom: 250px;">
                  <img v-if="coverUrl" :src="coverUrl" alt="" class="h-full object-cover absolute w-full inset-0">
                </div>
              </NuxtLink>
              <div class="flex items-center justify-between border-gray-200">
                <div class="flex-1 relative" style="height: 100px;">
                  <div class="flex">
                    <NuxtLink :to="coursePath()" class="w-11/12">
                      <div class="leading-normal text-xl font-medium px-4 py-2 line-clamp">{{ selectedCourse?.title || areaName }}</div>
                      <div class="text-sm px-4"><span class="text-gray-500">{{ moduleCount }} módulo{{ moduleCount === 1 ? '' : 's' }}</span></div>
                    </NuxtLink>
                    <div class="px-4 py-2">
                      <div class="relative inline-block">
                        <span class="rounded-md block shadow-sm relative dropdown-trigger">
                          <button type="button" id="options-menu" class="inline-flex justify-center w-full rounded-md border border-gray-300 p-2 bg-white text-sm leading-5 font-medium text-gray-700 hover:text-gray-500 focus:outline-none focus:shadow-outline-indigo active:bg-gray-50 active:text-gray-800 transition ease-in-out duration-150">
                            <svg fill="currentColor" viewBox="0 0 20 20" class="h-5 w-5"><path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"></path></svg>
                          </button>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </li>
          </ul>
        </div>
      </template>

      <template v-else-if="!isCourseOpen && activeTab === 'students'">
        <div class="mt-8 md:px-10">
          <div class="page-header flex-wrap gap-4 xl:flex-no-wrap">
            <div class="page-title truncate py-1">Alunos</div>
            <div class="flex items-center flex-wrap gap-3 xl:min-w-max-content">
              <button type="button" class="inline-flex justify-center items-center text-center font-medium rounded-md border transition ease-in-out duration-150 focus:outline-none text-gray-700 hover:text-gray-500 active:text-gray-800 bg-white active:bg-gray-50 border-gray-300 focus:border-blue-300 focus:shadow-outline-blue leading-5 text-sm px-4 py-2 gap-2 cursor-pointer shadow-sm">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="24px" height="24px" class="h-5 w-5"><path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clip-rule="evenodd"></path></svg>
                Exportar
              </button>
              <button type="button" class="inline-flex justify-center items-center text-center font-medium rounded-md border transition ease-in-out duration-150 focus:outline-none text-white bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 border-transparent focus:border-indigo-700 focus:shadow-outline-indigo leading-5 text-sm px-4 py-2 gap-2 cursor-pointer shadow-sm">Adicionar aluno</button>
            </div>
          </div>

          <div class="mt-8 bg-white p-6">
            <div class="relative rounded-md shadow-sm flex">
              <div class="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="24px" height="24px" class="h-6 w-6 text-gray-400"><path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd"></path></svg>
              </div>
              <input placeholder="Buscar..." class="form-input block w-full py-4 pl-14 pr-4 border border-gray-300 rounded-l-md shadow-sm focus:outline-none focus:shadow-outline-blue focus:border-blue-300 transition duration-150 ease-in-out text-base leading-6">
              <button type="button" class="inline-flex items-center px-6 border border-l-0 border-gray-300 rounded-r-md text-gray-700 bg-white text-base leading-6 font-medium">
                <span class="mr-2 text-gray-400">≡</span>
                Filtros
              </button>
            </div>
          </div>

          <div class="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3">
            <div class="bg-white rounded-lg shadow p-6">
              <div class="text-base text-gray-500">Número de alunos</div>
              <div class="mt-4 text-3xl font-bold text-gray-900">{{ students.length }}</div>
            </div>
            <div class="bg-white rounded-lg shadow p-6">
              <div class="text-base text-gray-500">Progresso</div>
              <div class="mt-4 text-3xl font-bold text-gray-900">{{ students.length ? (students.reduce((total, student) => total + Number(student.progress || 0), 0) / students.length).toFixed(2) : '0.00' }} %</div>
              <div class="mt-2 text-sm text-gray-500">média dos usuários</div>
            </div>
            <div class="bg-white rounded-lg shadow p-6">
              <div class="text-base text-gray-500">Conclusão</div>
              <div class="mt-4 text-3xl font-bold text-gray-900">{{ students.length ? ((students.filter((student) => Number(student.progress || 0) >= 100).length / students.length) * 100).toFixed(2) : '0.00' }} %</div>
              <div class="mt-2 text-sm text-gray-500">concluíram o curso</div>
            </div>
          </div>

          <div class="mt-6 bg-white overflow-hidden">
            <div class="overflow-x-auto">
              <table class="kiwi-table min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th class="text-left px-6 py-4 border-b border-gray-200 bg-gray-50 text-xs leading-4 font-medium text-gray-500 uppercase tracking-widest">Nome</th>
                    <th class="text-left px-6 py-4 border-b border-gray-200 bg-gray-50 text-xs leading-4 font-medium text-gray-500 uppercase tracking-widest">Último acesso</th>
                    <th class="text-left px-6 py-4 border-b border-gray-200 bg-gray-50 text-xs leading-4 font-medium text-gray-500 uppercase tracking-widest">Progresso</th>
                    <th class="text-left px-6 py-4 border-b border-gray-200 bg-gray-50 text-xs leading-4 font-medium text-gray-500 uppercase tracking-widest"></th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                  <tr v-if="membersDataLoading">
                    <td colspan="4" class="px-6 py-8 text-center text-sm text-gray-500">Carregando alunos...</td>
                  </tr>
                  <tr v-else-if="!students.length">
                    <td colspan="4" class="px-6 py-8 text-center text-sm text-gray-500">Nenhum comprador aprovado encontrado.</td>
                  </tr>
                  <tr v-for="student in students" v-else :key="student.id" :class="student.isCurrentUser ? 'bg-gray-50' : 'bg-white'">
                    <td class="px-6 py-5 whitespace-nowrap">
                      <div class="text-sm font-medium text-gray-900">{{ student.name }}</div>
                      <div class="mt-1 text-sm text-gray-500">✉ {{ student.email }}</div>
                    </td>
                    <td class="px-6 py-5 whitespace-nowrap text-sm text-gray-500">{{ student.lastAccess }}</td>
                    <td class="px-6 py-5 whitespace-nowrap text-sm text-gray-500">{{ student.progress }}%</td>
                    <td v-if="student.isCurrentUser" class="px-6 py-5 whitespace-nowrap text-right"><span class="inline-flex items-center rounded-full font-medium leading-4 text-xs py-1 px-3 bg-green-100 text-green-800">Você</span></td>
                    <td v-else class="px-6 py-5 whitespace-nowrap text-right">
                      <button type="button" class="inline-flex justify-center rounded-md border border-gray-300 p-2 bg-white text-gray-700 shadow-sm">
                        <svg fill="currentColor" viewBox="0 0 20 20" class="h-5 w-5"><path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"></path></svg>
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </template>

      <template v-else-if="!isCourseOpen && activeTab === 'groups'">
        <div class="mt-8 md:px-10">
          <div class="page-header flex-wrap gap-4 xl:flex-no-wrap">
            <div class="page-title truncate py-1">Grupos</div>
            <div class="flex items-center gap-3">
              <input v-model="groupDraft" placeholder="Nome do grupo" class="form-input block w-48 py-2 px-3 border border-gray-300 rounded-md shadow-sm text-sm">
              <button type="button" class="inline-flex justify-center items-center text-center font-medium rounded-md border transition ease-in-out duration-150 focus:outline-none text-white bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 border-transparent focus:border-indigo-700 focus:shadow-outline-indigo leading-5 text-sm px-4 py-2 gap-2 cursor-pointer shadow-sm" @click="addGroup">Adicionar grupo</button>
            </div>
          </div>

          <div class="mt-8 bg-white overflow-hidden">
            <div class="overflow-x-auto">
              <table class="kiwi-table min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th class="text-left px-6 py-4 border-b border-gray-200 bg-gray-50 text-xs leading-4 font-medium text-gray-500 uppercase tracking-widest">Nome</th>
                    <th class="text-left px-6 py-4 border-b border-gray-200 bg-gray-50 text-xs leading-4 font-medium text-gray-500 uppercase tracking-widest">Alunos</th>
                    <th class="text-left px-6 py-4 border-b border-gray-200 bg-gray-50 text-xs leading-4 font-medium text-gray-500 uppercase tracking-widest"></th>
                  </tr>
                </thead>
                <tbody class="bg-white divide-y divide-gray-200">
                  <tr v-if="membersDataLoading">
                    <td colspan="3" class="px-6 py-8 text-center text-sm text-gray-500">Carregando grupos...</td>
                  </tr>
                  <tr v-for="group in groups" v-else :key="group.id" class="bg-white">
                    <td class="px-6 py-6 whitespace-nowrap text-sm font-medium text-gray-900">
                      {{ group.name }}
                      <span v-if="group.isDefault" class="ml-3 inline-flex items-center rounded-full font-medium leading-4 text-xs py-1 px-3 bg-indigo-100 text-indigo-700">Padrão</span>
                    </td>
                    <td class="px-6 py-6 whitespace-nowrap text-sm text-gray-500">{{ group.students }}</td>
                    <td class="px-6 py-6 whitespace-nowrap text-right">
                      <button type="button" class="inline-flex justify-center rounded-md border border-gray-300 p-2 bg-white text-gray-700 shadow-sm" :disabled="group.isDefault" @click="removeGroup(group.id)">
                        <svg fill="currentColor" viewBox="0 0 20 20" class="h-5 w-5"><path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"></path></svg>
                      </button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div class="py-8 flex justify-center text-gray-900">
            <div class="flex items-center">
              <span class="inline-flex justify-center items-center h-6 w-6 rounded-full bg-indigo-500 text-white mr-2">i</span>
              Aprenda mais sobre&nbsp;<a target="_blank" href="https://ajuda.kiwify.com.br/pt-br/article/grupos-na-area-de-membros-1pi8tfx/" class="text-indigo-500 underline">grupos</a>
            </div>
          </div>
        </div>
      </template>

      <template v-else-if="!isCourseOpen && activeTab === 'settings'">
        <div class="md:px-10 mt-8">
          <div class="page-header flex-wrap gap-4 xl:flex-no-wrap">
            <div class="page-title truncate py-1">Configurações</div>
            <button type="button" class="inline-flex justify-center items-center text-center font-medium rounded-md border transition ease-in-out duration-150 focus:outline-none text-white bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 border-transparent focus:border-indigo-700 focus:shadow-outline-indigo leading-5 text-sm px-4 py-2 gap-2 cursor-pointer shadow-sm" :disabled="settingsSaving" @click="saveSettings">{{ settingsSaving ? 'Salvando...' : 'Salvar alterações' }}</button>
          </div>

          <div class="mt-8 space-y-8">
            <div class="md:grid md:grid-cols-3 md:gap-8">
              <div>
                <h3 class="text-lg font-medium leading-6 text-gray-900">Tipo de área de membros</h3>
                <p class="mt-3 text-sm leading-5 text-gray-500">Aprenda mais sobre os <a href="#" class="text-indigo-500 underline">tipos de área de membros</a></p>
              </div>
              <div class="mt-5 md:mt-0 md:col-span-2">
                <div class="bg-white rounded-lg p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <button type="button" class="text-left border rounded-md p-6 relative" :class="settingsForm.type === 'lite' ? 'border-indigo-500' : 'border-gray-300'" @click="settingsForm.type = 'lite'">
                    <div class="flex justify-between items-start">
                      <h4 class="text-base font-medium text-gray-900">Lite</h4>
                      <svg class="h-7 w-7 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"></path></svg>
                    </div>
                    <ul class="mt-5 space-y-3 text-sm text-gray-700">
                      <li class="flex gap-2"><span class="text-indigo-500">▮</span> Apenas um curso</li>
                      <li class="flex gap-2"><span class="text-gray-400">⚙</span> Fácil configuração</li>
                      <li class="flex gap-2"><span class="text-gray-400">⌁</span> Personalização básica</li>
                      <li class="flex gap-2"><span class="text-yellow-600">★</span> Recomendado para iniciantes</li>
                    </ul>
                    <span v-if="settingsForm.type === 'lite'" class="absolute -right-4 -bottom-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-indigo-500 text-white text-xl">✓</span>
                  </button>
                  <button type="button" class="text-left border rounded-md p-6 relative" :class="settingsForm.type === 'complete' ? 'border-indigo-500' : 'border-gray-300'" @click="settingsForm.type = 'complete'">
                    <div class="flex justify-between items-start">
                      <h4 class="text-base font-medium text-gray-900">Completa</h4>
                      <svg class="h-7 w-7 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7h-4V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2H4a2 2 0 00-2 2v9a2 2 0 002 2h16a2 2 0 002-2V9a2 2 0 00-2-2zM10 7V5h4v2"></path></svg>
                    </div>
                    <ul class="mt-5 space-y-3 text-sm text-gray-700">
                      <li class="flex gap-2"><span class="text-green-500">▰</span> Múltiplos cursos</li>
                      <li class="flex gap-2"><span class="text-blue-500">◎</span> Domínio próprio</li>
                      <li class="flex gap-2"><span class="text-gray-400">⌁</span> Personalização completa</li>
                      <li class="flex gap-2"><span class="text-yellow-600">★</span> Recomendado para infoprodutores avançados</li>
                    </ul>
                    <span v-if="settingsForm.type === 'complete'" class="absolute -right-4 -bottom-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-indigo-500 text-white text-xl">✓</span>
                  </button>
                </div>
              </div>
            </div>

            <div class="md:grid md:grid-cols-3 md:gap-8">
              <div>
                <h3 class="text-lg font-medium leading-6 text-gray-900">Comentários</h3>
                <p class="mt-3 text-sm leading-5 text-gray-500">Aprenda mais sobre os <a href="#" class="text-indigo-500 underline">comentários</a></p>
              </div>
              <div class="mt-5 md:mt-0 md:col-span-2">
                <div class="bg-white rounded-lg px-6 py-8 flex items-center">
                  <span role="checkbox" tabindex="0" :aria-checked="settingsForm.commentsEnabled" class="relative inline-flex flex-shrink-0 h-6 w-11 border-2 border-transparent rounded-full cursor-pointer transition-colors ease-in-out duration-200 focus:outline-none focus:shadow-outline" :class="settingsForm.commentsEnabled ? 'bg-indigo-600' : 'bg-gray-200'" @click="settingsForm.commentsEnabled = !settingsForm.commentsEnabled" @keydown.enter.prevent="settingsForm.commentsEnabled = !settingsForm.commentsEnabled">
                    <span aria-hidden="true" class="inline-block h-5 w-5 rounded-full bg-white shadow transform transition ease-in-out duration-200" :class="settingsForm.commentsEnabled ? 'translate-x-5' : 'translate-x-0'"></span>
                  </span>
                  <label class="block text-sm font-medium leading-5 text-gray-700 ml-3 cursor-pointer" @click="settingsForm.commentsEnabled = !settingsForm.commentsEnabled">Ativar comentários</label>
                </div>
              </div>
            </div>
          </div>
        </div>
      </template>

      <template v-else-if="isEditingContent">
        <div class="mt-2 flex justify-between items-center">
          <div class="flex items-center">
            <button type="button" class="mr-4 text-gray-900 focus:outline-none cursor-pointer" @click="closeLessonEditor">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" class="h-8 w-8"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
            </button>
            <h3 class="page-title">Editar conteúdo</h3>
          </div>
          <button type="button" class="inline-flex justify-center items-center text-center font-medium rounded-md border transition ease-in-out duration-150 focus:outline-none text-white bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 border-transparent focus:border-indigo-700 focus:shadow-outline-indigo leading-5 text-sm px-6 py-3 gap-2 cursor-pointer shadow-sm" @click="saveContent">Salvar alterações</button>
        </div>

        <div class="mt-12 grid grid-cols-1 lg:grid-cols-[minmax(300px,0.9fr)_minmax(620px,2fr)] gap-10">
          <div>
            <h3 class="text-lg font-medium leading-6 text-gray-900">Detalhes do conteúdo</h3>
            <p class="mt-2 text-sm leading-5 text-gray-500">Aprenda mais sobre o <a href="#" class="text-indigo-500 underline">upload de vídeos</a></p>
          </div>
          <div class="bg-white rounded-lg p-6 space-y-8 min-w-0">
            <div>
              <label class="block text-sm font-medium leading-5 text-gray-700 mb-2">Título</label>
              <input v-model="lessonForm.title" class="form-input block w-full py-3 px-4 border border-gray-300 rounded-md shadow-sm text-sm leading-5">
            </div>

            <div>
              <label class="block text-sm font-medium leading-5 text-gray-700 mb-2">Descrição</label>
              <textarea v-model="lessonForm.description" maxlength="165" rows="4" class="form-textarea block w-full py-3 px-4 border border-gray-300 rounded-md shadow-sm text-sm leading-5" placeholder="Escreva uma descrição do conteúdo"></textarea>
              <div class="mt-1 text-sm text-gray-500">{{ lessonForm.description.length }}/165</div>
            </div>

            <div>
              <label class="block text-sm font-medium leading-5 text-gray-700 mb-4">Vídeo</label>
              <div class="rounded-md border border-gray-200 overflow-hidden">
                <div class="grid grid-cols-3 bg-gray-50 text-center text-sm font-medium text-gray-500">
                  <button type="button" class="py-4 text-indigo-600 border-b-2 border-indigo-500">Novo vídeo</button>
                  <button type="button" class="py-4 border-b border-gray-200">Adicionar da biblioteca</button>
                  <button type="button" class="py-4 border-b border-gray-200">Reutilizar de outras aulas</button>
                </div>
                <label for="lesson-video-upload" class="m-4 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-md min-h-52 text-center cursor-pointer hover:bg-gray-50" @dragover.prevent @drop="handleVideoUpload">
                  <div class="text-xl text-gray-900">Drop files here, <span class="text-blue-500">browse files</span> or import from:</div>
                  <div class="mt-8 w-full divide-y divide-gray-200 text-left">
                    <div class="px-8 py-4 text-gray-600">▣ My Device</div>
                    <div class="px-8 py-4 text-gray-600">◆ Dropbox</div>
                    <div class="px-8 py-4 text-gray-600">▲ Google Drive</div>
                  </div>
                  <input id="lesson-video-upload" type="file" accept="video/*" class="sr-only" @change="handleVideoUpload">
                </label>
                <div v-if="lessonForm.videoUrl" class="px-4 pb-4 text-sm text-gray-600 truncate">Vídeo: {{ lessonForm.videoUrl }}</div>
              </div>
              <button type="button" class="block mx-auto mt-5 text-indigo-500 underline text-base" @click="useYoutubeVideo">Usar video do YouTube</button>
            </div>

            <div>
              <label class="block text-sm font-medium leading-5 text-gray-700 mb-2">Thumbnail</label>
              <label for="lesson-thumbnail-upload" class="flex justify-center items-center w-full max-w-md h-48 border-2 border-dashed border-gray-300 rounded-md cursor-pointer hover:bg-gray-50" @dragover.prevent @drop="handleThumbnailUpload">
                <div v-if="lessonForm.thumbnailUrl" class="relative w-full h-full">
                  <img :src="lessonForm.thumbnailUrl" alt="" class="w-full h-full object-cover rounded-md">
                </div>
                <div v-else class="text-center text-gray-500">
                  <div class="text-5xl text-gray-400">▧</div>
                  <div class="mt-3 text-indigo-600 font-medium">Selecione do computador</div>
                  <div>ou arraste aqui</div>
                  <div class="mt-2 text-sm">PNG, JPG até 10 MB</div>
                </div>
                <input id="lesson-thumbnail-upload" type="file" accept="image/png,image/jpeg,image/jpg" class="sr-only" @change="handleThumbnailUpload">
              </label>
              <div class="mt-5 bg-yellow-50 border-l-4 border-yellow-500 p-4 text-yellow-800">Tamanho recomendado: 1280x720 pixels</div>
              <p class="mt-4 text-sm text-gray-400">Se você não fizer o upload de uma thumbnail, vamos extrair uma do vídeo automaticamente</p>
            </div>
          </div>
        </div>

        <div class="mt-12 grid grid-cols-1 lg:grid-cols-[minmax(300px,0.9fr)_minmax(620px,2fr)] gap-10">
          <div>
            <h3 class="text-lg font-medium leading-6 text-gray-900">Editor de conteúdo</h3>
          </div>
          <div class="bg-white rounded-lg p-6 min-w-0">
            <div class="border border-gray-200">
              <div class="flex border-b border-gray-200 bg-white">
                <button type="button" class="px-6 py-4 font-bold">Aa</button>
                <button type="button" class="px-6 py-4 font-bold">B</button>
                <button type="button" class="px-6 py-4 italic">I</button>
                <button type="button" class="px-6 py-4 line-through">S</button>
                <button type="button" class="px-6 py-4">☷</button>
                <button type="button" class="px-6 py-4">▧</button>
                <button type="button" class="px-6 py-4">link</button>
                <button type="button" class="px-6 py-4">☰</button>
                <button type="button" class="px-6 py-4">&lt;/&gt;</button>
              </div>
              <textarea v-model="lessonForm.content" rows="7" class="w-full border-0 p-6 text-base focus:outline-none" placeholder="Escreva o conteúdo da aula"></textarea>
            </div>
          </div>
        </div>

        <div class="mt-12 grid grid-cols-1 lg:grid-cols-[minmax(300px,0.9fr)_minmax(620px,2fr)] gap-10">
          <div>
            <h3 class="text-lg font-medium leading-6 text-gray-900">Arquivos</h3>
          </div>
          <div class="bg-white rounded-lg p-6 min-w-0">
            <label for="lesson-attachments-upload" class="flex items-center justify-center min-h-44 border-2 border-dashed border-gray-400 rounded-md cursor-pointer text-center p-8 hover:bg-gray-50" @dragover.prevent @drop="handleAttachmentUpload">
              <div>
                <div class="text-xl text-gray-700">Drop here or <span class="text-blue-500">selecione do computador</span></div>
                <div class="mt-4 text-gray-600">Você pode inserir arquivos dos tipos: jpg, gif, png, bmp, pdf, zip, rar, epub, xls, xlsx, mp3, doc, docx, ppt, pptx. Limite de máximo 10 arquivos com o máximo de 100 MB cada</div>
              </div>
              <input id="lesson-attachments-upload" type="file" multiple class="sr-only" @change="handleAttachmentUpload">
            </label>
            <div v-if="lessonForm.attachments.length" class="mt-4 divide-y divide-gray-200 border border-gray-200 rounded-md">
              <div v-for="attachment in lessonForm.attachments" :key="attachment.id" class="flex items-center justify-between px-4 py-3 text-sm">
                <a :href="attachment.url" target="_blank" class="text-indigo-600 truncate">{{ attachment.name }}</a>
                <button type="button" class="text-red-600" @click="removeAttachment(attachment.id)">Excluir</button>
              </div>
            </div>
          </div>
        </div>

        <div class="mt-12 grid grid-cols-1 lg:grid-cols-[minmax(300px,0.9fr)_minmax(620px,2fr)] gap-10">
          <div>
            <h3 class="text-lg font-medium leading-6 text-gray-900">Liberação</h3>
            <p class="mt-3 text-sm leading-5 text-gray-500">Aprenda mais sobre as configurações de <a href="#" class="text-indigo-500 underline">liberação do conteúdo</a></p>
          </div>
          <div class="bg-white rounded-lg p-6 space-y-8 min-w-0">
            <div>
              <h4 class="text-sm font-medium text-gray-700 mb-4">Quando liberar o conteúdo</h4>
              <label class="flex items-center gap-3 mb-4"><input v-model="lessonForm.releaseType" value="immediate" type="radio" class="form-radio text-indigo-600">Liberação imediata</label>
              <label class="flex items-center gap-3 mb-4"><input v-model="lessonForm.releaseType" value="days" type="radio" class="form-radio text-indigo-600">Por dias</label>
              <div class="ml-8 mb-6 flex items-center gap-3 text-gray-600">Liberar em <input v-model.number="lessonForm.releaseDays" type="number" class="form-input w-28 py-2 px-3 border border-gray-300 rounded-md"> dias após a compra</div>
              <label class="flex items-center gap-3 mb-4"><input v-model="lessonForm.releaseType" value="date" type="radio" class="form-radio text-indigo-600">Por data</label>
              <div class="ml-8 flex items-center gap-3 text-gray-600">Liberar em <input v-model="lessonForm.releaseDate" type="date" class="form-input py-2 px-3 border border-gray-300 rounded-md"></div>
            </div>
            <div>
              <h4 class="text-sm font-medium text-gray-700 mb-4">Duração do conteúdo</h4>
              <label class="flex items-center gap-3"><input v-model="lessonForm.durationLimited" type="checkbox" class="form-checkbox text-indigo-600">Limitar duração do conteúdo</label>
            </div>
          </div>
        </div>

        <div class="mt-12 flex justify-between items-center">
          <button type="button" class="inline-flex justify-center items-center text-center font-medium rounded-md border transition ease-in-out duration-150 focus:outline-none text-white bg-red-600 hover:bg-red-500 active:bg-red-700 border-transparent leading-5 text-sm px-6 py-3 gap-2 cursor-pointer shadow-sm" @click="removeContent">Excluir conteúdo</button>
          <button type="button" class="inline-flex justify-center items-center text-center font-medium rounded-md border transition ease-in-out duration-150 focus:outline-none text-white bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 border-transparent focus:border-indigo-700 focus:shadow-outline-indigo leading-5 text-sm px-6 py-3 gap-2 cursor-pointer shadow-sm" @click="saveContent">Salvar alterações</button>
        </div>
      </template>

      <template v-else>
        <div class="mt-8 md:px-10">
        <div class="page-header flex-wrap gap-4 xl:flex-no-wrap">
          <div class="page-title truncate py-1">{{ selectedCourse?.title || areaName }}</div>
          <div class="flex items-center flex-wrap gap-3 xl:min-w-max-content">
            <button type="button" class="inline-flex items-center justify-center p-2.5 cursor-pointer border border-gray-300 text-sm leading-5 font-medium rounded-md text-gray-700 bg-white hover:text-gray-500 focus:outline-none focus:border-blue-300 focus:shadow-outline-blue active:text-gray-800 active:bg-gray-50 transition ease-in-out duration-150">
              <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20" width="24px" height="24px" class="h-5 w-5"><path fill-rule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd"></path></svg>
            </button>
            <div class="inline-flex rounded-md font-normal">
              <div class="relative inline-block">
                <span class="rounded-md block shadow-sm relative dropdown-trigger">
                  <span id="options-menu" class="focus:outline-none">
                    <button disabled="disabled" class="inline-flex items-center justify-center p-2.5 cursor-pointer border border-gray-300 text-sm leading-5 font-medium rounded-md text-gray-700 bg-white hover:text-gray-500 focus:outline-none focus:border-blue-300 focus:shadow-outline-blue active:text-gray-800 active:bg-gray-50 transition ease-in-out duration-150 opacity-50 cursor-not-allowed">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="24px" height="24px" class="h-5 w-5 text-black"><path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"></path></svg>
                    </button>
                  </span>
                </span>
              </div>
            </div>
            <button type="button" data-disable-mock-upload class="inline-flex items-center px-4 py-2 cursor-pointer border border-gray-300 text-sm leading-6 font-medium rounded-md text-gray-700 bg-white hover:text-gray-500 focus:outline-none focus:border-blue-300 focus:shadow-outline-blue active:text-gray-800 active:bg-gray-50 transition ease-in-out duration-150" @click.stop="handleToolbarUploadClick">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="24px" height="24px" class="-ml-1 mr-3 h-5 w-5 text-black"><path d="M5.5 13a3.5 3.5 0 01-.369-6.98 4 4 0 117.753-1.977A4.5 4.5 0 1113.5 13H11V9.413l1.293 1.293a1 1 0 001.414-1.414l-3-3a1 1 0 00-1.414 0l-3 3a1 1 0 001.414 1.414L9 9.414V13H5.5z"></path><path d="M9 13h2v5a1 1 0 11-2 0v-5z"></path></svg>
              Upload de vídeos
            </button>
            <span class="inline-flex rounded-md shadow-sm">
              <button class="inline-flex items-center px-4 py-2 border border-gray-300 text-sm leading-6 font-medium rounded-md text-gray-700 bg-white hover:text-gray-500 focus:outline-none focus:border-blue-300 focus:shadow-outline-blue active:text-gray-800 active:bg-gray-50 transition ease-in-out duration-150">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" class="-ml-1 mr-3 h-5 w-5 text-black"><title>Contract</title> <path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="32" d="M304 416V304h112M314.2 314.23L432 432M208 96v112H96M197.8 197.77L80 80M416 208H304V96M314.23 197.8L432 80M96 304h112v112M197.77 314.2L80 432"></path></svg>
                Minimizar
              </button>
            </span>
            <div class="relative">
              <button type="button" class="inline-flex justify-center items-center text-center font-medium rounded-md border transition ease-in-out duration-150 focus:outline-none text-white bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 border-transparent focus:border-indigo-700 focus:shadow-outline-indigo leading-5 text-sm px-4 py-2 gap-2 cursor-pointer shadow-sm" @click.stop="showAddMenu = !showAddMenu">Adicionar</button>
              <div v-if="showAddMenu" class="absolute z-30 w-56 bg-white rounded-md shadow-lg border border-gray-100 py-2" style="right: 0; top: 48px;">
                <button type="button" class="block w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50" @click="openCreateModuleModal">Criar módulo</button>
                <button type="button" class="block w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50" @click="startCreateLesson()">Criar conteúdo</button>
              </div>
            </div>
          </div>
        </div>

        <div class="mt-8 space-y-8">
          <section v-for="module in courseModules" :key="module.id" class="bg-white rounded-lg shadow overflow-visible relative">
            <div class="flex items-center px-6 py-5 relative">
              <span class="text-gray-400 mr-6">
                <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20" class="h-5 w-5"><path d="M7 4a1 1 0 100 2 1 1 0 000-2zM7 9a1 1 0 100 2 1 1 0 000-2zM7 14a1 1 0 100 2 1 1 0 000-2zM13 4a1 1 0 100 2 1 1 0 000-2zM13 9a1 1 0 100 2 1 1 0 000-2zM13 14a1 1 0 100 2 1 1 0 000-2z"></path></svg>
              </span>
              <input type="checkbox" class="form-checkbox h-5 w-5 text-indigo-600 transition duration-150 ease-in-out mr-4">
              <h3 class="text-2xl leading-8 font-medium text-gray-900 flex-1 border-b border-dashed border-gray-300">{{ module.title }}</h3>
              <span class="inline-flex items-center rounded-md font-medium leading-5 text-sm py-1 px-3 bg-indigo-100 text-indigo-700">• {{ module.contents?.length || 0 }} conteúdo{{ (module.contents?.length || 0) === 1 ? '' : 's' }}</span>
              <button type="button" class="ml-4 inline-flex justify-center w-12 rounded-md border border-gray-300 p-2 bg-white text-sm leading-5 font-medium text-gray-700 focus:outline-none focus:shadow-outline-indigo" @click.stop="openModuleMenuId = openModuleMenuId === module.id ? '' : (module.id || '')">
                <svg fill="currentColor" viewBox="0 0 20 20" class="h-5 w-5"><path d="M10 6a2 2 0 110-4 2 2 0 010 4zM10 12a2 2 0 110-4 2 2 0 010 4zM10 18a2 2 0 110-4 2 2 0 010 4z"></path></svg>
              </button>
              <div v-if="openModuleMenuId === module.id" class="absolute z-30 w-72 bg-white rounded-md shadow-lg border border-gray-100 py-3" style="right: 90px; top: 58px;">
                <button type="button" class="flex items-center gap-4 w-full text-left px-6 py-3 text-gray-700 hover:bg-gray-50" @click.stop="openEditModuleModal(module)">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" class="h-5 w-5 text-gray-400"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                  Editar módulo
                </button>
                <button type="button" class="flex items-center gap-4 w-full text-left px-6 py-3 text-gray-700 hover:bg-gray-50" @click.stop="removeModule(module)">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" class="h-5 w-5 text-gray-400"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                  Excluir módulo
                </button>
              </div>
            </div>
            <button type="button" class="absolute left-5 top-16 h-12 w-12 rounded-full border border-gray-300 bg-white shadow flex items-center justify-center text-gray-400 z-10" @click.stop="startCreateLesson(module.id)">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" class="h-6 w-6"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
            </button>
            <div class="bg-gray-50 text-center py-4 text-gray-500">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" class="h-5 w-5 inline-block"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7"></path></svg>
            </div>
            <div v-for="lesson in module.contents" :key="lesson.id" class="group flex items-center px-6 py-5 border-t border-gray-200">
              <span class="text-gray-400 mr-6">
                <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20" class="h-5 w-5"><path d="M7 4a1 1 0 100 2 1 1 0 000-2zM7 9a1 1 0 100 2 1 1 0 000-2zM7 14a1 1 0 100 2 1 1 0 000-2zM13 4a1 1 0 100 2 1 1 0 000-2zM13 9a1 1 0 100 2 1 1 0 000-2zM13 14a1 1 0 100 2 1 1 0 000-2z"></path></svg>
              </span>
              <input type="checkbox" class="form-checkbox h-5 w-5 text-indigo-600 transition duration-150 ease-in-out mr-4">
              <button type="button" class="text-left text-xl leading-7 text-gray-500 flex-1 border-b border-dashed border-gray-300" @click="openLessonEditor(lesson)">{{ lesson.title }}</button>
              <span class="inline-flex items-center rounded-md font-medium leading-5 text-sm py-1 px-3 bg-green-100 text-green-800">• {{ lesson.status || 'Publicado' }}</span>
              <div class="ml-4 flex border border-gray-200 rounded-md overflow-hidden">
                <button type="button" class="p-3 text-gray-500 hover:bg-gray-50" title="Editar conteúdo" @click.stop="openLessonEditor(lesson)">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" class="h-5 w-5"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                </button>
                <button type="button" class="p-3 text-gray-500 hover:bg-gray-50" title="Excluir conteúdo" @click.stop="deleteLesson(activeCourseId, module.id || '', lesson.id).then(reloadCourseModules)">
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" class="h-5 w-5"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                </button>
              </div>
            </div>
          </section>

          <section v-if="!courseModules.length" class="bg-white rounded-lg shadow p-10 text-center">
            <p class="text-gray-500">Nenhum módulo criado ainda.</p>
            <button type="button" class="mt-4 inline-flex justify-center items-center text-center font-medium rounded-md border transition ease-in-out duration-150 focus:outline-none text-white bg-indigo-600 hover:bg-indigo-500 border-transparent leading-5 text-sm px-4 py-2" @click="openCreateModuleModal">Criar módulo</button>
          </section>
        </div>
        </div>

        <div class="py-8 flex justify-center text-gray-900">
          <div class="flex items-center">
            <span class="inline-flex justify-center items-center h-6 w-6 rounded-full bg-indigo-500 text-white mr-2">i</span>
            Aprenda mais sobre&nbsp;<a target="_blank" href="https://ajuda.kiwify.com.br/pt-br/article/area-de-membros/" class="text-indigo-500 underline">área de membros</a>
          </div>
        </div>
      </template>

      <div v-if="showModuleModal" class="fixed inset-0 z-500 flex flex-col md:items-center md:justify-center md:h-auto md:max-h-full md:p-4">
        <div class="fixed inset-0 transition-opacity cursor-pointer" @click="showModuleModal = false">
          <div class="absolute inset-0 bg-gray-500 opacity-75"></div>
        </div>
        <div role="dialog" aria-modal="true" aria-labelledby="modal-headline" class="bg-white h-full overflow-x-auto transform transition-all w-full sm:h-auto md:max-h-full md:rounded-lg md:shadow-xl sm:max-w-3xl">
          <div class="px-4 py-3 bg-gray-50 flex justify-between">
            <h3 id="modal-headline" class="text-lg leading-6 font-medium text-gray-900">Adicionar módulo</h3>
            <button type="button" aria-label="Close" class="text-gray-400 cursor-pointer hover:text-gray-500 focus:outline-none focus:text-gray-500 transition ease-in-out duration-150" @click="showModuleModal = false">
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" class="h-6 w-6"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </div>
          <div class="flex flex-wrap">
            <div class="w-full md:w-1/2">
              <div>
                <div class="px-4 py-5 sm:p-6 rounded-lg">
                <div>
                  <label class="block text-sm font-medium leading-5 text-gray-700 mb-1">Nome do módulo</label>
                  <div>
                    <input v-model="moduleDraft.title" type="text" autocomplete="off" data-lpignore="true" class="form-input block py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:shadow-outline-blue focus:border-blue-300 transition duration-150 ease-in-out sm:text-sm sm:leading-5 mask-user-input w-full">
                  </div>
                </div>
                <div class="mt-4">
                  <label class="label mb-1">Imagem</label>
                  <div>
                    <label for="module-image-upload" id="moduleimageupload" class="hover:bg-gray-50 cursor-pointer flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 transition duration-300 border-dashed rounded-md h-48 items-center max-w-lg">
                      <input id="module-image-upload" accept="image/jpeg,image/jpg,image/png" name="moduleimageupload" type="file" class="sr-only" @change="handleModuleImageUpload">
                      <div v-if="moduleDraft.imageUrl" class="relative w-full h-full">
                        <img :src="moduleDraft.imageUrl" alt="" class="w-full h-full object-cover">
                        <button type="button" class="absolute inset-0 m-auto h-12 w-12 rounded-full bg-black bg-opacity-60 text-white text-3xl" @click.prevent="moduleDraft.imageUrl = ''">+</button>
                      </div>
                      <div v-else class="space-y-1 text-center">
                        <svg stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true" class="mx-auto h-12 w-12 text-gray-400"><path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path></svg>
                        <div class="flex flex-col text-sm text-gray-600">
                          <div class="relative cursor-pointe rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500">
                            <span>{{ moduleImageUploading ? 'Enviando...' : 'Selecione do computador' }}</span>
                          </div>
                          <p class="pl-1">ou arraste aqui</p>
                        </div>
                        <p class="text-xs text-gray-500">PNG, JPG até 10 MB</p>
                      </div>
                    </label>
                  </div>
                </div>
                <div class="mt-4">
                  <div class="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-8">
                    <div class="flex items-center">
                      <div class="flex-shrink-0">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="24px" height="24px" class="text-yellow-400"><path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z"></path></svg>
                      </div>
                      <div class="ml-3">
                        <p class="text-sm leading-5 text-yellow-700">Tamanho recomendado: 320x480 pixels</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div class="flex w-full mt-4">
                  <button class="cursor-pointer flex justify-center items-center text-center w-full px-4 py-2 border border-transparent text-base leading-6 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-500 focus:outline-none focus:border-indigo-700 focus:shadow-outline-indigo active:bg-indigo-700 transition ease-in-out duration-150" @click="saveModuleDraft">
                    {{ selectedModule ? 'Salvar alterações' : 'Adicionar módulo' }}
                  </button>
                </div>
                </div>
              </div>
            </div>
            <div class="w-full md:w-1/2 py-2 px-6">
              <div>
                <dt class="text-sm font-medium text-gray-500">Pré-visualização</dt>
                <dd class="mt-1 border p-4 bg-black text-gray-600 w-full">
                  <div class="bg-black relative w-full shadow-lg rounded-md" style="padding-bottom: 136%;">
                    <img v-if="modulePreviewImage" :src="modulePreviewImage" alt="" class="absolute w-full select-none pointer-events-none">
                    <div class="flex justify-end w-full">
                      <div class="bg-gray-800 mr-4 text-sm font-medium bg-opacity-75 rounded-md mt-4 text-white px-6 py-1 relative z-10">
                        {{ selectedModule?.contents?.length || 0 }} Aulas
                      </div>
                    </div>
                  </div>
                </dd>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </KiwifyChrome>
</template>
