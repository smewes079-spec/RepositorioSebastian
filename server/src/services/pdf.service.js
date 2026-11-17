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

// Márgenes de página para el contenido que fluye (la tarjeta de la
// cotización). Todo lo demás va en posiciones fijas medidas sobre la
// plantilla. Arriba deja libre la franja con el logo; abajo, la nota al pie.
const FLOW_TOP = 90;
const FLOW_BOTTOM = 56; // el contenido llega hasta y=736; la nota al pie parte en 738.4
const CARD_X = 40.2;
const CARD_Y = 364; // inicio de la tarjeta en la página 2, como en la plantilla
const CARD_WIDTH = 519.1;
const CARD_INNER = 480.6; // ancho útil dentro de la tarjeta (largo de la línea)
const PAD_L = 15.1;
const PAD_R = 23.4;
const PAD_TOP = 20.3;
const PAD_BOTTOM = 36.3;

function totalItem(it) {
  return (Number(it.cantidad) || 0) * (Number(it.monto) || 0);
}

// Etiqueta rosada con el título del ítem. El ancho se ajusta al texto; con
// "Vestido a medida" da exactamente los 86.3 pt de la plantilla.
function etiqueta(titulo) {
  return {
    table: {
      widths: ['auto'],
      heights: [19.3],
      body: [[{ text: titulo, noWrap: true, color: WHITE, fillColor: ROSE, margin: [6.2, 2.8, 9.8, 0] }]],
    },
    layout: NO_BORDERS_NO_PADDING,
  };
}

function lineaRosa(lineWidth = 1) {
  return { canvas: [{ type: 'line', x1: 0, y1: 0, x2: CARD_INNER, y2: 0, lineWidth, lineColor: ROSE }] };
}

function textoDescripcion(it) {
  const cantidad = Number(it.cantidad) > 1 ? `(x${it.cantidad}) ` : '';
  return `${cantidad}${it.descripcion || ''}`.trim();
}

function celda(stack, margin) {
  return { fillColor: SOFT_BG, margin, stack };
}

// Un solo ítem: replica la plantilla al milímetro (descripción con altura
// mínima, línea y "Total: $" en x=451.65).
function tarjetaUnItem(it, notas) {
  const descripciones = [];
  const texto = textoDescripcion(it);
  if (texto) descripciones.push({ text: texto, margin: [0, 0, 0, 4] });
  if (notas) descripciones.push({ text: notas, margin: [0, 4, 0, 0] });
  return [
    [
      celda(
        [
          etiqueta(it.titulo || 'Vestido a medida'),
          {
            table: { widths: ['*'], heights: [72.6], body: [[{ stack: descripciones, margin: [0, 0, 0, 6] }]] },
            layout: NO_BORDERS_NO_PADDING,
            margin: [0, 9.3, 0, 0],
          },
          lineaRosa(),
          {
            text: [{ text: 'Total: $', bold: true }, { text: formatMonto(totalItem(it)), bold: true }],
            margin: [396.35, 9.5, 0, 0],
          },
        ],
        [PAD_L, PAD_TOP, PAD_R, PAD_BOTTOM],
      ),
    ],
  ];
}

// Varios ítems: cada uno es un bloque (título, descripción, línea y su
// precio) y al final va el total de la cotización. Cada bloque es una fila
// que no se corta (unbreakable), así que si no caben todos en la página 2
// la tarjeta sigue en la página siguiente.
// Ojo: no usar dontBreakRows en la tabla; hace que el fondo de la tarjeta se
// dibuje encima de las etiquetas rosadas y las tape.
function tarjetaVariosItems(items, notas, montoTotal) {
  return items.map((it, i) => {
    const ultimo = i === items.length - 1;
    const stack = [];
    // Separación entre ítems como elemento real (no margen): así también se
    // respeta cuando el ítem queda arriba de una página nueva.
    if (i > 0) stack.push({ canvas: [{ type: 'rect', x: 0, y: 0, w: 1, h: 10, color: SOFT_BG }] });
    if (it.titulo) stack.push(etiqueta(it.titulo));
    const texto = textoDescripcion(it);
    if (texto) stack.push({ text: texto, margin: [0, it.titulo ? 7 : 0, 0, 0] });
    stack.push({ ...lineaRosa(), margin: [0, 6, 0, 0] });
    stack.push({
      text: [{ text: 'Total: $', bold: true }, { text: formatMonto(totalItem(it)), bold: true }],
      alignment: 'right',
      margin: [0, 5, 0, 0],
    });
    // El total de la cotización va pegado al último ítem, para que nunca
    // quede solo en una página nueva.
    if (ultimo) {
      if (notas) stack.push({ text: notas, margin: [0, 12, 0, 0] });
      stack.push({ ...lineaRosa(1.5), margin: [0, 9, 0, 0] });
      stack.push({
        text: [{ text: 'Total cotización: $', bold: true }, { text: formatMonto(montoTotal), bold: true }],
        alignment: 'right',
        fontSize: 11,
        margin: [0, 5, 0, 0],
      });
      // Espacio inferior como elemento real: un margen no cuenta al decidir
      // si el bloque cabe, y dejaba un trozo vacío de tarjeta en otra página.
      stack.push({ canvas: [{ type: 'rect', x: 0, y: 0, w: 1, h: 8, color: SOFT_BG }] });
    }
    // unbreakable: el bloque de un ítem nunca queda cortado entre dos páginas.
    return [celda([{ stack, unbreakable: true }], [PAD_L, i === 0 ? PAD_TOP : 0, PAD_R, 0])];
  });
}

function tarjetaCotizacion(items, notas, montoTotal) {
  const body =
    items.length <= 1
      ? tarjetaUnItem(items[0] || { titulo: '', descripcion: '', cantidad: 1, monto: 0 }, notas)
      : tarjetaVariosItems(items, notas, montoTotal);
  return {
    margin: [CARD_X, CARD_Y - FLOW_TOP, 0, 0],
    table: { widths: [CARD_WIDTH], body },
    layout: NO_BORDERS_NO_PADDING,
  };
}

// Salto de página sin ocupar espacio (un texto vacío correría el contenido).
function nuevaPagina() {
  return { canvas: [], pageBreak: 'before' };
}

// Nombre del archivo PDF = nombre de la clienta (ej. "María Schultz.pdf").
// Quita caracteres que Windows/Mac no permiten en nombres de archivo.
export function nombreArchivoCotizacion(cotizacion) {
  const limpio = String(cotizacion.nombreClienta || '')
    .replace(/[\\/:*?"<>|\u0000-\u001F]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/[. ]+$/, '');
  return `${limpio || 'Cotización'}.pdf`;
}

export function buildCotizacionPdf(cotizacion) {
  const items = cotizacion.items || [];
  const montoTotal = items.reduce((sum, it) => sum + it.cantidad * it.monto, 0);

  const docDefinition = {
    // Título del documento = nombre de la clienta (lo muestra la pestaña del navegador).
    info: { title: nombreArchivoCotizacion(cotizacion).replace(/\.pdf$/, ''), author: 'Hatton Schultz Atelier' },
    pageSize: 'LETTER',
    pageMargins: [0, FLOW_TOP, 0, FLOW_BOTTOM],
    // Si la tarjeta de la cotización ocupa más de una página, las páginas
    // extra llevan la misma franja con el logo (la 2 y la de Pago ya la traen).
    header: (pagina, totalPaginas) =>
      pagina > 2 && pagina < totalPaginas - 1 ? franjaSuperior() : null,
    // Notas al pie en sus posiciones de la plantilla. Van como pie de página
    // porque caen en la zona inferior reservada (y no deben empujar el flujo).
    // Páginas: 1 portada · 2..n-2 cotización · n-1 pago · n contraportada.
    footer: (pagina, totalPaginas) => {
      // El pie empieza en y = alto de página - FLOW_BOTTOM; se ubica con márgenes.
      const pieEn = (texto, x, y, width) => ({
        text: texto,
        margin: [x, y - (PAGE_HEIGHT - FLOW_BOTTOM), 0, 0],
        width,
      });
      if (pagina === totalPaginas - 2) {
        return pieEn(
          'Cualquier modificación o elemento adicional a lo indicado en la descripción significará un cambio en el valor del presupuesto.',
          56,
          738.4,
        );
      }
      if (pagina === totalPaginas - 1) {
        return {
          columns: [
            {
              width: 488,
              text: '*Al aprobar el toile, la clienta acepta el molde del vestido y se procede a cortar la tela original. Cualquier tipo de cambio que modifique el molde, significará un cambio en el presupuesto por la compra de más tela y trabajo realizado.',
            },
          ],
          margin: [45.1, 734.8 - (PAGE_HEIGHT - FLOW_BOTTOM), 0, 0],
        };
      }
      if (pagina === totalPaginas) {
        // Contraportada: dirección y redes en blanco, centradas.
        return {
          text: 'Agustín del Castillo 2960, Vitacura\n@hatton.schultz',
          alignment: 'center',
          color: WHITE,
          lineHeight: 15 / 12 * LINE_HEIGHT,
          margin: [0, 704.2 - (PAGE_HEIGHT - FLOW_BOTTOM), 0, 0],
        };
      }
      return null;
    },
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
      nuevaPagina(),
      ...franjaSuperior(),
      textAt('Fecha:', 432.4, 87.9),
      textAt(formatFecha(cotizacion.createdAt), 466.0, 87.9),
      hLine(464.2, 569.3, 101.8),
      imageAt(IMG.tituloDatosClienta, 36.8, 149.0, 165.8),
      ...datoFila('Nombre', cotizacion.nombreClienta, 192.4),
      ...datoFila('Fecha matrimonio', formatFecha(cotizacion.fechaEventoTentativa), 219.5),
      ...datoFila('Tipo clienta', TIPO_LABELS[cotizacion.tipo] || cotizacion.tipo, 246.6),
      imageAt(IMG.tituloCotizacion, 36.9, 319.5, 109.9),
      // La tarjeta misma marca el salto a la página de Pago (pageBreak
      // 'after'): si llega justo al borde inferior, un salto aparte dejaba
      // una página en blanco.
      { ...tarjetaCotizacion(items, cotizacion.notas, montoTotal), pageBreak: 'after' },

      // Página 3: condiciones de pago
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

      // Página 4: contraportada
      nuevaPagina(),
      ...portada(),
    ],
  };

  return pdfMake.createPdf(docDefinition).getBuffer();
}
