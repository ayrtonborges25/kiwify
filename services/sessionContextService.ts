export type SessionContext = 'student' | 'producer'

const contextKey = 'kiwify:last_context'

export const getLastContext = (): SessionContext | null => {
  if (!process.client) return null
  const value = localStorage.getItem(contextKey)
  return value === 'producer' || value === 'student' ? value : null
}

export const setLastContext = (context: SessionContext) => {
  if (!process.client) return
  localStorage.setItem(contextKey, context)
}

export const resolvePostLoginRedirect = (redirect?: string | null) => {
  const explicitRedirect = String(redirect || '').trim()
  if (explicitRedirect) return explicitRedirect
  return getLastContext() === 'producer' ? '/dashboard' : '/courses'
}
