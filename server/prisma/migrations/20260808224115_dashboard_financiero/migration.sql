-- AlterTable
ALTER TABLE "ConfigTipoVestido" ADD COLUMN     "precioVentaEstandar" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "ConfigCostoFijo" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "monto" INTEGER NOT NULL,
    "fechaInicio" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConfigCostoFijo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConfigFinanciero" (
    "id" TEXT NOT NULL DEFAULT 'main',
    "cajaInicial" INTEGER NOT NULL DEFAULT 9510917,
    "sueldoSocias" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConfigFinanciero_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PresupuestoVenta" (
    "id" TEXT NOT NULL,
    "tipo" "TipoVestido" NOT NULL,
    "mes" TIMESTAMP(3) NOT NULL,
    "cantidad" INTEGER NOT NULL,
    "montoTotal" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PresupuestoVenta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PresupuestoCuota" (
    "id" TEXT NOT NULL,
    "presupuestoVentaId" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "monto" INTEGER NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PresupuestoCuota_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ConfigCostoFijo_nombre_key" ON "ConfigCostoFijo"("nombre");

-- CreateIndex
CREATE INDEX "PresupuestoVenta_mes_idx" ON "PresupuestoVenta"("mes");

-- CreateIndex
CREATE UNIQUE INDEX "PresupuestoVenta_tipo_mes_key" ON "PresupuestoVenta"("tipo", "mes");

-- CreateIndex
CREATE UNIQUE INDEX "PresupuestoCuota_presupuestoVentaId_numero_key" ON "PresupuestoCuota"("presupuestoVentaId", "numero");

-- AddForeignKey
ALTER TABLE "PresupuestoCuota" ADD CONSTRAINT "PresupuestoCuota_presupuestoVentaId_fkey" FOREIGN KEY ("presupuestoVentaId") REFERENCES "PresupuestoVenta"("id") ON DELETE CASCADE ON UPDATE CASCADE;

