/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { SeriesWorkflowStatus } from "./workflow/seriesWorkflow";

export type { SeriesWorkflowStatus };

export type TaskDeliveryStatus =
  | "ASSIGNED"
  | "SUBMITTED"
  | "MANGAKA_APPROVED"
  | "WITH_EDITOR"
  | "PUBLISHED";

export type UserRole = User["role"];

export interface User {
  _id: string;
  name: string;
  email: string;
  role: "MANGAKA" | "ASSISTANT" | "EDITOR" | "BOARD_MEMBER";
  avatar?: string;
  token?: string;
}

export interface Series {
  _id: string;
  title: string;
  synopsis: string;
  mangakaId: string | { _id: string; name: string; email: string };
  status: "PENDING" | "APPROVED" | "IN_PRODUCTION" | "PUBLISHED" | "REJECTED" | "CANCELLED";
  workflowStatus?: SeriesWorkflowStatus;
  initialDraft?: string;
  revisionNote?: string;
  pubSchedule?: "WEEKLY" | "MONTHLY" | null;
  reviewedBy?: string | { _id: string; name: string; email: string } | null;
  reviewNote?: string;
  reviewedAt?: string;
  productionStartedAt?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Chapter {
  _id: string;
  seriesId: string;
  chapterNumber?: number;
  title: string;
  status?: "IN_PROGRESS" | "COMPLETED";
  dueAt?: string;
  editorDeadlineSet?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface Task {
  _id: string;
  seriesId: string;
  chapterId: string;
  assignedTo: string;
  title: string;
  status: "PENDING" | "DONE";
  deliveryStatus?: TaskDeliveryStatus;
  createdAt?: string;
  updatedAt?: string;
}

export interface Rating {
  _id: string;
  seriesId: string;
  voteCount: number;
  sourceFrom?: string;
  submittedBy: string;
  createdAt?: string;
}

export interface SeriesRank {
  _id: string;
  seriesId: string;
  rank: number;
  prevRank?: number | null;
  rankedOn: string;
  createdAt?: string;
}

export interface Vote {
  _id?: string;
  submissionId: string;
  voterId: string | { _id: string; name: string; email: string };
  decision: "ACCEPT" | "REJECT";
  comment?: string;
  pubSchedule?: "WEEKLY" | "MONTHLY";
  createdAt?: string;
}

export type ManuscriptReviewStatus = "APPROVED" | "REVISION_REQUESTED";

export interface ManuscriptReview {
  taskId: string;
  status: ManuscriptReviewStatus;
  note: string;
  reviewedAt: string;
  reviewedBy: string;
}

export interface EditorDraftNote {
  chapterId: string;
  contentNote: string;
  dialogueNote: string;
  scriptNote: string;
  updatedAt: string;
  editorId: string;
}

export interface AppNotification {
  id: string;
  recipientUserId?: string;
  recipientRole?: User["role"] | "ALL";
  title: string;
  message: string;
  seriesId?: string;
  chapterId?: string;
  taskId?: string;
  read: boolean;
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  type:
    | "task_assigned"
    | "task_done"
    | "chapter_created"
    | "chapter_published"
    | "connection_change"
    | "rating_created"
    | "series_proposed"
    | "series_reviewed"
    | "vote_submitted"
    | "manuscript_reviewed"
    | "draft_note_added"
    | "workflow_transition";
  message: string;
  timestamp: Date;
  meta?: unknown;
}

export interface DashboardHandlers {
  onSeriesCreate: (title: string, synopsis: string) => Promise<void>;
  onSubmitSeriesToEditor: (seriesId: string) => void;
  onMangakaReviseSeries: (seriesId: string, title: string, synopsis: string) => void;
  onEditorRequestRevision: (seriesId: string, note: string) => void;
  onEditorSendToBoard: (seriesId: string, note: string) => void;
  onBoardVotePublish: (seriesId: string, pubSchedule: "WEEKLY" | "MONTHLY", comment?: string) => void;
  onBoardRejectSeries: (seriesId: string, comment?: string) => void;
  onEditorSetChapterDeadline: (chapterId: string, dueAt: string) => void;
  onEditorNotifyMangakaStart: (seriesId: string) => void;
  onMangakaSendWorkToEditor: (seriesId: string, taskIds: string[]) => void;
  onEditorApproveForPublish: (seriesId: string, note?: string) => void;
  onBoardFinalPublish: (seriesId: string) => void;
  onChapterCreate: (seriesId: string, chapterNumber: number, title: string, dueAt?: string) => Promise<void>;
  onTaskCreate: (seriesId: string, chapterId: string, assignedTo: string, title: string) => Promise<void>;
  onTaskSubmit: (id: string) => Promise<void>;
  onSeriesReview: (seriesId: string, action: "APPROVED" | "REJECTED", note: string, pubSchedule?: "WEEKLY" | "MONTHLY") => Promise<void>;
  onStatusTransition: (seriesId: string, status: "APPROVED" | "IN_PRODUCTION" | "PUBLISHED" | "REJECTED" | "CANCELLED") => Promise<void>;
  onRatingSubmit: (seriesId: string, voteCount: number, sourceFrom: string) => Promise<void>;
  onChapterUpdate: (id: string, updatedFields: Partial<Chapter>) => Promise<void>;
  onChapterDelete: (id: string) => Promise<void>;
  onChapterPublish: (id: string) => Promise<void>;
  onVoteSubmit: (seriesId: string, decision: "ACCEPT" | "REJECT", comment: string) => Promise<void>;
  onManuscriptReview: (taskId: string, status: ManuscriptReviewStatus, note: string) => void;
  onEditorDraftNote: (chapterId: string, contentNote: string, dialogueNote: string, scriptNote: string) => void;
  onMarkNotificationRead: (id: string) => void;
  onMarkAllNotificationsRead: () => void;
  onClearLogs: () => void;
}

export interface DashboardData {
  currentUser: User;
  seriesList: Series[];
  chapters: Chapter[];
  tasks: Task[];
  ranksList: SeriesRank[];
  votes: Vote[];
  logs: ActivityLog[];
  notifications: AppNotification[];
  manuscriptReviews: Record<string, ManuscriptReview>;
  editorDraftNotes: Record<string, EditorDraftNote>;
}
