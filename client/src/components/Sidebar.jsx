import { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import {
  ShoppingBag,
  LayoutDashboard,
  Shirt,
  CalendarDays,
  LogOut,
  PackageSearch,
  TrendingUp,
  Settings,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import Logo from './Logo.jsx';
import { useAuth } from '../lib/AuthContext.jsx';

const NAV_ITEMS = [
  { to: '/ventas', label: 'Ventas', icon: ShoppingBag },
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/produccion', label: 'Producción', icon: Shirt },
  { to: '/agenda', label: 'Agenda', icon: CalendarDays },
];

const COSTOS_ITEMS = [
  { to: '/costos/insumos', label: 'Registro de insumos', icon: PackageSearch },
  { to: '/costos/rentabilidad', label: 'Rentabilidad por vestido', icon: TrendingUp },
];

function NavItem({ to, label, icon: Icon, collapsed }) {
  return (
    <NavLink
      to={to}
      title={collapsed ? label : undefined}
      className={({ isActive }) =>
        `flex items-center gap-3 rounded-lg text-sm font-medium transition-colors ${
          collapsed ? 'justify-center px-0 py-3' : 'px-4 py-3'
        } ${
          isActive ? 'bg-white/10 text-[#C9A96E]' : 'text-white/70 hover:bg-white/5 hover:text-white'
        }`
      }
    >
      <Icon size={18} className="shrink-0" />
      {!collapsed && label}
    </NavLink>
  );
}

export default function Sidebar() {
  const { logout } = useAuth();
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem('hsn-sidebar-collapsed') === '1'
  );

  useEffect(() => {
    localStorage.setItem('hsn-sidebar-collapsed', collapsed ? '1' : '0');
  }, [collapsed]);

  return (
    <aside
      className={`shrink-0 h-screen sticky top-0 flex flex-col text-white transition-all duration-200 relative ${
        collapsed ? 'w-[68px]' : 'w-64'
      }`}
      style={{ backgroundColor: '#1A1A2E' }}
    >
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="absolute -right-3 top-8 w-6 h-6 rounded-full bg-[#1A1A2E] border border-white/20 text-white/70 hover:text-white flex items-center justify-center z-10"
        title={collapsed ? 'Mostrar menú' : 'Esconder menú'}
      >
        {collapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
      </button>

      <div
        className={`flex items-center gap-3 py-7 border-b border-white/10 ${
          collapsed ? 'justify-center px-2' : 'px-6'
        }`}
      >
        <Logo />
        {!collapsed && (
          <div>
            <p className="font-serif text-lg leading-tight tracking-wide">Hatton Schultz</p>
            <p className="font-serif text-sm text-[#C9A96E] leading-tight tracking-widest uppercase">
              Novias
            </p>
          </div>
        )}
      </div>

      <nav
        className={`flex-1 py-6 space-y-1 overflow-y-auto overflow-x-hidden ${
          collapsed ? 'px-2' : 'px-3'
        }`}
      >
        {NAV_ITEMS.map((item) => (
          <NavItem key={item.to} {...item} collapsed={collapsed} />
        ))}

        {!collapsed && (
          <p className="px-4 pt-5 pb-1 text-[10px] font-semibold tracking-widest uppercase text-white/35">
            Costos
          </p>
        )}
        {collapsed && <div className="border-t border-white/10 my-3 mx-1" />}
        {COSTOS_ITEMS.map((item) => (
          <NavItem key={item.to} {...item} collapsed={collapsed} />
        ))}
      </nav>

      <div className={`pb-6 space-y-1 ${collapsed ? 'px-2' : 'px-3'}`}>
        <NavItem to="/configuracion" label="Configuración" icon={Settings} collapsed={collapsed} />
        <button
          onClick={logout}
          title={collapsed ? 'Cerrar sesión' : undefined}
          className={`w-full flex items-center gap-3 rounded-lg text-sm font-medium text-white/60 hover:bg-white/5 hover:text-white transition-colors ${
            collapsed ? 'justify-center px-0 py-3' : 'px-4 py-3'
          }`}
        >
          <LogOut size={18} className="shrink-0" />
          {!collapsed && 'Cerrar sesión'}
        </button>
      </div>
    </aside>
  );
}
