<script setup lang="ts">
defineProps<{ icon?: string; label?: string; value?: string; note?: string }>()
</script>

<template>
  <article class="card">
    <span v-if="icon" class="card-icon">{{ icon }}</span>
    <div>
      <p v-if="label" class="card-label">{{ label }}</p>
      <strong v-if="value" class="card-value">{{ value }}</strong>
      <p v-if="note" class="hint">{{ note }}</p>
      <slot />
    </div>
  </article>
</template>
