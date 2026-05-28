import {
  createProduct as serviceCreateProduct,
  deleteProduct as serviceDeleteProduct,
  duplicateProduct as serviceDuplicateProduct,
  getProductsSnapshot,
  listProducts,
  updateProduct as serviceUpdateProduct
} from '~/services/productsService'

export function useProducts() {
  const productsState = ref(getProductsSnapshot())

  const refreshProducts = async () => {
    productsState.value = await listProducts()
    return productsState.value
  }

  const getProductById = (id: string) => productsState.value.find((product) => product.id === id)

  const createProduct = async (...args: Parameters<typeof serviceCreateProduct>) => {
    const product = await serviceCreateProduct(...args)
    await refreshProducts()
    return product
  }

  const duplicateProduct = async (id: string) => {
    const product = await serviceDuplicateProduct(id)
    await refreshProducts()
    return product
  }

  const deleteProduct = async (id: string) => {
    const deleted = await serviceDeleteProduct(id)
    await refreshProducts()
    return deleted
  }

  const updateProduct = async (...args: Parameters<typeof serviceUpdateProduct>) => {
    const product = await serviceUpdateProduct(...args)
    await refreshProducts()
    return product
  }

  void refreshProducts()

  return {
    products: readonly(productsState),
    refreshProducts,
    getProductById,
    createProduct,
    duplicateProduct,
    deleteProduct,
    updateProduct
  }
}
