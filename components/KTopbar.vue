<script setup lang="ts">
const { currentUser } = useCurrentUser()
const { levelLabel, levelProgress } = useRevenueGoal()
const bronzeMedal = computed(() => currentUser.value.level.medalIcon)
const avatarUrl = computed(() => currentUser.value.avatarUrl)
const avatarMenuOpen = ref(false)

onMounted(() => {
  document.addEventListener('click', () => {
    avatarMenuOpen.value = false
  })
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') avatarMenuOpen.value = false
  })
})
</script>

<template>
  <div class="flex-shrink-0 flex h-16 shadow md:z-20 w-full bg-green-600">
    <button aria-label="Open sidebar" class="px-4 focus:outline-none md:hidden cursor-pointer">
      <svg stroke="currentColor" fill="none" viewBox="0 0 24 24" class="h-6 w-6 text-white"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h7"></path></svg>
    </button>
    <div class="flex items-center justify-end w-full">
      <div class="flex items-center">
        <div class="level w-56 md:w-64 h-12 p-1 inline-flex flex-col justify-end items-center rounded-md focus:outline-none px-2 cursor-pointer transition duration-200 hover:bg-green-500 bg-green-600">
          <div class="text-white text-sm font-bold leading-none w-full text-right">{{ levelLabel }}</div>
          <div class="flex items-center w-full">
            <img :src="bronzeMedal" class="w-6 mr-2">
            <div class="overflow-hidden h-2 text-xs flex rounded bg-white w-full mt-1">
              <div class="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-green-800" :style="{ width: levelProgress }"></div>
            </div>
          </div>
        </div>
      </div>
      <div class="flex items-center md:mr-6 relative">
        <span class="inline-block rounded-full overflow-hidden bg-gray-100 h-10 w-10 cursor-pointer" :aria-expanded="avatarMenuOpen" @click.stop="avatarMenuOpen = !avatarMenuOpen">
          <img :src="avatarUrl" class="object-cover h-10 w-10">
        </span>
        <div v-if="avatarMenuOpen" class="dropdown z-50" style="display: block; position: absolute; right: 0px; top: 48px;">
          <div class="min-w-scale z-50 rounded-md shadow-lg" style="display: block; min-width: 10rem;">
            <div class="rounded-md bg-white shadow-xs">
              <div class="py-1 cursor-pointer">
                <NuxtLink to="/dashboard" role="menuitem" class="group flex cursor-pointer items-center px-4 py-2 gap-x-3 text-sm leading-5 text-gray-700 hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:bg-gray-100 focus:text-gray-900" @click="avatarMenuOpen = false">Dashboard</NuxtLink>
                <NuxtLink to="/products" role="menuitem" class="group flex cursor-pointer items-center px-4 py-2 gap-x-3 text-sm leading-5 text-gray-700 hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:bg-gray-100 focus:text-gray-900" @click="avatarMenuOpen = false">Produtos</NuxtLink>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
