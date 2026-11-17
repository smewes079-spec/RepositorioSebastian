-- CreateTable
CREATE TABLE "GmailConexion" (
    "remitente" "CotizacionRemitente" NOT NULL,
    "email" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "conectadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "conectadoPorId" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "GmailConexion_pkey" PRIMARY KEY ("remitente")
);
