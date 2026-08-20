-- CreateEnum
CREATE TYPE "CotizacionRemitente" AS ENUM ('MARIA', 'CARO');

-- AlterTable
ALTER TABLE "Cotizacion" ADD COLUMN     "remitente" "CotizacionRemitente";


