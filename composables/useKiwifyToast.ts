type KiwifyToastType = 'success' | 'error'

type KiwifyToast = {
  id: number
  message: string
  type: KiwifyToastType
}

const kiwifyToasts = ref<KiwifyToast[]>([])
const kiwifyToastTimers = new Map<number, ReturnType<typeof setTimeout>>()
let kiwifyToastId = 0

export const useKiwifyToast = () => {
  const removeToast = (id: number) => {
    const timer = kiwifyToastTimers.get(id)
    if (timer) clearTimeout(timer)
    kiwifyToastTimers.delete(id)
    kiwifyToasts.value = kiwifyToasts.value.filter((toast) => toast.id !== id)
  }

  const showToast = (message: string, type: KiwifyToastType = 'success', timeout = 4500) => {
    const id = ++kiwifyToastId
    kiwifyToasts.value = [{ id, message, type }, ...kiwifyToasts.value].slice(0, 3)
    kiwifyToastTimers.set(id, setTimeout(() => removeToast(id), timeout))
    return id
  }

  const showSuccessToast = (message = 'As alterações do produto foram salvas') => showToast(message, 'success')
  const showErrorToast = (message: string) => showToast(message, 'error', 6500)

  return {
    toasts: kiwifyToasts,
    showToast,
    showSuccessToast,
    showErrorToast,
    removeToast
  }
}
