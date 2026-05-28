<script setup lang="ts">
import type { MemberClub } from '~/data/memberClub'

const props = defineProps<{
  club?: MemberClub
  progress: number
}>()

const customization = computed(() => props.club?.customization || {})
</script>

<template>
  <aside class="club-sidebar" :style="{ backgroundColor: customization.sidebarColor || '#020202', color: customization.textColor || '#ffffff' }">
    <div class="club-sidebar__title">
      <button class="club-sidebar__back" type="button" aria-label="Voltar">‹</button>
      <img v-if="club?.logoUrl" :src="club.logoUrl" alt="" class="club-sidebar__logo">
      <h1>{{ customization.heroTitle || club?.title || 'Área de membros' }}</h1>
    </div>

    <nav class="club-sidebar__nav" aria-label="Navegação da área de membros">
      <a href="#" class="club-sidebar__link">
        <span class="club-sidebar__icon">⌂</span>
        <span>{{ customization.homeLabel || 'Home' }}</span>
      </a>
      <a :href="club?.instagramUrl || '#'" target="_blank" rel="noreferrer" class="club-sidebar__link">
        <span class="club-sidebar__icon">◎</span>
        <span>{{ customization.instagramLabel || 'Instagram' }}</span>
      </a>
      <a :href="club?.supportUrl || '#'" class="club-sidebar__link">
        <span class="club-sidebar__icon">◔</span>
        <span>{{ customization.supportLabel || 'Suporte' }}</span>
      </a>
    </nav>

    <div class="club-sidebar__account">
      <div class="club-sidebar__avatar" />
      <strong>{{ club?.brandName || 'RETRATISTAS DIGITAIS' }}</strong>
      <span>⌃</span>
    </div>
  </aside>
</template>

<style scoped>
.club-sidebar {
  position: fixed;
  inset: 0 auto 0 0;
  z-index: 20;
  width: 356px;
  background: #020202;
  color: #fff;
  border-right: 1px solid #262626;
  font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}

.club-sidebar__title {
  min-height: 274px;
  padding: 28px 28px 36px;
  border-bottom: 1px solid #242424;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.club-sidebar__back {
  width: 36px;
  height: 36px;
  margin: 0 0 34px;
  border: 0;
  background: transparent;
  color: #fff;
  font-size: 46px;
  line-height: 1;
  cursor: pointer;
}

.club-sidebar__title h1 {
  margin: 0;
  max-width: 280px;
  font-size: 31px;
  font-weight: 400;
  line-height: 1.35;
}

.club-sidebar__logo {
  max-width: 180px;
  max-height: 72px;
  object-fit: contain;
  margin: 0 0 20px;
}

.club-sidebar__nav {
  padding: 42px 32px;
  display: flex;
  flex-direction: column;
  gap: 34px;
}

.club-sidebar__link {
  display: flex;
  align-items: center;
  gap: 22px;
  color: #fff;
  text-decoration: none;
  font-size: 20px;
  font-weight: 600;
}

.club-sidebar__icon {
  width: 26px;
  text-align: center;
  font-size: 30px;
  line-height: 1;
}

.club-sidebar__account {
  position: absolute;
  inset: auto 0 0;
  min-height: 104px;
  padding: 18px;
  border-top: 1px solid #242424;
  display: flex;
  align-items: center;
  gap: 14px;
}

.club-sidebar__avatar {
  width: 64px;
  height: 64px;
  flex: 0 0 64px;
  border-radius: 999px;
  background: linear-gradient(110deg, #008a48, #00130b);
}

.club-sidebar__account strong {
  flex: 1;
  font-size: 20px;
  line-height: 1.25;
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
