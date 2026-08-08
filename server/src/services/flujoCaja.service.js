import { prisma } from '../lib/prisma.js';
import * as configService from './config.service.js';
import { monthKey, monthRangeKeys, round1 } from '../lib/monthUtils.js';

const TOTAL_VACIO = {
  cobrosRealizados: 0,
  saldoPendienteEsperado: 0,
  cobrosPresupuestados: 0,
  totalEntradas: 0,
  cvReal: 0,
  cvPresupuestado: 0,
  costosFijos: 0,
  totalSalidas: 0,
  resultadoMes: 0,
};

export async function getFlujoCaja() {
  const [ventas, cuotas, presupuestos, presupuestoCuotas, costoEstandarPorTipo, sueldos, costosFijos, financiero] =
    await Promise.all([
      prisma.venta.findMany(),
      prisma.cuota.findMany(),
      prisma.presupuestoVenta.findMany(),
      prisma.presupuestoCuota.findMany(),
      configService.getCostoEstandarPorTipo(),
      configService.listSueldos(),
      configService.listCostosFijos(),
      configService.getFinanciero(),
    ]);

  const costosFijosDetalle = [...sueldos, ...costosFijos];

  if (ventas.length === 0 && presupuestos.length === 0) {
    return {
      meses: [],
      total: TOTAL_VACIO,
      cajaInicial: financiero.cajaInicial,
      sueldoSocias: financiero.sueldoSocias,
    };
  }

  const ventasPorId = new Map(ventas.map((v) => [v.id, v]));

  // Cobros realizados: cuotas efectivamente pagadas, por fecha de pago real.
  const cobrosPorMes = new Map();
  for (const c of cuotas) {
    if (!c.pagada || !c.fechaPago) continue;
    const key = monthKey(c.fechaPago);
    const monto = c.montoPagado ?? c.monto;
    cobrosPorMes.set(key, (cobrosPorMes.get(key) || 0) + monto);
  }

  // Saldo pendiente por cobrar: agrupado por fecha del evento de cada clienta.
  const saldoPorMes = new Map();
  for (const v of ventas) {
    const pagado = cuotas
      .filter((c) => c.ventaId === v.id && c.pagada)
      .reduce((s, c) => s + (c.montoPagado ?? c.monto), 0);
    const saldo = v.precioTotal - pagado;
    if (saldo > 0) {
      const key = monthKey(v.fechaEvento);
      saldoPorMes.set(key, (saldoPorMes.get(key) || 0) + saldo);
    }
  }

  // Cobros presupuestados: plan de pagos definido en el presupuesto de ventas.
  const presupuestoPorId = new Map(presupuestos.map((p) => [p.id, p]));
  const cobrosPresPorMes = new Map();
  for (const pc of presupuestoCuotas) {
    const key = monthKey(pc.fecha);
    cobrosPresPorMes.set(key, (cobrosPresPorMes.get(key) || 0) + pc.monto);
  }

  // CV real: por fecha de venta.
  const cvRealPorMes = new Map();
  for (const v of ventas) {
    const key = monthKey(v.fechaVenta);
    const cv = costoEstandarPorTipo[v.tipo] || 0;
    cvRealPorMes.set(key, (cvRealPorMes.get(key) || 0) + cv);
  }

  // CV presupuestado: meses/tipos presupuestados (por construcción, solo se crean
  // para meses sin ventas reales — ver bloqueo en el módulo de Presupuesto).
  const cvPresPorMes = new Map();
  for (const p of presupuestos) {
    const key = monthKey(p.mes);
    const cv = p.cantidad * (costoEstandarPorTipo[p.tipo] || 0);
    cvPresPorMes.set(key, (cvPresPorMes.get(key) || 0) + cv);
  }

  const mesesFechaInicio = costosFijosDetalle.map((c) => monthKey(c.fechaInicio));
  const hoyKey = monthKey(new Date());
  const todasLasClaves = [
    ...cobrosPorMes.keys(),
    ...saldoPorMes.keys(),
    ...cobrosPresPorMes.keys(),
    ...cvRealPorMes.keys(),
    ...cvPresPorMes.keys(),
    ...mesesFechaInicio,
    hoyKey,
  ].sort();
  const desde = todasLasClaves[0];
  const hasta = todasLasClaves[todasLasClaves.length - 1];
  const meses = monthRangeKeys(desde, hasta);

  let cajaAcumulada = financiero.cajaInicial;

  const filas = meses.map((mesKey) => {
    const cobrosRealizados = cobrosPorMes.get(mesKey) || 0;
    const saldoPendienteEsperado = saldoPorMes.get(mesKey) || 0;
    const cobrosPresupuestados = cobrosPresPorMes.get(mesKey) || 0;
    const totalEntradas = cobrosRealizados + saldoPendienteEsperado + cobrosPresupuestados;

    const cvReal = cvRealPorMes.get(mesKey) || 0;
    const cvPresupuestado = cvPresPorMes.get(mesKey) || 0;
    const costosFijosVigentes = costosFijosDetalle.filter(
      (c) => monthKey(c.fechaInicio) <= mesKey
    );
    const totalCostosFijos = costosFijosVigentes.reduce((s, c) => s + c.monto, 0);
    const totalSalidas = cvReal + cvPresupuestado + totalCostosFijos;

    const resultadoMes = totalEntradas - totalSalidas;
    cajaAcumulada += resultadoMes;

    const alcanza = resultadoMes >= financiero.sueldoSocias;

    return {
      mes: mesKey,
      cobrosRealizados,
      saldoPendienteEsperado,
      cobrosPresupuestados,
      totalEntradas,
      cvReal,
      cvPresupuestado,
      costosFijos: totalCostosFijos,
      totalSalidas,
      resultadoMes,
      cajaAcumulada,
      alcanzaSueldoSocias: alcanza,
    };
  });

  const total = filas.reduce(
    (acc, f) => ({
      cobrosRealizados: acc.cobrosRealizados + f.cobrosRealizados,
      saldoPendienteEsperado: acc.saldoPendienteEsperado + f.saldoPendienteEsperado,
      cobrosPresupuestados: acc.cobrosPresupuestados + f.cobrosPresupuestados,
      totalEntradas: acc.totalEntradas + f.totalEntradas,
      cvReal: acc.cvReal + f.cvReal,
      cvPresupuestado: acc.cvPresupuestado + f.cvPresupuestado,
      costosFijos: acc.costosFijos + f.costosFijos,
      totalSalidas: acc.totalSalidas + f.totalSalidas,
      resultadoMes: acc.resultadoMes + f.resultadoMes,
    }),
    { ...TOTAL_VACIO }
  );

  return {
    meses: filas,
    total,
    cajaInicial: financiero.cajaInicial,
    sueldoSocias: financiero.sueldoSocias,
  };
}
