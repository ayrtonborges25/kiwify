# Regras Fixas do Projeto

## Visual

- CSS, HTML, layout, fontes, espacamentos, tamanhos, cores, bordas, cards, tabs, sidebar, topbar, modais, inputs, botoes e qualquer componente visual devem ser 100% baseados no HTML original em `referencias/`.
- Nao inventar layout.
- Nao criar design novo.
- Nao simplificar, modernizar ou aproximar.
- Nao trocar estrutura, DOM, hierarquia, classes ou medidas quando ja existirem no HTML original.
- O HTML original e a unica fonte da verdade visual.

## Fluxo Obrigatorio Antes de Mexer em Tela

1. Abrir o HTML original correspondente em `referencias/`.
2. Comparar com o Vue atual.
3. Copiar a estrutura visual 1:1.
4. Preservar classes, CSS, DOM, hierarquia e medidas.
5. Conectar comportamento somente depois que o visual estiver identico.

## Escopo

Essa regra vale para checkout, dashboard, products, sales, members-area, editor, club, area de aluno, modais, menus, tabs, player e qualquer outra tela visual.

Se a tela Vue estiver diferente do HTML original, esta errada.
