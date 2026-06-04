/**
 * Type definitions for MangaFlow
 */

export type UserRole = 'MANGAKA' | 'ASSISTANT' | 'EDITOR' | 'BOARD_MEMBER';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  token?: string;
}

export type SeriesStatus = 'PENDING' | 'APPROVED' | 'IN_PRODUCTION' | 'PUBLISHED' | 'REJECTED' | 'CANCELLED';
export type PubSchedule = 'WEEKLY' | 'MONTHLY';

export interface Series {
  _id: string;
  title: string;
  synopsis: string;
  mangakaId: string | { _id: string; name: string; email: string };
  status: SeriesStatus;
  pubSchedule?: PubSchedule | null;
  reviewedBy?: string | { _id: string; name: string; email: string } | null;
  reviewNote?: string;
  reviewedAt?: string | null;
  createdAt?: string;
}

export type ChapterStatus = 'IN_PROGRESS' | 'COMPLETED';

export interface Chapter {
  _id: string;
  seriesId: string;
  series?: string; // MongoDB ref option
  chapterNumber: number;
  status: ChapterStatus;
  deadline: string;
}

export type TaskStatus = 'PENDING' | 'COMPLETED';

export interface Task {
  _id: string;
  seriesId: string;
  series?: string; // MongoDB ref option
  chapterId: string;
  chapter?: string; // MongoDB ref option
  assignedTo: string; // userId or assistant name
  title: string;
  status: TaskStatus;
  // Bounding box or coordinates defined for the task if applicable
  region?: {
    x: number;
    y: number;
    width: number;
    height: number;
    type: 'panel' | 'bubble' | 'character';
  } | null;
  completedAt?: string;
}

export interface Rating {
  _id: string;
  seriesId: string;
  series?: string; // MongoDB ref option
  voteCount: number;
  source: string;
  submittedBy: string; // user ID who submitted
  createdAt?: string;
}

export interface Vote {
  _id: string;
  submissionId: string; // series proposal ID
  voterId: string;
  decision: 'ACCEPT' | 'REJECT';
  comment?: string;
  createdAt?: string;
}

export interface Annotation {
  _id: string;
  pageId: string;
  coords: {
    x: number;
    y: number;
  };
  content: string;
  type: string;
  createdAt?: string;
}

export interface APIConfig {
  baseUrl: string;
  useLiveBackend: boolean;
}
