import { useEffect, useState } from 'react';
import { Check, Copy } from 'lucide-react';
import { api } from '../lib/api.js';

const DIAS = [
  [1, 'Lun'],
  [2, 'Mar'],
  [3, 'Mié'],
  [4, 'Jue'],
  [5, 'Vie'],
  [6, 'Sáb'],
  [7, 'Dom'],
];

const ESTADO_CAPACIDAD = {
  lleno: { texto: 'Lleno', clase: 'bg-[#FBEFED] text-[#A85C52]' },
  reservado_novias: { texto: 'Reservado para novias', clase: 'bg-[#F3EDE4] text-[#8A6D3B]' },
  madrinas_invitadas: { texto: 'Novias, madrinas e invitadas', clase: 'bg-[#EEF5F0] text-[#3F6B4C]' },
  invitadas: { texto: 'Novias e invitadas', clase: 'bg-[#EEF5F0] text-[#3F6B4C]' },
  solo_novias: { texto: 'Solo novias (muy encima para confeccionar)', clase: 'bg-black/5 text-[#2C2420]/60' },
};

const input =
  'px-3 py-1.5 text-sm rounded-lg border border-black/10 focus:outline-none focus:ring-2 focus:ring-[#C9A96E]';

// Configuración → Agenda: reglas de la página pública /agendar.
export default function AgendaConfig() {
  const [c, setC] = useState(null);
  const [error, setError] = useState('');
  const [guardado, setGuardado] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const [capacidad, setCapacidad] = useState([]);
  const link = `${window.location.origin}/agendar`;

  const cargarCapacidad = () =>
    api
      .get('/config/agenda/capacidad')
      .then(setCapacidad)
      .catch(() => setCapacidad([]));

  useEffect(() => {
    api.get('/config/agenda').then(setC).catch((e) => setError(e.message));
    cargarCapacidad();
  }, []);

  if (!c) return error ? <p className="text-sm text-[#A85C52] mt-8">{error}</p> : null;

  const set = (patch) => {
    setGuardado(false);
    setC({ ...c, ...patch });
  };
  const dias = c.diasSemana.split(',').map(Number);
  const toggleDia = (d) =>
    set({ diasSemana: (dias.includes(d) ? dias.filter((x) => x !== d) : [...dias, d]).sort().join(',') });

  async function guardar() {
    setError('');
    try {
      setC(await api.put('/config/agenda', c));
      setGuardado(true);
      cargarCapacidad();
    } catch (e) {
      setError(e.message);
    }
  }

  async function copiar() {
    try {
      await navigator.clipboard.writeText(link);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      /* sin permiso de portapapeles */
    }
  }

  const num = (campo) => (
    <input
      type="number"
      min="0"
      value={c[campo]}
      onChange={(e) => set({ [campo]: e.target.value })}
      className={`w-20 ${input}`}
    />
  );

  const segmentoFila = (clave, titulo, regla) => (
    <div className="flex flex-wrap items-center gap-3 py-2">
      <label className="flex items-center gap-2 w-32 text-sm font-medium">
        <input type="checkbox" checked={c[clave]} onChange={(e) => set({ [clave]: e.target.checked })} />
        {titulo}
      </label>
      <span className="text-sm text-[#2C2420]/70">{c[clave] ? regla : 'Pausado: la página dice que no hay cupos'}</span>
    </div>
  );

  return (
    <div id="agenda" className="mt-8">
      <p className="text-xs font-semibold uppercase tracking-wide text-[#2C2420]/40 mb-3">
        Agenda (página para clientas)
      </p>
      <div className="bg-white rounded-xl border border-black/5 p-5 space-y-5">
        <div>
          <p className="text-sm text-[#2C2420]/70 mb-2">
            Link para la bio de Instagram. Las clientas eligen si son novia, madrina o invitada, y agendan en las horas
            libres del calendario de Carolina o María.
          </p>
          <div className="flex items-center gap-2">
            <code className="text-sm bg-[#FAFAF8] border border-black/10 rounded-lg px-3 py-1.5">{link}</code>
            <button onClick={copiar} className="flex items-center gap-1 text-xs text-[#C9A96E] hover:opacity-70">
              {copiado ? <Check size={14} /> : <Copy size={14} />} {copiado ? 'Copiado' : 'Copiar'}
            </button>
          </div>
        </div>

        <div>
          <p className="text-sm font-medium mb-1">Quiénes pueden agendar</p>
          {segmentoFila('abiertoNovia', 'Novias', 'Cualquier fecha, salvo que el mes de su evento ya esté lleno (ven el botón de WhatsApp para sobrecupos)')}
          {segmentoFila(
            'abiertoMadrina',
            'Madrinas',
            <>Confeccionar toma {num('mesesMinimoMadrina')} meses: su evento debe ser en al menos ese plazo, en un mes con cupo</>,
          )}
          {segmentoFila(
            'abiertoInvitada',
            'Invitadas',
            <>Confeccionar toma {num('mesesMinimoInvitada')} meses: su evento debe ser en al menos ese plazo, en un mes con cupo</>,
          )}
        </div>

        <div>
          <p className="text-sm font-medium mb-1">Capacidad de entrega</p>
          <div className="flex flex-wrap items-center gap-2 text-sm text-[#2C2420]/80">
            {num('capacidadMensual')} vestidos al mes (se cuentan las ventas por su fecha de evento). Los meses a{' '}
            {num('mesesReservaNovias')} meses o más quedan reservados para novias; los más cercanos ceden sus cupos libres
            a madrinas e invitadas.
          </div>
          {capacidad.length > 0 && (
            <div className="mt-3 overflow-x-auto">
              <table className="text-xs">
                <thead>
                  <tr className="text-left text-[#2C2420]/50">
                    <th className="pr-4 py-1 font-medium">Mes</th>
                    <th className="pr-4 py-1 font-medium">Entregas</th>
                    <th className="py-1 font-medium">Cupos libres para</th>
                  </tr>
                </thead>
                <tbody>
                  {capacidad.map((m) => {
                    const [y, mm] = m.mes.split('-').map(Number);
                    const etiqueta = new Intl.DateTimeFormat('es-CL', { month: 'long', year: 'numeric', timeZone: 'UTC' }).format(
                      new Date(Date.UTC(y, mm - 1, 15)),
                    );
                    return (
                      <tr key={m.mes} className="border-t border-black/5">
                        <td className="pr-4 py-1.5 capitalize">{etiqueta}</td>
                        <td className="pr-4 py-1.5">
                          {m.entregas} / {m.capacidad}
                        </td>
                        <td className="py-1.5">
                          <span className={`px-2 py-0.5 rounded-full ${ESTADO_CAPACIDAD[m.estado].clase}`}>
                            {ESTADO_CAPACIDAD[m.estado].texto}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-6">
          <div>
            <p className="text-sm font-medium mb-1">Días de atención</p>
            <div className="flex gap-1">
              {DIAS.map(([d, t]) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => toggleDia(d)}
                  className={`px-2 py-1 text-xs rounded-md border ${
                    dias.includes(d) ? 'bg-[#1A1A2E] text-white border-[#1A1A2E]' : 'border-black/10'
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-sm font-medium mb-1">Horario (citas de 1 hora)</p>
            <div className="flex items-center gap-2 text-sm">
              de {num('horaInicio')} a {num('horaFin')} hrs
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-6 text-sm">
          <label className="flex items-center gap-2">
            Mostrar horarios hasta {num('diasHorizonte')} días hacia adelante
          </label>
          <label className="flex items-center gap-2">
            Aviso mínimo de {num('horasAvisoMinimo')} horas
          </label>
        </div>

        <label className="block text-sm">
          <span className="font-medium">WhatsApp para sobrecupos de novias</span>
          <input
            value={c.whatsapp || ''}
            onChange={(e) => set({ whatsapp: e.target.value })}
            placeholder="Ej: 56912345678 (con código de país, sin + ni espacios)"
            className={`mt-1 w-full max-w-sm ${input}`}
          />
        </label>

        <div className="flex items-center gap-3">
          <button
            onClick={guardar}
            className="px-4 py-2 text-sm rounded-lg text-white hover:opacity-90"
            style={{ backgroundColor: '#1A1A2E' }}
          >
            Guardar
          </button>
          {guardado && (
            <span className="inline-flex items-center gap-1 text-xs text-[#5C8C6A]">
              <Check size={13} /> Guardado
            </span>
          )}
          {error && <span className="text-sm text-[#A85C52]">{error}</span>}
        </div>
      </div>
    </div>
  );
}
