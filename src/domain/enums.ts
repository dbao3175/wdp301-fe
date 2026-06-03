/**
 * Canonical domain enums — aligned with docs/ and Spring Boot backend.
 */

export const ProposalStatus = {
  DRAFT: "DRAFT",
  SUBMITTED: "SUBMITTED",
  UNDER_REVIEW: "UNDER_REVIEW",
  REVISION_REQUIRED: "REVISION_REQUIRED",
  EDITOR_APPROVED: "EDITOR_APPROVED",
  BOARD_REVIEW: "BOARD_REVIEW",
  PUBLISHED: "PUBLISHED",
  REJECTED: "REJECTED",
  CANCELLED: "CANCELLED",
} as const;
export type ProposalStatus = (typeof ProposalStatus)[keyof typeof ProposalStatus];

export const ProductionStatus = {
  PLANNING: "PLANNING",
  SCRIPTING: "SCRIPTING",
  EDITOR_REVIEW: "EDITOR_REVIEW",
  ASSIGNING_ASSISTANTS: "ASSIGNING_ASSISTANTS",
  ARTWORK_IN_PROGRESS: "ARTWORK_IN_PROGRESS",
  FINAL_REVIEW: "FINAL_REVIEW",
  READY_TO_PUBLISH: "READY_TO_PUBLISH",
  PUBLISHED: "PUBLISHED",
} as const;
export type ProductionStatus = (typeof ProductionStatus)[keyof typeof ProductionStatus];

export const PubSchedule = {
  WEEKLY: "WEEKLY",
  MONTHLY: "MONTHLY",
} as const;
export type PubSchedule = (typeof PubSchedule)[keyof typeof PubSchedule];

export const ArtworkTaskType = {
  BACKGROUND: "BACKGROUND",
  SHADING: "SHADING",
  EFFECTS: "EFFECTS",
  CHARACTER_CLEANUP: "CHARACTER_CLEANUP",
} as const;
export type ArtworkTaskType = (typeof ArtworkTaskType)[keyof typeof ArtworkTaskType];

export const RankingTier = {
  HIGH: "HIGH", // ranks 1–5
  NORMAL: "NORMAL", // 6–12
  LOW: "LOW", // 13–20
} as const;
export type RankingTier = (typeof RankingTier)[keyof typeof RankingTier];

export const MAX_ACTIVE_RANKED_SERIES = 20;

export function rankingTierFromRank(rank: number): RankingTier {
  if (rank <= 5) return RankingTier.HIGH;
  if (rank <= 12) return RankingTier.NORMAL;
  return RankingTier.LOW;
}
