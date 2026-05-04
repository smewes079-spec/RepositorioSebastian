import { useEffect, useState, useRef } from 'react'
import { Bell, BellOff, Check, CheckCheck, X } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { notificationApi } from '../services/api'
import type { Notification } from '../types'

const TYPE_COLORS: Record<string, string> = {
  reminder: 'bg-blue-50 border-blue-200',
  overdue: 'bg-red-50 border-red-200',
  success: 'bg-green-50 border-green-200',
  default: 'bg-gray-50 border-gray-200',
}

const TYPE_ICONS: Record<string, string> = {
  reminder: '⏰',
  overdue: '🚨',
  success: '✅',
  default: '🔔',
}

export function NotificationPanel() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  const unread = notifications.filter(n => !n.is_read).length

  const load = () => {
    notificationApi.list().then(setNotifications)
  }

  useEffect(() => {
    load()
    notificationApi.checkReminders()
    const interval = setInterval(() => {
      notificationApi.checkReminders().then(load)
    }, 60_000)
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const markRead = async (id: number) => {
    await notificationApi.markRead(id)
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n))
  }

  const markAllRead = async () => {
    await notificationApi.markAllRead()
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="relative p-2 rounded-xl hover:bg-gray-100 transition-colors"
      >
        {unread > 0 ? <Bell className="w-5 h-5 text-gray-700" /> : <BellOff className="w-5 h-5 text-gray-400" />}
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-12 w-80 bg-white rounded-2xl shadow-2xl border z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b bg-gray-50">
            <h3 className="font-semibold text-gray-900">Notificaciones</h3>
            <div className="flex items-center gap-1">
              {unread > 0 && (
                <button
                  onClick={markAllRead}
                  className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 px-2 py-1 rounded-lg hover:bg-blue-50 transition-colors"
                >
                  <CheckCheck className="w-3.5 h-3.5" /> Leer todas
                </button>
              )}
              <button onClick={() => setOpen(false)} className="p-1 rounded-lg hover:bg-gray-200 transition-colors">
                <X className="w-4 h-4 text-gray-500" />
              </button>
            </div>
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-12 text-center text-gray-400">
                <BellOff className="w-10 h-10 mx-auto mb-2 opacity-40" />
                <p className="text-sm">Sin notificaciones</p>
              </div>
            ) : (
              notifications.map(n => (
                <div
                  key={n.id}
                  className={`flex gap-3 p-3 border-b last:border-0 ${n.is_read ? 'opacity-60' : ''} hover:bg-gray-50 transition-colors`}
                >
                  <span className="text-lg flex-shrink-0">{TYPE_ICONS[n.notification_type] ?? '🔔'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{n.title}</p>
                    <p className="text-xs text-gray-500 line-clamp-2">{n.message}</p>
                    <p className="text-xs text-gray-400 mt-1">
                      {format(new Date(n.created_at), "d MMM HH:mm", { locale: es })}
                    </p>
                  </div>
                  {!n.is_read && (
                    <button
                      onClick={() => markRead(n.id)}
                      className="p-1 rounded-lg hover:bg-blue-50 text-blue-500 flex-shrink-0"
                    >
                      <Check className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
