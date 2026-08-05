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
import { apiClient } from '../../../api/client.ts';
import { StatsCard } from '../components/common/StatsCard.tsx';
import { LoadingState, ErrorState, StatusBadge } from '../components/common/States.tsx';
import { VoteTrendChart, RankingChart } from '../components/analytics/Charts.tsx';
import { SeriesCard, DeadlineCard, RankingBadge, VoteCounter, ProgressTimeline } from '../components/series/SeriesComponents.tsx';
import { useLanguage } from '../../../i18n/LanguageContext';
import { resolveSeriesCover, useSeriesCoverFallback } from '../utils/seriesCover';
import type { Proposal } from '../types/index.ts';

export const DashboardPage: React.FC = () => {
  const { language, t } = useLanguage();
  const { data: dashboardData, isLoading, error, refetch } = useQuery({
    queryKey: ['editor-dashboard-stats'],
    queryFn: () => apiClient.editor.getDashboard(),
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });

  const { data: mySeries } = useQuery({
    queryKey: ['editor-my-series'],
    queryFn: () => apiClient.editor.getMySeries(),
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });

  // Fetch pending proposals
  const { data: pendingProposals } = useQuery({
    queryKey: ['pending-proposals'],
    queryFn: () => apiClient.proposals.getAll('SUBMITTED'),
    staleTime: 0,
    refetchOnMount: 'always',
  });

  const { data: underReviewProposals } = useQuery({
    queryKey: ['under-review-proposals'],
    queryFn: () => apiClient.proposals.getAll('UNDER_REVIEW'),
    staleTime: 0,
    refetchOnMount: 'always',
  });

  const { data: revisionRequestedProposals } = useQuery({
    queryKey: ['revision-requested-proposals'],
    queryFn: () => apiClient.proposals.getAll('REVISION_REQUESTED'),
    staleTime: 0,
    refetchOnMount: 'always',
  });

  const { data: resubmittedProposals } = useQuery({
    queryKey: ['resubmitted-proposals'],
    queryFn: () => apiClient.proposals.getAll('RESUBMITTED'),
    staleTime: 0,
    refetchOnMount: 'always',
  });

  // Combine all proposals that still require an editor action.
  const pendingProposalItems = [
    ...(pendingProposals || []),
    ...(underReviewProposals || []),
    ...(revisionRequestedProposals || []),
    ...(resubmittedProposals || []),
  ];
  const allPendingProposals: Proposal[] = pendingProposalItems.map((p: any) => ({
    ...p,
    id: p._id || p.id || '',
    mangaka: p.mangakaId || p.mangaka || { name: p.mangakaName || 'Unknown' }
  })).slice(0, 3); // Show top 3

  if (isLoading) return <LoadingState message="Loading dashboard..." />;
  if (error) return <ErrorState onRetry={refetch} />;
  if (!dashboardData) return null;

  const rankedSeries = [...(mySeries || [])]
    .sort((a: any, b: any) => {
      const rankA = Number(a.currentRanking) > 0 ? Number(a.currentRanking) : Number.MAX_SAFE_INTEGER;
      const rankB = Number(b.currentRanking) > 0 ? Number(b.currentRanking) : Number.MAX_SAFE_INTEGER;
      return rankA - rankB || Number(b.totalVotes || 0) - Number(a.totalVotes || 0);
    })
    .slice(0, 3);

  const stats = {
    activeSeries: dashboardData.seriesCount || 0,
    pendingProposals: pendingProposalItems.length,
    pendingChapterReviews: dashboardData.pendingReviewCount || 0,
    upcomingDeadlines: dashboardData.deadlines?.nearDueCount || 0,
    delayedProjects: dashboardData.deadlines?.overdueCount || 0,
    topRankedSeries: rankedSeries.map((s: any) => ({
      id: s._id || s.id,
      title: s.title,
      coverUrl: resolveSeriesCover(s.title || '', s.imageUrl || s.coverImage),
      totalVotes: Number(s.totalVotes || 0),
      currentRanking: Number(s.currentRanking || 0),
      previousRanking: Number(s.previousRanking || 0),
      status: s.status || 'ACTIVE',
      currentStage: s.currentStage || 'STORY_PLANNING',
      completionPercentage: Number(s.completionPercentage || 0),
      publishedChapters: Number(s.publishedChapters || 0),
      totalChapters: Number(s.totalChapters || 0),
      voteHistory: s.voteHistory || [],
      rankingHistory: s.rankingHistory || [],
      progressHistory: s.progressHistory || [],
      mangaka: { name: s.originalAuthor || (typeof s.mangakaId === 'object' && s.mangakaId ? s.mangakaId.name : 'Unknown') },
    })),
    mostVotedSeries: [],
  };

  const deadlines = dashboardData.deadlines ? [
    ...(dashboardData.deadlines.overdue || []).map((d: any) => ({
      id: d.chapterId?._id || d.chapterId,
      title: t('Chapter {{number}} Review', { number: d.chapterNumber }),
      seriesTitle: d.seriesTitle || t('Unknown Series'),
      type: 'chapter_review' as const,
      dueDate: d.dueAt,
      daysRemaining: 0,
      priority: 'CRITICAL' as const,
    })),
    ...(dashboardData.deadlines.nearDue || []).map((d: any) => ({
      id: d.chapterId?._id || d.chapterId,
      title: t('Chapter {{number}} Review', { number: d.chapterNumber }),
      seriesTitle: d.seriesTitle || t('Unknown Series'),
      type: 'chapter_review' as const,
      dueDate: d.dueAt,
      daysRemaining: Math.ceil((new Date(d.dueAt).getTime() - Date.now()) / (1000 * 60 * 60 * 24)),
      priority: 'HIGH' as const,
    })),
  ] : [];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-syne font-extrabold text-2xl text-ink-black tracking-tight">
            {t('Editor Dashboard')}
          </h1>
          <p className="font-mono text-xs text-neutral-500 mt-0.5 uppercase tracking-widest">
            {t("Tantou Overview — Today's Status")}
          </p>
        </div>
        <div className="hidden md:flex items-center gap-2 bg-white border-2 border-ink-black px-3 py-2 shadow-[2px_2px_0px_#141414]">
          <Calendar className="w-3.5 h-3.5 text-neutral-500" />
          <span className="font-mono text-[10px] font-bold text-neutral-600 uppercase">
            {new Date().toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
        </div>
      </div>

      {/* ============ STATS GRID ============ */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        <StatsCard
          title="Total Series"
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
        <Link to="/editor/review" className="block group">
          <StatsCard
            title="Chapter Reviews"
            value={stats.pendingChapterReviews}
            icon={BookMarked}
            variant={stats.pendingChapterReviews > 0 ? 'warning' : 'default'}
            subtitle="Manuscripts pending"
            className="group-hover:-translate-y-0.5 group-hover:shadow-[4px_4px_0px_#E63946] transition-all"
          />
        </Link>
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
                {t('Deadline Alerts')}
              </h2>
              <Clock className="w-4 h-4 text-neutral-400" />
            </div>
            <div className="divide-y divide-neutral-100">
              {deadlines.length === 0 ? (
                <p className="font-mono text-xs text-neutral-400 text-center py-6">
                  {t('No pending deadlines')}
                </p>
              ) : deadlines.map((dl: any, idx: number) => (
                <div key={dl.id || `dl-${idx}`} className="p-3">
                  <DeadlineCard deadline={dl} />
                </div>
              ))}
            </div>
          </div>

          {/* Pending Proposals Quick View */}
          <div className="bg-white border-2 border-ink-black shadow-[4px_4px_0px_#141414]">
            <div className="px-4 py-3 border-b-2 border-ink-black bg-ink-black flex items-center justify-between">
              <h2 className="font-syne font-extrabold text-white text-xs uppercase tracking-widest">
                {t('Pending Proposals')}
              </h2>
              <FileText className="w-4 h-4 text-neutral-400" />
            </div>
            <div className="p-4 space-y-3">
              {allPendingProposals.length === 0 ? (
                <p className="font-mono text-xs text-neutral-400 text-center py-4">{t('No pending proposals')}</p>
              ) : (
                allPendingProposals.map((proposal: Proposal) => (
                  <div key={(proposal as any)._id || proposal.id} className="flex items-center justify-between p-3 bg-amber-50 border border-amber-300">
                    <div>
                      <p className="font-sans font-bold text-xs text-ink-black">{proposal.title}</p>
                      <p className="font-mono text-[9px] text-neutral-500">
                        {proposal.genre} · {proposal.mangaka?.name || t('Unknown')}
                      </p>
                    </div>
                    <Link
                      to={`/editor/proposals/${(proposal as any)._id || proposal.id}`}
                      className="text-[9px] font-mono font-extrabold text-[#E63946] uppercase hover:underline flex items-center gap-0.5"
                    >
                      {t('Review')} <ArrowRight className="w-3 h-3" />
                    </Link>
                  </div>
                ))
              )}
              <Link
                to="/editor/proposals"
                className="block text-center text-[9px] font-mono font-extrabold text-neutral-500 uppercase tracking-widest hover:text-ink-black transition-colors pt-1 hover:underline"
              >
                {t('View All Proposals')} →
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
                {t('Top Ranked Series')}
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
                    className={`w-7 h-7 flex items-center justify-center font-syne font-extrabold text-xs border-2 border-ink-black shrink-0 ${
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
                    onError={(event) => useSeriesCoverFallback(event.currentTarget, series.title)}
                    alt={series.title}
                    className="w-8 h-10 object-cover border border-neutral-200 shrink-0"
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
                {t('Vote Trend')} — {stats.topRankedSeries[0]?.title || t('No series found')}
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
                {t('Production Overview')}
              </h2>
              <TrendingUp className="w-4 h-4 text-neutral-400" />
            </div>
            <div className="divide-y divide-neutral-100">
              {stats.topRankedSeries.map((series) => (
                <div key={series.id} className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <img
                      src={series.coverUrl}
                      onError={(event) => useSeriesCoverFallback(event.currentTarget, series.title)}
                      alt={series.title}
                      className="w-8 h-10 object-cover border border-neutral-200 shrink-0"
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
                    currentStage={series.currentStage as any}
                    completionPercentage={series.completionPercentage}
                  />
                  <div className="flex items-center justify-between mt-2">
                    <span className="font-mono text-[9px] text-neutral-400">
                      {series.publishedChapters}/{series.totalChapters} {t('chapters')}
                    </span>
                    <Link
                      to={`/editor/series/${series.id}`}
                      className="text-[9px] font-mono font-extrabold text-[#E63946] uppercase hover:underline"
                    >
                      {t('View Detail')} →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Ranking Trend */}
          <RankingChart
            data={stats.topRankedSeries[0]?.rankingHistory ?? []}
            title={`${t('Ranking Trend')} — ${stats.topRankedSeries[0]?.title || t('No series found')}`}
          />
        </div>
      </div>
    </div>
  );
};
