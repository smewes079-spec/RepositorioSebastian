function normalize(str) {
  return String(str ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

function inicial(palabra, idx = 0) {
  const norm = normalize(palabra);
  return (norm.charAt(idx) || norm.charAt(0) || '').toUpperCase();
}

// Misma fórmula que server/src/lib/codigoVenta.js (duplicada: no hay paquete
// compartido entre server/ y client/ en este monorepo de workspaces).
// Inicial del nombre + inicial del apellido + fecha del evento en DDMMYY.
export function calcularCodigoVenta(nombreClienta, fecha) {
  const palabras = String(nombreClienta ?? '').trim().split(/\s+/).filter(Boolean);
  let inicial1;
  let inicial2;
  if (palabras.length > 1) {
    inicial1 = inicial(palabras[0]);
    inicial2 = inicial(palabras[palabras.length - 1]);
  } else {
    inicial1 = inicial(palabras[0] ?? '', 0);
    inicial2 = inicial(palabras[0] ?? '', 1);
  }

  const d = new Date(fecha);
  const dd = String(d.getUTCDate()).padStart(2, '0');
  const mm = String(d.getUTCMonth() + 1).padStart(2, '0');
  const yy = String(d.getUTCFullYear()).slice(-2);

  return `${inicial1}${inicial2}${dd}${mm}${yy}`;
}
