import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Trash2 } from 'lucide-react';
import Layout from '../components/Layout.jsx';
import InfoAuditoria from '../components/InfoAuditoria.jsx';
import { api } from '../lib/api.js';
import { toInputDate, CATEGORIA_GASTO_GENERAL_LABELS } from '../lib/format.js';

const VACIO = {
  fecha: toInputDate(new Date()),
  categoria: 'CAFETERIA_Y_ASEO',
  descripcion: '',
  montoTotal: '',
};

function formatTamano(bytes) {
  if (!bytes) return '';
  const kb = bytes / 1024;
  return kb < 1024 ? `${Math.round(kb)} KB` : `${(kb / 1024).toFixed(1)} MB`;
}

export default function GastoGeneralForm() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();

  const [form, setForm] = useState(VACIO);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [auditoria, setAuditoria] = useState(null);
  const [comprobante, setComprobante] = useState(null);
  const [archivoNuevo, setArchivoNuevo] = useState(null);
  const [subiendoArchivo, setSubiendoArchivo] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!isEdit) return;
    api
      .get(`/gastos-generales/${id}`)
      .then((g) => {
        setForm({
          fecha: toInputDate(g.fecha),
          categoria: g.categoria,
          descripcion: g.descripcion,
          montoTotal: g.montoTotal,
        });
        setAuditoria({ creadoPor: g.creadoPor?.nombre, actualizadoPor: g.actualizadoPor?.nombre });
        setComprobante(
          g.comprobanteNombre ? { nombre: g.comprobanteNombre, tamano: g.comprobanteTamano } : null
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
    setSaving(true);
    setError('');
    try {
      const payload = { ...form, montoTotal: Number(form.montoTotal) };
      let gastoId = id;
      if (isEdit) {
        await api.put(`/gastos-generales/${id}`, payload);
      } else {
        const creado = await api.post('/gastos-generales', payload);
        gastoId = creado.id;
      }
      if (archivoNuevo) {
        const fd = new FormData();
        fd.append('archivo', archivoNuevo);
        await api.post(`/gastos-generales/${gastoId}/comprobante`, fd);
      }
      navigate('/costos/gastos-generales');
    } catch (err) {
      setError(err.message || 'No se pudo guardar el gasto');
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
      const actualizado = await api.post(`/gastos-generales/${id}/comprobante`, fd);
      setComprobante({ nombre: actualizado.comprobanteNombre, tamano: actualizado.comprobanteTamano });
    } catch (err) {
      setError(err.message || 'No se pudo subir el comprobante');
    } finally {
      setSubiendoArchivo(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  async function handleQuitarComprobante() {
    if (!confirm('¿Quitar el comprobante de este gasto?')) return;
    try {
      await api.del(`/gastos-generales/${id}/comprobante`);
      setComprobante(null);
    } catch (err) {
      setError(err.message || 'No se pudo quitar el comprobante');
    }
  }

  async function handleDelete() {
    if (!confirm('¿Eliminar este gasto?')) return;
    try {
      await api.del(`/gastos-generales/${id}`);
      navigate('/costos/gastos-generales');
    } catch (err) {
      setError(err.message || 'No se pudo eliminar el gasto');
    }
  }

  if (loading) {
    return (
      <Layout title={isEdit ? 'Editar gasto' : 'Nuevo gasto'}>
        <p className="text-sm text-[#2C2420]/40">Cargando…</p>
      </Layout>
    );
  }

  return (
    <Layout
      title={isEdit ? 'Editar gasto general' : 'Nuevo gasto general'}
      subtitle="Café, estacionamiento, mobiliario y otros gastos que no son insumos de vestidos"
      backTo="/costos/gastos-generales"
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
            <label className="block text-xs font-medium text-[#2C2420]/60 mb-1.5">Fecha del gasto</label>
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
              {Object.entries(CATEGORIA_GASTO_GENERAL_LABELS).map(([k, l]) => (
                <option key={k} value={k}>
                  {l}
                </option>
              ))}
            </select>
          </div>
          <div className="col-span-2">
            <label className="block text-xs font-medium text-[#2C2420]/60 mb-1.5">Descripción</label>
            <input
              required
              value={form.descripcion}
              onChange={(e) => set('descripcion', e.target.value)}
              placeholder="ej: Café y snacks de la semana, estacionamiento reunión con proveedor…"
              className="w-full px-3 py-2 text-sm rounded-lg border border-black/10 focus:outline-none focus:ring-2 focus:ring-[#C9A96E]"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#2C2420]/60 mb-1.5">
              Monto (CLP)
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
                  href={`/api/gastos-generales/${id}/comprobante`}
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

        {error && <p className="text-sm text-[#A85C52]">{error}</p>}

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={() => navigate('/costos/gastos-generales')}
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
            {saving ? 'Guardando…' : 'Guardar gasto'}
          </button>
        </div>
      </form>
    </Layout>
  );
}
