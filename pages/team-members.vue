<script setup lang="ts">
useHead({ title: 'Colaboradores' })
</script>

<template>
  <SideRouteShell
    title="Colaboradores"
    :columns="['Nome', 'Email', 'Permissao', 'Status']"
    empty-text="Nao ha nenhum item"
  />
</template>
