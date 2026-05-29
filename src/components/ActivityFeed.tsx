/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Radio, 
  Trash2, 
  AlertCircle 
} from "lucide-react";
import { ActivityLog } from "../types";

interface ActivityFeedProps {
  logs: ActivityLog[];
  onClearLogs: () => void;
}

export const ActivityFeed: React.FC<ActivityFeedProps> = ({ logs, onClearLogs }) => {
  return (
    <div className="bg-white border border-zinc-200 rounded-2xl overflow-hidden shadow-xs h-full flex flex-col" id="activity-panel">
      
      {/* Feed Panel Header */}
      <div className="px-5 py-3.5 bg-zinc-50 border-b border-zinc-200 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
          </div>
          <h3 className="text-xs font-bold text-zinc-950 uppercase tracking-widest flex items-center gap-1.5">
            <Radio className="w-4 h-4 text-zinc-600" />
            LIVE SOCKET EVENTS STREAM
          </h3>
        </div>
        <button
          id="clear-logs-btn"
          onClick={onClearLogs}
          disabled={logs.length === 0}
          className="text-[10px] text-zinc-400 font-bold hover:text-zinc-600 outline-none flex items-center gap-1 cursor-pointer disabled:text-zinc-300 disabled:cursor-not-allowed"
          title="Xoá tất cả log"
        >
          <Trash2 className="w-3.5 h-3.5" />
          Dọn dẹp
        </button>
      </div>

      {/* Feed items list */}
      <div className="flex-1 overflow-y-auto max-h-[380px] p-4 space-y-3 font-mono" id="logs-container">
        <AnimatePresence initial={false}>
          {logs.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="h-full py-16 flex flex-col items-center justify-center text-center text-zinc-400 select-none"
            >
              <AlertCircle className="w-5 h-5 text-zinc-300 mb-1" />
              <span className="text-[11px] font-semibold">Chưa có sự kiện Socket.io nào</span>
              <span className="text-[10px] text-zinc-500 mt-1">Lắng nghe hoạt động từ cổng backend...</span>
            </motion.div>
          ) : (
            logs.map((log) => {
              // Custom rendering colors based on categories
              let iconBg = "bg-zinc-100 text-zinc-500 border-zinc-200";
              let textClass = "text-zinc-700 font-medium";
              
              if (log.type === "task_assigned") {
                iconBg = "bg-amber-50 text-amber-700 border-amber-200";
              } else if (log.type === "task_done") {
                iconBg = "bg-emerald-50 text-emerald-700 border-emerald-200";
              } else if (log.type === "chapter_created" || log.type === "chapter_published") {
                iconBg = "bg-indigo-50 text-indigo-700 border-indigo-200";
              } else if (log.type === "rating_created" || log.type === "vote_submitted") {
                iconBg = "bg-amber-50 text-amber-800 border-amber-200";
              } else if (log.type === "series_proposed") {
                iconBg = "bg-orange-50 text-orange-850 border-orange-200";
              } else if (log.type === "series_reviewed") {
                iconBg = "bg-indigo-50 text-indigo-950 border-indigo-200";
              } else if (log.type === "connection_change") {
                iconBg = "bg-rose-50 text-rose-700 border-rose-200";
              }

              return (
                <motion.div
                  key={log.id}
                  initial={{ opacity: 0, x: -10, scale: 0.98 }}
                  animate={{ opacity: 1, x: 0, scale: 1 }}
                  exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                  className={`p-3 rounded-xl border flex gap-2.5 text-[11px] leading-relaxed transition-all ${iconBg}`}
                >
                  <div className="flex-1">
                    <div className="flex items-center justify-between text-[10px] text-zinc-500/80 mb-1 font-mono">
                      <span className="font-bold flex items-center gap-1 uppercase">
                        {log.type === "task_assigned" && "📢 [SOCKET: TASK_ASSIGNED]"}
                        {log.type === "task_done" && "✅ [SOCKET: TASK_DONE]"}
                        {log.type === "chapter_created" && "📦 [API: CHAPTER_CREATED]"}
                        {log.type === "chapter_published" && "🚀 [API: CHAPTER_PUBLISHED]"}
                        {log.type === "rating_created" && "🌟 [SOCKET: RATING_CREATED]"}
                        {log.type === "vote_submitted" && "🗳️ [SOCKET: VOTE_SUBMITTED]"}
                        {log.type === "series_proposed" && "📝 [API: SERIES_PROPOSED]"}
                        {log.type === "series_reviewed" && "⚖️ [API: SERIES_REVIEWED]"}
                        {log.type === "connection_change" && "🔌 [SYSTEM: CONNECTIVITY]"}
                      </span>
                      <span>
                        {new Date(log.timestamp).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                      </span>
                    </div>
                    <p className={`${textClass} text-xs font-semibold font-sans`}>{log.message}</p>
                    
                    {/* JSON Preview option / Sockets Data Payload inspector */}
                    {log.meta && (
                      <details className="mt-1.5 cursor-pointer select-none">
                        <summary className="text-[10px] text-zinc-500 underline hover:text-zinc-805">
                          Xem socket payload JSON
                        </summary>
                        <pre className="mt-1 p-2 rounded bg-zinc-950/90 text-amber-400 text-[10px] overflow-x-auto border border-zinc-800 max-h-[80px] font-mono leading-tight whitespace-pre">
                          {JSON.stringify(log.meta, null, 2)}
                        </pre>
                      </details>
                    )}
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>

    </div>
  );
};
