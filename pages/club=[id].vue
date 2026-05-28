<script setup lang="ts">
import ClubLayout from '~/components/member-club/ClubLayout.vue'

definePageMeta({ layout: false })

const route = useRoute()
const clubId = computed(() => String(route.params.id || ''))
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

onMounted(() => {
  club.load()
})
</script>

<template>
  <ClubLayout
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
