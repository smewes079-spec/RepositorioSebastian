import { prisma } from '../lib/prisma.js';

function monthRange(monthStr) {
  const [y, m] = monthStr.split('-').map(Number);
  const start = new Date(Date.UTC(y, m - 1, 1));
  const end = new Date(Date.UTC(y, m, 1));
  return { start, end };
}

function baseData(data) {
  return {
    fecha: new Date(data.fecha),
    categoria: data.categoria,
    descripcion: data.descripcion,
    montoTotal: Number(data.montoTotal),
  };
}

const includeAuditoria = {
  creadoPor: { select: { nombre: true } },
  actualizadoPor: { select: { nombre: true } },
};

// Select explícito que trae todo salvo `comprobanteDatos` (puede pesar varios
// MB) — se usa en listados/detalle para no cargar el archivo completo en cada
// consulta; el archivo en sí solo se lee en getComprobante().
const selectSinComprobanteDatos = {
  id: true,
  fecha: true,
  categoria: true,
  descripcion: true,
  montoTotal: true,
  createdAt: true,
  updatedAt: true,
  creadoPorId: true,
  actualizadoPorId: true,
  comprobanteNombre: true,
  comprobanteMime: true,
  comprobanteTamano: true,
  ...includeAuditoria,
};

export async function listGastosGenerales(filters = {}) {
  const where = {};
  if (filters.categoria) where.categoria = filters.categoria;
  if (filters.mesGasto) {
    const { start, end } = monthRange(filters.mesGasto);
    where.fecha = { gte: start, lt: end };
  }

  return prisma.gastoGeneral.findMany({
    where,
    select: selectSinComprobanteDatos,
    orderBy: { fecha: 'desc' },
  });
}

export async function getGastoGeneral(id) {
  return prisma.gastoGeneral.findUnique({ where: { id }, select: selectSinComprobanteDatos });
}

export async function createGastoGeneral(data, usuarioId) {
  return prisma.gastoGeneral.create({
    data: {
      ...baseData(data),
      creadoPorId: usuarioId,
      actualizadoPorId: usuarioId,
    },
    select: selectSinComprobanteDatos,
  });
}

export async function updateGastoGeneral(id, data, usuarioId) {
  const existente = await prisma.gastoGeneral.findUnique({ where: { id } });
  if (!existente) {
    const err = new Error('Gasto no encontrado');
    err.status = 404;
    throw err;
  }

  const merged = { ...existente, ...data };

  return prisma.gastoGeneral.update({
    where: { id },
    data: {
      ...baseData(merged),
      actualizadoPorId: usuarioId,
    },
    select: selectSinComprobanteDatos,
  });
}

export async function deleteGastoGeneral(id) {
  await prisma.gastoGeneral.delete({ where: { id } });
}

export async function guardarComprobante(id, file) {
  const existente = await prisma.gastoGeneral.findUnique({ where: { id } });
  if (!existente) {
    const err = new Error('Gasto no encontrado');
    err.status = 404;
    throw err;
  }
  return prisma.gastoGeneral.update({
    where: { id },
    data: {
      comprobanteNombre: file.originalname,
      comprobanteMime: file.mimetype,
      comprobanteTamano: file.size,
      comprobanteDatos: file.buffer,
    },
    select: selectSinComprobanteDatos,
  });
}

export async function eliminarComprobante(id) {
  const existente = await prisma.gastoGeneral.findUnique({ where: { id } });
  if (!existente) {
    const err = new Error('Gasto no encontrado');
    err.status = 404;
    throw err;
  }
  return prisma.gastoGeneral.update({
    where: { id },
    data: {
      comprobanteNombre: null,
      comprobanteMime: null,
      comprobanteTamano: null,
      comprobanteDatos: null,
    },
    select: selectSinComprobanteDatos,
  });
}

export async function getComprobante(id) {
  return prisma.gastoGeneral.findUnique({
    where: { id },
    select: { comprobanteNombre: true, comprobanteMime: true, comprobanteDatos: true },
  });
}

export async function resumen(filters = {}) {
  const gastos = await listGastosGenerales(filters);
  const totalGeneral = gastos.reduce((s, g) => s + g.montoTotal, 0);

  const porCategoria = {};
  for (const g of gastos) {
    porCategoria[g.categoria] = (porCategoria[g.categoria] || 0) + g.montoTotal;
  }

  const porMes = {};
  for (const g of gastos) {
    const d = new Date(g.fecha);
    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
    porMes[key] = (porMes[key] || 0) + g.montoTotal;
  }

  return { totalGeneral, cantidadGastos: gastos.length, porCategoria, porMes };
}
