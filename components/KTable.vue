<script setup lang="ts">
defineProps<{ columns: string[] }>()
</script>

<template>
  <section class="table-panel">
    <slot name="toolbar" />
    <table>
      <thead>
        <tr>
          <th v-for="column in columns" :key="column">{{ column }}</th>
        </tr>
      </thead>
      <tbody>
        <slot />
      </tbody>
    </table>
  </section>
</template>
