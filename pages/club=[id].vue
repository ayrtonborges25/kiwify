<script setup lang="ts">
import ClubLayout from '~/components/member-club/ClubLayout.vue'

definePageMeta({ layout: false, middleware: 'club-access' })

const route = useRoute()
const clubId = computed(() => String(route.params.id || ''))
const accessByClub = useState<Record<string, boolean>>('club-access:by-club', () => ({}))
const accessState = computed(() => accessByClub.value[clubId.value])
const checkingAccess = computed(() => accessState.value === undefined)
const accessDenied = computed(() => accessState.value === false)
const club = useMemberClub(clubId)
const data = club.data
const loading = club.loading
const error = club.error
const modules = club.modules
const progressPercent = club.progressPercent
const expandedModuleIds = club.expandedModuleIds
const currentLesson = club.currentLesson
const currentModule = club.currentModule
const completedLessonIds = club.completedLessonIds
const currentProgress = club.currentProgress
const isPlaying = club.isPlaying

watch(accessState, async (hasAccess) => {
  if (hasAccess) await club.load()
}, { immediate: true })
</script>

<template>
  <main v-if="checkingAccess" class="min-h-screen bg-gray-100 flex items-center justify-center px-4 py-10">
    <div class="text-sm leading-5 text-gray-500">Verificando acesso...</div>
  </main>
  <main v-else-if="accessDenied" class="min-h-screen bg-gray-100 flex items-center justify-center px-4 py-10">
    <section class="w-full max-w-md bg-white rounded-lg shadow border border-gray-200 px-6 py-6 text-center">
      <h1 class="text-lg leading-6 font-medium text-gray-900">Acesso negado</h1>
      <p class="mt-2 text-sm leading-5 text-gray-500">Você ainda não possui acesso a esta área de membros.</p>
    </section>
  </main>
  <ClubLayout
    v-else
    :data="data"
    :loading="loading"
    :error="error"
    :progress="progressPercent"
    :modules="modules"
    :expanded-module-ids="expandedModuleIds"
    :current-lesson="currentLesson"
    :current-module="currentModule"
    :completed-lesson-ids="completedLessonIds"
    :current-progress="currentProgress"
    :playing="isPlaying"
    @toggle-module="club.toggleModule"
    @select-lesson="club.selectLesson"
    @toggle-play="club.togglePlay"
    @update-progress="club.setLessonProgress"
    @complete="club.markCurrentLessonComplete"
    @previous="club.previousLesson"
    @next="club.nextLesson"
  />
</template>
