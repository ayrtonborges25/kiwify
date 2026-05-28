export type ProductStatus = 'Ativo' | 'Bloqueado' | 'Rascunho'

export interface Product {
  id: string
  name: string
  price: string
  status: ProductStatus
  type: string
  sales: number
}

export const products: Product[] = [
  { id: 'ae3c3610-f0af-11f0-b85d-45218e98c266', name: 'Figurinhas da copa 2026', price: 'R$ 19,00', status: 'Bloqueado', type: 'Produto digital', sales: 4 },
  { id: '1121e0c0-3cb7-11f0-be25-e58a6462d605', name: 'Clube dos Fotógrafos - Ayrton Borges', price: 'R$ 187,00', status: 'Ativo', type: 'Checkout', sales: 2 },
  { id: '1d0dfdd0-666d-11f0-8441-1f715a1d0490', name: 'Nadando com a Nanda', price: 'R$ 97,00', status: 'Ativo', type: 'Checkout', sales: 0 },
  { id: '2b3d6960-545e-11f1-bec1-c10c5f594dcb', name: 'China Imports', price: 'USD 19.00', status: 'Ativo', type: 'Checkout', sales: 0 },
  { id: '4b54d3a0-4168-11f0-8d36-d77b54b70809', name: 'Pix Todo Dia', price: 'R$ 197,00', status: 'Ativo', type: 'Checkout', sales: 0 },
  { id: '5de950c0-786f-11f0-9c18-134f54e4cb6d', name: 'Fotógrafo Blindado - Contratos editáveis para fotógrafos', price: 'R$ 47,00', status: 'Ativo', type: 'Checkout', sales: 0 },
  { id: '96864ce0-9ef7-11f0-99e6-cf7bf492386a', name: 'Orçamento FODA - Para fotógrafos', price: 'R$ 47,00', status: 'Ativo', type: 'Checkout', sales: 0 },
  { id: 'e5730510-4168-11f0-b7ac-47c185a29c23', name: 'Retratista Digital - A segunda revolução', price: 'R$ 47,00', status: 'Ativo', type: 'Checkout', sales: 0 },
  { id: '9f843d20-f13a-11f0-b85d-45218e98c266', name: 'Novo produto mockado', price: 'R$ 0,00', status: 'Rascunho', type: 'Produto digital', sales: 0 }
]
