import { getMemberClubById } from '~/services/memberClubService'
import type { MemberClubData, MemberClubLesson } from '~/data/memberClub'

type PersistedClubState = {
  currentLessonId?: string
  expandedModuleIds?: string[]
  completedLessonIds?: string[]
  lessonProgress?: Record<string, number>
}

export const useMemberClub = (clubId: Ref<string> | ComputedRef<string>) => {
  const data = ref<MemberClubData>()
  const loading = ref(true)
  const error = ref('')
  const currentLessonId = ref('')
  const expandedModuleIds = ref<string[]>([])
  const completedLessonIds = ref<string[]>([])
  const lessonProgress = ref<Record<string, number>>({})
  const isPlaying = ref(false)

  const storageKey = computed(() => `member-club:${clubId.value}`)
  const modules = computed(() => data.value?.modules || [])
  const lessons = computed(() => modules.value.flatMap((module) => module.lessons))
  const currentLesson = computed(() => lessons.value.find((lesson) => lesson.id === currentLessonId.value) || lessons.value[0])
  const currentModule = computed(() => modules.value.find((module) => module.lessons.some((lesson) => lesson.id === currentLesson.value?.id)))
  const currentProgress = computed(() => currentLesson.value ? Number(lessonProgress.value[currentLesson.value.id] || 0) : 0)
  const completedCount = computed(() => completedLessonIds.value.length)
  const progressPercent = computed(() => lessons.value.length ? Math.round((completedCount.value / lessons.value.length) * 100) : 0)

  const persist = () => {
    if (!process.client) return
    const state: PersistedClubState = {
      currentLessonId: currentLessonId.value,
      expandedModuleIds: expandedModuleIds.value,
      completedLessonIds: completedLessonIds.value,
      lessonProgress: lessonProgress.value
    }
    localStorage.setItem(storageKey.value, JSON.stringify(state))
  }

  const restore = () => {
    if (!process.client) return
    try {
      const raw = localStorage.getItem(storageKey.value)
      if (!raw) return
      const state = JSON.parse(raw) as PersistedClubState
      currentLessonId.value = state.currentLessonId || currentLessonId.value
      expandedModuleIds.value = state.expandedModuleIds || expandedModuleIds.value
      completedLessonIds.value = state.completedLessonIds || completedLessonIds.value
      lessonProgress.value = state.lessonProgress || lessonProgress.value
    } catch {
      localStorage.removeItem(storageKey.value)
    }
  }

  const load = async () => {
    loading.value = true
    error.value = ''
    try {
      data.value = await getMemberClubById(clubId.value)
      expandedModuleIds.value = data.value.modules[0]?.id ? [data.value.modules[0].id] : []
      currentLessonId.value = data.value.modules[0]?.lessons[0]?.id || ''
      restore()
      if (!lessons.value.some((lesson) => lesson.id === currentLessonId.value)) {
        currentLessonId.value = lessons.value[0]?.id || ''
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Nao foi possivel carregar a area de membros.'
    } finally {
      loading.value = false
    }
  }

  const toggleModule = (moduleId: string) => {
    expandedModuleIds.value = expandedModuleIds.value.includes(moduleId)
      ? expandedModuleIds.value.filter((id) => id !== moduleId)
      : [...expandedModuleIds.value, moduleId]
    persist()
  }

  const selectLesson = (lesson: MemberClubLesson) => {
    if (lesson.status === 'locked') return
    currentLessonId.value = lesson.id
    isPlaying.value = false
    if (!expandedModuleIds.value.includes(lesson.moduleId)) {
      expandedModuleIds.value = [...expandedModuleIds.value, lesson.moduleId]
    }
    persist()
  }

  const setLessonProgress = (value: number) => {
    if (!currentLesson.value) return
    lessonProgress.value = {
      ...lessonProgress.value,
      [currentLesson.value.id]: Math.max(0, Math.min(100, value))
    }
    persist()
  }

  const markCurrentLessonComplete = () => {
    if (!currentLesson.value) return
    setLessonProgress(100)
    if (!completedLessonIds.value.includes(currentLesson.value.id)) {
      completedLessonIds.value = [...completedLessonIds.value, currentLesson.value.id]
    }
    persist()
  }

  const nextLesson = () => {
    const index = lessons.value.findIndex((lesson) => lesson.id === currentLesson.value?.id)
    const next = lessons.value[index + 1]
    if (next) selectLesson(next)
  }

  const previousLesson = () => {
    const index = lessons.value.findIndex((lesson) => lesson.id === currentLesson.value?.id)
    const previous = lessons.value[index - 1]
    if (previous) selectLesson(previous)
  }

  const togglePlay = () => {
    isPlaying.value = !isPlaying.value
  }

  watch(clubId, load)

  return {
    data,
    loading,
    error,
    modules,
    lessons,
    currentLesson,
    currentModule,
    currentProgress,
    progressPercent,
    expandedModuleIds,
    completedLessonIds,
    isPlaying,
    load,
    toggleModule,
    selectLesson,
    setLessonProgress,
    markCurrentLessonComplete,
    nextLesson,
    previousLesson,
    togglePlay
  }
}
