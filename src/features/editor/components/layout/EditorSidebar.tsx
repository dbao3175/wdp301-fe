import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  FileText,
  Library,
  ChevronLeft,
  ChevronRight,
  PenTool,
  LogOut,
  Bell,
} from 'lucide-react';
import { getStoredUser } from '@/src/api/base';
import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/src/api/client';

interface NavItem {
  path: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
}

const navItems: NavItem[] = [
  {
    path: '/editor/dashboard',
    label: 'Dashboard',
    icon: <LayoutDashboard className="w-4 h-4" />,
  },
  {
    path: '/editor/proposals',
    label: 'Proposals',
    icon: <FileText className="w-4 h-4" />,
  },
  {
    path: '/editor/series',
    label: 'Series',
    icon: <Library className="w-4 h-4" />,
  },
];

interface EditorSidebarProps {
  onLogout?: () => void;
}

export const EditorSidebar: React.FC<EditorSidebarProps> = ({ onLogout }) => {
  const [collapsed, setCollapsed] = useState(false);
  const { data: pendingCountData } = useQuery({
    queryKey: ['pending-count'],
    queryFn: () => apiClient.proposals.getAll('SUBMITTED'),
    staleTime: 5 * 1000,
  })
  const pendingCount = pendingCountData?.length || 0;
  const currentUser = getStoredUser();
  const location = useLocation();

  return (
    <aside
      className={`fixed top-0 left-0 h-full bg-ink-black border-r-4 border-neutral-800 flex flex-col transition-all duration-300 z-40 ${
        collapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 p-4 border-b-2 border-neutral-700 min-h-[64px]">
        <div className="w-8 h-8 bg-[#E63946] flex items-center justify-center border-2 border-white flex-shrink-0">
          <PenTool className="w-4 h-4 text-white" />
        </div>
        {!collapsed && (
          <div className="overflow-hidden">
            <h1 className="font-syne font-extrabold text-white text-sm leading-none tracking-tight">
              MangaFlow
            </h1>
            <p className="font-mono text-[9px] text-neutral-400 uppercase tracking-widest mt-0.5">
              Tantou Editor
            </p>
          </div>
        )}
      </div>

      {/* Editor Info */}
      {!collapsed && (
        <div className="px-4 py-3 border-b border-neutral-700 bg-neutral-900">
          <div className="flex items-center gap-2">
            <img
              src="https://api.dicebear.com/7.x/avataaars/svg?seed=Hiroshi"
              alt="Editor"
              className="w-8 h-8 border-2 border-[#E63946] shrink-0"
            />
            <div className="overflow-hidden">
              <p className="font-syne font-bold text-white text-xs truncate">{currentUser?.name || 'Unknown'}</p>
              <p className="font-mono text-[9px] text-[#E63946] uppercase tracking-widest">Tantou Editor</p>
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto py-4">
        <div className={`${collapsed ? 'px-2' : 'px-3'} space-y-1`}>
          {!collapsed && (
            <p className="text-[9px] font-mono font-extrabold text-neutral-500 uppercase tracking-widest px-2 mb-2">
              Navigation
            </p>
          )}
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.path);
            return (
              <NavLink
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3 py-2.5 transition-all relative group ${
                  isActive
                    ? 'bg-[#E63946] text-white border-l-4 border-white'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-800 border-l-4 border-transparent'
                } ${collapsed ? 'justify-center' : ''}`}
              >
                <span className="shrink-0">{item.icon}</span>
                {!collapsed && (
                  <span className="font-sans font-semibold text-xs">{item.label}</span>
                )}
                {!collapsed && item.badge !== undefined && item.badge > 0 && (
                  <span className="ml-auto bg-[#E63946] text-white text-[9px] font-mono font-bold w-5 h-5 flex items-center justify-center border border-red-400">
                    {item.badge}
                  </span>
                )}
                {item.path === '/editor/proposals' && (pendingCount ?? 0) > 0 && (
                  <span className="ml-auto bg-[#E63946] text-white text-[9px] font-mono font-bold w-5 h-5 flex items-center justify-center border border-red-400">
                    {pendingCount}
                  </span>
                )}
                {/* Tooltip for collapsed */}
                {collapsed && (
                  <div className="absolute left-full ml-3 px-2 py-1 bg-neutral-900 border border-neutral-600 text-white text-xs font-sans whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50">
                    {item.label}
                  </div>
                )}
              </NavLink>
            );
          })}
        </div>

        {/* Section: Review */}
        {!collapsed && (
          <div className="px-3 mt-4">
            <p className="text-[9px] font-mono font-extrabold text-neutral-500 uppercase tracking-widest px-2 mb-2">
              Tools
            </p>
          </div>
        )}
      </nav>

      {/* Bottom Actions */}
      <div className="border-t border-neutral-700 p-3 space-y-1">
        <button
          className={`w-full flex items-center gap-3 px-3 py-2.5 text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors group relative ${
            collapsed ? 'justify-center' : ''
          }`}
        >
          <Bell className="w-4 h-4 flex-shrink-0" />
          {!collapsed && <span className="font-sans text-xs font-semibold">Notifications</span>}
        </button>
        {onLogout && (
          <button
            onClick={onLogout}
            className={`w-full flex items-center gap-3 px-3 py-2.5 text-neutral-400 hover:text-red-400 hover:bg-neutral-800 transition-colors ${
              collapsed ? 'justify-center' : ''
            }`}
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            {!collapsed && <span className="font-sans text-xs font-semibold">Sign Out</span>}
          </button>
        )}
      </div>

      {/* Collapse Toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-ink-black border-2 border-neutral-600 text-neutral-400 hover:text-white flex items-center justify-center transition-colors z-50"
      >
        {collapsed ? (
          <ChevronRight className="w-3 h-3" />
        ) : (
          <ChevronLeft className="w-3 h-3" />
        )}
      </button>
    </aside>
  );
};
