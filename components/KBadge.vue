<script setup lang="ts">
defineProps<{ tone?: 'success' | 'warning' | 'gray' }>()
</script>

<template>
  <span class="badge" :class="{ warning: tone === 'warning', gray: tone === 'gray' }">
    <slot />
  </span>
</template>
