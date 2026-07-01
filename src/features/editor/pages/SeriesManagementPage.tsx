import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Library,
  TrendingUp,
  Heart,
  Award,
  LayoutGrid,
  List,
  RefreshCw,
  Zap,
} from 'lucide-react';
import { apiClient } from '../../../api/client.ts';
import type { Series } from '../types/index.ts';
import { SearchInput, FilterDropdown } from '../components/common/DataTable.tsx';
import { LoadingState, ErrorState, StatusBadge } from '../components/common/States.tsx';
import { SeriesCard, RankingBadge, VoteCounter, ProgressTimeline } from '../components/series/SeriesComponents.tsx';
import { StatsCard } from '../components/common/StatsCard.tsx';

const STATUS_OPTIONS = [
  { value: 'ALL', label: 'All Statuses' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'ON_HIATUS', label: 'On Hiatus' },
  { value: 'COMPLETED', label: 'Completed' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

const SORT_OPTIONS = [
  { value: 'default', label: 'Default' },
  { value: 'votes', label: 'Most Voted' },
  { value: 'ranking', label: 'Top Ranked' },
  { value: 'deadline', label: 'Nearest Deadline' },
];

// =========================================================
// SERIES LIST ROW (for list view)
// =========================================================

const SeriesListRow: React.FC<{ series: Series }> = ({ series }) => (
  <Link
    to={`/editor/series/${series.id}`}
    className="flex items-center gap-4 p-4 bg-white border-2 border-ink-black shadow-[2px_2px_0px_#141414] hover:shadow-[4px_4px_0px_#141414] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all"
  >
    <img
      src={series.coverUrl}
      alt={series.title}
      className="w-12 h-16 object-cover border border-neutral-200 flex-shrink-0"
    />
    <div className="flex-1 min-w-0">
      <div className="flex items-center gap-2 mb-0.5">
        <h3 className="font-syne font-extrabold text-sm text-ink-black truncate">{series.title}</h3>
        <StatusBadge
          label={series.status.replace('_', ' ')}
          variant={series.status === 'ACTIVE' ? 'active' : series.status === 'ON_HIATUS' ? 'hiatus' : series.status === 'COMPLETED' ? 'completed' : 'danger'}
        />
      </div>
      <p className="font-mono text-[10px] text-neutral-500 mb-2">{series.mangaka.name} · {series.genre}</p>
      <ProgressTimeline currentStage={series.currentStage} completionPercentage={series.completionPercentage} />
    </div>
    <div className="flex flex-col items-end gap-2 flex-shrink-0">
      <RankingBadge rank={series.currentRanking} previous={series.previousRanking} size="sm" />
      <VoteCounter votes={series.totalVotes} />
      <span className="font-mono text-[9px] text-neutral-400">{series.publishedChapters}/{series.totalChapters} chapters</span>
    </div>
  </Link>
);

// =========================================================
// SERIES MANAGEMENT PAGE
// =========================================================

export const SeriesManagementPage: React.FC = () => {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('ALL');
  const [sortBy, setSortBy] = useState('default');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const { data: series, isLoading, error, refetch } = useQuery({
    queryKey: ['editor-my-series'],
    queryFn: () => apiClient.editor.getMySeries(),
    select: (rawData: any[]) => {
      let result = rawData || [];
      if (status !== 'ALL') {
        result = result.filter((s: any) => s.status === status);
      }
      if (search) {
        const q = search.toLowerCase();
        result = result.filter(
          (s: any) =>
            (s.title || '').toLowerCase().includes(q) ||
            (s.mangaka?.name || s.mangakaId?.name || '').toLowerCase().includes(q) ||
            (s.genre || '').toLowerCase().includes(q),
        );
      }
      if (sortBy === 'votes') {
        result.sort((a: any, b: any) => (b.totalVotes || 0) - (a.totalVotes || 0));
      } else if (sortBy === 'ranking') {
        result.sort((a: any, b: any) => (a.currentRanking || 999) - (b.currentRanking || 999));
      } else if (sortBy === 'deadline') {
        result.sort((a: any, b: any) => new Date(a.deadline || 0).getTime() - new Date(b.deadline || 0).getTime());
      }
      return result.map((s: any) => ({
        id: s._id,
        title: s.title,
        synopsis: s.synopsis || '',
        genre: s.genre || '',
        tags: s.tags || [],
        coverUrl: s.coverImage || 'https://picsum.photos/seed/default/400/560',
        mangaka: {
          id: s.mangakaId?._id || s.mangaka?.id || '',
          name: typeof s.mangakaId === 'object' && s.mangakaId ? s.mangakaId.name : s.mangaka?.name || 'Unknown',
          avatar: s.mangaka?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default',
          email: s.mangaka?.email || '',
          totalSeries: s.mangaka?.totalSeries || 0,
          joinedDate: s.mangaka?.joinedDate || '',
        },
        assignedEditorId: s.assignedEditorId || '',
        status: s.status || 'ACTIVE',
        currentStage: s.currentStage || 'STORY_PLANNING',
        completionPercentage: s.completionPercentage || 0,
        deadline: s.deadline || '',
        remainingDays: s.remainingDays || 0,
        totalChapters: s.totalChapters || 0,
        publishedChapters: s.publishedChapters || 0,
        currentRanking: s.currentRanking || 0,
        previousRanking: s.previousRanking || 0,
        totalVotes: s.totalVotes || 0,
        averageVotesPerChapter: s.averageVotesPerChapter || 0,
        highestVotedChapter: s.highestVotedChapter || '',
        latestChapterVotes: s.latestChapterVotes || 0,
        startDate: s.startDate || '',
        chapters: s.chapters || [],
        productionLogs: s.productionLogs || [],
        editorialNotes: s.editorialNotes || [],
        revisionHistory: s.revisionHistory || [],
        rankingHistory: s.rankingHistory || [],
        voteHistory: s.voteHistory || [],
        progressHistory: s.progressHistory || [],
      }));
    },
  });

  const topRanked = series ? [...series].sort((a, b) => a.currentRanking - b.currentRanking).slice(0, 3) : [];
  const mostVoted = series ? [...series].sort((a, b) => b.totalVotes - a.totalVotes).slice(0, 3) : [];
  const fastestGrowing = series
    ? [...series]
        .sort((a, b) => {
          const aGrowth = a.previousRanking - a.currentRanking;
          const bGrowth = b.previousRanking - b.currentRanking;
          return bGrowth - aGrowth;
        })
        .slice(0, 3)
    : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-syne font-extrabold text-2xl text-ink-black tracking-tight">
            Series Management
          </h1>
          <p className="font-mono text-xs text-neutral-500 mt-0.5 uppercase tracking-widest">
            Assigned Series — Production Monitor
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-1.5 px-3 py-2 bg-white border-2 border-ink-black text-xs font-mono font-bold uppercase shadow-[2px_2px_0px_#141414] hover:bg-neutral-50 transition-colors cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Refresh
        </button>
      </div>

      {/* Summary widgets */}
      {series && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatsCard title="Total Series" value={series.length} icon={Library} />
          <StatsCard
            title="Active"
            value={series.filter(s => s.status === 'ACTIVE').length}
            icon={TrendingUp}
            variant="success"
          />
          <StatsCard
            title="On Hiatus"
            value={series.filter(s => s.status === 'ON_HIATUS').length}
            icon={Award}
            variant="warning"
          />
          <StatsCard
            title="Total Votes"
            value={series.reduce((sum, s) => sum + s.totalVotes, 0).toLocaleString()}
            icon={Heart}
          />
        </div>
      )}

      {/* Widgets Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Top Ranked */}
        <div className="bg-white border-2 border-ink-black shadow-[4px_4px_0px_#141414]">
          <div className="px-4 py-3 border-b-2 border-ink-black bg-ink-black flex items-center gap-2">
            <Award className="w-4 h-4 text-yellow-400" />
            <h3 className="font-syne font-extrabold text-white text-xs uppercase tracking-widest">Top Ranked</h3>
          </div>
          <div className="divide-y divide-neutral-100">
            {topRanked.map((s, i) => (
              <Link key={s.id} to={`/editor/series/${s.id}`} className="flex items-center gap-3 p-3 hover:bg-neutral-50 transition-colors">
                <span className={`w-6 h-6 flex items-center justify-center text-[10px] font-syne font-extrabold border-2 border-ink-black ${i === 0 ? 'bg-yellow-400' : i === 1 ? 'bg-neutral-300' : 'bg-amber-600 text-white'}`}>
                  {s.currentRanking}
                </span>
                <img src={s.coverUrl} alt={s.title} className="w-7 h-9 object-cover border border-neutral-200 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-sans font-bold text-xs text-ink-black truncate">{s.title}</p>
                  <VoteCounter votes={s.totalVotes} label="" />
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Most Voted */}
        <div className="bg-white border-2 border-ink-black shadow-[4px_4px_0px_#141414]">
          <div className="px-4 py-3 border-b-2 border-ink-black bg-ink-black flex items-center gap-2">
            <Heart className="w-4 h-4 text-[#E63946]" />
            <h3 className="font-syne font-extrabold text-white text-xs uppercase tracking-widest">Most Voted</h3>
          </div>
          <div className="divide-y divide-neutral-100">
            {mostVoted.map((s) => (
              <Link key={s.id} to={`/editor/series/${s.id}`} className="flex items-center gap-3 p-3 hover:bg-neutral-50 transition-colors">
                <img src={s.coverUrl} alt={s.title} className="w-7 h-9 object-cover border border-neutral-200 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="font-sans font-bold text-xs text-ink-black truncate">{s.title}</p>
                  <VoteCounter votes={s.totalVotes} />
                </div>
                <RankingBadge rank={s.currentRanking} size="sm" />
              </Link>
            ))}
          </div>
        </div>

        {/* Fastest Growing */}
        <div className="bg-white border-2 border-ink-black shadow-[4px_4px_0px_#141414]">
          <div className="px-4 py-3 border-b-2 border-ink-black bg-ink-black flex items-center gap-2">
            <Zap className="w-4 h-4 text-emerald-400" />
            <h3 className="font-syne font-extrabold text-white text-xs uppercase tracking-widest">Fastest Growing</h3>
          </div>
          <div className="divide-y divide-neutral-100">
            {fastestGrowing.map((s) => {
              const growth = s.previousRanking - s.currentRanking;
              return (
                <Link key={s.id} to={`/editor/series/${s.id}`} className="flex items-center gap-3 p-3 hover:bg-neutral-50 transition-colors">
                  <img src={s.coverUrl} alt={s.title} className="w-7 h-9 object-cover border border-neutral-200 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-sans font-bold text-xs text-ink-black truncate">{s.title}</p>
                    <RankingBadge rank={s.currentRanking} previous={s.previousRanking} size="sm" />
                  </div>
                  <span className={`font-syne font-extrabold text-sm ${growth > 0 ? 'text-emerald-600' : growth < 0 ? 'text-red-600' : 'text-neutral-400'}`}>
                    {growth > 0 ? `+${growth}` : growth}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Filters + View Toggle */}
      <div className="flex items-center gap-3 flex-wrap">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search series..."
          className="flex-1 min-w-48"
        />
        <FilterDropdown
          value={status}
          onChange={setStatus}
          options={STATUS_OPTIONS}
        />
        <FilterDropdown
          value={sortBy}
          onChange={setSortBy}
          options={SORT_OPTIONS}
        />
        <div className="flex border-2 border-ink-black overflow-hidden shadow-[2px_2px_0px_#141414]">
          <button
            onClick={() => setViewMode('grid')}
            className={`px-3 py-2 cursor-pointer ${viewMode === 'grid' ? 'bg-ink-black text-white' : 'bg-white text-neutral-500 hover:bg-neutral-50'}`}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-2 cursor-pointer border-l-2 border-ink-black ${viewMode === 'list' ? 'bg-ink-black text-white' : 'bg-white text-neutral-500 hover:bg-neutral-50'}`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Series Display */}
      {isLoading ? (
        <LoadingState message="Loading series..." />
      ) : error ? (
        <ErrorState onRetry={refetch} />
      ) : !series || series.length === 0 ? (
        <div className="py-20 text-center border-2 border-dashed border-neutral-300 bg-neutral-50">
          <Library className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
          <p className="font-syne font-extrabold text-sm text-neutral-500 uppercase tracking-widest">No series found</p>
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {series.map((s) => (
            <SeriesCard key={s.id} series={s} />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {series.map((s) => (
            <SeriesListRow key={s.id} series={s} />
          ))}
        </div>
      )}
    </div>
  );
};
