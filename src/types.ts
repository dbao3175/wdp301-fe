/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

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
  pubSchedule?: "WEEKLY" | "MONTHLY" | null;
  reviewedBy?: string | { _id: string; name: string; email: string } | null;
  reviewNote?: string;
  reviewedAt?: string;
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
  createdAt?: string;
  updatedAt?: string;
}

export interface Task {
  _id: string;
  seriesId: string;
  chapterId: string;
  assignedTo: string; // userId or username
  title: string;
  status: "PENDING" | "DONE";
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
  submissionId: string; // correspond to seriesId of the proposed series
  voterId: string | { _id: string; name: string; email: string };
  decision: "ACCEPT" | "REJECT";
  comment?: string;
  createdAt?: string;
}

export interface ActivityLog {
  id: string;
  type: "task_assigned" | "task_done" | "chapter_created" | "chapter_published" | "connection_change" | "rating_created" | "series_proposed" | "series_reviewed" | "vote_submitted";
  message: string;
  timestamp: Date;
  meta?: any;
}

