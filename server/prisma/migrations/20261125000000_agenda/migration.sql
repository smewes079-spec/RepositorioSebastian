-- CreateEnum
CREATE TYPE "OrigenAsesoria" AS ENUM ('MANUAL', 'WEB');

-- AlterTable
ALTER TABLE "Asesoria" ADD COLUMN     "asignadaA" "CotizacionRemitente",
ADD COLUMN     "fechaEvento" TIMESTAMP(3),
ADD COLUMN     "googleEventId" TEXT,
ADD COLUMN     "origen" "OrigenAsesoria" NOT NULL DEFAULT 'MANUAL',
ADD COLUMN     "segmento" "TipoVestido";

-- AlterTable
ALTER TABLE "GmailConexion" ADD COLUMN     "scopes" TEXT;

-- CreateTable
CREATE TABLE "ConfigAgenda" (
    "id" TEXT NOT NULL DEFAULT 'main',
    "whatsapp" TEXT,
    "mesesMinimoMadrina" INTEGER NOT NULL DEFAULT 7,
    "mesesMinimoInvitada" INTEGER NOT NULL DEFAULT 5,
    "abiertoNovia" BOOLEAN NOT NULL DEFAULT true,
    "abiertoMadrina" BOOLEAN NOT NULL DEFAULT true,
    "abiertoInvitada" BOOLEAN NOT NULL DEFAULT true,
    "diasSemana" TEXT NOT NULL DEFAULT '1,2,3,4,5',
    "horaInicio" INTEGER NOT NULL DEFAULT 10,
    "horaFin" INTEGER NOT NULL DEFAULT 18,
    "diasHorizonte" INTEGER NOT NULL DEFAULT 90,
    "horasAvisoMinimo" INTEGER NOT NULL DEFAULT 24,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConfigAgenda_pkey" PRIMARY KEY ("id")
);

