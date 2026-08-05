/**
 * WorkspaceCanvas.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * 3-column Manga Review Workspace  ·  Dark Red / Matte Black / White / Slate
 *
 *  bg-app    #121214  — deep matte black   (canvas bg, outer shell)
 *  bg-panel  #1e1e24  — deep slate gray    (sidebar panels)
 *  divider   #2d2d34  — medium gray        (all borders/separators)
 *
 * Three modes:
 *   "REVIEW"   — normal 3-col review workflow
 *   "CREATION" — canvas-based task creation:
 *       Left   → muted task list (disabled interaction, visual opacity)
 *       Center → sketch upload dropzone → full-image canvas + bounding-box draw
 *       Right  → task assignment form (title / type / assistant / instructions)
 *   "SUBMIT"   — canvas-based page submission to the editor:
 *       Center → page-image upload dropzone → full-image canvas + zone draw
 *       Right  → note + submit form (creates a Page, marks the chapter SUBMITTED)
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { User, Series, Chapter } from '../types';
import { apiClient } from '../api/client';
import { useLanguage } from '../i18n/LanguageContext';
import {
  Plus,
  CheckCircle2,
  Clock,
  RotateCcw,
  Eye,
  EyeOff,
  ChevronRight,
  X,
  XCircle,
  Send,
  User as UserIcon,
  Brush,
  Check,
  Undo2,
  ArrowLeftRight,
  Trash2,
  MapPin,
  ImageIcon,
  UploadCloud,
  FileImage,
  Crosshair,
  ArrowLeft,
  Rocket,
} from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// Domain types
// ─────────────────────────────────────────────────────────────────────────────

type WTaskStatus = 'PENDING_REVIEW' | 'APPROVED' | 'REVISING' | 'ASSIGNED' | 'MANGAKA_APPROVED';

interface WTask {
  id: string;
  title: string;
  type: string;
  status: WTaskStatus;
  assistant: string;
  assistantInitials: string;
  submittedAt: string;
  rawTask?: any;
}

/** Percentage-based bounding box — stays accurate at any viewport size */
interface BBox {
  id: string;
  topPct: number;
  leftPct: number;
  widthPct: number;
  heightPct: number;
  comment: string;
}

/** Raw drag state before normalisation */
interface DraftBox {
  startXPct: number;
  startYPct: number;
  curXPct: number;
  curYPct: number;
}

const TASK_TYPES = ['Background', 'Character', 'Effects', 'Lettering', 'Toning'];

// ─────────────────────────────────────────────────────────────────────────────
// Status badge metadata
// ─────────────────────────────────────────────────────────────────────────────

const STATUS_META: Record<WTaskStatus, { label: string; color: string; icon: React.ReactNode }> = {
  PENDING_REVIEW:   { label: 'Pending Review', color: 'bg-[#2d2d34] text-slate-300 border border-[#3a3a44]',          icon: <Clock        className="w-3 h-3" /> },
  APPROVED:         { label: 'Approved',       color: 'bg-white text-black border border-white',                      icon: <CheckCircle2 className="w-3 h-3" /> },
  REVISING:         { label: 'Revising',       color: 'bg-red-500/10 text-red-400 border border-red-500/20',          icon: <RotateCcw    className="w-3 h-3" /> },
  ASSIGNED:         { label: 'Assigned',       color: 'bg-[#2d2d34]/60 text-slate-500 border border-[#3a3a44]/50',   icon: <UserIcon     className="w-3 h-3" /> },
  MANGAKA_APPROVED: { label: 'Mangaka Approved',color: 'bg-green-500/10 text-green-400 border border-green-500/20',   icon: <CheckCircle2 className="w-3 h-3" /> },
};

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: WTaskStatus }) {
  const { t } = useLanguage();
  const m = STATUS_META[status];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide ${m.color}`}>
      {m.icon}{t(m.label)}
    </span>
  );
}

/** Normalise drag coordinates — handles negative-direction drags */
function normaliseDraft(d: DraftBox): Omit<BBox, 'id' | 'comment'> {
  return {
    leftPct:   Math.min(d.startXPct, d.curXPct),
    topPct:    Math.min(d.startYPct, d.curYPct),
    widthPct:  Math.abs(d.curXPct - d.startXPct),
    heightPct: Math.abs(d.curYPct - d.startYPct),
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// TaskCard — left column
// ─────────────────────────────────────────────────────────────────────────────

function TaskCard({ task, isActive, muted, onClick }: {
  task: WTask; isActive: boolean; muted: boolean; onClick: () => void;
}) {
  const { t } = useLanguage();
  return (
    <button
      onClick={onClick}
      disabled={muted}
      className={`w-full text-left rounded-md transition-all duration-150 overflow-hidden ${
        muted ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
      } ${
        isActive && !muted
          ? 'border-l-4 border-r border-t border-b border-red-600 border-r-[#2d2d34] border-t-[#2d2d34] border-b-[#2d2d34] bg-[#26262e] pl-3 pr-3.5 py-3'
          : 'border border-[#2d2d34] bg-[#1e1e24] hover:bg-[#23232c] hover:border-[#3a3a44] px-3.5 py-3'
      }`}
    >
      <div className="flex items-center justify-between mb-1.5 gap-2">
        <span className="text-[9px] font-bold uppercase tracking-widest text-slate-600 shrink-0">{t(task.type)}</span>
        <StatusBadge status={task.status} />
      </div>
      <p className={`text-[13px] font-semibold leading-snug mb-2.5 ${isActive && !muted ? 'text-white' : 'text-slate-300'}`}>
        {task.title}
      </p>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <div className="w-5 h-5 rounded-md bg-[#2d2d34] border border-[#3a3a44] text-slate-300 flex items-center justify-center text-[8px] font-black select-none">
            {task.assistantInitials}
          </div>
          <span className="text-[10px] text-slate-500">{task.assistant}</span>
        </div>
        <span className="text-[9px] text-slate-600">{task.submittedAt}</span>
      </div>
      {isActive && !muted && (
        <div className="mt-2 pt-1.5 border-t border-[#2d2d34] flex items-center justify-end">
          <span className="text-[9px] text-red-500/70 font-semibold uppercase tracking-wide flex items-center gap-0.5">
            {t('Reviewing')} <ChevronRight className="w-3 h-3" />
          </span>
        </div>
      )}
    </button>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// AuthImage — handles loading protected images with JWT token
// ─────────────────────────────────────────────────────────────────────────────

function AuthImage({ src, alt, className, draggable }: { src: string; alt?: string; className?: string; draggable?: boolean }) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!src) return;
    let objectUrl: string | null = null;
    if (src.includes('/api/')) {
      const token = localStorage.getItem('mangaflow_token');
      fetch(src, { headers: { Authorization: `Bearer ${token}` } })
        .then(r => r.ok ? r.blob() : Promise.reject('Failed to load image'))
        .then(b => {
          objectUrl = URL.createObjectURL(b);
          setBlobUrl(objectUrl);
        })
        .catch(console.error);
    } else {
      setBlobUrl(src);
    }
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [src]);

  if (!blobUrl) return null;
  return <img src={blobUrl} alt={alt} className={className} draggable={draggable} />;
}

// ─────────────────────────────────────────────────────────────────────────────
// DrawableCanvas — shared bounding-box engine
// Used in both REVIEW mode (over mock manga) and CREATION mode (over sketch)
// ─────────────────────────────────────────────────────────────────────────────

function DrawableCanvas({
  sketchSrc,
  boxes,
  activeBoxId,
  onBoxCreated,
  onBoxSelect,
  onBoxDelete,
  creationMode = false,
}: {
  sketchSrc?: string | null;
  boxes: BBox[];
  activeBoxId: string | null;
  onBoxCreated: (b: Omit<BBox, 'id' | 'comment'>) => void;
  onBoxSelect:  (id: string) => void;
  onBoxDelete:  (id: string) => void;
  creationMode?: boolean;
}) {
  const { t } = useLanguage();
  const containerRef = useRef<HTMLDivElement>(null);
  const [draft, setDraft]     = useState<DraftBox | null>(null);
  const isDrawing              = useRef(false);

  const toPercent = useCallback((clientX: number, clientY: number) => {
    const r = containerRef.current!.getBoundingClientRect();
    return {
      xPct: Math.max(0, Math.min(100, ((clientX - r.left)  / r.width)  * 100)),
      yPct: Math.max(0, Math.min(100, ((clientY - r.top)   / r.height) * 100)),
    };
  }, []);

  const onMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    e.preventDefault();
    const { xPct, yPct } = toPercent(e.clientX, e.clientY);
    isDrawing.current = true;
    setDraft({ startXPct: xPct, startYPct: yPct, curXPct: xPct, curYPct: yPct });
  };
  const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDrawing.current || !draft) return;
    const { xPct, yPct } = toPercent(e.clientX, e.clientY);
    setDraft(p => p ? { ...p, curXPct: xPct, curYPct: yPct } : null);
  };
  const finalise = () => {
    if (!isDrawing.current || !draft) return;
    isDrawing.current = false;
    const norm = normaliseDraft(draft);
    if (norm.widthPct > 2 && norm.heightPct > 2) onBoxCreated(norm);
    setDraft(null);
  };

  const live = draft ? normaliseDraft(draft) : null;

  return (
    <div
      ref={containerRef}
      onMouseDown={onMouseDown}
      onMouseMove={onMouseMove}
      onMouseUp={finalise}
      onMouseLeave={finalise}
      className="relative w-full h-full select-none cursor-crosshair overflow-hidden"
    >
      {/* Background — real sketch image OR mock manga panels */}
      {sketchSrc ? (
        <AuthImage
          src={sketchSrc}
          alt={t('Rough sketch')}
          draggable={false}
          className="absolute inset-0 w-full h-full object-contain pointer-events-none"
        />
      ) : (
        /* Mock manga page grid (review mode placeholder) */
        <div className="absolute inset-0 bg-[#181820] flex flex-col">
          <div className="flex-1 grid grid-rows-3 divide-y divide-[#2d2d34]">
            <div className="grid grid-cols-5 divide-x divide-[#2d2d34]">
              <div className="col-span-3 bg-[#1e1e24] relative overflow-hidden flex items-end p-2">
                <svg className="absolute inset-0 w-full h-full opacity-[0.07]" viewBox="0 0 100 100" preserveAspectRatio="none">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <line key={i} x1="50" y1="50" x2={i * 9} y2="0" stroke="#e2e8f0" strokeWidth="0.5" />
                  ))}
                </svg>
                <span className="relative text-[7px] text-slate-700 font-bold uppercase tracking-wider">{t('Panel {{number}}', { number: 1 })}</span>
              </div>
              <div className="col-span-2 bg-[#121214] flex items-center justify-center">
                <div className="w-12 h-8 rounded-full border border-slate-700 bg-white/5 flex items-center justify-center">
                  <span className="text-[6px] text-slate-500">...</span>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 divide-x divide-[#2d2d34]">
              <div className="bg-[#1e1e24] relative p-2 flex items-end">
                <div className="absolute inset-0 flex items-center justify-center opacity-10">
                  <div className="w-12 h-20 rounded-sm bg-white" />
                </div>
                <span className="relative text-[7px] text-slate-700 font-bold uppercase tracking-wider">{t('Panel {{number}}', { number: 2 })}</span>
              </div>
              <div className="bg-[#121214] relative p-2 flex items-end justify-end">
                <span className="text-[7px] text-slate-700 font-bold uppercase tracking-wider">{t('Panel {{number}}', { number: 3 })}</span>
              </div>
            </div>
            <div className="bg-[#181820] relative flex items-end p-2">
              <svg className="absolute inset-0 w-full h-full opacity-[0.05]" viewBox="0 0 200 60" preserveAspectRatio="none">
                {Array.from({ length: 10 }).map((_, i) => (
                  <line key={i} x1={i * 22} y1="0" x2={i * 22 + 11} y2="60" stroke="#e2e8f0" strokeWidth="1" />
                ))}
              </svg>
              <span className="relative text-[7px] text-slate-700 font-bold uppercase tracking-wider">{t('Page')} 04 / {t('Chapter')} 12</span>
            </div>
          </div>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className="text-3xl font-black opacity-[0.025] select-none rotate-[-18deg] uppercase tracking-widest text-white">{t('SUBMISSION')}</span>
          </div>
        </div>
      )}

      {/* Committed boxes */}
      {boxes.map(box => (
        <div
          key={box.id}
          onClick={e => { e.stopPropagation(); onBoxSelect(box.id); }}
          className={`absolute pointer-events-auto group transition-all ${
            activeBoxId === box.id
              ? 'border-2 border-dashed border-red-500 bg-red-500/10'
              : 'border-2 border-dashed border-red-600/60 bg-red-500/5 hover:bg-red-500/10 hover:border-red-500'
          }`}
          style={{ top: `${box.topPct}%`, left: `${box.leftPct}%`, width: `${box.widthPct}%`, height: `${box.heightPct}%` }}
        >
          {/* Zone badge */}
          <div className="absolute -top-5 left-0 flex items-center gap-1 bg-[#121214] border border-[#2d2d34] px-1.5 py-0.5 rounded-sm whitespace-nowrap">
            <span className="text-[8px] font-bold text-red-400 uppercase tracking-wide">
              {creationMode ? '📐 Work Zone' : '🔴 Revision Area'}
            </span>
          </div>
          {/* Coords */}
          <div className="absolute -bottom-5 left-0 flex items-center gap-1 bg-[#121214] border border-[#2d2d34] px-1.5 py-0.5 rounded-sm whitespace-nowrap">
            <MapPin className="w-2.5 h-2.5 text-slate-600" />
            <span className="text-[7px] font-mono text-slate-600">
              {box.leftPct.toFixed(1)}% · {box.topPct.toFixed(1)}% | {box.widthPct.toFixed(1)}% × {box.heightPct.toFixed(1)}%
            </span>
          </div>
          {/* Delete on hover */}
          <button
            onClick={e => { e.stopPropagation(); onBoxDelete(box.id); }}
            className="absolute -top-2.5 -right-2.5 w-4 h-4 rounded-full bg-red-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
          >
            <X className="w-2.5 h-2.5" />
          </button>
        </div>
      ))}

      {/* Live draft box */}
      {live && live.widthPct > 0.5 && live.heightPct > 0.5 && (
        <div
          className="absolute pointer-events-none border-2 border-dashed border-red-600 bg-red-500/10"
          style={{ top: `${live.topPct}%`, left: `${live.leftPct}%`, width: `${live.widthPct}%`, height: `${live.heightPct}%` }}
        >
          <div className="absolute -top-5 left-0 bg-red-600 px-1.5 py-0.5 rounded-sm">
            <span className="text-[8px] font-bold text-white uppercase tracking-wide">{t('Drawing…')}</span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// AnnotationPageCanvas — chapter-page image with annotation pins overlay
// Used in PAGES mode (mangaka reviews / adds annotations)
// ─────────────────────────────────────────────────────────────────────────────

const ANN_COLORS: Record<string, string> = {
  DIALOGUE_ISSUE: '#E63946',
  CONTENT_CORRECTION: '#F4A261',
  SCRIPT_REVISION: '#2A9D8F',
  GENERAL_FEEDBACK: '#457B9D',
};

interface PageAnnotation {
  id: string;
  x: number;
  y: number;
  category: string;
  comment: string;
  authorName: string;
  createdAt: string;
  resolved: boolean;
}

function AnnotationPageCanvas({
  imageUrl,
  annotations,
  selectedAnnId,
  onPinClick,
}: {
  imageUrl: string;
  annotations: PageAnnotation[];
  selectedAnnId: string | null;
  onPinClick: (id: string) => void;
}) {
  const { t } = useLanguage();

  return (
    <div className="relative w-full h-full select-none overflow-hidden">
      {imageUrl ? (
        <img
          src={imageUrl}
          alt={t('Chapter page')}
          className="w-full h-full object-contain pointer-events-none select-none"
          draggable={false}
        />
      ) : (
        <div className="absolute inset-0 bg-[#181820] flex items-center justify-center">
          <p className="text-[10px] text-slate-600 font-mono">{t('No image')}</p>
        </div>
      )}

      {/* Existing annotation pins */}
      {annotations.map((ann) => {
        const color = ANN_COLORS[ann.category] || ANN_COLORS.GENERAL_FEEDBACK;
        return (
          <button
            key={ann.id}
            onClick={(e) => { e.stopPropagation(); onPinClick(ann.id); }}
            title={ann.comment}
            className={`absolute -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full border-2 flex items-center justify-center text-white text-[9px] font-mono font-extrabold transition-all z-10 cursor-pointer ${
              ann.resolved
                ? 'opacity-50 grayscale'
                : selectedAnnId === ann.id
                  ? 'scale-150 shadow-lg'
                  : 'hover:scale-125'
            }`}
            style={{
              left: `${ann.x}%`,
              top: `${ann.y}%`,
              backgroundColor: color,
              borderColor: ann.resolved ? '#9ca3af' : '#141414',
            }}
          >
            {ann.resolved ? '✓' : '!'}
          </button>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Props
// ─────────────────────────────────────────────────────────────────────────────

interface WorkspaceCanvasProps {
  currentUser: User;
  activeSeries: Series | null;
  activeChapter: Chapter | null;
  onRefreshTasks: () => void;
  onPageSubmitted?: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main component
// ─────────────────────────────────────────────────────────────────────────────

export default function WorkspaceCanvas({ currentUser, activeSeries, activeChapter, onRefreshTasks, onPageSubmitted }: WorkspaceCanvasProps) {
  const { t } = useLanguage();

  // ── Workspace mode ─────────────────────────────────────────────────────────
  const [mode, setMode] = useState<'REVIEW' | 'CREATION' | 'SUBMIT' | 'PAGES'>('REVIEW');

  // ── Review mode state ──────────────────────────────────────────────────────
  const [tasks,        setTasks]       = useState<WTask[]>([]);
  const [activeTaskId, setActiveTaskId] = useState('');
  const [reviewBoxes,  setReviewBoxes]  = useState<BBox[]>([]);
  const [activeBoxId,  setActiveBoxId]  = useState<string | null>(null);
  const [reviewComment, setReviewComment] = useState('');
  const [viewMode,     setViewMode]     = useState<'original' | 'submission'>('submission');
  const [toast,        setToast]        = useState<{ msg: string; type: 'success' | 'warn' } | null>(null);

  // ── Creation mode state ────────────────────────────────────────────────────
  const [sketchFile,    setSketchFile]    = useState<File | null>(null);
  const [sketchPreview, setSketchPreview] = useState<string | null>(null);
  const [dropHover,     setDropHover]     = useState(false);
  const [createBoxes,   setCreateBoxes]   = useState<BBox[]>([]);
  const [activeCreateBoxId, setActiveCreateBoxId] = useState<string | null>(null);
  const [cTitle,        setCTitle]        = useState('');
  const [cType,         setCType]         = useState('Background');
  const [cAssistant,    setCAssistant]    = useState('');
  const [cInstructions, setCInstructions] = useState('');
  const [cDueAt,        setCDueAt]        = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 3);
    return d.toISOString().split('T')[0];
  });
  const [deployToast,   setDeployToast]   = useState<string | null>(null);
  const [submitNote,    setSubmitNote]    = useState('');

  // ── Chapter pages mode state ───────────────────────────────────────────────
  const [chapterPages,   setChapterPages]   = useState<any[]>([]);
  const [activePageId,   setActivePageId]   = useState('');
  const [selectedAnnId,  setSelectedAnnId]  = useState<string | null>(null);
  const [pagesLoading,   setPagesLoading]   = useState(false);

  const [assistantsList, setAssistantsList] = useState<any[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Derived ────────────────────────────────────────────────────────────────
  const activeTask    = tasks.find(t => t.id === activeTaskId) ?? null;
  const activeBox     = reviewBoxes.find(b => b.id === activeBoxId) ?? null;
  const activeCreateBox = createBoxes.find(b => b.id === activeCreateBoxId) ?? null;
  const activePage    = chapterPages.find(p => (p._id || p.id) === activePageId) ?? null;
  const pageAnnotations = (activePage?.annotations || []).map((ann: any) => ({
    id: ann._id || ann.id,
    x: ann.coords?.x || 0,
    y: ann.coords?.y || 0,
    category: ann.type || 'GENERAL_FEEDBACK',
    comment: ann.content || '',
    authorName: ann.annotatorId?.name || 'Mangaka',
    createdAt: ann.createdAt || '',
    resolved: !!ann.resolved,
  }));
  const episodeLabel  = activeSeries
    ? `${activeSeries.title} - ${t('Chapter')} ${activeChapter?.chapterNumber ?? '??'}`
    : `${t('Chapter')} 12 - ${t('Page')} 04 ${t('Workspace')}`;

  // ── Review helpers ─────────────────────────────────────────────────────────
  const showToast = (msg: string, type: 'success' | 'warn') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const [isWorkspaceLoading, setIsWorkspaceLoading] = useState(true);

  const fetchWorkspaceData = useCallback(async () => {
    try {
      setIsWorkspaceLoading(true);
      const asts = await apiClient.users.getAll('ASSISTANT');
      setAssistantsList(asts);

      const live = await apiClient.tasks.getAll(
        undefined,
        activeSeries?._id,
        activeChapter?._id,
      );

      // Deduplicate if needed (though backend should return unique tasks)
      const uniqueRawTasks = live.filter((value, index, self) =>
        self.findIndex(t => t._id === value._id) === index
      );

      const mapped = uniqueRawTasks.map((t: any) => {
        const ast = asts.find(a => a._id === t.assignedTo || a._id === t.assignedTo?._id);
        const astName = ast ? ast.name : (t.assignedTo?.name || 'Assistant');
        const initials = astName.split(' ').map((w: string) => w[0]).join('').toUpperCase().substring(0, 2);
        
        let uiStatus: WTaskStatus = 'ASSIGNED';
        if (t.status === 'SUBMITTED') uiStatus = 'PENDING_REVIEW';
        else if (t.status === 'APPROVED') uiStatus = 'APPROVED';
        else if (t.status === 'REVISION_REQUESTED') uiStatus = 'REVISING';
        else if (t.status === 'MANGAKA_APPROVED') uiStatus = 'MANGAKA_APPROVED';

        return {
          id: t._id,
          title: t.title,
          type: t.type || t.region?.type || 'Background',
          status: uiStatus,
          assistant: astName,
          assistantInitials: initials,
          submittedAt: t.submittedAt ? new Date(t.submittedAt).toLocaleDateString() : 'Not submitted',
          rawTask: t
        };
      });

      setTasks(mapped);
      if (mapped.length > 0 && !mapped.some(t => t.id === activeTaskId)) {
        setActiveTaskId(mapped[0].id);
      }
    } catch (err) {
      console.error('Failed to fetch workspace data:', err);
    } finally {
      setIsWorkspaceLoading(false);
    }
  }, [activeTaskId, activeSeries?._id, activeChapter?._id]);

  useEffect(() => {
    fetchWorkspaceData();
  }, [activeSeries?._id, activeChapter?._id]);

  useEffect(() => {
    if (activeTask && activeTask.rawTask?.regions && activeTask.rawTask.regions.length > 0) {
      const mapped = activeTask.rawTask.regions.map((r: any, idx: number) => ({
        id: `rb_${activeTask.id}_${idx}`,
        leftPct: r.x,
        topPct: r.y,
        widthPct: r.width,
        heightPct: r.height,
        comment: r.comment || activeTask.rawTask.reviewNote || ''
      }));
      setReviewBoxes(mapped);
    } else if (activeTask && activeTask.rawTask?.region) {
      const r = activeTask.rawTask.region;
      setReviewBoxes([
        {
          id: `rb_${activeTask.id}`,
          leftPct: r.x,
          topPct: r.y,
          widthPct: r.width,
          heightPct: r.height,
          comment: activeTask.rawTask.reviewNote || ''
        }
      ]);
    } else {
      setReviewBoxes([]);
    }
  }, [activeTaskId, activeTask]);

  const handleApprove = async () => {
    if (!activeTask) return;
    try {
      await apiClient.tasks.review(activeTask.id, 'APPROVE', 'Approved by author');
      showToast(t('"{{task}}" passed the Mangaka review and is waiting for the Tantou Editor.', { task: activeTask.title }), 'success');
      fetchWorkspaceData();
    } catch (err: any) {
      showToast(t(err.message), 'warn');
    }
  };

  const handleSendBack = async () => {
    if (!activeTask || !reviewComment.trim()) return;
    try {
      await apiClient.tasks.review(activeTask.id, 'REVISION_REQUESTED', reviewComment.trim());
      showToast(t('Revision sent to {{assistant}}.', { assistant: activeTask.assistant }), 'warn');
      setReviewComment('');
      fetchWorkspaceData();
    } catch (err: any) {
      showToast(t(err.message), 'warn');
    }
  };

  /** Enter creation mode — reset all creation state */
  const enterCreationMode = () => {
    if (sketchPreview) URL.revokeObjectURL(sketchPreview);
    setSketchFile(null);
    setSketchPreview(null);
    setCreateBoxes([]);
    setActiveCreateBoxId(null);
    setCTitle('');
    setCType('Background');
    setCAssistant(assistantsList[0]?._id || '');
    setCInstructions('');
    setDeployToast(null);
    setMode('CREATION');
  };

  /** Cancel — back to review mode */
  const exitCreationMode = () => {
    if (sketchPreview) URL.revokeObjectURL(sketchPreview);
    setSketchFile(null);
    setSketchPreview(null);
    setCreateBoxes([]);
    setActiveCreateBoxId(null);
    setMode('REVIEW');
  };

  /** Enter submit-to-editor mode — upload a page image onto the canvas directly */
  const enterSubmitMode = () => {
    if (sketchPreview) URL.revokeObjectURL(sketchPreview);
    setSketchFile(null);
    setSketchPreview(null);
    setCreateBoxes([]);
    setActiveCreateBoxId(null);
    setSubmitNote('');
    setDeployToast(null);
    setMode('SUBMIT');
  };

  /** Cancel submit mode — back to review */
  const exitSubmitMode = () => {
    if (sketchPreview) URL.revokeObjectURL(sketchPreview);
    setSketchFile(null);
    setSketchPreview(null);
    setCreateBoxes([]);
    setActiveCreateBoxId(null);
    setSubmitNote('');
    setMode('REVIEW');
  };

  /** Enter chapter-pages (annotation viewer) mode */
  const enterPagesMode = async () => {
    setMode('PAGES');
    setPagesLoading(true);
    setSelectedAnnId(null);
    try {
      const chapterData = await apiClient.chapters.getById(activeChapter?._id || '');
      const pages = chapterData?.pages || chapterData?.data?.pages || [];
      setChapterPages(pages);
      if (pages.length > 0) {
        const firstId = pages[0]._id || pages[0].id;
        setActivePageId((prev) => pages.some((p: any) => (p._id || p.id) === prev) ? prev : firstId);
      } else {
        setActivePageId('');
      }
    } catch (err: any) {
      showToast(t(err.message || 'Failed to load chapter pages'), 'warn');
    } finally {
      setPagesLoading(false);
    }
  };

  /** Exit chapter-pages mode — back to review */
  const exitPagesMode = () => {
    setChapterPages([]);
    setActivePageId('');
    setSelectedAnnId(null);
    setMode('REVIEW');
  };

  /** Submit the annotated page image directly to the editor */
  const handleSubmitToEditor = async () => {
    if (!activeSeries || !activeChapter) {
      showToast(t('Select a series and chapter before submitting.'), 'warn');
      return;
    }
    if (!sketchFile) {
      showToast(t('A page image is required before submitting.'), 'warn');
      return;
    }
    try {
      setDeployToast(t('Uploading the page image to the server...'));

      let fileUrl = "";
      const fileRes = await apiClient.files.upload(sketchFile, activeChapter._id);
      fileUrl = fileRes.fileUrl || fileRes.data?.fileUrl || "";
      if (!fileUrl) throw new Error('Failed to resolve uploaded image URL');

      setDeployToast(t('Submitting the page to the editor...'));

      await apiClient.chapters.submitPageToEditor(activeChapter._id, {
        imageUrl: fileUrl,
        note: submitNote.trim(),
      });

      setDeployToast(t('Page submitted to the editor for review!'));
      setTimeout(() => {
        exitSubmitMode();
        fetchWorkspaceData();
        if (onPageSubmitted) onPageSubmitted();
      }, 1400);
    } catch (err: any) {
      setDeployToast(null);
      showToast(t(err.message || 'Failed to submit page'), 'warn');
    }
  };

  /** Handle sketch file selection */
  const handleSketchFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      showToast(t('Please select a valid image file.'), 'warn');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      showToast(t('The source image must not exceed 10 MB.'), 'warn');
      return;
    }
    if (sketchPreview) URL.revokeObjectURL(sketchPreview);
    setSketchFile(file);
    setSketchPreview(URL.createObjectURL(file));
    setCreateBoxes([]);
    setActiveCreateBoxId(null);
  };

  const onFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) handleSketchFile(f);
    e.target.value = '';
  };

  const onDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDropHover(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleSketchFile(f);
  };

  /** Deploy — build FormData, upload sketch, create task via API, exit creation mode */
  const handleDeploy = async () => {
    if (!activeSeries || !activeChapter) {
      showToast(t('Select a series and chapter before assigning work.'), 'warn');
      return;
    }

    if (!cTitle.trim()) {
      showToast(t('Task title is required.'), 'warn');
      return;
    }
    if (!cAssistant) {
      showToast(t('Please select an Assistant.'), 'warn');
      return;
    }
    if (createBoxes.length === 0) {
      showToast(t('Mark at least one work region on the page.'), 'warn');
      return;
    }
    if (!cInstructions.trim()) {
      showToast(t('Task instructions are required.'), 'warn');
      return;
    }
    if (!cDueAt || cDueAt < new Date().toISOString().split('T')[0]) {
      showToast(t('The deadline cannot be in the past.'), 'warn');
      return;
    }
    try {
    if (!sketchFile) {
      showToast(t('A sketch page image is required before assigning a task.'), 'warn');
      return;
    }
      setDeployToast(t('Uploading the source image to the server...'));

      let fileId = "";
      let sourceImageUrl = "";
      if (sketchFile) {
        const fileRes = await apiClient.files.upload(sketchFile, activeChapter._id);
        fileId = fileRes._id || fileRes.data?._id || "";
        sourceImageUrl = fileRes.fileUrl || fileRes.data?.fileUrl || "";
      }

      setDeployToast(t('Creating and assigning tasks...'));

      const regions = createBoxes.map((box) => ({
        x: Number(box.leftPct.toFixed(2)),
        y: Number(box.topPct.toFixed(2)),
        width: Number(box.widthPct.toFixed(2)),
        height: Number(box.heightPct.toFixed(2)),
        type: cType,
        comment: box.comment || cInstructions.trim(),
      }));

      const description = fileId
        ? `[IMAGE_URL:api/files/download/${fileId}] ${cInstructions.trim()}`
        : cInstructions.trim();

      await apiClient.tasks.create({
        seriesId: activeSeries._id,
        chapterId: activeChapter._id,
        assignedTo: cAssistant,
        title: cTitle.trim(),
        type: cType,
        regions,
        description,
        pageIds: undefined,
        sourceImageUrl,
        dueAt: new Date(cDueAt).toISOString(),
      });

      setDeployToast(t('{{chapter}} was assigned successfully!', { chapter: cTitle.trim() }));
      setTimeout(() => {
        exitCreationMode();
        fetchWorkspaceData();
      }, 1400);
    } catch (err: any) {
      setDeployToast(null);
      showToast(t(err.message || 'Failed to create task'), 'warn');
    }
  };



  // ─────────────────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] min-h-[600px] bg-[#121214] rounded-md overflow-hidden border border-[#2d2d34] shadow-2xl shadow-black">

      {/* ══ HEADER ══ */}
      <header className="flex items-center justify-between px-5 py-3 bg-[#181820] border-b border-[#2d2d34] shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-md bg-red-600 flex items-center justify-center shrink-0">
            <Brush className="w-3.5 h-3.5 text-white" />
          </div>
          <div>
            <h1 className="text-[13px] font-bold text-white leading-none">{episodeLabel}</h1>
            <p className="text-[10px] text-slate-500 mt-0.5">
              {mode === 'CREATION'
                ? <span className="text-red-400 font-semibold">{t("Creation Mode — Assign a new task")}</span>
                : mode === 'SUBMIT'
                  ? <span className="text-red-400 font-semibold">{t("Submit Mode — Upload a page to the editor")}</span>
                  : mode === 'PAGES'
                    ? <span className="text-red-400 font-semibold">{t("Chapter Pages — Annotation review")}</span>
                    : <>{t("Author")}: <span className="text-slate-400 font-medium">{currentUser.name}</span></>
              }
            </p>
          </div>
        </div>

        {/* Toast */}
        {(toast || deployToast) && (
          <div className={`px-3 py-1.5 rounded-md text-xs font-semibold flex items-center gap-1.5 ${
            deployToast
              ? 'bg-white/10 text-white border border-white/20'
              : toast?.type === 'success'
                ? 'bg-white/10 text-white border border-white/20'
                : 'bg-red-500/10 text-red-400 border border-red-500/20'
          }`}>
            {deployToast
              ? <><Rocket className="w-3 h-3" />{deployToast}</>
              : toast?.type === 'success'
                ? <><Check className="w-3 h-3" />{toast.msg}</>
                : <><Undo2 className="w-3 h-3" />{toast?.msg}</>
            }
          </div>
        )}

        {/* Mode indicator + cancel */}
        {mode !== 'REVIEW' ? (
          <button
            onClick={mode === 'CREATION' ? exitCreationMode : mode === 'SUBMIT' ? exitSubmitMode : exitPagesMode}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-[#2d2d34] text-[11px] font-bold text-slate-400 hover:text-white hover:border-slate-500 transition-all cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> {t("Cancel")}
          </button>
        ) : (
          <div className="flex items-center gap-2 text-[10px] text-slate-600 font-mono">
            <div className="w-1.5 h-1.5 rounded-full bg-white/30 animate-pulse" />
            {t("Live Session")}
          </div>
        )}
      </header>

      {/* ══ 3-COLUMN BODY ══ */}
      <div className="flex flex-1 overflow-hidden">

        {/* ── COL 1 — Task List ── */}
        {/*
          In CREATION mode: visually muted (opacity-50 + pointer-events-none overlay)
          Req 1 — "Left Column should be visibly disabled or muted"
        */}
        <aside className="w-1/4 min-w-[200px] flex flex-col border-r border-[#2d2d34] bg-[#1e1e24] overflow-hidden relative">

          {/* Create button (review mode only) */}
          {mode === 'REVIEW' && (
            <div className="p-3 border-b border-[#2d2d34] shrink-0 space-y-2">
              <button
                onClick={enterCreationMode}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-md bg-white hover:bg-slate-100 transition-all text-xs font-bold text-black cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                {t("Create & Assign New Task")}
              </button>
              <button
                onClick={enterSubmitMode}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-md bg-[#2d2d34] hover:bg-[#3a3a44] transition-all text-xs font-bold text-slate-200 cursor-pointer"
              >
                <UploadCloud className="w-3.5 h-3.5" />
                {t("Upload Page & Submit to Editor")}
              </button>
              <button
                onClick={enterPagesMode}
                className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-md bg-[#2d2d34] hover:bg-[#3a3a44] transition-all text-xs font-bold text-slate-200 cursor-pointer"
              >
                <FileImage className="w-3.5 h-3.5" />
                {t("Chapter Pages & Annotations")}
              </button>
            </div>
          )}

          {/* Section label */}
          <div className={`px-3 pt-3 pb-1.5 shrink-0 ${mode === 'CREATION' || mode === 'SUBMIT' ? 'opacity-40' : ''}`}>
            <span className="text-[9px] font-bold uppercase tracking-widest text-slate-600">
              {mode === 'PAGES' ? `${t("Pages")} — ${chapterPages.length}` : `${t("Tasks")} — ${tasks.length}`}
            </span>
          </div>

          {/* Cards */}
          {mode === 'PAGES' ? (
            <div className="flex-1 overflow-y-auto px-3 pb-3 space-y-1.5">
              {pagesLoading && (
                <p className="text-center text-[10px] text-slate-600 font-mono py-4">
                  {t("Loading pages...")}
                </p>
              )}
              {!pagesLoading && chapterPages.map((page: any) => {
                const pageId = page._id || page.id;
                const annCount = (page.annotations || []).length;
                return (
                  <button
                    key={pageId}
                    onClick={() => { setActivePageId(pageId); setSelectedAnnId(null); }}
                    className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-md border text-left transition-all cursor-pointer ${
                      activePageId === pageId
                        ? 'bg-[#2a2a32] border-[#4a4a55]'
                        : 'bg-[#1e1e24] border-[#2d2d34] hover:border-[#3a3a44]'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <FileImage className="w-3.5 h-3.5 text-slate-500" />
                      <div>
                        <p className="text-[11px] font-bold text-white leading-tight">
                          {t("Page")} {page.pageNumber || 0}
                        </p>
                        <p className="text-[8px] text-slate-600 font-mono">
                          {page.status || ''}
                        </p>
                      </div>
                    </div>
                    {annCount > 0 && (
                      <span className="shrink-0 text-[8px] font-bold px-1.5 py-0.5 rounded-full bg-red-500/20 text-red-400 border border-red-500/30">
                        {annCount}
                      </span>
                    )}
                  </button>
                );
              })}
              {!pagesLoading && chapterPages.length === 0 && (
                <p className="text-center text-[10px] text-slate-600 font-mono py-4">
                  {t("No pages in this chapter yet.")}
                </p>
              )}
            </div>
          ) : (
            <div className={`flex-1 overflow-y-auto px-3 pb-3 space-y-1.5 ${mode !== 'REVIEW' ? 'overflow-hidden' : ''}`}>
              {tasks.map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  isActive={task.id === activeTaskId}
                  muted={mode !== 'REVIEW'}
                  onClick={() => mode === 'REVIEW' && setActiveTaskId(task.id)}
                />
              ))}
              {tasks.length === 0 && (
                <p className="text-center text-[10px] text-slate-600 font-mono py-4">
                  {t("No tasks for this chapter yet.")}
                </p>
              )}
            </div>
          )}

          {/* Mode overlay — blocks interaction during CREATION/SUBMIT */}
          {mode === 'CREATION' || mode === 'SUBMIT' ? (
            <div className="absolute inset-0 bg-[#121214]/60 flex flex-col items-center justify-center gap-2 pointer-events-auto cursor-not-allowed select-none">
              <div className="w-8 h-8 rounded-full bg-[#2d2d34] flex items-center justify-center">
                <Plus className="w-4 h-4 text-slate-500 rotate-45" />
              </div>
              <span className="text-[9px] font-bold uppercase tracking-widest text-slate-600 text-center px-4">
                {t("Task list paused")}<br />{t("during creation")}
              </span>
            </div>
          ) : null}
        </aside>

        {/* ── COL 2 — Center Canvas ── */}
        <main className="flex-1 flex flex-col bg-[#121214] overflow-hidden">

          {mode === 'REVIEW' ? (
            <>
              <div className="flex items-center justify-between px-4 py-2.5 bg-[#181820] border-b border-[#2d2d34] shrink-0 select-none">
                <span className="flex items-center gap-1.5 text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
                  <ImageIcon className="w-3.5 h-3.5 text-slate-600" />
                  {t("Manga Canvas — Drag to annotate")}
                </span>
                <span className="text-[9px] font-bold text-slate-600 font-mono">
                  {t("{{count}} marked zones", { count: reviewBoxes.length })}
                </span>
              </div>
              <div className="flex-1 flex items-center justify-center p-8 bg-[#121214] overflow-auto">
                <div
                  className="relative rounded-md overflow-visible border border-[#2d2d34] shadow-2xl shadow-black"
                  style={{ width: '100%', maxWidth: '360px', aspectRatio: '3/4' }}
                >
                  <DrawableCanvas
                    sketchSrc={(() => {
                      const pages = activeTask?.rawTask?.pageIds || [];
                      const firstPage = Array.isArray(pages) && pages.length > 0 ? pages[0] : null;

                      if (viewMode === 'submission') {
                        if (firstPage?.assistantImageUrl) {
                          const url = firstPage.assistantImageUrl;
                          return url.startsWith('http') ? url : `${apiClient.getConfig().baseUrl}/${url.startsWith('/') ? url.slice(1) : url}`;
                        }
                      }

                      if (firstPage?.imageUrl) {
                        const url = firstPage.imageUrl;
                        return url.startsWith('http') ? url : `${apiClient.getConfig().baseUrl}/${url.startsWith('/') ? url.slice(1) : url}`;
                      }

                      if (!activeTask?.rawTask?.description || !activeTask.rawTask.description.startsWith('[IMAGE_URL:')) {
                        // Fall back to the chapter's own submitted pages (direct page submissions aren't tied to tasks)
                        const chapterPages = activeChapter?.pages || [];
                        const latestPage = Array.isArray(chapterPages) && chapterPages.length > 0
                          ? chapterPages[chapterPages.length - 1]
                          : null;
                        if (latestPage?.assistantImageUrl || latestPage?.imageUrl) {
                          const url = latestPage.assistantImageUrl || latestPage.imageUrl;
                          return url.startsWith('http') ? url : `${apiClient.getConfig().baseUrl}/${url.startsWith('/') ? url.slice(1) : url}`;
                        }
                        return null;
                      }
                      const match = activeTask.rawTask.description.match(/^\[IMAGE_URL:([^\]]+)\]/);
                      if (!match) return null;
                      const rawUrl = match[1];
                      return rawUrl.startsWith('http') ? rawUrl : `${apiClient.getConfig().baseUrl}/${rawUrl.startsWith('/') ? rawUrl.slice(1) : rawUrl}`;
                    })()}
                    boxes={viewMode === 'submission' ? [] : reviewBoxes}
                    activeBoxId={activeBoxId}
                    onBoxCreated={b => {
                      const nb: BBox = { ...b, id: `rb_${Date.now()}`, comment: '' };
                      setReviewBoxes(p => [...p, nb]);
                      setActiveBoxId(nb.id);
                      setReviewComment('');
                    }}
                    onBoxSelect={id => {
                      setActiveBoxId(id);
                      const b = reviewBoxes.find(x => x.id === id);
                      if (b) setReviewComment(b.comment);
                    }}
                    onBoxDelete={id => {
                      setReviewBoxes(p => p.filter(b => b.id !== id));
                      if (activeBoxId === id) { setActiveBoxId(null); setReviewComment(''); }
                    }}
                  />
                </div>
              </div>
            </>
          ) : mode === 'PAGES' ? (
            /* ── PAGES: chapter page + annotation pins overlay ── */
            <>
              <div className="flex items-center justify-between px-4 py-2.5 bg-[#181820] border-b border-[#2d2d34] shrink-0 select-none">
                <span className="flex items-center gap-1.5 text-[10px] font-semibold text-red-400/80 uppercase tracking-widest">
                  <MapPin className="w-3.5 h-3.5 text-red-500" />
                  {activePage
                    ? `${t("Page")} ${activePage.pageNumber || 0} — ${t("click pins to review comments")}`
                    : t("Select a page to review annotations")}
                </span>
              </div>
              <div className="flex-1 flex items-center justify-center p-8 bg-[#121214] overflow-auto">
                {pagesLoading ? (
                  <p className="text-center text-[11px] text-slate-600 font-mono">
                    {t("Loading chapter pages...")}
                  </p>
                ) : !activePage ? (
                  <p className="text-center text-[11px] text-slate-600 font-mono">
                    {t("No pages to display for this chapter.")}
                  </p>
                ) : (
                  <div
                    className="relative rounded-md overflow-visible border border-[#2d2d34] shadow-2xl shadow-black"
                    style={{ width: '100%', maxWidth: '360px', aspectRatio: '3/4' }}
                  >
                    <AnnotationPageCanvas
                      imageUrl={(() => {
                        const url = activePage.assistantImageUrl || activePage.imageUrl || '';
                        if (!url) return '';
                        return url.startsWith('http') ? url : `${apiClient.getConfig().baseUrl}/${url.startsWith('/') ? url.slice(1) : url}`;
                      })()}
                      annotations={pageAnnotations}
                      selectedAnnId={selectedAnnId}
                      onPinClick={(id) => setSelectedAnnId(selectedAnnId === id ? null : id)}
                    />
                  </div>
                )}
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center justify-between px-4 py-2.5 bg-[#181820] border-b border-[#2d2d34] shrink-0 select-none">
                <span className="flex items-center gap-1.5 text-[10px] font-semibold text-red-400/80 uppercase tracking-widest">
                  <Crosshair className="w-3.5 h-3.5 text-red-500" />
                  {sketchPreview
                    ? mode === 'SUBMIT'
                      ? t("Image loaded — ready to submit")
                      : t("Image loaded — drag to mark work zones")
                    : mode === 'SUBMIT'
                      ? t("Step 1 — Upload the page image")
                      : t("Step 1 — Upload rough sketch / storyboard")}
                </span>
                {sketchPreview && (
                  <button
                    onClick={() => {
                      URL.revokeObjectURL(sketchPreview);
                      setSketchFile(null);
                      setSketchPreview(null);
                      setCreateBoxes([]);
                      setActiveCreateBoxId(null);
                    }}
                    className="flex items-center gap-1 text-[9px] text-slate-600 hover:text-red-400 transition-colors cursor-pointer font-bold uppercase tracking-wide"
                  >
                    <X className="w-3 h-3" /> {t("Remove image")}
                  </button>
                )}
              </div>

              <div className="flex-1 flex items-center justify-center p-8 bg-[#121214] overflow-auto">

                {!sketchPreview ? (
                  /* ── Upload dropzone ── */
                  <>
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => fileInputRef.current?.click()}
                      onKeyDown={e => e.key === 'Enter' && fileInputRef.current?.click()}
                      onDragOver={e => { e.preventDefault(); setDropHover(true); }}
                      onDragLeave={() => setDropHover(false)}
                      onDrop={onDrop}
                      className={`w-full max-w-md aspect-[3/4] rounded-md flex flex-col items-center justify-center gap-4 cursor-pointer transition-all border-2 border-dashed ${
                        dropHover
                          ? 'border-slate-400 bg-[#1e1e24]'
                          : 'border-slate-700 bg-[#1e1e24]/60 hover:bg-[#1e1e24] hover:border-slate-600'
                      }`}
                    >
                      <div className="w-14 h-14 rounded-full bg-[#2d2d34] flex items-center justify-center">
                        <UploadCloud className={`w-7 h-7 transition-colors ${dropHover ? 'text-slate-300' : 'text-slate-600'}`} />
                      </div>
                      <div className="text-center space-y-1 px-8">
                        <p className="text-sm font-semibold text-slate-400">
                          {mode === 'SUBMIT'
                            ? t("Click to upload the finished page")
                            : t("Click to upload storyboard or rough sketch")}
                        </p>
                        <p className="text-[10px] text-slate-700 font-mono">.png ? .jpg ? .jpeg ? .webp ? {t('Maximum size')}: 10 MB</p>
                      </div>
                      <div className="px-4 py-2 rounded-md bg-[#2d2d34] border border-[#3a3a44]">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t("Browse files")}</span>
                      </div>
                    </div>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={onFileInputChange}
                      className="hidden"
                    />
                  </>
                ) : mode === 'SUBMIT' ? (
                  /* ── SUBMIT: plain page preview (no zone marking) ── */
                  <div
                    className="relative rounded-md overflow-hidden border border-[#2d2d34] shadow-2xl shadow-black"
                    style={{ width: '100%', maxWidth: '400px', aspectRatio: '3/4' }}
                  >
                    <img
                      src={sketchPreview}
                      alt={t('Page to submit')}
                      className="w-full h-full object-contain select-none pointer-events-none"
                      draggable={false}
                    />
                    <span className="absolute bottom-2 left-1/2 -translate-x-1/2 text-[8px] font-bold uppercase tracking-widest text-slate-300 bg-black/70 px-2 py-0.5 rounded-sm">
                      {t("Ready to submit")}
                    </span>
                  </div>
                ) : (
                  /* ── CREATION: full canvas with bounding-box drawing ── */
                  <div
                    className="relative rounded-md overflow-visible border border-[#2d2d34] shadow-2xl shadow-black"
                    style={{ width: '100%', maxWidth: '400px', aspectRatio: '3/4' }}
                  >
                    <DrawableCanvas
                      sketchSrc={sketchPreview}
                      boxes={createBoxes}
                      activeBoxId={activeCreateBoxId}
                      creationMode
                      onBoxCreated={b => {
                        const nb: BBox = { ...b, id: `cb_${Date.now()}`, comment: '' };
                        setCreateBoxes(p => [...p, nb]);
                        setActiveCreateBoxId(nb.id);
                      }}
                      onBoxSelect={setActiveCreateBoxId}
                      onBoxDelete={id => {
                        setCreateBoxes(p => p.filter(b => b.id !== id));
                        if (activeCreateBoxId === id) setActiveCreateBoxId(null);
                      }}
                    />
                  </div>
                )}
              </div>
            </>
          )}
        </main>

        {/* ── COL 3 — Right Panel ── */}
        <aside className="w-1/4 min-w-[200px] flex flex-col border-l border-[#2d2d34] bg-[#1e1e24] overflow-hidden">

          {mode === 'PAGES' ? (
            /* ── PAGES: annotations for the active page ── */
            <div className="flex flex-col h-full overflow-y-auto">
              <div className="px-4 pt-4 pb-3 border-b border-[#2d2d34] shrink-0">
                <p className="text-[9px] font-bold uppercase tracking-widest text-slate-600 mb-1">
                  {t("Page Annotations")}
                </p>
                {activePage && (
                  <h2 className="text-sm font-bold text-white leading-snug">
                    {t("Page")} {activePage.pageNumber || 0}
                  </h2>
                )}
                <p className="text-[9px] text-slate-500 mt-1">
                  {pageAnnotations.length} {t("annotations")}
                </p>
              </div>

              {/* Annotation list */}
              <div className="flex-1 px-4 py-3 space-y-2">
                {pageAnnotations.length === 0 && (
                  <p className="text-center text-[10px] text-slate-600 font-mono py-4">
                    {t("No annotations on this page yet.")}
                  </p>
                )}
                {pageAnnotations.map((ann) => {
                  const color = ANN_COLORS[ann.category] || ANN_COLORS.GENERAL_FEEDBACK;
                  return (
                    <div
                      key={ann.id}
                      className={`rounded-md border p-3 transition-colors ${
                        selectedAnnId === ann.id
                          ? 'bg-[#2a2a32] border-[#4a4a55]'
                          : 'bg-[#121214]/40 border-[#2d2d34]'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1.5">
                        <span
                          className="shrink-0 w-2 h-2 rounded-full"
                          style={{ backgroundColor: color }}
                        />
                        <span className="flex-1 text-[8px] font-bold uppercase tracking-widest text-slate-500 truncate">
                          {ann.category}
                        </span>
                        {ann.resolved && (
                          <span className="shrink-0 flex items-center gap-1 text-[8px] font-bold uppercase tracking-wide px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            <Check className="w-2.5 h-2.5" />
                            {t("Resolved")}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-300 leading-snug mb-2">{ann.comment}</p>
                      <div className="flex items-center justify-between text-[8px] text-slate-600 font-mono">
                        <span>{ann.authorName}</span>
                        {ann.createdAt && (
                          <span>{new Date(ann.createdAt).toLocaleDateString()}</span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : mode === 'REVIEW' ? (
            /* ── REVIEW: feedback / approve panel ── */
            activeTask ? (
              <div className="flex flex-col h-full overflow-y-auto">
                {/* Task header */}
                <div className="px-4 pt-4 pb-3 border-b border-[#2d2d34] shrink-0">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-slate-600 mb-1">{t("Reviewing Task")}</p>
                  <h2 className="text-sm font-bold text-white leading-snug">{activeTask.title}</h2>
                  <div className="flex items-center gap-2 mt-2.5">
                    <div className="w-6 h-6 rounded-md bg-[#2d2d34] border border-[#3a3a44] text-slate-300 flex items-center justify-center text-[9px] font-black shrink-0">
                      {activeTask.assistantInitials}
                    </div>
                    <div>
                      <p className="text-[10px] font-medium text-white">{activeTask.assistant}</p>
                      <p className="text-[9px] text-slate-500">{t("Submitted")} {activeTask.submittedAt}</p>
                    </div>
                  </div>
                  <div className="mt-2.5"><StatusBadge status={activeTask.status} /></div>
                </div>

                {/* Comparison toggles */}
                <div className="px-4 py-3 border-b border-[#2d2d34] shrink-0">
                  <p className="text-[9px] font-bold uppercase tracking-widest text-slate-600 mb-2 flex items-center gap-1.5">
                    <ArrowLeftRight className="w-3 h-3" /> {t("Comparison View")}
                  </p>
                  {(['original', 'submission'] as const).map(m => (
                    <button
                      key={m}
                      onClick={() => setViewMode(m)}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-md border text-[11px] font-medium transition-all cursor-pointer mb-1.5 ${
                        viewMode === m
                          ? 'bg-white/8 border-white/20 text-white'
                          : 'bg-[#121214]/40 border-[#2d2d34] text-slate-600 hover:text-slate-400 hover:border-slate-600'
                      }`}
                    >
                      {m === 'original' ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                      {m === "original" ? t("Original rough sketch") : t("Assistant's submission")}
                    </button>
                  ))}
                </div>

                {/* Active zone metadata */}
                {activeBox && (
                  <div className="px-4 py-2.5 border-b border-[#2d2d34] shrink-0">
                    <p className="text-[9px] font-bold uppercase tracking-widest text-slate-600 mb-1.5 flex items-center gap-1">
                      <MapPin className="w-2.5 h-2.5 text-red-500" /> {t("Selected Zone")}
                    </p>
                    <div className="bg-[#121214] border border-[#2d2d34] rounded-md px-2.5 py-2 font-mono text-[9px] text-slate-500 space-y-0.5">
                      <div>X: <span className="text-slate-300">{activeBox.leftPct.toFixed(1)}%</span> &nbsp; Y: <span className="text-slate-300">{activeBox.topPct.toFixed(1)}%</span></div>
                      <div>W: <span className="text-slate-300">{activeBox.widthPct.toFixed(1)}%</span> &nbsp; H: <span className="text-slate-300">{activeBox.heightPct.toFixed(1)}%</span></div>
                    </div>
                  </div>
                )}

                {/* Approve */}
                <div className="px-4 py-3 border-b border-[#2d2d34] shrink-0">
                  <button
                    onClick={handleApprove}
                    disabled={
                      activeTask.status === 'APPROVED' ||
                      activeTask.status === 'MANGAKA_APPROVED' ||
                      (activeTask.status !== 'PENDING_REVIEW' && activeTask.rawTask?.status !== 'SUBMITTED')
                    }
                    className="w-full py-2.5 rounded-md bg-white hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed text-sm font-bold text-black transition-all cursor-pointer flex items-center justify-center gap-2"
                  >
                    <Check className="w-4 h-4" /> {t("Approve Task")}
                  </button>
                  {(activeTask.status === 'MANGAKA_APPROVED' || activeTask.status === 'APPROVED' || activeTask.rawTask?.status === 'MANGAKA_APPROVED') && (
                    <p className="text-[9px] text-green-400 text-center mt-1.5 font-bold uppercase tracking-wide">{t("✓ Mangaka Approved — Task completed")}</p>
                  )}
                  {activeTask.status === 'REVISING' && (
                    <p className="text-[9px] text-amber-400 text-center mt-1.5">{t("Assistant revision requested")}</p>
                  )}
                </div>

                {/* Request changes */}
                <div className="px-4 py-3 flex flex-col gap-3 flex-1">
                  <div>
                    <h3 className="text-xs font-bold text-white flex items-center gap-1.5 mb-1">
                      <XCircle className="w-3.5 h-3.5 text-red-500" /> {t("Request Changes")}
                    </h3>
                    <p className="text-[9px] text-slate-500 leading-relaxed">
                      {activeBox ? t("Comment will be pinned to the selected zone.") : t("Draw a zone on the canvas, then describe the correction.")}
                    </p>
                  </div>
                  <textarea
                    value={reviewComment}
                    onChange={e => setReviewComment(e.target.value)}
                    placeholder={t("Type your review comments here to send back to assistant...")}
                    rows={5}
                    className="w-full bg-[#121214] border border-[#2d2d34] rounded-md px-3 py-2.5 text-xs text-white placeholder:text-slate-700 focus:outline-none focus:border-slate-500 resize-none transition-colors leading-relaxed"
                  />
                  <button
                    onClick={handleSendBack}
                    disabled={!reviewComment.trim() || activeTask.status === 'REVISING'}
                    className="w-full py-2.5 rounded-md bg-slate-800 hover:bg-slate-700 border border-red-600/30 hover:border-red-600/50 disabled:opacity-30 disabled:cursor-not-allowed text-sm font-bold text-white transition-all cursor-pointer flex items-center justify-center gap-2 mt-auto"
                  >
                    <Undo2 className="w-3.5 h-3.5" /> {t("Send Back with Selected Zone")}
                  </button>
                  {activeTask.status === 'REVISING' && (
                    <p className="text-[9px] text-red-500/60 text-center font-medium -mt-1">{t("Already sent for revision")}</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center gap-3 px-4 select-none">
                <Eye className="w-10 h-10 stroke-[1] text-slate-700" />
                <p className="text-xs font-medium text-slate-600 text-center">{t("Select a task to start reviewing")}</p>
              </div>
            )
          ) : mode === 'SUBMIT' ? (
            /* ── SUBMIT: page submission form ── */
            <div className="flex flex-col h-full overflow-y-auto">

              {/* Form header */}
              <div className="px-4 pt-4 pb-3 border-b border-[#2d2d34] shrink-0">
                <p className="text-[9px] font-bold uppercase tracking-widest text-red-400/80 mb-1 flex items-center gap-1.5">
                  <UploadCloud className="w-3 h-3" /> {t("Step 2 — Submit Details")}
                </p>
                <h2 className="text-sm font-bold text-white leading-snug">{t("Submit Page to Editor")}</h2>
                <p className="text-[9px] text-slate-500 mt-1 leading-relaxed">
                  {t("Upload the page on the canvas, mark the zones to annotate, then submit for review.")}
                </p>
              </div>

              {/* Form body */}
              <div className="flex-1 px-4 py-3 space-y-4 overflow-y-auto">

                {/* Note for editor */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                    {t("Note for the Editor")}
                  </label>
                  <textarea
                    value={submitNote}
                    onChange={e => setSubmitNote(e.target.value)}
                    placeholder={t("Describe what this page contains or anything the editor should know...")}
                    rows={4}
                    className="w-full bg-[#121214] border border-[#2d2d34] rounded-md px-3 py-2.5 text-xs text-white placeholder:text-slate-700 focus:outline-none focus:border-slate-500 resize-none transition-colors leading-relaxed"
                  />
                </div>

                {/* Live zone metadata */}
                {activeCreateBox ? (
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-red-500" /> {t("Marked Zone Coordinates")}
                    </label>
                    <div className="bg-[#121214] border border-[#2d2d34] rounded-md px-3 py-2.5 font-mono text-[10px] text-slate-500 grid grid-cols-2 gap-x-4 gap-y-1">
                      <div>X: <span className="text-slate-300 font-bold">{activeCreateBox.leftPct.toFixed(1)}%</span></div>
                      <div>Y: <span className="text-slate-300 font-bold">{activeCreateBox.topPct.toFixed(1)}%</span></div>
                      <div>W: <span className="text-slate-300 font-bold">{activeCreateBox.widthPct.toFixed(1)}%</span></div>
                      <div>H: <span className="text-slate-300 font-bold">{activeCreateBox.heightPct.toFixed(1)}%</span></div>
                    </div>
                    {createBoxes.length > 1 && (
                      <p className="text-[9px] text-slate-600 mt-1">
                        {t("All {{count}} marked regions will be attached to this page.", { count: createBoxes.length })}
                      </p>
                    )}
                  </div>
                ) : sketchPreview ? (
                  <div className="bg-red-500/5 border border-red-500/15 rounded-md px-3 py-2.5">
                    <p className="text-[9px] text-red-400/70 leading-relaxed">
                      {t("← Drag on the canvas to mark zones for the editor.")}
                    </p>
                  </div>
                ) : (
                  <div className="bg-[#121214]/60 border border-[#2d2d34] rounded-md px-3 py-2.5">
                    <p className="text-[9px] text-slate-600 leading-relaxed">
                      {t("Upload the page on the canvas to enable zone marking.")}
                    </p>
                  </div>
                )}

                {/* Chapter + series context */}
                <div className="bg-[#121214]/60 border border-[#2d2d34] rounded-md px-3 py-2.5">
                  <p className="text-[9px] text-slate-500 leading-relaxed">
                    <span className="text-slate-300 font-bold">{t("Chapter")} {activeChapter?.chapterNumber ?? '??'}</span>
                    {" — "}{activeSeries?.title ?? ''}
                  </p>
                </div>

              </div>

              {/* Submit button */}
              <div className="px-4 py-4 border-t border-[#2d2d34] shrink-0 space-y-2">
                <button
                  onClick={handleSubmitToEditor}
                  disabled={
                    !sketchFile ||
                    !!deployToast
                  }
                  className="w-full py-3 rounded-md bg-white hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed text-sm font-bold text-black transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg"
                >
                  <Send className="w-4 h-4" />
                  {t("Submit to Editor")}
                </button>
                <button
                  onClick={exitSubmitMode}
                  className="w-full py-2 rounded-md border border-[#2d2d34] text-xs font-semibold text-slate-500 hover:text-white hover:border-slate-500 transition-all cursor-pointer"
                >
                  {t("Cancel")}
                </button>
              </div>

            </div>
          ) : (
            /* ── CREATION: Task Assignment Form (Req 3) ── */
            <div className="flex flex-col h-full overflow-y-auto">

              {/* Form header */}
              <div className="px-4 pt-4 pb-3 border-b border-[#2d2d34] shrink-0">
                <p className="text-[9px] font-bold uppercase tracking-widest text-red-400/80 mb-1 flex items-center gap-1.5">
                  <Crosshair className="w-3 h-3" /> {t("Step 2 — Task Details")}
                </p>
                <h2 className="text-sm font-bold text-white leading-snug">{t("Assign New Task")}</h2>
                <p className="text-[9px] text-slate-500 mt-1 leading-relaxed">
                  {t("Fill in the task details below, then deploy to an assistant.")}
                </p>
              </div>

              {/* Form body */}
              <div className="flex-1 px-4 py-3 space-y-4 overflow-y-auto">

                {/* Task Title */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                    {t("Task Title")}
                  </label>
                  <input
                    type="text"
                    value={cTitle}
                    onChange={e => setCTitle(e.target.value)}
                    placeholder={t("e.g. Background Lineart — Scene 3")}
                    className="w-full bg-[#121214] border border-[#2d2d34] rounded-md px-3 py-2.5 text-sm text-white placeholder:text-slate-700 focus:outline-none focus:border-slate-500 transition-colors"
                  />
                </div>

                {/* Task Type */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                    {t("Task Type")}
                  </label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {TASK_TYPES.map(taskType => (
                      <button
                        key={taskType}
                        type="button"
                        onClick={() => setCType(taskType)}
                        className={`px-2.5 py-2 rounded-md border text-[11px] font-medium transition-all cursor-pointer ${
                          cType === taskType
                            ? 'bg-white/10 border-white/20 text-white'
                            : 'bg-[#121214] border-[#2d2d34] text-slate-500 hover:text-slate-300 hover:border-slate-600'
                        }`}
                      >
                        {t(taskType)}
                      </button>
                    ))}
                  </div>
                </div>
                {/* Task Deadline */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                    {t("Task Deadline")}
                  </label>
                  <input
                    type="date"
                    value={cDueAt}
                    min={new Date().toISOString().split('T')[0]}
                    onChange={e => setCDueAt(e.target.value)}
                    className="w-full bg-[#121214] border border-[#2d2d34] rounded-md px-3 py-2 text-xs text-white focus:outline-none focus:border-slate-500 transition-colors cursor-pointer"
                  />
                </div>

                {/* Assign To */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                    {t("Assign To")}
                  </label>
                  <div className="space-y-1.5">
                    {assistantsList.length > 0 ? (
                      assistantsList.map(a => {
                        const init = a.name.split(' ').map((w: string) => w[0]).join('').toUpperCase().substring(0, 2);
                        return (
                          <button
                            key={a._id}
                            type="button"
                            onClick={() => setCAssistant(a._id)}
                            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-md border text-xs font-medium transition-all cursor-pointer ${
                              cAssistant === a._id
                                ? 'bg-white/10 border-white/20 text-white'
                                : 'bg-[#121214] border-[#2d2d34] text-slate-400 hover:border-slate-600 hover:text-slate-300'
                            }`}
                          >
                            <div className="w-6 h-6 rounded-md bg-[#2d2d34] border border-[#3a3a44] text-slate-300 flex items-center justify-center text-[9px] font-black shrink-0">
                              {init}
                            </div>
                            <span className="flex-1 text-left">{a.name}</span>
                            {cAssistant === a._id && <Check className="w-3 h-3 text-white/60 shrink-0" />}
                          </button>
                        );
                      })
                    ) : (
                      <p className="text-[10px] text-slate-600">
                        {isWorkspaceLoading ? t("Loading Assistants...") : t("No Assistants found in the system.")}
                      </p>
                    )}
                  </div>
                </div>

                {/* Instructions for the marked zone */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5">
                    {t("Instructions for the Marked Zone")}
                  </label>
                  <textarea
                    value={cInstructions}
                    onChange={e => setCInstructions(e.target.value)}
                    placeholder={t("Describe what the assistant should do in this zone — style, technique, references...")}
                    rows={4}
                    className="w-full bg-[#121214] border border-[#2d2d34] rounded-md px-3 py-2.5 text-xs text-white placeholder:text-slate-700 focus:outline-none focus:border-slate-500 resize-none transition-colors leading-relaxed"
                  />
                </div>

                {/* Live zone metadata — Req 3 coordinates display */}
                {activeCreateBox ? (
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1.5 flex items-center gap-1">
                      <MapPin className="w-3 h-3 text-red-500" /> {t("Marked Zone Coordinates")}
                    </label>
                    <div className="bg-[#121214] border border-[#2d2d34] rounded-md px-3 py-2.5 font-mono text-[10px] text-slate-500 grid grid-cols-2 gap-x-4 gap-y-1">
                      <div>X: <span className="text-slate-300 font-bold">{activeCreateBox.leftPct.toFixed(1)}%</span></div>
                      <div>Y: <span className="text-slate-300 font-bold">{activeCreateBox.topPct.toFixed(1)}%</span></div>
                      <div>W: <span className="text-slate-300 font-bold">{activeCreateBox.widthPct.toFixed(1)}%</span></div>
                      <div>H: <span className="text-slate-300 font-bold">{activeCreateBox.heightPct.toFixed(1)}%</span></div>
                    </div>
                    {createBoxes.length > 1 && (
                      <p className="text-[9px] text-slate-600 mt-1">
                        {t("All {{count}} marked regions will be sent to the Assistant.", { count: createBoxes.length })}
                      </p>
                    )}
                  </div>
                ) : sketchPreview ? (
                  <div className="bg-red-500/5 border border-red-500/15 rounded-md px-3 py-2.5">
                    <p className="text-[9px] text-red-400/70 leading-relaxed">
                      {t("← Drag on the canvas to mark a specific work zone for this task.")}
                    </p>
                  </div>
                ) : (
                  <div className="bg-[#121214]/60 border border-[#2d2d34] rounded-md px-3 py-2.5">
                    <p className="text-[9px] text-slate-600 leading-relaxed">
                      {t("Upload a rough sketch on the canvas to enable zone marking.")}
                    </p>
                  </div>
                )}

              </div>

              {/* Deploy button — Req 4: white bg black text */}
              <div className="px-4 py-4 border-t border-[#2d2d34] shrink-0 space-y-2">
                <button
                  onClick={handleDeploy}
                  disabled={
                    !cTitle.trim() ||
                    !cAssistant ||
                    !sketchFile ||
                    createBoxes.length === 0 ||
                    !cInstructions.trim() ||
                    !!deployToast
                  }
                  className="w-full py-3 rounded-md bg-white hover:bg-slate-100 disabled:opacity-30 disabled:cursor-not-allowed text-sm font-bold text-black transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg"
                >
                  <Rocket className="w-4 h-4" />
                  {t("Deploy & Assign Task")}
                </button>
                <button
                  onClick={exitCreationMode}
                  className="w-full py-2 rounded-md border border-[#2d2d34] text-xs font-semibold text-slate-500 hover:text-white hover:border-slate-500 transition-all cursor-pointer"
                >
                  {t("Cancel")}
                </button>
              </div>

            </div>
          )}
        </aside>

      </div>
    </div>
  );
}
