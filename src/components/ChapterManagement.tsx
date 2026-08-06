import React, { useEffect, useState } from 'react';
import { User, Series, Chapter, Task, Volume } from '../types';
import { apiClient } from '../api/client';
import { useLanguage } from '../i18n/LanguageContext';
import { 
  BookOpen, Plus, Edit2, Archive, X, ArrowRight, Save, LibraryBig
} from 'lucide-react';
import ChapterFeedbackPanel from './ChapterFeedbackPanel';

interface ChapterManagementProps {
  currentUser: User;
  series: Series[];
  chapters: Chapter[];
  tasks: Task[];
  activeSeries: Series | null;
  onRefreshAll: () => void;
  onSelectSeries: (series: Series) => void;
  onSelectChapter: (chapter: Chapter) => void;
  onChangeTab: (tab: string) => void;
}

export default function ChapterManagement({
  currentUser, series, chapters, tasks, activeSeries, onRefreshAll, onSelectSeries, onSelectChapter, onChangeTab
}: ChapterManagementProps) {
  const { language, t } = useLanguage();
  const [isCreating, setIsCreating] = useState(false);
  const [editingChapterId, setEditingChapterId] = useState<string | null>(null);
  
  // Create / Edit Form State
  const [cNumber, setCNumber] = useState<number | ''>('');
  const [cTitle, setCTitle] = useState('');
  const [cDeadline, setCDeadline] = useState('');
  const [cVolumeId, setCVolumeId] = useState('');
  const [volumes, setVolumes] = useState<Volume[]>([]);
  const [isCreatingVolume, setIsCreatingVolume] = useState(false);
  const [vNumber, setVNumber] = useState<number | ''>('');
  const [vTitle, setVTitle] = useState('');
  const [vDeadline, setVDeadline] = useState('');

  const [toast, setToast] = useState<{msg: string, type: 'success'|'error'} | null>(null);

  const showToast = (msg: string, type: 'success'|'error' = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    if (!activeSeries) {
      setVolumes([]);
      return;
    }
    apiClient.volumes.getAll(activeSeries._id)
      .then(setVolumes)
      .catch((error) => showToast(t(error.message || 'Failed to load volumes'), 'error'));
  }, [activeSeries?._id]);

  const refreshVolumes = async () => {
    if (!activeSeries) return;
    setVolumes(await apiClient.volumes.getAll(activeSeries._id));
  };

  const handleCreateVolume = async () => {
    if (!activeSeries) return showToast(t('Please select a series first'), 'error');
    if (!vNumber || Number(vNumber) <= 0) return showToast(t('Invalid volume number'), 'error');
    try {
      const created = await apiClient.volumes.create({
        seriesId: activeSeries._id,
        volumeNumber: Number(vNumber),
        title: vTitle.trim() || undefined,
        dueAt: vDeadline || undefined,
      });
      await refreshVolumes();
      setCVolumeId(created._id);
      setVNumber('');
      setVTitle('');
      setVDeadline('');
      setIsCreatingVolume(false);
      showToast(t('Volume created successfully.'));
    } catch (error: any) {
      showToast(t(error.message || 'Failed to create volume'), 'error');
    }
  };
  const currentSeriesChapters = activeSeries 
    ? chapters.filter(c => {
        const sid = typeof c.seriesId === 'object' && c.seriesId !== null ? (c.seriesId as any)._id : c.seriesId;
        const fallbackSid = typeof c.series === 'object' && c.series !== null ? (c.series as any)._id : c.series;
        return (sid === activeSeries._id || fallbackSid === activeSeries._id) && c.status !== 'ARCHIVED';
      })
    : [];

  const handleCreate = async () => {
    if (!activeSeries) return showToast(t('Please select a series first'), 'error');
    if (!cNumber || isNaN(Number(cNumber))) return showToast(t('Invalid chapter number'), 'error');
    if (!cDeadline) return showToast(t('Deadline is required'), 'error');

    try {
      await apiClient.chapters.create(activeSeries._id, Number(cNumber), cDeadline, cTitle.trim(), cVolumeId || undefined);
      showToast(t("Chapter {{number}} created successfully!", { number: cNumber }));
      setIsCreating(false);
      resetForm();
      onRefreshAll();
    } catch (err: any) {
      showToast(t(err.message || 'Failed to create chapter'), 'error');
    }
  };

  const handleUpdate = async (chapterId: string) => {
    if (!cNumber || isNaN(Number(cNumber))) return showToast(t('Invalid chapter number'), 'error');

    try {
      await apiClient.chapters.update(chapterId, { 
        chapterNumber: Number(cNumber),
        title: cTitle.trim(),
        deadline: cDeadline,
        volumeId: cVolumeId || null
      });
      showToast(t("Chapter updated successfully!"));
      setEditingChapterId(null);
      resetForm();
      onRefreshAll();
    } catch (err: any) {
      showToast(t(err.message || 'Failed to update chapter'), 'error');
    }
  };

  const handleArchive = async (chapterId: string) => {
    if (!confirm(t('Are you sure you want to archive this chapter? This will hide it from the active list.'))) return;
    try {
      await apiClient.chapters.update(chapterId, { status: 'ARCHIVED' });
      showToast(t('Chapter archived.'));
      onRefreshAll();
    } catch (err: any) {
      showToast(t(err.message || 'Failed to archive chapter'), 'error');
    }
  };

  const startEdit = (c: Chapter) => {
    setEditingChapterId(c._id);
    setCNumber(c.chapterNumber);
    setCTitle(c.title || '');
    setCDeadline(c.deadline ? new Date(c.deadline).toISOString().split('T')[0] : '');
    setCVolumeId(typeof c.volumeId === 'object' && c.volumeId !== null ? c.volumeId._id : String(c.volumeId || ''));
    setIsCreating(false);
  };

  const resetForm = () => {
    setCNumber('');
    setCTitle('');
    setCDeadline('');
    setCVolumeId('');
    setEditingChapterId(null);
  };

  const goToWorkspace = (c: Chapter) => {
    onSelectChapter(c);
    onChangeTab('workspace');
  };

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] min-h-[600px] bg-[#121214] rounded-md overflow-hidden border border-[#2d2d34] shadow-2xl shadow-black">
      
      {/* Header */}
      <header className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-6 py-4 bg-[#181820] border-b border-[#2d2d34] shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-red-600 flex items-center justify-center shrink-0">
            <BookOpen className="w-4 h-4 text-white" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white leading-none">{t("Chapter Management")}</h1>
            <p className="text-[10px] text-slate-500 mt-1 uppercase tracking-widest">{t("Manage your series and chapters")}</p>
          </div>
        </div>
        {toast && (
          <div className={`px-4 py-2 rounded-md text-xs font-bold ${toast.type === 'success' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
            {toast.msg}
          </div>
        )}
      </header>

      <div className="flex flex-1 flex-col lg:flex-row overflow-hidden min-w-0">
        {/* Left Col: Series Selection */}
        <aside className="w-full lg:w-1/3 lg:min-w-[250px] max-h-52 lg:max-h-none border-b lg:border-b-0 lg:border-r border-[#2d2d34] bg-[#1e1e24] flex flex-col p-4 shrink-0">
          <h2 className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-3">{t("Your Series")}</h2>
          <div className="space-y-2 overflow-y-auto">
            {series.filter(s => s.status !== 'PENDING' && s.status !== 'REJECTED').map(s => (
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
                <div className="text-[10px] text-slate-500 mt-1 uppercase">{t(s.status)}</div>
              </button>
            ))}
            {series.filter(s => s.status !== 'PENDING' && s.status !== 'REJECTED').length === 0 && (
              <p className="text-xs text-slate-500 text-center py-4">{t("No series found.")}</p>
            )}
          </div>
        </aside>

        {/* Right Col: Chapter List */}
        <main className="flex-1 min-w-0 bg-[#121214] flex flex-col relative overflow-hidden">
          {!activeSeries ? (
            <div className="flex-1 flex items-center justify-center text-slate-500 text-sm font-medium">
              {t("Select a series to manage its chapters.")}
            </div>
          ) : (
            <>
              {/* Toolbar */}
              <div className="px-4 sm:px-6 py-4 border-b border-[#2d2d34] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <h2 className="text-sm font-bold text-white">
                  {t("Chapters for")} <span className="text-red-400">{activeSeries.title}</span>
                </h2>
                {!isCreating && !editingChapterId && (
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={() => setIsCreatingVolume((value) => !value)} className="flex items-center gap-2 rounded-md border border-[#3a3a44] bg-[#1e1e24] px-3 py-1.5 text-xs font-bold text-slate-200 transition-colors hover:border-slate-500">
                      <LibraryBig className="size-3.5" /> {t("Add Volume")}
                    </button>
                    <button type="button" onClick={() => { setIsCreating(true); resetForm(); }} className="flex items-center gap-2 rounded-md bg-white px-3 py-1.5 text-xs font-bold text-black transition-colors hover:bg-slate-200">
                      <Plus className="size-3.5" /> {t("Add Chapter")}
                    </button>
                  </div>
                )}
              </div>

              {isCreatingVolume && (
                <div className="m-4 mb-0 rounded-md border border-[#2d2d34] bg-[#1e1e24] p-4 sm:mx-6">
                  <h3 className="mb-4 text-xs font-bold uppercase text-white">{t('Create New Volume')}</h3>
                  <div className="grid gap-3 sm:grid-cols-3">
                    <input type="number" min={1} value={vNumber} onChange={(event) => setVNumber(event.target.value ? Number(event.target.value) : '')} placeholder={t('Volume number')} className="rounded-md border border-[#2d2d34] bg-[#121214] px-3 py-2 text-sm text-white focus:border-red-500 focus:outline-none" />
                    <input value={vTitle} onChange={(event) => setVTitle(event.target.value)} placeholder={t('Volume title (optional)')} className="rounded-md border border-[#2d2d34] bg-[#121214] px-3 py-2 text-sm text-white focus:border-red-500 focus:outline-none" />
                    <input type="date" value={vDeadline} onChange={(event) => setVDeadline(event.target.value)} className="rounded-md border border-[#2d2d34] bg-[#121214] px-3 py-2 text-sm text-white focus:border-red-500 focus:outline-none [&::-webkit-calendar-picker-indicator]:invert" />
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button type="button" onClick={handleCreateVolume} className="rounded-md bg-red-600 px-4 py-2 text-xs font-bold text-white hover:bg-red-500">{t('Save Volume')}</button>
                    <button type="button" onClick={() => setIsCreatingVolume(false)} className="rounded-md border border-[#3a3a44] px-4 py-2 text-xs font-bold text-slate-300 hover:bg-[#2d2d34]">{t('Cancel')}</button>
                  </div>
                </div>
              )}
              {/* Editor / Creator Form */}
              {(isCreating || editingChapterId) && (
                <div className="m-4 sm:m-6 p-4 bg-[#1e1e24] border border-[#2d2d34] rounded-md">
                  <h3 className="text-xs font-bold text-white mb-4 uppercase tracking-wider">
                    {isCreating ? t("Create New Chapter") : t("Edit Chapter")}
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">{t("Chapter Number")}</label>
                      <input 
                        type="number"
                        value={cNumber}
                        onChange={e => setCNumber(e.target.value ? Number(e.target.value) : '')}
                        className="w-full bg-[#121214] border border-[#2d2d34] rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500 transition-colors"
                        placeholder={t("e.g. 1")}
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">{t("Chapter Title (Optional)")}</label>
                      <input 
                        type="text"
                        value={cTitle}
                        onChange={e => setCTitle(e.target.value)}
                        className="w-full bg-[#121214] border border-[#2d2d34] rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500 transition-colors"
                        placeholder={t("e.g. The Beginning")}
                      />
                    </div>
                  </div>
                  <div className="mb-4">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">{t("Deadline")}</label>
                    <input 
                      type="date"
                      value={cDeadline}
                      onChange={e => setCDeadline(e.target.value)}
                      className="w-full bg-[#121214] border border-[#2d2d34] rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-red-500 transition-colors [&::-webkit-calendar-picker-indicator]:invert"
                    />
                  </div>
                  <div className="mb-4">
                    <label className="mb-1.5 block text-[10px] font-bold uppercase text-slate-500">{t('Volume')}</label>
                    <select value={cVolumeId} onChange={(event) => setCVolumeId(event.target.value)} className="w-full rounded-md border border-[#2d2d34] bg-[#121214] px-3 py-2 text-sm text-white focus:border-red-500 focus:outline-none">
                      <option value="">{t('No volume')}</option>
                      {volumes.map((volume) => <option key={volume._id} value={volume._id}>{t('Volume')} {volume.volumeNumber}{volume.title ? ` - ${volume.title}` : ''}</option>)}
                    </select>
                  </div>                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => editingChapterId ? handleUpdate(editingChapterId) : handleCreate()}
                      className="flex items-center gap-1.5 px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-md transition-all"
                    >
                      <Save className="w-3.5 h-3.5" /> {t("Save Chapter")}
                    </button>
                    <button 
                      onClick={() => { setIsCreating(false); resetForm(); }}
                      className="flex items-center gap-1.5 px-4 py-2 bg-transparent border border-[#2d2d34] hover:bg-[#2d2d34] text-slate-300 text-xs font-bold rounded-md transition-all"
                    >
                      <X className="w-3.5 h-3.5" /> {t("Cancel")}
                    </button>
                  </div>
                </div>
              )}

              {/* List */}
              <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
                {currentSeriesChapters.length === 0 ? (
                  <div className="text-center text-slate-500 text-xs py-8">
                    {t("No chapters exist for this series yet.")}
                  </div>
                ) : (
                  currentSeriesChapters.map(c => {
                    const chapterTasks = tasks.filter(t => {
                      const cid = typeof t.chapterId === 'object' && t.chapterId !== null ? (t.chapterId as any)._id : t.chapterId;
                      return cid === c._id;
                    });
                    const allApproved = chapterTasks.length > 0 && chapterTasks.every(t => t.status === 'APPROVED');

                    return (
                      <div key={c._id} className="group rounded-md border border-[#2d2d34] bg-[#1e1e24] p-4 transition-colors hover:border-slate-500">
                        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                        <div className="flex items-start sm:items-center gap-4 min-w-0">
                          <div className="w-10 h-10 rounded bg-[#121214] border border-[#2d2d34] flex flex-col items-center justify-center text-slate-300">
                            <span className="text-[9px] font-bold uppercase">{t('Chapter short')}</span>
                            <span className="text-xs font-black">{c.chapterNumber}</span>
                          </div>
                          <div className="min-w-0">
                            <div className="text-sm font-bold text-white flex flex-wrap items-center gap-2">
                              {t("Chapter")} {c.chapterNumber} {c.title && <span className="text-slate-400 font-medium">- {c.title}</span>}
                              <span className={`px-2 py-0.5 rounded text-[9px] font-mono border ${
                                c.status === 'SENT_TO_EDITORIAL'
                                  ? 'bg-green-500/10 border-green-500/40 text-green-400'
                                  : c.status === 'REVISION_REQUESTED'
                                    ? 'bg-red-500/10 border-red-500/40 text-red-400'
                                    : ['SUBMITTED', 'UNDER_REVIEW'].includes(c.status) || allApproved
                                      ? 'bg-[#FFF3B0]/10 border-[#FFF3B0]/40 text-[#FFF3B0]'
                                      : 'bg-slate-500/10 border-slate-500/40 text-slate-400'
                              }`}>
                                {c.status === 'SENT_TO_EDITORIAL' ? t('Ready for Board')
                                  : c.status === 'UNDER_REVIEW' ? t('Editor Final Review')
                                    : c.status === 'SUBMITTED' ? t('Mangaka Review')
                                      : c.status === 'REVISION_REQUESTED' ? t('Revision Requested')
                                        : allApproved ? t('Final Review Complete') : t('In Production')}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-400 mt-1">
                              {c.volumeId && <span className="mr-3 text-red-300">{t('Volume')} {typeof c.volumeId === 'object' ? c.volumeId.volumeNumber : '?'}</span>}
                              {t("Deadline")}: {c.deadline ? new Date(c.deadline).toLocaleDateString(language === "vi" ? "vi-VN" : "en-US") : "N/A"}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity self-end sm:self-auto">
                          <button 
                            onClick={() => goToWorkspace(c)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-black hover:bg-slate-200 text-[10px] font-bold uppercase rounded cursor-pointer"
                          >
                            {t("Workspace")} <ArrowRight className="w-3 h-3" />
                          </button>
                          <button 
                            onClick={() => startEdit(c)}
                            className="p-1.5 bg-[#121214] border border-[#2d2d34] hover:text-white rounded text-slate-400 transition-colors cursor-pointer"
                            title={t("Edit Chapter")}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => handleArchive(c._id)}
                            className="p-1.5 bg-[#121214] border border-[#2d2d34] hover:border-amber-500/50 hover:text-amber-400 rounded text-slate-400 transition-colors cursor-pointer"
                            title={t("Archive Chapter")}
                          >
                            <Archive className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        </div>
                        {currentUser.role === 'MANGAKA' && (
                          <ChapterFeedbackPanel chapter={c} seriesId={activeSeries._id} onChanged={onRefreshAll} />
                        )}                      </div>
                    );
                  })
                )}
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
