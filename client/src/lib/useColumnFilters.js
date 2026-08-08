import { useMemo, useState } from 'react';

/**
 * Filtro genérico "estilo Excel" por columna.
 * columns: [{ key, getValue: (row) => string }]
 * filters guarda, por columna, el conjunto de valores EXCLUIDOS (no seleccionados).
 * Sin entrada para una columna = sin filtro (se muestran todos los valores).
 */
export function useColumnFilters(rows, columns) {
  const [filters, setFilters] = useState({});

  const uniqueValuesByColumn = useMemo(() => {
    const map = {};
    for (const col of columns) {
      const counts = new Map();
      for (const row of rows) {
        const v = col.getValue(row) ?? '';
        counts.set(v, (counts.get(v) || 0) + 1);
      }
      map[col.key] = Array.from(counts.entries())
        .map(([value, count]) => ({ value, count }))
        .sort((a, b) => a.value.localeCompare(b.value, 'es', { numeric: true }));
    }
    return map;
  }, [rows, columns]);

  const filteredRows = useMemo(() => {
    const activeKeys = Object.keys(filters).filter((k) => filters[k] && filters[k].size > 0);
    if (activeKeys.length === 0) return rows;
    const colByKey = Object.fromEntries(columns.map((c) => [c.key, c]));
    return rows.filter((row) =>
      activeKeys.every((key) => {
        const excluidos = filters[key];
        const valor = colByKey[key].getValue(row) ?? '';
        return !excluidos.has(valor);
      })
    );
  }, [rows, columns, filters]);

  function setColumnExcluded(key, excluidosSet) {
    setFilters((prev) => {
      if (!excluidosSet || excluidosSet.size === 0) {
        const next = { ...prev };
        delete next[key];
        return next;
      }
      return { ...prev, [key]: excluidosSet };
    });
  }

  function clearAllFilters() {
    setFilters({});
  }

  const activeCount = Object.values(filters).filter((s) => s && s.size > 0).length;

  return {
    filteredRows,
    uniqueValuesByColumn,
    excludedByColumn: filters,
    setColumnExcluded,
    clearAllFilters,
    activeCount,
  };
}
