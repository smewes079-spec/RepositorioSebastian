import { prisma } from '../lib/prisma.js';
import { getEERR } from './eerr.service.js';
import { getFlujoCaja } from './flujoCaja.service.js';
import { getManoDeObraEstimada } from './costeo.service.js';
import { monthKey } from '../lib/monthUtils.js';

export async function getKPIs() {
  const hoy = new Date();
  const mesActualKey = monthKey(hoy);

  const [eerr, flujoCaja, manoDeObra, ventas, cuotas] = await Promise.all([
    getEERR(),
    getFlujoCaja(),
    getManoDeObraEstimada(hoy),
    prisma.venta.findMany({ select: { id: true, precioTotal: true } }),
    prisma.cuota.findMany({ select: { ventaId: true, pagada: true, monto: true, montoPagado: true } }),
  ]);

  const filaMesActual = eerr.meses.find((m) => m.mes === mesActualKey);
  const flujoMesActual = flujoCaja.meses.find((m) => m.mes === mesActualKey);

  const pagadoPorVenta = new Map();
  for (const c of cuotas) {
    if (!c.pagada) continue;
    const monto = c.montoPagado ?? c.monto;
    pagadoPorVenta.set(c.ventaId, (pagadoPorVenta.get(c.ventaId) || 0) + monto);
  }
  const totalPorCobrar = ventas.reduce((sum, v) => {
    const pagado = pagadoPorVenta.get(v.id) || 0;
    const saldo = v.precioTotal - pagado;
    return sum + (saldo > 0 ? saldo : 0);
  }, 0);

  let cajaActual = flujoCaja.cajaInicial;
  for (const fila of flujoCaja.meses) {
    if (fila.mes > mesActualKey) break;
    cajaActual = fila.cajaAcumulada;
  }

  return {
    cajaActual,
    ventasDelMes: filaMesActual?.ingresosReales ?? 0,
    margenBrutoPctMes: filaMesActual?.margenBrutoPct ?? 0,
    vestidosEnProduccion: manoDeObra.cantidadVestidosActivos,
    totalPorCobrar,
    alcanzaSueldoSociasMes: flujoMesActual?.alcanzaSueldoSocias ?? null,
    sueldoSocias: flujoCaja.sueldoSocias,
  };
}
