export interface Sale {
  id: string
  productId?: string
  offerId?: string
  product: string
  customer: string
  customerEmail?: string
  method: string
  value: string
  status: string
  createdAt: string
  provider?: string
  providerPaymentId?: string
  invoiceUrl?: string
  pixQrCode?: string
  pixCopyPaste?: string
  boletoUrl?: string
  boletoDueDate?: string
  paidAt?: string
}

export const sales: Sale[] = [
  { id: 'f87bbc92-be55-4fc0-9d21-a56a49b672de', product: 'Figurinhas da Copa 2026', customer: 'Bruna Ferreira Porto', method: 'Pix', value: 'R$ 62,12', status: 'Pago', createdAt: '26/05/2026 08:34' },
  { id: 'cb24b6ec-1bf5-46a2-8606-9ab4ee1a6b88', product: 'La Casa de Pincél - Por Ayrton Borges', customer: 'Ronier Felipe', method: 'Pix', value: 'R$ 66,34', status: 'Pago', createdAt: '25/05/2026 11:12' },
  { id: 'd4161e70-32d9-4324-a527-c0f93c5f2c9b', product: 'La Casa de Pincél - Por Ayrton Borges', customer: 'Moises inacio Pereira Ferreira', method: 'Pix', value: 'R$ 66,34', status: 'Pago', createdAt: '25/05/2026 10:48' },
  { id: '7dfa4c4b-4d69-42f1-807c-5dc43ced79fc', product: 'La Casa de Pincél - Por Ayrton Borges', customer: 'Paulo Henrique Jannuzzi', method: 'Cartão de crédito', value: 'R$ 68,83', status: 'Pago', createdAt: '25/05/2026 09:31' }
]

export const dashboardMetrics = [
  { label: 'Valor liquido', value: 'R$ 387,87', note: 'Hoje', icon: '$' },
  { label: 'Vendas', value: '6', note: 'Pedidos aprovados', icon: '↗' },
  { label: 'Aprovacao cartao', value: '100%', note: '0 recusas', icon: '▣' },
  { label: 'Vendas 1-click da rede Kiwify', value: 'R$ 66,34', note: '17%', icon: '◎' },
  { label: 'Reembolso', value: '0%', note: 'Nenhum pedido', icon: '↩' },
  { label: 'Conversao boleto', value: '0%', note: '0 boletos pagos', icon: '%' },
  { label: 'Chargeback', value: '0%', note: 'Risco baixo', icon: '⊘' },
  { label: 'Boletos gerados', value: '0', note: 'Hoje', icon: '#' }
]
