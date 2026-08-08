export function monthKey(date) {
  const d = new Date(date);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
}

export function addMonths(key, n) {
  const [y, m] = key.split('-').map(Number);
  const d = new Date(Date.UTC(y, m - 1 + n, 1));
  return monthKey(d);
}

export function monthRangeKeys(desdeKey, hastaKey) {
  const keys = [];
  let k = desdeKey;
  let guard = 0;
  while (k <= hastaKey && guard < 600) {
    keys.push(k);
    k = addMonths(k, 1);
    guard += 1;
  }
  return keys;
}

export function round1(n) {
  return Math.round(n * 10) / 10;
}
