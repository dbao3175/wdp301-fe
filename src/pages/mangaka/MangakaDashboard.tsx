/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useMemo, useState } from "react";
import {
  AlertTriangle,
  Award,
  CheckCircle,
  FileText,
  MessageSquare,
  Send,
  Sparkles,
  ThumbsUp,
  TrendingDown,
} from "lucide-react";
import { CreateForm } from "../../components/CreateForm";
import { ActivityFeed } from "../../components/ActivityFeed";
import { NotificationPanel } from "../../components/NotificationPanel";
import { getPermissions, getSeriesMangakaId } from "../../auth/permissions";
import { getStatusBadgeColor } from "../../data";
import { DashboardData, DashboardHandlers } from "../../types";
import { inferWorkflowStatus, WORKFLOW_LABELS } from "../../workflow/seriesWorkflow";

type Props = DashboardData & DashboardHandlers;

export function MangakaDashboard(props: Props) {
  const {
    currentUser,
    seriesList,
    chapters,
    tasks,
    ranksList,
    logs,
    notifications,
    manuscriptReviews,
    onSeriesCreate,
    onChapterCreate,
    onTaskCreate,
    onManuscriptReview,
    onSubmitSeriesToEditor,
    onMangakaReviseSeries,
    onMangakaSendWorkToEditor,
    onMarkNotificationRead,
    onMarkAllNotificationsRead,
    onClearLogs,
  } = props;

  const permissions = getPermissions("MANGAKA");
  const [reviewNote, setReviewNote] = useState<Record<string, string>>({});
  const [reviseDraft, setReviseDraft] = useState<Record<string, { title: string; synopsis: string }>>({});

  const mySeries = useMemo(
    () => seriesList.filter((s) => getSeriesMangakaId(s.mangakaId) === currentUser._id),
    [seriesList, currentUser._id]
  );

  const mySeriesIds = useMemo(() => new Set(mySeries.map((s) => s._id)), [mySeries]);

  const myTasks = useMemo(
    () => tasks.filter((t) => mySeriesIds.has(t.seriesId)),
    [tasks, mySeriesIds]
  );

  const doneAwaitingReview = myTasks.filter(
    (t) =>
      t.status === "DONE" &&
      (t.deliveryStatus === "SUBMITTED" || (!t.deliveryStatus && !manuscriptReviews[t._id]))
  );

  const mangakaApprovedTasks = myTasks.filter(
    (t) => t.deliveryStatus === "MANGAKA_APPROVED"
  );

  const productionSeries = mySeries.filter(
    (s) => inferWorkflowStatus(s) === "IN_PRODUCTION"
  );

  const myRanks = useMemo(() => {
    return ranksList
      .filter((r) => mySeriesIds.has(r.seriesId))
      .sort((a, b) => a.rank - b.rank)
      .map((r) => ({
        ...r,
        series: seriesList.find((s) => s._id === r.seriesId),
      }));
  }, [ranksList, mySeriesIds, seriesList]);

  const atRiskSeries = myRanks.filter((r) => r.rank >= 13);

  const getChapterTitle = (chapId: string) =>
    chapters.find((c) => c._id === chapId)?.title || chapId;

  const getSeriesTitle = (seriesId: string) =>
    seriesList.find((s) => s._id === seriesId)?.title || seriesId;

  return (
    <div className="space-y-6" id="mangaka-dashboard">
      <div className="p-4 rounded-2xl bg-orange-50 border border-orange-200 flex gap-3 items-start">
        <Sparkles className="w-5 h-5 text-orange-600 shrink-0 mt-0.5" />
        <div>
          <h2 className="text-sm font-bold text-orange-950">Bảng điều khiển Mangaka</h2>
          <p className="text-xs text-orange-800 mt-1 leading-relaxed">
            Gửi đề xuất → chỉnh sửa khi Editor phản hồi → sản xuất → giao Assistant → duyệt → gửi Editor.
          </p>
        </div>
      </div>

      {atRiskSeries.length > 0 && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200">
          <div className="flex items-center gap-2 text-rose-900 font-bold text-xs mb-2">
            <AlertTriangle className="w-4 h-4" />
            Cảnh báo xếp hạng thấp (hạng 13+)
          </div>
          <ul className="space-y-1.5">
            {atRiskSeries.map((r) => (
              <li key={r._id} className="text-xs text-rose-800 flex items-center gap-2">
                <TrendingDown className="w-3.5 h-3.5 shrink-0" />
                <strong>{r.series?.title}</strong> #{r.rank}
              </li>
            ))}
          </ul>
        </div>
      )}

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
            onSeriesCreate={onSeriesCreate}
            onChapterCreate={onChapterCreate}
            onTaskCreate={onTaskCreate}
          />
          <ActivityFeed logs={logs} onClearLogs={onClearLogs} />
        </div>

        <div className="lg:col-span-8 space-y-6">
          {/* Series workflow */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-xs">
            <h3 className="text-sm font-bold mb-3">Series của tôi — luồng duyệt</h3>
            <div className="space-y-3">
              {mySeries.map((s) => {
                const ws = inferWorkflowStatus(s);
                const draft = reviseDraft[s._id] ?? { title: s.title, synopsis: s.synopsis };
                return (
                  <div key={s._id} className="border border-zinc-200 rounded-xl p-4 space-y-2">
                    <div className="flex justify-between gap-2">
                      <p className="text-xs font-bold">{s.title}</p>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded border shrink-0 ${getStatusBadgeColor(ws)}`}>
                        {WORKFLOW_LABELS[ws]}
                      </span>
                    </div>
                    {s.revisionNote && (
                      <p className="text-xs bg-amber-50 border border-amber-200 rounded p-2">
                        <strong>Editor:</strong> {s.revisionNote}
                      </p>
                    )}
                    {ws === "DRAFT" && (
                      <button
                        type="button"
                        onClick={() => onSubmitSeriesToEditor(s._id)}
                        className="w-full text-xs font-bold bg-zinc-900 text-white py-2 rounded-lg cursor-pointer"
                      >
                        Gửi lên Tantou Editor
                      </button>
                    )}
                    {ws === "REVISION_REQUIRED" && (
                      <div className="space-y-2">
                        <input
                          className="w-full border rounded p-2 text-xs"
                          value={draft.title}
                          onChange={(e) =>
                            setReviseDraft((p) => ({
                              ...p,
                              [s._id]: { ...draft, title: e.target.value },
                            }))
                          }
                        />
                        <textarea
                          className="w-full border rounded p-2 text-xs"
                          rows={2}
                          value={draft.synopsis}
                          onChange={(e) =>
                            setReviseDraft((p) => ({
                              ...p,
                              [s._id]: { ...draft, synopsis: e.target.value },
                            }))
                          }
                        />
                        <button
                          type="button"
                          onClick={() =>
                            onMangakaReviseSeries(s._id, draft.title, draft.synopsis)
                          }
                          className="w-full text-xs font-bold bg-amber-600 text-white py-2 rounded-lg cursor-pointer"
                        >
                          Lưu chỉnh sửa & gửi lại Editor
                        </button>
                      </div>
                    )}
                    {ws === "IN_PRODUCTION" && s.pubSchedule && (
                      <p className="text-[10px] text-emerald-700 font-bold">
                        Xuất bản: {s.pubSchedule} — xem thông báo deadline từ Editor
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Gửi Editor sau khi duyệt Assistant */}
          {mangakaApprovedTasks.length > 0 && (
            <div className="bg-white border border-indigo-200 rounded-2xl p-5 shadow-xs">
              <h3 className="text-sm font-bold text-indigo-900 mb-3 flex items-center gap-2">
                <Send className="w-4 h-4" />
                Gửi bản hoàn chỉnh lên Editor
              </h3>
              {productionSeries.map((ser) => {
                const approved = mangakaApprovedTasks.filter((t) => t.seriesId === ser._id);
                if (approved.length === 0) return null;
                return (
                  <div key={ser._id} className="mb-3 last:mb-0">
                    <p className="text-xs font-bold mb-2">{ser.title}</p>
                    <ul className="text-[10px] text-zinc-600 mb-2 space-y-1">
                      {approved.map((t) => (
                        <li key={t._id}>✓ {t.title}</li>
                      ))}
                    </ul>
                    <button
                      type="button"
                      onClick={() =>
                        onMangakaSendWorkToEditor(
                          ser._id,
                          approved.map((t) => t._id)
                        )
                      }
                      className="w-full text-xs font-bold bg-indigo-600 text-white py-2 rounded-lg cursor-pointer"
                    >
                      Gửi Editor duyệt xuất bản
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Manuscript review */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-xs">
            <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Duyệt bản từ Assistant
            </h3>
            {doneAwaitingReview.length === 0 ? (
              <p className="text-xs text-zinc-400 py-6 text-center">Chưa có bản chờ duyệt.</p>
            ) : (
              <div className="space-y-3 mt-3">
                {doneAwaitingReview.map((task) => (
                  <div key={task._id} className="border rounded-xl p-4 space-y-2">
                    <p className="text-xs font-bold">{task.title}</p>
                    <p className="text-[10px] text-zinc-500">
                      {getSeriesTitle(task.seriesId)} • {getChapterTitle(task.chapterId)}
                    </p>
                    <textarea
                      placeholder="Ghi chú..."
                      value={reviewNote[task._id] || ""}
                      onChange={(e) =>
                        setReviewNote((p) => ({ ...p, [task._id]: e.target.value }))
                      }
                      className="w-full border rounded p-2 text-xs"
                      rows={2}
                    />
                    <div className="flex gap-2 justify-end">
                      <button
                        type="button"
                        onClick={() =>
                          onManuscriptReview(
                            task._id,
                            "REVISION_REQUESTED",
                            reviewNote[task._id] || "Cần sửa"
                          )
                        }
                        className="text-xs font-bold border border-amber-300 px-3 py-1.5 rounded-lg cursor-pointer"
                      >
                        <MessageSquare className="w-3.5 h-3.5 inline" /> Yêu cầu sửa
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          onManuscriptReview(
                            task._id,
                            "APPROVED",
                            reviewNote[task._id] || "OK"
                          )
                        }
                        className="text-xs font-bold bg-emerald-600 text-white px-3 py-1.5 rounded-lg cursor-pointer"
                      >
                        <ThumbsUp className="w-3.5 h-3.5 inline" /> Duyệt
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-xs">
            <h3 className="text-sm font-bold flex items-center gap-2 mb-3">
              <Award className="w-4 h-4" /> Xếp hạng
            </h3>
            {myRanks.length === 0 ? (
              <p className="text-xs text-zinc-400">Chưa có dữ liệu.</p>
            ) : (
              myRanks.map((r) => (
                <div key={r._id} className="flex justify-between py-2 text-xs border-b">
                  <span>#{r.rank} {r.series?.title}</span>
                  {r.rank >= 13 ? (
                    <TrendingDown className="w-4 h-4 text-rose-500" />
                  ) : (
                    <CheckCircle className="w-4 h-4 text-emerald-500" />
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
