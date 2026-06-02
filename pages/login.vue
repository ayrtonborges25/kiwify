<script setup lang="ts">
import { signIn } from '~/services/authService'
import { resolvePostLoginRedirect, setLastContext } from '~/services/sessionContextService'

definePageMeta({ layout: false })
useHead({ title: 'Login' })

const route = useRoute()
const email = ref('')
const password = ref('')
const loading = ref(false)
const errorMessage = ref('')

const redirect = computed(() => typeof route.query.redirect === 'string' ? route.query.redirect : '')

const submit = async () => {
  if (loading.value) return
  loading.value = true
  errorMessage.value = ''
  try {
    const result = await signIn(email.value, password.value)
    if (result.user) {
      const target = resolvePostLoginRedirect(redirect.value)
      setLastContext(target.startsWith('/dashboard') ? 'producer' : 'student')
      await navigateTo(target)
    }
  } catch (error: any) {
      errorMessage.value = error?.message || 'Nao foi possivel entrar.'
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
            Entrar na sua conta
          </h2>
          <p class="mt-2 text-center text-base leading-5 text-gray-600">
            Ou
            <NuxtLink :to="`/register?redirect=${encodeURIComponent(redirect || '/dashboard')}`" class="font-medium text-indigo-600 hover:text-indigo-500 focus:outline-none focus:underline transition ease-in-out duration-150">
              fazer cadastro
            </NuxtLink>
          </p>
        </div>
        <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
          <form class="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10" @submit.prevent="submit">
        <div v-if="errorMessage" class="mb-6 rounded-md bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">{{ errorMessage }}</div>
        <div>
          <label for="email" class="block text-sm font-medium leading-5 mb-1 text-gray-700">
            E-mail
          </label>
          <div>
            <input id="email" v-model="email" type="text" autocomplete="username" name="email" required class="form-input block py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:shadow-outline-blue focus:border-blue-300 transition duration-150 ease-in-out sm:text-sm sm:leading-5 mask-user-input w-full">
          </div>
        </div>
        <div class="mt-6">
          <label for="password" class="block text-sm font-medium leading-5 mb-1 text-gray-700">
          Senha
          </label>
          <div>
            <input id="password" v-model="password" type="password" autocomplete="current-password" name="password" required class="form-input block py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:shadow-outline-blue focus:border-blue-300 transition duration-150 ease-in-out sm:text-sm sm:leading-5 mask-user-input w-full">
          </div>
        </div>
        <div class="mt-2 flex items-center justify-end">
          <div class="text-sm leading-5">
            <NuxtLink :to="`/forgot-password?target=admin&email=${encodeURIComponent(email)}&redirect=${encodeURIComponent(redirect || '/dashboard')}`" class="font-medium text-indigo-600 hover:text-indigo-500 focus:outline-none focus:underline transition ease-in-out duration-150">
              Esqueceu a senha?
            </NuxtLink>
          </div>
        </div>
        <div class="mt-6">
          <span class="block w-full rounded-md shadow-sm"><button type="submit" class="w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-500 focus:outline-none focus:border-indigo-700 focus:shadow-outline-indigo active:bg-indigo-700 transition duration-150 ease-in-out">
            {{ loading ? 'Entrando...' : 'Entrar' }}
            </button></span>
        </div>
      </form>
        </div>
      </div>
    </div>
    <div class="vue-portal-target"></div>
  </main>
</template>
