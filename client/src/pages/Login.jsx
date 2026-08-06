import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import Logo from '../components/Logo.jsx';
import { useAuth } from '../lib/AuthContext.jsx';

export default function Login() {
  const { authenticated, login, error } = useAuth();
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  if (authenticated) return <Navigate to="/ventas" replace />;

  async function handleSubmit(e) {
    e.preventDefault();
    setLoading(true);
    await login(password);
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
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-[#2C2420]/60 mb-1.5">
              Contraseña de acceso
            </label>
            <input
              type="password"
              autoFocus
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-black/10 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#C9A96E] focus:border-transparent"
              placeholder="••••••••"
            />
          </div>
          {error && <p className="text-sm text-[#A85C52]">{error}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg py-2.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-60"
            style={{ backgroundColor: '#1A1A2E' }}
          >
            {loading ? 'Ingresando…' : 'Ingresar'}
          </button>
        </form>
      </div>
    </div>
  );
}
