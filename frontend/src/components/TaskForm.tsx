import { useState, useEffect } from 'react'
import { X, Save } from 'lucide-react'
import type { Task, TaskCreate, TaskUpdate } from '../types'

interface Props {
  task?: Task
  onSubmit: (data: TaskCreate | TaskUpdate) => Promise<void>
  onClose: () => void
}

export function TaskForm({ task, onSubmit, onClose }: Props) {
  const [form, setForm] = useState({
    title: task?.title ?? '',
    description: task?.description ?? '',
    is_urgent: task?.is_urgent ?? false,
    is_important: task?.is_important ?? false,
    due_date: task?.due_date ? task.due_date.slice(0, 16) : '',
    reminder_at: task?.reminder_at ? task.reminder_at.slice(0, 16) : '',
    tags: task?.tags ?? '',
    estimated_minutes: task?.estimated_minutes?.toString() ?? '',
  })
  const [loading, setLoading] = useState(false)

  const priority = (() => {
    if (form.is_urgent && form.is_important) return { label: 'Crítica', color: 'text-red-600' }
    if (!form.is_urgent && form.is_important) return { label: 'Importante', color: 'text-blue-600' }
    if (form.is_urgent && !form.is_important) return { label: 'Urgente', color: 'text-amber-600' }
    return { label: 'Baja prioridad', color: 'text-gray-500' }
  })()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.title.trim()) return
    setLoading(true)
    try {
      await onSubmit({
        title: form.title.trim(),
        description: form.description || undefined,
        is_urgent: form.is_urgent,
        is_important: form.is_important,
        due_date: form.due_date || undefined,
        reminder_at: form.reminder_at || undefined,
        tags: form.tags || undefined,
        estimated_minutes: form.estimated_minutes ? parseInt(form.estimated_minutes) : undefined,
      })
      onClose()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold text-gray-900">
            {task ? 'Editar tarea' : 'Nueva tarea'}
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
            <input
              type="text"
              value={form.title}
              onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="¿Qué necesitas hacer?"
              autoFocus
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <textarea
              value={form.description}
              onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
              rows={3}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Detalles adicionales..."
            />
          </div>

          <div className="bg-gray-50 rounded-xl p-4">
            <p className="text-sm font-medium text-gray-700 mb-3">
              Prioridad (Matriz de Eisenhower): <span className={`font-semibold ${priority.color}`}>{priority.label}</span>
            </p>
            <div className="grid grid-cols-2 gap-3">
              <label className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${form.is_urgent ? 'border-amber-400 bg-amber-50' : 'border-gray-200 bg-white'}`}>
                <input
                  type="checkbox"
                  checked={form.is_urgent}
                  onChange={e => setForm(f => ({ ...f, is_urgent: e.target.checked }))}
                  className="w-4 h-4 text-amber-500"
                />
                <div>
                  <p className="text-sm font-medium text-gray-800">Urgente</p>
                  <p className="text-xs text-gray-500">Requiere atención inmediata</p>
                </div>
              </label>
              <label className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition-all ${form.is_important ? 'border-blue-400 bg-blue-50' : 'border-gray-200 bg-white'}`}>
                <input
                  type="checkbox"
                  checked={form.is_important}
                  onChange={e => setForm(f => ({ ...f, is_important: e.target.checked }))}
                  className="w-4 h-4 text-blue-500"
                />
                <div>
                  <p className="text-sm font-medium text-gray-800">Importante</p>
                  <p className="text-xs text-gray-500">Alto impacto en objetivos</p>
                </div>
              </label>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha límite</label>
              <input
                type="datetime-local"
                value={form.due_date}
                onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Recordatorio</label>
              <input
                type="datetime-local"
                value={form.reminder_at}
                onChange={e => setForm(f => ({ ...f, reminder_at: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Etiquetas</label>
              <input
                type="text"
                value={form.tags}
                onChange={e => setForm(f => ({ ...f, tags: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="trabajo, personal, proyecto"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tiempo estimado (min)</label>
              <input
                type="number"
                value={form.estimated_minutes}
                onChange={e => setForm(f => ({ ...f, estimated_minutes: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="30"
                min="1"
              />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              {loading ? 'Guardando...' : task ? 'Actualizar' : 'Crear tarea'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
