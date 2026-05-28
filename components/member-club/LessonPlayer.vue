<script setup lang="ts">
import type { MemberClubLesson } from '~/data/memberClub'

defineProps<{
  lesson?: MemberClubLesson
  playing: boolean
  progress: number
}>()

const emit = defineEmits<{
  togglePlay: []
  updateProgress: [value: number]
}>()

const handleProgressInput = (event: Event) => {
  emit('updateProgress', Number((event.target as HTMLInputElement).value))
}
</script>

<template>
  <section class="lesson-player">
    <div class="lesson-player__screen">
      <button type="button" class="lesson-player__play" @click="$emit('togglePlay')">
        {{ playing ? '❚❚' : '▶' }}
      </button>
      <span>{{ lesson?.title || 'Aula' }}</span>
    </div>
    <div class="lesson-player__controls">
      <button type="button" @click="$emit('togglePlay')">{{ playing ? 'Pausar' : 'Reproduzir' }}</button>
      <input
        type="range"
        min="0"
        max="100"
        :value="progress"
        @input="handleProgressInput"
      >
      <strong>{{ progress }}%</strong>
    </div>
  </section>
</template>

<style scoped>
.lesson-player {
  max-width: 920px;
  border-radius: 8px;
  overflow: hidden;
  background: #111;
  border: 1px solid #242424;
}

.lesson-player__screen {
  aspect-ratio: 16 / 9;
  background: radial-gradient(circle at center, #202020 0, #080808 62%);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 14px;
  color: #fff;
}

.lesson-player__play {
  width: 74px;
  height: 74px;
  border-radius: 999px;
  border: 1px solid #3f3f46;
  background: rgba(255,255,255,.08);
  color: #fff;
  font-size: 28px;
  cursor: pointer;
}

.lesson-player__controls {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 16px;
  padding: 14px 18px;
}

.lesson-player__controls button {
  border: 1px solid #333;
  border-radius: 6px;
  background: #191919;
  color: #fff;
  padding: 9px 14px;
  cursor: pointer;
}

.lesson-player__controls input {
  width: 100%;
}
</style>
