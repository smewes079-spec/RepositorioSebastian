import { formatCLP } from '../lib/format.js';

function Card({ label, value, accent }) {
  return (
    <div className="bg-white rounded-xl border border-black/5 px-5 py-4 flex-1 min-w-[180px]">
      <p className="text-xs font-medium text-[#2C2420]/50 uppercase tracking-wide mb-1.5">
        {label}
      </p>
      <p
        className="font-serif text-2xl"
        style={{ color: accent || '#2C2420' }}
      >
        {value}
      </p>
    </div>
  );
}

export default function ResumenCards({ resumen }) {
  if (!resumen) return null;
  return (
    <div className="flex flex-wrap gap-4 mb-8">
      <Card label="Total vendido" value={formatCLP(resumen.totalVendido)} />
      <Card label="Total cobrado" value={formatCLP(resumen.totalCobrado)} accent="#5C8C6A" />
      <Card label="Por cobrar" value={formatCLP(resumen.totalPorCobrar)} accent="#A85C52" />
      <Card label="N° de ventas" value={resumen.cantidadVentas} />
    </div>
  );
}
