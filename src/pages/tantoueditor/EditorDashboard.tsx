/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useMemo, useState } from "react";
import { Calendar, FileCheck, Send, Shield } from "lucide-react";
import { CreateForm } from "../../components/CreateForm";
import { TaskBoard } from "../../components/TaskBoard";
import { ActivityFeed } from "../../components/ActivityFeed";
import { NotificationPanel } from "../../components/NotificationPanel";
import { getPermissions } from "../../auth/permissions";
import { DashboardData, DashboardHandlers } from "../../types";
import { inferWorkflowStatus, WORKFLOW_LABELS } from "../../workflow/seriesWorkflow";

type Props = DashboardData & DashboardHandlers;

export function EditorDashboard(props: Props) {
  const {
    currentUser,
    seriesList,
    chapters,
    tasks,
    ranksList,
    votes,
    logs,
    notifications,
    onChapterCreate,
    onTaskSubmit,
    onSeriesReview,
    onStatusTransition,
    onRatingSubmit,
    onChapterUpdate,
    onChapterDelete,
    onChapterPublish,
    onVoteSubmit,
    onEditorRequestRevision,
    onEditorSendToBoard,
    onEditorSetChapterDeadline,
    onEditorNotifyMangakaStart,
    onEditorApproveForPublish,
    onMarkNotificationRead,
    onMarkAllNotificationsRead,
    onClearLogs,
  } = props;

  const permissions = getPermissions("EDITOR");
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});
  const [deadlines, setDeadlines] = useState<Record<string, string>>({});

  const pendingEditor = seriesList.filter((s) => inferWorkflowStatus(s) === "PENDING_EDITOR");
  const inProduction = seriesList.filter((s) => inferWorkflowStatus(s) === "IN_PRODUCTION");
  const pendingPublish = seriesList.filter((s) => inferWorkflowStatus(s) === "PENDING_PUBLISH");

  const studioProgress = useMemo(() => {
    return inProduction.map((series) => {
      const seriesChaps = chapters.filter((c) => c.seriesId === series._id);
      const done = seriesChaps.filter((c) => c.status === "COMPLETED").length;
      const total = seriesChaps.length || 1;
      return {
        series,
        seriesChaps,
        percent: Math.round((done / total) * 100),
      };
    });
  }, [inProduction, chapters]);

  return (
    <div className="space-y-6" id="editor-dashboard">
      <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 flex gap-3">
        <Shield className="w-5 h-5 text-blue-600 shrink-0" />
        <div>
          <h2 className="text-sm font-bold text-blue-950">Tantou Editor</h2>
          <p className="text-xs text-blue-800 mt-1">
            Chỉ duyệt PENDING và gửi thủ công lên Board — không giao việc Assistant.
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
          <CreateForm
            currentUser={currentUser}
            seriesList={seriesList}
            chapters={chapters}
            permissions={permissions}
            onSeriesCreate={async () => {}}
            onChapterCreate={onChapterCreate}
            onTaskCreate={async () => {}}
          />
          <ActivityFeed logs={logs} onClearLogs={onClearLogs} />
        </div>

        <div className="lg:col-span-8 space-y-6">
          {/* Phase 1: PENDING only */}
          <div className="bg-white border rounded-2xl p-5 shadow-xs">
            <h3 className="text-sm font-bold flex items-center gap-2 mb-3">
              <FileCheck className="w-4 h-4" />
              Duyệt đề xuất (PENDING) → Gửi Board
            </h3>
            {pendingEditor.length === 0 ? (
              <p className="text-xs text-zinc-400 py-4 text-center">Không có series PENDING.</p>
            ) : (
              pendingEditor.map((s) => (
                <div key={s._id} className="border rounded-xl p-4 mb-3 space-y-2">
                  <p className="text-xs font-bold">{s.title}</p>
                  <p className="text-[10px] text-zinc-600">{s.synopsis}</p>
                  <span className="text-[10px] font-bold text-zinc-500">
                    {WORKFLOW_LABELS[inferWorkflowStatus(s)]}
                  </span>
                  <textarea
                    placeholder="Nhận xét Editor..."
                    value={reviewNotes[s._id] || ""}
                    onChange={(e) =>
                      setReviewNotes((p) => ({ ...p, [s._id]: e.target.value }))
                    }
                    className="w-full border rounded p-2 text-xs"
                    rows={2}
                  />
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        onEditorRequestRevision(s._id, reviewNotes[s._id] || "Cần chỉnh sửa")
                      }
                      className="text-[10px] font-bold bg-amber-600 text-white px-3 py-1.5 rounded-lg cursor-pointer"
                    >
                      Yêu cầu Mangaka sửa
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        onEditorSendToBoard(s._id, reviewNotes[s._id] || "Đồng ý gửi Board")
                      }
                      className="text-[10px] font-bold bg-indigo-600 text-white px-3 py-1.5 rounded-lg flex items-center gap-1 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" /> Gửi thủ công lên Board
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* IN_PRODUCTION: deadlines */}
          <div className="bg-white border rounded-2xl p-5 shadow-xs">
            <h3 className="text-sm font-bold flex items-center gap-2 mb-3">
              <Calendar className="w-4 h-4" />
              IN_PRODUCTION — đặt deadline chapter
            </h3>
            {studioProgress.length === 0 ? (
              <p className="text-xs text-zinc-400">Chưa có series sản xuất.</p>
            ) : (
              studioProgress.map(({ series, seriesChaps, percent }) => (
                <div key={series._id} className="border rounded-xl p-4 mb-3">
                  <p className="text-xs font-bold">
                    {series.title}{" "}
                    <span className="text-indigo-600">({series.pubSchedule})</span>
                  </p>
                  <div className="h-1.5 bg-zinc-100 rounded-full mt-2 overflow-hidden">
                    <div className="h-full bg-indigo-500" style={{ width: `${percent}%` }} />
                  </div>
                  {seriesChaps.map((ch) => (
                    <div key={ch._id} className="flex gap-2 mt-2 items-center">
                      <span className="text-[10px] flex-1 truncate">{ch.title}</span>
                      <input
                        type="date"
                        className="text-[10px] border rounded px-1"
                        value={deadlines[ch._id] ?? (ch.dueAt ? ch.dueAt.substring(0, 10) : "")}
                        onChange={(e) =>
                          setDeadlines((p) => ({ ...p, [ch._id]: e.target.value }))
                        }
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const d = deadlines[ch._id];
                          if (d)
                            onEditorSetChapterDeadline(
                              ch._id,
                              new Date(d).toISOString()
                            );
                        }}
                        className="text-[9px] font-bold border px-2 py-0.5 rounded cursor-pointer"
                      >
                        Lưu
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => onEditorNotifyMangakaStart(series._id)}
                    className="mt-3 w-full text-xs font-bold bg-zinc-900 text-white py-2 rounded-lg cursor-pointer"
                  >
                    Thông báo Mangaka bắt đầu & giao việc Assistant
                  </button>
                </div>
              ))
            )}
          </div>

          {/* PENDING_PUBLISH from Mangaka */}
          <div className="bg-white border border-indigo-200 rounded-2xl p-5 shadow-xs">
            <h3 className="text-sm font-bold text-indigo-900 mb-3">
              Duyệt xuất bản → Gửi Hội đồng
            </h3>
            {pendingPublish.length === 0 ? (
              <p className="text-xs text-zinc-400">Chưa có bản chờ duyệt publish.</p>
            ) : (
              pendingPublish.map((s) => {
                const withEditorTasks = tasks.filter(
                  (t) => t.seriesId === s._id && t.deliveryStatus === "WITH_EDITOR"
                );
                return (
                  <div key={s._id} className="border rounded-xl p-4 mb-2">
                    <p className="text-xs font-bold">{s.title}</p>
                    <p className="text-[10px] text-zinc-500 mb-2">
                      {withEditorTasks.length} task từ Mangaka
                    </p>
                    <button
                      type="button"
                      onClick={() => onEditorApproveForPublish(s._id, "Đạt chuẩn xuất bản")}
                      className="w-full text-xs font-bold bg-indigo-600 text-white py-2 rounded-lg cursor-pointer"
                    >
                      Duyệt OK → Gửi Board PUBLISHED
                    </button>
                  </div>
                );
              })
            )}
          </div>

          <TaskBoard
            currentUser={currentUser}
            tasks={tasks}
            chapters={chapters}
            seriesList={seriesList}
            ranksList={ranksList}
            permissions={{ ...permissions, canReviewSeriesAsEditor: false }}
            onTaskSubmit={onTaskSubmit}
            onSeriesReview={onSeriesReview}
            onStatusTransition={onStatusTransition}
            onRatingSubmit={onRatingSubmit}
            onChapterUpdate={onChapterUpdate}
            onChapterDelete={onChapterDelete}
            onChapterPublish={onChapterPublish}
            votes={votes}
            onVoteSubmit={onVoteSubmit}
          />
        </div>
      </div>
    </div>
  );
}
