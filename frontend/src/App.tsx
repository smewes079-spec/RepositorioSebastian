import { useState } from 'react'
import { Toaster } from 'react-hot-toast'
import { LayoutDashboard, ListTodo, BarChart2, Settings, Menu, X } from 'lucide-react'
import { DailySummary } from './components/DailySummary'
import { TaskList } from './components/TaskList'
import { WeeklyReport } from './components/WeeklyReport'
import { EmailSettings } from './components/EmailSettings'
import { NotificationPanel } from './components/NotificationPanel'

type View = 'dashboard' | 'tasks' | 'reports' | 'settings'

const NAV = [
  { key: 'dashboard' as View, label: 'Dashboard', icon: LayoutDashboard },
  { key: 'tasks' as View, label: 'Tareas', icon: ListTodo },
  { key: 'reports' as View, label: 'Reportes', icon: BarChart2 },
  { key: 'settings' as View, label: 'Configuración', icon: Settings },
]

export default function App() {
  const [view, setView] = useState<View>('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [syncKey, setSyncKey] = useState(0)

  const handleSynced = () => setSyncKey(k => k + 1)

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-64 bg-white border-r shadow-sm transform transition-transform duration-200
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:relative lg:translate-x-0`}>
        <div className="flex items-center gap-3 px-6 py-5 border-b">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
            <span className="text-white text-sm font-bold">TF</span>
          </div>
          <div>
            <h1 className="font-bold text-gray-900 leading-tight">TaskFlow</h1>
            <p className="text-xs text-gray-500">Gestión de tareas</p>
          </div>
        </div>

        <nav className="p-4 space-y-1">
          {NAV.map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => { setView(key); setSidebarOpen(false) }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all
                ${view === key
                  ? 'bg-blue-50 text-blue-700 shadow-sm'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'}`}
            >
              <Icon className="w-5 h-5" />
              {label}
            </button>
          ))}
        </nav>

        <div className="absolute bottom-6 left-6 right-6">
          <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
            <p className="text-xs font-semibold text-blue-700 mb-1">Matriz de Eisenhower</p>
            <div className="grid grid-cols-2 gap-1 text-xs">
              <span className="bg-red-100 text-red-700 px-1.5 py-1 rounded text-center">🔴 Crítica</span>
              <span className="bg-blue-100 text-blue-700 px-1.5 py-1 rounded text-center">🔵 Importante</span>
              <span className="bg-amber-100 text-amber-700 px-1.5 py-1 rounded text-center">🟡 Urgente</span>
              <span className="bg-gray-100 text-gray-600 px-1.5 py-1 rounded text-center">⚪ Baja</span>
            </div>
          </div>
        </div>
      </aside>

      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/30 z-30 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b px-4 sm:px-6 py-4 flex items-center gap-4 sticky top-0 z-20">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="lg:hidden p-2 rounded-xl hover:bg-gray-100 transition-colors"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
          <div className="flex-1">
            <h2 className="font-semibold text-gray-900">
              {NAV.find(n => n.key === view)?.label}
            </h2>
            <p className="text-xs text-gray-500">
              {new Date().toLocaleDateString('es', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
          <NotificationPanel />
        </header>

        <main className="flex-1 p-4 sm:p-6 max-w-4xl mx-auto w-full">
          {view === 'dashboard' && (
            <div className="space-y-6">
              <DailySummary />
              <TaskList refreshKey={syncKey} />
            </div>
          )}
          {view === 'tasks' && <TaskList refreshKey={syncKey} />}
          {view === 'reports' && <WeeklyReport />}
          {view === 'settings' && (
            <div className="space-y-6">
              <EmailSettings onSynced={handleSynced} />
              <div className="bg-white rounded-2xl border shadow-sm p-6">
                <h3 className="font-semibold text-gray-900 mb-3">Acerca de TaskFlow</h3>
                <p className="text-sm text-gray-600 mb-2">Plataforma de gestión de tareas con:</p>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>✅ Integración con correo electrónico (IMAP)</li>
                  <li>✅ Priorización automática (Matriz de Eisenhower)</li>
                  <li>✅ Recordatorios y notificaciones</li>
                  <li>✅ Reportes semanales de productividad</li>
                  <li>✅ Seguimiento de progreso en tiempo real</li>
                </ul>
              </div>
            </div>
          )}
        </main>
      </div>

      <Toaster position="bottom-right" toastOptions={{ duration: 3000 }} />
    </div>
  )
}
