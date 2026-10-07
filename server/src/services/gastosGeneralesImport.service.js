import { normalize, parseMonto, parseFecha, getField } from '../lib/parseUtils.js';
import * as gastosGeneralesService from './gastosGenerales.service.js';

function normalizeLoose(str) {
  return normalize(str).replace(/[^a-z0-9]/g, '');
}

const CATEGORIA_MAP = {
  cafeteriayaseo: 'CAFETERIA_Y_ASEO',
  cafeteria: 'CAFETERIA_Y_ASEO',
  aseo: 'CAFETERIA_Y_ASEO',
  transporteyestacionamiento: 'TRANSPORTE_ESTACIONAMIENTO',
  transporte: 'TRANSPORTE_ESTACIONAMIENTO',
  estacionamiento: 'TRANSPORTE_ESTACIONAMIENTO',
  mobiliarioyequipamiento: 'MOBILIARIO_Y_EQUIPAMIENTO',
  mobiliario: 'MOBILIARIO_Y_EQUIPAMIENTO',
  equipamiento: 'MOBILIARIO_Y_EQUIPAMIENTO',
  impuestoslegalybancos: 'IMPUESTOS_LEGAL_BANCOS',
  impuestos: 'IMPUESTOS_LEGAL_BANCOS',
  legal: 'IMPUESTOS_LEGAL_BANCOS',
  bancos: 'IMPUESTOS_LEGAL_BANCOS',
  otros: 'OTROS',
};

function parseCategoria(value) {
  return CATEGORIA_MAP[normalizeLoose(value)] || null;
}

export async function importGastosGeneralesRows(rows, usuarioId) {
  const creadas = [];
  const errores = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const lineNum = i + 2; // considerando encabezado

    try {
      const fechaRaw = getField(row, 'FECHA', 'FECHA GASTO');
      const categoriaRaw = getField(row, 'CATEGORIA', 'CATEGORÍA');
      const descripcion = getField(row, 'DESCRIPCION', 'DESCRIPCIÓN');
      const montoRaw = getField(row, 'MONTO TOTAL', 'MONTO');

      if (!descripcion) {
        errores.push({ linea: lineNum, error: 'Falta la descripción' });
        continue;
      }

      const fecha = parseFecha(fechaRaw);
      if (!fecha) {
        errores.push({ linea: lineNum, error: `Fecha inválida: "${fechaRaw}"` });
        continue;
      }

      const categoria = parseCategoria(categoriaRaw);
      if (!categoria) {
        errores.push({
          linea: lineNum,
          error: `Categoría inválida: "${categoriaRaw}" (usa: Cafetería y aseo, Transporte y estacionamiento, Mobiliario y equipamiento, Impuestos legal y bancos, Otros)`,
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
      };

      await gastosGeneralesService.createGastoGeneral(data, usuarioId);
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
