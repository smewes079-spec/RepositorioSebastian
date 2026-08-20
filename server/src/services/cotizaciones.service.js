import { prisma } from '../lib/prisma.js';
import { buildCotizacionPdf } from './pdf.service.js';
import { sendCotizacionEmail } from './email.service.js';

const include = { items: { orderBy: { orden: 'asc' } }, venta: { select: { id: true, codigo: true } } };

function withComputed(cotizacion) {
  const montoTotal = cotizacion.items.reduce((sum, it) => sum + it.cantidad * it.monto, 0);
  return { ...cotizacion, montoTotal };
}

export async function listCotizaciones(filters = {}) {
  const where = {};
  if (filters.estado) where.estado = filters.estado;
  if (filters.tipo) where.tipo = filters.tipo;
  if (filters.search) {
    where.OR = [
      { nombreClienta: { contains: filters.search, mode: 'insensitive' } },
      { emailClienta: { contains: filters.search, mode: 'insensitive' } },
    ];
  }
  const cotizaciones = await prisma.cotizacion.findMany({
    where,
    include,
    orderBy: { createdAt: 'desc' },
  });
  return cotizaciones.map(withComputed);
}

export async function getCotizacion(id) {
  const cotizacion = await prisma.cotizacion.findUnique({ where: { id }, include });
  if (!cotizacion) return null;
  return withComputed(cotizacion);
}

function itemsCreateData(items = []) {
  return items.map((it, idx) => ({
    orden: it.orden ?? idx + 1,
    descripcion: it.descripcion,
    cantidad: it.cantidad ?? 1,
    monto: it.monto,
  }));
}

export async function createCotizacion(data) {
  const { items = [], ...rest } = data;
  const cotizacion = await prisma.cotizacion.create({
    data: {
      nombreClienta: rest.nombreClienta,
      emailClienta: rest.emailClienta,
      telefonoClienta: rest.telefonoClienta || null,
      tipo: rest.tipo,
      fechaEventoTentativa: rest.fechaEventoTentativa ? new Date(rest.fechaEventoTentativa) : null,
      validezDias: rest.validezDias ?? 15,
      notas: rest.notas || null,
      remitente: rest.remitente || null,
      items: { create: itemsCreateData(items) },
    },
    include,
  });
  return withComputed(cotizacion);
}

export async function updateCotizacion(id, data) {
  const { items, ...rest } = data;
  const updateData = {};
  if (rest.nombreClienta !== undefined) updateData.nombreClienta = rest.nombreClienta;
  if (rest.emailClienta !== undefined) updateData.emailClienta = rest.emailClienta;
  if (rest.telefonoClienta !== undefined) updateData.telefonoClienta = rest.telefonoClienta || null;
  if (rest.tipo !== undefined) updateData.tipo = rest.tipo;
  if (rest.fechaEventoTentativa !== undefined) {
    updateData.fechaEventoTentativa = rest.fechaEventoTentativa ? new Date(rest.fechaEventoTentativa) : null;
  }
  if (rest.validezDias !== undefined) updateData.validezDias = rest.validezDias;
  if (rest.notas !== undefined) updateData.notas = rest.notas || null;
  if (rest.remitente !== undefined) updateData.remitente = rest.remitente || null;

  await prisma.$transaction(async (tx) => {
    await tx.cotizacion.update({ where: { id }, data: updateData });

    if (Array.isArray(items)) {
      const existing = await tx.cotizacionItem.findMany({ where: { cotizacionId: id } });
      const incomingIds = items.filter((it) => it.id).map((it) => it.id);
      const toDelete = existing.filter((it) => !incomingIds.includes(it.id));
      if (toDelete.length) {
        await tx.cotizacionItem.deleteMany({ where: { id: { in: toDelete.map((it) => it.id) } } });
      }
      for (let idx = 0; idx < items.length; idx++) {
        const it = items[idx];
        const payload = {
          orden: it.orden ?? idx + 1,
          descripcion: it.descripcion,
          cantidad: it.cantidad ?? 1,
          monto: it.monto,
        };
        if (it.id) {
          await tx.cotizacionItem.update({ where: { id: it.id }, data: payload });
        } else {
          await tx.cotizacionItem.create({ data: { ...payload, cotizacionId: id } });
        }
      }
    }
  });

  return getCotizacion(id);
}

export async function deleteCotizacion(id) {
  await prisma.cotizacion.delete({ where: { id } });
}

export async function enviarCotizacion(id) {
  const cotizacion = await getCotizacion(id);
  if (!cotizacion) throw new Error('Cotización no encontrada');
  if (cotizacion.estado === 'ACEPTADA' || cotizacion.estado === 'RECHAZADA') {
    throw new Error('Esta cotización ya fue respondida y no se puede reenviar');
  }
  if (!cotizacion.remitente) {
    throw new Error('Elige quién envía la cotización (María o Carolina) antes de enviarla.');
  }

  const pdfBuffer = await buildCotizacionPdf(cotizacion);
  await sendCotizacionEmail({ cotizacion, pdfBuffer });

  const actualizada = await prisma.cotizacion.update({
    where: { id },
    data: { estado: 'ENVIADA', fechaEnvio: new Date() },
    include,
  });
  return withComputed(actualizada);
}

export async function descargarCotizacionPdf(id) {
  const cotizacion = await getCotizacion(id);
  if (!cotizacion) throw new Error('Cotización no encontrada');
  return buildCotizacionPdf(cotizacion);
}

function generarCodigoVenta(cotizacionId) {
  return `COT-${cotizacionId.slice(-6).toUpperCase()}`;
}

export async function aceptarCotizacion(id) {
  const cotizacion = await getCotizacion(id);
  if (!cotizacion) throw new Error('Cotización no encontrada');
  if (cotizacion.estado === 'ACEPTADA') throw new Error('Esta cotización ya fue aceptada');
  if (cotizacion.estado === 'RECHAZADA') throw new Error('Esta cotización fue rechazada, no se puede aceptar');
  if (!cotizacion.fechaEventoTentativa) {
    throw new Error('Antes de aceptar, ingresa la fecha tentativa del evento en la cotización');
  }
  if (cotizacion.items.length === 0) {
    throw new Error('La cotización no tiene ítems, no se puede calcular el precio de la venta');
  }

  const venta = await prisma.$transaction(async (tx) => {
    const nuevaVenta = await tx.venta.create({
      data: {
        codigo: generarCodigoVenta(cotizacion.id),
        nombreClienta: cotizacion.nombreClienta,
        tipo: cotizacion.tipo,
        fechaVenta: new Date(),
        fechaEvento: cotizacion.fechaEventoTentativa,
        precioTotal: cotizacion.montoTotal,
        notas: cotizacion.notas || null,
      },
    });
    await tx.cotizacion.update({
      where: { id },
      data: { estado: 'ACEPTADA', fechaRespuesta: new Date(), ventaId: nuevaVenta.id },
    });
    return nuevaVenta;
  });

  const actualizada = await getCotizacion(id);
  return { cotizacion: actualizada, venta };
}

export async function rechazarCotizacion(id) {
  const cotizacion = await prisma.cotizacion.findUnique({ where: { id } });
  if (!cotizacion) throw new Error('Cotización no encontrada');
  if (cotizacion.estado === 'ACEPTADA') throw new Error('Esta cotización ya fue aceptada, no se puede rechazar');

  const actualizada = await prisma.cotizacion.update({
    where: { id },
    data: { estado: 'RECHAZADA', fechaRespuesta: new Date() },
    include,
  });
  return withComputed(actualizada);
}
