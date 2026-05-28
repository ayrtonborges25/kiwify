<script setup lang="ts">
definePageMeta({ layout: false })

const route = useRoute()

await navigateTo(`/club=${encodeURIComponent(String(route.params.id || ''))}`, {
  replace: true
})
</script>

<template>
  <div />
</template>
