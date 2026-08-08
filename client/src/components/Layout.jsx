import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import Sidebar from './Sidebar.jsx';

export default function Layout({ title, subtitle, actions, backTo, children }) {
  return (
    <div className="flex min-h-screen" style={{ backgroundColor: '#FAFAF8' }}>
      <Sidebar />
      <main className="flex-1 min-w-0">
        {(title || actions) && (
          <header className="flex items-center justify-between px-6 py-5 border-b border-black/5 bg-white/60">
            <div className="flex items-center gap-4">
              {backTo && (
                <Link
                  to={backTo}
                  className="flex items-center justify-center w-9 h-9 rounded-full text-[#2C2420]/60 hover:bg-black/5 hover:text-[#2C2420] transition-colors shrink-0"
                  aria-label="Volver"
                >
                  <ArrowLeft size={18} />
                </Link>
              )}
              <div>
                <h1 className="font-serif text-3xl text-[#2C2420]">{title}</h1>
                {subtitle && <p className="text-sm text-[#2C2420]/60 mt-1">{subtitle}</p>}
              </div>
            </div>
            {actions && <div className="flex items-center gap-3">{actions}</div>}
          </header>
        )}
        <div className="px-6 py-6">{children}</div>
      </main>
    </div>
  );
}
