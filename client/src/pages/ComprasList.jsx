import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Plus, Trash2, Upload, X } from 'lucide-react';
import Layout from '../components/Layout.jsx';
import ImportCsvModal from '../components/ImportCsvModal.jsx';
import FilterableHeader from '../components/FilterableHeader.jsx';
import { useColumnFilters } from '../lib/useColumnFilters.js';
import { api } from '../lib/api.js';
import {
  formatCLP,
  formatFecha,
  CATEGORIA_LABELS,
  TIPO_ASIGNACION_LABELS,
  TIPO_ASIGNACION_CORTO,
} from '../lib/format.js';

const FILTROS_INICIALES = { categoria: '', tipoAsignacion: '', mesCompra: '' };

function buildQuery(filtros) {
  const params = new URLSearchParams();
  Object.entries(filtros).forEach(([k, v]) => {
    if (v) params.set(k, v);
  });
  return params.toString();
}

const ASIGNACION_COLORS = {
  DIRECTO: { bg: '#F3ECE4', text: '#8A6D3B' },
  CONSUMO_ESTIMADO: { bg: '#E6EEEA', text: '#3E6350' },
  PRORRATEO: { bg: '#EFE7F1', text: '#6B4C7A' },
};

function AsignacionBadge({ tipoAsignacion }) {
  const colors = ASIGNACION_COLORS[tipoAsignacion];
  return (
    <span
      className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium"
      style={{ backgroundColor: colors.bg, color: colors.text }}
    >
      {TIPO_ASIGNACION_CORTO[tipoAsignacion]}
    </span>
  );
}

const COLUMN_DEFS = {
  fecha: {
    label: 'Fecha',
    cell: (c) => <span className="text-[#2C2420]/70">{formatFecha(c.fecha)}</span>,
    getValue: (c) => formatFecha(c.fecha),
  },
  categoria: {
    label: 'Categoría',
    cell: (c) => CATEGORIA_LABELS[c.categoria],
    getValue: (c) => CATEGORIA_LABELS[c.categoria],
  },
  descripcion: {
    label: 'Descripción',
    cell: (c) => <span className="font-medium text-[#2C2420]">{c.descripcion}</span>,
    getValue: (c) => c.descripcion,
  },
  asignacion: {
    label: 'Asignación',
    cell: (c) => <AsignacionBadge tipoAsignacion={c.tipoAsignacion} />,
    getValue: (c) => TIPO_ASIGNACION_CORTO[c.tipoAsignacion],
  },
  vestidos: {
    label: 'Vestidos afectados',
    cell: (c) => <span className="text-[#2C2420]/70">{c.cantidadVestidosAsignados}</span>,
    getValue: (c) => String(c.cantidadVestidosAsignados),
  },
  monto: {
    label: 'Monto',
    align: 'right',
    cell: (c) => <span className="font-medium">{formatCLP(c.montoTotal)}</span>,
    getValue: (c) => formatCLP(c.montoTotal),
  },
};

const ORDEN_COLUMNAS = ['fecha', 'categoria', 'descripcion', 'asignacion', 'vestidos', 'monto'];

export default function ComprasList() {
  const navigate = useNavigate();
  const [filtros, setFiltros] = useState(FILTROS_INICIALES);
  const [compras, setCompras] = useState([]);
  const [resumen, setResumen] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showImport, setShowImport] = useState(false);

  const filtroColumnas = useMemo(
    () => ORDEN_COLUMNAS.map((key) => ({ key, getValue: COLUMN_DEFS[key].getValue })),
    []
  );
  const {
    filteredRows: comprasFiltradas,
    uniqueValuesByColumn,
    excludedByColumn,
    setColumnExcluded,
    clearAllFilters: limpiarFiltrosColumna,
    activeCount: filtrosColumnaActivos,
  } = useColumnFilters(compras, filtroColumnas);

  async function load() {
    setLoading(true);
    setError('');
    try {
      const qs = buildQuery(filtros);
      const [comprasData, resumenData] = await Promise.all([
        api.get(`/purchases${qs ? `?${qs}` : ''}`),
        api.get(`/purchases/resumen${qs ? `?${qs}` : ''}`),
      ]);
      setCompras(comprasData);
      setResumen(resumenData);
    } catch (err) {
      setError(err.message || 'No se pudieron cargar las compras');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtros.categoria, filtros.tipoAsignacion, filtros.mesCompra]);

  async function handleDelete(id) {
    if (!confirm('¿Eliminar este registro de compra? Se quitarán los costos asignados a los vestidos.'))
      return;
    try {
      await api.del(`/purchases/${id}`);
      load();
    } catch (err) {
      setError(err.message || 'No se pudo eliminar la compra');
    }
  }

  return (
    <Layout
      title="Registro de insumos"
      subtitle="Compras de materiales y su asignación de costo a los vestidos"
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
            to="/costos/insumos/nueva"
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white hover:opacity-90"
            style={{ backgroundColor: '#1A1A2E' }}
          >
            <Plus size={16} />
            Nueva compra
          </Link>
        </>
      }
    >
      {resumen && (
        <div className="flex flex-wrap gap-4 mb-6">
          <div className="bg-white rounded-xl border border-black/5 px-5 py-4 flex-1 min-w-[180px]">
            <p className="text-xs font-medium text-[#2C2420]/50 uppercase tracking-wide mb-1.5">
              Total comprado
            </p>
            <p className="font-serif text-2xl text-[#2C2420]">{formatCLP(resumen.totalGeneral)}</p>
          </div>
          <div className="bg-white rounded-xl border border-black/5 px-5 py-4 flex-1 min-w-[180px]">
            <p className="text-xs font-medium text-[#2C2420]/50 uppercase tracking-wide mb-1.5">
              N° de compras
            </p>
            <p className="font-serif text-2xl text-[#2C2420]">{resumen.cantidadCompras}</p>
          </div>
          <div className="bg-white rounded-xl border border-black/5 px-5 py-4 flex-[2] min-w-[280px]">
            <p className="text-xs font-medium text-[#2C2420]/50 uppercase tracking-wide mb-2">
              Por categoría
            </p>
            <div className="flex flex-wrap gap-x-4 gap-y-1">
              {Object.entries(resumen.porCategoria).map(([cat, monto]) => (
                <span key={cat} className="text-xs text-[#2C2420]/70">
                  {CATEGORIA_LABELS[cat]}:{' '}
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
          {Object.entries(CATEGORIA_LABELS).map(([k, l]) => (
            <option key={k} value={k}>
              {l}
            </option>
          ))}
        </select>
        <select
          value={filtros.tipoAsignacion}
          onChange={(e) => setFiltros((f) => ({ ...f, tipoAsignacion: e.target.value }))}
          className="px-3 py-2 text-sm rounded-lg border border-black/10 focus:outline-none focus:ring-2 focus:ring-[#C9A96E]"
        >
          <option value="">Todos los tipos de asignación</option>
          {Object.entries(TIPO_ASIGNACION_LABELS).map(([k, l]) => (
            <option key={k} value={k}>
              {l}
            </option>
          ))}
        </select>
        <div className="flex items-center gap-1.5 text-xs text-[#2C2420]/50">
          Mes de compra
          <input
            type="month"
            value={filtros.mesCompra}
            onChange={(e) => setFiltros((f) => ({ ...f, mesCompra: e.target.value }))}
            className="px-2 py-1.5 text-sm rounded-lg border border-black/10 focus:outline-none focus:ring-2 focus:ring-[#C9A96E]"
          />
        </div>
        {(filtros.categoria || filtros.tipoAsignacion || filtros.mesCompra) && (
          <button
            onClick={() => setFiltros(FILTROS_INICIALES)}
            className="text-xs text-[#A85C52] hover:underline ml-auto"
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {error && <p className="text-sm text-[#A85C52] mb-4">{error}</p>}

      {filtrosColumnaActivos > 0 && (
        <div className="flex justify-end mb-2">
          <button
            onClick={limpiarFiltrosColumna}
            className="flex items-center gap-1.5 text-xs text-[#A85C52] hover:underline"
          >
            <X size={12} />
            Limpiar filtros de columna ({filtrosColumnaActivos})
          </button>
        </div>
      )}

      <div className="bg-white rounded-xl border border-black/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-[#2C2420]/50 uppercase tracking-wide border-b border-black/5">
                {ORDEN_COLUMNAS.map((key) => (
                  <FilterableHeader
                    key={key}
                    label={COLUMN_DEFS[key].label}
                    align={COLUMN_DEFS[key].align}
                    options={uniqueValuesByColumn[key]}
                    excluded={excludedByColumn[key]}
                    onChange={(excl) => setColumnExcluded(key, excl)}
                  />
                ))}
                <th className="px-3 py-2.5 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={7} className="px-3 py-10 text-center text-[#2C2420]/40">
                    Cargando…
                  </td>
                </tr>
              )}
              {!loading && compras.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-3 py-10 text-center text-[#2C2420]/40">
                    No hay compras registradas todavía.
                  </td>
                </tr>
              )}
              {!loading && compras.length > 0 && comprasFiltradas.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-3 py-10 text-center text-[#2C2420]/40">
                    Ningún resultado con los filtros de columna aplicados.{' '}
                    <button onClick={limpiarFiltrosColumna} className="text-[#C9A96E] hover:underline">
                      Limpiarlos
                    </button>
                  </td>
                </tr>
              )}
              {!loading &&
                comprasFiltradas.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => navigate(`/costos/insumos/${c.id}`)}
                    className="border-b border-black/5 last:border-0 hover:bg-[#FAFAF8] cursor-pointer"
                  >
                    {ORDEN_COLUMNAS.map((key) => (
                      <td
                        key={key}
                        className={`px-3 py-2 whitespace-nowrap ${
                          COLUMN_DEFS[key].align === 'right' ? 'text-right' : ''
                        }`}
                      >
                        {COLUMN_DEFS[key].cell(c)}
                      </td>
                    ))}
                    <td className="px-3 py-2 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(c.id);
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
          titulo="Importar compras de insumos desde Excel o CSV"
          endpoint="/purchases/importar"
          plantillaHref="/plantilla-compras.xlsx"
          descripcionColumnas="Completa la plantilla con las columnas: FECHA COMPRA, CATEGORIA, DESCRIPCION, MONTO TOTAL, TIPO ASIGNACION, CODIGO VENTA (solo si es Directo), UNIDAD MEDIDA, CANTIDAD COMPRADA, CONSUMO NOVIA, CONSUMO MADRINA, CONSUMO INVITADA, CONSUMO CIVIL (estas últimas 4 solo si es Consumo estimado)."
          onClose={() => setShowImport(false)}
          onImported={() => {
            load();
          }}
        />
      )}
    </Layout>
  );
}
