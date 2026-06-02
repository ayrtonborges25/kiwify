import { currentUser as mockCurrentUser } from '~/data/user'
import { normalizeAccountDisplayName } from '~/utils/accountDisplay'
import { getSupabaseClient } from '~/utils/supabase'

const currentUserStore = { ...mockCurrentUser }

const mapProfileFromSupabase = (row: Record<string, any>, workspaceName = '') => {
  const displayName = normalizeAccountDisplayName(workspaceName || row.name || currentUserStore.name)

  return {
    ...currentUserStore,
    id: row.id || currentUserStore.id,
    email: row.email || currentUserStore.email,
    name: displayName,
    company: displayName,
    initials: row.initials || currentUserStore.initials,
    avatarUrl: row.avatar_url || ''
  }
}

export const getCurrentUserSnapshot = () => currentUserStore

export const getCurrentUser = async () => {
  try {
    const supabase = getSupabaseClient()
    if (!supabase) return currentUserStore

    const { data: authData } = await supabase.auth.getUser()
    const userId = authData.user?.id

    if (!userId) return currentUserStore

    const [{ data, error }, { data: membership }] = await Promise.all([
      supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle(),
      supabase
        .from('workspace_members')
        .select('workspaces(name)')
        .eq('user_id', userId)
        .limit(1)
        .maybeSingle()
    ])

    if (error || !data) return currentUserStore

    const workspace = Array.isArray(membership?.workspaces) ? membership?.workspaces[0] : membership?.workspaces

    return mapProfileFromSupabase(data, workspace?.name || '')
  } catch {
    return currentUserStore
  }
}
