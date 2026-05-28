<script setup lang="ts">
defineProps<{ title: string }>()
</script>

<template>
  <header class="w-full gap-4 flex flex-col xl:flex-row items-stretch xl:items-center xl:justify-between py-px mb-8">
    <h3 class="font-bold leading-6 text-2xl text-gray-900 flex flex-row gap-4 flex-1 md:flex-grow-0">
      {{ title }}
    </h3>
    <div class="gap-4 flex flex-col lg:flex-row lg:items-center items-stretch justify-center">
      <slot />
    </div>
  </header>
</template>
