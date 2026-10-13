-- CreateTable
CREATE TABLE "Asesoria" (
    "id" TEXT NOT NULL,
    "fecha" TIMESTAMP(3) NOT NULL,
    "nombreClienta" TEXT NOT NULL,
    "emailClienta" TEXT,
    "telefonoClienta" TEXT,
    "monto" INTEGER NOT NULL,
    "notas" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "creadoPorId" TEXT,
    "actualizadoPorId" TEXT,

    CONSTRAINT "Asesoria_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Asesoria_fecha_idx" ON "Asesoria"("fecha");

-- AddForeignKey
ALTER TABLE "Asesoria" ADD CONSTRAINT "Asesoria_creadoPorId_fkey" FOREIGN KEY ("creadoPorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Asesoria" ADD CONSTRAINT "Asesoria_actualizadoPorId_fkey" FOREIGN KEY ("actualizadoPorId") REFERENCES "Usuario"("id") ON DELETE SET NULL ON UPDATE CASCADE;

