import React, { useState } from 'react';
import { User, Series, Chapter, Task } from '../types';
import { apiClient } from '../api/client';
import { Calendar, Filter, Plus, Edit2, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

interface ProductionTrackerProps {
  currentUser: User;
  series: Series[];
  chapters: Chapter[];
  tasks: Task[];
  onRefreshAll: () => void;
  onSelectSeries: (series: Series) => void;
  onSelectChapter: (chapter: Chapter) => void;
}

export default function ProductionTracker({
  currentUser,
  series,
  chapters,
  tasks,
  onRefreshAll,
  onSelectSeries,
  onSelectChapter
}: ProductionTrackerProps) {
  // Filters state
  const [selectedSeriesFilter, setSelectedSeriesFilter] = useState('All Series');

  // Chapter Creation form states
  const [isCreatingChapter, setIsCreatingChapter] = useState(false);
  const [newSeriesId, setNewSeriesId] = useState('');
  const [newChapterNumber, setNewChapterNumber] = useState(1);
  const [newChapterDeadline, setNewChapterDeadline] = useState('2026-06-25');
  const [statusMsg, setStatusMsg] = useState('');

  // Handle toggle chapter state (IN_PROGRESS <=> COMPLETED)
  const handleToggleChapterStatus = async (chapterId: string) => {
    try {
      await apiClient.chapters.toggleStatus(chapterId);
      onRefreshAll();
    } catch (err: any) {
      alert(`Error toggling chapter state: ${err.message}`);
    }
  };

  // Submit new chapter creation
  const handleCreateChapterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSeriesId) {
      setStatusMsg('❌ Please select a series.');
      return;
    }

    try {
      await apiClient.chapters.create(newSeriesId, newChapterNumber, newChapterDeadline);
      setStatusMsg('✅ Chapter successfully created and tracked!');
      onRefreshAll();
      setTimeout(() => {
        setIsCreatingChapter(false);
        setStatusMsg('');
        setNewSeriesId('');
      }, 1500);
    } catch (err: any) {
      setStatusMsg(`❌ Error: ${err.message}`);
    }
  };

  // Filter Chapters based on Series Selection Filter
  const filteredChapters = chapters.filter(c => {
    if (selectedSeriesFilter === 'All Series') return true;
    const linkedSeries = series.find(s => s._id === c.seriesId || s._id === c.series);
    return linkedSeries?.title === selectedSeriesFilter;
  });

  // Mock mapped chapter titles
  const getChapterQuoteTitle = (item: Chapter) => {
    if (item.chapterNumber === 142) return '"Awakening"';
    if (item.chapterNumber === 8) return '"Rogue AI"';
    if (item.chapterNumber === 141) return '"Silence"';
    if (item.chapterNumber === 42) return '"The End?"';
    return `"Evolving Volume"`;
  };

  // Get total pages representing chapter work item count
  const getSimulatedPages = (chapterNum: number) => {
    if (chapterNum === 142) return 24;
    if (chapterNum === 8) return 32;
    if (chapterNum === 141) return 20;
    if (chapterNum === 42) return 18;
    return 16 + Math.round((chapterNum % 5) * 4);
  };

  return (
    <div className="space-y-6">
      {/* Header text container */}
      <div className="mb-8 pb-5 border-b-4 border-ink-black flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="font-syne text-3xl font-black text-ink-black uppercase italic tracking-tight">Production Tracker</h1>
          <p className="font-sans text-xs text-neutral-600 font-bold uppercase tracking-wider mt-1.5 flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 bg-[#E63946]"></span>
            Manage manuscript deadlines, page dimensions, and printing calendars across active editorial series folders.
          </p>
        </div>

        {/* Global Toolbar */}
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {/* Series filter */}
          <div className="flex items-center bg-[#F5F5F0] border-2 border-ink-black px-3 py-2 w-full sm:w-64 focus-within:bg-white transition-all">
            <Filter className="text-neutral-500 w-4 h-4 mr-2" />
            <select 
              className="bg-transparent border-none outline-none font-sans text-xs text-ink-black w-full font-bold focus:ring-0 cursor-pointer"
              value={selectedSeriesFilter}
              onChange={(e) => setSelectedSeriesFilter(e.target.value)}
            >
              <option value="All Series">All Series</option>
              {series.map(s => (
                <option key={s._id} value={s.title}>{s.title}</option>
              ))}
            </select>
          </div>

          {/* New Chapter CTA */}
          <button 
            onClick={() => setIsCreatingChapter(true)}
            className="flex items-center gap-1.5 bg-[#E63946] border-2 border-ink-black hover:bg-red-600 text-white px-5 py-2.5 rounded-none font-syne text-xs font-black uppercase tracking-tight shadow-[3px_3px_0px_#141414] active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            New Chapter
          </button>
        </div>
      </div>

      {/* Chapter Creation Form overlay Modal drawer style container */}
      {isCreatingChapter && (
        <div className="bg-[#FFF3B0] border-4 border-ink-black bg-white p-6 rounded-none mb-6 anim-scaleIn relative shadow-[4px_4px_0px_#141414]">
          <button 
            onClick={() => setIsCreatingChapter(false)}
            className="absolute top-4 right-4 text-xs font-mono font-extrabold text-[#E63946] hover:underline cursor-pointer uppercase tracking-wider"
          >
            Close ✕
          </button>
          
          <h3 className="font-syne text-sm font-black uppercase text-ink-black mb-4 flex items-center gap-2 select-none">
            <Calendar className="text-[#E63946] w-5 h-5 animate-bounce" />
            Schedule New Chapter Target
          </h3>

          {statusMsg && (
            <div className={`p-3 border-2 mb-4 text-xs font-mono uppercase font-black ${statusMsg.startsWith('✅') ? 'bg-[#2ECC71]/15 text-[#2ECC71] border-[#2ECC71]' : 'bg-[#E63946]/15 text-[#E63946] border-[#E63946]'}`}>
              {statusMsg}
            </div>
          )}

          <form onSubmit={handleCreateChapterSubmit} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div>
              <label className="block text-[10px] font-mono text-ink-black font-extrabold uppercase mb-1" htmlFor="pSeries">Target Series</label>
              <select 
                id="pSeries"
                className="w-full bg-white border-2 border-ink-black p-2.5 rounded-none text-xs focus:outline-none cursor-pointer font-bold"
                value={newSeriesId}
                onChange={(e) => setNewSeriesId(e.target.value)}
                required
              >
                <option value="">Select Series...</option>
                {series.filter(s => s.status !== 'PENDING').map(s => (
                  <option key={s._id} value={s._id}>{s.title}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-mono text-ink-black font-extrabold uppercase mb-1" htmlFor="pNumber">Chapter Number</label>
              <input 
                id="pNumber"
                type="number" 
                className="w-full bg-white border-2 border-ink-black p-2.5 rounded-none text-xs focus:outline-none font-bold"
                value={newChapterNumber}
                onChange={(e) => setNewChapterNumber(Number(e.target.value))}
                min={1}
                required
              />
            </div>

            <div>
              <label className="block text-[10px] font-mono text-ink-black font-extrabold uppercase mb-1" htmlFor="pDeadline">Print Deadline</label>
              <input 
                id="pDeadline"
                type="date" 
                className="w-full bg-white border-2 border-ink-black p-2 rounded-none text-xs focus:outline-none cursor-pointer font-bold"
                value={newChapterDeadline}
                onChange={(e) => setNewChapterDeadline(e.target.value)}
                required
              />
            </div>

            <button 
              type="submit"
              className="bg-[#E63946] hover:bg-red-600 text-white py-3 px-4 border-2 border-ink-black rounded-none font-syne text-[10px] font-black uppercase tracking-wider shadow-[2px_2px_0px_#141414] active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
            >
              Add Scheduled Session
            </button>
          </form>
        </div>
      )}

      {/* Main Chapters Data tracker table */}
      <div className="bg-white border-4 border-ink-black rounded-none shadow-[6px_6px_0px_#141414] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#141414] text-white font-mono text-[10px] uppercase tracking-widest border-b-2 border-ink-black">
                <th className="px-6 py-4 font-black">Chapter Title / Key</th>
                <th className="px-6 py-4 font-black">Series Folders</th>
                <th className="px-6 py-4 font-black text-center">Draft Sheets</th>
                <th className="px-6 py-4 font-black">Print Deadlines</th>
                <th className="px-6 py-4 font-black">Production status</th>
                <th className="px-6 py-4 font-black text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="font-sans text-xs text-ink-black divide-y-2 divide-ink-black font-bold">
              
              {filteredChapters.map((chapter) => {
                const parentSeries = series.find(s => s._id === chapter.seriesId || s._id === chapter.series);
                const titleHeading = getChapterQuoteTitle(chapter);
                const isOverdue = new Date(chapter.deadline) < new Date('2026-06-12') && chapter.status !== 'COMPLETED';

                return (
                  <tr 
                    key={chapter._id} 
                    className="hover:bg-[#F5F5F0] transition-colors h-table-row-height group"
                  >
                    <td className="px-6 py-4 text-ink-black font-syne uppercase">
                      Ch. {chapter.chapterNumber}: <span className="font-serif italic font-bold text-neutral-600 select-all">{titleHeading}</span>
                    </td>
                    
                    <td className="px-6 py-4 text-neutral-500 font-bold uppercase">
                      {parentSeries?.title || "Undefined Series"}
                    </td>

                    <td className="px-6 py-4 text-center font-mono font-black text-[#E63946]">
                      {getSimulatedPages(chapter.chapterNumber)} shts
                    </td>

                    <td className={`px-6 py-4 font-mono ${isOverdue ? 'text-[#E63946] animate-pulse bg-red-100/50' : 'text-neutral-500'}`}>
                      {chapter.deadline}
                      {isOverdue && <span className="ml-1.5 text-[8px] uppercase font-black tracking-widest bg-[#E63946] text-white px-1.5 py-0.5">Overdue</span>}
                    </td>

                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleChapterStatus(chapter._id)}
                        className={`px-3 py-1.5 font-mono text-[9px] font-black tracking-widest flex items-center gap-1.5 cursor-pointer border-2 border-ink-black transition-all ${
                          chapter.status === 'COMPLETED'
                            ? 'bg-[#2ECC71] text-white shadow-[1.5px_1.5px_0px_#141414]'
                            : 'bg-[#FFF3B0] text-ink-black shadow-[1.5px_1.5px_0px_#141414]'
                        }`}
                      >
                        {chapter.status === 'COMPLETED' ? (
                          <>
                            <CheckCircle2 className="w-3" />
                            COMPLETED
                          </>
                        ) : (
                          <>
                            <RefreshCw className="w-3 animate-spin duration-300" />
                            IN PROGRESS
                          </>
                        )}
                      </button>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <button 
                        onClick={() => {
                          // Select for coloring or canvas review
                          if (parentSeries) {
                            onSelectSeries(parentSeries);
                            onSelectChapter(chapter);
                          }
                        }}
                        className="text-neutral-500 hover:text-[#E63946] tracking-tighter opacity-100 transition-opacity cursor-pointer flex items-center justify-end gap-1 font-syne text-[10px] uppercase font-black ml-auto"
                      >
                        <Edit2 className="w-3 h-3" />
                        Draw/Edit draft
                      </button>
                    </td>
                  </tr>
                );
              })}

              {filteredChapters.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-xs text-neutral-500 font-mono font-bold uppercase select-none">
                    ⚠️ No scheduled chapter drafts detected under this filter folder. Click "New Chapter" to create.
                  </td>
                </tr>
              )}

            </tbody>
          </table>
        </div>

        {/* Dynamic tracker footer metadata info */}
        <div className="bg-[#F5F5F0] px-6 py-4 border-t-4 border-ink-black flex items-center justify-between font-mono text-[10px] font-extrabold uppercase select-none">
          <span className="text-neutral-500">Showing 1 to {filteredChapters.length} of {chapters.length} entries</span>
          <div className="flex gap-1.5">
            <button className="px-3 py-1 bg-white border-2 border-ink-black text-ink-black hover:bg-neutral-100 font-bold transition-all disabled:opacity-30 cursor-pointer" disabled>Prev</button>
            <button className="px-3.5 py-1 bg-[#E63946] text-white border-2 border-ink-black font-bold">1</button>
            <button className="px-3 py-1 bg-white border-2 border-ink-black text-ink-black hover:bg-neutral-100 font-bold transition-all disabled:opacity-30 cursor-pointer" disabled>Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}
