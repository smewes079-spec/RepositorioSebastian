import { useEffect, useState } from 'react'
import { CheckCircle, Clock, AlertTriangle, TrendingUp, Calendar } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { summaryApi } from '../services/api'
import type { DailySummary as DS } from '../types'

export function DailySummary() {
  const [summary, setSummary] = useState<DS | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    summaryApi.daily().then(setSummary).finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="bg-white rounded-2xl border p-6 animate-pulse">
      <div className="h-4 bg-gray-100 rounded w-1/3 mb-4" />
      <div className="grid grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <div key={i} className="h-20 bg-gray-100 rounded-xl" />)}
      </div>
    </div>
  )

  if (!summary) return null

  const stats = [
    { label: 'Total', value: summary.total_tasks, icon: Calendar, color: 'text-gray-700', bg: 'bg-gray-50' },
    { label: 'Completadas', value: summary.completed, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
    { label: 'En progreso', value: summary.in_progress, icon: Clock, color: 'text-blue-600', bg: 'bg-blue-50' },
    { label: 'Vencidas', value: summary.overdue_tasks, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-50' },
  ]

  return (
    <div className="bg-white rounded-2xl border shadow-sm p-6">
      <div className="flex items-center justify-between mb-5">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Resumen del día</h2>
          <p className="text-sm text-gray-500 capitalize">
            {format(new Date(summary.date + 'T00:00:00'), "EEEE, d 'de' MMMM", { locale: es })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-blue-500" />
          <span className="text-2xl font-bold text-blue-600">{summary.completion_rate}%</span>
          <span className="text-sm text-gray-500">completado</span>
        </div>
      </div>

      <div className="w-full bg-gray-100 rounded-full h-2 mb-5">
        <div
          className="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-500"
          style={{ width: `${summary.completion_rate}%` }}
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className={`${bg} rounded-xl p-4 flex flex-col items-center`}>
            <Icon className={`w-5 h-5 ${color} mb-2`} />
            <span className={`text-2xl font-bold ${color}`}>{value}</span>
            <span className="text-xs text-gray-500 mt-0.5">{label}</span>
          </div>
        ))}
      </div>

      {summary.critical_tasks.length > 0 && (
        <div className="mt-4 p-3 bg-red-50 rounded-xl border border-red-100">
          <p className="text-sm font-semibold text-red-700 mb-1">
            🔴 {summary.critical_tasks.length} tarea(s) crítica(s) hoy
          </p>
          <ul className="space-y-0.5">
            {summary.critical_tasks.slice(0, 3).map(t => (
              <li key={t.id} className="text-xs text-red-600 truncate">• {t.title}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
