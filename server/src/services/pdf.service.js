import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pdfMake from 'pdfmake';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ASSETS_DIR = path.join(__dirname, '../assets');
const FONTS_DIR = path.join(ASSETS_DIR, 'fonts');

// Tipografía del original: Assistant. Light (peso 300) reproduce cómo se ve
// el texto de la plantilla; Bold para lo destacado.
pdfMake.setFonts({
  Assistant: {
    normal: path.join(FONTS_DIR, 'Assistant-Light.ttf'),
    bold: path.join(FONTS_DIR, 'Assistant-Bold.ttf'),
    italics: path.join(FONTS_DIR, 'Assistant-Light.ttf'),
    bolditalics: path.join(FONTS_DIR, 'Assistant-Bold.ttf'),
  },
});

function imagenDataUrl(relPath) {
  const buf = fs.readFileSync(path.join(ASSETS_DIR, relPath));
  return `data:image/png;base64,${buf.toString('base64')}`;
}

// Logo real y títulos caligráficos (Sloop Script) recortados de la plantilla
// original del taller ("PLANTILLA cotización.pdf"). Los títulos son imágenes
// porque la tipografía es de pago y su texto nunca cambia.
const IMG = {
  logoCompleto: imagenDataUrl('logo/logo-completo.png'),
  monograma: imagenDataUrl('logo/monograma.png'),
  tituloDatosClienta: imagenDataUrl('titulos/datos-clienta.png'),
  tituloCotizacion: imagenDataUrl('titulos/cotizacion.png'),
  tituloPago: imagenDataUrl('titulos/pago.png'),
};

// Paleta exacta de la plantilla original.
const ROSE = '#CEC6C3';
const SOFT_BG = '#FAF8F5';
const INK = '#000000';
const WHITE = '#FFFFFF';

// Tamaño carta, igual que la plantilla. Todas las coordenadas de abajo
// (en puntos) están medidas sobre el PDF original.
const PAGE_WIDTH = 612;
const PAGE_HEIGHT = 792;
const BAND_HEIGHT = 61.9;
const FONT_SIZE = 10;
const LINE_HEIGHT = 0.917; // da el interlineado de 12 pt del original

const TIPO_LABELS = {
  NOVIA: 'Novia',
  MADRINA: 'Madrina',
  INVITADA: 'Invitada',
  CIVIL: 'Civil',
};

function formatMonto(monto) {
  return new Intl.NumberFormat('es-CL', { maximumFractionDigits: 0 }).format(monto || 0);
}

function formatFecha(fecha) {
  if (!fecha) return '-';
  return new Intl.DateTimeFormat('es-CL', { dateStyle: 'long' }).format(new Date(fecha));
}

function rect(x, y, w, h, color) {
  return { canvas: [{ type: 'rect', x: 0, y: 0, w, h, color }], absolutePosition: { x, y } };
}

function hLine(x1, x2, y) {
  return {
    canvas: [{ type: 'line', x1: 0, y1: 0, x2: x2 - x1, y2: 0, lineWidth: 1, lineColor: ROSE }],
    absolutePosition: { x: x1, y },
  };
}

// Texto en una posición fija. `width` limita el ancho para que corte las
// líneas en el mismo lugar que el original.
function textAt(text, x, y, { width, ...opts } = {}) {
  return {
    absolutePosition: { x, y },
    columns: [{ width: width || PAGE_WIDTH - x, text, ...opts }],
  };
}

function imageAt(image, x, y, width) {
  return { image, width, absolutePosition: { x, y } };
}

function portada() {
  return [
    rect(0, 0, PAGE_WIDTH, PAGE_HEIGHT, ROSE),
    imageAt(IMG.logoCompleto, 154.1, 220.4, 303.8),
  ];
}

function franjaSuperior() {
  return [
    rect(0, 0, PAGE_WIDTH, BAND_HEIGHT, ROSE),
    imageAt(IMG.monograma, 284.6, 16.6, 38.3),
  ];
}

// Fila de "Datos Clienta": etiqueta rosada + valor en fondo claro, filas separadas.
function datoFila(label, value, y) {
  return [
    rect(41, y, 327.9, 19.3, SOFT_BG),
    rect(41, y, 95.6, 19.3, ROSE),
    textAt(label, 51.3, y + 2.7, { color: WHITE }),
    textAt(value || '-', 143.4, y + 2.7, { width: 222 }),
  ];
}

const NO_BORDERS_NO_PADDING = {
  hLineWidth: () => 0,
  vLineWidth: () => 0,
  paddingLeft: () => 0,
  paddingRight: () => 0,
  paddingTop: () => 0,
  paddingBottom: () => 0,
};

// Tarjeta de la cotización (fondo claro, etiqueta "Vestido a medida",
// descripción, línea y total). Fluye desde y=364 y crece si la descripción
// es larga; con poco texto mantiene la altura del original.
function tarjetaCotizacion(items, notas, montoTotal) {
  const descripciones = items.map((it) => ({
    text: (it.cantidad > 1 ? `(x${it.cantidad}) ` : '') + it.descripcion,
    margin: [0, 0, 0, 4],
  }));
  if (notas) descripciones.push({ text: notas, margin: [0, 4, 0, 0] });

  return {
    absolutePosition: { x: 40.2, y: 364 },
    table: {
      widths: [519.1],
      body: [
        [
          {
            fillColor: SOFT_BG,
            margin: [15.1, 20.3, 23.4, 36.3],
            stack: [
              // Etiqueta "Vestido a medida" con su recuadro rosado.
              {
                table: {
                  widths: [86.3],
                  heights: [19.3],
                  body: [[{ text: 'Vestido a medida', color: WHITE, fillColor: ROSE, margin: [6.2, 2.8, 0, 0] }]],
                },
                layout: NO_BORDERS_NO_PADDING,
              },
              // Descripción con altura mínima, para que la línea y el total
              // queden donde están en el original.
              {
                table: { widths: ['*'], heights: [72.6], body: [[{ stack: descripciones, margin: [0, 0, 0, 6] }]] },
                layout: NO_BORDERS_NO_PADDING,
                margin: [0, 9.3, 0, 0],
              },
              { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 480.6, y2: 0, lineWidth: 1, lineColor: ROSE }] },
              // "Total: $" parte siempre en x=451.65 como en la plantilla; el
              // monto sigue a la derecha (cabe hasta ~$999.999.999 dentro de la tarjeta).
              {
                text: [{ text: 'Total: $', bold: true }, formatMonto(montoTotal)],
                margin: [396.35, 9.5, 0, 0],
              },
            ],
          },
        ],
      ],
    },
    layout: NO_BORDERS_NO_PADDING,
  };
}

export function buildCotizacionPdf(cotizacion) {
  const items = cotizacion.items || [];
  const montoTotal = items.reduce((sum, it) => sum + it.cantidad * it.monto, 0);

  const docDefinition = {
    pageSize: 'LETTER',
    pageMargins: [0, 0, 0, 0],
    defaultStyle: {
      font: 'Assistant',
      fontSize: FONT_SIZE,
      color: INK,
      lineHeight: LINE_HEIGHT,
      // La plantilla no aplica kerning (cada letra va a su ancho natural).
      // Con kerning activo cada línea quedaba 1-3 pt más corta que el original.
      fontFeatures: { kern: false },
    },
    content: [
      // Página 1: portada
      ...portada(),

      // Página 2: datos de la clienta y cotización
      { text: '', pageBreak: 'before' },
      ...franjaSuperior(),
      textAt('Fecha:', 432.4, 87.9),
      textAt(formatFecha(cotizacion.createdAt), 466.0, 87.9),
      hLine(464.2, 569.3, 101.8),
      imageAt(IMG.tituloDatosClienta, 36.8, 149.0, 165.8),
      ...datoFila('Nombre', cotizacion.nombreClienta, 192.4),
      ...datoFila('Fecha matrimonio', formatFecha(cotizacion.fechaEventoTentativa), 219.5),
      ...datoFila('Tipo clienta', TIPO_LABELS[cotizacion.tipo] || cotizacion.tipo, 246.6),
      imageAt(IMG.tituloCotizacion, 36.9, 319.5, 109.9),
      tarjetaCotizacion(items, cotizacion.notas, montoTotal),
      textAt(
        'Cualquier modificación o elemento adicional a lo indicado en la descripción significará un cambio en el valor del presupuesto.',
        56,
        738.4,
      ),

      // Página 3: condiciones de pago
      { text: '', pageBreak: 'before' },
      ...franjaSuperior(),
      imageAt(IMG.tituloPago, 56.8, 95.9, 65.4),
      textAt('Los pagos se realizarán en el siguiente orden:', 60.1, 143.1),
      textAt(['1.  ', { text: 'Primera mitad (50%):', bold: true }, ' Al aceptar la cotización.'], 60.1, 167.1),
      textAt(['2. ', { text: 'Segunda mitad (50%):', bold: true }, ' El día de la entrega, al finalizar el proceso.'], 60.1, 179.1),
      textAt(
        'Una vez aceptada la cotización y realizado el primer pago, se iniciará el proceso de diseño regular, el cual considera:\n- Toma de medidas\n- Toile*\n- 4 o 5 pruebas\n- Entrega',
        60.1,
        235.6,
        { width: 500 },
      ),
      textAt(
        [
          { text: 'Devoluciones', bold: true },
          '\nUna vez definido el diseño y comprada la tela, no se realizan devoluciones.\nLa reserva de cupo no tiene devolución ($250.000).',
        ],
        60.1,
        311.4,
      ),
      textAt(
        '*Al aprobar el toile, la clienta acepta el molde del vestido y se procede a cortar la tela original. Cualquier tipo de cambio que modifique el molde, significará un cambio en el presupuesto por la compra de más tela y trabajo realizado.',
        45.1,
        734.8,
        { width: 488 },
      ),

      // Página 4: contraportada
      { text: '', pageBreak: 'before' },
      ...portada(),
      textAt('Agustín del Castillo 2960, Vitacura', 0, 704.2, { width: PAGE_WIDTH, alignment: 'center', color: WHITE }),
      textAt('@hatton.schultz', 0, 719.2, { width: PAGE_WIDTH, alignment: 'center', color: WHITE }),
    ],
  };

  return pdfMake.createPdf(docDefinition).getBuffer();
}
