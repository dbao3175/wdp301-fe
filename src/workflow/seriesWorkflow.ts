/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Series } from "../types";

export type SeriesWorkflowStatus =
  | "DRAFT"
  | "PENDING_EDITOR"
  | "REVISION_REQUIRED"
  | "AWAITING_BOARD"
  | "IN_PRODUCTION"
  | "PENDING_PUBLISH"
  | "PUBLISHED"
  | "CANCELLED";

export const WORKFLOW_LABELS: Record<SeriesWorkflowStatus, string> = {
  DRAFT: "Bản nháp",
  PENDING_EDITOR: "Chờ Editor duyệt",
  REVISION_REQUIRED: "Cần chỉnh sửa",
  AWAITING_BOARD: "Chờ Hội đồng vote",
  IN_PRODUCTION: "Đang sản xuất",
  PENDING_PUBLISH: "Chờ xuất bản",
  PUBLISHED: "Đã xuất bản",
  CANCELLED: "Đã huỷ",
};

export function legacyStatusFromWorkflow(ws: SeriesWorkflowStatus): Series["status"] {
  switch (ws) {
    case "DRAFT":
    case "PENDING_EDITOR":
    case "REVISION_REQUIRED":
      return "PENDING";
    case "AWAITING_BOARD":
      return "APPROVED";
    case "IN_PRODUCTION":
      return "IN_PRODUCTION";
    case "PENDING_PUBLISH":
      return "IN_PRODUCTION";
    case "PUBLISHED":
      return "PUBLISHED";
    case "CANCELLED":
      return "CANCELLED";
    default:
      return "PENDING";
  }
}

export function inferWorkflowStatus(s: Series): SeriesWorkflowStatus {
  if (s.workflowStatus) return s.workflowStatus;
  if (s.status === "PENDING") return "PENDING_EDITOR";
  if (s.status === "APPROVED") return "AWAITING_BOARD";
  if (s.status === "IN_PRODUCTION") return "IN_PRODUCTION";
  if (s.status === "PUBLISHED") return "PUBLISHED";
  if (s.status === "CANCELLED" || s.status === "REJECTED") return "CANCELLED";
  return "DRAFT";
}

export function withWorkflow(s: Series, ws: SeriesWorkflowStatus, extra?: Partial<Series>): Series {
  return {
    ...s,
    ...extra,
    workflowStatus: ws,
    status: legacyStatusFromWorkflow(ws),
    updatedAt: new Date().toISOString(),
  };
}

export function getMangakaId(s: Series): string {
  return typeof s.mangakaId === "object" ? s.mangakaId._id : s.mangakaId;
}
