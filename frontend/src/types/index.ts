export type PriorityLevel = 'critical' | 'important' | 'urgent' | 'low'
export type TaskStatus = 'pending' | 'in_progress' | 'completed' | 'cancelled'
export type TaskSource = 'manual' | 'email' | 'calendar'

export interface Task {
  id: number
  title: string
  description?: string
  priority: PriorityLevel
  status: TaskStatus
  source: TaskSource
  is_urgent: boolean
  is_important: boolean
  due_date?: string
  reminder_at?: string
  completed_at?: string
  email_from?: string
  tags?: string
  estimated_minutes?: number
  actual_minutes?: number
  progress: number
  created_at: string
  updated_at: string
}

export interface TaskCreate {
  title: string
  description?: string
  is_urgent: boolean
  is_important: boolean
  due_date?: string
  reminder_at?: string
  tags?: string
  estimated_minutes?: number
  source?: TaskSource
}

export interface TaskUpdate {
  title?: string
  description?: string
  is_urgent?: boolean
  is_important?: boolean
  status?: TaskStatus
  due_date?: string
  reminder_at?: string
  tags?: string
  estimated_minutes?: number
  actual_minutes?: number
  progress?: number
}

export interface DailySummary {
  date: string
  total_tasks: number
  completed: number
  in_progress: number
  pending: number
  critical_tasks: Task[]
  important_tasks: Task[]
  urgent_tasks: Task[]
  completion_rate: number
  overdue_tasks: number
}

export interface Notification {
  id: number
  task_id?: number
  title: string
  message: string
  is_read: boolean
  notification_type: string
  created_at: string
}

export interface WeeklyReport {
  id: number
  week_start: string
  week_end: string
  total_tasks: number
  completed_tasks: number
  completion_rate: number
  avg_completion_time: number
  most_productive_day?: string
  suggestions?: string
  report_data?: string
  created_at: string
}

export interface EmailConfig {
  id: number
  email: string
  imap_server: string
  imap_port: number
  use_ssl: boolean
  last_sync?: string
  is_active: boolean
}
