import { useEffect, useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { api } from '../lib/api.js';
import { TIPO_LABELS, formatFecha } from '../lib/format.js';

export default function VentasMultiSelect({ value, onChange }) {
  const [ventas, setVentas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');

  useEffect(() => {
    api
      .get('/ventas?estado=NO_ENTREGADO')
      .then((data) => {
        const ordenadas = [...data].sort((a, b) =>
          a.nombreClienta.localeCompare(b.nombreClienta, 'es')
        );
        setVentas(ordenadas);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtradas = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return ventas;
    return ventas.filter(
      (v) => v.codigo.toLowerCase().includes(q) || v.nombreClienta.toLowerCase().includes(q)
    );
  }, [ventas, query]);

  function toggle(id) {
    onChange(value.includes(id) ? value.filter((v) => v !== id) : [...value, id]);
  }

  const idsFiltradas = filtradas.map((v) => v.id);
  const todasFiltradasSeleccionadas =
    idsFiltradas.length > 0 && idsFiltradas.every((id) => value.includes(id));

  function toggleTodas() {
    if (todasFiltradasSeleccionadas) {
      onChange(value.filter((id) => !idsFiltradas.includes(id)));
    } else {
      onChange([...new Set([...value, ...idsFiltradas])]);
    }
  }

  if (loading) return <p className="text-xs text-[#2C2420]/40">Cargando vestidos…</p>;

  if (ventas.length === 0) {
    return (
      <p className="text-xs text-[#2C2420]/40">
        No hay vestidos con estado "No entregado" para asignarles este costo.
      </p>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-3 mb-2">
        <div className="relative flex-1">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#2C2420]/40" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar por código o clienta"
            className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-black/10 focus:outline-none focus:ring-2 focus:ring-[#C9A96E]"
          />
        </div>
        <label className="flex items-center gap-1.5 text-xs text-[#2C2420]/70 shrink-0 cursor-pointer">
          <input
            type="checkbox"
            checked={todasFiltradasSeleccionadas}
            onChange={toggleTodas}
            className="accent-[#C9A96E]"
          />
          Seleccionar {query ? 'filtrados' : 'todos'}
        </label>
      </div>

      <div className="max-h-56 overflow-y-auto border border-black/5 rounded-lg divide-y divide-black/5">
        {filtradas.map((v) => (
          <label
            key={v.id}
            className="flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-[#FAFAF8] cursor-pointer"
          >
            <input
              type="checkbox"
              checked={value.includes(v.id)}
              onChange={() => toggle(v.id)}
              className="accent-[#C9A96E]"
            />
            <span className="flex-1">
              <span className="font-medium text-[#2C2420]">{v.codigo}</span>{' '}
              <span className="text-[#2C2420]/60">— {v.nombreClienta}</span>
            </span>
            <span className="text-xs text-[#2C2420]/50 shrink-0">
              {TIPO_LABELS[v.tipo]} · Evento {formatFecha(v.fechaEvento)}
            </span>
          </label>
        ))}
        {filtradas.length === 0 && (
          <p className="text-xs text-[#2C2420]/40 px-3 py-4 text-center">Sin resultados.</p>
        )}
      </div>

      <p className="text-xs text-[#2C2420]/50 mt-2">
        {value.length} de {ventas.length} vestido{ventas.length === 1 ? '' : 's'} seleccionado
        {value.length === 1 ? '' : 's'}.
      </p>
    </div>
  );
}
