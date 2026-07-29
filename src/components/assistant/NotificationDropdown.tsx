/**
 * NotificationDropdown — Facebook-style notification panel
 */

import React, { useRef, useEffect } from 'react';
import {
  Bell,
  CheckCheck,
  ClipboardList,
  RotateCcw,
  CheckCircle2,
  Clock,
  MessageSquare,
  Wallet,
  Settings,
} from 'lucide-react';
import { AssistantNotification, NotificationType } from './assistantTypes';
import { useLanguage, type AppLanguage } from '../../i18n/LanguageContext';

type FilterTab = 'all' | 'unread';

interface NotificationDropdownProps {
  notifications: AssistantNotification[];
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  onNotificationClick: (notification: AssistantNotification) => void;
}

function formatRelativeTime(iso: string, language: AppLanguage): string {
  const diffMs = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return language === 'vi' ? 'Vừa xong' : 'Just now';
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  if (days === 1) return '1d';
  if (days < 7) return `${days}d`;
  return new Date(iso).toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US', { month: 'short', day: 'numeric' });
}

function typeIcon(type: NotificationType) {
  const cls = 'w-3 h-3';
  switch (type) {
    case 'task_assigned':
      return <ClipboardList className={cls} />;
    case 'task_revision':
      return <RotateCcw className={cls} />;
    case 'task_approved':
      return <CheckCircle2 className={cls} />;
    case 'deadline':
      return <Clock className={cls} />;
    case 'comment':
      return <MessageSquare className={cls} />;
    case 'payment':
      return <Wallet className={cls} />;
    default:
      return <Bell className={cls} />;
  }
}

function typeBadgeColor(type: NotificationType): string {
  switch (type) {
    case 'task_assigned':
      return 'bg-blue-500';
    case 'task_revision':
      return 'bg-amber-500';
    case 'task_approved':
      return 'bg-green-500';
    case 'deadline':
      return 'bg-red-500';
    case 'comment':
      return 'bg-violet-500';
    case 'payment':
      return 'bg-emerald-500';
    default:
      return 'bg-slate-500';
  }
}

export default function NotificationDropdown({
  notifications,
  isOpen,
  onToggle,
  onClose,
  onMarkRead,
  onMarkAllRead,
  onNotificationClick,
}: NotificationDropdownProps) {
  const { language, t } = useLanguage();
  const panelRef = useRef<HTMLDivElement>(null);
  const [filter, setFilter] = React.useState<FilterTab>('all');

  const unreadCount = notifications.filter((n) => !n.read).length;
  const filtered =
    filter === 'unread' ? notifications.filter((n) => !n.read) : notifications;

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) setFilter('all');
  }, [isOpen]);

  const handleItemClick = (n: AssistantNotification) => {
    if (!n.read) onMarkRead(n._id);
    onNotificationClick(n);
    onClose();
  };

  return (
    <div ref={panelRef} className="relative">
      {/* Bell trigger */}
      <button
        onClick={onToggle}
        aria-expanded={isOpen}
        aria-haspopup="true"
        className={`relative p-2 rounded-md transition-colors cursor-pointer ${
          isOpen ? 'bg-[#2d2d34] text-white' : 'hover:bg-[#2d2d34] text-slate-500'
        }`}
      >
        <Bell className={`w-4 h-4 ${isOpen ? 'text-white' : ''}`} />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[16px] h-4 px-1 flex items-center justify-center bg-red-600 text-white text-[9px] font-bold rounded-full">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown panel */}
      {isOpen && (
        <div
          className="absolute right-0 top-full mt-2 w-[360px] max-h-[480px] flex flex-col bg-[#24242e] border border-[#3a3a48] rounded-xl shadow-2xl shadow-black/60 overflow-hidden z-50 animate-fadeIn origin-top-right"
          style={{ animation: 'notifDropIn 0.18s ease-out' }}
        >
          {/* Header */}
          <div className="px-4 pt-4 pb-3 border-b border-[#3a3a48] shrink-0">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-[15px] font-bold text-white">{t("Notifications")}</h3>
              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <button
                    onClick={onMarkAllRead}
                    className="p-1.5 rounded-full hover:bg-[#2d2d34] text-slate-500 hover:text-blue-400 transition-colors cursor-pointer"
                    title={t("Mark all read")}
                  >
                    <CheckCheck className="w-4 h-4" />
                  </button>
                )}
                <button
                  className="p-1.5 rounded-full hover:bg-[#2d2d34] text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                  title={t("Notification settings")}
                >
                  <Settings className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Filter tabs — Facebook-style pills */}
            <div className="flex gap-1">
              {(['all', 'unread'] as FilterTab[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setFilter(tab)}
                  className={`px-3 py-1 rounded-full text-[11px] font-bold capitalize transition-all cursor-pointer ${
                    filter === tab
                      ? 'bg-blue-600 text-white'
                      : 'bg-[#2d2d34] text-slate-400 hover:bg-[#353545] hover:text-slate-300'
                  }`}
                >
                  {t(tab === "all" ? "All" : "Unread")}
                  {tab === 'unread' && unreadCount > 0 && (
                    <span className="ml-1 opacity-80">({unreadCount})</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto overscroll-contain">
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                <div className="w-12 h-12 rounded-full bg-[#2d2d34] flex items-center justify-center mb-3">
                  <Bell className="w-5 h-5 text-slate-600" />
                </div>
                <p className="text-[13px] font-semibold text-slate-400">
                  {filter === 'unread' ? t("No unread notifications") : t("No notifications yet")}
                </p>
                <p className="text-[11px] text-slate-600 mt-1">
                  {filter === 'unread'
                    ? t("You're all caught up!")
                    : t("Task updates and alerts will appear here.")}
                </p>
              </div>
            ) : (
              <ul>
                {filtered.map((n) => (
                  <li key={n._id}>
                    <button
                      onClick={() => handleItemClick(n)}
                      className={`w-full flex items-start gap-3 px-4 py-3 text-left transition-colors cursor-pointer hover:bg-[#2d2d34]/80 ${
                        !n.read ? 'bg-blue-600/10 hover:bg-blue-600/15' : ''
                      }`}
                    >
                      {/* Avatar + type badge */}
                      <div className="relative shrink-0 mt-0.5">
                        <img
                          src={n.actorAvatar}
                          alt={n.actorName}
                          className="w-12 h-12 rounded-full object-cover border border-[#3a3a48]"
                        />
                        <span
                          className={`absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full flex items-center justify-center text-white border-2 border-[#24242e] ${typeBadgeColor(n.type)}`}
                        >
                          {typeIcon(n.type)}
                        </span>
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 pt-0.5">
                        <p className="text-[13px] leading-snug text-slate-300">
                          <span className="font-bold text-white">{n.actorName}</span>{' '}
                          {n.message}
                        </p>
                        <p className="text-[11px] text-blue-400 font-semibold mt-1">
                          {formatRelativeTime(n.createdAt, language)}
                        </p>
                      </div>

                      {/* Unread dot */}
                      {!n.read && (
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0 mt-2" />
                      )}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="shrink-0 border-t border-[#3a3a48] px-4 py-2.5">
              <button
                onClick={onClose}
                className="w-full py-2 text-[12px] font-bold text-blue-400 hover:text-blue-300 hover:bg-[#2d2d34]/60 rounded-md transition-colors cursor-pointer"
              >
                {t("See all notifications")}
              </button>
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes notifDropIn {
          from { opacity: 0; transform: scale(0.95) translateY(-4px); }
          to   { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
}
