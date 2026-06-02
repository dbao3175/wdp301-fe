/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useMemo } from "react";
import { CheckCircle, Clock, DollarSign, Send, Wallet } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { ActivityFeed } from "../../components/ActivityFeed";
import { NotificationPanel } from "../../components/NotificationPanel";
import { DashboardData, DashboardHandlers } from "../../types";

type Props = DashboardData & DashboardHandlers;

const PAGE_RATE_VND = 85000;

export function AssistantDashboard({
  currentUser,
  seriesList,
  chapters,
  tasks,
  logs,
  notifications,
  onTaskSubmit,
  onMarkNotificationRead,
  onMarkAllNotificationsRead,
  onClearLogs,
}: Props) {
  const myTasks = useMemo(
    () => tasks.filter((t) => t.assignedTo === currentUser._id),
    [tasks, currentUser._id]
  );

  const pendingTasks = myTasks.filter((t) => t.status === "PENDING");
  const doneTasks = myTasks.filter((t) => t.status === "DONE");

  const monthlyStats = useMemo(() => {
    const now = new Date();
    const doneThisMonth = doneTasks.filter((t) => {
      const d = new Date(t.updatedAt || t.createdAt || "");
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    });
    return {
      approvedPages: doneThisMonth.length,
      income: doneThisMonth.length * PAGE_RATE_VND,
      doneThisMonth,
    };
  }, [doneTasks]);

  const getSeriesTitle = (id: string) => seriesList.find((s) => s._id === id)?.title || id;
  const getChapterTitle = (id: string) => chapters.find((c) => c._id === id)?.title || id;

  return (
    <div className="space-y-6" id="assistant-dashboard">
      <div className="p-4 rounded-2xl bg-teal-50 border border-teal-200 flex gap-3">
        <Wallet className="w-5 h-5 text-teal-600 shrink-0" />
        <div>
          <h2 className="text-sm font-bold text-teal-950">Assistant</h2>
          <p className="text-xs text-teal-800 mt-1">
            Nhận thông báo khi Mangaka giao việc — nộp bài → Mangaka kiểm duyệt.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border rounded-2xl p-4 shadow-xs">
          <p className="text-[10px] font-bold text-zinc-500 uppercase">Đang làm</p>
          <p className="text-2xl font-black text-amber-600">{pendingTasks.length}</p>
        </div>
        <div className="bg-white border rounded-2xl p-4 shadow-xs">
          <p className="text-[10px] font-bold text-zinc-500 uppercase">Trang tháng</p>
          <p className="text-2xl font-black text-emerald-600">{monthlyStats.approvedPages}</p>
        </div>
        <div className="bg-white border rounded-2xl p-4 shadow-xs">
          <p className="text-[10px] font-bold text-zinc-500 uppercase flex items-center gap-1">
            <DollarSign className="w-3 h-3" /> Thu nhập
          </p>
          <p className="text-lg font-black text-teal-700">
            {monthlyStats.income.toLocaleString("vi-VN")} ₫
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 space-y-6">
          <NotificationPanel
            currentUser={currentUser}
            notifications={notifications}
            onMarkRead={onMarkNotificationRead}
            onMarkAllRead={onMarkAllNotificationsRead}
          />
          <ActivityFeed logs={logs} onClearLogs={onClearLogs} />
        </div>
        <div className="lg:col-span-8 grid md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-xs font-bold flex items-center gap-2 mb-3">
              <Clock className="w-4 h-4 text-amber-600" /> Việc được giao
            </h3>
            <div className="space-y-3 min-h-[200px] bg-zinc-50/50 rounded-2xl p-3 border border-dashed">
              <AnimatePresence mode="popLayout">
                {pendingTasks.length === 0 ? (
                  <p className="text-xs text-zinc-400 text-center py-12">Không có việc.</p>
                ) : (
                  pendingTasks.map((task) => (
                    <motion.div
                      key={task._id}
                      layout
                      className="bg-white border border-amber-200 rounded-xl p-4"
                    >
                      <span className="text-[10px] font-bold bg-zinc-100 px-2 py-0.5 rounded">
                        {getSeriesTitle(task.seriesId)}
                      </span>
                      <h4 className="text-xs font-bold mt-2">{task.title}</h4>
                      <p className="text-[10px] text-zinc-500">{getChapterTitle(task.chapterId)}</p>
                      <button
                        type="button"
                        onClick={() => onTaskSubmit(task._id)}
                        className="mt-3 w-full bg-emerald-600 text-white text-xs font-bold py-2 rounded-lg flex items-center justify-center gap-1 cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" /> Nộp cho Mangaka duyệt
                      </button>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </div>
          <div>
            <h3 className="text-xs font-bold flex items-center gap-2 mb-3">
              <CheckCircle className="w-4 h-4 text-emerald-600" /> Đã nộp
            </h3>
            <div className="space-y-2 min-h-[200px] bg-zinc-50/50 rounded-2xl p-3 border border-dashed">
              {doneTasks.map((t) => (
                <div key={t._id} className="text-xs p-3 bg-white border rounded-xl">
                  <p className="line-through text-zinc-500">{t.title}</p>
                  <p className="text-emerald-600 font-bold text-[10px] mt-1">
                    {t.deliveryStatus === "SUBMITTED"
                      ? "Chờ Mangaka duyệt"
                      : t.deliveryStatus || "DONE"}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
