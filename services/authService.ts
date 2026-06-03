import type { Session, User } from '@supabase/supabase-js'
import { canAccessAdmin, canAccessMembersArea } from '~/services/permissionsService'
import { normalizeAccountDisplayName } from '~/utils/accountDisplay'
import { getSupabaseClient } from '~/utils/supabase'

export type AuthProfile = {
  id: string
  email: string
  name: string
  role: 'admin' | 'student' | string
  platformRole?: 'super_admin' | 'user' | string
}

type AuthMetadata = {
  name?: string
  role?: 'admin' | 'student' | string
  [key: string]: unknown
}

const normalizeEmail = (email?: string | null) => String(email || '').trim().toLowerCase()

const workspaceNameForUser = (user: User, metadata: AuthMetadata = {}) => {
  const name = String(metadata.name || user.user_metadata?.name || '').trim()
  if (name) return normalizeAccountDisplayName(name)
  return normalizeAccountDisplayName(normalizeEmail(user.email).split('@')[0])
}

const getProfile = async (user: User | null): Promise<AuthProfile | null> => {
  if (!user) return null
  const supabase = getSupabaseClient()
  if (!supabase) return null

  let { data, error } = await supabase
    .from('profiles')
    .select('id, email, name, role, platform_role')
    .eq('id', user.id)
    .maybeSingle()

  if (error && /platform_role/i.test(String(error.message || ''))) {
    const fallback = await supabase
      .from('profiles')
      .select('id, email, name, role')
      .eq('id', user.id)
      .maybeSingle()
    data = fallback.data
  }

  return {
    id: user.id,
    email: normalizeEmail(data?.email || user.email),
    name: data?.name || String(user.user_metadata?.name || ''),
    role: data?.role || String(user.user_metadata?.role || 'student'),
    platformRole: data?.platform_role || 'user'
  }
}

const upsertProfile = async (user: User, metadata: AuthMetadata = {}) => {
  const supabase = getSupabaseClient()
  if (!supabase) return null

  const profile = {
    id: user.id,
    email: normalizeEmail(user.email),
    name: String(metadata.name || user.user_metadata?.name || ''),
    role: String(metadata.role || user.user_metadata?.role || 'student')
  }

  await supabase.from('profiles').upsert(profile, { onConflict: 'id' })
  await ensurePersonalWorkspace(user, metadata)
  return profile
}

export const ensurePersonalWorkspace = async (user: User, metadata: AuthMetadata = {}) => {
  const supabase = getSupabaseClient()
  if (!supabase || !user.id) return null

  try {
    const { data: existingMembership } = await supabase
      .from('workspace_members')
      .select('workspace_id, role')
      .eq('user_id', user.id)
      .limit(1)
      .maybeSingle()

    if (existingMembership?.workspace_id) return existingMembership

    const { data: workspace, error: workspaceError } = await supabase
      .from('workspaces')
      .insert({
        name: workspaceNameForUser(user, metadata),
        owner_id: user.id
      })
      .select('id')
      .single()

    if (workspaceError || !workspace?.id) return null

    const { data: membership } = await supabase
      .from('workspace_members')
      .insert({
        workspace_id: workspace.id,
        user_id: user.id,
        role: 'owner'
      })
      .select('workspace_id, role')
      .single()

    return membership || null
  } catch {
    return null
  }
}

export const signUp = async (email: string, password: string, metadata: AuthMetadata = {}) => {
  const supabase = getSupabaseClient()
  if (!supabase) throw new Error('Supabase nao configurado.')

  const { data, error } = await supabase.auth.signUp({
    email: normalizeEmail(email),
    password,
    options: {
      data: {
        ...metadata,
        role: metadata.role || 'student'
      }
    }
  })

  if (error) throw error
  if (data.user) await upsertProfile(data.user, metadata)

  return data
}

export const signIn = async (email: string, password: string) => {
  const supabase = getSupabaseClient()
  if (!supabase) throw new Error('Supabase nao configurado.')

  const { data, error } = await supabase.auth.signInWithPassword({
    email: normalizeEmail(email),
    password
  })

  if (error) throw error
  if (data.user) await upsertProfile(data.user, data.user.user_metadata || {})

  return data
}

export const signOut = async () => {
  const supabase = getSupabaseClient()
  if (!supabase) return
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export const getSession = async (): Promise<Session | null> => {
  const supabase = getSupabaseClient()
  if (!supabase) return null

  const { data, error } = await supabase.auth.getSession()
  if (error) return null
  return data.session
}

export const getCurrentUser = async () => {
  const supabase = getSupabaseClient()
  if (!supabase) return null

  const { data, error } = await supabase.auth.getUser()
  if (error || !data.user) return null
  return data.user
}

export const requireAuth = async () => {
  const session = await getSession()
  if (!session?.user) return null
  return {
    session,
    user: session.user,
    profile: await getProfile(session.user)
  }
}

export const requireAdmin = async () => {
  const auth = await requireAuth()
  if (!auth) return null
  return await canAccessAdmin() ? auth : null
}

export const requireStudentAccess = async (clubId: string) => {
  const auth = await requireAuth()
  const email = normalizeEmail(auth?.user.email || auth?.profile?.email)
  if (!auth || !email || !clubId) return false

  const supabase = getSupabaseClient()
  if (!supabase) return false

  if (await canAccessMembersArea(clubId)) return true

  const { data: deliveries, error } = await supabase
    .from('product_deliveries')
    .select('id, user_id, product_id, customer_email, access_url, status')
    .or(`customer_email.ilike.${email},user_id.eq.${auth.user.id}`)
    .eq('status', 'active')

  if (error || !deliveries?.length) return false

  const directAccessUrl = `/club=${clubId}`
  const approvedDeliveries = deliveries.filter((delivery: Record<string, any>) => {
    return (
      (normalizeEmail(delivery.customer_email) === email || delivery.user_id === auth.user.id) &&
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
