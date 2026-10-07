-- AlterTable
ALTER TABLE "GastoGeneral" ADD COLUMN     "comprobanteDatos" BYTEA,
ADD COLUMN     "comprobanteMime" TEXT,
ADD COLUMN     "comprobanteNombre" TEXT,
ADD COLUMN     "comprobanteTamano" INTEGER;

-- AlterTable
ALTER TABLE "Purchase" ADD COLUMN     "comprobanteDatos" BYTEA,
ADD COLUMN     "comprobanteMime" TEXT,
ADD COLUMN     "comprobanteNombre" TEXT,
ADD COLUMN     "comprobanteTamano" INTEGER;

