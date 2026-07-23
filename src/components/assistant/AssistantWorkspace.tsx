/**
 * AssistantWorkspace — Screen 2
 * Full-height 3-column workspace with AI tools
 */

import React, { useRef, useState } from 'react';
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
import { AI_TOOLS, ASSIGNED_TASKS } from './assistantMockData';
import MangaPageCanvas from './MangaPageCanvas';

import { apiClient } from '../../api/client';

interface AssistantWorkspaceProps {
  activeTask: AssistantTask | null;
  onRefresh?: () => void;
}

const STATUS_COLORS: Record<string, string> = {
  ASSIGNED: 'bg-slate-700/50 text-slate-400',
  IN_PROGRESS: 'bg-blue-500/10 text-blue-400',
  REVISING: 'bg-amber-500/10 text-amber-400',
  SUBMITTED: 'bg-violet-500/10 text-violet-400',
  APPROVED: 'bg-green-500/10 text-green-400',
};

const APPLY_TO_OPTIONS = ['Full Page', 'Active Panel', 'Selected Region', 'Background Only'];

export default function AssistantWorkspace({ activeTask, onRefresh }: AssistantWorkspaceProps) {
  const task = activeTask ?? ASSIGNED_TASKS[0];

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
      setSubmitToast(`${AI_TOOLS.find((t) => t.id === id)?.name} generation complete`);
      setTimeout(() => setSubmitToast(null), 2500);
    }, 1800);
  };

  const [uploadedImageUrl, setUploadedImageUrl] = useState<string | null>(null);
  const [showOriginal, setShowOriginal] = useState(false);

  const handleFileUpload = async (file: File) => {
    try {
      setSubmitToast(`Uploading ${file.name}...`);
      const res = await apiClient.files.upload(file, task.chapter || '');
      const url = res.fileUrl || res.data?.fileUrl || '';
      setUploadedImageUrl(url);
      setShowOriginal(false);
      setSubmitToast(`Uploaded: ${file.name}`);
    } catch (err: any) {
      setSubmitToast(`Upload failed: ${err.message}`);
    }
  };

  const handleSubmit = async () => {
    if (!task) return;
    try {
      await apiClient.tasks.submit(task._id, uploadedImageUrl || undefined);
      setSubmitToast(`Task "${task.title}" submitted for review`);
      setTimeout(() => setSubmitToast(null), 2500);
      if (onRefresh) onRefresh();
    } catch (err: any) {
      setSubmitToast(`Submission failed: ${err.message}`);
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
      setSubmitToast('Không tìm thấy ảnh bản thảo để tải về');
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
      setSubmitToast(`Download failed: ${err.message}`);
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
            <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest mb-2">Task Metadata</p>
            <h2 className="text-[13px] font-bold text-white leading-snug">{task.title}</h2>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {[
              { label: 'Task ID', value: task._id },
              { label: 'Series', value: task.series },
              { label: 'Chapter', value: `Ch. ${task.chapterNumber}` },
              { label: 'Type', value: task.type },
              { label: 'Deadline', value: new Date(task.deadline).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) },
            ].map((field) => (
              <div key={field.label}>
                <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest mb-1">{field.label}</p>
                <p className={`text-[11px] font-medium text-slate-300 ${field.label === 'Task ID' ? 'font-mono' : ''}`}>
                  {field.value}
                </p>
              </div>
            ))}

            <div>
              <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest mb-1">Description</p>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                {task.description && task.description.startsWith('[IMAGE_URL:')
                  ? task.description.replace(/^\[IMAGE_URL:[^\]]+\]\s*/, '')
                  : task.description}
              </p>
            </div>

            <div>
              <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest mb-2">Status</p>
              <span className={`inline-block px-2 py-0.5 text-[9px] font-bold uppercase rounded-sm ${STATUS_COLORS[task.status] ?? ''}`}>
                {task.status.replace('_', ' ')}
              </span>
              <div className="mt-3">
                <div className="flex justify-between text-[9px] text-slate-600 mb-1">
                  <span>Progress</span>
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
                      View:
                    </span>
                    <button
                      onClick={() => setShowOriginal(false)}
                      className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase transition-all cursor-pointer ${
                        !showOriginal
                          ? 'bg-white/10 border border-white/20 text-white'
                          : 'text-slate-500 hover:text-slate-300 border border-transparent'
                      }`}
                    >
                      My Work
                    </button>
                    <button
                      onClick={() => setShowOriginal(true)}
                      className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase transition-all cursor-pointer ${
                        showOriginal
                          ? 'bg-white/10 border border-white/20 text-white'
                          : 'text-slate-500 hover:text-slate-300 border border-transparent'
                      }`}
                    >
                      Original
                    </button>
                  </div>
                )}
                <MangaPageCanvas
                  zoom={zoom}
                  onZoomIn={zoomIn}
                  onZoomOut={zoomOut}
                  onZoomReset={zoomReset}
                  episodeLabel={`Ch. ${task.chapterNumber} · ${task.series}`}
                  imageUrl={canvasImageUrl}
                  region={task.region}
                />
              </>
            );
          })()}
        </main>

        {/* Right panel — 268px */}
        <aside className="w-[268px] shrink-0 flex flex-col bg-[#1e1e24] border-l border-[#2d2d34] overflow-hidden">
          <div className="px-4 py-3 border-b border-[#2d2d34] shrink-0">
            <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-red-500" /> AI Production Suite
            </h3>
            <p className="text-[9px] text-slate-500 mt-0.5">Automated assist tools for manga creation</p>
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
                          Prompt
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
                            Strength
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
                          Apply To
                        </label>
                        <select
                          value={applyTo[tool.id]}
                          onChange={(e) => setApplyTo((a) => ({ ...a, [tool.id]: e.target.value }))}
                          className="w-full bg-[#121214] border border-[#2d2d34] text-[10px] text-slate-400 font-mono px-2 py-1.5 rounded-md focus:outline-none cursor-pointer"
                        >
                          {APPLY_TO_OPTIONS.map((o) => (
                            <option key={o} value={o}>{o}</option>
                          ))}
                        </select>
                      </div>

                      <button
                        onClick={() => handleGenerate(tool.id)}
                        disabled={isGenerating}
                        className={`w-full flex items-center justify-center gap-2 py-2 rounded-md text-[10px] font-bold uppercase transition-all cursor-pointer disabled:opacity-60 ${tool.bgColor} ${tool.color} border ${tool.borderColor} hover:opacity-90`}
                      >
                        {isGenerating ? (
                          <><Loader2 className="w-3 h-3 animate-spin" /> Generating…</>
                        ) : (
                          <><Sparkles className="w-3 h-3" /> Auto Generate</>
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
          Download
        </button>

        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center gap-1.5 px-3 py-2 bg-[#2d2d34] hover:bg-[#3a3a44] border border-[#3a3a44] text-slate-400 text-[10px] font-bold uppercase rounded-md transition-all cursor-pointer"
        >
          <Upload className="w-3.5 h-3.5" />
          Upload
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
          onClick={() => fileInputRef.current?.click()}
          className={`flex-1 flex items-center justify-center gap-2 py-2 border-2 border-dashed rounded-md cursor-pointer transition-all ${
            dropHover
              ? 'border-red-500/50 bg-red-500/5 text-red-400'
              : 'border-[#2d2d34] text-slate-600 hover:border-slate-500 hover:text-slate-500'
          }`}
        >
          <UploadCloud className="w-4 h-4" />
          <span className="text-[10px] font-bold uppercase tracking-wide">
            Drop files here or click to browse
          </span>
        </div>

        <button
          onClick={handleSubmit}
          className="flex items-center gap-1.5 px-5 py-2 bg-red-600 hover:bg-red-500 text-white text-[10px] font-bold uppercase rounded-md transition-all cursor-pointer shrink-0"
        >
          <Send className="w-3.5 h-3.5" />
          Submit Task
        </button>
      </footer>
    </div>
  );
}
