import React, { useState, useEffect } from 'react';
import { User, Series, Rating, Vote, Directive, DirectiveAction } from '../types';
import { apiClient } from '../api/client';
import { CheckSquare, X, Gavel, Plus } from 'lucide-react';
import BoardPublicationPanel from '../features/board/BoardPublicationPanel';
import ReaderMetricsPanel from '../features/board/ReaderMetricsPanel';

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
  // Real backend proposal lists
  const [proposalsList, setProposalsList] = useState<any[]>([]);
  const [boardMembers, setBoardMembers] = useState<User[]>([]);
  const [loadingProposals, setLoadingProposals] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState<any | null>(null);
  const [voterStatus, setVoterStatus] = useState<any>(null);
  const [selectedVoterIds, setSelectedVoterIds] = useState<string[]>([]);

  const ITEMS_PER_PAGE = 5;

  const [currentPage, setCurrentPage] = useState(1);
  const [modalVotes, setModalVotes] = useState<Vote[]>([]);
  const [modalVoteForm, setModalVoteForm] = useState<{
    decision: 'ACCEPT' | 'REJECT';
    comment: string;
    schedule: 'WEEKLY' | 'MONTHLY';
  }>({ decision: 'ACCEPT', comment: '', schedule: 'WEEKLY' });
  const [modalMessage, setModalMessage] = useState('');
  const [modalSubmitting, setModalSubmitting] = useState(false);

  const [submissionsList, setSubmissionsList] = useState<Directive[]>([]);
  const [loadingDirectives, setLoadingDirectives] = useState(false);
  const [directiveError, setDirectiveError] = useState('');
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

  const fetchAllProposals = async () => {
    setLoadingProposals(true);
    try {
      const data = await apiClient.submissions.getAll();
      const pitches = (Array.isArray(data) ? data : [])
        .filter((submission) => submission.submissionType === 'PITCH' && submission.proposalId)
        .map((submission) => ({
          ...submission.proposalId,
          _id: submission._id,
          proposalRecordId: submission.proposalId._id,
          decisionStatus: submission.decisionStatus || 'PENDING',
          requiredVoters: submission.requiredVoters || [],
          seriesId: submission.seriesId || null,
          chairpersonId: submission.chairpersonId || null,
          tiedDecisions: submission.tiedDecisions || [],
        }));
      setProposalsList(pitches);
    } catch (err) {
      console.error('Failed to fetch pitch submissions:', err);
    } finally {
      setLoadingProposals(false);
    }
  };

  const fetchBoardMembers = async () => {
    try {
      const data = await apiClient.users.getAll('BOARD_MEMBER');
      setBoardMembers(data || []);
    } catch (err) {
      console.error('Failed to fetch board members:', err);
    }
  };

  useEffect(() => {
    fetchAllProposals();
    fetchBoardMembers();
    fetchSubmissions();
  }, []);

  const pendingPitches = proposalsList.filter(
    (sub) => ['PENDING', 'TIE_BREAK_REQUIRED'].includes(sub.decisionStatus),
  );

  const totalPages = Math.max(1, Math.ceil(pendingPitches.length / ITEMS_PER_PAGE));
  const paginatedPitches = pendingPitches.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const openProposalModal = async (prop: any) => {
    setSelectedProposal(prop);
    setModalMessage('');
    setModalVoteForm({ decision: 'ACCEPT', comment: '', schedule: 'WEEKLY' });
    setSelectedVoterIds([]);
    try {
      const votes = await apiClient.votes.getForSubmission(prop._id);
      setModalVotes(Array.isArray(votes) ? votes : (votes as any)?.data || []);

      const statusRes = await apiClient.submissions.getVotingStatus(prop._id);
      setVoterStatus(statusRes || null);
    } catch (err) {
      console.error('Failed to open proposal details:', err);
      setModalVotes([]);
      setVoterStatus(null);
    }
  };

  const closeModal = () => {
    setSelectedProposal(null);
    setModalVotes([]);
    setVoterStatus(null);
    setSelectedVoterIds([]);
    setModalMessage('');
    setModalSubmitting(false);
  };

  const handleModalVoteSubmit = async () => {
    if (!selectedProposal) return;
    if (!modalVoteForm.comment.trim()) {
      setModalMessage('❌ Comment is required for editorial voting.');
      return;
    }
    setModalSubmitting(true);
    try {
      const isTieBreak = selectedProposal.decisionStatus === 'TIE_BREAK_REQUIRED';
      const chairId = typeof selectedProposal.chairpersonId === 'object'
        ? selectedProposal.chairpersonId?._id
        : selectedProposal.chairpersonId;
      const tiedDecisions = selectedProposal.tiedDecisions || [];
      if (isTieBreak && chairId !== currentUser._id) {
        throw new Error('Only the assigned chairperson can resolve this tie.');
      }
      if (isTieBreak && !tiedDecisions.includes(modalVoteForm.decision)) {
        throw new Error('Choose one of the tied proposal decisions.');
      }
      if (isTieBreak) {
        await apiClient.votes.tieBreak(
          selectedProposal._id,
          modalVoteForm.decision,
          modalVoteForm.comment.trim(),
        );
      } else {
        const scheduleParam = modalVoteForm.decision === 'ACCEPT' ? modalVoteForm.schedule : undefined;
        await apiClient.votes.submit(
          selectedProposal._id,
          modalVoteForm.decision,
          modalVoteForm.comment.trim(),
          scheduleParam,
        );
      }
      setModalMessage('🎉 Vote recorded successfully!');
      
      const votes = await apiClient.votes.getForSubmission(selectedProposal._id);
      setModalVotes(Array.isArray(votes) ? votes : (votes as any)?.data || []);

      const statusRes = await apiClient.submissions.getVotingStatus(selectedProposal._id);
      setVoterStatus(statusRes || null);

      fetchAllProposals();
      onRefreshAll();
      closeModal();
    } catch (err: any) {
      setModalMessage(`❌ ${err.message}`);
    } finally {
      setModalSubmitting(false);
    }
  };

  const handleAssignVoters = async () => {
    if (!selectedProposal || selectedVoterIds.length === 0) return;
    try {
      await apiClient.submissions.assignVoters(selectedProposal._id, selectedVoterIds);
      const statusRes = await apiClient.submissions.getVotingStatus(selectedProposal._id);
      setVoterStatus(statusRes || null);
      setSelectedVoterIds([]);
      setModalMessage('🎉 Voters assigned successfully!');
      fetchAllProposals();
    } catch (err: any) {
      setModalMessage(`❌ ${err.message}`);
    }
  };

  const userVote = selectedProposal
    ? modalVotes.find((vote) => {
        const voterId = typeof vote.voterId === 'object'
          ? (vote.voterId as any)?._id
          : vote.voterId;
        return voterId === currentUser._id;
      })
    : null;
  const isProposalTieBreak = selectedProposal?.decisionStatus === 'TIE_BREAK_REQUIRED';
  const proposalChairId = typeof selectedProposal?.chairpersonId === 'object'
    ? selectedProposal.chairpersonId?._id
    : selectedProposal?.chairpersonId;
  const canResolveProposalTie = isProposalTieBreak && proposalChairId === currentUser._id;
  const proposalVoteOptions: Array<'ACCEPT' | 'REJECT'> = isProposalTieBreak
    ? selectedProposal?.tiedDecisions || []
    : ['ACCEPT', 'REJECT'];

  const fetchSubmissions = async () => {
    setLoadingDirectives(true);
    setDirectiveError('');
    try {
      const data = await apiClient.directives.getAll();
      setSubmissionsList(Array.isArray(data) ? data : []);
    } catch (err: any) {
      setDirectiveError(err.message || 'Failed to load board directives.');
    } finally {
      setLoadingDirectives(false);
    }
  };

  const handleCreateDirective = async () => {
    if (!dirForm.seriesId) { setDirMsg('❌ Select a series.'); return; }
    if (!dirForm.reason.trim()) { setDirMsg('❌ Reason is required.'); return; }
    try {
      await apiClient.directives.create(
        dirForm.seriesId,
        dirForm.actionType,
        dirForm.reason.trim(),
        dirForm.actionType === 'CHANGE_FORMAT' ? dirForm.newSchedule : undefined,
      );
      setDirMsg('✅ Post-decision submission created!');
      setDirForm({ seriesId: '', actionType: 'CANCEL', newSchedule: 'MONTHLY', reason: '' });
      setShowDirectiveForm(false);
      onRefreshAll();
      setTimeout(fetchSubmissions, 300);
      setTimeout(() => setDirMsg(''), 5000);
    } catch (err: any) {
      setDirMsg(`❌ ${err.message}`);
    }
  };

  const handleSubmissionVoteSubmit = async () => {
    if (!selectedDirective) return;
    if (!dirVoteForm.comment.trim()) { setDirVoteMsg('❌ Comment required.'); return; }
    setDirVoteSubmitting(true);
    try {
      const isTieBreak = selectedDirective.status === 'TIE_BREAK_REQUIRED';
      const submit = isTieBreak
        ? apiClient.directives.tieBreak
        : apiClient.directives.vote;
      await submit(selectedDirective._id, dirVoteForm.decision, dirVoteForm.comment.trim());
      setDirVoteMsg('✅ Vote recorded!');
      onRefreshAll();
      setTimeout(fetchSubmissions, 300);
      closeDirectiveModal();
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

  const currentDirectiveVote = selectedDirective?.votes?.find((vote) => {
    const voterId = typeof vote.voterId === 'object'
      ? (vote.voterId as any)?._id
      : vote.voterId;
    return voterId === currentUser._id;
  });
  const directiveChairId = typeof selectedDirective?.chairpersonId === 'object'
    ? selectedDirective.chairpersonId?._id
    : selectedDirective?.chairpersonId;
  const canResolveDirectiveTie =
    selectedDirective?.status === 'TIE_BREAK_REQUIRED' && directiveChairId === currentUser._id;

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

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,3fr)_minmax(320px,2fr)] gap-6 items-start">
        <BoardPublicationPanel
          currentUser={currentUser}
          boardMembers={boardMembers}
          onChanged={() => {
            onRefreshAll();
          }}
        />
        <ReaderMetricsPanel
          series={activeSeries}
          ratings={ratings}
          onChanged={onRefreshAll}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        <section className="xl:col-span-8 flex flex-col gap-6">
          <h2 className="font-syne text-xl font-black uppercase text-ink-black pb-4 border-b-4 border-ink-black flex items-center gap-3 select-none">
            <CheckSquare className="text-[#E63946] w-6 h-6 animate-pulse" />
            Pending Series Voting
            {pendingPitches.length > 0 && (
              <span className="ml-auto text-[10px] font-mono font-black text-neutral-500">
                {pendingPitches.length} PROPOSAL{pendingPitches.length > 1 ? 'S' : ''} AWAITING BOARD DECISION
              </span>
            )}
          </h2>

          <div className="flex flex-col">
            {paginatedPitches.map((item) => {
              const prop = item;
              const totalRequired = item.requiredVoters ? item.requiredVoters.length : 0;
              const votedCount = item.requiredVoters ? item.requiredVoters.filter((v: any) => v.hasVoted).length : 0;

              return (
                <div key={item._id} className="bg-white border-4 border-ink-black border-t-0 first:border-t-4 p-5 flex items-center gap-5 hover:bg-manuscript-gray transition-colors">
                  <div className="w-16 h-20 bg-neutral-200 border-2 border-ink-black shrink-0-0 overflow-hidden">
                    <div className="w-full h-full flex items-center justify-center text-neutral-400 text-[9px] font-mono font-bold">NO COVER</div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-syne text-sm font-black uppercase tracking-tight text-ink-black truncate">{prop.title || 'Untitled'}</h3>
                    <p className="font-sans text-[10px] font-bold text-neutral-500 uppercase mt-0.5">
                      Author: {prop.mangakaId ? (prop.mangakaId as any).name || 'Mangaka' : 'Mangaka'}
                    </p>
                    <p className="font-sans text-[10px] text-neutral-400 mt-1 line-clamp-1">{prop.synopsis || ''}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className="px-2 py-0.5 text-[8px] font-mono font-black uppercase bg-[#FFF3B0] text-ink-black border border-ink-black">
                        {prop.genre || 'N/A'}
                      </span>
                      {item.decisionStatus === 'TIE_BREAK_REQUIRED' && (
                        <span className="px-2 py-0.5 text-[8px] font-mono font-black uppercase bg-[#E63946] text-white border border-ink-black">
                          Tie-break required
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="shrink-0-0 text-center px-4 py-2 border-2 border-ink-black bg-manuscript-gray min-w-[100px]">
                    <div className="font-mono text-xs font-black text-ink-black">Voters Status</div>
                    <div className="font-mono text-sm font-black text-[#E63946]">
                      {votedCount}/{totalRequired}
                    </div>
                  </div>
                  <button onClick={() => openProposalModal(item)} className="shrink-0-0 bg-[#E63946] hover:bg-red-600 text-white font-syne text-[10px] font-extrabold uppercase py-2.5 px-5 border-2 border-ink-black shadow-[3px_3px_0px_#141414] active:translate-y-0.5 active:shadow-none transition-all cursor-pointer">
                    Review &amp; Vote
                  </button>
                </div>
              );
            })}
            {pendingPitches.length === 0 && (
              <div className="bg-white border-4 border-dashed border-ink-black rounded-none p-12 text-center text-xs font-mono font-bold text-neutral-500 uppercase select-none">
                🌸 Perfect! All series proposals have been reviewed and voted on. No waiting items.
              </div>
            )}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 pt-4">
              <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="bg-white border-2 border-ink-black px-3 py-1.5 font-mono text-[10px] font-bold uppercase hover:bg-manuscript-gray disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors">
                ← Prev
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                <button key={page} onClick={() => setCurrentPage(page)} className={`w-9 h-9 border-2 border-ink-black font-mono text-xs font-black transition-colors cursor-pointer ${page === currentPage ? 'bg-ink-black text-white shadow-[2px_2px_0px_#E63946]' : 'bg-white text-ink-black hover:bg-manuscript-gray'}`}>
                  {page}
                </button>
              ))}
              <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="bg-white border-2 border-ink-black px-3 py-1.5 font-mono text-[10px] font-bold uppercase hover:bg-manuscript-gray disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors">
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
              Propose to continue, cancel, or change a series format. Majority vote required.
            </p>

            {dirMsg && (
              <div className={`p-3 border-2 mb-3 text-xs font-mono font-bold uppercase select-none leading-normal ${dirMsg.startsWith('✅') ? 'bg-status-success/15 text-status-success border-status-success' : 'bg-[#E63946]/15 text-[#E63946] border-[#E63946]'}`}>
                {dirMsg}
              </div>
            )}

            {/* Active proposals */}
            <div className="space-y-3 mb-4">
              {loadingDirectives && (
                <div className="bg-manuscript-gray border-2 border-neutral-300 p-4 text-center text-xs font-mono font-bold text-neutral-500 uppercase">
                  Loading directives...
                </div>
              )}
              {directiveError && (
                <div className="bg-[#E63946]/10 border-2 border-[#E63946] p-3 text-xs font-mono font-bold text-[#E63946]">{directiveError}</div>
              )}
              {!loadingDirectives && submissionsList.length === 0 && (
                <div className="bg-manuscript-gray border-2 border-dashed border-neutral-300 p-4 text-center text-xs font-mono font-bold text-neutral-400 uppercase">
                  No active post-decision directives
                </div>
              )}
              {submissionsList.map(d => {
                const acceptCount = (d.votes || []).filter(v => v.decision === 'ACCEPT').length;
                const rejectCount = (d.votes || []).filter(v => v.decision === 'REJECT').length;
                const totalCount = (d.votes || []).length;
                const seriesIdObj = d.seriesId as any;
                const targetSeriesId = seriesIdObj && typeof seriesIdObj === 'object' ? seriesIdObj._id : seriesIdObj;
                return (
                  <div key={d._id} className="border-2 border-ink-black p-3 bg-manuscript-gray hover:bg-white transition-colors">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex-1 min-w-0">
                        {d.actionType === 'CONTINUE' && (
                          <span className="inline-block px-2 py-0.5 text-[8px] font-mono font-black uppercase mr-2 bg-status-success/15 text-green-800 border border-status-success">CONTINUE SERIES</span>
                        )}
                        <span className={`inline-block px-2 py-0.5 text-[8px] font-mono font-black uppercase mr-2 ${d.actionType === 'CONTINUE' ? 'hidden' : d.actionType === 'CANCEL' ? 'bg-[#E63946] text-white' : 'bg-[#FFF3B0] text-ink-black border border-ink-black'}`}>
                          {d.actionType === 'CANCEL' ? 'CANCEL SERIES' : `CHANGE → ${d.newSchedule || 'MONTHLY'}`}
                        </span>
                        <span className="inline-block px-2 py-0.5 text-[8px] font-mono font-black uppercase mr-2 border border-ink-black bg-white">
                          {d.status.replaceAll('_', ' ')}
                        </span>
                        <span className="font-syne text-xs font-black text-ink-black truncate">{d.seriesTitle || targetSeriesId}</span>
                      </div>
                      {d.seriesId && (
                        <a
                          href={`/editor/series/${targetSeriesId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="shrink-0 inline-flex items-center gap-1 px-2 py-1 bg-ink-black text-white text-[8px] font-mono font-extrabold uppercase border-2 border-ink-black hover:bg-neutral-800 transition-colors shadow-[1px_1px_0px_#E63946] cursor-pointer"
                        >
                          <svg className="w-2.5 h-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                          </svg>
                          Series
                        </a>
                      )}
                    </div>
                    <p className="font-sans text-[10px] text-neutral-500 line-clamp-2 mb-2">{d.reason}</p>
                    <div className="flex items-center gap-3 mb-2">
                      <div className="flex items-center gap-1">
                        <span className="font-mono text-[9px] text-status-success font-black">{acceptCount}Y</span>
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
              <div className="border-4 border-ink-black p-4 space-y-3 bg-manuscript-gray">
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
                    <option value="CONTINUE">Continue Series</option>
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
      {/* Vote Detail Modal */}
      {selectedProposal && (() => {
        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/70" onClick={closeModal}></div>
            <div className="relative bg-white border-4 border-ink-black shadow-[8px_8px_0px_#141414] w-full max-w-2xl max-h-[85vh] overflow-y-auto">
              <div className="sticky top-0 bg-white border-b-4 border-ink-black p-5 flex items-start justify-between z-10">
                <div>
                  <h2 className="font-syne text-lg font-black uppercase tracking-tight text-ink-black">{selectedProposal.title}</h2>
                  <p className="font-sans text-[10px] font-bold text-neutral-500 uppercase mt-0.5">
                    Author: {typeof selectedProposal.mangakaId === 'object' && selectedProposal.mangakaId !== null ? (selectedProposal.mangakaId as any).name : 'Mangaka'}
                  </p>
                </div>
                <button onClick={closeModal} className="p-2 hover:bg-manuscript-gray border-2 border-ink-black cursor-pointer transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="p-5 space-y-5">
                <div className="grid grid-cols-3 gap-3">
                  <div className="bg-status-success/10 border-2 border-status-success p-3 text-center">
                    <div className="font-mono text-2xl font-black text-status-success">{modalVotes.filter(v => v.decision === 'ACCEPT').length}</div>
                    <div className="font-mono text-[9px] font-bold text-status-success uppercase">Accept</div>
                  </div>
                  <div className="bg-[#E63946]/10 border-2 border-[#E63946] p-3 text-center">
                    <div className="font-mono text-2xl font-black text-[#E63946]">{modalVotes.filter(v => v.decision === 'REJECT').length}</div>
                    <div className="font-mono text-[9px] font-bold text-[#E63946] uppercase">Reject</div>
                  </div>
                  <div className="bg-manuscript-gray border-2 border-ink-black p-3 text-center">
                    <div className="font-mono text-2xl font-black text-ink-black">{modalVotes.length}</div>
                    <div className="font-mono text-[9px] font-bold text-neutral-500 uppercase">Total Cast</div>
                  </div>
                </div>

                <div className="bg-manuscript-gray p-4 border-2 border-ink-black">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <span className="font-mono block text-[10px] uppercase font-extrabold text-[#E63946] mb-1.5">Author Pitch Synopsis:</span>
                      <p className="font-sans text-xs leading-relaxed font-bold text-ink-black">{selectedProposal.synopsis}</p>
                    </div>
                    <div className="shrink-0 flex flex-col gap-2">
                      {selectedProposal.seriesId && (
                        <a
                          href={`/editor/series/${selectedProposal.seriesId}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-3 py-2 bg-ink-black text-white text-[9px] font-mono font-extrabold uppercase border-2 border-ink-black hover:bg-neutral-800 transition-colors shadow-[2px_2px_0px_#E63946] cursor-pointer"
                        >
                          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                          </svg>
                          View Series
                        </a>
                      )}
                      <button
                        onClick={async () => {
                          try {
                            await apiClient.proposals.downloadStoryboard(selectedProposal.proposalRecordId);
                          } catch (err) {
                            console.error('Download failed', err);
                            alert('Failed to download storyboard');
                          }
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#E63946] text-white text-[9px] font-mono font-extrabold uppercase border-2 border-ink-black hover:bg-red-600 transition-colors shadow-[2px_2px_0px_#141414] cursor-pointer"
                      >
                        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                        Download Storyboard
                      </button>
                    </div>
                  </div>
                </div>

                {/* Voter Assignment Section */}
                {!isProposalTieBreak && (
                <div className="bg-manuscript-gray p-4 border-2 border-ink-black space-y-3">
                  <span className="font-mono block text-[10px] uppercase font-extrabold text-[#E63946] mb-1">Assign Required Voters:</span>
                  
                  {/* Current voters list */}
                  {voterStatus && voterStatus.voters && voterStatus.voters.length > 0 && (
                    <div className="space-y-1 mb-3">
                      <p className="font-sans text-[10px] font-bold text-neutral-500 uppercase">Assigned Board Members:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {voterStatus.voters.map((v: any) => (
                          <span key={v.userId?._id || v.userId} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-mono border ${
                            v.hasVoted 
                              ? 'bg-status-success/10 border-status-success text-status-success' 
                              : 'bg-[#E63946]/10 border-[#E63946] text-[#E63946]'
                          }`}>
                            {v.userId?.name || 'Unknown'} {v.hasVoted ? '✓' : '✗'}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Dropdown / list of available board members to add */}
                  <div className="flex gap-2">
                    <select 
                      multiple
                      value={selectedVoterIds}
                      onChange={(e) => {
                        const options = Array.from(e.target.selectedOptions, option => option.value);
                        setSelectedVoterIds(options);
                      }}
                      className="flex-1 bg-white border-2 border-ink-black p-2 font-sans text-xs text-ink-black focus:outline-none h-20"
                    >
                      {boardMembers
                        .filter(m => !voterStatus?.voters?.some((v: any) => (v.userId?._id || v.userId) === m._id))
                        .map(m => (
                          <option key={m._id} value={m._id}>{m.name}</option>
                        ))
                      }
                    </select>
                    <button 
                      onClick={handleAssignVoters}
                      disabled={selectedVoterIds.length === 0}
                      className="bg-ink-black hover:bg-neutral-800 text-white font-syne text-[10px] font-extrabold uppercase px-4 border-2 border-ink-black shadow-[2px_2px_0px_#E63946] active:translate-y-0.5 active:shadow-none transition-all disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                    >
                      Assign Voters
                    </button>
                  </div>
                  <p className="text-[8px] text-neutral-400 font-sans leading-none mt-1">Hold Ctrl/Cmd to select multiple members.</p>
                </div>
                )}

                {modalVotes.length > 0 && (
                  <div>
                    <h3 className="font-mono text-[10px] font-extrabold uppercase text-ink-black mb-2">Board Member Votes</h3>
                    <div className="space-y-2">
                      {modalVotes.map(vote => (
                        <div key={vote._id} className={`p-3 border-2 ${vote.decision === 'ACCEPT' ? 'border-status-success bg-status-success/5' : 'border-[#E63946] bg-[#E63946]/5'}`}>
                          <div className="flex items-center gap-2 mb-1">
                            <span className={`px-2 py-0.5 text-[8px] font-mono font-black uppercase ${vote.decision === 'ACCEPT' ? 'bg-status-success text-white' : 'bg-[#E63946] text-white'}`}>
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

                {(() => {
                  const isAssigned = voterStatus?.voters?.some(
                    (v: any) => (v.userId?._id || v.userId) === currentUser._id
                  );
                  if (isProposalTieBreak && !canResolveProposalTie) {
                    return (
                      <div className="bg-[#FFF3B0]/40 border-4 border-[#FFF3B0] p-5 text-center">
                        <p className="font-mono text-xs font-black uppercase text-ink-black mb-1">Tie-break pending</p>
                        <p className="font-sans text-[10px] text-neutral-600 font-bold">
                          Only the assigned chairperson can choose between the tied decisions.
                        </p>
                      </div>
                    );
                  }
                  if (!isProposalTieBreak && !isAssigned && !userVote) {
                    return (
                      <div className="bg-neutral-100 border-4 border-dashed border-neutral-400 p-5 text-center">
                        <p className="font-mono text-xs font-black uppercase text-neutral-500 mb-1">Currently not Assigned</p>
                        <p className="font-sans text-[10px] text-neutral-400 font-bold">
                          You are not assigned as a voter for this submission. Assign yourself or wait for assignment.
                        </p>
                      </div>
                    );
                  }
                  if (!isProposalTieBreak && userVote) {
                    return (
                      <div className={`p-4 border-4 ${userVote.decision === 'ACCEPT' ? 'border-status-success bg-status-success/10' : 'border-[#E63946] bg-[#E63946]/10'}`}>
                        <p className="font-mono text-xs font-black uppercase mb-1">
                          ✅ You voted: {userVote.decision}
                          {userVote.schedule && ` (${userVote.schedule})`}
                        </p>
                        <p className="font-sans text-[10px] text-neutral-600 font-bold">{userVote.comment}</p>
                      </div>
                    );
                  }
                  return (
                    <div className="border-4 border-ink-black p-5 space-y-4">
                      <h3 className="font-mono text-[10px] font-extrabold uppercase text-ink-black">
                        {isProposalTieBreak ? 'Chairperson Tie-break' : 'Cast Your Vote'}
                      </h3>
                      {modalMessage && (
                        <div className={`p-3 border-2 text-xs font-mono font-bold uppercase ${modalMessage.startsWith('🎉') ? 'bg-status-success/15 text-status-success border-status-success' : 'bg-[#E63946]/15 text-[#E63946] border-[#E63946]'}`}>
                          {modalMessage}
                        </div>
                      )}
                      <div className="space-y-2">
                        {proposalVoteOptions.map((option) => (
                          <label key={option} className="flex items-center gap-3 p-3 border-2 border-ink-black cursor-pointer hover:bg-manuscript-gray text-xs font-bold font-sans uppercase">
                            <input
                              type="radio"
                              name="modal_decision"
                              className="w-4 h-4 text-[#E63946] border-2 border-[#141414] focus:ring-0 cursor-pointer"
                              checked={modalVoteForm.decision === option}
                              onChange={() => setModalVoteForm({ ...modalVoteForm, decision: option })}
                            />
                            {option === 'ACCEPT' ? 'Accept Serialization' : 'Reject / Revise pitch'}
                          </label>
                        ))}
                      </div>
                      {!isProposalTieBreak && modalVoteForm.decision === 'ACCEPT' && (
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
                        <textarea rows={3} className="w-full bg-manuscript-gray border-2 border-ink-black rounded-none p-3 font-sans text-xs font-bold text-ink-black placeholder:text-neutral-400 focus:bg-white focus:outline-none resize-none" placeholder="Provide detailed feedback on the proposal..." value={modalVoteForm.comment} onChange={(e) => setModalVoteForm({ ...modalVoteForm, comment: e.target.value })}></textarea>
                      </div>
                      <button onClick={handleModalVoteSubmit} disabled={modalSubmitting} className="w-full bg-[#E63946] hover:bg-red-600 text-white font-syne text-xs font-extrabold uppercase py-3 border-2 border-ink-black shadow-[4px_4px_0px_#141414] active:translate-y-0.5 active:shadow-none transition-all cursor-pointer disabled:opacity-50">
                        {modalSubmitting ? 'Submitting...' : isProposalTieBreak ? 'Resolve Tie' : 'Submit Vote'}
                      </button>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        );
      })()}

      {/* Directive Vote Modal */}
      {selectedDirective && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70" onClick={closeDirectiveModal}></div>
          <div className="relative bg-white border-4 border-ink-black shadow-[8px_8px_0px_#141414] w-full max-w-2xl max-h-[85vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b-4 border-ink-black p-5 flex items-start justify-between z-10">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  {selectedDirective.actionType === 'CONTINUE' && (
                    <span className="px-2 py-0.5 text-[9px] font-mono font-black uppercase bg-status-success/15 text-green-800 border border-status-success">CONTINUE SERIES</span>
                  )}
                  <span className={`px-2 py-0.5 text-[9px] font-mono font-black uppercase ${selectedDirective.actionType === 'CONTINUE' ? 'hidden' : selectedDirective.actionType === 'CANCEL' ? 'bg-[#E63946] text-white' : 'bg-[#FFF3B0] text-ink-black border border-ink-black'}`}>
                    {selectedDirective.actionType === 'CANCEL' ? 'CANCEL SERIES' : `CHANGE → ${selectedDirective.newSchedule || 'MONTHLY'}`}
                  </span>
                  <span className="px-2 py-0.5 text-[9px] font-mono font-black uppercase border border-ink-black bg-white">
                    {selectedDirective.status.replaceAll('_', ' ')}
                  </span>
                </div>
                <h2 className="font-syne text-lg font-black uppercase tracking-tight text-ink-black">{selectedDirective.seriesTitle || selectedDirective.seriesId}</h2>
                <p className="font-sans text-[10px] font-bold text-neutral-500 uppercase mt-0.5">
                  Proposed by: {selectedDirective.proposedByName || selectedDirective.proposedBy}
                </p>
              </div>
              <button onClick={closeDirectiveModal} className="p-2 hover:bg-manuscript-gray border-2 border-ink-black cursor-pointer transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-5 space-y-5">
              {/* Tally */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-status-success/10 border-2 border-status-success p-3 text-center">
                  <div className="font-mono text-2xl font-black text-status-success">{(selectedDirective.votes || []).filter(v => v.decision === 'ACCEPT').length}</div>
                  <div className="font-mono text-[9px] font-bold text-status-success uppercase">Accept</div>
                </div>
                <div className="bg-[#E63946]/10 border-2 border-[#E63946] p-3 text-center">
                  <div className="font-mono text-2xl font-black text-[#E63946]">{(selectedDirective.votes || []).filter(v => v.decision === 'REJECT').length}</div>
                  <div className="font-mono text-[9px] font-bold text-[#E63946] uppercase">Reject</div>
                </div>
                <div className="bg-manuscript-gray border-2 border-ink-black p-3 text-center">
                  <div className="font-mono text-2xl font-black text-ink-black">{(selectedDirective.votes || []).length}</div>
                  <div className="font-mono text-[9px] font-bold text-neutral-500 uppercase">Total Cast</div>
                </div>
              </div>

              {/* Reason */}
              <div className="bg-manuscript-gray p-4 border-2 border-ink-black">
                <span className="font-mono block text-[10px] uppercase font-extrabold text-[#E63946] mb-1.5">Justification:</span>
                <p className="font-sans text-xs leading-relaxed font-bold text-ink-black">{selectedDirective.reason}</p>
              </div>

              {/* Existing votes */}
              {(selectedDirective.votes || []).length > 0 && (
                <div>
                  <h3 className="font-mono text-[10px] font-extrabold uppercase text-ink-black mb-2">Board Votes</h3>
                  <div className="space-y-2">
                    {(selectedDirective.votes || []).map(vote => (
                      <div key={vote._id} className={`p-3 border-2 ${vote.decision === 'ACCEPT' ? 'border-status-success bg-status-success/5' : 'border-[#E63946] bg-[#E63946]/5'}`}>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`px-2 py-0.5 text-[8px] font-mono font-black uppercase ${vote.decision === 'ACCEPT' ? 'bg-status-success text-white' : 'bg-[#E63946] text-white'}`}>
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
              {(selectedDirective.status === 'PENDING' && !currentDirectiveVote) || canResolveDirectiveTie ? (
                <div className="border-4 border-ink-black p-5 space-y-4">
                  <h3 className="font-mono text-[10px] font-extrabold uppercase text-ink-black">{canResolveDirectiveTie ? 'Chairperson Tie-break' : 'Cast Your Vote'}</h3>
                  {dirVoteMsg && (
                    <div className={`p-3 border-2 text-xs font-mono font-bold uppercase ${dirVoteMsg.startsWith('✅') ? 'bg-status-success/15 text-status-success border-status-success' : 'bg-[#E63946]/15 text-[#E63946] border-[#E63946]'}`}>
                      {dirVoteMsg}
                    </div>
                  )}
                  <div className="space-y-2">
                    <label className="flex items-center gap-3 p-3 border-2 border-ink-black cursor-pointer hover:bg-manuscript-gray text-xs font-bold font-sans uppercase">
                      <input type="radio" name="dir_decision" className="w-4 h-4 text-[#E63946] border-2 border-[#141414] focus:ring-0 cursor-pointer" checked={dirVoteForm.decision === 'ACCEPT'} onChange={() => setDirVoteForm({ ...dirVoteForm, decision: 'ACCEPT' })} />
                      Approve Directive
                    </label>
                    <label className="flex items-center gap-3 p-3 border-2 border-ink-black cursor-pointer hover:bg-manuscript-gray text-xs font-bold font-sans uppercase">
                      <input type="radio" name="dir_decision" className="w-4 h-4 text-[#E63946] border-2 border-[#141414] focus:ring-0 cursor-pointer" checked={dirVoteForm.decision === 'REJECT'} onChange={() => setDirVoteForm({ ...dirVoteForm, decision: 'REJECT' })} />
                      Reject Directive
                    </label>
                  </div>
                  <div>
                    <label className="font-mono text-[10px] text-ink-black block font-extrabold uppercase mb-2">Board Feedback (Required)</label>
                    <textarea rows={3} className="w-full bg-manuscript-gray border-2 border-ink-black rounded-none p-3 font-sans text-xs font-bold text-ink-black placeholder:text-neutral-400 focus:bg-white focus:outline-none resize-none" placeholder="Explain your vote..." value={dirVoteForm.comment} onChange={(e) => setDirVoteForm({ ...dirVoteForm, comment: e.target.value })}></textarea>
                  </div>
                  <button onClick={handleSubmissionVoteSubmit} disabled={dirVoteSubmitting} className="w-full bg-[#E63946] hover:bg-red-600 text-white font-syne text-xs font-extrabold uppercase py-3 border-2 border-ink-black shadow-[4px_4px_0px_#141414] active:translate-y-0.5 active:shadow-none transition-all cursor-pointer disabled:opacity-50">
                    {dirVoteSubmitting ? 'Submitting...' : canResolveDirectiveTie ? 'Resolve Tie' : 'Submit Vote'}
                  </button>
                </div>
              ) : (
                <div className={`p-4 border-4 ${currentDirectiveVote?.decision === 'ACCEPT' ? 'border-status-success bg-status-success/10' : currentDirectiveVote ? 'border-[#E63946] bg-[#E63946]/10' : 'border-neutral-300 bg-neutral-50'}`}>
                  {currentDirectiveVote ? (
                    <div>
                      <p className="font-mono text-xs font-black uppercase mb-1">
                        ✅ You voted: {currentDirectiveVote.decision}
                      </p>
                      <p className="font-sans text-[10px] text-neutral-600 font-bold">{currentDirectiveVote.comment}</p>
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
