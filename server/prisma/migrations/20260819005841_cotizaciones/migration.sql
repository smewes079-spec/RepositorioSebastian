-- CreateEnum
CREATE TYPE "CotizacionEstado" AS ENUM ('PENDIENTE', 'ENVIADA', 'ACEPTADA', 'RECHAZADA');

--

-- CreateTable
CREATE TABLE "Cotizacion" (
    "id" TEXT NOT NULL,
    "nombreClienta" TEXT NOT NULL,
    "emailClienta" TEXT NOT NULL,
    "telefonoClienta" TEXT,
    "tipo" "TipoVestido" NOT NULL,
    "fechaEventoTentativa" TIMESTAMP(3),
    "validezDias" INTEGER NOT NULL DEFAULT 15,
    "notas" TEXT,
    "estado" "CotizacionEstado" NOT NULL DEFAULT 'PENDIENTE',
    "fechaEnvio" TIMESTAMP(3),
    "fechaRespuesta" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ventaId" TEXT,

    CONSTRAINT "Cotizacion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CotizacionItem" (
    "id" TEXT NOT NULL,
    "cotizacionId" TEXT NOT NULL,
    "orden" INTEGER NOT NULL,
    "descripcion" TEXT NOT NULL,
    "cantidad" INTEGER NOT NULL DEFAULT 1,
    "monto" INTEGER NOT NULL,

    CONSTRAINT "CotizacionItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Cotizacion_ventaId_key" ON "Cotizacion"("ventaId");

-- CreateIndex
CREATE INDEX "Cotizacion_estado_idx" ON "Cotizacion"("estado");

-- CreateIndex
CREATE INDEX "Cotizacion_tipo_idx" ON "Cotizacion"("tipo");

-- CreateIndex
CREATE INDEX "CotizacionItem_cotizacionId_idx" ON "CotizacionItem"("cotizacionId");

-- AddForeignKey
ALTER TABLE "Cotizacion" ADD CONSTRAINT "Cotizacion_ventaId_fkey" FOREIGN KEY ("ventaId") REFERENCES "Venta"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CotizacionItem" ADD CONSTRAINT "CotizacionItem_cotizacionId_fkey" FOREIGN KEY ("cotizacionId") REFERENCES "Cotizacion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

