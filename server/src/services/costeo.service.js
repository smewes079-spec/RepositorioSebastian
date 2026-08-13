import { prisma } from '../lib/prisma.js';
import * as configService from './config.service.js';

const TIPOS = ['NOVIA', 'MADRINA', 'INVITADA', 'CIVIL'];

function monthStart(date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1));
}
function monthEnd(date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1));
}
function monthKey(date) {
  const d = new Date(date);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

export async function getManoDeObraEstimada(fecha = new Date()) {
  const inicio = monthStart(fecha);
  const fin = monthEnd(fecha);

  const [sueldos, cantidadNoEntregado, cantidadEntregadoEsteMes] = await Promise.all([
    configService.getSueldosVigentes(fecha),
    prisma.venta.count({ where: { estado: 'NO_ENTREGADO' } }),
    prisma.venta.count({
      where: { estado: 'ENTREGADO', fechaEntrega: { gte: inicio, lt: fin } },
    }),
  ]);

  const cantidadActivos = cantidadNoEntregado + cantidadEntregadoEsteMes;
  const monto = cantidadActivos > 0 ? Math.round(sueldos / cantidadActivos) : 0;

  return {
    monto,
    sueldosModistas: sueldos,
    cantidadVestidosActivos: cantidadActivos,
    cantidadNoEntregado,
    cantidadEntregadoEsteMes,
  };
}

export async function getCostoMaterialesVenta(ventaId, venta) {
  const asignaciones = await prisma.purchaseAssignment.findMany({
    where: { ventaId },
    include: { purchase: true },
    orderBy: { createdAt: 'asc' },
  });

  if (asignaciones.length === 0) {
    const costosEstandar = await configService.getCostoEstandarPorTipo();
    return {
      monto: costosEstandar[venta.tipo] ?? 0,
      esEstimado: true,
      items: [],
    };
  }

  const items = asignaciones.map((a) => ({
    id: a.id,
    purchaseId: a.purchaseId,
    descripcion: a.purchase.descripcion,
    categoria: a.purchase.categoria,
    tipoAsignacion: a.purchase.tipoAsignacion,
    fecha: a.purchase.fecha,
    montoAsignado: a.montoAsignado,
  }));

  return {
    monto: items.reduce((s, i) => s + i.montoAsignado, 0),
    esEstimado: false,
    items,
  };
}

export async function getFichaCosto(ventaId) {
  const venta = await prisma.venta.findUnique({ where: { id: ventaId } });
  if (!venta) return null;

  const [materiales, manoObra] = await Promise.all([
    getCostoMaterialesVenta(ventaId, venta),
    getManoDeObraEstimada(),
  ]);

  const margen = venta.precioTotal - materiales.monto - manoObra.monto;
  const margenPct = venta.precioTotal > 0 ? Math.round((margen / venta.precioTotal) * 1000) / 10 : 0;

  return {
    ventaId: venta.id,
    codigo: venta.codigo,
    nombreClienta: venta.nombreClienta,
    tipo: venta.tipo,
    precioVenta: venta.precioTotal,
    materiales,
    manoDeObra: manoObra,
    margen,
    margenPct,
  };
}

// Costo de materiales real (insumos registrados en Compras) por venta, con el
// costo estándar por tipo como respaldo solo para las ventas que todavía no
// tienen ningún insumo asignado. Se usa en Rentabilidad y en el Dashboard
// Financiero (EERR / Flujo de Caja) para que el costo variable refleje lo
// realmente comprado en vez de solo el supuesto de Configuración.
export async function getCostosMaterialesPorVenta(ventas) {
  if (ventas.length === 0) return new Map();

  const [costosEstandar, asignaciones] = await Promise.all([
    configService.getCostoEstandarPorTipo(),
    prisma.purchaseAssignment.findMany({
      where: { ventaId: { in: ventas.map((v) => v.id) } },
    }),
  ]);

  const porVenta = new Map();
  for (const a of asignaciones) {
    porVenta.set(a.ventaId, (porVenta.get(a.ventaId) || 0) + a.montoAsignado);
  }

  const resultado = new Map();
  for (const v of ventas) {
    const materialesReales = porVenta.get(v.id) || 0;
    const esEstimado = materialesReales === 0;
    resultado.set(v.id, {
      monto: esEstimado ? costosEstandar[v.tipo] ?? 0 : materialesReales,
      esEstimado,
    });
  }
  return resultado;
}

async function calcularParaVentas(ventas) {
  const [manoObra, costoMaterialesPorVenta] = await Promise.all([
    getManoDeObraEstimada(),
    getCostosMaterialesPorVenta(ventas),
  ]);

  return ventas.map((v) => {
    const { monto: costoMateriales, esEstimado } = costoMaterialesPorVenta.get(v.id);
    const margen = v.precioTotal - costoMateriales - manoObra.monto;
    const margenPct = v.precioTotal > 0 ? Math.round((margen / v.precioTotal) * 1000) / 10 : 0;
    return {
      ventaId: v.id,
      codigo: v.codigo,
      nombreClienta: v.nombreClienta,
      tipo: v.tipo,
      fechaVenta: v.fechaVenta,
      precioVenta: v.precioTotal,
      costoMateriales,
      esEstimado,
      manoDeObra: manoObra.monto,
      margen,
      margenPct,
    };
  });
}

export async function getRentabilidadDetalle() {
  const ventas = await prisma.venta.findMany({ orderBy: { fechaVenta: 'desc' } });
  return calcularParaVentas(ventas);
}

export async function getRentabilidadPorTipo() {
  const ventas = await prisma.venta.findMany();
  const calculadas = await calcularParaVentas(ventas);

  return TIPOS.map((tipo) => {
    const items = calculadas.filter((c) => c.tipo === tipo);
    const cantidad = items.length;
    const precios = items.map((i) => i.precioVenta);
    const margenes = items.map((i) => i.margen);
    const margenesPct = items.map((i) => i.margenPct);
    const costosMat = items.map((i) => i.costoMateriales);
    const manoObras = items.map((i) => i.manoDeObra);

    const avg = (arr) => (arr.length ? Math.round(arr.reduce((s, n) => s + n, 0) / arr.length) : 0);
    const avgPct = (arr) =>
      arr.length ? Math.round((arr.reduce((s, n) => s + n, 0) / arr.length) * 10) / 10 : 0;

    const porMes = new Map();
    for (const i of items) {
      const key = monthKey(i.fechaVenta);
      if (!porMes.has(key)) porMes.set(key, []);
      porMes.get(key).push(i.margenPct);
    }
    const tendenciaMensual = Array.from(porMes.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([mes, arr]) => ({ mes, margenPct: avgPct(arr) }));

    return {
      tipo,
      cantidad,
      precioMin: precios.length ? Math.min(...precios) : 0,
      precioProm: avg(precios),
      precioMax: precios.length ? Math.max(...precios) : 0,
      costoMaterialesProm: avg(costosMat),
      manoObraProm: avg(manoObras),
      margenProm: avg(margenes),
      margenPctProm: avgPct(margenesPct),
      tendenciaMensual,
    };
  });
}
