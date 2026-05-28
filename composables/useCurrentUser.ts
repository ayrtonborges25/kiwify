import { getCurrentUser, getCurrentUserSnapshot } from '~/services/userService'

export function useCurrentUser() {
  const currentUserState = ref(getCurrentUserSnapshot())

  const refreshCurrentUser = async () => {
    currentUserState.value = await getCurrentUser()
    return currentUserState.value
  }

  void refreshCurrentUser()

  return {
    currentUser: readonly(currentUserState),
    refreshCurrentUser
  }
}
