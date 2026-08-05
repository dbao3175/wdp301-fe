import React, { useState, useRef, useCallback } from 'react';
import {
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  MessageSquarePlus,
  Pin,
  CheckCircle2,
  X,
  Send,
  AlertCircle,
  BookOpen,
  Pencil,
  Highlighter,
} from 'lucide-react';
import type { ManuscriptPage, Annotation, AnnotationCategory } from '../../types/index.ts';
import { useLanguage } from '../../../../i18n/LanguageContext';

// =========================================================
// ANNOTATION CATEGORY CONFIG
// =========================================================

const CATEGORY_LABELS: Record<AnnotationCategory, string> = {
  DIALOGUE_ISSUE: 'Dialogue Issue',
  STORY_ISSUE: 'Story Issue',
  SCRIPT_REVISION: 'Script Revision',
  CONTENT_CORRECTION: 'Content Correction',
  SCENE_IMPROVEMENT: 'Scene Improvement',
  GENERAL_FEEDBACK: 'General Feedback',
};

const CATEGORY_COLORS: Record<AnnotationCategory, string> = {
  DIALOGUE_ISSUE: '#E63946',
  STORY_ISSUE: '#F39C12',
  SCRIPT_REVISION: '#9B59B6',
  CONTENT_CORRECTION: '#3498DB',
  SCENE_IMPROVEMENT: '#2ECC71',
  GENERAL_FEEDBACK: '#95A5A6',
};

// =========================================================
// ANNOTATION PIN
// =========================================================

interface AnnotationPinProps {
  annotation: Annotation;
  selected: boolean;
  onClick: () => void;
}

export const AnnotationPin: React.FC<AnnotationPinProps> = ({
  annotation,
  selected,
  onClick,
}) => {
  const color = CATEGORY_COLORS[annotation.category];

  return (
    <button
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      title={annotation.comment}
      className={`absolute -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full border-2 flex items-center justify-center text-white text-[9px] font-mono font-extrabold transition-all z-10 cursor-pointer ${
        annotation.resolved
          ? 'opacity-50 grayscale'
          : selected
          ? 'scale-150 shadow-lg'
          : 'hover:scale-125'
      }`}
      style={{
        left: `${annotation.x}%`,
        top: `${annotation.y}%`,
        backgroundColor: color,
        borderColor: annotation.resolved ? '#9ca3af' : '#141414',
        border: `2px solid ${annotation.resolved ? '#9ca3af' : '#141414'}`,
      }}
    >
      {annotation.resolved ? '✓' : '!'}
    </button>
  );
};

// =========================================================
// ANNOTATION CANVAS (overlay)
// =========================================================

interface NewAnnotationDraft {
  x: number;
  y: number;
  category: AnnotationCategory;
  comment: string;
}

interface AnnotationCanvasProps {
  page: ManuscriptPage;
  selectedAnnotationId: string | null;
  onSelectAnnotation: (id: string | null) => void;
  onAddAnnotation: (draft: Omit<Annotation, 'id' | 'createdAt' | 'resolved'>) => void;
  isAddingAnnotation: boolean;
}

export const AnnotationCanvas: React.FC<AnnotationCanvasProps> = ({
  page,
  selectedAnnotationId,
  onSelectAnnotation,
  onAddAnnotation,
  isAddingAnnotation,
}) => {
  const { t } = useLanguage();
  const [draft, setDraft] = useState<NewAnnotationDraft | null>(null);
  const canvasRef = useRef<HTMLDivElement>(null);

  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (!isAddingAnnotation || !canvasRef.current) return;
      const rect = canvasRef.current.getBoundingClientRect();
      const x = ((e.clientX - rect.left) / rect.width) * 100;
      const y = ((e.clientY - rect.top) / rect.height) * 100;
      setDraft({ x, y, category: 'GENERAL_FEEDBACK', comment: '' });
    },
    [isAddingAnnotation],
  );

  const handleSubmitDraft = () => {
    if (!draft || !draft.comment.trim()) return;
    onAddAnnotation({
      chapterId: page.id,
      pageNumber: page.pageNumber,
      x: draft.x,
      y: draft.y,
      category: draft.category,
      comment: draft.comment,
      authorName: 'Tanaka Hiroshi (Tantou)',
      authorAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Hiroshi',
    });
    setDraft(null);
  };

  return (
    <div
      ref={canvasRef}
      onClick={handleCanvasClick}
      className={`relative w-full h-full ${
        isAddingAnnotation ? 'cursor-crosshair' : ''
      }`}
    >
      {/* Page Image */}
      <img
        src={page.imageUrl}
        alt={`Page ${page.pageNumber}`}
        className="w-full h-auto block select-none"
        draggable={false}
      />

      {/* Annotations */}
      {page.annotations.map((ann) => (
        <AnnotationPin
          key={ann.id}
          annotation={ann}
          selected={selectedAnnotationId === ann.id}
          onClick={() => onSelectAnnotation(selectedAnnotationId === ann.id ? null : ann.id)}
        />
      ))}
      {/* Draft pin */}
      {draft && (
        <div
          style={{ left: `${draft.x}%`, top: `${draft.y}%` }}
          className="absolute -translate-x-1/2 -translate-y-1/2 z-20"
        >
          <div className="w-4 h-4 bg-[#E63946] border-2 border-ink-black animate-pulse" />
          {/* Inline form — flips to stay inside the page near edges */}
          <div
            className={`absolute bg-white border-2 border-ink-black shadow-[4px_4px_0px_#141414] p-3 w-64 z-30 ${
              draft.x > 55 ? 'right-6' : 'left-6'
            } ${draft.y > 55 ? 'bottom-6' : 'top-0'}`}
            onClick={(e) => e.stopPropagation()}
          >
            <p className="font-mono text-[9px] font-extrabold uppercase text-ink-black mb-2">
              {t("New Annotation")}
            </p>
            <select
              value={draft.category}
              onChange={(e) => setDraft({ ...draft, category: e.target.value as AnnotationCategory })}
              className="w-full text-xs font-mono border-2 border-ink-black px-2 py-1.5 mb-2 outline-none"
            >
              {(Object.keys(CATEGORY_LABELS) as AnnotationCategory[]).map((cat) => (
                <option key={cat} value={cat}>
                  {t(CATEGORY_LABELS[cat])}
                </option>
              ))}
            </select>
            <textarea
              placeholder={t("Describe the issue...")}
              value={draft.comment}
              onChange={(e) => setDraft({ ...draft, comment: e.target.value })}
              rows={3}
              className="w-full text-xs font-sans border-2 border-ink-black px-2 py-1.5 outline-none resize-none focus:border-[#E63946] mb-2"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={handleSubmitDraft}
                className="flex-1 bg-ink-black text-white text-[10px] font-mono font-extrabold uppercase py-1.5 border-2 border-ink-black hover:bg-neutral-800 transition-colors cursor-pointer flex items-center justify-center gap-1"
              >
                <Send className="w-3 h-3" /> {t("Save")}
              </button>
              <button
                onClick={() => setDraft(null)}
                className="px-2 bg-white text-ink-black border-2 border-ink-black hover:bg-neutral-50 transition-colors cursor-pointer"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// =========================================================
// COMMENT SIDEBAR
// =========================================================

interface CommentSidebarProps {
  pages: ManuscriptPage[];
  selectedAnnotationId: string | null;
  onSelectAnnotation: (id: string | null) => void;
  onResolve: (chapterId: string, annotationId: string) => void;
  currentPageNumber: number;
  onJumpToPage: (page: number) => void;
}

export const CommentSidebar: React.FC<CommentSidebarProps> = ({
  pages,
  selectedAnnotationId,
  onSelectAnnotation,
  onResolve,
  currentPageNumber,
  onJumpToPage,
}) => {
  const { t } = useLanguage();
  const allAnnotations = pages.flatMap((p) =>
    p.annotations.map((a) => ({ ...a, pageNumber: p.pageNumber })),
  );
  const unresolvedCount = allAnnotations.filter((a) => !a.resolved).length;

  return (
    <div className="h-full flex flex-col bg-white border-l-2 border-ink-black">
      {/* Header */}
      <div className="px-4 py-3 border-b-2 border-ink-black bg-ink-black">
        <div className="flex items-center justify-between">
          <h3 className="font-syne font-extrabold text-white text-xs uppercase tracking-widest">
            {t("Comments")}
          </h3>
          {unresolvedCount > 0 && (
            <span className="bg-[#E63946] text-white text-[9px] font-mono font-bold px-1.5 py-0.5 border border-red-400">
              {unresolvedCount} {t("open")}
            </span>
          )}
        </div>
      </div>

      {/* Annotation List */}
      <div className="flex-1 overflow-y-auto">
        {allAnnotations.length === 0 ? (
          <div className="p-4 text-center">
            <MessageSquarePlus className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
            <p className="font-mono text-[10px] text-neutral-400 uppercase">{t("No annotations yet")}</p>
          </div>
        ) : (
          <div className="divide-y divide-neutral-100">
            {allAnnotations.map((ann) => {
              const isSelected = selectedAnnotationId === ann.id;
              const color = CATEGORY_COLORS[ann.category];
              return (
                <div
                  key={ann.id}
                  onClick={() => {
                    onSelectAnnotation(isSelected ? null : ann.id);
                    onJumpToPage(ann.pageNumber);
                  }}
                  className={`p-3 cursor-pointer transition-colors ${
                    isSelected ? 'bg-neutral-50 border-l-4' : 'hover:bg-neutral-50 border-l-4 border-transparent'
                  } ${ann.resolved ? 'opacity-60' : ''}`}
                  style={{
                    borderLeftColor: isSelected ? color : 'transparent',
                  }}
                >
                  <div className="flex items-start gap-2">
                    <div
                      className="w-2.5 h-2.5 flex-shrink-0 mt-0.5 border border-ink-black"
                      style={{ backgroundColor: color }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1 mb-0.5">
                        <span className="font-mono text-[8px] font-extrabold uppercase text-neutral-500">
                          {t(CATEGORY_LABELS[ann.category])}
                        </span>
                        <span className="font-mono text-[8px] text-neutral-400">
                          · P.{ann.pageNumber}
                        </span>
                      </div>
                      <p className="font-sans text-xs text-ink-black leading-snug line-clamp-2">
                        {ann.comment}
                      </p>
                      <div className="flex items-center justify-between mt-1">
                        <span className="font-mono text-[9px] text-neutral-400">
                          {ann.authorName.split(' ')[0]}
                        </span>
                        {ann.resolved ? (
                          <span className="text-emerald-500 flex items-center gap-0.5 text-[9px] font-mono">
                            <CheckCircle2 className="w-3 h-3" /> {t("resolved")}
                          </span>
                        ) : (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              onResolve(ann.chapterId, ann.id);
                            }}
                            className="text-[9px] font-mono text-neutral-400 hover:text-emerald-600 transition-colors cursor-pointer uppercase"
                          >
                            {t("Resolve")}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

// =========================================================
// MANUSCRIPT VIEWER
// =========================================================

interface ManuscriptViewerProps {
  pages: ManuscriptPage[];
  selectedAnnotationId: string | null;
  onSelectAnnotation: (id: string | null) => void;
  onAddAnnotation: (data: Omit<Annotation, 'id' | 'createdAt' | 'resolved'>) => void;
}

export const ManuscriptViewer: React.FC<ManuscriptViewerProps> = ({
  pages,
  selectedAnnotationId,
  onSelectAnnotation,
  onAddAnnotation,
}) => {
  const { t } = useLanguage();
  const [currentPage, setCurrentPage] = useState(0);
  const [zoom, setZoom] = useState(100);
  const [isAddingAnnotation, setIsAddingAnnotation] = useState(true);

  const page = pages[currentPage];
  if (!page) return null;

  const canPrev = currentPage > 0;
  const canNext = currentPage < pages.length - 1;

  return (
    <div className="flex flex-col h-full bg-neutral-900">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-neutral-800 border-b border-neutral-700 flex-shrink-0">
        {/* Page navigation */}
        <div className="flex items-center gap-2">
          <button
            disabled={!canPrev}
            onClick={() => setCurrentPage((p) => p - 1)}
            className="w-7 h-7 flex items-center justify-center text-neutral-400 hover:text-white disabled:opacity-30 transition-colors border border-neutral-600 hover:border-neutral-400 cursor-pointer"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="font-mono text-xs text-neutral-300">
            <span className="text-white font-bold">{currentPage + 1}</span> / {pages.length}
          </span>
          <button
            disabled={!canNext}
            onClick={() => setCurrentPage((p) => p + 1)}
            className="w-7 h-7 flex items-center justify-center text-neutral-400 hover:text-white disabled:opacity-30 transition-colors border border-neutral-600 hover:border-neutral-400 cursor-pointer"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Tools */}
        <div className="flex items-center gap-2">
          {/* Annotation mode toggle */}
          <button
            onClick={() => setIsAddingAnnotation((v) => !v)}
            title={t("Add Annotation Pin")}
            className={`w-7 h-7 flex items-center justify-center transition-colors border cursor-pointer ${
              isAddingAnnotation
                ? 'bg-[#E63946] text-white border-red-400'
                : 'text-neutral-400 hover:text-white border-neutral-600 hover:border-neutral-400'
            }`}
          >
            <Pin className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Zoom */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setZoom((z) => Math.max(50, z - 25))}
            className="w-7 h-7 flex items-center justify-center text-neutral-400 hover:text-white transition-colors border border-neutral-600 hover:border-neutral-400 cursor-pointer"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="font-mono text-xs text-neutral-300 w-12 text-center">{zoom}%</span>
          <button
            onClick={() => setZoom((z) => Math.min(200, z + 25))}
            className="w-7 h-7 flex items-center justify-center text-neutral-400 hover:text-white transition-colors border border-neutral-600 hover:border-neutral-400 cursor-pointer"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Page display */}
      <div className="flex-1 overflow-auto flex items-start justify-center p-4">
        <div
          style={{ width: `${zoom}%`, maxWidth: '700px', minWidth: '300px' }}
          className="relative"
        >
          <AnnotationCanvas
            page={page}
            selectedAnnotationId={selectedAnnotationId}
            onSelectAnnotation={onSelectAnnotation}
            onAddAnnotation={onAddAnnotation}
            isAddingAnnotation={isAddingAnnotation}
          />
        </div>
      </div>

      {/* Annotation mode indicator */}
      {isAddingAnnotation && (
        <div className="px-4 py-2 bg-[#E63946] flex items-center gap-2 flex-shrink-0">
          <Pin className="w-3.5 h-3.5 text-white" />
          <span className="font-mono text-[10px] text-white font-extrabold uppercase tracking-widest">
            {t("Click on the page to add annotation — click the pin button again to exit")}
          </span>
        </div>
      )}
    </div>
  );
};

// =========================================================
// REVIEW ACTION BAR
// =========================================================

interface ReviewActionBarProps {
  onSave: () => void;
  onRequestRevision: () => void;
  onApprove: () => void;
  loading?: boolean;
  chapterStatus: string;
  canReview?: boolean;
}

export const ReviewActionBar: React.FC<ReviewActionBarProps> = ({
  onSave,
  onRequestRevision,
  onApprove,
  loading,
  chapterStatus,
  canReview = true,
}) => {
  const { t } = useLanguage();
  const isApproved = chapterStatus === 'SENT_TO_EDITORIAL' || chapterStatus === 'APPROVED';

  return (
    <div className="flex items-center gap-3 px-6 py-3 bg-ink-black border-t-2 border-neutral-700">
      <button
        onClick={onSave}
        disabled={loading}
        className="px-4 py-2 bg-neutral-700 hover:bg-neutral-600 text-white border border-neutral-600 text-xs font-mono font-extrabold uppercase transition-colors cursor-pointer disabled:opacity-50"
      >
        {t("Save Review")}
      </button>
      <div className="flex-1" />
      <button
        onClick={onRequestRevision}
        disabled={loading || isApproved || !canReview}
        className="px-4 py-2 bg-orange-600 hover:bg-orange-700 text-white border-2 border-orange-700 text-xs font-mono font-extrabold uppercase shadow-[2px_2px_0px_#141414] transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
      >
        <AlertCircle className="w-3.5 h-3.5" />
        {t("Request Revision")}
      </button>
      <button
        onClick={onApprove}
        disabled={loading || isApproved || !canReview}
        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white border-2 border-emerald-700 text-xs font-mono font-extrabold uppercase shadow-[2px_2px_0px_#141414] transition-colors cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
      >
        <CheckCircle2 className="w-3.5 h-3.5" />
        {isApproved ? t("Approved") : !canReview ? t("Awaiting Mangaka Review") : t("Approve & Submit")}
      </button>
    </div>
  );
};
