import { useEffect, useState } from 'react';

const ANCHO_MINIMO = 70;

export function useColumnWidths(storageKey, defaultWidths) {
  const [widths, setWidths] = useState(() => {
    try {
      const guardado = JSON.parse(localStorage.getItem(storageKey) || 'null');
      if (!guardado || typeof guardado !== 'object') return defaultWidths;
      return { ...defaultWidths, ...guardado };
    } catch {
      return defaultWidths;
    }
  });

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(widths));
  }, [storageKey, widths]);

  function setWidth(columnKey, px) {
    setWidths((prev) => ({ ...prev, [columnKey]: Math.max(ANCHO_MINIMO, Math.round(px)) }));
  }

  function restablecer() {
    setWidths(defaultWidths);
  }

  return { widths, setWidth, restablecer };
}
