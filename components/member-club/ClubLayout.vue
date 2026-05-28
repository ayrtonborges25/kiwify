<script setup lang="ts">
import ClubSidebar from '~/components/member-club/ClubSidebar.vue'
import LessonContent from '~/components/member-club/LessonContent.vue'
import LessonPlayer from '~/components/member-club/LessonPlayer.vue'
import ModuleList from '~/components/member-club/ModuleList.vue'
import { defaultClubBanner } from '~/data/memberClub'
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
const theme = computed(() => customization.value.theme || {})
const sidebar = computed(() => customization.value.sidebar || {})
const home = computed(() => customization.value.home || {})
const banner = computed(() => home.value.banner || {})
const slides = computed(() => home.value.slides || [])
const sections = computed(() => home.value.sections || [])
const route = useRoute()
const isEditorPreview = computed(() => route.query.editor === '1')
const isFigurinhasRoute = computed(() => {
  const routeId = String(route.query.id || route.params.id || '')
  const title = `${props.data?.club.title || ''} ${props.data?.course.title || ''}`
  return routeId === '1cbe33c8-14d3-4612-81e4-b52587203765' || routeId === 'c6d46bd7-9ced-4fb2-a4a0-ae033e3b612a' || /figurinhas|copa 2026/i.test(title)
})
const safeClubImage = (src?: string) => {
  if (isFigurinhasRoute.value) return defaultClubBanner
  return src || defaultClubBanner
}
const showBanner = computed(() => banner.value.visible !== false && (!customization.value.visibleSections || customization.value.visibleSections.includes('banner')))
const visibleSections = computed(() => sections.value.filter((section: any) => section.visible !== false))
const heroImage = computed(() => safeClubImage(banner.value.imageUrl || slides.value[0]?.imageUrl || props.data?.course.coverUrl))
</script>

<template>
  <main class="club-page" :class="{ 'club-page--editor-preview': isEditorPreview }" :style="{ backgroundColor: theme.backgroundColor || customization.backgroundColor || '#080808', color: theme.textColor || customization.textColor || '#ffffff' }">
    <ClubSidebar :club="data?.club" :progress="progress" :editor-preview="isEditorPreview" />

    <section class="club-page__content" :class="{ 'club-page__content--collapsed': sidebar.collapsed }">
      <div v-if="loading" class="club-page__state">Carregando...</div>
      <div v-else-if="error" class="club-page__state">{{ error }}</div>
      <template v-else>
        <section v-if="showBanner" data-kiwi-section-id="M7IADU">
          <div class="embla relative overflow-hidden group" data-slides-delay="5" data-embla-options="{ &quot;loop&quot;: true, &quot;dragFree&quot;: false, &quot;active&quot;: false }">
            <div class="embla__viewport overflow-hidden">
              <div class="embla__container flex">
                <div v-for="slide in (slides.length ? slides : [{ id: 'slide-1', imageUrl: heroImage }])" :key="slide.id" class="embla__slide flex-shrink-0 w-screen max-w-full">
                  <picture>
                    <source v-if="slide.imageUrl || heroImage" :srcset="safeClubImage(slide.imageUrl || heroImage)">
                    <img
                      :src="safeClubImage(slide.imageUrl || heroImage)"
                      @error="($event.target as HTMLImageElement).src = defaultClubBanner"
                      alt=""
                      loading="lazy"
                      width="2000"
                      height="590"
                      class="select-none pointer-events-none w-full aspect-[768/432] sm:aspect-[2000/590] object-cover"
                    >
                  </picture>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section data-kiwi-section-id="continue-watching"></section>

        <section class="club-page__inner">
          <template v-for="section in visibleSections" :key="section.id">
            <div v-if="section.type === 'modules'" class="club-page__section club-editable-section" :class="{ 'club-editable-section--active': isEditorPreview }">
              <div v-if="isEditorPreview" class="club-editable-section__move">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="22" height="22"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18"></path></svg>
              </div>
              <div v-if="isEditorPreview" class="club-editable-section__actions">
                <button type="button" aria-label="Configurar"><svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.53 1.53 0 01-2.28.95c-1.37-.84-2.94.73-2.1 2.1.54.88.06 2.03-.95 2.28-1.56.38-1.56 2.6 0 2.98 1.01.25 1.49 1.4.95 2.28-.84 1.37.73 2.94 2.1 2.1.88-.54 2.03-.06 2.28.95.38 1.56 2.6 1.56 2.98 0 .25-1.01 1.4-1.49 2.28-.95 1.37.84 2.94-.73 2.1-2.1-.54-.88-.06-2.03.95-2.28 1.56-.38 1.56-2.6 0-2.98a1.53 1.53 0 01-.95-2.28c.84-1.37-.73-2.94-2.1-2.1a1.53 1.53 0 01-2.28-.95zM10 13a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd"></path></svg></button>
                <button type="button" aria-label="Duplicar"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg></button>
                <button type="button" aria-label="Excluir"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button>
              </div>
              <ModuleList
                :modules="modules"
                :expanded-module-ids="expandedModuleIds"
                :current-lesson-id="currentLesson?.id"
                :completed-lesson-ids="completedLessonIds"
                :show-lessons="!isEditorPreview"
                @toggle-module="$emit('toggleModule', $event)"
                @select-lesson="$emit('selectLesson', $event)"
              />
              <button v-if="isEditorPreview" type="button" class="club-editable-section__add">ADICIONAR SEÇÃO</button>
            </div>
            <section v-else-if="section.type === 'courses'" id="section__" class="kiwi-section relative z-0 hover:z-10 has-[:focus]:z-20 px-6 md:px-12 pb-6 md:pb-12 content-section content-section--courses" data-kiwi-section-id="">
              <div class="pt-8">
                <h2 id="section____title" class="kiwi-section__title font-semibold text-xl drop-shadow-hard-light dark:drop-shadow-hard mb-1 sm:mb-3 flex flex-row items-center gap-2 relative z-20">{{ section.title || 'Ou cursos inteiros' }}</h2>
                <div class="embla relative group" data-embla-options="{ &quot;loop&quot;: false, &quot;dragFree&quot;: true }">
                  <div class="embla__viewport">
                    <div class="embla__container flex items-start gap-4 *:flex-grow-0 *:flex-shrink-0 *:basis-auto *:min-w-0 *:max-w-full">
                      <div class="embla__slide cursor-pointer focus:scale-105 hover:scale-105 relative sci group/sci block z-0 hover:z-10 rounded-lg transform transition-all ease-in-out duration-300 scale-100 w-5/12 md:w-64">
                        <div class="relative">
                          <figure class="rounded-t-lg sci__img z-10 relative select-none leading-[0px]">
                            <img v-if="data?.course.coverUrl" width="400" height="600" :src="safeClubImage(data.course.coverUrl)" @error="($event.target as HTMLImageElement).src = defaultClubBanner" class="rounded-lg select-none transition-all ease-in-out duration-300 bg-primary object-contain aspect-[2/3]" style="aspect-ratio: 400 / 600;">
                          </figure>
                          <div class="absolute inset-x-0 bottom-0 z-10 py-3 px-4 pb-4">
                            <h3 class="font-bold text-base md:text-lg line-clamp-2">{{ data?.course.title }}</h3>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>
            <div v-else class="club-page__section club-page__custom-section">
              <div>
                <h2>{{ section.title }}</h2>
                <p v-if="section.subtitle">{{ section.subtitle }}</p>
              </div>
              <img v-if="section.imageUrl" :src="section.imageUrl" alt="">
            </div>
          </template>
        </section>
        <section v-if="!isEditorPreview" class="club-lesson-area">
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
        </section>
        <footer class="py-6 px-4 text-xs flex flex-row items-center justify-center gap-2 hidden md:flex" id="club__content__footer">
          <span><strong>{{ data?.course.title || data?.club.title }}</strong> is powered by </span>
          <a href="https://kiwify.com.br" rel="noopener noreferrer" target="kiwify" class="leading-[0px] p-1 -m-1 rounded">Kiwify</a>
        </footer>
      </template>
    </section>

    <aside class="fixed bottom-0 inset-x-0 z-20 md:hidden bg-primary-500" id="club__bottom_nav">
      <nav class="py-2 px-2 flex flex-row items-center justify-around gap-2">
        <a href="#" class="router-link-active router-link-exact-active flex flex-col items-center justify-center text-center font-medium rounded-md border focus:outline-none transition ease-in-out duration-150 text-primary-foreground border-transparent leading-3 text-xs p-0 gap-0 cursor-pointer w-11 h-9" title="Home">Home</a>
        <a :href="data?.club.instagramUrl || '#'" rel="noopener noreferrer" target="kiwify.com" class="flex flex-col items-center justify-center text-center font-medium rounded-md border focus:outline-none transition ease-in-out duration-150 text-primary-foreground border-transparent leading-3 text-xs p-0 gap-0 cursor-pointer w-11 h-9" title="Instagram">IG</a>
        <a :href="data?.club.supportUrl || '#'" rel="noopener noreferrer" class="flex flex-col items-center justify-center text-center font-medium rounded-md border focus:outline-none transition ease-in-out duration-150 text-primary-foreground border-transparent leading-3 text-xs p-0 gap-0 cursor-pointer w-11 h-9" title="Suporte">Sup</a>
      </nav>
    </aside>
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
  margin-left: 256px !important;
}

.club-page__content--collapsed {
  margin-left: 86px !important;
}

.club-page__inner {
  max-width: none;
  padding: 0;
}

.club-page__section {
  position: relative;
  margin-bottom: 42px;
}

.club-page__section h2 {
  margin: 0 0 18px;
  font-size: 30px;
}

.club-page__section p {
  margin: -8px 0 22px;
  color: #cbd5e1;
}

.club-lesson-area {
  padding: 0 48px 48px;
}

.club-page__custom-section {
  max-width: 860px;
  min-height: 240px;
  border-radius: 8px;
  background: rgba(255, 255, 255, .06);
  overflow: hidden;
  display: grid;
  grid-template-columns: 1fr minmax(220px, 340px);
}

.club-page__custom-section div {
  padding: 32px;
}

.club-page__custom-section img {
  width: 100%;
  height: 100%;
  min-height: 240px;
  object-fit: cover;
}

.club-page__state {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
}

.club-page--editor-preview .club-editable-section {
  border: 2px solid transparent;
}

.club-page--editor-preview .club-editable-section:hover,
.club-editable-section--active {
  border: 2px solid #059669;
  margin: 0 0 42px;
}

.club-editable-section__move {
  position: absolute;
  left: -1px;
  top: 0;
  z-index: 30;
  width: 42px;
  height: 42px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  background: #059669;
  border-radius: 0 0 8px 0;
  opacity: 0;
}

.club-editable-section__actions {
  position: absolute;
  right: 0;
  top: 0;
  z-index: 30;
  display: flex;
  color: #fff;
  background: #059669;
  border-radius: 0 0 0 8px;
  overflow: hidden;
  opacity: 0;
}

.club-editable-section:hover .club-editable-section__move,
.club-editable-section:hover .club-editable-section__actions,
.club-editable-section--active .club-editable-section__move,
.club-editable-section--active .club-editable-section__actions {
  opacity: 1;
}

.club-editable-section__actions button {
  width: 42px;
  height: 42px;
  border: 0;
  color: inherit;
  background: transparent;
  display: flex;
  align-items: center;
  justify-content: center;
}

.club-editable-section__actions svg {
  width: 20px;
  height: 20px;
}

.club-editable-section__add {
  position: absolute;
  left: 50%;
  bottom: -18px;
  transform: translateX(-50%);
  z-index: 35;
  border: 0;
  border-radius: 999px;
  background: #059669;
  color: #fff;
  font-weight: 700;
  font-size: 14px;
  line-height: 18px;
  padding: 11px 28px;
  opacity: 0;
}

.club-editable-section:hover .club-editable-section__add,
.club-editable-section--active .club-editable-section__add {
  opacity: 1;
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
