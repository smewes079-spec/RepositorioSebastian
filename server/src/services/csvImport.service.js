import { prisma } from '../lib/prisma.js';
import { parseArchivoRows } from '../lib/fileRows.js';
import { normalize, parseMonto, parseFecha, getField } from '../lib/parseUtils.js';

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

function parseTipo(value) {
  return TIPO_MAP[normalize(value)] || null;
}

function parseEstado(value) {
  return ESTADO_MAP[normalize(value)] || 'NO_ENTREGADO';
}

export const parseArchivoVentas = parseArchivoRows;

export async function importVentasRows(rows) {
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
