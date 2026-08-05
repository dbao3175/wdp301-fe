import React from 'react';
import { Link } from 'react-router-dom';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
  Heart,
  Award,
  Clock,
  AlertTriangle,
} from 'lucide-react';
import type { Series, ProductionStage } from '../../types/index.ts';
import { StatusBadge } from '../common/States.tsx';
import { useLanguage } from '../../../../i18n/LanguageContext';
import { useSeriesCoverFallback } from '../../utils/seriesCover';

// =========================================================
// RANKING BADGE
// =========================================================

interface RankingBadgeProps {
  rank: number;
  previous?: number;
  size?: 'sm' | 'md' | 'lg';
}

export const RankingBadge: React.FC<RankingBadgeProps> = ({
  rank,
  previous,
  size = 'md',
}) => {
  const { t } = useLanguage();
  const diff = previous ? previous - rank : 0;
  const sizeClass = size === 'sm' ? 'text-base w-8 h-8' : size === 'lg' ? 'text-4xl w-16 h-16' : 'text-2xl w-12 h-12';

  return (
    <div className="flex items-center gap-2">
      <div
        className={`${sizeClass} bg-ink-black text-white font-black font-syne border-2 border-ink-black shadow-[2px_2px_0px_#141414] flex items-center justify-center flex-shrink-0`}
      >
        #{rank}
      </div>
      {previous !== undefined && diff !== 0 && (
        <span
          className={`text-[10px] font-mono font-bold flex items-center gap-0.5 ${
            diff > 0 ? 'text-emerald-600' : 'text-red-600'
          }`}
        >
          {diff > 0 ? (
            <TrendingUp className="w-3 h-3" />
          ) : (
            <TrendingDown className="w-3 h-3" />
          )}
          {Math.abs(diff)}
        </span>
      )}
      {previous !== undefined && diff === 0 && (
        <span className="text-[10px] font-mono font-bold text-neutral-400 flex items-center gap-0.5">
          <Minus className="w-3 h-3" /> {t('same')}
        </span>
      )}
    </div>
  );
};

// =========================================================
// VOTE COUNTER
// =========================================================

interface VoteCounterProps {
  votes: number;
  label?: string;
}

export const VoteCounter: React.FC<VoteCounterProps> = ({
  votes,
  label = 'votes',
}) => {
  const { t } = useLanguage();
  const formatted =
    votes >= 1000 ? `${(votes / 1000).toFixed(1)}k` : votes.toString();

  return (
    <div className="flex items-center gap-1.5">
      <Heart className="w-3.5 h-3.5 text-[#E63946]" />
      <span className="font-syne font-extrabold text-sm text-ink-black">{formatted}</span>
      <span className="font-mono text-[9px] text-neutral-400 uppercase">{t(label)}</span>
    </div>
  );
};

// =========================================================
// DEADLINE CARD
// =========================================================

interface DeadlineInfo {
  id: string;
  title: string;
  seriesTitle: string;
  type: 'chapter_review' | 'production';
  dueDate: string;
  daysRemaining: number;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
}

interface DeadlineCardProps {
  deadline: DeadlineInfo;
}

const priorityStyles = {
  CRITICAL: 'bg-red-50 border-red-400',
  HIGH: 'bg-orange-50 border-orange-400',
  MEDIUM: 'bg-yellow-50 border-yellow-400',
  LOW: 'bg-blue-50 border-blue-300',
};

const priorityTextStyles = {
  CRITICAL: 'text-red-600',
  HIGH: 'text-orange-600',
  MEDIUM: 'text-yellow-600',
  LOW: 'text-blue-600',
};

export const DeadlineCard: React.FC<DeadlineCardProps> = ({ deadline }) => {
  const { t } = useLanguage();
  return (
    <Link
      to="/editor/review"
      className={`border-l-4 ${priorityStyles[deadline.priority]} px-4 py-3 border border-l-4 block hover:bg-neutral-50 transition-colors`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-sans font-bold text-xs text-ink-black truncate">{deadline.title}</p>
          <p className="font-mono text-[10px] text-neutral-500 truncate">{deadline.seriesTitle}</p>
        </div>
        <div className="flex-shrink-0 text-right">
          <p
            className={`font-syne font-extrabold text-sm ${priorityTextStyles[deadline.priority]}`}
          >
            {deadline.daysRemaining === 0
              ? t('Today!')
              : deadline.daysRemaining < 0
              ? t('{{count}}d overdue', { count: Math.abs(deadline.daysRemaining) })
              : t('{{count}}d left', { count: deadline.daysRemaining })}
          </p>
          <p className="font-mono text-[9px] text-neutral-400">{deadline.dueDate}</p>
        </div>
      </div>
    </Link>
  );
};

// =========================================================
// PRODUCTION STAGE LABELS
// =========================================================

export const STAGE_LABELS: Record<ProductionStage, string> = {
  STORY_PLANNING: 'Story Planning',
  STORYBOARD: 'Storyboard',
  DRAFT: 'Draft',
  LINE_ART: 'Line Art',
  COLORING: 'Coloring',
  LETTERING: 'Lettering',
  FINAL_REVIEW: 'Final Review',
  READY_FOR_PRINT: 'Ready for Print',
  PUBLISHED: 'Published',
};

const STAGE_ORDER: ProductionStage[] = [
  'STORY_PLANNING',
  'STORYBOARD',
  'DRAFT',
  'LINE_ART',
  'COLORING',
  'LETTERING',
  'FINAL_REVIEW',
  'READY_FOR_PRINT',
  'PUBLISHED',
];

// =========================================================
// PROGRESS TIMELINE
// =========================================================

interface ProgressTimelineProps {
  currentStage: ProductionStage;
  completionPercentage: number;
}

export const ProgressTimeline: React.FC<ProgressTimelineProps> = ({
  currentStage,
  completionPercentage,
}) => {
  const { t } = useLanguage();
  const currentIdx = STAGE_ORDER.indexOf(currentStage);

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <span className="font-mono text-xs font-bold text-neutral-600 uppercase tracking-wide">
          {t(STAGE_LABELS[currentStage])}
        </span>
        <span className="font-syne font-extrabold text-sm text-ink-black">
          {completionPercentage}%
        </span>
      </div>
      {/* Progress bar */}
      <div className="h-2 bg-neutral-200 border border-neutral-300 mb-4">
        <div
          className="h-full bg-[#E63946] transition-all duration-500"
          style={{ width: `${completionPercentage}%` }}
        />
      </div>
      {/* Stage dots */}
      <div className="flex items-center">
        {STAGE_ORDER.map((stage, idx) => {
          const isDone = idx < currentIdx;
          const isCurrent = idx === currentIdx;
          return (
            <React.Fragment key={stage}>
              <div
                title={t(STAGE_LABELS[stage])}
                className={`w-3 h-3 border-2 transition-colors flex-shrink-0 ${
                  isDone
                    ? 'bg-emerald-500 border-emerald-600'
                    : isCurrent
                    ? 'bg-[#E63946] border-ink-black'
                    : 'bg-white border-neutral-300'
                }`}
              />
              {idx < STAGE_ORDER.length - 1 && (
                <div
                  className={`flex-1 h-0.5 ${
                    isDone ? 'bg-emerald-400' : 'bg-neutral-200'
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
      <div className="flex justify-between mt-1">
        <span className="font-mono text-[8px] text-neutral-400 uppercase">{t('Start')}</span>
        <span className="font-mono text-[8px] text-neutral-400 uppercase">{t('Published')}</span>
      </div>
    </div>
  );
};

// =========================================================
// SERIES CARD
// =========================================================

interface SeriesCardProps {
  series: Series;
}

const seriesStatusVariant: Record<string, string> = {
  ACTIVE: 'active',
  ON_HIATUS: 'hiatus',
  COMPLETED: 'completed',
  CANCELLED: 'danger',
  PENDING: 'warning',
};

export const SeriesCard: React.FC<SeriesCardProps> = ({ series }) => {
  const { t } = useLanguage();
  const rankDiff = series.previousRanking - series.currentRanking;

  return (
    <Link
      to={`/editor/series/${series.id}`}
      className="block bg-white border-2 border-ink-black shadow-[4px_4px_0px_#141414] hover:shadow-[6px_6px_0px_#141414] hover:-translate-x-0.5 hover:-translate-y-0.5 transition-all group overflow-hidden"
    >
      {/* Cover + Status */}
      <div className="relative h-40 overflow-hidden bg-neutral-100">
        <img
          src={series.coverUrl}
          alt={series.title}
          onError={(event) => useSeriesCoverFallback(event.currentTarget, series.title)}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute top-2 right-2">
          <StatusBadge
            label={series.status.replace('_', ' ')}
            variant={seriesStatusVariant[series.status] as any}
          />
        </div>
        <div className="absolute bottom-2 left-2">
          <RankingBadge rank={series.currentRanking} previous={series.previousRanking} size="sm" />
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="font-syne font-extrabold text-sm text-ink-black leading-tight mb-1 line-clamp-1">
          {series.title}
        </h3>
        <p className="font-mono text-[10px] text-neutral-500 mb-3">{series.mangaka.name}</p>

        <ProgressTimeline
          currentStage={series.currentStage}
          completionPercentage={series.completionPercentage}
        />

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-neutral-100">
          <VoteCounter votes={series.totalVotes} />
          <div className="flex items-center gap-1 text-neutral-500">
            <Calendar className="w-3 h-3" />
            <span className="font-mono text-[9px]">
              {series.remainingDays <= 0
                ? t('OVERDUE')
                : t('{{count}}d', { count: series.remainingDays })}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
};
