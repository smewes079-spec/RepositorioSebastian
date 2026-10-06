import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Trash2, Undo2, Wand2 } from 'lucide-react';
import Layout from '../components/Layout.jsx';
import CuotasEditor from '../components/CuotasEditor.jsx';
import FichaCosto from '../components/FichaCosto.jsx';
import InfoAuditoria from '../components/InfoAuditoria.jsx';
import { api } from '../lib/api.js';
import { formatCLP, formatFecha, toInputDate, TIPO_LABELS, ESTADO_LABELS, KANBAN_LABELS } from '../lib/format.js';
import { calcularCodigoVenta } from '../lib/codigoVenta.js';

const VACIO = {
  codigo: '',
  nombreClienta: '',
  tipo: 'NOVIA',
  fechaVenta: '',
  fechaEvento: '',
  fechaEntregaComprometida: '',
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
  const [auditoria, setAuditoria] = useState(null);
  const [fechaEntregaReal, setFechaEntregaReal] = useState(null);
  const [revirtiendo, setRevirtiendo] = useState(false);

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
          fechaEntregaComprometida: toInputDate(v.fechaEntregaComprometida),
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
        setAuditoria({ creadoPor: v.creadoPor?.nombre, actualizadoPor: v.actualizadoPor?.nombre });
        setFechaEntregaReal(v.fechaEntrega);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  function handleChange(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  useEffect(() => {
    if (isEdit) return;
    if (!form.nombreClienta || !form.fechaEvento) return;
    setForm((f) =>
      f.codigo ? f : { ...f, codigo: calcularCodigoVenta(f.nombreClienta, f.fechaEvento) }
    );
  }, [form.nombreClienta, form.fechaEvento, isEdit]);

  function sugerirCodigo() {
    if (!form.nombreClienta || !form.fechaEvento) return;
    handleChange('codigo', calcularCodigoVenta(form.nombreClienta, form.fechaEvento));
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

  async function handleRevertir() {
    if (
      !confirm(
        '¿Mover esta venta a Cotizaciones (por ejemplo, porque la clienta se retractó)?\n\n' +
          'Se eliminará el registro de esta venta (incluyendo sus cuotas y cualquier compra de insumos asignada a ella) y quedará como una cotización marcada Rechazada, editable para gestionarla de nuevo.\n\n' +
          'Esta acción no se puede deshacer. ¿Continuar?'
      )
    )
      return;
    setRevirtiendo(true);
    setError('');
    try {
      const cotizacion = await api.post(`/ventas/${id}/revertir-a-cotizacion`, {});
      navigate(`/cotizaciones/${cotizacion.id}`);
    } catch (err) {
      setError(err.message || 'No se pudo revertir la venta a cotización');
      setRevirtiendo(false);
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
      backTo="/ventas"
      actions={
        isEdit && (
          <>
            <button
              onClick={handleRevertir}
              disabled={revirtiendo}
              title="La clienta se retractó: mueve esta venta a Cotizaciones"
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-[#2C2420]/70 border border-black/10 hover:bg-black/5 disabled:opacity-50"
            >
              <Undo2 size={15} />
              {revirtiendo ? 'Moviendo…' : 'Mover a Cotización'}
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

      <InfoAuditoria auditoria={auditoria} />

      <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
        <div className="bg-white rounded-xl border border-black/5 p-6 grid grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-medium text-[#2C2420]/60 mb-1.5">Código único</label>
            <div className="flex items-center gap-1.5">
              <input
                required
                value={form.codigo}
                onChange={(e) => handleChange('codigo', e.target.value)}
                placeholder="ej: FV050627"
                className="w-full px-3 py-2 text-sm rounded-lg border border-black/10 focus:outline-none focus:ring-2 focus:ring-[#C9A96E]"
              />
              {form.nombreClienta && form.fechaEvento && (
                <button
                  type="button"
                  onClick={sugerirCodigo}
                  title="Recalcular a partir del nombre y la fecha del evento"
                  className="shrink-0 p-2 rounded-lg border border-black/10 text-[#C9A96E] hover:bg-[#C9A96E]/10"
                >
                  <Wand2 size={15} />
                </button>
              )}
            </div>
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
              Fecha de entrega comprometida
            </label>
            <input
              type="date"
              value={form.fechaEntregaComprometida}
              onChange={(e) => handleChange('fechaEntregaComprometida', e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-black/10 focus:outline-none focus:ring-2 focus:ring-[#C9A96E]"
            />
            <p className="text-[10px] text-[#2C2420]/40 mt-1">
              Fecha objetivo para tener el vestido terminado (para planificar producción), no la
              fecha real de entrega.
              {fechaEntregaReal && <> El vestido quedó entregado el {formatFecha(fechaEntregaReal)}.</>}
            </p>
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

      {isEdit && (
        <div className="bg-white rounded-xl border border-black/5 p-6 max-w-3xl mt-6">
          <p className="font-serif text-lg text-[#2C2420] mb-4">Ficha de costo del vestido</p>
          <FichaCosto ventaId={id} />
        </div>
      )}
    </Layout>
  );
}
