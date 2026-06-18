import React, { useState, useEffect } from 'react';
import { User, Series, Rating, Vote, Directive, DirectiveAction } from '../types';
import { apiClient } from '../api/client';
import { CheckSquare, X, Gavel, Plus } from 'lucide-react';

interface EditorialBoardProps {
  currentUser: User;
  series: Series[];
  ratings: Rating[];
  onRefreshAll: () => void;
}

export default function EditorialBoard({
  currentUser,
  series,
  ratings,
  onRefreshAll
}: EditorialBoardProps) {
  const pendingSeries = series.filter(s => s.status === 'PENDING');
  const ITEMS_PER_PAGE = 5;

  const [currentPage, setCurrentPage] = useState(1);
  const [selectedSeries, setSelectedSeries] = useState<Series | null>(null);
  const [modalVotes, setModalVotes] = useState<Vote[]>([]);
  const [modalVoteForm, setModalVoteForm] = useState<{
    decision: 'ACCEPT' | 'REJECT';
    comment: string;
    schedule: 'WEEKLY' | 'MONTHLY';
  }>({ decision: 'ACCEPT', comment: '', schedule: 'WEEKLY' });
  const [modalMessage, setModalMessage] = useState('');
  const [modalSubmitting, setModalSubmitting] = useState(false);
  const [voteCounts, setVoteCounts] = useState<Record<string, Vote[]>>({});

  const [directives, setDirectives] = useState<Directive[]>([]);
  const [showDirectiveForm, setShowDirectiveForm] = useState(false);
  const [dirForm, setDirForm] = useState<{
    seriesId: string;
    actionType: DirectiveAction;
    newSchedule: 'WEEKLY' | 'MONTHLY';
    reason: string;
  }>({ seriesId: '', actionType: 'CANCEL', newSchedule: 'MONTHLY', reason: '' });
  const [dirMsg, setDirMsg] = useState('');
  const [selectedDirective, setSelectedDirective] = useState<Directive | null>(null);
  const [dirVoteForm, setDirVoteForm] = useState<{ decision: 'ACCEPT' | 'REJECT'; comment: string }>({ decision: 'ACCEPT', comment: '' });
  const [dirVoteMsg, setDirVoteMsg] = useState('');
  const [dirVoteSubmitting, setDirVoteSubmitting] = useState(false);

  const activeSeries = series.filter(s => s.status !== 'PENDING' && s.status !== 'CANCELLED' && s.status !== 'REJECTED');

  const fetchVoteCounts = async () => {
    try {
      const results: Record<string, Vote[]> = {};
      for (const s of pendingSeries) {
        const votes = await apiClient.votes.getForSubmission(s._id);
        results[s._id] = Array.isArray(votes) ? votes : (votes as any)?.data || [];
      }
      setVoteCounts(results);
    } catch (err) {
      console.error('Failed to fetch vote counts:', err);
    }
  };

  useEffect(() => {
    if (pendingSeries.length > 0) fetchVoteCounts();
  }, [pendingSeries.length]);

  const totalPages = Math.max(1, Math.ceil(pendingSeries.length / ITEMS_PER_PAGE));
  const paginatedSeries = pendingSeries.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const getVoteTally = (seriesId: string) => {
    const votes = voteCounts[seriesId] || [];
    return {
      accept: votes.filter(v => v.decision === 'ACCEPT').length,
      reject: votes.filter(v => v.decision === 'REJECT').length,
      total: votes.length
    };
  };

  const openSeriesModal = async (s: Series) => {
    setSelectedSeries(s);
    setModalMessage('');
    setModalVoteForm({ decision: 'ACCEPT', comment: '', schedule: 'WEEKLY' });
    try {
      const votes = await apiClient.votes.getForSubmission(s._id);
      const list = Array.isArray(votes) ? votes : (votes as any)?.data || [];
      setModalVotes(list);
    } catch {
      setModalVotes([]);
    }
  };

  const closeModal = () => {
    setSelectedSeries(null);
    setModalVotes([]);
    setModalMessage('');
    setModalSubmitting(false);
  };

  const handleModalVoteSubmit = async () => {
    if (!selectedSeries) return;
    if (!modalVoteForm.comment) {
      setModalMessage('❌ Comment is required for editorial voting.');
      return;
    }
    setModalSubmitting(true);
    try {
      const scheduleParam = modalVoteForm.decision === 'ACCEPT' ? modalVoteForm.schedule : undefined;
      await apiClient.votes.submit(
        selectedSeries._id,
        modalVoteForm.decision,
        modalVoteForm.comment,
        scheduleParam
      );
      const votes = await apiClient.votes.getForSubmission(selectedSeries._id);
      const list = Array.isArray(votes) ? votes : (votes as any)?.data || [];
      setModalVotes(list);
      setModalMessage('🎉 Vote recorded successfully!');
      onRefreshAll();
      setTimeout(fetchVoteCounts, 300);
    } catch (err: any) {
      setModalMessage(`❌ ${err.message}`);
    } finally {
      setModalSubmitting(false);
    }
  };

  const userVote = selectedSeries
    ? modalVotes.find(v => v.voterId === currentUser._id)
    : null;

  const fetchDirectives = async () => {
    try {
      const data = await apiClient.directives.getAll();
      setDirectives(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch directives:', err);
    }
  };

  useEffect(() => {
    fetchDirectives();
  }, []);

  const handleCreateDirective = async () => {
    if (!dirForm.seriesId) { setDirMsg('❌ Select a series.'); return; }
    if (!dirForm.reason.trim()) { setDirMsg('❌ Reason is required.'); return; }
    try {
      await apiClient.directives.create(
        dirForm.seriesId,
        dirForm.actionType,
        dirForm.reason,
        dirForm.actionType === 'CHANGE_FORMAT' ? dirForm.newSchedule : undefined
      );
      setDirMsg('✅ Directive proposal created!');
      setDirForm({ seriesId: '', actionType: 'CANCEL', newSchedule: 'MONTHLY', reason: '' });
      setShowDirectiveForm(false);
      onRefreshAll();
      setTimeout(fetchDirectives, 300);
      setTimeout(() => setDirMsg(''), 5000);
    } catch (err: any) {
      setDirMsg(`❌ ${err.message}`);
    }
  };

  const handleDirectiveVoteSubmit = async () => {
    if (!selectedDirective) return;
    if (!dirVoteForm.comment.trim()) { setDirVoteMsg('❌ Comment required.'); return; }
    setDirVoteSubmitting(true);
    try {
      await apiClient.directives.vote(selectedDirective._id, dirVoteForm.decision, dirVoteForm.comment);
      setDirVoteMsg('✅ Vote recorded!');
      onRefreshAll();
      setTimeout(fetchDirectives, 300);
      // Refresh the selected directive
      const updated = await apiClient.directives.getAll();
      const fresh = (Array.isArray(updated) ? updated : []).find(d => d._id === selectedDirective._id);
      if (fresh) setSelectedDirective(fresh);
    } catch (err: any) {
      setDirVoteMsg(`❌ ${err.message}`);
    } finally {
      setDirVoteSubmitting(false);
    }
  };

  const openDirectiveModal = (d: Directive) => {
    setSelectedDirective(d);
    setDirVoteMsg('');
    setDirVoteForm({ decision: 'ACCEPT', comment: '' });
  };

  const closeDirectiveModal = () => {
    setSelectedDirective(null);
    setDirVoteMsg('');
    setDirVoteSubmitting(false);
  };

  return (
    <div className="space-y-6">
      <header className="mb-8 pb-5 border-b-4 border-ink-black flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="font-syne text-3xl font-black text-ink-black uppercase italic tracking-tight">Editorial Board</h1>
          <p className="font-sans text-xs text-neutral-600 font-bold uppercase tracking-wider mt-1.5 flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 bg-[#E63946]"></span>
            Majority vote required to approve proposals. Vote tally &amp; serialization decisions panel.
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        <section className="xl:col-span-8 flex flex-col gap-6">
          <h2 className="font-syne text-xl font-black uppercase text-ink-black pb-4 border-b-4 border-ink-black flex items-center gap-3 select-none">
            <CheckSquare className="text-[#E63946] w-6 h-6 animate-pulse" />
            Pending Series Voting
            {pendingSeries.length > 0 && (
              <span className="ml-auto text-[10px] font-mono font-black text-neutral-500">
                {pendingSeries.length} PROPOSAL{pendingSeries.length > 1 ? 'S' : ''} AWAITING BOARD DECISION
              </span>
            )}
          </h2>

          <div className="flex flex-col">
            {paginatedSeries.map((item) => {
              const tally = getVoteTally(item._id);
              return (
                <div key={item._id} className="bg-white border-4 border-ink-black border-t-0 first:border-t-4 p-5 flex items-center gap-5 hover:bg-[#F5F5F0] transition-colors">
                  <div className="w-16 h-20 bg-neutral-200 border-2 border-ink-black flex-shrink-0 overflow-hidden">
                    {item.coverImage ? (
                      <img src={item.coverImage} alt={item.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-neutral-400 text-[9px] font-mono font-bold">NO COVER</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-syne text-sm font-black uppercase tracking-tight text-ink-black truncate">{item.title}</h3>
                    <p className="font-sans text-[10px] font-bold text-neutral-500 uppercase mt-0.5">
                      Author: {typeof item.mangakaId === 'object' ? item.mangakaId.name : item.mangakaId}
                    </p>
                    <p className="font-sans text-[10px] text-neutral-400 mt-1 line-clamp-1">{item.synopsis}</p>
                  </div>
                  <div className="flex-shrink-0 text-center px-4 py-2 border-2 border-ink-black bg-[#F5F5F0] min-w-[80px]">
                    <div className="font-mono text-lg font-black text-ink-black">{tally.total}</div>
                    <div className="font-mono text-[8px] font-bold text-neutral-500 uppercase">
                      <span className="text-[#2ECC71]">{tally.accept}Y</span>
                      {' / '}
                      <span className="text-[#E63946]">{tally.reject}N</span>
                    </div>
                  </div>
                  <button onClick={() => openSeriesModal(item)} className="flex-shrink-0 bg-[#E63946] hover:bg-red-600 text-white font-syne text-[10px] font-extrabold uppercase py-2.5 px-5 border-2 border-ink-black shadow-[3px_3px_0px_#141414] active:translate-y-0.5 active:shadow-none transition-all cursor-pointer">
                    Review &amp; Vote
                  </button>
                </div>
              );
            })}
            {pendingSeries.length === 0 && (
              <div className="bg-white border-4 border-dashed border-ink-black rounded-none p-12 text-center text-xs font-mono font-bold text-neutral-500 uppercase select-none">
                🌸 Perfect! All series pitch submissions have been reviewed and voted on. No waiting items.
              </div>
            )}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="bg-white border-2 border-ink-black px-3 py-1.5 font-mono text-[10px] font-bold uppercase hover:bg-[#F5F5F0] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors">
                ← Prev
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button key={page} onClick={() => setCurrentPage(page)} className={`w-9 h-9 border-2 border-ink-black font-mono text-xs font-black transition-colors cursor-pointer ${page === currentPage ? 'bg-ink-black text-white shadow-[2px_2px_0px_#E63946]' : 'bg-white text-ink-black hover:bg-[#F5F5F0]'}`}>
                  {page}
                </button>
              ))}
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="bg-white border-2 border-ink-black px-3 py-1.5 font-mono text-[10px] font-bold uppercase hover:bg-[#F5F5F0] disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors">
                Next →
              </button>
            </div>
          )}
        </section>

        <div className="xl:col-span-4 flex flex-col gap-6">
          {/* Directive Proposals Section */}
          <section className="bg-white border-4 border-ink-black rounded-none p-6 shadow-[4px_4px_0px_#141414]">
            <h2 className="font-syne text-md font-black uppercase text-ink-black border-b-2 border-ink-black pb-3 mb-4 flex items-center gap-2 select-none">
              <Gavel className="text-[#E63946] w-5 h-5" />
              Board Directive Proposals
            </h2>
            <p className="font-sans text-[10px] text-neutral-500 font-bold uppercase tracking-wider mb-4">
              Propose to cancel low-ranking series or change publication format. Majority vote required.
            </p>

            {dirMsg && (
              <div className={`p-3 border-2 mb-3 text-xs font-mono font-bold uppercase select-none leading-normal ${dirMsg.startsWith('✅') ? 'bg-[#2ECC71]/15 text-[#2ECC71] border-[#2ECC71]' : 'bg-[#E63946]/15 text-[#E63946] border-[#E63946]'}`}>
                {dirMsg}
              </div>
            )}

            {/* Active proposals */}
            <div className="space-y-3 mb-4">
              {directives.length === 0 && (
                <div className="bg-[#F5F5F0] border-2 border-dashed border-neutral-300 p-4 text-center text-xs font-mono font-bold text-neutral-400 uppercase">
                  No active directives
                </div>
              )}
              {directives.map(d => {
                const acceptCount = (d.votes || []).filter(v => v.decision === 'ACCEPT').length;
                const rejectCount = (d.votes || []).filter(v => v.decision === 'REJECT').length;
                const totalCount = (d.votes || []).length;
                return (
                  <div key={d._id} className="border-2 border-ink-black p-3 bg-[#F5F5F0] hover:bg-white transition-colors">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1 min-w-0">
                        <span className={`inline-block px-2 py-0.5 text-[8px] font-mono font-black uppercase mr-2 ${d.actionType === 'CANCEL' ? 'bg-[#E63946] text-white' : 'bg-[#FFF3B0] text-ink-black border border-ink-black'}`}>
                          {d.actionType === 'CANCEL' ? 'CANCEL SERIES' : `CHANGE → ${d.newSchedule || 'MONTHLY'}`}
                        </span>
                        <span className="font-syne text-xs font-black text-ink-black truncate">{d.seriesTitle || d.seriesId}</span>
                      </div>
                    </div>
                    <p className="font-sans text-[10px] text-neutral-500 line-clamp-2 mb-2">{d.reason}</p>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex items-center gap-1">
                        <span className="font-mono text-[9px] text-[#2ECC71] font-black">{acceptCount}Y</span>
                        <span className="font-mono text-[9px] text-neutral-400">/</span>
                        <span className="font-mono text-[9px] text-[#E63946] font-black">{rejectCount}N</span>
                        <span className="font-mono text-[9px] text-neutral-400 ml-1">({totalCount} total)</span>
                      </div>
                    </div>
                    <button onClick={() => openDirectiveModal(d)} className="w-full bg-ink-black hover:bg-neutral-800 text-white font-syne text-[9px] font-extrabold uppercase py-2 border-2 border-ink-black shadow-[2px_2px_0px_#E63946] active:translate-y-0.5 active:shadow-none transition-all cursor-pointer">
                      Review & Vote
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Toggle create form */}
            {!showDirectiveForm ? (
              <button onClick={() => { setShowDirectiveForm(true); setDirMsg(''); }} className="w-full flex items-center justify-center gap-2 bg-[#E63946] border-2 border-ink-black hover:bg-red-600 text-white font-syne text-xs uppercase font-extrabold py-3 rounded-none shadow-[2px_2px_0px_#141414] transition-colors cursor-pointer">
                <Plus className="w-4 h-4" />
                Propose New Directive
              </button>
            ) : (
              <div className="border-4 border-ink-black p-4 space-y-3 bg-[#F5F5F0]">
                <div className="flex items-center justify-between mb-1">
                  <h3 className="font-mono text-[10px] font-extrabold uppercase text-ink-black">New Directive Proposal</h3>
                  <button onClick={() => setShowDirectiveForm(false)} className="p-1 hover:bg-white border border-ink-black cursor-pointer">
                    <X className="w-3 h-3" />
                  </button>
                </div>
                <div>
                  <label className="font-mono text-[10px] text-ink-black block mb-1 font-extrabold uppercase">Select Series</label>
                  <select value={dirForm.seriesId} onChange={(e) => setDirForm({ ...dirForm, seriesId: e.target.value })} className="w-full bg-white border-2 border-ink-black rounded-none p-2 font-sans text-xs font-bold text-ink-black focus:outline-none cursor-pointer">
                    <option value="">Choose active series...</option>
                    {activeSeries.map(s => (
                      <option key={s._id} value={s._id}>{s.title} ({s.status}{s.pubSchedule ? ` / ${s.pubSchedule}` : ''})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-mono text-[10px] text-ink-black block mb-1 font-extrabold uppercase">Action Type</label>
                  <select value={dirForm.actionType} onChange={(e) => setDirForm({ ...dirForm, actionType: e.target.value as DirectiveAction })} className="w-full bg-white border-2 border-ink-black rounded-none p-2 font-sans text-xs font-bold text-ink-black focus:outline-none cursor-pointer">
                    <option value="CANCEL">Cancel Series (low ranking)</option>
                    <option value="CHANGE_FORMAT">Change Publication Format</option>
                  </select>
                </div>
                {dirForm.actionType === 'CHANGE_FORMAT' && (
                  <div>
                    <label className="font-mono text-[10px] text-ink-black block mb-1 font-extrabold uppercase">New Schedule</label>
                    <select value={dirForm.newSchedule} onChange={(e) => setDirForm({ ...dirForm, newSchedule: e.target.value as 'WEEKLY' | 'MONTHLY' })} className="w-full bg-white border-2 border-ink-black rounded-none p-2 font-sans text-xs font-bold text-ink-black focus:outline-none cursor-pointer">
                      <option value="WEEKLY">WEEKLY</option>
                      <option value="MONTHLY">MONTHLY</option>
                    </select>
                  </div>
                )}
                <div>
                  <label className="font-mono text-[10px] text-ink-black block mb-1 font-extrabold uppercase">Justification (Required)</label>
                  <textarea rows={3} value={dirForm.reason} onChange={(e) => setDirForm({ ...dirForm, reason: e.target.value })} className="w-full bg-white border-2 border-ink-black rounded-none p-2 font-sans text-xs font-bold text-ink-black focus:outline-none resize-none" placeholder="Explain why this directive is needed (e.g. low reader ranking data)..."></textarea>
                </div>
                <button onClick={handleCreateDirective} className="w-full bg-ink-black hover:bg-neutral-800 text-white font-syne text-xs uppercase font-extrabold py-3 border-2 border-ink-black shadow-[2px_2px_0px_#E63946] active:translate-y-0.5 active:shadow-none transition-all cursor-pointer">
                  Submit Proposal
                </button>
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Vote Detail Modal */}
      {selectedSeries && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={closeModal}></div>
          <div className="relative bg-white border-4 border-ink-black shadow-[8px_8px_0px_#141414] w-full max-w-2xl max-h-[85vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b-4 border-ink-black p-5 flex items-start justify-between z-10">
              <div>
                <h2 className="font-syne text-lg font-black uppercase tracking-tight text-ink-black">{selectedSeries.title}</h2>
                <p className="font-sans text-[10px] font-bold text-neutral-500 uppercase mt-0.5">
                  Author: {typeof selectedSeries.mangakaId === 'object' ? selectedSeries.mangakaId.name : selectedSeries.mangakaId}
                </p>
              </div>
              <button onClick={closeModal} className="p-2 hover:bg-[#F5F5F0] border-2 border-ink-black cursor-pointer transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-5">
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-[#2ECC71]/10 border-2 border-[#2ECC71] p-3 text-center">
                  <div className="font-mono text-2xl font-black text-[#2ECC71]">{modalVotes.filter(v => v.decision === 'ACCEPT').length}</div>
                  <div className="font-mono text-[9px] font-bold text-[#2ECC71] uppercase">Accept</div>
                </div>
                <div className="bg-[#E63946]/10 border-2 border-[#E63946] p-3 text-center">
                  <div className="font-mono text-2xl font-black text-[#E63946]">{modalVotes.filter(v => v.decision === 'REJECT').length}</div>
                  <div className="font-mono text-[9px] font-bold text-[#E63946] uppercase">Reject</div>
                </div>
                <div className="bg-[#F5F5F0] border-2 border-ink-black p-3 text-center">
                  <div className="font-mono text-2xl font-black text-ink-black">{modalVotes.length}</div>
                  <div className="font-mono text-[9px] font-bold text-neutral-500 uppercase">Total Cast</div>
                </div>
              </div>

              <div className="bg-[#F5F5F0] p-4 border-2 border-ink-black">
                <span className="font-mono block text-[10px] uppercase font-extrabold text-[#E63946] mb-1.5">Author Pitch Synopsis:</span>
                <p className="font-sans text-xs leading-relaxed font-bold text-ink-black">{selectedSeries.synopsis}</p>
              </div>

              {modalVotes.length > 0 && (
                <div>
                  <h3 className="font-mono text-[10px] font-extrabold uppercase text-ink-black mb-2">Board Member Votes</h3>
                  <div className="space-y-2">
                    {modalVotes.map(vote => (
                      <div key={vote._id} className={`p-3 border-2 ${vote.decision === 'ACCEPT' ? 'border-[#2ECC71] bg-[#2ECC71]/5' : 'border-[#E63946] bg-[#E63946]/5'}`}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-0.5 text-[8px] font-mono font-black uppercase ${vote.decision === 'ACCEPT' ? 'bg-[#2ECC71] text-white' : 'bg-[#E63946] text-white'}`}>
                            {vote.decision}
                          </span>
                          {vote.schedule && (
                            <span className="px-2 py-0.5 text-[8px] font-mono font-black uppercase bg-[#FFF3B0] text-ink-black border border-ink-black">
                              {vote.schedule}
                            </span>
                          )}
                        </div>
                        <p className="font-sans text-[10px] text-ink-black font-bold">{vote.comment}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!userVote ? (
                <div className="border-4 border-ink-black p-5 space-y-4">
                  <h3 className="font-mono text-[10px] font-extrabold uppercase text-ink-black">Cast Your Vote</h3>
                  {modalMessage && (
                    <div className={`p-3 border-2 text-xs font-mono font-bold uppercase ${modalMessage.startsWith('🎉') ? 'bg-[#2ECC71]/15 text-[#2ECC71] border-[#2ECC71]' : 'bg-[#E63946]/15 text-[#E63946] border-[#E63946]'}`}>
                      {modalMessage}
                    </div>
                  )}
                  <div className="space-y-2">
                    <label className="flex items-center gap-3 p-3 border-2 border-ink-black cursor-pointer hover:bg-[#F5F5F0] text-xs font-bold font-sans uppercase">
                      <input type="radio" name="modal_decision" className="w-4 h-4 text-[#E63946] border-2 border-[#141414] focus:ring-0 cursor-pointer" checked={modalVoteForm.decision === 'ACCEPT'} onChange={() => setModalVoteForm({ ...modalVoteForm, decision: 'ACCEPT' })} />
                      Accept Serialization
                    </label>
                    <label className="flex items-center gap-3 p-3 border-2 border-ink-black cursor-pointer hover:bg-[#F5F5F0] text-xs font-bold font-sans uppercase">
                      <input type="radio" name="modal_decision" className="w-4 h-4 text-[#E63946] border-2 border-[#141414] focus:ring-0 cursor-pointer" checked={modalVoteForm.decision === 'REJECT'} onChange={() => setModalVoteForm({ ...modalVoteForm, decision: 'REJECT' })} />
                      Reject / Revise pitch
                    </label>
                  </div>
                  {modalVoteForm.decision === 'ACCEPT' && (
                    <div className="animate-fadeIn">
                      <label className="block text-[10px] font-mono text-neutral-500 uppercase mb-1 font-bold">Preferred Schedule</label>
                      <select className="bg-white border-2 border-ink-black rounded-none p-2 text-xs w-full focus:outline-none cursor-pointer font-bold" value={modalVoteForm.schedule} onChange={(e) => setModalVoteForm({ ...modalVoteForm, schedule: e.target.value as any })}>
                        <option value="WEEKLY">WEEKLY</option>
                        <option value="MONTHLY">MONTHLY</option>
                      </select>
                    </div>
                  )}
                  <div>
                    <label className="font-mono text-[10px] text-ink-black block font-extrabold uppercase mb-2">Editorial Feedback (Required)</label>
                    <textarea rows={3} className="w-full bg-[#F5F5F0] border-2 border-ink-black rounded-none p-3 font-sans text-xs font-bold text-ink-black placeholder:text-neutral-400 focus:bg-white focus:outline-none resize-none" placeholder="Provide detailed feedback on the proposal..." value={modalVoteForm.comment} onChange={(e) => setModalVoteForm({ ...modalVoteForm, comment: e.target.value })}></textarea>
                  </div>
                  <button onClick={handleModalVoteSubmit} disabled={modalSubmitting} className="w-full bg-[#E63946] hover:bg-red-600 text-white font-syne text-xs font-extrabold uppercase py-3 border-2 border-ink-black shadow-[4px_4px_0px_#141414] active:translate-y-0.5 active:shadow-none transition-all cursor-pointer disabled:opacity-50">
                    {modalSubmitting ? 'Submitting...' : 'Submit Vote'}
                  </button>
                </div>
              ) : (
                <div className={`p-4 border-4 ${userVote.decision === 'ACCEPT' ? 'border-[#2ECC71] bg-[#2ECC71]/10' : 'border-[#E63946] bg-[#E63946]/10'}`}>
                  <p className="font-mono text-xs font-black uppercase mb-1">
                    ✅ You voted: {userVote.decision}
                    {userVote.schedule && ` (${userVote.schedule})`}
                  </p>
                  <p className="font-sans text-[10px] text-neutral-600 font-bold">{userVote.comment}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Directive Vote Modal */}
      {selectedDirective && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={closeDirectiveModal}></div>
          <div className="relative bg-white border-4 border-ink-black shadow-[8px_8px_0px_#141414] w-full max-w-2xl max-h-[85vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b-4 border-ink-black p-5 flex items-start justify-between z-10">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`px-2 py-0.5 text-[9px] font-mono font-black uppercase ${selectedDirective.actionType === 'CANCEL' ? 'bg-[#E63946] text-white' : 'bg-[#FFF3B0] text-ink-black border border-ink-black'}`}>
                    {selectedDirective.actionType === 'CANCEL' ? 'CANCEL SERIES' : `CHANGE → ${selectedDirective.newSchedule || 'MONTHLY'}`}
                  </span>
                </div>
                <h2 className="font-syne text-lg font-black uppercase tracking-tight text-ink-black">{selectedDirective.seriesTitle || selectedDirective.seriesId}</h2>
                <p className="font-sans text-[10px] font-bold text-neutral-500 uppercase mt-0.5">
                  Proposed by: {selectedDirective.proposedByName || selectedDirective.proposedBy}
                </p>
              </div>
              <button onClick={closeDirectiveModal} className="p-2 hover:bg-[#F5F5F0] border-2 border-ink-black cursor-pointer transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-5">
              {/* Tally */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-[#2ECC71]/10 border-2 border-[#2ECC71] p-3 text-center">
                  <div className="font-mono text-2xl font-black text-[#2ECC71]">{(selectedDirective.votes || []).filter(v => v.decision === 'ACCEPT').length}</div>
                  <div className="font-mono text-[9px] font-bold text-[#2ECC71] uppercase">Accept</div>
                </div>
                <div className="bg-[#E63946]/10 border-2 border-[#E63946] p-3 text-center">
                  <div className="font-mono text-2xl font-black text-[#E63946]">{(selectedDirective.votes || []).filter(v => v.decision === 'REJECT').length}</div>
                  <div className="font-mono text-[9px] font-bold text-[#E63946] uppercase">Reject</div>
                </div>
                <div className="bg-[#F5F5F0] border-2 border-ink-black p-3 text-center">
                  <div className="font-mono text-2xl font-black text-ink-black">{(selectedDirective.votes || []).length}</div>
                  <div className="font-mono text-[9px] font-bold text-neutral-500 uppercase">Total Cast</div>
                </div>
              </div>

              {/* Reason */}
              <div className="bg-[#F5F5F0] p-4 border-2 border-ink-black">
                <span className="font-mono block text-[10px] uppercase font-extrabold text-[#E63946] mb-1.5">Justification:</span>
                <p className="font-sans text-xs leading-relaxed font-bold text-ink-black">{selectedDirective.reason}</p>
              </div>

              {/* Existing votes */}
              {(selectedDirective.votes || []).length > 0 && (
                <div>
                  <h3 className="font-mono text-[10px] font-extrabold uppercase text-ink-black mb-2">Board Votes</h3>
                  <div className="space-y-2">
                    {(selectedDirective.votes || []).map(vote => (
                      <div key={vote._id} className={`p-3 border-2 ${vote.decision === 'ACCEPT' ? 'border-[#2ECC71] bg-[#2ECC71]/5' : 'border-[#E63946] bg-[#E63946]/5'}`}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-0.5 text-[8px] font-mono font-black uppercase ${vote.decision === 'ACCEPT' ? 'bg-[#2ECC71] text-white' : 'bg-[#E63946] text-white'}`}>
                            {vote.decision}
                          </span>
                          {vote.voterName && <span className="font-sans text-[9px] text-neutral-500 font-bold">{vote.voterName}</span>}
                        </div>
                        <p className="font-sans text-[10px] text-ink-black font-bold">{vote.comment}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Cast vote form */}
              {selectedDirective.status === 'PENDING' && !(selectedDirective.votes || []).some(v => v.voterId === currentUser._id) ? (
                <div className="border-4 border-ink-black p-5 space-y-4">
                  <h3 className="font-mono text-[10px] font-extrabold uppercase text-ink-black">Cast Your Vote</h3>
                  {dirVoteMsg && (
                    <div className={`p-3 border-2 text-xs font-mono font-bold uppercase ${dirVoteMsg.startsWith('✅') ? 'bg-[#2ECC71]/15 text-[#2ECC71] border-[#2ECC71]' : 'bg-[#E63946]/15 text-[#E63946] border-[#E63946]'}`}>
                      {dirVoteMsg}
                    </div>
                  )}
                  <div className="space-y-2">
                    <label className="flex items-center gap-3 p-3 border-2 border-ink-black cursor-pointer hover:bg-[#F5F5F0] text-xs font-bold font-sans uppercase">
                      <input type="radio" name="dir_decision" className="w-4 h-4 text-[#E63946] border-2 border-[#141414] focus:ring-0 cursor-pointer" checked={dirVoteForm.decision === 'ACCEPT'} onChange={() => setDirVoteForm({ ...dirVoteForm, decision: 'ACCEPT' })} />
                      Approve Directive
                    </label>
                    <label className="flex items-center gap-3 p-3 border-2 border-ink-black cursor-pointer hover:bg-[#F5F5F0] text-xs font-bold font-sans uppercase">
                      <input type="radio" name="dir_decision" className="w-4 h-4 text-[#E63946] border-2 border-[#141414] focus:ring-0 cursor-pointer" checked={dirVoteForm.decision === 'REJECT'} onChange={() => setDirVoteForm({ ...dirVoteForm, decision: 'REJECT' })} />
                      Reject Directive
                    </label>
                  </div>
                  <div>
                    <label className="font-mono text-[10px] text-ink-black block font-extrabold uppercase mb-2">Board Feedback (Required)</label>
                    <textarea rows={3} className="w-full bg-[#F5F5F0] border-2 border-ink-black rounded-none p-3 font-sans text-xs font-bold text-ink-black placeholder:text-neutral-400 focus:bg-white focus:outline-none resize-none" placeholder="Explain your vote..." value={dirVoteForm.comment} onChange={(e) => setDirVoteForm({ ...dirVoteForm, comment: e.target.value })}></textarea>
                  </div>
                  <button onClick={handleDirectiveVoteSubmit} disabled={dirVoteSubmitting} className="w-full bg-[#E63946] hover:bg-red-600 text-white font-syne text-xs font-extrabold uppercase py-3 border-2 border-ink-black shadow-[4px_4px_0px_#141414] active:translate-y-0.5 active:shadow-none transition-all cursor-pointer disabled:opacity-50">
                    {dirVoteSubmitting ? 'Submitting...' : 'Submit Vote'}
                  </button>
                </div>
              ) : (
                <div className={`p-4 border-4 ${(selectedDirective.votes || []).find(v => v.voterId === currentUser._id)?.decision === 'ACCEPT' ? 'border-[#2ECC71] bg-[#2ECC71]/10' : (selectedDirective.votes || []).find(v => v.voterId === currentUser._id) ? 'border-[#E63946] bg-[#E63946]/10' : 'border-neutral-300 bg-neutral-50'}`}>
                  {(selectedDirective.votes || []).find(v => v.voterId === currentUser._id) ? (
                    <div>
                      <p className="font-mono text-xs font-black uppercase mb-1">
                        ✅ You voted: {(selectedDirective.votes || []).find(v => v.voterId === currentUser._id)?.decision}
                      </p>
                      <p className="font-sans text-[10px] text-neutral-600 font-bold">{(selectedDirective.votes || []).find(v => v.voterId === currentUser._id)?.comment}</p>
                    </div>
                  ) : (
                    <p className="font-mono text-xs font-black uppercase text-neutral-400">
                      {selectedDirective.status === 'APPROVED' ? '✅ Directive APPROVED' : selectedDirective.status === 'REJECTED' ? '❌ Directive REJECTED' : 'Voting closed'}
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
