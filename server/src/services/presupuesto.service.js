import { prisma } from '../lib/prisma.js';
import { monthKey, monthRangeKeys, addMonths } from '../lib/monthUtils.js';

function mesToDate(mes) {
  // Acepta "YYYY-MM" o una fecha completa; siempre normaliza al día 1 del mes en UTC.
  const [y, m] = String(mes).slice(0, 7).split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, 1));
}

async function assertMesSinReales(mesKey, excludeId) {
  const ventas = await prisma.venta.findMany({ select: { fechaVenta: true } });
  const tieneReales = ventas.some((v) => monthKey(v.fechaVenta) === mesKey);
  if (tieneReales) {
    const err = new Error(
      `El mes ${mesKey} ya tiene ventas reales registradas y no puede tener presupuesto.`
    );
    err.status = 409;
    throw err;
  }
}

export async function listPresupuesto() {
  const [presupuestos, ventas] = await Promise.all([
    prisma.presupuestoVenta.findMany({
      include: { cuotas: { orderBy: { numero: 'asc' } } },
      orderBy: [{ mes: 'asc' }, { tipo: 'asc' }],
    }),
    prisma.venta.findMany({ select: { fechaVenta: true } }),
  ]);

  const mesesConReales = [...new Set(ventas.map((v) => monthKey(v.fechaVenta)))].sort();

  return { presupuestos, mesesConReales };
}

export async function createPresupuesto(data) {
  const mes = mesToDate(data.mes);
  const mesKey = monthKey(mes);
  await assertMesSinReales(mesKey);

  const cuotas = Array.isArray(data.cuotas) ? data.cuotas : [];

  return prisma.presupuestoVenta.create({
    data: {
      tipo: data.tipo,
      mes,
      cantidad: Number(data.cantidad ?? 0),
      montoTotal: Number(data.montoTotal ?? 0),
      cuotas: {
        create: cuotas.map((c, i) => ({
          numero: c.numero ?? i + 1,
          monto: Number(c.monto),
          fecha: new Date(c.fecha),
        })),
      },
    },
    include: { cuotas: { orderBy: { numero: 'asc' } } },
  });
}

export async function updatePresupuesto(id, data) {
  const existente = await prisma.presupuestoVenta.findUnique({ where: { id } });
  if (!existente) {
    const err = new Error('Presupuesto no encontrado');
    err.status = 404;
    throw err;
  }

  const mes = data.mes !== undefined ? mesToDate(data.mes) : existente.mes;
  const mesKey = monthKey(mes);
  if (data.mes !== undefined && mesKey !== monthKey(existente.mes)) {
    await assertMesSinReales(mesKey);
  }

  const updateData = {
    ...(data.tipo !== undefined && { tipo: data.tipo }),
    ...(data.mes !== undefined && { mes }),
    ...(data.cantidad !== undefined && { cantidad: Number(data.cantidad) }),
    ...(data.montoTotal !== undefined && { montoTotal: Number(data.montoTotal) }),
  };

  if (Array.isArray(data.cuotas)) {
    await prisma.presupuestoCuota.deleteMany({ where: { presupuestoVentaId: id } });
    updateData.cuotas = {
      create: data.cuotas.map((c, i) => ({
        numero: c.numero ?? i + 1,
        monto: Number(c.monto),
        fecha: new Date(c.fecha),
      })),
    };
  }

  return prisma.presupuestoVenta.update({
    where: { id },
    data: updateData,
    include: { cuotas: { orderBy: { numero: 'asc' } } },
  });
}

export async function deletePresupuesto(id) {
  await prisma.presupuestoVenta.delete({ where: { id } });
}

// Proyección automática: promedio real de ventas de ese tipo en los meses
// anteriores al mes objetivo con datos disponibles (desde la primera venta
// registrada). Cuenta 0 en los meses sin ventas de ese tipo, para que el
// promedio refleje la frecuencia real y no solo los meses buenos.
export async function sugerirProyeccion(tipo, mesObjetivo) {
  const ventas = await prisma.venta.findMany({ select: { fechaVenta: true, tipo: true, precioTotal: true } });
  if (ventas.length === 0) return null;

  const mesObjetivoKey = mesObjetivo.slice(0, 7);
  const primerMesKey = ventas.map((v) => monthKey(v.fechaVenta)).sort()[0];
  const ultimoMesKey = addMonths(mesObjetivoKey, -1);

  if (ultimoMesKey < primerMesKey) return null;

  const meses = monthRangeKeys(primerMesKey, ultimoMesKey);

  let totalCantidad = 0;
  let totalMonto = 0;
  for (const mesKey of meses) {
    const ventasDelMesTipo = ventas.filter((v) => monthKey(v.fechaVenta) === mesKey && v.tipo === tipo);
    totalCantidad += ventasDelMesTipo.length;
    totalMonto += ventasDelMesTipo.reduce((s, v) => s + v.precioTotal, 0);
  }

  return {
    cantidadSugerida: Math.round(totalCantidad / meses.length),
    montoSugerido: Math.round(totalMonto / meses.length),
    mesesAnalizados: meses.length,
    primerMes: meses[0],
    ultimoMes: meses[meses.length - 1],
  };
}
