/**
 * Type definitions for MangaFlow
 */

export type UserRole = 'MANGAKA' | 'ASSISTANT' | 'EDITOR' | 'BOARD_MEMBER' | 'ADMIN';

export interface User {
  _id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  token?: string;
  isActive?: boolean;
  bankName?: string;
  accountNumber?: string;
  cardholder?: string;
}

export type SeriesStatus = 'PENDING' | 'APPROVED' | 'ACTIVE' | 'ON_HIATUS' | 'IN_PRODUCTION' | 'PUBLISHED' | 'COMPLETED' | 'REJECTED' | 'CANCELLED';
export type PubSchedule = 'WEEKLY' | 'MONTHLY';

export interface Series {
  _id: string;
  title: string;
  synopsis: string;
  coverImage?: string;
  mangakaId: string | { _id: string; name: string; email: string };
  status: SeriesStatus;
  pubSchedule?: PubSchedule | null;
  reviewedBy?: string | { _id: string; name: string; email: string } | null;
  reviewNote?: string;
  reviewedAt?: string | null;
  createdAt?: string;
}

export type ChapterStatus = 'IN_PROGRESS' | 'SUBMITTED' | 'UNDER_REVIEW' | 'REVISION_REQUESTED' | 'APPROVED' | 'SENT_TO_EDITORIAL' | 'COMPLETED' | 'PUBLISHED' | 'ARCHIVED';

export interface Chapter {
  _id: string;
  seriesId: string;
  series?: string; // MongoDB ref option
  chapterNumber: number;
  title?: string;
  status: ChapterStatus;
  deadline: string;
}

export type TaskStatus = 
  | 'PENDING' 
  | 'IN_PROGRESS' 
  | 'SUBMITTED' 
  | 'MANGAKA_APPROVED' 
  | 'APPROVED' 
  | 'REVISION_REQUESTED' 
  | 'REVISING' 
  | 'COMPLETED' 
  | 'ASSIGNED' 
  | 'PENDING_REVIEW';

export interface Task {
  _id: string;
  seriesId: string;
  series?: string; // MongoDB ref option
  chapterId: string;
  chapter?: string; // MongoDB ref option
  assignedTo: string; // userId or assistant name
  assignedBy?: string;
  title: string;
  type?: string;
  description?: string;
  status: TaskStatus;
  pageIds?: any[];
  dueAt?: string;
  // Bounding box or coordinates defined for the task if applicable
  region?: {
    x: number;
    y: number;
    width: number;
    height: number;
    type: 'panel' | 'bubble' | 'character';
  } | null;
  regions?: Array<{
    x: number;
    y: number;
    width: number;
    height: number;
    type: string;
    comment?: string;
  }>;
  completedAt?: string;
  reviewNote?: string;
  reviewedAt?: string;
}

export interface Rating {
  _id: string;
  seriesId: string | Series;
  series?: string; // MongoDB ref option
  voteCount: number;
  ratingScore?: number;
  readerCount?: number;
  revenue?: number | null;
  cycle?: PubSchedule;
  periodStart?: string;
  periodEnd?: string;
  sourceFrom?: string;
  /** @deprecated Kept for compatibility with legacy rating records. */
  source?: string;
  submittedBy: string | User; // user ID who submitted
  createdAt?: string;
}

export interface ReaderMetricInput {
  seriesId: string;
  voteCount: number;
  ratingScore: number;
  readerCount: number;
  revenue?: number;
  cycle: PubSchedule;
  periodStart: string;
  periodEnd: string;
  sourceFrom: string;
}

export type PublicationDecision = 'PUBLISH' | 'REJECT' | 'RESCHEDULE';

export interface PublicationVote {
  _id: string;
  voterId: string | User;
  decision: PublicationDecision;
  comment?: string;
  createdAt?: string;
}

export interface BoardPublication {
  chapter: Chapter;
  tasks?: Task[];
  pages?: Array<{
    _id?: string;
    pageNumber?: number;
    status?: string;
    imageUrl?: string;
    assistantImageUrl?: string;
  }>;
  session?: {
    _id: string;
    decisionStatus?: string;
    finalDecision?: PublicationDecision | null;
    newSchedule?: PubSchedule | null;
    chairpersonId?: string | User | null;
    requiredVoters?: Array<{
      userId: string | User;
      hasVoted?: boolean;
    }>;
    tiedDecisions?: PublicationDecision[];
    votingDeadline?: string | null;
    reason?: string;
    createdAt?: string;
  } | null;
  votes: PublicationVote[];
  tally?: {
    PUBLISH?: number;
    REJECT?: number;
    RESCHEDULE?: number;
    total?: number;
    required?: number;
  };
}

export interface Vote {
  _id: string;
  submissionId: string; // series proposal ID
  voterId: string;
  decision: 'ACCEPT' | 'REJECT';
  schedule?: 'WEEKLY' | 'MONTHLY' | null;
  comment?: string;
  createdAt?: string;
}

export type DirectiveAction = 'CONTINUE' | 'CANCEL' | 'CHANGE_FORMAT';
export type DirectiveStatus = 'PENDING' | 'TIE_BREAK_REQUIRED' | 'APPROVED' | 'REJECTED';

export interface DirectiveVote {
  _id: string;
  voterId: string | User;
  voterName?: string;
  decision: 'ACCEPT' | 'REJECT';
  comment?: string;
  createdAt?: string;
}

export interface Directive {
  _id: string;
  seriesId: string;
  seriesTitle?: string;
  actionType: DirectiveAction;
  newSchedule?: 'WEEKLY' | 'MONTHLY' | null;
  reason: string;
  status: DirectiveStatus;
  votingDeadline?: string | null;
  proposedBy: string;
  proposedByName?: string;
  votes: DirectiveVote[];
  chairpersonId?: string | User | null;
  tiedDecisions?: Array<'ACCEPT' | 'REJECT'>;
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

export interface Notification {
  _id: string;
  userId: any;
  user?: User;
  title: string;
  content: string;
  type: 'INFO' | 'WARNING' | 'ERROR';
  isRead: boolean;
  createdAt?: string;
}

export interface AuditLog {
  _id: string;
  userId?: any;
  user?: User | string;
  userName?: string;
  action: string;
  target: string;
  timestamp?: string;
  createdAt?: string;
  details?: string;
}
