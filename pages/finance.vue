<script setup lang="ts">
useHead({ title: 'Financeiro' })
</script>

<template>
  <SideRouteShell
    title="Financeiro"
    :columns="['Data', 'Descricao', 'Valor', 'Status']"
    empty-text="Nao ha nenhum item"
  />
</template>
