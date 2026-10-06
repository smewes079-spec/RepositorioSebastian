import { prisma } from '../lib/prisma.js';
import { monthKey } from '../lib/monthUtils.js';

const TIPOS_DEFAULT = {
  NOVIA: { costoEstandar: 568000, consumoTelaEstimado: 8, precioVentaEstandar: 1200000 },
  MADRINA: { costoEstandar: 472479, consumoTelaEstimado: 5, precioVentaEstandar: 900000 },
  INVITADA: { costoEstandar: 183613, consumoTelaEstimado: 3, precioVentaEstandar: 280000 },
  CIVIL: { costoEstandar: 183613, consumoTelaEstimado: 3, precioVentaEstandar: 280000 },
};

const SUELDOS_DEFAULT = [
  { nombre: 'Modista 1', monto: 1200000, fechaInicio: new Date(Date.UTC(2026, 2, 1)) },
  { nombre: 'Modista 2', monto: 1500000, fechaInicio: new Date(Date.UTC(2026, 5, 1)) },
];

const COSTOS_FIJOS_DEFAULT = [
  { nombre: 'Arriendo', monto: 1500000, fechaInicio: new Date(Date.UTC(2026, 2, 1)) },
  { nombre: 'Sueldo Carolina', monto: 500000, fechaInicio: new Date(Date.UTC(2026, 4, 1)) },
  { nombre: 'Sueldo María', monto: 500000, fechaInicio: new Date(Date.UTC(2026, 4, 1)) },
  { nombre: 'Agua/Luz/Gas', monto: 100000, fechaInicio: new Date(Date.UTC(2026, 2, 1)) },
  { nombre: 'Aseo', monto: 160000, fechaInicio: new Date(Date.UTC(2026, 2, 1)) },
  { nombre: 'Internet', monto: 30000, fechaInicio: new Date(Date.UTC(2026, 2, 1)) },
  { nombre: 'Marketing', monto: 0, fechaInicio: new Date(Date.UTC(2026, 2, 1)) },
  { nombre: 'Gastos comunes', monto: 0, fechaInicio: new Date(Date.UTC(2026, 2, 1)) },
  { nombre: 'Otros', monto: 0, fechaInicio: new Date(Date.UTC(2026, 2, 1)) },
];

export async function listTiposVestido() {
  const existentes = await prisma.configTipoVestido.findMany();
  const faltantes = Object.keys(TIPOS_DEFAULT).filter(
    (tipo) => !existentes.some((e) => e.tipo === tipo)
  );
  if (faltantes.length) {
    await prisma.configTipoVestido.createMany({
      data: faltantes.map((tipo) => ({ tipo, ...TIPOS_DEFAULT[tipo] })),
      skipDuplicates: true,
    });
    return listTiposVestido();
  }
  return existentes.sort((a, b) => a.tipo.localeCompare(b.tipo));
}

export async function updateTipoVestido(tipo, data) {
  return prisma.configTipoVestido.upsert({
    where: { tipo },
    update: {
      ...(data.costoEstandar !== undefined && { costoEstandar: Number(data.costoEstandar) }),
      ...(data.consumoTelaEstimado !== undefined && {
        consumoTelaEstimado: Number(data.consumoTelaEstimado),
      }),
      ...(data.precioVentaEstandar !== undefined && {
        precioVentaEstandar: Number(data.precioVentaEstandar),
      }),
    },
    create: {
      tipo,
      costoEstandar: Number(data.costoEstandar ?? TIPOS_DEFAULT[tipo]?.costoEstandar ?? 0),
      consumoTelaEstimado: Number(
        data.consumoTelaEstimado ?? TIPOS_DEFAULT[tipo]?.consumoTelaEstimado ?? 0
      ),
      precioVentaEstandar: Number(
        data.precioVentaEstandar ?? TIPOS_DEFAULT[tipo]?.precioVentaEstandar ?? 0
      ),
    },
  });
}

export async function listSueldos() {
  const existentes = await prisma.configSueldo.findMany();
  const faltantes = SUELDOS_DEFAULT.filter(
    (s) => !existentes.some((e) => e.nombre === s.nombre)
  );
  if (faltantes.length) {
    await prisma.configSueldo.createMany({ data: faltantes, skipDuplicates: true });
    return listSueldos();
  }
  return existentes.sort((a, b) => a.nombre.localeCompare(b.nombre));
}

export async function addSueldoHistorial(nombre, data) {
  return prisma.configSueldo.create({
    data: {
      nombre,
      monto: Number(data.monto ?? 0),
      fechaInicio: data.fechaInicio ? new Date(data.fechaInicio) : new Date(),
    },
  });
}

export async function updateSueldoHistorialEntry(id, data) {
  return prisma.configSueldo.update({
    where: { id },
    data: {
      ...(data.monto !== undefined && { monto: Number(data.monto) }),
      ...(data.fechaInicio !== undefined && { fechaInicio: new Date(data.fechaInicio) }),
    },
  });
}

export async function deleteSueldoHistorialEntry(id) {
  await prisma.configSueldo.delete({ where: { id } });
}

export async function deleteSueldoNombre(nombre) {
  await prisma.configSueldo.deleteMany({ where: { nombre } });
}

export async function listCostosFijos() {
  const existentes = await prisma.configCostoFijo.findMany();
  const faltantes = COSTOS_FIJOS_DEFAULT.filter(
    (c) => !existentes.some((e) => e.nombre === c.nombre)
  );
  if (faltantes.length) {
    await prisma.configCostoFijo.createMany({ data: faltantes, skipDuplicates: true });
    return listCostosFijos();
  }
  // Mantiene el orden del spec original en vez de alfabético
  const orden = COSTOS_FIJOS_DEFAULT.map((c) => c.nombre);
  return existentes.sort((a, b) => orden.indexOf(a.nombre) - orden.indexOf(b.nombre));
}

export async function addCostoFijoHistorial(nombre, data) {
  return prisma.configCostoFijo.create({
    data: {
      nombre,
      monto: Number(data.monto ?? 0),
      fechaInicio: data.fechaInicio ? new Date(data.fechaInicio) : new Date(),
    },
  });
}

export async function updateCostoFijoHistorialEntry(id, data) {
  return prisma.configCostoFijo.update({
    where: { id },
    data: {
      ...(data.monto !== undefined && { monto: Number(data.monto) }),
      ...(data.fechaInicio !== undefined && { fechaInicio: new Date(data.fechaInicio) }),
    },
  });
}

export async function deleteCostoFijoHistorialEntry(id) {
  await prisma.configCostoFijo.delete({ where: { id } });
}

export async function deleteCostoFijoNombre(nombre) {
  await prisma.configCostoFijo.deleteMany({ where: { nombre } });
}

export async function getFinanciero() {
  const existente = await prisma.configFinanciero.findUnique({ where: { id: 'main' } });
  if (existente) return existente;
  return prisma.configFinanciero.create({ data: { id: 'main' } });
}

export async function updateFinanciero(data) {
  return prisma.configFinanciero.upsert({
    where: { id: 'main' },
    update: {
      ...(data.cajaInicial !== undefined && { cajaInicial: Number(data.cajaInicial) }),
      ...(data.sueldoSocias !== undefined && { sueldoSocias: Number(data.sueldoSocias) }),
    },
    create: {
      id: 'main',
      cajaInicial: Number(data.cajaInicial ?? 9510917),
      sueldoSocias: Number(data.sueldoSocias ?? 0),
    },
  });
}

export async function getCostoEstandarPorTipo() {
  const tipos = await listTiposVestido();
  return tipos.reduce((acc, t) => {
    acc[t.tipo] = t.costoEstandar;
    return acc;
  }, {});
}

export async function getPrecioVentaPorTipo() {
  const tipos = await listTiposVestido();
  return tipos.reduce((acc, t) => {
    acc[t.tipo] = t.precioVentaEstandar;
    return acc;
  }, {});
}

export async function getConsumoTelaPorTipo() {
  const tipos = await listTiposVestido();
  return tipos.reduce((acc, t) => {
    acc[t.tipo] = t.consumoTelaEstimado;
    return acc;
  }, {});
}

// De un historial con varias filas por nombre, se queda con la más reciente
// (mayor fechaInicio) de cada nombre que ya esté vigente en mesKey, y
// descarta los nombres sin ninguna entrada vigente a esa fecha todavía.
// Evita sumar dos veces un mismo costo cuando tiene varios valores históricos.
export function seleccionarVigentePorNombre(detalle, mesKey) {
  const porNombre = new Map();
  for (const item of detalle) {
    if (monthKey(item.fechaInicio) > mesKey) continue;
    const actual = porNombre.get(item.nombre);
    if (!actual || new Date(item.fechaInicio) > new Date(actual.fechaInicio)) {
      porNombre.set(item.nombre, item);
    }
  }
  return [...porNombre.values()];
}

export async function getSueldosVigentes(fecha = new Date()) {
  const sueldos = await listSueldos();
  const vigentes = seleccionarVigentePorNombre(sueldos, monthKey(fecha));
  return vigentes.reduce((sum, s) => sum + s.monto, 0);
}

// Costos fijos vigentes en una fecha: sueldos de modistas + el resto de los costos fijos.
export async function getCostosFijosVigentes(fecha = new Date()) {
  const [sueldos, costosFijos] = await Promise.all([listSueldos(), listCostosFijos()]);
  const detalle = [
    ...sueldos.map((s) => ({ nombre: s.nombre, monto: s.monto, fechaInicio: s.fechaInicio })),
    ...costosFijos.map((c) => ({ nombre: c.nombre, monto: c.monto, fechaInicio: c.fechaInicio })),
  ];
  const vigentes = seleccionarVigentePorNombre(detalle, monthKey(fecha));
  return {
    total: vigentes.reduce((sum, c) => sum + c.monto, 0),
    detalle: vigentes,
  };
}
