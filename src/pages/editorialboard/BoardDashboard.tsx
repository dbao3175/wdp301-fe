/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { Gavel, Globe, Star } from "lucide-react";
import { TaskBoard } from "../../components/TaskBoard";
import { ActivityFeed } from "../../components/ActivityFeed";
import { NotificationPanel } from "../../components/NotificationPanel";
import { getPermissions } from "../../auth/permissions";
import { DashboardData, DashboardHandlers } from "../../types";
import { inferWorkflowStatus, WORKFLOW_LABELS } from "../../workflow/seriesWorkflow";
import { PUB_SCHEDULE_INFO } from "../../workflow/pubSchedule";

type Props = DashboardData & DashboardHandlers;

export function BoardDashboard({
  currentUser,
  seriesList,
  chapters,
  tasks,
  ranksList,
  votes,
  logs,
  notifications,
  onTaskSubmit,
  onSeriesReview,
  onStatusTransition,
  onRatingSubmit,
  onChapterUpdate,
  onChapterDelete,
  onChapterPublish,
  onVoteSubmit,
  onBoardVotePublish,
  onBoardRejectSeries,
  onBoardFinalPublish,
  onMarkNotificationRead,
  onMarkAllNotificationsRead,
  onClearLogs,
}: Props) {
  const permissions = getPermissions("BOARD_MEMBER");
  const [schedule, setSchedule] = useState<"WEEKLY" | "MONTHLY">("WEEKLY");
  const [comments, setComments] = useState<Record<string, string>>({});

  const awaitingBoard = seriesList.filter((s) => inferWorkflowStatus(s) === "AWAITING_BOARD");
  const pendingPublish = seriesList.filter((s) => inferWorkflowStatus(s) === "PENDING_PUBLISH");

  return (
    <div className="space-y-6" id="board-dashboard">
      <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200 flex gap-3">
        <Gavel className="w-5 h-5 text-purple-600 shrink-0" />
        <div>
          <h2 className="text-sm font-bold text-purple-950">Hội đồng biên tập</h2>
          <p className="text-xs text-purple-800 mt-1">
            Vote Weekly/Monthly → IN_PRODUCTION. Chốt PUBLISHED khi Editor gửi lên.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {(["WEEKLY", "MONTHLY"] as const).map((key) => (
          <div key={key} className="bg-white border rounded-2xl p-4">
            <h4 className="text-xs font-bold">{PUB_SCHEDULE_INFO[key].title}</h4>
            <p className="text-[10px] text-zinc-600 mt-1">{PUB_SCHEDULE_INFO[key].desc}</p>
          </div>
        ))}
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

        <div className="lg:col-span-8 space-y-6">
          <div className="bg-white border rounded-2xl p-5 shadow-xs">
            <h3 className="text-sm font-bold mb-3">Vote xuất bản (từ Editor)</h3>
            {awaitingBoard.length === 0 ? (
              <p className="text-xs text-zinc-400">Không có series chờ vote.</p>
            ) : (
              awaitingBoard.map((s) => (
                <div key={s._id} className="border rounded-xl p-4 mb-3 space-y-2">
                  <p className="text-xs font-bold">{s.title}</p>
                  <p className="text-[10px] text-zinc-600">{s.synopsis}</p>
                  <p className="text-[10px] text-zinc-500">Editor: {s.reviewNote}</p>
                  <select
                    value={schedule}
                    onChange={(e) => setSchedule(e.target.value as "WEEKLY" | "MONTHLY")}
                    className="w-full border rounded p-2 text-xs font-bold"
                  >
                    <option value="WEEKLY">Weekly Manga</option>
                    <option value="MONTHLY">Monthly Manga</option>
                  </select>
                  <input
                    placeholder="Comment..."
                    className="w-full border rounded p-2 text-xs"
                    value={comments[s._id] || ""}
                    onChange={(e) => setComments((p) => ({ ...p, [s._id]: e.target.value }))}
                  />
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        onBoardVotePublish(s._id, schedule, comments[s._id])
                      }
                      className="flex-1 text-xs font-bold bg-emerald-600 text-white py-2 rounded-lg cursor-pointer"
                    >
                      Vote Publish ({schedule})
                    </button>
                    <button
                      type="button"
                      onClick={() => onBoardRejectSeries(s._id, comments[s._id])}
                      className="flex-1 text-xs font-bold bg-rose-600 text-white py-2 rounded-lg cursor-pointer"
                    >
                      Huỷ
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="bg-white border border-indigo-200 rounded-2xl p-5 shadow-xs">
            <h3 className="text-sm font-bold flex items-center gap-2 mb-3">
              <Globe className="w-4 h-4" />
              Chốt PUBLISHED (từ Editor)
            </h3>
            {pendingPublish.length === 0 ? (
              <p className="text-xs text-zinc-400">Chưa có series chờ xuất bản chính thức.</p>
            ) : (
              pendingPublish.map((s) => (
                <div key={s._id} className="flex justify-between items-center border rounded-xl p-3 mb-2">
                  <div>
                    <p className="text-xs font-bold">{s.title}</p>
                    <p className="text-[10px] text-zinc-500">{WORKFLOW_LABELS[inferWorkflowStatus(s)]}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onBoardFinalPublish(s._id)}
                    className="text-[10px] font-bold bg-zinc-900 text-white px-3 py-1.5 rounded-lg cursor-pointer"
                  >
                    PUBLISHED
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="bg-white border rounded-2xl p-5 shadow-xs">
            <h3 className="text-sm font-bold flex items-center gap-2 mb-2">
              <Star className="w-4 h-4 text-amber-500" />
              Nhập liệu ranking
            </h3>
            <p className="text-[10px] text-zinc-600 mb-3">Dùng tab Bảng Rating bên dưới.</p>
          </div>

          <TaskBoard
            currentUser={currentUser}
            tasks={tasks}
            chapters={chapters}
            seriesList={seriesList}
            ranksList={ranksList}
            permissions={permissions}
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
