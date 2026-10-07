import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import Layout from '../components/Layout.jsx';
import VentaSearchSelect from '../components/VentaSearchSelect.jsx';
import VentasMultiSelect from '../components/VentasMultiSelect.jsx';
import InfoAuditoria from '../components/InfoAuditoria.jsx';
import { api } from '../lib/api.js';
import { formatCLP, toInputDate, CATEGORIA_LABELS, TIPO_ASIGNACION_LABELS } from '../lib/format.js';

const VACIO = {
  fecha: toInputDate(new Date()),
  categoria: 'TELA',
  proveedor: '',
  descripcion: '',
  montoTotal: '',
  tipoAsignacion: 'DIRECTO',
  ventaId: '',
  ventaIds: [],
};

function formatTamano(bytes) {
  if (!bytes) return '';
  const kb = bytes / 1024;
  return kb < 1024 ? `${Math.round(kb)} KB` : `${(kb / 1024).toFixed(1)} MB`;
}

const TIPO_ASIGNACION_DESC = {
  DIRECTO: 'El 100% del costo va a una venta específica.',
  PRORRATEO: 'El monto se divide en partes iguales entre los vestidos que elijas: uno, varios o todos.',
};

export default function CompraForm() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();

  const [form, setForm] = useState(VACIO);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [asignacionesGuardadas, setAsignacionesGuardadas] = useState(null);
  const [auditoria, setAuditoria] = useState(null);
  const [comprobante, setComprobante] = useState(null);
  const [archivoNuevo, setArchivoNuevo] = useState(null);
  const [subiendoArchivo, setSubiendoArchivo] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!isEdit) return;
    api
      .get(`/purchases/${id}`)
      .then((c) => {
        setForm({
          fecha: toInputDate(c.fecha),
          categoria: c.categoria,
          proveedor: c.proveedor || '',
          descripcion: c.descripcion,
          montoTotal: c.montoTotal,
          tipoAsignacion: c.tipoAsignacion,
          ventaId: c.asignaciones[0]?.ventaId || '',
          ventaIds: c.asignaciones.map((a) => a.ventaId),
        });
        setAsignacionesGuardadas(c.asignaciones);
        setAuditoria({ creadoPor: c.creadoPor?.nombre, actualizadoPor: c.actualizadoPor?.nombre });
        setComprobante(
          c.comprobanteNombre ? { nombre: c.comprobanteNombre, tamano: c.comprobanteTamano } : null
        );
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (form.tipoAsignacion === 'PRORRATEO' && form.ventaIds.length === 0) {
      setError('Selecciona al menos un vestido para prorratear el costo.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      const payload = { ...form, montoTotal: Number(form.montoTotal) };
      let compraId = id;
      if (isEdit) {
        await api.put(`/purchases/${id}`, payload);
      } else {
        const creada = await api.post('/purchases', payload);
        compraId = creada.id;
      }
      if (archivoNuevo) {
        const fd = new FormData();
        fd.append('archivo', archivoNuevo);
        await api.post(`/purchases/${compraId}/comprobante`, fd);
      }
      navigate('/costos/insumos');
    } catch (err) {
      setError(err.message || 'No se pudo guardar la compra');
    } finally {
      setSaving(false);
    }
  }

  async function handleArchivoChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!isEdit) {
      setArchivoNuevo(file);
      return;
    }
    setSubiendoArchivo(true);
    setError('');
    try {
      const fd = new FormData();
      fd.append('archivo', file);
      const actualizado = await api.post(`/purchases/${id}/comprobante`, fd);
      setComprobante({ nombre: actualizado.comprobanteNombre, tamano: actualizado.comprobanteTamano });
    } catch (err) {
      setError(err.message || 'No se pudo subir el comprobante');
    } finally {
      setSubiendoArchivo(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function handleQuitarComprobante() {
    if (!confirm('¿Quitar el comprobante de esta compra?')) return;
    try {
      await api.del(`/purchases/${id}/comprobante`);
      setComprobante(null);
    } catch (err) {
      setError(err.message || 'No se pudo quitar el comprobante');
    }
  }

  async function handleDelete() {
    if (!confirm('¿Eliminar este registro de compra?')) return;
    try {
      await api.del(`/purchases/${id}`);
      navigate('/costos/insumos');
    } catch (err) {
      setError(err.message || 'No se pudo eliminar la compra');
    }
  }

  if (loading) {
    return (
      <Layout title={isEdit ? 'Editar compra' : 'Nueva compra'}>
        <p className="text-sm text-[#2C2420]/40">Cargando…</p>
      </Layout>
    );
  }

  return (
    <Layout
      title={isEdit ? 'Editar compra de insumos' : 'Nueva compra de insumos'}
      subtitle="Registra la compra y cómo se asigna su costo a los vestidos"
      backTo="/costos/insumos"
      actions={
        isEdit && (
          <button
            onClick={handleDelete}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-[#A85C52] border border-[#A85C52]/30 hover:bg-[#A85C52]/5"
          >
            <Trash2 size={15} />
            Eliminar
          </button>
        )
      }
    >
      <InfoAuditoria auditoria={auditoria} />

      <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
        <div className="bg-white rounded-xl border border-black/5 p-6 grid grid-cols-2 gap-5">
          <div>
            <label className="block text-xs font-medium text-[#2C2420]/60 mb-1.5">Fecha de compra</label>
            <input
              required
              type="date"
              value={form.fecha}
              onChange={(e) => set('fecha', e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-black/10 focus:outline-none focus:ring-2 focus:ring-[#C9A96E]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#2C2420]/60 mb-1.5">Categoría</label>
            <select
              value={form.categoria}
              onChange={(e) => set('categoria', e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-black/10 focus:outline-none focus:ring-2 focus:ring-[#C9A96E]"
            >
              {Object.entries(CATEGORIA_LABELS).map(([k, l]) => (
                <option key={k} value={k}>
                  {l}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-[#2C2420]/60 mb-1.5">Proveedor</label>
            <input
              value={form.proveedor}
              onChange={(e) => set('proveedor', e.target.value)}
              placeholder="ej: Telas Hermanos Soto"
              className="w-full px-3 py-2 text-sm rounded-lg border border-black/10 focus:outline-none focus:ring-2 focus:ring-[#C9A96E]"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-medium text-[#2C2420]/60 mb-1.5">Descripción</label>
            <input
              required
              value={form.descripcion}
              onChange={(e) => set('descripcion', e.target.value)}
              placeholder="ej: Tul bordado premium, encaje francés…"
              className="w-full px-3 py-2 text-sm rounded-lg border border-black/10 focus:outline-none focus:ring-2 focus:ring-[#C9A96E]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#2C2420]/60 mb-1.5">
              Monto total de la compra (CLP)
            </label>
            <input
              required
              type="number"
              min="0"
              value={form.montoTotal}
              onChange={(e) => set('montoTotal', e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-black/10 focus:outline-none focus:ring-2 focus:ring-[#C9A96E]"
            />
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-medium text-[#2C2420]/60 mb-1.5">
              Comprobante (boleta/factura)
            </label>
            {isEdit && comprobante ? (
              <div className="flex items-center flex-wrap gap-3 text-sm">
                <a
                  href={`/api/purchases/${id}/comprobante`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#C9A96E] hover:underline"
                >
                  Ver archivo
                </a>
                <span className="text-[#2C2420]/40 text-xs">
                  {comprobante.nombre}
                  {comprobante.tamano ? ` · ${formatTamano(comprobante.tamano)}` : ''}
                </span>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs text-[#2C2420]/60 hover:underline"
                >
                  Reemplazar
                </button>
                <button
                  type="button"
                  onClick={handleQuitarComprobante}
                  className="text-xs text-[#A85C52] hover:underline"
                >
                  Quitar
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.pdf"
                  onChange={handleArchivoChange}
                  className="hidden"
                />
              </div>
            ) : (
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*,.pdf"
                onChange={handleArchivoChange}
                className="w-full text-sm"
              />
            )}
            {subiendoArchivo && <p className="text-xs text-[#2C2420]/40 mt-1">Subiendo…</p>}
            {!isEdit && archivoNuevo && (
              <p className="text-xs text-[#2C2420]/40 mt-1">Se subirá al guardar: {archivoNuevo.name}</p>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-black/5 p-6">
          <p className="text-sm font-medium text-[#2C2420] mb-3">Tipo de asignación</p>
          <div className="grid grid-cols-2 gap-3 mb-5">
            {Object.entries(TIPO_ASIGNACION_LABELS).map(([key, label]) => (
              <button
                type="button"
                key={key}
                onClick={() => set('tipoAsignacion', key)}
                className={`text-left px-4 py-3 rounded-lg border text-sm transition-colors ${
                  form.tipoAsignacion === key
                    ? 'border-[#C9A96E] bg-[#FAF6EF]'
                    : 'border-black/10 hover:border-black/20'
                }`}
              >
                <p className="font-medium text-[#2C2420] mb-1">{label}</p>
                <p className="text-xs text-[#2C2420]/60">{TIPO_ASIGNACION_DESC[key]}</p>
              </button>
            ))}
          </div>

          {form.tipoAsignacion === 'DIRECTO' && (
            <div>
              <label className="block text-xs font-medium text-[#2C2420]/60 mb-1.5">
                Venta a la que se asigna el 100% del costo
              </label>
              <VentaSearchSelect
                value={asignacionesGuardadas?.[0]?.venta}
                onChange={(ventaId) => set('ventaId', ventaId)}
              />
            </div>
          )}

          {form.tipoAsignacion === 'PRORRATEO' && (
            <div>
              <label className="block text-xs font-medium text-[#2C2420]/60 mb-1.5">
                Vestidos entre los que se prorratea el costo
              </label>
              <VentasMultiSelect
                value={form.ventaIds}
                onChange={(ventaIds) => set('ventaIds', ventaIds)}
              />
              {form.montoTotal > 0 && form.ventaIds.length > 0 && (
                <p className="text-xs text-[#2C2420]/70 mt-2">
                  Monto por vestido:{' '}
                  <strong>{formatCLP(form.montoTotal / form.ventaIds.length)}</strong>. Esta
                  asignación queda fija: no se recalcula si eliges otros vestidos más adelante.
                </p>
              )}
            </div>
          )}
        </div>

        {error && <p className="text-sm text-[#A85C52]">{error}</p>}

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/costos/insumos')}
            className="px-5 py-2.5 text-sm rounded-lg text-[#2C2420]/70 hover:bg-black/5"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2.5 text-sm rounded-lg text-white disabled:opacity-60"
            style={{ backgroundColor: '#1A1A2E' }}
          >
            {saving ? 'Guardando…' : 'Guardar compra'}
          </button>
        </div>
      </form>
    </Layout>
  );
}
