import { prisma } from '../lib/prisma.js';

function monthRange(monthStr) {
  const [y, m] = monthStr.split('-').map(Number);
  const start = new Date(Date.UTC(y, m - 1, 1));
  const end = new Date(Date.UTC(y, m, 1));
  return { start, end };
}

// Reparte un monto entero entre n partes de forma exacta (sin perder pesos por redondeo).
function distribuirExacto(monto, n) {
  if (n <= 0) return [];
  const base = Math.floor(monto / n);
  const resto = monto - base * n;
  return Array.from({ length: n }, (_, i) => base + (i < resto ? 1 : 0));
}

async function computeAssignments(data) {
  if (data.tipoAsignacion === 'DIRECTO') {
    if (!data.ventaId) throw new Error('Debes seleccionar una venta para la asignación directa');
    const venta = await prisma.venta.findUnique({ where: { id: data.ventaId } });
    if (!venta) throw new Error('La venta seleccionada no existe');
    return [{ ventaId: data.ventaId, montoAsignado: data.montoTotal }];
  }

  if (data.tipoAsignacion === 'PRORRATEO') {
    // Si viene una lista explícita de vestidos (elegida a mano en el formulario),
    // se prorratea solo entre esos. Si no viene (ej. import de Excel/CSV), se
    // mantiene el comportamiento anterior: todos los vestidos "No entregado".
    const ventaIds = Array.isArray(data.ventaIds) ? data.ventaIds.filter(Boolean) : null;
    if (ventaIds && ventaIds.length === 0) {
      throw new Error('Selecciona al menos un vestido para prorratear el costo');
    }
    const ventasActivas = ventaIds
      ? await prisma.venta.findMany({ where: { id: { in: ventaIds } } })
      : await prisma.venta.findMany({ where: { estado: 'NO_ENTREGADO' } });
    if (ventaIds && ventasActivas.length === 0) {
      throw new Error('Ninguno de los vestidos seleccionados existe');
    }
    const montos = distribuirExacto(data.montoTotal, ventasActivas.length);
    return ventasActivas.map((venta, idx) => ({ ventaId: venta.id, montoAsignado: montos[idx] }));
  }

  throw new Error('Tipo de asignación inválido');
}

function baseData(data) {
  return {
    fecha: new Date(data.fecha),
    categoria: data.categoria,
    descripcion: data.descripcion,
    montoTotal: Number(data.montoTotal),
    tipoAsignacion: data.tipoAsignacion,
  };
}

export async function listPurchases(filters = {}) {
  const where = {};
  if (filters.categoria) where.categoria = filters.categoria;
  if (filters.tipoAsignacion) where.tipoAsignacion = filters.tipoAsignacion;
  if (filters.mesCompra) {
    const { start, end } = monthRange(filters.mesCompra);
    where.fecha = { gte: start, lt: end };
  }

  const purchases = await prisma.purchase.findMany({
    where,
    include: { asignaciones: { include: { venta: true } } },
    orderBy: { fecha: 'desc' },
  });

  return purchases.map((p) => ({
    ...p,
    montoAsignadoTotal: p.asignaciones.reduce((s, a) => s + a.montoAsignado, 0),
    cantidadVestidosAsignados: p.asignaciones.length,
  }));
}

export async function getPurchase(id) {
  const purchase = await prisma.purchase.findUnique({
    where: { id },
    include: { asignaciones: { include: { venta: true } } },
  });
  if (!purchase) return null;
  return {
    ...purchase,
    montoAsignadoTotal: purchase.asignaciones.reduce((s, a) => s + a.montoAsignado, 0),
  };
}

export async function createPurchase(data) {
  const asignaciones = await computeAssignments({ ...data, montoTotal: Number(data.montoTotal) });

  return prisma.purchase.create({
    data: {
      ...baseData(data),
      asignaciones: { create: asignaciones },
    },
    include: { asignaciones: { include: { venta: true } } },
  });
}

export async function updatePurchase(id, data) {
  const existente = await prisma.purchase.findUnique({
    where: { id },
    include: { asignaciones: true },
  });
  if (!existente) {
    const err = new Error('Compra no encontrada');
    err.status = 404;
    throw err;
  }

  // Los campos que no vengan en `data` se completan con los valores actuales,
  // para que una edición parcial (ej. solo cambiar la categoría) no borre el
  // resto de la compra ni la reasignación a vestidos.
  const merged = {
    ...existente,
    ventaId: existente.asignaciones[0]?.ventaId,
    ventaIds: existente.asignaciones.map((a) => a.ventaId),
    ...data,
  };

  const asignaciones = await computeAssignments({ ...merged, montoTotal: Number(merged.montoTotal) });

  return prisma.$transaction(async (tx) => {
    await tx.purchaseAssignment.deleteMany({ where: { purchaseId: id } });
    return tx.purchase.update({
      where: { id },
      data: {
        ...baseData(merged),
        asignaciones: { create: asignaciones },
      },
      include: { asignaciones: { include: { venta: true } } },
    });
  });
}

export async function deletePurchase(id) {
  await prisma.purchase.delete({ where: { id } });
}

export async function resumen(filters = {}) {
  const purchases = await listPurchases(filters);
  const totalGeneral = purchases.reduce((s, p) => s + p.montoTotal, 0);

  const porCategoria = {};
  for (const p of purchases) {
    porCategoria[p.categoria] = (porCategoria[p.categoria] || 0) + p.montoTotal;
  }

  const porMes = {};
  for (const p of purchases) {
    const d = new Date(p.fecha);
    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
    porMes[key] = (porMes[key] || 0) + p.montoTotal;
  }

  return { totalGeneral, cantidadCompras: purchases.length, porCategoria, porMes };
}
