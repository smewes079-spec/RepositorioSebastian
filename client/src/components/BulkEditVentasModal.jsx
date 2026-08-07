import { useState } from 'react';
import { X } from 'lucide-react';
import { api } from '../lib/api.js';
import { TIPO_LABELS, ESTADO_LABELS, KANBAN_LABELS } from '../lib/format.js';

const SIN_CAMBIO = '__sin_cambio__';

export default function BulkEditVentasModal({ ventaIds, onClose, onSaved }) {
  const [estado, setEstado] = useState(SIN_CAMBIO);
  const [tipo, setTipo] = useState(SIN_CAMBIO);
  const [kanbanEstado, setKanbanEstado] = useState(SIN_CAMBIO);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const payload = {};
  if (estado !== SIN_CAMBIO) payload.estado = estado;
  if (tipo !== SIN_CAMBIO) payload.tipo = tipo;
  if (kanbanEstado !== SIN_CAMBIO) payload.kanbanEstado = kanbanEstado;
  const hayCambios = Object.keys(payload).length > 0;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!hayCambios) return;
    setSaving(true);
    setError('');
    try {
      const resultados = await Promise.allSettled(
        ventaIds.map((id) => api.put(`/ventas/${id}`, payload))
      );
      const fallidas = resultados.filter((r) => r.status === 'rejected').length;
      if (fallidas > 0) {
        setError(`${fallidas} de ${ventaIds.length} ventas no se pudieron actualizar.`);
      } else {
        onSaved?.();
        onClose();
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl w-full max-w-md p-7">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-serif text-xl text-[#2C2420]">
            Editar {ventaIds.length} venta{ventaIds.length === 1 ? '' : 's'} seleccionada
            {ventaIds.length === 1 ? '' : 's'}
          </h2>
          <button onClick={onClose} className="text-[#2C2420]/40 hover:text-[#2C2420]">
            <X size={20} />
          </button>
        </div>

        <p className="text-xs text-[#2C2420]/60 mb-5 leading-relaxed">
          Elige el nuevo valor solo en los campos que quieras cambiar. Los que dejes en
          "— No cambiar —" se mantienen tal como están en cada venta.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#2C2420]/60 mb-1.5">
              Estado de entrega
            </label>
            <select
              value={estado}
              onChange={(e) => setEstado(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-black/10 focus:outline-none focus:ring-2 focus:ring-[#C9A96E]"
            >
              <option value={SIN_CAMBIO}>— No cambiar —</option>
              {Object.entries(ESTADO_LABELS).map(([k, l]) => (
                <option key={k} value={k}>
                  {l}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#2C2420]/60 mb-1.5">
              Tipo de vestido
            </label>
            <select
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-black/10 focus:outline-none focus:ring-2 focus:ring-[#C9A96E]"
            >
              <option value={SIN_CAMBIO}>— No cambiar —</option>
              {Object.entries(TIPO_LABELS).map(([k, l]) => (
                <option key={k} value={k}>
                  {l}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-[#2C2420]/60 mb-1.5">
              Estado de producción
            </label>
            <select
              value={kanbanEstado}
              onChange={(e) => setKanbanEstado(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-black/10 focus:outline-none focus:ring-2 focus:ring-[#C9A96E]"
            >
              <option value={SIN_CAMBIO}>— No cambiar —</option>
              {Object.entries(KANBAN_LABELS).map(([k, l]) => (
                <option key={k} value={k}>
                  {l}
                </option>
              ))}
            </select>
          </div>

          {error && <p className="text-sm text-[#A85C52]">{error}</p>}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm rounded-lg text-[#2C2420]/70 hover:bg-black/5"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!hayCambios || saving}
              className="px-4 py-2 text-sm rounded-lg text-white disabled:opacity-50"
              style={{ backgroundColor: '#1A1A2E' }}
            >
              {saving ? 'Guardando…' : `Guardar en ${ventaIds.length}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
