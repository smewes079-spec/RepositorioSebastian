import { useEffect, useRef, useState } from 'react';
import { Filter, Search, GripVertical, ArrowUpDown } from 'lucide-react';

export default function FilterableHeader({
  label,
  align,
  className = '',
  options,
  excluded,
  onChange,
  draggable,
  columnKey,
  onMove,
  sortActive,
  sortDir,
  onSortClick,
}) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function onClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  const excludedSet = excluded || new Set();
  const isActive = excludedSet.size > 0;
  const filteredOptions = (options || []).filter((o) =>
    o.value.toLowerCase().includes(search.toLowerCase())
  );

  function toggleValue(value) {
    const next = new Set(excludedSet);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    onChange(next);
  }

  return (
    <th
      ref={ref}
      draggable={!!draggable}
      onDragStart={
        draggable
          ? (e) => {
              e.dataTransfer.effectAllowed = 'move';
              e.dataTransfer.setData('text/plain', columnKey);
            }
          : undefined
      }
      onDragOver={
        draggable
          ? (e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = 'move';
              if (!dragOver) setDragOver(true);
            }
          : undefined
      }
      onDragLeave={draggable ? () => setDragOver(false) : undefined}
      onDrop={
        draggable
          ? (e) => {
              e.preventDefault();
              setDragOver(false);
              const origen = e.dataTransfer.getData('text/plain');
              if (origen) onMove(origen, columnKey);
            }
          : undefined
      }
      className={`relative group px-3 py-2.5 font-medium select-none whitespace-nowrap ${
        align === 'right' ? 'text-right' : 'text-left'
      } ${draggable ? 'cursor-grab active:cursor-grabbing' : ''} ${
        dragOver ? 'bg-[#C9A96E]/15' : ''
      } ${className}`}
    >
      <span
        className={`inline-flex items-center gap-1 ${align === 'right' ? 'flex-row-reverse' : ''} ${
          onSortClick ? 'cursor-pointer' : ''
        }`}
        onClick={onSortClick}
      >
        {draggable && (
          <GripVertical
            size={12}
            className="text-[#2C2420]/0 group-hover:text-[#2C2420]/30 transition-colors"
          />
        )}
        {label}
        {onSortClick && (
          <ArrowUpDown
            size={11}
            className={sortActive ? 'text-[#C9A96E]' : 'text-[#2C2420]/20'}
          />
        )}
        {options && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setOpen((o) => !o);
            }}
            className={`ml-0.5 rounded p-0.5 hover:bg-black/10 ${
              isActive ? 'text-[#C9A96E]' : 'text-[#2C2420]/30'
            }`}
            title="Filtrar"
          >
            <Filter size={11} fill={isActive ? 'currentColor' : 'none'} />
          </button>
        )}
      </span>

      {open && (
        <div
          className="absolute z-20 top-full mt-1 left-0 w-56 bg-white rounded-lg border border-black/10 shadow-lg p-3 text-left normal-case font-normal tracking-normal text-[#2C2420]"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="relative mb-2">
            <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-[#2C2420]/30" />
            <input
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar valor…"
              className="w-full pl-6 pr-2 py-1.5 text-xs rounded-md border border-black/10 focus:outline-none focus:ring-1 focus:ring-[#C9A96E]"
            />
          </div>
          {isActive && (
            <button
              onClick={() => onChange(new Set())}
              className="text-[11px] text-[#A85C52] hover:underline mb-1.5"
            >
              Limpiar filtro
            </button>
          )}
          <div className="max-h-48 overflow-y-auto space-y-0.5">
            {filteredOptions.length === 0 && (
              <p className="text-[11px] text-[#2C2420]/40 py-2 text-center">Sin resultados</p>
            )}
            {filteredOptions.map(({ value, count }) => (
              <label
                key={value}
                className="flex items-center gap-2 text-xs cursor-pointer hover:bg-[#FAFAF8] px-1 py-1 rounded"
              >
                <input
                  type="checkbox"
                  checked={!excludedSet.has(value)}
                  onChange={() => toggleValue(value)}
                  className="accent-[#C9A96E]"
                />
                <span className="flex-1 truncate">{value === '' ? '(vacío)' : value}</span>
                <span className="text-[#2C2420]/30">{count}</span>
              </label>
            ))}
          </div>
        </div>
      )}
    </th>
  );
}
