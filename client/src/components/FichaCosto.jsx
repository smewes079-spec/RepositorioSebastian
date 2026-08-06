import { useEffect, useState } from 'react';
import { AlertTriangle } from 'lucide-react';
import { api } from '../lib/api.js';
import { formatCLP, formatFecha, CATEGORIA_LABELS, TIPO_ASIGNACION_CORTO } from '../lib/format.js';

export default function FichaCosto({ ventaId }) {
  const [ficha, setFicha] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!ventaId) return;
    api
      .get(`/ventas/${ventaId}/costo`)
      .then(setFicha)
      .catch((err) => setError(err.message));
  }, [ventaId]);

  if (error) return <p className="text-sm text-[#A85C52]">{error}</p>;
  if (!ficha) return <p className="text-sm text-[#2C2420]/40">Cargando ficha de costo…</p>;

  const { materiales, manoDeObra, margen, margenPct } = ficha;

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-medium text-[#2C2420]">Precio de venta negociado</p>
        <p className="font-serif text-xl text-[#2C2420]">{formatCLP(ficha.precioVenta)}</p>
      </div>

      <div className="border-t border-black/5 pt-4 mb-2">
        <div className="flex items-center justify-between mb-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-[#2C2420]/50">
            Costos de materiales
          </p>
          {materiales.esEstimado && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[#F5E9E7] text-[#A85C52]">
              <AlertTriangle size={12} />
              Costo estimado — sin insumos registrados
            </span>
          )}
        </div>

        {materiales.items.length > 0 ? (
          <div className="space-y-1.5 mb-2">
            {materiales.items.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between text-sm bg-[#FAFAF8] rounded-lg px-3 py-2"
              >
                <div>
                  <p className="text-[#2C2420]">{item.descripcion}</p>
                  <p className="text-xs text-[#2C2420]/50">
                    {CATEGORIA_LABELS[item.categoria]} · {TIPO_ASIGNACION_CORTO[item.tipoAsignacion]} ·{' '}
                    {formatFecha(item.fecha)}
                  </p>
                </div>
                <p className="font-medium text-[#2C2420]">{formatCLP(item.montoAsignado)}</p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-[#2C2420]/50 mb-2">
            Sin insumos registrados para este vestido. Se usa el costo estándar de tipo{' '}
            {ficha.tipo.toLowerCase()} configurado en Configuración.
          </p>
        )}

        <div className="flex items-center justify-between text-sm font-medium">
          <p className="text-[#2C2420]/70">Subtotal materiales</p>
          <p className="text-[#A85C52]">({formatCLP(materiales.monto)})</p>
        </div>
      </div>

      <div className="border-t border-black/5 pt-4 mt-4">
        <div className="flex items-center justify-between text-sm font-medium">
          <div>
            <p className="text-[#2C2420]">Mano de obra estimada</p>
            <p className="text-xs text-[#2C2420]/50">
              Sueldos modistas vigentes ({formatCLP(manoDeObra.sueldosModistas)}) ÷{' '}
              {manoDeObra.cantidadVestidosActivos} vestidos activos este mes
            </p>
          </div>
          <p className="text-[#A85C52]">({formatCLP(manoDeObra.monto)})</p>
        </div>
      </div>

      <div className="border-t border-black/10 pt-4 mt-4">
        <div className="flex items-center justify-between">
          <p className="font-serif text-lg text-[#2C2420]">Margen real del vestido</p>
          <p className="font-serif text-xl" style={{ color: margen >= 0 ? '#5C8C6A' : '#A85C52' }}>
            {formatCLP(margen)}
          </p>
        </div>
        <div className="flex items-center justify-between mt-1">
          <p className="text-xs text-[#2C2420]/50">Margen %</p>
          <p className="text-sm font-medium" style={{ color: margen >= 0 ? '#5C8C6A' : '#A85C52' }}>
            {margenPct}%
          </p>
        </div>
      </div>

      <p className="text-xs text-[#2C2420]/40 mt-4 leading-relaxed">
        Nota: los costos fijos (arriendo, servicios, etc.) no se incluyen en esta ficha — se
        analizan a nivel global en el Estado de Resultados.
      </p>
    </div>
  );
}
