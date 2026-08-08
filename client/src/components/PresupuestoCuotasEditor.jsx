import { Plus, Trash2 } from 'lucide-react';
import { formatCLP } from '../lib/format.js';
import MoneyInput from './MoneyInput.jsx';

export default function PresupuestoCuotasEditor({ cuotas, onChange, montoTotal }) {
  function update(idx, patch) {
    onChange(cuotas.map((c, i) => (i === idx ? { ...c, ...patch } : c)));
  }

  function addCuota() {
    onChange([...cuotas, { numero: cuotas.length + 1, monto: 0, fecha: '' }]);
  }

  function removeCuota(idx) {
    onChange(cuotas.filter((_, i) => i !== idx).map((c, i) => ({ ...c, numero: i + 1 })));
  }

  const totalCuotas = cuotas.reduce((s, c) => s + (Number(c.monto) || 0), 0);
  const diferencia = (Number(montoTotal) || 0) - totalCuotas;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-medium text-[#2C2420]/70">
          Plan de cobro estimado ({cuotas.length} cuotas)
        </p>
        <button
          type="button"
          onClick={addCuota}
          className="flex items-center gap-1 text-xs font-medium text-[#C9A96E] hover:opacity-70"
        >
          <Plus size={13} />
          Agregar cuota
        </button>
      </div>
      <div className="space-y-2">
        {cuotas.map((c, idx) => (
          <div key={idx} className="flex items-center gap-2 bg-[#FAFAF8] border border-black/5 rounded-lg px-3 py-2">
            <span className="text-xs text-[#2C2420]/40 w-14 shrink-0">Cuota {c.numero}</span>
            <MoneyInput
              value={c.monto}
              onChange={(monto) => update(idx, { monto })}
              placeholder="Monto"
              className="w-28 px-2 py-1.5 text-sm rounded-md border border-black/10 focus:outline-none focus:ring-2 focus:ring-[#C9A96E]"
            />
            <input
              type="date"
              value={c.fecha}
              onChange={(e) => update(idx, { fecha: e.target.value })}
              className="px-2 py-1.5 text-sm rounded-md border border-black/10 focus:outline-none focus:ring-2 focus:ring-[#C9A96E]"
            />
            <button
              type="button"
              onClick={() => removeCuota(idx)}
              className="ml-auto text-[#A85C52]/70 hover:text-[#A85C52]"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
        {cuotas.length === 0 && (
          <p className="text-xs text-[#2C2420]/40 py-2 text-center">Sin cuotas definidas.</p>
        )}
      </div>
      {diferencia !== 0 && cuotas.length > 0 && (
        <p className="text-xs text-[#A85C52] mt-2">
          Diferencia vs. monto total: {formatCLP(diferencia)}
        </p>
      )}
    </div>
  );
}
