import pdfMake from 'pdfmake';
import Helvetica from 'pdfmake/standard-fonts/Helvetica.js';

pdfMake.setFonts(Helvetica);

const INK = '#2C2420';
const GOLD = '#C9A96E';
const ROSE = '#CEC6C3';

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

// Monograma "H" en un círculo, dibujado a mano para no depender de un
// archivo de logo (la marca hoy solo existe como texto en el frontend).
function monogramaSvg() {
  return {
    svg: `<svg width="60" height="60" xmlns="http://www.w3.org/2000/svg">
      <circle cx="30" cy="30" r="30" fill="${ROSE}" />
      <text x="30" y="40" font-family="Georgia, serif" font-size="28" font-weight="600" fill="#FFFFFF" text-anchor="middle">H</text>
    </svg>`,
    width: 44,
    height: 44,
  };
}

export function buildCotizacionPdf(cotizacion) {
  const items = cotizacion.items || [];
  const montoTotal = items.reduce((sum, it) => sum + it.cantidad * it.monto, 0);
  const fechaValidezHasta = new Date(cotizacion.createdAt);
  fechaValidezHasta.setDate(fechaValidezHasta.getDate() + (cotizacion.validezDias || 15));

  const itemsBody = [
    [
      { text: 'Descripción', style: 'tableHeader' },
      { text: 'Cantidad', style: 'tableHeader', alignment: 'center' },
      { text: 'Monto', style: 'tableHeader', alignment: 'right' },
      { text: 'Subtotal', style: 'tableHeader', alignment: 'right' },
    ],
    ...items.map((it) => [
      { text: it.descripcion, style: 'tableCell' },
      { text: String(it.cantidad), style: 'tableCell', alignment: 'center' },
      { text: formatCLP(it.monto), style: 'tableCell', alignment: 'right' },
      { text: formatCLP(it.cantidad * it.monto), style: 'tableCell', alignment: 'right' },
    ]),
  ];

  const docDefinition = {
    pageSize: 'A4',
    pageMargins: [40, 40, 40, 50],
    defaultStyle: { font: 'Helvetica', fontSize: 10, color: INK },
    styles: {
      brand: { fontSize: 16, bold: true, color: INK },
      tagline: { fontSize: 8, color: '#8A7E76', italics: true },
      title: { fontSize: 20, bold: true, color: INK, margin: [0, 20, 0, 4] },
      subtitle: { fontSize: 9, color: '#8A7E76' },
      sectionLabel: { fontSize: 8, bold: true, color: '#8A7E76' },
      value: { fontSize: 10, color: INK, margin: [0, 1, 0, 8] },
      tableHeader: { fontSize: 9, bold: true, color: '#FFFFFF', fillColor: INK },
      tableCell: { fontSize: 9.5, color: INK },
      totalLabel: { fontSize: 11, bold: true, color: INK },
      totalValue: { fontSize: 13, bold: true, color: INK },
      footer: { fontSize: 8, color: '#8A7E76' },
    },
    content: [
      {
        columns: [
          monogramaSvg(),
          {
            width: '*',
            margin: [10, 2, 0, 0],
            stack: [
              { text: 'HATTON SCHULTZ NOVIAS', style: 'brand' },
              { text: 'Vestidos de novia a medida', style: 'tagline' },
            ],
          },
          {
            width: 'auto',
            alignment: 'right',
            stack: [
              { text: `N° ${cotizacion.id.slice(-8).toUpperCase()}`, style: 'subtitle' },
              { text: formatFecha(cotizacion.createdAt), style: 'subtitle' },
            ],
          },
        ],
      },
      { canvas: [{ type: 'line', x1: 0, y1: 0, x2: 515, y2: 0, lineWidth: 1, lineColor: GOLD }], margin: [0, 10, 0, 0] },
      { text: 'COTIZACIÓN', style: 'title' },
      {
        columns: [
          {
            width: '50%',
            stack: [
              { text: 'CLIENTA', style: 'sectionLabel' },
              { text: cotizacion.nombreClienta, style: 'value' },
              { text: 'CONTACTO', style: 'sectionLabel' },
              {
                text: [cotizacion.emailClienta, cotizacion.telefonoClienta].filter(Boolean).join('  ·  '),
                style: 'value',
              },
            ],
          },
          {
            width: '50%',
            stack: [
              { text: 'TIPO DE VESTIDO', style: 'sectionLabel' },
              { text: TIPO_LABELS[cotizacion.tipo] || cotizacion.tipo, style: 'value' },
              { text: 'FECHA TENTATIVA DEL EVENTO', style: 'sectionLabel' },
              { text: formatFecha(cotizacion.fechaEventoTentativa), style: 'value' },
            ],
          },
        ],
      },
      {
        table: { headerRows: 1, widths: ['*', 60, 90, 90], body: itemsBody },
        layout: {
          hLineWidth: (i) => (i === 1 ? 1 : 0.5),
          vLineWidth: () => 0,
          hLineColor: () => '#E5DFD8',
          paddingTop: () => 6,
          paddingBottom: () => 6,
        },
        margin: [0, 6, 0, 0],
      },
      {
        columns: [
          { width: '*', text: '' },
          {
            width: 'auto',
            table: {
              body: [
                [
                  { text: 'TOTAL', style: 'totalLabel', border: [false, true, false, false] },
                  { text: formatCLP(montoTotal), style: 'totalValue', alignment: 'right', border: [false, true, false, false] },
                ],
              ],
            },
            layout: { hLineColor: () => GOLD, hLineWidth: () => 1.5 },
            margin: [0, 8, 0, 0],
          },
        ],
      },
      cotizacion.notas
        ? { text: 'NOTAS', style: 'sectionLabel', margin: [0, 18, 0, 0] }
        : null,
      cotizacion.notas ? { text: cotizacion.notas, style: 'value' } : null,
      {
        text: `Esta cotización es válida hasta el ${formatFecha(fechaValidezHasta)} (${cotizacion.validezDias} días desde su emisión).`,
        style: 'footer',
        margin: [0, 24, 0, 0],
      },
    ].filter(Boolean),
    footer: (currentPage, pageCount) => ({
      columns: [
        { text: 'Hatton Schultz Novias', style: 'footer', margin: [40, 0, 0, 0] },
        { text: `${currentPage} / ${pageCount}`, style: 'footer', alignment: 'right', margin: [0, 0, 40, 0] },
      ],
    }),
  };

  return pdfMake.createPdf(docDefinition).getBuffer();
}
