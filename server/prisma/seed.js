import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const TIPOS_DEFAULT = [
  { tipo: 'NOVIA', costoEstandar: 568000, consumoTelaEstimado: 8 },
  { tipo: 'MADRINA', costoEstandar: 472479, consumoTelaEstimado: 5 },
  { tipo: 'INVITADA', costoEstandar: 183613, consumoTelaEstimado: 3 },
  { tipo: 'CIVIL', costoEstandar: 183613, consumoTelaEstimado: 3 },
];

const SUELDOS_DEFAULT = [
  { nombre: 'Modista 1', monto: 1200000, fechaInicio: new Date(Date.UTC(2026, 2, 1)) },
  { nombre: 'Modista 2', monto: 1500000, fechaInicio: new Date(Date.UTC(2026, 5, 1)) },
];

async function main() {
  for (const t of TIPOS_DEFAULT) {
    await prisma.configTipoVestido.upsert({
      where: { tipo: t.tipo },
      update: {},
      create: t,
    });
  }
  for (const s of SUELDOS_DEFAULT) {
    await prisma.configSueldo.upsert({
      where: { nombre: s.nombre },
      update: {},
      create: s,
    });
  }
  console.log('Configuración por defecto lista (costos estándar, consumos de tela, sueldos modistas).');
  console.log('El historial de ventas se carga desde la UI en Ventas > Importar CSV.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
