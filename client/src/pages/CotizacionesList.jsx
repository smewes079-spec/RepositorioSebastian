import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Download, Search, X, RotateCcw } from 'lucide-react';
import Layout from '../components/Layout.jsx';
import FilterableHeader from '../components/FilterableHeader.jsx';
import ColumnVisibilityMenu from '../components/ColumnVisibilityMenu.jsx';
import { useColumnOrder } from '../lib/useColumnOrder.js';
import { useColumnFilters } from '../lib/useColumnFilters.js';
import { useColumnVisibility } from '../lib/useColumnVisibility.js';
import { exportRowsToExcel } from '../lib/exportExcel.js';
import { api } from '../lib/api.js';
import {
  formatCLP,
  formatFecha,
  TIPO_LABELS,
  TIPO_COLORS,
  COTIZACION_ESTADO_LABELS,
  COTIZACION_ESTADO_COLORS,
} from '../lib/format.js';

const FILTROS_INICIALES = { estado: '', tipo: '', search: '' };

function buildQuery(filtros) {
  const params = new URLSearchParams();
  Object.entries(filtros).forEach(([k, v]) => {
    if (v) params.set(k, v);
  });
  return params.toString();
}

function TipoBadge({ tipo }) {
  const c = TIPO_COLORS[tipo] || {};
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
      style={{ backgroundColor: c.bg, color: c.text }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: c.dot }} />
      {TIPO_LABELS[tipo]}
    </span>
  );
}

function EstadoBadge({ estado }) {
  const c = COTIZACION_ESTADO_COLORS[estado] || {};
  return (
    <span
      className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium"
      style={{ backgroundColor: c.bg, color: c.text }}
    >
      {COTIZACION_ESTADO_LABELS[estado]}
    </span>
  );
}

const COLUMN_DEFS = {
  numero: {
    label: 'N°',
    cell: (c) => <span className="font-medium text-[#2C2420]">{c.id.slice(-8).toUpperCase()}</span>,
    getValue: (c) => c.id.slice(-8).toUpperCase(),
  },
  clienta: { label: 'Clienta', cell: (c) => c.nombreClienta, getValue: (c) => c.nombreClienta },
  contacto: { label: 'Contacto', cell: (c) => c.emailClienta, getValue: (c) => c.emailClienta },
  tipo: {
    label: 'Tipo',
    cell: (c) => <TipoBadge tipo={c.tipo} />,
    getValue: (c) => TIPO_LABELS[c.tipo],
  },
  fechaEvento: {
    label: 'Fecha evento',
    cell: (c) => <span className="text-[#2C2420]/70">{formatFecha(c.fechaEventoTentativa) || '—'}</span>,
    getValue: (c) => formatFecha(c.fechaEventoTentativa),
  },
  total: {
    label: 'Total',
    align: 'right',
    cell: (c) => <span className="font-medium">{formatCLP(c.montoTotal)}</span>,
    getValue: (c) => formatCLP(c.montoTotal),
  },
  estado: {
    label: 'Estado',
    cell: (c) => <EstadoBadge estado={c.estado} />,
    getValue: (c) => COTIZACION_ESTADO_LABELS[c.estado],
  },
  fechaEnvio: {
    label: 'Enviada',
    cell: (c) => <span className="text-[#2C2420]/70">{formatFecha(c.fechaEnvio) || '—'}</span>,
    getValue: (c) => formatFecha(c.fechaEnvio),
  },
  venta: {
    label: 'Venta creada',
    cell: (c) => (c.venta ? <span className="text-[#5C8C6A] font-medium">{c.venta.codigo}</span> : '—'),
    getValue: (c) => c.venta?.codigo || '',
  },
};

const ORDEN_COLUMNAS_DEFECTO = [
  'numero', 'clienta', 'contacto', 'tipo', 'fechaEvento', 'total', 'estado', 'fechaEnvio', 'venta',
];

export default function CotizacionesList() {
  const navigate = useNavigate();
  const [filtros, setFiltros] = useState(FILTROS_INICIALES);
  const [cotizaciones, setCotizaciones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [exportando, setExportando] = useState(false);
  const { order: ordenColumnas, moverColumna, restablecer: restablecerColumnas } = useColumnOrder(
    'hsn-cotizaciones-columnas',
    ORDEN_COLUMNAS_DEFECTO
  );
  const columnasVisibilidad = useColumnVisibility('hsn-cotizaciones-columnas-visibles', ORDEN_COLUMNAS_DEFECTO);
  const columnasMostradas = useMemo(
    () => ordenColumnas.filter((key) => columnasVisibilidad.isVisible(key)),
    [ordenColumnas, columnasVisibilidad]
  );
  const filtroColumnas = useMemo(
    () => ORDEN_COLUMNAS_DEFECTO.map((key) => ({ key, getValue: COLUMN_DEFS[key].getValue })),
    []
  );
  const {
    filteredRows: cotizacionesFiltradas,
    uniqueValuesByColumn,
    excludedByColumn,
    setColumnExcluded,
    clearAllFilters: limpiarFiltrosColumna,
    activeCount: filtrosColumnaActivos,
  } = useColumnFilters(cotizaciones, filtroColumnas);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const qs = buildQuery(filtros);
      const data = await api.get(`/cotizaciones${qs ? `?${qs}` : ''}`);
      setCotizaciones(data);
    } catch (err) {
      setError(err.message || 'No se pudieron cargar las cotizaciones');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtros.estado, filtros.tipo]);

  useEffect(() => {
    const timeout = setTimeout(load, 300);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtros.search]);

  async function handleExport() {
    setExportando(true);
    try {
      await exportRowsToExcel({
        filename: `cotizaciones-${new Date().toISOString().slice(0, 10)}`,
        sheetName: 'Cotizaciones',
        columns: columnasMostradas.map((key) => ({ key, label: COLUMN_DEFS[key].label, getValue: COLUMN_DEFS[key].getValue })),
        rows: cotizacionesFiltradas,
      });
    } catch (err) {
      setError(err.message || 'No se pudo generar el Excel');
    } finally {
      setExportando(false);
    }
  }

  return (
    <Layout
      title="Cotizaciones"
      subtitle="Prospectos, seguimiento de envíos y conversión a ventas"
      actions={
        <Link
          to="/cotizaciones/nueva"
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white hover:opacity-90"
          style={{ backgroundColor: '#1A1A2E' }}
        >
          <Plus size={16} />
          Nueva cotización
        </Link>
      }
    >
      <div className="bg-white rounded-xl border border-black/5 p-4 mb-6 flex flex-wrap gap-3 items-center">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#2C2420]/40" />
          <input
            value={filtros.search}
            onChange={(e) => setFiltros((f) => ({ ...f, search: e.target.value }))}
            placeholder="Buscar por clienta o correo"
            className="pl-9 pr-3 py-2 text-sm rounded-lg border border-black/10 focus:outline-none focus:ring-2 focus:ring-[#C9A96E] w-64"
          />
        </div>
        <select
          value={filtros.estado}
          onChange={(e) => setFiltros((f) => ({ ...f, estado: e.target.value }))}
          className="px-3 py-2 text-sm rounded-lg border border-black/10 focus:outline-none focus:ring-2 focus:ring-[#C9A96E]"
        >
          <option value="">Todos los estados</option>
          {Object.entries(COTIZACION_ESTADO_LABELS).map(([k, l]) => (
            <option key={k} value={k}>
              {l}
            </option>
          ))}
        </select>
        <select
          value={filtros.tipo}
          onChange={(e) => setFiltros((f) => ({ ...f, tipo: e.target.value }))}
          className="px-3 py-2 text-sm rounded-lg border border-black/10 focus:outline-none focus:ring-2 focus:ring-[#C9A96E]"
        >
          <option value="">Todos los tipos</option>
          {Object.entries(TIPO_LABELS).map(([k, l]) => (
            <option key={k} value={k}>
              {l}
            </option>
          ))}
        </select>
        {(filtros.estado || filtros.tipo || filtros.search) && (
          <button
            onClick={() => setFiltros(FILTROS_INICIALES)}
            className="text-xs text-[#A85C52] hover:underline ml-auto"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {error && <p className="text-sm text-[#A85C52] mb-4">{error}</p>}

      <div className="flex justify-end items-center gap-4 mb-2">
        {filtrosColumnaActivos > 0 && (
          <button
            onClick={limpiarFiltrosColumna}
            className="flex items-center gap-1.5 text-xs text-[#A85C52] hover:underline"
          >
            <X size={12} />
            Limpiar filtros de columna ({filtrosColumnaActivos})
          </button>
        )}
        <button
          onClick={restablecerColumnas}
          className="flex items-center gap-1.5 text-xs text-[#2C2420]/40 hover:text-[#2C2420]/70"
          title="Vuelve las columnas al orden original"
        >
          <RotateCcw size={12} />
          Restablecer orden de columnas
        </button>
        <button
          onClick={handleExport}
          disabled={exportando}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-black/10 text-[#2C2420]/70 hover:bg-black/5 disabled:opacity-50"
        >
          <Download size={13} />
          {exportando ? 'Generando…' : 'Excel'}
        </button>
        <ColumnVisibilityMenu
          columns={ORDEN_COLUMNAS_DEFECTO.map((key) => ({ key, label: COLUMN_DEFS[key].label }))}
          hidden={columnasVisibilidad.hidden}
          onToggle={columnasVisibilidad.toggle}
          onShowAll={columnasVisibilidad.showAll}
          onReset={columnasVisibilidad.reset}
        />
      </div>

      <div className="bg-white rounded-xl border border-black/5 overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-[#2C2420]/50 uppercase tracking-wide border-b border-black/5">
              {columnasMostradas.map((key) => (
                <FilterableHeader
                  key={key}
                  columnKey={key}
                  label={COLUMN_DEFS[key].label}
                  align={COLUMN_DEFS[key].align}
                  onMove={moverColumna}
                  draggable
                  options={uniqueValuesByColumn[key]}
                  excluded={excludedByColumn[key]}
                  onChange={(excl) => setColumnExcluded(key, excl)}
                />
              ))}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={columnasMostradas.length} className="px-3 py-10 text-center text-[#2C2420]/40">
                  Cargando…
                </td>
              </tr>
            )}
            {!loading && cotizaciones.length === 0 && (
              <tr>
                <td colSpan={columnasMostradas.length} className="px-3 py-10 text-center text-[#2C2420]/40">
                  No hay cotizaciones registradas todavía.
                </td>
              </tr>
            )}
            {!loading && cotizaciones.length > 0 && cotizacionesFiltradas.length === 0 && (
              <tr>
                <td colSpan={columnasMostradas.length} className="px-3 py-10 text-center text-[#2C2420]/40">
                  Ningún resultado con los filtros de columna aplicados.{' '}
                  <button onClick={limpiarFiltrosColumna} className="text-[#C9A96E] hover:underline">
                    Limpiarlos
                  </button>
                </td>
              </tr>
            )}
            {!loading &&
              cotizacionesFiltradas.map((c) => (
                <tr
                  key={c.id}
                  onClick={() => navigate(`/cotizaciones/${c.id}`)}
                  className="border-b border-black/5 last:border-0 hover:bg-[#FAFAF8] cursor-pointer"
                >
                  {columnasMostradas.map((key) => (
                    <td
                      key={key}
                      className={`px-3 py-2 whitespace-nowrap ${COLUMN_DEFS[key].align === 'right' ? 'text-right' : ''}`}
                    >
                      {COLUMN_DEFS[key].cell(c)}
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
