import crypto from 'crypto';
import { prisma } from '../lib/prisma.js';

// Envío de cotizaciones directo desde la casilla de Gmail (Google Workspace)
// de María o Carolina, vía la API HTTP de Gmail. Render (plan free) bloquea
// SMTP, pero no HTTPS, así que esto sí funciona.
//
// Cada remitente conecta su casilla una vez desde Configuración (OAuth de
// Google, permiso "gmail.send" = solo enviar, no leer). Se guarda el
// refresh token y con él se pide un token de acceso en cada envío.
//
// Requiere en Render: GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET, de un cliente
// OAuth "Aplicación web" creado en Google Cloud con pantalla de
// consentimiento "Interna" (solo cuentas @hattonschultz.com) y URI de
// redirección https://<app>/api/gmail/callback.

const AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth';
const TOKEN_URL = 'https://oauth2.googleapis.com/token';
const REVOKE_URL = 'https://oauth2.googleapis.com/revoke';
const SEND_URL = 'https://gmail.googleapis.com/gmail/v1/users/me/messages/send';
export const SCOPE_CALENDARIO = 'https://www.googleapis.com/auth/calendar.events';
const SCOPES = [
  'openid',
  'email',
  'https://www.googleapis.com/auth/gmail.send', // enviar cotizaciones (no leer correo)
  'https://www.googleapis.com/auth/calendar.freebusy', // ver horas ocupadas (sin ver el contenido)
  SCOPE_CALENDARIO, // crear las citas agendadas desde /agendar
];

export function gmailConfigurado() {
  return !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
}

export function nuevoState() {
  return crypto.randomBytes(24).toString('hex');
}

export function urlAutorizacion({ redirectUri, state, loginHint }) {
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: SCOPES.join(' '),
    access_type: 'offline',
    prompt: 'consent',
    include_granted_scopes: 'true',
    state,
  });
  if (loginHint) params.set('login_hint', loginHint);
  return `${AUTH_URL}?${params}`;
}

async function postToken(params) {
  const res = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      ...params,
    }),
  });
  const data = await res.json().catch(() => ({}));
  return { ok: res.ok, data };
}

// El id_token viene directo de Google por HTTPS, así que basta leer su
// contenido para saber con qué casilla se conectó.
function emailDeIdToken(idToken) {
  try {
    const payload = JSON.parse(Buffer.from(idToken.split('.')[1], 'base64url').toString('utf8'));
    return payload.email_verified === false ? null : (payload.email || '').toLowerCase();
  } catch {
    return null;
  }
}

// Canjea el código que devuelve Google y guarda la conexión, verificando que
// la casilla conectada sea la del remitente (ej. caro@ para Carolina).
export async function completarConexion({ remitente, emailEsperado, code, redirectUri, usuarioId }) {
  const { ok, data } = await postToken({ code, grant_type: 'authorization_code', redirect_uri: redirectUri });
  if (!ok) throw new Error(`Google no aceptó la conexión (${data.error_description || data.error || 'sin detalle'}).`);
  if (!data.refresh_token) {
    throw new Error('Google no entregó el permiso permanente. Vuelve a intentarlo desde Configuración.');
  }
  if (!String(data.scope || '').includes('gmail.send')) {
    throw new Error('No se marcó el permiso para enviar correos. Vuelve a conectar y acepta todos los permisos.');
  }
  const email = emailDeIdToken(data.id_token);
  if (!email || email !== emailEsperado.toLowerCase()) {
    await revocar(data.refresh_token);
    throw new Error(
      `Se conectó la casilla ${email || 'desconocida'}, pero para este remitente debe ser ${emailEsperado}. ` +
        'Vuelve a conectar eligiendo esa cuenta de Google.'
    );
  }
  await prisma.gmailConexion.upsert({
    where: { remitente },
    update: { email, refreshToken: data.refresh_token, scopes: data.scope || null, conectadoEn: new Date(), conectadoPorId: usuarioId },
    create: { remitente, email, refreshToken: data.refresh_token, scopes: data.scope || null, conectadoPorId: usuarioId },
  });
  return email;
}

async function revocar(token) {
  try {
    await fetch(REVOKE_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ token }),
    });
  } catch {
    /* si falla la revocación igual se borra la conexión local */
  }
}

export async function estadoConexiones() {
  const filas = await prisma.gmailConexion.findMany({
    select: { remitente: true, email: true, conectadoEn: true, scopes: true },
  });
  return {
    configurado: gmailConfigurado(),
    conexiones: filas.map(({ scopes, ...f }) => ({ ...f, calendario: tieneCalendario({ scopes }) })),
  };
}

export async function conexionDe(remitente) {
  if (!gmailConfigurado() || !remitente) return null;
  return prisma.gmailConexion.findUnique({ where: { remitente } });
}

export async function desconectar(remitente) {
  const conexion = await prisma.gmailConexion.findUnique({ where: { remitente } });
  if (!conexion) return;
  await revocar(conexion.refreshToken);
  await prisma.gmailConexion.delete({ where: { remitente } });
}

// ---- Armado del correo (formato MIME que exige la API de Gmail) ----

function encabezadoUtf8(texto) {
  // Solo codifica si hace falta (tildes, ñ, °), como hacen los clientes de correo.
  return /^[\x20-\x7E]*$/.test(texto) ? texto : `=?UTF-8?B?${Buffer.from(texto, 'utf8').toString('base64')}?=`;
}

function direccion({ email, name }) {
  if (!name) return `<${email}>`;
  const nombre = /^[\x20-\x7E]*$/.test(name) ? `"${name.replace(/(["\\])/g, '\\$1')}"` : encabezadoUtf8(name);
  return `${nombre} <${email}>`;
}

// Nombre de archivo con tildes/ñ (ej. "María Schultz.pdf"): formato RFC 2231,
// que Gmail, Outlook y Apple Mail muestran bien.
export function parametroArchivo(nombre) {
  if (/^[\x20-\x7E]*$/.test(nombre)) return `filename="${nombre.replace(/(["\\])/g, '\\$1')}"`;
  const codificado = encodeURIComponent(nombre).replace(/['()*]/g, (ch) => `%${ch.charCodeAt(0).toString(16).toUpperCase()}`);
  return `filename*=UTF-8''${codificado}`;
}

function base64Lineas(buf) {
  return buf.toString('base64').replace(/.{1,76}/g, '$&\r\n').trimEnd();
}

export function armarMime(c) {
  const mixto = `mix_${crypto.randomBytes(12).toString('hex')}`;
  const alterno = `alt_${crypto.randomBytes(12).toString('hex')}`;
  const lineas = [
    `From: ${direccion(c.from)}`,
    `To: ${direccion(c.to)}`,
    `Cc: ${direccion(c.cc)}`,
    `Subject: ${encabezadoUtf8(c.subject)}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/mixed; boundary="${mixto}"`,
    '',
    `--${mixto}`,
    `Content-Type: multipart/alternative; boundary="${alterno}"`,
    '',
    `--${alterno}`,
    'Content-Type: text/plain; charset="UTF-8"',
    'Content-Transfer-Encoding: base64',
    '',
    base64Lineas(Buffer.from(c.text, 'utf8')),
    `--${alterno}`,
    'Content-Type: text/html; charset="UTF-8"',
    'Content-Transfer-Encoding: base64',
    '',
    base64Lineas(Buffer.from(c.html, 'utf8')),
    `--${alterno}--`,
    '',
    `--${mixto}`,
    `Content-Type: application/pdf; name="${encabezadoUtf8(c.adjunto.nombre)}"`,
    `Content-Disposition: attachment; ${parametroArchivo(c.adjunto.nombre)}`,
    'Content-Transfer-Encoding: base64',
    '',
    base64Lineas(Buffer.from(c.adjunto.base64, 'base64')),
    `--${mixto}--`,
    '',
  ];
  return lineas.join('\r\n');
}

// Token de acceso de corta duración a partir del permiso guardado. Lo usan
// el envío de correos y el calendario (agenda.service.js).
export async function tokenDeAcceso(conexion, nombre) {
  const token = await postToken({ refresh_token: conexion.refreshToken, grant_type: 'refresh_token' });
  if (!token.ok) {
    if (token.data.error === 'invalid_grant') {
      throw new Error(
        `Se perdió la conexión con Google de ${nombre}. Vuelve a conectarla en Configuración → Conexión con Google.`
      );
    }
    throw new Error(`Google rechazó el acceso (${token.data.error_description || token.data.error || 'sin detalle'}).`);
  }
  return token.data.access_token;
}

export function tieneCalendario(conexion) {
  return !!conexion?.scopes && conexion.scopes.includes(SCOPE_CALENDARIO);
}

export async function enviarPorGmail(conexion, correo, nombreRemitente) {
  const reconectar = `Vuelve a conectar la casilla de ${nombreRemitente} en Configuración → Conexión con Google.`;
  const accessToken = await tokenDeAcceso(conexion, nombreRemitente);
  const raw = Buffer.from(armarMime(correo), 'utf8').toString('base64url');
  const res = await fetch(SEND_URL, {
    method: 'POST',
    headers: { authorization: `Bearer ${accessToken}`, 'content-type': 'application/json' },
    body: JSON.stringify({ raw }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    const detalle = data.error?.message || `Error ${res.status}`;
    if (res.status === 401 || res.status === 403) {
      throw new Error(`Gmail no permitió enviar desde la casilla de ${nombreRemitente} (${detalle}). ${reconectar}`);
    }
    if (res.status === 429) {
      throw new Error(`Gmail alcanzó su límite de envíos por hoy (${detalle}). Intenta más tarde.`);
    }
    throw new Error(`Gmail no pudo enviar el correo (${detalle}).`);
  }
}
