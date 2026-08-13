import { prisma } from '../lib/prisma.js';
import * as configService from './config.service.js';
import * as costeoService from './costeo.service.js';
import { monthKey, monthRangeKeys, round1 } from '../lib/monthUtils.js';

const TIPOS = ['NOVIA', 'MADRINA', 'INVITADA', 'CIVIL'];

const TOTAL_VACIO = {
  ingresosReales: 0,
  ingresosPresupuestados: 0,
  totalIngresos: 0,
  cvReal: 0,
  cvPresupuestado: 0,
  totalCV: 0,
  margenBruto: 0,
  costosFijos: 0,
  utilidadOperacional: 0,
  margenBrutoPct: 0,
  margenOperacionalPct: 0,
};

export async function getEERR() {
  const [ventas, presupuestos, costoEstandarPorTipo, sueldos, costosFijos] = await Promise.all([
    prisma.venta.findMany(),
    prisma.presupuestoVenta.findMany(),
    configService.getCostoEstandarPorTipo(),
    configService.listSueldos(),
    configService.listCostosFijos(),
  ]);

  const costosFijosDetalle = [...sueldos, ...costosFijos];

  if (ventas.length === 0 && presupuestos.length === 0) {
    return { meses: [], total: TOTAL_VACIO };
  }

  // CV real = costo de insumos realmente comprados y asignados a cada venta
  // (Registro de insumos), no el supuesto de Configuración. El costo estándar
  // solo se usa como respaldo para una venta puntual que aún no tiene insumos
  // registrados.
  const costoMaterialesPorVenta = await costeoService.getCostosMaterialesPorVenta(ventas);

  const mesesVentas = ventas.map((v) => monthKey(v.fechaVenta));
  const mesesPresupuesto = presupuestos.map((p) => monthKey(p.mes));
  const mesesFechaInicio = costosFijosDetalle.map((c) => monthKey(c.fechaInicio));
  const hoyKey = monthKey(new Date());

  const candidatos = [...mesesVentas, ...mesesPresupuesto, ...mesesFechaInicio, hoyKey].sort();
  const desde = candidatos[0];
  const hasta = candidatos[candidatos.length - 1];
  const meses = monthRangeKeys(desde, hasta);

  const filas = meses.map((mesKey) => {
    const ventasDelMes = ventas.filter((v) => monthKey(v.fechaVenta) === mesKey);
    const tieneReales = ventasDelMes.length > 0;

    const ingresosPorTipo = {};
    const cvPorTipo = {};
    let ingresosRealesTotal = 0;
    let cvRealTotal = 0;
    let ingresosPresupuestadosTotal = 0;
    let cvPresupuestadoTotal = 0;
    let cantidadPresupuestada = 0;

    for (const tipo of TIPOS) {
      const ventasTipo = ventasDelMes.filter((v) => v.tipo === tipo);
      const ingresoReal = ventasTipo.reduce((s, v) => s + v.precioTotal, 0);
      const cvReal = ventasTipo.reduce(
        (s, v) => s + (costoMaterialesPorVenta.get(v.id)?.monto ?? 0),
        0
      );
      ingresosPorTipo[tipo] = { real: ingresoReal, presupuestado: 0, cantidad: ventasTipo.length };
      cvPorTipo[tipo] = { real: cvReal, presupuestado: 0 };
      ingresosRealesTotal += ingresoReal;
      cvRealTotal += cvReal;
    }

    // El presupuesto de un mes solo se usa si ese mes no tiene NINGUNA venta real
    // (de cualquier tipo) — nunca se suma sobre meses que ya tienen reales.
    if (!tieneReales) {
      for (const tipo of TIPOS) {
        const presupuestoTipo = presupuestos.find(
          (p) => monthKey(p.mes) === mesKey && p.tipo === tipo
        );
        if (presupuestoTipo) {
          const cvPresTipo = presupuestoTipo.cantidad * (costoEstandarPorTipo[tipo] || 0);
          ingresosPorTipo[tipo].presupuestado = presupuestoTipo.montoTotal;
          ingresosPorTipo[tipo].cantidad = presupuestoTipo.cantidad;
          cvPorTipo[tipo].presupuestado = cvPresTipo;
          ingresosPresupuestadosTotal += presupuestoTipo.montoTotal;
          cvPresupuestadoTotal += cvPresTipo;
          cantidadPresupuestada += presupuestoTipo.cantidad;
        }
      }
    }

    const totalIngresos = ingresosRealesTotal + ingresosPresupuestadosTotal;
    const totalCV = cvRealTotal + cvPresupuestadoTotal;
    const margenBruto = totalIngresos - totalCV;
    const margenBrutoPct = totalIngresos > 0 ? round1((margenBruto / totalIngresos) * 100) : 0;

    const costosFijosVigentes = costosFijosDetalle.filter(
      (c) => monthKey(c.fechaInicio) <= mesKey
    );
    const totalCostosFijos = costosFijosVigentes.reduce((s, c) => s + c.monto, 0);

    const utilidadOperacional = margenBruto - totalCostosFijos;
    const margenOperacionalPct =
      totalIngresos > 0 ? round1((utilidadOperacional / totalIngresos) * 100) : 0;

    return {
      mes: mesKey,
      tieneReales,
      cantidadVentasReales: ventasDelMes.length,
      cantidadPresupuestada,
      ingresosPorTipo,
      cvPorTipo,
      ingresosReales: ingresosRealesTotal,
      ingresosPresupuestados: ingresosPresupuestadosTotal,
      totalIngresos,
      cvReal: cvRealTotal,
      cvPresupuestado: cvPresupuestadoTotal,
      totalCV,
      margenBruto,
      margenBrutoPct,
      costosFijos: totalCostosFijos,
      costosFijosDetalle: costosFijosVigentes,
      utilidadOperacional,
      margenOperacionalPct,
    };
  });

  const total = filas.reduce(
    (acc, f) => ({
      ingresosReales: acc.ingresosReales + f.ingresosReales,
      ingresosPresupuestados: acc.ingresosPresupuestados + f.ingresosPresupuestados,
      totalIngresos: acc.totalIngresos + f.totalIngresos,
      cvReal: acc.cvReal + f.cvReal,
      cvPresupuestado: acc.cvPresupuestado + f.cvPresupuestado,
      totalCV: acc.totalCV + f.totalCV,
      margenBruto: acc.margenBruto + f.margenBruto,
      costosFijos: acc.costosFijos + f.costosFijos,
      utilidadOperacional: acc.utilidadOperacional + f.utilidadOperacional,
    }),
    { ...TOTAL_VACIO }
  );
  total.margenBrutoPct =
    total.totalIngresos > 0 ? round1((total.margenBruto / total.totalIngresos) * 100) : 0;
  total.margenOperacionalPct =
    total.totalIngresos > 0 ? round1((total.utilidadOperacional / total.totalIngresos) * 100) : 0;

  return { meses: filas, total };
}
