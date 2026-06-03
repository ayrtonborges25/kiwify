<script setup lang="ts">
import { signOut } from '~/services/authService'
import { setLastContext } from '~/services/sessionContextService'
import { normalizeAccountDisplayName } from '~/utils/accountDisplay'
import { getSupabaseClient, uploadFile } from '~/utils/supabase'

definePageMeta({ layout: false })
useHead({ title: 'Meu perfil' })

type ProfileSettings = {
  whatsapp?: string
  language?: string
  address?: {
    zip?: string
    street?: string
    number?: string
    complement?: string
    district?: string
    city?: string
    state?: string
  }
}

const loading = ref(true)
const saving = ref(false)
const uploadingAvatar = ref(false)
const passwordLoading = ref(false)
const avatarMenuOpen = ref(false)
const passwordModalOpen = ref(false)
const emailModalOpen = ref(false)
const statusMessage = ref('')
const errorMessage = ref('')
const userId = ref('')
const workspaceId = ref('')
const email = ref('')
const name = ref('')
const avatarUrl = ref('')
const workspaceName = ref('')
const whatsapp = ref('')
const language = ref('PT')
const zip = ref('')
const street = ref('')
const number = ref('')
const complement = ref('')
const district = ref('')
const city = ref('')
const state = ref('')
const profileSettings = ref<ProfileSettings>({})
const avatarInput = ref<HTMLInputElement | null>(null)

const states = [
  'AC',
  'AL',
  'AP',
  'AM',
  'BA',
  'CE',
  'DF',
  'ES',
  'GO',
  'MA',
  'MT',
  'MS',
  'MG',
  'PA',
  'PB',
  'PR',
  'PE',
  'PI',
  'RJ',
  'RN',
  'RS',
  'RO',
  'RR',
  'SC',
  'SP',
  'SE',
  'TO'
]

const avatarInitial = computed(() => {
  const source = name.value || workspaceName.value || email.value || 'U'
  return source.slice(0, 1).toUpperCase()
})

const profilePayload = () => ({
  name: name.value.trim(),
  avatar_url: avatarUrl.value || null,
  settings: {
    ...(profileSettings.value || {}),
    whatsapp: whatsapp.value,
    language: language.value,
    address: {
      zip: zip.value,
      street: street.value,
      number: number.value,
      complement: complement.value,
      district: district.value,
      city: city.value,
      state: state.value
    }
  }
})

const readFileAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(String(reader.result || ''))
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })

const closeAvatarMenu = () => {
  avatarMenuOpen.value = false
}

const loadProfile = async () => {
  loading.value = true
  errorMessage.value = ''

  try {
    const supabase = getSupabaseClient()
    if (!supabase) {
      errorMessage.value = 'Supabase nao configurado.'
      return
    }

    const { data: userData } = await supabase.auth.getUser()
    const user = userData.user
    if (!user) {
      await navigateTo('/login')
      return
    }

    userId.value = user.id
    email.value = user.email || ''
    const fallbackName = email.value.split('@')[0] || 'Usuario'
    name.value = normalizeAccountDisplayName(String(user.user_metadata?.name || ''), fallbackName)
    avatarUrl.value = ''
    workspaceName.value = normalizeAccountDisplayName(name.value, fallbackName)

    const [{ data: profile }, { data: membership }] = await Promise.all([
      supabase
        .from('profiles')
        .select('id,email,name,avatar_url,settings')
        .eq('id', user.id)
        .maybeSingle(),
      supabase
        .from('workspace_members')
        .select('workspace_id, workspaces(name, owner_id)')
        .eq('user_id', user.id)
        .limit(1)
        .maybeSingle()
    ])

    const workspace = Array.isArray(membership?.workspaces) ? membership?.workspaces[0] : membership?.workspaces

    if (profile) {
      const settings = (profile.settings || {}) as ProfileSettings
      profileSettings.value = settings
      email.value = profile.email || email.value
      name.value = normalizeAccountDisplayName(profile.name || name.value, fallbackName)
      avatarUrl.value = profile.avatar_url || avatarUrl.value
      whatsapp.value = settings.whatsapp || ''
      language.value = settings.language || 'PT'
      zip.value = settings.address?.zip || ''
      street.value = settings.address?.street || ''
      number.value = settings.address?.number || ''
      complement.value = settings.address?.complement || ''
      district.value = settings.address?.district || ''
      city.value = settings.address?.city || ''
      state.value = settings.address?.state || ''
    }

    if (membership?.workspace_id) workspaceId.value = membership.workspace_id
    if (workspace?.name && workspace.owner_id === user.id) {
      workspaceName.value = normalizeAccountDisplayName(workspace.name, name.value || fallbackName)
    } else {
      workspaceName.value = normalizeAccountDisplayName(name.value || fallbackName, fallbackName)
    }
  } catch (error: any) {
    errorMessage.value = error?.message || 'Nao foi possivel carregar o perfil.'
  } finally {
    loading.value = false
  }
}

const saveProfile = async (silent = false) => {
  if (!userId.value) return
  saving.value = true
  errorMessage.value = ''
  if (!silent) statusMessage.value = ''

  try {
    const supabase = getSupabaseClient()
    if (!supabase) throw new Error('Supabase nao configurado.')

    const payload = profilePayload()
    const fallbackName = email.value.split('@')[0] || 'Usuario'
    const nextName = normalizeAccountDisplayName(payload.name || workspaceName.value || fallbackName, fallbackName)
    const { error } = await supabase
      .from('profiles')
      .update({ ...payload, name: nextName })
      .eq('id', userId.value)

    if (error) {
      const fallback = await supabase
        .from('profiles')
        .upsert({
          id: userId.value,
          email: email.value,
          name: nextName,
          avatar_url: payload.avatar_url,
          role: 'student'
        }, { onConflict: 'id' })

      if (fallback.error) throw fallback.error
    }

    await supabase.auth.updateUser({
      data: {
        name: nextName,
        avatar_url: payload.avatar_url
      }
    })

    if (workspaceId.value && nextName) {
      await supabase
        .from('workspaces')
        .update({ name: nextName })
        .eq('id', workspaceId.value)
        .eq('owner_id', userId.value)
    }

    name.value = nextName
    workspaceName.value = nextName

    if (!silent) statusMessage.value = 'Alteracoes salvas com sucesso.'
  } catch (error: any) {
    errorMessage.value = error?.message || 'Nao foi possivel salvar o perfil.'
  } finally {
    saving.value = false
  }
}

const triggerAvatarUpload = () => {
  avatarInput.value?.click()
}

const onAvatarSelected = async (event: Event) => {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file || !userId.value) return

  uploadingAvatar.value = true
  errorMessage.value = ''
  statusMessage.value = ''

  try {
    const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    const uploaded = await uploadFile('product-images', `profiles/${userId.value}/avatar-${Date.now()}.${extension}`, file)
    avatarUrl.value = uploaded.data?.publicUrl || await readFileAsDataUrl(file)
    await saveProfile(true)
    statusMessage.value = 'Foto atualizada com sucesso.'
  } catch (error: any) {
    errorMessage.value = error?.message || 'Nao foi possivel atualizar a foto.'
  } finally {
    uploadingAvatar.value = false
    input.value = ''
  }
}

const requestPasswordChange = async () => {
  passwordLoading.value = true
  errorMessage.value = ''
  statusMessage.value = ''

  try {
    await $fetch('/api/auth/password-reset/request', {
      method: 'POST',
      body: { email: email.value }
    })
    passwordModalOpen.value = false
    statusMessage.value = 'Se o e-mail existir, um codigo sera enviado.'
  } catch (error: any) {
    errorMessage.value = error?.data?.message || error?.message || 'Nao foi possivel solicitar a alteracao de senha.'
  } finally {
    passwordLoading.value = false
  }
}

const switchToCourses = async () => {
  closeAvatarMenu()
  setLastContext('student')
  await navigateTo('/courses')
}

const switchToProducer = async () => {
  closeAvatarMenu()
  setLastContext('producer')
  await navigateTo('/dashboard')
}

const logout = async () => {
  closeAvatarMenu()
  await signOut()
  await navigateTo('/login')
}

const onDocumentClick = () => closeAvatarMenu()
const onDocumentKeydown = (event: KeyboardEvent) => {
  if (event.key === 'Escape') {
    closeAvatarMenu()
    passwordModalOpen.value = false
    emailModalOpen.value = false
  }
}

onMounted(async () => {
  document.addEventListener('click', onDocumentClick)
  document.addEventListener('keydown', onDocumentKeydown)
  await loadProfile()
})

onBeforeUnmount(() => {
  document.removeEventListener('click', onDocumentClick)
  document.removeEventListener('keydown', onDocumentKeydown)
})
</script>

<template>
  <div>
    <div data-v-043a343d="" class="flash--wrapper"><span data-v-043a343d=""></span></div>

    <div v-if="passwordModalOpen" data-v-7905396a="" class="fixed bottom-0 inset-x-0 sm:inset-0 sm:flex sm:items-center sm:justify-center px-4 py-4" style="z-index: 5000;">
      <div data-v-7905396a="" class="fixed inset-0 transition-opacity" @click="passwordModalOpen = false"><div data-v-7905396a="" class="absolute inset-0 bg-gray-500 opacity-75"></div></div>
      <div data-v-7905396a="" role="dialog" aria-modal="true" aria-labelledby="modal-headline" class="sm:max-w-lg max-h-[95vh] rounded-lg shadow-xl overflow-x-hidden overflow-y-auto transform transition-all sm:w-full">
        <div data-v-7905396a="" class="bg-white px-4 pt-5 pb-4 sm:p-6">
          <div data-v-7905396a="">
            <div data-v-7905396a="" class="mt-3 sm:mt-0 sm:ml-4 sm:text-left">
              <header data-v-7905396a="" class="flex justify-between">
                <h3 data-v-7905396a="" id="modal-headline" class="text-lg leading-6 font-medium text-gray-900">Alterar senha</h3>
              </header>
              <div data-v-7905396a="" class="mt-2">
                <p data-v-7905396a="" class="text-sm leading-5 text-gray-500">Nós vamos te enviar um e-mail com instruções para alterar a senha</p>
              </div>
              <div data-v-7905396a="" class="mt-2"></div>
            </div>
          </div>
        </div>
        <div data-v-7905396a="" class="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse">
          <span data-v-7905396a="" class="flex w-full rounded-md shadow-sm sm:ml-3 sm:w-auto">
            <button data-v-7905396a="" type="button" class="cursor-pointer inline-flex justify-center w-full rounded-md border border-transparent px-4 py-2 text-base leading-6 font-medium text-white shadow-sm focus:outline-none focus:border-red-700 transition ease-in-out duration-150 sm:text-sm sm:leading-5 bg-indigo-600 hover:bg-indigo-500 focus:shadow-outline-indigo" @click="requestPasswordChange">
              {{ passwordLoading ? 'Enviando...' : 'Alterar senha' }}
            </button>
          </span>
          <span data-v-7905396a="" class="mt-3 flex w-full rounded-md shadow-sm sm:mt-0 sm:w-auto">
            <button data-v-7905396a="" type="button" class="cursor-pointer inline-flex justify-center w-full rounded-md border border-gray-300 px-4 py-2 bg-white text-base leading-6 font-medium text-gray-700 shadow-sm hover:text-gray-500 focus:outline-none focus:border-blue-300 focus:shadow-outline-blue transition ease-in-out duration-150 sm:text-sm sm:leading-5" @click="passwordModalOpen = false">Cancelar</button>
          </span>
        </div>
      </div>
    </div>

    <div v-if="emailModalOpen" class="fixed md:h-auto bottom-0 z-50 inset-x-0 inset-0 flex items-center justify-center z-500">
      <div class="fixed inset-0 transition-opacity cursor-pointer" @click="emailModalOpen = false"><div class="absolute inset-0 bg-gray-500 opacity-75"></div></div>
      <div role="dialog" aria-modal="true" aria-labelledby="modal-headline-email" class="bg-white overflow-x-auto md:rounded-lg sm:h-auto md:shadow-xl transform transition-all sm:max-w-sm w-full">
        <div class="px-4 py-3 bg-gray-50 flex justify-between">
          <h3 id="modal-headline-email" class="text-lg leading-6 font-medium text-gray-900">Alterar email</h3>
          <button type="button" aria-label="Close" class="text-gray-400 cursor-pointer hover:text-gray-500 focus:outline-none focus:text-gray-500 transition ease-in-out duration-150" @click="emailModalOpen = false">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" class="h-6 w-6"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
        <div class="px-4 py-5 sm:p-6 rounded-lg">
          <p class="text-sm leading-5 text-gray-500">Para alterar o e-mail de acesso, use o fluxo de confirmação de e-mail da autenticação.</p>
        </div>
        <div class="bg-gray-50 px-4 py-3 sm:px-6 flex flex-row-reverse">
          <button type="button" class="inline-flex justify-center items-center text-center font-medium rounded-md border transition ease-in-out duration-150 focus:outline-none text-white bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 border-transparent focus:border-indigo-700 focus:shadow-outline-indigo leading-5 text-sm px-4 py-2 gap-2 cursor-pointer shadow-sm" @click="emailModalOpen = false">Ok</button>
        </div>
      </div>
    </div>

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
                              <img v-if="avatarUrl" :src="avatarUrl" class="object-cover h-10 w-10">
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
                                {{ email }}
                              </p>
                            </div>
                            <div class="py-1 cursor-pointer">
                              <div role="menuitem" class="group flex cursor-pointer items-center px-4 py-2 gap-x-3 text-sm leading-5 text-gray-700 hover:bg-gray-100 hover:text-gray-900 focus:outline-none focus:bg-gray-100 focus:text-gray-900" @click="switchToCourses">
                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="24px" height="24px" class="h-5 w-5 text-gray-400 group-hover:text-gray-500 group-focus:text-gray-500" style="min-width: 20px; min-height: 20px;"><path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z"></path></svg>
                                <div class="flex items-center justify-between w-full"><span>Meus cursos</span></div>
                              </div>
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
              <div data-v-7905396a="">
                <div v-if="statusMessage" class="mb-4 max-w-3xl rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm leading-5 text-green-700">{{ statusMessage }}</div>
                <div v-if="errorMessage" class="mb-4 max-w-3xl rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm leading-5 text-red-700">{{ errorMessage }}</div>

                <div class="md:grid md:grid-cols-3 md:gap-6">
                  <div class="md:col-span-1">
                    <h3 class="text-lg font-medium leading-6 text-gray-900">Meu perfil</h3>
                    <p class="mt-1 desc text-sm leading-5 text-gray-500">Informações sobre a sua conta</p>
                  </div>
                  <div class="mt-5 md:mt-0 md:col-span-2">
                    <div class="relative">
                      <div class="px-4 py-5 bg-white sm:p-6 rounded-lg">
                        <div v-if="loading" class="text-sm leading-5 text-gray-700">Carregando perfil...</div>
                        <template v-else>
                          <div class="flex items-center flex-wrap">
                            <div class="w-full">
                              <label class="block text-sm font-medium leading-5 text-gray-700 mb-1">Foto</label>
                              <div class="mt-2 flex items-center">
                                <span class="inline-block rounded-full overflow-hidden bg-gray-100 h-10 w-10">
                                  <img v-if="avatarUrl" :src="avatarUrl" class="object-cover h-10 w-10">
                                  <span v-else class="object-cover h-10 w-10 flex items-center justify-center text-sm leading-5 font-medium text-gray-700">{{ avatarInitial }}</span>
                                </span>
                                <span class="ml-5 rounded-md shadow-sm">
                                  <button type="button" class="py-2 px-3 border border-gray-300 rounded-md text-sm leading-4 font-medium text-gray-700 hover:text-gray-500 focus:outline-none focus:border-blue-300 focus:shadow-outline-blue active:bg-gray-50 active:text-gray-800 transition duration-150 ease-in-out" @click="triggerAvatarUpload">
                                    {{ uploadingAvatar ? 'Alterando...' : 'Alterar' }}
                                  </button>
                                </span>
                                <input ref="avatarInput" type="file" accept="image/png,image/jpeg,image/webp" class="hidden" @change="onAvatarSelected">
                              </div>
                            </div>
                          </div>

                          <div class="w-auto max-w-xs mt-8">
                            <label class="block text-sm font-medium leading-5 text-gray-700 mb-1">Nome</label>
                            <div>
                              <input v-model="name" type="text" autocomplete="off" data-lpignore="true" class="form-input block py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:shadow-outline-blue focus:border-blue-300 transition duration-150 ease-in-out sm:text-sm sm:leading-5 mask-user-input w-full">
                            </div>
                          </div>

                          <div class="w-auto max-w-xs mt-8">
                            <label class="block text-sm font-medium leading-5 text-gray-700 mb-1">Email</label>
                            <div class="text-sm">
                              {{ email }}
                              <button type="button" class="focus:outline-none text-indigo-600 hover:underline cursor-pointer font-medium" @click="emailModalOpen = true">(Alterar email)</button>
                            </div>
                          </div>

                          <div class="w-auto max-w-xs mt-8">
                            <label class="block text-sm font-medium leading-5 text-gray-700 mb-1">Whatsapp</label>
                            <div>
                              <input v-model="whatsapp" type="tel" class="form-input block py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:shadow-outline-blue focus:border-blue-300 transition duration-150 ease-in-out sm:text-sm sm:leading-5 w-full">
                            </div>
                          </div>

                          <div class="mt-8">
                            <label class="block text-sm font-medium leading-5 text-gray-700 mb-1">Senha</label>
                            <span class="inline-flex rounded-md shadow-sm">
                              <button type="button" class="cursor-pointer py-2 px-3 border border-gray-300 rounded-md text-sm leading-4 font-medium text-gray-700 hover:text-gray-500 focus:outline-none focus:border-blue-300 focus:shadow-outline-blue active:bg-gray-50 active:text-gray-800 transition duration-150 ease-in-out" @click="passwordModalOpen = true">
                                Alterar senha
                              </button>
                            </span>
                          </div>

                          <div class="mt-8 w-36">
                            <label class="block text-sm font-medium leading-5 text-gray-700 mb-1">Idioma</label>
                            <span>
                              <div>
                                <div>
                                  <select v-model="language" class="form-select shadow-sm block w-full pl-3 pr-10 py-2 text-base leading-6 border-gray-300 focus:outline-none focus:shadow-outline-blue focus:border-blue-300 sm:text-sm sm:leading-5 transition ease-in-out duration-150">
                                    <option value="PT">Português</option>
                                    <option value="EN">English</option>
                                    <option value="ES">Espanhol</option>
                                  </select>
                                </div>
                              </div>
                            </span>
                          </div>
                        </template>
                      </div>
                      <div class="px-4 py-3 bg-gray-50 text-right sm:px-6">
                        <span class="cursor-pointer inline-flex items-center px-4 py-2 border border-transparent text-sm leading-5 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-500 focus:outline-none focus:border-indigo-700 focus:shadow-outline-indigo active:bg-indigo-700 transition ease-in-out duration-150" @click="saveProfile(false)">
                          {{ saving ? 'Salvando...' : 'Salvar alterações' }}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="mt-10">
                  <div class="md:grid md:grid-cols-3 md:gap-6">
                    <div class="md:col-span-1">
                      <h3 class="text-lg font-medium leading-6 text-gray-900">Endereço</h3>
                      <p class="mt-1 desc text-sm leading-5 text-gray-500">Para entrega das suas premiações</p>
                    </div>
                    <div class="mt-5 md:mt-0 md:col-span-2">
                      <div class="relative">
                        <div class="px-4 py-5 bg-white sm:p-6 rounded-lg">
                          <div>
                            <div class="w-48">
                              <label class="block text-sm font-medium leading-5 text-gray-700 mb-1">CEP</label>
                              <div><input v-model="zip" type="text" class="form-input block py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:shadow-outline-blue focus:border-blue-300 transition duration-150 ease-in-out sm:text-sm sm:leading-5 w-full"></div>
                            </div>
                            <div class="mt-4">
                              <div class="max-w-xs">
                                <label class="block text-sm font-medium leading-5 text-gray-700 mb-1">Endereço</label>
                                <div><input v-model="street" type="text" autocomplete="off" data-lpignore="true" class="form-input block py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:shadow-outline-blue focus:border-blue-300 transition duration-150 ease-in-out sm:text-sm sm:leading-5 mask-user-input w-full"></div>
                              </div>
                              <div class="w-24 mt-2">
                                <label class="block text-sm font-medium leading-5 text-gray-700 mb-1">Numero*</label>
                                <div><input v-model="number" type="Number" autocomplete="off" data-lpignore="true" class="form-input block py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:shadow-outline-blue focus:border-blue-300 transition duration-150 ease-in-out sm:text-sm sm:leading-5 mask-user-input w-full"></div>
                              </div>
                              <div class="max-w-xs mt-2">
                                <label class="block text-sm font-medium leading-5 text-gray-700 mb-1">Complemento</label>
                                <div><input v-model="complement" type="text" autocomplete="off" data-lpignore="true" class="form-input block py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:shadow-outline-blue focus:border-blue-300 transition duration-150 ease-in-out sm:text-sm sm:leading-5 mask-user-input w-full"></div>
                              </div>
                              <div class="max-w-xs mt-2">
                                <label class="block text-sm font-medium leading-5 text-gray-700 mb-1">Bairro</label>
                                <div><input v-model="district" type="text" autocomplete="off" data-lpignore="true" class="form-input block py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:shadow-outline-blue focus:border-blue-300 transition duration-150 ease-in-out sm:text-sm sm:leading-5 mask-user-input w-full"></div>
                              </div>
                              <div class="max-w-xs mt-2">
                                <label class="block text-sm font-medium leading-5 text-gray-700 mb-1">Cidade</label>
                                <div><input v-model="city" type="text" autocomplete="off" data-lpignore="true" class="form-input block py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:shadow-outline-blue focus:border-blue-300 transition duration-150 ease-in-out sm:text-sm sm:leading-5 mask-user-input w-full"></div>
                              </div>
                              <div class="w-48 mt-2">
                                <label class="block text-sm font-medium leading-5 text-gray-700 mb-1">Estado</label>
                                <select v-model="state" class="mt-1 form-select block w-full pl-3 pr-10 py-2 text-base leading-6 border-gray-300 focus:outline-none focus:shadow-outline-blue focus:border-blue-300 sm:text-sm sm:leading-5 transition ease-in-out duration-150">
                                  <option v-for="uf in states" :key="uf" :value="uf">{{ uf }}</option>
                                </select>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                      <div class="px-4 py-3 bg-gray-50 text-right sm:px-6">
                        <button type="button" class="cursor-pointer inline-flex items-center px-4 py-2 border border-transparent text-sm leading-5 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-500 focus:outline-none focus:border-indigo-700 focus:shadow-outline-indigo active:bg-indigo-700 transition ease-in-out duration-150" @click="saveProfile(false)">
                          {{ saving ? 'Salvando...' : 'Salvar alterações' }}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div class="mt-10">
                  <div class="md:grid md:grid-cols-3 md:gap-6">
                    <div class="md:col-span-1">
                      <h3 class="text-lg font-medium leading-6 text-gray-900">Encerrar conta</h3>
                      <p class="mt-1 desc text-sm leading-5 text-gray-500">Não recomendamos encerrar a sua conta pois não há nenhum custo para manter o cadastro ativo na Kiwify.<br>
                        Aprenda mais sobre o <a target="_blank" href="https://ajuda.kiwify.com.br/pt-br/article/como-encerrar-minha-conta-1wps9ek/#3-como-encerrar-a-conta">encerramento de conta</a>.</p>
                    </div>
                    <div class="mt-5 md:mt-0 md:col-span-2">
                      <div class="relative">
                        <div class="px-4 py-5 bg-white sm:p-6 rounded-lg">
                          <div class="flex items-center flex-wrap">
                            <div class="w-full">
                              <button type="button" class="mr-2 inline-flex justify-center items-center text-center font-medium rounded-md border transition ease-in-out duration-150 focus:outline-none text-white bg-red-600 hover:bg-red-500 active:bg-red-700 border-transparent focus:border-red-700 focus:shadow-outline-red leading-5 text-sm px-4 py-2 gap-2 cursor-pointer shadow-sm">Encerrar conta</button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  </div>
</template>
