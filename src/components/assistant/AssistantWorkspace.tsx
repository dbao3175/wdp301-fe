/**
 * AssistantWorkspace — Screen 2
 * Full-height 3-column workspace with AI tools
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  Download,
  Upload,
  Send,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Loader2,
  UploadCloud,
} from 'lucide-react';
import { AssistantTask, AIToolId } from './assistantTypes';
import { AI_TOOLS } from './assistantMockData';
import MangaPageCanvas from './MangaPageCanvas';

import { apiClient } from '../../api/client';
import { useLanguage } from '../../i18n/LanguageContext';

interface AssistantWorkspaceProps {
  activeTask: AssistantTask | null;
  onRefresh?: () => void;
}

const STATUS_COLORS: Record<string, string> = {
  ASSIGNED: 'bg-slate-700/50 text-slate-400',
  IN_PROGRESS: 'bg-blue-500/10 text-blue-400',
  REVISING: 'bg-amber-500/10 text-amber-400',
  SUBMITTED: 'bg-violet-500/10 text-violet-400',
  MANGAKA_APPROVED: 'bg-cyan-500/10 text-cyan-400',
  APPROVED: 'bg-green-500/10 text-green-400',
};

const APPLY_TO_OPTIONS = ['Full Page', 'Active Panel', 'Selected Region', 'Background Only'];

export default function AssistantWorkspace({ activeTask, onRefresh }: AssistantWorkspaceProps) {
  const { t } = useLanguage();
  if (!activeTask) {
    return (
      <div className="h-full flex items-center justify-center bg-[#121214] p-8">
        <div className="max-w-md text-center border border-[#2d2d34] bg-[#181820] rounded-lg p-8">
          <UploadCloud className="w-10 h-10 text-slate-600 mx-auto mb-3" />
          <h2 className="text-sm font-bold text-white">{t("No production task selected")}</h2>
          <p className="mt-2 text-[11px] text-slate-500 leading-relaxed">
            {t("Open an assigned task from Task Management to view its source page, work regions, and revision notes.")}
          </p>
        </div>
      </div>
    );
  }

  return <AssistantWorkspaceContent task={activeTask} onRefresh={onRefresh} />;
}

function AssistantWorkspaceContent({ task, onRefresh }: { task: AssistantTask; onRefresh?: () => void }) {
  const { language, t } = useLanguage();
  const [zoom, setZoom] = useState(1);
  const [expandedTool, setExpandedTool] = useState<AIToolId | null>(null);
  const [prompts, setPrompts] = useState<Record<AIToolId, string>>({
    sam: AI_TOOLS[0].defaultPrompt,
    yolo: AI_TOOLS[1].defaultPrompt,
  });
  const [strengths, setStrengths] = useState<Record<AIToolId, number>>({ sam: 70, yolo: 65 });
  const [applyTo, setApplyTo] = useState<Record<AIToolId, string>>({ sam: 'Full Page', yolo: 'Active Panel' });
  const [generating, setGenerating] = useState<AIToolId | null>(null);
  const [dropHover, setDropHover] = useState(false);
  const [submitToast, setSubmitToast] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const zoomIn = () => setZoom((z) => Math.min(2, z + 0.15));
  const zoomOut = () => setZoom((z) => Math.max(0.5, z - 0.15));
  const zoomReset = () => setZoom(1);

  const toggleTool = (id: AIToolId) => {
    setExpandedTool((prev) => (prev === id ? null : id));
  };

  const handleGenerate = (id: AIToolId) => {
    setGenerating(id);
    setTimeout(() => {
      setGenerating(null);
      setSubmitToast(t('{{tool}} generation complete', { tool: AI_TOOLS.find((tool) => tool.id === id)?.name || '' }));
      setTimeout(() => setSubmitToast(null), 2500);
    }, 1800);
  };

  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [showOriginal, setShowOriginal] = useState(false);

  useEffect(() => {
    setUploadedImageUrl(null);
    setShowOriginal(false);
    setSubmitToast(null);
  }, [task._id]);

  const isWorkLocked = ['SUBMITTED', 'MANGAKA_APPROVED', 'APPROVED'].includes(task.status);
  const supportResources = (task.pages || []).flatMap((page: any) =>
    Array.isArray(page?.resources) ? page.resources : [],
  );

  const handleFileUpload = async (file: File) => {
    if (isWorkLocked) return;
    if (!file.type.startsWith('image/')) {
      setSubmitToast(t('Only image files can be submitted for a manga page task'));
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setSubmitToast(t('The result image must not exceed 10 MB'));
      return;
    }

    try {
      setSubmitToast(t('Uploading {{file}}...', { file: file.name }));
      const res = await apiClient.files.upload(file, task.chapter || '');
      const url = res.fileUrl || res.data?.fileUrl || '';
      const firstPage = task.pages?.[0];
      const pageId = typeof firstPage === 'string' ? firstPage : firstPage?._id;
      if (!url || (!pageId && task.source !== 'ASSIGNMENT')) {
        throw new Error('This task has no valid page to receive the uploaded result');
      }

      if (task.source === 'ASSIGNMENT') {
        await apiClient.assignments.updateStatus(task._id, 'IN_PROGRESS');
      } else {
        await apiClient.assistant.uploadPageResult(pageId, url, `Result for ${task.title}`);
      }
      setUploadedImageUrl(url);
      setShowOriginal(false);
      setSubmitToast(t('Uploaded: {{file}}', { file: file.name }));
      onRefresh?.();
    } catch (err: any) {
      setSubmitToast(t('Upload failed: {{error}}', { error: t(err.message) }));
    }
  };

  const handleSubmit = async () => {
    if (isWorkLocked) return;
    const resultUrl = uploadedImageUrl || task.assistantImageUrl;
    if (!resultUrl || (task.status === 'REVISING' && !uploadedImageUrl)) {
      setSubmitToast(
        task.status === 'REVISING'
          ? t('Upload a revised result before resubmitting')
          : t('Upload your completed page result before submitting')
      );
      return;
    }
    try {
      if (task.source === 'ASSIGNMENT') {
        await apiClient.assignments.updateStatus(
          task._id,
          'SUBMITTED',
          `[RESULT_URL:${resultUrl}] Assistant completed the requested revision.`,
        );
      } else {
        await apiClient.tasks.submit(task._id, resultUrl);
      }
      setSubmitToast(t('Task "{{task}}" submitted for review', { task: task.title }));
      setTimeout(() => setSubmitToast(null), 2500);
      onRefresh?.();
    } catch (err: any) {
      setSubmitToast(t('Submission failed: {{error}}', { error: t(err.message) }));
      setTimeout(() => setSubmitToast(null), 3000);
    }
  };

  const onFileDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDropHover(false);
    const f = e.dataTransfer.files?.[0];
    if (f) handleFileUpload(f);
  };
  const handleDownloadImage = async () => {
    if (!task.imageUrl) {
      setSubmitToast(t('Source image not found for download'));
      return;
    }
    try {
      const cleanPath = task.imageUrl.startsWith('/') ? task.imageUrl.slice(1) : task.imageUrl;
      const fullUrl = task.imageUrl.startsWith('http')
        ? task.imageUrl
        : `${apiClient.getConfig().baseUrl}/${cleanPath}`;
      
      const response = await fetch(fullUrl);
      if (!response.ok) throw new Error('Download failed');
      
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `task-${task._id}.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (err: any) {
      setSubmitToast(t('Download failed: {{error}}', { error: t(err.message) }));
    }
  };

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Toast */}
      {submitToast && (
        <div className="absolute top-16 right-5 z-50 px-4 py-2 bg-[#2d2d34] border border-[#3a3a44] rounded-md text-[11px] text-white font-semibold shadow-lg animate-fadeIn">
          {submitToast}
        </div>
      )}

      {/* 3-column body — no scroll */}
      <div className="flex flex-1 overflow-hidden min-h-0">
        {/* Left panel — 256px */}
        <aside className="w-[256px] shrink-0 flex flex-col bg-[#1e1e24] border-r border-[#2d2d34] overflow-hidden">
          <div className="p-4 border-b border-[#2d2d34] shrink-0">
            <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest mb-2">{t("Task Metadata")}</p>
            <h2 className="text-[13px] font-bold text-white leading-snug">{task.title}</h2>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {[
              { label: 'Task ID', value: task._id },
              { label: 'Series', value: task.series },
              { label: 'Chapter', value: `${t('Chapter')} ${task.chapterNumber}` },
              { label: 'Type', value: t(task.type) },
              { label: 'Deadline', value: new Date(task.deadline).toLocaleDateString(language === 'vi' ? 'vi-VN' : 'en-US', { month: 'short', day: 'numeric', year: 'numeric' }) },
            ].map((field) => (
              <div key={field.label}>
                <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest mb-1">{t(field.label)}</p>
                <p className={`text-[11px] font-medium text-slate-300 ${field.label === 'Task ID' ? 'font-mono' : ''}`}>
                  {field.value}
                </p>
              </div>
            ))}

            <div>
              <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest mb-1">{t("Description")}</p>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                {task.description && task.description.startsWith('[IMAGE_URL:')
                  ? task.description.replace(/^\[IMAGE_URL:[^\]]+\]\s*/, '')
                  : task.description}
              </p>
            </div>
            {supportResources.length > 0 && (
              <div>
                <p className="mb-2 text-[9px] font-bold uppercase tracking-widest text-slate-600">
                  {t("Support resources")}
                </p>
                <div className="space-y-2">
                  {supportResources.map((resource: any, index: number) => {
                    const rawUrl = String(resource?.url || '');
                    const href = rawUrl.startsWith('http')
                      ? rawUrl
                      : apiClient.getConfig().baseUrl + '/' + rawUrl.replace(/^\//, '');
                    return (
                      <a
                        key={resource?._id || rawUrl || index}
                        href={href}
                        download
                        target="_blank"
                        rel="noreferrer"
                        className="flex items-center gap-2 rounded border border-[#3a3a44] bg-[#121214] px-2.5 py-2 text-[10px] font-bold text-slate-300 hover:border-red-500/60 hover:text-white"
                      >
                        <Download className="h-3.5 w-3.5 text-red-400" />
                        <span className="min-w-0 flex-1 truncate">{resource?.name || t("Resource") + ' ' + (index + 1)}</span>
                      </a>
                    );
                  })}
                </div>
              </div>
            )}

            {task.status === 'REVISING' && task.reviewNote && (
              <div className="rounded-md border border-amber-500/30 bg-amber-500/10 p-3">
                <p className="text-[9px] font-bold text-amber-400 uppercase tracking-widest mb-1">
                  {t("Revision requested")}
                </p>
                <p className="text-[11px] text-amber-100/80 leading-relaxed">{task.reviewNote}</p>
              </div>
            )}

            <div>
              <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest mb-2">{t("Status")}</p>
              <span className={`inline-block px-2 py-0.5 text-[9px] font-bold uppercase rounded-sm ${STATUS_COLORS[task.status] ?? ''}`}>
                {t(task.status.replace('_', ' '))}
              </span>
              <div className="mt-3">
                <div className="flex justify-between text-[9px] text-slate-600 mb-1">
                  <span>{t("Progress")}</span>
                  <span>{task.progress}%</span>
                </div>
                <div className="h-1.5 bg-[#121214] rounded-full overflow-hidden border border-[#2d2d34]">
                  <div
                    className="h-full bg-red-500 rounded-full transition-all"
                    style={{ width: `${task.progress}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* Center canvas */}
        <main className="flex-1 min-w-0 overflow-hidden">
          {/* Compute which image to display */}
          {(() => {
            const sourceImageUrl =
              task.imageUrl ||
              (task.description && task.description.startsWith('[IMAGE_URL:')
                ? task.description.match(/^\[IMAGE_URL:([^\]]+)\]/)?.[1]
                : undefined);

            // Prefer just-uploaded image, fall back to persisted assistantImageUrl
            const myWorkUrl = uploadedImageUrl || task.assistantImageUrl || '';
            const hasMyWork = !!(uploadedImageUrl || task.assistantImageUrl);
            const canvasImageUrl = showOriginal ? sourceImageUrl : (myWorkUrl || sourceImageUrl);

            return (
              <>
                {/* Image toggle bar — only visible when assistant has uploaded their own image */}
                {hasMyWork && (
                  <div className="flex items-center justify-center gap-2 px-4 py-1.5 bg-[#181820] border-b border-[#2d2d34] shrink-0">
                    <span className="text-[9px] font-bold uppercase tracking-widest text-slate-600">
                      {t("View")}:
                    </span>
                    <button
                      onClick={() => setShowOriginal(false)}
                      className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase transition-all cursor-pointer ${
                        !showOriginal
                          ? 'bg-white/10 border border-white/20 text-white'
                          : 'text-slate-500 hover:text-slate-300 border border-transparent'
                      }`}
                    >
                      {t("My Work")}
                    </button>
                    <button
                      onClick={() => setShowOriginal(true)}
                      className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase transition-all cursor-pointer ${
                        showOriginal
                          ? 'bg-white/10 border border-white/20 text-white'
                          : 'text-slate-500 hover:text-slate-300 border border-transparent'
                      }`}
                    >
                      {t("Original")}
                    </button>
                  </div>
                )}
                <MangaPageCanvas
                  zoom={zoom}
                  onZoomIn={zoomIn}
                  onZoomOut={zoomOut}
                  onZoomReset={zoomReset}
                  episodeLabel={`${t('Chapter')} ${task.chapterNumber} ? ${task.series}`}
                  regions={task.regions}
                  imageUrl={canvasImageUrl}
                  region={task.region}
                />
              </>
            );
          })()}
        </main>

        {/* Right panel — 268px */}
        <aside className="w-67 shrink-0 flex flex-col bg-[#1e1e24] border-l border-[#2d2d34] overflow-hidden">
          <div className="px-4 py-3 border-b border-[#2d2d34] shrink-0">
            <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-red-500" /> {t("AI Production Suite")}
            </h3>
            <p className="text-[9px] text-slate-500 mt-0.5">{t("Automated assist tools for manga creation")}</p>
          </div>

          <div className="flex-1 overflow-y-auto p-3 space-y-2">
            {AI_TOOLS.map((tool) => {
              const isExpanded = expandedTool === tool.id;
              const isGenerating = generating === tool.id;
              return (
                <div key={tool.id} className="border border-[#2d2d34] bg-[#121214] rounded-md overflow-hidden">
                  <button
                    onClick={() => toggleTool(tool.id)}
                    className="w-full flex items-center justify-between p-3 text-left hover:bg-[#1e1e24] transition-colors cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className={`w-7 h-7 rounded-md ${tool.bgColor} border ${tool.borderColor} flex items-center justify-center ${tool.color}`}>
                        <Sparkles className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <p className="text-[11px] font-bold text-white leading-none mb-0.5">{tool.name}</p>
                        <span className="text-[8px] font-mono text-slate-500 uppercase tracking-widest">{tool.badge}</span>
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-3.5 h-3.5 text-slate-600" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5 text-slate-600" />
                    )}
                  </button>

                  {isExpanded && (
                    <div className="px-3 pb-3 space-y-3 border-t border-[#2d2d34]/50 pt-3">
                      <p className="text-[9px] text-slate-500">{tool.description}</p>

                      <div>
                        <label className="text-[9px] font-bold text-slate-600 uppercase tracking-widest block mb-1">
                          {t("Prompt")}
                        </label>
                        <textarea
                          value={prompts[tool.id]}
                          onChange={(e) => setPrompts((p) => ({ ...p, [tool.id]: e.target.value }))}
                          rows={3}
                          className="w-full bg-[#121214] border border-[#2d2d34] rounded-md px-2 py-1.5 text-[10px] text-slate-300 resize-none focus:outline-none focus:border-red-500/40 font-mono"
                        />
                      </div>

                      <div>
                        <div className="flex justify-between mb-1">
                          <label className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">
                            {t("Strength")}
                          </label>
                          <span className="text-[9px] font-mono text-slate-500">{strengths[tool.id]}%</span>
                        </div>
                        <input
                          type="range"
                          min={10}
                          max={100}
                          value={strengths[tool.id]}
                          onChange={(e) => setStrengths((s) => ({ ...s, [tool.id]: Number(e.target.value) }))}
                          className="w-full accent-red-500"
                        />
                      </div>

                      <div>
                        <label className="text-[9px] font-bold text-slate-600 uppercase tracking-widest block mb-1">
                          {t("Apply To")}
                        </label>
                        <select
                          value={applyTo[tool.id]}
                          onChange={(e) => setApplyTo((a) => ({ ...a, [tool.id]: e.target.value }))}
                          className="w-full bg-[#121214] border border-[#2d2d34] text-[10px] text-slate-400 font-mono px-2 py-1.5 rounded-md focus:outline-none cursor-pointer"
                        >
                          {APPLY_TO_OPTIONS.map((o) => (
                            <option key={o} value={o}>{t(o)}</option>
                          ))}
                        </select>
                      </div>

                      <button
                        onClick={() => handleGenerate(tool.id)}
                        disabled={isGenerating}
                        className={`w-full flex items-center justify-center gap-2 py-2 rounded-md text-[10px] font-bold uppercase transition-all cursor-pointer disabled:opacity-60 ${tool.bgColor} ${tool.color} border ${tool.borderColor} hover:opacity-90`}
                      >
                        {isGenerating ? (
                          <><Loader2 className="w-3 h-3 animate-spin" /> {t("Generating...")}</>
                        ) : (
                          <><Sparkles className="w-3 h-3" /> {t("Auto Generate")}</>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </aside>
      </div>

      {/* Bottom action bar */}
      <footer className="shrink-0 flex items-center gap-3 px-4 py-3 bg-[#181820] border-t border-[#2d2d34]">
        <button
          onClick={handleDownloadImage}
          className="flex items-center gap-1.5 px-3 py-2 bg-[#2d2d34] hover:bg-[#3a3a44] border border-[#3a3a44] text-slate-400 hover:text-white text-[10px] font-bold uppercase rounded-md transition-all cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          {t("Download")}
        </button>

        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={isWorkLocked}
          title={isWorkLocked ? t("This task is waiting for review or already approved") : t("Upload result")}
          className="flex items-center gap-1.5 px-3 py-2 bg-[#2d2d34] hover:bg-[#3a3a44] disabled:opacity-40 disabled:cursor-not-allowed border border-[#3a3a44] text-slate-400 text-[10px] font-bold uppercase rounded-md transition-all cursor-pointer"
        >
          <Upload className="w-3.5 h-3.5" />
          {t("Upload")}
        </button>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) handleFileUpload(f);
          }}
        />

        <div
          onDragOver={(e) => { e.preventDefault(); setDropHover(true); }}
          onDragLeave={() => setDropHover(false)}
          onDrop={onFileDrop}
          onClick={() => !isWorkLocked && fileInputRef.current?.click()}
          className={`flex-1 flex items-center justify-center gap-2 py-2 border-2 border-dashed rounded-md cursor-pointer transition-all ${
            isWorkLocked
              ? 'border-[#2d2d34] text-slate-700 cursor-not-allowed'
              : dropHover
                ? 'border-red-500/50 bg-red-500/5 text-red-400'
                : 'border-[#2d2d34] text-slate-600 hover:border-slate-500 hover:text-slate-500'
          }`}
        >
          <UploadCloud className="w-4 h-4" />
          <span className="text-[10px] font-bold uppercase tracking-wide">
            {t("Drop files here or click to browse")}
          </span>
        </div>

        <button
          onClick={handleSubmit}
          disabled={isWorkLocked}
          className="flex items-center gap-1.5 px-5 py-2 bg-red-600 hover:bg-red-500 disabled:bg-slate-700 disabled:text-slate-500 disabled:cursor-not-allowed text-white text-[10px] font-bold uppercase rounded-md transition-all cursor-pointer shrink-0"
        >
          <Send className="w-3.5 h-3.5" />
          {task.status === 'REVISING' ? t("Resubmit Task") : isWorkLocked ? t("Waiting for Review") : t("Submit Task")}
        </button>
      </footer>
    </div>
  );
}
