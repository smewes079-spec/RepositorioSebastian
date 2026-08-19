import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Upload, Download, Search, Pencil, Trash2, X, RotateCcw } from 'lucide-react';
import Layout from '../components/Layout.jsx';
import ResumenCards from '../components/ResumenCards.jsx';
import ImportCsvModal from '../components/ImportCsvModal.jsx';
import BulkEditVentasModal from '../components/BulkEditVentasModal.jsx';
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
  ESTADO_LABELS,
  TIPO_COLORS,
  KANBAN_LABELS,
  KANBAN_COLORS,
} from '../lib/format.js';

const FILTROS_INICIALES = { tipo: '', estado: '', mesVenta: '', mesEvento: '', search: '' };

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
  const entregado = estado === 'ENTREGADO';
  return (
    <span
      className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium"
      style={{
        backgroundColor: entregado ? '#E6EEEA' : '#F5E9E7',
        color: entregado ? '#5C8C6A' : '#A85C52',
      }}
    >
      {ESTADO_LABELS[estado]}
    </span>
  );
}

function KanbanBadge({ kanbanEstado }) {
  const c = KANBAN_COLORS[kanbanEstado] || {};
  return (
    <span
      className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium whitespace-nowrap"
      style={{ backgroundColor: c.bg, color: c.text }}
    >
      {KANBAN_LABELS[kanbanEstado]}
    </span>
  );
}

const COLUMN_DEFS = {
  codigo: {
    label: 'Código',
    cell: (v) => <span className="font-medium text-[#2C2420]">{v.codigo}</span>,
    getValue: (v) => v.codigo,
  },
  clienta: { label: 'Clienta', cell: (v) => v.nombreClienta, getValue: (v) => v.nombreClienta },
  tipo: {
    label: 'Tipo',
    cell: (v) => <TipoBadge tipo={v.tipo} />,
    getValue: (v) => TIPO_LABELS[v.tipo],
  },
  fechaVenta: {
    label: 'Fecha venta',
    cell: (v) => <span className="text-[#2C2420]/70">{formatFecha(v.fechaVenta)}</span>,
    getValue: (v) => formatFecha(v.fechaVenta),
  },
  fechaEvento: {
    label: 'Fecha evento',
    cell: (v) => <span className="text-[#2C2420]/70">{formatFecha(v.fechaEvento)}</span>,
    getValue: (v) => formatFecha(v.fechaEvento),
  },
  total: {
    label: 'Total',
    align: 'right',
    cell: (v) => <span className="font-medium">{formatCLP(v.precioTotal)}</span>,
    getValue: (v) => formatCLP(v.precioTotal),
  },
  saldo: {
    label: 'Saldo',
    align: 'right',
    cell: (v) => (
      <span
        className="font-medium"
        style={{ color: v.saldoPendiente > 0 ? '#A85C52' : '#5C8C6A' }}
      >
        {formatCLP(v.saldoPendiente)}
      </span>
    ),
    getValue: (v) => formatCLP(v.saldoPendiente),
  },
  cobrado: {
    label: '% Cobrado',
    cell: (v) => (
      <div className="flex items-center gap-2 w-20">
        <div className="flex-1 h-1.5 rounded-full bg-black/5 overflow-hidden">
          <div
            className="h-full rounded-full"
            style={{ width: `${Math.min(v.porcentajeCobrado, 100)}%`, backgroundColor: '#C9A96E' }}
          />
        </div>
        <span className="text-xs text-[#2C2420]/60 w-9">{v.porcentajeCobrado}%</span>
      </div>
    ),
    getValue: (v) => `${v.porcentajeCobrado}%`,
  },
  estado: {
    label: 'Estado',
    cell: (v) => <EstadoBadge estado={v.estado} />,
    getValue: (v) => ESTADO_LABELS[v.estado],
  },
  produccion: {
    label: 'Producción',
    cell: (v) => <KanbanBadge kanbanEstado={v.kanbanEstado} />,
    getValue: (v) => KANBAN_LABELS[v.kanbanEstado],
  },
};

const ORDEN_COLUMNAS_DEFECTO = [
  'codigo', 'clienta', 'tipo', 'fechaVenta', 'fechaEvento',
  'total', 'saldo', 'cobrado', 'estado', 'produccion',
];

export default function VentasList() {
  const navigate = useNavigate();
  const [filtros, setFiltros] = useState(FILTROS_INICIALES);
  const [ventas, setVentas] = useState([]);
  const [resumen, setResumen] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showImport, setShowImport] = useState(false);
  const [seleccionadas, setSeleccionadas] = useState([]);
  const [showBulkEdit, setShowBulkEdit] = useState(false);
  const [exportando, setExportando] = useState(false);
  const { order: ordenColumnas, moverColumna, restablecer: restablecerColumnas } = useColumnOrder(
    'hsn-ventas-columnas',
    ORDEN_COLUMNAS_DEFECTO
  );
  const columnasVisibilidad = useColumnVisibility('hsn-ventas-columnas-visibles', ORDEN_COLUMNAS_DEFECTO);
  const columnasMostradas = useMemo(
    () => ordenColumnas.filter((key) => columnasVisibilidad.isVisible(key)),
    [ordenColumnas, columnasVisibilidad]
  );
  const filtroColumnas = useMemo(
    () => ORDEN_COLUMNAS_DEFECTO.map((key) => ({ key, getValue: COLUMN_DEFS[key].getValue })),
    []
  );
  const {
    filteredRows: ventasFiltradas,
    uniqueValuesByColumn,
    excludedByColumn,
    setColumnExcluded,
    clearAllFilters: limpiarFiltrosColumna,
    activeCount: filtrosColumnaActivos,
  } = useColumnFilters(ventas, filtroColumnas);

  async function load() {
    setLoading(true);
    setError('');
    setSeleccionadas([]);
    try {
      const qs = buildQuery(filtros);
      const [ventasData, resumenData] = await Promise.all([
        api.get(`/ventas${qs ? `?${qs}` : ''}`),
        api.get(`/ventas/resumen${qs ? `?${qs}` : ''}`),
      ]);
      setVentas(ventasData);
      setResumen(resumenData);
    } catch (err) {
      setError(err.message || 'No se pudieron cargar las ventas');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtros.tipo, filtros.estado, filtros.mesVenta, filtros.mesEvento]);

  useEffect(() => {
    const timeout = setTimeout(load, 300);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtros.search]);

  const totalPorTipo = useMemo(() => resumen?.cantidadPorTipo || {}, [resumen]);

  function toggleSeleccion(id) {
    setSeleccionadas((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  }

  function toggleSeleccionarTodas() {
    setSeleccionadas((prev) =>
      prev.length === ventasFiltradas.length ? [] : ventasFiltradas.map((v) => v.id)
    );
  }

  async function handleBulkDelete() {
    if (
      !confirm(
        `¿Eliminar ${seleccionadas.length} venta${seleccionadas.length === 1 ? '' : 's'} seleccionada${
          seleccionadas.length === 1 ? '' : 's'
        }? Esta acción no se puede deshacer.`
      )
    )
      return;
    try {
      await Promise.all(seleccionadas.map((id) => api.del(`/ventas/${id}`)));
      setSeleccionadas([]);
      load();
    } catch (err) {
      setError(err.message || 'No se pudieron eliminar algunas ventas');
    }
  }

  async function handleExport() {
    setExportando(true);
    try {
      await exportRowsToExcel({
        filename: `ventas-${new Date().toISOString().slice(0, 10)}`,
        sheetName: 'Ventas',
        columns: columnasMostradas.map((key) => ({ key, label: COLUMN_DEFS[key].label, getValue: COLUMN_DEFS[key].getValue })),
        rows: ventasFiltradas,
      });
    } catch (err) {
      setError(err.message || 'No se pudo generar el Excel');
    } finally {
      setExportando(false);
    }
  }

  return (
    <Layout
      title="Ventas y Clientas"
      subtitle="Registro y seguimiento de ventas de vestidos"
      actions={
        <>
          <button
            onClick={() => setShowImport(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border border-black/10 text-[#2C2420]/80 hover:bg-black/5"
          >
            <Upload size={16} />
            Importar Excel
          </button>
          <Link
            to="/ventas/nueva"
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white hover:opacity-90"
            style={{ backgroundColor: '#1A1A2E' }}
          >
            <Plus size={16} />
            Nueva venta
          </Link>
        </>
      }
    >
      <ResumenCards resumen={resumen} />

      <div className="flex flex-wrap gap-3 mb-4">
        {Object.entries(TIPO_LABELS).map(([key, label]) => (
          <span key={key} className="text-xs text-[#2C2420]/50">
            {label}: <strong className="text-[#2C2420]">{totalPorTipo[key] ?? 0}</strong>
          </span>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-black/5 p-4 mb-6 flex flex-wrap gap-3 items-center">
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#2C2420]/40" />
          <input
            value={filtros.search}
            onChange={(e) => setFiltros((f) => ({ ...f, search: e.target.value }))}
            placeholder="Buscar por código o clienta"
            className="pl-9 pr-3 py-2 text-sm rounded-lg border border-black/10 focus:outline-none focus:ring-2 focus:ring-[#C9A96E] w-64"
          />
        </div>
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
        <select
          value={filtros.estado}
          onChange={(e) => setFiltros((f) => ({ ...f, estado: e.target.value }))}
          className="px-3 py-2 text-sm rounded-lg border border-black/10 focus:outline-none focus:ring-2 focus:ring-[#C9A96E]"
        >
          <option value="">Todos los estados</option>
          {Object.entries(ESTADO_LABELS).map(([k, l]) => (
            <option key={k} value={k}>
              {l}
            </option>
          ))}
        </select>
        <div className="flex items-center gap-1.5 text-xs text-[#2C2420]/50">
          Mes venta
          <input
            type="month"
            value={filtros.mesVenta}
            onChange={(e) => setFiltros((f) => ({ ...f, mesVenta: e.target.value }))}
            className="px-2 py-1.5 text-sm rounded-lg border border-black/10 focus:outline-none focus:ring-2 focus:ring-[#C9A96E]"
          />
        </div>
        <div className="flex items-center gap-1.5 text-xs text-[#2C2420]/50">
          Mes evento
          <input
            type="month"
            value={filtros.mesEvento}
            onChange={(e) => setFiltros((f) => ({ ...f, mesEvento: e.target.value }))}
            className="px-2 py-1.5 text-sm rounded-lg border border-black/10 focus:outline-none focus:ring-2 focus:ring-[#C9A96E]"
          />
        </div>
        {(filtros.tipo || filtros.estado || filtros.mesVenta || filtros.mesEvento || filtros.search) && (
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

      {seleccionadas.length > 0 && (
        <div className="flex items-center gap-3 bg-[#1A1A2E] text-white rounded-xl px-4 py-2.5 mb-3">
          <span className="text-sm font-medium">
            {seleccionadas.length} seleccionada{seleccionadas.length === 1 ? '' : 's'}
          </span>
          <button
            onClick={() => setShowBulkEdit(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-white/10 hover:bg-white/20"
          >
            <Pencil size={13} />
            Editar ({seleccionadas.length})
          </button>
          <button
            onClick={handleBulkDelete}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg text-[#F2B8B0] bg-white/10 hover:bg-white/20"
          >
            <Trash2 size={13} />
            Eliminar
          </button>
          <button
            onClick={() => setSeleccionadas([])}
            className="flex items-center gap-1.5 ml-auto text-xs text-white/60 hover:text-white"
          >
            <X size={13} />
            Deseleccionar
          </button>
        </div>
      )}

      <div className="bg-white rounded-xl border border-black/5 overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-[#2C2420]/50 uppercase tracking-wide border-b border-black/5">
              <th className="px-3 py-2.5 font-medium w-9">
                <input
                  type="checkbox"
                  checked={ventasFiltradas.length > 0 && seleccionadas.length === ventasFiltradas.length}
                  onChange={toggleSeleccionarTodas}
                  className="accent-[#C9A96E]"
                />
              </th>
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
                <td colSpan={columnasMostradas.length + 1} className="px-3 py-10 text-center text-[#2C2420]/40">
                  Cargando…
                </td>
              </tr>
            )}
            {!loading && ventas.length === 0 && (
              <tr>
                <td colSpan={columnasMostradas.length + 1} className="px-3 py-10 text-center text-[#2C2420]/40">
                  No hay ventas registradas todavía.
                </td>
              </tr>
            )}
            {!loading && ventas.length > 0 && ventasFiltradas.length === 0 && (
              <tr>
                <td colSpan={columnasMostradas.length + 1} className="px-3 py-10 text-center text-[#2C2420]/40">
                  Ningún resultado con los filtros de columna aplicados.{' '}
                  <button onClick={limpiarFiltrosColumna} className="text-[#C9A96E] hover:underline">
                    Limpiarlos
                  </button>
                </td>
              </tr>
            )}
            {!loading &&
              ventasFiltradas.map((v) => (
                <tr
                  key={v.id}
                  onClick={() => navigate(`/ventas/${v.id}`)}
                  className={`border-b border-black/5 last:border-0 hover:bg-[#FAFAF8] cursor-pointer ${
                    seleccionadas.includes(v.id) ? 'bg-[#FAF6EF]' : ''
                  }`}
                >
                  <td className="px-3 py-2" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={seleccionadas.includes(v.id)}
                      onChange={() => toggleSeleccion(v.id)}
                      className="accent-[#C9A96E]"
                    />
                  </td>
                  {columnasMostradas.map((key) => (
                    <td
                      key={key}
                      className={`px-3 py-2 whitespace-nowrap ${COLUMN_DEFS[key].align === 'right' ? 'text-right' : ''}`}
                    >
                      {COLUMN_DEFS[key].cell(v)}
                    </td>
                  ))}
                </tr>
              ))}
          </tbody>
        </table>
        </div>
      </div>

      {showImport && (
        <ImportCsvModal
          titulo="Importar ventas desde Excel o CSV"
          endpoint="/ventas/importar"
          plantillaHref="/plantilla-ventas.xlsx"
          descripcionColumnas="Completa la plantilla con las columnas: CÓDIGO, NOMBRE CLIENTA, TIPO, ESTADO, FECHA VENTA, FECHA EVENTO, TOTAL VENTA, TOTAL PAGADO, DEUDA, PAGO 1, FECHA, PAGO 2, FECHA 2, PAGO 3, FECHA 3. Si el código ya existe, la venta se actualiza."
          onClose={() => setShowImport(false)}
          onImported={() => {
            load();
          }}
        />
      )}

      {showBulkEdit && (
        <BulkEditVentasModal
          ventaIds={seleccionadas}
          onClose={() => setShowBulkEdit(false)}
          onSaved={() => load()}
        />
      )}
    </Layout>
  );
}
