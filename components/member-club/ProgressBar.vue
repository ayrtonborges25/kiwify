<script setup lang="ts">
defineProps<{
  value: number
}>()
</script>

<template>
  <div class="club-progress" aria-label="Progresso">
    <span :style="{ width: `${Math.max(0, Math.min(100, value))}%` }" />
  </div>
</template>

<style scoped>
.club-progress {
  width: 100%;
  height: 4px;
  overflow: hidden;
  background: #1f1f1f;
}

.club-progress span {
  display: block;
  height: 100%;
  background: #ef4444;
  transition: width .2s ease;
}
</style>
