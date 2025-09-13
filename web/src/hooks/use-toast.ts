import { useToast as useSonnerToast } from 'sonner'

export function useToast() {
  const toast = useSonnerToast()

  return {
    toast: (
      message: string,
      options?: {
        description?: string
        action?: {
          label: string
          onClick: () => void
        }
        cancel?: {
          label: string
          onClick?: () => void
        }
        duration?: number
      }
    ) => {
      return toast(message, {
        description: options?.description,
        action: options?.action,
        cancel: options?.cancel,
        duration: options?.duration || 4000,
      })
    },
    success: (
      message: string,
      options?: { description?: string; duration?: number }
    ) => {
      return toast.success(message, {
        description: options?.description,
        duration: options?.duration || 4000,
      })
    },
    error: (
      message: string,
      options?: { description?: string; duration?: number }
    ) => {
      return toast.error(message, {
        description: options?.description,
        duration: options?.duration || 6000,
      })
    },
    warning: (
      message: string,
      options?: { description?: string; duration?: number }
    ) => {
      return toast.warning(message, {
        description: options?.description,
        duration: options?.duration || 4000,
      })
    },
    info: (
      message: string,
      options?: { description?: string; duration?: number }
    ) => {
      return toast.info(message, {
        description: options?.description,
        duration: options?.duration || 4000,
      })
    },
    loading: (message: string, options?: { description?: string }) => {
      return toast.loading(message, {
        description: options?.description,
      })
    },
    dismiss: (toastId?: string | number) => {
      toast.dismiss(toastId)
    },
    promise: <T>(
      promise: Promise<T>,
      {
        loading,
        success,
        error,
      }: {
        loading: string
        success: string | ((data: T) => string)
        error: string | ((error: any) => string)
      }
    ) => {
      return toast.promise(promise, {
        loading,
        success,
        error,
      })
    },
  }
}
