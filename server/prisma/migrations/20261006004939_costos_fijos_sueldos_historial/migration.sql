-- DropIndex
DROP INDEX "ConfigCostoFijo_nombre_key";

-- DropIndex
DROP INDEX "ConfigSueldo_nombre_key";

-- CreateIndex
CREATE INDEX "ConfigCostoFijo_nombre_idx" ON "ConfigCostoFijo"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "ConfigCostoFijo_nombre_fechaInicio_key" ON "ConfigCostoFijo"("nombre", "fechaInicio");

-- CreateIndex
CREATE INDEX "ConfigSueldo_nombre_idx" ON "ConfigSueldo"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "ConfigSueldo_nombre_fechaInicio_key" ON "ConfigSueldo"("nombre", "fechaInicio");

