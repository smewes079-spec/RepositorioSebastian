import { useState } from 'react'
import { Plus, Filter, Search, SortAsc } from 'lucide-react'
import { TaskCard } from './TaskCard'
import { TaskForm } from './TaskForm'
import { useTasks } from '../hooks/useTasks'
import type { Task, TaskUpdate } from '../types'
import toast from 'react-hot-toast'

const FILTERS = [
  { key: '', label: 'Todas' },
  { key: 'pending', label: 'Pendientes' },
  { key: 'in_progress', label: 'En progreso' },
  { key: 'completed', label: 'Completadas' },
]

const PRIORITY_FILTERS = [
  { key: '', label: 'Cualquier prioridad' },
  { key: 'critical', label: '🔴 Crítica' },
  { key: 'important', label: '🔵 Importante' },
  { key: 'urgent', label: '🟡 Urgente' },
  { key: 'low', label: '⚪ Baja' },
]

interface Props {
  refreshKey?: number
}

export function TaskList({ refreshKey }: Props) {
  const [statusFilter, setStatusFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editTask, setEditTask] = useState<Task | undefined>()

  const { tasks, loading, create, update, remove, reload } = useTasks(
    { status: statusFilter || undefined, priority: priorityFilter || undefined }
  )

  const filtered = tasks.filter(t =>
    !search || t.title.toLowerCase().includes(search.toLowerCase()) ||
    t.description?.toLowerCase().includes(search.toLowerCase())
  )

  const handleCreate = async (data: any) => {
    await create(data)
    setShowForm(false)
  }

  const handleUpdate = async (id: number, data: TaskUpdate) => {
    try {
      await update(id, data)
    } catch {
      toast.error('Error actualizando tarea')
    }
  }

  const handleEdit = (task: Task) => {
    setEditTask(task)
    setShowForm(true)
  }

  const handleEditSubmit = async (data: any) => {
    if (editTask) {
      await update(editTask.id, data)
      setEditTask(undefined)
      setShowForm(false)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Mis Tareas</h2>
        <button
          onClick={() => { setEditTask(undefined); setShowForm(true) }}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors shadow-sm"
        >
          <Plus className="w-4 h-4" /> Nueva tarea
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Buscar tareas..."
          />
        </div>
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          {FILTERS.map(f => <option key={f.key} value={f.key}>{f.label}</option>)}
        </select>
        <select
          value={priorityFilter}
          onChange={e => setPriorityFilter(e.target.value)}
          className="px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
        >
          {PRIORITY_FILTERS.map(f => <option key={f.key} value={f.key}>{f.label}</option>)}
        </select>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-5xl mb-3">📋</div>
          <p className="font-medium">No hay tareas</p>
          <p className="text-sm mt-1">Crea tu primera tarea o ajusta los filtros</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              onUpdate={handleUpdate}
              onDelete={remove}
              onEdit={handleEdit}
            />
          ))}
        </div>
      )}

      <p className="text-xs text-gray-400 mt-3 text-center">
        {filtered.length} tarea{filtered.length !== 1 ? 's' : ''} · Ordenadas por prioridad (Matriz de Eisenhower)
      </p>

      {showForm && (
        <TaskForm
          task={editTask}
          onSubmit={editTask ? handleEditSubmit : handleCreate}
          onClose={() => { setShowForm(false); setEditTask(undefined) }}
        />
      )}
    </div>
  )
}
