import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  FileSearch,
  BookOpen,
  ArrowRight,
  RefreshCw,
  Clock,
  Inbox,
} from 'lucide-react';
import { apiClient } from '../../../api/client.ts';
import { LoadingState, ErrorState, StatusBadge } from '../components/common/States.tsx';
import { useLanguage } from '../../../i18n/LanguageContext';
import { resolveSeriesCover, useSeriesCoverFallback } from '../utils/seriesCover';

const PENDING_CHAPTER_STATUSES = ['SUBMITTED', 'UNDER_REVIEW'];

interface PendingChapter {
  id: string;
  seriesId: string;
  chapterNumber: number;
  title: string;
  status: string;
  deadline: string;
  totalPages: number;
}

interface SeriesGroup {
  id: string;
  title: string;
  coverUrl: string;
  status: string;
  genre: string;
  mangakaName: string;
  chapters: PendingChapter[];
}

// =========================================================
// CHAPTER REVIEW LIST PAGE — grouped by series
// =========================================================

export const ChapterReviewListPage: React.FC = () => {
  const { t } = useLanguage();

  const {
    data: mySeries = [],
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['editor-my-series'],
    queryFn: () => apiClient.editor.getMySeries(),
    staleTime: 0,
    refetchOnMount: 'always',
    refetchOnWindowFocus: true,
  });

  // Load chapters for each series and group the pending ones under it.
  const { data: groups = [], isLoading: chaptersLoading } = useQuery({
    queryKey: ['chapter-review-groups', (mySeries || []).map((s: any) => s._id).join(',')],
    queryFn: async (): Promise<SeriesGroup[]> => {
      const seriesList: any[] = mySeries || [];
      const result: SeriesGroup[] = [];
      for (const s of seriesList) {
        const chapters = await apiClient.chapters.getAll(s._id).then((data: any[]) =>
          (data || []).map((ch: any) => {
            const seriesId =
              typeof ch.seriesId === 'object' && ch.seriesId !== null
                ? ch.seriesId._id || s._id
                : ch.seriesId || s._id;
            return {
              id: ch._id || ch.id,
              seriesId,
              chapterNumber: ch.chapterNumber || 0,
              title: ch.title || '',
              status: ch.status || 'DRAFT',
              deadline: ch.deadline || ch.dueAt || '',
              totalPages: ch.totalPages || 0,
            };
          }),
        );
        const pending = chapters.filter((ch) =>
          PENDING_CHAPTER_STATUSES.includes(ch.status),
        );
        if (pending.length > 0) {
          result.push({
            id: s._id,
            title: s.title || '',
            coverUrl: resolveSeriesCover(s.title || '', s.imageUrl || s.coverImage),
            status: s.status || 'ACTIVE',
            genre: s.genre || '',
            mangakaName:
              s.originalAuthor ||
              (typeof s.mangakaId === 'object' && s.mangakaId ? s.mangakaId.name : '') ||
              'Unknown',
            chapters: pending,
          });
        }
      }
      return result;
    },
    enabled: (mySeries || []).length > 0,
  });

  const totalPending = useMemo(
    () => groups.reduce((sum, g) => sum + g.chapters.length, 0),
    [groups],
  );

  if (isLoading || chaptersLoading) {
    return <LoadingState message="Loading chapter reviews..." />;
  }
  if (error) {
    return <ErrorState onRetry={refetch} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-syne font-extrabold text-2xl text-ink-black tracking-tight">
            {t('Chapter Review')}
          </h1>
          <p className="font-mono text-xs text-neutral-500 mt-0.5 uppercase tracking-widest">
            {t('Pending manuscripts across your series')}
          </p>
        </div>
        <button
          onClick={() => refetch()}
          className="flex items-center gap-1.5 px-3 py-2 bg-white border-2 border-ink-black text-xs font-mono font-bold uppercase shadow-[2px_2px_0px_#141414] hover:bg-neutral-50 transition-colors cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          {t('Refresh')}
        </button>
      </div>

      {/* Summary */}
      <div className="bg-white border-2 border-ink-black shadow-[4px_4px_0px_#141414] p-4 flex items-center gap-3">
        <div className="w-10 h-10 bg-amber-100 border-2 border-amber-400 flex items-center justify-center shrink-0">
          <Clock className="w-5 h-5 text-amber-600" />
        </div>
        <div>
          <p className="font-syne font-extrabold text-lg text-ink-black leading-none">
            {totalPending}
          </p>
          <p className="font-mono text-[10px] text-neutral-500 uppercase tracking-widest">
            {t('chapters awaiting review')}
          </p>
        </div>
      </div>

      {/* Empty state */}
      {groups.length === 0 ? (
        <div className="py-20 text-center border-2 border-dashed border-neutral-300 bg-neutral-50">
          <Inbox className="w-12 h-12 text-neutral-300 mx-auto mb-3" />
          <p className="font-syne font-extrabold text-sm text-neutral-500 uppercase tracking-widest">
            {t('No chapters awaiting review')}
          </p>
          <p className="font-sans text-xs text-neutral-400 mt-1">
            {t('Chapters submitted by the Mangaka will appear here.')}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {groups.map((group) => (
            <section
              key={group.id}
              className="bg-white border-2 border-ink-black shadow-[4px_4px_0px_#141414] overflow-hidden"
            >
              {/* Series header */}
              <Link
                to={`/editor/series/${group.id}`}
                className="flex items-center gap-3 p-4 bg-ink-black hover:bg-neutral-900 transition-colors"
              >
                <img
                  src={group.coverUrl}
                  alt={group.title}
                  onError={(event) => useSeriesCoverFallback(event.currentTarget, group.title)}
                  className="w-10 h-13 object-cover border-2 border-neutral-600 shrink-0"
                  style={{ width: '2.75rem', height: '3.5rem' }}
                />
                <div className="flex-1 min-w-0">
                  <h3 className="font-syne font-extrabold text-white text-sm truncate">
                    {group.title}
                  </h3>
                  <p className="font-mono text-[10px] text-neutral-400 truncate mt-0.5">
                    {group.mangakaName} · {group.genre}
                  </p>
                </div>
                <StatusBadge
                  label={group.status.replace('_', ' ')}
                  variant={group.status === 'ACTIVE' ? 'active' : group.status === 'ON_HIATUS' ? 'hiatus' : group.status === 'COMPLETED' ? 'completed' : 'default'}
                />
                <span className="ml-2 text-[9px] font-mono font-extrabold text-amber-400 uppercase tracking-widest shrink-0">
                  {group.chapters.length} {t('pending')}
                </span>
              </Link>

              {/* Pending chapters */}
              <div className="divide-y divide-neutral-100">
                {group.chapters.map((chapter) => (
                  <Link
                    key={chapter.id}
                    to={`/editor/review/${chapter.seriesId || group.id}`}
                    className="flex items-center gap-4 p-4 hover:bg-neutral-50 transition-colors group"
                  >
                    <div className="w-9 h-9 bg-neutral-100 border-2 border-neutral-300 flex items-center justify-center shrink-0 group-hover:border-[#E63946] transition-colors">
                      <BookOpen className="w-4 h-4 text-neutral-500 group-hover:text-[#E63946] transition-colors" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-sans font-bold text-xs text-ink-black">
                        {t('Chapter')} {chapter.chapterNumber}: {chapter.title || t('Untitled')}
                      </p>
                      <p className="font-mono text-[9px] text-neutral-500 mt-0.5">
                        {chapter.totalPages} {t('pages')}
                        {chapter.deadline
                          ? ` · ${t('due')} ${new Date(chapter.deadline).toLocaleDateString()}`
                          : ''}
                      </p>
                    </div>
                    <StatusBadge
                      label={chapter.status === 'UNDER_REVIEW' ? 'Under Review' : 'Submitted'}
                      variant={chapter.status === 'UNDER_REVIEW' ? 'under_review' : 'submitted'}
                    />
                    <span className="flex items-center gap-1 text-[9px] font-mono font-extrabold text-[#E63946] uppercase tracking-widest shrink-0 group-hover:gap-2 transition-all">
                      {t('Review')} <ArrowRight className="w-3 h-3" />
                    </span>
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {/* Hint */}
      <p className="text-center font-mono text-[9px] text-neutral-400 uppercase tracking-widest">
        <FileSearch className="w-3 h-3 inline mr-1" />
        {t('Each entry opens the manuscript review with the pending chapter pre-selected.')}
      </p>
    </div>
  );
};
