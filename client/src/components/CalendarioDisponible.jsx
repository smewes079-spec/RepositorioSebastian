import { useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

// Calendario mensual para /agendar: días con horas libres destacados y
// elegibles; el resto (pasados, fines de semana, sin horas o fuera de la
// regla del segmento) en gris y tachados. Recibe `dias` tal como los entrega
// GET /api/agenda-publica/horarios: [{ fecha: 'YYYY-MM-DD', horas: [...] }].

const MESES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
const SEMANA = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

const clave = (y, m, d) => `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
const mesDe = (fecha) => {
  const [y, m] = fecha.split('-').map(Number);
  return { y, m: m - 1 };
};

export default function CalendarioDisponible({ dias, seleccionado, onSeleccionar, hoy }) {
  const disponibles = useMemo(() => new Set(dias.map((d) => d.fecha)), [dias]);
  // Meses navegables: desde el mes de hoy hasta el del último día de la agenda.
  const primero = mesDe(hoy);
  const ultimo = mesDe(dias[dias.length - 1]?.fecha || hoy);
  const [vista, setVista] = useState(() => mesDe(seleccionado || dias[0]?.fecha || hoy));

  const idx = (v) => v.y * 12 + v.m;
  const mover = (delta) => {
    const t = idx(vista) + delta;
    if (t < idx(primero) || t > idx(ultimo)) return;
    setVista({ y: Math.floor(t / 12), m: t % 12 });
  };

  const { y, m } = vista;
  const desfase = (new Date(Date.UTC(y, m, 1)).getUTCDay() + 6) % 7; // lunes = 0
  const totalDias = new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  const puedeAtras = idx(vista) > idx(primero);
  const puedeAdelante = idx(vista) < idx(ultimo);

  return (
    <div className="bg-white rounded-xl border border-black/5 p-4">
      <div className="flex items-center justify-between mb-3">
        <button
          type="button"
          onClick={() => mover(-1)}
          disabled={!puedeAtras}
          aria-label="Mes anterior"
          className="p-1.5 rounded-lg hover:bg-black/5 disabled:opacity-20"
        >
          <ChevronLeft size={18} />
        </button>
        <p className="font-serif text-lg">
          {MESES[m]} {y}
        </p>
        <button
          type="button"
          onClick={() => mover(1)}
          disabled={!puedeAdelante}
          aria-label="Mes siguiente"
          className="p-1.5 rounded-lg hover:bg-black/5 disabled:opacity-20"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1.5 text-center">
        {SEMANA.map((s) => (
          <div key={s} className="text-[11px] text-[#2C2420]/50 pb-1">
            {s}
          </div>
        ))}
        {Array.from({ length: desfase }, (_, i) => (
          <div key={`v${i}`} />
        ))}
        {Array.from({ length: totalDias }, (_, i) => {
          const d = i + 1;
          const fecha = clave(y, m, d);
          const libre = disponibles.has(fecha);
          const elegido = fecha === seleccionado;
          return (
            <div key={fecha} className="flex justify-center">
              <button
                type="button"
                disabled={!libre}
                onClick={() => onSeleccionar(fecha)}
                aria-label={libre ? `${d} de ${MESES[m]}, con horas disponibles` : `${d} de ${MESES[m]}, sin horas`}
                aria-pressed={elegido}
                className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full text-sm transition-colors ${
                  elegido
                    ? 'bg-[#1A1A2E] text-white'
                    : libre
                      ? 'bg-[#E3D3CD] text-[#3F2F2A] font-medium hover:bg-[#D6C2BB]'
                      : 'bg-[#F6F4F1] text-[#2C2420]/25 line-through cursor-default'
                } ${fecha === hoy && !elegido ? 'ring-1 ring-[#C9A96E]' : ''}`}
              >
                {String(d).padStart(2, '0')}
              </button>
            </div>
          );
        })}
      </div>

      <div className="flex justify-center gap-4 mt-4 text-[11px] text-[#2C2420]/60">
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-full bg-[#E3D3CD]" /> Con horas
        </span>
        <span className="flex items-center gap-1.5">
          <span className="inline-block w-3 h-3 rounded-full bg-[#F6F4F1] border border-black/10" /> Sin horas
        </span>
      </div>
    </div>
  );
}
