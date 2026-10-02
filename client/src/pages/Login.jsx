import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import Logo from '../components/Logo.jsx';
import { useAuth } from '../lib/AuthContext.jsx';

export default function Login() {
  const { authenticated, necesitaBootstrap, login, bootstrap, error } = useAuth();
  const [email, setEmail] = useState('');
  const [nombre, setNombre] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  if (authenticated) return <Navigate to="/ventas" replace />;

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    if (necesitaBootstrap) {
      await bootstrap(email, nombre, password);
    } else {
      await login(email, password);
    }
    setLoading(false);
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ backgroundColor: '#1A1A2E' }}
    >
      <div className="bg-white rounded-2xl shadow-2xl px-10 py-12 w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <Logo size={64} />
          <h1 className="font-serif text-2xl mt-5 text-[#2C2420]">Hatton Schultz</h1>
          <p className="font-serif tracking-widest uppercase text-sm text-[#C9A96E]">Novias</p>
        </div>
        {necesitaBootstrap && (
          <p className="text-xs text-[#2C2420]/60 mb-5 text-center">
            Primera vez: crea la cuenta del administrador. Después, desde Configuración → Usuarios
            podrás crear las cuentas de Carolina y María.
          </p>
        )}
        <form onSubmit={handleSubmit} className="space-y-4">
          {necesitaBootstrap && (
            <div>
              <label className="block text-xs font-medium text-[#2C2420]/60 mb-1.5">Tu nombre</label>
              <input
                required
                autoFocus
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="w-full rounded-lg border border-black/10 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A96E] focus:border-transparent"
                placeholder="Sebastián"
              />
            </div>
          )}
          <div>
            <label className="block text-xs font-medium text-[#2C2420]/60 mb-1.5">Correo</label>
            <input
              type="email"
              required
              autoFocus={!necesitaBootstrap}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-lg border border-black/10 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A96E] focus:border-transparent"
              placeholder="tu@correo.com"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-[#2C2420]/60 mb-1.5">Contraseña</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-black/10 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A96E] focus:border-transparent"
              placeholder="••••••••"
            />
            {necesitaBootstrap && (
              <p className="text-[10px] text-[#2C2420]/40 mt-1">Mínimo 6 caracteres.</p>
            )}
          </div>
          {error && <p className="text-sm text-[#A85C52]">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
            style={{ backgroundColor: '#1A1A2E' }}
          >
            {loading ? 'Ingresando…' : necesitaBootstrap ? 'Crear cuenta y entrar' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  );
}
