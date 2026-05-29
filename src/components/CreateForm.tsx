/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from "react";
import { 
  FolderPlus, 
  UserPlus, 
  Plus, 
  HelpCircle,
  Tag,
  BookOpen,
  Send,
  Sparkles,
  FileText,
  Calendar
} from "lucide-react";
import { Chapter, Series, User } from "../types";
import { MOCK_USERS } from "../data";

interface CreateFormProps {
  currentUser: User | null;
  seriesList: Series[];
  chapters: Chapter[];
  onSeriesCreate: (title: string, synopsis: string) => Promise<void>;
  onChapterCreate: (seriesId: string, chapterNumber: number, title: string, dueAt?: string) => Promise<void>;
  onTaskCreate: (seriesId: string, chapterId: string, assignedTo: string, title: string) => Promise<void>;
}

export const CreateForm: React.FC<CreateFormProps> = ({
  currentUser,
  seriesList,
  chapters,
  onSeriesCreate,
  onChapterCreate,
  onTaskCreate,
}) => {
  const [activeTab, setActiveTab] = useState<"proposal" | "chapter" | "task">("task");

  // If role is Mangaka, default to proposal tab
  useEffect(() => {
    if (currentUser?.role === "MANGAKA") {
      setActiveTab("proposal");
    } else {
      setActiveTab("task");
    }
  }, [currentUser]);

  // Series Proposals Form State
  const [propTitle, setPropTitle] = useState("");
  const [propSynopsis, setPropSynopsis] = useState("");
  const [isSubmittingProp, setIsSubmittingProp] = useState(false);

  // Chapter Forms Fields State
  const [chapSeriesId, setChapSeriesId] = useState("");
  const [chapNumber, setChapNumber] = useState(1);
  const [chapTitle, setChapTitle] = useState("");
  const [chapDueAt, setChapDueAt] = useState("");
  const [isSubmittingChap, setIsSubmittingChap] = useState(false);

  // Task Forms Fields State
  const [taskSeriesId, setTaskSeriesId] = useState("");
  const [taskChapterId, setTaskChapterId] = useState("");
  const [taskAssignedTo, setTaskAssignedTo] = useState("");
  const [taskTitle, setTaskTitle] = useState("");
  const [isSubmittingTask, setIsSubmittingTask] = useState(false);

  // Select initial series values when seriesList loaded
  useEffect(() => {
    if (seriesList.length > 0) {
      if (!chapSeriesId) setChapSeriesId(seriesList[0]._id);
      if (!taskSeriesId) setTaskSeriesId(seriesList[0]._id);
    }
  }, [seriesList]);

  // Default task assigned to a valid assistant
  useEffect(() => {
    const assistants = MOCK_USERS.filter(u => u.role === "ASSISTANT");
    if (assistants.length > 0 && !taskAssignedTo) {
      setTaskAssignedTo(assistants[0]._id);
    }
  }, []);

  // Filter series depending on status for chapters (usually we only add chapters to APPROVED or IN_PRODUCTION series)
  const activeSeriesForChapters = seriesList.filter(s => ["APPROVED", "IN_PRODUCTION", "PUBLISHED"].includes(s.status));

  // Auto set first chapter when series changes in task tab
  const filteredChapters = chapters.filter(c => c.seriesId === taskSeriesId);
  useEffect(() => {
    if (filteredChapters.length > 0) {
      setTaskChapterId(filteredChapters[0]._id);
    } else {
      setTaskChapterId("");
    }
  }, [taskSeriesId, chapters]);

  const handleCreatePropSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!propTitle.trim()) return;

    setIsSubmittingProp(true);
    try {
      await onSeriesCreate(propTitle.trim(), propSynopsis.trim());
      setPropTitle("");
      setPropSynopsis("");
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingProp(false);
    }
  };

  const handleCreateChapterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chapTitle.trim() || !chapSeriesId) return;

    setIsSubmittingChap(true);
    try {
      await onChapterCreate(chapSeriesId, Number(chapNumber), chapTitle.trim(), chapDueAt || undefined);
      setChapTitle("");
      setChapNumber(prev => prev + 1);
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingChap(false);
    }
  };

  const handleCreateTaskSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim() || !taskChapterId || !taskAssignedTo) return;

    setIsSubmittingTask(true);
    try {
      await onTaskCreate(taskSeriesId, taskChapterId, taskAssignedTo, taskTitle.trim());
      setTaskTitle("");
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmittingTask(false);
    }
  };

  const assistantsList = MOCK_USERS.filter(u => u.role === "ASSISTANT");

  return (
    <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-xs h-full flex flex-col" id="creator-panel">
      
      {/* Tab select trigger headers */}
      <div className="flex border-b border-zinc-200 bg-zinc-50/70 p-1 gap-1">
        
        {/* Only Mangaka typically creates proposals, but let all test in Sandbox/Simulator */}
        <button
          type="button"
          id="tab-proposal-trigger"
          onClick={() => setActiveTab("proposal")}
          className={`flex-1 py-2 text-[11px] font-bold flex items-center justify-center gap-1.5 rounded-xl transition-all cursor-pointer ${
            activeTab === "proposal"
              ? "bg-zinc-900 border border-zinc-900 text-white shadow-xs"
              : "text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100"
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          Manga Mới
        </button>

        <button
          type="button"
          id="tab-chapter-trigger"
          onClick={() => setActiveTab("chapter")}
          disabled={activeSeriesForChapters.length === 0}
          className={`flex-1 py-2 text-[11px] font-bold flex items-center justify-center gap-1.5 rounded-xl transition-all cursor-pointer ${
            activeTab === "chapter"
              ? "bg-zinc-900 border border-zinc-900 text-white shadow-xs"
              : "text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100 disabled:opacity-40"
          }`}
          title={activeSeriesForChapters.length === 0 ? "Phải có ít nhất 1 series được phê duyệt trước khi tạo Chapter!" : ""}
        >
          <FolderPlus className="w-3.5 h-3.5" />
          Khai Chapter
        </button>

        <button
          type="button"
          id="tab-task-trigger"
          onClick={() => setActiveTab("task")}
          disabled={chapters.length === 0}
          className={`flex-1 py-2 text-[11px] font-bold flex items-center justify-center gap-1.5 rounded-xl transition-all cursor-pointer ${
            activeTab === "task"
              ? "bg-zinc-900 border border-zinc-900 text-white shadow-xs"
              : "text-zinc-500 hover:text-zinc-800 hover:bg-zinc-100 disabled:opacity-40"
          }`}
          title={chapters.length === 0 ? "Phải có ít nhất 1 Chapter trước khi giao việc!" : ""}
        >
          <UserPlus className="w-3.5 h-3.5" />
          Giao Việc
        </button>
      </div>

      <div className="p-5 flex-1 flex flex-col justify-between">
        
        {/* TAB 1: NEW SERIES PROPOSAL (MANGAKA only) */}
        {activeTab === "proposal" && (
          <form onSubmit={handleCreatePropSubmit} className="space-y-4 flex-1 flex flex-col justify-between" id="form-proposal">
            <div className="space-y-4">
              <div className="flex items-center gap-2 p-2.5 bg-orange-50 border border-orange-100 rounded-xl text-orange-900 text-[11px] leading-normal font-medium">
                <Sparkles className="w-4 h-4 text-orange-600 shrink-0" />
                <span>
                  Bạn đang hoạt động dưới quyền <strong>MANGAKA</strong>. Các đề xuất truyện mới gửi lên sẽ có trạng thái mặc định là <code className="bg-orange-100 px-1 py-0.5 rounded text-orange-850 font-bold">PENDING</code> chờ Editor phê duyệt.
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Tiêu đề tác phẩm Manga mới
                </label>
                <input
                  id="prop-title-input"
                  type="text"
                  required
                  placeholder="Ví dụ: Chainsaw Man, Boruto..."
                  value={propTitle}
                  onChange={(e) => setPropTitle(e.target.value)}
                  className="w-full bg-white border border-zinc-200 rounded-lg p-2.5 text-xs font-semibold focus:ring-1 focus:ring-zinc-950 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">
                  Tóm tắt nội dung tác phẩm (Synopsis)
                </label>
                <textarea
                  id="prop-synopsis-input"
                  rows={4}
                  required
                  placeholder="Viết tóm tắt cốt truyện cốt lõi, nhân vật chính..."
                  value={propSynopsis}
                  onChange={(e) => setPropSynopsis(e.target.value)}
                  className="w-full bg-white border border-zinc-200 rounded-lg p-2.5 text-xs font-medium focus:ring-1 focus:ring-zinc-950 outline-none resize-none"
                />
              </div>
            </div>

            <button
              id="submit-proposal-btn"
              type="submit"
              disabled={isSubmittingProp || !propTitle.trim()}
              className="mt-4 w-full bg-orange-600 text-white rounded-xl py-2.5 px-4 text-xs font-bold hover:bg-orange-700 disabled:bg-zinc-300 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              {isSubmittingProp ? "Đang gửi đề xuất..." : "Gửi Đề Xuất Phê Duyệt"}
            </button>
          </form>
        )}

        {/* TAB 2: REGISTER NEW CHAPTER */}
        {activeTab === "chapter" && (
          <form onSubmit={handleCreateChapterSubmit} className="space-y-4 flex-1 flex flex-col justify-between" id="form-chapter">
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1">Manga Series (Được duyệt)</label>
                <select
                  id="chapter-series-select"
                  value={chapSeriesId}
                  onChange={(e) => setChapSeriesId(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-lg p-2.5 text-xs font-bold focus:ring-1 focus:ring-zinc-950 outline-none"
                >
                  {activeSeriesForChapters.map(s => (
                    <option key={s._id} value={s._id}>{s.title} ({s.status})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-1">
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">Số chap</label>
                  <input
                    id="chapter-num-input"
                    type="number"
                    min={1}
                    value={chapNumber}
                    onChange={(e) => setChapNumber(Number(e.target.value))}
                    className="w-full bg-white border border-zinc-200 rounded-lg p-2.5 text-xs font-bold focus:ring-1 focus:ring-zinc-950 outline-none"
                  />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-zinc-700 mb-1">Tiêu đề Chapter</label>
                  <input
                    id="chapter-title-input"
                    type="text"
                    required
                    placeholder="Ví dụ: Đại chiến kết thúc..."
                    value={chapTitle}
                    onChange={(e) => setChapTitle(e.target.value)}
                    className="w-full bg-white border border-zinc-200 rounded-lg p-2.5 text-xs font-semibold focus:ring-1 focus:ring-zinc-950 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-700 mb-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-zinc-400" /> Ngày hết hạn nộp sản phẩm (Deadline)
                </label>
                <input
                  id="chapter-deadline-input"
                  type="date"
                  value={chapDueAt}
                  onChange={(e) => setChapDueAt(e.target.value)}
                  className="w-full bg-white border border-zinc-200 rounded-lg p-2.5 text-xs font-medium focus:ring-1 focus:ring-zinc-950 outline-none"
                />
              </div>
            </div>

            <button
              id="submit-chapter-btn"
              type="submit"
              disabled={isSubmittingChap || !chapTitle.trim()}
              className="mt-4 w-full bg-zinc-900 text-white rounded-xl py-2.5 px-4 text-xs font-bold hover:bg-zinc-850 disabled:bg-zinc-300 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              {isSubmittingChap ? "Đang lưu..." : "Thêm Chapter và Phát Sóng"}
            </button>
          </form>
        )}

        {/* TAB 3: ASSIGN NEW TASK */}
        {activeTab === "task" && (
          <form onSubmit={handleCreateTaskSubmit} className="space-y-4-3.5 flex-1 flex flex-col justify-between" id="form-task">
            <div className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-zinc-705 mb-1 flex items-center gap-1">
                  <Tag className="w-3.5 h-3.5 text-zinc-400" /> Chọn Manga Series
                </label>
                <select
                  id="task-series-select"
                  value={taskSeriesId}
                  onChange={(e) => setTaskSeriesId(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-lg p-2.5 text-xs font-bold focus:ring-1 focus:ring-zinc-950 outline-none"
                >
                  {seriesList.map(s => (
                    <option key={s._id} value={s._id}>{s.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-705 mb-1 flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5 text-zinc-400" /> Chọn Chapter mục tiêu
                </label>
                {filteredChapters.length > 0 ? (
                  <select
                    id="task-chapter-select"
                    value={taskChapterId}
                    onChange={(e) => setTaskChapterId(e.target.value)}
                    className="w-full bg-zinc-50 border border-zinc-200 rounded-lg p-2.5 text-xs font-semibold focus:ring-1 focus:ring-zinc-950 outline-none"
                  >
                    {filteredChapters.map(c => (
                      <option key={c._id} value={c._id}>
                        {c.chapterNumber ? `Chap ${c.chapterNumber}: ` : ""}{c.title}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="text-[11px] text-amber-800 bg-amber-50 border border-amber-100 rounded-xl p-3 flex flex-col gap-1.5">
                    <span>Bộ truyện này chưa có Chapter nào được tạo!</span>
                    <button
                      type="button"
                      onClick={() => {
                        setChapSeriesId(taskSeriesId);
                        setActiveTab("chapter");
                      }}
                      className="text-xs font-bold text-amber-900 underline hover:text-amber-955 text-left cursor-pointer"
                    >
                      Khai báo Chapter ngay →
                    </button>
                  </div>
                )}
              </div>

              {/* Assign to assistants only */}
              <div>
                <label className="block text-xs font-semibold text-zinc-705 mb-1 flex items-center gap-1">
                  <UserPlus className="w-3.5 h-3.5 text-zinc-400" /> Giao cho trợ lý (Assistant)
                </label>
                <select
                  id="task-assignee-select"
                  value={taskAssignedTo}
                  onChange={(e) => setTaskAssignedTo(e.target.value)}
                  className="w-full bg-zinc-50 border border-zinc-200 rounded-lg p-2.5 text-xs font-semibold focus:ring-1 focus:ring-zinc-950 outline-none"
                >
                  {assistantsList.map(a => (
                    <option key={a._id} value={a._id}>{a.name} (Assistant)</option>
                  ))}
                  {/* Fallback to all mock users if no assistant */}
                  {assistantsList.length === 0 && MOCK_USERS.map(u => (
                    <option key={u._id} value={u._id}>{u.name} ({u.role})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-705 mb-1 flex items-center gap-1">
                  <HelpCircle className="w-3.5 h-3.5 text-zinc-400" /> Mô tả đầu việc / Yêu cầu
                </label>
                <input
                  id="task-title-input"
                  type="text"
                  required
                  placeholder="Ví dụ: Redraw bong bóng trang 5, dịch hội thoại..."
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  className="w-full bg-white border border-zinc-200 rounded-lg p-2.5 text-xs font-semibold focus:ring-1 focus:ring-zinc-950 outline-none"
                />
              </div>
            </div>

            <button
              id="submit-task-btn"
              type="submit"
              disabled={isSubmittingTask || !taskChapterId || !taskAssignedTo}
              className="mt-4 w-full bg-zinc-900 text-white rounded-xl py-2.5 px-4 text-xs font-bold hover:bg-zinc-850 disabled:bg-zinc-300 transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              {isSubmittingTask ? "Đang giao việc..." : "Giao việc & Báo Sockets"}
            </button>
          </form>
        )}

      </div>
    </div>
  );
};
