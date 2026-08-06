import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Upload, Search } from 'lucide-react';
import Layout from '../components/Layout.jsx';
import ResumenCards from '../components/ResumenCards.jsx';
import ImportCsvModal from '../components/ImportCsvModal.jsx';
import { api } from '../lib/api.js';
import { formatCLP, formatFecha, TIPO_LABELS, ESTADO_LABELS, TIPO_COLORS } from '../lib/format.js';

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

export default function VentasList() {
  const [filtros, setFiltros] = useState(FILTROS_INICIALES);
  const [ventas, setVentas] = useState([]);
  const [resumen, setResumen] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showImport, setShowImport] = useState(false);

  async function load() {
    setLoading(true);
    setError('');
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
            Importar CSV
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

      <div className="bg-white rounded-xl border border-black/5 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-[#2C2420]/50 uppercase tracking-wide border-b border-black/5">
              <th className="px-5 py-3 font-medium">Código</th>
              <th className="px-5 py-3 font-medium">Clienta</th>
              <th className="px-5 py-3 font-medium">Tipo</th>
              <th className="px-5 py-3 font-medium">Fecha venta</th>
              <th className="px-5 py-3 font-medium">Fecha evento</th>
              <th className="px-5 py-3 font-medium text-right">Total</th>
              <th className="px-5 py-3 font-medium text-right">Saldo</th>
              <th className="px-5 py-3 font-medium">% Cobrado</th>
              <th className="px-5 py-3 font-medium">Estado</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={9} className="px-5 py-10 text-center text-[#2C2420]/40">
                  Cargando…
                </td>
              </tr>
            )}
            {!loading && ventas.length === 0 && (
              <tr>
                <td colSpan={9} className="px-5 py-10 text-center text-[#2C2420]/40">
                  No hay ventas registradas todavía.
                </td>
              </tr>
            )}
            {!loading &&
              ventas.map((v) => (
                <tr
                  key={v.id}
                  className="border-b border-black/5 last:border-0 hover:bg-[#FAFAF8] cursor-pointer"
                >
                  <td className="px-5 py-3">
                    <Link to={`/ventas/${v.id}`} className="font-medium text-[#2C2420] hover:text-[#C9A96E]">
                      {v.codigo}
                    </Link>
                  </td>
                  <td className="px-5 py-3">{v.nombreClienta}</td>
                  <td className="px-5 py-3">
                    <TipoBadge tipo={v.tipo} />
                  </td>
                  <td className="px-5 py-3 text-[#2C2420]/70">{formatFecha(v.fechaVenta)}</td>
                  <td className="px-5 py-3 text-[#2C2420]/70">{formatFecha(v.fechaEvento)}</td>
                  <td className="px-5 py-3 text-right font-medium">{formatCLP(v.precioTotal)}</td>
                  <td
                    className="px-5 py-3 text-right font-medium"
                    style={{ color: v.saldoPendiente > 0 ? '#A85C52' : '#5C8C6A' }}
                  >
                    {formatCLP(v.saldoPendiente)}
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2 w-28">
                      <div className="flex-1 h-1.5 rounded-full bg-black/5 overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{
                            width: `${Math.min(v.porcentajeCobrado, 100)}%`,
                            backgroundColor: '#C9A96E',
                          }}
                        />
                      </div>
                      <span className="text-xs text-[#2C2420]/60 w-9">{v.porcentajeCobrado}%</span>
                    </div>
                  </td>
                  <td className="px-5 py-3">
                    <EstadoBadge estado={v.estado} />
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      {showImport && (
        <ImportCsvModal
          onClose={() => setShowImport(false)}
          onImported={() => {
            load();
          }}
        />
      )}
    </Layout>
  );
}
