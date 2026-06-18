/**
 * AssistantLayout — collapsible rail + header shell
 */

import React, { useState } from 'react';
import { User } from '../../types';
import {
  LayoutList,
  PenTool,
  LogOut,
  Search,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Wallet,
} from 'lucide-react';
import { AssistantNotification } from './assistantTypes';
import { MOCK_NOTIFICATIONS } from './assistantMockData';
import NotificationDropdown from './NotificationDropdown';

interface AssistantLayoutProps {
  currentUser: User;
  activeTab: string;
  onChangeTab: (tab: string) => void;
  onLogout: () => void;
  headerSearch: string;
  onHeaderSearchChange: (value: string) => void;
  onNotificationClick?: (notification: AssistantNotification) => void;
  children: React.ReactNode;
}

const NAV_ITEMS = [
  { id: 'assistant-tasks', label: 'Task Management', icon: LayoutList },
  { id: 'assistant-workspace', label: 'Workspace', icon: PenTool },
  { id: 'assistant-income', label: 'Income & Earnings', icon: Wallet },
];

export default function AssistantLayout({
  currentUser,
  activeTab,
  onChangeTab,
  onLogout,
  headerSearch,
  onHeaderSearchChange,
  onNotificationClick,
  children,
}: AssistantLayoutProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
  const [notifOpen, setNotifOpen] = useState(false);

  const railWidth = collapsed ? 'w-[68px]' : 'w-[220px]';

  const handleMarkRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n._id === id ? { ...n, read: true } : n))
    );
  };

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleNotificationClick = (n: AssistantNotification) => {
    onNotificationClick?.(n);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#121214]">
      <aside
        className={`${railWidth} shrink-0 flex flex-col bg-[#1e1e24] border-r border-[#2d2d34] transition-all duration-300 select-none`}
      >
        <div className="h-14 flex items-center gap-2.5 px-3 border-b border-[#2d2d34] shrink-0">
          <div className="w-8 h-8 rounded-md bg-red-600 flex items-center justify-center shrink-0">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
          {!collapsed && (
            <div className="min-w-0">
              <p className="text-[11px] font-bold text-white leading-none truncate">Assistant OS</p>
              <p className="text-[9px] text-slate-500 font-mono mt-0.5">MANGA STUDIO</p>
            </div>
          )}
        </div>

        <nav className="flex-1 p-2 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onChangeTab(item.id)}
                title={collapsed ? item.label : undefined}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-all cursor-pointer ${
                  isActive
                    ? 'bg-red-600/15 text-white border border-red-500/30'
                    : 'text-slate-500 hover:text-slate-300 hover:bg-[#2d2d34]/60 border border-transparent'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-red-400' : ''}`} />
                {!collapsed && (
                  <span className="text-[11px] font-bold uppercase tracking-wide truncate">
                    {item.label}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-2 border-t border-[#2d2d34] space-y-1 shrink-0">
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-md text-slate-600 hover:text-slate-400 hover:bg-[#2d2d34]/60 transition-all cursor-pointer"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            {!collapsed && (
              <span className="text-[10px] font-bold uppercase tracking-widest">Collapse</span>
            )}
          </button>
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-slate-500 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!collapsed && (
              <span className="text-[11px] font-bold uppercase tracking-wide">Log out</span>
            )}
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-14 shrink-0 flex items-center gap-4 px-5 bg-[#181820] border-b border-[#2d2d34] relative z-30">
          <div className="flex-1 max-w-md relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-600 pointer-events-none" />
            <input
              type="text"
              value={headerSearch}
              onChange={(e) => onHeaderSearchChange(e.target.value)}
              placeholder="Search tasks, chapters, series…"
              className="w-full pl-9 pr-4 py-2 bg-[#121214] border border-[#2d2d34] rounded-md text-[11px] text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-red-500/50 font-mono"
            />
          </div>

          <NotificationDropdown
            notifications={notifications}
            isOpen={notifOpen}
            onToggle={() => setNotifOpen((o) => !o)}
            onClose={() => setNotifOpen(false)}
            onMarkRead={handleMarkRead}
            onMarkAllRead={handleMarkAllRead}
            onNotificationClick={handleNotificationClick}
          />

          <div className="flex items-center gap-2.5 pl-3 border-l border-[#2d2d34]">
            <img
              src={currentUser.avatar || 'https://i.pravatar.cc/150?u=assistant'}
              alt={currentUser.name}
              className="w-7 h-7 rounded-md border border-[#2d2d34] object-cover"
            />
            <div className="hidden sm:block min-w-0">
              <p className="text-[11px] font-bold text-white leading-none truncate">{currentUser.name}</p>
              <p className="text-[9px] text-red-400 font-mono uppercase mt-0.5">Assistant</p>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-hidden">{children}</main>
      </div>
    </div>
  );
}
