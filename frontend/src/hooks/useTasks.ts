import { useState, useEffect, useCallback } from 'react'
import { taskApi } from '../services/api'
import type { Task, TaskCreate, TaskUpdate } from '../types'
import toast from 'react-hot-toast'

export function useTasks(filters?: { status?: string; priority?: string }) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    try {
      const data = await taskApi.list(filters)
      setTasks(data)
    } catch {
      toast.error('Error cargando tareas')
    } finally {
      setLoading(false)
    }
  }, [filters?.status, filters?.priority])

  useEffect(() => { load() }, [load])

  const create = async (task: TaskCreate) => {
    const created = await taskApi.create(task)
    setTasks(prev => [created, ...prev])
    toast.success('Tarea creada')
    return created
  }

  const update = async (id: number, data: TaskUpdate) => {
    const updated = await taskApi.update(id, data)
    setTasks(prev => prev.map(t => t.id === id ? updated : t))
    return updated
  }

  const remove = async (id: number) => {
    await taskApi.delete(id)
    setTasks(prev => prev.filter(t => t.id !== id))
    toast.success('Tarea eliminada')
  }

  return { tasks, loading, reload: load, create, update, remove }
}
