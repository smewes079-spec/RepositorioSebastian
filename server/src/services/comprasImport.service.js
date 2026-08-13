import { prisma } from '../lib/prisma.js';
import { normalize, parseMonto, parseFecha, getField } from '../lib/parseUtils.js';
import * as purchasesService from './purchases.service.js';

function normalizeLoose(str) {
  return normalize(str).replace(/[^a-z0-9]/g, '');
}

const CATEGORIA_MAP = {
  tela: 'TELA',
  forro: 'FORRO',
  encajeadorno: 'ENCAJE_ADORNO',
  encaje: 'ENCAJE_ADORNO',
  adorno: 'ENCAJE_ADORNO',
  cierrebotones: 'CIERRE_BOTONES',
  cierre: 'CIERRE_BOTONES',
  botones: 'CIERRE_BOTONES',
  hilosagujasalfileres: 'HILOS_AGUJAS_ALFILERES',
  hilosagujasyalfileres: 'HILOS_AGUJAS_ALFILERES',
  hilos: 'HILOS_AGUJAS_ALFILERES',
  otrosmateriales: 'OTROS_MATERIALES',
  otros: 'OTROS_MATERIALES',
};

const TIPO_ASIGNACION_MAP = {
  directo: 'DIRECTO',
  directoaunvestido: 'DIRECTO',
  prorrateo: 'PRORRATEO',
  prorrateoentrevestidosactivos: 'PRORRATEO',
};

function parseCategoria(value) {
  return CATEGORIA_MAP[normalizeLoose(value)] || null;
}

function parseTipoAsignacion(value) {
  return TIPO_ASIGNACION_MAP[normalizeLoose(value)] || null;
}

export async function importComprasRows(rows) {
  const creadas = [];
  const errores = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const lineNum = i + 2; // considerando encabezado

    try {
      const fechaRaw = getField(row, 'FECHA COMPRA', 'FECHA');
      const categoriaRaw = getField(row, 'CATEGORIA', 'CATEGORÍA');
      const descripcion = getField(row, 'DESCRIPCION', 'DESCRIPCIÓN');
      const montoRaw = getField(row, 'MONTO TOTAL', 'MONTO');
      const tipoAsigRaw = getField(row, 'TIPO ASIGNACION', 'TIPO ASIGNACIÓN', 'TIPO DE ASIGNACION');
      const codigoVenta = getField(row, 'CODIGO VENTA', 'CÓDIGO VENTA');

      if (!descripcion) {
        errores.push({ linea: lineNum, error: 'Falta la descripción' });
        continue;
      }

      const fecha = parseFecha(fechaRaw);
      if (!fecha) {
        errores.push({ linea: lineNum, error: `Fecha de compra inválida: "${fechaRaw}"` });
        continue;
      }

      const categoria = parseCategoria(categoriaRaw);
      if (!categoria) {
        errores.push({
          linea: lineNum,
          error: `Categoría inválida: "${categoriaRaw}" (usa: Tela, Forro, Encaje / Adorno, Cierre / Botones, Hilos / Agujas / Alfileres, Otros materiales)`,
        });
        continue;
      }

      const tipoAsignacion = parseTipoAsignacion(tipoAsigRaw);
      if (!tipoAsignacion) {
        errores.push({
          linea: lineNum,
          error: `Tipo de asignación inválido: "${tipoAsigRaw}" (usa: Directo o Prorrateo)`,
        });
        continue;
      }

      const montoTotal = parseMonto(montoRaw);
      if (!montoTotal || montoTotal <= 0) {
        errores.push({ linea: lineNum, error: 'El monto total debe ser mayor a 0' });
        continue;
      }

      const data = {
        fecha: fecha.toISOString(),
        categoria,
        descripcion: String(descripcion).trim(),
        montoTotal,
        tipoAsignacion,
      };

      if (tipoAsignacion === 'DIRECTO') {
        if (!codigoVenta) {
          errores.push({ linea: lineNum, error: 'Falta el CÓDIGO VENTA para asignación directa' });
          continue;
        }
        const venta = await prisma.venta.findUnique({ where: { codigo: String(codigoVenta).trim() } });
        if (!venta) {
          errores.push({ linea: lineNum, error: `No existe ninguna venta con código "${codigoVenta}"` });
          continue;
        }
        data.ventaId = venta.id;
      }

      await purchasesService.createPurchase(data);
      creadas.push(String(descripcion));
    } catch (err) {
      errores.push({ linea: lineNum, error: err.message });
    }
  }

  return {
    totalFilas: rows.length,
    creadas: creadas.length,
    errores,
  };
}
