import React, { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";
import { SidebarProvider, useSidebar } from "./SidebarContext";
import MotionScene from "../../../../components/motion/MotionScene";
import LanguageToggle from "../../../../components/LanguageToggle";
import { useLanguage } from "../../../../i18n/LanguageContext";
import { apiClient } from "../../../../api/client";
import { getStoredUser } from "../../../../api/base";
import type { Notification } from "../../../../types";
import { EditorNotificationPanel } from "./EditorNotificationPanel";

const routeLabels: Record<string, string> = {
  editor: "Editor",
  dashboard: "Dashboard",
  proposals: "Proposals",
  series: "Series",
  review: "Review",
};

export const Breadcrumb: React.FC = () => {
  const location = useLocation();
  const { t } = useLanguage();
  const segments = location.pathname.split("/").filter(Boolean);

  return (
    <nav className="flex items-center gap-1 text-xs font-mono">
      <Link
        to="/editor/dashboard"
        className="text-neutral-400 hover:text-white transition-colors flex items-center"
      >
        <Home className="w-3 h-3" />
      </Link>
      {segments.map((seg, idx) => {
        const path = "/" + segments.slice(0, idx + 1).join("/");
        const label = t(routeLabels[seg] ?? seg);
        const isLast = idx === segments.length - 1;

        return (
          <React.Fragment key={path}>
            <ChevronRight className="w-3 h-3 text-neutral-600" />
            {isLast ? (
              <span className="text-white font-bold uppercase tracking-wide">
                {label}
              </span>
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

import { EditorSidebar } from "./EditorSidebar.tsx";
import { Bell, Menu, Search, CheckCheck, X } from "lucide-react";

interface EditorLayoutProps {
  children: React.ReactNode;
  onLogout?: () => void;
}

const EditorLayoutInner: React.FC<{
  children: React.ReactNode;
  onLogout?: () => void;
}> = ({ children, onLogout }) => {
  const { collapsed, setCollapsed } = useSidebar();
  const { t } = useLanguage();
  const [mobileSidebarOpen, setMobileSidebarOpen] = React.useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  const currentUser = getStoredUser();

  const fetchNotifications = async () => {
    if (!currentUser?._id) return;
    try {
      const data = await apiClient.notifications.getAll(currentUser._id);
      setNotifications(data || []);
    } catch (err) {
      console.error("Error fetching notifications:", err);
    }
  };

  const handleMarkRead = async (id: string) => {
    try {
      await apiClient.notifications.markRead(id);
      setNotifications((prev) =>
        prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)),
      );
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  };

  const handleMarkAllRead = async () => {
    if (!currentUser?._id) return;
    try {
      await apiClient.notifications.markAllRead(currentUser._id);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch (err) {
      console.error("Error marking all notifications as read:", err);
    }
  };

  // Redirect to the relevant page when a notification is clicked.
  const handleNotificationClick = async (n: any) => {
    if (!n.isRead) await handleMarkRead(n._id);
    setShowNotifications(false);

    if (n.targetType === "PROPOSAL" && n.targetId) {
      navigate(`/editor/proposals/${n.targetId}`);
      return;
    }
    if (n.targetType === "CHAPTER" && n.targetId) {
      if (n.link) navigate(n.link);
      else navigate("/editor/dashboard");
      return;
    }
    if (n.targetType === "SERIES" && n.targetId) {
      navigate(`/editor/series/${n.targetId}`);
      return;
    }
    if (n.link) {
      navigate(n.link);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 8000);
    return () => clearInterval(interval);
  }, [currentUser]);

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
      />

      {/* Main content — offset by sidebar width (64px collapsed, 256px expanded) */}
      <div
        className={`flex-1 min-w-0 flex flex-col min-h-screen transition-all duration-300 ${collapsed ? "md:ml-16" : "md:ml-64"}`}
      >
        {/* Top Bar */}
        <header className="sticky top-0 z-30 bg-ink-black border-b-2 border-neutral-700 px-3 sm:px-6 py-3 flex items-center justify-between gap-3 min-h-[64px]">
          <div className="min-w-0 flex items-center gap-3 overflow-hidden">
            <button
              type="button"
              aria-label={t("Open editor navigation")}
              onClick={() => {
                setCollapsed(false);
                setMobileSidebarOpen(true);
              }}
              className="shrink-0 w-9 h-9 border border-neutral-700 text-neutral-300 hover:text-white hover:border-neutral-500 flex items-center justify-center md:hidden"
            >
              <Menu className="w-4 h-4" />
            </button>
            <div className="min-w-0 overflow-hidden">
              <Breadcrumb />
            </div>
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
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative w-8 h-8 flex items-center justify-center text-neutral-400 hover:text-white transition-colors border border-neutral-700 hover:border-neutral-500 cursor-pointer"
              >
                <Bell className="w-4 h-4" />
                {notifications.filter((n) => !n.isRead).length > 0 && (
                  <span className="absolute top-0.5 right-0.5 min-w-[14px] h-3.5 px-0.5 bg-[#E63946] text-white text-[8px] font-black flex items-center justify-center rounded-full border border-ink-black">
                    {notifications.filter((n) => !n.isRead).length}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white border-2 border-ink-black shadow-[4px_4px_0px_#141414] z-50 flex flex-col max-h-[400px]">
                  <div className="bg-ink-black text-white p-3 border-b-2 border-ink-black flex justify-between items-center">
                    <span className="font-syne font-black text-xs uppercase tracking-wider">
                      NOTIFICATIONS
                    </span>
                    <div className="flex items-center gap-2">
                      {notifications.filter((n) => !n.isRead).length > 0 && (
                        <button
                          type="button"
                          onClick={handleMarkAllRead}
                          className="px-1.5 py-0.5 border border-white hover:bg-white/20 text-[9px] font-mono font-bold uppercase transition-all cursor-pointer"
                          title="Mark all as read"
                        >
                          <CheckCheck className="w-3 h-3" />
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setShowNotifications(false)}
                        className="text-white hover:text-neutral-200 cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                  <div className="overflow-y-auto divide-y-2 divide-ink-black flex-1 bg-white text-ink-black max-h-[300px]">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-neutral-400 font-mono text-[10px]">
                        No new notifications
                      </div>
                    ) : (
                      notifications.map((n) => (
                        <div
                          key={n._id}
                          onClick={() => handleNotificationClick(n)}
                          className={`p-3 text-left transition-colors cursor-pointer hover:bg-neutral-50 flex gap-2 items-start ${
                            !n.isRead
                              ? "bg-yellow-50/70 border-l-4 border-l-[#E63946]"
                              : "border-l-4 border-l-transparent"
                          }`}
                        >
                          <div className="flex-1 min-w-0">
                            <h4 className="text-[11px] font-extrabold text-ink-black leading-tight mb-0.5">
                              {n.title}
                            </h4>
                            <p className="text-[10px] text-neutral-600 leading-snug">
                              {n.content}
                            </p>
                            <span className="text-[8px] font-mono text-neutral-400 mt-1 block">
                              {new Date(n.createdAt).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            {/* Avatar */}
            <div
              className="w-8 h-8 border-2 border-[#E63946] bg-neutral-800 text-white flex items-center justify-center font-mono text-[10px] font-black"
              aria-label={t("Editor profile")}
            >
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
              backgroundImage:
                "radial-gradient(#9ca3af 0.6px, transparent 0.6px)",
              backgroundSize: "20px 20px",
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

export const EditorLayout: React.FC<EditorLayoutProps> = ({
  children,
  onLogout,
}) => {
  return (
    <SidebarProvider>
      <EditorLayoutInner onLogout={onLogout}>{children}</EditorLayoutInner>
    </SidebarProvider>
  );
};
