import React from 'react';
import { AlertTriangle, Bell, CheckCheck, CircleAlert, Info, LoaderCircle, X } from 'lucide-react';
import type { Notification } from '../../../../types';
import { localizeNotificationText, useLanguage } from '../../../../i18n/LanguageContext';

interface EditorNotificationPanelProps {
  isOpen: boolean;
  notifications: Notification[];
  isLoading: boolean;
  isError: boolean;
  onClose: () => void;
  onRetry: () => void;
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
}

const notificationIcon = (type: Notification['type']) => {
  if (type === 'ERROR') return <CircleAlert className="w-4 h-4" />;
  if (type === 'WARNING') return <AlertTriangle className="w-4 h-4" />;
  return <Info className="w-4 h-4" />;
};

const notificationTone = (type: Notification['type']) => {
  if (type === 'ERROR') return 'bg-red-100 text-red-700 border-red-300';
  if (type === 'WARNING') return 'bg-amber-100 text-amber-700 border-amber-300';
  return 'bg-blue-100 text-blue-700 border-blue-300';
};

export const EditorNotificationPanel: React.FC<EditorNotificationPanelProps> = ({
  isOpen,
  notifications,
  isLoading,
  isError,
  onClose,
  onRetry,
  onMarkRead,
  onMarkAllRead,
}) => {
  const { language, t } = useLanguage();
  const unreadCount = notifications.filter((notification) => !notification.isRead).length;

  if (!isOpen) return null;

  return (
    <section
      role="dialog"
      aria-label={t('Notifications')}
      className="fixed inset-x-3 top-[72px] z-[70] max-h-[min(70vh,520px)] overflow-hidden border-2 border-ink-black bg-white shadow-[6px_6px_0px_#E63946] sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-3 sm:w-[390px]"
    >
      <header className="flex items-center justify-between gap-3 border-b-2 border-ink-black bg-ink-black px-4 py-3 text-white">
        <div>
          <h2 className="font-syne text-sm font-extrabold uppercase tracking-wider">{t('Notifications')}</h2>
          <p className="mt-0.5 font-mono text-[9px] uppercase text-neutral-400">
            {unreadCount > 0
              ? t('{{count}} unread notifications', { count: unreadCount })
              : t('No unread notifications')}
          </p>
        </div>
        <div className="flex items-center gap-1">
          {unreadCount > 0 && (
            <button
              type="button"
              onClick={onMarkAllRead}
              title={t('Mark all read')}
              aria-label={t('Mark all read')}
              className="flex h-8 items-center gap-1 border border-neutral-600 px-2 font-mono text-[9px] font-black uppercase text-neutral-200 transition-colors hover:border-white hover:text-white"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{t('Mark all read')}</span>
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            title={t('Close')}
            aria-label={t('Close')}
            className="flex h-8 w-8 items-center justify-center border border-neutral-600 text-neutral-300 transition-colors hover:border-white hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </header>

      <div className="max-h-[calc(min(70vh,520px)-66px)] overflow-y-auto">
        {isLoading ? (
          <div className="flex items-center justify-center gap-2 px-4 py-12 font-mono text-xs text-neutral-500">
            <LoaderCircle className="h-4 w-4 animate-spin" />
            {t('Loading notifications...')}
          </div>
        ) : isError ? (
          <div className="p-5 text-center">
            <CircleAlert className="mx-auto mb-2 h-7 w-7 text-[#E63946]" />
            <p className="font-sans text-sm font-bold text-ink-black">{t('Unable to load notifications')}</p>
            <button
              type="button"
              onClick={onRetry}
              className="mt-3 border-2 border-ink-black bg-white px-4 py-2 font-mono text-[10px] font-black uppercase shadow-[2px_2px_0px_#141414] hover:bg-neutral-50"
            >
              {t('Try again')}
            </button>
          </div>
        ) : notifications.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <Bell className="mx-auto mb-3 h-8 w-8 text-neutral-300" />
            <p className="font-syne text-sm font-extrabold uppercase text-neutral-500">{t('No notifications yet')}</p>
            <p className="mt-1 font-mono text-[10px] text-neutral-400">{t('Updates and alerts will appear here.')}</p>
          </div>
        ) : (
          <ul className="divide-y-2 divide-neutral-200">
            {notifications.map((notification) => (
              <li key={notification._id}>
                <button
                  type="button"
                  onClick={() => onMarkRead(notification._id)}
                  className={`flex w-full items-start gap-3 border-l-4 p-4 text-left transition-colors hover:bg-neutral-50 ${
                    notification.isRead ? 'border-l-transparent bg-white' : 'border-l-[#E63946] bg-red-50/50'
                  }`}
                >
                  <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center border ${notificationTone(notification.type)}`}>
                    {notificationIcon(notification.type)}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-start justify-between gap-2">
                      <strong className="font-sans text-xs font-extrabold leading-snug text-ink-black">
                        {localizeNotificationText(notification.title, language)}
                      </strong>
                      {!notification.isRead && <span className="mt-1 h-2 w-2 shrink-0 bg-[#E63946]" aria-label={t('Unread')} />}
                    </span>
                    <span className="mt-1 block font-sans text-[11px] leading-relaxed text-neutral-600">
                      {localizeNotificationText(notification.content, language)}
                    </span>
                    {notification.createdAt && (
                      <time className="mt-2 block font-mono text-[9px] text-neutral-400">
                        {new Date(notification.createdAt).toLocaleString(language === 'vi' ? 'vi-VN' : 'en-US')}
                      </time>
                    )}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
};