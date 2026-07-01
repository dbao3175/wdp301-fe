import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft,
  BookOpen,
  Calendar,
  Heart,
  Award,
  TrendingUp,
  TrendingDown,
  FileEdit,
  Clock,
  CheckCircle2,
  AlertCircle,
  StickyNote,
  RotateCcw,
  Eye,
} from 'lucide-react';
import { apiClient } from '../../../api/client.ts';
import type { ProductionLog, EditorialNote, RevisionHistory } from '../types/index.ts';
import { LoadingState, ErrorState, StatusBadge } from '../components/common/States.tsx';
import { RankingChart, VoteTrendChart, ProgressChart } from '../components/analytics/Charts.tsx';
import { RankingBadge, VoteCounter, ProgressTimeline, STAGE_LABELS } from '../components/series/SeriesComponents.tsx';

// =========================================================
// SECTION TAB NAV
// =========================================================

type Tab = 'overview' | 'chapters' | 'production' | 'revisions' | 'notes';

const TAB_LABELS: Record<Tab, string> = {
  overview: 'Overview',
  chapters: 'Chapters',
  production: 'Production Logs',
  revisions: 'Revision History',
  notes: 'Editorial Notes',
};

// =========================================================
// CHAPTER STATUS BADGE
// =========================================================

const chapterStatusVariant: Record<string, string> = {
  DRAFT: 'default',
  SUBMITTED: 'submitted',
  UNDER_REVIEW: 'under_review',
  REVISION_REQUESTED: 'revision',
  APPROVED: 'approved',
  SENT_TO_EDITORIAL: 'sent',
  PUBLISHED: 'published',
};

// =========================================================
// PRODUCTION LOG ITEM
// =========================================================

const ProductionLogItem: React.FC<{ log: ProductionLog }> = ({ log }) => (
  <div className="flex gap-3 pb-4 relative">
    {/* Timeline dot */}
    <div className="flex flex-col items-center flex-shrink-0">
      <div className="w-3 h-3 bg-[#E63946] border-2 border-ink-black mt-0.5" />
      <div className="w-px flex-1 bg-neutral-200 mt-1" />
    </div>
    <div className="flex-1 pb-2">
      <div className="flex items-center gap-2 mb-1">
        <span className="px-1.5 py-0.5 bg-ink-black text-white text-[8px] font-mono uppercase font-bold">
          {STAGE_LABELS[log.stage]}
        </span>
        <span className="font-mono text-[9px] text-neutral-400">
          {new Date(log.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
        </span>
      </div>
      <p className="font-sans text-xs text-neutral-700 leading-relaxed">{log.description}</p>
      <div className="flex items-center gap-2 mt-1.5">
        <div className="flex-1 h-1 bg-neutral-200">
          <div
            className="h-full bg-[#E63946]"
            style={{ width: `${log.completionPercentage}%` }}
          />
        </div>
        <span className="font-mono text-[9px] text-neutral-500">{log.completionPercentage}%</span>
      </div>
      <p className="font-mono text-[9px] text-neutral-400 mt-1">by {log.authorName}</p>
    </div>
  </div>
);

// =========================================================
// EDITORIAL NOTE ITEM
// =========================================================

const EditorialNoteItem: React.FC<{ note: EditorialNote }> = ({ note }) => (
  <div className={`p-4 border-2 ${note.isImportant ? 'border-[#E63946] bg-red-50' : 'border-neutral-200 bg-white'}`}>
    <div className="flex items-start gap-2">
      {note.isImportant ? (
        <AlertCircle className="w-4 h-4 text-[#E63946] flex-shrink-0 mt-0.5" />
      ) : (
        <StickyNote className="w-4 h-4 text-neutral-400 flex-shrink-0 mt-0.5" />
      )}
      <div className="flex-1">
        <p className="font-sans text-xs text-ink-black leading-relaxed">{note.content}</p>
        <div className="flex items-center gap-2 mt-2">
          <span className="font-mono text-[9px] text-neutral-400">
            {note.authorName} · {new Date(note.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
          {note.isImportant && (
            <span className="text-[8px] font-mono bg-red-100 text-red-600 px-1.5 py-0.5 border border-red-300 uppercase font-bold">
              Important
            </span>
          )}
        </div>
      </div>
    </div>
  </div>
);

// =========================================================
// REVISION HISTORY ITEM
// =========================================================

const RevisionItem: React.FC<{ revision: RevisionHistory }> = ({ revision }) => (
  <div className="flex items-start gap-3 p-3 border-b border-neutral-100 last:border-b-0">
    <div
      className={`w-2 h-2 mt-1.5 flex-shrink-0 ${
        revision.status === 'RESOLVED' ? 'bg-emerald-500' : 'bg-orange-500'
      }`}
    />
    <div className="flex-1">
      <p className="font-sans text-xs text-ink-black">{revision.description}</p>
      <div className="flex items-center gap-2 mt-1">
        <span className="font-mono text-[9px] text-neutral-400">
          Requested by {revision.requestedBy}
        </span>
        {revision.resolvedAt && (
          <span className="font-mono text-[9px] text-emerald-600">
            · Resolved {new Date(revision.resolvedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </span>
        )}
      </div>
    </div>
    <span
      className={`flex-shrink-0 text-[8px] font-mono font-extrabold uppercase px-1.5 py-0.5 border ${
        revision.status === 'RESOLVED'
          ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
          : 'bg-orange-50 text-orange-700 border-orange-300'
      }`}
    >
      {revision.status}
    </span>
  </div>
);

// =========================================================
// SERIES DETAIL PAGE
// =========================================================

export const SeriesDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  const { data: series, isLoading, error } = useQuery({
    queryKey: ['series', id],
    queryFn: () =>
      apiClient.editor.getMySeries().then((data: any[]) => {
        const found = data.find((s: any) => s._id === id || s.id === id);
        if (!found) return null;
        return {
          id: found._id,
          title: found.title,
          synopsis: found.synopsis || '',
          genre: found.genre || '',
          tags: found.tags || [],
          coverUrl: found.coverImage || 'https://picsum.photos/seed/default/400/560',
          mangaka: {
            id: found.mangakaId?._id || found.mangaka?.id || '',
            name: typeof found.mangakaId === 'object' && found.mangakaId ? found.mangakaId.name : found.mangaka?.name || 'Unknown',
            avatar: found.mangaka?.avatar || 'https://api.dicebear.com/7.x/avataaars/svg?seed=default',
            email: found.mangaka?.email || '',
            totalSeries: found.mangaka?.totalSeries || 0,
            joinedDate: found.mangaka?.joinedDate || '',
          },
          assignedEditorId: found.assignedEditorId || '',
          status: found.status || 'ACTIVE',
          currentStage: found.currentStage || 'STORY_PLANNING',
          completionPercentage: found.completionPercentage || 0,
          deadline: found.deadline || '',
          remainingDays: found.remainingDays || 0,
          totalChapters: found.totalChapters || 0,
          publishedChapters: found.publishedChapters || 0,
          currentRanking: found.currentRanking || 0,
          previousRanking: found.previousRanking || 0,
          totalVotes: found.totalVotes || 0,
          averageVotesPerChapter: found.averageVotesPerChapter || 0,
          highestVotedChapter: found.highestVotedChapter || '',
          latestChapterVotes: found.latestChapterVotes || 0,
          startDate: found.startDate || '',
          chapters: (found.chapters || []).map((ch: any) => ({
            id: ch._id || ch.id,
            seriesId: ch.seriesId || id,
            chapterNumber: ch.chapterNumber || 0,
            title: ch.title || '',
            status: ch.status || 'DRAFT',
            submittedDate: ch.submittedDate || '',
            lastUpdated: ch.lastUpdated || '',
            pages: ch.pages || [],
            totalPages: ch.totalPages || 0,
            votes: ch.votes || 0,
            reviewNotes: ch.reviewNotes || '',
            deadline: ch.deadline || '',
            mangakaName: ch.mangakaName || '',
          })),
          productionLogs: found.productionLogs || [],
          editorialNotes: found.editorialNotes || [],
          revisionHistory: found.revisionHistory || [],
          rankingHistory: found.rankingHistory || [],
          voteHistory: found.voteHistory || [],
          progressHistory: found.progressHistory || [],
        };
      }),
    enabled: !!id,
  });

  if (isLoading) return <LoadingState message="Loading series..." />;
  if (error || !series) return <ErrorState message="Series not found" />;

  const rankChange = series.previousRanking - series.currentRanking;

  return (
    <div className="space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/editor/series')}
          className="flex items-center gap-1.5 px-3 py-2 bg-white border-2 border-ink-black text-xs font-mono font-bold uppercase shadow-[2px_2px_0px_#141414] hover:bg-neutral-50 transition-colors cursor-pointer flex-shrink-0"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </button>
        <Link
          to={`/editor/review/${series.id}`}
          className="flex items-center gap-1.5 px-3 py-2 bg-[#E63946] text-white border-2 border-red-700 text-xs font-mono font-bold uppercase shadow-[2px_2px_0px_#141414] hover:bg-red-600 transition-colors cursor-pointer flex-shrink-0"
        >
          <Eye className="w-3.5 h-3.5" /> Review Chapters
        </Link>
      </div>

      {/* Series Hero */}
      <div className="bg-white border-2 border-ink-black shadow-[6px_6px_0px_#141414] overflow-hidden">
        <div className="flex gap-0">
          {/* Cover */}
          <div className="w-32 md:w-48 flex-shrink-0 overflow-hidden">
            <img
              src={series.coverUrl}
              alt={series.title}
              className="w-full h-full object-cover"
            />
          </div>
          {/* Info */}
          <div className="flex-1 p-5 md:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="font-syne font-extrabold text-xl md:text-2xl text-ink-black tracking-tight">
                    {series.title}
                  </h1>
                  <StatusBadge
                    label={series.status.replace('_', ' ')}
                    variant={series.status === 'ACTIVE' ? 'active' : series.status === 'ON_HIATUS' ? 'hiatus' : 'completed'}
                  />
                </div>
                <div className="flex items-center gap-3 mb-3">
                  <img
                    src={series.mangaka.avatar}
                    alt={series.mangaka.name}
                    className="w-6 h-6 border border-neutral-200"
                  />
                  <span className="font-sans text-sm text-neutral-600 font-medium">{series.mangaka.name}</span>
                  <span className="font-mono text-[10px] bg-neutral-100 px-2 py-0.5 border border-neutral-200 uppercase">
                    {series.genre}
                  </span>
                </div>
                <p className="font-sans text-xs text-neutral-600 leading-relaxed max-w-2xl line-clamp-3">
                  {series.synopsis}
                </p>
              </div>
              {/* Key Stats */}
              <div className="flex-shrink-0 space-y-2 hidden md:block">
                <RankingBadge rank={series.currentRanking} previous={series.previousRanking} size="lg" />
                <VoteCounter votes={series.totalVotes} />
              </div>
            </div>
            {/* Tags */}
            <div className="flex flex-wrap gap-1.5 mt-3">
              {series.tags.map((tag) => (
                <span
                  key={tag}
                  className="px-2 py-0.5 bg-neutral-100 border border-neutral-300 text-[9px] font-mono text-neutral-600 uppercase"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Key Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Production Stage */}
        <div className="bg-white border-2 border-ink-black shadow-[4px_4px_0px_#141414] p-4">
          <p className="font-mono text-[9px] font-extrabold uppercase text-neutral-400 mb-2">Current Stage</p>
          <p className="font-syne font-extrabold text-sm text-ink-black">{STAGE_LABELS[series.currentStage]}</p>
          <div className="mt-2 h-1.5 bg-neutral-200">
            <div className="h-full bg-[#E63946]" style={{ width: `${series.completionPercentage}%` }} />
          </div>
          <p className="font-mono text-xs font-bold text-[#E63946] mt-1">{series.completionPercentage}%</p>
        </div>

        {/* Deadline */}
        <div className={`bg-white border-2 shadow-[4px_4px_0px_#141414] p-4 ${series.remainingDays <= 7 ? 'border-red-400 bg-red-50' : 'border-ink-black'}`}>
          <p className="font-mono text-[9px] font-extrabold uppercase text-neutral-400 mb-2">Deadline</p>
          <p className="font-syne font-extrabold text-sm text-ink-black">
            {new Date(series.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </p>
          <p className={`font-mono text-xs font-bold mt-1 ${series.remainingDays <= 0 ? 'text-red-600' : series.remainingDays <= 7 ? 'text-orange-500' : 'text-neutral-500'}`}>
            {series.remainingDays <= 0 ? `${Math.abs(series.remainingDays)}d overdue` : `${series.remainingDays} days left`}
          </p>
        </div>

        {/* Chapters */}
        <div className="bg-white border-2 border-ink-black shadow-[4px_4px_0px_#141414] p-4">
          <p className="font-mono text-[9px] font-extrabold uppercase text-neutral-400 mb-2">Chapters</p>
          <p className="font-syne font-extrabold text-sm text-ink-black">
            {series.publishedChapters} / {series.totalChapters}
          </p>
          <p className="font-mono text-[9px] text-neutral-400 mt-1">Published</p>
        </div>

        {/* Avg Votes */}
        <div className="bg-white border-2 border-ink-black shadow-[4px_4px_0px_#141414] p-4">
          <p className="font-mono text-[9px] font-extrabold uppercase text-neutral-400 mb-2">Avg. Votes/Chapter</p>
          <p className="font-syne font-extrabold text-sm text-ink-black">
            {series.averageVotesPerChapter.toLocaleString()}
          </p>
          <p className="font-mono text-[9px] text-neutral-400 mt-1">Highest: {series.highestVotedChapter}</p>
        </div>
      </div>

      {/* Progress Timeline */}
      <div className="bg-white border-2 border-ink-black shadow-[4px_4px_0px_#141414] p-5">
        <p className="font-mono text-[9px] font-extrabold uppercase tracking-widest text-neutral-500 mb-4">
          Production Stage Progress
        </p>
        <ProgressTimeline
          currentStage={series.currentStage}
          completionPercentage={series.completionPercentage}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <RankingChart data={series.rankingHistory} title="Ranking Trend" />
        <VoteTrendChart data={series.voteHistory} title="Vote Trend" />
        <ProgressChart data={series.progressHistory} title="Production Progress" />
      </div>

      {/* Tabbed Sections */}
      <div className="bg-white border-2 border-ink-black shadow-[4px_4px_0px_#141414]">
        {/* Tab Nav */}
        <div className="flex border-b-2 border-ink-black overflow-x-auto">
          {(Object.keys(TAB_LABELS) as Tab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 font-mono text-[10px] font-extrabold uppercase tracking-widest whitespace-nowrap border-r border-neutral-200 last:border-r-0 transition-colors cursor-pointer ${
                activeTab === tab
                  ? 'bg-ink-black text-white'
                  : 'text-neutral-500 hover:text-ink-black hover:bg-neutral-50'
              }`}
            >
              {TAB_LABELS[tab]}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-5">

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="font-mono text-[9px] font-extrabold uppercase text-neutral-400 mb-1">Full Synopsis</p>
                  <p className="font-sans text-sm text-neutral-700 leading-relaxed bg-neutral-50 border border-neutral-200 p-3">
                    {series.synopsis}
                  </p>
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="font-mono text-[9px] font-extrabold uppercase text-neutral-400 mb-1">Start Date</p>
                    <p className="font-sans text-sm text-ink-black">{new Date(series.startDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                  </div>
                  <div>
                    <p className="font-mono text-[9px] font-extrabold uppercase text-neutral-400 mb-1">Highest Voted Chapter</p>
                    <p className="font-sans text-sm text-ink-black">{series.highestVotedChapter}</p>
                  </div>
                  <div>
                    <p className="font-mono text-[9px] font-extrabold uppercase text-neutral-400 mb-1">Latest Chapter Votes</p>
                    <VoteCounter votes={series.latestChapterVotes} />
                  </div>
                  <div>
                    <p className="font-mono text-[9px] font-extrabold uppercase text-neutral-400 mb-1">Previous Ranking</p>
                    <div className="flex items-center gap-2">
                      <span className="font-syne font-extrabold text-base text-neutral-500">#{series.previousRanking}</span>
                      <span className={`font-mono text-xs font-bold flex items-center gap-0.5 ${rankChange > 0 ? 'text-emerald-600' : rankChange < 0 ? 'text-red-600' : 'text-neutral-400'}`}>
                        {rankChange > 0 ? <TrendingUp className="w-3.5 h-3.5" /> : rankChange < 0 ? <TrendingDown className="w-3.5 h-3.5" /> : null}
                        {rankChange !== 0 ? Math.abs(rankChange) + ' positions' : 'No change'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Chapters Tab */}
          {activeTab === 'chapters' && (
            <div className="space-y-2">
              {series.chapters.length === 0 ? (
                <div className="py-10 text-center">
                  <BookOpen className="w-10 h-10 text-neutral-300 mx-auto mb-2" />
                  <p className="font-mono text-xs text-neutral-400 uppercase">No chapters submitted</p>
                </div>
              ) : (
                [...series.chapters]
                  .sort((a, b) => b.chapterNumber - a.chapterNumber)
                  .map((ch) => (
                    <div
                      key={ch.id}
                      className="flex items-center gap-4 p-3 border border-neutral-200 hover:border-ink-black hover:bg-neutral-50 transition-colors"
                    >
                      <span className="font-syne font-extrabold text-sm text-neutral-400 w-10 flex-shrink-0">
                        #{ch.chapterNumber}
                      </span>
                      <div className="flex-1 min-w-0">
                        <p className="font-sans font-bold text-xs text-ink-black truncate">{ch.title}</p>
                        <p className="font-mono text-[9px] text-neutral-400">
                          {ch.totalPages} pages · {new Date(ch.submittedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                        </p>
                      </div>
                      <StatusBadge
                        label={ch.status.replace('_', ' ')}
                        variant={chapterStatusVariant[ch.status] as any ?? 'default'}
                      />
                      {ch.votes > 0 && (
                        <VoteCounter votes={ch.votes} label="" />
                      )}
                      {(ch.status === 'SUBMITTED' || ch.status === 'UNDER_REVIEW') && (
                        <Link
                          to={`/editor/review/${series.id}`}
                          className="px-2 py-1 bg-[#E63946] text-white text-[9px] font-mono font-extrabold uppercase border border-red-600 hover:bg-red-600 transition-colors cursor-pointer flex-shrink-0"
                        >
                          Review
                        </Link>
                      )}
                    </div>
                  ))
              )}
            </div>
          )}

          {/* Production Logs Tab */}
          {activeTab === 'production' && (
            <div>
              {series.productionLogs.length === 0 ? (
                <div className="py-10 text-center">
                  <FileEdit className="w-10 h-10 text-neutral-300 mx-auto mb-2" />
                  <p className="font-mono text-xs text-neutral-400 uppercase">No production logs</p>
                </div>
              ) : (
                <div className="pt-2">
                  {[...series.productionLogs]
                    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                    .map((log) => (
                      <ProductionLogItem key={log.id} log={log} />
                    ))}
                </div>
              )}
            </div>
          )}

          {/* Revision History Tab */}
          {activeTab === 'revisions' && (
            <div className="border-2 border-neutral-200">
              {series.revisionHistory.length === 0 ? (
                <div className="py-10 text-center">
                  <RotateCcw className="w-10 h-10 text-neutral-300 mx-auto mb-2" />
                  <p className="font-mono text-xs text-neutral-400 uppercase">No revision history</p>
                </div>
              ) : (
                series.revisionHistory.map((rev) => (
                  <RevisionItem key={rev.id} revision={rev} />
                ))
              )}
            </div>
          )}

          {/* Editorial Notes Tab */}
          {activeTab === 'notes' && (
            <div className="space-y-3">
              {series.editorialNotes.length === 0 ? (
                <div className="py-10 text-center">
                  <StickyNote className="w-10 h-10 text-neutral-300 mx-auto mb-2" />
                  <p className="font-mono text-xs text-neutral-400 uppercase">No editorial notes</p>
                </div>
              ) : (
                series.editorialNotes.map((note) => (
                  <EditorialNoteItem key={note.id} note={note} />
                ))
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
