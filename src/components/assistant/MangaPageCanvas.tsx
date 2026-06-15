/**
 * MangaPageCanvas — zoomable manga page mockup (matches Mangaka workspace)
 */

import React from 'react';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

interface MangaPageCanvasProps {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
  episodeLabel?: string;
}

export default function MangaPageCanvas({
  zoom,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  episodeLabel = 'Page 04 · Ep. 12',
}: MangaPageCanvasProps) {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Canvas toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-[#181820] border-b border-[#2d2d34] shrink-0">
        <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
          Manga Canvas
        </span>
        <div className="flex items-center gap-1">
          <button
            onClick={onZoomOut}
            className="p-1.5 rounded-md hover:bg-[#2d2d34] text-slate-500 hover:text-white transition-colors cursor-pointer"
            title="Zoom out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="text-[10px] font-mono text-slate-500 w-10 text-center">
            {Math.round(zoom * 100)}%
          </span>
          <button
            onClick={onZoomIn}
            className="p-1.5 rounded-md hover:bg-[#2d2d34] text-slate-500 hover:text-white transition-colors cursor-pointer"
            title="Zoom in"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onZoomReset}
            className="p-1.5 rounded-md hover:bg-[#2d2d34] text-slate-500 hover:text-white transition-colors cursor-pointer ml-1"
            title="Reset zoom"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Zoomable viewport */}
      <div className="flex-1 flex items-center justify-center bg-[#121214] overflow-hidden">
        <div
          className="transition-transform duration-200 origin-center"
          style={{ transform: `scale(${zoom})` }}
        >
          <div
            className="relative rounded-md overflow-hidden border border-[#2d2d34] shadow-2xl shadow-black"
            style={{ width: '320px', aspectRatio: '3/4' }}
          >
            <div className="absolute inset-0 bg-[#181820] flex flex-col">
              <div className="flex-1 grid grid-rows-3 divide-y divide-[#2d2d34]">
                <div className="grid grid-cols-5 divide-x divide-[#2d2d34]">
                  <div className="col-span-3 bg-[#1e1e24] relative overflow-hidden flex items-end p-2">
                    <svg
                      className="absolute inset-0 w-full h-full opacity-[0.07]"
                      viewBox="0 0 100 100"
                      preserveAspectRatio="none"
                    >
                      {Array.from({ length: 12 }).map((_, i) => (
                        <line
                          key={i}
                          x1="50"
                          y1="50"
                          x2={i * 9}
                          y2="0"
                          stroke="#e2e8f0"
                          strokeWidth="0.5"
                        />
                      ))}
                    </svg>
                    <span className="relative text-[7px] text-slate-700 font-bold uppercase tracking-wider">
                      Panel 1
                    </span>
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
                    <span className="relative text-[7px] text-slate-700 font-bold uppercase tracking-wider">
                      Panel 2
                    </span>
                  </div>
                  <div className="bg-[#121214] relative p-2 flex items-end justify-end">
                    <span className="text-[7px] text-slate-700 font-bold uppercase tracking-wider">
                      Panel 3
                    </span>
                  </div>
                </div>
                <div className="bg-[#181820] relative flex items-end p-2">
                  <svg
                    className="absolute inset-0 w-full h-full opacity-[0.05]"
                    viewBox="0 0 200 60"
                    preserveAspectRatio="none"
                  >
                    {Array.from({ length: 10 }).map((_, i) => (
                      <line
                        key={i}
                        x1={i * 22}
                        y1="0"
                        x2={i * 22 + 11}
                        y2="60"
                        stroke="#e2e8f0"
                        strokeWidth="1"
                      />
                    ))}
                  </svg>
                  <span className="relative text-[7px] text-slate-700 font-bold uppercase tracking-wider">
                    {episodeLabel}
                  </span>
                </div>
              </div>
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <span className="text-3xl font-black opacity-[0.025] select-none rotate-[-18deg] uppercase tracking-widest text-white">
                  WORKSPACE
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
