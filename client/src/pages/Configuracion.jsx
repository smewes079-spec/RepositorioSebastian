import { useEffect, useState } from 'react';
import { Check, Plus, Trash2, KeyRound, UserPlus } from 'lucide-react';
import Layout from '../components/Layout.jsx';
import { api } from '../lib/api.js';
import { toInputDate, TIPO_LABELS } from '../lib/format.js';
import { useAuth } from '../lib/AuthContext.jsx';

function SavedBadge({ show }) {
  if (!show) return null;
  return (
    <span className="inline-flex items-center gap-1 text-xs text-[#5C8C6A]">
      <Check size={13} /> Guardado
    </span>
  );
}

const COSTO_FIJO_VACIO = { nombre: '', monto: 0, fechaInicio: '' };
const SUELDO_VACIO = { nombre: '', monto: 0, fechaInicio: '' };
const NUEVO_USUARIO_VACIO = { nombre: '', email: '' };
const CAMBIAR_PASSWORD_VACIO = { passwordActual: '', passwordNueva: '', passwordNueva2: '' };

export default function Configuracion() {
  const { usuario: usuarioActual } = useAuth();
  const [tipos, setTipos] = useState([]);
  const [sueldos, setSueldos] = useState([]);
  const [costosFijos, setCostosFijos] = useState([]);
  const [financiero, setFinanciero] = useState(null);
  const [usuarios, setUsuarios] = useState([]);
  const [nuevoUsuario, setNuevoUsuario] = useState(NUEVO_USUARIO_VACIO);
  const [passwordTemporal, setPasswordTemporal] = useState(null); // { email, password }
  const [cambiarPassword, setCambiarPassword] = useState(CAMBIAR_PASSWORD_VACIO);
  const [cambiarPasswordMsg, setCambiarPasswordMsg] = useState('');
  const [nuevoCostoFijo, setNuevoCostoFijo] = useState(COSTO_FIJO_VACIO);
  const [nuevoSueldo, setNuevoSueldo] = useState(SUELDO_VACIO);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [savedKey, setSavedKey] = useState('');

  function load() {
    setLoading(true);
    Promise.all([
      api.get('/config/tipos-vestido'),
      api.get('/config/sueldos'),
      api.get('/config/costos-fijos'),
      api.get('/config/financiero'),
      api.get('/usuarios'),
    ])
      .then(([t, s, c, f, u]) => {
        setTipos(t);
        setSueldos(s);
        setCostosFijos(c);
        setFinanciero(f);
        setUsuarios(u);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }

  async function crearUsuario() {
    if (!nuevoUsuario.nombre.trim() || !nuevoUsuario.email.trim()) return;
    try {
      const { usuario, passwordTemporal: pw } = await api.post('/usuarios', nuevoUsuario);
      setUsuarios((prev) => [...prev, usuario]);
      setNuevoUsuario(NUEVO_USUARIO_VACIO);
      setPasswordTemporal({ email: usuario.email, password: pw });
    } catch (err) {
      setError(err.message);
    }
  }

  async function toggleActivoUsuario(u) {
    try {
      const actualizado = await api.put(`/usuarios/${u.id}`, { activo: !u.activo });
      setUsuarios((prev) => prev.map((x) => (x.id === u.id ? actualizado : x)));
    } catch (err) {
      setError(err.message);
    }
  }

  async function resetearPasswordUsuario(u) {
    if (!confirm(`¿Restablecer la contraseña de ${u.nombre}? Se generará una nueva contraseña temporal.`)) return;
    try {
      const { passwordTemporal: pw } = await api.post(`/usuarios/${u.id}/resetear-password`);
      setPasswordTemporal({ email: u.email, password: pw });
    } catch (err) {
      setError(err.message);
    }
  }

  async function handleCambiarPassword() {
    setCambiarPasswordMsg('');
    if (cambiarPassword.passwordNueva !== cambiarPassword.passwordNueva2) {
      setCambiarPasswordMsg('Las dos contraseñas nuevas no coinciden');
      return;
    }
    try {
      await api.post('/usuarios/cambiar-password', {
        passwordActual: cambiarPassword.passwordActual,
        passwordNueva: cambiarPassword.passwordNueva,
      });
      setCambiarPassword(CAMBIAR_PASSWORD_VACIO);
      setCambiarPasswordMsg('Contraseña actualizada.');
    } catch (err) {
      setCambiarPasswordMsg(err.message);
    }
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
        precioVentaEstandar: Number(row.precioVentaEstandar),
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

  async function eliminarSueldo(nombre) {
    if (!confirm(`¿Eliminar a "${nombre}" de los sueldos?`)) return;
    try {
      await api.del(`/config/sueldos/${encodeURIComponent(nombre)}`);
      setSueldos((prev) => prev.filter((s) => s.nombre !== nombre));
    } catch (err) {
      setError(err.message);
    }
  }

  async function agregarSueldo() {
    if (!nuevoSueldo.nombre.trim()) return;
    try {
      const creado = await api.post('/config/sueldos', {
        nombre: nuevoSueldo.nombre.trim(),
        monto: Number(nuevoSueldo.monto),
        fechaInicio: nuevoSueldo.fechaInicio || new Date().toISOString().slice(0, 10),
      });
      setSueldos((prev) => [...prev, creado]);
      setNuevoSueldo(SUELDO_VACIO);
    } catch (err) {
      setError(err.message);
    }
  }

  function updateCostoFijoField(nombre, field, value) {
    setCostosFijos((prev) => prev.map((c) => (c.nombre === nombre ? { ...c, [field]: value } : c)));
  }

  async function saveCostoFijo(nombre) {
    const row = costosFijos.find((c) => c.nombre === nombre);
    try {
      await api.put(`/config/costos-fijos/${encodeURIComponent(nombre)}`, {
        monto: Number(row.monto),
        fechaInicio: row.fechaInicio,
      });
      setSavedKey(`costofijo-${nombre}`);
      setTimeout(() => setSavedKey(''), 1500);
    } catch (err) {
      setError(err.message);
    }
  }

  async function eliminarCostoFijo(nombre) {
    if (!confirm(`¿Eliminar el costo fijo "${nombre}"?`)) return;
    try {
      await api.del(`/config/costos-fijos/${encodeURIComponent(nombre)}`);
      setCostosFijos((prev) => prev.filter((c) => c.nombre !== nombre));
    } catch (err) {
      setError(err.message);
    }
  }

  async function agregarCostoFijo() {
    if (!nuevoCostoFijo.nombre.trim()) return;
    try {
      const creado = await api.post('/config/costos-fijos', {
        nombre: nuevoCostoFijo.nombre.trim(),
        monto: Number(nuevoCostoFijo.monto),
        fechaInicio: nuevoCostoFijo.fechaInicio || new Date().toISOString().slice(0, 10),
      });
      setCostosFijos((prev) => [...prev, creado]);
      setNuevoCostoFijo(COSTO_FIJO_VACIO);
    } catch (err) {
      setError(err.message);
    }
  }

  async function guardarFinanciero() {
    try {
      const data = await api.put('/config/financiero', {
        cajaInicial: Number(financiero.cajaInicial),
        sueldoSocias: Number(financiero.sueldoSocias),
      });
      setFinanciero(data);
      setSavedKey('financiero');
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
              <th className="px-5 py-3 font-medium whitespace-nowrap">Precio de venta estándar (CLP)</th>
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
                <td className="px-5 py-3">
                  <input
                    type="number"
                    min="0"
                    value={t.precioVentaEstandar}
                    onChange={(e) => updateTipoField(t.tipo, 'precioVentaEstandar', e.target.value)}
                    className="w-40 px-3 py-1.5 text-sm rounded-lg border border-black/10 focus:outline-none focus:ring-2 focus:ring-[#C9A96E]"
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
                <td className="px-5 py-3">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => saveSueldo(s.nombre)}
                      className="px-3 py-1.5 text-xs rounded-lg text-white hover:opacity-90"
                      style={{ backgroundColor: '#1A1A2E' }}
                    >
                      Guardar
                    </button>
                    <SavedBadge show={savedKey === `sueldo-${s.nombre}`} />
                    <button
                      onClick={() => eliminarSueldo(s.nombre)}
                      className="ml-auto text-[#A85C52]/70 hover:text-[#A85C52]"
                      title="Eliminar"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            <tr>
              <td className="px-5 py-3">
                <input
                  value={nuevoSueldo.nombre}
                  onChange={(e) => setNuevoSueldo((f) => ({ ...f, nombre: e.target.value }))}
                  placeholder="Nombre de la modista"
                  className="w-full px-3 py-1.5 text-sm rounded-lg border border-black/10 focus:outline-none focus:ring-2 focus:ring-[#C9A96E]"
                />
              </td>
              <td className="px-5 py-3">
                <input
                  type="number"
                  min="0"
                  value={nuevoSueldo.monto}
                  onChange={(e) => setNuevoSueldo((f) => ({ ...f, monto: e.target.value }))}
                  className="w-40 px-3 py-1.5 text-sm rounded-lg border border-black/10 focus:outline-none focus:ring-2 focus:ring-[#C9A96E]"
                />
              </td>
              <td className="px-5 py-3">
                <input
                  type="date"
                  value={nuevoSueldo.fechaInicio}
                  onChange={(e) => setNuevoSueldo((f) => ({ ...f, fechaInicio: e.target.value }))}
                  className="px-3 py-1.5 text-sm rounded-lg border border-black/10 focus:outline-none focus:ring-2 focus:ring-[#C9A96E]"
                />
              </td>
              <td className="px-5 py-3">
                <button
                  onClick={agregarSueldo}
                  className="flex items-center gap-1.5 text-xs font-medium text-[#C9A96E] hover:opacity-70"
                >
                  <Plus size={14} />
                  Agregar
                </button>
              </td>
            </tr>
          </tbody>
        </table>
        </div>
      </div>

      <p className="text-xs text-[#2C2420]/40 mt-4 mb-8 leading-relaxed max-w-2xl">
        La mano de obra estimada mostrada en la ficha de costo de cada vestido se calcula como la
        suma de sueldos vigentes hoy dividida entre la cantidad de vestidos activos (No entregado +
        entregados este mes). El costo estándar por tipo se usa como valor provisional cuando un
        vestido todavía no tiene insumos registrados.
      </p>

      <p className="text-xs font-semibold uppercase tracking-wide text-[#2C2420]/40 mb-3">
        Costos fijos mensuales
      </p>
      <div className="bg-white rounded-xl border border-black/5 overflow-hidden mb-3">
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
              {costosFijos.map((c) => (
                <tr key={c.nombre} className="border-b border-black/5 last:border-0">
                  <td className="px-5 py-3 font-medium">{c.nombre}</td>
                  <td className="px-5 py-3">
                    <input
                      type="number"
                      min="0"
                      value={c.monto}
                      onChange={(e) => updateCostoFijoField(c.nombre, 'monto', e.target.value)}
                      className="w-40 px-3 py-1.5 text-sm rounded-lg border border-black/10 focus:outline-none focus:ring-2 focus:ring-[#C9A96E]"
                    />
                  </td>
                  <td className="px-5 py-3">
                    <input
                      type="date"
                      value={toInputDate(c.fechaInicio)}
                      onChange={(e) => updateCostoFijoField(c.nombre, 'fechaInicio', e.target.value)}
                      className="px-3 py-1.5 text-sm rounded-lg border border-black/10 focus:outline-none focus:ring-2 focus:ring-[#C9A96E]"
                    />
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => saveCostoFijo(c.nombre)}
                        className="px-3 py-1.5 text-xs rounded-lg text-white hover:opacity-90"
                        style={{ backgroundColor: '#1A1A2E' }}
                      >
                        Guardar
                      </button>
                      <SavedBadge show={savedKey === `costofijo-${c.nombre}`} />
                      <button
                        onClick={() => eliminarCostoFijo(c.nombre)}
                        className="ml-auto text-[#A85C52]/70 hover:text-[#A85C52]"
                        title="Eliminar"
                      >
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              <tr>
                <td className="px-5 py-3">
                  <input
                    value={nuevoCostoFijo.nombre}
                    onChange={(e) => setNuevoCostoFijo((f) => ({ ...f, nombre: e.target.value }))}
                    placeholder="Nuevo costo fijo"
                    className="w-full px-3 py-1.5 text-sm rounded-lg border border-black/10 focus:outline-none focus:ring-2 focus:ring-[#C9A96E]"
                  />
                </td>
                <td className="px-5 py-3">
                  <input
                    type="number"
                    min="0"
                    value={nuevoCostoFijo.monto}
                    onChange={(e) => setNuevoCostoFijo((f) => ({ ...f, monto: e.target.value }))}
                    className="w-40 px-3 py-1.5 text-sm rounded-lg border border-black/10 focus:outline-none focus:ring-2 focus:ring-[#C9A96E]"
                  />
                </td>
                <td className="px-5 py-3">
                  <input
                    type="date"
                    value={nuevoCostoFijo.fechaInicio}
                    onChange={(e) => setNuevoCostoFijo((f) => ({ ...f, fechaInicio: e.target.value }))}
                    className="px-3 py-1.5 text-sm rounded-lg border border-black/10 focus:outline-none focus:ring-2 focus:ring-[#C9A96E]"
                  />
                </td>
                <td className="px-5 py-3">
                  <button
                    onClick={agregarCostoFijo}
                    className="flex items-center gap-1.5 text-xs font-medium text-[#C9A96E] hover:opacity-70"
                  >
                    <Plus size={14} />
                    Agregar
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <p className="text-xs font-semibold uppercase tracking-wide text-[#2C2420]/40 mb-3 mt-8">
        Supuestos financieros del Dashboard
      </p>
      {financiero && (
        <div className="bg-white rounded-xl border border-black/5 p-6 flex items-end gap-6">
          <div>
            <label className="block text-xs font-medium text-[#2C2420]/60 mb-1.5">Caja inicial (CLP)</label>
            <input
              type="number"
              min="0"
              value={financiero.cajaInicial}
              onChange={(e) => setFinanciero((f) => ({ ...f, cajaInicial: e.target.value }))}
              className="w-48 px-3 py-2 text-sm rounded-lg border border-black/10 focus:outline-none focus:ring-2 focus:ring-[#C9A96E]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#2C2420]/60 mb-1.5">
              Meta de sueldo socias mensual (CLP)
            </label>
            <input
              type="number"
              min="0"
              value={financiero.sueldoSocias}
              onChange={(e) => setFinanciero((f) => ({ ...f, sueldoSocias: e.target.value }))}
              className="w-56 px-3 py-2 text-sm rounded-lg border border-black/10 focus:outline-none focus:ring-2 focus:ring-[#C9A96E]"
            />
          </div>
          <button
            onClick={guardarFinanciero}
            className="px-4 py-2 text-sm rounded-lg text-white hover:opacity-90"
            style={{ backgroundColor: '#1A1A2E' }}
          >
            Guardar
          </button>
          <SavedBadge show={savedKey === 'financiero'} />
        </div>
      )}

      <p className="text-xs font-semibold uppercase tracking-wide text-[#2C2420]/40 mb-3 mt-8">
        Usuarios
      </p>

      {passwordTemporal && (
        <div className="bg-[#FAF6EF] border border-[#C9A96E]/30 rounded-xl p-4 mb-4 text-sm">
          <p className="font-medium text-[#2C2420] mb-1">
            Contraseña temporal para {passwordTemporal.email}
          </p>
          <p className="text-[#2C2420]/80">
            <code className="bg-white px-2 py-1 rounded border border-black/10">
              {passwordTemporal.password}
            </code>
          </p>
          <p className="text-xs text-[#2C2420]/50 mt-2">
            Cópiala y envíasela por otro medio (WhatsApp, etc.) — no queda guardada en ningún
            lado, así que si la pierdes tendrás que restablecerla de nuevo. Puede cambiarla
            después desde "Cambiar mi contraseña", abajo.
          </p>
          <button
            onClick={() => setPasswordTemporal(null)}
            className="text-xs text-[#C9A96E] hover:underline mt-2"
          >
            Entendido, ocultar
          </button>
        </div>
      )}

      <div className="bg-white rounded-xl border border-black/5 overflow-hidden mb-3">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-[#2C2420]/50 uppercase tracking-wide border-b border-black/5">
                <th className="px-5 py-3 font-medium whitespace-nowrap">Nombre</th>
                <th className="px-5 py-3 font-medium whitespace-nowrap">Correo</th>
                <th className="px-5 py-3 font-medium whitespace-nowrap">Estado</th>
                <th className="px-5 py-3 font-medium"></th>
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u) => (
                <tr key={u.id} className="border-b border-black/5 last:border-0">
                  <td className="px-5 py-3 font-medium">
                    {u.nombre} {u.id === usuarioActual?.id && <span className="text-[#C9A96E]">(tú)</span>}
                  </td>
                  <td className="px-5 py-3 text-[#2C2420]/70">{u.email}</td>
                  <td className="px-5 py-3">
                    <span
                      className="inline-flex px-2.5 py-1 rounded-full text-xs font-medium"
                      style={
                        u.activo
                          ? { backgroundColor: '#E8F0E9', color: '#5C8C6A' }
                          : { backgroundColor: '#F3E8E6', color: '#A85C52' }
                      }
                    >
                      {u.activo ? 'Activo' : 'Desactivado'}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => resetearPasswordUsuario(u)}
                        className="flex items-center gap-1.5 text-xs font-medium text-[#2C2420]/70 hover:text-[#2C2420]"
                        title="Restablecer contraseña"
                      >
                        <KeyRound size={13} />
                        Restablecer contraseña
                      </button>
                      {u.id !== usuarioActual?.id && (
                        <button
                          onClick={() => toggleActivoUsuario(u)}
                          className="ml-auto text-xs font-medium text-[#A85C52]/80 hover:text-[#A85C52]"
                        >
                          {u.activo ? 'Desactivar' : 'Reactivar'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              <tr>
                <td className="px-5 py-3">
                  <input
                    value={nuevoUsuario.nombre}
                    onChange={(e) => setNuevoUsuario((f) => ({ ...f, nombre: e.target.value }))}
                    placeholder="Nombre"
                    className="w-full px-3 py-1.5 text-sm rounded-lg border border-black/10 focus:outline-none focus:ring-2 focus:ring-[#C9A96E]"
                  />
                </td>
                <td className="px-5 py-3">
                  <input
                    type="email"
                    value={nuevoUsuario.email}
                    onChange={(e) => setNuevoUsuario((f) => ({ ...f, email: e.target.value }))}
                    placeholder="correo@hattonschultz.com"
                    className="w-full px-3 py-1.5 text-sm rounded-lg border border-black/10 focus:outline-none focus:ring-2 focus:ring-[#C9A96E]"
                  />
                </td>
                <td className="px-5 py-3" colSpan={2}>
                  <button
                    onClick={crearUsuario}
                    className="flex items-center gap-1.5 text-xs font-medium text-[#C9A96E] hover:opacity-70"
                  >
                    <UserPlus size={14} />
                    Crear cuenta
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <p className="text-xs text-[#2C2420]/40 mb-8 leading-relaxed max-w-2xl">
        Al crear una cuenta se genera una contraseña temporal que debes copiar y enviarle a esa
        persona por otro medio; ella puede cambiarla después desde su propia sesión.
      </p>

      <p className="text-xs font-semibold uppercase tracking-wide text-[#2C2420]/40 mb-3">
        Cambiar mi contraseña
      </p>
      <div className="bg-white rounded-xl border border-black/5 p-6 flex flex-wrap items-end gap-4 max-w-2xl">
        <div>
          <label className="block text-xs font-medium text-[#2C2420]/60 mb-1.5">Contraseña actual</label>
          <input
            type="password"
            value={cambiarPassword.passwordActual}
            onChange={(e) => setCambiarPassword((f) => ({ ...f, passwordActual: e.target.value }))}
            className="w-44 px-3 py-2 text-sm rounded-lg border border-black/10 focus:outline-none focus:ring-2 focus:ring-[#C9A96E]"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-[#2C2420]/60 mb-1.5">Contraseña nueva</label>
          <input
            type="password"
            value={cambiarPassword.passwordNueva}
            onChange={(e) => setCambiarPassword((f) => ({ ...f, passwordNueva: e.target.value }))}
            className="w-44 px-3 py-2 text-sm rounded-lg border border-black/10 focus:outline-none focus:ring-2 focus:ring-[#C9A96E]"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-[#2C2420]/60 mb-1.5">Repite la nueva</label>
          <input
            type="password"
            value={cambiarPassword.passwordNueva2}
            onChange={(e) => setCambiarPassword((f) => ({ ...f, passwordNueva2: e.target.value }))}
            className="w-44 px-3 py-2 text-sm rounded-lg border border-black/10 focus:outline-none focus:ring-2 focus:ring-[#C9A96E]"
          />
        </div>
        <button
          onClick={handleCambiarPassword}
          className="px-4 py-2 text-sm rounded-lg text-white hover:opacity-90"
          style={{ backgroundColor: '#1A1A2E' }}
        >
          Cambiar
        </button>
        {cambiarPasswordMsg && (
          <p
            className="text-xs w-full"
            style={{ color: cambiarPasswordMsg === 'Contraseña actualizada.' ? '#5C8C6A' : '#A85C52' }}
          >
            {cambiarPasswordMsg}
          </p>
        )}
      </div>
    </Layout>
  );
}
