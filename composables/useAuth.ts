import {
  getCurrentUser,
  getSession,
  ensurePersonalWorkspace,
  requireAdmin,
  requireAuth,
  requireStudentAccess,
  signIn,
  signOut,
  signUp
} from '~/services/authService'

export const useAuth = () => {
  const session = useState<Awaited<ReturnType<typeof getSession>>>('auth:session', () => null)
  const user = useState<Awaited<ReturnType<typeof getCurrentUser>>>('auth:user', () => null)
  const loading = useState('auth:loading', () => false)

  const refresh = async () => {
    loading.value = true
    try {
      session.value = await getSession()
      user.value = await getCurrentUser()
      return { session: session.value, user: user.value }
    } finally {
      loading.value = false
    }
  }

  return {
    session: readonly(session),
    user: readonly(user),
    loading: readonly(loading),
    refresh,
    signUp,
    signIn,
    signOut,
    getSession,
    getCurrentUser,
    requireAuth,
    requireAdmin,
    ensurePersonalWorkspace,
    requireStudentAccess
  }
}
