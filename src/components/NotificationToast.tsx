import { useEffect, useState } from 'react'
import './NotificationToast.css'

export type NotificationType = 'success' | 'info' | 'warning'

export interface Notification {
  id: string
  message: string
  type: NotificationType
  duration?: number
}

interface NotificationToastProps extends Notification {
  onDismiss: (id: string) => void
}

export function NotificationToast({ id, message, type, duration = 4000, onDismiss }: NotificationToastProps) {
  useEffect(() => {
    if (duration === 0) return
    const timer = setTimeout(() => onDismiss(id), duration)
    return () => clearTimeout(timer)
  }, [id, duration, onDismiss])

  return (
    <div className={`notification-toast notification-toast--${type}`}>
      <div className="notification-toast__content">
        {type === 'success' && <span className="notification-toast__icon">✓</span>}
        {type === 'info' && <span className="notification-toast__icon">ℹ</span>}
        {type === 'warning' && <span className="notification-toast__icon">!</span>}
        <p className="notification-toast__message">{message}</p>
      </div>
      <button
        onClick={() => onDismiss(id)}
        className="notification-toast__close"
        aria-label="Dismiss notification"
      >
        ✕
      </button>
    </div>
  )
}
