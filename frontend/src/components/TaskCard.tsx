import { useState } from 'react'
import { CheckCircle, Circle, Clock, Mail, AlertTriangle, ChevronDown, ChevronUp, Trash2, Edit3 } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import type { Task, TaskUpdate } from '../types'

const PRIORITY_CONFIG = {
  critical: { label: 'Crítica', color: 'bg-red-100 text-red-700 border-red-200', dot: 'bg-red-500', border: 'border-l-red-500' },
  important: { label: 'Importante', color: 'bg-blue-100 text-blue-700 border-blue-200', dot: 'bg-blue-500', border: 'border-l-blue-500' },
  urgent: { label: 'Urgente', color: 'bg-amber-100 text-amber-700 border-amber-200', dot: 'bg-amber-500', border: 'border-l-amber-500' },
  low: { label: 'Baja', color: 'bg-gray-100 text-gray-600 border-gray-200', dot: 'bg-gray-400', border: 'border-l-gray-300' },
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  in_progress: 'En progreso',
  completed: 'Completada',
  cancelled: 'Cancelada',
}

interface Props {
  task: Task
  onUpdate: (id: number, data: TaskUpdate) => Promise<void>
  onDelete: (id: number) => Promise<void>
  onEdit: (task: Task) => void
}

export function TaskCard({ task, onUpdate, onDelete, onEdit }: Props) {
  const [expanded, setExpanded] = useState(false)
  const cfg = PRIORITY_CONFIG[task.priority]
  const isCompleted = task.status === 'completed'
  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && !isCompleted

  const toggleComplete = () => {
    onUpdate(task.id, {
      status: isCompleted ? 'pending' : 'completed',
      progress: isCompleted ? task.progress : 100,
    })
  }

  const cycleStatus = () => {
    const cycle: Record<string, 'pending' | 'in_progress' | 'completed'> = {
      pending: 'in_progress',
      in_progress: 'completed',
      completed: 'pending',
    }
    onUpdate(task.id, { status: cycle[task.status] || 'pending' })
  }

  return (
    <div className={`bg-white rounded-xl border border-l-4 ${cfg.border} shadow-sm hover:shadow-md transition-all duration-200 ${isCompleted ? 'opacity-60' : ''}`}>
      <div className="p-4">
        <div className="flex items-start gap-3">
          <button onClick={toggleComplete} className="mt-0.5 flex-shrink-0">
            {isCompleted
              ? <CheckCircle className="w-5 h-5 text-green-500" />
              : <Circle className="w-5 h-5 text-gray-300 hover:text-green-400 transition-colors" />
            }
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className={`font-medium text-gray-900 ${isCompleted ? 'line-through text-gray-400' : ''}`}>
                {task.title}
              </h3>
              <span className={`text-xs px-2 py-0.5 rounded-full border font-medium ${cfg.color}`}>
                {cfg.label}
              </span>
              {task.source === 'email' && (
                <span className="flex items-center gap-1 text-xs text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-200">
                  <Mail className="w-3 h-3" /> Email
                </span>
              )}
              {isOverdue && (
                <span className="flex items-center gap-1 text-xs text-red-600 bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
                  <AlertTriangle className="w-3 h-3" /> Vencida
                </span>
              )}
            </div>

            <div className="flex items-center gap-4 mt-1.5 text-xs text-gray-500">
              {task.due_date && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {format(new Date(task.due_date), "d MMM HH:mm", { locale: es })}
                </span>
              )}
              {task.email_from && (
                <span className="truncate max-w-[200px]">De: {task.email_from}</span>
              )}
              <button
                onClick={cycleStatus}
                className="px-2 py-0.5 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors font-medium text-gray-600"
              >
                {STATUS_LABELS[task.status]}
              </button>
            </div>

            {task.progress > 0 && task.progress < 100 && (
              <div className="mt-2">
                <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                  <span>Progreso</span>
                  <span>{task.progress}%</span>
                </div>
                <div className="w-full bg-gray-100 rounded-full h-1.5">
                  <div
                    className="bg-blue-500 h-1.5 rounded-full transition-all"
                    style={{ width: `${task.progress}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1 flex-shrink-0">
            <button onClick={() => onEdit(task)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors">
              <Edit3 className="w-4 h-4" />
            </button>
            <button onClick={() => onDelete(task.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
              <Trash2 className="w-4 h-4" />
            </button>
            {task.description && (
              <button onClick={() => setExpanded(!expanded)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 transition-colors">
                {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>
            )}
          </div>
        </div>

        {expanded && task.description && (
          <div className="mt-3 ml-8 text-sm text-gray-600 bg-gray-50 rounded-lg p-3">
            {task.description}
          </div>
        )}

        {task.tags && (
          <div className="mt-2 ml-8 flex gap-1 flex-wrap">
            {task.tags.split(',').map(tag => (
              <span key={tag} className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full">
                #{tag.trim()}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
