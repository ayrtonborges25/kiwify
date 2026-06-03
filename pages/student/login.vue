<script setup lang="ts">
definePageMeta({ layout: false })

const route = useRoute()

await navigateTo({
  path: '/login',
  query: {
    ...route.query,
    target: 'student'
  }
}, { replace: true })
</script>

<template>
  <main class="min-h-screen bg-gray-50"></main>
</template>
