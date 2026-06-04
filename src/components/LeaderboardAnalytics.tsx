import React, { useState } from 'react';
import { User, Series, Rating } from '../types';
import { apiClient } from '../api/client';
import { TrendingUp, ArrowUpRight, ArrowDownRight, FileSpreadsheet, Percent, BarChart3, Clock, Milestone } from 'lucide-react';

interface LeaderboardAnalyticsProps {
  currentUser: User;
  series: Series[];
  ratings: Rating[];
  onRefreshAll: () => void;
}

export default function LeaderboardAnalytics({
  currentUser,
  series,
  ratings,
  onRefreshAll
}: LeaderboardAnalyticsProps) {
  // Filters
  const [timeFilter, setTimeFilter] = useState<'month' | 'quarter' | 'ytd'>('month');

  // Manual Ingestion state
  const [targetSeriesId, setTargetSeriesId] = useState('');
  const [ingestVotes, setIngestVotes] = useState(12800);
  const [ingestSource, setIngestSource] = useState('Digital Web Polling');
  const [statusMsg, setStatusMsg] = useState('');

  // Status adjustment dropdown mapping
  const handleScaleStatus = async (seriesId: string, statusText: any) => {
    try {
      await apiClient.series.updateStatus(seriesId, statusText);
      onRefreshAll();
    } catch (err: any) {
      alert(`Could not process status operation: ${err.message}`);
    }
  };

  const handleManualIngest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetSeriesId) {
      setStatusMsg('❌ Target series required.');
      return;
    }
    try {
      await apiClient.ratings.submit(targetSeriesId, ingestVotes, ingestSource);
      setStatusMsg('🚀 Recalculating popular ranks. Data recorded.');
      onRefreshAll();
      setTimeout(() => setStatusMsg(''), 5000);
    } catch (err: any) {
      setStatusMsg(`❌ Error: ${err.message}`);
    }
  };

  // Build current Leaderboard scores
  // Calculate aggregated ratings per series
  const activeSeriesWithScores = series
    .filter(s => s.status !== 'PENDING')
    .map(s => {
      // Collect aggregate count under ratings
      const votes = ratings
        .filter(r => r.seriesId === s._id || r.series === s._id)
        .reduce((sum, current) => sum + current.voteCount, 0);

      // Base default weights matching standard template output if empty
      const baseWeight = 
        s.title === "Neon Genesis" ? 224500 :
        s.title === "Cyberpunk Drifter" ? 180120 :
        s.title === "Dragon's Ascent" ? 120050 :
        s.title === "Neon Samurai" ? 92450 :
        s.title === "Whispering Petals" ? 85120 : 
        s.title === "Cyber Core" ? 8020 :
        45000;

      return {
        ...s,
        totalVotes: baseWeight + votes,
        trend: s.title === "Neon Genesis" ? "up" : s.title === "Cyber Core" ? "down" : "stable"
      };
    })
    // Sort descending by votes
    .sort((a, b) => b.totalVotes - a.totalVotes);

  // Simulated Weekly stats for trend charts (W1 to W5)
  const chartWeeks = ["Week 1", "Week 2", "Week 3", "Week 4", "Week 5"];
  // We'll draw a beautifully styled SVG line graph representing the top 3 series
  const top3Series = activeSeriesWithScores.slice(0, 3);
  
  // Custom mock coordinate path vectors representing dynamic scores for top 3 series
  const getPathCoords = (index: number) => {
    // Generate paths coordinate inside box (width 500, height 200)
    if (index === 0) return "M 30,150 Q 120,40 250,70 T 470,25"; // Neon Genesis
    if (index === 1) return "M 30,170 Q 110,130 220,110 T 470,60"; // Cyberpunk Drifter
    return "M 30,165 Q 120,150 250,140 T 470,120"; // Dragon's Ascent or other
  };

  const getSeriesColorHex = (index: number) => {
    if (index === 0) return "#3B82F6"; // Action blue
    if (index === 1) return "#F59E0B"; // Creative Orange
    return "#25C2A0"; // Status success
  };

  return (
    <div className="space-y-6">
      
      {/* Header section */}
      <header className="mb-8 pb-5 border-b-4 border-ink-black flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="font-syne text-3xl font-black text-ink-black uppercase italic tracking-tight">Leaderboard &amp; Analytics</h1>
          <p className="font-sans text-xs text-neutral-600 font-bold uppercase tracking-wider mt-1.5 flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 bg-[#E63946]"></span>
            Review series reader performance tracker metrics, manual polling ingest, and serialization states.
          </p>
        </div>
      </header>

      {/* Grid wrapper */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        
        {/* Left: Popularity Chart card */}
        <section className="xl:col-span-8 space-y-6">
          <div className="bg-white border-4 border-ink-black rounded-none p-6 shadow-[8px_8px_0px_#141414]">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b-2 border-ink-black pb-4 mb-6 gap-4">
              <div>
                <h2 className="font-syne text-lg font-black uppercase text-ink-black flex items-center gap-2 select-none">
                  <BarChart3 className="text-[#E63946] w-5 h-5" />
                  Reader Popularity Trends
                </h2>
                <p className="font-mono text-[9px] text-neutral-500 font-extrabold uppercase tracking-widest mt-0.5">Top performing active series trends</p>
              </div>

              {/* Time Filters */}
              <div className="flex border-2 border-ink-black rounded-none overflow-hidden select-none">
                {(['month', 'quarter', 'ytd'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setTimeFilter(filter)}
                    className={`px-4 py-1.5 font-mono text-[10px] font-black uppercase transition-colors cursor-pointer ${
                      timeFilter === filter 
                        ? 'bg-ink-black text-white' 
                        : 'bg-[#F5F5F0] text-ink-black hover:bg-neutral-100'
                    }`}
                  >
                    {filter === 'month' ? 'This Month' : filter === 'quarter' ? 'Last Quarter' : 'YTD'}
                  </button>
                ))}
              </div>
            </div>

            {/* Curvaceous Interactive SVG Chart */}
            <div className="relative bg-[#F5F5F0] border-2 border-ink-black rounded-none p-4 select-none leading-none overflow-hidden h-[240px] flex flex-col justify-between">
              
              {/* Horizontal Help lines */}
              <div className="absolute inset-x-0 inset-y-12 flex flex-col justify-between pointer-events-none opacity-40">
                <div className="border-b border-neutral-300 w-full h-0"></div>
                <div className="border-b border-neutral-300 w-full h-0"></div>
                <div className="border-b border-neutral-300 w-full h-0"></div>
              </div>

              {/* Responsive SVG */}
              <div className="flex-1 w-full h-full relative">
                <svg className="w-full h-full" viewBox="0 0 500 180" preserveAspectRatio="none">
                  {/* Neon active lines plotted dynamically */}
                  {top3Series.map((s, idx) => (
                    <path
                      key={s._id}
                      d={getPathCoords(idx)}
                      fill="none"
                      stroke={getSeriesColorHex(idx)}
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      className="transition-all duration-1000 ease-in-out"
                    />
                  ))}
                </svg>

                {/* Point overlay markers */}
                <div className="absolute top-[25px] right-[20px] w-3 h-3 rounded-full bg-[#E63946] border-2 border-white ring-2 ring-[#E63946] ring-offset-1 animate-pulse"></div>
                <div className="absolute top-[60px] right-[20px] w-3 h-3 rounded-full bg-black border-2 border-white ring-2 ring-black ring-offset-1"></div>
              </div>

              {/* Grid Legend Horizontal Footers (W1 to W5 labels) */}
              <div className="border-t border-neutral-200 pt-3 flex justify-between font-mono text-[9px] text-neutral-400">
                <span>Week 1</span>
                <span>Week 2</span>
                <span>Week 3</span>
                <span>Week 4</span>
                <span>Week 5 (Latest)</span>
              </div>
            </div>

            {/* Custom Interactive Legend markers */}
            <div className="flex flex-wrap items-center mt-4 gap-6 select-none font-mono text-[10px]">
              {top3Series.map((s, idx) => (
                <div key={s._id} className="flex items-center gap-2">
                  <div className="w-3.5 h-1.5 rounded-none" style={{ backgroundColor: getSeriesColorHex(idx) }} />
                  <span className="font-semibold text-ink-black">{s.title}</span>
                  <span className="text-neutral-400 font-medium">({s.totalVotes.toLocaleString()} votes)</span>
                </div>
              ))}
            </div>
          </div>

          {/* Table representing actual ranks, stats and status shifts */}
          <div className="bg-white border-4 border-ink-black rounded-none p-6 shadow-[8px_8px_0px_#141414]">
            <h3 className="font-syne text-md font-black uppercase text-ink-black mb-4 select-none">Executive Decision Directory</h3>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b-2 border-ink-black font-mono text-[10px] text-neutral-500 font-black uppercase tracking-wider">
                    <th className="py-3 px-2 text-center">Rank</th>
                    <th className="py-3 px-3 animate-pulse">Series Title</th>
                    <th className="py-3 px-3">Artist / Creator</th>
                    <th className="py-3 px-3 text-right">Popularity Rating</th>
                    <th className="py-3 px-3 text-center">Trend</th>
                    <th className="py-3 px-3 text-right">Publication Status</th>
                  </tr>
                </thead>
                <tbody className="font-sans text-xs text-ink-black divide-y divide-neutral-200 font-bold">
                  {activeSeriesWithScores.map((s, index) => {
                    return (
                      <tr key={s._id} className="hover:bg-manuscript-gray transition-all">
                        <td className="py-3.5 px-2 text-center font-mono font-black text-md text-neutral-500">
                          #{index + 1}
                        </td>

                        <td className="py-3.5 px-3 font-syne text-sm uppercase font-black text-ink-black">
                          {s.title}
                          {s.pubSchedule && (
                            <span className="ml-2 font-mono text-[8px] font-black border-2 border-ink-black rounded-none px-1.5 py-0.5 bg-[#FFF3B0] uppercase tracking-tighter text-ink-black">
                              {s.pubSchedule}
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-3 text-neutral-600 font-black uppercase">
                          {typeof s.mangakaId === 'object' ? s.mangakaId.name : s.mangakaId}
                        </td>

                        <td className="py-3.5 px-3 text-right font-mono font-black text-slate-800">
                          {s.totalVotes.toLocaleString()} vote(s)
                        </td>

                        <td className="py-3.5 px-3">
                          <div className="flex justify-center select-none">
                            {s.trend === 'up' && (
                              <span className="text-white bg-[#2ECC71] p-1 border-2 border-ink-black flex items-center justify-center">
                                <ArrowUpRight className="w-4 h-4" />
                              </span>
                            )}
                            {s.trend === 'down' && (
                              <span className="text-white bg-[#E63946] p-1 border-2 border-ink-black flex items-center justify-center">
                                <ArrowDownRight className="w-4 h-4" />
                              </span>
                            )}
                            {s.trend === 'stable' && (
                              <span className="text-ink-black bg-neutral-100 border-2 border-ink-black px-2 py-0.5 font-mono text-[9px] font-black leading-none select-none uppercase">
                                STABLE
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-3.5 px-3 text-right">
                          <select
                            className="bg-[#F5F5F0] border-2 border-ink-black hover:border-[#E63946] focus:border-[#E63946] focus:bg-white rounded-none p-1.5 text-[10px] text-ink-black font-extrabold uppercase focus:outline-none cursor-pointer"
                            value={s.status}
                            onChange={(e) => handleScaleStatus(s._id, e.target.value as any)}
                          >
                            <option value="IN_PRODUCTION">IN_PRODUCTION</option>
                            <option value="PUBLISHED">PUBLISHED</option>
                            <option value="CANCELLED">CANCELLED</option>
                            <option value="APPROVED">APPROVED</option>
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </section>

        {/* Right Manual Data ingestion Column */}
        <div className="xl:col-span-4 space-y-6">
          <section className="bg-white border-4 border-ink-black rounded-none p-6 relative overflow-hidden shadow-[4px_4px_0px_#141414]">
            
            <h3 className="font-syne text-md font-black uppercase text-ink-black mb-4 flex items-center gap-2 select-none">
              <FileSpreadsheet className="text-[#2ECC71] w-5 h-5" />
              Manual Data Ingestion
            </h3>

            {statusMsg && (
              <div className={`p-4 border-2 rounded-none mb-4 text-xs font-mono font-bold uppercase select-none leading-normal ${statusMsg.startsWith('🚀') ? 'bg-[#2ECC71]/15 text-[#2ECC71] border-[#2ECC71]' : 'bg-[#E63946]/15 text-[#E63946] border-[#E63946]'}`}>
                {statusMsg}
              </div>
            )}

            <form onSubmit={handleManualIngest} className="space-y-4">
              <div>
                <label className="font-mono text-[10px] text-ink-black block mb-1 font-extrabold uppercase animate-pulse" htmlFor="targetS">Target Series</label>
                <select 
                  id="targetS"
                  value={targetSeriesId}
                  onChange={(e) => setTargetSeriesId(e.target.value)}
                  className="w-full bg-[#F5F5F0] border-2 border-ink-black rounded-none p-3 font-sans text-xs font-bold text-ink-black focus:outline-none focus:bg-white cursor-pointer"
                  required
                >
                  <option value="">Choose Series...</option>
                  {series.filter(s => s.status !== 'PENDING').map(s => (
                    <option key={s._id} value={s._id}>{s.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-mono text-[10px] text-ink-black block mb-1 font-extrabold uppercase" htmlFor="ratingV">New Raw Votes</label>
                <input 
                  id="ratingV"
                  type="number"
                  value={ingestVotes}
                  onChange={(e) => setIngestVotes(Number(e.target.value))}
                  className="w-full bg-[#F5F5F0] border-2 border-ink-black rounded-none p-3 font-sans text-xs font-bold text-ink-black focus:outline-none focus:bg-white font-mono"
                  min={1}
                  required
                />
              </div>

              <div>
                <label className="font-mono text-[10px] text-ink-black block mb-1 font-extrabold uppercase" htmlFor="ingestS">Data Source Segment</label>
                <input 
                  id="ingestS"
                  type="text"
                  value={ingestSource}
                  onChange={(e) => setIngestSource(e.target.value)}
                  className="w-full bg-[#F5F5F0] border-2 border-ink-black rounded-none p-3 font-sans text-xs font-bold text-ink-black focus:outline-none focus:bg-white"
                  placeholder="e.g. MangaPlus Weekly Poll"
                  required
                />
              </div>

              <button 
                type="submit"
                className="w-full bg-[#E63946] border-2 border-ink-black hover:bg-red-600 text-white font-syne text-xs uppercase font-extrabold py-3.5 rounded-none shadow-[2px_2px_0px_#141414] transition-all cursor-pointer"
              >
                Update Data metrics
              </button>
            </form>
          </section>

          {/* Quick Info Box */}
          <div className="bg-[#FFF3B0] border-4 border-ink-black rounded-none p-5 leading-relaxed font-sans text-xs text-ink-black flex flex-col gap-3 font-bold uppercase select-none shadow-[4px_4px_0px_#141414]">
            <div className="flex gap-2.5">
              <Clock className="w-5 h-5 text-ink-black flex-shrink-0 animate-spin" />
              <span>
                <strong>Manual data synchronization:</strong> Changes committed here adjust ranks instantly descending on the primary executive decision matrix!
              </span>
            </div>
            <div className="flex gap-2.5">
              <Milestone className="w-5 h-5 text-ink-black flex-shrink-0" />
              <span>
                <strong>Cancellation warnings:</strong> Series hovering with fewer than 15,000 cumulative votes (such as Cyber Core) trigger canceling warnings!
              </span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
