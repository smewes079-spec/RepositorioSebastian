import { useEffect, useState } from 'react';

// Qué columnas están OCULTAS, guardado por navegador (cada persona en su
// propio computador puede tener una selección distinta de columnas).
export function useColumnVisibility(storageKey, allColumnKeys, defaultHidden = []) {
  const [hidden, setHidden] = useState(() => {
    try {
      const guardado = JSON.parse(localStorage.getItem(storageKey) || 'null');
      if (!Array.isArray(guardado)) return defaultHidden;
      return guardado.filter((k) => allColumnKeys.includes(k));
    } catch {
      return defaultHidden;
    }
  });

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(hidden));
  }, [storageKey, hidden]);

  function toggle(key) {
    setHidden((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]));
  }

  function showAll() {
    setHidden([]);
  }

  function reset() {
    setHidden(defaultHidden);
  }

  const visibleKeys = allColumnKeys.filter((k) => !hidden.includes(k));

  return { hidden, visibleKeys, isVisible: (key) => !hidden.includes(key), toggle, showAll, reset };
}
