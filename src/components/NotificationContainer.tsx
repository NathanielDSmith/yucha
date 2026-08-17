import { useNotification } from '../lib/NotificationContext'
import { NotificationToast } from './NotificationToast'
import './NotificationContainer.css'

export function NotificationContainer() {
  const { notifications, dismissNotification } = useNotification()

  return (
    <div className="notification-container">
      {notifications.map((notification) => (
        <NotificationToast
          key={notification.id}
          {...notification}
          onDismiss={dismissNotification}
        />
      ))}
    </div>
  )
}
