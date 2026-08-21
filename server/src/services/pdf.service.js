import path from 'path';
import { fileURLToPath } from 'url';
import pdfMake from 'pdfmake';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FONTS_DIR = path.join(__dirname, '../assets/fonts');

pdfMake.setFonts({
  Helvetica: {
    normal: 'Helvetica',
    bold: 'Helvetica-Bold',
    italics: 'Helvetica-Oblique',
    bolditalics: 'Helvetica-BoldOblique',
  },
  GreatVibes: {
    normal: path.join(FONTS_DIR, 'GreatVibes-Regular.ttf'),
    bold: path.join(FONTS_DIR, 'GreatVibes-Regular.ttf'),
    italics: path.join(FONTS_DIR, 'GreatVibes-Regular.ttf'),
    bolditalics: path.join(FONTS_DIR, 'GreatVibes-Regular.ttf'),
  },
  CormorantGaramond: {
    normal: path.join(FONTS_DIR, 'CormorantGaramond-Regular.ttf'),
    bold: path.join(FONTS_DIR, 'CormorantGaramond-Bold.ttf'),
    italics: path.join(FONTS_DIR, 'CormorantGaramond-Regular.ttf'),
    bolditalics: path.join(FONTS_DIR, 'CormorantGaramond-Bold.ttf'),
  },
});

// Paleta y medidas tomadas de la cotización que el taller ya envía hoy.
const ROSE = '#CEC6C3';
const INK = '#2C2420';
const MUTED = '#8A7E76';
const LABEL_BG = '#B9AFA6';
const VALUE_BG = '#F7F4F0';
const CARD_BG = '#F6F3EE';

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const BAND_HEIGHT = 110;

const TIPO_LABELS = {
  NOVIA: 'Novia',
  MADRINA: 'Madrina',
  INVITADA: 'Invitada',
  CIVIL: 'Civil',
};

function formatCLP(monto) {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(monto || 0);
}

function formatFecha(fecha) {
  if (!fecha) return '-';
  return new Intl.DateTimeFormat('es-CL', { dateStyle: 'long' }).format(new Date(fecha));
}

function fullBleedRect(color) {
  return {
    canvas: [{ type: 'rect', x: 0, y: 0, w: PAGE_WIDTH, h: PAGE_HEIGHT, color }],
    absolutePosition: { x: 0, y: 0 },
  };
}

function topBand(color) {
  return {
    canvas: [{ type: 'rect', x: 0, y: 0, w: PAGE_WIDTH, h: BAND_HEIGHT, color }],
    absolutePosition: { x: 0, y: 0 },
  };
}

function wordmark(color, opts = {}) {
  return {
    absolutePosition: { x: 0, y: opts.y },
    stack: [
      { text: 'HATTON SCHULTZ', font: 'CormorantGaramond', bold: true, fontSize: 30, color, alignment: 'center', characterSpacing: 4 },
      { text: 'ATELIER', font: 'CormorantGaramond', fontSize: 12, color, alignment: 'center', characterSpacing: 6, margin: [0, 6, 0, 0] },
    ],
  };
}

// Monograma aproximado (no tenemos el archivo vectorial original de la marca):
// una "H" serif y una "A" en script superpuestas, mismo espíritu que el logo real.
function monograma(color, opts = {}) {
  return {
    absolutePosition: { x: 0, y: opts.y },
    stack: [
      {
        text: 'H',
        font: 'CormorantGaramond',
        bold: true,
        fontSize: 78,
        color,
        alignment: 'center',
      },
      {
        text: 'A',
        font: 'GreatVibes',
        fontSize: 64,
        color,
        alignment: 'center',
        relativePosition: { x: 0, y: -58 },
      },
    ],
  };
}

function scriptHeading(text) {
  return { text, font: 'GreatVibes', fontSize: 30, color: ROSE, margin: [0, 4, 0, 10] };
}

function datoRow(label, value) {
  return [
    { text: label, fillColor: LABEL_BG, color: '#FFFFFF', fontSize: 9.5, margin: [10, 7, 6, 7] },
    { text: value || '-', fillColor: VALUE_BG, color: INK, fontSize: 10, margin: [10, 7, 6, 7] },
  ];
}

export function buildCotizacionPdf(cotizacion) {
  const items = cotizacion.items || [];
  const montoTotal = items.reduce((sum, it) => sum + it.cantidad * it.monto, 0);
  const fechaValidezHasta = new Date(cotizacion.createdAt);
  fechaValidezHasta.setDate(fechaValidezHasta.getDate() + (cotizacion.validezDias || 15));

  const descripcionItems = items.map((it) => ({
    text: (it.cantidad > 1 ? `(x${it.cantidad}) ` : '') + it.descripcion,
    fontSize: 10.5,
    color: INK,
    margin: [0, 0, 0, 6],
  }));

  const docDefinition = {
    pageSize: 'A4',
    pageMargins: [50, 40, 50, 60],
    defaultStyle: { font: 'Helvetica', fontSize: 10, color: INK },
    content: [
      // Página 1 — portada
      fullBleedRect(ROSE),
      monograma('#FFFFFF', { y: 300 }),
      wordmark('#FFFFFF', { y: 430 }),

      // Página 2 — datos de la clienta y detalle de la cotización
      { text: '', pageBreak: 'before' },
      topBand(ROSE),
      monograma('#FFFFFF', { y: 24 }),
      {
        text: [{ text: 'Fecha: ', color: MUTED }, { text: formatFecha(cotizacion.createdAt), color: INK }],
        alignment: 'right',
        fontSize: 10,
        margin: [0, 130, 0, 0],
      },
      scriptHeading('Datos Clienta'),
      {
        table: {
          widths: [140, '*'],
          body: [
            datoRow('Nombre', cotizacion.nombreClienta),
            datoRow('Correo', cotizacion.emailClienta),
            ...(cotizacion.telefonoClienta ? [datoRow('Teléfono', cotizacion.telefonoClienta)] : []),
            datoRow('Fecha evento', formatFecha(cotizacion.fechaEventoTentativa)),
            datoRow('Tipo clienta', TIPO_LABELS[cotizacion.tipo] || cotizacion.tipo),
          ],
        },
        layout: 'noBorders',
        margin: [0, 0, 0, 26],
      },
      scriptHeading('Cotización'),
      {
        table: {
          widths: ['*'],
          body: [
            [
              {
                fillColor: CARD_BG,
                margin: [16, 14, 16, 14],
                stack: [
                  {
                    text: 'Vestido a medida',
                    fillColor: LABEL_BG,
                    color: '#FFFFFF',
                    fontSize: 9.5,
                    margin: [10, 5, 10, 5],
                    bold: false,
                  },
                  { text: '', margin: [0, 6, 0, 0] },
                  ...descripcionItems,
                  { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 435, y2: 0, lineWidth: 0.5, lineColor: '#DDD5CC' }], margin: [0, 4, 0, 8] },
                  {
                    text: `Total: ${formatCLP(montoTotal)}`,
                    alignment: 'right',
                    bold: true,
                    fontSize: 11,
                  },
                ],
              },
            ],
          ],
        },
        layout: {
          hLineWidth: () => 0,
          vLineWidth: () => 0,
          paddingLeft: () => 0,
          paddingRight: () => 0,
          paddingTop: () => 0,
          paddingBottom: () => 0,
        },
      },
      cotizacion.notas ? { text: cotizacion.notas, fontSize: 9.5, color: MUTED, italics: true, margin: [0, 12, 0, 0] } : null,
      {
        text: `Esta cotización es válida hasta el ${formatFecha(fechaValidezHasta)}. Cualquier modificación o elemento adicional a lo indicado en la descripción significará un cambio en el valor del presupuesto.`,
        fontSize: 8.5,
        color: MUTED,
        absolutePosition: { x: 50, y: 760 },
      },

      // Página 3 — condiciones de pago
      { text: '', pageBreak: 'before' },
      topBand(ROSE),
      monograma('#FFFFFF', { y: 24 }),
      { text: 'Pago', font: 'GreatVibes', fontSize: 30, color: ROSE, margin: [0, 130, 0, 14] },
      {
        text: 'Los pagos se realizarán en el siguiente orden:',
        fontSize: 10,
        margin: [0, 0, 0, 8],
      },
      {
        ol: [
          { text: [{ text: 'Primera mitad (50%): ', bold: true }, 'Al aceptar la cotización.'] },
          { text: [{ text: 'Segunda mitad (50%): ', bold: true }, 'El día de la entrega, al finalizar el proceso.'] },
        ],
        fontSize: 10,
        margin: [0, 0, 0, 16],
      },
      {
        text: 'Una vez aceptada la cotización y realizado el primer pago, se iniciará el proceso de diseño regular, el cual considera:',
        fontSize: 10,
        margin: [0, 0, 0, 6],
      },
      {
        ul: ['Toma de medidas', 'Toile*', '4 o 5 pruebas', 'Entrega'],
        fontSize: 10,
        margin: [0, 0, 0, 16],
      },
      { text: 'Devoluciones', bold: true, fontSize: 10.5, margin: [0, 0, 0, 4] },
      { text: 'Una vez definido el diseño y comprada la tela, no se realizan devoluciones.', fontSize: 10 },
      { text: 'La reserva de cupo no tiene devolución.', fontSize: 10, margin: [0, 0, 0, 16] },
      {
        text: '*Al aprobar el toile, la clienta acepta el molde del vestido y se procede a cortar la tela original. Cualquier tipo de cambio que modifique el molde, significará un cambio en el presupuesto por la compra de más tela y trabajo realizado.',
        fontSize: 8.5,
        color: MUTED,
        absolutePosition: { x: 50, y: 760 },
      },

      // Página 4 — contraportada
      { text: '', pageBreak: 'before' },
      fullBleedRect(ROSE),
      monograma('#FFFFFF', { y: 300 }),
      wordmark('#FFFFFF', { y: 430 }),
      {
        text: 'Agustín del Castillo 2960, Vitacura',
        alignment: 'center',
        fontSize: 9,
        color: '#FFFFFF',
        absolutePosition: { x: 0, y: 745 },
      },
      {
        text: '@hatton.schultz',
        alignment: 'center',
        fontSize: 9,
        color: '#FFFFFF',
        absolutePosition: { x: 0, y: 762 },
      },
    ].filter(Boolean),
  };

  return pdfMake.createPdf(docDefinition).getBuffer();
}
