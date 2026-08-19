import { useContext } from 'react'
import { ToastContext, useToast, ToastProvider } from '../lib/toastStore'
import './Toast.css'

export function ToastContainer() {
  const context = useContext(ToastContext)
  if (!context) return null

  const { toasts, remove } = context

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`toast toast--${toast.type}`}
          role="alert"
        >
          <div className="toast__content">
            <span className="toast__message">{toast.message}</span>
            <button
              className="toast__close"
              onClick={() => remove(toast.id)}
              aria-label="Dismiss notification"
            >
              ✕
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
