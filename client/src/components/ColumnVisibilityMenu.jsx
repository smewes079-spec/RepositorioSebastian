import { useEffect, useRef, useState } from 'react';
import { SlidersHorizontal } from 'lucide-react';

export default function ColumnVisibilityMenu({ columns, hidden, onToggle, onShowAll, onReset }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function onClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        title="Elegir columnas visibles"
        className={`flex items-center justify-center w-9 h-9 rounded-lg border hover:bg-black/5 ${
          hidden.length > 0
            ? 'border-[#C9A96E] text-[#C9A96E]'
            : 'border-black/10 text-[#2C2420]/70'
        }`}
      >
        <SlidersHorizontal size={15} />
      </button>

      {open && (
        <div className="absolute right-0 z-20 mt-1 w-60 bg-white rounded-lg border border-black/10 shadow-lg py-2">
          <p className="px-3 pb-1.5 text-[10px] font-semibold uppercase tracking-wide text-[#2C2420]/40">
            Columnas visibles
          </p>
          <div className="max-h-72 overflow-y-auto">
            {columns.map(({ key, label }) => (
              <label
                key={key}
                className="flex items-center gap-2.5 px-3 py-1.5 text-sm hover:bg-[#FAFAF8] cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={!hidden.includes(key)}
                  onChange={() => onToggle(key)}
                  className="accent-[#C9A96E]"
                />
                {label}
              </label>
            ))}
          </div>
          <div className="flex items-center justify-between px-3 pt-1.5 mt-1 border-t border-black/5">
            <button type="button" onClick={onShowAll} className="text-xs text-[#C9A96E] hover:underline">
              Mostrar todas
            </button>
            <button
              type="button"
              onClick={onReset}
              className="text-xs text-[#2C2420]/40 hover:text-[#2C2420]/70"
            >
              Restablecer
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
