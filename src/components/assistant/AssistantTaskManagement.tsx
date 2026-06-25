/**
 * AssistantTaskManagement — Screen 1
 * Tabbed Assigned / Approved tables with shared filters
 */

import React, { useMemo, useState } from 'react';
import { ExternalLink, Search, Filter } from 'lucide-react';
import { AssistantTask, AssistantTaskStatus } from './assistantTypes';
import { ASSIGNED_TASKS, APPROVED_TASKS } from './assistantMockData';

interface AssistantTaskManagementProps {
  searchQuery: string;
  onOpenWorkspace: (task: AssistantTask) => void;
  tasks?: AssistantTask[];
  isLoading?: boolean;
}

type TabId = 'assigned' | 'approved';

const STATUS_OPTIONS: AssistantTaskStatus[] = [
  'ASSIGNED',
  'IN_PROGRESS',
  'SUBMITTED',
  'REVISING',
  'APPROVED',
];

function urgencyMeta(urgency: AssistantTask['urgency']) {
  switch (urgency) {
    case 'critical':
      return { dot: 'bg-red-500 animate-pulse', text: 'text-red-400' };
    case 'warning':
      return { dot: 'bg-amber-400', text: 'text-amber-400' };
    default:
      return { dot: 'bg-slate-600', text: 'text-slate-500' };
  }
}

function formatDeadline(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const diffDays = Math.ceil((d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return { label: 'Overdue', color: 'text-red-400' };
  if (diffDays === 0) return { label: 'Today', color: 'text-red-400' };
  if (diffDays === 1) return { label: '1 day left', color: 'text-amber-400' };
  if (diffDays <= 3) return { label: `${diffDays} days left`, color: 'text-amber-400' };
  return { label: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), color: 'text-slate-500' };
}

function PageCountBars({ count }: { count: number }) {
  const maxBars = 6;
  const bars = Math.min(count, maxBars);
  return (
    <div className="flex items-end gap-0.5 h-5">
      {Array.from({ length: maxBars }).map((_, i) => (
        <div
          key={i}
          className={`w-2 rounded-sm transition-all ${
            i < bars ? 'bg-red-500/70' : 'bg-[#2d2d34]'
          }`}
          style={{ height: `${((i + 1) / maxBars) * 100}%` }}
        />
      ))}
      <span className="text-[10px] font-mono text-slate-500 ml-1.5">{count}p</span>
    </div>
  );
}

function StatusBadge({ status }: { status: AssistantTaskStatus }) {
  const colors: Record<AssistantTaskStatus, string> = {
    ASSIGNED: 'bg-slate-700/50 text-slate-400 border-slate-600',
    IN_PROGRESS: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    SUBMITTED: 'bg-violet-500/10 text-violet-400 border-violet-500/30',
    REVISING: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    APPROVED: 'bg-green-500/10 text-green-400 border-green-500/30',
  };
  return (
    <span className={`inline-block px-2 py-0.5 text-[9px] font-bold uppercase tracking-wide border rounded-sm ${colors[status]}`}>
      {status.replace('_', ' ')}
    </span>
  );
}

export default function AssistantTaskManagement({
  searchQuery,
  onOpenWorkspace,
  tasks,
  isLoading = false,
}: AssistantTaskManagementProps) {
  const [activeTab, setActiveTab] = useState<TabId>('assigned');
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [filterChapter, setFilterChapter] = useState<string>('ALL');
  const [filterDeadline, setFilterDeadline] = useState<string>('ALL');
  const [inlineSearch, setInlineSearch] = useState('');

  const allTasks = useMemo(() => {
    return tasks || [...ASSIGNED_TASKS, ...APPROVED_TASKS];
  }, [tasks]);

  const assignedTasks = useMemo(() => {
    return allTasks.filter(t => t.status !== 'APPROVED');
  }, [allTasks]);

  const approvedTasks = useMemo(() => {
    return allTasks.filter(t => t.status === 'APPROVED');
  }, [allTasks]);

  const chapters = useMemo(() => {
    return [...new Set(allTasks.map((t) => t.chapter))].sort();
  }, [allTasks]);

  const combinedSearch = (inlineSearch || searchQuery).toLowerCase();

  const filterTasks = (taskList: AssistantTask[]) =>
    taskList.filter((t) => {
      if (combinedSearch) {
        const hay = `${t._id} ${t.title} ${t.series} ${t.chapter} ${t.type}`.toLowerCase();
        if (!hay.includes(combinedSearch)) return false;
      }
      if (filterStatus !== 'ALL' && t.status !== filterStatus) return false;
      if (filterChapter !== 'ALL' && t.chapter !== filterChapter) return false;
      if (filterDeadline !== 'ALL') {
        const dl = formatDeadline(t.deadline);
        if (filterDeadline === 'overdue' && dl.label !== 'Overdue') return false;
        if (filterDeadline === 'urgent' && !['Today', '1 day left', '2 days left', '3 days left'].includes(dl.label)) return false;
        if (filterDeadline === 'normal' && (dl.label === 'Overdue' || dl.label === 'Today' || dl.label.includes('day left'))) return false;
      }
      return true;
    });

  const assignedFiltered = filterTasks(assignedTasks);
  const approvedFiltered = filterTasks(approvedTasks);

  const totalEarnings = approvedFiltered.reduce((s, t) => s + (t.earnings ?? 0), 0);
  const totalPages = approvedFiltered.reduce((s, t) => s + (t.pageCount ?? 0), 0);

  return (
    <div className="h-full overflow-y-auto p-5 space-y-5">
      {isLoading ? (
        <div className="flex flex-col items-center justify-center h-64 gap-3 text-slate-500">
          <span className="text-xs">Đang tải danh sách nhiệm vụ từ server...</span>
        </div>
      ) : (
        <>
          {/* Tabs */}
          <div className="flex items-center gap-2">
        {(['assigned', 'approved'] as TabId[]).map((tab) => {
          const count = tab === 'assigned' ? assignedFiltered.length : approvedFiltered.length;
          const isActive = activeTab === tab;
          return (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex items-center gap-2 px-4 py-2 rounded-md text-[11px] font-bold uppercase tracking-wide transition-all cursor-pointer ${
                isActive
                  ? 'bg-red-600/15 text-white border border-red-500/30'
                  : 'text-slate-500 hover:text-slate-300 border border-transparent hover:bg-[#2d2d34]/60'
              }`}
            >
              {tab === 'assigned' ? 'Assigned' : 'Approved'}
              <span
                className={`min-w-[20px] h-5 px-1.5 flex items-center justify-center rounded-full text-[10px] font-mono font-bold transition-all ${
                  isActive
                    ? 'bg-red-600 text-white scale-110'
                    : 'bg-[#2d2d34] text-slate-500'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Filter bar */}
      <div className="flex flex-wrap items-center gap-3 p-3 bg-[#1e1e24] border border-[#2d2d34] rounded-md">
        <Filter className="w-3.5 h-3.5 text-slate-600 shrink-0" />

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="bg-[#121214] border border-[#2d2d34] text-[10px] text-slate-400 font-mono px-2 py-1.5 rounded-md focus:outline-none focus:border-red-500/50 cursor-pointer"
        >
          <option value="ALL">Status: All</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>{s.replace('_', ' ')}</option>
          ))}
        </select>

        <select
          value={filterChapter}
          onChange={(e) => setFilterChapter(e.target.value)}
          className="bg-[#121214] border border-[#2d2d34] text-[10px] text-slate-400 font-mono px-2 py-1.5 rounded-md focus:outline-none focus:border-red-500/50 cursor-pointer"
        >
          <option value="ALL">Chapter: All</option>
          {chapters.map((c) => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>

        <select
          value={filterDeadline}
          onChange={(e) => setFilterDeadline(e.target.value)}
          className="bg-[#121214] border border-[#2d2d34] text-[10px] text-slate-400 font-mono px-2 py-1.5 rounded-md focus:outline-none focus:border-red-500/50 cursor-pointer"
        >
          <option value="ALL">Deadline: All</option>
          <option value="overdue">Overdue</option>
          <option value="urgent">Urgent (≤3 days)</option>
          <option value="normal">Normal</option>
        </select>

        <div className="flex-1 min-w-[160px] relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-slate-600" />
          <input
            type="text"
            value={inlineSearch}
            onChange={(e) => setInlineSearch(e.target.value)}
            placeholder="Filter tasks…"
            className="w-full pl-8 pr-3 py-1.5 bg-[#121214] border border-[#2d2d34] rounded-md text-[10px] text-slate-400 font-mono focus:outline-none focus:border-red-500/50"
          />
        </div>
      </div>

      {/* Assigned table */}
      {activeTab === 'assigned' && (
        <div className="bg-[#1e1e24] border border-[#2d2d34] rounded-md overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#2d2d34] bg-[#181820]">
                {['Task ID', 'Title', 'Chapter', 'Deadline', 'Status', 'Assignee', ''].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-[9px] font-bold text-slate-600 uppercase tracking-widest">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#2d2d34]">
              {assignedFiltered.map((task) => {
                const urg = urgencyMeta(task.urgency);
                const dl = formatDeadline(task.deadline);
                return (
                  <tr key={task._id} className="hover:bg-[#2d2d34]/30 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${urg.dot}`} />
                        <span className="font-mono text-[11px] text-slate-300">{task._id}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <p className="text-[11px] font-semibold text-white">{task.title}</p>
                      <p className="text-[9px] text-slate-600 mt-0.5">{task.series} · {task.type}</p>
                    </td>
                    <td className="px-4 py-3 text-[11px] font-mono text-slate-400">{task.chapter}</td>
                    <td className={`px-4 py-3 text-[11px] font-mono font-bold ${dl.color}`}>{dl.label}</td>
                    <td className="px-4 py-3"><StatusBadge status={task.status} /></td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <img
                          src={task.assigneeAvatar}
                          alt={task.assigneeName}
                          className="w-6 h-6 rounded-md border border-[#2d2d34] object-cover"
                        />
                        <span className="text-[10px] text-slate-400">{task.assigneeInitials}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => onOpenWorkspace(task)}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600/15 hover:bg-red-600/25 border border-red-500/30 text-red-400 text-[10px] font-bold uppercase rounded-md transition-all cursor-pointer"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Open Workspace
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {assignedFiltered.length === 0 && (
            <p className="p-8 text-center text-[11px] text-slate-600">No assigned tasks match your filters.</p>
          )}
        </div>
      )}

      {/* Approved table */}
      {activeTab === 'approved' && (
        <>
          <div className="bg-[#1e1e24] border border-[#2d2d34] rounded-md overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[#2d2d34] bg-[#181820]">
                  {['Task ID', 'Title', 'Chapter', 'Pages', 'Earnings', 'Approved'].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-[9px] font-bold text-slate-600 uppercase tracking-widest">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#2d2d34]">
                {approvedFiltered.map((task) => (
                  <tr key={task._id} className="hover:bg-[#2d2d34]/30 transition-colors">
                    <td className="px-4 py-3 font-mono text-[11px] text-slate-300">{task._id}</td>
                    <td className="px-4 py-3">
                      <p className="text-[11px] font-semibold text-white">{task.title}</p>
                      <p className="text-[9px] text-slate-600 mt-0.5">{task.series}</p>
                    </td>
                    <td className="px-4 py-3 text-[11px] font-mono text-slate-400">{task.chapter}</td>
                    <td className="px-4 py-3">
                      <PageCountBars count={task.pageCount ?? 0} />
                    </td>
                    <td className="px-4 py-3 font-mono text-[12px] font-bold text-[#2ECC71]">
                      ¥{(task.earnings ?? 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-[10px] font-mono text-slate-500">
                      {task.approvedAt
                        ? new Date(task.approvedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {approvedFiltered.length === 0 && (
              <p className="p-8 text-center text-[11px] text-slate-600">No approved tasks match your filters.</p>
            )}
          </div>

          {/* Summary strip */}
          <div className="flex items-center justify-between px-5 py-3 bg-[#181820] border border-[#2d2d34] rounded-md">
            <div className="flex items-center gap-6">
              <div>
                <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">Total Tasks</p>
                <p className="text-lg font-bold text-white font-mono">{approvedFiltered.length}</p>
              </div>
              <div>
                <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">Total Pages</p>
                <p className="text-lg font-bold text-white font-mono">{totalPages}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">Total Earnings</p>
              <p className="text-xl font-bold text-[#2ECC71] font-mono">¥{totalEarnings.toLocaleString()}</p>
            </div>
          </div>
        </>
      )}
        </>
      )}
    </div>
  );
}
