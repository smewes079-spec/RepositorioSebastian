import { useEffect, useMemo, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { X } from 'lucide-react';
import Layout from '../components/Layout.jsx';
import FilterableHeader from '../components/FilterableHeader.jsx';
import { useColumnFilters } from '../lib/useColumnFilters.js';
import { api } from '../lib/api.js';
import { formatCLP, formatFecha, TIPO_LABELS, TIPO_COLORS } from '../lib/format.js';

function mergeTendencias(porTipo) {
  const meses = new Set();
  porTipo.forEach((t) => t.tendenciaMensual.forEach((m) => meses.add(m.mes)));
  const ordenados = Array.from(meses).sort();
  return ordenados.map((mes) => {
    const fila = { mes };
    porTipo.forEach((t) => {
      const punto = t.tendenciaMensual.find((m) => m.mes === mes);
      fila[t.tipo] = punto ? punto.margenPct : null;
    });
    return fila;
  });
}

const COLUMNAS_POR_TIPO = {
  tipo: {
    label: 'Tipo',
    cell: (t) => (
      <span className="font-medium" style={{ color: TIPO_COLORS[t.tipo]?.text }}>
        {TIPO_LABELS[t.tipo]}
      </span>
    ),
    getValue: (t) => TIPO_LABELS[t.tipo],
  },
  cantidad: { label: 'Cantidad', align: 'right', cell: (t) => t.cantidad, getValue: (t) => String(t.cantidad) },
  precioMin: {
    label: 'Precio mín',
    align: 'right',
    cell: (t) => <span className="text-[#2C2420]/70">{formatCLP(t.precioMin)}</span>,
    getValue: (t) => formatCLP(t.precioMin),
  },
  precioProm: {
    label: 'Precio prom',
    align: 'right',
    cell: (t) => <span className="font-medium">{formatCLP(t.precioProm)}</span>,
    getValue: (t) => formatCLP(t.precioProm),
  },
  precioMax: {
    label: 'Precio máx',
    align: 'right',
    cell: (t) => <span className="text-[#2C2420]/70">{formatCLP(t.precioMax)}</span>,
    getValue: (t) => formatCLP(t.precioMax),
  },
  materialesProm: {
    label: 'Materiales prom',
    align: 'right',
    cell: (t) => formatCLP(t.costoMaterialesProm),
    getValue: (t) => formatCLP(t.costoMaterialesProm),
  },
  manoObraProm: {
    label: 'Mano de obra prom',
    align: 'right',
    cell: (t) => formatCLP(t.manoObraProm),
    getValue: (t) => formatCLP(t.manoObraProm),
  },
  margenProm: {
    label: 'Margen prom',
    align: 'right',
    cell: (t) => (
      <span className="font-medium" style={{ color: t.margenProm >= 0 ? '#5C8C6A' : '#A85C52' }}>
        {formatCLP(t.margenProm)}
      </span>
    ),
    getValue: (t) => formatCLP(t.margenProm),
  },
  margenPctProm: {
    label: 'Margen % prom',
    align: 'right',
    cell: (t) => (
      <span className="font-medium" style={{ color: t.margenPctProm >= 0 ? '#5C8C6A' : '#A85C52' }}>
        {t.margenPctProm}%
      </span>
    ),
    getValue: (t) => `${t.margenPctProm}%`,
  },
};
const ORDEN_POR_TIPO = [
  'tipo', 'cantidad', 'precioMin', 'precioProm', 'precioMax',
  'materialesProm', 'manoObraProm', 'margenProm', 'margenPctProm',
];

const COLUMNAS_DETALLE = {
  clienta: {
    label: 'Clienta',
    sortField: null,
    cell: (v) => (
      <>
        <p className="font-medium text-[#2C2420]">{v.nombreClienta}</p>
        <p className="text-xs text-[#2C2420]/40">{v.codigo}</p>
      </>
    ),
    getValue: (v) => v.nombreClienta,
  },
  tipo: {
    label: 'Tipo',
    sortField: 'tipo',
    cell: (v) => <span style={{ color: TIPO_COLORS[v.tipo]?.text }}>{TIPO_LABELS[v.tipo]}</span>,
    getValue: (v) => TIPO_LABELS[v.tipo],
  },
  fechaVenta: {
    label: 'Fecha venta',
    sortField: 'fechaVenta',
    cell: (v) => <span className="text-[#2C2420]/70">{formatFecha(v.fechaVenta)}</span>,
    getValue: (v) => formatFecha(v.fechaVenta),
  },
  precioVenta: {
    label: 'Precio',
    align: 'right',
    sortField: 'precioVenta',
    cell: (v) => <span className="font-medium">{formatCLP(v.precioVenta)}</span>,
    getValue: (v) => formatCLP(v.precioVenta),
  },
  costoMateriales: {
    label: 'Materiales',
    align: 'right',
    sortField: null,
    cell: (v) => formatCLP(v.costoMateriales),
    getValue: (v) => formatCLP(v.costoMateriales),
  },
  manoDeObra: {
    label: 'Mano de obra',
    align: 'right',
    sortField: null,
    cell: (v) => formatCLP(v.manoDeObra),
    getValue: (v) => formatCLP(v.manoDeObra),
  },
  margen: {
    label: 'Margen',
    align: 'right',
    sortField: 'margen',
    cell: (v) => (
      <span className="font-medium" style={{ color: v.margen >= 0 ? '#5C8C6A' : '#A85C52' }}>
        {formatCLP(v.margen)}
      </span>
    ),
    getValue: (v) => formatCLP(v.margen),
  },
  margenPct: {
    label: 'Margen %',
    align: 'right',
    sortField: 'margenPct',
    cell: (v) => (
      <span className="font-medium" style={{ color: v.margenPct >= 0 ? '#5C8C6A' : '#A85C52' }}>
        {v.margenPct}%
      </span>
    ),
    getValue: (v) => `${v.margenPct}%`,
  },
  origen: {
    label: 'Origen',
    sortField: null,
    cell: (v) => (
      <span
        className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium"
        style={{
          backgroundColor: v.esEstimado ? '#F5E9E7' : '#E6EEEA',
          color: v.esEstimado ? '#A85C52' : '#5C8C6A',
        }}
      >
        {v.esEstimado ? 'Estimado' : 'Real'}
      </span>
    ),
    getValue: (v) => (v.esEstimado ? 'Estimado' : 'Real'),
  },
};
const ORDEN_DETALLE = [
  'clienta', 'tipo', 'fechaVenta', 'precioVenta', 'costoMateriales',
  'manoDeObra', 'margen', 'margenPct', 'origen',
];

export default function RentabilidadPorVestido() {
  const [porTipo, setPorTipo] = useState([]);
  const [detalle, setDetalle] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sort, setSort] = useState({ field: 'fechaVenta', dir: 'desc' });

  useEffect(() => {
    Promise.all([api.get('/rentabilidad/por-tipo'), api.get('/rentabilidad/detalle')])
      .then(([tipo, det]) => {
        setPorTipo(tipo);
        setDetalle(det);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const tendencia = useMemo(() => mergeTendencias(porTipo), [porTipo]);

  const detalleOrdenado = useMemo(() => {
    const copia = [...detalle];
    copia.sort((a, b) => {
      let av = a[sort.field];
      let bv = b[sort.field];
      if (sort.field === 'fechaVenta') {
        av = new Date(av).getTime();
        bv = new Date(bv).getTime();
      }
      if (typeof av === 'string') return sort.dir === 'asc' ? av.localeCompare(bv) : bv.localeCompare(av);
      return sort.dir === 'asc' ? av - bv : bv - av;
    });
    return copia;
  }, [detalle, sort]);

  const columnasFiltroPorTipo = useMemo(
    () => ORDEN_POR_TIPO.map((key) => ({ key, getValue: COLUMNAS_POR_TIPO[key].getValue })),
    []
  );
  const porTipoFiltros = useColumnFilters(porTipo, columnasFiltroPorTipo);

  const columnasFiltroDetalle = useMemo(
    () => ORDEN_DETALLE.map((key) => ({ key, getValue: COLUMNAS_DETALLE[key].getValue })),
    []
  );
  const detalleFiltros = useColumnFilters(detalleOrdenado, columnasFiltroDetalle);

  if (loading) {
    return (
      <Layout title="Rentabilidad por vestido">
        <p className="text-sm text-[#2C2420]/40">Cargando…</p>
      </Layout>
    );
  }

  return (
    <Layout
      title="Rentabilidad por vestido"
      subtitle="¿Cuánto deja realmente cada tipo de vestido, y cada venta individual?"
    >
      {error && <p className="text-sm text-[#A85C52] mb-4">{error}</p>}

      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-[#2C2420]/40">
          Análisis por tipo de vestido
        </p>
        {porTipoFiltros.activeCount > 0 && (
          <button
            onClick={porTipoFiltros.clearAllFilters}
            className="flex items-center gap-1.5 text-xs text-[#A85C52] hover:underline"
          >
            <X size={12} />
            Limpiar filtros ({porTipoFiltros.activeCount})
          </button>
        )}
      </div>
      <div className="bg-white rounded-xl border border-black/5 overflow-hidden mb-6">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-[#2C2420]/50 uppercase tracking-wide border-b border-black/5">
                {ORDEN_POR_TIPO.map((key) => (
                  <FilterableHeader
                    key={key}
                    label={COLUMNAS_POR_TIPO[key].label}
                    align={COLUMNAS_POR_TIPO[key].align}
                    options={porTipoFiltros.uniqueValuesByColumn[key]}
                    excluded={porTipoFiltros.excludedByColumn[key]}
                    onChange={(excl) => porTipoFiltros.setColumnExcluded(key, excl)}
                  />
                ))}
              </tr>
            </thead>
            <tbody>
              {porTipoFiltros.filteredRows.map((t) => (
                <tr key={t.tipo} className="border-b border-black/5 last:border-0">
                  {ORDEN_POR_TIPO.map((key) => (
                    <td
                      key={key}
                      className={`px-3 py-2 whitespace-nowrap ${
                        COLUMNAS_POR_TIPO[key].align === 'right' ? 'text-right' : ''
                      }`}
                    >
                      {COLUMNAS_POR_TIPO[key].cell(t)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-black/5 p-6 mb-8">
        <p className="text-sm font-medium text-[#2C2420] mb-4">Tendencia mensual del margen % por tipo</p>
        {tendencia.length === 0 ? (
          <p className="text-sm text-[#2C2420]/40">Aún no hay suficientes ventas para mostrar tendencia.</p>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={tendencia} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#00000010" />
              <XAxis dataKey="mes" tick={{ fontSize: 12, fill: '#2C2420aa' }} />
              <YAxis tick={{ fontSize: 12, fill: '#2C2420aa' }} unit="%" />
              <Tooltip formatter={(v) => `${v}%`} />
              <Legend formatter={(v) => TIPO_LABELS[v] || v} />
              {Object.keys(TIPO_LABELS).map((tipo) => (
                <Line
                  key={tipo}
                  type="monotone"
                  dataKey={tipo}
                  stroke={TIPO_COLORS[tipo]?.dot}
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  connectNulls
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-[#2C2420]/40">
          Detalle individual
        </p>
        {detalleFiltros.activeCount > 0 && (
          <button
            onClick={detalleFiltros.clearAllFilters}
            className="flex items-center gap-1.5 text-xs text-[#A85C52] hover:underline"
          >
            <X size={12} />
            Limpiar filtros ({detalleFiltros.activeCount})
          </button>
        )}
      </div>
      <div className="bg-white rounded-xl border border-black/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-[#2C2420]/50 uppercase tracking-wide border-b border-black/5">
                {ORDEN_DETALLE.map((key) => {
                  const col = COLUMNAS_DETALLE[key];
                  return (
                    <FilterableHeader
                      key={key}
                      label={col.label}
                      align={col.align}
                      options={detalleFiltros.uniqueValuesByColumn[key]}
                      excluded={detalleFiltros.excludedByColumn[key]}
                      onChange={(excl) => detalleFiltros.setColumnExcluded(key, excl)}
                      sortActive={col.sortField && sort.field === col.sortField}
                      sortDir={sort.dir}
                      onSortClick={
                        col.sortField
                          ? () =>
                              setSort((s) => ({
                                field: col.sortField,
                                dir: s.field === col.sortField && s.dir === 'desc' ? 'asc' : 'desc',
                              }))
                          : undefined
                      }
                    />
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {detalleFiltros.filteredRows.map((v) => (
                <tr key={v.ventaId} className="border-b border-black/5 last:border-0 hover:bg-[#FAFAF8]">
                  {ORDEN_DETALLE.map((key) => (
                    <td
                      key={key}
                      className={`px-3 py-2 whitespace-nowrap ${
                        COLUMNAS_DETALLE[key].align === 'right' ? 'text-right' : ''
                      }`}
                    >
                      {COLUMNAS_DETALLE[key].cell(v)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
