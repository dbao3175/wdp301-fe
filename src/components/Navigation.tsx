import React, { useState, useEffect } from "react";
import { User, UserRole } from "../types";
import { apiClient } from "../api/client";
import LanguageToggle from "./LanguageToggle";
import { localizeNotificationText, useLanguage } from "../i18n/LanguageContext";
import {
  Compass,
  Layers,
  CheckSquare,
  TrendingUp,
  LogOut,
  Menu,
  X,
  Sparkles,
  BookOpen,
  Bell,
  Shield,
} from "lucide-react";

interface NavigationProps {
  currentUser: User | null;
  activeTab: string;
  onChangeTab: (tab: string) => void;
  onLogout: () => void;
  onConfigChange?: () => void;
}

export default function Navigation({
  currentUser,
  activeTab,
  onChangeTab,
  onLogout,
  onConfigChange,
}: NavigationProps) {
  const { language, t } = useLanguage();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

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

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 8000);
    return () => clearInterval(interval);
  }, [currentUser]);

  const navItems = [
    {
      id: "workspace",
      label: t("Manga Workspace"),
      icon: Compass,
      roles: ["MANGAKA", "EDITOR"],
    },
    {
      id: "chapters",
      label: t("Chapter Management"),
      icon: BookOpen,
      roles: ["MANGAKA", "EDITOR"],
    },
    {
      id: "tasks",
      label: t("Series Proposals"),
      icon: Layers,
      roles: ["MANGAKA", "EDITOR"],
    },
    {
      id: "board",
      label: t("Editorial Board"),
      icon: CheckSquare,
      roles: ["EDITOR", "BOARD_MEMBER"],
    },
    {
      id: "analytics",
      label: t("Rankings Dashboard"),
      icon: TrendingUp,
      roles: ["BOARD_MEMBER", "MANGAKA"],
    },
    { id: "admin", label: t("Admin Panel"), icon: Shield, roles: ["ADMIN"] },
  ];

  const filteredNavItems = navItems.filter((item) => {
    if (!currentUser) return false;
    return item.roles.includes(currentUser.role);
  });

  return (
    <>
      {/* Mobile Top Header Ribbon */}
      <header className="md:hidden h-16 bg-[#E63946] text-white flex items-center justify-between px-4 fixed top-0 left-0 w-full z-40 border-b-4 border-ink-black shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-white rounded-xs flex items-center justify-center">
            <span className="text-[#E63946] font-black text-xl">M</span>
          </div>
          <span className="font-syne text-sm font-black uppercase tracking-widest leading-none">
            MANGA STUDIO OS
          </span>
        </div>
        <div className="flex items-center gap-3">
          <LanguageToggle tone="red" compact />
          {/* Mobile Bell Button */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className={`p-1.5 border-2 border-ink-black rounded-xs transition-colors cursor-pointer relative bg-white text-ink-black`}
              title={t("Notifications")}
            >
              <Bell className="w-3.5 h-3.5" />
              {notifications.filter((n) => !n.isRead).length > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[14px] h-3.5 px-0.5 bg-[#E63946] text-white text-[8px] font-black flex items-center justify-center rounded-full border border-white animate-pulse">
                  {notifications.filter((n) => !n.isRead).length}
                </span>
              )}
            </button>
            {showNotifications && (
              <div className="fixed top-16 right-4 left-4 bg-white border-4 border-ink-black shadow-[6px_6px_0px_#141414] z-50 flex flex-col max-h-[350px]">
                <div className="bg-[#E63946] text-white p-2.5 border-b-4 border-ink-black flex justify-between items-center select-none">
                  <span className="font-syne font-black text-xs uppercase tracking-wider">
                    {t("Notifications")}
                  </span>
                  <div className="flex items-center gap-2">
                    {notifications.filter((n) => !n.isRead).length > 0 && (
                      <button
                        type="button"
                        onClick={handleMarkAllRead}
                        className="px-1.5 py-0.5 border border-white hover:bg-white/20 text-[9px] font-mono font-bold uppercase transition-all cursor-pointer"
                      >
                        {t("Mark all read")}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowNotifications(false)}
                      className="text-white hover:text-neutral-200 cursor-pointer"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <div className="overflow-y-auto divide-y-2 divide-[#141414] flex-1 bg-white text-ink-black max-h-[250px]">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-neutral-400 font-mono text-[10px]">
                      {t("No new notifications")}
                    </div>
                  ) : (
                    notifications.map((n) => (
                      <div
                        key={n._id}
                        onClick={() => handleMarkRead(n._id)}
                        className={`p-3 text-left transition-colors cursor-pointer hover:bg-neutral-50 flex gap-2 items-start ${
                          !n.isRead
                            ? "bg-yellow-50/70 border-l-4 border-l-[#E63946]"
                            : "border-l-4 border-l-transparent"
                        }`}
                      >
                        <div className="flex-1 min-w-0">
                          <h4 className="text-[11px] font-extrabold text-ink-black leading-tight mb-0.5">
                            {localizeNotificationText(n.title, language)}
                          </h4>
                          <p className="text-[10px] text-neutral-600 leading-snug">
                            {localizeNotificationText(n.content, language)}
                          </p>
                          <span className="text-[8px] font-mono text-neutral-400 mt-1 block">
                            {new Date(n.createdAt).toLocaleString(language === "vi" ? "vi-VN" : "en-US")}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
          <button
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            className="p-1 text-white focus:outline-none cursor-pointer"
          >
            {isMobileOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>
      </header>

      {/* Main Left Desktop Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-72 bg-white text-ink-black z-40 transition-transform duration-300 transform md:translate-x-0 ${isMobileOpen ? "translate-x-0" : "-translate-x-full"} border-r-4 border-ink-black flex flex-col justify-between p-0 select-none shadow-[4px_0px_0px_rgba(20,20,20,0.15)]`}
      >
        <div className="flex flex-col">
          <div className="p-6 border-b-4 border-ink-black flex items-center gap-3 bg-[#E63946] text-white">
            <div className="w-9 h-9 bg-white rounded-sm flex items-center justify-center outline outline-2 outline-white shadow-sm shrink-0">
              <span className="text-[#E63946] font-extrabold text-2xl font-syne">
                M
              </span>
            </div>
            <div>
              <span className="font-syne font-black uppercase tracking-tighter text-lg leading-tight block">
                Manga
                <br />
                Studio OS
              </span>
            </div>
            <LanguageToggle tone="red" compact className="ml-auto" />
          </div>

          {currentUser && (
            <div className="p-4 border-b-2 border-ink-black bg-manuscript-gray">
              <span className="text-neutral-500 font-mono text-[9px] uppercase font-bold tracking-widest block mb-1">
                {t("Studio Auth & Role")}
              </span>

              <div className="flex items-center gap-3 bg-white p-2.5 border-2 border-ink-black rounded-sm shadow-[2px_2px_0px_#141414] relative">
                <div className="relative w-10 h-10 rounded-full border-2 border-ink-black bg-neutral-100 text-ink-black flex items-center justify-center shrink-0 overflow-hidden">
                  <span className="font-syne text-[10px] font-black uppercase" aria-hidden="true">
                    {currentUser.name
                      .split(/\s+/)
                      .filter(Boolean)
                      .slice(0, 2)
                      .map((part) => part[0])
                      .join('') || 'MS'}
                  </span>
                  {currentUser.avatar && (
                    <img
                      src={currentUser.avatar}
                      alt={currentUser.name}
                      onError={(event) => { event.currentTarget.style.display = 'none'; }}
                      className="absolute inset-0 w-full h-full object-cover bg-neutral-100"
                    />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-sans text-xs text-ink-black font-extrabold truncate leading-tight">
                    {currentUser.name}
                  </div>
                  <div className="font-mono text-[9px] text-[#E63946] font-bold tracking-tight uppercase mt-0.5 italic">
                    {t(currentUser.role)}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowNotifications(!showNotifications)}
                  className={`p-1.5 border-2 border-ink-black rounded-xs transition-colors cursor-pointer relative shrink-0 ${
                    showNotifications
                      ? "bg-ink-black text-white"
                      : "bg-white hover:bg-neutral-100 text-ink-black"
                  }`}
                  title={t("Notifications")}
                >
                  <Bell className="w-4 h-4" />
                  {notifications.filter((n) => !n.isRead).length > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 bg-[#E63946] text-white text-[8px] font-black flex items-center justify-center rounded-full border border-white animate-pulse">
                      {notifications.filter((n) => !n.isRead).length}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute left-[260px] top-0 w-80 bg-white border-4 border-ink-black shadow-[6px_6px_0px_#141414] z-50 flex flex-col max-h-[400px]">
                    <div className="bg-[#E63946] text-white p-3 border-b-4 border-ink-black flex justify-between items-center select-none">
                      <span className="font-syne font-black text-xs uppercase tracking-wider">
                        {t("Notifications")}
                      </span>
                      <div className="flex items-center gap-2">
                        {notifications.filter((n) => !n.isRead).length > 0 && (
                          <button
                            type="button"
                            onClick={handleMarkAllRead}
                            className="px-1.5 py-0.5 border border-white hover:bg-white/20 text-[9px] font-mono font-bold uppercase transition-all cursor-pointer"
                            title={t("Mark all read")}
                          >
                            {t("Mark all read")}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => setShowNotifications(false)}
                          className="text-white hover:text-neutral-200 cursor-pointer"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="overflow-y-auto divide-y-2 divide-ink-black flex-1 bg-white text-ink-black max-h-[300px]">
                      {notifications.length === 0 ? (
                        <div className="p-6 text-center text-neutral-400 font-mono text-[10px]">
                          {t("No new notifications")}
                        </div>
                      ) : (
                        notifications.map((n) => (
                          <div
                            key={n._id}
                            onClick={() => handleMarkRead(n._id)}
                            className={`p-3 text-left transition-colors cursor-pointer hover:bg-neutral-50 flex gap-2 items-start ${
                              !n.isRead
                                ? "bg-yellow-50/70 border-l-4 border-l-[#E63946]"
                                : "border-l-4 border-l-transparent"
                            }`}
                          >
                            <div className="flex-1 min-w-0">
                              <h4 className="text-[11px] font-extrabold text-ink-black leading-tight mb-0.5">
                                {localizeNotificationText(n.title, language)}
                              </h4>
                              <p className="text-[10px] text-neutral-600 leading-snug">
                                {localizeNotificationText(n.content, language)}
                              </p>
                              <span className="text-[8px] font-mono text-neutral-400 mt-1 block">
                                {new Date(n.createdAt).toLocaleString(language === "vi" ? "vi-VN" : "en-US")}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t border-dashed border-neutral-300 mt-2.5 pt-2 text-center">
                <span className="text-neutral-500 font-mono text-[8px] uppercase tracking-wider block font-bold">
                  {t("Studio session account active")}
                </span>
              </div>
            </div>
          )}

          <nav className="p-4 space-y-1">
            <div className="text-[10px] font-extrabold text-neutral-400 uppercase tracking-widest pl-1 mb-2">
              {t("Creative workflow")}
            </div>
            {filteredNavItems.map((item) => {
              const IconComp = item.icon;
              const isActive = activeTab === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onChangeTab(item.id);
                    setIsMobileOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3.5 py-2 border-2 transition-all cursor-pointer select-none rounded-none font-syne text-[11px] font-black uppercase tracking-tight ${
                    isActive
                      ? "bg-ink-black text-white border-ink-black shadow-[3px_3px_0px_#141414]"
                      : "bg-white text-neutral-600 border-transparent hover:border-ink-black hover:bg-neutral-50"
                  }`}
                >
                  <span className="flex items-center gap-3">
                    <IconComp
                      className={`w-4 h-4 ${isActive ? "text-[#E63946]" : "text-neutral-500"}`}
                    />
                    <span>{t(item.label)}</span>
                  </span>

                  {isActive && (
                    <span className="bg-[#E63946] text-white text-[9px] px-1.5 py-0.5 rounded-none font-sans font-bold">
                      {t("Active")}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t-2 border-ink-black bg-manuscript-gray">
          <button
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 bg-white border-2 border-ink-black hover:bg-neutral-50 text-ink-black font-syne text-[10px] uppercase font-black tracking-tight py-2 rounded-none shadow-[2px_2px_0px_#141414] active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
          >
            <LogOut className="w-3.5 h-3.5 text-[#E63946]" />
            {t("Exit Studio OS")}
          </button>
        </div>
      </aside>

      {isMobileOpen && (
        <div
          onClick={() => setIsMobileOpen(false)}
          className="fixed inset-0 bg-black/60 z-30 md:hidden"
        />
      )}
    </>
  );
}
