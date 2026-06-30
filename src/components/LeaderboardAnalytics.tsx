/**
 * LeaderboardAnalytics.tsx  —  Series Rankings & Editorial Board Dashboard
 * ─────────────────────────────────────────────────────────────────────────────
 * Strict role-based rendering — view is DERIVED from user.role, never toggled
 * manually by the user themselves.
 *
 *   currentUser.role === 'MANGAKA'      → Read-only Mangaka perspective
 *   currentUser.role === 'BOARD_MEMBER' → Full admin Editorial Board controls
 *   Any other role                      → Access-denied screen
 *
 * Color tokens (matches platform dark theme)
 *   Matte Black  #121214   bg-[#121214]
 *   Dark Slate   #1e1e24   bg-[#1e1e24]
 *   Divider      #2d2d34   border-[#2d2d34]
 *   Brand Red    #dc2626   red-600
 *   White        #ffffff
 *
 * Business rules (max 20 slots)
 *   Rank 1–5    HIGH    — 🔥 TOP COMPETING
 *   Rank 6–12   NORMAL  — standard slate row
 *   Rank 13–20  LOW     — bg-red-950/20 border-l-4 border-red-600  🚨 AXE RISK
 *
 * Axios placeholders are marked with:  // ← API:
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState } from 'react';
import { User, Series, Rating } from '../types';
import { apiClient } from '../api/client';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Minus,
  Flame,
  Shield,
  Lock,
  Edit3,
  RefreshCw,
  Database,
  X,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// Domain types
// ─────────────────────────────────────────────────────────────────────────────

type RankPeriod      = 'weekly' | 'monthly';
type Trend           = 'up' | 'down' | 'stable';
type DirectiveStatus = 'active' | 'axed' | 'digital';
type Tier            = 'high' | 'normal' | 'low';

// The view is derived from role — never toggled in UI
type DerivedView = 'mangaka' | 'board';

interface RankEntry {
  id: string;
  rank: number;         // live rank 1–20 (re-sorted on vote edit)
  prevRank: number;     // previous cycle for trend delta
  title: string;
  author: string;
  genre: string;
  votes: number;        // editable by BOARD_MEMBER only
  trend: Trend;
  directive: DirectiveStatus;
  isCurrentUser?: boolean; // the logged-in mangaka's own series
}

// ─────────────────────────────────────────────────────────────────────────────
// 20 seed entries  (replace with GET /api/rankings?type=weekly in production)
// ─────────────────────────────────────────────────────────────────────────────

const SEED_WEEKLY: RankEntry[] = [
  { id: 'r01', rank:  1, prevRank:  2, title: 'Demon Blade Chronicles', author: 'Taro Yamamoto',  genre: 'Shonen',   votes: 98420, trend: 'up',     directive: 'active' },
  { id: 'r02', rank:  2, prevRank:  1, title: 'Neon Ronin 2099',        author: 'Kenji Sato',     genre: 'Sci-Fi',   votes: 94380, trend: 'down',   directive: 'active' },
  { id: 'r03', rank:  3, prevRank:  3, title: 'Sakura Apocalypse',      author: 'Mei Lin',        genre: 'Horror',   votes: 89200, trend: 'stable', directive: 'active' },
  { id: 'r04', rank:  4, prevRank:  6, title: 'Dragon Soul Rising',     author: 'Hiroshi Tanaka', genre: 'Fantasy',  votes: 82100, trend: 'up',     directive: 'active' },
  { id: 'r05', rank:  5, prevRank:  4, title: 'Mech Empire Zero',       author: 'Ryu Park',       genre: 'Sci-Fi',   votes: 77650, trend: 'down',   directive: 'active' },
  { id: 'r06', rank:  6, prevRank:  7, title: 'Ghost Academy',          author: 'Sakura Ito',     genre: 'Thriller', votes: 71200, trend: 'up',     directive: 'active' },
  { id: 'r07', rank:  7, prevRank:  5, title: 'Infinite Katana',        author: 'Naomi Suzuki',   genre: 'Action',   votes: 66500, trend: 'down',   directive: 'active' },
  { id: 'r08', rank:  8, prevRank:  8, title: 'Solar Empress',          author: 'Yuki Hana',      genre: 'Fantasy',  votes: 60800, trend: 'stable', directive: 'active' },
  { id: 'r09', rank:  9, prevRank: 10, title: 'Code Phantom',           author: 'Daisuke Nishida',genre: 'Thriller', votes: 55400, trend: 'up',     directive: 'active' },
  { id: 'r10', rank: 10, prevRank:  9, title: 'Chainsaw Boy',           author: 'Minh Tuấn',      genre: 'Horror',   votes: 50200, trend: 'down',   directive: 'active', isCurrentUser: true },
  { id: 'r11', rank: 11, prevRank: 11, title: 'Idol Uprising',          author: 'Akira Kondo',    genre: 'Shojo',    votes: 44600, trend: 'stable', directive: 'active' },
  { id: 'r12', rank: 12, prevRank: 13, title: 'Last Samurai Beta',      author: 'Fumiko Mori',    genre: 'Seinen',   votes: 39800, trend: 'up',     directive: 'active' },
  { id: 'r13', rank: 13, prevRank: 12, title: 'Cursed Compass',         author: 'Shin Watanabe',  genre: 'Mystery',  votes: 33200, trend: 'down',   directive: 'active' },
  { id: 'r14', rank: 14, prevRank: 15, title: 'Paper Crane Militia',    author: 'Tomoko Iida',    genre: 'Action',   votes: 28700, trend: 'up',     directive: 'active' },
  { id: 'r15', rank: 15, prevRank: 14, title: 'Pixel Warriors DX',      author: 'Keisuke Abe',    genre: 'Sci-Fi',   votes: 23400, trend: 'down',   directive: 'active' },
  { id: 'r16', rank: 16, prevRank: 16, title: 'Hollow Moon Sect',       author: 'Reika Fujii',    genre: 'Horror',   votes: 18900, trend: 'stable', directive: 'active' },
  { id: 'r17', rank: 17, prevRank: 18, title: 'Tanuki Outlaws',         author: 'Masato Hayashi', genre: 'Comedy',   votes: 14200, trend: 'up',     directive: 'active' },
  { id: 'r18', rank: 18, prevRank: 17, title: 'Starfall Protocol',      author: 'Chiaki Nakamura',genre: 'Sci-Fi',   votes: 9800,  trend: 'down',   directive: 'active' },
  { id: 'r19', rank: 19, prevRank: 19, title: 'Binary Temple',          author: 'Yusei Goto',     genre: 'Mystery',  votes: 6100,  trend: 'stable', directive: 'active' },
  { id: 'r20', rank: 20, prevRank: 20, title: 'Echo Fist',              author: 'Hana Shimizu',   genre: 'Shonen',   votes: 3200,  trend: 'stable', directive: 'active' },
];

// Monthly seed: multiply votes, shift prevRanks slightly
const SEED_MONTHLY: RankEntry[] = SEED_WEEKLY.map((e, i) => ({
  ...e,
  votes:    Math.round(e.votes * 4.3),
  prevRank: Math.max(1, Math.min(20, e.rank + (i % 3 === 0 ? 1 : i % 3 === 1 ? -1 : 0))),
}));

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function getTier(rank: number): Tier {
  if (rank <= 5)  return 'high';
  if (rank <= 12) return 'normal';
  return 'low';
}

// ─────────────────────────────────────────────────────────────────────────────
// TrendIcon
// ─────────────────────────────────────────────────────────────────────────────

function TrendIcon({ trend, prevRank, rank }: { trend: Trend; prevRank: number; rank: number }) {
  const delta = Math.abs(prevRank - rank) || 1;
  if (trend === 'up')
    return (
      <span className="flex items-center gap-0.5 text-green-400 text-[10px] font-bold">
        <TrendingUp className="w-3 h-3" />+{delta}
      </span>
    );
  if (trend === 'down')
    return (
      <span className="flex items-center gap-0.5 text-red-400 text-[10px] font-bold">
        <TrendingDown className="w-3 h-3" />-{delta}
      </span>
    );
  return <Minus className="w-3.5 h-3.5 text-slate-600" />;
}

// ─────────────────────────────────────────────────────────────────────────────
// RankRow — renders differently based on derived view
// ─────────────────────────────────────────────────────────────────────────────

function RankRow({
  entry,
  view,
  onVoteChange,
}: {
  entry: RankEntry;
  view: DerivedView;
  onVoteChange: (id: string, val: number) => void;
}) {
  const tier   = getTier(entry.rank);
  const isHigh = tier === 'high';
  const isLow  = tier === 'low';

  // ── Row container style ──
  const rowBase = isLow
    ? 'bg-red-950/20 border-l-4 border-red-600'
    : (entry.isCurrentUser
        ? 'bg-[#1e1e24] border-l-4 border-red-500'  // Mangaka's own series
        : 'bg-[#1e1e24]');

  const rowHover = isLow ? 'hover:bg-red-950/30' : 'hover:bg-[#23232c]';

  return (
    <div className={`flex items-center gap-3 px-4 py-3 border-b border-[#2d2d34] transition-colors ${rowBase} ${rowHover}`}>

      {/* ── Rank number ── */}
      <div className="w-7 shrink-0 text-center">
        <span className={`text-[13px] font-black leading-none ${
          isHigh ? 'text-white' : isLow ? 'text-red-400' : 'text-slate-400'
        }`}>
          {entry.rank}
        </span>
      </div>

      {/* ── Tier badge ── */}
      <div className="w-[108px] shrink-0">
        {isHigh && (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-sm bg-red-600/10 border border-red-600/20 text-red-400 text-[8px] font-bold uppercase tracking-wide">
            <Flame className="w-2.5 h-2.5" />TOP COMPETING
          </span>
        )}
        {isLow && (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-sm bg-red-950/50 border border-red-600/30 text-red-400 text-[8px] font-bold uppercase tracking-wide animate-pulse">
            🚨 AXE RISK
          </span>
        )}
      </div>

      {/* ── Title + author ── */}
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold leading-snug truncate ${isHigh ? 'text-white' : 'text-slate-200'}`}>
          {entry.title}
          {/* "YOUR SERIES" badge — always visible regardless of view, no button attached */}
          {entry.isCurrentUser && (
            <span className="ml-2 text-[8px] font-bold text-red-400 border border-red-500/30 bg-red-500/10 px-1.5 py-0.5 rounded-sm uppercase align-middle">
              YOUR SERIES
            </span>
          )}
        </p>
        <p className="text-[10px] text-slate-600 truncate">{entry.author} · {entry.genre}</p>
      </div>

      {/* ── VOTES ──
           MANGAKA  → read-only number (no input)
           BOARD    → editable input that triggers live re-sort
      */}
      <div className="w-28 shrink-0 text-right">
        {view === 'board' ? (
          <input
            type="number"
            value={entry.votes}
            min={0}
            onChange={e => {
              // ← API: PUT /api/rankings/scores  Body: { id: entry.id, votes: val }
              onVoteChange(entry.id, Number(e.target.value));
            }}
            className="w-24 bg-[#121214] border border-[#2d2d34] rounded-md px-2 py-1 text-[11px] text-white font-mono text-right focus:outline-none focus:border-slate-500 transition-colors"
          />
        ) : (
          // MANGAKA: strictly read-only, no input element rendered
          <span className={`text-[12px] font-bold font-mono ${isHigh ? 'text-white' : 'text-slate-400'}`}>
            {entry.votes.toLocaleString()}
          </span>
        )}
      </div>

      {/* ── Trend ── */}
      <div className="w-12 shrink-0 flex justify-center">
        <TrendIcon trend={entry.trend} prevRank={entry.prevRank} rank={entry.rank} />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Props — identical to what App.tsx already passes
// ─────────────────────────────────────────────────────────────────────────────

interface LeaderboardAnalyticsProps {
  currentUser: User;
  series: Series[];
  ratings: Rating[];
  onRefreshAll: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main export
// ─────────────────────────────────────────────────────────────────────────────

export default function LeaderboardAnalytics({
  currentUser,
  series,
  ratings,
  onRefreshAll,
}: LeaderboardAnalyticsProps) {

  // ── Derive view from role — NO toggle button exposed to the user ──────────
  //   MANGAKA      → 'mangaka'  (read-only)
  //   BOARD_MEMBER → 'board'    (full admin)
  const view: DerivedView =
    currentUser.role === 'BOARD_MEMBER' ? 'board' : 'mangaka';

  // ── Filter state (period tab) ─────────────────────────────────────────────
  const [period, setPeriod] = useState<RankPeriod>('weekly');

  // ── Board cycle label ─────────────────────────────────────────────────────
  const [cycle, setCycle] = useState('Week 24 — 2026');

  // ── Rankings data — separate state per period ─────────────────────────────
  //   ← API: GET /api/rankings?type=weekly   (replace useState initialiser)
  //   ← API: GET /api/rankings?type=monthly  (replace useState initialiser)
  const [weeklyData,  setWeeklyData]  = useState<RankEntry[]>(() =>
    SEED_WEEKLY.map(e => ({ ...e }))
  );
  const [monthlyData, setMonthlyData] = useState<RankEntry[]>(() =>
    SEED_MONTHLY.map(e => ({ ...e }))
  );

  // Ingest modal state
  const [showIngestModal, setShowIngestModal] = useState(false);
  const [ingestSeriesId, setIngestSeriesId] = useState('');
  const [ingestVoteCount, setIngestVoteCount] = useState(15000);
  const [ingestSource, setIngestSource] = useState('Weekly');
  const [ingestMsg, setIngestMsg] = useState('');
  const [ingestSubmitting, setIngestSubmitting] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const entries    = period === 'weekly' ? weeklyData  : monthlyData;
  const setEntries = period === 'weekly' ? setWeeklyData : setMonthlyData;

  // ── Access guard — only BOARD_MEMBER and MANGAKA can reach this tab ───────
  if (currentUser.role !== 'BOARD_MEMBER' && currentUser.role !== 'MANGAKA') {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-5 text-center">
        <div className="w-16 h-16 rounded-full bg-[#1e1e24] border border-[#2d2d34] flex items-center justify-center">
          <Lock className="w-7 h-7 text-slate-600" />
        </div>
        <div>
          <p className="text-base font-bold text-white mb-1">Access Restricted</p>
          <p className="text-sm text-slate-500">
            This dashboard is available to Mangaka and Editorial Board members only.
          </p>
        </div>
      </div>
    );
  }

  // ── Derived display values ────────────────────────────────────────────────
  const userSeries  = entries.find(e => e.isCurrentUser);
  const userTier    = userSeries ? getTier(userSeries.rank) : null;

  // Critical banner: only for MANGAKA whose own series is in the AXE RISK zone
  const showCriticalBanner = view === 'mangaka' && userTier === 'low';

  // Stat counts for Board header chips
  const highCount   = entries.filter(e => getTier(e.rank) === 'high').length;
  const normalCount = entries.filter(e => getTier(e.rank) === 'normal').length;
  const lowCount    = entries.filter(e => getTier(e.rank) === 'low').length;
  const axedCount   = entries.filter(e => e.directive === 'axed').length;

  // ── Handler: edit votes and re-sort live (BOARD_MEMBER only) ─────────────
  const handleVoteChange = (id: string, val: number) => {
    // ← API: PUT /api/rankings/scores  Body: { entries: [{ id, votes: val }] }
    const resorted = entries
      .map(e => (e.id === id ? { ...e, votes: val } : e))
      .sort((a, b) => b.votes - a.votes)
      .map((e, i) => ({ ...e, prevRank: e.rank, rank: i + 1 }));
    setEntries(resorted);
  };

  // ── Handler: board directive (BOARD_MEMBER only) ──────────────────────────
  const handleDirective = (id: string, action: 'axed' | 'digital') => {
    // ← API: POST /api/rankings/directive  Body: { id, action, cycle }
    setEntries(prev =>
      prev.map(e => (e.id === id ? { ...e, directive: action } : e))
    );
  };

  // ── Handler: refresh from API ─────────────────────────────────────────────
  const handleRefresh = () => {
    // ← API: GET /api/rankings?type=${period}  then setEntries(res.data)
    onRefreshAll();
  };

  // ── Handler: ingest reader ratings and recalculate rankings ──────────────
  const handleIngest = async () => {
    if (!ingestSeriesId) {
      setIngestMsg('❌ Select a series.');
      return;
    }
    setIngestSubmitting(true);
    try {
      await apiClient.ratings.submit(ingestSeriesId, ingestVoteCount, ingestSource);
      setIngestMsg('🚀 Ratings data ingested! Rankings updated.');

      // Recalculate rankings: aggregate all ratings per series and re-sort
      const allRatings = await apiClient.ratings.getAll();
      const ratingsList = Array.isArray(allRatings) ? allRatings : (allRatings as any)?.data || [];
      const voteTotals: Record<string, number> = {};
      for (const r of ratingsList) {
        voteTotals[r.seriesId] = (voteTotals[r.seriesId] || 0) + (r.voteCount || 0);
      }

      const seriesMap: Record<string, Series> = {};
      for (const s of series) seriesMap[s._id] = s;

      const updated = entries.map(e => {
        const matchId = Object.keys(voteTotals).find(id => {
          const s = seriesMap[id];
          return s && s.title.toLowerCase() === e.title.toLowerCase();
        });
        if (matchId) return { ...e, votes: voteTotals[matchId] };
        return e;
      });

      const resorted = updated
        .sort((a, b) => b.votes - a.votes)
        .map((e, i) => ({ ...e, prevRank: e.rank, rank: i + 1 }));

      if (period === 'weekly') setWeeklyData(resorted);
      else setMonthlyData(resorted);

      onRefreshAll();
    } catch (err: any) {
      setIngestMsg(`❌ Failed: ${err.message}`);
    } finally {
      setIngestSubmitting(false);
    }
  };

  const parseCSV = (text: string) => {
    const lines = text.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
    if (lines.length <= 1) return [];
    
    const headers = lines[0].toLowerCase().split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));
    
    const titleIdx = headers.findIndex(h => h.includes('title') || h.includes('seriesid') || h.includes('name'));
    const votesIdx = headers.findIndex(h => h.includes('vote') || h.includes('count') || h.includes('rank') || h.includes('votes'));
    const sourceIdx = headers.findIndex(h => h.includes('source') || h.includes('period'));

    if (titleIdx === -1 || votesIdx === -1) {
      throw new Error("Invalid CSV format. Must contain columns: 'title' or 'seriesId' and 'votes' or 'voteCount'.");
    }

    const results = [];
    for (let i = 1; i < lines.length; i++) {
      const parts = lines[i].split(',').map(p => p.trim().replace(/^["']|["']$/g, ''));
      const titleOrId = parts[titleIdx];
      const votesVal = Number(parts[votesIdx]);
      const sourceVal = sourceIdx !== -1 && parts[sourceIdx] ? parts[sourceIdx] : 'Weekly';
      if (titleOrId && !isNaN(votesVal)) {
        results.push({ titleOrId, votes: votesVal, source: sourceVal });
      }
    }
    return results;
  };

  const parseJSON = (text: string) => {
    const data = JSON.parse(text);
    const results: any[] = [];
    if (Array.isArray(data)) {
      for (const item of data) {
        const titleOrId = item.seriesId || item.title || item.name;
        const votes = Number(item.voteCount || item.votes || item.count);
        const source = item.periodSource || item.source || 'Weekly';
        if (titleOrId && !isNaN(votes)) {
          results.push({ titleOrId, votes, source });
        }
      }
    }
    return results;
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      await handleUploadedFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      await handleUploadedFile(e.target.files[0]);
    }
  };

  const handleUploadedFile = async (file: File) => {
    setIngestSubmitting(true);
    setIngestMsg('');
    try {
      const text = await file.text();
      let records: any[] = [];
      if (file.name.endsWith('.csv')) {
        records = parseCSV(text);
      } else if (file.name.endsWith('.json')) {
        records = parseJSON(text);
      } else {
        throw new Error('Unsupported file format. Please upload a .csv or .json file.');
      }

      if (records.length === 0) {
        throw new Error('No valid entries found in the file.');
      }

      let successCount = 0;
      for (const record of records) {
        let resolvedSeriesId = '';
        const matchedSeries = series.find(s => 
          s._id === record.titleOrId || 
          s.title.toLowerCase() === record.titleOrId.toLowerCase()
        );
        if (matchedSeries) {
          resolvedSeriesId = matchedSeries._id;
        } else {
          continue;
        }

        await apiClient.ratings.submit(resolvedSeriesId, record.votes, record.source);
        successCount++;
      }

      setIngestMsg(`🚀 Successfully imported ${successCount} series rankings!`);
      handleRefresh();
    } catch (err: any) {
      setIngestMsg(`❌ Import Error: ${err.message}`);
    } finally {
      setIngestSubmitting(false);
    }
  };

  // ── Column header — directive column only rendered in board view ──────────
  const showDirectiveCol = view === 'board';

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-[calc(100vh-8rem)] bg-[#121214] rounded-md border border-[#2d2d34] shadow-2xl shadow-black overflow-hidden flex flex-col">

      {/* ════ HEADER ════ */}
      <header className="flex items-center justify-between gap-4 px-6 py-4 bg-[#181820] border-b border-[#2d2d34] shrink-0 flex-wrap">

        {/* Title block */}
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-md bg-red-600 flex items-center justify-center shrink-0">
            <BarChart3 className="w-3.5 h-3.5 text-white" />
          </div>
          <div>
            <h1 className="text-[13px] font-bold text-white leading-none uppercase tracking-wide">
              Series Rankings Dashboard
            </h1>
            {/*
              Sub-heading changes per role — matching screenshot specs:
              MANGAKA      → read-only indicator
              BOARD_MEMBER → "Editorial Board — 20/20 active slots"
            */}
            <p className="text-[10px] text-slate-500 mt-0.5">
              {view === 'board'
                ? <>Editorial Board · <span className="text-slate-400 font-semibold">{entries.length}/20 active slots</span></>
                : <>Mangaka View · <span className="text-slate-600">Read-only — rankings update each {period} cycle</span></>
              }
            </p>
          </div>
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-3 flex-wrap">

          {/* ── Period tab switcher (available to BOTH roles) ── */}
          <div className="flex border border-[#2d2d34] rounded-md overflow-hidden">
            {(['weekly', 'monthly'] as const).map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-3.5 py-1.5 text-[10px] font-bold uppercase tracking-wide transition-colors cursor-pointer ${
                  period === p
                    ? 'bg-[#2d2d34] text-white'
                    : 'bg-transparent text-slate-600 hover:text-slate-400'
                }`}
              >
                {p === 'weekly' ? '📅 Weekly' : '📆 Monthly'}
              </button>
            ))}
          </div>

          {/*
            ── Role indicator badge (DISPLAY ONLY — no toggle functionality) ──
            MANGAKA sees a muted slate badge.
            BOARD_MEMBER sees a red-accented shield badge.
            Neither badge is clickable — it is purely informational.
          */}
          {view === 'board' ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-red-600/10 border border-red-600/25 text-red-400 text-[10px] font-bold uppercase tracking-wide select-none">
              <Shield className="w-3.5 h-3.5" />
              Editorial Board
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#2d2d34] border border-[#3a3a44] text-slate-400 text-[10px] font-bold uppercase tracking-wide select-none">
              ✏ Mangaka View
            </div>
          )}

          {/* Reader Voting Form — BOARD_MEMBER only */}
          {view === 'board' && (
            <button
              onClick={() => { setShowIngestModal(true); setIngestMsg(''); setIngestSeriesId(''); setIngestVoteCount(15000); setIngestSource('Weekly'); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-red-600 text-white text-[10px] font-bold uppercase tracking-wide hover:bg-red-700 transition-colors cursor-pointer"
            >
              <Database className="w-3.5 h-3.5" />
              Reader Voting Form
            </button>
          )}

          {/* Refresh */}
          <button
            onClick={handleRefresh}
            title="Refresh data from API"
            className="p-1.5 rounded-md border border-[#2d2d34] text-slate-600 hover:text-white hover:border-slate-500 transition-all cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* ════ BODY ════ */}
      <div className="flex-1 overflow-y-auto">

        {/* ── CRITICAL ALERT BANNER — Mangaka only, fires when own series hits AXE RISK ── */}
        {showCriticalBanner && (
          <div className="mx-6 mt-5 flex items-start gap-3 px-4 py-3.5 rounded-md bg-red-950/40 border border-red-600/50">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse mt-1 shrink-0" />
            <div>
              <p className="text-xs font-bold text-red-300 leading-snug">
                ⚠️ CRITICAL SYSTEM NOTICE: Your series has spent consecutive periods in the bottom tier.
                Cancellation risk is HIGH.
              </p>
              <p className="text-[11px] text-red-400/70 mt-1 leading-relaxed">
                Immediately optimize your story panels and engagement strategies to recover rank before
                the next {period} review cycle.
              </p>
            </div>
          </div>
        )}

        {/* ── BOARD-ONLY: Cycle input + stat chips ── */}
        {view === 'board' && (
          <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 border-b border-[#2d2d34]">
            {/* Cycle label editor */}
            <div className="flex items-center gap-2">
              <Edit3 className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-widest shrink-0">
                Cycle:
              </label>
              <input
                type="text"
                value={cycle}
                onChange={e => setCycle(e.target.value)}
                className="bg-[#121214] border border-[#2d2d34] rounded-md px-3 py-1.5 text-sm text-white font-mono focus:outline-none focus:border-slate-500 transition-colors w-52"
              />
            </div>

            {/* Tier distribution chips */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-red-600/10 border border-red-600/20 text-red-400 text-[10px] font-bold">
                🔥 {highCount} Top Tier
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#2d2d34] border border-[#3a3a44] text-slate-400 text-[10px] font-bold">
                {normalCount} Normal
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-red-950/40 border border-red-600/25 text-red-400 text-[10px] font-bold">
                🚨 {lowCount} Axe Risk
              </span>
              {axedCount > 0 && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-black border border-[#2d2d34] text-slate-600 text-[10px] font-bold">
                  {axedCount} Terminated
                </span>
              )}
            </div>
          </div>
        )}

        {/* ── MANGAKA-ONLY: own series summary row ── */}
        {view === 'mangaka' && userSeries && (
          <div className="mx-6 mt-5 flex items-center gap-4 px-4 py-3 rounded-md bg-[#1e1e24] border border-red-600/30">
            <div className="w-2 h-8 rounded-sm bg-red-600 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-bold text-white truncate">{userSeries.title}</p>
              <p className="text-[9px] text-slate-500 mt-0.5">
                Current rank: <span className="text-white font-bold">#{userSeries.rank}</span>
                {' · '}
                {userTier === 'high'   && <span className="text-red-400">🔥 Top Competing</span>}
                {userTier === 'normal' && <span className="text-slate-400">Stable — Normal Tier</span>}
                {userTier === 'low'    && <span className="text-red-400 animate-pulse">🚨 Axe Risk Zone</span>}
              </p>
            </div>
            <span className="text-[11px] font-bold font-mono text-slate-400 shrink-0">
              {userSeries.votes.toLocaleString()} votes
            </span>
          </div>
        )}

        {/* ── Table column header ── */}
        <div className={`flex items-center gap-3 px-4 py-2 mt-4 bg-[#181820] border-y border-[#2d2d34] select-none`}>
          <div className="w-7 shrink-0 text-[8px] font-bold text-slate-600 uppercase tracking-widest text-center">#</div>
          <div className="w-[108px] shrink-0 text-[8px] font-bold text-slate-600 uppercase tracking-widest">Tier</div>
          <div className="flex-1 text-[8px] font-bold text-slate-600 uppercase tracking-widest">Series / Author</div>
          <div className="w-28 shrink-0 text-[8px] font-bold text-slate-600 uppercase tracking-widest text-right">
            {view === 'board' ? 'Edit Votes ↑↓' : 'Votes'}
          </div>
          <div className="w-12 shrink-0 text-[8px] font-bold text-slate-600 uppercase tracking-widest text-center">Trend</div>
          {/* Directive column header — only in board view */}
          {showDirectiveCol && (
            <div className="w-40 shrink-0 text-[8px] font-bold text-slate-600 uppercase tracking-widest text-right">
              Directive
            </div>
          )}
        </div>

        {/* ── Rank rows ── */}
        <div>
          {entries.map(entry => (
            <RankRow
              key={entry.id}
              entry={entry}
              view={view}
              onVoteChange={handleVoteChange}
            />
          ))}
        </div>

        {/* ── Footer ── */}
        <div className="px-6 py-5 border-t border-[#2d2d34]">
          <div className="flex items-center justify-between text-[9px] text-slate-700 font-mono flex-wrap gap-2">
            <span>
              {/* ← API: GET /api/rankings?type={period} */}
              Source: {period === 'weekly' ? 'Weekly Vote Cycle' : 'Monthly Aggregate'} · {cycle}
            </span>
            <span>
              {entries.filter(e => e.directive === 'active').length} active series / 20 max slots
            </span>
          </div>
        </div>

      </div>

      {/* ── Reader Voting Form Modal ── */}
      {showIngestModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80" onClick={() => setShowIngestModal(false)}></div>
          <div className="relative bg-[#1e1e24] border border-[#2d2d34] rounded-md shadow-2xl shadow-black w-full max-w-md overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[#2d2d34]">
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-red-400" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wide">Reader Voting Form</h3>
              </div>
              <button onClick={() => setShowIngestModal(false)} className="p-1 rounded-md hover:bg-[#2d2d34] transition-colors cursor-pointer">
                <X className="w-4 h-4 text-slate-500" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {ingestMsg && (
                <div className={`px-4 py-2.5 rounded-md border text-[11px] font-bold ${ingestMsg.startsWith('🚀') ? 'bg-green-600/10 border-green-600/30 text-green-400' : 'bg-red-600/10 border-red-600/30 text-red-400'}`}>
                  {ingestMsg}
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Series</label>
                <select
                  value={ingestSeriesId}
                  onChange={e => setIngestSeriesId(e.target.value)}
                  className="w-full bg-[#121214] border border-[#2d2d34] rounded-md px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-slate-500 cursor-pointer"
                  required
                >
                  <option value="">Select series...</option>
                  {series.filter(s => s.status !== 'PENDING').map(s => (
                    <option key={s._id} value={s._id}>{s.title}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Reader Vote Count</label>
                <input
                  type="number"
                  value={ingestVoteCount}
                  onChange={e => setIngestVoteCount(Number(e.target.value))}
                  className="w-full bg-[#121214] border border-[#2d2d34] rounded-md px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-slate-500"
                  min={1}
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Period Source</label>
                <select
                  value={ingestSource}
                  onChange={e => setIngestSource(e.target.value)}
                  className="w-full bg-[#121214] border border-[#2d2d34] rounded-md px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-slate-500 cursor-pointer"
                >
                  <option value="Weekly">Weekly</option>
                  <option value="Monthly">Monthly</option>
                </select>
              </div>

              {/* Drag and Drop Upload Area */}
              <div className="border-t border-[#2d2d34] pt-4">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Or Import CSV/JSON rankings file</label>
                <div 
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  className={`border-2 border-dashed rounded-md p-6 text-center cursor-pointer transition-all ${
                    dragActive 
                      ? 'border-red-500 bg-red-500/10' 
                      : 'border-[#2d2d34] hover:border-slate-500 bg-[#121214]'
                  }`}
                >
                  <p className="text-xs text-slate-400 font-bold mb-1">
                    Drag and drop your file here
                  </p>
                  <p className="text-[10px] text-slate-500 uppercase">
                    Supported: .csv, .json (must match 'title' &amp; 'votes')
                  </p>
                  <input 
                    type="file" 
                    id="rankings-file-upload" 
                    className="hidden" 
                    accept=".csv,.json"
                    onChange={handleFileChange}
                  />
                  <label 
                    htmlFor="rankings-file-upload" 
                    className="inline-block mt-3 px-3 py-1.5 bg-[#2d2d34] hover:bg-[#3a3a44] text-white text-[10px] font-bold uppercase rounded cursor-pointer transition-colors"
                  >
                    Select File
                  </label>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setShowIngestModal(false)}
                  className="flex-1 px-4 py-2.5 rounded-md border border-[#2d2d34] text-slate-400 text-[11px] font-bold uppercase tracking-wide hover:bg-[#2d2d34] transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleIngest}
                  disabled={ingestSubmitting}
                  className="flex-1 px-4 py-2.5 rounded-md bg-red-600 text-white text-[11px] font-bold uppercase tracking-wide hover:bg-red-700 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {ingestSubmitting ? 'Submitting...' : 'Ingest & Update'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
