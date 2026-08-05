import React, { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ArrowLeft,
  MessageSquarePlus,
  RotateCcw,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  Send,
  Clock,
} from "lucide-react";
import { apiClient } from "../../../api/client.ts";
import type {
  Proposal,
  ProposalStatus,
  ReviewCommentForm,
} from "../types/index.ts";
import {
  LoadingState,
  ErrorState,
  StatusBadge,
} from "../components/common/States.tsx";
import { Modal, ConfirmDialog } from "../components/common/Modal.tsx";
import { User } from "@/src/types.ts";
import StoryboardGallery from "../../../components/StoryboardGallery.tsx";

// =========================================================
// STATUS FLOW DISPLAY
// =========================================================

const STATUS_FLOW: ProposalStatus[] = [
  "SUBMITTED",
  "UNDER_REVIEW",
  "REVISION_REQUESTED",
  "RESUBMITTED",
  "APPROVED_BY_TANTOU",
  "SENT_TO_EDITORIAL_BOARD",
  "APPROVED",
  "SERIES_CREATED",
];

const STATUS_LABELS: Record<ProposalStatus, string> = {
  SUBMITTED: "Submitted",
  UNDER_REVIEW: "Under Review",
  REVISION_REQUESTED: "Revision Requested",
  RESUBMITTED: "Resubmitted",
  APPROVED_BY_TANTOU: "Tantou Approved",
  SENT_TO_EDITORIAL_BOARD: "Sent to Board",
  APPROVED: "Board Approved",
  SERIES_CREATED: "Series Created",
  REJECTED: "Rejected",
};

// =========================================================
// FORM SCHEMAS
// =========================================================

const commentSchema = z.object({
  content: z.string().min(5, "Comment must be at least 5 characters").max(500),
  isInternal: z.boolean(),
});

const revisionSchema = z.object({
  reason: z
    .string()
    .min(10, "Please provide a detailed reason (min 10 chars)")
    .max(500),
});

type CommentFormData = z.infer<typeof commentSchema>;
type RevisionFormData = z.infer<typeof revisionSchema>;

// =========================================================
// SAMPLE PAGE VIEWER
// =========================================================

interface SamplePageViewerProps {
  pages: {
    id: string;
    pageNumber: number;
    imageUrl: string;
    caption?: string;
  }[];
}

const SamplePageViewer: React.FC<SamplePageViewerProps> = ({ pages }) => {
  const [current, setCurrent] = useState(0);
  if (!pages.length)
    return (
      <p className="font-mono text-xs text-neutral-400">
        No sample pages available.
      </p>
    );

  return (
    <div className="space-y-2">
      <div className="relative border-2 border-ink-black overflow-hidden">
        <img
          src={pages[current].imageUrl}
          alt={`Sample page ${pages[current].pageNumber}`}
          className="w-full object-contain max-h-100"
        />
        {pages[current].caption && (
          <div className="absolute bottom-0 left-0 right-0 bg-ink-black/80 px-3 py-1.5">
            <p className="font-mono text-[10px] text-white">
              {pages[current].caption}
            </p>
          </div>
        )}
      </div>
      <div className="flex items-center justify-between">
        <button
          disabled={current === 0}
          onClick={() => setCurrent((c) => c - 1)}
          className="flex items-center gap-1 px-3 py-1.5 border-2 border-ink-black text-[10px] font-mono font-bold uppercase disabled:opacity-40 hover:bg-ink-black hover:text-white transition-colors cursor-pointer"
        >
          <ChevronLeft className="w-3 h-3" /> Prev
        </button>
        <span className="font-mono text-[10px] text-neutral-500">
          Page {current + 1} / {pages.length}
        </span>
        <button
          disabled={current === pages.length - 1}
          onClick={() => setCurrent((c) => c + 1)}
          className="flex items-center gap-1 px-3 py-1.5 border-2 border-ink-black text-[10px] font-mono font-bold uppercase disabled:opacity-40 hover:bg-ink-black hover:text-white transition-colors cursor-pointer"
        >
          Next <ChevronRight className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};

// =========================================================
// PROPOSAL REVIEW PAGE
// =========================================================

export const ProposalReviewPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [showCommentModal, setShowCommentModal] = useState(false);
  const [showRevisionModal, setShowRevisionModal] = useState(false);
  const [showApproveDialog, setShowApproveDialog] = useState(false);

  const mapProposal = (p: any) => ({
    id: p._id || p.id,
    title: p.title || "",
    synopsis: p.synopsis || "",
    genre: p.genre || "",
    tags: p.tags || [],
    mangaka: {
      id: p.mangakaId?._id || p.mangaka?.id || "",
      name: p.mangakaId?.name || p.mangaka?.name || "Unknown",
      avatar:
        p.mangaka?.avatar ||
        "https://api.dicebear.com/7.x/avataaars/svg?seed=default",
      email: p.mangakaId?.email || p.mangaka?.email || "",
      totalSeries: p.mangaka?.totalSeries || 0,
      joinedDate: p.mangaka?.joinedDate || "",
    },
    submittedDate: p.submittedAt || p.submittedDate || "",
    lastUpdated: p.lastUpdated || p.submittedAt || "",
    status: p.status || "",
    storyDraft: p.storyDraft || {
      description: p.synopsis || "",
      samplePages: [],
    },
    storyboardImages: p.storyboardImages || [],
    characterDesigns: p.characterDesigns || [],
    comments: p.comments || [],
    assignedEditorId: p.assignedEditorId || "",
    targetAudience: p.targetAudience || "",
    estimatedChapters: p.estimatedChapters || 0,
    scheduledFrequency: p.scheduledFrequency || "",
  });

  const {
    data: proposal,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["proposal", id],
    queryFn: () =>
      apiClient.proposals.getById(id!).then((data: any) => {
        return data ? mapProposal(data) : null;
      }),
    enabled: !!id,
  });

  const addCommentMutation = useMutation({
    mutationFn: (data: CommentFormData) =>
      apiClient.proposals.addComment(id!, data.content, data.isInternal),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proposal", id] });
      queryClient.invalidateQueries({ queryKey: ["proposals"] });
      setShowCommentModal(false);
      commentForm.reset();
    },
  });

  const revisionMutation = useMutation({
    mutationFn: (data: RevisionFormData) =>
      apiClient.proposals.requestRevision(id!, data.reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proposal", id] });
      queryClient.invalidateQueries({ queryKey: ["proposals"] });
      setShowRevisionModal(false);
    },
  });

  const approveMutation = useMutation({
    mutationFn: () =>
      apiClient.proposals.forward(
        id!,
        "Approved by Tantou, submitting to Editorial Board.",
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["proposal", id] });
      queryClient.invalidateQueries({ queryKey: ["proposals"] });
      setShowApproveDialog(false);
    },
    onError: (err: any) => {
      console.error("Failed to approve proposal:", err);
      setShowApproveDialog(false);
    },
  });

  const commentForm = useForm<CommentFormData>({
    resolver: zodResolver(commentSchema),
    defaultValues: { content: "", isInternal: false },
  });

  const revisionForm = useForm<RevisionFormData>({
    resolver: zodResolver(revisionSchema),
    defaultValues: { reason: "" },
  });

  if (isLoading) return <LoadingState message="Loading proposal..." />;
  if (error || !proposal) return <ErrorState message="Proposal not found" />;

  const currentStatusIdx = STATUS_FLOW.indexOf(proposal.status);
  const canTakeAction =
    proposal.status === "SUBMITTED" ||
    proposal.status === "UNDER_REVIEW" ||
    proposal.status === "RESUBMITTED";

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate("/editor/proposals")}
          className="flex items-center gap-1.5 px-3 py-2 bg-white border-2 border-ink-black text-xs font-mono font-bold uppercase shadow-[2px_2px_0px_#141414] hover:bg-neutral-50 transition-colors cursor-pointer shrink-0"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back
        </button>
        <div>
          <h1 className="font-syne font-extrabold text-xl text-ink-black tracking-tight">
            {proposal.title}
          </h1>
          <div className="flex items-center gap-2 mt-0.5">
            <StatusBadge
              label={STATUS_LABELS[proposal.status] ?? proposal.status}
              variant={
                proposal.status === "SENT_TO_EDITORIAL_BOARD" ||
                proposal.status === "APPROVED"
                  ? "sent"
                  : proposal.status === "APPROVED_BY_TANTOU"
                    ? "approved"
                    : proposal.status === "REVISION_REQUESTED"
                      ? "revision"
                      : proposal.status === "SUBMITTED" ||
                          proposal.status === "UNDER_REVIEW"
                        ? "under_review"
                        : "default"
              }
            />
            <span className="font-mono text-[9px] text-neutral-400">
              Last updated:{" "}
              {new Date(proposal.lastUpdated).toLocaleDateString()}
            </span>
          </div>
        </div>
      </div>

      {/* Status Flow Timeline */}
      <div className="bg-white border-2 border-ink-black shadow-[4px_4px_0px_#141414] p-5">
        <p className="font-mono text-[9px] font-extrabold uppercase tracking-widest text-neutral-500 mb-4">
          Status Flow
        </p>
        <div className="flex items-center overflow-x-auto">
          {STATUS_FLOW.filter((s) => s !== "REJECTED").map((status, idx) => {
            const isCurrent = status === proposal.status;
            const isDone = currentStatusIdx > idx;
            return (
              <React.Fragment key={status}>
                <div className="flex flex-col items-center gap-1 shrink-0">
                  <div
                    className={`w-4 h-4 border-2 transition-all ${
                      isDone
                        ? "bg-emerald-500 border-emerald-600"
                        : isCurrent
                          ? "bg-[#E63946] border-ink-black"
                          : "bg-white border-neutral-300"
                    }`}
                  />
                  <span
                    className={`font-mono text-[8px] uppercase font-bold text-center max-w-16 leading-tight ${
                      isCurrent
                        ? "text-[#E63946]"
                        : isDone
                          ? "text-emerald-600"
                          : "text-neutral-400"
                    }`}
                  >
                    {STATUS_LABELS[status]}
                  </span>
                </div>
                {idx <
                  STATUS_FLOW.filter((s) => s !== "REJECTED").length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-1 ${isDone ? "bg-emerald-400" : "bg-neutral-200"}`}
                  />
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT: Proposal Info */}
        <div className="lg:col-span-2 space-y-5">
          {/* Proposal Info Card */}
          <div className="bg-white border-2 border-ink-black shadow-[4px_4px_0px_#141414]">
            <div className="px-5 py-3 border-b-2 border-ink-black bg-ink-black">
              <h2 className="font-syne font-extrabold text-white text-xs uppercase tracking-widest">
                Proposal Information
              </h2>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="font-mono text-[9px] font-extrabold uppercase text-neutral-400 mb-1">
                    Genre
                  </p>
                  <span className="inline-block px-2 py-1 bg-ink-black text-white font-mono text-[10px] font-bold uppercase">
                    {proposal.genre}
                  </span>
                </div>
                <div>
                  <p className="font-mono text-[9px] font-extrabold uppercase text-neutral-400 mb-1">
                    Target Audience
                  </p>
                  <p className="font-sans text-xs text-ink-black font-medium">
                    {proposal.targetAudience}
                  </p>
                </div>
                <div>
                  <p className="font-mono text-[9px] font-extrabold uppercase text-neutral-400 mb-1">
                    Est. Chapters
                  </p>
                  <p className="font-syne font-extrabold text-lg text-ink-black">
                    {proposal.estimatedChapters}
                  </p>
                </div>
                <div>
                  <p className="font-mono text-[9px] font-extrabold uppercase text-neutral-400 mb-1">
                    Frequency
                  </p>
                  <p className="font-sans text-xs text-ink-black font-medium">
                    {proposal.scheduledFrequency}
                  </p>
                </div>
              </div>
              <div>
                <p className="font-mono text-[9px] font-extrabold uppercase text-neutral-400 mb-1">
                  Tags
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {proposal.tags.map((tag: string) => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 bg-neutral-100 border border-neutral-300 text-[10px] font-mono text-neutral-600 uppercase"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
              <div>
                <p className="font-mono text-[9px] font-extrabold uppercase text-neutral-400 mb-2">
                  Synopsis
                </p>
                <p className="font-sans text-sm text-ink-black leading-relaxed bg-neutral-50 border border-neutral-200 p-3">
                  {proposal.synopsis}
                </p>
              </div>
            </div>
          </div>

          {/* Story Draft */}
          <div className="bg-white border-2 border-ink-black shadow-[4px_4px_0px_#141414]">
            <div className="px-5 py-3 border-b-2 border-ink-black bg-ink-black">
              <h2 className="font-syne font-extrabold text-white text-xs uppercase tracking-widest">
                Story Draft
              </h2>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <p className="font-mono text-[9px] font-extrabold uppercase text-neutral-400 mb-2">
                  Description
                </p>
                <p className="font-sans text-sm text-ink-black leading-relaxed bg-neutral-50 border border-neutral-200 p-3">
                  {proposal.storyDraft.description}
                </p>
              </div>
              <div>
                <p className="font-mono text-[9px] font-extrabold uppercase text-neutral-400 mb-3">
                  Sample Pages ({proposal.storyDraft.samplePages.length})
                </p>
                <SamplePageViewer pages={proposal.storyDraft.samplePages} />
              </div>
              {proposal.storyboardImages.length > 0 && (
                <div>
                  <p className="font-mono text-[9px] font-extrabold uppercase text-neutral-400 mb-3">
                    Storyboard ({proposal.storyboardImages.length})
                  </p>
                  <StoryboardGallery images={proposal.storyboardImages} />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* RIGHT: Sidebar */}
        <div className="space-y-4">
          {/* Mangaka Info */}
          <div className="bg-white border-2 border-ink-black shadow-[4px_4px_0px_#141414]">
            <div className="px-4 py-3 border-b-2 border-ink-black bg-ink-black">
              <h3 className="font-syne font-extrabold text-white text-xs uppercase tracking-widest">
                Mangaka
              </h3>
            </div>
            <div className="p-4 flex items-start gap-3">
              <img
                src={proposal.mangaka.avatar}
                alt={proposal.mangaka.name}
                className="w-12 h-12 border-2 border-ink-black shrink-0"
              />
              <div>
                <p className="font-syne font-extrabold text-sm text-ink-black">
                  {proposal.mangaka.name}
                </p>
                <p className="font-mono text-[9px] text-neutral-400 mb-2">
                  {proposal.mangaka.email}
                </p>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[9px] text-neutral-500">
                    {proposal.mangaka.totalSeries} total series
                  </span>
                </div>
                <p className="font-mono text-[9px] text-neutral-400 mt-1">
                  Joined:{" "}
                  {new Date(proposal.mangaka.joinedDate).toLocaleDateString(
                    "en-US",
                    { month: "short", year: "numeric" },
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="bg-white border-2 border-ink-black shadow-[4px_4px_0px_#141414]">
            <div className="px-4 py-3 border-b-2 border-ink-black bg-ink-black">
              <h3 className="font-syne font-extrabold text-white text-xs uppercase tracking-widest">
                Actions
              </h3>
            </div>
            <div className="p-4 space-y-2">
              <button
                onClick={() => setShowCommentModal(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white text-ink-black border-2 border-ink-black text-xs font-mono font-extrabold uppercase shadow-[2px_2px_0px_#141414] hover:bg-neutral-50 transition-colors cursor-pointer"
              >
                <MessageSquarePlus className="w-3.5 h-3.5" />
                Add Review Comment
              </button>
              <button
                disabled={!canTakeAction}
                onClick={() => setShowRevisionModal(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-orange-500 text-white border-2 border-orange-600 text-xs font-mono font-extrabold uppercase shadow-[2px_2px_0px_#141414] hover:bg-orange-600 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Request Revision
              </button>
              <button
                disabled={!canTakeAction || approveMutation.isPending}
                onClick={() => setShowApproveDialog(true)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 text-white border-2 border-emerald-700 text-xs font-mono font-extrabold uppercase shadow-[2px_2px_0px_#141414] hover:bg-emerald-700 transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Approve & Submit to Board
              </button>
              {!canTakeAction && (
                <p className="text-[9px] font-mono text-neutral-400 text-center uppercase">
                  Actions locked — current status:{" "}
                  {STATUS_LABELS[proposal.status]}
                </p>
              )}
            </div>
          </div>

          {/* Review Comments */}
          <div className="bg-white border-2 border-ink-black shadow-[4px_4px_0px_#141414]">
            <div className="px-4 py-3 border-b-2 border-ink-black bg-ink-black flex items-center justify-between">
              <h3 className="font-syne font-extrabold text-white text-xs uppercase tracking-widest">
                Review Comments
              </h3>
              <span className="bg-neutral-700 text-white text-[9px] font-mono px-1.5 py-0.5">
                {proposal.comments.length}
              </span>
            </div>
            <div className="max-h-80 overflow-y-auto divide-y divide-neutral-100">
              {proposal.comments.length === 0 ? (
                <div className="p-4 text-center">
                  <p className="font-mono text-[10px] text-neutral-400 uppercase">
                    No comments yet
                  </p>
                </div>
              ) : (
                proposal.comments.map((comment: any, idx: number) => (
                  <div key={idx} className="p-3">
                    <div className="flex items-start gap-2">
                      <div
                        className={`w-7 h-7 border flex items-center justify-center text-[10px] font-mono font-bold uppercase shrink-0 ${
                          comment.authorRole === "editor"
                            ? "bg-blue-100 border-blue-300 text-blue-700"
                            : comment.authorRole === "board"
                              ? "bg-purple-100 border-purple-300 text-purple-700"
                              : "bg-neutral-100 border-neutral-300 text-neutral-700"
                        }`}
                      >
                        {comment.authorRole === "editor"
                          ? "E"
                          : comment.authorRole === "board"
                            ? "B"
                            : "M"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5 mb-0.5 flex-wrap">
                          <span className="font-mono text-[9px] font-bold text-ink-black">
                            {comment.authorName}
                          </span>
                          <span
                            className={`text-[8px] font-mono uppercase px-1 py-0.5 ${
                              comment.authorRole === "editor"
                                ? "bg-blue-100 text-blue-700"
                                : comment.authorRole === "board"
                                  ? "bg-purple-100 text-purple-700"
                                  : "bg-neutral-100 text-neutral-600"
                            }`}
                          >
                            {comment.authorRole}
                          </span>
                          {comment.isInternal && (
                            <span className="text-[8px] font-mono uppercase px-1 py-0.5 bg-yellow-100 text-yellow-700">
                              Internal
                            </span>
                          )}
                        </div>
                        <p className="font-sans text-xs text-neutral-700 leading-relaxed wrap-break-words">
                          {comment.content}
                        </p>
                        <p className="font-mono text-[9px] text-neutral-400 mt-1">
                          {new Date(
                            comment.createdAt || proposal.lastUpdated,
                          ).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ============ MODALS ============ */}

      {/* Add Comment Modal */}
      <Modal
        isOpen={showCommentModal}
        onClose={() => setShowCommentModal(false)}
        title="Add Review Comment"
        size="md"
      >
        <form
          onSubmit={commentForm.handleSubmit((data) =>
            addCommentMutation.mutate(data),
          )}
          className="space-y-4"
        >
          <div>
            <label className="block font-mono text-[9px] font-extrabold uppercase text-neutral-500 mb-1">
              Comment
            </label>
            <textarea
              {...commentForm.register("content")}
              rows={4}
              placeholder="Write your review comment..."
              className="w-full border-2 border-ink-black px-3 py-2 text-xs font-sans outline-none focus:border-[#E63946] resize-none"
            />
            {commentForm.formState.errors.content && (
              <p className="text-[10px] font-mono text-red-600 mt-0.5">
                {commentForm.formState.errors.content.message}
              </p>
            )}
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              {...commentForm.register("isInternal")}
              className="w-4 h-4 accent-ink-black"
            />
            <span className="font-mono text-[10px] font-bold uppercase text-neutral-600">
              Internal note (not visible to mangaka)
            </span>
          </label>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowCommentModal(false)}
              className="px-4 py-2 border-2 border-ink-black bg-white text-xs font-mono font-bold uppercase hover:bg-neutral-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={addCommentMutation.isPending}
              className="px-4 py-2 bg-ink-black text-white border-2 border-ink-black text-xs font-mono font-bold uppercase hover:bg-neutral-800 cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
            >
              <Send className="w-3 h-3" />
              {addCommentMutation.isPending ? "Posting..." : "Post Comment"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Request Revision Modal */}
      <Modal
        isOpen={showRevisionModal}
        onClose={() => setShowRevisionModal(false)}
        title="Request Revision"
        size="md"
      >
        <form
          onSubmit={revisionForm.handleSubmit((data) =>
            revisionMutation.mutate(data),
          )}
          className="space-y-4"
        >
          <p className="font-sans text-xs text-neutral-600">
            Provide specific feedback for the mangaka. This will change the
            proposal status to <strong>Revision Requested</strong>.
          </p>
          <div>
            <label className="block font-mono text-[9px] font-extrabold uppercase text-neutral-500 mb-1">
              Revision Reason
            </label>
            <textarea
              {...revisionForm.register("reason")}
              rows={4}
              placeholder="Explain what needs to be revised..."
              className="w-full border-2 border-ink-black px-3 py-2 text-xs font-sans outline-none focus:border-[#E63946] resize-none"
            />
            {revisionForm.formState.errors.reason && (
              <p className="text-[10px] font-mono text-red-600 mt-0.5">
                {revisionForm.formState.errors.reason.message}
              </p>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setShowRevisionModal(false)}
              className="px-4 py-2 border-2 border-ink-black bg-white text-xs font-mono font-bold uppercase hover:bg-neutral-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={revisionMutation.isPending}
              className="px-4 py-2 bg-orange-500 text-white border-2 border-orange-600 text-xs font-mono font-bold uppercase hover:bg-orange-600 cursor-pointer disabled:opacity-50 flex items-center gap-1.5"
            >
              <RotateCcw className="w-3 h-3" />
              {revisionMutation.isPending ? "Sending..." : "Request Revision"}
            </button>
          </div>
        </form>
      </Modal>

      {/* Approve Confirm Dialog */}
      <ConfirmDialog
        isOpen={showApproveDialog}
        onClose={() => setShowApproveDialog(false)}
        onConfirm={() => approveMutation.mutate()}
        title="Approve & Submit to Editorial Board"
        message={`Are you sure you want to approve "${proposal.title}" and submit it to the Editorial Board? This action will move the proposal to the Board for final review.`}
        confirmLabel="Approve & Submit"
        variant="default"
        loading={approveMutation.isPending}
      />

    </div>
  );
};