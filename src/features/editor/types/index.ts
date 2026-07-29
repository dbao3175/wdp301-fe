// =========================================================
// EDITOR DOMAIN TYPES
// =========================================================

export type ProposalStatus =
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'REVISION_REQUESTED'
  | 'RESUBMITTED'
  | 'APPROVED_BY_TANTOU'
  | 'SENT_TO_EDITORIAL_BOARD'
  | 'APPROVED'
  | 'SERIES_CREATED'
  | 'REJECTED';

export type ChapterStatus =
  | 'DRAFT'
  | 'SUBMITTED'
  | 'UNDER_REVIEW'
  | 'REVISION_REQUESTED'
  | 'APPROVED'
  | 'SENT_TO_EDITORIAL'
  | 'PUBLISHED';

export type SeriesStatus =
  | 'ACTIVE'
  | 'ON_HIATUS'
  | 'COMPLETED'
  | 'CANCELLED'
  | 'PENDING';

export type ProductionStage =
  | 'STORY_PLANNING'
  | 'STORYBOARD'
  | 'DRAFT'
  | 'LINE_ART'
  | 'COLORING'
  | 'LETTERING'
  | 'FINAL_REVIEW'
  | 'READY_FOR_PRINT'
  | 'PUBLISHED';

export type AnnotationCategory =
  | 'DIALOGUE_ISSUE'
  | 'STORY_ISSUE'
  | 'SCRIPT_REVISION'
  | 'CONTENT_CORRECTION'
  | 'SCENE_IMPROVEMENT'
  | 'GENERAL_FEEDBACK';

export type Genre =
  | 'Action'
  | 'Adventure'
  | 'Comedy'
  | 'Drama'
  | 'Fantasy'
  | 'Horror'
  | 'Mystery'
  | 'Romance'
  | 'Sci-Fi'
  | 'Slice of Life'
  | 'Sports'
  | 'Thriller'
  | 'Supernatural';

// =========================================================
// CORE ENTITIES
// =========================================================

export interface Mangaka {
  id: string;
  name: string;
  avatar: string;
  email: string;
  totalSeries: number;
  joinedDate: string;
}

export interface CharacterDesign {
  id: string;
  name: string;
  role: string;
  description: string;
  imageUrl: string;
}

export interface SamplePage {
  id: string;
  pageNumber: number;
  imageUrl: string;
  caption?: string;
}

export interface ReviewComment {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar: string;
  content: string;
  createdAt: string;
  isInternal: boolean;
}

export interface Proposal {
  id: string;
  title: string;
  synopsis: string;
  genre: Genre;
  tags: string[];
  mangaka: Mangaka;
  submittedDate: string;
  lastUpdated: string;
  status: ProposalStatus;
  storyDraft: {
    description: string;
    samplePages: SamplePage[];
  };
  characterDesigns: CharacterDesign[];
  reviewComments: ReviewComment[];
  assignedEditorId: string;
  targetAudience: string;
  estimatedChapters: number;
  scheduledFrequency: string;
}

export interface Annotation {
  id: string;
  chapterId: string;
  pageNumber: number;
  x: number; // percentage from left
  y: number; // percentage from top
  category: AnnotationCategory;
  comment: string;
  authorName: string;
  authorAvatar: string;
  createdAt: string;
  resolved: boolean;
}

export interface ManuscriptPage {
  id: string;
  pageNumber: number;
  imageUrl: string;
  annotations: Annotation[];
}

export interface Chapter {
  id: string;
  seriesId: string;
  chapterNumber: number;
  title: string;
  status: ChapterStatus;
  submittedDate: string;
  lastUpdated: string;
  pages: ManuscriptPage[];
  totalPages: number;
  votes: number;
  reviewNotes: string;
  deadline: string;
  mangakaName: string;
}

export interface ProductionLog {
  id: string;
  seriesId: string;
  stage: ProductionStage;
  description: string;
  authorName: string;
  createdAt: string;
  completionPercentage: number;
}

export interface EditorialNote {
  id: string;
  seriesId: string;
  content: string;
  authorName: string;
  createdAt: string;
  isImportant: boolean;
}

export interface RevisionHistory {
  id: string;
  seriesId: string;
  chapterId?: string;
  description: string;
  requestedBy: string;
  requestedAt: string;
  resolvedAt?: string;
  status: 'PENDING' | 'RESOLVED';
}

export interface RankingDataPoint {
  week: string;
  rank: number;
}

export interface VoteDataPoint {
  chapter: string;
  votes: number;
}

export interface ProgressDataPoint {
  month: string;
  chaptersCompleted: number;
  target: number;
}

export interface Series {
  id: string;
  title: string;
  synopsis: string;
  genre: Genre;
  tags: string[];
  coverUrl: string;
  mangaka: Mangaka;
  assignedEditorId: string;
  status: SeriesStatus;
  currentStage: ProductionStage;
  completionPercentage: number;
  deadline: string;
  remainingDays: number;
  totalChapters: number;
  publishedChapters: number;
  currentRanking: number;
  previousRanking: number;
  totalVotes: number;
  averageVotesPerChapter: number;
  highestVotedChapter: string;
  latestChapterVotes: number;
  startDate: string;
  chapters: Chapter[];
  productionLogs: ProductionLog[];
  editorialNotes: EditorialNote[];
  revisionHistory: RevisionHistory[];
  rankingHistory: RankingDataPoint[];
  voteHistory: VoteDataPoint[];
  progressHistory: ProgressDataPoint[];
}

// =========================================================
// DASHBOARD STATS
// =========================================================

export interface DashboardStats {
  activeSeries: number;
  pendingProposals: number;
  pendingChapterReviews: number;
  upcomingDeadlines: number;
  delayedProjects: number;
  topRankedSeries: Series[];
  mostVotedSeries: Series[];
}

// =========================================================
// FORM SCHEMAS (for react-hook-form)
// =========================================================

export interface ReviewCommentForm {
  content: string;
  isInternal: boolean;
}

export interface AnnotationForm {
  category: AnnotationCategory;
  comment: string;
  pageNumber: number;
  x: number;
  y: number;
}
