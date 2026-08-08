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
import { ArrowUpDown } from 'lucide-react';
import Layout from '../components/Layout.jsx';
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

function SortHeader({ label, field, sort, setSort, align = 'left' }) {
  const active = sort.field === field;
  return (
    <th
      className={`px-3 py-2.5 font-medium cursor-pointer select-none whitespace-nowrap ${align === 'right' ? 'text-right' : 'text-left'}`}
      onClick={() =>
        setSort({ field, dir: active && sort.dir === 'desc' ? 'asc' : 'desc' })
      }
    >
      <span className={`inline-flex items-center gap-1 ${align === 'right' ? 'flex-row-reverse' : ''}`}>
        {label}
        <ArrowUpDown size={11} className={active ? 'text-[#C9A96E]' : 'text-[#2C2420]/20'} />
      </span>
    </th>
  );
}

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

      <p className="text-xs font-semibold uppercase tracking-wide text-[#2C2420]/40 mb-3">
        Análisis por tipo de vestido
      </p>
      <div className="bg-white rounded-xl border border-black/5 overflow-hidden mb-6">
        <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-[#2C2420]/50 uppercase tracking-wide border-b border-black/5">
              <th className="px-3 py-2.5 font-medium whitespace-nowrap">Tipo</th>
              <th className="px-3 py-2.5 font-medium text-right whitespace-nowrap">Cantidad</th>
              <th className="px-3 py-2.5 font-medium text-right whitespace-nowrap">Precio mín</th>
              <th className="px-3 py-2.5 font-medium text-right whitespace-nowrap">Precio prom</th>
              <th className="px-3 py-2.5 font-medium text-right whitespace-nowrap">Precio máx</th>
              <th className="px-3 py-2.5 font-medium text-right whitespace-nowrap">Materiales prom</th>
              <th className="px-3 py-2.5 font-medium text-right whitespace-nowrap">Mano de obra prom</th>
              <th className="px-3 py-2.5 font-medium text-right whitespace-nowrap">Margen prom</th>
              <th className="px-3 py-2.5 font-medium text-right whitespace-nowrap">Margen % prom</th>
            </tr>
          </thead>
          <tbody>
            {porTipo.map((t) => (
              <tr key={t.tipo} className="border-b border-black/5 last:border-0">
                <td className="px-3 py-2 font-medium whitespace-nowrap" style={{ color: TIPO_COLORS[t.tipo]?.text }}>
                  {TIPO_LABELS[t.tipo]}
                </td>
                <td className="px-3 py-2 text-right">{t.cantidad}</td>
                <td className="px-3 py-2 text-right text-[#2C2420]/70 whitespace-nowrap">{formatCLP(t.precioMin)}</td>
                <td className="px-3 py-2 text-right font-medium whitespace-nowrap">{formatCLP(t.precioProm)}</td>
                <td className="px-3 py-2 text-right text-[#2C2420]/70 whitespace-nowrap">{formatCLP(t.precioMax)}</td>
                <td className="px-3 py-2 text-right whitespace-nowrap">{formatCLP(t.costoMaterialesProm)}</td>
                <td className="px-3 py-2 text-right whitespace-nowrap">{formatCLP(t.manoObraProm)}</td>
                <td
                  className="px-3 py-2 text-right font-medium whitespace-nowrap"
                  style={{ color: t.margenProm >= 0 ? '#5C8C6A' : '#A85C52' }}
                >
                  {formatCLP(t.margenProm)}
                </td>
                <td
                  className="px-3 py-2 text-right font-medium whitespace-nowrap"
                  style={{ color: t.margenPctProm >= 0 ? '#5C8C6A' : '#A85C52' }}
                >
                  {t.margenPctProm}%
                </td>
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

      <p className="text-xs font-semibold uppercase tracking-wide text-[#2C2420]/40 mb-3">
        Detalle individual
      </p>
      <div className="bg-white rounded-xl border border-black/5 overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-[#2C2420]/50 uppercase tracking-wide border-b border-black/5">
              <th className="px-3 py-2.5 font-medium">Clienta</th>
              <SortHeader label="Tipo" field="tipo" sort={sort} setSort={setSort} />
              <SortHeader label="Fecha venta" field="fechaVenta" sort={sort} setSort={setSort} />
              <SortHeader label="Precio" field="precioVenta" sort={sort} setSort={setSort} align="right" />
              <th className="px-3 py-2.5 font-medium text-right whitespace-nowrap">Materiales</th>
              <th className="px-3 py-2.5 font-medium text-right whitespace-nowrap">Mano de obra</th>
              <SortHeader label="Margen" field="margen" sort={sort} setSort={setSort} align="right" />
              <SortHeader label="Margen %" field="margenPct" sort={sort} setSort={setSort} align="right" />
              <th className="px-3 py-2.5 font-medium whitespace-nowrap">Origen</th>
            </tr>
          </thead>
          <tbody>
            {detalleOrdenado.map((v) => (
              <tr key={v.ventaId} className="border-b border-black/5 last:border-0 hover:bg-[#FAFAF8]">
                <td className="px-3 py-2 whitespace-nowrap">
                  <p className="font-medium text-[#2C2420]">{v.nombreClienta}</p>
                  <p className="text-xs text-[#2C2420]/40">{v.codigo}</p>
                </td>
                <td className="px-3 py-2 whitespace-nowrap" style={{ color: TIPO_COLORS[v.tipo]?.text }}>
                  {TIPO_LABELS[v.tipo]}
                </td>
                <td className="px-3 py-2 text-[#2C2420]/70 whitespace-nowrap">{formatFecha(v.fechaVenta)}</td>
                <td className="px-3 py-2 text-right font-medium whitespace-nowrap">{formatCLP(v.precioVenta)}</td>
                <td className="px-3 py-2 text-right whitespace-nowrap">{formatCLP(v.costoMateriales)}</td>
                <td className="px-3 py-2 text-right whitespace-nowrap">{formatCLP(v.manoDeObra)}</td>
                <td
                  className="px-3 py-2 text-right font-medium whitespace-nowrap"
                  style={{ color: v.margen >= 0 ? '#5C8C6A' : '#A85C52' }}
                >
                  {formatCLP(v.margen)}
                </td>
                <td
                  className="px-3 py-2 text-right font-medium whitespace-nowrap"
                  style={{ color: v.margenPct >= 0 ? '#5C8C6A' : '#A85C52' }}
                >
                  {v.margenPct}%
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  <span
                    className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium"
                    style={{
                      backgroundColor: v.esEstimado ? '#F5E9E7' : '#E6EEEA',
                      color: v.esEstimado ? '#A85C52' : '#5C8C6A',
                    }}
                  >
                    {v.esEstimado ? 'Estimado' : 'Real'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>
    </Layout>
  );
}
