/**
 * TaskDelegation.tsx  →  SeriesProposalHub
 * ─────────────────────────────────────────────────────────────────────────────
 * Replaces the old task-assignment form with a two-mode
 * "New Series Proposal & Storyboard Review" workflow.
 *
 * MANGAKA VIEW  — Submission form (title, genre, synopsis, file upload)
 * EDITOR VIEW   — Dual-panel review layout with storyboard download card +
 *                 decision buttons
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
}

// ─────────────────────────────────────────────────────────────────────────────
// Internal proposal shape — mirrors what would go into the DB
// ─────────────────────────────────────────────────────────────────────────────

interface ProposalDraft {
  title: string;
  genre: string;
  synopsis: string;
  storyboardFile: File | null;
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
  const [file, setFile] = useState<File | null>(null);
  const [dropHover, setDropHover] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{
    text: string;
    ok: boolean;
  } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Accepted file types for storyboard archive
  const ACCEPTED = ".zip,.pdf,.png,.jpg,.jpeg,.psd,.clip";

  const handleFile = (f: File) => {
    setFile(f);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDropHover(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFile(f);
  };

  const handleRemoveFile = () => setFile(null);

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // ── Submit handler ────────────────────────────────────────────────────────
  // Placeholder for Axios multipart upload:
  //   const fd = new FormData();
  //   fd.append('title', title); fd.append('genre', genre);
  //   fd.append('synopsis', synopsis);
  //   if (file) fd.append('storyboard', file, file.name);
  //   await axios.post('/api/series/proposal', fd);
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !genre || !synopsis.trim() || !file) {
      setStatusMsg({
        text: "Please fill in all required fields and upload a storyboard file.",
        ok: false,
      });
      return;
    }

    setIsSubmitting(true);
    setStatusMsg(null);

    try {
      // ── Real API placeholder ──
      // await apiClient.proposals.create(
      //   title.trim(),
      //   genre.trim(),
      //   synopsis.trim(),
      //   file,
      // );

      // Optimistic local submit
      const draft: ProposalDraft = {
        title: title.trim(),
        genre,
        synopsis: synopsis.trim(),
        storyboardFile: file,
        storyboardPreviewName: file?.name ?? "",
        storyboardPreviewSize: file ? formatSize(file.size) : "",
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
              (Optional — .zip, .pdf, .png)
            </span>
          </label>

          {file ? (
            /* File attached state */
            <div className="flex items-center gap-3 px-3 py-2.5 rounded-md border border-[#2d2d34] bg-[#121214]">
              <div className="w-8 h-8 rounded-md bg-[#2d2d34] flex items-center justify-center shrink-0">
                <FileArchive className="w-4 h-4 text-slate-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm text-white font-medium truncate">
                  {file.name}
                </p>
                <p className="text-[9px] text-slate-600 font-mono">
                  {formatSize(file.size)}
                </p>
              </div>
              <button
                type="button"
                onClick={handleRemoveFile}
                title="Remove file"
                className="w-5 h-5 rounded-full bg-[#2d2d34] flex items-center justify-center text-slate-500 hover:text-red-400 transition-colors cursor-pointer shrink-0"
              >
                <X className="w-3 h-3" />
              </button>
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
            accept={ACCEPTED}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
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
// EDITOR VIEW — Download & Evaluation Layout
// ─────────────────────────────────────────────────────────────────────────────

function EditorView({
  proposal,
  onForward,
  onReject,
  onReset,
}: {
  proposal: ProposalDraft;
  onForward: (comment: string) => void;
  onReject: (comment: string) => void;
  onReset: () => void;
}) {
  const [editorComment, setEditorComment] = useState("");
  const [actionDone, setActionDone] = useState<"forwarded" | "rejected" | null>(
    null,
  );
  const [isLoading, setIsLoading] = useState(false);

  const handleDownload = async () => {
    if (proposal.storyboardFile) {
      const url = URL.createObjectURL(proposal.storyboardFile);
      const a = document.createElement("a");
      a.href = url;
      a.download = proposal.storyboardPreviewName;
      a.click();
      URL.revokeObjectURL(url);
      return;
    }

    if (!(proposal as any)._id) return;
    try {
      setIsLoading(true);
      const config = apiClient.getConfig();
      const url = `${config.baseUrl}/api/series/proposal/${(proposal as any)._id}/storyboard`;
      const headers: HeadersInit = {};
      const token = localStorage.getItem("mangaflow_token");
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
      const response = await fetch(url, { headers });
      if (!response.ok) throw new Error("Download failed");
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = proposal.storyboardPreviewName || "storyboard.zip";
      a.click();
      URL.revokeObjectURL(blobUrl);
    } catch (err: any) {
      console.error(err);
      alert("Failed to download storyboard");
    } finally {
      setIsLoading(false);
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

  const handleReject = async () => {
    if (!editorComment.trim()) return;
    setIsLoading(true);
    try {
      await onReject(editorComment);
      setActionDone("rejected");
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
        <div
          className={`w-14 h-14 rounded-full flex items-center justify-center ${
            actionDone === "forwarded" ? "bg-white/10" : "bg-red-500/10"
          }`}
        >
          {actionDone === "forwarded" ? (
            <CheckCircle2 className="w-7 h-7 text-white" />
          ) : (
            <XCircle className="w-7 h-7 text-red-400" />
          )}
        </div>
        <div>
          <h3 className="text-base font-bold text-white mb-1">
            {actionDone === "forwarded"
              ? "Forwarded to Publishing Board"
              : "Revision Requested"}
          </h3>
          <p className="text-[11px] text-slate-500">
            {actionDone === "forwarded"
              ? `"${proposal.title}" has been escalated to the Editorial Board.`
              : `"${proposal.title}" has been returned to ${proposal.submittedBy} with your feedback.`}
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

      {/* ── Center panel: Storyboard download card ── */}
      <div className="lg:col-span-3 flex flex-col gap-4">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-6 h-6 rounded-md bg-[#2d2d34] flex items-center justify-center shrink-0">
            <FileText className="w-3.5 h-3.5 text-slate-400" />
          </div>
          <h2 className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
            Storyboard File
          </h2>
        </div>

        {proposal.storyboardFile || proposal.storyboardPreviewName ? (
          /* ── File attachment card ── */
          <div className="bg-[#121214] border border-[#2d2d34] rounded-md p-5 flex flex-col items-center gap-4 flex-1">
            {/* File icon */}
            <div className="w-16 h-16 rounded-xl bg-[#1e1e24] border border-[#2d2d34] flex items-center justify-center">
              <FileArchive className="w-8 h-8 text-slate-500" />
            </div>

            {/* File info */}
            <div className="text-center">
              <p className="text-sm font-semibold text-white leading-snug break-all px-2">
                {proposal.storyboardPreviewName}
              </p>
              <p className="text-[10px] text-slate-600 font-mono mt-1">
                {proposal.storyboardPreviewSize}
              </p>
            </div>

            {/* Download button — white bg black text (spec requirement) */}
            <button
              onClick={handleDownload}
              className="w-full py-2.5 rounded-md bg-white hover:bg-slate-200 text-black font-bold text-sm transition-all cursor-pointer flex items-center justify-center gap-2 shadow-sm"
            >
              <Download className="w-4 h-4" />
              Download Storyboard Archive
            </button>

            <p className="text-[9px] text-slate-700 text-center">
              Review the complete storyboard before making a decision.
            </p>
          </div>
        ) : (
          /* No file attached */
          <div className="bg-[#121214] border border-dashed border-[#2d2d34] rounded-md p-5 flex flex-col items-center justify-center gap-3 flex-1">
            <Eye className="w-10 h-10 stroke-[1] text-slate-700" />
            <p className="text-xs font-medium text-slate-600 text-center">
              No storyboard attached
            </p>
            <p className="text-[9px] text-slate-700 text-center leading-relaxed">
              The mangaka did not attach a storyboard file with this proposal.
            </p>
          </div>
        )}
      </div>

      {/* ── Right panel: Editor feedback + decisions ── */}
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
              A comment is required before taking action.
            </p>
          )}
        </div>

        {/* Action buttons */}
        <div className="flex flex-col gap-2.5 pt-2">
          {/* Forward to Publishing Board — red accent */}
          <button
            onClick={handleForward}
            disabled={!editorComment.trim() || isLoading}
            className="w-full py-3 rounded-md bg-red-600 hover:bg-red-500 disabled:opacity-30 disabled:cursor-not-allowed text-sm font-bold text-white transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <ChevronRight className="w-4 h-4" />
            {isLoading ? "Processing…" : "Forward to Publishing Board"}
          </button>

          {/* Reject / Request Revision — dark slate */}
          <button
            onClick={handleReject}
            disabled={!editorComment.trim() || isLoading}
            className="w-full py-2.5 rounded-md bg-[#1e1e24] hover:bg-[#26262e] border border-[#3a3a44] hover:border-slate-600 disabled:opacity-30 disabled:cursor-not-allowed text-sm font-semibold text-white transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <XCircle className="w-4 h-4 text-slate-500" />
            Reject / Request Revision
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

  // Which view is active:
  //   null     = initial / pick a role
  //   'submit' = mangaka has submitted; editor is reviewing
  const [submittedProposal, setSubmittedProposal] =
    useState<ProposalDraft | null>(null);
  const [finalStatus, setFinalStatus] = useState<
    "forwarded" | "rejected" | null
  >(null);

  // Real backend pending proposal list for Editor
  const [proposalsList, setProposalsList] = useState<any[]>([]);
  const [loadingProposals, setLoadingProposals] = useState(false);
  const [selectedSeriesId, setSelectedSeriesId] = useState<string | null>(null);

  const isMangaka = currentUser.role === "MANGAKA";
  const isEditor =
    currentUser.role === "EDITOR" || currentUser.role === "BOARD_MEMBER";

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

  const pendingProposals = proposalsList.filter((p) => p.status === "PENDING");
  const selectedProposal =
    pendingProposals.find((p) => p._id === selectedSeriesId) ||
    pendingProposals[0] ||
    null;

  // ── Handlers ──────────────────────────────────────────────────────────────

  const handleMangakaSubmit = async (draft: ProposalDraft) => {
    if (!draft.storyboardFile) {
      showToast("Storyboard file is required", "warn");
      return;
    }
    try {
      await apiClient.proposals.create(
        draft.title,
        draft.genre,
        draft.synopsis,
        draft.storyboardFile,
      );
      setSubmittedProposal(draft);
      showToast("Proposal submitted successfully!", "success");
      onRefreshAll();
    } catch (err: any) {
      showToast(err.message || "Submission failed", "warn");
    }
  };

  const handleForward = async (comment: string) => {
    if (!selectedProposal) return;
    try {
      // 1. Update proposal status to FORWARDED
      await apiClient.proposals.forward(selectedProposal._id, comment);

      // The backend creates one idempotent voting submission.
      const mangakaIdStr =
        typeof selectedProposal.mangakaId === "object" &&
        selectedProposal.mangakaId !== null
          ? (selectedProposal.mangakaId as any)._id
          : selectedProposal.mangakaId;

      await apiClient.notifications.create(
        mangakaIdStr,
        "Đề xuất Series mới đã được chuyển tiếp lên Board!",
        `Biên tập viên ${currentUser.name} đã chuyển tiếp đề xuất Series "${selectedProposal.title}" của bạn lên Hội đồng để bỏ phiếu. Nhận xét: ${comment}`,
        "INFO",
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

  const handleReject = async (comment: string) => {
    if (!selectedProposal) return;
    try {
      await apiClient.proposals.reject(selectedProposal._id, comment);

      const mangakaIdStr =
        typeof selectedProposal.mangakaId === "object" &&
        selectedProposal.mangakaId !== null
          ? (selectedProposal.mangakaId as any)._id
          : selectedProposal.mangakaId;

      await apiClient.notifications.create(
        mangakaIdStr,
        "Yêu cầu chỉnh sửa đề xuất Series mới",
        `Biên tập viên ${currentUser.name} yêu cầu chỉnh sửa đề xuất Series "${selectedProposal.title}". Nhận xét: ${comment}`,
        "WARNING",
      );

      showToast("Đã từ chối đề xuất và gửi nhận xét cho tác giả.", "warn");
      fetchProposals();
      onRefreshAll();
      handleReset();
    } catch (err: any) {
      showToast(err.message || "Từ chối đề xuất thất bại", "warn");
    }
  };

  const handleReset = () => {
    setSubmittedProposal(null);
    setFinalStatus(null);
    setSelectedSeriesId(null);
  };

  // Map backend selectedProposal to EditorView proposal input
  const activeProposal = selectedProposal
    ? {
        _id: selectedProposal._id,
        title: selectedProposal.title,
        genre: selectedProposal.genre || "Shonen",
        synopsis: selectedProposal.synopsis,
        storyboardFile: null,
        storyboardPreviewName:
          selectedProposal.storyboardOriginalName || "storyboard.zip",
        storyboardPreviewSize: "N/A",
        submittedAt: selectedProposal.submittedAt
          ? new Date(selectedProposal.submittedAt).toLocaleString()
          : new Date().toLocaleString(),
        submittedBy:
          typeof selectedProposal.mangakaId === "object" &&
          selectedProposal.mangakaId !== null
            ? (selectedProposal.mangakaId as any).name
            : "Unknown Mangaka",
      }
    : null;

  // ── Determine which content to show ───────────────────────────────────────
  const showMangakaForm = isMangaka && !submittedProposal;
  const showMangakaSuccess = isMangaka && !!submittedProposal;
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
              Series Proposal{isEditor ? " — Review Queue" : " — Submission"}
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
        {/* MANGAKA: Submission form */}
        {showMangakaForm && (
          <MangakaView
            currentUser={currentUser}
            onSubmit={handleMangakaSubmit}
          />
        )}

        {/* MANGAKA: Post-submit confirmation */}
        {showMangakaSuccess && (
          <div className="max-w-lg mx-auto flex flex-col items-center gap-6 py-16 text-center">
            <div className="w-16 h-16 rounded-full bg-white/8 border border-white/15 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white mb-2">
                Proposal Submitted!
              </h2>
              <p className="text-sm text-slate-400 leading-relaxed">
                <span className="text-white font-semibold">
                  "{submittedProposal!.title}"
                </span>{" "}
                has been sent to the Tantou Editor for review.
                {submittedProposal!.storyboardPreviewName && (
                  <>
                    {" "}
                    The storyboard archive{" "}
                    <span className="text-white font-medium">
                      {submittedProposal!.storyboardPreviewName}
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
                <p className="text-sm text-white font-semibold">
                  {submittedProposal!.title}
                </p>
              </div>
              <div>
                <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest mb-0.5">
                  Genre
                </p>
                <p className="text-sm text-white">{submittedProposal!.genre}</p>
              </div>
              {submittedProposal!.storyboardPreviewName && (
                <div>
                  <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest mb-0.5">
                    Attachment
                  </p>
                  <p className="text-sm text-white font-mono">
                    {submittedProposal!.storyboardPreviewName} (
                    {submittedProposal!.storyboardPreviewSize})
                  </p>
                </div>
              )}
            </div>

            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 px-5 py-2.5 rounded-md border border-[#2d2d34] text-sm font-medium text-slate-400 hover:text-white hover:border-slate-500 transition-all cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" /> Submit Another Proposal
            </button>
          </div>
        )}

        {/* EDITOR: Review layout with real proposals */}
        {showEditorReview && activeProposal && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 w-full">
            {/* Sidebar list of pending proposals */}
            <div className="lg:col-span-3 bg-[#1e1e24] border border-[#2d2d34] rounded-md p-4 space-y-2 max-h-[500px] overflow-y-auto">
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
                onReject={handleReject}
                onReset={handleReset}
              />
            </div>
          </div>
        )}

        {/* EDITOR: Empty state (no proposal in queue) */}
        {showEditorEmpty && (
          <div className="flex flex-col items-center justify-center gap-5 py-24 text-center">
            <div className="w-14 h-14 rounded-full bg-[#1e1e24] border border-[#2d2d34] flex items-center justify-center">
              <BookOpen className="w-7 h-7 stroke-[1] text-slate-700" />
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
            <AlertCircle className="w-10 h-10 stroke-[1] text-slate-700" />
            <p className="text-sm text-slate-600">
              This section is available to Mangaka and Editor roles only.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
