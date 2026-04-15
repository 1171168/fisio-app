import { useState } from 'react';
import { BrowserRouter, Routes, Route, NavLink, useLocation } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Patients from './pages/Patients';
import Schedule from './pages/Schedule';
import Exams from './pages/Exams';
import Library from './pages/Library';
import Login from './pages/Login';
import { getToken, clearToken } from './api';

const navItems = [
  {
    to: '/',
    label: 'Dashboard',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    to: '/patients',
    label: 'Pacientes',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
      </svg>
    ),
  },
  {
    to: '/schedule',
    label: 'Agenda',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    to: '/exams',
    label: 'Avaliações',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
      </svg>
    ),
  },
  {
    to: '/library',
    label: 'Biblioteca de Testes',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
          d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
  },
];

function SidebarContent({ onLogout, onClose }: { onLogout: () => void; onClose?: () => void }) {
  const location = useLocation();
  return (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-6 py-6 border-b border-teal-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-teal-500 rounded-lg flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <div>
            <h1 className="text-white font-bold text-lg leading-tight">FisioApp</h1>
            <p className="text-teal-400 text-xs">Gestão de Fisioterapia</p>
          </div>
        </div>
        {/* Close button — only on mobile drawer */}
        {onClose && (
          <button onClick={onClose} className="lg:hidden text-teal-400 hover:text-white ml-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = item.to === '/'
            ? location.pathname === '/'
            : location.pathname.startsWith(item.to);
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onClose}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150 ${
                isActive
                  ? 'bg-teal-700 text-white'
                  : 'text-teal-200 hover:bg-teal-800 hover:text-white'
              }`}
            >
              {item.icon}
              {item.label}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer with logout */}
      <div className="px-3 py-4 border-t border-teal-800 space-y-2">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-teal-200 hover:bg-teal-800 hover:text-white transition-colors duration-150"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Terminar sessão
        </button>
        <p className="text-teal-600 text-xs text-center">v1.0.0 &copy; 2024</p>
      </div>
    </div>
  );
}

function Layout({ onLogout, children }: { onLogout: () => void; children: React.ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <div className="flex min-h-screen">
      {/* Desktop sidebar — always visible on lg+ */}
      <aside className="hidden lg:flex w-64 min-h-screen bg-teal-900 flex-col fixed left-0 top-0 z-20">
        <SidebarContent onLogout={onLogout} />
      </aside>

      {/* Mobile/tablet drawer overlay */}
      {drawerOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* Mobile/tablet drawer */}
      <aside className={`lg:hidden fixed left-0 top-0 h-full w-72 bg-teal-900 z-40 flex flex-col transform transition-transform duration-300 ease-in-out ${
        drawerOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <SidebarContent onLogout={onLogout} onClose={() => setDrawerOpen(false)} />
      </aside>

      {/* Main content */}
      <main className="flex-1 lg:ml-64 min-h-screen bg-gray-50 flex flex-col">
        {/* Mobile top bar */}
        <div className="lg:hidden sticky top-0 z-10 bg-white border-b border-gray-200 flex items-center gap-3 px-4 py-3">
          <button
            onClick={() => setDrawerOpen(true)}
            className="p-1.5 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-teal-600 rounded-md flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <span className="font-bold text-gray-900 text-sm">FisioApp</span>
          </div>
        </div>

        {/* Page content */}
        <div className="flex-1">
          {children}
        </div>
      </main>
    </div>
  );
}

export default function App() {
  const [authed, setAuthed] = useState(() => !!getToken());

  function handleLogout() {
    clearToken();
    setAuthed(false);
  }

  if (!authed) {
    return <Login onLogin={() => setAuthed(true)} />;
  }

  return (
    <BrowserRouter>
      <Layout onLogout={handleLogout}>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/patients" element={<Patients />} />
          <Route path="/schedule" element={<Schedule />} />
          <Route path="/exams" element={<Exams />} />
          <Route path="/library" element={<Library />} />
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}
