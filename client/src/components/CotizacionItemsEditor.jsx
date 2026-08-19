import { Plus, Trash2 } from 'lucide-react';
import { formatCLP } from '../lib/format.js';
import MoneyInput from './MoneyInput.jsx';

export default function CotizacionItemsEditor({ items, onChange }) {
  function update(idx, patch) {
    const next = items.map((it, i) => (i === idx ? { ...it, ...patch } : it));
    onChange(next);
  }

  function addItem() {
    onChange([...items, { orden: items.length + 1, descripcion: '', cantidad: 1, monto: 0 }]);
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

      <div className="space-y-2">
        {items.map((it, idx) => (
          <div
            key={idx}
            className="flex items-center gap-2 bg-[#FAFAF8] border border-black/5 rounded-lg px-3 py-2.5"
          >
            <input
              value={it.descripcion}
              onChange={(e) => update(idx, { descripcion: e.target.value })}
              placeholder="Descripción (ej: Vestido a medida, encaje adicional...)"
              className="flex-1 px-2 py-1.5 text-sm rounded-md border border-black/10 focus:outline-none focus:ring-2 focus:ring-[#C9A96E]"
            />
            <input
              type="number"
              min="1"
              value={it.cantidad}
              onChange={(e) => update(idx, { cantidad: Number(e.target.value) || 1 })}
              className="w-16 px-2 py-1.5 text-sm rounded-md border border-black/10 focus:outline-none focus:ring-2 focus:ring-[#C9A96E]"
            />
            <MoneyInput
              value={it.monto}
              onChange={(monto) => update(idx, { monto })}
              placeholder="Monto"
              className="w-32 px-2 py-1.5 text-sm rounded-md border border-black/10 focus:outline-none focus:ring-2 focus:ring-[#C9A96E]"
            />
            <span className="w-28 text-right text-sm text-[#2C2420]/70 shrink-0">
              {formatCLP((Number(it.cantidad) || 0) * (Number(it.monto) || 0))}
            </span>
            <button
              type="button"
              onClick={() => removeItem(idx)}
              className="text-[#A85C52]/70 hover:text-[#A85C52]"
            >
              <Trash2 size={15} />
            </button>
          </div>
        ))}
        {items.length === 0 && (
          <p className="text-xs text-[#2C2420]/40 py-4 text-center">Sin ítems agregados.</p>
        )}
      </div>

      <div className="flex justify-end mt-3 text-sm">
        Total: <strong className="text-[#2C2420] ml-2">{formatCLP(total)}</strong>
      </div>
    </div>
  );
}
