<script setup lang="ts">
defineProps<{ open: boolean; title: string }>()
defineEmits<{ close: [] }>()
</script>

<template>
  <div v-if="open" class="modal-backdrop">
    <section class="modal">
      <header class="modal-head">
        <h3>{{ title }}</h3>
        <button class="button ghost" type="button" aria-label="Fechar" @click="$emit('close')">×</button>
      </header>
      <div class="modal-body">
        <slot />
      </div>
      <footer class="modal-foot">
        <slot name="footer" />
      </footer>
    </section>
  </div>
</template>
