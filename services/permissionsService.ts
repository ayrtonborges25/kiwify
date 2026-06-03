import { getSupabaseClient } from '~/utils/supabase'

export type WorkspaceRole = 'owner' | 'admin' | 'support' | 'viewer'
export type ProductMemberRole = 'owner' | 'coproducer' | 'affiliate' | 'editor' | 'support'

export type UserWorkspace = {
  id: string
  name: string
  ownerId?: string
  role: WorkspaceRole
}

const normalizeEmail = (email?: string | null) => String(email || '').trim().toLowerCase()

const getSupabaseUser = async () => {
  const supabase = getSupabaseClient()
  if (!supabase) return null
  const { data, error } = await supabase.auth.getUser()
  if (error || !data.user) return null
  return data.user
}

const callBooleanRpc = async (name: string, params: Record<string, string>) => {
  const supabase = getSupabaseClient()
  if (!supabase) return false

  const { data, error } = await supabase.rpc(name, params)
  if (error) return false
  return Boolean(data)
}

const isLegacyAdmin = async () => {
  const supabase = getSupabaseClient()
  const user = await getSupabaseUser()
  if (!supabase || !user?.id) return false

  const { data } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  return data?.role === 'admin'
}

export const isPlatformSuperAdmin = async () => {
  const supabase = getSupabaseClient()
  const user = await getSupabaseUser()
  if (!supabase || !user?.id) return false

  let { data, error } = await supabase
    .from('profiles')
    .select('platform_role')
    .eq('id', user.id)
    .maybeSingle()

  if (error && /platform_role/i.test(String(error.message || ''))) return false
  return data?.platform_role === 'super_admin'
}

export const listUserWorkspaces = async (): Promise<UserWorkspace[]> => {
  const supabase = getSupabaseClient()
  const user = await getSupabaseUser()
  if (!supabase || !user?.id) return []

  const { data, error } = await supabase
    .from('workspace_members')
    .select('role, workspaces(id, name, owner_id)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })

  if (error || !data?.length) return []

  return data
    .map((membership: Record<string, any>) => {
      const workspace = Array.isArray(membership.workspaces) ? membership.workspaces[0] : membership.workspaces
      if (!workspace?.id) return null
      return {
        id: workspace.id,
        name: workspace.name || 'Workspace',
        ownerId: workspace.owner_id || undefined,
        role: membership.role as WorkspaceRole
      }
    })
    .filter(Boolean) as UserWorkspace[]
}

export const getCurrentWorkspace = async () => {
  const workspaces = await listUserWorkspaces()
  return workspaces[0] || null
}

export const canAccessAdmin = async () => {
  if (await callBooleanRpc('can_access_admin', {})) return true
  const workspaces = await listUserWorkspaces()
  if (workspaces.length) return true
  return isLegacyAdmin()
}

export const canAccessWorkspace = async (workspaceId?: string | null) => {
  if (!workspaceId) return false
  if (await callBooleanRpc('can_access_workspace', { target_workspace_id: workspaceId })) return true
  if (await isLegacyAdmin()) return true
  const workspaces = await listUserWorkspaces()
  return workspaces.some((workspace) => workspace.id === workspaceId)
}

const getProductContext = async (productId?: string | null) => {
  const supabase = getSupabaseClient()
  if (!supabase || !productId) return null

  const { data, error } = await supabase
    .from('products')
    .select('id, user_id, owner_id, workspace_id')
    .eq('id', productId)
    .maybeSingle()

  if (error || !data?.id) return null
  return data
}

const getProductMemberRole = async (productId?: string | null): Promise<ProductMemberRole | null> => {
  const supabase = getSupabaseClient()
  const user = await getSupabaseUser()
  if (!supabase || !user?.id || !productId) return null

  const { data, error } = await supabase
    .from('product_members')
    .select('role')
    .eq('product_id', productId)
    .eq('user_id', user.id)
    .maybeSingle()

  if (error || !data?.role) return null
  return data.role as ProductMemberRole
}

const getWorkspaceRole = async (workspaceId?: string | null): Promise<WorkspaceRole | null> => {
  if (!workspaceId) return null
  const workspaces = await listUserWorkspaces()
  return workspaces.find((workspace) => workspace.id === workspaceId)?.role || null
}

export const canManageProduct = async (productId?: string | null) => {
  if (!productId) return false
  if (await callBooleanRpc('can_manage_product', { target_product_id: productId })) return true
  if (await isLegacyAdmin()) return true

  const [user, product, productRole] = await Promise.all([
    getSupabaseUser(),
    getProductContext(productId),
    getProductMemberRole(productId)
  ])

  if (!user || !product) return false
  if (product.owner_id === user.id || product.user_id === user.id) return true
  if (productRole && ['owner', 'coproducer', 'editor', 'support'].includes(productRole)) return true

  const workspaceRole = await getWorkspaceRole(product.workspace_id)
  return Boolean(workspaceRole && ['owner', 'admin', 'support'].includes(workspaceRole))
}

export const canEditProduct = async (productId?: string | null) => {
  if (!productId) return false
  if (await callBooleanRpc('can_edit_product', { target_product_id: productId })) return true
  if (await isLegacyAdmin()) return true

  const [user, product, productRole] = await Promise.all([
    getSupabaseUser(),
    getProductContext(productId),
    getProductMemberRole(productId)
  ])

  if (!user || !product) return false
  if (product.owner_id === user.id || product.user_id === user.id) return true
  if (productRole && ['owner', 'editor', 'support'].includes(productRole)) return true

  const workspaceRole = await getWorkspaceRole(product.workspace_id)
  return Boolean(workspaceRole && ['owner', 'admin'].includes(workspaceRole))
}

export const canViewSales = async (workspaceId?: string | null) => canAccessWorkspace(workspaceId)

export const canAccessMembersArea = async (membersAreaId?: string | null) => {
  const supabase = getSupabaseClient()
  if (!supabase || !membersAreaId) return false
  if (await callBooleanRpc('can_access_members_area', { target_members_area_id: membersAreaId })) return true
  if (await isLegacyAdmin()) return true

  const { data, error } = await supabase
    .from('members_areas')
    .select('id, user_id, product_id, products(workspace_id)')
    .eq('id', membersAreaId)
    .maybeSingle()

  if (error || !data?.id) return false
  const user = await getSupabaseUser()
  if (user?.id && data.user_id === user.id) return true
  if (await canManageProduct(data.product_id)) return true

  const product = Array.isArray(data.products) ? data.products[0] : data.products
  return canAccessWorkspace(product?.workspace_id)
}

export const canAccessClub = async (clubId?: string | null) => {
  const supabase = getSupabaseClient()
  const user = await getSupabaseUser()
  const email = normalizeEmail(user?.email)
  if (!supabase || !user?.id || !email || !clubId) return false

  if (await canAccessMembersArea(clubId)) return true

  const { data: deliveries, error } = await supabase
    .from('product_deliveries')
    .select('id, user_id, product_id, customer_email, access_url, status')
    .or(`customer_email.ilike.${email},user_id.eq.${user.id}`)
    .eq('status', 'active')

  if (error || !deliveries?.length) return false

  const directAccessUrl = `/club=${clubId}`
  const approvedDeliveries = deliveries.filter((delivery: Record<string, any>) => {
    return (
      (normalizeEmail(delivery.customer_email) === email || delivery.user_id === user.id) &&
      String(delivery.status || '').toLowerCase() === 'active'
    )
  })

  if (approvedDeliveries.some((delivery: Record<string, any>) => String(delivery.access_url || '') === directAccessUrl)) {
    return true
  }

  const productIds = approvedDeliveries
    .map((delivery: Record<string, any>) => delivery.product_id)
    .filter(Boolean)

  if (!productIds.length) return false

  const { data: area } = await supabase
    .from('courses')
    .select('id')
    .eq('members_area_id', clubId)
    .in('product_id', productIds)
    .maybeSingle()

  return Boolean(area)
}
