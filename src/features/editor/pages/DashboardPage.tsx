import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  FileText,
  BookMarked,
  Clock,
  AlertTriangle,
  TrendingUp,
  Heart,
  Award,
  ArrowRight,
  Calendar,
} from 'lucide-react';
import { dashboardService } from '../services/index.ts';
import { StatsCard } from '../components/common/StatsCard.tsx';
import { LoadingState, ErrorState, StatusBadge } from '../components/common/States.tsx';
import { VoteTrendChart, RankingChart } from '../components/analytics/Charts.tsx';
import { SeriesCard, DeadlineCard, RankingBadge, VoteCounter, ProgressTimeline } from '../components/series/SeriesComponents.tsx';
import { mockDeadlines } from '../mock/data.ts';

export const DashboardPage: React.FC = () => {
  const { data: stats, isLoading, error, refetch } = useQuery({
    queryKey: ['editor-dashboard-stats'],
    queryFn: dashboardService.getStats,
  });

  const { data: deadlines } = useQuery({
    queryKey: ['editor-deadlines'],
    queryFn: dashboardService.getDeadlines,
  });

  if (isLoading) return <LoadingState message="Loading dashboard..." />;
  if (error) return <ErrorState onRetry={refetch} />;
  if (!stats) return null;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-syne font-extrabold text-2xl text-ink-black tracking-tight">
            Editor Dashboard
          </h1>
          <p className="font-mono text-xs text-neutral-500 mt-0.5 uppercase tracking-widest">
            Tantou Overview — Today's Status
          </p>
        </div>
        <div className="hidden md:flex items-center gap-2 bg-white border-2 border-ink-black px-3 py-2 shadow-[2px_2px_0px_#141414]">
          <Calendar className="w-3.5 h-3.5 text-neutral-500" />
          <span className="font-mono text-[10px] font-bold text-neutral-600 uppercase">
            {new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        </div>
      </div>

      {/* ============ STATS GRID ============ */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatsCard
          title="Active Series"
          value={stats.activeSeries}
          icon={BookOpen}
          trend={{ value: 0, label: 'vs last month' }}
        />
        <StatsCard
          title="Pending Proposals"
          value={stats.pendingProposals}
          icon={FileText}
          variant={stats.pendingProposals > 0 ? 'warning' : 'default'}
          trend={{ value: stats.pendingProposals, label: 'awaiting review' }}
        />
        <StatsCard
          title="Chapter Reviews"
          value={stats.pendingChapterReviews}
          icon={BookMarked}
          variant={stats.pendingChapterReviews > 0 ? 'warning' : 'default'}
          subtitle="Manuscripts pending"
        />
        <StatsCard
          title="Upcoming Deadlines"
          value={stats.upcomingDeadlines}
          icon={Clock}
          variant={stats.upcomingDeadlines > 0 ? 'warning' : 'default'}
          subtitle="Within 7 days"
        />
        <StatsCard
          title="Delayed Projects"
          value={stats.delayedProjects}
          icon={AlertTriangle}
          variant={stats.delayedProjects > 0 ? 'danger' : 'success'}
          subtitle="Overdue"
        />
      </div>

      {/* ============ MAIN CONTENT GRID ============ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* LEFT COL: Deadlines + Pending Reviews */}
        <div className="space-y-4">
          {/* Deadline Alerts */}
          <div className="bg-white border-2 border-ink-black shadow-[4px_4px_0px_#141414]">
            <div className="px-4 py-3 border-b-2 border-ink-black bg-ink-black flex items-center justify-between">
              <h2 className="font-syne font-extrabold text-white text-xs uppercase tracking-widest">
                Deadline Alerts
              </h2>
              <Clock className="w-4 h-4 text-neutral-400" />
            </div>
            <div className="divide-y divide-neutral-100">
              {(deadlines ?? mockDeadlines).map((dl) => (
                <div key={dl.id} className="p-3">
                  <DeadlineCard deadline={dl} />
                </div>
              ))}
            </div>
          </div>

          {/* Pending Proposals Quick View */}
          <div className="bg-white border-2 border-ink-black shadow-[4px_4px_0px_#141414]">
            <div className="px-4 py-3 border-b-2 border-ink-black bg-ink-black flex items-center justify-between">
              <h2 className="font-syne font-extrabold text-white text-xs uppercase tracking-widest">
                Pending Reviews
              </h2>
              <FileText className="w-4 h-4 text-neutral-400" />
            </div>
            <div className="p-4 space-y-3">
              <div className="flex items-center justify-between p-3 bg-amber-50 border border-amber-300">
                <div>
                  <p className="font-sans font-bold text-xs text-ink-black">Crimson Blade Ch.6</p>
                  <p className="font-mono text-[9px] text-neutral-500">Manuscript Review</p>
                </div>
                <Link
                  to="/editor/review/series-001"
                  className="text-[9px] font-mono font-extrabold text-[#E63946] uppercase hover:underline flex items-center gap-0.5"
                >
                  Review <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
              <div className="flex items-center justify-between p-3 bg-amber-50 border border-amber-300">
                <div>
                  <p className="font-sans font-bold text-xs text-ink-black">Iron Dragon Ch.2</p>
                  <p className="font-mono text-[9px] text-neutral-500">Manuscript Review</p>
                </div>
                <Link
                  to="/editor/review/series-002"
                  className="text-[9px] font-mono font-extrabold text-[#E63946] uppercase hover:underline flex items-center gap-0.5"
                >
                  Review <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
              <Link
                to="/editor/proposals"
                className="block text-center text-[9px] font-mono font-extrabold text-neutral-500 uppercase tracking-widest hover:text-ink-black transition-colors pt-1 hover:underline"
              >
                View All Proposals →
              </Link>
            </div>
          </div>
        </div>

        {/* CENTER COL: Top Ranked + Most Voted */}
        <div className="space-y-4">
          {/* Top Ranked Series */}
          <div className="bg-white border-2 border-ink-black shadow-[4px_4px_0px_#141414]">
            <div className="px-4 py-3 border-b-2 border-ink-black bg-ink-black flex items-center justify-between">
              <h2 className="font-syne font-extrabold text-white text-xs uppercase tracking-widest">
                Top Ranked Series
              </h2>
              <Award className="w-4 h-4 text-yellow-400" />
            </div>
            <div className="divide-y divide-neutral-100">
              {stats.topRankedSeries.map((series, i) => (
                <Link
                  key={series.id}
                  to={`/editor/series/${series.id}`}
                  className="flex items-center gap-3 p-3 hover:bg-neutral-50 transition-colors"
                >
                  <span
                    className={`w-7 h-7 flex items-center justify-center font-syne font-extrabold text-xs border-2 border-ink-black flex-shrink-0 ${
                      i === 0
                        ? 'bg-yellow-400 text-ink-black'
                        : i === 1
                        ? 'bg-neutral-400 text-white'
                        : 'bg-amber-700 text-white'
                    }`}
                  >
                    #{i + 1}
                  </span>
                  <img
                    src={series.coverUrl}
                    alt={series.title}
                    className="w-8 h-10 object-cover border border-neutral-200 flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-sans font-bold text-xs text-ink-black truncate">{series.title}</p>
                    <VoteCounter votes={series.totalVotes} label="" />
                  </div>
                  <RankingBadge rank={series.currentRanking} previous={series.previousRanking} size="sm" />
                </Link>
              ))}
            </div>
          </div>

          {/* Vote Trend */}
          <div className="bg-white border-2 border-ink-black shadow-[4px_4px_0px_#141414]">
            <div className="px-4 py-3 border-b-2 border-ink-black bg-ink-black">
              <h2 className="font-syne font-extrabold text-white text-xs uppercase tracking-widest">
                Vote Trend — Crimson Blade
              </h2>
            </div>
            <div className="p-4">
              <VoteTrendChart data={stats.topRankedSeries[0]?.voteHistory ?? []} />
            </div>
          </div>
        </div>

        {/* RIGHT COL: Production Progress Overview */}
        <div className="space-y-4">
          {/* Production Overview */}
          <div className="bg-white border-2 border-ink-black shadow-[4px_4px_0px_#141414]">
            <div className="px-4 py-3 border-b-2 border-ink-black bg-ink-black flex items-center justify-between">
              <h2 className="font-syne font-extrabold text-white text-xs uppercase tracking-widest">
                Production Overview
              </h2>
              <TrendingUp className="w-4 h-4 text-neutral-400" />
            </div>
            <div className="divide-y divide-neutral-100">
              {stats.topRankedSeries.map((series) => (
                <div key={series.id} className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <img
                      src={series.coverUrl}
                      alt={series.title}
                      className="w-8 h-10 object-cover border border-neutral-200 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-sans font-bold text-xs text-ink-black truncate">{series.title}</p>
                      <StatusBadge
                        label={series.status.replace('_', ' ')}
                        variant={series.status === 'ACTIVE' ? 'active' : series.status === 'ON_HIATUS' ? 'hiatus' : 'default'}
                      />
                    </div>
                  </div>
                  <ProgressTimeline
                    currentStage={series.currentStage}
                    completionPercentage={series.completionPercentage}
                  />
                  <div className="flex items-center justify-between mt-2">
                    <span className="font-mono text-[9px] text-neutral-400">
                      {series.publishedChapters}/{series.totalChapters} chapters
                    </span>
                    <Link
                      to={`/editor/series/${series.id}`}
                      className="text-[9px] font-mono font-extrabold text-[#E63946] uppercase hover:underline"
                    >
                      View Detail →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Ranking Trend */}
          <RankingChart
            data={stats.topRankedSeries[0]?.rankingHistory ?? []}
            title="Ranking Trend — Crimson Blade"
          />
        </div>
      </div>
    </div>
  );
};
