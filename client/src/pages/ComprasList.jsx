import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Trash2 } from 'lucide-react';
import Layout from '../components/Layout.jsx';
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

export default function ComprasList() {
  const [filtros, setFiltros] = useState(FILTROS_INICIALES);
  const [compras, setCompras] = useState([]);
  const [resumen, setResumen] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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
        <Link
          to="/costos/insumos/nueva"
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white hover:opacity-90"
          style={{ backgroundColor: '#1A1A2E' }}
        >
          <Plus size={16} />
          Nueva compra
        </Link>
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

      <div className="bg-white rounded-xl border border-black/5 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-[#2C2420]/50 uppercase tracking-wide border-b border-black/5">
              <th className="px-5 py-3 font-medium">Fecha</th>
              <th className="px-5 py-3 font-medium">Categoría</th>
              <th className="px-5 py-3 font-medium">Descripción</th>
              <th className="px-5 py-3 font-medium">Asignación</th>
              <th className="px-5 py-3 font-medium">Vestidos afectados</th>
              <th className="px-5 py-3 font-medium text-right">Monto</th>
              <th className="px-5 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={7} className="px-5 py-10 text-center text-[#2C2420]/40">
                  Cargando…
                </td>
              </tr>
            )}
            {!loading && compras.length === 0 && (
              <tr>
                <td colSpan={7} className="px-5 py-10 text-center text-[#2C2420]/40">
                  No hay compras registradas todavía.
                </td>
              </tr>
            )}
            {!loading &&
              compras.map((c) => {
                const colors = ASIGNACION_COLORS[c.tipoAsignacion];
                return (
                  <tr key={c.id} className="border-b border-black/5 last:border-0 hover:bg-[#FAFAF8]">
                    <td className="px-5 py-3 text-[#2C2420]/70">{formatFecha(c.fecha)}</td>
                    <td className="px-5 py-3">{CATEGORIA_LABELS[c.categoria]}</td>
                    <td className="px-5 py-3">
                      <Link
                        to={`/costos/insumos/${c.id}`}
                        className="font-medium text-[#2C2420] hover:text-[#C9A96E]"
                      >
                        {c.descripcion}
                      </Link>
                    </td>
                    <td className="px-5 py-3">
                      <span
                        className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium"
                        style={{ backgroundColor: colors.bg, color: colors.text }}
                      >
                        {TIPO_ASIGNACION_CORTO[c.tipoAsignacion]}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-[#2C2420]/70">{c.cantidadVestidosAsignados}</td>
                    <td className="px-5 py-3 text-right font-medium">{formatCLP(c.montoTotal)}</td>
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={() => handleDelete(c.id)}
                        className="text-[#A85C52]/70 hover:text-[#A85C52]"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}
