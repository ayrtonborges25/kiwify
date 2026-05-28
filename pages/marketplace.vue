<script setup lang="ts">
useHead({ title: 'Marketplace' })
</script>

<template>
  <SideRouteShell
    title="Marketplace"
    :columns="['Produto', 'Produtor', 'Comissao', 'Status']"
    empty-text="Nao ha nenhum item"
  />
</template>
