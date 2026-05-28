<script setup lang="ts">
defineProps<{ variant?: 'primary' | 'secondary' | 'ghost'; type?: 'button' | 'submit' }>()
</script>

<template>
  <button
    class="inline-flex justify-center items-center text-center font-medium rounded-md border transition ease-in-out duration-150 focus:outline-none leading-5 text-sm px-4 py-2 gap-2 cursor-pointer shadow-sm"
    :class="variant === 'ghost' || variant === 'secondary'
      ? 'text-gray-700 hover:text-gray-500 active:text-gray-800 bg-white active:bg-gray-50 border-gray-300 focus:border-blue-300 focus:shadow-outline-blue'
      : 'text-white bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 border-transparent focus:shadow-outline-indigo'"
    :type="type || 'button'"
  >
    <slot />
  </button>
</template>
