import { useEffect, useState } from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import Layout from '../components/Layout.jsx';
import PresupuestoVentas from '../components/PresupuestoVentas.jsx';
import { api } from '../lib/api.js';
import { formatCLP, formatMesCorto } from '../lib/format.js';

const TABS = [
  { key: 'eerr', label: 'Estado de Resultados' },
  { key: 'flujo', label: 'Flujo de Caja' },
  { key: 'presupuesto', label: 'Presupuesto de Ventas' },
];

function KpiCard({ label, value, valueColor, hint }) {
  return (
    <div className="bg-white rounded-xl border border-black/5 px-5 py-4">
      <p className="text-xs text-[#2C2420]/50">{label}</p>
      <p className="font-serif text-2xl mt-1" style={{ color: valueColor || '#2C2420' }}>
        {value}
      </p>
      {hint && <p className="text-xs text-[#2C2420]/40 mt-1">{hint}</p>}
    </div>
  );
}

function MesCell({ mesKey, tieneReales }) {
  return (
    <td className="sticky left-0 bg-white px-4 py-2.5 whitespace-nowrap font-medium border-r border-black/5">
      {formatMesCorto(mesKey)}
      {tieneReales === false && (
        <span className="ml-2 text-[10px] font-normal text-[#8A7F75] uppercase tracking-wide">
          proy.
        </span>
      )}
    </td>
  );
}

function EerrTable({ eerr }) {
  if (!eerr || eerr.meses.length === 0) {
    return <p className="text-sm text-[#2C2420]/40 px-1">Aún no hay ventas ni presupuesto cargado.</p>;
  }
  const cols = [
    { key: 'ingresosReales', label: 'Ingresos reales' },
    { key: 'ingresosPresupuestados', label: 'Ingresos presup.' },
    { key: 'totalIngresos', label: 'Total ingresos', bold: true },
    { key: 'cvReal', label: 'CV real' },
    { key: 'cvPresupuestado', label: 'CV presup.' },
    { key: 'totalCV', label: 'Total CV', bold: true },
    { key: 'margenBruto', label: 'Margen bruto', bold: true, signed: true },
    { key: 'margenBrutoPct', label: 'Margen bruto %', pct: true, signed: true },
    { key: 'costosFijos', label: 'Costos fijos' },
    { key: 'utilidadOperacional', label: 'Utilidad operacional', bold: true, signed: true },
    { key: 'margenOperacionalPct', label: 'Margen operac. %', pct: true, signed: true },
  ];
  return (
    <div className="bg-white rounded-xl border border-black/5 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="text-sm border-collapse">
          <thead>
            <tr className="text-left text-xs text-[#2C2420]/50 uppercase tracking-wide border-b border-black/5">
              <th className="sticky left-0 bg-white px-4 py-3 font-medium whitespace-nowrap border-r border-black/5">
                Mes
              </th>
              {cols.map((c) => (
                <th key={c.key} className="px-4 py-3 font-medium whitespace-nowrap text-right">
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {eerr.meses.map((m) => (
              <tr key={m.mes} className={`border-b border-black/5 last:border-0 ${!m.tieneReales ? 'bg-[#FAFAF8]' : ''}`}>
                <MesCell mesKey={m.mes} tieneReales={m.tieneReales} />
                {cols.map((c) => {
                  const v = m[c.key];
                  const color = c.signed ? (v >= 0 ? '#5C8C6A' : '#A85C52') : undefined;
                  return (
                    <td
                      key={c.key}
                      className={`px-4 py-2.5 whitespace-nowrap text-right ${c.bold ? 'font-medium' : 'text-[#2C2420]/70'}`}
                      style={color ? { color } : undefined}
                    >
                      {c.pct ? `${v}%` : formatCLP(v)}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t-2 border-black/10 font-medium">
              <td className="sticky left-0 bg-white px-4 py-3 whitespace-nowrap border-r border-black/5">Total</td>
              {cols.map((c) => {
                const v = eerr.total[c.key];
                const color = c.signed ? (v >= 0 ? '#5C8C6A' : '#A85C52') : undefined;
                return (
                  <td key={c.key} className="px-4 py-3 whitespace-nowrap text-right" style={color ? { color } : undefined}>
                    {c.pct ? `${v}%` : formatCLP(v)}
                  </td>
                );
              })}
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

function FlujoCajaTable({ flujo }) {
  if (!flujo || flujo.meses.length === 0) {
    return <p className="text-sm text-[#2C2420]/40 px-1">Aún no hay ventas ni presupuesto cargado.</p>;
  }
  const cols = [
    { key: 'cobrosRealizados', label: 'Cobros realizados' },
    { key: 'saldoPendienteEsperado', label: 'Saldo pend. esperado' },
    { key: 'cobrosPresupuestados', label: 'Cobros presup.' },
    { key: 'totalEntradas', label: 'Total entradas', bold: true },
    { key: 'cvReal', label: 'CV real' },
    { key: 'cvPresupuestado', label: 'CV presup.' },
    { key: 'costosFijos', label: 'Costos fijos' },
    { key: 'totalSalidas', label: 'Total salidas', bold: true },
    { key: 'resultadoMes', label: 'Resultado del mes', bold: true, signed: true },
    { key: 'cajaAcumulada', label: 'Caja acumulada', bold: true, signed: true },
  ];
  return (
    <div className="bg-white rounded-xl border border-black/5 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="text-sm border-collapse">
          <thead>
            <tr className="text-left text-xs text-[#2C2420]/50 uppercase tracking-wide border-b border-black/5">
              <th className="sticky left-0 bg-white px-4 py-3 font-medium whitespace-nowrap border-r border-black/5">
                Mes
              </th>
              {cols.map((c) => (
                <th key={c.key} className="px-4 py-3 font-medium whitespace-nowrap text-right">
                  {c.label}
                </th>
              ))}
              <th className="px-4 py-3 font-medium whitespace-nowrap text-center">Alcanza sueldo socias</th>
            </tr>
          </thead>
          <tbody>
            {flujo.meses.map((m) => (
              <tr key={m.mes} className="border-b border-black/5 last:border-0">
                <MesCell mesKey={m.mes} />
                {cols.map((c) => {
                  const v = m[c.key];
                  const color = c.signed ? (v >= 0 ? '#5C8C6A' : '#A85C52') : undefined;
                  return (
                    <td
                      key={c.key}
                      className={`px-4 py-2.5 whitespace-nowrap text-right ${c.bold ? 'font-medium' : 'text-[#2C2420]/70'}`}
                      style={color ? { color } : undefined}
                    >
                      {formatCLP(v)}
                    </td>
                  );
                })}
                <td className="px-4 py-2.5 text-center">
                  {m.alcanzaSueldoSocias ? (
                    <CheckCircle2 size={17} className="inline text-[#5C8C6A]" />
                  ) : (
                    <XCircle size={17} className="inline text-[#A85C52]" />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [kpis, setKpis] = useState(null);
  const [eerr, setEerr] = useState(null);
  const [flujo, setFlujo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [tab, setTab] = useState('eerr');

  useEffect(() => {
    Promise.all([api.get('/dashboard/kpis'), api.get('/dashboard/eerr'), api.get('/dashboard/flujo-caja')])
      .then(([k, e, f]) => {
        setKpis(k);
        setEerr(e);
        setFlujo(f);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Layout title="Dashboard Financiero">
        <p className="text-sm text-[#2C2420]/40">Cargando…</p>
      </Layout>
    );
  }

  return (
    <Layout
      title="Dashboard Financiero"
      subtitle="Estado de resultados, flujo de caja y presupuesto de ventas"
    >
      {error && <p className="text-sm text-[#A85C52] mb-4">{error}</p>}

      {kpis && (
        <div className="grid grid-cols-6 gap-4 mb-6">
          <KpiCard label="Caja actual" value={formatCLP(kpis.cajaActual)} valueColor={kpis.cajaActual >= 0 ? '#5C8C6A' : '#A85C52'} />
          <KpiCard label="Ventas del mes" value={formatCLP(kpis.ventasDelMes)} />
          <KpiCard
            label="Margen bruto % del mes"
            value={`${kpis.margenBrutoPctMes}%`}
            valueColor={kpis.margenBrutoPctMes >= 0 ? '#5C8C6A' : '#A85C52'}
          />
          <KpiCard label="Vestidos en producción" value={kpis.vestidosEnProduccion} />
          <KpiCard label="Por cobrar (total)" value={formatCLP(kpis.totalPorCobrar)} />
          <KpiCard
            label="¿Alcanza sueldo socias?"
            value={kpis.alcanzaSueldoSociasMes === null ? '—' : kpis.alcanzaSueldoSociasMes ? 'Sí' : 'No'}
            valueColor={
              kpis.alcanzaSueldoSociasMes === null ? undefined : kpis.alcanzaSueldoSociasMes ? '#5C8C6A' : '#A85C52'
            }
            hint={kpis.sueldoSocias > 0 ? `Meta: ${formatCLP(kpis.sueldoSocias)}` : undefined}
          />
        </div>
      )}

      <div className="flex items-center gap-1 mb-4 border-b border-black/5">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
              tab === t.key
                ? 'border-[#C9A96E] text-[#2C2420]'
                : 'border-transparent text-[#2C2420]/50 hover:text-[#2C2420]'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'eerr' && <EerrTable eerr={eerr} />}
      {tab === 'flujo' && <FlujoCajaTable flujo={flujo} />}
      {tab === 'presupuesto' && <PresupuestoVentas />}
    </Layout>
  );
}
