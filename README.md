# Kiwify Vue Copy

Projeto Nuxt/Vue que separa as telas capturadas em rotas, sem recriar layout.

Os HTMLs originais foram copiados para `public/captures` e cada rota Vue renderiza o respectivo arquivo inteiro, preservando o DOM, estilos inline e scripts que ja estavam nos snapshots.

## Rotas

- `/dashboard` -> `dashboard.html`
- `/produtos` -> `productos.html`
- `/vendas` -> `vendas.html`
- `/area-de-membros` -> `areademembros.html`
- `/area-de-membros-produto` -> `areademembros_produto.html`
- `/checkout-builder` -> `checkout_builder.html`
- `/produto` -> `produto.html`

## Rodar

```bash
npm install
npm run dev
```
