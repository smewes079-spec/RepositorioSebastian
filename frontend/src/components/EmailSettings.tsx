import { useState, useEffect } from 'react'
import { Mail, RefreshCw, Trash2, Save, CheckCircle, XCircle } from 'lucide-react'
import { emailApi } from '../services/api'
import type { EmailConfig } from '../types'
import toast from 'react-hot-toast'

const PRESET_SERVERS: Record<string, { server: string; port: number }> = {
  'gmail.com': { server: 'imap.gmail.com', port: 993 },
  'outlook.com': { server: 'outlook.office365.com', port: 993 },
  'hotmail.com': { server: 'outlook.office365.com', port: 993 },
  'yahoo.com': { server: 'imap.mail.yahoo.com', port: 993 },
}

interface Props {
  onSynced?: () => void
}

export function EmailSettings({ onSynced }: Props) {
  const [config, setConfig] = useState<EmailConfig | null>(null)
  const [form, setForm] = useState({ email: '', password: '', imap_server: '', imap_port: 993, use_ssl: true })
  const [saving, setSaving] = useState(false)
  const [syncing, setSyncing] = useState(false)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    emailApi.getConfig().then(c => {
      if (c) setConfig(c)
      else setShowForm(true)
    })
  }, [])

  const handleEmailChange = (email: string) => {
    const domain = email.split('@')[1]
    const preset = domain ? PRESET_SERVERS[domain] : null
    setForm(f => ({
      ...f,
      email,
      imap_server: preset?.server ?? f.imap_server,
      imap_port: preset?.port ?? f.imap_port,
    }))
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    try {
      const saved = await emailApi.saveConfig(form)
      setConfig(saved)
      setShowForm(false)
      toast.success('Correo configurado correctamente')
    } catch (err: any) {
      toast.error(err?.response?.data?.detail ?? 'Error al guardar configuración')
    } finally {
      setSaving(false)
    }
  }

  const handleSync = async () => {
    setSyncing(true)
    try {
      const result = await emailApi.sync()
      if (result.errors.length > 0) {
        toast.error(result.errors[0])
      } else {
        toast.success(`Sincronizado: ${result.new_tasks} tareas nuevas de ${result.synced} correos`)
        onSynced?.()
      }
    } catch (err: any) {
      toast.error(err?.response?.data?.detail ?? 'Error al sincronizar')
    } finally {
      setSyncing(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm('¿Eliminar la configuración de correo?')) return
    await emailApi.deleteConfig()
    setConfig(null)
    setShowForm(true)
    setForm({ email: '', password: '', imap_server: '', imap_port: 993, use_ssl: true })
    toast.success('Configuración eliminada')
  }

  return (
    <div className="bg-white rounded-2xl border shadow-sm p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
          <Mail className="w-5 h-5 text-purple-600" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Integración de Correo</h2>
          <p className="text-sm text-gray-500">Extrae tareas automáticamente de tu bandeja</p>
        </div>
      </div>

      {config && !showForm ? (
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 bg-green-50 rounded-xl border border-green-200">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-green-800">{config.email}</p>
              <p className="text-xs text-green-600">
                {config.imap_server}:{config.imap_port}
                {config.last_sync && ` · Última sync: ${new Date(config.last_sync).toLocaleString('es')}`}
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleSync}
              disabled={syncing}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-medium hover:bg-purple-700 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
              {syncing ? 'Sincronizando...' : 'Sincronizar ahora'}
            </button>
            <button
              onClick={() => setShowForm(true)}
              className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
            >
              Editar
            </button>
            <button
              onClick={handleDelete}
              className="px-4 py-2.5 border border-red-200 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>

          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
            <p className="text-xs text-amber-700">
              <strong>Nota:</strong> Para Gmail, activa el acceso IMAP en Configuración → Ver todos los ajustes → Reenvío e IMAP.
              Si usas verificación en 2 pasos, genera una <strong>Contraseña de aplicación</strong>.
            </p>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Correo electrónico</label>
            <input
              type="email"
              value={form.email}
              onChange={e => handleEmailChange(e.target.value)}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              placeholder="tu@gmail.com"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Contraseña (o contraseña de app)</label>
            <input
              type="password"
              value={form.password}
              onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
              className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              required
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Servidor IMAP</label>
              <input
                type="text"
                value={form.imap_server}
                onChange={e => setForm(f => ({ ...f, imap_server: e.target.value }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="imap.gmail.com"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Puerto</label>
              <input
                type="number"
                value={form.imap_port}
                onChange={e => setForm(f => ({ ...f, imap_port: parseInt(e.target.value) }))}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
          </div>
          <div className="flex gap-2">
            {config && (
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="flex-1 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
            )}
            <button
              type="submit"
              disabled={saving}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-medium hover:bg-purple-700 transition-colors disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {saving ? 'Verificando...' : 'Guardar y verificar'}
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
