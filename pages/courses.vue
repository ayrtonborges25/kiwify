<script setup lang="ts">
import { signOut } from '~/services/authService'
import { getLastContext, setLastContext } from '~/services/sessionContextService'
import { getMyCourses, type StudentCourse } from '~/services/studentService'
import { normalizeAccountDisplayName } from '~/utils/accountDisplay'
import { getSupabaseClient } from '~/utils/supabase'

definePageMeta({ layout: false })
useHead({ title: 'Meus Cursos' })

const courses = ref<StudentCourse[]>([])
const loading = ref(true)
const search = ref('')
const status = ref('false')
const avatarMenuOpen = ref(false)
const userEmail = ref('')
const userAvatar = ref('')
const workspaceName = ref('')

const filteredCourses = computed(() => {
  const term = search.value.trim().toLowerCase()
  return courses.value.filter((course) => !term || course.productName.toLowerCase().includes(term))
})

const avatarInitial = computed(() => {
  const source = userEmail.value || workspaceName.value || 'U'
  return source.slice(0, 1).toUpperCase()
})

const loadWorkspaceName = async () => {
  const supabase = getSupabaseClient()
  if (!supabase) return

  const { data: userData } = await supabase.auth.getUser()
  const user = userData.user
  userEmail.value = user?.email || ''
  userAvatar.value = ''

  const fallbackName = normalizeAccountDisplayName(String(user?.user_metadata?.name || ''), userEmail.value.split('@')[0] || 'Usuario')
  workspaceName.value = fallbackName

  if (!user?.id) return

  const [{ data: profile }, { data: membership }] = await Promise.all([
    supabase
      .from('profiles')
      .select('name,avatar_url')
      .eq('id', user.id)
      .maybeSingle(),
      supabase
        .from('workspace_members')
        .select('workspaces(name, owner_id)')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle()
  ])

  if (profile?.avatar_url) userAvatar.value = profile.avatar_url
  if (profile?.name) workspaceName.value = normalizeAccountDisplayName(profile.name, fallbackName)

  const workspace = Array.isArray(membership?.workspaces) ? membership?.workspaces[0] : membership?.workspaces
  if (!profile?.name && workspace?.name && workspace.owner_id === user.id) {
    workspaceName.value = normalizeAccountDisplayName(workspace.name, fallbackName)
  }
}

const loadCourses = async () => {
  loading.value = true
  try {
    await loadWorkspaceName()
    courses.value = await getMyCourses()
  } finally {
    loading.value = false
  }
}

const closeAvatarMenu = () => {
  avatarMenuOpen.value = false
}

const switchToProducer = async () => {
  closeAvatarMenu()
  setLastContext('producer')
  await navigateTo('/dashboard')
}

const logout = async () => {
  closeAvatarMenu()
  await signOut()
  await navigateTo('/student/login')
}

const onDocumentClick = () => closeAvatarMenu()
const onDocumentKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') closeAvatarMenu()
}

onMounted(async () => {
  if (!getLastContext()) setLastContext('student')
  document.addEventListener('click', onDocumentClick)
  document.addEventListener('keydown', onDocumentKeydown)
  await loadCourses()
})

onBeforeUnmount(() => {
  document.removeEventListener('click', onDocumentClick)
  document.removeEventListener('keydown', onDocumentKeydown)
})
</script>

<template>
  <div>
    <div data-v-043a343d="" class="flash--wrapper"><span data-v-043a343d=""></span></div>
    <div class="h-screen flex bg-gray-100">
      <div class="flex flex-col w-0 flex-1 overflow-hidden">
        <main tabindex="0" class="flex-1 relative z-0 overflow-y-auto focus:outline-none">
          <div class="flex-shrink-0 flex h-16 shadow bg-green-600 md:z-20 w-full">
            <div class="flex items-center justify-between w-full">
              <div>
                <div class="flex items-center flex-shrink-0 px-4" style="display: none;">
                  <img src="https://assets.kiwicheckout.com/kiwify/kiwify_white_transparent.png" alt="" class="h-6 w-auto">
                </div>
                <div class="py-2 px-2 w-full rounded-md flex items-center text-white leading-5 font-medium">
                  <img src="/img/kiwify-green-logo.3059fc8.svg" alt="" class="h-10 w-auto mr-2">
                  <div class="truncate w-36 text-center">
                    {{ workspaceName }}
                  </div>
                </div>
              </div>
              <div class="ml-4 flex items-center md:pr-6">
                <div class="ml-3 relative">
                  <div>
                    <div class="relative inline-block">
                      <div slot="reference">
                        <span class="rounded-md block shadow-sm relative dropdown-trigger">
                          <button id="options-menu" class="focus:outline-none leading-0 p-2" type="button" @click.stop="avatarMenuOpen = !avatarMenuOpen">
                            <span class="inline-block rounded-full overflow-hidden bg-gray-100 h-10 w-10">
                              <img v-if="userAvatar" :src="userAvatar" class="object-cover h-10 w-10">
                              <span v-else class="object-cover h-10 w-10 flex items-center justify-center text-sm leading-5 font-medium text-gray-700">{{ avatarInitial }}</span>
                            </span>
                          </button>
                        </span>
                      </div>
                      <div class="dropdown z-50" :style="{ display: avatarMenuOpen ? 'block' : 'none', position: 'absolute', right: '0px', top: '56px' }" @click.stop>
                        <div class="min-w-scale z-50 rounded-md shadow-lg" :style="{ display: avatarMenuOpen ? 'block' : 'none', minWidth: '24rem' }">
                          <div class="rounded-md bg-white shadow-xs">
                            <div class="px-4 py-3 border-b border-gray-100">
                              <p class="text-sm leading-5 font-medium text-gray-900 truncate">
                                {{ userEmail }}
                              </p>
                            </div>
                            <div class="py-1 cursor-pointer">
                              <NuxtLink to="/courses" role="menuitem" class="group flex cursor-pointer items-center px-4 py-2 gap-x-3 text-sm leading-5 text-gray-700 hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:bg-gray-100 focus:text-gray-900" @click="closeAvatarMenu">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="24px" height="24px" class="h-5 w-5 text-gray-400 group-hover:text-gray-500 group-focus:text-gray-500" style="min-width: 20px; min-height: 20px;"><path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z"></path></svg>
                                <div class="flex items-center justify-between w-full"><span>Meus cursos</span></div>
                              </NuxtLink>
                              <div role="menuitem" class="group flex cursor-pointer items-center px-4 py-2 gap-x-3 text-sm leading-5 text-gray-700 hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:bg-gray-100 focus:text-gray-900" @click="switchToProducer">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="24px" height="24px" class="h-5 w-5 text-gray-400 group-hover:text-gray-500 group-focus:text-gray-500" style="min-width: 20px; min-height: 20px;"><path d="M8 5a1 1 0 100 2h5.586l-1.293 1.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L13.586 5H8zM12 15a1 1 0 100-2H6.414l1.293-1.293a1 1 0 10-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L6.414 15H12z"></path></svg>
                                <div class="flex items-center justify-between w-full"><span>Mudar para painel do produtor</span></div>
                              </div>
                              <NuxtLink to="/myprofile" role="menuitem" class="group flex cursor-pointer items-center px-4 py-2 gap-x-3 text-sm leading-5 text-gray-700 hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:bg-gray-100 focus:text-gray-900" @click="closeAvatarMenu">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="24px" height="24px" class="h-5 w-5 text-gray-400 group-hover:text-gray-500 group-focus:text-gray-500" style="min-width: 20px; min-height: 20px;"><path fill-rule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clip-rule="evenodd"></path></svg>
                                <div class="flex items-center justify-between w-full"><span>Meu perfil</span></div>
                              </NuxtLink>
                              <div role="menuitem" class="group flex cursor-pointer items-center px-4 py-2 gap-x-3 text-sm leading-5 text-gray-700 hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:bg-gray-100 focus:text-gray-900" @click="logout">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="24px" height="24px" class="h-5 w-5 text-gray-400 group-hover:text-gray-500 group-focus:text-gray-500" style="min-width: 20px; min-height: 20px;"><path fill-rule="evenodd" d="M3 3a1 1 0 00-1 1v12a1 1 0 102 0V4a1 1 0 00-1-1zm10.293 9.293a1 1 0 001.414 1.414l3-3a1 1 0 000-1.414l-3-3a1 1 0 10-1.414 1.414L14.586 9H7a1 1 0 100 2h7.586l-1.293 1.293z" clip-rule="evenodd"></path></svg>
                                <div class="flex items-center justify-between w-full"><span>Sair</span></div>
                              </div>
                            </div>
                            <div class="border-t border-gray-100"></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <div class="container mx-auto px-4 sm:px-8 py-8 lg:py-10 lg:px-20">
              <div>
                <h3 class="text-2xl leading-6 font-bold text-gray-900">Meus Cursos</h3>
                <div class="mt-4 flex-wrap flex items-center">
                  <div class="w-full sm:w-64">
                    <div class="relative rounded-md shadow-sm">
                      <input v-model="search" placeholder="Buscar...." class="form-input block w-full pr-10 p-2 sm:text-sm sm:leading-5">
                      <div class="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="24px" height="24px" class="search h-5 w-5 text-indigo-500"><path fill-rule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clip-rule="evenodd"></path></svg>
                      </div>
                    </div>
                  </div>
                  <div class="w-full sm:w-auto md:ml-4 mt-4 md:-mt-1">
                    <div>
                      <select v-model="status" class="form-select shadow-sm block w-full pl-3 pr-10 py-2 text-base leading-6 border-gray-300 focus:outline-none focus:shadow-outline-blue focus:border-blue-300 sm:text-sm sm:leading-5 transition ease-in-out duration-150">
                        <option value="">Todos</option>
                        <option value="true">Arquivados</option>
                        <option value="false">Ativos</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div class="mt-8">
                <div v-if="loading" class="text-sm leading-5 text-gray-700">Carregando cursos...</div>
                <div v-else-if="!filteredCourses.length" class="text-sm leading-5 text-gray-700">
                  Você ainda não possui acesso a nenhum produto.
                </div>
                <ul v-else class="mt-3 grid grid-cols-1 gap-5 sm:gap-8 sm:grid-cols-2 lg:grid-cols-3">
                  <li v-for="course in filteredCourses" :key="course.deliveryId" class="col-span-1 bg-white shadow-md rounded-md">
                    <NuxtLink :to="course.accessUrl" class="block h-full transition duration-300">
                      <div class="w-full img-cover-pattern relative overflow-hidden" style="padding-bottom: 250px;">
                        <img v-if="course.coverUrl" :src="course.coverUrl" alt="" class="h-full object-cover absolute w-full">
                        <div class="flex transition h-full absolute w-full bg-black bg-opacity-25 flex-col items-center justify-center" style="display: none;">
                          <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAQAAAAAYLlVAAAABGdBTUEAALGPC/xhBQAAACBjSFJNAAB6JgAAgIQAAPoAAACA6AAAdTAAAOpgAAA6mAAAF3CculE8AAAAAmJLR0QAAKqNIzIAAAAJcEhZcwAADsQAAA7EAZUrDhsAAAAHdElNRQfkChYRLiRUI8dsAAACPElEQVRo3s2ZO2hUURCG/7NETEBLo4haiFgFxc5HIz5aO4OFpvFRqM2CQbFa0OgqUSsL7VyJwlaBlGoWFEUiuBi2iREkauMiCpKIbvR+Fsua12af95zxr+5jDv/HzHDhzkj/RIKTvOAr33nOFTYprOhihPkqkQkKwXWW6gdpVoexX88s1fWJozj/AGeppVfs8Q3wkNqKuM8GnwA56muGNKt8AYw3AAAwxREvHUGhQQCAMXbbAkBENuZvRJMA5Y5I0WUJAPCRvpg6okUAgJfstAWAiAzrLAEApknRaQkA8IE+WwCAHNubc060WbvF2qvXZFhrByAldEzvSLGyqVOxlWBOkxy2yUBFW5TlCdvsACRpn/Jk6LYDKHfEBOfrdoSHHlioieU6wncGKtqqLI/osQOQpAPKc4c1dgBSh06pwCE7AEnq1jADlgCS00X6LQEkaYDNtgArdMYWQNphDYA1QN4WYFa3bQEuuPfliw4Dc3TZ3azchAco6oQbmbsNW4Lfuque+fZhM/BYSVdY/DBUBt6q1x1cah8mA990TbdcqfpL3wCRhnTOFZcP8AswqqQbrx3irwcm1ev217P3lYFp3wx2fpDgS_00ECgWxS8ZJQsbjQJM2vc_RvKS1LS6czBoi0ncxHMmTTA" alt="" class="w-16 h-16">
                        </div>
                      </div>
                      <div class="flex items-center border-gray-200 pt-3 px-4" style="height: 76px;">
                        <p class="font-bold text-center text-2xl line-clamp w-full">
                          {{ course.productName }}
                        </p>
                      </div>
                      <div class="w-full bottom-0 px-4 py-2">
                        <div class="text-sm text-white bg-indigo-500 p-2 mt-2 text-center shadow rounded justify-center flex items-center">
                          Acessar
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="24px" height="24px" class="inline-block ml-3"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd"></path></svg>
                        </div>
                      </div>
                    </NuxtLink>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  </div>
</template>
