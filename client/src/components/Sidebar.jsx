import { NavLink } from 'react-router-dom';
import { ShoppingBag, LayoutDashboard, Shirt, CalendarDays, LogOut } from 'lucide-react';
import Logo from './Logo.jsx';
import { useAuth } from '../lib/AuthContext.jsx';

const NAV_ITEMS = [
  { to: '/ventas', label: 'Ventas', icon: ShoppingBag },
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/produccion', label: 'Producción', icon: Shirt },
  { to: '/agenda', label: 'Agenda', icon: CalendarDays },
];

export default function Sidebar() {
  const { logout } = useAuth();

  return (
    <aside
      className="w-64 shrink-0 h-screen sticky top-0 flex flex-col text-white"
      style={{ backgroundColor: '#1A1A2E' }}
    >
      <div className="flex items-center gap-3 px-6 py-7 border-b border-white/10">
        <Logo />
        <div>
          <p className="font-serif text-lg leading-tight tracking-wide">Hatton Schultz</p>
          <p className="font-serif text-sm text-[#C9A96E] leading-tight tracking-widest uppercase">
            Novias
          </p>
        </div>
      </div>

      <nav className="flex-1 py-6 px-3 space-y-1">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                isActive
                  ? 'bg-white/10 text-[#C9A96E]'
                  : 'text-white/70 hover:bg-white/5 hover:text-white'
              }`
            }
          >
            <Icon size={18} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-3 pb-6">
        <button
          onClick={logout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-white/60 hover:bg-white/5 hover:text-white transition-colors"
        >
          <LogOut size={18} />
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
