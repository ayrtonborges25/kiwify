# Kiwify Clone - Fluxos e QA

## Rotas implementadas

- `/dashboard`
- `/products`
- `/products/edit/[id]`
- `/products/edit/[id]?tab=general`
- `/products/edit/[id]?tab=members-area`
- `/products/edit/[id]?tab=settings`
- `/products/edit/[id]?tab=checkout-builder`
- `/products/edit/[id]?tab=coproductions`
- `/products/edit/[id]?tab=affiliates`
- `/products/edit/[id]?tab=links`
- `/sales`
- `/sales?tab=all`
- `/sales?id=[id]`
- `/members-area`
- `/members-area/[id]`
- `/checkout-builder/[id]`
- `/finance`
- `/reports`
- `/subscriptions`
- `/team-members`
- `/apps`
- `/marketplace`
- `/myaffiliates`

## Rotas redirecionadas

- `/produtos` -> `/products`
- `/vendas` -> `/sales`
- `/area-de-membros` -> `/members-area`
- `/produto` -> `/products/edit/ae3c3610-f0af-11f0-b85d-45218e98c266`
- `/checkout-builder` -> `/checkout-builder/176c19f7-fb34-4507-9191-1d277ef99d98`

## IDs mockados principais

- Produto: `ae3c3610-f0af-11f0-b85d-45218e98c266`
- Produto criado via mock: `9f843d20-f13a-11f0-b85d-45218e98c266`
- Venda: `f87bbc92-be55-4fc0-9d21-a56a49b672de`
- Area de membros: `c6d46bd7-9ced-4fb2-a4a0-ae033e3b612a`
- Checkout builder: `176c19f7-fb34-4507-9191-1d277ef99d98`

## Modais conectados

### Products

- Criar produto
- Duplicate product
- Acoes da tabela
- Ver links
- Editar produto

### Sales

- Exportar vendas por XLS/CSV
- Detalhes da venda via `/sales?id=[id]`
- Reembolso
- Reembolso boleto
- Realizar cobranca
- Cancelar assinatura

### Members Area

- Criar area de membros
- Criar escola
- Excluir escola
- Criar curso
- Importar curso

### Product Edit

- Excluir produto
- Cancelar todas assinaturas
- Editar Facebook Pixel avancado
- Criar novo frete
- Gerador de upsell
- Adicionar order bump
- Adicionar link
- Adicionar plano
- Adicionar lote
- Adicionar ingresso

### Globais e conta

- Notificacoes, quando o modal estiver presente no HTML da pagina carregada.
- Premiacoes da Kiwify, quando o modal estiver presente no HTML da pagina carregada.
- Atualizar endereco, via modal `Por favor atualize o seu endereco` quando presente.
- Alterar representante legal, quando o modal estiver presente.
- Upload de videos em massa, quando o modal estiver presente.

### Convites e contratos

- Aceitar convite
- Recusar convite
- Cancelar afiliacao
- Cancelar contrato de co-producao

## Fluxos com gatilho visual ativo

- `/products`: botao Criar produto.
- `/products`: menu de tres pontos da tabela, com Ver links e Editar.
- `/products`: Continuar no modal de criacao redireciona para edicao do produto mockado.
- `/sales`: menu Exportar, com XLS e CSV.
- `/sales?id=[id]`: painel lateral de detalhes abre pela query string e preenche dados do mock.
- `/sales`: filtro lateral abre pelo botao Filtros.
- `/members-area`: botao Criar area de membros.
- `/products/edit/[id]?tab=...`: abas oficiais ficam ativas pela query string.
- `/products/edit/[id]`: botoes existentes de link, order bump, pixel, frete, upsell, assinatura e exclusao acionam o handler quando presentes na tela.
- `/products`: modais de aceitar/recusar convite, cancelar afiliacao e cancelar contrato de co-producao estao conectados por titulo quando seus gatilhos aparecem.
- `/products/edit/[id]`: modais de adicionar plano/lote/ingresso estao conectados por titulo quando seus botoes aparecem.
- Sidebar: rotas laterais oficiais apontam para `/finance`, `/reports`, `/subscriptions`, `/team-members`, `/apps`, `/marketplace` e `/myaffiliates`.

## Handler pronto, mas sem botao visivel no HTML convertido

- Duplicar produto: existe modal convertido, mas o menu visivel atual so expoe Ver links e Editar.
- Excluir produto na listagem: a confirmacao existe na edicao do produto, mas nao ha item visivel de excluir na tabela `/products`.
- Criar escola e Excluir escola: modais foram mantidos ocultos; a tela `/members-area` convertida nao expoe botoes visiveis para esses fluxos.
- Criar curso e Importar curso: modais foram mantidos ocultos em `/members-area/[id]`; a tela convertida atual nao expoe botoes visiveis para acionar esses fluxos.
- Acoes especificas de cupom de desconto: o HTML preserva secoes/configuracoes, mas nao ha fluxo completo com gatilho visivel convertido nesta fase.
- Algumas acoes de links/order bumps, como editar/desabilitar/excluir linha individual, aparecem em menus internos, mas ainda estao mockadas apenas como fechamento/estado local.
- Rotas laterais `/finance`, `/reports`, `/subscriptions`, `/team-members`, `/apps`, `/marketplace` e `/myaffiliates`: os HTMLs fornecidos ate agora contem os itens da sidebar, mas nao contem o corpo original completo dessas telas. As rotas existem e usam o mesmo shell visual/base de tabela, mas a conversao 1:1 do conteudo interno depende dos HTMLs originais dessas paginas.
- Configurar conta de criador: listado como fluxo pendente, mas nao foi encontrado modal/bloco completo convertido nos HTMLs disponiveis.
- Certificado, Comentarios, Personalizacao, Protecao anti pirataria e Suporte ao cliente: encontrados principalmente como secoes/opcoes na area de membros do produto; ainda falta converter/conectar os modais especificos se houver HTML de modal separado.
- Gerenciar dominios Facebook: ha links/texto no bloco de pixels; nao foi encontrado modal completo correspondente nos HTMLs convertidos.

## Bibliotecas externas presentes no HTML original e ainda nao implementadas

- Uppy, Dropbox e Google Drive Picker para upload/importacao.
- Cropper para corte de imagem.
- Quill para editores ricos do checkout builder.
- reCAPTCHA/grecaptcha.
- Veriff.
- ApexCharts/Svgjs para graficos.
- Chatbase.
- Cloudflare beacon/challenge scripts.
- Vimeo/YouTube embeds.
- Upload de arquivos local/mockado, sem Uppy real.
- Cropper/recorte de imagem ainda nao implementado.
- Editor rico ainda nao implementado.
- Selects avancados ainda como markup/estado local.
- Color picker ainda como markup/estado local.
- Player de video e YouTube iframe API ainda nao implementados.
- Google Maps Places ainda nao implementado.
- reCAPTCHA e Veriff permanecem apenas como referencia/mock visual, sem integracao real.
- Integrações/pixels: Facebook, Google Analytics/G Ads, Taboola, Outbrain, TikTok, Pinterest e Kwai.

## Supabase

### Variaveis de ambiente

O projeto le as credenciais pelo runtime config publico do Nuxt:

- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`

Use `.env.example` como base para criar `.env`. Nao colocar tokens pessoais ou service role no frontend.

### Schema

O schema SQL esta em `supabase/schema.sql` e cria/atualiza:

- `profiles`
- `products`
- `offers`
- `product_settings`
- `product_links`
- `product_checkouts`
- `checkout_settings`
- `sales`
- `members_areas`
- `courses`
- `modules`
- `lessons`
- `uploads`

O SQL usa `create table if not exists`, indices basicos, trigger `set_updated_at`, RLS habilitado e policies basicas para usuarios autenticados.

### Buckets esperados

Criar no Supabase Storage:

- `product-images`
- `course-videos`
- `member-area-covers`
- `checkout-assets`

### Services conectados

Os services abaixo tentam Supabase quando `SUPABASE_URL` e `SUPABASE_ANON_KEY` existem. Se a configuracao estiver ausente, se a query falhar ou se ainda nao houver dados, eles mantem fallback para os mocks locais.

- `services/productsService.ts`
- `services/salesService.ts`
- `services/membersAreaService.ts`
- `services/checkoutService.ts`
- `services/userService.ts`
- `services/offersService.ts`

O helper `uploadFile(bucket, path, file)` esta em `utils/supabase.ts`.

### Checkout publico por oferta

Fluxo implementado:

- Produto em `/products/edit/[id]?tab=links`
- Oferta/link em `offers` + `product_links`
- Checkout publico em `/checkout/[offerId]`
- Compra mockada cria registro em `sales`
- Confirmacao em `/thank-you/[saleId]`

Migration especifica:

- `supabase/migrations/20260526220000_offers_checkout.sql`

Tabela adicionada:

- `offers`: guarda produto, checkout opcional, nome, slug unico, preco, moeda, metodos de pagamento, configuracoes, status e flag de oferta padrao.

Campos adicionados:

- `product_links.offer_id`
- `product_links.public_url`
- `product_links.label`
- `sales.offer_id`

### Pagamento Asaas

Fluxo implementado na Fase 12:

- Checkout publico chama `POST /api/checkout/create-payment`.
- A rota server busca `offer`/`product` no Supabase.
- A rota server cria ou localiza o `customer` no Asaas.
- A rota server cria a cobranca no Asaas com `PIX`, `BOLETO` ou `CREDIT_CARD`.
- A venda e salva em `sales` com dados do provedor.
- O comprador e redirecionado para `/thank-you/[saleId]`.
- A tela de obrigado mostra aprovado, Pix copia e cola/QR Code ou link de boleto conforme a venda.

Arquivos principais:

- `server/api/checkout/create-payment.post.ts`
- `server/api/webhooks/asaas.post.ts`
- `server/utils/supabaseServer.ts`
- `supabase/migrations/20260527000000_asaas_payments.sql`

Variaveis necessarias:

- `ASAAS_API_KEY`
- `ASAAS_BASE_URL=https://sandbox.asaas.com/api/v3`
- `ASAAS_WEBHOOK_TOKEN`, opcional para validar o webhook.
- `SUPABASE_SERVICE_ROLE_KEY` opcional no servidor; se ausente, o server usa a anon key e as policies publicas.
- `RESEND_API_KEY`
- `RESEND_FROM_EMAIL=noreply@ayrtonborgesonline.com`
- `APP_PUBLIC_URL`, usado para montar o link absoluto enviado no email de acesso.

Campos adicionados em `sales`:

- `provider`
- `provider_payment_id`
- `invoice_url`
- `pix_qr_code`
- `pix_copy_paste`
- `boleto_url`
- `paid_at`
- `raw_provider_response`

Pendencias do checkout real:

- Criar antifraude/recaptcha real.
- Persistir endereco completo quando o checkout exigir endereco.
- Enviar e-mails/transacionais reais.

### Webhook Asaas

Rota implementada:

- `POST /api/webhooks/asaas`
- Edge Function Supabase: `POST /functions/v1/asaas-webhook`

URL em producao:

- `https://SEU_DOMINIO/api/webhooks/asaas`
- `https://SEU_PROJECT_REF.supabase.co/functions/v1/asaas-webhook`

Eventos configurados:

- `PAYMENT_CREATED`
- `PAYMENT_CONFIRMED`
- `PAYMENT_RECEIVED`
- `PAYMENT_OVERDUE`
- `PAYMENT_REFUNDED`
- `PAYMENT_DELETED`
- `PAYMENT_RESTORED`

O webhook busca a venda por `sales.provider_payment_id = payment.id` e atualiza:

- `status`
- `paid_at`
- `invoice_url`
- `pix_qr_code`
- `pix_copy_paste`
- `boleto_url`
- `raw_provider_response`

Seguranca:

- Se `ASAAS_WEBHOOK_TOKEN` estiver configurado, a rota valida o token recebido nos headers `asaas-access-token`, `x-asaas-webhook-token`, `x-webhook-token` ou `Authorization: Bearer`.
- Se o token nao estiver configurado, a rota aceita o webhook sem validacao extra para facilitar sandbox/local.

Teste local:

```sh
curl -X POST http://localhost:3000/api/webhooks/asaas \
  -H 'Content-Type: application/json' \
  --data '{"event":"PAYMENT_CONFIRMED","payment":{"id":"PAYMENT_ID","status":"CONFIRMED","billingType":"PIX"}}'
```

Teste da Edge Function:

```sh
curl -X POST https://SEU_PROJECT_REF.supabase.co/functions/v1/asaas-webhook \
  -H 'Content-Type: application/json' \
  --data '{"event":"PAYMENT_CONFIRMED","payment":{"id":"PAYMENT_ID","status":"CONFIRMED","billingType":"PIX"}}'
```

Teste real executado no Supabase:

- Produto usado: `1121e0c0-3cb7-11f0-be25-e58a6462d605`
- Oferta criada: `9d5529c0-9237-49de-afbe-1fd869ed679c`
- Checkout publico: `/checkout/9d5529c0-9237-49de-afbe-1fd869ed679c`
- Venda criada: `baa21ab0-9912-4c96-b8c1-6af7ed9aca96`
- Obrigado: `/thank-you/baa21ab0-9912-4c96-b8c1-6af7ed9aca96`
- Webhook testado com `PAYMENT_CONFIRMED` para `pay_sedd3ok8499ofgwv`, atualizando a venda `55d3d2d1-5ae2-493c-a60b-62cfadde6c16` para `approved`.

### Entrega do produto

Tabela criada:

- `product_deliveries`

Campos principais:

- `sale_id`
- `product_id`
- `customer_email`
- `delivery_type`
- `access_url`
- `status`

Fluxo implementado:

- O webhook Asaas recebe `PAYMENT_CONFIRMED` ou `PAYMENT_RECEIVED`.
- A venda é atualizada para `approved`.
- A rota cria uma entrega se ainda não existir para `sales.id`.
- Se o produto tiver pagina de obrigado/upsell ativa, o checkout aprovado direciona para `/thank-you/{saleId}`.
- Se nao tiver pagina de obrigado/upsell ativa, o checkout aprovado direciona direto para `club={clubId}`.
- Pagamentos Pix/Boleto pendentes direcionam para `/payment/{saleId}`.

Migration:

- `supabase/migrations/20260527110000_product_deliveries.sql`

Pendências:

- Trocar a entrega mockada por acesso autenticado real na área de membros.
- Adicionar entrega por download/link externo usando settings do produto.

### Email de acesso

Quando uma venda é aprovada, o fluxo de entrega agora também dispara um email transacional via Resend:

- remetente configurado em `RESEND_FROM_EMAIL`
- chave configurada em `RESEND_API_KEY`
- URL base configurada em `APP_PUBLIC_URL`
- template HTML com resumo da compra e botão `Acessar produto`
- link enviado: `club={clubId}` ou `/thank-you/{saleId}`, conforme configuracao do produto

O envio acontece nos dois pontos de aprovação:

- `server/api/checkout/create-payment.post.ts`, para pagamentos aprovados imediatamente.
- `server/api/webhooks/asaas.post.ts` e `supabase/functions/asaas-webhook/index.ts`, para aprovação via webhook.

A tabela `product_deliveries` recebeu `access_email_sent_at` para marcar quando o email de acesso foi enviado.

Para Edge Function no Supabase, configurar tambem os secrets:

```sh
supabase secrets set RESEND_API_KEY=... RESEND_FROM_EMAIL=noreply@ayrtonborgesonline.com APP_PUBLIC_URL=https://seu-dominio.com --project-ref fndefvxkhvhdkcfeubzf
supabase functions deploy asaas-webhook --project-ref fndefvxkhvhdkcfeubzf
```

### Como rodar o SQL

1. Abra o projeto no Supabase.
2. Va em `SQL Editor`.
3. Cole o conteudo de `supabase/schema.sql`.
4. Execute o script.
5. Crie os buckets listados acima em `Storage`.
6. Configure `.env` com `SUPABASE_URL` e `SUPABASE_ANON_KEY`.

## QA executado

- Rotas oficiais testadas com status 200.
- Rotas antigas testadas com redirect 301.
- Query strings de tabs testadas em products edit e sales.
- `/sales?id=f87bbc92-be55-4fc0-9d21-a56a49b672de` testado com painel de detalhes pelo mock.
- Handler revisado para ESC, cancelar/fechar, clique fora, dropdown unico aberto e fechamento de modais.

## Proximos passos recomendados

1. Conectar os gatilhos visuais que ficaram ausentes somente quando o HTML original correspondente for convertido para a tela certa.
2. Implementar upload com Uppy e importadores Dropbox/Google Drive.
3. Implementar Cropper para imagens de produto e area de membros.
4. Implementar Quill no checkout builder.
5. Implementar modais internos restantes de cupom, link e order bump com estado mockado mais granular.
6. Implementar graficos reais com dados mockados mantendo a estrutura visual original.
7. Adicionar testes automatizados de interacao quando Playwright estiver disponivel no projeto.
