import { useAppStore, type Toast as ToastType } from '@/stores/app.store'
import { CheckCircle, AlertCircle, AlertTriangle, Info, X } from 'lucide-react'

const icons: Record<string, typeof CheckCircle> = {
  success: CheckCircle,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
}

function ToastItem({ toast }: { toast: ToastType }) {
  const removeToast = useAppStore((s) => s.removeToast)
  const Icon = icons[toast.type]

  return (
    <div className={`toast toast-${toast.type}`}>
      <span className="toast-icon">
        <Icon size={18} />
      </span>
      <div className="toast-content">
        <div className="toast-title">{toast.title}</div>
        {toast.message && <div className="toast-message">{toast.message}</div>}
      </div>
      <button className="toast-close" onClick={() => removeToast(toast.id)} aria-label="Dismiss">
        <X size={14} />
      </button>
    </div>
  )
}

export default function ToastContainer() {
  const toasts = useAppStore((s) => s.toasts)

  if (toasts.length === 0) return null

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  )
}
