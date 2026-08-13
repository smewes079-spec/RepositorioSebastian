const MESES_CORTOS = [
  'Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun',
  'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic',
];

const MESES_LARGOS = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
];

export function formatCLP(value) {
  const n = Math.round(Number(value) || 0);
  return `$${n.toLocaleString('es-CL')}`;
}

export function formatFecha(value) {
  if (!value) return '';
  const d = new Date(value);
  if (isNaN(d.getTime())) return '';
  const dd = String(d.getUTCDate()).padStart(2, '0');
  const mmm = MESES_CORTOS[d.getUTCMonth()];
  const yy = String(d.getUTCFullYear()).slice(-2);
  return `${dd}-${mmm}-${yy}`;
}

export function formatMesLargo(value) {
  if (!value) return '';
  const d = new Date(value);
  return `${MESES_LARGOS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

// Recibe una clave "YYYY-MM" (la que usan los servicios de dashboard) y la
// muestra como "Ago-26", consistente con el formato DD-MMM-YY del resto de la app.
export function formatMesCorto(mesKey) {
  if (!mesKey) return '';
  const [y, m] = mesKey.split('-').map(Number);
  return `${MESES_CORTOS[m - 1]}-${String(y).slice(-2)}`;
}

export function toInputDate(value) {
  if (!value) return '';
  const d = new Date(value);
  if (isNaN(d.getTime())) return '';
  return d.toISOString().slice(0, 10);
}

export function diasHasta(value) {
  if (!value) return null;
  const hoy = new Date();
  const hoyUTC = Date.UTC(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
  const d = new Date(value);
  const target = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  return Math.round((target - hoyUTC) / (1000 * 60 * 60 * 24));
}

export const TIPO_LABELS = {
  NOVIA: 'Novia',
  MADRINA: 'Madrina',
  INVITADA: 'Invitada',
  CIVIL: 'Civil',
};

export const ESTADO_LABELS = {
  NO_ENTREGADO: 'No entregado',
  ENTREGADO: 'Entregado',
};

export const KANBAN_LABELS = {
  PENDIENTE: 'Pendiente',
  EN_CONFECCION: 'En Confección',
  LISTO_ENTREGA: 'Listo para Entrega',
  ENTREGADO: 'Entregado',
};

export const KANBAN_COLORS = {
  PENDIENTE: { bg: '#EDEBE7', text: '#8A7F75' },
  EN_CONFECCION: { bg: '#FBF3E3', text: '#B8873F' },
  LISTO_ENTREGA: { bg: '#E7EEF5', text: '#4A7A9E' },
  ENTREGADO: { bg: '#E6EEEA', text: '#5C8C6A' },
};

export const TIPO_COLORS = {
  NOVIA: { bg: '#F3ECE4', text: '#8A6D3B', dot: '#C9A96E' },
  MADRINA: { bg: '#EFE7F1', text: '#6B4C7A', dot: '#9B6FAE' },
  INVITADA: { bg: '#E6EEEA', text: '#3E6350', dot: '#5C8C6A' },
  CIVIL: { bg: '#EDE7E3', text: '#5B4A3F', dot: '#8C7565' },
};

export const CATEGORIA_LABELS = {
  TELA: 'Tela',
  FORRO: 'Forro',
  ENCAJE_ADORNO: 'Encaje / Adorno',
  CIERRE_BOTONES: 'Cierre / Botones',
  HILOS_AGUJAS_ALFILERES: 'Hilos / Agujas / Alfileres',
  OTROS_MATERIALES: 'Otros materiales',
};

export const TIPO_ASIGNACION_LABELS = {
  DIRECTO: 'Directo a un vestido',
  PRORRATEO: 'Prorrateo entre vestidos',
};

export const TIPO_ASIGNACION_CORTO = {
  DIRECTO: 'Directo',
  PRORRATEO: 'Prorrateo',
};

export function formatNumero(value, decimales = 1) {
  const n = Number(value) || 0;
  return n.toLocaleString('es-CL', { maximumFractionDigits: decimales });
}
