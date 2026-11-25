import { useEffect, useState } from 'react';
import { Mail, CheckCircle2, AlertCircle } from 'lucide-react';
import { api } from '../lib/api.js';
import { formatFecha } from '../lib/format.js';

// Configuración → Conexión con Google: cada diseñadora (María, Carolina)
// conecta una vez su casilla de Gmail para que las cotizaciones salgan desde ahí.
export default function CorreoCotizacionesConfig() {
  const [estado, setEstado] = useState(null);
  const [error, setError] = useState('');
  const [aviso, setAviso] = useState(null);

  async function cargar() {
    try {
      setEstado(await api.get('/gmail/estado'));
    } catch (err) {
      setError(err.message);
    }
  }

  useEffect(() => {
    // Resultado de la vuelta desde Google (?gmail=ok|error&mensaje=...).
    const params = new URLSearchParams(window.location.search);
    if (params.get('gmail')) {
      setAviso({ ok: params.get('gmail') === 'ok', mensaje: params.get('mensaje') || '' });
      window.history.replaceState(null, '', window.location.pathname + window.location.hash);
      document.getElementById('correo-cotizaciones')?.scrollIntoView({ behavior: 'smooth' });
    }
    cargar();
  }, []);

  async function desconectar(r) {
    if (!window.confirm(`¿Desconectar la casilla ${r.email}? Las cotizaciones de ${r.name} no se podrán enviar hasta volver a conectarla.`)) return;
    try {
      await api.del(`/gmail/${r.clave}`);
      setAviso({ ok: true, mensaje: `Casilla ${r.email} desconectada.` });
      cargar();
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <div id="correo-cotizaciones" className="mt-8">
      <p className="text-xs font-semibold uppercase tracking-wide text-[#2C2420]/40 mb-3">
        Conexión con Google (correo y calendario)
      </p>

      {aviso && (
        <div
          className={`flex items-start gap-2 rounded-xl p-4 mb-3 text-sm ${
            aviso.ok ? 'bg-[#EEF5F0] text-[#3F6B4C]' : 'bg-[#FBEFED] text-[#A85C52]'
          }`}
        >
          {aviso.ok ? <CheckCircle2 size={16} className="mt-0.5 shrink-0" /> : <AlertCircle size={16} className="mt-0.5 shrink-0" />}
          <span>{aviso.mensaje}</span>
        </div>
      )}
      {error && <p className="text-sm text-[#A85C52] mb-3">{error}</p>}

      <div className="bg-white rounded-xl border border-black/5 p-5">
        <p className="text-sm text-[#2C2420]/70 mb-4">
          Cada una conecta su cuenta de Google una sola vez. Con eso, las cotizaciones se envían desde su
          Gmail (y quedan en "Enviados"), y la página de agendamiento usa su <strong>calendario</strong> para
          mostrar solo horas libres y anotar ahí las citas. Google pide entrar con esa cuenta y aceptar
          permisos para <strong>enviar</strong> correos y <strong>ver horas ocupadas / crear citas</strong> (la
          app no puede leer sus correos).
        </p>

        {estado && !estado.configurado && (
          <p className="text-sm text-[#A85C52] mb-4">
            Falta terminar la configuración de Google en Render (GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET).
          </p>
        )}

        <div className="divide-y divide-black/5">
          {(estado?.remitentes || []).map((r) => {
            const conexion = estado.conexiones.find((c) => c.remitente === r.clave);
            return (
              <div key={r.clave} className="flex flex-wrap items-center justify-between gap-3 py-3">
                <div className="flex items-center gap-3">
                  <Mail size={18} className="text-[#C9A96E]" />
                  <div>
                    <p className="text-sm font-medium">{r.name}</p>
                    <p className="text-xs text-[#2C2420]/50">
                      {r.email} ·{' '}
                      {conexion ? (
                        <>
                          <span className="text-[#5C8C6A]">Conectada desde el {formatFecha(conexion.conectadoEn)}</span>
                          {conexion.calendario ? (
                            <span className="text-[#5C8C6A]"> · Calendario activo</span>
                          ) : (
                            <span className="text-[#A85C52]"> · Falta el calendario: aprieta "Volver a conectar"</span>
                          )}
                        </>
                      ) : (
                        <span className="text-[#A85C52]">No conectada</span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <a
                    href={`/api/gmail/conectar/${r.clave}`}
                    className={`px-3 py-1.5 text-xs rounded-lg text-white hover:opacity-90 ${
                      estado.configurado ? '' : 'pointer-events-none opacity-40'
                    }`}
                    style={{ backgroundColor: '#1A1A2E' }}
                  >
                    {conexion ? 'Volver a conectar' : 'Conectar con Gmail'}
                  </a>
                  {conexion && (
                    <button
                      onClick={() => desconectar(r)}
                      className="px-3 py-1.5 text-xs rounded-lg border border-black/10 text-[#2C2420]/70 hover:bg-black/5"
                    >
                      Desconectar
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
