import { useState } from 'react';
import { X } from 'lucide-react';
import { api } from '../lib/api.js';
import { CATEGORIA_LABELS } from '../lib/format.js';

const SIN_CAMBIO = '__sin_cambio__';

export default function BulkEditComprasModal({ compraIds, onClose, onSaved }) {
  const [categoria, setCategoria] = useState(SIN_CAMBIO);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const payload = {};
  if (categoria !== SIN_CAMBIO) payload.categoria = categoria;
  const hayCambios = Object.keys(payload).length > 0;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!hayCambios) return;
    setSaving(true);
    setError('');
    try {
      const resultados = await Promise.allSettled(
        compraIds.map((id) => api.put(`/purchases/${id}`, payload))
      );
      const fallidas = resultados.filter((r) => r.status === 'rejected').length;
      if (fallidas > 0) {
        setError(`${fallidas} de ${compraIds.length} compras no se pudieron actualizar.`);
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
            Editar {compraIds.length} compra{compraIds.length === 1 ? '' : 's'} seleccionada
            {compraIds.length === 1 ? '' : 's'}
          </h2>
          <button onClick={onClose} className="text-[#2C2420]/40 hover:text-[#2C2420]">
            <X size={20} />
          </button>
        </div>

        <p className="text-xs text-[#2C2420]/60 mb-5 leading-relaxed">
          Elige el nuevo valor solo en los campos que quieras cambiar. Los que dejes en
          "— No cambiar —" se mantienen tal como están en cada compra.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#2C2420]/60 mb-1.5">Categoría</label>
            <select
              value={categoria}
              onChange={(e) => setCategoria(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-black/10 focus:outline-none focus:ring-2 focus:ring-[#C9A96E]"
            >
              <option value={SIN_CAMBIO}>— No cambiar —</option>
              {Object.entries(CATEGORIA_LABELS).map(([k, l]) => (
                <option key={k} value={k}>
                  {l}
                </option>
              ))}
            </select>
          </div>

          <p className="text-xs text-[#2C2420]/40 leading-relaxed">
            El tipo de asignación (Directo / Consumo estimado / Prorrateo) no se puede editar en
            lote porque cada compra necesita sus propios datos (venta, consumos, etc.). Ábrela
            individualmente para cambiarlo.
          </p>

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
              {saving ? 'Guardando…' : `Guardar en ${compraIds.length}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
