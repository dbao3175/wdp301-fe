/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { motion } from "motion/react";
import { 
  BookOpen, 
  CheckCircle2, 
  Clock, 
  Layers, 
  Users 
} from "lucide-react";
import { Chapter, Task, Series } from "../types";

interface StatsGridProps {
  seriesList: Series[];
  chapters: Chapter[];
  tasks: Task[];
  usersCount: number;
}

export const StatsGrid: React.FC<StatsGridProps> = ({ seriesList, chapters, tasks, usersCount }) => {
  const totalSeries = seriesList.length;
  const inProductionSeriesCount = seriesList.filter(s => s.status === "IN_PRODUCTION").length;
  const totalChapters = chapters.length;
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === "DONE").length;
  const pendingTasks = tasks.filter(t => t.status === "PENDING").length;
  const progressPercent = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const cardVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.35 } }
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6" id="stats-grid">
      
      {/* Series status */}
      <motion.div
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        className="bg-white border border-zinc-200 rounded-xl p-4 flex items-center justify-between shadow-xs"
        id="stat-series"
      >
        <div>
          <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Hồ sơ Manga</p>
          <p className="text-2xl font-black font-mono text-zinc-900 mt-1">{totalSeries}</p>
          <p className="text-[11px] text-zinc-500 mt-1.5 flex items-center gap-1">
            <span className="text-amber-600 font-bold">{inProductionSeriesCount} đang sản xuất</span> (In Production)
          </p>
        </div>
        <div className="w-12 h-12 rounded-xl bg-orange-50 border border-orange-100 flex items-center justify-center text-orange-600">
          <Layers className="w-5 h-5" />
        </div>
      </motion.div>

      {/* Chapters counter */}
      <motion.div
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        className="bg-white border border-zinc-200 rounded-xl p-4 flex items-center justify-between shadow-xs"
        id="stat-chapters"
      >
        <div>
          <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Chapter Hiện Có</p>
          <p className="text-2xl font-black font-mono text-zinc-900 mt-1">{totalChapters}</p>
          <p className="text-[11px] text-zinc-500 mt-1.5 flex items-center gap-1">
            Được lên lịch bởi biên tập viên
          </p>
        </div>
        <div className="w-12 h-12 rounded-xl bg-zinc-50 border border-zinc-100 flex items-center justify-center text-zinc-850">
          <BookOpen className="w-5 h-5" />
        </div>
      </motion.div>

      {/* Done counter */}
      <motion.div
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        className="bg-white border border-zinc-200 rounded-xl p-4 flex items-center justify-between shadow-xs"
        id="stat-done"
      >
        <div>
          <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Nộp Bài (Task Done)</p>
          <p className="text-2xl font-black font-mono text-emerald-600 mt-1">{completedTasks}</p>
          <p className="text-[11px] text-zinc-500 mt-1.5">
            Chiếm <span className="font-bold text-emerald-600">{progressPercent}%</span> quy trình hoàn thiện
          </p>
        </div>
        <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600">
          <CheckCircle2 className="w-5 h-5" />
        </div>
      </motion.div>

      {/* Progress tracking */}
      <motion.div
        variants={cardVariants}
        initial="hidden"
        animate="visible"
        className="bg-white border border-zinc-200 rounded-xl p-4 flex items-center justify-between shadow-xs"
        id="stat-progress"
      >
        <div className="w-full">
          <p className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Tổng việc cần làm</p>
          <div className="flex items-baseline justify-between mt-1">
            <p className="text-2xl font-black font-mono text-indigo-600">{pendingTasks} việc pending</p>
            <span className="text-[10px] text-zinc-400 font-mono">({completedTasks}/{totalTasks})</span>
          </div>
          <div className="w-full bg-zinc-100 h-2 rounded-full overflow-hidden mt-3">
            <div 
              className="bg-indigo-600 h-full rounded-full transition-all duration-500" 
              style={{ width: `${progressPercent}%` }}
            ></div>
          </div>
        </div>
      </motion.div>

    </div>
  );
};
