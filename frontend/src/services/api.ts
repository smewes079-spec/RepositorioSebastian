import axios from 'axios'
import type { Task, TaskCreate, TaskUpdate, DailySummary, Notification, WeeklyReport, EmailConfig } from '../types'

const api = axios.create({ baseURL: '/api' })

export const taskApi = {
  list: (params?: { status?: string; priority?: string; date?: string }) =>
    api.get<Task[]>('/tasks', { params }).then(r => r.data),

  create: (task: TaskCreate) =>
    api.post<Task>('/tasks', task).then(r => r.data),

  update: (id: number, update: TaskUpdate) =>
    api.patch<Task>(`/tasks/${id}`, update).then(r => r.data),

  delete: (id: number) =>
    api.delete(`/tasks/${id}`),

  get: (id: number) =>
    api.get<Task>(`/tasks/${id}`).then(r => r.data),
}

export const summaryApi = {
  daily: () =>
    api.get<DailySummary>('/summary/daily').then(r => r.data),
}

export const reportApi = {
  weekly: () =>
    api.get<WeeklyReport>('/reports/weekly').then(r => r.data),

  history: () =>
    api.get<WeeklyReport[]>('/reports/history').then(r => r.data),
}

export const notificationApi = {
  list: (unreadOnly = false) =>
    api.get<Notification[]>('/notifications', { params: { unread_only: unreadOnly } }).then(r => r.data),

  markRead: (id: number) =>
    api.patch(`/notifications/${id}/read`),

  markAllRead: () =>
    api.patch('/notifications/read-all'),

  checkReminders: () =>
    api.post('/notifications/check-reminders'),
}

export const emailApi = {
  getConfig: () =>
    api.get<EmailConfig | null>('/email/config').then(r => r.data),

  saveConfig: (config: { email: string; password: string; imap_server: string; imap_port: number; use_ssl: boolean }) =>
    api.post<EmailConfig>('/email/config', config).then(r => r.data),

  sync: () =>
    api.post<{ synced: number; new_tasks: number; errors: string[] }>('/email/sync').then(r => r.data),

  deleteConfig: () =>
    api.delete('/email/config'),
}
