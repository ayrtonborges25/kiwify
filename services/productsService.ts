import { products as mockProducts, type Product } from '~/data/products'
import { createCourse, createMembersArea, deleteCourseAndMaybeMembersArea } from '~/services/membersAreaService'
import { getCurrentWorkspace } from '~/services/permissionsService'
import { getSupabaseClient } from '~/utils/supabase'

export type ProductSettingsPayload = {
  paymentMethod?: string
  paymentMethods?: string[]
  installments?: number
  cardStatement?: string
  boletoValidityDays?: number
  twoCardsEnabled?: boolean
  cardPixEnabled?: boolean
  smartInstallmentsEnabled?: boolean
  repeatEmailEnabled?: boolean
  collectAddressEnabled?: boolean
  collectInstagramEnabled?: boolean
  autoCurrencyEnabled?: boolean
  thankYouEnabled?: boolean
  thankYouUrl?: string
  upsellSettings?: Record<string, any>
}

export type ProductMembersAreaMode = 'new' | 'existing' | 'external'

export type ProductDetails = Product & {
  description?: string
  currency?: string
  imageUrl?: string
  membersAreaId?: string
  courseId?: string
  settings?: ProductSettingsPayload
}

export type CreateProductPayload = Partial<Omit<ProductDetails, 'id'>> & {
  paymentType?: 'charge' | 'recurring'
  deliveryType?: 'club' | 'external' | 'event' | 'payment'
  membersAreaMode?: ProductMembersAreaMode
  existingMembersAreaId?: string
  salesPageUrl?: string
}
export type UpdateProductPayload = Partial<Omit<ProductDetails, 'id'>>

const productsStore: ProductDetails[] = [...mockProducts]
const productSettingsStore: Record<string, ProductSettingsPayload> = {}

const removeProductFromLocalStore = (id: string) => {
  const index = productsStore.findIndex((product) => product.id === id)
  if (index >= 0) productsStore.splice(index, 1)
}

const createMockId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }

  return `mock-${Date.now()}-${Math.random().toString(16).slice(2)}`
}

const parsePrice = (price?: string) => {
  if (!price) return 0
  return Number(price.replace(/[^\d,.-]/g, '').replace('.', '').replace(',', '.')) || 0
}

const parseSupabasePrice = (price?: string) => Math.max(parsePrice(price), 5)

const formatPrice = (price?: number | null, currency = 'BRL') => {
  const value = Number(price || 0)
  if (currency === 'BRL') return `R$ ${value.toFixed(2).replace('.', ',')}`
  return `${currency} ${value.toFixed(2)}`
}

const normalizeSlug = (value: string) => {
  const normalized = value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

  return normalized || `oferta-${Date.now()}`
}

export const paymentMethodsFromSetting = (paymentMethod?: string) => {
  const normalized = String(paymentMethod || '3').toLowerCase()

  if (normalized === '1' || normalized.includes('cartão de crédito e boleto')) return ['credit_card', 'boleto']
  if (normalized === '4' || normalized.includes('cartão de crédito e pix')) return ['credit_card', 'pix']
  if (normalized === '2' || normalized.includes('apenas cartão')) return ['credit_card']
  return ['credit_card', 'boleto', 'pix']
}

export const checkoutSettingsFromProductSettings = (settings: ProductSettingsPayload = {}) => ({
  repeatEmailEnabled: settings.repeatEmailEnabled ?? true,
  collectPhone: true,
  collectDocument: true,
  installments: settings.installments || 12,
  boletoValidityDays: settings.boletoValidityDays || 3,
  cardStatement: settings.cardStatement || '',
  twoCardsEnabled: Boolean(settings.twoCardsEnabled),
  cardPixEnabled: Boolean(settings.cardPixEnabled),
  smartInstallmentsEnabled: Boolean(settings.smartInstallmentsEnabled)
})

const ensureDefaultOfferInSupabase = async (product: ProductDetails) => {
  const supabase = getSupabaseClient()
  if (!supabase) return

  const paymentMethods = product.settings?.paymentMethods?.length
    ? product.settings.paymentMethods
    : paymentMethodsFromSetting(product.settings?.paymentMethod)
  const checkoutSettings = checkoutSettingsFromProductSettings(product.settings)
  const productName = product.name || 'Oferta principal'

  const { data: existingOffer } = await supabase
    .from('offers')
    .select('id')
    .eq('product_id', product.id)
    .eq('is_default', true)
    .maybeSingle()

  if (existingOffer?.id) {
    await supabase
      .from('offers')
      .update({
        name: productName,
        price: parsePrice(product.price),
        currency: product.currency || 'BRL',
        payment_methods: paymentMethods,
        settings: checkoutSettings,
        status: product.status === 'Ativo' ? 'active' : 'inactive'
      })
      .eq('id', existingOffer.id)

    await supabase
      .from('product_links')
      .update({
        label: productName,
        title: productName
      })
      .eq('offer_id', existingOffer.id)
    return
  }

  const { data: offer, error } = await supabase
    .from('offers')
    .insert({
      product_id: product.id,
      name: productName,
      slug: `${normalizeSlug(productName || product.id)}-${product.id.slice(0, 8)}`,
      price: parsePrice(product.price),
      currency: product.currency || 'BRL',
      payment_methods: paymentMethods,
      settings: checkoutSettings,
      is_default: true,
      status: product.status === 'Ativo' ? 'active' : 'inactive'
    })
    .select('id')
    .single()

  if (error || !offer?.id) return

  await supabase.from('product_links').insert({
    product_id: product.id,
    offer_id: offer.id,
    public_url: `/checkout/${offer.id}`,
    label: productName,
    title: productName,
    url: `/checkout/${offer.id}`,
    type: 'Checkout',
    status: product.status === 'Ativo' ? 'Ativo' : 'Desativado'
  })
}

const mapProductFromSupabase = (row: Record<string, any>, relations: {
  settings?: Record<string, any>
  courseId?: string
  membersAreaId?: string
} = {}): ProductDetails => ({
  id: row.id,
  name: row.name || 'Produto sem nome',
  description: row.description || '',
  price: formatPrice(row.price, row.currency || 'BRL'),
  currency: row.currency || 'BRL',
  status: (row.status || 'Rascunho') as Product['status'],
  type: row.type || 'Produto digital',
  sales: row.sales || 0,
  imageUrl: row.image_url || undefined,
  membersAreaId: relations.membersAreaId,
  courseId: relations.courseId,
  settings: relations.settings
    ? {
        paymentMethod: relations.settings.payment_method || undefined,
        paymentMethods: paymentMethodsFromSetting(relations.settings.payment_method),
        installments: relations.settings.installments || undefined,
        cardStatement: relations.settings.card_statement || undefined,
        boletoValidityDays: relations.settings.boleto_validity_days || undefined,
        twoCardsEnabled: Boolean(relations.settings.two_cards_enabled),
        cardPixEnabled: Boolean(relations.settings.card_pix_enabled),
        smartInstallmentsEnabled: Boolean(relations.settings.smart_installments_enabled),
        repeatEmailEnabled: Boolean(relations.settings.repeat_email_enabled),
        collectAddressEnabled: Boolean(relations.settings.collect_address_enabled),
        collectInstagramEnabled: Boolean(relations.settings.collect_instagram_enabled),
        autoCurrencyEnabled: Boolean(relations.settings.auto_currency_enabled),
        thankYouEnabled: Boolean(relations.settings.thank_you_enabled),
        thankYouUrl: relations.settings.thank_you_url || undefined,
        upsellSettings: relations.settings.upsell_settings || undefined
      }
    : productSettingsStore[row.id]
})

const fallbackProducts = () => productsStore

export const getProductsSnapshot = () => getSupabaseClient() ? [] : productsStore

const loadProductRelations = async (productIds: string[]) => {
  const supabase = getSupabaseClient()
  const relations: Record<string, { settings?: Record<string, any>; courseId?: string; membersAreaId?: string }> = {}
  productIds.forEach((id) => {
    relations[id] = {}
  })

  if (!supabase || !productIds.length) return relations

  const [{ data: settings }, { data: courses }, { data: memberAreas }] = await Promise.all([
    supabase
      .from('product_settings')
      .select('*')
      .in('product_id', productIds),
    supabase
      .from('courses')
      .select('id, product_id, members_area_id')
      .in('product_id', productIds),
    supabase
      .from('members_areas')
      .select('id, product_id')
      .in('product_id', productIds)
  ])

  settings?.forEach((setting) => {
    if (setting.product_id && relations[setting.product_id]) {
      relations[setting.product_id].settings = setting
    }
  })

  courses?.forEach((course) => {
    if (course.product_id && relations[course.product_id]) {
      relations[course.product_id].courseId ||= course.id
      relations[course.product_id].membersAreaId ||= course.members_area_id || undefined
    }
  })

  memberAreas?.forEach((area) => {
    if (area.product_id && relations[area.product_id]) {
      relations[area.product_id].membersAreaId ||= area.id
    }
  })

  return relations
}

const ensureProductCourseInSupabase = async (product: ProductDetails, payload: CreateProductPayload = {}) => {
  const supabase = getSupabaseClient()
  if (!supabase) return

  if (payload.membersAreaMode === 'external' || payload.deliveryType !== 'club') return

  if (payload.membersAreaMode === 'existing' && payload.existingMembersAreaId) {
    const coursePayload: Record<string, any> = {
      members_area_id: payload.existingMembersAreaId,
      product_id: product.id,
      title: product.name,
      description: product.description || '',
      cover_url: product.imageUrl
    }

    let courseResult = await supabase
      .from('courses')
      .insert(coursePayload)
      .select('*')
      .single()

    if (courseResult.error && courseResult.error.message.includes('product_id')) {
      delete coursePayload.product_id
      courseResult = await supabase
        .from('courses')
        .insert(coursePayload)
        .select('*')
        .single()
    }

    if (courseResult.error || !courseResult.data) throw courseResult.error

    product.membersAreaId = payload.existingMembersAreaId
    product.courseId = courseResult.data.id
    return
  }

  const areaPayload: Record<string, any> = {
    product_id: product.id,
    title: product.name,
    description: product.description || '',
    cover_url: product.imageUrl
  }

  let areaResult = await supabase
    .from('members_areas')
    .insert(areaPayload)
    .select('*')
    .single()

  if (areaResult.error && areaResult.error.message.includes('product_id')) {
    delete areaPayload.product_id
    areaResult = await supabase
      .from('members_areas')
      .insert(areaPayload)
      .select('*')
      .single()
  }

  if (areaResult.error || !areaResult.data) throw areaResult.error

  const coursePayload: Record<string, any> = {
    members_area_id: areaResult.data.id,
    product_id: product.id,
    title: product.name,
    description: product.description || '',
    cover_url: product.imageUrl
  }

  let courseResult = await supabase
    .from('courses')
    .insert(coursePayload)
    .select('*')
    .single()

  if (courseResult.error && courseResult.error.message.includes('product_id')) {
    delete coursePayload.product_id
    courseResult = await supabase
      .from('courses')
      .insert(coursePayload)
      .select('*')
      .single()
  }

  if (courseResult.error || !courseResult.data) throw courseResult.error

  product.membersAreaId = areaResult.data.id
  product.courseId = courseResult.data.id
}

const ensureProductCourseFallback = async (product: ProductDetails, payload: CreateProductPayload = {}) => {
  if (payload.membersAreaMode === 'external' || payload.deliveryType !== 'club') return

  if (payload.membersAreaMode === 'existing' && payload.existingMembersAreaId) {
    const course = await createCourse({
      membersAreaId: payload.existingMembersAreaId,
      title: product.name,
      description: product.description
    })

    product.membersAreaId = payload.existingMembersAreaId
    product.courseId = `${course?.title || product.name}`
    return
  }

  const area = await createMembersArea({
    name: product.name,
    coverUrl: product.imageUrl
  })

  if (!area) return

  const course = await createCourse({
    membersAreaId: area.id,
    title: product.name,
    description: product.description
  })

  product.membersAreaId = area.id
  product.courseId = area.courseId || `${course?.title || product.name}`
}

export const listProducts = async () => {
  try {
    const supabase = getSupabaseClient()
    if (!supabase) return fallbackProducts()

	    const { data, error } = await supabase
	      .from('products')
	      .select('*')
	      .order('created_at', { ascending: false })

	    if (error) return fallbackProducts()

	    const relations = await loadProductRelations(data.map((product) => product.id))
	    return data.map((product) => mapProductFromSupabase(product, relations[product.id]))
	  } catch {
	    return fallbackProducts()
  }
}

export const getProductById = async (id: string) => {
  try {
    const supabase = getSupabaseClient()
    if (!supabase) return productsStore.find((product) => product.id === id)

	    const { data, error } = await supabase
	      .from('products')
	      .select('*')
	      .eq('id', id)
	      .maybeSingle()

	    if (error) return productsStore.find((product) => product.id === id)
	    if (!data) return undefined

	    const relations = await loadProductRelations([data.id])
	    return mapProductFromSupabase(data, relations[data.id])
	  } catch {
	    return productsStore.find((product) => product.id === id)
  }
}

export const createProduct = async (payload: CreateProductPayload = {}) => {
  try {
    const supabase = getSupabaseClient()
    if (supabase) {
      const [{ data: userData }, currentWorkspace] = await Promise.all([
        supabase.auth.getUser(),
        getCurrentWorkspace()
      ])

      const productPayload: Record<string, any> = {
          name: payload.name ?? 'Novo produto',
          description: payload.description ?? '',
          price: parseSupabasePrice(payload.price),
          currency: payload.currency ?? 'BRL',
          status: payload.status ?? 'Rascunho',
          type: payload.type ?? (payload.deliveryType === 'external' ? 'Pagamento' : 'Produto digital'),
          sales: payload.sales ?? 0,
          image_url: payload.imageUrl
      }

      if (currentWorkspace?.id) productPayload.workspace_id = currentWorkspace.id
      if (userData.user?.id) {
        productPayload.owner_id = userData.user.id
        productPayload.user_id = userData.user.id
      }

	    let { data, error } = await supabase
	      .from('products')
        .insert(productPayload)
	        .select('*')
	        .single()

      if (error && /workspace_id|owner_id/i.test(String(error.message || ''))) {
        delete productPayload.workspace_id
        delete productPayload.owner_id
        ;({ data, error } = await supabase
          .from('products')
          .insert(productPayload)
          .select('*')
          .single())
      }

	      if (!error && data) {
	        const product = mapProductFromSupabase(data)
        if (userData.user?.id) {
          try {
            await supabase
              .from('product_members')
              .upsert({
                product_id: product.id,
                user_id: userData.user.id,
                role: 'owner'
              }, { onConflict: 'product_id,user_id' })
          } catch {
            // Compatibilidade quando a migration contextual ainda nao foi aplicada.
          }
        }
        try {
          await ensureProductCourseInSupabase(product, payload)
        } catch {
          // Produto continua criado mesmo se o curso/area cair no fallback.
        }
        try {
          await ensureDefaultOfferInSupabase(product)
        } catch {
          // O checkout ainda resolve a oferta default pelo productId se a insercao falhar.
        }
        return product
      }
    }
  } catch {
    // fallback abaixo
  }

  const product: ProductDetails = {
    id: createMockId(),
    name: payload.name ?? 'Novo produto mockado',
    description: payload.description ?? '',
    price: payload.price ?? 'R$ 0,00',
    currency: payload.currency ?? 'BRL',
    status: payload.status ?? 'Rascunho',
    type: payload.type ?? (payload.deliveryType === 'external' ? 'Pagamento' : 'Produto digital'),
    sales: payload.sales ?? 0,
    imageUrl: payload.imageUrl
  }

  productsStore.unshift(product)
  await ensureProductCourseFallback(product, payload)
  return product
}

export const updateProduct = async (id: string, payload: UpdateProductPayload = {}) => {
  try {
    const supabase = getSupabaseClient()
    if (supabase) {
      const productUpdate: Record<string, any> = {}
      if (payload.name !== undefined) productUpdate.name = payload.name
      if (payload.description !== undefined) productUpdate.description = payload.description
      if (payload.price !== undefined) productUpdate.price = parsePrice(payload.price)
      if (payload.currency !== undefined) productUpdate.currency = payload.currency
      if (payload.status !== undefined) productUpdate.status = payload.status
      if (payload.type !== undefined) productUpdate.type = payload.type
      if (payload.sales !== undefined) productUpdate.sales = payload.sales
      if (payload.imageUrl !== undefined) productUpdate.image_url = payload.imageUrl

      if (Object.keys(productUpdate).length) {
        const { error } = await supabase.from('products').update(productUpdate).eq('id', id)
        if (error) throw error
      }

      if (payload.settings) {
        const settingsPayload: Record<string, any> = {
          product_id: id,
          payment_method: payload.settings.paymentMethod,
          installments: payload.settings.installments,
          card_statement: payload.settings.cardStatement,
          boleto_validity_days: payload.settings.boletoValidityDays,
          two_cards_enabled: Boolean(payload.settings.twoCardsEnabled),
          card_pix_enabled: Boolean(payload.settings.cardPixEnabled),
          smart_installments_enabled: Boolean(payload.settings.smartInstallmentsEnabled),
          repeat_email_enabled: Boolean(payload.settings.repeatEmailEnabled),
          collect_address_enabled: Boolean(payload.settings.collectAddressEnabled),
          collect_instagram_enabled: Boolean(payload.settings.collectInstagramEnabled),
          auto_currency_enabled: Boolean(payload.settings.autoCurrencyEnabled),
          thank_you_enabled: Boolean(payload.settings.thankYouEnabled),
          thank_you_url: payload.settings.thankYouUrl || null,
          upsell_settings: payload.settings.upsellSettings || {}
        }

        let settingsResult = await supabase
          .from('product_settings')
          .upsert(settingsPayload, { onConflict: 'product_id' })

        if (settingsResult.error) throw settingsResult.error
      }

      const updatedForOffer = await getProductById(id)
      if (updatedForOffer) {
        await ensureDefaultOfferInSupabase({
          ...updatedForOffer,
          settings: {
            ...(updatedForOffer.settings || {}),
            ...(payload.settings || {}),
            paymentMethods: payload.settings?.paymentMethods || paymentMethodsFromSetting(payload.settings?.paymentMethod || updatedForOffer.settings?.paymentMethod)
          }
        })
      }

      const updated = await getProductById(id)
      if (updated) return updated
    }
  } catch {
    // fallback abaixo
  }

  const product = productsStore.find((item) => item.id === id)
  if (!product) return undefined

  Object.assign(product, payload)
  if (payload.settings) {
    productSettingsStore[id] = { ...productSettingsStore[id], ...payload.settings }
    product.settings = productSettingsStore[id]
  }
  return product
}

export const duplicateProduct = async (id: string) => {
  const source = await getProductById(id)
  if (!source) return undefined

  return createProduct({
    ...source,
    name: `${source.name} (cópia)`,
    status: 'Rascunho'
  })
}

export const deleteProduct = async (id: string) => {
  const product = productsStore.find((item) => item.id === id) || await getProductById(id)

  try {
    await $fetch(`/api/products/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      query: {
        courseId: product?.courseId,
        membersAreaId: product?.membersAreaId
      }
    })

    removeProductFromLocalStore(id)
    return true
  } catch {
    // tenta a exclusao direta/fallback abaixo
  }

  try {
    const supabase = getSupabaseClient()
    if (supabase) {
      const courseIds = new Set<string>()
      const membersAreaIds = new Set<string>()

      const { data: courses } = await supabase
        .from('courses')
        .select('id, members_area_id')
        .eq('product_id', id)

      courses?.forEach((course) => {
        if (course.id) courseIds.add(course.id)
        if (course.members_area_id) membersAreaIds.add(course.members_area_id)
      })

      const { data: areas } = await supabase
        .from('members_areas')
        .select('id')
        .eq('product_id', id)

      areas?.forEach((area) => {
        if (area.id) membersAreaIds.add(area.id)
      })

      if (product?.courseId) courseIds.add(product.courseId)
      if (product?.membersAreaId) membersAreaIds.add(product.membersAreaId)

      if (courseIds.size) {
        await supabase.from('courses').delete().in('id', Array.from(courseIds))
      } else {
        await supabase.from('courses').delete().eq('product_id', id)
      }

      const { error } = await supabase.from('products').delete().eq('id', id)
      if (!error) {
        for (const membersAreaId of membersAreaIds) {
          const { count, error: countError } = await supabase
            .from('courses')
            .select('id', { count: 'exact', head: true })
            .eq('members_area_id', membersAreaId)

          if (!countError && Number(count || 0) === 0) {
            await supabase.from('members_areas').delete().eq('id', membersAreaId)
          }
        }

        removeProductFromLocalStore(id)
        return true
      }
    }
  } catch {
    // fallback abaixo
  }

  const hadLocalProduct = productsStore.some((product) => product.id === id)
  removeProductFromLocalStore(id)
  if (!hadLocalProduct && !product) return false
  if (product?.membersAreaId || product?.courseId) {
    await deleteCourseAndMaybeMembersArea({
      courseId: product.courseId,
      membersAreaId: product.membersAreaId
    })
  }
  return true
}
