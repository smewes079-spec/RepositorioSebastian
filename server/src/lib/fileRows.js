import { parse } from 'csv-parse/sync';
import ExcelJS from 'exceljs';

export function parseCsvBuffer(buffer) {
  return parse(buffer.toString('utf-8'), {
    columns: true,
    trim: true,
    skip_empty_lines: true,
    bom: true,
    relax_column_count: true,
  });
}

function celdaAValor(cell) {
  let value = cell.value;
  if (value && typeof value === 'object' && !(value instanceof Date)) {
    // Fórmulas: usar el resultado calculado; texto enriquecido: concatenar
    if (value.result !== undefined) value = value.result;
    else if (Array.isArray(value.richText)) value = value.richText.map((t) => t.text).join('');
    else if (value.text !== undefined) value = value.text;
  }
  return value ?? '';
}

export async function parseXlsxBuffer(buffer) {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer);
  const hoja = workbook.worksheets[0];
  if (!hoja) return [];

  const encabezados = [];
  hoja.getRow(1).eachCell({ includeEmpty: true }, (cell, colNumber) => {
    encabezados[colNumber] = String(celdaAValor(cell)).trim();
  });

  const filas = [];
  hoja.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;
    const obj = {};
    let tieneDatos = false;
    row.eachCell({ includeEmpty: true }, (cell, colNumber) => {
      const clave = encabezados[colNumber];
      if (!clave) return;
      const valor = celdaAValor(cell);
      if (valor !== '' && valor !== null && valor !== undefined) tieneDatos = true;
      obj[clave] = valor;
    });
    if (tieneDatos) filas.push(obj);
  });

  return filas;
}

export async function parseArchivoRows(buffer, nombreArchivo) {
  const esExcel = /\.(xlsx|xls)$/i.test(nombreArchivo || '');
  return esExcel ? parseXlsxBuffer(buffer) : parseCsvBuffer(buffer);
}
