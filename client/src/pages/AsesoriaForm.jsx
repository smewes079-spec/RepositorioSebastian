import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Trash2, FileText } from 'lucide-react';
import Layout from '../components/Layout.jsx';
import InfoAuditoria from '../components/InfoAuditoria.jsx';
import { api } from '../lib/api.js';
import { toInputDate } from '../lib/format.js';

const VACIO = {
  fecha: toInputDate(new Date()),
  nombreClienta: '',
  emailClienta: '',
  telefonoClienta: '',
  monto: '',
  notas: '',
};

export default function AsesoriaForm() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();

  const [form, setForm] = useState(VACIO);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [auditoria, setAuditoria] = useState(null);

  useEffect(() => {
    if (!isEdit) return;
    api
      .get(`/asesorias/${id}`)
      .then((a) => {
        setForm({
          fecha: toInputDate(a.fecha),
          nombreClienta: a.nombreClienta,
          emailClienta: a.emailClienta || '',
          telefonoClienta: a.telefonoClienta || '',
          monto: a.monto,
          notas: a.notas || '',
        });
        setAuditoria({ creadoPor: a.creadoPor?.nombre, actualizadoPor: a.actualizadoPor?.nombre });
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = { ...form, monto: Number(form.monto) };
      if (isEdit) {
        await api.put(`/asesorias/${id}`, payload);
      } else {
        await api.post('/asesorias', payload);
      }
      navigate('/asesorias');
    } catch (err) {
      setError(err.message || 'No se pudo guardar la asesoría');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm('¿Eliminar esta asesoría?')) return;
    try {
      await api.del(`/asesorias/${id}`);
      navigate('/asesorias');
    } catch (err) {
      setError(err.message || 'No se pudo eliminar la asesoría');
    }
  }

  function handleCrearCotizacion() {
    navigate('/cotizaciones/nueva', {
      state: {
        prefill: {
          nombreClienta: form.nombreClienta,
          emailClienta: form.emailClienta,
          telefonoClienta: form.telefonoClienta,
        },
      },
    });
  }

  if (loading) {
    return (
      <Layout title={isEdit ? 'Editar asesoría' : 'Nueva asesoría'}>
        <p className="text-sm text-[#2C2420]/40">Cargando…</p>
      </Layout>
    );
  }

  return (
    <Layout
      title={isEdit ? 'Editar asesoría' : 'Nueva asesoría'}
      subtitle="Consulta cobrada a una clienta, haya terminado o no en una venta"
      backTo="/asesorias"
      actions={
        isEdit && (
          <>
            <button
              onClick={handleCrearCotizacion}
              title="Crea una cotización nueva con los datos de esta clienta ya cargados"
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-[#2C2420]/70 border border-black/10 hover:bg-black/5"
            >
              <FileText size={15} />
              Crear cotización
            </button>
            <button
              onClick={handleDelete}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-[#A85C52] border border-[#A85C52]/30 hover:bg-[#A85C52]/5"
            >
              <Trash2 size={15} />
              Eliminar
            </button>
          </>
        )
      }
    >
      <InfoAuditoria auditoria={auditoria} />

      <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
        <div className="bg-white rounded-xl border border-black/5 p-6 grid grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-medium text-[#2C2420]/60 mb-1.5">Fecha</label>
            <input
              required
              type="date"
              value={form.fecha}
              onChange={(e) => set('fecha', e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-black/10 focus:outline-none focus:ring-2 focus:ring-[#C9A96E]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#2C2420]/60 mb-1.5">
              Monto cobrado (CLP)
            </label>
            <input
              required
              type="number"
              min="0"
              value={form.monto}
              onChange={(e) => set('monto', e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-black/10 focus:outline-none focus:ring-2 focus:ring-[#C9A96E]"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-medium text-[#2C2420]/60 mb-1.5">Nombre clienta</label>
            <input
              required
              value={form.nombreClienta}
              onChange={(e) => set('nombreClienta', e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-black/10 focus:outline-none focus:ring-2 focus:ring-[#C9A96E]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#2C2420]/60 mb-1.5">
              Correo (opcional)
            </label>
            <input
              type="email"
              value={form.emailClienta}
              onChange={(e) => set('emailClienta', e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-black/10 focus:outline-none focus:ring-2 focus:ring-[#C9A96E]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#2C2420]/60 mb-1.5">
              Teléfono (opcional)
            </label>
            <input
              value={form.telefonoClienta}
              onChange={(e) => set('telefonoClienta', e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-black/10 focus:outline-none focus:ring-2 focus:ring-[#C9A96E]"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-medium text-[#2C2420]/60 mb-1.5">Notas</label>
            <textarea
              value={form.notas}
              onChange={(e) => set('notas', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 text-sm rounded-lg border border-black/10 focus:outline-none focus:ring-2 focus:ring-[#C9A96E]"
            />
          </div>
        </div>

        {error && <p className="text-sm text-[#A85C52]">{error}</p>}

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/asesorias')}
            className="px-5 py-2.5 text-sm rounded-lg text-[#2C2420]/70 hover:bg-black/5"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2.5 text-sm rounded-lg text-white disabled:opacity-60"
            style={{ backgroundColor: '#1A1A2E' }}
          >
            {saving ? 'Guardando…' : 'Guardar asesoría'}
          </button>
        </div>
      </form>
    </Layout>
  );
}
