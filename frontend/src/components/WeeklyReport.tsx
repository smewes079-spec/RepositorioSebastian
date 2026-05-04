import { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, PieChart, Pie, Cell, ResponsiveContainer, Legend } from 'recharts'
import { TrendingUp, Award, Clock, Lightbulb, RefreshCw } from 'lucide-react'
import { format } from 'date-fns'
import { es } from 'date-fns/locale'
import { reportApi } from '../services/api'
import type { WeeklyReport as WR } from '../types'
import toast from 'react-hot-toast'

const COLORS = ['#ef4444', '#3b82f6', '#f59e0b', '#6b7280']

export function WeeklyReport() {
  const [report, setReport] = useState<WR | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const load = async () => {
    try {
      const data = await reportApi.weekly()
      setReport(data)
    } catch {
      toast.error('Error cargando reporte')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const refresh = async () => {
    setRefreshing(true)
    await load()
    setRefreshing(false)
    toast.success('Reporte actualizado')
  }

  if (loading) return (
    <div className="bg-white rounded-2xl border p-6 animate-pulse">
      <div className="h-4 bg-gray-100 rounded w-1/2 mb-6" />
      <div className="h-48 bg-gray-100 rounded-xl" />
    </div>
  )

  if (!report) return null

  const reportData = report.report_data ? JSON.parse(report.report_data) : null
  const pieData = reportData ? [
    { name: 'Crítica', value: reportData.by_priority.critical },
    { name: 'Importante', value: reportData.by_priority.important },
    { name: 'Urgente', value: reportData.by_priority.urgent },
    { name: 'Baja', value: reportData.by_priority.low },
  ].filter(d => d.value > 0) : []

  const barData = reportData?.days_productivity
    ? Object.entries(reportData.days_productivity).map(([day, count]) => ({ day: day.slice(0, 3), count }))
    : []

  const suggestions = report.suggestions?.split('|').map(s => s.trim()).filter(Boolean) ?? []

  return (
    <div className="bg-white rounded-2xl border shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Reporte Semanal</h2>
          {report.week_start && (
            <p className="text-sm text-gray-500">
              {format(new Date(report.week_start), "d MMM", { locale: es })} —{' '}
              {format(new Date(report.week_end), "d MMM yyyy", { locale: es })}
            </p>
          )}
        </div>
        <button
          onClick={refresh}
          disabled={refreshing}
          className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 transition-colors"
        >
          <RefreshCw className={`w-5 h-5 ${refreshing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total tareas', value: report.total_tasks, icon: TrendingUp, color: 'text-gray-700' },
          { label: 'Completadas', value: report.completed_tasks, icon: Award, color: 'text-green-600' },
          { label: 'Tasa', value: `${report.completion_rate}%`, icon: TrendingUp, color: 'text-blue-600' },
          { label: 'Tiempo prom.', value: `${Math.round(report.avg_completion_time)}m`, icon: Clock, color: 'text-purple-600' },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} className="bg-gray-50 rounded-xl p-4 text-center">
            <Icon className={`w-5 h-5 ${color} mx-auto mb-1`} />
            <p className={`text-xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-gray-500">{label}</p>
          </div>
        ))}
      </div>

      {report.most_productive_day && (
        <div className="mb-4 p-3 bg-green-50 rounded-xl border border-green-100 flex items-center gap-2">
          <Award className="w-4 h-4 text-green-600 flex-shrink-0" />
          <p className="text-sm text-green-700">
            Tu día más productivo fue el <strong>{report.most_productive_day}</strong>
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
        {pieData.length > 0 && (
          <div>
            <p className="text-sm font-medium text-gray-700 mb-3">Distribución por prioridad</p>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" outerRadius={70} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                  {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}

        {barData.length > 0 && (
          <div>
            <p className="text-sm font-medium text-gray-700 mb-3">Productividad por día</p>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={barData}>
                <XAxis dataKey="day" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Tareas" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {suggestions.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-semibold text-gray-700 flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-amber-500" /> Sugerencias de mejora
          </p>
          {suggestions.map((s, i) => (
            <div key={i} className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg border border-amber-100">
              <span className="text-amber-500 mt-0.5">💡</span>
              <p className="text-sm text-amber-800">{s}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
