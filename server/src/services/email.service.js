import sgMail from '@sendgrid/mail';

let configured = false;

function isConfigured() {
  return !!(process.env.SENDGRID_API_KEY && process.env.SENDGRID_FROM_EMAIL);
}

function ensureClient() {
  if (!configured) {
    sgMail.setApiKey(process.env.SENDGRID_API_KEY);
    configured = true;
  }
}

export async function sendCotizacionEmail({ cotizacion, pdfBuffer }) {
  if (!isConfigured()) {
    throw new Error(
      'El envío de correo no está configurado. Pídele al administrador que agregue SENDGRID_API_KEY y SENDGRID_FROM_EMAIL en las variables de entorno de Render.'
    );
  }
  ensureClient();

  const fromName = process.env.SENDGRID_FROM_NAME || 'Hatton Schultz Novias';
  const numero = cotizacion.id.slice(-8).toUpperCase();

  try {
    await sgMail.send({
      to: cotizacion.emailClienta,
      from: { email: process.env.SENDGRID_FROM_EMAIL, name: fromName },
      subject: `Cotización N° ${numero} - Hatton Schultz Novias`,
      text: `Hola ${cotizacion.nombreClienta},\n\nAdjuntamos tu cotización N° ${numero}.\n\nCualquier consulta, respóndenos a este correo.\n\nSaludos,\nHatton Schultz Novias`,
      html: `<p>Hola ${cotizacion.nombreClienta},</p><p>Adjuntamos tu cotización N° ${numero}.</p><p>Cualquier consulta, respóndenos a este correo.</p><p>Saludos,<br/>Hatton Schultz Novias</p>`,
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

export { isConfigured as isEmailConfigured };
