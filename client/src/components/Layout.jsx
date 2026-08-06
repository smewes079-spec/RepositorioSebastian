import Sidebar from './Sidebar.jsx';

export default function Layout({ title, subtitle, actions, children }) {
  return (
    <div className="flex min-h-screen" style={{ backgroundColor: '#FAFAF8' }}>
      <Sidebar />
      <main className="flex-1 min-w-0">
        {(title || actions) && (
          <header className="flex items-center justify-between px-10 py-7 border-b border-black/5 bg-white/60">
            <div>
              <h1 className="font-serif text-3xl text-[#2C2420]">{title}</h1>
              {subtitle && <p className="text-sm text-[#2C2420]/60 mt-1">{subtitle}</p>}
            </div>
            {actions && <div className="flex items-center gap-3">{actions}</div>}
          </header>
        )}
        <div className="px-10 py-8">{children}</div>
      </main>
    </div>
  );
}
