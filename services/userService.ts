import { currentUser as mockCurrentUser } from '~/data/user'
import { getSupabaseClient } from '~/utils/supabase'

const currentUserStore = { ...mockCurrentUser }

const mapProfileFromSupabase = (row: Record<string, any>) => ({
  ...currentUserStore,
  id: row.id || currentUserStore.id,
  name: row.name || currentUserStore.name,
  company: row.company || currentUserStore.company,
  initials: row.initials || currentUserStore.initials,
  avatarUrl: row.avatar_url || currentUserStore.avatarUrl
})

export const getCurrentUserSnapshot = () => currentUserStore

export const getCurrentUser = async () => {
  try {
    const supabase = getSupabaseClient()
    if (!supabase) return currentUserStore

    const { data: authData } = await supabase.auth.getUser()
    const userId = authData.user?.id

    if (!userId) return currentUserStore

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()

    if (error || !data) return currentUserStore

    return mapProfileFromSupabase(data)
  } catch {
    return currentUserStore
  }
}
