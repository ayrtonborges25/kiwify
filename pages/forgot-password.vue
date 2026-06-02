<script setup lang="ts">
definePageMeta({ layout: false })
useHead({ title: 'Esqueci minha senha' })

const route = useRoute()
const email = ref(String(route.query.email || ''))
const code = ref('')
const password = ref('')
const confirmPassword = ref('')
const loading = ref(false)
const codeSent = ref(false)
const codeVerified = ref(false)
const showPassword = ref(false)
const showConfirmPassword = ref(false)
const successMessage = ref('')
const errorMessage = ref('')

const target = computed(() => String(route.query.target || 'admin'))
const redirect = computed(() => String(route.query.redirect || (target.value === 'student' ? '/courses' : '/dashboard')))
const loginPath = computed(() => {
  const path = target.value === 'student' ? '/student/login' : '/login'
  return `${path}?redirect=${encodeURIComponent(redirect.value)}`
})

const requestCode = async () => {
  if (loading.value) return
  loading.value = true
  errorMessage.value = ''
  successMessage.value = ''
  try {
    const response = await $fetch<{ message?: string }>('/api/auth/password-reset/request', {
      method: 'POST',
      body: { email: email.value }
    })
    codeSent.value = true
    codeVerified.value = false
    successMessage.value = response.message || 'Se o e-mail existir, um codigo sera enviado.'
  } catch (error: any) {
    errorMessage.value = error?.data?.message || error?.message || 'Nao foi possivel enviar o codigo.'
  } finally {
    loading.value = false
  }
}

const verifyCode = async () => {
  if (loading.value) return
  loading.value = true
  errorMessage.value = ''
  successMessage.value = ''
  try {
    await $fetch<{ message?: string }>('/api/auth/password-reset/verify', {
      method: 'POST',
      body: {
        email: email.value,
        code: code.value
      }
    })
    codeVerified.value = true
    successMessage.value = 'Codigo validado. Crie sua nova senha.'
  } catch (error: any) {
    errorMessage.value = error?.data?.message || error?.message || 'Codigo invalido ou expirado.'
  } finally {
    loading.value = false
  }
}

const confirmReset = async () => {
  if (loading.value) return
  if (!codeVerified.value) {
    errorMessage.value = 'Valide o codigo antes de alterar a senha.'
    return
  }
  if (password.value !== confirmPassword.value) {
    errorMessage.value = 'A confirmacao de senha precisa ser igual a senha.'
    return
  }

  loading.value = true
  errorMessage.value = ''
  successMessage.value = ''
  try {
    const response = await $fetch<{ message?: string }>('/api/auth/password-reset/confirm', {
      method: 'POST',
      body: {
        email: email.value,
        code: code.value,
        password: password.value
      }
    })
    successMessage.value = response.message || 'Senha alterada com sucesso.'
    code.value = ''
    password.value = ''
    confirmPassword.value = ''
    await navigateTo(loginPath.value)
  } catch (error: any) {
    errorMessage.value = error?.data?.message || error?.message || 'Nao foi possivel alterar a senha.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <main>
    <div class="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div>
        <div class="sm:mx-auto sm:w-full sm:max-w-md">
          <img src="/img/kiwify-green-logo.3059fc8.svg" alt="" class="mx-auto h-12 w-auto">
          <h2 class="mt-6 text-center text-3xl leading-9 font-extrabold text-gray-900">
            Esqueci minha senha
          </h2>
          <p class="mt-2 text-center text-base leading-5 text-gray-600">
            Ou
            <NuxtLink :to="loginPath" class="font-medium text-indigo-600 hover:text-indigo-500 focus:outline-none focus:underline transition ease-in-out duration-150">
              entrar
            </NuxtLink>
          </p>
        </div>
        <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <form v-if="!codeSent" class="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10" @submit.prevent="requestCode">
        <div v-if="errorMessage" class="mb-6 rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{{ errorMessage }}</div>
        <div v-if="successMessage" class="mb-6 rounded-md bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">{{ successMessage }}</div>
        <div>
          <label for="email" class="block text-sm font-medium leading-5 mb-1 text-gray-700">
            E-mail
          </label>
          <div>
            <input id="email" v-model="email" type="text" autocomplete="username" name="email" required class="form-input block py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:shadow-outline-blue focus:border-blue-300 transition duration-150 ease-in-out sm:text-sm sm:leading-5 mask-user-input w-full">
          </div>
        </div>
        <div class="mt-6">
          <span class="block w-full rounded-md shadow-sm"><button type="submit" class="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-500 focus:outline-none focus:border-indigo-700 focus:shadow-outline-indigo active:bg-indigo-700 transition duration-150 ease-in-out">
            {{ loading ? 'Enviando...' : 'Enviar codigo' }}
            </button></span>
        </div>
      </form>
      <form v-else-if="codeVerified" class="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10" @submit.prevent="confirmReset">
        <div v-if="errorMessage" class="mb-6 rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{{ errorMessage }}</div>
        <div v-if="successMessage" class="mb-6 rounded-md bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">{{ successMessage }}</div>
        <div>
          <label for="email-confirm" class="block text-sm font-medium leading-5 mb-1 text-gray-700">
            E-mail
          </label>
          <div>
            <input id="email-confirm" v-model="email" type="text" autocomplete="username" name="email" required class="form-input block py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:shadow-outline-blue focus:border-blue-300 transition duration-150 ease-in-out sm:text-sm sm:leading-5 mask-user-input w-full">
          </div>
        </div>
        <div class="mt-6">
          <label for="password" class="block text-sm font-medium leading-5 mb-1 text-gray-700">
          Nova senha
          </label>
          <div class="relative rounded-md shadow-sm">
            <input id="password" v-model="password" :type="showPassword ? 'text' : 'password'" autocomplete="new-password" name="password" required minlength="6" class="form-input block py-2 px-3 pr-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:shadow-outline-blue focus:border-blue-300 transition duration-150 ease-in-out sm:text-sm sm:leading-5 mask-user-input w-full">
            <button type="button" class="absolute inset-y-0 right-0 pr-3 flex items-center focus:outline-none" :aria-label="showPassword ? 'Ocultar senha' : 'Mostrar senha'" @click="showPassword = !showPassword">
              <svg v-if="!showPassword" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="24px" height="24px" class="h-5 w-5 text-gray-400"><path d="M10 3C5 3 1.73 7.11 1 10c.73 2.89 4 7 9 7s8.27-4.11 9-7c-.73-2.89-4-7-9-7zm0 11a4 4 0 110-8 4 4 0 010 8z"></path><path d="M10 8a2 2 0 100 4 2 2 0 000-4z"></path></svg>
              <svg v-else xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="24px" height="24px" class="h-5 w-5 text-gray-400"><path fill-rule="evenodd" d="M3.28 2.22a.75.75 0 00-1.06 1.06l14.5 14.5a.75.75 0 101.06-1.06l-2.4-2.4A11.38 11.38 0 0019 10c-.73-2.89-4-7-9-7-1.5 0-2.84.37-4.02.96L3.28 2.22zM7.53 5.03A7.1 7.1 0 0110 4.5c3.92 0 6.42 3.15 7.08 5.5a9.63 9.63 0 01-2.17 3.32l-2.02-2.02A4 4 0 007.7 6.11L7.53 5.03z" clip-rule="evenodd"></path><path d="M10 15.5c-3.92 0-6.42-3.15-7.08-5.5a9.74 9.74 0 013.31-4.35l1.62 1.62A4 4 0 0012.73 12.15l1.62 1.62A7.09 7.09 0 0110 15.5z"></path></svg>
            </button>
          </div>
        </div>
        <div class="mt-6">
          <label for="confirm-password" class="block text-sm font-medium leading-5 mb-1 text-gray-700">
          Confirmar nova senha
          </label>
          <div class="relative rounded-md shadow-sm">
            <input id="confirm-password" v-model="confirmPassword" :type="showConfirmPassword ? 'text' : 'password'" autocomplete="new-password" name="confirm-password" required minlength="6" class="form-input block py-2 px-3 pr-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:shadow-outline-blue focus:border-blue-300 transition duration-150 ease-in-out sm:text-sm sm:leading-5 mask-user-input w-full">
            <button type="button" class="absolute inset-y-0 right-0 pr-3 flex items-center focus:outline-none" :aria-label="showConfirmPassword ? 'Ocultar senha' : 'Mostrar senha'" @click="showConfirmPassword = !showConfirmPassword">
              <svg v-if="!showConfirmPassword" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="24px" height="24px" class="h-5 w-5 text-gray-400"><path d="M10 3C5 3 1.73 7.11 1 10c.73 2.89 4 7 9 7s8.27-4.11 9-7c-.73-2.89-4-7-9-7zm0 11a4 4 0 110-8 4 4 0 010 8z"></path><path d="M10 8a2 2 0 100 4 2 2 0 000-4z"></path></svg>
              <svg v-else xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" width="24px" height="24px" class="h-5 w-5 text-gray-400"><path fill-rule="evenodd" d="M3.28 2.22a.75.75 0 00-1.06 1.06l14.5 14.5a.75.75 0 101.06-1.06l-2.4-2.4A11.38 11.38 0 0019 10c-.73-2.89-4-7-9-7-1.5 0-2.84.37-4.02.96L3.28 2.22zM7.53 5.03A7.1 7.1 0 0110 4.5c3.92 0 6.42 3.15 7.08 5.5a9.63 9.63 0 01-2.17 3.32l-2.02-2.02A4 4 0 007.7 6.11L7.53 5.03z" clip-rule="evenodd"></path><path d="M10 15.5c-3.92 0-6.42-3.15-7.08-5.5a9.74 9.74 0 013.31-4.35l1.62 1.62A4 4 0 0012.73 12.15l1.62 1.62A7.09 7.09 0 0110 15.5z"></path></svg>
            </button>
          </div>
        </div>
        <div class="mt-6">
          <span class="block w-full rounded-md shadow-sm"><button type="submit" class="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-500 focus:outline-none focus:border-indigo-700 focus:shadow-outline-indigo active:bg-indigo-700 transition duration-150 ease-in-out">
            {{ loading ? 'Alterando...' : 'Alterar senha' }}
            </button></span>
        </div>
        <div class="mt-2 flex items-center justify-end">
          <div class="text-sm leading-5">
            <button type="button" class="font-medium text-indigo-600 hover:text-indigo-500 focus:outline-none focus:underline transition ease-in-out duration-150" @click="requestCode">
              Reenviar codigo
            </button>
          </div>
        </div>
      </form>
        </div>
      </div>
    </div>
    <div v-if="codeSent && !codeVerified" class="fixed md:h-auto bottom-0 inset-x-0 inset-0 flex items-center justify-center z-500">
      <div class="fixed inset-0 transition-opacity cursor-pointer">
        <div class="absolute inset-0 bg-gray-500 opacity-75"></div>
      </div>
      <form role="dialog" aria-modal="true" aria-labelledby="token-modal-title" class="bg-white overflow-x-auto md:rounded-lg sm:h-auto md:shadow-xl transform transition-all sm:max-w-sm w-full" @submit.prevent="verifyCode">
        <div class="px-4 py-3 bg-gray-50 flex justify-between">
          <h3 id="token-modal-title" class="text-lg leading-6 font-medium text-gray-900">Confirmar codigo</h3>
          <button type="button" aria-label="Close" class="text-gray-400 cursor-pointer hover:text-gray-500 focus:outline-none focus:text-gray-500 transition ease-in-out duration-150" @click="codeSent = false">
            <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" class="h-6 w-6"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
        <div class="px-4 py-5 sm:p-6 rounded-lg">
          <div v-if="errorMessage" class="mb-4 rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{{ errorMessage }}</div>
          <div v-if="successMessage" class="mb-4 rounded-md bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">{{ successMessage }}</div>
          <label for="token-code" class="block text-sm font-medium leading-5 mb-1 text-gray-700">
            Codigo
          </label>
          <input id="token-code" v-model="code" inputmode="numeric" maxlength="6" autocomplete="one-time-code" name="code" required class="form-input block py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:shadow-outline-blue focus:border-blue-300 transition duration-150 ease-in-out sm:text-sm sm:leading-5 mask-user-input w-full">
        </div>
        <div class="bg-gray-50 px-4 py-3 sm:px-6 flex flex-row-reverse">
          <button type="submit" class="inline-flex justify-center items-center text-center font-medium rounded-md border transition ease-in-out duration-150 focus:outline-none text-white bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 border-transparent focus:border-indigo-700 focus:shadow-outline-indigo leading-5 text-sm px-4 py-2 gap-2 cursor-pointer shadow-sm">
            {{ loading ? 'Validando...' : 'Validar codigo' }}
          </button>
          <button type="button" class="mr-2 inline-flex justify-center items-center text-center font-medium rounded-md border transition ease-in-out duration-150 focus:outline-none text-gray-700 hover:text-gray-500 active:text-gray-800 bg-white active:bg-gray-50 border-gray-300 focus:border-blue-300 focus:shadow-outline-blue leading-5 text-sm px-4 py-2 gap-2 cursor-pointer shadow-sm" @click="requestCode">
            Reenviar
          </button>
        </div>
      </form>
    </div>
    <div class="vue-portal-target"></div>
  </main>
</template>
