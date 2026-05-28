<script setup lang="ts">
import type { MemberClubLesson } from '~/data/memberClub'

defineProps<{
  lesson: MemberClubLesson
  active: boolean
  completed: boolean
}>()

defineEmits<{
  select: [lesson: MemberClubLesson]
}>()
</script>

<template>
  <button
    type="button"
    class="lesson-item"
    :class="{ 'lesson-item--active': active, 'lesson-item--complete': completed, 'lesson-item--locked': lesson.status === 'locked' }"
    @click="$emit('select', lesson)"
  >
    <span class="lesson-item__state">{{ completed ? '✓' : lesson.status === 'locked' ? '锁' : '▶' }}</span>
    <span class="lesson-item__body">
      <strong>{{ lesson.title }}</strong>
      <small v-if="lesson.duration">{{ lesson.duration }}</small>
    </span>
  </button>
</template>

<style scoped>
.lesson-item {
  width: 100%;
  border: 0;
  background: transparent;
  color: #d4d4d4;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 8px;
  border-radius: 8px;
  text-align: left;
  cursor: pointer;
}

.lesson-item:hover,
.lesson-item--active {
  background: #171717;
  color: #fff;
}

.lesson-item__state {
  width: 24px;
  color: #8b8b8b;
}

.lesson-item--complete .lesson-item__state {
  color: #22c55e;
}

.lesson-item--locked {
  opacity: .45;
  cursor: default;
}

.lesson-item__body {
  display: flex;
  flex: 1;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.lesson-item strong {
  font-size: 15px;
  font-weight: 600;
}

.lesson-item small {
  color: #8b8b8b;
}
</style>
