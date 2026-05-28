<script setup lang="ts">
import type { MemberClubLesson, MemberClubModule } from '~/data/memberClub'

defineProps<{
  modules: MemberClubModule[]
  expandedModuleIds: string[]
  currentLessonId?: string
  completedLessonIds: string[]
}>()

defineEmits<{
  toggleModule: [moduleId: string]
  selectLesson: [lesson: MemberClubLesson]
}>()
</script>

<template>
  <section class="club-modules">
    <h2>Módulos</h2>

    <div class="club-module-strip">
      <article
        v-for="module in modules"
        :key="module.id"
        class="club-module-card"
        @click="$emit('toggleModule', module.id)"
      >
        <figure class="club-module-card__image">
          <img v-if="module.imageUrl" :src="module.imageUrl" :alt="module.title">
        </figure>
        <ProgressBar :value="module.lessons.length ? Math.round((module.lessons.filter((lesson) => completedLessonIds.includes(lesson.id)).length / module.lessons.length) * 100) : 0" />
        <div class="club-module-card__body">
          <strong>{{ module.title }}</strong>
          <span>{{ module.lessons.length }} {{ module.lessons.length === 1 ? 'conteúdo' : 'conteúdos' }}</span>
        </div>
      </article>
    </div>

    <div class="club-module-lessons">
      <article v-for="module in modules" :key="`list-${module.id}`" class="club-module-group">
        <button type="button" class="club-module-group__head" @click="$emit('toggleModule', module.id)">
          <span>{{ module.title }}</span>
          <small>{{ module.lessons.length }} {{ module.lessons.length === 1 ? 'aula' : 'aulas' }}</small>
          <strong>{{ expandedModuleIds.includes(module.id) ? '⌃' : '⌄' }}</strong>
        </button>
        <div v-if="expandedModuleIds.includes(module.id)" class="club-module-group__lessons">
          <LessonItem
            v-for="lesson in module.lessons"
            :key="lesson.id"
            :lesson="lesson"
            :active="lesson.id === currentLessonId"
            :completed="completedLessonIds.includes(lesson.id)"
            @select="$emit('selectLesson', $event)"
          />
        </div>
      </article>
    </div>
  </section>
</template>

<style scoped>
.club-modules {
  padding: 42px 0 64px;
}

.club-modules h2 {
  margin: 0 0 22px;
  color: #fff;
  font-size: 28px;
  font-weight: 700;
}

.club-module-strip {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  overflow-x: auto;
  padding: 0 0 24px;
}

.club-module-card {
  flex: 0 0 256px;
  width: 256px;
  border-radius: 8px;
  overflow: hidden;
  background: #151515;
  cursor: pointer;
  transition: transform .2s ease;
}

.club-module-card:hover {
  transform: scale(1.03);
}

.club-module-card__image {
  margin: 0;
  width: 256px;
  height: 384px;
  background: #171717;
}

.club-module-card__image img {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.club-module-card__body {
  padding: 14px 16px 18px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.club-module-card__body strong {
  color: #fff;
  font-size: 20px;
  line-height: 1.25;
}

.club-module-card__body span {
  color: #a3a3a3;
  font-size: 14px;
}

.club-module-lessons {
  display: grid;
  gap: 12px;
  max-width: 900px;
}

.club-module-group {
  border-radius: 8px;
  background: #111;
  border: 1px solid #242424;
  overflow: hidden;
}

.club-module-group__head {
  width: 100%;
  border: 0;
  background: transparent;
  color: #fff;
  padding: 18px 20px;
  display: grid;
  grid-template-columns: 1fr auto auto;
  align-items: center;
  gap: 18px;
  text-align: left;
  cursor: pointer;
}

.club-module-group__head span {
  font-size: 20px;
  font-weight: 700;
}

.club-module-group__head small {
  color: #a3a3a3;
}

.club-module-group__lessons {
  border-top: 1px solid #242424;
  padding: 8px 12px 12px;
}
</style>
