import type {
  Proposal,
  ProposalStatus,
  Series,
  Chapter,
  ChapterStatus,
  ReviewComment,
  Annotation,
  DashboardStats,
} from '../types/index.ts';
import {
  mockProposals,
  mockSeries,
  mockChapters,
  mockDashboardStats,
  mockDeadlines,
} from '../mock/data.ts';

// Simulate network delay
const delay = (ms = 400) => new Promise((resolve) => setTimeout(resolve, ms));

// In-memory mutable store
let _proposals = [...mockProposals];
let _series = [...mockSeries];
let _chapters = [...mockChapters];

// =========================================================
// DASHBOARD SERVICE
// =========================================================

export const dashboardService = {
  async getStats(): Promise<DashboardStats> {
    await delay();
    return {
      ...mockDashboardStats,
      topRankedSeries: _series.filter(s => s.status === 'ACTIVE').sort((a, b) => a.currentRanking - b.currentRanking).slice(0, 3),
      mostVotedSeries: [..._series].sort((a, b) => b.totalVotes - a.totalVotes).slice(0, 3),
    };
  },

  async getDeadlines() {
    await delay(200);
    return mockDeadlines;
  },
};

// =========================================================
// PROPOSAL SERVICE
// =========================================================

export const proposalService = {
  async getAll(filters?: { status?: ProposalStatus; search?: string }): Promise<Proposal[]> {
    await delay();
    let result = [..._proposals];
    if (filters?.status) {
      result = result.filter(p => p.status === filters.status);
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        p =>
          p.title.toLowerCase().includes(q) ||
          p.mangaka.name.toLowerCase().includes(q) ||
          p.genre.toLowerCase().includes(q),
      );
    }
    return result.sort((a, b) => new Date(b.submittedDate).getTime() - new Date(a.submittedDate).getTime());
  },

  async getById(id: string): Promise<Proposal | null> {
    await delay();
    return _proposals.find(p => p.id === id) ?? null;
  },

  async updateStatus(id: string, status: ProposalStatus): Promise<Proposal> {
    await delay();
    const idx = _proposals.findIndex(p => p.id === id);
    if (idx === -1) throw new Error('Proposal not found');
    _proposals[idx] = {
      ..._proposals[idx],
      status,
      lastUpdated: new Date().toISOString(),
    };
    return _proposals[idx];
  },

  async addComment(id: string, comment: Omit<ReviewComment, 'id' | 'createdAt'>): Promise<Proposal> {
    await delay();
    const idx = _proposals.findIndex(p => p.id === id);
    if (idx === -1) throw new Error('Proposal not found');
    const newComment: ReviewComment = {
      ...comment,
      id: `rc-${Date.now()}`,
      createdAt: new Date().toISOString(),
    };
    _proposals[idx] = {
      ..._proposals[idx],
      reviewComments: [..._proposals[idx].reviewComments, newComment],
      lastUpdated: new Date().toISOString(),
    };
    return _proposals[idx];
  },

  async requestRevision(id: string, reason: string): Promise<Proposal> {
    await delay();
    const idx = _proposals.findIndex(p => p.id === id);
    if (idx === -1) throw new Error('Proposal not found');
    const newComment: ReviewComment = {
      id: `rc-${Date.now()}`,
      authorId: 'ed-001',
      authorName: 'Tanaka Hiroshi (Tantou)',
      authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Hiroshi',
      content: `Revision Requested: ${reason}`,
      createdAt: new Date().toISOString(),
      isInternal: false,
    };
    _proposals[idx] = {
      ..._proposals[idx],
      status: 'REVISION_REQUESTED',
      reviewComments: [..._proposals[idx].reviewComments, newComment],
      lastUpdated: new Date().toISOString(),
    };
    return _proposals[idx];
  },

  async approveAndSubmit(id: string): Promise<Proposal> {
    await delay();
    const idx = _proposals.findIndex(p => p.id === id);
    if (idx === -1) throw new Error('Proposal not found');
    _proposals[idx] = {
      ..._proposals[idx],
      status: 'SENT_TO_EDITORIAL_BOARD',
      lastUpdated: new Date().toISOString(),
    };
    return _proposals[idx];
  },
};

// =========================================================
// SERIES SERVICE
// =========================================================

export const seriesService = {
  async getAll(filters?: { status?: string; search?: string; sortBy?: string }): Promise<Series[]> {
    await delay();
    let result = [..._series];
    if (filters?.status && filters.status !== 'ALL') {
      result = result.filter(s => s.status === filters.status);
    }
    if (filters?.search) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        s =>
          s.title.toLowerCase().includes(q) ||
          s.mangaka.name.toLowerCase().includes(q) ||
          s.genre.toLowerCase().includes(q),
      );
    }
    if (filters?.sortBy === 'votes') {
      result.sort((a, b) => b.totalVotes - a.totalVotes);
    } else if (filters?.sortBy === 'ranking') {
      result.sort((a, b) => a.currentRanking - b.currentRanking);
    } else if (filters?.sortBy === 'deadline') {
      result.sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());
    }
    return result;
  },

  async getById(id: string): Promise<Series | null> {
    await delay();
    return _series.find(s => s.id === id) ?? null;
  },
};

// =========================================================
// CHAPTER / MANUSCRIPT SERVICE
// =========================================================

export const manuscriptService = {
  async getChaptersBySeriesId(seriesId: string): Promise<Chapter[]> {
    await delay(300);
    return _chapters.filter(c => c.seriesId === seriesId);
  },

  async getChapterById(id: string): Promise<Chapter | null> {
    await delay();
    // Also check within series objects
    for (const s of _series) {
      const ch = s.chapters.find(c => c.id === id);
      if (ch && ch.pages.length > 0) return ch;
    }
    return _chapters.find(c => c.id === id) ?? null;
  },

  async updateChapterStatus(id: string, status: ChapterStatus): Promise<Chapter> {
    await delay();
    const idx = _chapters.findIndex(c => c.id === id);
    if (idx !== -1) {
      _chapters[idx] = { ..._chapters[idx], status, lastUpdated: new Date().toISOString() };
      return _chapters[idx];
    }
    // Also update in series
    for (const s of _series) {
      const chIdx = s.chapters.findIndex(c => c.id === id);
      if (chIdx !== -1) {
        s.chapters[chIdx] = { ...s.chapters[chIdx], status, lastUpdated: new Date().toISOString() };
        return s.chapters[chIdx];
      }
    }
    throw new Error('Chapter not found');
  },

  async addAnnotation(chapterId: string, annotation: Omit<Annotation, 'id' | 'createdAt' | 'resolved'>): Promise<Annotation> {
    await delay(200);
    const newAnnotation: Annotation = {
      ...annotation,
      id: `ann-${Date.now()}`,
      createdAt: new Date().toISOString(),
      resolved: false,
    };
    // Add to in-memory series chapters
    for (const s of _series) {
      const chIdx = s.chapters.findIndex(c => c.id === chapterId);
      if (chIdx !== -1) {
        const pageIdx = s.chapters[chIdx].pages.findIndex(p => p.pageNumber === annotation.pageNumber);
        if (pageIdx !== -1) {
          s.chapters[chIdx].pages[pageIdx].annotations.push(newAnnotation);
        }
      }
    }
    return newAnnotation;
  },

  async resolveAnnotation(chapterId: string, annotationId: string): Promise<void> {
    await delay(200);
    for (const s of _series) {
      const ch = s.chapters.find(c => c.id === chapterId);
      if (ch) {
        for (const page of ch.pages) {
          const ann = page.annotations.find(a => a.id === annotationId);
          if (ann) {
            ann.resolved = true;
            return;
          }
        }
      }
    }
  },

  async requestRevision(chapterId: string, notes: string): Promise<Chapter> {
    return manuscriptService.updateChapterStatus(chapterId, 'REVISION_REQUESTED');
  },

  async approveChapter(chapterId: string): Promise<Chapter> {
    return manuscriptService.updateChapterStatus(chapterId, 'SENT_TO_EDITORIAL');
  },
};
