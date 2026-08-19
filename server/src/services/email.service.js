import nodemailer from 'nodemailer';

let transporter = null;

function isConfigured() {
  return !!(process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD);
}

function getTransporter() {
  if (!isConfigured()) return null;
  if (!transporter) {
    // Puerto 587 con STARTTLS en vez del 465/SSL por defecto de nodemailer:
    // algunos hosts (Render incluido) bloquean o cortan la salida por 465.
    transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
      connectionTimeout: 15000,
    });
  }
  return transporter;
}

export async function sendCotizacionEmail({ cotizacion, pdfBuffer }) {
  const tx = getTransporter();
  if (!tx) {
    throw new Error(
      'El envío de correo no está configurado. Pídele al administrador que agregue GMAIL_USER y GMAIL_APP_PASSWORD en las variables de entorno de Render.'
    );
  }

  const fromName = process.env.GMAIL_FROM_NAME || 'Hatton Schultz Novias';
  const numero = cotizacion.id.slice(-8).toUpperCase();

  await tx.sendMail({
    from: `"${fromName}" <${process.env.GMAIL_USER}>`,
    to: cotizacion.emailClienta,
    subject: `Cotización N° ${numero} - Hatton Schultz Novias`,
    text: `Hola ${cotizacion.nombreClienta},\n\nAdjuntamos tu cotización N° ${numero}.\n\nCualquier consulta, respóndenos a este correo.\n\nSaludos,\nHatton Schultz Novias`,
    html: `<p>Hola ${cotizacion.nombreClienta},</p><p>Adjuntamos tu cotización N° ${numero}.</p><p>Cualquier consulta, respóndenos a este correo.</p><p>Saludos,<br/>Hatton Schultz Novias</p>`,
    attachments: [
      {
        filename: `cotizacion-${numero}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf',
      },
    ],
  });
}

export { isConfigured as isEmailConfigured };
