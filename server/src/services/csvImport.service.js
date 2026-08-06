import { parse } from 'csv-parse/sync';
import { prisma } from '../lib/prisma.js';

const MESES = {
  ene: 0, feb: 1, mar: 2, abr: 3, may: 4, jun: 5,
  jul: 6, ago: 7, sep: 8, set: 8, oct: 9, nov: 10, dic: 11,
};

const TIPO_MAP = {
  novia: 'NOVIA',
  madrina: 'MADRINA',
  invitada: 'INVITADA',
  civil: 'CIVIL',
};

const ESTADO_MAP = {
  'no entregado': 'NO_ENTREGADO',
  entregado: 'ENTREGADO',
  pendiente: 'NO_ENTREGADO',
};

function normalize(str) {
  return String(str ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

export function parseMonto(value) {
  if (value === null || value === undefined) return 0;
  const str = String(value).trim();
  if (!str) return 0;
  const negative = str.includes('-');
  const digits = str.replace(/[^0-9]/g, '');
  if (!digits) return 0;
  const num = parseInt(digits, 10);
  return negative ? -num : num;
}

export function parseFecha(value) {
  if (!value) return null;
  const str = String(value).trim();
  if (!str) return null;

  // ISO: YYYY-MM-DD
  let m = str.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) return new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));

  // DD-MMM-YY o DD-MMM-YYYY (ej: 04-Ago-26)
  m = str.match(/^(\d{1,2})[-/]([a-zA-Z]+)[-/](\d{2,4})$/);
  if (m) {
    const mes = MESES[normalize(m[2]).slice(0, 3)];
    if (mes === undefined) return null;
    let year = parseInt(m[3], 10);
    if (year < 100) year += 2000;
    return new Date(Date.UTC(year, mes, parseInt(m[1], 10)));
  }

  // DD/MM/YYYY o DD-MM-YYYY
  m = str.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})$/);
  if (m) {
    let year = parseInt(m[3], 10);
    if (year < 100) year += 2000;
    return new Date(Date.UTC(year, parseInt(m[2], 10) - 1, parseInt(m[1], 10)));
  }

  const asDate = new Date(str);
  if (!isNaN(asDate.getTime())) return asDate;

  return null;
}

function parseTipo(value) {
  return TIPO_MAP[normalize(value)] || null;
}

function parseEstado(value) {
  return ESTADO_MAP[normalize(value)] || 'NO_ENTREGADO';
}

function getField(row, ...names) {
  for (const name of names) {
    for (const key of Object.keys(row)) {
      if (normalize(key) === normalize(name)) return row[key];
    }
  }
  return undefined;
}

export async function importVentasCsv(csvText) {
  const rows = parse(csvText, {
    columns: true,
    trim: true,
    skip_empty_lines: true,
    bom: true,
    relax_column_count: true,
  });

  const creadas = [];
  const actualizadas = [];
  const errores = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const lineNum = i + 2; // considerando encabezado
    try {
      const codigo = getField(row, 'CODIGO', 'CÓDIGO');
      const nombreClienta = getField(row, 'NOMBRE CLIENTA', 'CLIENTA', 'NOMBRE');
      const tipoRaw = getField(row, 'TIPO');
      const estadoRaw = getField(row, 'ESTADO');
      const fechaVentaRaw = getField(row, 'FECHA VENTA');
      const fechaEventoRaw = getField(row, 'FECHA EVENTO');
      const totalVentaRaw = getField(row, 'TOTAL VENTA');

      if (!codigo || !nombreClienta) {
        errores.push({ linea: lineNum, error: 'Falta código o nombre de clienta' });
        continue;
      }

      const tipo = parseTipo(tipoRaw);
      if (!tipo) {
        errores.push({ linea: lineNum, error: `Tipo de vestido inválido: "${tipoRaw}"` });
        continue;
      }

      const fechaVenta = parseFecha(fechaVentaRaw);
      const fechaEvento = parseFecha(fechaEventoRaw) || fechaVenta;
      if (!fechaVenta) {
        errores.push({ linea: lineNum, error: `Fecha de venta inválida: "${fechaVentaRaw}"` });
        continue;
      }

      const precioTotal = parseMonto(totalVentaRaw);

      const cuotas = [];
      for (const n of [1, 2, 3]) {
        const montoRaw = getField(row, `PAGO ${n}`);
        const fechaRaw = n === 1 ? getField(row, 'FECHA') : getField(row, `FECHA ${n}`);
        const monto = parseMonto(montoRaw);
        if (monto > 0) {
          const fechaPago = parseFecha(fechaRaw) || fechaVenta;
          cuotas.push({
            numero: cuotas.length + 1,
            monto,
            fechaProgramada: fechaPago.toISOString(),
            pagada: true,
            fechaPago: fechaPago.toISOString(),
            montoPagado: monto,
          });
        }
      }

      const data = {
        codigo: String(codigo).trim(),
        nombreClienta: String(nombreClienta).trim(),
        tipo,
        estado: parseEstado(estadoRaw),
        fechaVenta: fechaVenta.toISOString(),
        fechaEvento: fechaEvento.toISOString(),
        precioTotal,
        kanbanEstado: parseEstado(estadoRaw) === 'ENTREGADO' ? 'ENTREGADO' : 'PENDIENTE',
        cuotas,
      };

      const existente = await prisma.venta.findUnique({ where: { codigo: data.codigo } });
      if (existente) {
        await prisma.cuota.deleteMany({ where: { ventaId: existente.id } });
        await prisma.venta.update({
          where: { id: existente.id },
          data: {
            nombreClienta: data.nombreClienta,
            tipo: data.tipo,
            estado: data.estado,
            fechaVenta: data.fechaVenta,
            fechaEvento: data.fechaEvento,
            precioTotal: data.precioTotal,
            kanbanEstado: data.kanbanEstado,
            cuotas: { create: cuotas.map(({ ...c }) => c) },
          },
        });
        actualizadas.push(data.codigo);
      } else {
        await prisma.venta.create({
          data: {
            ...data,
            cuotas: { create: cuotas },
          },
        });
        creadas.push(data.codigo);
      }
    } catch (err) {
      errores.push({ linea: lineNum, error: err.message });
    }
  }

  return {
    totalFilas: rows.length,
    creadas: creadas.length,
    actualizadas: actualizadas.length,
    errores,
  };
}
