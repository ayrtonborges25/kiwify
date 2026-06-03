<script setup lang="ts">
import { signOut } from '~/services/authService'
import type { MemberClub } from '~/data/memberClub'

const props = defineProps<{
  club?: MemberClub
  progress: number
  editorPreview?: boolean
  collapsed?: boolean
}>()

defineEmits<{
  toggle: []
}>()

const { currentUser } = useCurrentUser()
const customization = computed(() => props.club?.customization || {})
const theme = computed(() => customization.value.theme || {})
const sidebar = computed(() => customization.value.sidebar || {})
const links = computed(() => sidebar.value.links || {})
const sidebarColor = computed(() => theme.value.sidebarColor || customization.value.sidebarColor || '#ffcc00')
const sidebarTextColor = computed(() => sidebar.value.textColor || '#111827')
const avatarUrl = computed(() => currentUser.value.avatarUrl)
const accountName = computed(() => currentUser.value.name || currentUser.value.company || currentUser.value.email || 'Usuário')
const avatarInitial = computed(() => (currentUser.value.company || currentUser.value.name || currentUser.value.email || 'U').slice(0, 1).toUpperCase())
const isCollapsed = computed(() => props.collapsed ?? Boolean(sidebar.value.collapsed))
const accountMenuOpen = ref(false)

watch(isCollapsed, (collapsed) => {
  if (collapsed) accountMenuOpen.value = false
})

const toggleAccountMenu = () => {
  if (isCollapsed.value) return
  accountMenuOpen.value = !accountMenuOpen.value
}

const closeAccountMenu = () => {
  accountMenuOpen.value = false
}

const logout = async () => {
  closeAccountMenu()
  await signOut()
  await navigateTo('/student/login')
}
</script>

<template>
  <aside class="club-sidebar" :class="{ 'club-sidebar--collapsed': isCollapsed, 'club-sidebar--editor': editorPreview }" :style="{ backgroundColor: sidebarColor, color: sidebarTextColor }">
    <div class="club-sidebar__title">
      <button class="club-sidebar__arrow" type="button" :aria-label="isCollapsed ? 'Expandir menu' : 'Recolher menu'" @click="$emit('toggle')">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path fill="currentColor" d="M15.78 19.28a.75.75 0 0 1-1.06 0l-6.75-6.75a.75.75 0 0 1 0-1.06l6.75-6.75a.75.75 0 1 1 1.06 1.06L9.56 12l6.22 6.22a.75.75 0 0 1 0 1.06Z" />
        </svg>
      </button>
      <img v-if="club?.logoUrl && !isCollapsed" :src="club.logoUrl" alt="" class="club-sidebar__logo">
      <h1 v-if="!isCollapsed">{{ sidebar.title || customization.heroTitle || club?.title || 'Área de membros' }}</h1>
    </div>

    <nav class="club-sidebar__nav" aria-label="Navegação da área de membros">
      <a href="#" class="club-sidebar__link">
        <span class="club-sidebar__icon">
          <svg viewBox="0 0 576 512" aria-hidden="true">
            <path fill="currentColor" d="M280.37 148.26 96 300.11V464a16 16 0 0 0 16 16l112.06-.29a16 16 0 0 0 15.92-16V368a16 16 0 0 1 16-16h64a16 16 0 0 1 16 16v95.64a16 16 0 0 0 16 16.05L464 480a16 16 0 0 0 16-16V300L295.67 148.26a12.19 12.19 0 0 0-15.3 0M571.6 251.47 488 182.56V44.05a12 12 0 0 0-12-12h-56a12 12 0 0 0-12 12v72.61L318.47 43a48 48 0 0 0-61 0L4.34 251.47a12 12 0 0 0-1.6 16.9l25.5 31A12 12 0 0 0 45.15 301l235.22-193.74a12.19 12.19 0 0 1 15.3 0L530.9 301a12 12 0 0 0 16.9-1.6l25.5-31a12 12 0 0 0-1.7-16.93" />
          </svg>
        </span>
        <span v-if="!isCollapsed">{{ links.home || customization.homeLabel || 'Home' }}</span>
      </a>
      <a :href="links.instagramUrl || club?.instagramUrl || '#'" target="_blank" rel="noreferrer" class="club-sidebar__link">
        <span class="club-sidebar__icon">
          <svg viewBox="0 0 448 512" aria-hidden="true">
            <path fill="currentColor" d="M224.1 141c-63.6 0-114.9 51.3-114.9 114.9s51.3 114.9 114.9 114.9S339 319.5 339 255.9 287.7 141 224.1 141m0 189.6c-41.1 0-74.7-33.5-74.7-74.7s33.5-74.7 74.7-74.7 74.7 33.5 74.7 74.7-33.6 74.7-74.7 74.7m146.4-194.3c0 14.9-12 26.8-26.8 26.8-14.9 0-26.8-12-26.8-26.8s12-26.8 26.8-26.8 26.8 12 26.8 26.8m76.1 27.2c-1.7-35.9-9.9-67.7-36.2-93.9-26.2-26.2-58-34.4-93.9-36.2-37-2.1-147.9-2.1-184.9 0-35.8 1.7-67.6 9.9-93.9 36.1S-.7 127.5-2.5 163.4c-2.1 37-2.1 147.9 0 184.9 1.7 35.9 9.9 67.7 36.2 93.9s58 34.4 93.9 36.2c37 2.1 147.9 2.1 184.9 0 35.9-1.7 67.7-9.9 93.9-36.2 26.2-26.2 34.4-58 36.2-93.9 2.1-37 2.1-147.8 0-184.8M398.8 388c-7.8 19.6-22.9 34.7-42.6 42.6-29.5 11.7-99.5 9-132.1 9s-102.7 2.6-132.1-9c-19.6-7.8-34.7-22.9-42.6-42.6-11.7-29.5-9-99.5-9-132.1s-2.6-102.7 9-132.1c7.8-19.6 22.9-34.7 42.6-42.6 29.5-11.7 99.5-9 132.1-9s102.7-2.6 132.1 9c19.6 7.8 34.7 22.9 42.6 42.6 11.7 29.5 9 99.5 9 132.1s2.7 102.7-9 132.1" />
          </svg>
        </span>
        <span v-if="!isCollapsed">{{ links.instagram || customization.instagramLabel || 'Instagram' }}</span>
      </a>
      <a :href="links.supportUrl || club?.supportUrl || '#'" class="club-sidebar__link">
        <span class="club-sidebar__icon">
          <svg viewBox="0 0 512 512" aria-hidden="true">
            <path fill="currentColor" d="M192 208c0-17.67-14.33-32-32-32h-16c-35.35 0-64 28.65-64 64v48c0 35.35 28.65 64 64 64h16c17.67 0 32-14.33 32-32zm176 144c35.35 0 64-28.65 64-64v-48c0-35.35-28.65-64-64-64h-16c-17.67 0-32 14.33-32 32v112c0 17.67 14.33 32 32 32zM256 0C113.18 0 4.58 118.83 0 256v16c0 8.84 7.16 16 16 16h16c8.84 0 16-7.16 16-16v-16c0-114.69 93.31-208 208-208s208 93.31 208 208h-.12c.08 2.43.12 165.72.12 165.72 0 23.35-18.93 42.28-42.28 42.28H320c0-26.51-21.49-48-48-48h-32c-26.51 0-48 21.49-48 48s21.49 48 48 48h181.72c49.86 0 90.28-40.42 90.28-90.28V256C507.42 118.83 398.82 0 256 0" />
          </svg>
        </span>
        <span v-if="!isCollapsed">{{ links.support || customization.supportLabel || 'Suporte' }}</span>
      </a>
    </nav>

    <div class="club-sidebar__account-wrap">
      <button
        type="button"
        class="club-sidebar__account"
        :aria-expanded="accountMenuOpen"
        aria-haspopup="menu"
        @click="toggleAccountMenu"
      >
        <img v-if="avatarUrl" :src="avatarUrl" alt="" class="club-sidebar__avatar">
        <span v-else class="club-sidebar__avatar club-sidebar__avatar--initial">{{ avatarInitial }}</span>
        <strong v-if="!isCollapsed">{{ accountName }}</strong>
        <svg v-if="!isCollapsed" class="club-sidebar__account-caret" :class="{ 'club-sidebar__account-caret--open': accountMenuOpen }" viewBox="0 0 20 20" aria-hidden="true">
          <path fill="currentColor" d="M10 6.75a.75.75 0 0 1 .53.22l4 4a.75.75 0 1 1-1.06 1.06L10 8.56l-3.47 3.47a.75.75 0 0 1-1.06-1.06l4-4a.75.75 0 0 1 .53-.22Z" />
        </svg>
      </button>
      <div v-if="accountMenuOpen && !isCollapsed" class="club-sidebar__account-menu" role="menu">
        <a
          v-if="editorPreview"
          href="/myprofile"
          target="_blank"
          rel="noopener noreferrer"
          class="club-sidebar__account-menu-item"
          role="menuitem"
          @click="closeAccountMenu"
        >
          <span class="club-sidebar__account-menu-icon">
            <svg viewBox="0 0 448 512" aria-hidden="true"><path fill="currentColor" d="M224 256A128 128 0 1 0 224 0a128 128 0 1 0 0 256m89.6 32h-16.7c-22.2 10.2-46.9 16-72.9 16s-50.6-5.8-72.9-16h-16.7C60.2 288 0 348.2 0 422.4V464c0 26.5 21.5 48 48 48h352c26.5 0 48-21.5 48-48v-41.6c0-74.2-60.2-134.4-134.4-134.4" /></svg>
          </span>
          <span>Meu perfil</span>
        </a>
        <NuxtLink
          v-else
          to="/myprofile"
          class="club-sidebar__account-menu-item"
          role="menuitem"
          @click="closeAccountMenu"
        >
          <span class="club-sidebar__account-menu-icon">
            <svg viewBox="0 0 448 512" aria-hidden="true"><path fill="currentColor" d="M224 256A128 128 0 1 0 224 0a128 128 0 1 0 0 256m89.6 32h-16.7c-22.2 10.2-46.9 16-72.9 16s-50.6-5.8-72.9-16h-16.7C60.2 288 0 348.2 0 422.4V464c0 26.5 21.5 48 48 48h352c26.5 0 48-21.5 48-48v-41.6c0-74.2-60.2-134.4-134.4-134.4" /></svg>
          </span>
          <span>Meu perfil</span>
        </NuxtLink>
        <button type="button" class="club-sidebar__account-menu-item" role="menuitem" @click="logout">
          <span class="club-sidebar__account-menu-icon">
            <svg viewBox="0 0 512 512" aria-hidden="true"><path fill="currentColor" d="M497 273 329 441c-15 15-41 4.5-41-17v-96H152c-13.3 0-24-10.7-24-24v-80c0-13.3 10.7-24 24-24h136V104c0-21.4 25.9-32 41-17l168 168c9.3 9.4 9.3 24.6 0 34zM192 436v-40c0-6.6-5.4-12-12-12H96c-17.7 0-32-14.3-32-32V160c0-17.7 14.3-32 32-32h84c6.6 0 12-5.4 12-12V76c0-6.6-5.4-12-12-12H96C43 64 0 107 0 160v192c0 53 43 96 96 96h84c6.6 0 12-5.4 12-12" /></svg>
          </span>
          <span>Sair</span>
        </button>
      </div>
    </div>
  </aside>
</template>

<style scoped>
.club-sidebar {
  position: relative;
  z-index: 20;
  flex: 0 0 256px;
  align-self: stretch;
  width: 256px !important;
  min-width: 256px !important;
  max-width: 256px !important;
  min-height: 100vh;
  height: auto;
  max-height: none;
  background: #ffcc00;
  color: #111827;
  border-right: 1px solid rgba(17, 24, 39, .28);
  display: flex;
  flex-direction: column;
  align-items: stretch;
  justify-content: flex-start;
  font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

.club-sidebar,
.club-sidebar *,
.club-sidebar *::before,
.club-sidebar *::after {
  box-sizing: border-box;
}

.club-sidebar--collapsed {
  flex-basis: 88px;
  width: 88px !important;
  min-width: 88px !important;
  max-width: 88px !important;
}

.club-sidebar--editor {
  width: 256px !important;
  min-width: 256px !important;
  max-width: 256px !important;
}

.club-sidebar__title {
  height: 132px !important;
  min-height: 132px !important;
  max-height: 132px !important;
  flex: 0 0 132px !important;
  padding: 38px 20px 0 !important;
  border-bottom: 1px solid rgba(17, 24, 39, .24);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  position: relative;
}

.club-sidebar__arrow {
  position: absolute;
  top: 0;
  right: 0;
  width: 40px;
  height: 40px;
  border: 0;
  border-radius: 0 0 0 6px;
  background: rgba(17, 24, 39, .08);
  color: currentColor;
  padding: 0;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.club-sidebar__arrow:focus {
  outline: none;
}

.club-sidebar__arrow svg {
  display: block;
  width: 24px;
  height: 24px;
}

.club-sidebar__title h1 {
  margin: 0;
  max-width: 216px;
  font-size: 24px;
  font-weight: 400;
  line-height: 1.2;
}

.club-sidebar__logo {
  max-width: 180px;
  max-height: 72px;
  object-fit: contain;
  margin: 0 0 20px;
}

.club-sidebar--collapsed .club-sidebar__title {
  height: 88px !important;
  min-height: 88px !important;
  max-height: 88px !important;
  flex-basis: 88px !important;
  padding: 0 !important;
  justify-content: flex-start;
}

.club-sidebar--collapsed .club-sidebar__arrow {
  top: 0;
  left: 0;
  right: auto;
  width: 88px;
  height: 48px;
  border-radius: 0;
  background: rgba(17, 24, 39, .08);
}

.club-sidebar--collapsed .club-sidebar__arrow svg {
  transform: scaleX(-1);
}

.club-sidebar__nav {
  padding: 14px 8px 0;
  flex: 1 1 auto;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.club-sidebar__link {
  height: 42px;
  padding: 0 12px;
  display: flex;
  align-items: center;
  gap: 8px;
  color: currentColor;
  text-decoration: none;
  font-size: 14px;
  font-weight: 600;
  line-height: 1.25;
}

.club-sidebar--collapsed .club-sidebar__nav {
  padding: 16px 0 0;
  align-items: stretch;
}

.club-sidebar--collapsed .club-sidebar__link {
  width: 100%;
  padding: 0;
  justify-content: center;
  gap: 0;
}

.club-sidebar__icon {
  width: 24px;
  height: 24px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  text-align: center;
  flex: 0 0 24px;
}

.club-sidebar__icon svg {
  display: block;
  width: 20px;
  height: 20px;
}

.club-sidebar__account-wrap {
  position: relative;
  flex: 0 0 auto;
}

.club-sidebar__account {
  width: 100%;
  height: 64px;
  min-height: 64px;
  padding: 8px 16px;
  border: 0;
  border-top: 1px solid rgba(17, 24, 39, .24);
  display: flex;
  align-items: center;
  gap: 12px;
  color: currentColor;
  background: transparent;
  text-align: left;
  cursor: pointer;
}

.club-sidebar--collapsed .club-sidebar__account {
  height: 64px;
  padding: 8px 0;
  justify-content: center;
  gap: 0;
}

.club-sidebar__account:focus {
  outline: none;
}

.club-sidebar__avatar {
  width: 40px;
  height: 40px;
  flex: 0 0 40px;
  border-radius: 999px;
  background: #f3f4f6;
  object-fit: cover;
}

.club-sidebar__avatar--initial {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #374151;
  font-size: 14px;
  line-height: 20px;
  font-weight: 500;
}

.club-sidebar__account strong {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: 14px;
  line-height: 1.25;
  font-weight: 600;
}

.club-sidebar__account-caret {
  width: 20px;
  height: 20px;
  flex: 0 0 20px;
  transition: transform .15s ease;
}

.club-sidebar__account-caret--open {
  transform: rotate(180deg);
}

.club-sidebar__account-menu {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 64px;
  z-index: 50;
  padding: 12px 0 14px;
  border-top: 1px solid rgba(17, 24, 39, .24);
  background: inherit;
  color: inherit;
  box-shadow: 0 -10px 24px rgba(17, 24, 39, .08);
}

.club-sidebar__account-menu-item {
  width: 100%;
  min-height: 42px;
  padding: 0 24px;
  border: 0;
  display: flex;
  align-items: center;
  gap: 14px;
  color: currentColor;
  background: transparent;
  text-decoration: none;
  font-size: 14px;
  font-weight: 600;
  line-height: 1.25;
  text-align: left;
  cursor: pointer;
}

.club-sidebar__account-menu-item:hover,
.club-sidebar__account-menu-item:focus {
  outline: none;
  background: rgba(17, 24, 39, .08);
}

.club-sidebar__account-menu-icon {
  width: 24px;
  height: 24px;
  flex: 0 0 24px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.club-sidebar__account-menu-icon svg {
  width: 18px;
  height: 18px;
}

@media (max-width: 900px) {
  .club-sidebar {
    position: relative;
    width: 100%;
    min-height: auto;
    border-right: 0;
  }

  .club-sidebar__title {
    min-height: 180px !important;
  }

}
</style>
