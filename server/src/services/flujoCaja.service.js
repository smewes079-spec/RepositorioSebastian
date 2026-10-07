import { prisma } from '../lib/prisma.js';
import * as configService from './config.service.js';
import * as costeoService from './costeo.service.js';
import * as gastosGeneralesService from './gastosGenerales.service.js';
import { monthKey, monthRangeKeys, round1 } from '../lib/monthUtils.js';

const ANIO_MIN = 2000;

// Evita que una fecha corrupta (ej. un dato mal importado que quedó en 1999)
// estire la tabla completa, ya que monthRangeKeys() rellena TODOS los meses
// entre el mínimo y el máximo encontrado. En vez de usarla silenciosamente,
// se descarta y se reporta en `anomalias` para que el usuario la corrija.
function monthKeySeguro(fecha) {
  const anioMax = new Date().getUTCFullYear() + 5;
  const key = monthKey(fecha);
  const anio = Number(key.slice(0, 4));
  return anio >= ANIO_MIN && anio <= anioMax ? key : null;
}

const TOTAL_VACIO = {
  cobrosRealizados: 0,
  saldoPendienteEsperado: 0,
  cobrosPresupuestados: 0,
  totalEntradas: 0,
  cvReal: 0,
  cvPresupuestado: 0,
  costosFijos: 0,
  gastosGenerales: 0,
  totalSalidas: 0,
  resultadoMes: 0,
};

export async function getFlujoCaja() {
  const [
    ventas,
    cuotas,
    presupuestos,
    presupuestoCuotas,
    costoEstandarPorTipo,
    sueldos,
    costosFijos,
    gastosGenerales,
    financiero,
  ] = await Promise.all([
    prisma.venta.findMany(),
    prisma.cuota.findMany(),
    prisma.presupuestoVenta.findMany(),
    prisma.presupuestoCuota.findMany(),
    configService.getCostoEstandarPorTipo(),
    configService.listSueldos(),
    configService.listCostosFijos(),
    gastosGeneralesService.listGastosGenerales(),
    configService.getFinanciero(),
  ]);

  const costosFijosDetalle = [...sueldos, ...costosFijos];

  if (ventas.length === 0 && presupuestos.length === 0 && gastosGenerales.length === 0) {
    return {
      meses: [],
      total: TOTAL_VACIO,
      cajaInicial: financiero.cajaInicial,
      sueldoSocias: financiero.sueldoSocias,
      anomalias: [],
    };
  }

  const ventasPorId = new Map(ventas.map((v) => [v.id, v]));
  const anomalias = [];

  // CV real = costo de insumos realmente comprados y asignados a cada venta
  // (Registro de insumos), no el supuesto de Configuración. El costo estándar
  // solo se usa como respaldo para una venta puntual que aún no tiene insumos
  // registrados.
  const costoMaterialesPorVenta = await costeoService.getCostosMaterialesPorVenta(ventas);

  // Cobros realizados: cuotas efectivamente pagadas, por fecha de pago real.
  const cobrosPorMes = new Map();
  for (const c of cuotas) {
    if (!c.pagada || !c.fechaPago) continue;
    const key = monthKeySeguro(c.fechaPago);
    if (!key) {
      anomalias.push({
        tipo: 'Cobro realizado',
        ventaId: c.ventaId,
        cuotaNumero: c.numero,
        fecha: c.fechaPago,
      });
      continue;
    }
    const monto = c.montoPagado ?? c.monto;
    cobrosPorMes.set(key, (cobrosPorMes.get(key) || 0) + monto);
  }

  // Saldo pendiente por cobrar: cada cuota programada pero no pagada se agrupa
  // por su propia fecha programada (el plan de pago real ya registrado para
  // esa venta) — mucho más preciso que asumir que todo el saldo se cobra
  // recién en el mes del evento, que antes estiraba la tabla con meses vacíos
  // hasta la fecha de la boda más lejana. Si una venta tiene parte del precio
  // sin ninguna cuota creada (nunca se le armó un plan de pago completo), esa
  // parte sin programar se sigue estimando en el mes del evento, como mejor
  // aproximación posible sin más datos.
  const cuotasPorVenta = new Map();
  for (const c of cuotas) {
    if (!cuotasPorVenta.has(c.ventaId)) cuotasPorVenta.set(c.ventaId, []);
    cuotasPorVenta.get(c.ventaId).push(c);
  }
  const saldoPorMes = new Map();
  for (const v of ventas) {
    const cuotasVenta = cuotasPorVenta.get(v.id) || [];
    let totalCuotas = 0;
    for (const c of cuotasVenta) {
      totalCuotas += c.monto;
      if (c.pagada) continue;
      const key = monthKeySeguro(c.fechaProgramada);
      if (!key) {
        anomalias.push({
          tipo: 'Saldo pendiente esperado',
          ventaId: v.id,
          cuotaNumero: c.numero,
          fecha: c.fechaProgramada,
        });
        continue;
      }
      saldoPorMes.set(key, (saldoPorMes.get(key) || 0) + c.monto);
    }
    const saldoSinProgramar = v.precioTotal - totalCuotas;
    if (saldoSinProgramar > 0) {
      const key = monthKeySeguro(v.fechaEvento);
      if (!key) {
        anomalias.push({ tipo: 'Saldo pendiente esperado', ventaId: v.id, fecha: v.fechaEvento });
        continue;
      }
      saldoPorMes.set(key, (saldoPorMes.get(key) || 0) + saldoSinProgramar);
    }
  }

  // Cobros presupuestados: plan de pagos definido en el presupuesto de ventas.
  const presupuestoPorId = new Map(presupuestos.map((p) => [p.id, p]));
  const cobrosPresPorMes = new Map();
  for (const pc of presupuestoCuotas) {
    const key = monthKeySeguro(pc.fecha);
    if (!key) {
      anomalias.push({ tipo: 'Cobro presupuestado', fecha: pc.fecha });
      continue;
    }
    cobrosPresPorMes.set(key, (cobrosPresPorMes.get(key) || 0) + pc.monto);
  }

  // CV real: por fecha de venta.
  const cvRealPorMes = new Map();
  for (const v of ventas) {
    const key = monthKeySeguro(v.fechaVenta);
    if (!key) {
      anomalias.push({ tipo: 'CV real', ventaId: v.id, fecha: v.fechaVenta });
      continue;
    }
    const cv = costoMaterialesPorVenta.get(v.id)?.monto ?? 0;
    cvRealPorMes.set(key, (cvRealPorMes.get(key) || 0) + cv);
  }

  // CV presupuestado: meses/tipos presupuestados (por construcción, solo se crean
  // para meses sin ventas reales — ver bloqueo en el módulo de Presupuesto).
  const cvPresPorMes = new Map();
  for (const p of presupuestos) {
    const key = monthKeySeguro(p.mes);
    if (!key) {
      anomalias.push({ tipo: 'CV presupuestado', fecha: p.mes });
      continue;
    }
    const cv = p.cantidad * (costoEstandarPorTipo[p.tipo] || 0);
    cvPresPorMes.set(key, (cvPresPorMes.get(key) || 0) + cv);
  }

  // Gastos generales: café, estacionamiento, mobiliario, etc. — gasto operacional
  // real del mes en que ocurrió, no asignado a ningún vestido.
  const gastosGeneralesPorMes = new Map();
  for (const g of gastosGenerales) {
    const key = monthKeySeguro(g.fecha);
    if (!key) {
      anomalias.push({ tipo: 'Gasto general', fecha: g.fecha });
      continue;
    }
    gastosGeneralesPorMes.set(key, (gastosGeneralesPorMes.get(key) || 0) + g.montoTotal);
  }

  const mesesFechaInicio = [];
  for (const c of costosFijosDetalle) {
    const key = monthKeySeguro(c.fechaInicio);
    if (!key) {
      anomalias.push({ tipo: 'Costo fijo / sueldo', nombre: c.nombre, fecha: c.fechaInicio });
      continue;
    }
    mesesFechaInicio.push(key);
  }
  const hoyKey = monthKey(new Date());
  const todasLasClaves = [
    ...cobrosPorMes.keys(),
    ...saldoPorMes.keys(),
    ...cobrosPresPorMes.keys(),
    ...cvRealPorMes.keys(),
    ...cvPresPorMes.keys(),
    ...gastosGeneralesPorMes.keys(),
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
    const costosFijosVigentes = configService.seleccionarVigentePorNombre(
      costosFijosDetalle,
      mesKey
    );
    const totalCostosFijos = costosFijosVigentes.reduce((s, c) => s + c.monto, 0);
    const totalGastosGenerales = gastosGeneralesPorMes.get(mesKey) || 0;
    const totalSalidas = cvReal + cvPresupuestado + totalCostosFijos + totalGastosGenerales;

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
      gastosGenerales: totalGastosGenerales,
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
      gastosGenerales: acc.gastosGenerales + f.gastosGenerales,
      totalSalidas: acc.totalSalidas + f.totalSalidas,
      resultadoMes: acc.resultadoMes + f.resultadoMes,
    }),
    { ...TOTAL_VACIO }
  );

  const anomaliasConCodigo = anomalias.map((a) => ({
    ...a,
    codigoVenta: a.ventaId ? ventasPorId.get(a.ventaId)?.codigo : undefined,
  }));

  return {
    meses: filas,
    total,
    cajaInicial: financiero.cajaInicial,
    sueldoSocias: financiero.sueldoSocias,
    anomalias: anomaliasConCodigo,
  };
}
