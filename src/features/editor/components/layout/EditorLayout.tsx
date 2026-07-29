import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { SidebarProvider, useSidebar } from './SidebarContext';
import MotionScene from '../../../../components/motion/MotionScene';

const routeLabels: Record<string, string> = {
  editor: 'Editor',
  dashboard: 'Dashboard',
  proposals: 'Proposals',
  series: 'Series',
  review: 'Review',
};

export const Breadcrumb: React.FC = () => {
  const location = useLocation();
  const segments = location.pathname.split('/').filter(Boolean);

  return (
    <nav className="flex items-center gap-1 text-xs font-mono">
      <Link
        to="/editor/dashboard"
        className="text-neutral-400 hover:text-white transition-colors flex items-center"
      >
        <Home className="w-3 h-3" />
      </Link>
      {segments.map((seg, idx) => {
        const path = '/' + segments.slice(0, idx + 1).join('/');
        const label = routeLabels[seg] ?? seg;
        const isLast = idx === segments.length - 1;

        return (
          <React.Fragment key={path}>
            <ChevronRight className="w-3 h-3 text-neutral-600" />
            {isLast ? (
              <span className="text-white font-bold uppercase tracking-wide">{label}</span>
            ) : (
              <Link
                to={path}
                className="text-neutral-400 hover:text-white transition-colors uppercase tracking-wide"
              >
                {label}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};

// =========================================================
// EDITOR LAYOUT
// =========================================================

import { EditorSidebar } from './EditorSidebar.tsx';
import { Bell, Search } from 'lucide-react';

interface EditorLayoutProps {
  children: React.ReactNode;
  onLogout?: () => void;
}

const EditorLayoutInner: React.FC<{ children: React.ReactNode; onLogout?: () => void }> = ({ children, onLogout }) => {
  const { collapsed } = useSidebar();
  const location = useLocation();
  
  return (
    <div className="min-h-screen bg-manuscript-gray flex">
      <EditorSidebar onLogout={onLogout} />

      {/* Main content — offset by sidebar width (64px collapsed, 256px expanded) */}
      <div className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ${collapsed ? 'ml-16' : 'ml-64'}`}>
        {/* Top Bar */}
        <header className="sticky top-0 z-30 bg-ink-black border-b-2 border-neutral-700 px-6 py-3 flex items-center justify-between min-h-[64px]">
          <Breadcrumb />
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="hidden md:flex items-center gap-2 bg-neutral-800 border border-neutral-600 px-3 py-1.5">
              <Search className="w-3 h-3 text-neutral-400" />
              <input
                type="text"
                placeholder="Quick search..."
                className="bg-transparent text-xs font-mono text-white placeholder-neutral-500 outline-none w-36"
              />
            </div>
            {/* Notifications */}
            <button className="relative w-8 h-8 flex items-center justify-center text-neutral-400 hover:text-white transition-colors border border-neutral-700 hover:border-neutral-500">
              <Bell className="w-4 h-4" />
              <span className="absolute top-0.5 right-0.5 w-2 h-2 bg-[#E63946] border border-ink-black" />
            </button>
            {/* Avatar */}
            <img
              src="https://api.dicebear.com/7.x/avataaars/svg?seed=Hiroshi"
              alt="Editor"
              className="w-8 h-8 border-2 border-[#E63946]"
            />
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-6 overflow-y-auto">
          {/* Dot grid backdrop */}
          <div
            className="ambient-grid fixed inset-0 pointer-events-none opacity-30 z-0"
            style={{
              backgroundImage: 'radial-gradient(#9ca3af 0.6px, transparent 0.6px)',
              backgroundSize: '20px 20px',
            }}
          />
          <MotionScene sceneKey={location.pathname} className="relative z-10">
            {children}
          </MotionScene>
        </main>
      </div>
    </div>
  );
};

export const EditorLayout: React.FC<EditorLayoutProps> = ({ children, onLogout }) => {
  return (
    <SidebarProvider>
      <EditorLayoutInner onLogout={onLogout}>{children}</EditorLayoutInner>
    </SidebarProvider>
  );
};
