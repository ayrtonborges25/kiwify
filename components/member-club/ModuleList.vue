<script setup lang="ts">
import LessonItem from '~/components/member-club/LessonItem.vue'
import { defaultFigurinhasModuleImage } from '~/data/memberClub'
import type { MemberClubLesson, MemberClubModule } from '~/data/memberClub'

const props = defineProps<{
  modules: MemberClubModule[]
  expandedModuleIds: string[]
  currentLessonId?: string
  completedLessonIds: string[]
  showLessons?: boolean
}>()

defineEmits<{
  toggleModule: [moduleId: string]
  selectLesson: [lesson: MemberClubLesson]
}>()

const route = useRoute()
const isFigurinhasRoute = computed(() => {
  const routeId = String(route.query.id || route.params.id || '')
  return routeId === '1cbe33c8-14d3-4612-81e4-b52587203765' || routeId === 'c6d46bd7-9ced-4fb2-a4a0-ae033e3b612a'
})
const safeModuleImage = (src?: string) => {
  if (isFigurinhasRoute.value) return defaultFigurinhasModuleImage
  if (!src || /rob[oô]|lightroom|ribas|presets/i.test(src)) return defaultFigurinhasModuleImage
  return src
}
const currentModule = computed(() => {
  return props.modules.find((module) => module.lessons.some((lesson) => lesson.id === props.currentLessonId)) || props.modules[0]
})
</script>

<template>
  <section id="section__" class="kiwi-section relative z-0 hover:z-10 has-[:focus]:z-20 px-6 md:px-12 pb-6 md:pb-12 content-section content-section--modules" data-kiwi-section-id="">
    <div class="pt-8">
      <h2 id="section____title" class="kiwi-section__title font-semibold text-xl drop-shadow-hard-light dark:drop-shadow-hard mb-1 sm:mb-3 flex flex-row items-center gap-2 relative z-20">Módulos</h2>

      <div>
        <div class="embla relative group" data-embla-options="{ &quot;loop&quot;: false, &quot;dragFree&quot;: true }">
          <div class="embla__viewport">
            <div class="embla__container flex items-start gap-4 *:flex-grow-0 *:flex-shrink-0 *:basis-auto *:min-w-0 *:max-w-full">
              <div
                v-for="module in modules"
                :key="module.id"
                class="embla__slide cursor-pointer focus:scale-105 hover:scale-105 relative sci group/sci block z-0 hover:z-10 rounded-lg transform transition-all ease-in-out duration-300 scale-100 w-5/12 md:w-64"
                @click="showLessons && module.lessons[0] ? $emit('selectLesson', module.lessons[0]) : $emit('toggleModule', module.id)"
              >
                <div :data-kiwi-router-link="`/${module.id}`">
                  <div class="relative">
                    <div class="club-image-container">
                      <figure class="rounded-t-lg sci__img z-10 relative select-none leading-[0px] leading-[0px]">
                        <img
                          v-if="module.imageUrl"
                          width="400"
                          height="600"
                          :src="safeModuleImage(module.imageUrl)"
                          @error="($event.target as HTMLImageElement).src = defaultFigurinhasModuleImage"
                          :alt="module.title"
                          class="rounded-lg select-none transition-all ease-in-out duration-300 bg-primary object-contain aspect-[2/3]"
                          style="aspect-ratio: 400 / 600;"
                        >
                      </figure>
                    </div>
                    <div class="z-10 absolute bottom-0 inset-x-0 flex flex-row items-center justify-center rounded-b-lg overflow-hidden">
                      <progress
                        aria-valuemax="100"
                        :aria-valuenow="module.lessons.length ? Math.round((module.lessons.filter((lesson) => completedLessonIds.includes(lesson.id)).length / module.lessons.length) * 100) : 0"
                        class="block appearance-none border-none overflow-hidden w-full h-1 rounded-none text-red-500 dark:text-red-400"
                        max="100"
                        :value="module.lessons.length ? Math.round((module.lessons.filter((lesson) => completedLessonIds.includes(lesson.id)).length / module.lessons.length) * 100) : 0"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div v-if="showLessons && currentModule" class="club-lessons-list">
        <div class="club-lessons-list__header">
          <strong>{{ currentModule.title }}</strong>
          <span>{{ currentModule.lessons.length }} aula{{ currentModule.lessons.length === 1 ? '' : 's' }}</span>
        </div>
        <div class="club-lessons-list__items">
          <LessonItem
            v-for="lesson in currentModule.lessons"
            :key="lesson.id"
            :lesson="lesson"
            :active="lesson.id === currentLessonId"
            :completed="completedLessonIds.includes(lesson.id)"
            @select="$emit('selectLesson', $event)"
          />
        </div>
      </div>
    </div>
  </section>
</template>

<style scoped>
.club-lessons-list {
  margin-top: 32px;
  border: 1px solid rgba(255, 255, 255, .16);
  border-radius: 8px;
  overflow: hidden;
  background: rgba(255, 255, 255, .03);
}

.club-lessons-list__header {
  min-height: 72px;
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  border-bottom: 1px solid rgba(255, 255, 255, .12);
  color: #fff;
}

.club-lessons-list__header strong {
  font-size: 24px;
}

.club-lessons-list__header span {
  color: #b7b7b7;
}

.club-lessons-list__items {
  padding: 8px 16px;
}
</style>
