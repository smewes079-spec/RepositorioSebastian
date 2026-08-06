import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import Layout from '../components/Layout.jsx';
import CuotasEditor from '../components/CuotasEditor.jsx';
import { api } from '../lib/api.js';
import { formatCLP, toInputDate, TIPO_LABELS, ESTADO_LABELS, KANBAN_LABELS } from '../lib/format.js';

const VACIO = {
  codigo: '',
  nombreClienta: '',
  tipo: 'NOVIA',
  fechaVenta: '',
  fechaEvento: '',
  precioTotal: 0,
  estado: 'NO_ENTREGADO',
  kanbanEstado: 'PENDIENTE',
  notas: '',
  notasProduccion: '',
};

export default function VentaForm() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();

  const [form, setForm] = useState(VACIO);
  const [cuotas, setCuotas] = useState([]);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [computed, setComputed] = useState(null);

  useEffect(() => {
    if (!isEdit) return;
    api
      .get(`/ventas/${id}`)
      .then((v) => {
        setForm({
          codigo: v.codigo,
          nombreClienta: v.nombreClienta,
          tipo: v.tipo,
          fechaVenta: toInputDate(v.fechaVenta),
          fechaEvento: toInputDate(v.fechaEvento),
          precioTotal: v.precioTotal,
          estado: v.estado,
          kanbanEstado: v.kanbanEstado,
          notas: v.notas || '',
          notasProduccion: v.notasProduccion || '',
        });
        setCuotas(
          v.cuotas.map((c) => ({
            id: c.id,
            numero: c.numero,
            monto: c.monto,
            fechaProgramada: toInputDate(c.fechaProgramada),
            pagada: c.pagada,
            fechaPago: toInputDate(c.fechaPago),
            montoPagado: c.montoPagado,
          }))
        );
        setComputed({
          saldoPendiente: v.saldoPendiente,
          porcentajeCobrado: v.porcentajeCobrado,
          totalPagado: v.totalPagado,
        });
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  function handleChange(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    try {
      const payload = {
        ...form,
        precioTotal: Number(form.precioTotal),
        cuotas: cuotas.map((c) => ({
          ...c,
          monto: Number(c.monto),
          fechaProgramada: c.fechaProgramada || form.fechaVenta,
        })),
      };
      if (isEdit) {
        await api.put(`/ventas/${id}`, payload);
      } else {
        await api.post('/ventas', payload);
      }
      navigate('/ventas');
    } catch (err) {
      setError(err.message || 'No se pudo guardar la venta');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm('¿Eliminar esta venta? Esta acción no se puede deshacer.')) return;
    try {
      await api.del(`/ventas/${id}`);
      navigate('/ventas');
    } catch (err) {
      setError(err.message || 'No se pudo eliminar la venta');
    }
  }

  if (loading) {
    return (
      <Layout title={isEdit ? 'Editar venta' : 'Nueva venta'}>
        <p className="text-sm text-[#2C2420]/40">Cargando…</p>
      </Layout>
    );
  }

  return (
    <Layout
      title={isEdit ? `Venta ${form.codigo}` : 'Nueva venta'}
      subtitle={isEdit ? form.nombreClienta : 'Registrar una nueva venta y su plan de pagos'}
      actions={
        isEdit && (
          <button
            onClick={handleDelete}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-[#A85C52] border border-[#A85C52]/30 hover:bg-[#A85C52]/5"
          >
            <Trash2 size={15} />
            Eliminar
          </button>
        )
      }
    >
      {computed && (
        <div className="flex gap-4 mb-6">
          <div className="bg-white rounded-xl border border-black/5 px-5 py-3">
            <p className="text-xs text-[#2C2420]/50">Saldo pendiente</p>
            <p
              className="font-serif text-xl"
              style={{ color: computed.saldoPendiente > 0 ? '#A85C52' : '#5C8C6A' }}
            >
              {formatCLP(computed.saldoPendiente)}
            </p>
          </div>
          <div className="bg-white rounded-xl border border-black/5 px-5 py-3">
            <p className="text-xs text-[#2C2420]/50">% Cobrado</p>
            <p className="font-serif text-xl text-[#2C2420]">{computed.porcentajeCobrado}%</p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
        <div className="bg-white rounded-xl border border-black/5 p-6 grid grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-medium text-[#2C2420]/60 mb-1.5">Código único</label>
            <input
              required
              value={form.codigo}
              onChange={(e) => handleChange('codigo', e.target.value)}
              placeholder="ej: JB150526"
              className="w-full px-3 py-2 text-sm rounded-lg border border-black/10 focus:outline-none focus:ring-2 focus:ring-[#C9A96E]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#2C2420]/60 mb-1.5">Nombre clienta</label>
            <input
              required
              value={form.nombreClienta}
              onChange={(e) => handleChange('nombreClienta', e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-black/10 focus:outline-none focus:ring-2 focus:ring-[#C9A96E]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#2C2420]/60 mb-1.5">Tipo de vestido</label>
            <select
              value={form.tipo}
              onChange={(e) => handleChange('tipo', e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-black/10 focus:outline-none focus:ring-2 focus:ring-[#C9A96E]"
            >
              {Object.entries(TIPO_LABELS).map(([k, l]) => (
                <option key={k} value={k}>
                  {l}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-[#2C2420]/60 mb-1.5">Estado de entrega</label>
            <select
              value={form.estado}
              onChange={(e) => handleChange('estado', e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-black/10 focus:outline-none focus:ring-2 focus:ring-[#C9A96E]"
            >
              {Object.entries(ESTADO_LABELS).map(([k, l]) => (
                <option key={k} value={k}>
                  {l}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-[#2C2420]/60 mb-1.5">Fecha de venta</label>
            <input
              required
              type="date"
              value={form.fechaVenta}
              onChange={(e) => handleChange('fechaVenta', e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-black/10 focus:outline-none focus:ring-2 focus:ring-[#C9A96E]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#2C2420]/60 mb-1.5">Fecha del evento</label>
            <input
              required
              type="date"
              value={form.fechaEvento}
              onChange={(e) => handleChange('fechaEvento', e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-black/10 focus:outline-none focus:ring-2 focus:ring-[#C9A96E]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#2C2420]/60 mb-1.5">
              Precio total negociado (CLP)
            </label>
            <input
              required
              type="number"
              min="0"
              value={form.precioTotal}
              onChange={(e) => handleChange('precioTotal', e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-black/10 focus:outline-none focus:ring-2 focus:ring-[#C9A96E]"
            />
          </div>
          {isEdit && (
            <div>
              <label className="block text-xs font-medium text-[#2C2420]/60 mb-1.5">
                Estado de producción
              </label>
              <select
                value={form.kanbanEstado}
                onChange={(e) => handleChange('kanbanEstado', e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-black/10 focus:outline-none focus:ring-2 focus:ring-[#C9A96E]"
              >
                {Object.entries(KANBAN_LABELS).map(([k, l]) => (
                  <option key={k} value={k}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="col-span-2">
            <label className="block text-xs font-medium text-[#2C2420]/60 mb-1.5">Notas</label>
            <textarea
              value={form.notas}
              onChange={(e) => handleChange('notas', e.target.value)}
              rows={3}
              className="w-full px-3 py-2 text-sm rounded-lg border border-black/10 focus:outline-none focus:ring-2 focus:ring-[#C9A96E]"
            />
          </div>
        </div>

        <div className="bg-white rounded-xl border border-black/5 p-6">
          <CuotasEditor cuotas={cuotas} onChange={setCuotas} precioTotal={form.precioTotal} />
        </div>

        {error && <p className="text-sm text-[#A85C52]">{error}</p>}

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/ventas')}
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
            {saving ? 'Guardando…' : 'Guardar venta'}
          </button>
        </div>
      </form>
    </Layout>
  );
}
