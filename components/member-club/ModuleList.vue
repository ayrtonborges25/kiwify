<script setup lang="ts">
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
  openModule: [module: MemberClubModule]
}>()

const safeModuleImage = (src?: string) => {
  const value = String(src || '')
  if (/^(data:image|blob:)/i.test(value) || /member-area-covers.*clean-/i.test(value) || value === defaultFigurinhasModuleImage) return value
  return defaultFigurinhasModuleImage
}
</script>

<template>
  <section id="section__" class="kiwi-section relative z-0 hover:z-10 has-[:focus]:z-20 px-6 md:px-12 pb-6 md:pb-12 content-section content-section--modules" data-kiwi-section-id="">
    <div class="pt-8">
      <h2 id="section____title" class="kiwi-section__title font-semibold text-xl drop-shadow-hard-light dark:drop-shadow-hard mb-1 sm:mb-3 flex flex-row items-center gap-2 relative z-20">Uma seção pode conter módulos</h2>

      <div>
        <div class="embla relative group" data-embla-options="{ &quot;loop&quot;: false, &quot;dragFree&quot;: true }">
          <div class="embla__viewport">
            <div class="embla__container flex items-start gap-4 *:flex-grow-0 *:flex-shrink-0 *:basis-auto *:min-w-0 *:max-w-full">
              <div
                v-for="module in modules"
                :key="module.id"
                class="embla__slide cursor-pointer focus:scale-105 hover:scale-105 relative sci group/sci block z-0 hover:z-10 rounded-lg transform transition-all ease-in-out duration-300 scale-100 w-5/12 md:w-64"
                @click="$emit('openModule', module)"
              >
                <div :data-kiwi-router-link="`/${module.id}`">
                  <div class="relative">
                    <div class="club-image-container">
                      <figure class="rounded-t-lg sci__img z-10 relative select-none leading-[0px] leading-[0px]">
                        <img
                          v-if="safeModuleImage(module.imageUrl)"
                          width="400"
                          height="600"
                          :src="safeModuleImage(module.imageUrl)"
                          @error="($event.target as HTMLImageElement).remove()"
                          :alt="module.title"
                          class="rounded-lg select-none transition-all ease-in-out duration-300 bg-primary object-contain aspect-[2/3]"
                          style="aspect-ratio: 400 / 600;"
                        >
                        <div v-else class="club-module-card-empty" />
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

    </div>
  </section>
</template>

<style scoped>
.content-section--modules {
  padding-left: 1.5rem;
  padding-right: 1.5rem;
  padding-bottom: 1.5rem;
}

.content-section--modules .kiwi-section__title {
  margin-bottom: .25rem;
}

.content-section--modules .embla__container > * {
  flex-grow: 0;
  flex-shrink: 0;
  flex-basis: auto;
  min-width: 0;
  max-width: 100%;
}

.club-module-card-empty {
  width: 100%;
  aspect-ratio: 400 / 600;
  border-radius: 8px;
  background: #fff;
}

.content-section--modules .embla__viewport,
.content-section--modules .embla__container,
.content-section--modules .embla__slide,
.content-section--modules .club-image-container,
.content-section--modules .sci__img,
.content-section--modules img {
  min-height: 0;
}

.content-section--modules .sci__img,
.content-section--modules img,
.club-module-card-empty {
  display: block;
  width: 100%;
}

@media (min-width: 640px) {
  .content-section--modules .kiwi-section__title {
    margin-bottom: .75rem;
  }
}

@media (min-width: 768px) {
  .content-section--modules {
    padding-left: 3rem;
    padding-right: 3rem;
    padding-bottom: 3rem;
  }
}
</style>
