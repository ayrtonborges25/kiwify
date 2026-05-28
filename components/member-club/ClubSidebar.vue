<script setup lang="ts">
import type { MemberClub } from '~/data/memberClub'

const props = defineProps<{
  club?: MemberClub
  progress: number
  editorPreview?: boolean
}>()

const customization = computed(() => props.club?.customization || {})
const theme = computed(() => customization.value.theme || {})
const sidebar = computed(() => customization.value.sidebar || {})
const links = computed(() => sidebar.value.links || {})
const sidebarColor = computed(() => theme.value.sidebarColor || customization.value.sidebarColor || '#facc15')
const sidebarTextColor = computed(() => sidebar.value.textColor || '#111827')
</script>

<template>
  <aside class="club-sidebar" :class="{ 'club-sidebar--collapsed': sidebar.collapsed, 'club-sidebar--editor': editorPreview }" :style="{ backgroundColor: sidebarColor, color: sidebarTextColor }">
    <div class="club-sidebar__title">
      <button class="club-sidebar__back" type="button" aria-label="Voltar">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path fill="currentColor" d="M15.78 19.28a.75.75 0 0 1-1.06 0l-6.75-6.75a.75.75 0 0 1 0-1.06l6.75-6.75a.75.75 0 1 1 1.06 1.06L9.56 12l6.22 6.22a.75.75 0 0 1 0 1.06Z" />
        </svg>
      </button>
      <img v-if="club?.logoUrl && !sidebar.collapsed" :src="club.logoUrl" alt="" class="club-sidebar__logo">
      <h1 v-if="!sidebar.collapsed">{{ sidebar.title || customization.heroTitle || club?.title || 'Área de membros' }}</h1>
    </div>

    <nav class="club-sidebar__nav" aria-label="Navegação da área de membros">
      <a href="#" class="club-sidebar__link">
        <span class="club-sidebar__icon">
          <svg viewBox="0 0 576 512" aria-hidden="true">
            <path fill="currentColor" d="M280.37 148.26 96 300.11V464a16 16 0 0 0 16 16l112.06-.29a16 16 0 0 0 15.92-16V368a16 16 0 0 1 16-16h64a16 16 0 0 1 16 16v95.64a16 16 0 0 0 16 16.05L464 480a16 16 0 0 0 16-16V300L295.67 148.26a12.19 12.19 0 0 0-15.3 0M571.6 251.47 488 182.56V44.05a12 12 0 0 0-12-12h-56a12 12 0 0 0-12 12v72.61L318.47 43a48 48 0 0 0-61 0L4.34 251.47a12 12 0 0 0-1.6 16.9l25.5 31A12 12 0 0 0 45.15 301l235.22-193.74a12.19 12.19 0 0 1 15.3 0L530.9 301a12 12 0 0 0 16.9-1.6l25.5-31a12 12 0 0 0-1.7-16.93" />
          </svg>
        </span>
        <span v-if="!sidebar.collapsed">{{ links.home || customization.homeLabel || 'Home' }}</span>
      </a>
      <a :href="links.instagramUrl || club?.instagramUrl || '#'" target="_blank" rel="noreferrer" class="club-sidebar__link">
        <span class="club-sidebar__icon">
          <svg viewBox="0 0 448 512" aria-hidden="true">
            <path fill="currentColor" d="M224.1 141c-63.6 0-114.9 51.3-114.9 114.9s51.3 114.9 114.9 114.9S339 319.5 339 255.9 287.7 141 224.1 141m0 189.6c-41.1 0-74.7-33.5-74.7-74.7s33.5-74.7 74.7-74.7 74.7 33.5 74.7 74.7-33.6 74.7-74.7 74.7m146.4-194.3c0 14.9-12 26.8-26.8 26.8-14.9 0-26.8-12-26.8-26.8s12-26.8 26.8-26.8 26.8 12 26.8 26.8m76.1 27.2c-1.7-35.9-9.9-67.7-36.2-93.9-26.2-26.2-58-34.4-93.9-36.2-37-2.1-147.9-2.1-184.9 0-35.8 1.7-67.6 9.9-93.9 36.1S-.7 127.5-2.5 163.4c-2.1 37-2.1 147.9 0 184.9 1.7 35.9 9.9 67.7 36.2 93.9s58 34.4 93.9 36.2c37 2.1 147.9 2.1 184.9 0 35.9-1.7 67.7-9.9 93.9-36.2 26.2-26.2 34.4-58 36.2-93.9 2.1-37 2.1-147.8 0-184.8M398.8 388c-7.8 19.6-22.9 34.7-42.6 42.6-29.5 11.7-99.5 9-132.1 9s-102.7 2.6-132.1-9c-19.6-7.8-34.7-22.9-42.6-42.6-11.7-29.5-9-99.5-9-132.1s-2.6-102.7 9-132.1c7.8-19.6 22.9-34.7 42.6-42.6 29.5-11.7 99.5-9 132.1-9s102.7-2.6 132.1 9c19.6 7.8 34.7 22.9 42.6 42.6 11.7 29.5 9 99.5 9 132.1s2.7 102.7-9 132.1" />
          </svg>
        </span>
        <span v-if="!sidebar.collapsed">{{ links.instagram || customization.instagramLabel || 'Instagram' }}</span>
      </a>
      <a :href="links.supportUrl || club?.supportUrl || '#'" class="club-sidebar__link">
        <span class="club-sidebar__icon">
          <svg viewBox="0 0 512 512" aria-hidden="true">
            <path fill="currentColor" d="M192 208c0-17.67-14.33-32-32-32h-16c-35.35 0-64 28.65-64 64v48c0 35.35 28.65 64 64 64h16c17.67 0 32-14.33 32-32zm176 144c35.35 0 64-28.65 64-64v-48c0-35.35-28.65-64-64-64h-16c-17.67 0-32 14.33-32 32v112c0 17.67 14.33 32 32 32zM256 0C113.18 0 4.58 118.83 0 256v16c0 8.84 7.16 16 16 16h16c8.84 0 16-7.16 16-16v-16c0-114.69 93.31-208 208-208s208 93.31 208 208h-.12c.08 2.43.12 165.72.12 165.72 0 23.35-18.93 42.28-42.28 42.28H320c0-26.51-21.49-48-48-48h-32c-26.51 0-48 21.49-48 48s21.49 48 48 48h181.72c49.86 0 90.28-40.42 90.28-90.28V256C507.42 118.83 398.82 0 256 0" />
          </svg>
        </span>
        <span v-if="!sidebar.collapsed">{{ links.support || customization.supportLabel || 'Suporte' }}</span>
      </a>
    </nav>

    <div class="club-sidebar__account">
      <div class="club-sidebar__avatar" />
      <strong v-if="!sidebar.collapsed">{{ sidebar.brandName || club?.brandName || 'RETRATISTAS DIGITAIS' }}</strong>
      <svg v-if="!sidebar.collapsed" class="club-sidebar__account-caret" viewBox="0 0 20 20" aria-hidden="true">
        <path fill="currentColor" d="M10 6.75a.75.75 0 0 1 .53.22l4 4a.75.75 0 1 1-1.06 1.06L10 8.56l-3.47 3.47a.75.75 0 0 1-1.06-1.06l4-4a.75.75 0 0 1 .53-.22Z" />
      </svg>
    </div>
  </aside>
</template>

<style scoped>
.club-sidebar {
  position: fixed;
  inset: 0 auto 0 0;
  z-index: 20;
  width: 256px !important;
  min-width: 256px !important;
  max-width: 256px !important;
  background: #facc15;
  color: #111827;
  border-right: 1px solid rgba(17, 24, 39, .3);
  font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

.club-sidebar--collapsed {
  width: 86px !important;
  min-width: 86px !important;
  max-width: 86px !important;
}

.club-sidebar--editor {
  width: 256px !important;
  min-width: 256px !important;
  max-width: 256px !important;
}

.club-sidebar__title {
  height: 184px;
  padding: 28px 20px 26px;
  border-bottom: 1px solid rgba(17, 24, 39, .35);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  position: relative;
}

.club-sidebar__back {
  position: absolute;
  top: 18px;
  right: 17px;
  width: 24px;
  height: 24px;
  border: 0;
  background: transparent;
  color: currentColor;
  padding: 0;
  cursor: pointer;
}

.club-sidebar__back svg {
  display: block;
  width: 24px;
  height: 24px;
}

.club-sidebar__title h1 {
  margin: 0;
  max-width: 216px;
  font-size: 31px;
  font-weight: 400;
  line-height: 1.28;
}

.club-sidebar__logo {
  max-width: 180px;
  max-height: 72px;
  object-fit: contain;
  margin: 0 0 20px;
}

.club-sidebar__nav {
  padding: 32px 28px;
  display: flex;
  flex-direction: column;
  gap: 29px;
}

.club-sidebar__link {
  display: flex;
  align-items: center;
  gap: 23px;
  color: currentColor;
  text-decoration: none;
  font-size: 20px;
  font-weight: 600;
  line-height: 1.5;
}

.club-sidebar__icon {
  width: 30px;
  height: 30px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  flex: 0 0 30px;
}

.club-sidebar__icon svg {
  display: block;
  width: 25px;
  height: 25px;
}

.club-sidebar__account {
  position: absolute;
  inset: auto 0 0;
  height: 104px;
  padding: 18px;
  border-top: 1px solid rgba(17, 24, 39, .35);
  display: flex;
  align-items: center;
  gap: 12px;
}

.club-sidebar__avatar {
  width: 56px;
  height: 56px;
  flex: 0 0 56px;
  border-radius: 999px;
  background: linear-gradient(110deg, #008a48, #00130b);
}

.club-sidebar__account strong {
  flex: 1;
  font-size: 20px;
  line-height: 1.25;
  font-weight: 700;
}

.club-sidebar__account-caret {
  width: 20px;
  height: 20px;
  flex: 0 0 20px;
}

@media (max-width: 900px) {
  .club-sidebar {
    position: relative;
    width: 100%;
    min-height: auto;
    border-right: 0;
  }

  .club-sidebar__title {
    min-height: 180px;
  }

  .club-sidebar__account {
    position: static;
  }
}
</style>
