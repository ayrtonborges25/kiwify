import { currentUser as mockCurrentUser } from '~/data/user'
import { normalizeAccountDisplayName } from '~/utils/accountDisplay'
import { getSupabaseClient } from '~/utils/supabase'

const currentUserStore = { ...mockCurrentUser }

const mapProfileFromSupabase = (row: Record<string, any>, workspaceName = '') => {
  const fallbackName = String(row.email || '').split('@')[0] || currentUserStore.name
  const displayName = normalizeAccountDisplayName(row.name || workspaceName, fallbackName)

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
        .select('workspaces(name, owner_id)')
        .eq('user_id', userId)
        .limit(1)
        .maybeSingle()
    ])

    if (error || !data) return currentUserStore

    const workspace = Array.isArray(membership?.workspaces) ? membership?.workspaces[0] : membership?.workspaces

    const ownedWorkspaceName = workspace?.owner_id === userId ? workspace?.name || '' : ''

    return mapProfileFromSupabase(data, ownedWorkspaceName)
  } catch {
    return currentUserStore
  }
}
