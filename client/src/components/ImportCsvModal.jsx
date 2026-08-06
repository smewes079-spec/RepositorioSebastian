import { useRef, useState } from 'react';
import { X, UploadCloud } from 'lucide-react';
import { api } from '../lib/api.js';

export default function ImportCsvModal({ onClose, onImported }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState(null);
  const [error, setError] = useState('');
  const inputRef = useRef(null);

  async function handleImport() {
    if (!file) return;
    setLoading(true);
    setError('');
    setResultado(null);
    try {
      const formData = new FormData();
      formData.append('archivo', file);
      const data = await api.post('/ventas/importar', formData);
      setResultado(data);
      onImported?.();
    } catch (err) {
      setError(err.message || 'No se pudo importar el archivo');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-2xl w-full max-w-lg p-7">
        <div className="flex items-center justify-between mb-5">
          <h2 className="font-serif text-xl text-[#2C2420]">Importar ventas desde CSV</h2>
          <button onClick={onClose} className="text-[#2C2420]/40 hover:text-[#2C2420]">
            <X size={20} />
          </button>
        </div>

        <p className="text-xs text-[#2C2420]/60 mb-4 leading-relaxed">
          Columnas esperadas: CÓDIGO, NOMBRE CLIENTA, TIPO, ESTADO, FECHA VENTA, FECHA EVENTO,
          TOTAL VENTA, TOTAL PAGADO, DEUDA, PAGO 1, FECHA, PAGO 2, FECHA 2, PAGO 3, FECHA 3.
          Si el código ya existe, la venta se actualiza.
        </p>

        <div
          onClick={() => inputRef.current?.click()}
          className="border-2 border-dashed border-black/10 rounded-xl py-10 flex flex-col items-center gap-2 cursor-pointer hover:border-[#C9A96E] transition-colors"
        >
          <UploadCloud size={28} className="text-[#C9A96E]" />
          <p className="text-sm text-[#2C2420]/70">
            {file ? file.name : 'Haz clic para seleccionar un archivo .csv'}
          </p>
          <input
            ref={inputRef}
            type="file"
            accept=".csv"
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
        </div>

        {error && <p className="text-sm text-[#A85C52] mt-4">{error}</p>}

        {resultado && (
          <div className="mt-4 text-sm rounded-lg bg-[#FAFAF8] border border-black/5 p-4 space-y-1">
            <p>Filas procesadas: {resultado.totalFilas}</p>
            <p className="text-[#5C8C6A]">Creadas: {resultado.creadas}</p>
            <p className="text-[#C9A96E]">Actualizadas: {resultado.actualizadas}</p>
            {resultado.errores.length > 0 && (
              <div className="text-[#A85C52]">
                <p>Errores ({resultado.errores.length}):</p>
                <ul className="list-disc list-inside max-h-32 overflow-y-auto">
                  {resultado.errores.map((e, i) => (
                    <li key={i}>
                      Línea {e.linea}: {e.error}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-lg text-[#2C2420]/70 hover:bg-black/5"
          >
            Cerrar
          </button>
          <button
            onClick={handleImport}
            disabled={!file || loading}
            className="px-4 py-2 text-sm rounded-lg text-white disabled:opacity-50"
            style={{ backgroundColor: '#1A1A2E' }}
          >
            {loading ? 'Importando…' : 'Importar'}
          </button>
        </div>
      </div>
    </div>
  );
}
