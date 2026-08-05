/**
 * AssistantLayout — collapsible rail + header shell
 */

import React, { useState, useEffect } from 'react';
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
  Menu,
  X,
} from 'lucide-react';
import { AssistantNotification } from './assistantTypes';
import NotificationDropdown from './NotificationDropdown';
import { apiClient } from '../../api/client';
import MotionScene from '../motion/MotionScene';
import LanguageToggle from '../LanguageToggle';
import { localizeNotificationText, useLanguage } from '../../i18n/LanguageContext';

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
  const { language, t } = useLanguage();
  const [collapsed, setCollapsed] = useState(false);
  const [notifications, setNotifications] = useState<AssistantNotification[]>([]);
  const [notifOpen, setNotifOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const railWidth = collapsed ? 'md:w-[68px]' : 'md:w-[220px]';

  useEffect(() => {
    async function loadNotifications() {
      try {
        if (!currentUser?._id) return;
        const list = await apiClient.notifications.getAll(currentUser._id);
        if (Array.isArray(list)) {
          const mapped = list.map((n: any) => {
            let mappedType: any = 'task_assigned';
            const titleLower = (n.title || '').toLowerCase();
            if (titleLower.includes('approved') || titleLower.includes('duyệt')) {
              mappedType = 'task_approved';
            } else if (titleLower.includes('revision') || titleLower.includes('sửa')) {
              mappedType = 'task_revision';
            } else if (titleLower.includes('payment') || titleLower.includes('tiền') || titleLower.includes('thu nhập')) {
              mappedType = 'payment';
            } else if (titleLower.includes('deadline') || titleLower.includes('hạn')) {
              mappedType = 'deadline';
            }
            return {
              _id: n._id,
              type: mappedType,
              actorName: n.type === 'WARNING' ? 'System' : 'Editor',
              actorAvatar: n.type === 'WARNING' 
                ? 'https://api.dicebear.com/7.x/bottts/svg?seed=System'
                : 'https://api.dicebear.com/7.x/avataaars/svg?seed=Editor',
              message: `${localizeNotificationText(n.title, language)}: ${localizeNotificationText(n.content, language)}`,
              taskId: n.taskId || undefined,
              createdAt: n.createdAt,
              read: n.isRead
            };
          });
          setNotifications(mapped);
        }
      } catch (err) {
        console.error('Failed to load notifications:', err);
      }
    }
    
    if (apiClient.getConfig().useLiveBackend && currentUser?._id) {
      loadNotifications();
      const interval = setInterval(loadNotifications, 10000);
      return () => clearInterval(interval);
    }
  }, [currentUser?._id, language]);

  const handleMarkRead = async (id: string) => {
    try {
      if (apiClient.getConfig().useLiveBackend) {
        await apiClient.notifications.markRead(id);
      }
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, read: true } : n))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      if (apiClient.getConfig().useLiveBackend && currentUser?._id) {
        await apiClient.notifications.markAllRead(currentUser._id);
      }
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const handleNotificationClick = (n: AssistantNotification) => {
    onNotificationClick?.(n);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#121214]">
      {mobileNavOpen && (
        <button
          type="button"
          aria-label={t("Close assistant navigation")}
          onClick={() => setMobileNavOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-[1px] md:hidden"
        />
      )}
      <aside
        className={`${railWidth} fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] md:relative md:inset-auto md:z-auto shrink-0 flex flex-col bg-[#1e1e24] border-r border-[#2d2d34] transition-all duration-300 select-none transform ${mobileNavOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}
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
          <button
            type="button"
            aria-label={t("Close assistant navigation")}
            onClick={() => setMobileNavOpen(false)}
            className="ml-auto p-2 text-slate-400 hover:text-white md:hidden"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 p-2 space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => { onChangeTab(item.id); setMobileNavOpen(false); }}
                title={collapsed ? t(item.label) : undefined}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md transition-all cursor-pointer ${
                  isActive
                    ? 'bg-red-600/15 text-white border border-red-500/30'
                    : 'text-slate-500 hover:text-slate-300 hover:bg-[#2d2d34]/60 border border-transparent'
                }`}
              >
                <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-red-400' : ''}`} />
                {!collapsed && (
                  <span className="text-[11px] font-bold uppercase tracking-wide truncate">
                    {t(item.label)}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-2 border-t border-[#2d2d34] space-y-1 shrink-0">
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="hidden md:flex w-full items-center justify-center gap-2 px-3 py-2 rounded-md text-slate-600 hover:text-slate-400 hover:bg-[#2d2d34]/60 transition-all cursor-pointer"
          >
            {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            {!collapsed && (
              <span className="text-[10px] font-bold uppercase tracking-widest">{t("Collapse")}</span>
            )}
          </button>
          <button
            onClick={onLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-slate-500 hover:text-red-400 hover:bg-red-500/10 border border-transparent hover:border-red-500/20 transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!collapsed && (
              <span className="text-[11px] font-bold uppercase tracking-wide">{t("Log out")}</span>
            )}
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-14 shrink-0 flex items-center gap-2 sm:gap-4 px-3 sm:px-5 bg-[#181820] border-b border-[#2d2d34] relative z-30">
          <button
            type="button"
            aria-label={t("Open assistant navigation")}
            onClick={() => setMobileNavOpen(true)}
            className="p-2 -ml-1 rounded-md border border-[#2d2d34] text-slate-300 hover:border-red-500/50 hover:text-white md:hidden"
          >
            <Menu className="w-4 h-4" />
          </button>

          <div className="hidden sm:block flex-1 max-w-md relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-600 pointer-events-none" />
            <input
              type="text"
              value={headerSearch}
              onChange={(e) => onHeaderSearchChange(e.target.value)}
              placeholder={t("Search tasks, chapters, series...")}
              className="w-full pl-9 pr-4 py-2 bg-[#121214] border border-[#2d2d34] rounded-md text-[11px] text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-red-500/50 font-mono"
            />
          </div>

          <LanguageToggle tone="dark" compact />

          <NotificationDropdown
            notifications={notifications}
            isOpen={notifOpen}
            onToggle={() => setNotifOpen((o) => !o)}
            onClose={() => setNotifOpen(false)}
            onMarkRead={handleMarkRead}
            onMarkAllRead={handleMarkAllRead}
            onNotificationClick={handleNotificationClick}
          />

          <div className="hidden sm:block w-px h-6 bg-[#2d2d34]" />

          <div className="flex items-center gap-3 select-none">
            <div className="hidden lg:block text-right">
              <p className="text-[11px] font-bold text-white leading-none">{currentUser.name}</p>
              <p className="text-[9px] text-slate-500 font-mono mt-1 uppercase tracking-wider">
                {t(currentUser.role)}
              </p>
            </div>
            <div className="relative w-8 h-8 rounded-md bg-red-600/15 text-red-300 ring-1 ring-red-500/30 flex items-center justify-center overflow-hidden shrink-0">
              <span className="text-[10px] font-black uppercase" aria-hidden="true">
                {currentUser.name
                  .split(/\s+/)
                  .filter(Boolean)
                  .slice(0, 2)
                  .map((part) => part[0])
                  .join('') || 'AS'}
              </span>
              {currentUser.avatar && (
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  onError={(event) => { event.currentTarget.style.display = 'none'; }}
                  className="absolute inset-0 w-full h-full bg-[#2d2d34] object-cover"
                />
              )}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-hidden relative">
          <MotionScene sceneKey={activeTab} className="h-full">
            {children}
          </MotionScene>
        </main>
      </div>
    </div>
  );
}