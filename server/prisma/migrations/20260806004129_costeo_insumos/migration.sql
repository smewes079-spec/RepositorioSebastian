-- CreateEnum
CREATE TYPE "CategoriaInsumo" AS ENUM ('TELA', 'FORRO', 'ENCAJE_ADORNO', 'CIERRE_BOTONES', 'HILOS_AGUJAS_ALFILERES', 'OTROS_MATERIALES');

-- CreateEnum
CREATE TYPE "TipoAsignacion" AS ENUM ('DIRECTO', 'CONSUMO_ESTIMADO', 'PRORRATEO');

-- AlterTable
ALTER TABLE "Venta" ADD COLUMN     "fechaEntrega" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "Purchase" (
    "id" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "categoria" "CategoriaInsumo" NOT NULL,
    "descripcion" TEXT NOT NULL,
    "montoTotal" INTEGER NOT NULL,
    "tipoAsignacion" "TipoAsignacion" NOT NULL,
    "unidadMedida" TEXT,
    "cantidadComprada" DOUBLE PRECISION,
    "consumoNovia" DOUBLE PRECISION,
    "consumoMadrina" DOUBLE PRECISION,
    "consumoInvitada" DOUBLE PRECISION,
    "consumoCivil" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Purchase_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PurchaseAssignment" (
    "id" TEXT NOT NULL,
    "purchaseId" TEXT NOT NULL,
    "ventaId" TEXT NOT NULL,
    "montoAsignado" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PurchaseAssignment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConfigTipoVestido" (
    "id" TEXT NOT NULL,
    "tipo" "TipoVestido" NOT NULL,
    "costoEstandar" INTEGER NOT NULL,
    "consumoTelaEstimado" DOUBLE PRECISION NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConfigTipoVestido_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ConfigSueldo" (
    "id" TEXT NOT NULL,
    "nombre" TEXT NOT NULL,
    "monto" INTEGER NOT NULL,
    "fechaInicio" TIMESTAMP(3) NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConfigSueldo_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Purchase_categoria_idx" ON "Purchase"("categoria");

-- CreateIndex
CREATE INDEX "Purchase_tipoAsignacion_idx" ON "Purchase"("tipoAsignacion");

-- CreateIndex
CREATE INDEX "Purchase_fecha_idx" ON "Purchase"("fecha");

-- CreateIndex
CREATE INDEX "PurchaseAssignment_ventaId_idx" ON "PurchaseAssignment"("ventaId");

-- CreateIndex
CREATE INDEX "PurchaseAssignment_purchaseId_idx" ON "PurchaseAssignment"("purchaseId");

-- CreateIndex
CREATE UNIQUE INDEX "ConfigTipoVestido_tipo_key" ON "ConfigTipoVestido"("tipo");

-- CreateIndex
CREATE UNIQUE INDEX "ConfigSueldo_nombre_key" ON "ConfigSueldo"("nombre");

-- AddForeignKey
ALTER TABLE "PurchaseAssignment" ADD CONSTRAINT "PurchaseAssignment_purchaseId_fkey" FOREIGN KEY ("purchaseId") REFERENCES "Purchase"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PurchaseAssignment" ADD CONSTRAINT "PurchaseAssignment_ventaId_fkey" FOREIGN KEY ("ventaId") REFERENCES "Venta"("id") ON DELETE CASCADE ON UPDATE CASCADE;
