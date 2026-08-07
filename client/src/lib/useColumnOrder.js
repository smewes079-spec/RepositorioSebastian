import { useEffect, useState } from 'react';

export function useColumnOrder(storageKey, defaultOrder) {
  const [order, setOrder] = useState(() => {
    try {
      const guardado = JSON.parse(localStorage.getItem(storageKey) || 'null');
      if (!Array.isArray(guardado)) return defaultOrder;
      const conocidas = guardado.filter((k) => defaultOrder.includes(k));
      const faltantes = defaultOrder.filter((k) => !conocidas.includes(k));
      return [...conocidas, ...faltantes];
    } catch {
      return defaultOrder;
    }
  });

  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(order));
  }, [storageKey, order]);

  function moverColumna(origen, destino) {
    if (origen === destino) return;
    setOrder((prev) => {
      const next = [...prev];
      const idxOrigen = next.indexOf(origen);
      const idxDestino = next.indexOf(destino);
      if (idxOrigen === -1 || idxDestino === -1) return prev;
      next.splice(idxOrigen, 1);
      next.splice(idxDestino, 0, origen);
      return next;
    });
  }

  function restablecer() {
    setOrder(defaultOrder);
  }

  return { order, moverColumna, restablecer };
}
