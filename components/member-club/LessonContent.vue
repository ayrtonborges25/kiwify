<script setup lang="ts">
import type { MemberClubLesson, MemberClubModule } from '~/data/memberClub'

defineProps<{
  lesson?: MemberClubLesson
  module?: MemberClubModule
  completed: boolean
}>()

defineEmits<{
  previous: []
  next: []
  complete: []
}>()
</script>

<template>
  <section class="lesson-content">
    <p class="lesson-content__eyebrow">{{ module?.title || 'Módulo' }}</p>
    <h2>{{ lesson?.title || 'Aula' }}</h2>
    <p>{{ lesson?.description || 'Conteúdo liberado para esta aula.' }}</p>
    <div class="lesson-content__actions">
      <button type="button" @click="$emit('previous')">Anterior</button>
      <button type="button" class="lesson-content__primary" @click="$emit('complete')">
        {{ completed ? 'Concluída' : 'Marcar como concluída' }}
      </button>
      <button type="button" @click="$emit('next')">Próxima</button>
    </div>
  </section>
</template>

<style scoped>
.lesson-content {
  max-width: 920px;
  padding: 24px 0 8px;
  color: #fff;
}

.lesson-content__eyebrow {
  margin: 0 0 6px;
  color: #a3a3a3;
  font-size: 14px;
}

.lesson-content h2 {
  margin: 0 0 10px;
  font-size: 26px;
}

.lesson-content p {
  color: #c9c9c9;
  line-height: 1.6;
}

.lesson-content__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 20px;
}

.lesson-content__actions button {
  border: 1px solid #333;
  border-radius: 6px;
  background: #151515;
  color: #fff;
  padding: 11px 16px;
  cursor: pointer;
}

.lesson-content__actions .lesson-content__primary {
  background: #5846f6;
  border-color: #5846f6;
}
</style>
