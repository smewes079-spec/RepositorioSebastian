import * as gmailService from '../services/gmail.service.js';
import { REMITENTES } from '../services/email.service.js';

// URI a la que Google devuelve a la usuaria tras dar el permiso. Debe estar
// registrada tal cual en el cliente OAuth de Google Cloud.
function redirectUri(req) {
  return `${req.protocol}://${req.get('host')}/api/gmail/callback`;
}

function volverAConfiguracion(res, params) {
  res.redirect(`/configuracion?${new URLSearchParams(params)}#correo-cotizaciones`);
}

export async function estado(req, res) {
  try {
    const data = await gmailService.estadoConexiones();
    res.json({
      ...data,
      redirectUri: redirectUri(req),
      remitentes: Object.entries(REMITENTES).map(([clave, r]) => ({ clave, ...r })),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'No se pudo leer el estado de las casillas de Gmail' });
  }
}

export function conectar(req, res) {
  const remitente = req.params.remitente;
  const r = REMITENTES[remitente];
  if (!r) return res.status(400).json({ error: 'Remitente desconocido' });
  if (!gmailService.gmailConfigurado()) {
    return volverAConfiguracion(res, {
      gmail: 'error',
      mensaje: 'Falta configurar Google en Render (GOOGLE_CLIENT_ID y GOOGLE_CLIENT_SECRET).',
    });
  }
  const state = gmailService.nuevoState();
  req.session.gmailOAuth = { state, remitente };
  req.session.save(() => {
    res.redirect(gmailService.urlAutorizacion({ redirectUri: redirectUri(req), state, loginHint: r.email }));
  });
}

export async function callback(req, res) {
  const pendiente = req.session.gmailOAuth;
  delete req.session.gmailOAuth;
  const { code, state, error } = req.query;
  if (error) {
    return volverAConfiguracion(res, {
      gmail: 'error',
      mensaje: error === 'access_denied' ? 'Se canceló la conexión con Google.' : `Google respondió: ${error}`,
    });
  }
  if (!pendiente || !state || state !== pendiente.state || !code) {
    return volverAConfiguracion(res, {
      gmail: 'error',
      mensaje: 'La conexión expiró o no es válida. Vuelve a apretar "Conectar con Gmail".',
    });
  }
  try {
    const email = await gmailService.completarConexion({
      remitente: pendiente.remitente,
      emailEsperado: REMITENTES[pendiente.remitente].email,
      code,
      redirectUri: redirectUri(req),
      usuarioId: req.user.id,
    });
    volverAConfiguracion(res, { gmail: 'ok', mensaje: `Casilla ${email} conectada.` });
  } catch (err) {
    console.error(err);
    volverAConfiguracion(res, { gmail: 'error', mensaje: err.message });
  }
}

export async function desconectar(req, res) {
  if (!REMITENTES[req.params.remitente]) return res.status(400).json({ error: 'Remitente desconocido' });
  try {
    await gmailService.desconectar(req.params.remitente);
    res.status(204).end();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'No se pudo desconectar la casilla' });
  }
}
