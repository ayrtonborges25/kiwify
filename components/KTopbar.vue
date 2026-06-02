<script setup lang="ts">
import { signOut } from '~/services/authService'
import { setLastContext } from '~/services/sessionContextService'

const { currentUser } = useCurrentUser()
const { levelLabel, levelProgress } = useRevenueGoal()
const bronzeMedal = computed(() => currentUser.value.level.medalIcon)
const avatarUrl = computed(() => currentUser.value.avatarUrl)
const avatarInitial = computed(() => (currentUser.value.company || currentUser.value.name || 'U').slice(0, 1).toUpperCase())
const avatarMenuOpen = ref(false)

onMounted(() => {
  document.addEventListener('click', () => {
    avatarMenuOpen.value = false
  })
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') avatarMenuOpen.value = false
  })
})

const switchToCourses = async () => {
  avatarMenuOpen.value = false
  setLastContext('student')
  await navigateTo('/courses')
}

const logout = async () => {
  avatarMenuOpen.value = false
  await signOut()
  await navigateTo('/login')
}
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
        <button type="button" class="inline-block rounded-full overflow-hidden bg-gray-100 h-10 w-10 cursor-pointer focus:outline-none" :aria-expanded="avatarMenuOpen" @click.stop="avatarMenuOpen = !avatarMenuOpen">
          <img v-if="avatarUrl" :src="avatarUrl" class="object-cover h-10 w-10">
          <span v-else class="object-cover h-10 w-10 flex items-center justify-center text-sm leading-5 font-medium text-gray-700">{{ avatarInitial }}</span>
        </button>
        <div v-if="avatarMenuOpen" class="dropdown z-50" style="display: block; position: absolute; right: 0px; top: 48px;">
          <div class="min-w-scale z-50 rounded-md shadow-lg" style="display: block; min-width: 10rem;">
            <div class="rounded-md bg-white shadow-xs">
              <div class="py-1 cursor-pointer">
                <button type="button" role="menuitem" class="group flex cursor-pointer items-center px-4 py-2 gap-x-3 text-sm leading-5 text-gray-700 hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:bg-gray-100 focus:text-gray-900 w-full text-left" @click="switchToCourses">Mudar para meus cursos</button>
                <NuxtLink to="/myprofile" role="menuitem" class="group flex cursor-pointer items-center px-4 py-2 gap-x-3 text-sm leading-5 text-gray-700 hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:bg-gray-100 focus:text-gray-900" @click="avatarMenuOpen = false">Meu perfil</NuxtLink>
                <button type="button" role="menuitem" class="group flex cursor-pointer items-center px-4 py-2 gap-x-3 text-sm leading-5 text-gray-700 hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:bg-gray-100 focus:text-gray-900 w-full text-left" @click="logout">Sair</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
