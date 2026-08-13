-- Convierte cualquier compra existente con tipoAsignacion = CONSUMO_ESTIMADO a
-- PRORRATEO antes de eliminar ese valor del enum, para no perder compras ya
-- registradas. Las asignaciones a vestidos (PurchaseAssignment) ya calculadas
-- no se tocan: quedan exactamente igual, solo cambia la etiqueta del tipo.
UPDATE "Purchase" SET "tipoAsignacion" = 'PRORRATEO' WHERE "tipoAsignacion" = 'CONSUMO_ESTIMADO';

-- AlterEnum
BEGIN;
CREATE TYPE "TipoAsignacion_new" AS ENUM ('DIRECTO', 'PRORRATEO');
ALTER TABLE "Purchase" ALTER COLUMN "tipoAsignacion" TYPE "TipoAsignacion_new" USING ("tipoAsignacion"::text::"TipoAsignacion_new");
ALTER TYPE "TipoAsignacion" RENAME TO "TipoAsignacion_old";
ALTER TYPE "TipoAsignacion_new" RENAME TO "TipoAsignacion";
DROP TYPE "TipoAsignacion_old";
COMMIT;

-- AlterTable
ALTER TABLE "Purchase" DROP COLUMN "cantidadComprada",
DROP COLUMN "consumoCivil",
DROP COLUMN "consumoInvitada",
DROP COLUMN "consumoMadrina",
DROP COLUMN "consumoNovia",
DROP COLUMN "unidadMedida";
