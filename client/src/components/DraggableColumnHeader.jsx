import { useState } from 'react';
import { GripVertical } from 'lucide-react';

export default function DraggableColumnHeader({ columnKey, label, align, onMove, className = '' }) {
  const [sobreEsta, setSobreEsta] = useState(false);

  return (
    <th
      draggable
      onDragStart={(e) => {
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', columnKey);
      }}
      onDragOver={(e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        if (!sobreEsta) setSobreEsta(true);
      }}
      onDragLeave={() => setSobreEsta(false)}
      onDrop={(e) => {
        e.preventDefault();
        setSobreEsta(false);
        const origen = e.dataTransfer.getData('text/plain');
        if (origen) onMove(origen, columnKey);
      }}
      className={`group px-3 py-2.5 font-medium cursor-grab active:cursor-grabbing select-none whitespace-nowrap ${
        align === 'right' ? 'text-right' : 'text-left'
      } ${sobreEsta ? 'bg-[#C9A96E]/15' : ''} ${className}`}
      title="Arrastra para reordenar esta columna"
    >
      <span className={`inline-flex items-center gap-1 ${align === 'right' ? 'flex-row-reverse' : ''}`}>
        <GripVertical size={12} className="text-[#2C2420]/0 group-hover:text-[#2C2420]/30 transition-colors" />
        {label}
      </span>
    </th>
  );
}
