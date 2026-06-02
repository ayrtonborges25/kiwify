import { requireAuth } from '~/services/authService'
import { getLastContext } from '~/services/sessionContextService'

const adminPaths = [
  '/dashboard',
  '/products',
  '/sales',
  '/members-area',
  '/checkout-builder',
  '/finance',
  '/reports',
  '/subscriptions',
  '/team-members',
  '/apps',
  '/marketplace',
  '/myaffiliates'
]

const authPaths = ['/login', '/register', '/student/login', '/student/register', '/forgot-password']
const studentPaths = ['/courses', '/myprofile']

const isAdminPath = (path: string) => adminPaths.some((adminPath) => path === adminPath || path.startsWith(`${adminPath}/`))
const isAuthPath = (path: string) => authPaths.some((authPath) => path === authPath)
const isStudentPath = (path: string) => studentPaths.some((studentPath) => path === studentPath || path.startsWith(`${studentPath}/`))

export default defineNuxtRouteMiddleware(async (to) => {
  if (process.server) return

  const path = to.path
  if (!isAdminPath(path) && !isAuthPath(path) && !isStudentPath(path)) return

  const auth = await requireAuth()

  if (isAuthPath(path)) {
    if (!auth) return
    const redirect = typeof to.query.redirect === 'string' ? to.query.redirect : ''
    if (redirect) return navigateTo(redirect)
    return navigateTo(getLastContext() === 'producer' ? '/dashboard' : '/courses')
  }

  if (isAdminPath(path)) {
    if (!auth) return navigateTo(`/login?redirect=${encodeURIComponent(to.fullPath)}`)
  }

  if (isStudentPath(path)) {
    if (!auth) return navigateTo(`/student/login?redirect=${encodeURIComponent(to.fullPath)}`)
  }
})
