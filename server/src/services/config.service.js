import { prisma } from '../lib/prisma.js';

const TIPOS_DEFAULT = {
  NOVIA: { costoEstandar: 568000, consumoTelaEstimado: 8 },
  MADRINA: { costoEstandar: 472479, consumoTelaEstimado: 5 },
  INVITADA: { costoEstandar: 183613, consumoTelaEstimado: 3 },
  CIVIL: { costoEstandar: 183613, consumoTelaEstimado: 3 },
};

const SUELDOS_DEFAULT = [
  { nombre: 'Modista 1', monto: 1200000, fechaInicio: new Date(Date.UTC(2026, 2, 1)) },
  { nombre: 'Modista 2', monto: 1500000, fechaInicio: new Date(Date.UTC(2026, 5, 1)) },
];

export async function listTiposVestido() {
  const existentes = await prisma.configTipoVestido.findMany();
  const faltantes = Object.keys(TIPOS_DEFAULT).filter(
    (tipo) => !existentes.some((e) => e.tipo === tipo)
  );
  if (faltantes.length) {
    await prisma.$transaction(
      faltantes.map((tipo) =>
        prisma.configTipoVestido.create({ data: { tipo, ...TIPOS_DEFAULT[tipo] } })
      )
    );
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
    },
    create: {
      tipo,
      costoEstandar: Number(data.costoEstandar ?? TIPOS_DEFAULT[tipo]?.costoEstandar ?? 0),
      consumoTelaEstimado: Number(
        data.consumoTelaEstimado ?? TIPOS_DEFAULT[tipo]?.consumoTelaEstimado ?? 0
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
    await prisma.$transaction(faltantes.map((s) => prisma.configSueldo.create({ data: s })));
    return listSueldos();
  }
  return existentes.sort((a, b) => a.nombre.localeCompare(b.nombre));
}

export async function updateSueldo(nombre, data) {
  return prisma.configSueldo.upsert({
    where: { nombre },
    update: {
      ...(data.monto !== undefined && { monto: Number(data.monto) }),
      ...(data.fechaInicio !== undefined && { fechaInicio: new Date(data.fechaInicio) }),
    },
    create: {
      nombre,
      monto: Number(data.monto ?? 0),
      fechaInicio: data.fechaInicio ? new Date(data.fechaInicio) : new Date(),
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

export async function getConsumoTelaPorTipo() {
  const tipos = await listTiposVestido();
  return tipos.reduce((acc, t) => {
    acc[t.tipo] = t.consumoTelaEstimado;
    return acc;
  }, {});
}

export async function getSueldosVigentes(fecha = new Date()) {
  const sueldos = await listSueldos();
  return sueldos.reduce((sum, s) => (new Date(s.fechaInicio) <= fecha ? sum + s.monto : sum), 0);
}
