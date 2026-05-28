<script setup lang="ts">
useHead({ title: 'Apps' })
</script>

<template>
  <SideRouteShell
    title="Apps"
    :columns="['Nome', 'Categoria', 'Status']"
    empty-text="Nao ha nenhum item"
  />
</template>
