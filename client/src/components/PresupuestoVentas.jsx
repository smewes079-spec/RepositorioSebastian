import { useEffect, useState } from 'react';
import { Plus, Pencil, Trash2, X, Wand2 } from 'lucide-react';
import { api } from '../lib/api.js';
import { formatCLP, formatMesCorto, toInputDate, TIPO_LABELS } from '../lib/format.js';
import PresupuestoCuotasEditor from './PresupuestoCuotasEditor.jsx';

const VACIO = { tipo: 'NOVIA', mes: '', cantidad: 1, montoTotal: 0 };

export default function PresupuestoVentas() {
  const [presupuestos, setPresupuestos] = useState([]);
  const [mesesConReales, setMesesConReales] = useState([]);
  const [precioEstandarPorTipo, setPrecioEstandarPorTipo] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editId, setEditId] = useState(null); // null = cerrado, 'nuevo' = creando
  const [form, setForm] = useState(VACIO);
  const [cuotas, setCuotas] = useState([]);
  const [saving, setSaving] = useState(false);

  function load() {
    setLoading(true);
    Promise.all([api.get('/dashboard/presupuesto'), api.get('/config/tipos-vestido')])
      .then(([data, tipos]) => {
        setPresupuestos(data.presupuestos);
        setMesesConReales(data.mesesConReales);
        setPrecioEstandarPorTipo(
          tipos.reduce((acc, t) => ({ ...acc, [t.tipo]: t.precioVentaEstandar }), {})
        );
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  function sugerirMonto() {
    const precio = precioEstandarPorTipo[form.tipo] || 0;
    setForm((f) => ({ ...f, montoTotal: precio * (Number(f.cantidad) || 0) }));
  }

  function openNuevo() {
    setForm(VACIO);
    setCuotas([]);
    setEditId('nuevo');
    setError('');
  }

  function openEditar(p) {
    setForm({
      tipo: p.tipo,
      mes: p.mes.slice(0, 7),
      cantidad: p.cantidad,
      montoTotal: p.montoTotal,
    });
    setCuotas(p.cuotas.map((c) => ({ numero: c.numero, monto: c.monto, fecha: toInputDate(c.fecha) })));
    setEditId(p.id);
    setError('');
  }

  function cerrar() {
    setEditId(null);
    setError('');
  }

  async function guardar() {
    setSaving(true);
    setError('');
    const payload = {
      tipo: form.tipo,
      mes: form.mes,
      cantidad: Number(form.cantidad),
      montoTotal: Number(form.montoTotal),
      cuotas: cuotas.map((c) => ({ ...c, monto: Number(c.monto) })),
    };
    try {
      if (editId === 'nuevo') {
        await api.post('/dashboard/presupuesto', payload);
      } else {
        await api.put(`/dashboard/presupuesto/${editId}`, payload);
      }
      cerrar();
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function eliminar(p) {
    if (!confirm(`¿Eliminar el presupuesto de ${TIPO_LABELS[p.tipo]} para ${formatMesCorto(p.mes.slice(0, 7))}?`)) return;
    try {
      await api.del(`/dashboard/presupuesto/${p.id}`);
      load();
    } catch (err) {
      setError(err.message);
    }
  }

  const mesTieneReales = form.mes && mesesConReales.includes(form.mes);

  if (loading) return <p className="text-sm text-[#2C2420]/40">Cargando…</p>;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs text-[#2C2420]/50 max-w-xl leading-relaxed">
          Solo se puede presupuestar un mes que aún no tiene ventas reales registradas. Una vez que
          un mes tiene ventas reales, el presupuesto de ese mes deja de usarse en el Estado de
          Resultados y el Flujo de Caja.
        </p>
        {editId === null && (
          <button
            onClick={openNuevo}
            className="flex items-center gap-1.5 px-4 py-2 text-sm rounded-lg text-white hover:opacity-90 shrink-0"
            style={{ backgroundColor: '#1A1A2E' }}
          >
            <Plus size={15} />
            Nuevo presupuesto
          </button>
        )}
      </div>

      {error && <p className="text-sm text-[#A85C52] mb-3">{error}</p>}

      {editId !== null && (
        <div className="bg-white rounded-xl border border-black/5 p-5 mb-5">
          <div className="flex items-center justify-between mb-4">
            <p className="font-serif text-lg text-[#2C2420]">
              {editId === 'nuevo' ? 'Nuevo presupuesto' : 'Editar presupuesto'}
            </p>
            <button onClick={cerrar} className="text-[#2C2420]/40 hover:text-[#2C2420]">
              <X size={18} />
            </button>
          </div>

          <div className="grid grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-xs font-medium text-[#2C2420]/60 mb-1.5">Tipo</label>
              <select
                value={form.tipo}
                onChange={(e) => setForm((f) => ({ ...f, tipo: e.target.value }))}
                className="w-full px-3 py-2 text-sm rounded-lg border border-black/10 focus:outline-none focus:ring-2 focus:ring-[#C9A96E]"
              >
                {Object.entries(TIPO_LABELS).map(([k, l]) => (
                  <option key={k} value={k}>{l}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#2C2420]/60 mb-1.5">Mes</label>
              <input
                type="month"
                value={form.mes}
                onChange={(e) => setForm((f) => ({ ...f, mes: e.target.value }))}
                className="w-full px-3 py-2 text-sm rounded-lg border border-black/10 focus:outline-none focus:ring-2 focus:ring-[#C9A96E]"
              />
              {mesTieneReales && (
                <p className="text-xs text-[#A85C52] mt-1">Este mes ya tiene ventas reales.</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-medium text-[#2C2420]/60 mb-1.5">Cantidad de vestidos</label>
              <input
                type="number"
                min="0"
                value={form.cantidad}
                onChange={(e) => setForm((f) => ({ ...f, cantidad: e.target.value }))}
                className="w-full px-3 py-2 text-sm rounded-lg border border-black/10 focus:outline-none focus:ring-2 focus:ring-[#C9A96E]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#2C2420]/60 mb-1.5">Monto total (CLP)</label>
              <div className="flex items-center gap-1.5">
                <input
                  type="number"
                  min="0"
                  value={form.montoTotal}
                  onChange={(e) => setForm((f) => ({ ...f, montoTotal: e.target.value }))}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-black/10 focus:outline-none focus:ring-2 focus:ring-[#C9A96E]"
                />
                {precioEstandarPorTipo[form.tipo] > 0 && (
                  <button
                    type="button"
                    onClick={sugerirMonto}
                    title={`Sugerir con precio estándar (${formatCLP(precioEstandarPorTipo[form.tipo])} c/u)`}
                    className="shrink-0 p-2 rounded-lg border border-black/10 text-[#C9A96E] hover:bg-[#C9A96E]/10"
                  >
                    <Wand2 size={15} />
                  </button>
                )}
              </div>
            </div>
          </div>

          <PresupuestoCuotasEditor cuotas={cuotas} onChange={setCuotas} montoTotal={form.montoTotal} />

          <div className="flex justify-end gap-3 mt-5">
            <button onClick={cerrar} className="px-4 py-2 text-sm rounded-lg text-[#2C2420]/70 hover:bg-black/5">
              Cancelar
            </button>
            <button
              onClick={guardar}
              disabled={saving || !form.mes}
              className="px-4 py-2 text-sm rounded-lg text-white disabled:opacity-60"
              style={{ backgroundColor: '#1A1A2E' }}
            >
              {saving ? 'Guardando…' : 'Guardar presupuesto'}
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-black/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-[#2C2420]/50 uppercase tracking-wide border-b border-black/5">
                <th className="px-5 py-3 font-medium whitespace-nowrap">Mes</th>
                <th className="px-5 py-3 font-medium whitespace-nowrap">Tipo</th>
                <th className="px-5 py-3 font-medium whitespace-nowrap text-right">Cantidad</th>
                <th className="px-5 py-3 font-medium whitespace-nowrap text-right">Monto total</th>
                <th className="px-5 py-3 font-medium whitespace-nowrap text-right">Cuotas</th>
                <th className="px-5 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {presupuestos.map((p) => (
                <tr key={p.id} className="border-b border-black/5 last:border-0 hover:bg-[#FAFAF8]">
                  <td className="px-5 py-3 whitespace-nowrap">{formatMesCorto(p.mes.slice(0, 7))}</td>
                  <td className="px-5 py-3 whitespace-nowrap">{TIPO_LABELS[p.tipo]}</td>
                  <td className="px-5 py-3 text-right">{p.cantidad}</td>
                  <td className="px-5 py-3 text-right font-medium">{formatCLP(p.montoTotal)}</td>
                  <td className="px-5 py-3 text-right text-[#2C2420]/60">{p.cuotas.length}</td>
                  <td className="px-5 py-3">
                    <div className="flex items-center justify-end gap-3">
                      <button onClick={() => openEditar(p)} className="text-[#2C2420]/50 hover:text-[#2C2420]">
                        <Pencil size={15} />
                      </button>
                      <button onClick={() => eliminar(p)} className="text-[#A85C52]/70 hover:text-[#A85C52]">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {presupuestos.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-sm text-[#2C2420]/40">
                    Aún no hay presupuesto de ventas cargado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
