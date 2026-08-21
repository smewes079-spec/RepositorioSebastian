import sgMail from '@sendgrid/mail';

let configured = false;

// Las dos cuentas del taller: cada cotización sale desde la de quien la
// envía, con la otra siempre en copia para que ambas tengan seguimiento.
const REMITENTES = {
  MARIA: { email: 'maria@hattonschultz.com', name: 'María' },
  CARO: { email: 'caro@hattonschultz.com', name: 'Carolina' },
};

function isConfigured() {
  return !!process.env.SENDGRID_API_KEY;
}

function ensureClient() {
  if (!configured) {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    configured = true;
  }
}

export function mensajeCorreoPorDefecto(cotizacion) {
  const numero = cotizacion.id.slice(-8).toUpperCase();
  return `Adjuntamos tu cotización N° ${numero}.\n\nCualquier consulta, respóndenos a este correo.`;
}

function escapeHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

export async function sendCotizacionEmail({ cotizacion, pdfBuffer, mensaje }) {
  if (!isConfigured()) {
    throw new Error(
      'El envío de correo no está configurado. Pídele al administrador que agregue SENDGRID_API_KEY en las variables de entorno de Render.'
    );
  }
  const remitente = REMITENTES[cotizacion.remitente];
  if (!remitente) {
    throw new Error('Elige quién envía la cotización (María o Carolina) antes de enviarla.');
  }
  const copia = Object.entries(REMITENTES).find(([key]) => key !== cotizacion.remitente)[1];
  ensureClient();

  const numero = cotizacion.id.slice(-8).toUpperCase();
  const cuerpo = (mensaje && mensaje.trim()) || mensajeCorreoPorDefecto(cotizacion);
  const cuerpoHtml = escapeHtml(cuerpo).replace(/\n/g, '<br/>');

  try {
    await sgMail.send({
      to: cotizacion.emailClienta,
      cc: copia.email,
      from: { email: remitente.email, name: `${remitente.name} - Hatton Schultz Novias` },
      subject: `Cotización N° ${numero} - Hatton Schultz Novias`,
      text: `Hola ${cotizacion.nombreClienta},\n\n${cuerpo}\n\nSaludos,\n${remitente.name}\nHatton Schultz Novias`,
      html: `<p>Hola ${cotizacion.nombreClienta},</p><p>${cuerpoHtml}</p><p>Saludos,<br/>${remitente.name}<br/>Hatton Schultz Novias</p>`,
      attachments: [
        {
          filename: `cotizacion-${numero}.pdf`,
          content: pdfBuffer.toString('base64'),
          type: 'application/pdf',
          disposition: 'attachment',
        },
      ],
    });
  } catch (err) {
    const detalle = err.response?.body?.errors?.map((e) => e.message).join('; ');
    throw new Error(detalle || err.message || 'No se pudo enviar el correo');
  }
}

export { isConfigured as isEmailConfigured, REMITENTES };
