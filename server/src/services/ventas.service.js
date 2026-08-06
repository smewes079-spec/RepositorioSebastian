import { prisma } from '../lib/prisma.js';

const TIPOS = ['NOVIA', 'MADRINA', 'INVITADA', 'CIVIL'];

function withComputed(venta) {
  const totalPagado = venta.cuotas
    .filter((c) => c.pagada)
    .reduce((sum, c) => sum + (c.montoPagado ?? c.monto), 0);
  const saldoPendiente = venta.precioTotal - totalPagado;
  const porcentajeCobrado = venta.precioTotal > 0 ? Math.round((totalPagado / venta.precioTotal) * 1000) / 10 : 0;
  return { ...venta, totalPagado, saldoPendiente, porcentajeCobrado };
}

function monthRange(monthStr) {
  // monthStr = "YYYY-MM"
  const [y, m] = monthStr.split('-').map(Number);
  const start = new Date(Date.UTC(y, m - 1, 1));
  const end = new Date(Date.UTC(y, m, 1));
  return { start, end };
}

export async function listVentas(filters = {}) {
  const where = {};
  if (filters.tipo) where.tipo = filters.tipo;
  if (filters.estado) where.estado = filters.estado;
  if (filters.mesVenta) {
    const { start, end } = monthRange(filters.mesVenta);
    where.fechaVenta = { gte: start, lt: end };
  }
  if (filters.mesEvento) {
    const { start, end } = monthRange(filters.mesEvento);
    where.fechaEvento = { gte: start, lt: end };
  }
  if (filters.search) {
    where.OR = [
      { nombreClienta: { contains: filters.search, mode: 'insensitive' } },
      { codigo: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  const ventas = await prisma.venta.findMany({
    where,
    include: { cuotas: { orderBy: { numero: 'asc' } } },
    orderBy: { fechaVenta: 'desc' },
  });

  return ventas.map(withComputed);
}

export async function getVenta(id) {
  const venta = await prisma.venta.findUnique({
    where: { id },
    include: { cuotas: { orderBy: { numero: 'asc' } } },
  });
  if (!venta) return null;
  return withComputed(venta);
}

export async function createVenta(data) {
  const { cuotas = [], ...ventaData } = data;
  const venta = await prisma.venta.create({
    data: {
      ...ventaData,
      fechaVenta: new Date(ventaData.fechaVenta),
      fechaEvento: new Date(ventaData.fechaEvento),
      cuotas: {
        create: cuotas.map((c, idx) => ({
          numero: c.numero ?? idx + 1,
          monto: c.monto,
          fechaProgramada: new Date(c.fechaProgramada),
          pagada: !!c.pagada,
          fechaPago: c.fechaPago ? new Date(c.fechaPago) : null,
          montoPagado: c.pagada ? (c.montoPagado ?? c.monto) : null,
        })),
      },
    },
    include: { cuotas: { orderBy: { numero: 'asc' } } },
  });
  return withComputed(venta);
}

export async function updateVenta(id, data) {
  const { cuotas, ...ventaData } = data;
  const updateData = { ...ventaData };
  if (ventaData.fechaVenta) updateData.fechaVenta = new Date(ventaData.fechaVenta);
  if (ventaData.fechaEvento) updateData.fechaEvento = new Date(ventaData.fechaEvento);

  if (ventaData.estado) {
    const previa = await prisma.venta.findUnique({ where: { id }, select: { estado: true } });
    if (ventaData.estado === 'ENTREGADO' && previa?.estado !== 'ENTREGADO') {
      updateData.fechaEntrega = new Date();
    } else if (ventaData.estado === 'NO_ENTREGADO') {
      updateData.fechaEntrega = null;
    }
  }

  await prisma.$transaction(async (tx) => {
    await tx.venta.update({ where: { id }, data: updateData });

    if (Array.isArray(cuotas)) {
      const existing = await tx.cuota.findMany({ where: { ventaId: id } });
      const incomingIds = cuotas.filter((c) => c.id).map((c) => c.id);
      const toDelete = existing.filter((c) => !incomingIds.includes(c.id));
      if (toDelete.length) {
        await tx.cuota.deleteMany({ where: { id: { in: toDelete.map((c) => c.id) } } });
      }
      for (let idx = 0; idx < cuotas.length; idx++) {
        const c = cuotas[idx];
        const payload = {
          numero: c.numero ?? idx + 1,
          monto: c.monto,
          fechaProgramada: new Date(c.fechaProgramada),
          pagada: !!c.pagada,
          fechaPago: c.pagada && c.fechaPago ? new Date(c.fechaPago) : null,
          montoPagado: c.pagada ? (c.montoPagado ?? c.monto) : null,
        };
        if (c.id) {
          await tx.cuota.update({ where: { id: c.id }, data: payload });
        } else {
          await tx.cuota.create({ data: { ...payload, ventaId: id } });
        }
      }
    }
  });

  return getVenta(id);
}

export async function deleteVenta(id) {
  await prisma.venta.delete({ where: { id } });
}

export async function moveKanban(id, kanbanEstado) {
  const data = { kanbanEstado };
  if (kanbanEstado === 'ENTREGADO') {
    const previa = await prisma.venta.findUnique({ where: { id }, select: { estado: true } });
    data.estado = 'ENTREGADO';
    if (previa?.estado !== 'ENTREGADO') data.fechaEntrega = new Date();
  }
  const venta = await prisma.venta.update({
    where: { id },
    data,
    include: { cuotas: { orderBy: { numero: 'asc' } } },
  });
  return withComputed(venta);
}

export async function resumen(filters = {}) {
  const ventas = await listVentas(filters);
  const totalVendido = ventas.reduce((s, v) => s + v.precioTotal, 0);
  const totalCobrado = ventas.reduce((s, v) => s + v.totalPagado, 0);
  const totalPorCobrar = ventas.reduce((s, v) => s + v.saldoPendiente, 0);
  const cantidadPorTipo = TIPOS.reduce((acc, t) => {
    acc[t] = ventas.filter((v) => v.tipo === t).length;
    return acc;
  }, {});
  return {
    totalVendido,
    totalCobrado,
    totalPorCobrar,
    cantidadVentas: ventas.length,
    cantidadPorTipo,
  };
}
