import React, { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  ArrowLeft,
  BookOpen,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  ChevronDown,
  List,
} from 'lucide-react';
import { manuscriptService, seriesService } from '../services/index.ts';
import type { Annotation, Chapter } from '../types/index.ts';
import { LoadingState, ErrorState, StatusBadge } from '../components/common/States.tsx';
import { ManuscriptViewer, CommentSidebar, ReviewActionBar } from '../components/review/ManuscriptComponents.tsx';
import { ConfirmDialog } from '../components/common/Modal.tsx';

// =========================================================
// CHAPTER SELECTOR
// =========================================================

interface ChapterSelectorProps {
  chapters: Chapter[];
  selectedId: string;
  onSelect: (id: string) => void;
}

const ChapterSelector: React.FC<ChapterSelectorProps> = ({ chapters, selectedId, onSelect }) => {
  const pendingChapters = chapters.filter(
    (c) => c.status === 'SUBMITTED' || c.status === 'UNDER_REVIEW',
  );
  const otherChapters = chapters.filter(
    (c) => c.status !== 'SUBMITTED' && c.status !== 'UNDER_REVIEW',
  );

  return (
    <div className="bg-white border-2 border-ink-black shadow-[4px_4px_0px_#141414]">
      <div className="px-4 py-3 border-b-2 border-ink-black bg-ink-black flex items-center gap-2">
        <List className="w-4 h-4 text-white" />
        <h3 className="font-syne font-extrabold text-white text-xs uppercase tracking-widest">
          Chapters
        </h3>
      </div>
      <div className="overflow-y-auto max-h-[calc(100vh-300px)]">
        {pendingChapters.length > 0 && (
          <div>
            <p className="px-3 py-2 font-mono text-[8px] font-extrabold uppercase text-amber-600 bg-amber-50 border-b border-amber-200">
              Pending Review
            </p>
            {pendingChapters.map((ch) => (
              <button
                key={ch.id}
                onClick={() => onSelect(ch.id)}
                className={`w-full text-left px-3 py-3 border-b border-neutral-100 transition-colors cursor-pointer ${
                  selectedId === ch.id ? 'bg-neutral-100 border-l-4 border-l-[#E63946]' : 'hover:bg-neutral-50 border-l-4 border-l-transparent'
                }`}
              >
                <p className="font-sans font-bold text-xs text-ink-black">
                  Ch.{ch.chapterNumber}: {ch.title}
                </p>
                <div className="flex items-center gap-1 mt-0.5">
                  <StatusBadge label="Under Review" variant="under_review" />
                  <span className="font-mono text-[8px] text-neutral-400">
                    {ch.totalPages}p · {new Date(ch.submittedDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </div>
              </button>
            ))}
          </div>
        )}
        {otherChapters.length > 0 && (
          <div>
            <p className="px-3 py-2 font-mono text-[8px] font-extrabold uppercase text-neutral-500 bg-neutral-50 border-b border-neutral-200">
              Other Chapters
            </p>
            {otherChapters.map((ch) => (
              <button
                key={ch.id}
                onClick={() => onSelect(ch.id)}
                className={`w-full text-left px-3 py-3 border-b border-neutral-100 transition-colors cursor-pointer ${
                  selectedId === ch.id ? 'bg-neutral-100 border-l-4 border-l-ink-black' : 'hover:bg-neutral-50 border-l-4 border-l-transparent'
                }`}
              >
                <p className="font-sans font-bold text-xs text-ink-black">
                  Ch.{ch.chapterNumber}: {ch.title}
                </p>
                <div className="flex items-center gap-1 mt-0.5">
                  <StatusBadge
                    label={ch.status.replace('_', ' ')}
                    variant={ch.status === 'PUBLISHED' ? 'published' : ch.status === 'APPROVED' ? 'approved' : 'default'}
                  />
                </div>
              </button>
            ))}
          </div>
        )}
        {chapters.length === 0 && (
          <div className="p-4 text-center">
            <p className="font-mono text-[10px] text-neutral-400 uppercase">No chapters submitted</p>
          </div>
        )}
      </div>
    </div>
  );
};

// =========================================================
// MANUSCRIPT REVIEW PAGE
// =========================================================

export const ManuscriptReviewPage: React.FC = () => {
  const { seriesId } = useParams<{ seriesId: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [selectedAnnotationId, setSelectedAnnotationId] = useState<string | null>(null);
  const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null);
  const [showRevisionDialog, setShowRevisionDialog] = useState(false);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [revisionNotes, setRevisionNotes] = useState('');
  const [savedNotification, setSavedNotification] = useState(false);

  // Load series info
  const { data: series, isLoading: seriesLoading } = useQuery({
    queryKey: ['series', seriesId],
    queryFn: () => seriesService.getById(seriesId!),
    enabled: !!seriesId,
  });

  // Load chapters for the series
  const { data: chapters, isLoading: chaptersLoading } = useQuery<Chapter[]>({
    queryKey: ['chapters', seriesId],
    queryFn: () => manuscriptService.getChaptersBySeriesId(seriesId!),
    enabled: !!seriesId,
  });

  // Auto-select first pending chapter when chapters load
  React.useEffect(() => {
    if (chapters && !selectedChapterId && chapters.length > 0) {
      const firstPending = chapters.find(
        (c) => c.status === 'SUBMITTED' || c.status === 'UNDER_REVIEW',
      );
      setSelectedChapterId(firstPending?.id ?? chapters[0].id);
    }
  }, [chapters, selectedChapterId]);

  // Load selected chapter with full pages data (from series object)
  const { data: chapter, isLoading: chapterLoading } = useQuery({
    queryKey: ['chapter', selectedChapterId],
    queryFn: () => manuscriptService.getChapterById(selectedChapterId!),
    enabled: !!selectedChapterId,
  });

  // Auto-select first chapter when available
  React.useEffect(() => {
    if (series && !selectedChapterId) {
      const chapsWithPages = series.chapters.filter(c => c.pages.length > 0);
      if (chapsWithPages.length > 0) {
        const firstPending = chapsWithPages.find(c => c.status === 'SUBMITTED' || c.status === 'UNDER_REVIEW');
        setSelectedChapterId(firstPending?.id ?? chapsWithPages[0].id);
      }
    }
  }, [series, selectedChapterId]);

  const addAnnotationMutation = useMutation({
    mutationFn: (data: Omit<Annotation, 'id' | 'createdAt' | 'resolved'>) =>
      manuscriptService.addAnnotation(selectedChapterId!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chapter', selectedChapterId] });
      queryClient.invalidateQueries({ queryKey: ['series', seriesId] });
    },
  });

  const resolveAnnotationMutation = useMutation({
    mutationFn: ({ chapterId, annotationId }: { chapterId: string; annotationId: string }) =>
      manuscriptService.resolveAnnotation(chapterId, annotationId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chapter', selectedChapterId] });
      queryClient.invalidateQueries({ queryKey: ['series', seriesId] });
    },
  });

  const revisionMutation = useMutation({
    mutationFn: () => manuscriptService.requestRevision(selectedChapterId!, revisionNotes),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chapter', selectedChapterId] });
      queryClient.invalidateQueries({ queryKey: ['chapters', seriesId] });
      setShowRevisionDialog(false);
    },
  });

  const approveMutation = useMutation({
    mutationFn: () => manuscriptService.approveChapter(selectedChapterId!),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chapter', selectedChapterId] });
      queryClient.invalidateQueries({ queryKey: ['chapters', seriesId] });
      setShowApproveDialog(false);
    },
  });

  const handleSave = () => {
    setSavedNotification(true);
    setTimeout(() => setSavedNotification(false), 2500);
  };

  const handleAddAnnotation = (data: Omit<Annotation, 'id' | 'createdAt' | 'resolved'>) => {
    addAnnotationMutation.mutate({ ...data, chapterId: selectedChapterId! });
  };

  const handleResolveAnnotation = (chapterId: string, annotationId: string) => {
    resolveAnnotationMutation.mutate({ chapterId, annotationId });
  };

  if (seriesLoading || chaptersLoading) return <LoadingState message="Loading manuscript..." />;
  if (!series) return <ErrorState message="Series not found." />;

  // Get chapter to display — prefer from series object (has full pages)
  const displayChapter =
    series.chapters.find((c) => c.id === selectedChapterId) ??
    (chapter ?? null);

  const allChapters = series.chapters.length > 0 ? series.chapters : (chapters ?? []);

  return (
    <div className="-m-6 h-[calc(100vh-64px)] flex flex-col">
      {/* Top Bar */}
      <div className="flex items-center gap-3 px-4 py-2.5 bg-white border-b-2 border-ink-black flex-shrink-0">
        <button
          onClick={() => navigate(`/editor/series/${seriesId}`)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-white border-2 border-ink-black text-[10px] font-mono font-bold uppercase shadow-[2px_2px_0px_#141414] hover:bg-neutral-50 transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-3 h-3" /> Back
        </button>
        <div className="h-5 w-px bg-neutral-200" />
        <div className="flex-1 min-w-0">
          <h1 className="font-syne font-extrabold text-sm text-ink-black truncate">
            Manuscript Review — {series.title}
          </h1>
          {displayChapter && (
            <p className="font-mono text-[9px] text-neutral-500">
              Chapter {displayChapter.chapterNumber}: {displayChapter.title}
              {' · '}
              {displayChapter.totalPages} pages
            </p>
          )}
        </div>
        {savedNotification && (
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 border border-emerald-400 text-emerald-700 text-[10px] font-mono font-bold">
            <CheckCircle2 className="w-3 h-3" /> Review Saved
          </div>
        )}
      </div>

      {/* Main Layout: Chapter Selector | Viewer | Comments */}
      <div className="flex-1 flex overflow-hidden">

        {/* Chapter Sidebar */}
        <div className="w-52 flex-shrink-0 overflow-y-auto border-r-2 border-ink-black">
          <ChapterSelector
            chapters={allChapters}
            selectedId={selectedChapterId ?? ''}
            onSelect={setSelectedChapterId}
          />
        </div>

        {/* Manuscript Viewer */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {chapterLoading ? (
            <LoadingState message="Loading chapter pages..." />
          ) : !displayChapter ? (
            <div className="flex-1 flex items-center justify-center bg-neutral-900">
              <div className="text-center">
                <BookOpen className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
                <p className="font-mono text-sm text-neutral-400 uppercase tracking-widest">
                  Select a chapter to review
                </p>
              </div>
            </div>
          ) : displayChapter.pages.length === 0 ? (
            <div className="flex-1 flex items-center justify-center bg-neutral-900">
              <div className="text-center">
                <AlertCircle className="w-12 h-12 text-neutral-600 mx-auto mb-3" />
                <p className="font-mono text-sm text-neutral-400 uppercase tracking-widest">
                  No page images available
                </p>
                <p className="font-mono text-xs text-neutral-500 mt-1">
                  (mock data only loads pages for chapters with status UNDER_REVIEW)
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-hidden">
                <ManuscriptViewer
                  pages={displayChapter.pages}
                  selectedAnnotationId={selectedAnnotationId}
                  onSelectAnnotation={setSelectedAnnotationId}
                  onAddAnnotation={handleAddAnnotation}
                />
              </div>
              <ReviewActionBar
                onSave={handleSave}
                onRequestRevision={() => setShowRevisionDialog(true)}
                onApprove={() => setShowApproveDialog(true)}
                loading={revisionMutation.isPending || approveMutation.isPending}
                chapterStatus={displayChapter.status}
              />
            </>
          )}
        </div>

        {/* Comment Sidebar */}
        <div className="w-72 flex-shrink-0 border-l-2 border-ink-black overflow-hidden">
          <CommentSidebar
            pages={displayChapter?.pages ?? []}
            selectedAnnotationId={selectedAnnotationId}
            onSelectAnnotation={setSelectedAnnotationId}
            onResolve={handleResolveAnnotation}
            currentPageNumber={1}
            onJumpToPage={() => {}}
          />
        </div>
      </div>

      {/* Revision Dialog */}
      <ConfirmDialog
        isOpen={showRevisionDialog}
        onClose={() => setShowRevisionDialog(false)}
        onConfirm={() => revisionMutation.mutate()}
        title="Request Revision"
        message="Request revision for this chapter? The mangaka will be notified to revise based on your annotations."
        confirmLabel="Request Revision"
        cancelLabel="Cancel"
        variant="warning"
        loading={revisionMutation.isPending}
      />

      {/* Approve Dialog */}
      <ConfirmDialog
        isOpen={showApproveDialog}
        onClose={() => setShowApproveDialog(false)}
        onConfirm={() => approveMutation.mutate()}
        title="Approve & Send to Editorial"
        message="Approve this chapter and send it to the Editorial Board for final review?"
        confirmLabel="Approve & Submit"
        variant="default"
        loading={approveMutation.isPending}
      />
    </div>
  );
};
