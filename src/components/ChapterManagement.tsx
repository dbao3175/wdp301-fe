import React, { useState } from 'react';
import { User, Series, Chapter } from '../types';
import { apiClient } from '../api/client';
import { 
  BookOpen, Plus, Edit2, Trash2, Check, X, ArrowRight, Save
} from 'lucide-react';

interface ChapterManagementProps {
  currentUser: User;
  series: Series[];
  chapters: Chapter[];
  activeSeries: Series | null;
  onRefreshAll: () => void;
  onSelectSeries: (series: Series) => void;
  onSelectChapter: (chapter: Chapter) => void;
  onChangeTab: (tab: string) => void;
}

export default function ChapterManagement({
  currentUser, series, chapters, activeSeries, onRefreshAll, onSelectSeries, onSelectChapter, onChangeTab
}: ChapterManagementProps) {
  const [isCreating, setIsCreating] = useState(false);
  const [editingChapterId, setEditingChapterId] = useState<string | null>(null);
  
  // Create / Edit Form State
  const [cNumber, setCNumber] = useState<number | ''>('');
  const [cTitle, setCTitle] = useState('');
  const [cDeadline, setCDeadline] = useState('');

  const [toast, setToast] = useState<{msg: string, type: 'success'|'error'} | null>(null);

  const showToast = (msg: string, type: 'success'|'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const currentSeriesChapters = activeSeries 
    ? chapters.filter(c => c.seriesId === activeSeries._id || c.series === activeSeries._id)
    : [];

  const handleCreate = async () => {
    if (!activeSeries) return showToast('Please select a series first', 'error');
    if (!cNumber || isNaN(Number(cNumber))) return showToast('Invalid chapter number', 'error');
    if (!cDeadline) return showToast('Deadline is required', 'error');

    try {
      await apiClient.chapters.create(activeSeries._id, Number(cNumber), cDeadline);
      // Currently API doesn't take title, but we send what it accepts
      showToast(`Chapter ${cNumber} created successfully!`);
      setIsCreating(false);
      resetForm();
      onRefreshAll();
    } catch (err: any) {
      showToast(err.message || 'Failed to create chapter', 'error');
    }
  };

  const handleUpdate = async (chapterId: string) => {
    if (!cNumber || isNaN(Number(cNumber))) return showToast('Invalid chapter number', 'error');

    try {
      await apiClient.chapters.update(chapterId, { 
        chapterNumber: Number(cNumber),
        deadline: cDeadline
      });
      showToast(`Chapter updated successfully!`);
      setEditingChapterId(null);
      resetForm();
      onRefreshAll();
    } catch (err: any) {
      showToast(err.message || 'Failed to update chapter', 'error');
    }
  };

  const handleDelete = async (chapterId: string) => {
    if (!confirm('Are you sure you want to delete this chapter? All tasks within it will be orphaned!')) return;
    try {
      await apiClient.chapters.delete(chapterId);
      showToast('Chapter deleted.');
      onRefreshAll();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete chapter', 'error');
    }
  };

  const startEdit = (c: Chapter) => {
    setEditingChapterId(c._id);
    setCNumber(c.chapterNumber);
    setCDeadline(c.deadline ? new Date(c.deadline).toISOString().split('T')[0] : '');
    setIsCreating(false);
  };

  const resetForm = () => {
    setCNumber('');
    setCDeadline('');
    setEditingChapterId(null);
  };

  const goToWorkspace = (c: Chapter) => {
    onSelectChapter(c);
    onChangeTab('workspace');
  };

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] min-h-[600px] bg-[#121214] rounded-md overflow-hidden border border-[#2d2d34] shadow-2xl shadow-black">
      
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 bg-[#181820] border-b border-[#2d2d34] shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-red-600 flex items-center justify-center shrink-0">
            <BookOpen className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white leading-none">Chapter Management</h1>
            <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-widest">Manage your series and chapters</p>
          </div>
        </div>
        {toast && (
          <div className={`px-4 py-2 rounded-md text-xs font-bold ${toast.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
            {toast.msg}
          </div>
        )}
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Left Col: Series Selection */}
        <aside className="w-1/3 min-w-[250px] border-r border-[#2d2d34] bg-[#1e1e24] flex flex-col p-4">
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">Your Series</h2>
          <div className="space-y-2 overflow-y-auto">
            {series.map(s => (
              <button
                key={s._id}
                onClick={() => onSelectSeries(s)}
                className={`w-full text-left px-4 py-3 rounded-md transition-all border ${
                  activeSeries?._id === s._id
                    ? 'bg-red-600/10 border-red-600/50 text-red-400'
                    : 'bg-[#121214] border-[#2d2d34] text-slate-300 hover:border-slate-500'
                }`}
              >
                <div className="font-bold text-sm">{s.title}</div>
                <div className="text-[10px] text-slate-500 mt-1 uppercase">{s.status}</div>
              </button>
            ))}
            {series.length === 0 && (
              <p className="text-xs text-slate-500 text-center py-4">No series found.</p>
            )}
          </div>
        </aside>

        {/* Right Col: Chapter List */}
        <main className="flex-1 bg-[#121214] flex flex-col relative overflow-hidden">
          {!activeSeries ? (
            <div className="flex-1 flex items-center justify-center text-slate-500 text-sm font-medium">
              Select a series to manage its chapters.
            </div>
          ) : (
            <>
              {/* Toolbar */}
              <div className="px-6 py-4 border-b border-[#2d2d34] flex items-center justify-between">
                <h2 className="text-sm font-bold text-white">
                  Chapters for <span className="text-red-400">{activeSeries.title}</span>
                </h2>
                {!isCreating && !editingChapterId && (
                  <button 
                    onClick={() => { setIsCreating(true); resetForm(); }}
                    className="flex items-center gap-2 px-3 py-1.5 bg-white hover:bg-slate-200 text-black text-xs font-bold rounded-md transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Chapter
                  </button>
                )}
              </div>

              {/* Editor / Creator Form */}
              {(isCreating || editingChapterId) && (
                <div className="m-6 p-4 bg-[#1e1e24] border border-[#2d2d34] rounded-md">
                  <h3 className="text-xs font-bold text-white mb-4 uppercase tracking-wider">
                    {isCreating ? 'Create New Chapter' : 'Edit Chapter'}
                  </h3>
                  <div className="grid grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Chapter Number</label>
                      <input 
                        type="number"
                        value={cNumber}
                        onChange={e => setCNumber(e.target.value ? Number(e.target.value) : '')}
                        className="w-full bg-[#121214] border border-[#2d2d34] rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500 transition-colors"
                        placeholder="e.g. 1"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">Deadline</label>
                      <input 
                        type="date"
                        value={cDeadline}
                        onChange={e => setCDeadline(e.target.value)}
                        className="w-full bg-[#121214] border border-[#2d2d34] rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500 transition-colors [&::-webkit-calendar-picker-indicator]:invert"
                      />
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => editingChapterId ? handleUpdate(editingChapterId) : handleCreate()}
                      className="flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-md transition-all"
                    >
                      <Save className="w-3.5 h-3.5" /> Save Chapter
                    </button>
                    <button 
                      onClick={() => { setIsCreating(false); resetForm(); }}
                      className="flex items-center gap-1.5 px-4 py-2 bg-transparent border border-[#2d2d34] hover:bg-[#2d2d34] text-slate-300 text-xs font-bold rounded-md transition-all"
                    >
                      <X className="w-3.5 h-3.5" /> Cancel
                    </button>
                  </div>
                </div>
              )}

              {/* List */}
              <div className="flex-1 overflow-y-auto p-6 space-y-3">
                {currentSeriesChapters.length === 0 ? (
                  <div className="text-center text-slate-500 text-xs py-8">
                    No chapters exist for this series yet.
                  </div>
                ) : (
                  currentSeriesChapters.map(c => (
                    <div key={c._id} className="flex items-center justify-between p-4 bg-[#1e1e24] border border-[#2d2d34] hover:border-slate-500 rounded-md transition-all group">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded bg-[#121214] border border-[#2d2d34] flex flex-col items-center justify-center text-slate-300">
                          <span className="text-[9px] font-bold uppercase">CH</span>
                          <span className="text-xs font-black">{c.chapterNumber}</span>
                        </div>
                        <div>
                          <div className="text-sm font-bold text-white flex items-center gap-2">
                            Chapter {c.chapterNumber}
                            <span className="px-2 py-0.5 rounded bg-[#121214] border border-[#2d2d34] text-[9px] text-slate-500 font-mono">
                              {c.status}
                            </span>
                          </div>
                          <div className="text-[10px] text-slate-400 mt-1">
                            Deadline: {c.deadline ? new Date(c.deadline).toLocaleDateString() : 'N/A'}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => goToWorkspace(c)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-black hover:bg-slate-200 text-[10px] font-bold uppercase rounded"
                        >
                          Workspace <ArrowRight className="w-3 h-3" />
                        </button>
                        <button 
                          onClick={() => startEdit(c)}
                          className="p-1.5 bg-[#121214] border border-[#2d2d34] hover:text-white rounded text-slate-400 transition-colors"
                          title="Edit Chapter"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => handleDelete(c._id)}
                          className="p-1.5 bg-[#121214] border border-[#2d2d34] hover:border-red-500/50 hover:text-red-400 rounded text-slate-400 transition-colors"
                          title="Delete Chapter"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
