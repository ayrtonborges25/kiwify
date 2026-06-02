<script setup lang="ts">
import ClubSidebar from '~/components/member-club/ClubSidebar.vue'
import ModuleList from '~/components/member-club/ModuleList.vue'
import type { MemberClubData, MemberClubLesson, MemberClubModule } from '~/data/memberClub'

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
const sidebarCollapsed = ref(false)
const safeClubImage = (src?: string) => {
  const value = String(src || '')
  if (/^(data:image|blob:)/i.test(value) || /member-area-covers.*clean-/i.test(value)) return value
  return ''
}
const showBanner = computed(() => banner.value.visible !== false && (!customization.value.visibleSections || customization.value.visibleSections.includes('banner')))
const visibleSections = computed(() => sections.value.filter((section: any) => section.visible !== false))
const heroImage = computed(() => safeClubImage(banner.value.imageUrl || slides.value[0]?.imageUrl || props.data?.course.coverUrl))
watch(() => Boolean(sidebar.value.collapsed), (collapsed) => {
  sidebarCollapsed.value = collapsed
}, { immediate: true })

const activeModule = ref<MemberClubModule>()
const activeLesson = ref<MemberClubLesson>()
const toggleSidebar = () => {
  sidebarCollapsed.value = !sidebarCollapsed.value
}
const openModule = (module: MemberClubModule) => {
  if (isEditorPreview.value) return
  activeModule.value = module
  activeLesson.value = module.lessons[0]
}
const closeModule = () => {
  activeModule.value = undefined
  activeLesson.value = undefined
}
const openLesson = (lesson?: MemberClubLesson) => {
  if (!lesson || lesson.status === 'locked') return
  activeLesson.value = lesson
}
const lessonDescriptionParts = computed(() => {
  const description = activeLesson.value?.description || ''
  const [text, link] = description.split('\n')
  return { text: text || 'Baixe todos os arquivos neste link', link: link || 'https://drive.google.com/drive/folders/1owxb2iB_VVps8W05OqwI8aNjt61ObjjP' }
})
</script>

<template>
  <main class="club-page" :class="{ 'club-page--editor-preview': isEditorPreview, 'club-page--lesson-open': activeLesson }" :style="{ backgroundColor: theme.backgroundColor || customization.backgroundColor || '#080808', color: theme.textColor || customization.textColor || '#ffffff' }">
    <ClubSidebar v-if="!activeLesson" :club="data?.club" :progress="progress" :editor-preview="isEditorPreview" :collapsed="sidebarCollapsed" @toggle="toggleSidebar" />

    <section class="club-page__content" :class="{ 'club-page__content--collapsed': sidebarCollapsed, 'club-page__content--lesson': activeLesson }">
      <div v-if="loading" class="club-page__state">Carregando...</div>
      <div v-else-if="error" class="club-page__state">{{ error }}</div>
      <section v-else-if="activeLesson" class="club-lesson-view">
        <div class="club-lesson-view__main">
          <button type="button" class="club-lesson-view__back" aria-label="Voltar" @click="activeLesson = undefined">
            <svg viewBox="0 0 20 20" aria-hidden="true"><path fill="currentColor" d="M12.78 15.53a.75.75 0 0 1-1.06 0l-5-5a.75.75 0 0 1 0-1.06l5-5a.75.75 0 1 1 1.06 1.06L8.31 10l4.47 4.47a.75.75 0 0 1 0 1.06Z" /></svg>
          </button>
          <div class="club-lesson-view__toolbar">
            <span>☆ ☆ ☆ ☆ ☆</span>
            <button type="button" aria-label="Aula anterior">‹</button>
            <button type="button" aria-label="Próxima aula">›</button>
          </div>
          <article class="club-lesson-view__content">
            <p>{{ activeModule?.title?.toUpperCase() || 'BAIXAR FIGURINHAS' }}</p>
            <h1>{{ activeLesson.title }}</h1>
            <div class="club-lesson-view__text">
              <span>{{ lessonDescriptionParts.text }}</span>
              <a :href="lessonDescriptionParts.link" target="_blank" rel="noreferrer">{{ lessonDescriptionParts.link }}</a>
            </div>
          </article>
        </div>
        <aside class="club-lesson-view__aside">
          <header>
            <h2>Aulas</h2>
            <button type="button" aria-label="Fechar" @click="closeModule">×</button>
          </header>
          <div class="club-lesson-view__module">
            <strong>{{ activeModule?.title }}</strong>
            <span>{{ activeModule?.lessons.length || 0 }}/{{ activeModule?.lessons.length || 0 }}⌄</span>
          </div>
          <button
            v-for="lesson in activeModule?.lessons || []"
            :key="lesson.id"
            type="button"
            class="club-lesson-view__lesson"
            :class="{ 'club-lesson-view__lesson--active': lesson.id === activeLesson.id }"
            @click="openLesson(lesson)"
          >
            <span class="club-lesson-view__check">✓</span>
            <span class="club-lesson-view__thumb">
              <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8zm-1 1.5L18.5 9H13zM8 13h8v2H8zm0 4h8v2H8z" /></svg>
            </span>
            <span>{{ lesson.title }}</span>
          </button>
        </aside>
      </section>
      <template v-else>
        <section v-if="showBanner" data-kiwi-section-id="M7IADU" class="club-editable-section club-editable-section--banner">
          <div v-if="isEditorPreview" class="club-editable-section__move">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" width="22" height="22"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18"></path></svg>
          </div>
          <div v-if="isEditorPreview" class="club-editable-section__actions">
            <button type="button" aria-label="Configurar"><svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.53 1.53 0 01-2.28.95c-1.37-.84-2.94.73-2.1 2.1.54.88.06 2.03-.95 2.28-1.56.38-1.56 2.6 0 2.98 1.01.25 1.49 1.4.95 2.28-.84 1.37.73 2.94 2.1 2.1.88-.54 2.03-.06 2.28.95.38 1.56 2.6 1.56 2.98 0 .25-1.01 1.4-1.49 2.28-.95 1.37.84 2.94-.73 2.1-2.1-.54-.88-.06-2.03.95-2.28 1.56-.38 1.56-2.6 0-2.98a1.53 1.53 0 01-.95-2.28c.84-1.37-.73-2.94-2.1-2.1a1.53 1.53 0 01-2.28-.95zM10 13a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd"></path></svg></button>
            <button type="button" aria-label="Duplicar"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg></button>
            <button type="button" aria-label="Excluir"><svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg></button>
          </div>
          <div class="embla relative overflow-hidden group" data-slides-delay="5" data-embla-options="{ &quot;loop&quot;: true, &quot;dragFree&quot;: false, &quot;active&quot;: false }">
            <div class="embla__viewport overflow-hidden">
              <div class="embla__container flex">
                <div v-for="slide in (slides.length ? slides : [{ id: 'slide-1', imageUrl: heroImage }])" :key="slide.id" class="embla__slide flex-shrink-0 w-screen max-w-full">
                  <picture v-if="safeClubImage(slide.imageUrl || heroImage)">
                    <source :srcset="safeClubImage(slide.imageUrl || heroImage)">
                    <img
                      :src="safeClubImage(slide.imageUrl || heroImage)"
                      @error="($event.target as HTMLImageElement).remove()"
                      alt=""
                      loading="lazy"
                      width="2000"
                      height="590"
                      class="select-none pointer-events-none w-full aspect-[768/432] sm:aspect-[2000/590] object-cover"
                    >
                  </picture>
                  <div v-else class="club-banner-empty" />
                </div>
              </div>
            </div>
          </div>
        </section>

        <section data-kiwi-section-id="continue-watching"></section>

        <section class="club-page__inner">
          <template v-for="section in visibleSections" :key="section.id">
            <div v-if="section.type === 'modules'" class="club-page__section club-editable-section">
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
                @open-module="openModule"
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
                            <img v-if="safeClubImage(data?.course.coverUrl)" width="400" height="600" :src="safeClubImage(data?.course.coverUrl)" @error="($event.target as HTMLImageElement).remove()" class="rounded-lg select-none transition-all ease-in-out duration-300 bg-primary object-contain aspect-[2/3]" style="aspect-ratio: 400 / 600;">
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
              <img v-if="safeClubImage(section.imageUrl)" :src="safeClubImage(section.imageUrl)" alt="">
            </div>
          </template>
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
  display: flex;
  align-items: stretch;
  justify-content: flex-start;
  overflow-x: hidden;
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

.club-page__content {
  flex: 1 1 auto;
  width: auto;
  min-width: 0;
  min-height: 100vh;
  margin-left: 0 !important;
  overflow-x: hidden;
}

.club-banner-empty {
  width: 100%;
  aspect-ratio: 768 / 432;
  background: #fff;
}

.club-editable-section--banner {
  display: block;
  margin: 0;
  padding: 0;
  line-height: 0;
}

.club-editable-section--banner picture,
.club-editable-section--banner source {
  display: block;
}

.club-editable-section--banner img,
.club-editable-section--banner .club-banner-empty {
  display: block;
  width: 100%;
  aspect-ratio: 768 / 432;
  object-fit: cover;
}

.club-page__content--collapsed {
  margin-left: 0 !important;
}

.club-page__content--lesson {
  margin-left: 0 !important;
}

.club-page__inner {
  max-width: none;
  padding: 0;
}

.club-page__section {
  position: relative;
  margin-bottom: 42px;
}

.content-section {
  padding-left: 1.5rem;
  padding-right: 1.5rem;
  padding-bottom: 1.5rem;
}

.content-section .kiwi-section__title {
  margin-bottom: .25rem;
}

.content-section .embla__container > * {
  flex-grow: 0;
  flex-shrink: 0;
  flex-basis: auto;
  min-width: 0;
  max-width: 100%;
}

.club-page__section h2 {
  margin: 0 0 18px;
  font-size: 30px;
}

.club-page__section p {
  margin: -8px 0 22px;
  color: #cbd5e1;
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

.club-lesson-view__check {
  width: 20px;
  height: 20px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  color: #fff;
  background: #facc15;
  font-size: 14px;
  font-weight: 800;
}

.club-lesson-view__thumb {
  width: 96px;
  aspect-ratio: 16 / 9;
  border-radius: 6px;
  border-bottom: 5px solid #ef4444;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  background: #facc15;
}

.club-lesson-view__thumb svg {
  width: 32px;
  height: 32px;
}

.club-lesson-view {
  min-height: 100vh;
  display: grid;
  grid-template-columns: minmax(0, 3fr) minmax(320px, 1fr);
  background: #08090b;
  color: #fff;
}

.club-lesson-view__main {
  position: relative;
  padding: 34px 34px;
  border-right: 1px solid rgba(255, 255, 255, .12);
}

.club-lesson-view__back {
  width: 28px;
  height: 28px;
  border: 0;
  color: #aeb4c0;
  background: transparent;
  cursor: pointer;
}

.club-lesson-view__back svg {
  width: 28px;
  height: 28px;
}

.club-lesson-view__toolbar {
  position: absolute;
  top: 96px;
  right: 48px;
  display: flex;
  align-items: center;
  gap: 26px;
  color: #60636d;
  font-size: 26px;
}

.club-lesson-view__toolbar button {
  border: 0;
  color: #7e8490;
  background: transparent;
  font-size: 42px;
  cursor: pointer;
  line-height: 1;
}

.club-lesson-view__content {
  margin-top: 0;
  max-width: 820px;
}

.club-lesson-view__content p {
  margin: 0 0 14px;
  color: #facc15;
  font-size: 16px;
  font-weight: 700;
}

.club-lesson-view__content h1 {
  margin: 0;
  font-size: 24px;
  line-height: 1.2;
  font-weight: 800;
}

.club-lesson-view__text {
  margin-top: 108px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  color: #d7d7dc;
  font-size: 18px;
  line-height: 1.35;
}

.club-lesson-view__text a {
  display: block;
  max-width: 430px;
  overflow: hidden;
  color: #facc15;
  text-decoration: underline;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.club-lesson-view__aside {
  background: #111216;
}

.club-lesson-view__aside header {
  height: 96px;
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.club-lesson-view__aside h2 {
  margin: 0;
  font-size: 30px;
  font-weight: 400;
}

.club-lesson-view__aside header button {
  border: 0;
  color: #fff;
  background: transparent;
  font-size: 42px;
  cursor: pointer;
  line-height: 1;
}

.club-lesson-view__module {
  min-height: 72px;
  padding: 0 24px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 16px;
}

.club-lesson-view__lesson {
  width: 100%;
  min-height: 82px;
  display: grid;
  grid-template-columns: 20px 96px minmax(0, 1fr);
  align-items: center;
  gap: 8px;
  border: 0;
  color: #fff;
  background: #1d1e22;
  text-align: left;
  cursor: pointer;
  padding: 14px 16px 14px 44px;
}

.club-lesson-view__lesson--active {
  background: #232429;
}

.club-lesson-view__lesson span:last-child {
  font-size: 16px;
  line-height: 1.25;
}

.club-page--editor-preview .club-editable-section {
  border: 2px solid transparent;
}

.club-page--editor-preview .club-editable-section:hover {
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
.club-editable-section:hover .club-editable-section__actions {
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

.club-editable-section:hover .club-editable-section__add {
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

@media (min-width: 640px) {
  .club-editable-section--banner img,
  .club-editable-section--banner .club-banner-empty {
    aspect-ratio: 2000 / 590;
  }

  .content-section .kiwi-section__title {
    margin-bottom: .75rem;
  }
}

@media (min-width: 768px) {
  .content-section {
    padding-left: 3rem;
    padding-right: 3rem;
    padding-bottom: 3rem;
  }
}
</style>
