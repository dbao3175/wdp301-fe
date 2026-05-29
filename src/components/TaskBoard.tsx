/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  CheckCircle,
  Clock, 
  Send,
  BookOpen,
  Filter,
  Check,
  FileCheck,
  ThumbsUp,
  Award,
  ChevronRight,
  User,
  Star,
  Activity,
  AlertCircle,
  Edit2,
  Trash2,
  Globe,
  Plus
} from "lucide-react";
import { Task, Chapter, Series, User as UserType, SeriesRank, Vote } from "../types";
import { MOCK_USERS, getStatusBadgeColor } from "../data";

interface TaskBoardProps {
  currentUser: UserType | null;
  tasks: Task[];
  chapters: Chapter[];
  seriesList: Series[];
  ranksList: SeriesRank[];
  onTaskSubmit: (id: string) => Promise<void>;
  onSeriesReview: (seriesId: string, action: "APPROVED" | "REJECTED", note: string, pubSchedule?: "WEEKLY" | "MONTHLY") => Promise<void>;
  onStatusTransition: (seriesId: string, status: "APPROVED" | "IN_PRODUCTION" | "PUBLISHED" | "REJECTED" | "CANCELLED") => Promise<void>;
  onRatingSubmit: (seriesId: string, voteCount: number, sourceFrom: string) => Promise<void>;
  onChapterUpdate: (id: string, updatedFields: Partial<Chapter>) => Promise<void>;
  onChapterDelete: (id: string) => Promise<void>;
  onChapterPublish: (id: string) => Promise<void>;
  votes: Vote[];
  onVoteSubmit: (seriesId: string, decision: "ACCEPT" | "REJECT", comment: string) => Promise<void>;
}

export const TaskBoard: React.FC<TaskBoardProps> = ({
  currentUser,
  tasks,
  chapters,
  seriesList,
  ranksList,
  onTaskSubmit,
  onSeriesReview,
  onStatusTransition,
  onRatingSubmit,
  onChapterUpdate,
  onChapterDelete,
  onChapterPublish,
  votes,
  onVoteSubmit,
}) => {
  const [activeTab, setActiveTab] = useState<"kanban" | "reviews" | "ratings" | "chapters" >("kanban");

  // Kanban Fiters state
  const [seriesFilter, setSeriesFilter] = useState<string>("all");
  const [chapterFilter, setChapterFilter] = useState<string>("all");
  const [assignedFilter, setAssignedFilter] = useState<"all" | "mine">("all");

  // Chapter local management state
  const [chapterSeriesFilter, setChapterSeriesFilter] = useState<string>("all");
  const [editingChapterId, setEditingChapterId] = useState<string | null>(null);
  const [editChapTitle, setEditChapTitle] = useState("");
  const [editChapNumber, setEditChapNumber] = useState<number>(0);
  const [editChapStatus, setEditChapStatus] = useState<"IN_PROGRESS" | "COMPLETED">("IN_PROGRESS");
  const [editChapDue, setEditChapDue] = useState("");

  // Series review extra board voting state
  const [votingSubmissionId, setVotingSubmissionId] = useState<string | null>(null);
  const [voteDecision, setVoteDecision] = useState<"ACCEPT" | "REJECT">("ACCEPT");
  const [voteComment, setVoteComment] = useState("");
  const [isSubmittingVote, setIsSubmittingVote] = useState(false);

  // Series Review Form State
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [reviewNote, setReviewNote] = useState("");
  const [pubSchedule, setPubSchedule] = useState<"WEEKLY" | "MONTHLY">("WEEKLY");

  // Rating Submit Form state
  const [ratingSeriesId, setRatingSeriesId] = useState("");
  const [voteCount, setVoteCount] = useState(5);
  const [sourceFrom, setSourceFrom] = useState("Shonen Jump Reader");
  const [isSubmittingRating, setIsSubmittingRating] = useState(false);

  // Filter tasks based on settings
  const filteredTasks = tasks.filter((task) => {
    if (seriesFilter !== "all" && task.seriesId !== seriesFilter) return false;
    if (chapterFilter !== "all" && task.chapterId !== chapterFilter) return false;
    if (assignedFilter === "mine" && currentUser && task.assignedTo !== currentUser._id) return false;
    return true;
  });

  const pendingColumnTasks = filteredTasks.filter(t => t.status === "PENDING" || t.status?.toLowerCase() === "pending");
  const doneColumnTasks = filteredTasks.filter(t => t.status === "DONE" || t.status?.toLowerCase() === "done");

  const getChapterTitle = (chapId: string) => {
    return chapters.find(c => c._id === chapId)?.title || `Chapter #${chapId}`;
  };

  const getSeriesTitle = (seriesId: string) => {
    return seriesList.find(s => s._id === seriesId)?.title || "Manga không rõ";
  };

  const getMemberName = (userId: string) => {
    return MOCK_USERS.find(u => u._id === userId)?.name || userId;
  };

  const handleReviewAction = async (seriesId: string, action: "APPROVED" | "REJECTED") => {
    try {
      await onSeriesReview(seriesId, action, reviewNote, action === "APPROVED" ? pubSchedule : undefined);
      setReviewingId(null);
      setReviewNote("");
    } catch (err) {
      console.error(err);
    }
  };

  const handleRatingFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const selId = ratingSeriesId || (seriesList[0]?._id);
    if (!selId) return;

    setIsSubmittingRating(true);
    try {
      await onRatingSubmit(selId, voteCount, sourceFrom);
      setVoteCount(5);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingRating(false);
    }
  };

  return (
    <div className="flex flex-col flex-1" id="board-container">
      
      {/* Tab Selectors */}
      <div className="flex bg-white border border-zinc-200 p-1.5 rounded-2xl mb-6 shadow-xs gap-1.5">
        <button
          type="button"
          id="tab-btn-kanban"
          onClick={() => setActiveTab("kanban")}
          className={`flex-1 py-2.5 px-4 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === "kanban"
              ? "bg-zinc-900 border border-zinc-900 text-white shadow-xs"
              : "text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100"
          }`}
        >
          <Activity className="w-4 h-4" />
          QUY TRÌNH TASK & TRỢ LÝ
        </button>

        <button
          type="button"
          id="tab-btn-reviews"
          onClick={() => setActiveTab("reviews")}
          className={`flex-1 py-2.5 px-4 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 relative cursor-pointer ${
            activeTab === "reviews"
              ? "bg-zinc-900 border border-zinc-900 text-white shadow-xs"
              : "text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100"
          }`}
        >
          <FileCheck className="w-4 h-4" />
          DUYỆT SERIES VÀ TRẠNG THÁI
          {seriesList.filter(s => s.status === "PENDING").length > 0 && (
            <span className="absolute -top-1.5 -right-1 text-[10px] h-5 w-5 rounded-full bg-rose-600 text-white font-bold flex items-center justify-center animate-bounce border-2 border-white">
              {seriesList.filter(s => s.status === "PENDING").length}
            </span>
          )}
        </button>

        <button
          type="button"
          id="tab-btn-ratings"
          onClick={() => setActiveTab("ratings")}
          className={`flex-1 py-2.5 px-4 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === "ratings"
              ? "bg-zinc-900 border border-zinc-900 text-white shadow-xs"
              : "text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100"
          }`}
        >
          <Award className="w-4 h-4" />
          BẢNG RATING
        </button>

        <button
          type="button"
          id="tab-btn-chapters"
          onClick={() => setActiveTab("chapters")}
          className={`flex-1 py-2.5 px-4 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer ${
            activeTab === "chapters"
              ? "bg-zinc-900 border border-zinc-900 text-white shadow-xs"
              : "text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100"
          }`}
        >
          <BookOpen className="w-4 h-4" />
          QUẢN LÝ CHAPTERS
        </button>
      </div>

      {/* RENDER ACTIVE TAB */}
      
      {/* 1. KANBAN WORKFLOW TAB */}
      {activeTab === "kanban" && (
        <div className="space-y-6" id="kanban-workspace">
          
          {/* Header Filtering bar */}
          <div className="bg-white border border-zinc-200 rounded-2xl p-4 shadow-xs flex flex-wrap gap-3.5 items-center justify-between" id="filter-bar">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider flex items-center gap-1">
                <Filter className="w-3.5 h-3.5 text-zinc-400" /> Bộ lọc:
              </span>

              {/* Series selector filter */}
              <select
                id="filter-series-select"
                value={seriesFilter}
                onChange={(e) => {
                  setSeriesFilter(e.target.value);
                  setChapterFilter("all");
                }}
                className="bg-zinc-50 border border-zinc-200 rounded-lg py-1 px-2.5 text-xs font-bold focus:ring-1 focus:ring-zinc-950 outline-none"
              >
                <option value="all">📚 Tất cả Series</option>
                {seriesList.map(s => (
                  <option key={s._id} value={s._id}>{s.title}</option>
                ))}
              </select>

              {/* Chapters filter based on selection */}
              <select
                id="filter-chapter-select"
                value={chapterFilter}
                onChange={(e) => setChapterFilter(e.target.value)}
                className="bg-zinc-50 border border-zinc-200 rounded-lg py-1 px-2.5 text-xs font-bold focus:ring-1 focus:ring-zinc-950 outline-none"
              >
                <option value="all">📖 Tất cả Chapter</option>
                {chapters
                  .filter(c => seriesFilter === "all" || c.seriesId === seriesFilter)
                  .map(c => (
                    <option key={c._id} value={c._id}>
                      {c.chapterNumber ? `Chap ${c.chapterNumber}: ` : ""}{c.title}
                    </option>
                  ))}
              </select>

              {/* Mine switch list */}
              {currentUser && (
                <div className="flex border border-zinc-200 rounded-lg p-0.5 bg-zinc-50 shrink-0">
                  <button
                    type="button"
                    onClick={() => setAssignedFilter("all")}
                    className={`px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer ${
                      assignedFilter === "all"
                        ? "bg-white text-zinc-950 shadow-xs border border-zinc-200/50"
                        : "text-zinc-500 hover:text-zinc-800"
                    }`}
                  >
                    Toàn bộ
                  </button>
                  <button
                    type="button"
                    onClick={() => setAssignedFilter("mine")}
                    className={`px-3 py-1 text-xs font-semibold rounded-md transition-all cursor-pointer flex items-center gap-1 ${
                      assignedFilter === "mine"
                        ? "bg-white text-zinc-950 shadow-xs border border-zinc-200/50"
                        : "text-zinc-500 hover:text-zinc-800"
                    }`}
                  >
                    Việc của tôi
                    {tasks.filter(t => t.assignedTo === currentUser._id && t.status === "PENDING").length > 0 && (
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></span>
                    )}
                  </button>
                </div>
              )}
            </div>

            <div className="text-xs font-mono text-zinc-500">
              Tổng số lọc ra: <span className="font-bold text-zinc-800">{filteredTasks.length}</span> công việc
            </div>
          </div>

          {/* Kanban Board Columns layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" id="columns-grid">
            
            {/* COLUMN: PENDING */}
            <div className="flex flex-col" id="col-pending">
              <div className="flex items-center justify-between py-2 border-b-2 border-amber-400 mb-4 px-1 bg-amber-50/50 rounded-t-lg">
                <h3 className="text-xs font-bold text-zinc-800 flex items-center gap-2 tracking-wider">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse inline-block"></span>
                  ĐANG THỰC HIỆN (PENDING)
                </h3>
                <span className="bg-amber-100 text-amber-800 font-bold font-mono text-xs px-2.5 py-0.5 rounded-xl">
                  {pendingColumnTasks.length}
                </span>
              </div>

              <div className="space-y-3 min-h-[350px] bg-zinc-50/40 rounded-2xl p-3 border border-dashed border-zinc-200">
                <AnimatePresence mode="popLayout">
                  {pendingColumnTasks.length === 0 ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex flex-col items-center justify-center py-24 text-center text-zinc-400"
                    >
                      <CheckCircle className="w-10 h-10 text-zinc-300 stroke-[1.25] mb-2" />
                      <p className="text-xs font-bold">Không có việc cần xử lý!</p>
                      <p className="text-[10px] text-zinc-500">Tất cả trợ lý đã hoàn tất hoặc chưa giao thêm task.</p>
                    </motion.div>
                  ) : (
                    pendingColumnTasks.map((task) => {
                      const isTaskMine = currentUser && task.assignedTo === currentUser._id;
                      
                      return (
                        <motion.div
                          layoutId={`task-${task._id}`}
                          key={task._id}
                          initial={{ opacity: 0, scale: 0.95, y: 10 }}
                          animate={{ opacity: 1, scale: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.92, y: -10 }}
                          transition={{ duration: 0.2 }}
                          className={`bg-white border rounded-xl p-4 shadow-xs hover:shadow-md transition-all ${
                            isTaskMine 
                              ? "border-amber-300 ring-2 ring-amber-100 bg-amber-50/5" 
                              : "border-zinc-200"
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-700 border border-zinc-200">
                                  {getSeriesTitle(task.seriesId)}
                                </span>
                                <span className="text-[10px] text-zinc-500 font-medium">
                                  {getChapterTitle(task.chapterId)}
                                </span>
                              </div>
                              <h4 className="text-xs font-bold text-zinc-950 pt-1 leading-normal">
                                {task.title}
                              </h4>
                            </div>

                            {/* Assignee Avatar Badge */}
                            <div className="shrink-0 flex flex-col items-end">
                              <div className="w-8 h-8 rounded-lg bg-indigo-600 text-white flex items-center justify-center text-[10px] font-black shadow-xs">
                                {getMemberName(task.assignedTo).split(" ").pop()?.substring(0, 2).toUpperCase()}
                              </div>
                              <span className="text-[9px] text-zinc-400 font-bold mt-1">APPRENTICE</span>
                            </div>
                          </div>

                          {/* Footer Actions */}
                          <div className="mt-3.5 pt-3 border-t border-zinc-100 flex items-center justify-between text-[10px] text-zinc-400">
                            <span>Sáng lập: Vừa cập nhật</span>
                            
                            {isTaskMine ? (
                              <button
                                id={`submit-task-btn-${task._id}`}
                                onClick={() => onTaskSubmit(task._id)}
                                className="bg-emerald-600 hover:bg-emerald-700 font-bold px-3 py-1.5 text-white rounded-lg flex items-center gap-1.5 cursor-pointer transition-colors shadow-xs"
                              >
                                <Send className="w-3 h-3" />
                                Nộp thành phẩm
                              </button>
                            ) : (
                              <span className="text-[10px] font-bold text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded flex items-center gap-1">
                                <User className="w-3 h-3 text-zinc-400" />
                                Phân: {getMemberName(task.assignedTo)}
                              </span>
                            )}
                          </div>
                        </motion.div>
                      );
                    })
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* COLUMN: DONE */}
            <div className="flex flex-col" id="col-done">
              <div className="flex items-center justify-between py-2 border-b-2 border-emerald-500 mb-4 px-1 bg-emerald-50/50 rounded-t-lg">
                <h3 className="text-xs font-bold text-zinc-800 flex items-center gap-2 tracking-wider">
                  <Check className="w-4 h-4 text-emerald-600" />
                  ĐÃ HOÀN THÀNH (DONE)
                </h3>
                <span className="bg-emerald-100 text-emerald-800 font-bold font-mono text-xs px-2.5 py-0.5 rounded-xl">
                  {doneColumnTasks.length}
                </span>
              </div>

              <div className="space-y-3 min-h-[350px] bg-zinc-50/40 rounded-2xl p-3 border border-dashed border-zinc-200">
                <AnimatePresence mode="popLayout">
                  {doneColumnTasks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-center text-zinc-400" id="empty-done">
                      <Clock className="w-10 h-10 text-zinc-200 stroke-[1.25] mb-2" />
                      <p className="text-xs font-bold">Chưa có bài nào nộp!</p>
                      <p className="text-[10px] text-zinc-500">Các Trợ lí của tôi hãy nộp thành quả bằng nút 'Nộp thành phẩm'.</p>
                    </div>
                  ) : (
                    doneColumnTasks.map((task) => (
                      <motion.div
                        layoutId={`task-${task._id}`}
                        key={task._id}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ duration: 0.2 }}
                        className="bg-white border border-emerald-100 rounded-xl p-4 shadow-xs"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="space-y-1">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[9px] uppercase font-bold px-1.5 py-0.2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded">
                                HOÀN TẤT
                              </span>
                              <span className="text-[10px] font-bold text-zinc-400 line-through">
                                {getSeriesTitle(task.seriesId)}
                              </span>
                            </div>
                            <h4 className="text-xs font-semibold text-zinc-500 line-through leading-normal pt-1">
                              {task.title}
                            </h4>
                          </div>

                          <div className="w-7 h-7 rounded-lg bg-zinc-100 text-zinc-400 flex items-center justify-center text-[9px] font-bold shrink-0">
                            {getMemberName(task.assignedTo).split(" ").pop()?.substring(0, 2).toUpperCase()}
                          </div>
                        </div>

                        <div className="mt-3 pt-2 border-t border-zinc-50 flex items-center gap-1 text-[10px] text-emerald-600 font-bold">
                          <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                          <span>Đã nộp bài bởi @{getMemberName(task.assignedTo)} và phát sóng Sockets.</span>
                        </div>
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
              </div>
            </div>

          </div>

        </div>
      )}

      {/* 2. REVIEWS TAB: SERIES FLOW ACCORDING TO USER ROLES */}
      {activeTab === "reviews" && (
        <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-xs space-y-6" id="reviews-workspace">
          <div>
            <h3 className="text-sm font-bold text-zinc-950 flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-zinc-700" />
              Sổ Đề Xuất Tác Phẩm & Phổ Phát Hành
            </h3>
            <p className="text-xs text-zinc-500 mt-1 leading-normal">
              Bao gồm toàn bộ các Manga do Mangaka đệ trình lên. Biên tập viên (Editor) có thẩm quyền Phê Duyệt hoặc Từ Chối. Ban giám đốc (Board member) tiến hành xuất bản Manga ra công chúng.
            </p>
          </div>

          <div className="space-y-4">
            {seriesList.length === 0 ? (
              <div className="py-12 text-center text-zinc-400 border rounded-xl bg-zinc-50">
                <AlertCircle className="w-10 h-10 text-zinc-300 mx-auto mb-2" />
                <p className="text-xs font-bold">Hiện chưa có series đề xuất nào trên database!</p>
                <p className="text-[10px] text-zinc-500">Hãy chuyển sang tab "Manga Mới" trong Create Form để nộp một bản nháp.</p>
              </div>
            ) : (
              seriesList.map((series) => {
                const isPending = series.status === "PENDING";
                const mId = typeof series.mangakaId === 'object' && series.mangakaId ? series.mangakaId._id : series.mangakaId;
                const mName = typeof series.mangakaId === 'object' && series.mangakaId ? series.mangakaId.name : getMemberName(series.mangakaId as string);

                const seriesVotes = votes.filter(v => v.submissionId === series._id);
                const acceptCount = seriesVotes.filter(v => v.decision === "ACCEPT").length;
                const rejectCount = seriesVotes.filter(v => v.decision === "REJECT").length;

                return (
                  <div key={series._id} className="border border-zinc-200 rounded-xl p-4 space-y-3.5 hover:shadow-xs transition-shadow">
                    
                    {/* Header line */}
                    <div className="flex justify-between items-start flex-wrap gap-2">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-bold text-zinc-900">{series.title}</h4>
                          <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${getStatusBadgeColor(series.status)}`}>
                            {series.status}
                          </span>
                        </div>
                        <p className="text-[11px] text-zinc-500 mt-1.5 flex items-center gap-1">
                          Tác giả đề thảo: <span className="font-bold text-zinc-700">{mName}</span>
                          {series.pubSchedule && (
                            <span className="ml-2 font-mono text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-200 rounded px-1.5 py-0.2">
                              Tần suất: {series.pubSchedule}
                            </span>
                          )}
                        </p>
                      </div>

                      {/* State transition triggers */}
                      <div className="flex gap-1.5">
                        
                        {/* Editor review trigger */}
                        {isPending && currentUser?.role === "EDITOR" && (
                          <button
                            id={`rev-btn-${series._id}`}
                            onClick={() => setReviewingId(series._id)}
                            className="bg-zinc-900 hover:bg-zinc-800 font-bold text-white text-[11px] rounded-lg px-3 py-1.5 flex items-center gap-1 cursor-pointer"
                          >
                            Đánh giá Đề án
                          </button>
                        )}

                        {/* Board Member consensus vote trigger */}
                        {isPending && currentUser?.role === "BOARD_MEMBER" && (
                          <button
                            id={`vote-trg-${series._id}`}
                            onClick={() => {
                              setVotingSubmissionId(series._id);
                              setVoteDecision("ACCEPT");
                              setVoteComment("");
                            }}
                            className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-[11px] rounded-lg px-3 py-1.5 flex items-center gap-1 cursor-pointer"
                          >
                            Bỏ phiếu Hội đồng
                          </button>
                        )}

                        {/* Board Member workflow triggers for transitions */}
                        {series.status === "APPROVED" && (currentUser?.role === "BOARD_MEMBER" || currentUser?.role === "EDITOR") && (
                          <button
                            id={`prod-btn-${series._id}`}
                            onClick={() => {
                              onStatusTransition(series._id, "IN_PRODUCTION");
                            }}
                            className="bg-amber-600 hover:bg-amber-700 font-bold text-white text-[11px] rounded-lg px-3 py-1.5 flex items-center gap-1 cursor-pointer"
                          >
                            Bắt đầu Vẽ tranh (Start Production)
                          </button>
                        )}

                        {series.status === "IN_PRODUCTION" && (currentUser?.role === "BOARD_MEMBER" || currentUser?.role === "EDITOR") && (
                          <button
                            id={`pub-btn-${series._id}`}
                            onClick={() => {
                              onStatusTransition(series._id, "PUBLISHED");
                            }}
                            className="bg-indigo-600 hover:bg-indigo-700 font-bold text-white text-[11px] rounded-lg px-3 py-1.5 flex items-center gap-1 cursor-pointer"
                          >
                            Phát Hành Bộ truyện (Publish Book)
                          </button>
                        )}

                        {/* Cancel helper for Active Manga */}
                        {["APPROVED", "IN_PRODUCTION"].includes(series.status) && (currentUser?.role === "BOARD_MEMBER" || currentUser?.role === "EDITOR") && (
                          <button
                            id={`cancel-btn-${series._id}`}
                            onClick={() => {
                              onStatusTransition(series._id, "CANCELLED");
                            }}
                            className="bg-white hover:bg-zinc-100 font-bold text-zinc-600 border border-zinc-200 text-[11px] rounded-lg px-3 py-1.5 flex items-center gap-1 cursor-pointer"
                          >
                            Hủy dự án (Cancel)
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Synopsis summary */}
                    <div className="text-xs text-zinc-600 bg-zinc-50 p-3 rounded-lg border border-zinc-200/60 leading-relaxed font-normal">
                      <strong>Tóm tắt truyện: </strong> {series.synopsis || "Không có tóm tắt chi tiết."}
                    </div>

                    {/* Editor feedback notes Display */}
                    {series.reviewedBy && (
                      <div className="p-3 bg-zinc-100/50 rounded-lg text-xs border border-zinc-200 flex flex-col gap-1">
                        <span className="font-bold text-zinc-700">✍️ Nhận xét phê duyệt (Editor Note):</span>
                        <p className="text-zinc-655 italic">"{series.reviewNote || "Không có ghi chú thêm."}"</p>
                      </div>
                    )}

                    {/* Consensus Comments / Board Votes Display */}
                    {seriesVotes.length > 0 && (
                      <div className="p-3 bg-zinc-50 border border-zinc-200 rounded-lg text-xs space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-zinc-700 flex items-center gap-1">🗳️ Ý kiến / Biểu quyết của Hội đồng:</span>
                          <span className="text-[10px] font-bold text-zinc-500 font-mono">
                            Đồng thuận: <span className="text-emerald-700 font-black">{acceptCount} ACCEPT</span> • <span className="text-rose-600 font-black">{rejectCount} REJECT</span>
                          </span>
                        </div>
                        <div className="space-y-1.5 max-h-[140px] overflow-y-auto pr-1">
                          {seriesVotes.map((v, i) => {
                            const voterName = typeof v.voterId === "object" && v.voterId ? v.voterId.name : getMemberName(v.voterId as string);
                            return (
                              <div key={v._id || i} className="flex justify-between text-[11px] bg-white p-2 rounded border border-zinc-150 shadow-2xs">
                                <span>
                                  <strong className="text-zinc-800">@{voterName}</strong>: <span className="text-zinc-650 italic">"{v.comment || "Không ghi thêm ý kiến."}"</span>
                                </span>
                                <span className={`font-black uppercase px-1.5 py-0.2 rounded text-[9px] border ${
                                  v.decision === "ACCEPT" 
                                    ? "bg-emerald-50 border-emerald-200 text-emerald-700" 
                                    : "bg-rose-50 border-rose-200 text-rose-700"
                                }`}>
                                  {v.decision}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Inline consensus vote form input */}
                    {votingSubmissionId === series._id && (
                      <div className="bg-indigo-50/20 rounded-xl p-4 border border-indigo-200 mt-2 space-y-3 animate-in fade-in-50">
                        <h5 className="text-xs font-bold text-indigo-950 flex items-center gap-1">
                          <Plus className="w-4 h-4 text-indigo-700" /> Bỏ phiếu Thảo luận / Trưng cầu ý kiến (BOARD MEMBER)
                        </h5>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 font-sans">
                          <div>
                            <label className="block text-[11px] font-semibold text-zinc-650 mb-1">Thiết lập Biểu quyết</label>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                onClick={() => setVoteDecision("ACCEPT")}
                                className={`flex-1 py-1.5 px-3 text-xs font-bold rounded-lg border cursor-pointer transition-all ${
                                  voteDecision === "ACCEPT"
                                    ? "bg-emerald-600 border-emerald-600 text-white shadow-xs"
                                    : "bg-white border-zinc-200 text-zinc-600 hover:bg-zinc-50"
                                }`}
                              >
                                ✔ ACCEPT (ĐỒNG Ý)
                              </button>
                              <button
                                type="button"
                                onClick={() => setVoteDecision("REJECT")}
                                className={`flex-1 py-1.5 px-3 text-xs font-bold rounded-lg border cursor-pointer transition-all ${
                                  voteDecision === "REJECT"
                                    ? "bg-rose-600 border-rose-600 text-white shadow-xs"
                                    : "bg-white border-zinc-200 text-zinc-650 hover:bg-zinc-50"
                                }`}
                              >
                                ❌ REJECT (TỪ CHỐI)
                              </button>
                            </div>
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-zinc-655 mb-1">Lời bàn / Lý do ý kiến (Comment)</label>
                            <input
                              type="text"
                              required
                              placeholder="Ví dụ: Đáng để đầu tư, hình vẽ đẹp..."
                              value={voteComment}
                              onChange={(e) => setVoteComment(e.target.value)}
                              className="w-full bg-white border border-zinc-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-zinc-950 outline-none"
                            />
                          </div>
                        </div>

                        <div className="flex gap-2 justify-end pt-1">
                          <button
                            type="button"
                            onClick={() => setVotingSubmissionId(null)}
                            className="bg-white border border-zinc-200 rounded-lg px-2.5 py-1 text-xs font-bold text-zinc-600 cursor-pointer hover:bg-zinc-100"
                          >
                            Hủy
                          </button>
                          <button
                            type="button"
                            disabled={isSubmittingVote}
                            onClick={async () => {
                              setIsSubmittingVote(true);
                              try {
                                await onVoteSubmit(series._id, voteDecision, voteComment);
                                setVotingSubmissionId(null);
                                setVoteComment("");
                              } catch(e) {}
                              setIsSubmittingVote(false);
                            }}
                            className="bg-indigo-650 hover:bg-indigo-700 font-bold text-white rounded-lg px-3.5 py-1.5 text-xs cursor-pointer disabled:bg-indigo-300"
                          >
                            {isSubmittingVote ? "Đang gửi..." : "Gửi phiếu bầu"}
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Form for writing review */}
                    {reviewingId === series._id && (
                      <div className="bg-zinc-50 rounded-xl p-4 border border-zinc-300 mt-2 space-y-3.5 animate-in fade-in-50">
                        <h5 className="text-xs font-bold text-zinc-800">Cửa sổ phê duyệt của Biên Tập Viên Trưởng</h5>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[11px] font-semibold text-zinc-600 mb-1">Ghi chú phản hồi / Lý do duyệt</label>
                            <input
                              type="text"
                              required
                              placeholder="Ví dụ: Cốt truyện hay, hình ảnh phác thảo mượt..."
                              value={reviewNote}
                              onChange={(e) => setReviewNote(e.target.value)}
                              className="w-full bg-white border border-zinc-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-zinc-950 outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[11px] font-semibold text-zinc-600 mb-1 font-sans">Chọn Tần suất phát hành đề xuất</label>
                            <select
                              value={pubSchedule}
                              onChange={(e) => setPubSchedule(e.target.value as "WEEKLY" | "MONTHLY")}
                              className="w-full bg-white border border-zinc-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-zinc-950 outline-none font-semibold"
                            >
                              <option value="WEEKLY">Phát hành HÀNG TUẦN (WEEKLY)</option>
                              <option value="MONTHLY">Phát hành HÀNG THÁNG (MONTHLY)</option>
                            </select>
                          </div>
                        </div>

                        <div className="flex gap-2 justify-end pt-1">
                          <button
                            type="button"
                            onClick={() => setReviewingId(null)}
                            className="bg-white border rounded-lg px-2.5 py-1 text-xs font-bold text-zinc-600 cursor-pointer hover:bg-zinc-100"
                          >
                            Đóng quay lại
                          </button>
                          <button
                            type="button"
                            onClick={() => handleReviewAction(series._id, "REJECTED")}
                            className="bg-rose-600 hover:bg-rose-700 font-bold text-white rounded-lg px-2.5 py-1 text-xs cursor-pointer"
                          >
                            ❌ TỪ CHỐI (REJECT)
                          </button>
                          <button
                            type="button"
                            onClick={() => handleReviewAction(series._id, "APPROVED")}
                            className="bg-emerald-600 hover:bg-emerald-700 font-bold text-white rounded-lg px-3 py-1.5 text-xs cursor-pointer"
                          >
                            ✔ DUYỆT ĐỒNG THUẬN (APPROVE)
                          </button>
                        </div>
                      </div>
                    )}

                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* 3. RATINGS & LEADERBOARD TAB */}
      {activeTab === "ratings" && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6" id="ratings-workspace">
          
          {/* Form to submit Rating */}
          <div className="md:col-span-5 bg-white border border-zinc-200 rounded-2xl p-5 shadow-xs space-y-4">
            <div>
              <h3 className="text-sm font-bold text-zinc-950 flex items-center gap-1.5">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                Độc Giả Thống Nhất Biểu Quyết
              </h3>
              <p className="text-[11px] text-zinc-500 mt-1 leading-normal">
                Mỗi lượt đánh giá của bạn lập tức kích hoạt tính toán lại thứ tự của các Manga trong tháng này từ server (Realtime Rating Events).
              </p>
            </div>

            <form onSubmit={handleRatingFormSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">Manga bầu cử</label>
                <select
                  value={ratingSeriesId}
                  onChange={(e) => setRatingSeriesId(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-lg p-2 px-2.5 text-xs font-bold focus:ring-1 focus:ring-zinc-950 outline-none"
                >
                  <option value="">Chọn Series để bỏ phiếu...</option>
                  {seriesList.map(s => (
                    <option key={s._id} value={s._id}>{s.title} ({s.status})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">Số lượng phiếu bầu (Vote Count)</label>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => setVoteCount(v)}
                      className="p-1.5 cursor-pointer outline-none hover:scale-110 transition-transform"
                    >
                      <Star className={`w-6 h-6 ${v <= voteCount ? "text-amber-500 fill-amber-500" : "text-zinc-300"}`} />
                    </button>
                  ))}
                  <span className="text-xs font-black text-zinc-700 pl-2">+{voteCount} Phiếu</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">Nguồn độc giả (Source Platform)</label>
                <select
                  value={sourceFrom}
                  onChange={(e) => setSourceFrom(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-lg p-2 px-2.5 text-xs font-semibold focus:ring-1 focus:ring-zinc-950 outline-none"
                >
                  <option value="Weekly Shonen Jump Magazine">Phân phối tạp chí giấy (Shonen Jump)</option>
                  <option value="MangaPlus Readers Online">MangaPlus Official App (Online)</option>
                  <option value="Facebook Shonen Community VN">Diễn đàn cộng đồng Việt Nam (Facebook)</option>
                  <option value="Tiktok Reviewer Trends">Tik Tok Manga Reviewers</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={isSubmittingRating || !ratingSeriesId}
                className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-2 px-4 rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 disabled:bg-zinc-200 cursor-pointer"
              >
                <ThumbsUp className="w-3.5 h-3.5" />
                {isSubmittingRating ? "Đang lưu phiếu..." : "Gửi Phiếu Bầu Lập Tức"}
              </button>
            </form>
          </div>

          {/* Leaderboard displays */}
          <div className="md:col-span-7 bg-white border border-zinc-200 rounded-2xl p-5 shadow-xs space-y-4">
            <div>
              <h3 className="text-sm font-bold text-zinc-950 flex items-center gap-1.5">
                <Award className="w-4 h-4 text-indigo-600" />
                Bảng vàng Xếp hạng Manga (Live Leaderboard)
              </h3>
              <p className="text-[11px] text-zinc-500 mt-1 leading-normal">
                Xếp hạng tháng dựa trên lượt tổng phiếu bầu tích tụ của Reader. Số liệu tự động cập nhật và sếp dồn theo thứ tự.
              </p>
            </div>

            <div className="space-y-2.5">
              {ranksList.length === 0 ? (
                <div className="py-12 text-center text-zinc-400 border rounded-xl bg-zinc-50">
                  <p className="text-xs font-bold">Chưa tính toán bảng xếp hạng tháng mới!</p>
                  <p className="text-[10px] text-zinc-500">Bỏ phiếu rating bên cạnh để trigger bảng xếp hạng cập nhật realtime.</p>
                </div>
              ) : (
                ranksList
                  .sort((a, b) => a.rank - b.rank)
                  .map((rk, idx) => {
                    const ser = seriesList.find(s => s._id === rk.seriesId);
                    if (!ser) return null;

                    const change = rk.prevRank ? rk.prevRank - rk.rank : 0;

                    return (
                      <div key={rk._id || idx} className="flex items-center justify-between p-3.5 rounded-xl border border-zinc-150 bg-zinc-50/60 hover:bg-zinc-50 transition-all">
                        <div className="flex items-center gap-3">
                          
                          {/* Rank badge number */}
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black border text-xs shadow-xs ${
                            rk.rank === 1 ? "bg-amber-100 border-amber-300 text-amber-800" :
                            rk.rank === 2 ? "bg-slate-100 border-slate-300 text-slate-800" :
                            rk.rank === 3 ? "bg-orange-100 border-orange-200 text-orange-850" :
                            "bg-white border-zinc-200 text-zinc-600"
                          }`}>
                            #{rk.rank}
                          </div>

                          <div>
                            <span className="text-xs font-bold text-zinc-900 block leading-tight">{ser.title}</span>
                            <span className="text-[10px] text-zinc-500 font-mono">ID: {ser._id} • status: {ser.status}</span>
                          </div>
                        </div>

                        {/* Rank changes arrow indicators */}
                        <div className="flex items-center gap-2">
                          {change > 0 ? (
                            <span className="text-xs font-bold text-emerald-600 flex items-center">
                              ▲ +{change} (Tăng)
                            </span>
                          ) : change < 0 ? (
                            <span className="text-xs font-semibold text-rose-500 flex items-center">
                              ▼ {change} (Giảm)
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-zinc-400">
                              ▬ Giữ nguyên
                            </span>
                          )}

                          <ChevronRight className="w-4 h-4 text-zinc-300" />
                        </div>
                      </div>
                    );
                  })
              )}
            </div>
          </div>

        </div>
      )}

      {/* 4. CHAPTERS MANAGEMENT TAB */}
      {activeTab === "chapters" && (
        <div className="bg-white border border-zinc-200 rounded-2xl p-5 shadow-xs space-y-5" id="chapters-workspace">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-zinc-100 pb-4 animate-in fade-in duration-150">
            <div>
              <h3 className="text-sm font-bold text-zinc-950 flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-zinc-700" />
                Sổ Biên Chép các Chapter Manga (MongoDB)
              </h3>
              <p className="text-xs text-zinc-500 mt-1 leading-normal">
                Quản lý cập nhật, hiệu chỉnh, xoá bỏ và phát hành [Xuất Bản Live] Chapter ra kênh độc công cộng.
              </p>
            </div>

            {/* Selector filter by Series */}
            <div className="flex items-center gap-2 bg-zinc-50 border border-zinc-200 p-1.5 rounded-xl shrink-0">
              <span className="text-[11px] font-bold text-zinc-500 pl-1.5 flex items-center gap-1"><Filter className="w-3.5 h-3.5" /> Lọc Manga:</span>
              <select
                value={chapterSeriesFilter}
                onChange={(e) => setChapterSeriesFilter(e.target.value)}
                className="text-xs font-bold bg-transparent border-0 focus:ring-0 text-zinc-800 outline-none cursor-pointer py-0.5 pr-8"
              >
                <option value="all">📖 Tất cả truyện</option>
                {seriesList.map(s => (
                  <option key={s._id} value={s._id}>{s.title}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-zinc-650" id="chapters-table">
              <thead>
                <tr className="border-b border-zinc-200 text-zinc-400 font-bold text-[11px] uppercase tracking-wider bg-zinc-50/50">
                  <th className="py-3 px-4 rounded-l-lg">Chapter #</th>
                  <th className="py-3 px-3">Tiêu đề (Title)</th>
                  <th className="py-3 px-3">Tác phẩm (Series)</th>
                  <th className="py-3 px-3">Trạng thái (Status)</th>
                  <th className="py-3 px-3">Hạn nộp (Due Date)</th>
                  <th className="py-3 px-4 text-right rounded-r-lg">Hành động thực thi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {chapters
                  .filter(c => chapterSeriesFilter === "all" || c.seriesId === chapterSeriesFilter)
                  .map((chap) => {
                    const series = seriesList.find(s => s._id === chap.seriesId);
                    const isCompleted = chap.status === "COMPLETED";

                    return (
                      <tr key={chap._id} className="hover:bg-zinc-50/75 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-zinc-900">
                          {chap.chapterNumber ? `Chap ${chap.chapterNumber}` : "Draft / Nháp"}
                        </td>
                        <td className="py-3.5 px-3 font-semibold text-zinc-850">
                          {chap.title}
                        </td>
                        <td className="py-3.5 px-3">
                          <span className="font-bold text-zinc-700 bg-zinc-100 border border-zinc-200 rounded-md px-2 py-0.5 text-[10px]">
                            {series ? series.title : "Manga ẩn"}
                          </span>
                        </td>
                        <td className="py-3.5 px-3">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                            isCompleted 
                              ? "bg-emerald-50 border-emerald-200 text-emerald-700" 
                              : "bg-amber-50 border-amber-200 text-amber-700"
                          }`}>
                            {chap.status || "IN_PROGRESS"}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-zinc-500 font-mono">
                          {chap.dueAt ? new Date(chap.dueAt).toLocaleDateString("vi-VN") : "▬"}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex gap-1.5 justify-end">
                            {/* Update chapter */}
                            <button
                              type="button"
                              onClick={() => {
                                setEditingChapterId(chap._id);
                                setEditChapTitle(chap.title);
                                setEditChapNumber(chap.chapterNumber || 0);
                                setEditChapStatus(chap.status || "IN_PROGRESS");
                                setEditChapDue(chap.dueAt ? chap.dueAt.substring(0, 10) : "");
                              }}
                              className="p-1 px-2.5 rounded border border-zinc-200 text-zinc-650 hover:bg-zinc-100 hover:text-zinc-900 flex items-center gap-1 cursor-pointer transition-colors"
                              title="Cập nhật chi tiết Chapter"
                            >
                              <Edit2 className="w-3 h-3" />
                              Sửa
                            </button>

                            {/* Delete chapter */}
                            <button
                              type="button"
                              onClick={async () => {
                                if (confirm("Bạn có chắc chắn muốn xoá Chapter này?")) {
                                  await onChapterDelete(chap._id);
                                }
                              }}
                              className="p-1 px-2.5 rounded border border-rose-200 text-rose-600 hover:bg-rose-50 hover:text-rose-700 flex items-center gap-1 cursor-pointer transition-colors"
                              title="Xoá Chapter"
                            >
                              <Trash2 className="w-3 h-3" />
                              Xoá
                            </button>

                            {/* Publish live Chapter event */}
                            {(currentUser?.role === "EDITOR" || currentUser?.role === "BOARD_MEMBER") && (
                              <button
                                type="button"
                                onClick={async () => {
                                  await onChapterPublish(chap._id);
                                }}
                                className="p-1 px-2.5 bg-indigo-600 hover:bg-indigo-700 font-bold text-white rounded flex items-center gap-1.5 cursor-pointer transition-colors"
                                title="Xuất Bản Chapter sang APP đọc bản tin"
                              >
                                <Globe className="w-3 h-3" />
                                Xuất Bản Live
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                {chapters.filter(c => chapterSeriesFilter === "all" || c.seriesId === chapterSeriesFilter).length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-zinc-400 font-bold">
                      Không tìm thấy Chapters nào phù hợp bộ lọc!
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Chapter Editing modal popup */}
      {editingChapterId && (
        <div className="fixed inset-0 bg-black/55 z-50 flex items-center justify-center p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl p-5 max-w-sm w-full border border-zinc-200 shadow-xl space-y-4 animate-in zoom-in-95 duration-150 font-sans">
            <h3 className="text-sm font-bold text-zinc-950 flex items-center gap-1.5">
              <Edit2 className="w-4 h-4 text-zinc-700" />
              HIỆU CHỈNH CHAPTER
            </h3>

            <div className="space-y-3.5">
              <div>
                <label className="block text-[10px] font-bold text-zinc-600 mb-1">Mã Số Chapter (Chapter Number)</label>
                <input
                  type="number"
                  required
                  value={editChapNumber}
                  onChange={(e) => setEditChapNumber(parseInt(e.target.value) || 0)}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-zinc-950 outline-none font-bold"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-600 mb-1">Tiêu Đề Chapter</label>
                <input
                  type="text"
                  required
                  placeholder="Ví dụ: Khối di sản thế kỷ..."
                  value={editChapTitle}
                  onChange={(e) => setEditChapTitle(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-zinc-950 outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-600 mb-1">Hạn Nộp Bản Nháp (Due Date)</label>
                <input
                  type="date"
                  value={editChapDue}
                  onChange={(e) => setEditChapDue(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-lg p-2 text-xs focus:ring-1 focus:ring-zinc-950 outline-none font-medium"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-zinc-600 mb-1">Tiến Độ / Trạng Thái</label>
                <select
                  value={editChapStatus}
                  onChange={(e) => setEditChapStatus(e.target.value as any)}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-lg p-2 text-xs font-bold focus:ring-1 focus:ring-zinc-950 outline-none"
                >
                  <option value="IN_PROGRESS">Đang triển khai (IN_PROGRESS)</option>
                  <option value="COMPLETED">Đã hoàn thành vẽ thô (COMPLETED)</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2 justify-end pt-2 border-t border-zinc-150">
              <button
                type="button"
                onClick={() => setEditingChapterId(null)}
                className="bg-white border rounded-lg px-3 py-1.5 text-xs font-bold text-zinc-600 cursor-pointer hover:bg-zinc-100"
              >
                Huỷ quay lại
              </button>
              <button
                type="button"
                onClick={async () => {
                  try {
                    await onChapterUpdate(editingChapterId, {
                      title: editChapTitle,
                      chapterNumber: editChapNumber,
                      status: editChapStatus,
                      dueAt: editChapDue ? new Date(editChapDue).toISOString() : undefined
                    });
                    setEditingChapterId(null);
                  } catch (e) {}
                }}
                className="bg-zinc-950 hover:bg-zinc-850 font-bold text-white rounded-lg px-4 py-1.5 text-xs cursor-pointer"
              >
                Lưu Thay Đổi
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
