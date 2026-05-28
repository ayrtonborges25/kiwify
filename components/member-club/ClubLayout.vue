<script setup lang="ts">
import ClubSidebar from '~/components/member-club/ClubSidebar.vue'
import LessonContent from '~/components/member-club/LessonContent.vue'
import LessonPlayer from '~/components/member-club/LessonPlayer.vue'
import ModuleList from '~/components/member-club/ModuleList.vue'
import type { MemberClubData, MemberClubLesson } from '~/data/memberClub'

defineEmits<{
  toggleModule: [moduleId: string]
  selectLesson: [lesson: MemberClubLesson]
  togglePlay: []
  updateProgress: [value: number]
  complete: []
  previous: []
  next: []
}>()

const props = defineProps<{
  data?: MemberClubData
  loading: boolean
  error?: string
  progress: number
  modules: MemberClubData['modules']
  expandedModuleIds: string[]
  currentLesson?: MemberClubLesson
  currentModule?: MemberClubData['modules'][number]
  completedLessonIds: string[]
  currentProgress: number
  playing: boolean
}>()

const customization = computed(() => props.data?.club.customization || {})
const showBanner = computed(() => !customization.value.visibleSections || customization.value.visibleSections.includes('banner'))
const showModules = computed(() => !customization.value.visibleSections || customization.value.visibleSections.includes('modules'))
</script>

<template>
  <main class="club-page" :style="{ backgroundColor: customization.backgroundColor || '#080808', color: customization.textColor || '#ffffff' }">
    <ClubSidebar :club="data?.club" :progress="progress" />

    <section class="club-page__content">
      <div v-if="loading" class="club-page__state">Carregando...</div>
      <div v-else-if="error" class="club-page__state">{{ error }}</div>
      <template v-else>
        <section v-if="showBanner" class="club-page__hero" :style="data?.course.coverUrl ? { backgroundImage: `linear-gradient(rgba(8,8,8,.25), rgba(8,8,8,.25)), url(${data.course.coverUrl})` } : { backgroundColor: customization.primaryColor || '#11104f' }">
          <div>
            <p>{{ data?.club.brandName || 'RETRATISTAS DIGITAIS' }}</p>
            <h2>{{ customization.heroTitle || data?.course.title || data?.club.title }}</h2>
          </div>
        </section>

        <section v-if="showModules" class="club-page__inner">
          <LessonPlayer
            :lesson="currentLesson"
            :playing="playing"
            :progress="currentProgress"
            @toggle-play="$emit('togglePlay')"
            @update-progress="$emit('updateProgress', $event)"
          />
          <LessonContent
            :lesson="currentLesson"
            :module="currentModule"
            :completed="!!currentLesson && completedLessonIds.includes(currentLesson.id)"
            @previous="$emit('previous')"
            @next="$emit('next')"
            @complete="$emit('complete')"
          />
          <ModuleList
            :modules="modules"
            :expanded-module-ids="expandedModuleIds"
            :current-lesson-id="currentLesson?.id"
            :completed-lesson-ids="completedLessonIds"
            @toggle-module="$emit('toggleModule', $event)"
            @select-lesson="$emit('selectLesson', $event)"
          />
        </section>
      </template>
    </section>
  </main>
</template>

<style scoped>
.club-page {
  min-height: 100vh;
  background: #080808;
  color: #fff;
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

.club-page__content {
  min-height: 100vh;
  margin-left: 356px;
}

.club-page__hero {
  height: 482px;
  background: linear-gradient(90deg, #080808 0%, #11104f 42%, #2d2ec2 100%);
  background-size: cover;
  background-position: center;
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  padding: 40px;
}

.club-page__hero p {
  margin: 0 0 12px;
  color: #d6d6d6;
  letter-spacing: .04em;
  font-size: 14px;
}

.club-page__hero h2 {
  margin: 0;
  font-size: 38px;
  line-height: 1.1;
  font-weight: 700;
}

.club-page__inner {
  max-width: 1420px;
  padding: 42px 48px 80px;
}

.club-page__state {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}

@media (max-width: 900px) {
  .club-page__content {
    margin-left: 0;
  }

  .club-page__hero {
    height: 300px;
  }

  .club-page__inner {
    padding: 28px 20px 60px;
  }
}
</style>
