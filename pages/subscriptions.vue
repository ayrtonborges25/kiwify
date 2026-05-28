<script setup lang="ts">
useHead({ title: 'Assinaturas' })
</script>

<template>
  <SideRouteShell
    title="Assinaturas"
    :columns="['Data', 'Produto', 'Cliente', 'Status', 'Valor']"
    empty-text="Nao ha nenhum item"
  />
</template>
