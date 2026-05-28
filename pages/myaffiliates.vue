<script setup lang="ts">
useHead({ title: 'Meus Afiliados' })
</script>

<template>
  <SideRouteShell
    title="Meus Afiliados"
    :columns="['Afiliado', 'Produto', 'Comissao', 'Status']"
    empty-text="Nao ha nenhum item"
  />
</template>
