/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Bell, CheckCheck } from "lucide-react";
import { AppNotification, User } from "../types";
import { filterNotificationsForUser } from "../workflow/notifications";

interface NotificationPanelProps {
  currentUser: User;
  notifications: AppNotification[];
  onMarkRead: (id: string) => void;
  onMarkAllRead: () => void;
  maxItems?: number;
}

export function NotificationPanel({
  currentUser,
  notifications,
  onMarkRead,
  onMarkAllRead,
  maxItems = 8,
}: NotificationPanelProps) {
  const mine = filterNotificationsForUser(notifications, currentUser)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, maxItems);

  const unread = mine.filter((n) => !n.read).length;

  return (
    <div className="bg-white border border-zinc-200 rounded-2xl shadow-xs overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100 bg-zinc-50/80">
        <h3 className="text-xs font-bold flex items-center gap-2 text-zinc-900">
          <Bell className="w-4 h-4" />
          Thông báo
          {unread > 0 && (
            <span className="bg-rose-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full">
              {unread}
            </span>
          )}
        </h3>
        {unread > 0 && (
          <button
            type="button"
            onClick={onMarkAllRead}
            className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 cursor-pointer"
          >
            <CheckCheck className="w-3.5 h-3.5" />
            Đã đọc hết
          </button>
        )}
      </div>
      <div className="max-h-64 overflow-y-auto divide-y divide-zinc-100">
        {mine.length === 0 ? (
          <p className="text-xs text-zinc-400 text-center py-8 px-4">Chưa có thông báo.</p>
        ) : (
          mine.map((n) => (
            <button
              key={n.id}
              type="button"
              onClick={() => onMarkRead(n.id)}
              className={`w-full text-left px-4 py-3 hover:bg-zinc-50 transition-colors cursor-pointer ${
                !n.read ? "bg-indigo-50/40" : ""
              }`}
            >
              <p className="text-[10px] font-bold text-zinc-500">{n.title}</p>
              <p className="text-xs text-zinc-800 mt-0.5 leading-relaxed">{n.message}</p>
              <p className="text-[9px] text-zinc-400 mt-1 font-mono">
                {new Date(n.createdAt).toLocaleString("vi-VN")}
              </p>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
