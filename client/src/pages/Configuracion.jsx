import { useEffect, useState } from 'react';
import { Check } from 'lucide-react';
import Layout from '../components/Layout.jsx';
import { api } from '../lib/api.js';
import { toInputDate, TIPO_LABELS } from '../lib/format.js';

function SavedBadge({ show }) {
  if (!show) return null;
  return (
    <span className="inline-flex items-center gap-1 text-xs text-[#5C8C6A]">
      <Check size={13} /> Guardado
    </span>
  );
}

export default function Configuracion() {
  const [tipos, setTipos] = useState([]);
  const [sueldos, setSueldos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savedKey, setSavedKey] = useState('');

  function load() {
    setLoading(true);
    Promise.all([api.get('/config/tipos-vestido'), api.get('/config/sueldos')])
      .then(([t, s]) => {
        setTipos(t);
        setSueldos(s);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  function updateTipoField(tipo, field, value) {
    setTipos((prev) => prev.map((t) => (t.tipo === tipo ? { ...t, [field]: value } : t)));
  }

  async function saveTipo(tipo) {
    const row = tipos.find((t) => t.tipo === tipo);
    try {
      await api.put(`/config/tipos-vestido/${tipo}`, {
        costoEstandar: Number(row.costoEstandar),
        consumoTelaEstimado: Number(row.consumoTelaEstimado),
      });
      setSavedKey(`tipo-${tipo}`);
      setTimeout(() => setSavedKey(''), 1500);
    } catch (err) {
      setError(err.message);
    }
  }

  function updateSueldoField(nombre, field, value) {
    setSueldos((prev) => prev.map((s) => (s.nombre === nombre ? { ...s, [field]: value } : s)));
  }

  async function saveSueldo(nombre) {
    const row = sueldos.find((s) => s.nombre === nombre);
    try {
      await api.put(`/config/sueldos/${encodeURIComponent(nombre)}`, {
        monto: Number(row.monto),
        fechaInicio: row.fechaInicio,
      });
      setSavedKey(`sueldo-${nombre}`);
      setTimeout(() => setSavedKey(''), 1500);
    } catch (err) {
      setError(err.message);
    }
  }

  if (loading) {
    return (
      <Layout title="Configuración / Supuestos">
        <p className="text-sm text-[#2C2420]/40">Cargando…</p>
      </Layout>
    );
  }

  return (
    <Layout
      title="Configuración / Supuestos"
      subtitle="Valores base usados por el módulo de costeo y el dashboard financiero"
    >
      {error && <p className="text-sm text-[#A85C52] mb-4">{error}</p>}

      <p className="text-xs font-semibold uppercase tracking-wide text-[#2C2420]/40 mb-3">
        Costos estándar y consumo de tela por tipo de vestido
      </p>
      <div className="bg-white rounded-xl border border-black/5 overflow-hidden mb-8">
        <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-[#2C2420]/50 uppercase tracking-wide border-b border-black/5">
              <th className="px-5 py-3 font-medium whitespace-nowrap">Tipo</th>
              <th className="px-5 py-3 font-medium whitespace-nowrap">Costo estándar (CLP)</th>
              <th className="px-5 py-3 font-medium whitespace-nowrap">Consumo de tela estimado (metros)</th>
              <th className="px-5 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {tipos.map((t) => (
              <tr key={t.tipo} className="border-b border-black/5 last:border-0">
                <td className="px-5 py-3 font-medium">{TIPO_LABELS[t.tipo]}</td>
                <td className="px-5 py-3">
                  <input
                    type="number"
                    min="0"
                    value={t.costoEstandar}
                    onChange={(e) => updateTipoField(t.tipo, 'costoEstandar', e.target.value)}
                    className="w-40 px-3 py-1.5 text-sm rounded-lg border border-black/10 focus:outline-none focus:ring-2 focus:ring-[#C9A96E]"
                  />
                </td>
                <td className="px-5 py-3">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={t.consumoTelaEstimado}
                    onChange={(e) => updateTipoField(t.tipo, 'consumoTelaEstimado', e.target.value)}
                    className="w-32 px-3 py-1.5 text-sm rounded-lg border border-black/10 focus:outline-none focus:ring-2 focus:ring-[#C9A96E]"
                  />
                </td>
                <td className="px-5 py-3 flex items-center gap-3">
                  <button
                    onClick={() => saveTipo(t.tipo)}
                    className="px-3 py-1.5 text-xs rounded-lg text-white hover:opacity-90"
                    style={{ backgroundColor: '#1A1A2E' }}
                  >
                    Guardar
                  </button>
                  <SavedBadge show={savedKey === `tipo-${t.tipo}`} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>

      <p className="text-xs font-semibold uppercase tracking-wide text-[#2C2420]/40 mb-3">
        Sueldos de modistas (mano de obra)
      </p>
      <div className="bg-white rounded-xl border border-black/5 overflow-hidden">
        <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-[#2C2420]/50 uppercase tracking-wide border-b border-black/5">
              <th className="px-5 py-3 font-medium whitespace-nowrap">Nombre</th>
              <th className="px-5 py-3 font-medium whitespace-nowrap">Monto mensual (CLP)</th>
              <th className="px-5 py-3 font-medium whitespace-nowrap">Vigente desde</th>
              <th className="px-5 py-3 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {sueldos.map((s) => (
              <tr key={s.nombre} className="border-b border-black/5 last:border-0">
                <td className="px-5 py-3 font-medium">{s.nombre}</td>
                <td className="px-5 py-3">
                  <input
                    type="number"
                    min="0"
                    value={s.monto}
                    onChange={(e) => updateSueldoField(s.nombre, 'monto', e.target.value)}
                    className="w-40 px-3 py-1.5 text-sm rounded-lg border border-black/10 focus:outline-none focus:ring-2 focus:ring-[#C9A96E]"
                  />
                </td>
                <td className="px-5 py-3">
                  <input
                    type="date"
                    value={toInputDate(s.fechaInicio)}
                    onChange={(e) => updateSueldoField(s.nombre, 'fechaInicio', e.target.value)}
                    className="px-3 py-1.5 text-sm rounded-lg border border-black/10 focus:outline-none focus:ring-2 focus:ring-[#C9A96E]"
                  />
                </td>
                <td className="px-5 py-3 flex items-center gap-3">
                  <button
                    onClick={() => saveSueldo(s.nombre)}
                    className="px-3 py-1.5 text-xs rounded-lg text-white hover:opacity-90"
                    style={{ backgroundColor: '#1A1A2E' }}
                  >
                    Guardar
                  </button>
                  <SavedBadge show={savedKey === `sueldo-${s.nombre}`} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>

      <p className="text-xs text-[#2C2420]/40 mt-4 leading-relaxed max-w-2xl">
        La mano de obra estimada mostrada en la ficha de costo de cada vestido se calcula como la
        suma de sueldos vigentes hoy dividida entre la cantidad de vestidos activos (No entregado +
        entregados este mes). El costo estándar por tipo se usa como valor provisional cuando un
        vestido todavía no tiene insumos registrados.
      </p>
    </Layout>
  );
}
