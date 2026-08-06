import { prisma } from '../lib/prisma.js';

const TIPOS = ['NOVIA', 'MADRINA', 'INVITADA', 'CIVIL'];
const CONSUMO_FIELD = {
  NOVIA: 'consumoNovia',
  MADRINA: 'consumoMadrina',
  INVITADA: 'consumoInvitada',
  CIVIL: 'consumoCivil',
};

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

  if (data.tipoAsignacion === 'CONSUMO_ESTIMADO') {
    const cantidad = Number(data.cantidadComprada);
    if (!cantidad || cantidad <= 0) {
      throw new Error('La cantidad comprada debe ser mayor a 0 para calcular el costo unitario');
    }
    const costoUnitario = data.montoTotal / cantidad;
    const ventasActivas = await prisma.venta.findMany({ where: { estado: 'NO_ENTREGADO' } });

    const asignaciones = [];
    for (const venta of ventasActivas) {
      const consumo = Number(data[CONSUMO_FIELD[venta.tipo]] || 0);
      if (consumo > 0) {
        asignaciones.push({
          ventaId: venta.id,
          montoAsignado: Math.round(costoUnitario * consumo),
        });
      }
    }
    return asignaciones;
  }

  if (data.tipoAsignacion === 'PRORRATEO') {
    const ventasActivas = await prisma.venta.findMany({ where: { estado: 'NO_ENTREGADO' } });
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
    unidadMedida: data.tipoAsignacion === 'CONSUMO_ESTIMADO' ? data.unidadMedida || null : null,
    cantidadComprada:
      data.tipoAsignacion === 'CONSUMO_ESTIMADO' ? Number(data.cantidadComprada) || null : null,
    consumoNovia: data.tipoAsignacion === 'CONSUMO_ESTIMADO' ? Number(data.consumoNovia) || null : null,
    consumoMadrina:
      data.tipoAsignacion === 'CONSUMO_ESTIMADO' ? Number(data.consumoMadrina) || null : null,
    consumoInvitada:
      data.tipoAsignacion === 'CONSUMO_ESTIMADO' ? Number(data.consumoInvitada) || null : null,
    consumoCivil: data.tipoAsignacion === 'CONSUMO_ESTIMADO' ? Number(data.consumoCivil) || null : null,
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
  const asignaciones = await computeAssignments({ ...data, montoTotal: Number(data.montoTotal) });

  return prisma.$transaction(async (tx) => {
    await tx.purchaseAssignment.deleteMany({ where: { purchaseId: id } });
    return tx.purchase.update({
      where: { id },
      data: {
        ...baseData(data),
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

function normalize(str) {
  return String(str || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

export async function sugerirConsumo(categoria, descripcion) {
  if (!categoria) return null;
  const candidatas = await prisma.purchase.findMany({
    where: { categoria, tipoAsignacion: 'CONSUMO_ESTIMADO' },
    orderBy: { fecha: 'desc' },
    take: 30,
  });

  const palabras = normalize(descripcion).split(/\s+/).filter((w) => w.length > 2);

  let mejor = null;
  for (const c of candidatas) {
    const desc = normalize(c.descripcion);
    const coincide =
      !descripcion || desc === normalize(descripcion) || palabras.some((w) => desc.includes(w));
    if (coincide) {
      mejor = c;
      break;
    }
  }
  if (!mejor) mejor = candidatas[0] || null;
  if (!mejor) return null;

  return {
    fuente: mejor.descripcion,
    unidadMedida: mejor.unidadMedida,
    consumoNovia: mejor.consumoNovia,
    consumoMadrina: mejor.consumoMadrina,
    consumoInvitada: mejor.consumoInvitada,
    consumoCivil: mejor.consumoCivil,
  };
}
