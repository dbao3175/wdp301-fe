/**
 * Pure ranking helpers — server is authoritative in production.
 */

import { RankingTier, MAX_ACTIVE_RANKED_SERIES, rankingTierFromRank } from "../domain/enums";

export interface SurveyMetrics {
  readerVotes: number;
  salesUnits: number;
  engagementScore: number;
  surveyScore: number;
}

export interface Weights {
  readerVotes: number;
  salesUnits: number;
  engagement: number;
  survey: number;
}

export const DEFAULT_RANKING_WEIGHTS: Weights = {
  readerVotes: 0.3,
  salesUnits: 0.25,
  engagement: 0.25,
  survey: 0.2,
};

export function computeCompositeScore(
  m: SurveyMetrics,
  w: Weights = DEFAULT_RANKING_WEIGHTS
): number {
  return (
    m.readerVotes * w.readerVotes +
    m.salesUnits * w.salesUnits +
    m.engagementScore * w.engagement +
    m.surveyScore * w.survey
  );
}

export interface RankSlot {
  seriesId: string;
  rank: number;
  compositeScore: number;
  tier: RankingTier;
  prevRank?: number | null;
}

export function assignRanks(
  entries: { seriesId: string; score: number; prevRank?: number | null }[]
): RankSlot[] {
  const sorted = [...entries].sort((a, b) => b.score - a.score);
  return sorted.slice(0, MAX_ACTIVE_RANKED_SERIES).map((e, i) => {
    const rank = i + 1;
    return {
      seriesId: e.seriesId,
      rank,
      compositeScore: e.score,
      tier: rankingTierFromRank(rank),
      prevRank: e.prevRank ?? null,
    };
  });
}

export type CancellationRisk = "NONE" | "WARNING" | "SCHEDULE_REVIEW" | "CANCELLATION_REVIEW";

export function cancellationRiskFromRank(rank: number | null): CancellationRisk {
  if (rank == null || rank > MAX_ACTIVE_RANKED_SERIES) return "CANCELLATION_REVIEW";
  if (rank >= 13) return "WARNING";
  if (rank >= 6) return "NONE";
  return "NONE";
}
