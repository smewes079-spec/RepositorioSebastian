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
    nombreClienta: data.nombreClienta,
    emailClienta: data.emailClienta ? String(data.emailClienta).trim() : null,
    telefonoClienta: data.telefonoClienta ? String(data.telefonoClienta).trim() : null,
    monto: Number(data.monto),
    notas: data.notas ? String(data.notas).trim() : null,
  };
}

const includeAuditoria = {
  creadoPor: { select: { nombre: true } },
  actualizadoPor: { select: { nombre: true } },
};

export async function listAsesorias(filters = {}) {
  const where = {};
  if (filters.mes) {
    const { start, end } = monthRange(filters.mes);
    where.fecha = { gte: start, lt: end };
  }

  return prisma.asesoria.findMany({
    where,
    include: includeAuditoria,
    orderBy: { fecha: 'desc' },
  });
}

export async function getAsesoria(id) {
  return prisma.asesoria.findUnique({ where: { id }, include: includeAuditoria });
}

export async function createAsesoria(data, usuarioId) {
  return prisma.asesoria.create({
    data: {
      ...baseData(data),
      creadoPorId: usuarioId,
      actualizadoPorId: usuarioId,
    },
    include: includeAuditoria,
  });
}

export async function updateAsesoria(id, data, usuarioId) {
  const existente = await prisma.asesoria.findUnique({ where: { id } });
  if (!existente) {
    const err = new Error('Asesoría no encontrada');
    err.status = 404;
    throw err;
  }

  const merged = { ...existente, ...data };

  return prisma.asesoria.update({
    where: { id },
    data: {
      ...baseData(merged),
      actualizadoPorId: usuarioId,
    },
    include: includeAuditoria,
  });
}

export async function deleteAsesoria(id) {
  await prisma.asesoria.delete({ where: { id } });
}

export async function resumen(filters = {}) {
  const asesorias = await listAsesorias(filters);
  const totalGeneral = asesorias.reduce((s, a) => s + a.monto, 0);

  const porMes = {};
  for (const a of asesorias) {
    const d = new Date(a.fecha);
    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
    porMes[key] = (porMes[key] || 0) + a.monto;
  }

  return { totalGeneral, cantidadAsesorias: asesorias.length, porMes };
}
