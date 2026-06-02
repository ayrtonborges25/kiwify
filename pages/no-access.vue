<script setup lang="ts">
useHead({ title: 'Sem acesso' })
</script>

<template>
  <div class="min-h-screen bg-gray-50 flex items-center justify-center px-4">
    <div class="max-w-md w-full bg-white shadow rounded-lg p-6 text-center">
      <h1 class="text-lg leading-6 font-medium text-gray-900">Você ainda não possui acesso a nenhum produto.</h1>
      <p class="mt-2 text-sm leading-5 text-gray-500">Entre com o e-mail usado na compra ou fale com o suporte.</p>
      <div class="mt-6">
        <NuxtLink to="/student/login" class="inline-flex justify-center items-center text-center font-medium rounded-md border transition ease-in-out duration-150 focus:outline-none text-white bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 border-transparent focus:border-indigo-700 focus:shadow-outline-indigo leading-5 text-sm px-4 py-2 cursor-pointer shadow-sm">
          Entrar novamente
        </NuxtLink>
      </div>
    </div>
  </div>
</template>
