import React, { useState } from 'react';
import { User, Series, Chapter, Rating } from '../types';
import { apiClient } from '../api/client';
import { Vote, FileSpreadsheet, CheckSquare, PlusSquare, AlertOctagon, TrendingUp } from 'lucide-react';

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
  // Pending series for vote
  const pendingSeries = series.filter(s => s.status === 'PENDING');

  // Voting state mapping keyed by series ID
  const [votesData, setVotesData] = useState<Record<string, { decision: 'ACCEPT' | 'REJECT'; comment: string; schedule: 'WEEKLY' | 'MONTHLY' }>>({});
  const [voteMessages, setVoteMessages] = useState<Record<string, string>>({});

  // Status transitions state forms
  const [transitionSeriesId, setTransitionSeriesId] = useState('');
  const [transitionStatus, setTransitionStatus] = useState<'PENDING' | 'APPROVED' | 'IN_PRODUCTION' | 'PUBLISHED' | 'REJECTED' | 'CANCELLED'>('PUBLISHED');
  const [transitionStatusMsg, setTransitionStatusMsg] = useState('');

  // Reader votes ingestion form states
  const [ingestSeriesId, setIngestSeriesId] = useState('');
  const [ingestVoteCount, setIngestVoteCount] = useState(15420);
  const [ingestSource, setIngestSource] = useState('Weekly Shonen Jump App');
  const [ingestMsg, setIngestMsg] = useState('');

  // Submit decision vote
  const handleVoteSubmit = async (seriesId: string) => {
    const data = votesData[seriesId] || { decision: 'ACCEPT', comment: '', schedule: 'WEEKLY' };
    if (!data.comment) {
      setVoteMessages({ ...voteMessages, [seriesId]: '❌ Error: Comment is required for editorial voting.' });
      return;
    }

    try {
      // 1. Submit Vote Record
      await apiClient.votes.submit(seriesId, data.decision, data.comment);
      
      // 2. Perform Series Review (APPROVED or REJECTED)
      const actionValue = data.decision === 'ACCEPT' ? 'APPROVED' : 'REJECTED';
      await apiClient.series.review(seriesId, actionValue, data.comment, data.schedule);
      
      setVoteMessages({ ...voteMessages, [seriesId]: `🎉 Decision submitted successfully! Series is now ${actionValue}.` });
      
      // Refresh local caches
      onRefreshAll();
    } catch (err: any) {
      setVoteMessages({ ...voteMessages, [seriesId]: `❌ Error: ${err.message}` });
    }
  };

  // Submit general state changes
  const handleTransitionSubmit = async () => {
    if (!transitionSeriesId) {
      setTransitionStatusMsg('❌ Select active series.');
      return;
    }

    try {
      await apiClient.series.updateStatus(transitionSeriesId, transitionStatus);
      setTransitionStatusMsg('✅ Series status shifted correctly!');
      onRefreshAll();
      setTimeout(() => setTransitionStatusMsg(''), 5000);
    } catch (err: any) {
      setTransitionStatusMsg(`Status transition denied: ${err.message}`);
    }
  };

  // Ingest reader vote counts
  const handleIngestSubmit = async () => {
    if (!ingestSeriesId) {
      setIngestMsg('❌ Select target series.');
      return;
    }

    try {
      await apiClient.ratings.submit(ingestSeriesId, ingestVoteCount, ingestSource);
      setIngestMsg('🚀 Ratings data ingested! Ranks recalculated instantly.');
      onRefreshAll();
      setIngestVoteCount(15420);
      setIngestSource('Weekly Shonen Jump App');
      setTimeout(() => setIngestMsg(''), 5000);
    } catch (err: any) {
      setIngestMsg(`❌ Ingestion failed: ${err.message}`);
    }
  };

  const updateVoteData = (seriesId: string, fields: Partial<typeof votesData[string]>) => {
    const current = votesData[seriesId] || { decision: 'ACCEPT', comment: '', schedule: 'WEEKLY' };
    setVotesData({
      ...votesData,
      [seriesId]: { ...current, ...fields }
    });
  };

  return (
    <div className="space-y-6">
      <header className="mb-8 pb-5 border-b-4 border-ink-black flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="font-syne text-3xl font-black text-ink-black uppercase italic tracking-tight">Editorial Board</h1>
          <p className="font-sans text-xs text-neutral-600 font-bold uppercase tracking-wider mt-1.5 flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 bg-[#E63946]"></span>
            Voting &amp; Serialization decisions for newly pitched series. Realtime status alignment panel.
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        
        {/* Pending Proposals Voting Columns */}
        <section className="xl:col-span-8 flex flex-col gap-6">
          <h2 className="font-syne text-xl font-black uppercase text-ink-black pb-4 border-b-4 border-ink-black flex items-center gap-3 select-none">
            <CheckSquare className="text-[#E63946] w-6 h-6 animate-pulse" />
            Pending Series Voting
          </h2>

          <div className="flex flex-col gap-5">
            {pendingSeries.map((item) => {
              const currentVote = votesData[item._id] || { decision: 'ACCEPT', comment: '', schedule: 'WEEKLY' };
              const msg = voteMessages[item._id];

              return (
                <div 
                  key={item._id}
                  className="bg-white border-4 border-ink-black rounded-none p-6 shadow-[8px_8px_0px_#141414] transition-all"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="flex flex-wrap items-center gap-3 mb-1.5">
                        <h3 className="font-syne text-lg font-black uppercase tracking-tight">{item.title}</h3>
                        <span className="px-2.5 py-0.5 border-2 border-ink-black text-[9px] font-mono font-black uppercase tracking-wider bg-[#FFF3B0] text-ink-black">
                          Pending Approval
                        </span>
                      </div>
                      <p className="font-sans text-[10px] font-extrabold uppercase text-neutral-500">
                        Author Account ID: {typeof item.mangakaId === 'object' ? item.mangakaId.name : item.mangakaId}
                      </p>
                    </div>
                  </div>

                  {msg && (
                    <div className={`p-3 border-2 mb-4 text-xs font-mono font-bold uppercase select-none ${msg.startsWith('🎉') ? 'bg-[#2ECC71]/15 text-[#2ECC71] border-[#2ECC71]' : 'bg-[#E63946]/15 text-[#E63946] border-[#E63946]'}`}>
                      {msg}
                    </div>
                  )}

                  <p className="bg-[#F5F5F0] p-4 border-2 border-ink-black rounded-none text-xs leading-relaxed font-sans font-bold text-ink-black mb-4">
                    <span className="font-mono block text-[10px] uppercase font-extrabold text-[#E63946] mb-1.5">Author Pitch Synopsis:</span>
                    {item.synopsis}
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="md:col-span-1 space-y-3">
                      <label className="font-mono text-[10px] text-ink-black block font-extrabold uppercase">Decision Vote</label>
                      
                      <label className="flex items-center gap-3 p-3 border-2 border-ink-black rounded-none cursor-pointer hover:bg-[#F5F5F0] bg-white text-xs font-bold font-sans uppercase">
                        <input 
                          type="radio"
                          name={`decision_${item._id}`}
                          className="w-4 h-4 text-[#E63946] border-2 border-[#141414] focus:ring-0 cursor-pointer"
                          checked={currentVote.decision === 'ACCEPT'}
                          onChange={() => updateVoteData(item._id, { decision: 'ACCEPT' })}
                        />
                        <span className="select-none">Accept Serialization</span>
                      </label>

                      <label className="flex items-center gap-3 p-3 border-2 border-ink-black rounded-none cursor-pointer hover:bg-[#F5F5F0] bg-white text-xs font-bold font-sans uppercase">
                        <input 
                          type="radio"
                          name={`decision_${item._id}`}
                          className="w-4 h-4 text-[#E63946] border-2 border-[#141414] focus:ring-0 cursor-pointer"
                          checked={currentVote.decision === 'REJECT'}
                          onChange={() => updateVoteData(item._id, { decision: 'REJECT' })}
                        />
                        <span className="select-none">Reject / Revise pitch</span>
                      </label>

                      {currentVote.decision === 'ACCEPT' && (
                        <div className="mt-2 animate-fadeIn">
                          <label className="block text-[10px] font-mono text-neutral-500 uppercase mb-1 font-bold" htmlFor={`pubSchedule_${item._id}`}>Target Schedule</label>
                          <select 
                            id={`pubSchedule_${item._id}`}
                            className="bg-white border-2 border-ink-black rounded-none p-1.5 text-xs w-full focus:outline-none cursor-pointer font-bold"
                            value={currentVote.schedule}
                            onChange={(e) => updateVoteData(item._id, { schedule: e.target.value as any })}
                          >
                            <option value="WEEKLY">WEEKLY</option>
                            <option value="MONTHLY">MONTHLY</option>
                          </select>
                        </div>
                      )}
                    </div>

                    <div className="md:col-span-2">
                      <label className="font-mono text-[10px] text-ink-black block font-extrabold uppercase mb-2" htmlFor={`com_${item._id}`}>Editorial Feedback (Required)</label>
                      <textarea 
                        id={`com_${item._id}`}
                        rows={4}
                        className="w-full bg-[#F5F5F0] border-2 border-ink-black rounded-none p-3 font-sans text-xs font-bold text-ink-black placeholder:text-neutral-400 focus:bg-white focus:outline-none resize-none"
                        placeholder="Provide detailed feedback on dialogue flow, pacing, character development, and marketing potential..."
                        value={currentVote.comment}
                        onChange={(e) => updateVoteData(item._id, { comment: e.target.value })}
                        required
                      ></textarea>
                    </div>
                  </div>

                  <div className="mt-4 flex justify-end">
                    <button 
                      onClick={() => handleVoteSubmit(item._id)}
                      className="bg-[#E63946] hover:bg-red-600 text-white font-syne text-xs font-extrabold uppercase py-3 px-8 rounded-none border-2 border-ink-black shadow-[4px_4px_0px_#141414] active:translate-y-0.5 active:shadow-none transition-all cursor-pointer"
                    >
                      Submit Vote
                    </button>
                  </div>
                </div>
              );
            })}

            {pendingSeries.length === 0 && (
              <div className="bg-white border-4 border-dashed border-ink-black rounded-none p-12 text-center text-xs font-mono font-bold text-neutral-500 uppercase select-none">
                🌸 Perfect! All series pitch submissions have been reviewed and voted on. No waiting items.
              </div>
            )}
          </div>
        </section>

        {/* Sidebar forms */}
        <div className="xl:col-span-4 flex flex-col gap-6">
          
          {/* Transition Status card panel */}
          <section className="bg-white border-4 border-ink-black rounded-none p-6 shadow-[4px_4px_0px_#141414]">
            <h2 className="font-syne text-md font-black uppercase text-ink-black border-b-2 border-ink-black pb-3 mb-4 flex items-center gap-2 select-none">
              <AlertOctagon className="text-[#E63946] w-5 h-5" />
              Update Series Status
            </h2>

            {transitionStatusMsg && (
              <div className={`p-3 border-2 mb-3 text-xs font-mono font-bold uppercase select-none leading-normal ${transitionStatusMsg.startsWith('✅') ? 'bg-[#2ECC71]/15 text-[#2ECC71] border-[#2ECC71]' : 'bg-[#E63946]/15 text-[#E63946] border-[#E63946]'}`}>
                {transitionStatusMsg}
              </div>
            )}

            <form onSubmit={(e) => { e.preventDefault(); handleTransitionSubmit(); }} className="space-y-4">
              <div>
                <label className="font-mono text-[10px] text-ink-black block mb-1.5 font-extrabold uppercase animate-pulse" htmlFor="seriesT">Select Series</label>
                <div className="relative">
                  <select 
                    id="seriesT"
                    value={transitionSeriesId}
                    onChange={(e) => setTransitionSeriesId(e.target.value)}
                    className="w-full bg-[#F5F5F0] border-2 border-ink-black rounded-none p-3 font-sans text-xs font-bold text-ink-black focus:bg-white focus:outline-none cursor-pointer"
                    required
                  >
                    <option value="">Choose Series...</option>
                    {series.filter(s => s.status !== 'PENDING').map(s => (
                      <option key={s._id} value={s._id}>{s.title} ({s.status})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-mono text-[10px] text-ink-black block mb-1.5 font-extrabold uppercase" htmlFor="statusNew">New Status Matrix</label>
                <div className="relative">
                  <select 
                    id="statusNew"
                    value={transitionStatus}
                    onChange={(e) => setTransitionStatus(e.target.value as any)}
                    className="w-full bg-[#F5F5F0] border-2 border-ink-black rounded-none p-3 font-sans text-xs font-bold text-ink-black focus:bg-white focus:outline-none cursor-pointer"
                  >
                    <option value="IN_PRODUCTION">IN_PRODUCTION</option>
                    <option value="PUBLISHED">PUBLISHED</option>
                    <option value="CANCELLED">CANCELLED</option>
                    <option value="APPROVED">APPROVED</option>
                  </select>
                </div>
              </div>

              <div className="text-[10px] font-mono font-bold text-[#E63946] border-2 border-[#E63946]/20 p-2 bg-[#E63946]/5 select-none leading-relaxed uppercase">
                ⚠️ NOTICE: Allowed transition boundaries state rules apply. MANGAKA pitches must go through pending board votes prior to production.
              </div>

              <button 
                type="submit"
                className="w-full bg-[#E63946] border-2 border-ink-black hover:bg-red-600 text-white font-syne text-xs uppercase font-extrabold py-3 rounded-none shadow-[2px_2px_0px_#141414] transition-colors cursor-pointer"
              >
                Recalibrating Pipeline
              </button>
            </form>
          </section>

          {/* Reader Votes ratings Ingestion card */}
          <section className="bg-white border-4 border-ink-black rounded-none p-6 shadow-[4px_4px_0px_#141414]">
            <h2 className="font-syne text-md font-black uppercase text-ink-black border-b-2 border-ink-black pb-3 mb-4 flex items-center gap-2 select-none">
              <FileSpreadsheet className="text-[#2ECC71] w-5 h-5" />
              Ingest Reader Ratings
            </h2>

            {ingestMsg && (
              <div className={`p-3 border-2 mb-3 text-xs font-mono font-bold uppercase select-none ${ingestMsg.startsWith('🚀') ? 'bg-[#2ECC71]/15 text-[#2ECC71] border-[#2ECC71]' : 'bg-[#E63946]/15 text-[#E63946] border-[#E63946]'}`}>
                {ingestMsg}
              </div>
            )}

            <form onSubmit={(e) => { e.preventDefault(); handleIngestSubmit(); }} className="space-y-4">
              <div>
                <label className="font-mono text-[10px] text-ink-black block mb-1.5 font-extrabold uppercase" htmlFor="ing">Select Series</label>
                <select 
                  id="ing"
                  value={ingestSeriesId}
                  onChange={(e) => setIngestSeriesId(e.target.value)}
                  className="w-full bg-[#F5F5F0] border-2 border-ink-black rounded-none p-3 font-sans text-xs font-bold text-ink-black focus:bg-white focus:outline-none cursor-pointer"
                  required
                >
                  <option value="">Choose Series...</option>
                  {series.filter(s => s.status !== 'PENDING').map(s => (
                    <option key={s._id} value={s._id}>{s.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-mono text-[10px] text-ink-black block mb-1.5 font-extrabold uppercase" htmlFor="ingV">Reader Vote Multiplier</label>
                <input 
                  id="ingV"
                  type="number"
                  value={ingestVoteCount}
                  onChange={(e) => setIngestVoteCount(Number(e.target.value))}
                  className="w-full bg-[#F5F5F0] border-2 border-ink-black rounded-none p-3 font-sans text-xs font-bold text-ink-black focus:bg-white focus:outline-none font-mono"
                  min={1}
                  required
                />
              </div>

              <div>
                <label className="font-mono text-[10px] text-ink-black block mb-1.5 font-extrabold uppercase" htmlFor="ingS">Platform Data Source</label>
                <input 
                  id="ingS"
                  type="text"
                  value={ingestSource}
                  onChange={(e) => setIngestSource(e.target.value)}
                  className="w-full bg-[#F5F5F0] border-2 border-ink-black rounded-none p-3 font-sans text-xs font-bold text-ink-black focus:bg-white focus:outline-none"
                  placeholder="e.g. Shonen Jump Weekly In-App"
                  required
                />
              </div>

              <button 
                type="submit"
                className="w-full bg-white text-ink-black hover:bg-[#F5F5F0] border-2 border-ink-black font-syne text-xs uppercase font-extrabold py-3 rounded-none shadow-[2px_2px_0px_#141414] transition-all cursor-pointer"
              >
                Record popular vote
              </button>
            </form>
          </section>

        </div>

      </div>
    </div>
  );
}
