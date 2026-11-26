import { prisma } from '../lib/prisma.js';
import { REMITENTES } from './email.service.js';
import { tokenDeAcceso, tieneCalendario, gmailConfigurado } from './gmail.service.js';

// Página pública de agendamiento (/agendar).
//
// La clienta elige su segmento (novia, madrina o invitada) y la fecha de su
// evento; según las reglas de ConfigAgenda puede o no agendar. Los horarios
// libres salen del Google Calendar de Carolina y María (consulta freeBusy con
// el permiso que cada una dio en Configuración → Conexión con Google). Un
// horario aparece si al menos una está libre, y la cita se asigna a esa.

const TZ = 'America/Santiago';
const DIRECCION = 'Agustín del Castillo 2960, Vitacura';
const FREEBUSY_URL = 'https://www.googleapis.com/calendar/v3/freeBusy';
const EVENTS_URL = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';
const DURACION_MIN = 60;
const SEGMENTOS = ['NOVIA', 'MADRINA', 'INVITADA'];
const SEGMENTO_LABEL = { NOVIA: 'Novia', MADRINA: 'Madrina', INVITADA: 'Invitada' };

// ---------- Configuración ----------

export async function getConfigAgenda() {
  const existente = await prisma.configAgenda.findUnique({ where: { id: 'main' } });
  return existente || prisma.configAgenda.create({ data: { id: 'main' } });
}

const ENTEROS = [
  'mesesMinimoMadrina',
  'mesesMinimoInvitada',
  'capacidadMensual',
  'mesesReservaNovias',
  'horaInicio',
  'horaFin',
  'diasHorizonte',
  'horasAvisoMinimo',
];
const BOOLEANOS = ['abiertoNovia', 'abiertoMadrina', 'abiertoInvitada'];

export async function updateConfigAgenda(data) {
  const limpio = {};
  for (const k of ENTEROS) {
    if (data[k] === undefined) continue;
    const n = Number(data[k]);
    if (!Number.isInteger(n) || n < 0) throw new Error(`Valor inválido en ${k}`);
    limpio[k] = n;
  }
  for (const k of BOOLEANOS) if (data[k] !== undefined) limpio[k] = !!data[k];
  if (data.whatsapp !== undefined) limpio.whatsapp = String(data.whatsapp || '').replace(/\D/g, '') || null;
  if (data.diasSemana !== undefined) {
    const dias = [...new Set(String(data.diasSemana).split(',').map(Number))].filter((d) => d >= 1 && d <= 7).sort();
    if (!dias.length) throw new Error('Elige al menos un día de atención');
    limpio.diasSemana = dias.join(',');
  }
  const final = { ...(await getConfigAgenda()), ...limpio };
  if (final.horaInicio < 0 || final.horaFin > 24 || final.horaInicio >= final.horaFin) {
    throw new Error('El horario de atención no es válido (la hora de inicio debe ser menor que la de término)');
  }
  return prisma.configAgenda.update({ where: { id: 'main' }, data: limpio });
}

// ---------- Fechas en hora de Chile (sin librerías) ----------

const formatoPartes = new Intl.DateTimeFormat('en-US', {
  timeZone: TZ,
  hourCycle: 'h23',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  weekday: 'short',
});
const DIA_SEMANA = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 };

export function partesChile(date) {
  const v = Object.fromEntries(formatoPartes.formatToParts(date).map((p) => [p.type, p.value]));
  return { y: +v.year, m: +v.month, d: +v.day, h: +v.hour, min: +v.minute, s: +v.second, dow: DIA_SEMANA[v.weekday] };
}

function offsetMinutos(date) {
  const p = partesChile(date);
  return (Date.UTC(p.y, p.m - 1, p.d, p.h, p.min, p.s) - date.getTime()) / 60000;
}

// Hora local de Chile → instante real (UTC). Considera el horario de verano.
export function chileAUtc(y, m, d, h, min = 0) {
  const guess = Date.UTC(y, m - 1, d, h, min);
  let t = guess - offsetMinutos(new Date(guess)) * 60000;
  const ajuste = offsetMinutos(new Date(t));
  t = guess - ajuste * 60000;
  return new Date(t);
}

function ymd(y, m, d) {
  return `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

export function hoyChile(ahora = new Date()) {
  const p = partesChile(ahora);
  return ymd(p.y, p.m, p.d);
}

// "2026-11-25" + 7 meses → "2027-06-25" (si el día no existe, último del mes).
export function sumarMeses(fechaYmd, meses) {
  const [y, m, d] = fechaYmd.split('-').map(Number);
  const total = y * 12 + (m - 1) + meses;
  const ny = Math.floor(total / 12);
  const nm = (total % 12) + 1;
  const ultimo = new Date(Date.UTC(ny, nm, 0)).getUTCDate();
  return ymd(ny, nm, Math.min(d, ultimo));
}

function fechaValida(s) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(s || ''))) return false;
  const [y, m, d] = s.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  return dt.getUTCFullYear() === y && dt.getUTCMonth() === m - 1 && dt.getUTCDate() === d;
}

// ---------- Reglas por segmento y capacidad de entrega ----------
//
// Capacidad: ~8 entregas al mes, contadas como las Ventas cuya fecha de
// evento cae en ese mes. Las novias son la prioridad: pueden agendar para
// cualquier fecha cuyo mes tenga cupo. Madrinas e invitadas solo pueden
// agendar con anticipación MÁXIMA de 7 y 5 meses (mesesMinimoMadrina /
// mesesMinimoInvitada en ConfigAgenda; el nombre quedó de v1.28.0): más
// lejos, el cupo sigue disponible para una novia, que agenda con mucha
// anticipación. Sin plazo mínimo. Y el mes debe tener entregas < capacidad.
// (mesesReservaNovias ya no se usa desde v1.29.2.)

function fmtDMY(ymd) {
  const [y, m, d] = ymd.split('-');
  return `${d}-${m}-${y}`;
}

// Rango del mes calendario (mismo criterio que el resto de la app, que
// agrupa las ventas por mes según la fecha de evento guardada).
function rangoMes(y, m) {
  return { gte: new Date(Date.UTC(y, m - 1, 1)), lt: new Date(Date.UTC(y, m, 1)) };
}

export async function entregasDelMes(y, m) {
  return prisma.venta.count({ where: { fechaEvento: rangoMes(y, m) } });
}

// Parte sin base de datos: segmento, pausa, fecha y ventana de meses.
export function evaluarVentana({ segmento, fechaEvento }, config, ahora = new Date()) {
  if (!SEGMENTOS.includes(segmento)) return { motivo: 'segmento', mensaje: 'Elige si eres novia, madrina o invitada.' };
  const abierto = { NOVIA: config.abiertoNovia, MADRINA: config.abiertoMadrina, INVITADA: config.abiertoInvitada }[segmento];
  if (!abierto) {
    return {
      motivo: 'cerrado',
      mensaje:
        'En este momento no tenemos cupos disponibles para esta categoría. Te invitamos a volver a revisar más adelante.',
    };
  }
  if (!fechaValida(fechaEvento)) return { motivo: 'fecha', mensaje: 'Ingresa la fecha de tu evento.' };
  const hoy = hoyChile(ahora);
  if (fechaEvento <= hoy) return { motivo: 'fecha', mensaje: 'La fecha de tu evento debe ser posterior a hoy.' };
  if (segmento === 'NOVIA') return null;

  const etiqueta = SEGMENTO_LABEL[segmento].toLowerCase();
  const meses = segmento === 'MADRINA' ? config.mesesMinimoMadrina : config.mesesMinimoInvitada;
  if (fechaEvento > sumarMeses(hoy, meses)) {
    const desde = sumarMeses(fechaEvento, -meses);
    return {
      motivo: 'muy_lejos',
      mensaje:
        `Las asesorías de vestidos de ${etiqueta} se agendan con un máximo de ${meses} meses de anticipación ` +
        `a la fecha del evento. Puedes agendar tu hora a partir del ${fmtDMY(desde)}. ¡Te esperamos!`,
    };
  }
  return null;
}

// Devuelve null si puede agendar, o { motivo, mensaje } si no.
export async function evaluarSegmento(datos, config, ahora = new Date()) {
  const rechazo = evaluarVentana(datos, config, ahora);
  if (rechazo) return rechazo;
  // El tope de entregas del mes aplica a todas, novias incluidas (v1.29.1):
  // si el mes del evento ya tiene la capacidad completa, no se agenda.
  const [y, m] = datos.fechaEvento.split('-').map(Number);
  if ((await entregasDelMes(y, m)) >= config.capacidadMensual) {
    return {
      motivo: 'mes_lleno',
      mensaje:
        'Ya completamos nuestra capacidad de confección para el mes de tu evento. ' +
        (datos.segmento === 'NOVIA'
          ? 'Escríbenos por WhatsApp y vemos juntas si hay alguna alternativa.'
          : 'Lamentablemente, no podemos tomar nuevos vestidos para esa fecha.'),
    };
  }
  return null;
}

// Para Configuración → Agenda: próximos meses con sus entregas y quién
// puede tomar los cupos libres hoy.
export async function capacidadPorMes(cantidad = 12, ahora = new Date()) {
  const config = await getConfigAgenda();
  const hoy = hoyChile(ahora);
  const [hy, hm] = hoy.split('-').map(Number);
  const limiteMadrina = sumarMeses(hoy, config.mesesMinimoMadrina);
  const limiteInvitada = sumarMeses(hoy, config.mesesMinimoInvitada);
  const meses = [];
  for (let i = 0; i < cantidad; i++) {
    const total = hy * 12 + (hm - 1) + i;
    const y = Math.floor(total / 12);
    const m = (total % 12) + 1;
    const entregas = await entregasDelMes(y, m);
    // Un segmento puede tomar el mes si alguna fecha del mes cae dentro de
    // su anticipación máxima.
    const inicio = ymd(y, m, 1);
    let estado;
    if (entregas >= config.capacidadMensual) estado = 'lleno';
    else if (inicio <= limiteInvitada) estado = 'madrinas_invitadas';
    else if (inicio <= limiteMadrina) estado = 'madrinas';
    else estado = 'reservado_novias';
    meses.push({ mes: `${y}-${String(m).padStart(2, '0')}`, entregas, capacidad: config.capacidadMensual, estado });
  }
  return meses;
}

// ---------- Horarios ----------

export function generarHorarios(config, ahora = new Date()) {
  const dias = config.diasSemana.split(',').map(Number);
  const limiteAviso = ahora.getTime() + config.horasAvisoMinimo * 3600000;
  const hoy = partesChile(ahora);
  const slots = [];
  for (let i = 0; i <= config.diasHorizonte; i++) {
    const base = new Date(Date.UTC(hoy.y, hoy.m - 1, hoy.d + i, 12));
    const y = base.getUTCFullYear();
    const m = base.getUTCMonth() + 1;
    const d = base.getUTCDate();
    const dow = ((base.getUTCDay() + 6) % 7) + 1; // 1 = lunes
    if (!dias.includes(dow)) continue;
    for (let h = config.horaInicio; h + DURACION_MIN / 60 <= config.horaFin; h++) {
      const inicio = chileAUtc(y, m, d, h);
      if (inicio.getTime() < limiteAviso) continue;
      slots.push({ fecha: ymd(y, m, d), hora: `${String(h).padStart(2, '0')}:00`, inicio, fin: new Date(inicio.getTime() + DURACION_MIN * 60000) });
    }
  }
  return slots;
}

async function conectadasConCalendario() {
  if (!gmailConfigurado()) return [];
  const conexiones = await prisma.gmailConexion.findMany();
  return conexiones.filter(tieneCalendario).map((c) => ({ ...c, nombre: REMITENTES[c.remitente]?.name || c.remitente }));
}

// Bloques ocupados de una diseñadora entre desde y hasta (en tramos de 60
// días, por el límite de rango de la consulta freeBusy de Google).
async function ocupados(dis, desde, hasta) {
  const token = await tokenDeAcceso(dis, dis.nombre);
  const bloques = [];
  for (let t = desde.getTime(); t < hasta.getTime(); t += 60 * 86400000) {
    const fin = Math.min(t + 60 * 86400000, hasta.getTime());
    const res = await fetch(FREEBUSY_URL, {
      method: 'POST',
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify({ timeMin: new Date(t).toISOString(), timeMax: new Date(fin).toISOString(), timeZone: TZ, items: [{ id: 'primary' }] }),
    });
    const data = await res.json().catch(() => ({}));
    const cal = data.calendars?.primary;
    if (!res.ok || cal?.errors?.length) {
      throw new Error(`No se pudo leer el calendario de ${dis.nombre} (${data.error?.message || cal?.errors?.[0]?.reason || res.status}).`);
    }
    for (const b of cal.busy || []) bloques.push({ inicio: new Date(b.start).getTime(), fin: new Date(b.end).getTime() });
  }
  return bloques;
}

function libre(bloques, slot) {
  const a = slot.inicio.getTime();
  const b = slot.fin.getTime();
  return !bloques.some((x) => x.inicio < b && x.fin > a);
}

// Cuántos bloques ocupados tiene ese día (para repartir citas entre ambas).
function cargaDelDia(bloques, fecha) {
  return bloques.filter((x) => hoyChile(new Date(x.inicio)) === fecha).length;
}

async function disponibilidad(slots) {
  const conectadas = await conectadasConCalendario();
  if (!conectadas.length || !slots.length) return { conectadas, ocupacion: [] };
  const desde = slots[0].inicio;
  const hasta = slots[slots.length - 1].fin;
  const ocupacion = await Promise.all(conectadas.map(async (d) => ({ dis: d, bloques: await ocupados(d, desde, hasta) })));
  return { conectadas, ocupacion };
}

function elegirDisenadora(ocupacion, slot) {
  const libres = ocupacion.filter((o) => libre(o.bloques, slot));
  if (!libres.length) return null;
  libres.sort((a, b) => cargaDelDia(a.bloques, slot.fecha) - cargaDelDia(b.bloques, slot.fecha) || (a.dis.remitente < b.dis.remitente ? -1 : 1));
  return libres[0].dis;
}

export async function configPublica() {
  const c = await getConfigAgenda();
  const conectadas = await conectadasConCalendario();
  return {
    whatsapp: c.whatsapp,
    abierto: { NOVIA: c.abiertoNovia, MADRINA: c.abiertoMadrina, INVITADA: c.abiertoInvitada },
    direccion: DIRECCION,
    duracionMinutos: DURACION_MIN,
    disponible: conectadas.length > 0,
  };
}

// Horarios libres agrupados por día, para la página pública.
export async function horariosDisponibles({ segmento, fechaEvento }, ahora = new Date()) {
  const config = await getConfigAgenda();
  const rechazo = await evaluarSegmento({ segmento, fechaEvento }, config, ahora);
  if (rechazo) return { ok: false, ...rechazo };

  const slots = generarHorarios(config, ahora);
  const { conectadas, ocupacion } = await disponibilidad(slots);
  if (!conectadas.length) {
    return { ok: false, motivo: 'sin_calendario', mensaje: 'La agenda en línea no está disponible en este momento. Escríbenos para agendar.' };
  }
  const dias = new Map();
  for (const s of slots) {
    if (!elegirDisenadora(ocupacion, s)) continue;
    if (!dias.has(s.fecha)) dias.set(s.fecha, []);
    dias.get(s.fecha).push({ hora: s.hora, inicio: s.inicio.toISOString() });
  }
  return { ok: true, dias: [...dias.entries()].map(([fecha, horas]) => ({ fecha, horas })) };
}

// ---------- Reserva ----------

// Una reserva a la vez (la app corre en un solo proceso): evita que dos
// clientas tomen el mismo horario al mismo tiempo.
let cola = Promise.resolve();
function enSerie(fn) {
  const run = cola.then(fn, fn);
  cola = run.catch(() => {});
  return run;
}

function errorUsuario(mensaje, status = 400) {
  const e = new Error(mensaje);
  e.status = status;
  e.publico = true;
  return e;
}

export async function reservar(datos, ahora = new Date()) {
  const nombre = String(datos.nombre || '').trim().replace(/\s+/g, ' ');
  const email = String(datos.email || '').trim().toLowerCase();
  const telefono = String(datos.telefono || '').trim();
  if (nombre.length < 2 || nombre.length > 120) throw errorUsuario('Ingresa tu nombre.');
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 200) throw errorUsuario('Ingresa un correo válido.');
  if (telefono.replace(/\D/g, '').length < 8 || telefono.length > 30) throw errorUsuario('Ingresa un teléfono válido.');

  return enSerie(async () => {
    const config = await getConfigAgenda();
    const rechazo = await evaluarSegmento(datos, config, ahora);
    if (rechazo) throw errorUsuario(rechazo.mensaje);

    const slot = generarHorarios(config, ahora).find((s) => s.inicio.toISOString() === datos.inicio);
    if (!slot) throw errorUsuario('Ese horario ya no está disponible. Elige otro, por favor.', 409);

    // Se vuelve a consultar el calendario justo antes de reservar.
    const { ocupacion } = await disponibilidad([slot]);
    const dis = elegirDisenadora(ocupacion, slot);
    if (!dis) throw errorUsuario('Ese horario se acaba de tomar. Elige otro, por favor.', 409);

    const etiqueta = SEGMENTO_LABEL[datos.segmento];
    const [ey, em, ed] = datos.fechaEvento.split('-');
    const token = await tokenDeAcceso(dis, dis.nombre);
    const res = await fetch(`${EVENTS_URL}?sendUpdates=all`, {
      method: 'POST',
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        summary: `Asesoría ${etiqueta} – ${nombre}`,
        location: DIRECCION,
        description:
          `Asesoría presencial en Hatton Schultz Atelier.\n\n` +
          `Clienta: ${nombre}\nTipo: ${etiqueta}\nFecha del evento: ${ed}-${em}-${ey}\n` +
          `Correo: ${email}\nTeléfono: ${telefono}\n\nAgendada desde la página web.`,
        start: { dateTime: slot.inicio.toISOString(), timeZone: TZ },
        end: { dateTime: slot.fin.toISOString(), timeZone: TZ },
        attendees: [{ email, displayName: nombre }],
        guestsCanModify: false,
        guestsCanInviteOthers: false,
      }),
    });
    const evento = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(`No se pudo crear la cita en el calendario de ${dis.nombre} (${evento.error?.message || res.status}).`);
    }

    await prisma.asesoria.create({
      data: {
        fecha: slot.inicio,
        nombreClienta: nombre,
        emailClienta: email,
        telefonoClienta: telefono,
        monto: 0,
        notas: 'Agendada desde la página web.',
        segmento: datos.segmento,
        fechaEvento: new Date(`${datos.fechaEvento}T12:00:00Z`),
        asignadaA: dis.remitente,
        origen: 'WEB',
        googleEventId: evento.id || null,
      },
    });

    return { fecha: slot.fecha, hora: slot.hora, inicio: slot.inicio.toISOString(), direccion: DIRECCION, conQuien: dis.nombre };
  });
}
