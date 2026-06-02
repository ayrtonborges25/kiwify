import {
  canAccessAdmin,
  canAccessClub,
  canAccessMembersArea,
  canAccessWorkspace,
  canEditProduct,
  canManageProduct,
  canViewSales,
  getCurrentWorkspace,
  isPlatformSuperAdmin,
  listUserWorkspaces
} from '~/services/permissionsService'

export const usePermissions = () => {
  const workspaces = useState<Awaited<ReturnType<typeof listUserWorkspaces>>>('permissions:workspaces', () => [])
  const currentWorkspace = useState<Awaited<ReturnType<typeof getCurrentWorkspace>>>('permissions:current-workspace', () => null)
  const loading = useState('permissions:loading', () => false)

  const refreshPermissions = async () => {
    loading.value = true
    try {
      workspaces.value = await listUserWorkspaces()
      currentWorkspace.value = workspaces.value[0] || null
      return {
        workspaces: workspaces.value,
        currentWorkspace: currentWorkspace.value
      }
    } finally {
      loading.value = false
    }
  }

  return {
    workspaces: readonly(workspaces),
    currentWorkspace: readonly(currentWorkspace),
    loading: readonly(loading),
    refreshPermissions,
    getCurrentWorkspace,
    listUserWorkspaces,
    canAccessAdmin,
    canAccessWorkspace,
    canManageProduct,
    canEditProduct,
    canViewSales,
    canAccessMembersArea,
    canAccessClub,
    isPlatformSuperAdmin
  }
}
