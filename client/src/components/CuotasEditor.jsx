import { Plus, Trash2 } from 'lucide-react';
import { formatCLP } from '../lib/format.js';
import MoneyInput from './MoneyInput.jsx';

export default function CuotasEditor({ cuotas, onChange, precioTotal }) {
  function update(idx, patch) {
    const next = cuotas.map((c, i) => (i === idx ? { ...c, ...patch } : c));
    onChange(next);
  }

  function addCuota() {
    onChange([
      ...cuotas,
      {
        numero: cuotas.length + 1,
        monto: 0,
        fechaProgramada: '',
        pagada: false,
        fechaPago: '',
      },
    ]);
  }

  function removeCuota(idx) {
    const next = cuotas
      .filter((_, i) => i !== idx)
      .map((c, i) => ({ ...c, numero: i + 1 }));
    onChange(next);
  }

  const totalCuotas = cuotas.reduce((s, c) => s + (Number(c.monto) || 0), 0);
  const totalPagado = cuotas
    .filter((c) => c.pagada)
    .reduce((s, c) => s + (Number(c.montoPagado ?? c.monto) || 0), 0);
  const diferencia = (Number(precioTotal) || 0) - totalCuotas;

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium text-[#2C2420]">Plan de pagos ({cuotas.length} cuotas)</p>
        <button
          type="button"
          onClick={addCuota}
          className="flex items-center gap-1.5 text-xs font-medium text-[#C9A96E] hover:opacity-70"
        >
          <Plus size={14} />
          Agregar cuota
        </button>
      </div>

      <div className="space-y-2">
        {cuotas.map((c, idx) => (
          <div
            key={idx}
            className="flex items-center gap-2 bg-[#FAFAF8] border border-black/5 rounded-lg px-3 py-2.5"
          >
            <span className="text-xs text-[#2C2420]/40 w-14 shrink-0">Cuota {c.numero}</span>
            <MoneyInput
              value={c.monto}
              onChange={(monto) => update(idx, { monto })}
              placeholder="Monto"
              className="w-32 px-2 py-1.5 text-sm rounded-md border border-black/10 focus:outline-none focus:ring-2 focus:ring-[#C9A96E]"
            />
            <input
              type="date"
              value={c.fechaProgramada}
              onChange={(e) => update(idx, { fechaProgramada: e.target.value })}
              className="px-2 py-1.5 text-sm rounded-md border border-black/10 focus:outline-none focus:ring-2 focus:ring-[#C9A96E]"
            />
            <label className="flex items-center gap-1.5 text-xs text-[#2C2420]/70 shrink-0">
              <input
                type="checkbox"
                checked={c.pagada}
                onChange={(e) =>
                  update(idx, {
                    pagada: e.target.checked,
                    fechaPago: e.target.checked ? c.fechaPago || c.fechaProgramada : '',
                    montoPagado: e.target.checked ? c.montoPagado ?? c.monto : null,
                  })
                }
              />
              Pagada
            </label>
            {c.pagada && (
              <input
                type="date"
                value={c.fechaPago || ''}
                onChange={(e) => update(idx, { fechaPago: e.target.value })}
                className="px-2 py-1.5 text-sm rounded-md border border-black/10 focus:outline-none focus:ring-2 focus:ring-[#C9A96E]"
              />
            )}
            <button
              type="button"
              onClick={() => removeCuota(idx)}
              className="ml-auto text-[#A85C52]/70 hover:text-[#A85C52]"
            >
              <Trash2 size={15} />
            </button>
          </div>
        ))}
        {cuotas.length === 0 && (
          <p className="text-xs text-[#2C2420]/40 py-4 text-center">Sin cuotas definidas.</p>
        )}
      </div>

      <div className="flex gap-6 mt-3 text-xs text-[#2C2420]/60">
        <span>
          Suma cuotas: <strong className="text-[#2C2420]">{formatCLP(totalCuotas)}</strong>
        </span>
        <span>
          Cobrado: <strong className="text-[#5C8C6A]">{formatCLP(totalPagado)}</strong>
        </span>
        {diferencia !== 0 && (
          <span className="text-[#A85C52]">
            Diferencia vs. precio total: {formatCLP(diferencia)}
          </span>
        )}
      </div>
    </div>
  );
}
