const MESES = {
  ene: 0, feb: 1, mar: 2, abr: 3, may: 4, jun: 5,
  jul: 6, ago: 7, sep: 8, set: 8, oct: 9, nov: 10, dic: 11,
};

export function normalize(str) {
  return String(str ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

export function parseMonto(value) {
  if (value === null || value === undefined) return 0;
  const str = String(value).trim();
  if (!str) return 0;
  const negative = str.includes('-');
  const digits = str.replace(/[^0-9]/g, '');
  if (!digits) return 0;
  const num = parseInt(digits, 10);
  return negative ? -num : num;
}

export function parseFecha(value) {
  if (!value) return null;
  if (value instanceof Date) return isNaN(value.getTime()) ? null : value;
  const str = String(value).trim();
  if (!str) return null;

  // ISO: YYYY-MM-DD
  let m = str.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) return new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));

  // DD-MMM-YY o DD-MMM-YYYY (ej: 04-Ago-26)
  m = str.match(/^(\d{1,2})[-/]([a-zA-Z]+)[-/](\d{2,4})$/);
  if (m) {
    const mes = MESES[normalize(m[2]).slice(0, 3)];
    if (mes === undefined) return null;
    let year = parseInt(m[3], 10);
    if (year < 100) year += 2000;
    return new Date(Date.UTC(year, mes, parseInt(m[1], 10)));
  }

  // DD/MM/YYYY o DD-MM-YYYY
  m = str.match(/^(\d{1,2})[-/](\d{1,2})[-/](\d{2,4})$/);
  if (m) {
    let year = parseInt(m[3], 10);
    if (year < 100) year += 2000;
    return new Date(Date.UTC(year, parseInt(m[2], 10) - 1, parseInt(m[1], 10)));
  }

  const asDate = new Date(str);
  if (!isNaN(asDate.getTime())) return asDate;

  return null;
}

export function getField(row, ...names) {
  for (const name of names) {
    for (const key of Object.keys(row)) {
      if (normalize(key) === normalize(name)) return row[key];
    }
  }
  return undefined;
}
