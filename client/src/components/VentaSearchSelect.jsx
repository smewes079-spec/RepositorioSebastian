import { useEffect, useMemo, useRef, useState } from 'react';
import { Search } from 'lucide-react';
import { api } from '../lib/api.js';
import { TIPO_LABELS, formatFecha } from '../lib/format.js';

export default function VentaSearchSelect({ value, onChange }) {
  const [ventas, setVentas] = useState([]);
  const [query, setQuery] = useState('');
  const [seleccion, setSeleccion] = useState(value || null);
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    api
      .get('/ventas?estado=NO_ENTREGADO')
      .then((data) => {
        const ordenadas = [...data].sort((a, b) =>
          a.nombreClienta.localeCompare(b.nombreClienta, 'es')
        );
        setVentas(ordenadas);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    function handleClickOutside(e) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const resultados = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ventas;
    return ventas.filter(
      (v) => v.codigo.toLowerCase().includes(q) || v.nombreClienta.toLowerCase().includes(q)
    );
  }, [ventas, query]);

  function select(venta) {
    setSeleccion(venta);
    onChange(venta.id);
    setOpen(false);
    setQuery('');
  }

  return (
    <div className="relative" ref={wrapperRef}>
      {seleccion ? (
        <div className="flex items-center justify-between px-3 py-2 rounded-lg border border-[#C9A96E] bg-[#FAFAF8] text-sm">
          <span>
            <strong>{seleccion.codigo}</strong> — {seleccion.nombreClienta} ({TIPO_LABELS[seleccion.tipo]}
            )
          </span>
          <button
            type="button"
            onClick={() => {
              setSeleccion(null);
              onChange('');
            }}
            className="text-xs text-[#A85C52] hover:underline"
          >
            Cambiar
          </button>
        </div>
      ) : (
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#2C2420]/40" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setOpen(true)}
            placeholder="Buscar por código o nombre de clienta"
            className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-black/10 focus:outline-none focus:ring-2 focus:ring-[#C9A96E]"
          />
          {open && (
            <div className="absolute z-10 mt-1 w-full bg-white rounded-lg border border-black/10 shadow-lg max-h-56 overflow-y-auto">
              {resultados.length > 0 ? (
                resultados.map((v) => (
                  <button
                    type="button"
                    key={v.id}
                    onClick={() => select(v)}
                    className="w-full text-left px-3 py-2 text-sm hover:bg-[#FAFAF8] flex flex-col"
                  >
                    <span className="font-medium text-[#2C2420]">
                      {v.codigo} — {v.nombreClienta}
                    </span>
                    <span className="text-xs text-[#2C2420]/50">
                      {TIPO_LABELS[v.tipo]} · Evento {formatFecha(v.fechaEvento)}
                    </span>
                  </button>
                ))
              ) : (
                <p className="text-xs text-[#2C2420]/40 px-3 py-3">Sin resultados.</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
