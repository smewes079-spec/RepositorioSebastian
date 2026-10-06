-- CreateEnum
CREATE TYPE "CategoriaGastoGeneral" AS ENUM ('CAFETERIA_Y_ASEO', 'TRANSPORTE_ESTACIONAMIENTO', 'MOBILIARIO_Y_EQUIPAMIENTO', 'OTROS');

-- CreateTable
CREATE TABLE "GastoGeneral" (
    "id" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "categoria" "CategoriaGastoGeneral" NOT NULL,
    "descripcion" TEXT NOT NULL,
    "montoTotal" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "creadoPorId" TEXT,
    "actualizadoPorId" TEXT,

    CONSTRAINT "GastoGeneral_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "GastoGeneral_categoria_idx" ON "GastoGeneral"("categoria");

-- CreateIndex
CREATE INDEX "GastoGeneral_fecha_idx" ON "GastoGeneral"("fecha");

-- AddForeignKey
ALTER TABLE "GastoGeneral" ADD CONSTRAINT "GastoGeneral_creadoPorId_fkey" FOREIGN KEY ("creadoPorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "GastoGeneral" ADD CONSTRAINT "GastoGeneral_actualizadoPorId_fkey" FOREIGN KEY ("actualizadoPorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

