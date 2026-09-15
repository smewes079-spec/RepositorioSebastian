import { normalize, parseFecha, parseMonto, getField } from '../lib/parseUtils.js';
import * as cotizacionesService from './cotizaciones.service.js';

const TIPO_MAP = {
  novia: 'NOVIA',
  madrina: 'MADRINA',
  invitada: 'INVITADA',
  civil: 'CIVIL',
};

const REMITENTE_MAP = {
  maria: 'MARIA',
  'maría': 'MARIA',
  caro: 'CARO',
  carolina: 'CARO',
};

function parseTipo(value) {
  return TIPO_MAP[normalize(value)] || null;
}

function parseRemitente(value) {
  if (!value) return null;
  return REMITENTE_MAP[normalize(value)] || null;
}

function itemsFromRow(row) {
  const items = [];
  for (let n = 1; n <= 3; n++) {
    const descripcion = getField(row, `ITEM ${n} DESCRIPCION`, `ITEM ${n} DESCRIPCIÓN`);
    if (!descripcion) continue;
    const cantidadRaw = getField(row, `ITEM ${n} CANTIDAD`);
    const montoRaw = getField(row, `ITEM ${n} MONTO`);
    items.push({
      orden: n,
      descripcion: String(descripcion).trim(),
      cantidad: cantidadRaw ? parseMonto(cantidadRaw) || 1 : 1,
      monto: parseMonto(montoRaw),
    });
  }
  return items;
}

export async function importCotizacionesRows(rows) {
  const creadas = [];
  const errores = [];

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const lineNum = i + 2; // considerando encabezado

    try {
      const nombreClienta = getField(row, 'NOMBRE CLIENTA', 'NOMBRE');
      const emailClienta = getField(row, 'EMAIL CLIENTA', 'CORREO', 'EMAIL');
      const telefonoClienta = getField(row, 'TELEFONO', 'TELÉFONO');
      const tipoRaw = getField(row, 'TIPO');
      const fechaEventoRaw = getField(row, 'FECHA EVENTO');
      const validezDiasRaw = getField(row, 'VALIDEZ DIAS', 'VALIDEZ DÍAS');
      const remitenteRaw = getField(row, 'REMITENTE');
      const notas = getField(row, 'NOTAS');

      if (!nombreClienta) {
        errores.push({ linea: lineNum, error: 'Falta el nombre de la clienta' });
        continue;
      }
      if (!emailClienta) {
        errores.push({ linea: lineNum, error: 'Falta el correo de la clienta' });
        continue;
      }

      const tipo = parseTipo(tipoRaw);
      if (!tipo) {
        errores.push({ linea: lineNum, error: `Tipo inválido: "${tipoRaw}" (usa: Novia, Madrina, Invitada o Civil)` });
        continue;
      }

      const remitente = parseRemitente(remitenteRaw);
      if (remitenteRaw && !remitente) {
        errores.push({ linea: lineNum, error: `Remitente inválido: "${remitenteRaw}" (usa: María o Carolina, o deja vacío)` });
        continue;
      }

      const items = itemsFromRow(row);
      if (items.length === 0) {
        errores.push({ linea: lineNum, error: 'Debes indicar al menos un ítem (ITEM 1 DESCRIPCION / CANTIDAD / MONTO)' });
        continue;
      }

      const fechaEventoTentativa = fechaEventoRaw ? parseFecha(fechaEventoRaw) : null;
      if (fechaEventoRaw && !fechaEventoTentativa) {
        errores.push({ linea: lineNum, error: `Fecha de evento inválida: "${fechaEventoRaw}"` });
        continue;
      }

      await cotizacionesService.createCotizacion({
        nombreClienta: String(nombreClienta).trim(),
        emailClienta: String(emailClienta).trim(),
        telefonoClienta: telefonoClienta ? String(telefonoClienta).trim() : null,
        tipo,
        fechaEventoTentativa: fechaEventoTentativa ? fechaEventoTentativa.toISOString() : null,
        validezDias: validezDiasRaw ? parseMonto(validezDiasRaw) || 15 : 15,
        notas: notas ? String(notas).trim() : null,
        remitente,
        items,
      });
      creadas.push(String(nombreClienta));
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
