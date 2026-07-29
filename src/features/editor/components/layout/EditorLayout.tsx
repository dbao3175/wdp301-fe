import React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { SidebarProvider, useSidebar } from './SidebarContext';
import MotionScene from '../../../../components/motion/MotionScene';
import LanguageToggle from '../../../../components/LanguageToggle';
import { useLanguage } from '../../../../i18n/LanguageContext';
import { apiClient } from '../../../../api/client';
import { getStoredUser } from '../../../../api/base';
import type { Notification } from '../../../../types';
import { EditorNotificationPanel } from './EditorNotificationPanel';

const routeLabels: Record<string, string> = {
  editor: 'Editor',
  dashboard: 'Dashboard',
  proposals: 'Proposals',
  series: 'Series',
  review: 'Review',
};

export const Breadcrumb: React.FC = () => {
  const location = useLocation();
  const { t } = useLanguage();
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
        const label = t(routeLabels[seg] ?? seg);
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
import { Bell, Menu, Search } from 'lucide-react';

interface EditorLayoutProps {
  children: React.ReactNode;
  onLogout?: () => void;
}

const EditorLayoutInner: React.FC<{ children: React.ReactNode; onLogout?: () => void }> = ({ children, onLogout }) => {
  const { collapsed, setCollapsed } = useSidebar();
  const [mobileSidebarOpen, setMobileSidebarOpen] = React.useState(false);
  const location = useLocation();
  const { t } = useLanguage();
  const queryClient = useQueryClient();
  const currentUser = getStoredUser();
  const userId = currentUser?._id;
  const [notificationsOpen, setNotificationsOpen] = React.useState(false);
  const notificationRootRef = React.useRef<HTMLDivElement>(null);
  const notificationQueryKey = React.useMemo(() => ['editor-notifications', userId] as const, [userId]);

  const {
    data: notifications = [],
    isLoading: notificationsLoading,
    isError: notificationsError,
    refetch: refetchNotifications,
  } = useQuery<Notification[]>({
    queryKey: notificationQueryKey,
    queryFn: async () => {
      const result = await apiClient.notifications.getAll(userId as string);
      return Array.isArray(result) ? result : [];
    },
    enabled: Boolean(userId),
    refetchInterval: 10_000,
    staleTime: 5_000,
  });

  const unreadNotificationCount = notifications.filter((notification) => !notification.isRead).length;

  React.useEffect(() => {
    if (!notificationsOpen) return;

    const handlePointerDown = (event: MouseEvent) => {
      if (!notificationRootRef.current?.contains(event.target as Node)) {
        setNotificationsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setNotificationsOpen(false);
    };

    document.addEventListener('mousedown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [notificationsOpen]);

  const updateNotificationCache = (updater: (items: Notification[]) => Notification[]) => {
    queryClient.setQueryData<Notification[]>(notificationQueryKey, (current = []) => updater(current));
  };

  const handleMarkNotificationRead = async (id: string) => {
    const selected = notifications.find((notification) => notification._id === id);
    if (!selected || selected.isRead) return;

    updateNotificationCache((items) => items.map((notification) => (
      notification._id === id ? { ...notification, isRead: true } : notification
    )));
    try {
      await apiClient.notifications.markRead(id);
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      void refetchNotifications();
    }
  };

  const handleMarkAllNotificationsRead = async () => {
    if (!userId || unreadNotificationCount === 0) return;

    updateNotificationCache((items) => items.map((notification) => ({ ...notification, isRead: true })));
    try {
      await apiClient.notifications.markAllRead(userId);
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      void refetchNotifications();
    }
  };
  
  return (
    <div className="min-h-screen bg-manuscript-gray flex">
      {mobileSidebarOpen && (
        <button
          type="button"
          aria-label={t("Close editor navigation")}
          onClick={() => setMobileSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-[1px] md:hidden"
        />
      )}
      <EditorSidebar
        onLogout={onLogout}
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
        onNotificationsClick={() => setNotificationsOpen(true)}
        unreadNotificationCount={unreadNotificationCount}
      />

      {/* Main content — offset by sidebar width (64px collapsed, 256px expanded) */}
      <div className={`flex-1 min-w-0 flex flex-col min-h-screen transition-all duration-300 ${collapsed ? 'md:ml-16' : 'md:ml-64'}`}>
        {/* Top Bar */}
        <header className="sticky top-0 z-30 bg-ink-black border-b-2 border-neutral-700 px-3 sm:px-6 py-3 flex items-center justify-between gap-3 min-h-[64px]">
          <div className="min-w-0 flex items-center gap-3 overflow-hidden">
            <button
              type="button"
              aria-label={t("Open editor navigation")}
              onClick={() => { setCollapsed(false); setMobileSidebarOpen(true); }}
              className="shrink-0 w-9 h-9 border border-neutral-700 text-neutral-300 hover:text-white hover:border-neutral-500 flex items-center justify-center md:hidden"
            >
              <Menu className="w-4 h-4" />
            </button>
            <div className="min-w-0 overflow-hidden"><Breadcrumb /></div>
          </div>
          <div className="flex items-center gap-3">
            {/* Search */}
            <div className="hidden md:flex items-center gap-2 bg-neutral-800 border border-neutral-600 px-3 py-1.5">
              <Search className="w-3 h-3 text-neutral-400" />
              <input
                type="text"
                placeholder={t("Quick search...")}
                className="bg-transparent text-xs font-mono text-white placeholder-neutral-500 outline-none w-36"
              />
            </div>
            <LanguageToggle tone="dark" compact />
            {/* Notifications */}
            <div ref={notificationRootRef} className="relative">
              <button
                type="button"
                onClick={() => setNotificationsOpen((open) => !open)}
                aria-label={t("Open notifications")}
                aria-expanded={notificationsOpen}
                aria-haspopup="dialog"
                title={t("Notifications")}
                className={`relative w-8 h-8 flex items-center justify-center transition-colors border ${
                  notificationsOpen
                    ? 'border-white bg-white text-ink-black'
                    : 'border-neutral-700 text-neutral-400 hover:text-white hover:border-neutral-500'
                }`}
              >
                <Bell className="w-4 h-4" />
                {unreadNotificationCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-4 h-4 px-0.5 bg-[#E63946] text-white text-[8px] font-mono font-black flex items-center justify-center border border-ink-black">
                    {unreadNotificationCount > 9 ? '9+' : unreadNotificationCount}
                  </span>
                )}
              </button>
              <EditorNotificationPanel
                isOpen={notificationsOpen}
                notifications={notifications}
                isLoading={notificationsLoading}
                isError={notificationsError}
                onClose={() => setNotificationsOpen(false)}
                onRetry={() => { void refetchNotifications(); }}
                onMarkRead={(id) => { void handleMarkNotificationRead(id); }}
                onMarkAllRead={() => { void handleMarkAllNotificationsRead(); }}
              />
            </div>
            {/* Avatar */}
            <div className="w-8 h-8 border-2 border-[#E63946] bg-neutral-800 text-white flex items-center justify-center font-mono text-[10px] font-black" aria-label={t('Editor profile')}>
              ED
            </div>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 p-3 sm:p-6 overflow-y-auto">
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
