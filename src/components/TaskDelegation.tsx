/**
 * TaskDelegation.tsx  →  SeriesProposalHub
 * ─────────────────────────────────────────────────────────────────────────────
 * Replaces the old task-assignment form with a two-mode
 * "New Series Proposal & Storyboard Review" workflow.
 *
 * MANGAKA VIEW  — Two tabs: "My Proposals" (list/detail/edit/resubmit) and
 *                 "New Proposal" (submission form)
 * EDITOR VIEW   — Dual-panel review layout with storyboard download card +
 *                 forward-to-board button (no reject)
 *
 * Color theme: Red · Matte Black · White · Slate Gray
 *   bg-app    #121214   deep matte black
 *   bg-panel  #1e1e24   deep slate gray
 *   divider   #2d2d34   medium gray borders
 * ─────────────────────────────────────────────────────────────────────────────
 */

import React, { useState, useRef, useEffect } from "react";
import { User, Series, Chapter, Task } from "../types";
import { apiClient } from "../api/client";
import JSZip from "jszip";
import { saveAs } from "file-saver";
import {
  Send,
  UploadCloud,
  FileArchive,
  X,
  Download,
  ChevronRight,
  CheckCircle2,
  XCircle,
  BookOpen,
  Brush,
  FileText,
  AlertCircle,
  RotateCcw,
  Eye,
  List,
  Plus,
  MessageSquare,
  Images,
  ZoomIn,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// Props — kept identical to old TaskDelegation so App.tsx needs no changes
// ─────────────────────────────────────────────────────────────────────────────

interface TaskDelegationProps {
  currentUser: User;
  series: Series[];
  chapters: Chapter[];
  tasks: Task[];
  onRefreshAll: () => void;
  onSelectSeries: (series: Series) => void;
  onSelectChapter: (chapter: Chapter) => void;
  openProposalId?: string | null;
  onOpenProposalHandled?: () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Internal proposal shape — mirrors what would go into the DB
// ─────────────────────────────────────────────────────────────────────────────

interface ProposalDraft {
  title: string;
  genre: string;
  synopsis: string;
  storyboardFiles: File[];
  storyboardPreviewName: string;
  storyboardPreviewSize: string;
  submittedAt: string;
  submittedBy: string;
}

const GENRES = [
  "Shonen",
  "Shojo",
  "Seinen",
  "Josei",
  "Isekai",
  "Sci-Fi",
  "Fantasy",
  "Romance",
  "Horror",
  "Slice of Life",
  "Action",
  "Mystery",
];

// ─────────────────────────────────────────────────────────────────────────────
// Shared label style — matches spec requirement exactly
// ─────────────────────────────────────────────────────────────────────────────
const LABEL =
  "block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5";
const INPUT =
  "w-full bg-[#121214] border border-[#2d2d34] rounded-md px-3 py-2.5 text-sm text-white placeholder:text-slate-700 focus:outline-none focus:border-slate-500 transition-colors";

// ─────────────────────────────────────────────────────────────────────────────
// Status labels & colors for mangaka list
// ─────────────────────────────────────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  SUBMITTED: "Submitted",
  UNDER_REVIEW: "Under Review",
  REVISION_REQUESTED: "Revision Requested",
  RESUBMITTED: "Resubmitted",
  APPROVED_BY_TANTOU: "Approved by Editor",
  SENT_TO_EDITORIAL_BOARD: "Sent to Board",
  APPROVED: "Board Approved",
  SERIES_CREATED: "Series Created",
  REJECTED: "Rejected",
};

const STATUS_COLORS: Record<string, string> = {
  SUBMITTED: "#F59E0B",
  UNDER_REVIEW: "#3B82F6",
  REVISION_REQUESTED: "#F97316",
  RESUBMITTED: "#8B5CF6",
  APPROVED_BY_TANTOU: "#10B981",
  SENT_TO_EDITORIAL_BOARD: "#6366F1",
  APPROVED: "#059669",
  SERIES_CREATED: "#047857",
  REJECTED: "#EF4444",
};

// ─────────────────────────────────────────────────────────────────────────────
// MANGAKA VIEW — My Proposals List
// ─────────────────────────────────────────────────────────────────────────────

function MyProposalsList({
  currentUser,
  onSelectProposal,
}: {
  currentUser: User;
  onSelectProposal: (proposal: any) => void;
}) {
  const [proposals, setProposals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProposals = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiClient.proposals.getAll(undefined, currentUser._id);
      setProposals(data || []);
    } catch (err: any) {
      setError(err.message || "Failed to load proposals");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProposals();
  }, [currentUser._id]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-16">
        <div className="w-8 h-8 border-2 border-slate-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-slate-500 font-mono">
          Loading your proposals...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center gap-4 py-16">
        <AlertCircle className="w-10 h-10 text-red-400" />
        <p className="text-sm text-red-400">{error}</p>
        <button
          onClick={fetchProposals}
          className="px-4 py-2 rounded-md bg-[#2d2d34] text-sm text-slate-300 hover:bg-[#3a3a44] transition-colors cursor-pointer"
        >
          Retry
        </button>
      </div>
    );
  }

  if (proposals.length === 0) {
    return (
      <div className="flex flex-col items-center gap-4 py-16">
        <div className="w-14 h-14 rounded-full bg-[#1e1e24] border border-[#2d2d34] flex items-center justify-center">
          <BookOpen className="w-7 h-7 text-slate-600" />
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-slate-400">
            No proposals yet
          </p>
          <p className="text-[11px] text-slate-600 mt-1">
            Submit your first series proposal to get started.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {proposals.map((p) => {
        const statusColor = STATUS_COLORS[p.status] || "#6B7280";
        return (
          <button
            key={p._id}
            onClick={() => onSelectProposal(p)}
            className="w-full text-left bg-[#121214] border border-[#2d2d34] rounded-md p-4 hover:border-slate-500 transition-colors cursor-pointer group"
          >
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-sm font-bold text-white truncate">
                    {p.title}
                  </h3>
                </div>
                <p className="text-[11px] text-slate-500 mb-2">{p.genre}</p>
                <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed">
                  {p.synopsis}
                </p>
              </div>
              <div className="flex flex-col items-end gap-2 shrink-0">
                <span
                  className="inline-block px-2.5 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider text-white"
                  style={{ backgroundColor: statusColor }}
                >
                  {STATUS_LABELS[p.status] || p.status}
                </span>
                {/* Anonymous board review indicator — confirms the author's
                    identity is hidden while the Editorial Board votes. */}
                {p.status === "SENT_TO_EDITORIAL_BOARD" && p.isAnonymous && (
                  <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider text-indigo-300 bg-indigo-500/10 border border-indigo-500/40">
                    <Eye className="w-3 h-3" /> Anonymous review — name hidden from board
                  </span>
                )}
                <span className="text-[9px] text-slate-600 font-mono">
                  {new Date(
                    p.submittedAt || p.submittedDate,
                  ).toLocaleDateString()}
                </span>
                {/* Review deadline — 7 days after submission for pending proposals */}
                {['SUBMITTED', 'UNDER_REVIEW', 'RESUBMITTED', 'SENT_TO_EDITORIAL_BOARD'].includes(p.status) && (
                  <span className="text-[9px] font-mono text-amber-500/80">
                    ⏳ Due: {new Date(new Date(p.submittedAt || p.submittedDate).getTime() + 7 * 24 * 3600 * 1000).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
            {p.comments && p.comments.length > 0 && (
              <div className="mt-3 pt-3 border-t border-[#2d2d34] flex items-center gap-1.5 text-[10px] text-slate-500">
                <MessageSquare className="w-3 h-3" />
                <span>
                  {p.comments.length} comment
                  {p.comments.length !== 1 ? "s" : ""}
                </span>
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MANGAKA VIEW — Proposal Detail + Edit/Resubmit
// ─────────────────────────────────────────────────────────────────────────────

function ProposalDetailView({
  proposal,
  currentUser,
  onBack,
  onResubmitted,
}: {
  proposal: any;
  currentUser: User;
  onBack: () => void;
  onResubmitted: () => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [synopsis, setSynopsis] = useState(proposal.synopsis || "");
  const [newFiles, setNewFiles] = useState<File[]>([]);
  const [removedImageUrls, setRemovedImageUrls] = useState<string[]>([]);
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{
    text: string;
    ok: boolean;
  } | null>(null);
  const [isZipping, setIsZipping] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isRevisionRequested = proposal.status === "REVISION_REQUESTED";
  const statusColor = STATUS_COLORS[proposal.status] || "#6B7280";
  const images = (proposal.storyboardImages || []).filter(
    (img: any) => !removedImageUrls.includes(img.url),
  );

  const handleDownloadAllZip = async () => {
    setIsZipping(true);
    try {
      const zip = new JSZip();
      const imgFolder = zip.folder("storyboard")!;
      for (let i = 0; i < images.length; i++) {
        const img = images[i];
        try {
          const resp = await fetch(img.url);
          const blob = await resp.blob();
          const ext = img.originalName?.includes(".")
            ? img.originalName.split(".").pop()
            : "png";
          imgFolder.file(`page_${i + 1}.${ext}`, blob);
        } catch (e) {
          console.warn("Failed to fetch image", img.url, e);
        }
      }
      const blob = await zip.generateAsync({ type: "blob" });
      saveAs(blob, `${proposal.title}_storyboard.zip`);
    } catch (err) {
      console.error("ZIP error:", err);
      alert("Failed to create ZIP download");
    } finally {
      setIsZipping(false);
    }
  };

  const handleResubmit = async () => {
    if (!synopsis.trim()) {
      setStatusMsg({ text: "Synopsis cannot be empty", ok: false });
      return;
    }
    setIsSubmitting(true);
    setStatusMsg(null);
    try {
      await apiClient.proposals.resubmit(
        proposal._id,
        newFiles,
        removedImageUrls,
        synopsis,
      );
      setStatusMsg({ text: "Proposal resubmitted successfully!", ok: true });
      setTimeout(() => {
        onResubmitted();
      }, 1500);
    } catch (err: any) {
      setStatusMsg({ text: err.message || "Resubmit failed", ok: false });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Find latest editor comment (revision reason)
  const editorComments = (proposal.comments || []).filter(
    (c: any) => c.authorRole === "editor",
  );
  const latestEditorComment = editorComments[editorComments.length - 1];

  return (
    <div className="space-y-4">
      {/* Back button */}
      <button
        onClick={onBack}
        className="flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-white transition-colors cursor-pointer"
      >
        <RotateCcw className="w-3 h-3" /> Back to My Proposals
      </button>

      {/* Status message */}
      {statusMsg && (
        <div
          className={`flex items-start gap-2 px-3 py-2.5 rounded-md border text-xs font-medium ${
            statusMsg.ok
              ? "bg-white/5 border-white/15 text-white"
              : "bg-red-500/10 border-red-500/20 text-red-400"
          }`}
        >
          {statusMsg.ok ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
          )}
          {statusMsg.text}
        </div>
      )}

      {/* Title + Status */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-white">{proposal.title}</h2>
          <p className="text-xs text-slate-500 mt-0.5">{proposal.genre}</p>
        </div>
        <span
          className="inline-block px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider text-white shrink-0"
          style={{ backgroundColor: statusColor }}
        >
          {STATUS_LABELS[proposal.status] || proposal.status}
        </span>
      </div>

      {/* Anonymous review confirmation banner */}
      {proposal.status === "SENT_TO_EDITORIAL_BOARD" && proposal.isAnonymous && (
        <div className="flex items-start gap-3 px-3 py-3 rounded-md bg-indigo-500/10 border border-indigo-500/40">
          <div className="w-7 h-7 rounded-md bg-indigo-500/20 flex items-center justify-center shrink-0">
            <Eye className="w-4 h-4 text-indigo-300" />
          </div>
          <div>
            <p className="text-xs font-bold text-indigo-200 uppercase tracking-wide">
              Anonymous Editorial Board review in progress
            </p>
            <p className="text-[11px] text-indigo-300/80 leading-relaxed mt-0.5">
              Your name has been hidden from the Editorial Board while they vote
              on your series. Only the editor who forwarded it knows your
              identity. The result will be sent to you once voting closes.
            </p>
          </div>
        </div>
      )}

      {/* Synopsis */}
      <div className="bg-[#121214] border border-[#2d2d34] rounded-md p-4">
        <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest mb-2">
          Synopsis
        </p>
        {isEditing ? (
          <textarea
            value={synopsis}
            onChange={(e) => setSynopsis(e.target.value)}
            rows={6}
            className={`${INPUT} resize-none leading-relaxed`}
          />
        ) : (
          <p className="text-sm text-white leading-relaxed">
            {proposal.synopsis}
          </p>
        )}
      </div>

      {/* Storyboard Images Gallery */}
      <div className="bg-[#121214] border border-[#2d2d34] rounded-md p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">
            Storyboard Images ({images.length})
          </p>
          {images.length > 0 && (
            <button
              onClick={handleDownloadAllZip}
              disabled={isZipping}
              className="flex items-center gap-1 px-3 py-1.5 rounded-md bg-white text-black text-[10px] font-bold hover:bg-slate-200 transition-colors cursor-pointer disabled:opacity-50"
            >
              <Download className="w-3 h-3" />
              {isZipping ? "Zipping..." : "Download All as ZIP"}
            </button>
          )}
        </div>
        {images.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
            {images.map((img: any, idx: number) => (
              <div
                key={idx}
                className="relative group bg-[#1e1e24] border border-[#2d2d34] rounded-md overflow-hidden cursor-pointer"
                onClick={() => setLightboxImg(img.url)}
              >
                <img
                  src={img.url}
                  alt={img.originalName || `Storyboard ${idx + 1}`}
                  className="w-full h-28 object-cover"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                  <ZoomIn className="w-5 h-5 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <p className="text-[8px] text-slate-500 truncate px-1 py-0.5 text-center">
                  {img.originalName || `Page ${idx + 1}`}
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-slate-600">
            No storyboard images attached
          </p>
        )}
      </div>

      {/* Lightbox */}
      {lightboxImg && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightboxImg(null)}
        >
          <button
            onClick={() => setLightboxImg(null)}
            className="absolute top-4 right-4 text-white hover:text-slate-300 cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={lightboxImg}
            alt="Storyboard full view"
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* Submission meta */}
      <div className="flex items-center gap-4 text-[10px] text-slate-600 font-mono">
        <span>
          Submitted:{" "}
          {new Date(
            proposal.submittedAt || proposal.submittedDate,
          ).toLocaleString()}
        </span>
        <span>
          Last updated:{" "}
          {new Date(
            proposal.updatedAt || proposal.lastUpdated,
          ).toLocaleString()}
        </span>
      </div>

      {/* Editor Comments */}
      {editorComments.length > 0 && (
        <div className="bg-[#121214] border border-[#2d2d34] rounded-md p-4">
          <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest mb-3 flex items-center gap-1.5">
            <MessageSquare className="w-3 h-3" /> Editor Feedback
          </p>
          <div className="space-y-3">
            {editorComments.map((c: any, idx: number) => (
              <div key={idx} className="bg-[#1e1e24] rounded-md p-3">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-bold text-slate-400">
                    {c.authorName}
                  </span>
                  <span className="text-[9px] text-slate-600 font-mono">
                    {new Date(c.createdAt).toLocaleString()}
                  </span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  {c.content}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Edit & Resubmit section (only when REVISION_REQUESTED) */}
      {isRevisionRequested && (
        <div className="bg-[#1e1e24] border border-orange-500/30 rounded-md p-4 space-y-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-orange-400" />
            <h3 className="text-sm font-bold text-orange-400">
              Revision Requested
            </h3>
          </div>

          {latestEditorComment && (
            <div className="bg-[#121214] rounded-md p-3 border-l-4 border-orange-500">
              <p className="text-[10px] text-slate-500 mb-1">
                Editor's revision request:
              </p>
              <p className="text-xs text-slate-300 leading-relaxed">
                {latestEditorComment.content}
              </p>
            </div>
          )}

          {!isEditing ? (
            <button
              onClick={() => setIsEditing(true)}
              className="w-full py-2.5 rounded-md bg-orange-600 hover:bg-orange-500 text-sm font-bold text-white transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <Brush className="w-4 h-4" /> Edit & Resubmit
            </button>
          ) : (
            <div className="space-y-4">
              {/* Existing images — can be removed */}
              {(proposal.storyboardImages || []).length > 0 && (
                <div>
                  <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-2">
                    Existing Storyboard Images (
                    {(proposal.storyboardImages || []).length}) — click × to
                    remove
                  </p>
                  <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-1.5">
                    {(proposal.storyboardImages || []).map(
                      (img: any, idx: number) => {
                        const isRemoved = removedImageUrls.includes(img.url);
                        return (
                          <div
                            key={idx}
                            className={`relative bg-[#121214] border rounded overflow-hidden cursor-pointer transition-opacity ${isRemoved ? "border-red-500 opacity-40" : "border-[#2d2d34]"}`}
                            onClick={() => {
                              if (!isRemoved) {
                                setRemovedImageUrls((prev) => [
                                  ...prev,
                                  img.url,
                                ]);
                              }
                            }}
                          >
                            <img
                              src={img.url}
                              alt=""
                              className="w-full h-16 object-cover"
                            />
                            {!isRemoved && (
                              <div className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-red-600 flex items-center justify-center text-white">
                                <X className="w-2.5 h-2.5" />
                              </div>
                            )}
                            {isRemoved && (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <span className="text-[8px] text-red-400 font-bold uppercase">
                                  Removed
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      },
                    )}
                  </div>
                  {removedImageUrls.length > 0 && (
                    <button
                      onClick={() => setRemovedImageUrls([])}
                      className="mt-2 text-[10px] text-slate-500 hover:text-white transition-colors cursor-pointer"
                    >
                      Undo removals
                    </button>
                  )}
                </div>
              )}

              {/* Upload additional storyboard images (multiple) */}
              <div>
                <label className={LABEL}>
                  Add More Images{" "}
                  <span className="text-slate-600 normal-case font-normal">
                    (optional, multiple)
                  </span>
                </label>
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => fileInputRef.current?.click()}
                  onKeyDown={(e) =>
                    e.key === "Enter" && fileInputRef.current?.click()
                  }
                  className="w-full py-2.5 px-3 rounded-md bg-[#121214] border border-[#2d2d34] text-xs text-slate-400 hover:border-slate-500 transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Choose files to add</span>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".zip,.pdf,.png,.jpg,.jpeg,.psd,.clip"
                  onChange={(e) => {
                    if (e.target.files) {
                      const filesArray = Array.from(e.target.files!);
                      setNewFiles((prev) => {
                        const newFiles = [...prev, ...filesArray];
                        return newFiles;
                      });
                    }
                    e.target.value = "";
                  }}
                  className="hidden"
                />
                {newFiles.length > 0 && (
                  <div className="mt-2 space-y-1">
                    <p className="text-[9px] text-slate-500">
                      {newFiles.length} new file(s) to add
                    </p>
                    {newFiles.map((f, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 text-xs text-slate-400"
                      >
                        <FileArchive className="w-3 h-3 shrink-0" />
                        <span className="truncate flex-1">{f.name}</span>
                        <button
                          onClick={() =>
                            setNewFiles((prev) =>
                              prev.filter((_, i) => i !== idx),
                            )
                          }
                          className="text-red-400 hover:text-red-300 cursor-pointer shrink-0"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {/* Action buttons */}
              <div className="flex gap-2">
                <button
                  onClick={handleResubmit}
                  disabled={isSubmitting || !synopsis.trim()}
                  className="flex-1 py-2.5 rounded-md bg-orange-600 hover:bg-orange-500 disabled:opacity-30 disabled:cursor-not-allowed text-sm font-bold text-white transition-colors cursor-pointer flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  {isSubmitting ? "Resubmitting..." : "Resubmit to Editor"}
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setSynopsis(proposal.synopsis || "");
                    setNewFiles([]);
                  }}
                  className="px-4 py-2.5 rounded-md border border-[#2d2d34] text-sm text-slate-400 hover:text-white hover:border-slate-500 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MANGAKA VIEW — Submission Form
// ─────────────────────────────────────────────────────────────────────────────

function MangakaView({
  currentUser,
  onSubmit,
}: {
  currentUser: User;
  onSubmit: (draft: ProposalDraft) => void;
}) {
  const [title, setTitle] = useState("");
  const [genre, setGenre] = useState("");
  const [synopsis, setSynopsis] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [dropHover, setDropHover] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{
    text: string;
    ok: boolean;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Accepted file types for storyboard archive
  const ACCEPTED = ".zip,.pdf,.png,.jpg,.jpeg,.psd,.clip";

  const handleFiles = (newFiles: FileList | null) => {
    if (!newFiles) return;
    setFiles((prev) => [...prev, ...Array.from(newFiles)]);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDropHover(false);
    handleFiles(e.dataTransfer.files);
  };

  const handleRemoveFile = (idx: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !genre || !synopsis.trim() || files.length === 0) {
      setStatusMsg({
        text: "Please fill in all required fields and upload at least one storyboard image.",
        ok: false,
      });
      return;
    }

    setIsSubmitting(true);
    setStatusMsg(null);

    try {
      const draft: ProposalDraft = {
        title: title.trim(),
        genre,
        synopsis: synopsis.trim(),
        storyboardFiles: files,
        storyboardPreviewName: files[0]?.name ?? "",
        storyboardPreviewSize: files[0] ? formatSize(files[0].size) : "",
        submittedAt: new Date().toLocaleString(),
        submittedBy: currentUser.name,
      };

      onSubmit(draft);
    } catch (err: any) {
      setStatusMsg({ text: `Submission failed: ${err.message}`, ok: false });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto w-full">
      {/* ── Section header ── */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-6 h-6 rounded-md bg-red-600 flex items-center justify-center shrink-0">
            <Brush className="w-3.5 h-3.5 text-white" />
          </div>
          <h2 className="text-base font-bold text-white uppercase tracking-wide">
            New Series Proposal
          </h2>
        </div>
        <p className="text-[11px] text-slate-500 leading-relaxed">
          Submit your series concept and required storyboard archive to the
          Tantou Editor for review.
        </p>
      </div>

      {/* ── Status banner ── */}
      {statusMsg && (
        <div
          className={`flex items-start gap-2 px-3 py-2.5 rounded-md border mb-5 text-xs font-medium ${
            statusMsg.ok
              ? "bg-white/5 border-white/15 text-white"
              : "bg-red-500/10 border-red-500/20 text-red-400"
          }`}
        >
          {statusMsg.ok ? (
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-400" />
          )}
          {statusMsg.text}
        </div>
      )}

      {/* ── Form ── */}
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Series Title */}
        <div>
          <label className={LABEL} htmlFor="prop-title">
            Series Title <span className="text-red-500">*</span>
          </label>
          <input
            id="prop-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Neon Ronin Chronicles"
            className={INPUT}
            required
          />
        </div>

        {/* Genre */}
        <div>
          <label className={LABEL} htmlFor="prop-genre">
            Genre <span className="text-red-500">*</span>
          </label>
          <div className="flex flex-wrap gap-1.5">
            {GENRES.map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setGenre(g)}
                className={`px-3 py-1 rounded-md border text-[11px] font-medium transition-all cursor-pointer ${
                  genre === g
                    ? "bg-white/10 border-white/25 text-white"
                    : "bg-[#121214] border-[#2d2d34] text-slate-500 hover:text-slate-300 hover:border-slate-600"
                }`}
              >
                {g}
              </button>
            ))}
          </div>
          {!genre && (
            <p className="text-[9px] text-slate-700 mt-1.5">
              Select a genre above
            </p>
          )}
        </div>

        {/* Synopsis */}
        <div>
          <label className={LABEL} htmlFor="prop-synopsis">
            Synopsis <span className="text-red-500">*</span>
          </label>
          <textarea
            id="prop-synopsis"
            value={synopsis}
            onChange={(e) => setSynopsis(e.target.value)}
            rows={5}
            placeholder="Summarise the core concept, target audience, main character arc, and the unique hook of your series..."
            className={`${INPUT} resize-none leading-relaxed`}
            required
          />
          <p className="text-[9px] text-slate-700 mt-1 text-right">
            {synopsis.length} chars
          </p>
        </div>

        {/* Storyboard Upload */}
        <div>
          <label className={LABEL}>
            Upload Rough Storyboard / Story Archive{" "}
            <span className="text-slate-600 normal-case font-normal">
              (Required — .zip, .pdf, .png)
            </span>
          </label>

          {files.length > 0 ? (
            /* Files attached state - show thumbnail grid */
            <div className="space-y-2">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {files.map((f, idx) => (
                  <div
                    key={idx}
                    className="relative group bg-[#121214] border border-[#2d2d34] rounded-md p-2 flex flex-col items-center gap-1"
                  >
                    {f.type.startsWith("image/") ? (
                      <img
                        src={URL.createObjectURL(f)}
                        alt={f.name}
                        className="w-full h-24 object-cover rounded"
                      />
                    ) : (
                      <div className="w-full h-24 rounded bg-[#1e1e24] flex items-center justify-center">
                        <FileArchive className="w-6 h-6 text-slate-500" />
                      </div>
                    )}
                    <p className="text-[9px] text-slate-400 truncate w-full text-center">
                      {f.name}
                    </p>
                    <button
                      type="button"
                      onClick={() => handleRemoveFile(idx)}
                      title="Remove file"
                      className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-600 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
              <p className="text-[9px] text-slate-600 font-mono">
                {files.length} file(s) selected
              </p>
            </div>
          ) : (
            /* Dropzone */
            <div
              role="button"
              tabIndex={0}
              onClick={() => fileInputRef.current?.click()}
              onKeyDown={(e) =>
                e.key === "Enter" && fileInputRef.current?.click()
              }
              onDragOver={(e) => {
                e.preventDefault();
                setDropHover(true);
              }}
              onDragLeave={() => setDropHover(false)}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-md p-6 flex flex-col items-center justify-center gap-3 cursor-pointer transition-colors ${
                dropHover
                  ? "border-slate-500 bg-[#1e1e24]"
                  : "border-slate-700 bg-[#1e1e24]/50 hover:bg-[#1e1e24] hover:border-slate-600"
              }`}
            >
              <div className="w-12 h-12 rounded-full bg-[#2d2d34] flex items-center justify-center">
                <UploadCloud
                  className={`w-6 h-6 transition-colors ${dropHover ? "text-slate-300" : "text-slate-600"}`}
                />
              </div>
              <div className="text-center space-y-1">
                <p className="text-sm font-medium text-slate-400">
                  Click to upload storyboard or rough sketch
                </p>
                <p className="text-[10px] text-slate-700 font-mono">
                  .zip · .pdf · .png · .jpg · .psd · .clip — max 50 MB
                </p>
              </div>
              <div className="px-4 py-1.5 rounded-md bg-[#2d2d34] border border-[#3a3a44]">
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Browse files
                </span>
              </div>
            </div>
          )}

          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={ACCEPTED}
            onChange={(e) => {
              handleFiles(e.target.files);
              e.target.value = "";
            }}
            className="hidden"
            aria-label="Upload storyboard archive"
          />
        </div>

        {/* Submit */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={
              isSubmitting || !title.trim() || !genre || !synopsis.trim()
            }
            className="w-full py-3 rounded-md bg-red-600 hover:bg-red-500 disabled:opacity-30 disabled:cursor-not-allowed text-sm font-bold text-white transition-all cursor-pointer flex items-center justify-center gap-2 shadow-lg"
          >
            <Send className="w-4 h-4" />
            {isSubmitting ? "Submitting…" : "Submit Proposal to Editor"}
          </button>
        </div>
      </form>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MANGAKA VIEW — Post-submit confirmation
// ─────────────────────────────────────────────────────────────────────────────

function MangakaSuccessView({
  proposal,
  onReset,
}: {
  proposal: ProposalDraft;
  onReset: () => void;
}) {
  return (
    <div className="max-w-lg mx-auto flex flex-col items-center gap-6 py-16 text-center">
      <div className="w-16 h-16 rounded-full bg-white/8 border border-white/15 flex items-center justify-center">
        <CheckCircle2 className="w-8 h-8 text-white" />
      </div>
      <div>
        <h2 className="text-base font-bold text-white mb-2">
          Proposal Submitted!
        </h2>
        <p className="text-sm text-slate-400 leading-relaxed">
          <span className="text-white font-semibold">"{proposal.title}"</span>{" "}
          has been sent to the Tantou Editor for review.
          {proposal.storyboardPreviewName && (
            <>
              {" "}
              The storyboard archive{" "}
              <span className="text-white font-medium">
                {proposal.storyboardPreviewName}
              </span>{" "}
              was attached.
            </>
          )}
        </p>
      </div>

      {/* Proposal summary card */}
      <div className="w-full bg-[#1e1e24] border border-[#2d2d34] rounded-md px-5 py-4 text-left space-y-3">
        <div>
          <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest mb-0.5">
            Title
          </p>
          <p className="text-sm text-white font-semibold">{proposal.title}</p>
        </div>
        <div>
          <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest mb-0.5">
            Genre
          </p>
          <p className="text-sm text-white">{proposal.genre}</p>
        </div>
        {proposal.storyboardPreviewName && (
          <div>
            <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest mb-0.5">
              Attachment
            </p>
            <p className="text-sm text-white font-mono">
              {proposal.storyboardPreviewName} ({proposal.storyboardPreviewSize}
              )
            </p>
          </div>
        )}
      </div>

      <button
        onClick={onReset}
        className="flex items-center gap-1.5 px-5 py-2.5 rounded-md border border-[#2d2d34] text-sm font-medium text-slate-400 hover:text-white hover:border-slate-500 transition-all cursor-pointer"
      >
        <RotateCcw className="w-3.5 h-3.5" /> Submit Another Proposal
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// EDITOR VIEW — Download & Evaluation Layout (no reject button)
// ─────────────────────────────────────────────────────────────────────────────

function EditorView({
  proposal,
  onForward,
  onReset,
}: {
  proposal: ProposalDraft & { _id?: string; storyboardUrl?: string; storyboardImages?: any[] };
  onForward: (comment: string) => void;
  onReset: () => void;
}) {
  const [editorComment, setEditorComment] = useState("");
  const [actionDone, setActionDone] = useState<"forwarded" | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isZipping, setIsZipping] = useState(false);
  const [lightboxImg, setLightboxImg] = useState<string | null>(null);

  const images = (proposal as any).storyboardImages || [];

  const handleDownloadZip = async () => {
    if (!(proposal as any)._id || images.length === 0) return;
    setIsZipping(true);
    try {
      const zip = new JSZip();
      const imgFolder = zip.folder("storyboard")!;
      for (let i = 0; i < images.length; i++) {
        const img = images[i];
        try {
          const resp = await fetch(img.url);
          const blob = await resp.blob();
          const ext = img.originalName?.includes(".")
            ? img.originalName.split(".").pop()
            : "png";
          imgFolder.file(`page_${i + 1}.${ext}`, blob);
        } catch (e) {
          console.warn("Failed to fetch image", img.url, e);
        }
      }
      const blob = await zip.generateAsync({ type: "blob" });
      saveAs(blob, `${proposal.title}_storyboard.zip`);
    } catch (err) {
      console.error("ZIP error:", err);
      alert("Failed to create ZIP download");
    } finally {
      setIsZipping(false);
    }
  };

  const handleForward = async () => {
    if (!editorComment.trim()) return;
    setIsLoading(true);
    try {
      await onForward(editorComment);
      setActionDone("forwarded");
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // ── Post-decision confirmation screen ────────────────────────────────────
  if (actionDone) {
    return (
      <div className="flex flex-col items-center justify-center gap-5 py-20 text-center">
        <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center">
          <CheckCircle2 className="w-7 h-7 text-white" />
        </div>
        <div>
          <h3 className="text-base font-bold text-white mb-1">
            Forwarded to Publishing Board
          </h3>
          <p className="text-[11px] text-slate-500">
            "{proposal.title}" has been escalated to the Editorial Board.
          </p>
        </div>
        <button
          onClick={onReset}
          className="flex items-center gap-1.5 px-4 py-2 rounded-md border border-[#2d2d34] text-sm font-medium text-slate-400 hover:text-white hover:border-slate-500 transition-all cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Review Another Proposal
        </button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full">
      {/* ── Left panel: Proposal details (read-only) ── */}
      <div className="lg:col-span-5 flex flex-col gap-4">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-6 h-6 rounded-md bg-[#2d2d34] flex items-center justify-center shrink-0">
            <BookOpen className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <h2 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
            Proposal Details
          </h2>
        </div>

        {/* Title */}
        <div className="bg-[#121214] border border-[#2d2d34] rounded-md px-4 py-3">
          <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest mb-1">
            Series Title
          </p>
          <p className="text-lg font-bold text-white leading-snug">
            {proposal.title}
          </p>
        </div>

        {/* Genre */}
        <div className="bg-[#121214] border border-[#2d2d34] rounded-md px-4 py-3">
          <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest mb-1">
            Genre
          </p>
          <span className="inline-block text-xs font-semibold text-white bg-[#2d2d34] border border-[#3a3a44] px-2.5 py-1 rounded-md">
            {proposal.genre}
          </span>
        </div>

        {/* Synopsis */}
        <div className="bg-[#121214] border border-[#2d2d34] rounded-md px-4 py-3 flex-1">
          <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest mb-2">
            Synopsis
          </p>
          <p className="text-sm text-white leading-relaxed">
            {proposal.synopsis}
          </p>
        </div>

        {/* Submission meta */}
        <div className="flex items-center justify-between text-[9px] text-slate-600 font-mono px-1">
          <span>
            By <span className="text-slate-400">{proposal.submittedBy}</span>
          </span>
          <span>{proposal.submittedAt}</span>
        </div>
      </div>

      {/* ── Center panel: Storyboard images gallery ── */}
      <div className="lg:col-span-3 flex flex-col gap-4">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-6 h-6 rounded-md bg-[#2d2d34] flex items-center justify-center shrink-0">
            <FileText className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <h2 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
            Storyboard Images
          </h2>
        </div>

        {images.length > 0 ? (
          <div className="bg-[#121214] border border-[#2d2d34] rounded-md p-4 flex flex-col gap-3 flex-1">
            <div className="flex items-center justify-between">
              <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">
                {images.length} image{images.length !== 1 ? "s" : ""}
              </p>
            </div>

            {/* Thumbnail grid */}
            <div className="grid grid-cols-2 gap-2">
              {images.map((img: any, idx: number) => (
                <div
                  key={idx}
                  className="relative group bg-[#1e1e24] border border-[#2d2d34] rounded-md overflow-hidden cursor-pointer"
                  onClick={() => setLightboxImg(img.url)}
                >
                  <img
                    src={img.url}
                    alt={img.originalName || `Storyboard ${idx + 1}`}
                    className="w-full h-20 object-cover"
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors flex items-center justify-center">
                    <ZoomIn className="w-4 h-4 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              ))}
            </div>

            {/* Download ZIP button */}
            {images.length > 1 && (
              <button
                onClick={handleDownloadZip}
                disabled={isZipping}
                className="w-full py-2 rounded-md bg-white hover:bg-slate-200 text-black font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" />
                {isZipping ? "Zipping..." : "Download All as ZIP"}
              </button>
            )}
            {images.length === 1 && (
              <button
                onClick={handleDownloadZip}
                disabled={isZipping}
                className="w-full py-2 rounded-md bg-white hover:bg-slate-200 text-black font-bold text-xs transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" />
                {isZipping ? "Zipping..." : "Download as ZIP"}
              </button>
            )}
          </div>
        ) : (
          /* No images attached */
          <div className="bg-[#121214] border border-dashed border-[#2d2d34] rounded-md p-5 flex flex-col items-center justify-center gap-3 flex-1">
            <Eye className="w-10 h-10 stroke-1 text-slate-700" />
            <p className="text-xs font-medium text-slate-600 text-center">
              No storyboard images attached
            </p>
            <p className="text-[9px] text-slate-700 text-center leading-relaxed">
              The mangaka did not attach any storyboard images with this proposal.
            </p>
          </div>
        )}
      </div>

      {/* Lightbox */}
      {lightboxImg && (
        <div
          className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
          onClick={() => setLightboxImg(null)}
        >
          <button
            onClick={() => setLightboxImg(null)}
            className="absolute top-4 right-4 text-white hover:text-slate-300 cursor-pointer"
          >
            <X className="w-6 h-6" />
          </button>
          <img
            src={lightboxImg}
            alt="Storyboard full view"
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}

      {/* ── Right panel: Editor feedback + forward button (no reject) ── */}
      <div className="lg:col-span-4 flex flex-col gap-4">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-6 h-6 rounded-md bg-[#2d2d34] flex items-center justify-center shrink-0">
            <Brush className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <h2 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
            Editor's Decision
          </h2>
        </div>

        {/* Comment textarea */}
        <div className="flex-1 flex flex-col gap-2">
          <label className={LABEL} htmlFor="editor-comment">
            Editor's Comments <span className="text-red-500">*</span>
          </label>
          <textarea
            id="editor-comment"
            value={editorComment}
            onChange={(e) => setEditorComment(e.target.value)}
            rows={7}
            placeholder="Provide detailed feedback on plot coherence, visual style, target demographic fit, commercial viability…"
            className={`${INPUT} resize-none leading-relaxed flex-1`}
          />
          {!editorComment.trim() && (
            <p className="text-[9px] text-slate-700">
              A comment is required before forwarding.
            </p>
          )}
        </div>

        {/* Action buttons — only Forward, no Reject */}
        <div className="flex flex-col gap-2.5 pt-2">
          {/* Forward to Editorial Board — red accent */}
          <button
            onClick={handleForward}
            disabled={!editorComment.trim() || isLoading}
            className="w-full py-3 rounded-md bg-red-600 hover:bg-red-500 disabled:opacity-30 disabled:cursor-not-allowed text-sm font-bold text-white transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <ChevronRight className="w-4 h-4" />
            {isLoading ? "Processing…" : "Forward to Editorial Board"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Root component — orchestrates the two views and state transitions
// ─────────────────────────────────────────────────────────────────────────────

export default function TaskDelegation({
  currentUser,
  series,
  chapters,
  tasks,
  onRefreshAll,
  onSelectSeries,
  onSelectChapter,
  openProposalId,
  onOpenProposalHandled,
}: TaskDelegationProps) {
  // Toast status
  const [toast, setToast] = useState<{
    msg: string;
    type: "success" | "warn";
  } | null>(null);
  const showToast = (msg: string, type: "success" | "warn" = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Mangaka tab state: 'list' | 'new' | 'detail' | 'success'
  const [mangakaTab, setMangakaTab] = useState<
    "list" | "new" | "detail" | "success"
  >("list");
  const [selectedProposal, setSelectedProposal] = useState<any>(null);
  const [submittedProposal, setSubmittedProposal] =
    useState<ProposalDraft | null>(null);

  // Editor state
  const [proposalsList, setProposalsList] = useState<any[]>([]);
  const [loadingProposals, setLoadingProposals] = useState(false);
  const [selectedSeriesId, setSelectedSeriesId] = useState<string | null>(null);

  const isMangaka = currentUser.role === "MANGAKA";
  const isEditor =
    currentUser.role === "EDITOR" || currentUser.role === "BOARD_MEMBER";

  // Open the specific proposal detail view when arriving from a notification
  // click (the notification carries the proposal's _id in targetId).
  useEffect(() => {
    if (!openProposalId) return;
    let cancelled = false;
    apiClient.proposals
      .getById(openProposalId)
      .then((proposal) => {
        if (cancelled) return;
        if (proposal && proposal._id) {
          setSelectedProposal(proposal);
          setMangakaTab("detail");
        }
        onOpenProposalHandled?.();
      })
      .catch(() => {
        if (!cancelled) onOpenProposalHandled?.();
      });
    return () => {
      cancelled = true;
    };
  }, [openProposalId]);

  const fetchProposals = async () => {
    if (!isEditor) return;
    setLoadingProposals(true);
    try {
      const data = await apiClient.proposals.getAll();
      setProposalsList(data || []);
    } catch (err) {
      console.error("Failed to fetch proposals:", err);
    } finally {
      setLoadingProposals(false);
    }
  };

  useEffect(() => {
    fetchProposals();
  }, [currentUser]);

  const pendingProposals = proposalsList.filter(
    (p) =>
      p.status === "PENDING" ||
      p.status === "SUBMITTED" ||
      p.status === "UNDER_REVIEW" ||
      p.status === "RESUBMITTED",
  );
  const selectedProposalEditor =
    pendingProposals.find((p) => p._id === selectedSeriesId) ||
    pendingProposals[0] ||
    null;

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleMangakaSubmit = async (draft: ProposalDraft) => {
    if (!draft.storyboardFiles.length) {
      showToast("At least one storyboard file is required", "warn");
      return;
    }
    try {
      await apiClient.proposals.create(
        draft.title,
        draft.genre,
        draft.synopsis,
        draft.storyboardFiles,
      );
      setSubmittedProposal(draft);
      setMangakaTab("success");
      showToast("Proposal submitted successfully!", "success");
      onRefreshAll();
    } catch (err: any) {
      showToast(err.message || "Submission failed", "warn");
    }
  };

  const handleForward = async (comment: string) => {
    if (!selectedProposalEditor) return;
    try {
      await apiClient.proposals.forward(selectedProposalEditor._id, comment);

      const mangakaIdStr =
        typeof selectedProposalEditor.mangakaId === "object" &&
        selectedProposalEditor.mangakaId !== null
          ? (selectedProposalEditor.mangakaId as any)._id
          : selectedProposalEditor.mangakaId;

      await apiClient.notifications.create(
        mangakaIdStr,
        "Đề xuất Series mới đã được chuyển tiếp lên Board!",
        `Biên tập viên ${currentUser.name} đã chuyển tiếp đề xuất Series "${selectedProposalEditor.title}" của bạn lên Hội đồng để bỏ phiếu. Nhận xét: ${comment}`,
        "INFO",
        "PROPOSAL",
        selectedProposalEditor._id,
        `/editor/proposals/${selectedProposalEditor._id}`,
      );

      showToast(
        "Đã chuyển tiếp đề xuất lên Hội đồng biên tập và khởi tạo Voting Session.",
        "success",
      );
      fetchProposals();
      onRefreshAll();
      handleReset();
    } catch (err: any) {
      showToast(err.message || "Chuyển tiếp thất bại", "warn");
    }
  };

  const handleReset = () => {
    setSubmittedProposal(null);
    setSelectedSeriesId(null);
    setMangakaTab("list");
    setSelectedProposal(null);
  };

  const handleSelectProposal = (proposal: any) => {
    setSelectedProposal(proposal);
    setMangakaTab("detail");
  };

  const handleResubmitted = () => {
    setMangakaTab("list");
    setSelectedProposal(null);
    onRefreshAll();
  };

  // Map backend selectedProposalEditor to EditorView proposal input
  const activeProposal = selectedProposalEditor
    ? {
        _id: selectedProposalEditor._id,
        title: selectedProposalEditor.title,
        genre: selectedProposalEditor.genre || "Shonen",
        synopsis: selectedProposalEditor.synopsis,
        storyboardFiles: [],
        storyboardImages: selectedProposalEditor.storyboardImages || [],
        storyboardUrl: selectedProposalEditor.storyboardUrl,
        storyboardPreviewName:
          selectedProposalEditor.storyboardOriginalName || "storyboard.zip",
        storyboardPreviewSize: "N/A",
        submittedAt: selectedProposalEditor.submittedAt
          ? new Date(selectedProposalEditor.submittedAt).toLocaleString()
          : new Date().toLocaleString(),
        submittedBy:
          typeof selectedProposalEditor.mangakaId === "object" &&
          selectedProposalEditor.mangakaId !== null
            ? (selectedProposalEditor.mangakaId as any).name
            : "Unknown Mangaka",
      }
    : null;

  // ── Determine which content to show ───────────────────────────────────────
  const showEditorReview = isEditor && pendingProposals.length > 0;
  const showEditorEmpty = isEditor && pendingProposals.length === 0;

  return (
    /* Outer container — dark matte black shell, matching WorkspaceCanvas */
    <div className="min-h-[calc(100vh-8rem)] bg-[#121214] rounded-md border border-[#2d2d34] shadow-2xl shadow-black overflow-hidden flex flex-col">
      {/* ── Page header ── */}
      <header className="flex items-center justify-between px-6 py-4 bg-[#181820] border-b border-[#2d2d34] shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-md bg-red-600 flex items-center justify-center shrink-0">
            <BookOpen className="w-3.5 h-3.5 text-white" />
          </div>
          <div>
            <h1 className="text-[13px] font-bold text-white leading-none uppercase tracking-wide">
              Series Proposal{isEditor ? " — Review Queue" : ""}
            </h1>
            <p className="text-[10px] text-slate-500 mt-0.5">
              {currentUser.role} ·{" "}
              <span className="text-slate-400">{currentUser.name}</span>
            </p>
          </div>
        </div>

        {/* Toast status banner */}
        {toast && (
          <div
            className={`px-3 py-1.5 rounded-md text-xs font-semibold ${
              toast.type === "success"
                ? "bg-green-500/10 text-green-400 border border-green-500/20"
                : "bg-red-500/10 text-red-400 border border-red-500/20"
            }`}
          >
            {toast.msg}
          </div>
        )}

        {/* Role indicator badge */}
        <div
          className={`px-2.5 py-1 rounded-md border text-[10px] font-bold uppercase tracking-wider ${
            isMangaka
              ? "bg-[#2d2d34] border-[#3a3a44] text-slate-300"
              : "bg-red-600/10 border-red-600/20 text-red-400"
          }`}
        >
          {isMangaka ? "✏ Mangaka View" : "👁 Editor View"}
        </div>
      </header>

      {/* ── Main content ── */}
      <div className="flex-1 overflow-y-auto px-6 py-8">
        {/* ======================== MANGAKA VIEW ======================== */}
        {isMangaka && (
          <>
            {/* Tab switcher */}
            <div className="flex gap-1 mb-6 border-b border-[#2d2d34] pb-2">
              <button
                onClick={() => {
                  setMangakaTab("list");
                  setSelectedProposal(null);
                }}
                className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-t-md transition-colors cursor-pointer ${
                  mangakaTab === "list" || mangakaTab === "detail"
                    ? "bg-[#2d2d34] text-white border-b-2 border-red-500"
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                <List className="w-3.5 h-3.5" /> My Proposals
              </button>
              <button
                onClick={() => setMangakaTab("new")}
                className={`flex items-center gap-1.5 px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-t-md transition-colors cursor-pointer ${
                  mangakaTab === "new" || mangakaTab === "success"
                    ? "bg-[#2d2d34] text-white border-b-2 border-red-500"
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                <Plus className="w-3.5 h-3.5" /> New Proposal
              </button>
            </div>

            {/* Tab content */}
            {mangakaTab === "list" && (
              <MyProposalsList
                currentUser={currentUser}
                onSelectProposal={handleSelectProposal}
              />
            )}

            {mangakaTab === "detail" && selectedProposal && (
              <ProposalDetailView
                proposal={selectedProposal}
                currentUser={currentUser}
                onBack={() => {
                  setMangakaTab("list");
                  setSelectedProposal(null);
                }}
                onResubmitted={handleResubmitted}
              />
            )}

            {mangakaTab === "new" && (
              <MangakaView
                currentUser={currentUser}
                onSubmit={handleMangakaSubmit}
              />
            )}

            {mangakaTab === "success" && submittedProposal && (
              <MangakaSuccessView
                proposal={submittedProposal}
                onReset={() => {
                  setMangakaTab("new");
                  setSubmittedProposal(null);
                }}
              />
            )}
          </>
        )}

        {/* ======================== EDITOR VIEW ======================== */}
        {isEditor && showEditorReview && activeProposal && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full">
            {/* Sidebar list of pending proposals */}
            <div className="lg:col-span-3 bg-[#1e1e24] border border-[#2d2d34] rounded-md p-4 space-y-2 max-h-125 overflow-y-auto">
              <h3 className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">
                Pending Proposals
              </h3>
              {pendingProposals.map((s) => (
                <button
                  key={s._id}
                  onClick={() => setSelectedSeriesId(s._id)}
                  className={`w-full text-left px-3 py-2.5 rounded border transition-all ${
                    selectedSeriesId === s._id ||
                    (!selectedSeriesId && pendingProposals[0]?._id === s._id)
                      ? "bg-red-600/10 border-red-600/50 text-red-400 font-bold"
                      : "bg-[#121214] border-[#2d2d34] text-slate-400 hover:border-slate-500"
                  }`}
                >
                  <p className="text-xs truncate">{s.title}</p>
                  <p className="text-[9px] text-slate-500 mt-1 uppercase">
                    By{" "}
                    {typeof s.mangakaId === "object" && s.mangakaId !== null
                      ? (s.mangakaId as any).name
                      : "Author"}
                  </p>
                </button>
              ))}
            </div>

            {/* Review detail panel */}
            <div className="lg:col-span-9">
              <EditorView
                proposal={activeProposal}
                onForward={handleForward}
                onReset={() => {
                  setSelectedSeriesId(null);
                  fetchProposals();
                }}
              />
            </div>
          </div>
        )}

        {/* EDITOR: Empty state (no proposal in queue) */}
        {showEditorEmpty && (
          <div className="flex flex-col items-center justify-center gap-5 py-24 text-center">
            <div className="w-14 h-14 rounded-full bg-[#1e1e24] border border-[#2d2d34] flex items-center justify-center">
              <BookOpen className="w-7 h-7 stroke-1 text-slate-700" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-500">
                No proposals in queue
              </p>
              <p className="text-[11px] text-slate-700 mt-1">
                Waiting for a Mangaka to submit a new series proposal.
              </p>
            </div>
          </div>
        )}

        {/* Other roles (ASSISTANT) — informational placeholder */}
        {!isMangaka && !isEditor && (
          <div className="flex flex-col items-center justify-center gap-4 py-20 text-center">
            <AlertCircle className="w-10 h-10 stroke-1 text-slate-700" />
            <p className="text-sm text-slate-600">
              This section is available to Mangaka and Editor roles only.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
