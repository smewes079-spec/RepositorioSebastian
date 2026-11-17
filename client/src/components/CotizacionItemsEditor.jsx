import { Plus, Trash2 } from 'lucide-react';
import { formatCLP } from '../lib/format.js';
import MoneyInput from './MoneyInput.jsx';

// Títulos frecuentes que se sugieren al escribir (se puede poner cualquier otro).
const TITULOS_SUGERIDOS = ['Vestido a medida', 'Cola', 'Velo', 'Estola', 'Capa', 'Bolero', 'Ajustes', 'Tocado'];

const inputClass =
  'px-2 py-1.5 text-sm rounded-md border border-black/10 focus:outline-none focus:ring-2 focus:ring-[#C9A96E]';

// Cada ítem es un bloque en el PDF: título (etiqueta rosada), descripción y
// su propio precio. Al final del PDF va el total de la cotización.
export default function CotizacionItemsEditor({ items, onChange }) {
  function update(idx, patch) {
    const next = items.map((it, i) => (i === idx ? { ...it, ...patch } : it));
    onChange(next);
  }

  function addItem() {
    onChange([...items, { orden: items.length + 1, titulo: '', descripcion: '', cantidad: 1, monto: 0 }]);
  }

  function removeItem(idx) {
    const next = items.filter((_, i) => i !== idx).map((it, i) => ({ ...it, orden: i + 1 }));
    onChange(next);
  }

  const total = items.reduce((s, it) => s + (Number(it.cantidad) || 0) * (Number(it.monto) || 0), 0);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium text-[#2C2420]">Ítems de la cotización ({items.length})</p>
        <button
          type="button"
          onClick={addItem}
          className="flex items-center gap-1.5 text-xs font-medium text-[#C9A96E] hover:opacity-70"
        >
          <Plus size={14} />
          Agregar ítem
        </button>
      </div>

      <datalist id="cotizacion-titulos-sugeridos">
        {TITULOS_SUGERIDOS.map((t) => (
          <option key={t} value={t} />
        ))}
      </datalist>

      <div className="space-y-3">
        {items.map((it, idx) => (
          <div key={idx} className="bg-[#FAFAF8] border border-black/5 rounded-lg px-3 py-3 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <input
                value={it.titulo || ''}
                onChange={(e) => update(idx, { titulo: e.target.value })}
                list="cotizacion-titulos-sugeridos"
                placeholder="Título (ej: Vestido a medida, Cola, Velo...)"
                className={`flex-1 min-w-[12rem] font-medium ${inputClass}`}
              />
              <label className="flex items-center gap-1 text-xs text-[#2C2420]/50">
                Cant.
                <input
                  type="number"
                  min="1"
                  value={it.cantidad}
                  onChange={(e) => update(idx, { cantidad: Number(e.target.value) || 1 })}
                  className={`w-14 ${inputClass}`}
                />
              </label>
              <MoneyInput
                value={it.monto}
                onChange={(monto) => update(idx, { monto })}
                placeholder="Precio"
                className={`w-32 ${inputClass}`}
              />
              <span className="w-28 text-right text-sm font-medium text-[#2C2420]/80 shrink-0">
                {formatCLP((Number(it.cantidad) || 0) * (Number(it.monto) || 0))}
              </span>
              <button
                type="button"
                onClick={() => removeItem(idx)}
                title="Quitar ítem"
                className="text-[#A85C52]/70 hover:text-[#A85C52]"
              >
                <Trash2 size={15} />
              </button>
            </div>
            <textarea
              value={it.descripcion}
              onChange={(e) => update(idx, { descripcion: e.target.value })}
              placeholder="Descripción (ej: Vestido strapless con top en crepe, corte en diagonal...)"
              rows={3}
              className={`w-full resize-y ${inputClass}`}
            />
          </div>
        ))}
        {items.length === 0 && (
          <p className="text-xs text-[#2C2420]/40 py-4 text-center">Sin ítems agregados.</p>
        )}
      </div>

      <div className="flex justify-end mt-3 text-sm">
        Total cotización: <strong className="text-[#2C2420] ml-2">{formatCLP(total)}</strong>
      </div>
    </div>
  );
}
