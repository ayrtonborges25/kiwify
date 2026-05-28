<script setup lang="ts">
useHead({ title: 'Relatorios' })
</script>

<template>
  <SideRouteShell
    title="Relatórios"
    :columns="['Nome', 'Periodo', 'Status']"
    empty-text="Nao ha nenhum item"
  />
</template>
