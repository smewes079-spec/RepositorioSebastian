-- CreateEnum
CREATE TYPE "TipoVestido" AS ENUM ('NOVIA', 'MADRINA', 'INVITADA', 'CIVIL');

-- CreateEnum
CREATE TYPE "EstadoVenta" AS ENUM ('NO_ENTREGADO', 'ENTREGADO');

-- CreateEnum
CREATE TYPE "KanbanEstado" AS ENUM ('PENDIENTE', 'EN_CONFECCION', 'LISTO_ENTREGA', 'ENTREGADO');

-- CreateTable
CREATE TABLE "Venta" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "nombreClienta" TEXT NOT NULL,
    "tipo" "TipoVestido" NOT NULL,
    "fechaVenta" TIMESTAMP(3) NOT NULL,
    "fechaEvento" TIMESTAMP(3) NOT NULL,
    "precioTotal" INTEGER NOT NULL,
    "estado" "EstadoVenta" NOT NULL DEFAULT 'NO_ENTREGADO',
    "kanbanEstado" "KanbanEstado" NOT NULL DEFAULT 'PENDIENTE',
    "notas" TEXT,
    "notasProduccion" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Venta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cuota" (
    "id" TEXT NOT NULL,
    "ventaId" TEXT NOT NULL,
    "numero" INTEGER NOT NULL,
    "monto" INTEGER NOT NULL,
    "fechaProgramada" TIMESTAMP(3) NOT NULL,
    "pagada" BOOLEAN NOT NULL DEFAULT false,
    "fechaPago" TIMESTAMP(3),
    "montoPagado" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Cuota_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Venta_codigo_key" ON "Venta"("codigo");

-- CreateIndex
CREATE INDEX "Venta_tipo_idx" ON "Venta"("tipo");

-- CreateIndex
CREATE INDEX "Venta_estado_idx" ON "Venta"("estado");

-- CreateIndex
CREATE INDEX "Venta_fechaVenta_idx" ON "Venta"("fechaVenta");

-- CreateIndex
CREATE INDEX "Venta_fechaEvento_idx" ON "Venta"("fechaEvento");

-- CreateIndex
CREATE UNIQUE INDEX "Cuota_ventaId_numero_key" ON "Cuota"("ventaId", "numero");

-- AddForeignKey
ALTER TABLE "Cuota" ADD CONSTRAINT "Cuota_ventaId_fkey" FOREIGN KEY ("ventaId") REFERENCES "Venta"("id") ON DELETE CASCADE ON UPDATE CASCADE;
