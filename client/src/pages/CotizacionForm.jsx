import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Trash2, Send, CheckCircle2, XCircle, FileDown } from 'lucide-react';
import Layout from '../components/Layout.jsx';
import CotizacionItemsEditor from '../components/CotizacionItemsEditor.jsx';
import { api } from '../lib/api.js';
import { formatFecha, toInputDate, TIPO_LABELS, COTIZACION_ESTADO_LABELS, COTIZACION_ESTADO_COLORS } from '../lib/format.js';

const VACIO = {
  nombreClienta: '',
  emailClienta: '',
  telefonoClienta: '',
  tipo: 'NOVIA',
  fechaEventoTentativa: '',
  validezDias: 15,
  notas: '',
};

function EstadoBadge({ estado }) {
  const c = COTIZACION_ESTADO_COLORS[estado] || {};
  return (
    <span
      className="inline-flex px-3 py-1 rounded-full text-xs font-medium"
      style={{ backgroundColor: c.bg, color: c.text }}
    >
      {COTIZACION_ESTADO_LABELS[estado]}
    </span>
  );
}

export default function CotizacionForm() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();

  const [form, setForm] = useState(VACIO);
  const [items, setItems] = useState([]);
  const [cotizacion, setCotizacion] = useState(null);
  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [actionLoading, setActionLoading] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  useEffect(() => {
    if (!isEdit) return;
    api
      .get(`/cotizaciones/${id}`)
      .then((c) => {
        setCotizacion(c);
        setForm({
          nombreClienta: c.nombreClienta,
          emailClienta: c.emailClienta,
          telefonoClienta: c.telefonoClienta || '',
          tipo: c.tipo,
          fechaEventoTentativa: toInputDate(c.fechaEventoTentativa),
          validezDias: c.validezDias,
          notas: c.notas || '',
        });
        setItems(c.items.map((it) => ({ id: it.id, orden: it.orden, descripcion: it.descripcion, cantidad: it.cantidad, monto: it.monto })));
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [id, isEdit]);

  const bloqueada = cotizacion && (cotizacion.estado === 'ACEPTADA' || cotizacion.estado === 'RECHAZADA');

  function handleChange(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError('');
    setInfo('');
    try {
      const payload = { ...form, validezDias: Number(form.validezDias), items };
      if (isEdit) {
        const actualizada = await api.put(`/cotizaciones/${id}`, payload);
        setCotizacion(actualizada);
        setItems(actualizada.items.map((it) => ({ id: it.id, orden: it.orden, descripcion: it.descripcion, cantidad: it.cantidad, monto: it.monto })));
        setInfo('Cambios guardados.');
      } else {
        const creada = await api.post('/cotizaciones', payload);
        navigate(`/cotizaciones/${creada.id}`);
      }
    } catch (err) {
      setError(err.message || 'No se pudo guardar la cotización');
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm('¿Eliminar esta cotización? Esta acción no se puede deshacer.')) return;
    try {
      await api.del(`/cotizaciones/${id}`);
      navigate('/cotizaciones');
    } catch (err) {
      setError(err.message || 'No se pudo eliminar la cotización');
    }
  }

  async function handleEnviar() {
    setActionLoading('enviar');
    setError('');
    setInfo('');
    try {
      const actualizada = await api.post(`/cotizaciones/${id}/enviar`);
      setCotizacion(actualizada);
      setInfo(`Cotización enviada a ${actualizada.emailClienta}.`);
    } catch (err) {
      setError(err.message || 'No se pudo enviar la cotización');
    } finally {
      setActionLoading('');
    }
  }

  async function handleAceptar() {
    if (!confirm('¿Marcar como Aceptada? Esto creará automáticamente la Venta correspondiente.')) return;
    setActionLoading('aceptar');
    setError('');
    setInfo('');
    try {
      const { venta } = await api.post(`/cotizaciones/${id}/aceptar`);
      navigate(`/ventas/${venta.id}`);
    } catch (err) {
      setError(err.message || 'No se pudo aceptar la cotización');
      setActionLoading('');
    }
  }

  async function handleRechazar() {
    if (!confirm('¿Marcar esta cotización como Rechazada?')) return;
    setActionLoading('rechazar');
    setError('');
    setInfo('');
    try {
      const actualizada = await api.post(`/cotizaciones/${id}/rechazar`);
      setCotizacion(actualizada);
      setInfo('Cotización marcada como rechazada.');
    } catch (err) {
      setError(err.message || 'No se pudo rechazar la cotización');
    } finally {
      setActionLoading('');
    }
  }

  if (loading) {
    return (
      <Layout title={isEdit ? 'Cotización' : 'Nueva cotización'}>
        <p className="text-sm text-[#2C2420]/40">Cargando…</p>
      </Layout>
    );
  }

  return (
    <Layout
      title={isEdit ? `Cotización N° ${id.slice(-8).toUpperCase()}` : 'Nueva cotización'}
      subtitle={isEdit ? form.nombreClienta : 'Prepara una cotización para una potencial clienta'}
      backTo="/cotizaciones"
      actions={
        isEdit && (
          <>
            {cotizacion && <EstadoBadge estado={cotizacion.estado} />}
            {!bloqueada && (
              <button
                onClick={handleDelete}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-[#A85C52] border border-[#A85C52]/30 hover:bg-[#A85C52]/5"
              >
                <Trash2 size={15} />
                Eliminar
              </button>
            )}
          </>
        )
      }
    >
      {isEdit && cotizacion && (
        <div className="bg-white rounded-xl border border-black/5 p-4 mb-6 flex flex-wrap items-center gap-3">
          <a
            href={`/api/cotizaciones/${id}/pdf`}
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border border-black/10 text-[#2C2420]/80 hover:bg-black/5"
          >
            <FileDown size={15} />
            Ver PDF
          </a>
          {!bloqueada && (
            <button
              onClick={handleEnviar}
              disabled={actionLoading === 'enviar'}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg border border-black/10 text-[#2C2420]/80 hover:bg-black/5 disabled:opacity-50"
            >
              <Send size={15} />
              {actionLoading === 'enviar' ? 'Enviando…' : cotizacion.estado === 'ENVIADA' ? 'Reenviar por correo' : 'Enviar por correo'}
            </button>
          )}
          {!bloqueada && (
            <button
              onClick={handleAceptar}
              disabled={actionLoading === 'aceptar'}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg text-white hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: '#5C8C6A' }}
            >
              <CheckCircle2 size={15} />
              {actionLoading === 'aceptar' ? 'Procesando…' : 'Marcar como Aceptada'}
            </button>
          )}
          {!bloqueada && (
            <button
              onClick={handleRechazar}
              disabled={actionLoading === 'rechazar'}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium rounded-lg text-[#A85C52] border border-[#A85C52]/30 hover:bg-[#A85C52]/5 disabled:opacity-50"
            >
              <XCircle size={15} />
              Marcar como Rechazada
            </button>
          )}
          {cotizacion.fechaEnvio && (
            <span className="text-xs text-[#2C2420]/50">Enviada el {formatFecha(cotizacion.fechaEnvio)}</span>
          )}
          {cotizacion.venta && (
            <span className="text-xs text-[#5C8C6A] ml-auto">
              Venta creada: <strong>{cotizacion.venta.codigo}</strong>
            </span>
          )}
        </div>
      )}

      {info && <p className="text-sm text-[#5C8C6A] mb-4">{info}</p>}
      {error && <p className="text-sm text-[#A85C52] mb-4">{error}</p>}

      <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
        <fieldset disabled={bloqueada} className="space-y-6 disabled:opacity-60">
          <div className="bg-white rounded-xl border border-black/5 p-6 grid grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-medium text-[#2C2420]/60 mb-1.5">Nombre clienta</label>
              <input
                required
                value={form.nombreClienta}
                onChange={(e) => handleChange('nombreClienta', e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-black/10 focus:outline-none focus:ring-2 focus:ring-[#C9A96E]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#2C2420]/60 mb-1.5">Correo de la clienta</label>
              <input
                required
                type="email"
                value={form.emailClienta}
                onChange={(e) => handleChange('emailClienta', e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-black/10 focus:outline-none focus:ring-2 focus:ring-[#C9A96E]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#2C2420]/60 mb-1.5">Teléfono (opcional)</label>
              <input
                value={form.telefonoClienta}
                onChange={(e) => handleChange('telefonoClienta', e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-black/10 focus:outline-none focus:ring-2 focus:ring-[#C9A96E]"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-[#2C2420]/60 mb-1.5">Tipo de vestido</label>
              <select
                value={form.tipo}
                onChange={(e) => handleChange('tipo', e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-black/10 focus:outline-none focus:ring-2 focus:ring-[#C9A96E]"
              >
                {Object.entries(TIPO_LABELS).map(([k, l]) => (
                  <option key={k} value={k}>
                    {l}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#2C2420]/60 mb-1.5">
                Fecha tentativa del evento
              </label>
              <input
                type="date"
                value={form.fechaEventoTentativa}
                onChange={(e) => handleChange('fechaEventoTentativa', e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-black/10 focus:outline-none focus:ring-2 focus:ring-[#C9A96E]"
              />
              <p className="text-[10px] text-[#2C2420]/40 mt-1">Necesaria para poder aceptar la cotización.</p>
            </div>
            <div>
              <label className="block text-xs font-medium text-[#2C2420]/60 mb-1.5">Validez (días)</label>
              <input
                required
                type="number"
                min="1"
                value={form.validezDias}
                onChange={(e) => handleChange('validezDias', e.target.value)}
                className="w-full px-3 py-2 text-sm rounded-lg border border-black/10 focus:outline-none focus:ring-2 focus:ring-[#C9A96E]"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-xs font-medium text-[#2C2420]/60 mb-1.5">Notas</label>
              <textarea
                value={form.notas}
                onChange={(e) => handleChange('notas', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 text-sm rounded-lg border border-black/10 focus:outline-none focus:ring-2 focus:ring-[#C9A96E]"
              />
            </div>
          </div>

          <div className="bg-white rounded-xl border border-black/5 p-6">
            <CotizacionItemsEditor items={items} onChange={setItems} />
          </div>
        </fieldset>

        {!bloqueada && (
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => navigate('/cotizaciones')}
              className="px-5 py-2.5 text-sm rounded-lg text-[#2C2420]/70 hover:bg-black/5"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving || items.length === 0}
              className="px-5 py-2.5 text-sm rounded-lg text-white hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: '#1A1A2E' }}
            >
              {saving ? 'Guardando…' : isEdit ? 'Guardar cambios' : 'Crear cotización'}
            </button>
          </div>
        )}
      </form>
    </Layout>
  );
}
