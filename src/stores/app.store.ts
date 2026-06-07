import { create } from 'zustand'

export interface Toast {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
}

interface AppState {
  currentPage: string
  isLoading: boolean
  toasts: Toast[]
  navigate: (page: string) => void
  setLoading: (loading: boolean) => void
  addToast: (toast: Omit<Toast, 'id'>) => void
  removeToast: (id: string) => void
}

let toastId = 0

export const useAppStore = create<AppState>((set) => ({
  currentPage: 'dashboard',
  isLoading: false,
  toasts: [],

  navigate: (page: string) => set({ currentPage: page }),

  setLoading: (loading: boolean) => set({ isLoading: loading }),

  addToast: (toast) => {
    const id = `toast-${++toastId}`
    set((state) => ({
      toasts: [...state.toasts, { ...toast, id }],
    }))
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }))
    }, 5000)
  },

  removeToast: (id: string) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}))
