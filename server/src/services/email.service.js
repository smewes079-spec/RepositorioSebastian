import sgMail from '@sendgrid/mail';
import { conexionDe, enviarPorGmail } from './gmail.service.js';
import { nombreArchivoCotizacion } from './pdf.service.js';

// Las dos cuentas del taller: cada cotización sale desde la de quien la
// envía, con la otra siempre en copia para que ambas tengan seguimiento.
const REMITENTES = {
  MARIA: { email: 'maria@hattonschultz.com', name: 'María' },
  CARO: { email: 'caro@hattonschultz.com', name: 'Carolina' },
};

// Proveedor de envío. Desde v1.25.0 el principal es Gmail directo (ver
// gmail.service.js): cada cotización sale de la casilla real de quien envía.
// Brevo y SendGrid quedan solo como respaldo si esa casilla no está
// conectada. Todos se usan por API HTTP porque Render (plan free) bloquea SMTP.
const BREVO_URL = 'https://api.brevo.com/v3/smtp/email';

function proveedor() {
  if (process.env.BREVO_API_KEY) return 'BREVO';
  if (process.env.SENDGRID_API_KEY) return 'SENDGRID';
  return null;
}

function isConfigured() {
  return proveedor() !== null;
}

export function mensajeCorreoPorDefecto(cotizacion) {
  const numero = cotizacion.id.slice(-8).toUpperCase();
  return `Adjuntamos tu cotización N° ${numero}.\n\nCualquier consulta, respóndenos a este correo.`;
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

// Arma el correo una sola vez, independiente del proveedor.
function armarCorreo({ cotizacion, pdfBuffer, mensaje }) {
  const remitente = REMITENTES[cotizacion.remitente];
  if (!remitente) {
    throw new Error('Elige quién envía la cotización (María o Carolina) antes de enviarla.');
  }
  const copia = Object.entries(REMITENTES).find(([key]) => key !== cotizacion.remitente)[1];
  const cuerpo = (mensaje && mensaje.trim()) || mensajeCorreoPorDefecto(cotizacion);
  const cuerpoHtml = escapeHtml(cuerpo).replace(/\n/g, '<br/>');
  const nombre = escapeHtml(cotizacion.nombreClienta);

  return {
    to: { email: cotizacion.emailClienta, name: cotizacion.nombreClienta },
    cc: copia,
    from: { email: remitente.email, name: `${remitente.name} - Hatton Schultz Novias` },
    subject: 'Cotización Hatton Schultz Atelier',
    text: `Hola ${cotizacion.nombreClienta},\n\n${cuerpo}\n\nSaludos,\n${remitente.name}\nHatton Schultz Novias`,
    html: `<p>Hola ${nombre},</p><p>${cuerpoHtml}</p><p>Saludos,<br/>${remitente.name}<br/>Hatton Schultz Novias</p>`,
    adjunto: { nombre: nombreArchivoCotizacion(cotizacion), base64: pdfBuffer.toString('base64') },
  };
}

// Traduce los errores más comunes del proveedor a algo que se entienda.
function errorEntendible(detalle) {
  const d = (detalle || '').toLowerCase();
  if (d.includes('sender') && (d.includes('not valid') || d.includes('not verified') || d.includes('invalid'))) {
    return 'El correo de quien envía (María o Carolina) todavía no está verificado en Brevo. Hay que verificarlo en Brevo → Senders, Domains & Dedicated IPs.';
  }
  if (d.includes('key not found') || d.includes('unauthorized') || d.includes('invalid api key')) {
    return 'La clave de Brevo (BREVO_API_KEY) en Render no es válida. Revisa que esté bien copiada.';
  }
  if (d.includes('credits') || d.includes('limit')) {
    return `Se alcanzó el límite de envíos del servicio de correo (${detalle}). Intenta mañana o revisa el plan.`;
  }
  return detalle || 'No se pudo enviar el correo';
}

async function enviarPorBrevo(c) {
  const res = await fetch(BREVO_URL, {
    method: 'POST',
    headers: {
      'api-key': process.env.BREVO_API_KEY,
      'content-type': 'application/json',
      accept: 'application/json',
    },
    body: JSON.stringify({
      sender: c.from,
      to: [c.to],
      cc: [c.cc],
      replyTo: c.from,
      subject: c.subject,
      textContent: c.text,
      htmlContent: c.html,
      attachment: [{ name: c.adjunto.nombre, content: c.adjunto.base64 }],
    }),
  });
  if (!res.ok) {
    let detalle = `Error ${res.status}`;
    try {
      const body = await res.json();
      detalle = body.message || detalle;
    } catch {
      /* respuesta sin JSON */
    }
    throw new Error(errorEntendible(detalle));
  }
}

async function enviarPorSendgrid(c) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
  try {
    await sgMail.send({
      to: c.to.email,
      cc: c.cc.email,
      from: c.from,
      subject: c.subject,
      text: c.text,
      html: c.html,
      attachments: [
        { filename: c.adjunto.nombre, content: c.adjunto.base64, type: 'application/pdf', disposition: 'attachment' },
      ],
    });
  } catch (err) {
    const detalle = err.response?.body?.errors?.map((e) => e.message).join('; ');
    throw new Error(errorEntendible(detalle || err.message));
  }
}

export async function sendCotizacionEmail({ cotizacion, pdfBuffer, mensaje }) {
  // 1º Gmail directo, si quien envía conectó su casilla en Configuración.
  const gmail = await conexionDe(cotizacion.remitente);
  const via = gmail ? 'GMAIL' : proveedor();
  if (!via) {
    const nombre = REMITENTES[cotizacion.remitente]?.name || 'quien envía';
    throw new Error(
      `La casilla de Gmail de ${nombre} no está conectada. Conéctala en Configuración → Conexión con Google.`
    );
  }
  const correo = armarCorreo({ cotizacion, pdfBuffer, mensaje });
  if (via === 'GMAIL') await enviarPorGmail(gmail, correo, REMITENTES[cotizacion.remitente].name);
  else if (via === 'BREVO') await enviarPorBrevo(correo);
  else await enviarPorSendgrid(correo);
}

export { isConfigured as isEmailConfigured, REMITENTES };
