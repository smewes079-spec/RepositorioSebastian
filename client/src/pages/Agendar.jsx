import { useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api.js';

// Página PÚBLICA de agendamiento (link de la bio de Instagram). Sin login.
// 1) segmento → 2) fecha del evento (reglas por segmento) → 3) día y hora
// libres según el Google Calendar de Carolina y María → 4) datos → listo.

const ROSA = '#CEC6C3';
const FONDO = '#FAF8F5';
const TINTA = '#2C2420';

const SEGMENTOS = [
  { clave: 'NOVIA', titulo: 'Novia', texto: 'Tu vestido de novia a medida' },
  { clave: 'MADRINA', titulo: 'Madrina', texto: 'Vestido para madrina' },
  { clave: 'INVITADA', titulo: 'Invitada', texto: 'Vestido para invitada' },
];

const fmtDia = new Intl.DateTimeFormat('es-CL', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' });
const fmtDiaCorto = new Intl.DateTimeFormat('es-CL', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });
const diaDe = (ymd) => new Date(`${ymd}T12:00:00Z`);
const capitalizar = (s) => s.charAt(0).toUpperCase() + s.slice(1);

function Boton({ children, className = '', ...props }) {
  return (
    <button
      {...props}
      className={`w-full py-3 rounded-xl text-sm font-medium text-white disabled:opacity-40 ${className}`}
      style={{ backgroundColor: '#1A1A2E' }}
    >
      {children}
    </button>
  );
}

function WhatsApp({ numero, texto }) {
  if (!numero) return null;
  const href = `https://wa.me/${numero}?text=${encodeURIComponent(texto)}`;
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="block text-center w-full py-3 rounded-xl text-sm font-medium border"
      style={{ borderColor: '#25D366', color: '#128C4B' }}
    >
      Escríbenos por WhatsApp
    </a>
  );
}

export default function Agendar() {
  const [config, setConfig] = useState(null);
  const [paso, setPaso] = useState(1);
  const [segmento, setSegmento] = useState('');
  const [fechaEvento, setFechaEvento] = useState('');
  const [horarios, setHorarios] = useState(null); // { ok, dias } | { ok:false, mensaje }
  const [diaSel, setDiaSel] = useState('');
  const [slot, setSlot] = useState(null);
  const [datos, setDatos] = useState({ nombre: '', email: '', telefono: '', sitioWeb: '' });
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');
  const [cita, setCita] = useState(null);

  useEffect(() => {
    document.title = 'Agenda tu asesoría · Hatton Schultz Atelier';
    api.get('/agenda-publica/config').then(setConfig).catch(() => setConfig({ disponible: false }));
  }, []);

  const hoy = useMemo(() => new Date().toISOString().slice(0, 10), []);
  const etiqueta = SEGMENTOS.find((s) => s.clave === segmento)?.titulo || '';

  async function buscarHorarios() {
    setCargando(true);
    setError('');
    setSlot(null);
    try {
      const r = await api.get(`/agenda-publica/horarios?segmento=${segmento}&fechaEvento=${fechaEvento}`);
      setHorarios(r);
      setDiaSel(r.ok && r.dias.length ? r.dias[0].fecha : '');
      setPaso(3);
    } catch (e) {
      setError(e.message);
    } finally {
      setCargando(false);
    }
  }

  async function confirmar(e) {
    e.preventDefault();
    setCargando(true);
    setError('');
    try {
      const r = await api.post('/agenda-publica/reservar', { segmento, fechaEvento, inicio: slot.inicio, ...datos });
      setCita(r.cita);
      setPaso(5);
    } catch (err) {
      // Si el horario se tomó o ya no está disponible, se recargan las horas
      // y el aviso queda visible (buscarHorarios limpia el error al empezar).
      if (/horario/.test(err.message)) await buscarHorarios();
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }

  const horasDelDia = horarios?.ok ? horarios.dias.find((d) => d.fecha === diaSel)?.horas || [] : [];
  const mensajeWsp = `Hola! Quiero agendar una asesoría (${etiqueta.toLowerCase() || 'novia'}${fechaEvento ? `, mi evento es el ${fechaEvento.split('-').reverse().join('-')}` : ''}) y no encontré horario cercano.`;

  return (
    <div className="min-h-screen" style={{ backgroundColor: FONDO, color: TINTA }}>
      <header className="flex flex-col items-center py-6" style={{ backgroundColor: ROSA }}>
        <img src="/logo-icono-blanco.png" alt="Hatton Schultz" className="h-12" />
        <p className="font-serif text-white tracking-[0.3em] uppercase text-sm mt-2">Hatton Schultz Atelier</p>
      </header>

      <main className="max-w-md mx-auto px-4 py-6">
        <h1 className="font-serif text-3xl text-center mb-1">Agenda tu asesoría</h1>
        <p className="text-center text-sm text-[#2C2420]/60 mb-6">
          Presencial · 1 hora{config?.direccion ? ` · ${config.direccion}` : ''}
        </p>

        {config && !config.disponible && paso < 5 && (
          <div className="bg-white rounded-xl p-5 text-sm text-center space-y-3">
            <p>La agenda en línea no está disponible en este momento.</p>
            <WhatsApp numero={config.whatsapp} texto="Hola! Quiero agendar una asesoría." />
          </div>
        )}

        {config?.disponible && paso === 1 && (
          <section>
            <p className="text-sm font-medium mb-3">¿Para quién es el vestido?</p>
            <div className="space-y-3">
              {SEGMENTOS.map((s) => (
                <button
                  key={s.clave}
                  onClick={() => {
                    setSegmento(s.clave);
                    setPaso(2);
                  }}
                  className="w-full text-left bg-white rounded-xl px-5 py-4 border border-black/5 hover:border-[#C9A96E]"
                >
                  <p className="font-serif text-xl">{s.titulo}</p>
                  <p className="text-xs text-[#2C2420]/60">{s.texto}</p>
                </button>
              ))}
            </div>
          </section>
        )}

        {paso === 2 && (
          <section className="space-y-4">
            <button onClick={() => setPaso(1)} className="text-xs text-[#2C2420]/60">← Cambiar ({etiqueta})</button>
            <label className="block">
              <span className="text-sm font-medium">¿Cuándo es tu {segmento === 'NOVIA' ? 'matrimonio' : 'evento'}?</span>
              <input
                type="date"
                min={hoy}
                value={fechaEvento}
                onChange={(e) => setFechaEvento(e.target.value)}
                className="mt-2 w-full px-4 py-3 rounded-xl border border-black/10 bg-white text-base"
              />
            </label>
            <Boton onClick={buscarHorarios} disabled={!fechaEvento || cargando}>
              {cargando ? 'Buscando horarios…' : 'Ver horarios disponibles'}
            </Boton>
            {error && <p className="text-sm text-[#A85C52]">{error}</p>}
          </section>
        )}

        {paso === 3 && horarios && (
          <section className="space-y-4">
            <button onClick={() => setPaso(2)} className="text-xs text-[#2C2420]/60">← Cambiar fecha del evento</button>

            {!horarios.ok && (
              <div className="bg-white rounded-xl p-5 text-sm space-y-3">
                <p>{horarios.mensaje}</p>
                {segmento === 'NOVIA' && <WhatsApp numero={config?.whatsapp} texto={mensajeWsp} />}
              </div>
            )}

            {horarios.ok && horarios.dias.length === 0 && (
              <div className="bg-white rounded-xl p-5 text-sm space-y-3">
                <p>No tenemos horarios disponibles en los próximos meses.</p>
                {segmento === 'NOVIA' && <WhatsApp numero={config?.whatsapp} texto={mensajeWsp} />}
              </div>
            )}

            {horarios.ok && horarios.dias.length > 0 && (
              <>
                <p className="text-sm font-medium">Elige el día</p>
                <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4">
                  {horarios.dias.map((d) => (
                    <button
                      key={d.fecha}
                      onClick={() => {
                        setDiaSel(d.fecha);
                        setSlot(null);
                      }}
                      className={`shrink-0 px-3 py-2 rounded-xl text-xs border ${
                        d.fecha === diaSel ? 'bg-[#1A1A2E] text-white border-[#1A1A2E]' : 'bg-white border-black/10'
                      }`}
                    >
                      {capitalizar(fmtDiaCorto.format(diaDe(d.fecha)))}
                    </button>
                  ))}
                </div>
                <p className="text-sm font-medium">{capitalizar(fmtDia.format(diaDe(diaSel)))}</p>
                <div className="grid grid-cols-3 gap-2">
                  {horasDelDia.map((h) => (
                    <button
                      key={h.inicio}
                      onClick={() => setSlot({ ...h, fecha: diaSel })}
                      className={`py-2.5 rounded-xl text-sm border ${
                        slot?.inicio === h.inicio ? 'bg-[#1A1A2E] text-white border-[#1A1A2E]' : 'bg-white border-black/10'
                      }`}
                    >
                      {h.hora}
                    </button>
                  ))}
                </div>
                <Boton onClick={() => setPaso(4)} disabled={!slot}>
                  Continuar
                </Boton>
                {segmento === 'NOVIA' && config?.whatsapp && (
                  <div className="pt-2 space-y-2">
                    <p className="text-xs text-center text-[#2C2420]/60">
                      ¿No encuentras un horario cercano? Escríbenos y vemos un sobrecupo.
                    </p>
                    <WhatsApp numero={config.whatsapp} texto={mensajeWsp} />
                  </div>
                )}
              </>
            )}
            {error && <p className="text-sm text-[#A85C52]">{error}</p>}
          </section>
        )}

        {paso === 4 && slot && (
          <form onSubmit={confirmar} className="space-y-4">
            <button type="button" onClick={() => setPaso(3)} className="text-xs text-[#2C2420]/60">← Cambiar horario</button>
            <div className="bg-white rounded-xl p-4 text-sm">
              <p className="font-medium">{capitalizar(fmtDia.format(diaDe(slot.fecha)))} · {slot.hora} hrs</p>
              <p className="text-[#2C2420]/60">Asesoría {etiqueta.toLowerCase()} · presencial · 1 hora</p>
            </div>
            {[
              ['nombre', 'Nombre y apellido', 'text', 'name'],
              ['email', 'Correo', 'email', 'email'],
              ['telefono', 'Teléfono', 'tel', 'tel'],
            ].map(([campo, label, type, auto]) => (
              <label key={campo} className="block">
                <span className="text-sm font-medium">{label}</span>
                <input
                  required
                  type={type}
                  autoComplete={auto}
                  value={datos[campo]}
                  onChange={(e) => setDatos({ ...datos, [campo]: e.target.value })}
                  className="mt-1 w-full px-4 py-3 rounded-xl border border-black/10 bg-white text-base"
                />
              </label>
            ))}
            {/* Campo trampa anti-spam: oculto para las personas. */}
            <input
              type="text"
              tabIndex={-1}
              autoComplete="off"
              value={datos.sitioWeb}
              onChange={(e) => setDatos({ ...datos, sitioWeb: e.target.value })}
              className="hidden"
              aria-hidden="true"
            />
            <Boton type="submit" disabled={cargando}>
              {cargando ? 'Confirmando…' : 'Confirmar asesoría'}
            </Boton>
            {error && <p className="text-sm text-[#A85C52]">{error}</p>}
          </form>
        )}

        {paso === 5 && cita && (
          <section className="bg-white rounded-xl p-6 text-center space-y-3">
            <p className="font-serif text-2xl">¡Te esperamos!</p>
            <p className="text-sm">
              Tu asesoría quedó agendada para el{' '}
              <strong>
                {fmtDia.format(diaDe(cita.fecha))} a las {cita.hora} hrs
              </strong>
              .
            </p>
            <p className="text-sm text-[#2C2420]/70">{cita.direccion}</p>
            <p className="text-xs text-[#2C2420]/60">
              Te enviamos la invitación a tu correo. Si necesitas cambiar la hora, respóndenos ese correo.
            </p>
          </section>
        )}
      </main>
    </div>
  );
}
