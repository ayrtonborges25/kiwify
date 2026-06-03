import { requireAuth, requireStudentAccess } from '~/services/authService'

export default defineNuxtRouteMiddleware(async (to) => {
  if (process.server) return
  if (!to.path.startsWith('/club=')) return

  const clubId = to.path.slice('/club='.length)
  const accessByClub = useState<Record<string, boolean>>('club-access:by-club', () => ({}))
  delete accessByClub.value[clubId]

  if (to.query.editor === '1') {
    accessByClub.value[clubId] = true
    return
  }

  const auth = await requireAuth()
  if (!auth) {
    return navigateTo(`/student/login?clubId=${encodeURIComponent(clubId)}&redirect=${encodeURIComponent(to.fullPath)}`)
  }

  accessByClub.value[clubId] = await requireStudentAccess(clubId)
})
