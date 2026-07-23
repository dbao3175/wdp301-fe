import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { BookCheck, ChevronDown, Gavel, LoaderCircle, RefreshCw } from 'lucide-react';
import { apiClient } from '../../api/client';
import {
  BoardPublication,
  PublicationDecision,
  PubSchedule,
  User,
} from '../../types';

interface BoardPublicationPanelProps {
  currentUser: User;
  boardMembers: User[];
  onChanged: () => void;
}

const idOf = (value: unknown): string => {
  if (typeof value === 'string') return value;
  if (value && typeof value === 'object' && '_id' in value) {
    return String((value as { _id: unknown })._id);
  }
  return '';
};

const normalizePublication = (value: any): BoardPublication => {
  if (value?.chapter) {
    return {
      chapter: value.chapter,
      tasks: Array.isArray(value.tasks) ? value.tasks : value.chapter.tasks || [],
      pages: Array.isArray(value.pages) ? value.pages : value.chapter.pages || [],
      session: value.session ?? null,
      votes: Array.isArray(value.votes) ? value.votes : value.session?.votes || [],
      tally: value.tally || value.session?.tally,
    };
  }

  const chapter = value?.chapterId && typeof value.chapterId === 'object'
    ? value.chapterId
    : value?.chapter || {};
  return {
    chapter,
    tasks: Array.isArray(value?.tasks) ? value.tasks : chapter.tasks || [],
    pages: Array.isArray(value?.pages) ? value.pages : chapter.pages || [],
    session: value?.session || (value?._id ? value : null),
    votes: Array.isArray(value?.votes) ? value.votes : [],
    tally: value?.tally,
  };
};

const statusClass = (status: string) => {
  if (status === 'TIE_BREAK_REQUIRED') return 'bg-[#FFF3B0] text-ink-black border-ink-black';
  if (['APPROVED', 'PUBLISHED', 'RESCHEDULED'].includes(status)) {
    return 'bg-status-success/15 text-green-800 border-status-success';
  }
  if (['REJECTED', 'REVISION_REQUESTED'].includes(status)) {
    return 'bg-[#E63946]/10 text-[#E63946] border-[#E63946]';
  }
  return 'bg-manuscript-gray text-neutral-600 border-neutral-400';
};

export default function BoardPublicationPanel({
  currentUser,
  boardMembers,
  onChanged,
}: BoardPublicationPanelProps) {
  const [items, setItems] = useState<BoardPublication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeChapterId, setActiveChapterId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [decision, setDecision] = useState<PublicationDecision>('PUBLISH');
  const [comment, setComment] = useState('');
  const [newSchedule, setNewSchedule] = useState<PubSchedule>('WEEKLY');
  const [voterIds, setVoterIds] = useState<string[]>([]);
  const [chairpersonId, setChairpersonId] = useState('');

  const toggleVoter = (id: string) => {
    setVoterIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await apiClient.boardPublications.getAll();
      const list = Array.isArray(response)
        ? response
        : Array.isArray((response as any)?.data)
          ? (response as any).data
          : [];
      setItems(list.map(normalizePublication));
    } catch (err: any) {
      setError(err.message || 'Unable to load publication reviews.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const selected = useMemo(
    () => items.find((item) => idOf(item.chapter) === activeChapterId),
    [activeChapterId, items],
  );

  const resetForm = () => {
    setComment('');
    setDecision('PUBLISH');
    setNewSchedule('WEEKLY');
    setVoterIds([]);
    setChairpersonId('');
  };

  const runAndRefresh = async (action: () => Promise<unknown>, successMessage: string) => {
    setSubmitting(true);
    setMessage('');
    try {
      await action();
      setMessage(successMessage);
      resetForm();
      await load();
      onChanged();
    } catch (err: any) {
      setMessage(err.message || 'The board action could not be completed.');
    } finally {
      setSubmitting(false);
    }
  };

  const openSession = async () => {
    if (!selected) return;
    if (voterIds.length === 0) {
      setMessage('Select at least one required voter.');
      return;
    }
    if (!chairpersonId) {
      setMessage('Select a chairperson for tie-break decisions.');
      return;
    }
    await runAndRefresh(
      () => apiClient.boardPublications.open(idOf(selected.chapter), {
        voterIds,
        chairpersonId,
        newSchedule,
      }),
      'Publication voting session opened.',
    );
  };

  const submitVote = async (tieBreak = false) => {
    if (!selected?.session?._id) return;
    const tiedDecisions = selected.session.tiedDecisions || [];
    if (tieBreak && !tiedDecisions.includes(decision)) {
      setMessage('Choose one of the tied publication decisions.');
      return;
    }
    if (!comment.trim()) {
      setMessage('A board comment is required.');
      return;
    }
    const submit = tieBreak
      ? apiClient.boardPublications.tieBreak
      : apiClient.boardPublications.vote;
    await runAndRefresh(
      () => submit(selected.session!._id, decision, comment.trim()),
      tieBreak ? 'Tie-break decision recorded.' : 'Publication vote recorded.',
    );
  };

  return (
    <section className="bg-white border-4 border-ink-black shadow-[4px_4px_0px_#141414]">
      <div className="p-5 border-b-4 border-ink-black flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-syne text-lg font-black uppercase flex items-center gap-2">
            <BookCheck className="w-5 h-5 text-[#E63946]" />
            Chapter Publication Review
          </h2>
          <p className="font-mono text-[9px] text-neutral-500 font-bold uppercase mt-1">
            Open a voting session, review the tally, and decide publication.
          </p>
        </div>
        <button
          type="button"
          onClick={load}
          disabled={loading}
          className="border-2 border-ink-black p-2 hover:bg-manuscript-gray disabled:opacity-50"
          aria-label="Refresh publication reviews"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {error && (
        <div className="m-5 p-3 border-2 border-[#E63946] bg-[#E63946]/10 text-[#E63946] text-xs font-mono font-bold">
          {error}
        </div>
      )}
      {message && (
        <div className="m-5 p-3 border-2 border-ink-black bg-[#FFF3B0] text-xs font-mono font-bold">
          {message}
        </div>
      )}

      {loading ? (
        <div className="p-10 flex items-center justify-center gap-2 font-mono text-xs uppercase text-neutral-500">
          <LoaderCircle className="w-4 h-4 animate-spin" /> Loading publication queue...
        </div>
      ) : items.length === 0 ? (
        <div className="m-5 p-8 border-2 border-dashed border-neutral-400 text-center font-mono text-xs uppercase text-neutral-500">
          No chapters are waiting for Editorial Board review.
        </div>
      ) : (
        <div className="divide-y-4 divide-ink-black">
          {items.map((item) => {
            const chapter = item.chapter as any;
            const series = chapter?.seriesId && typeof chapter.seriesId === 'object'
              ? chapter.seriesId
              : {};
            const chapterId = idOf(chapter);
            const session = item.session;
            const status = session?.decisionStatus || chapter?.status || 'READY_FOR_REVIEW';
            const isOpen = activeChapterId === chapterId;
            const assigned = session?.requiredVoters?.some(
              (voter) => idOf(voter.userId) === currentUser._id,
            );
            const hasVoted = item.votes.some(
              (vote) => idOf(vote.voterId) === currentUser._id,
            );
            const isChair = idOf(session?.chairpersonId) === currentUser._id;
            const isTieBreak = status === 'TIE_BREAK_REQUIRED';
            const voteOptions: PublicationDecision[] = isTieBreak
              ? session?.tiedDecisions || []
              : ['PUBLISH', 'REJECT', 'RESCHEDULE'];
            const tasks = item.tasks || [];
            const pages = item.pages || [];

            return (
              <article key={chapterId || session?._id} className="p-5">
                <button
                  type="button"
                  onClick={() => {
                    setActiveChapterId(isOpen ? '' : chapterId);
                    setMessage('');
                    resetForm();
                  }}
                  className="w-full text-left flex items-start justify-between gap-4"
                >
                  <div>
                    <p className="font-syne font-black uppercase text-sm">
                      {series?.title || 'Unknown Series'} ? Chapter {chapter?.chapterNumber ?? '?'}
                    </p>
                    <p className="text-xs text-neutral-500 font-bold mt-1">
                      {chapter?.title || 'Untitled chapter'}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-3">
                      <span className={`px-2 py-1 border text-[9px] font-mono font-black uppercase ${statusClass(status)}`}>
                        {status.replaceAll('_', ' ')}
                      </span>
                      {session && (
                        <span className="px-2 py-1 border border-ink-black text-[9px] font-mono font-black uppercase">
                          {item.tally?.total || 0}/{item.tally?.required || session.requiredVoters?.length || 0} votes
                        </span>
                      )}
                      {session?.newSchedule && (
                        <span className="px-2 py-1 border border-ink-black bg-[#FFF3B0] text-[9px] font-mono font-black uppercase">
                          Proposed schedule: {session.newSchedule}
                        </span>
                      )}
                    </div>
                  </div>
                  <ChevronDown className={`w-5 h-5 shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>

                {isOpen && (
                  <div className="mt-5 pt-5 border-t-2 border-ink-black space-y-4">
                    {(tasks.length > 0 || pages.length > 0) && (
                      <div className="border-2 border-ink-black bg-manuscript-gray p-4 space-y-3">
                        <p className="font-mono text-[10px] font-black uppercase">Review evidence</p>
                        {tasks.length > 0 && (
                          <div>
                            <p className="font-mono text-[9px] font-bold uppercase mb-2">Tasks ({tasks.length})</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                              {tasks.map((task) => (
                                <div key={task._id} className="bg-white border border-neutral-400 p-2">
                                  <p className="text-[10px] font-bold">{task.title}</p>
                                  <p className="font-mono text-[8px] uppercase text-neutral-500">{task.status.replaceAll('_', ' ')}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {pages.length > 0 && (
                          <div>
                            <p className="font-mono text-[9px] font-bold uppercase mb-2">Pages ({pages.length})</p>
                            <div className="flex flex-wrap gap-2">
                              {pages.map((page, index) => (
                                <span key={page._id || index} className="bg-white border border-neutral-400 px-2 py-1 font-mono text-[8px] font-bold uppercase">
                                  Page {page.pageNumber ?? index + 1}: {page.status?.replaceAll('_', ' ') || 'Available'}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    {session ? (
                      <>
                        <div className="grid grid-cols-3 gap-2">
                          {(['PUBLISH', 'REJECT', 'RESCHEDULE'] as const).map((option) => (
                            <div key={option} className="border-2 border-ink-black p-3 text-center bg-manuscript-gray">
                              <p className="font-mono text-xl font-black">{item.tally?.[option] || 0}</p>
                              <p className="font-mono text-[8px] font-black uppercase">{option}</p>
                            </div>
                          ))}
                        </div>

                        <div className="space-y-2">
                          {item.votes.map((vote) => (
                            <div key={vote._id} className="border-2 border-neutral-300 p-3">
                              <span className="font-mono text-[9px] font-black uppercase">{vote.decision}</span>
                              {vote.comment && <p className="text-[10px] text-neutral-600 mt-1">{vote.comment}</p>}
                            </div>
                          ))}
                        </div>

                        {isTieBreak && !isChair && (
                          <p className="p-3 border-2 border-[#FFF3B0] bg-[#FFF3B0]/40 font-mono text-[10px] font-bold uppercase">
                            Waiting for the assigned chairperson to resolve the tie.
                          </p>
                        )}
                        {!isTieBreak && !assigned && (
                          <p className="p-3 border-2 border-neutral-300 bg-neutral-50 font-mono text-[10px] font-bold uppercase text-neutral-500">
                            You are not assigned to vote in this session.
                          </p>
                        )}
                        {!isTieBreak && hasVoted && (
                          <p className="p-3 border-2 border-status-success bg-status-success/10 font-mono text-[10px] font-bold uppercase">
                            Your vote has already been recorded.
                          </p>
                        )}

                        {((isTieBreak && isChair) || (!isTieBreak && assigned && !hasVoted)) && (
                          <div className="border-4 border-ink-black p-4 space-y-3">
                            <p className="font-mono text-[10px] font-black uppercase flex items-center gap-2">
                              <Gavel className="w-4 h-4 text-[#E63946]" />
                              {isTieBreak ? 'Chairperson tie-break' : 'Cast publication vote'}
                            </p>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                              {voteOptions.map((option) => (
                                <label key={option} className="border-2 border-ink-black p-2 text-[10px] font-bold cursor-pointer">
                                  <input
                                    type="radio"
                                    name={`publication-${chapterId}`}
                                    className="mr-2"
                                    checked={decision === option}
                                    onChange={() => setDecision(option)}
                                  />
                                  {option}
                                </label>
                              ))}
                            </div>
                            <textarea
                              rows={3}
                              value={comment}
                              onChange={(event) => setComment(event.target.value)}
                              placeholder="Required board reasoning..."
                              className="w-full border-2 border-ink-black p-3 text-xs resize-none bg-manuscript-gray"
                            />
                            <button
                              type="button"
                              onClick={() => submitVote(isTieBreak)}
                              disabled={submitting}
                              className="w-full bg-[#E63946] text-white border-2 border-ink-black py-3 font-syne text-xs font-black uppercase shadow-[3px_3px_0px_#141414] disabled:opacity-50"
                            >
                              {submitting ? 'Submitting...' : isTieBreak ? 'Resolve tie' : 'Submit vote'}
                            </button>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="border-4 border-ink-black p-4 space-y-3">
                        <p className="font-mono text-[10px] font-black uppercase">Open publication voting</p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                          <div>
                            <p className="text-[10px] font-mono font-bold uppercase mb-1">Required voters</p>
                            <div className="border-2 border-ink-black p-2 bg-white max-h-36 overflow-y-auto space-y-1">
                              {boardMembers.map((member) => (
                                <label key={member._id} className="flex items-center gap-2 text-xs cursor-pointer hover:bg-manuscript-gray p-1">
                                  <input
                                    type="checkbox"
                                    checked={voterIds.includes(member._id)}
                                    onChange={() => toggleVoter(member._id)}
                                    className="w-4 h-4 accent-ink-black"
                                  />
                                  {member.name}
                                </label>
                              ))}
                            </div>
                          </div>
                          <label className="text-[10px] font-mono font-bold uppercase">
                            Chairperson
                            <select
                              value={chairpersonId}
                              onChange={(event) => setChairpersonId(event.target.value)}
                              className="mt-1 w-full border-2 border-ink-black p-2 bg-white text-xs"
                            >
                              <option value="">Select chairperson...</option>
                              {boardMembers.map((member) => (
                                <option key={member._id} value={member._id}>{member.name}</option>
                              ))}
                            </select>
                          </label>
                        </div>
                        <label className="block text-[10px] font-mono font-bold uppercase">
                          Proposed publication schedule
                          <select
                            value={newSchedule}
                            onChange={(event) => setNewSchedule(event.target.value as PubSchedule)}
                            className="mt-1 w-full border-2 border-ink-black p-2 bg-white text-xs"
                          >
                            <option value="WEEKLY">Weekly</option>
                            <option value="MONTHLY">Monthly</option>
                          </select>
                        </label>
                        <button
                          type="button"
                          onClick={openSession}
                          disabled={submitting}
                          className="w-full bg-ink-black text-white border-2 border-ink-black py-3 font-syne text-xs font-black uppercase shadow-[3px_3px_0px_#E63946] disabled:opacity-50"
                        >
                          {submitting ? 'Opening...' : 'Open voting session'}
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

