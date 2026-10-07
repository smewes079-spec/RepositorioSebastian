import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Trash2, Download, Upload, X, RotateCcw } from 'lucide-react';
import Layout from '../components/Layout.jsx';
import ImportCsvModal from '../components/ImportCsvModal.jsx';
import FilterableHeader from '../components/FilterableHeader.jsx';
import ColumnVisibilityMenu from '../components/ColumnVisibilityMenu.jsx';
import { useColumnFilters } from '../lib/useColumnFilters.js';
import { useColumnVisibility } from '../lib/useColumnVisibility.js';
import { useColumnWidths } from '../lib/useColumnWidths.js';
import { exportRowsToExcel } from '../lib/exportExcel.js';
import { api } from '../lib/api.js';
import { formatCLP, formatFecha, CATEGORIA_GASTO_GENERAL_LABELS } from '../lib/format.js';

const FILTROS_INICIALES = { categoria: '', mesGasto: '' };

function buildQuery(filtros) {
  const params = new URLSearchParams();
  Object.entries(filtros).forEach(([k, v]) => {
    if (v) params.set(k, v);
  });
  return params.toString();
}

const COLUMN_DEFS = {
  fecha: {
    label: 'Fecha',
    cell: (g) => <span className="text-[#2C2420]/70">{formatFecha(g.fecha)}</span>,
    getValue: (g) => formatFecha(g.fecha),
  },
  categoria: {
    label: 'Categoría',
    cell: (g) => CATEGORIA_GASTO_GENERAL_LABELS[g.categoria],
    getValue: (g) => CATEGORIA_GASTO_GENERAL_LABELS[g.categoria],
  },
  descripcion: {
    label: 'Descripción',
    cell: (g) => <span className="font-medium text-[#2C2420]">{g.descripcion}</span>,
    getValue: (g) => g.descripcion,
  },
  monto: {
    label: 'Monto',
    align: 'right',
    cell: (g) => <span className="font-medium">{formatCLP(g.montoTotal)}</span>,
    getValue: (g) => formatCLP(g.montoTotal),
  },
};

const ORDEN_COLUMNAS = ['fecha', 'categoria', 'descripcion', 'monto'];

const ANCHOS_COLUMNAS_DEFECTO = {
  fecha: 100,
  categoria: 180,
  descripcion: 320,
  monto: 110,
};

export default function GastosGeneralesList() {
  const navigate = useNavigate();
  const [filtros, setFiltros] = useState(FILTROS_INICIALES);
  const [gastos, setGastos] = useState([]);
  const [resumen, setResumen] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [exportando, setExportando] = useState(false);
  const [showImport, setShowImport] = useState(false);

  const columnasVisibilidad = useColumnVisibility('hsn-gastos-generales-columnas-visibles', ORDEN_COLUMNAS);
  const { widths: anchosColumnas, setWidth: setAnchoColumna, restablecer: restablecerAnchos } = useColumnWidths(
    'hsn-gastos-generales-columnas-anchos',
    ANCHOS_COLUMNAS_DEFECTO
  );
  const columnasMostradas = useMemo(
    () => ORDEN_COLUMNAS.filter((key) => columnasVisibilidad.isVisible(key)),
    [columnasVisibilidad]
  );
  const filtroColumnas = useMemo(
    () => ORDEN_COLUMNAS.map((key) => ({ key, getValue: COLUMN_DEFS[key].getValue })),
    []
  );
  const {
    filteredRows: gastosFiltrados,
    uniqueValuesByColumn,
    excludedByColumn,
    setColumnExcluded,
    clearAllFilters: limpiarFiltrosColumna,
    activeCount: filtrosColumnaActivos,
  } = useColumnFilters(gastos, filtroColumnas);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const qs = buildQuery(filtros);
      const [gastosData, resumenData] = await Promise.all([
        api.get(`/gastos-generales${qs ? `?${qs}` : ''}`),
        api.get(`/gastos-generales/resumen${qs ? `?${qs}` : ''}`),
      ]);
      setGastos(gastosData);
      setResumen(resumenData);
    } catch (err) {
      setError(err.message || 'No se pudieron cargar los gastos generales');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtros.categoria, filtros.mesGasto]);

  async function handleDelete(id) {
    if (!confirm('¿Eliminar este gasto?')) return;
    try {
      await api.del(`/gastos-generales/${id}`);
      load();
    } catch (err) {
      setError(err.message || 'No se pudo eliminar el gasto');
    }
  }

  async function handleExport() {
    setExportando(true);
    try {
      await exportRowsToExcel({
        filename: `gastos-generales-${new Date().toISOString().slice(0, 10)}`,
        sheetName: 'Gastos generales',
        columns: columnasMostradas.map((key) => ({ key, label: COLUMN_DEFS[key].label, getValue: COLUMN_DEFS[key].getValue })),
        rows: gastosFiltrados,
      });
    } catch (err) {
      setError(err.message || 'No se pudo generar el Excel');
    } finally {
      setExportando(false);
    }
  }

  return (
    <Layout
      title="Gastos generales"
      subtitle="Café, estacionamiento, mobiliario y otros gastos que no son insumos de vestidos"
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
            to="/costos/gastos-generales/nueva"
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white hover:opacity-90"
            style={{ backgroundColor: '#1A1A2E' }}
          >
            <Plus size={16} />
            Nuevo gasto
          </Link>
        </>
      }
    >
      {resumen && (
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="bg-white rounded-xl border border-black/5 px-5 py-4 flex-1 min-w-[180px]">
            <p className="text-xs font-medium text-[#2C2420]/50 uppercase tracking-wide mb-1.5">
              Total gastado
            </p>
            <p className="font-serif text-2xl text-[#2C2420]">{formatCLP(resumen.totalGeneral)}</p>
          </div>
          <div className="bg-white rounded-xl border border-black/5 px-5 py-4 flex-1 min-w-[180px]">
            <p className="text-xs font-medium text-[#2C2420]/50 uppercase tracking-wide mb-1.5">
              N° de gastos
            </p>
            <p className="font-serif text-2xl text-[#2C2420]">{resumen.cantidadGastos}</p>
          </div>
          <div className="bg-white rounded-xl border border-black/5 px-5 py-4 flex-[2] min-w-[280px]">
            <p className="text-xs font-medium text-[#2C2420]/50 uppercase tracking-wide mb-2">
              Por categoría
            </p>
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              {Object.entries(resumen.porCategoria).map(([cat, monto]) => (
                <span key={cat} className="text-xs text-[#2C2420]/70">
                  {CATEGORIA_GASTO_GENERAL_LABELS[cat]}:{' '}
                  <strong className="text-[#2C2420]">{formatCLP(monto)}</strong>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-black/5 p-4 mb-6 flex flex-wrap gap-3 items-center">
        <select
          value={filtros.categoria}
          onChange={(e) => setFiltros((f) => ({ ...f, categoria: e.target.value }))}
          className="px-3 py-2 text-sm rounded-lg border border-black/10 focus:outline-none focus:ring-2 focus:ring-[#C9A96E]"
        >
          <option value="">Todas las categorías</option>
          {Object.entries(CATEGORIA_GASTO_GENERAL_LABELS).map(([k, l]) => (
            <option key={k} value={k}>
              {l}
            </option>
          ))}
        </select>
        <div className="flex items-center gap-1.5 text-xs text-[#2C2420]/50">
          Mes del gasto
          <input
            type="month"
            value={filtros.mesGasto}
            onChange={(e) => setFiltros((f) => ({ ...f, mesGasto: e.target.value }))}
            className="px-2 py-1.5 text-sm rounded-lg border border-black/10 focus:outline-none focus:ring-2 focus:ring-[#C9A96E]"
          />
        </div>
        {(filtros.categoria || filtros.mesGasto) && (
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
          onClick={restablecerAnchos}
          className="flex items-center gap-1.5 text-xs text-[#2C2420]/40 hover:text-[#2C2420]/70"
          title="Vuelve las columnas a su ancho original"
        >
          <RotateCcw size={12} />
          Restablecer anchos de columnas
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
          columns={ORDEN_COLUMNAS.map((key) => ({ key, label: COLUMN_DEFS[key].label }))}
          hidden={columnasVisibilidad.hidden}
          onToggle={columnasVisibilidad.toggle}
          onShowAll={columnasVisibilidad.showAll}
          onReset={columnasVisibilidad.reset}
        />
      </div>

      <div className="bg-white rounded-xl border border-black/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm" style={{ tableLayout: 'fixed' }}>
            <colgroup>
              {columnasMostradas.map((key) => (
                <col key={key} style={{ width: anchosColumnas[key] ?? 120 }} />
              ))}
              <col style={{ width: 50 }} />
            </colgroup>
            <thead>
              <tr className="text-left text-xs text-[#2C2420]/50 uppercase tracking-wide border-b border-black/5">
                {columnasMostradas.map((key) => (
                  <FilterableHeader
                    key={key}
                    columnKey={key}
                    label={COLUMN_DEFS[key].label}
                    align={COLUMN_DEFS[key].align}
                    options={uniqueValuesByColumn[key]}
                    excluded={excludedByColumn[key]}
                    onChange={(excl) => setColumnExcluded(key, excl)}
                    width={anchosColumnas[key]}
                    onResize={setAnchoColumna}
                  />
                ))}
                <th className="px-3 py-2.5 font-medium"></th>
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
              {!loading && gastos.length === 0 && (
                <tr>
                  <td colSpan={columnasMostradas.length + 1} className="px-3 py-10 text-center text-[#2C2420]/40">
                    No hay gastos generales registrados todavía.
                  </td>
                </tr>
              )}
              {!loading && gastos.length > 0 && gastosFiltrados.length === 0 && (
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
                gastosFiltrados.map((g) => (
                  <tr
                    key={g.id}
                    onClick={() => navigate(`/costos/gastos-generales/${g.id}`)}
                    className="border-b border-black/5 last:border-0 hover:bg-[#FAFAF8] cursor-pointer"
                  >
                    {columnasMostradas.map((key) => (
                      <td
                        key={key}
                        className={`px-3 py-2 whitespace-nowrap overflow-hidden text-ellipsis ${
                          COLUMN_DEFS[key].align === 'right' ? 'text-right' : ''
                        }`}
                      >
                        {COLUMN_DEFS[key].cell(g)}
                      </td>
                    ))}
                    <td className="px-3 py-2 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(g.id);
                        }}
                        className="text-[#A85C52]/70 hover:text-[#A85C52]"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>

      {showImport && (
        <ImportCsvModal
          titulo="Importar gastos generales desde Excel o CSV"
          endpoint="/gastos-generales/importar"
          plantillaHref="/plantilla-gastos-generales.xlsx"
          descripcionColumnas="Completa la plantilla con las columnas: FECHA, CATEGORIA, DESCRIPCION, MONTO TOTAL."
          onClose={() => setShowImport(false)}
          onImported={() => {
            load();
          }}
        />
      )}
    </Layout>
  );
}
