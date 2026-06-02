/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { User } from "../types";

export type UserRole = User["role"];

export type TaskBoardTab = "kanban" | "reviews" | "ratings" | "chapters";
export type CreateFormTab = "proposal" | "chapter" | "task";

export interface RolePermissions {
  label: string;
  description: string;
  canProposeSeries: boolean;
  canCreateChapter: boolean;
  canAssignTask: boolean;
  canSubmitTask: boolean;
  canReviewManuscript: boolean;
  canViewOwnRankings: boolean;
  canViewAllRankings: boolean;
  canVoteSeries: boolean;
  canReviewSeriesAsEditor: boolean;
  canCancelSeries: boolean;
  canChangePubSchedule: boolean;
  canSubmitRatings: boolean;
  canManageChapters: boolean;
  canPublishChapter: boolean;
  canRequestDraftEdits: boolean;
  canViewStudioProgress: boolean;
  taskBoardTabs: TaskBoardTab[];
  createFormTabs: CreateFormTab[];
  defaultTaskBoardTab: TaskBoardTab;
  defaultCreateTab: CreateFormTab;
}

export const ROLE_PERMISSIONS: Record<UserRole, RolePermissions> = {
  MANGAKA: {
    label: "Mangaka",
    description: "Đề xuất series, giao việc cho Assistant, duyệt bản tổng hợp",
    canProposeSeries: true,
    canCreateChapter: false,
    canAssignTask: true,
    canSubmitTask: false,
    canReviewManuscript: true,
    canViewOwnRankings: true,
    canViewAllRankings: false,
    canVoteSeries: false,
    canReviewSeriesAsEditor: false,
    canCancelSeries: false,
    canChangePubSchedule: false,
    canSubmitRatings: false,
    canManageChapters: false,
    canPublishChapter: false,
    canRequestDraftEdits: false,
    canViewStudioProgress: false,
    taskBoardTabs: ["kanban", "ratings"],
    createFormTabs: ["proposal", "task"],
    defaultTaskBoardTab: "kanban",
    defaultCreateTab: "proposal",
  },
  ASSISTANT: {
    label: "Trợ lý (Assistant)",
    description: "Nhận việc, nộp kết quả, theo dõi thu nhập",
    canProposeSeries: false,
    canCreateChapter: false,
    canAssignTask: false,
    canSubmitTask: true,
    canReviewManuscript: false,
    canViewOwnRankings: false,
    canViewAllRankings: false,
    canVoteSeries: false,
    canReviewSeriesAsEditor: false,
    canCancelSeries: false,
    canChangePubSchedule: false,
    canSubmitRatings: false,
    canManageChapters: false,
    canPublishChapter: false,
    canRequestDraftEdits: false,
    canViewStudioProgress: false,
    taskBoardTabs: ["kanban"],
    createFormTabs: [],
    defaultTaskBoardTab: "kanban",
    defaultCreateTab: "task",
  },
  EDITOR: {
    label: "Tantou Editor",
    description: "Hiệu đính bản thảo, bảo vệ series, tiến độ studio",
    canProposeSeries: false,
    canCreateChapter: true,
    canAssignTask: false,
    canSubmitTask: false,
    canReviewManuscript: false,
    canViewOwnRankings: false,
    canViewAllRankings: true,
    canVoteSeries: false,
    canReviewSeriesAsEditor: true,
    canCancelSeries: false,
    canChangePubSchedule: false,
    canSubmitRatings: false,
    canManageChapters: true,
    canPublishChapter: true,
    canRequestDraftEdits: true,
    canViewStudioProgress: true,
    taskBoardTabs: ["kanban", "reviews", "chapters"],
    createFormTabs: ["chapter"],
    defaultTaskBoardTab: "chapters",
    defaultCreateTab: "chapter",
  },
  BOARD_MEMBER: {
    label: "Hội đồng biên tập",
    description: "Bỏ phiếu, huỷ series, nhập rating, bảng xếp hạng",
    canProposeSeries: false,
    canCreateChapter: false,
    canAssignTask: false,
    canSubmitTask: false,
    canReviewManuscript: false,
    canViewOwnRankings: false,
    canViewAllRankings: true,
    canVoteSeries: true,
    canReviewSeriesAsEditor: false,
    canCancelSeries: true,
    canChangePubSchedule: true,
    canSubmitRatings: true,
    canManageChapters: false,
    canPublishChapter: true,
    canRequestDraftEdits: false,
    canViewStudioProgress: false,
    taskBoardTabs: ["reviews", "ratings"],
    createFormTabs: [],
    defaultTaskBoardTab: "reviews",
    defaultCreateTab: "proposal",
  },
};

export function getPermissions(role?: UserRole | null): RolePermissions {
  if (!role) return ROLE_PERMISSIONS.MANGAKA;
  return ROLE_PERMISSIONS[role];
}

export function getSeriesMangakaId(
  mangakaId: string | { _id: string; name: string; email: string }
): string {
  return typeof mangakaId === "object" ? mangakaId._id : mangakaId;
}
