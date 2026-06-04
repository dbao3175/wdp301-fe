import React, { useState, useRef, useEffect } from 'react';
import { User, Series, Chapter, Task } from '../types';
import { apiClient } from '../api/client';
import { Plus, Check, Paintbrush, Scissors, MessageSquare, AlertCircle, Sparkles, Send, Trash2, ArrowRight } from 'lucide-react';

interface WorkspaceCanvasProps {
  currentUser: User;
  activeSeries: Series | null;
  activeChapter: Chapter | null;
  onRefreshTasks: () => void;
}

interface MangaRegion {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
  type: 'panel' | 'bubble' | 'character';
  label: string;
  assignedTo?: string;
  status?: 'PENDING' | 'COMPLETED';
}

interface EditorialNote {
  id: string;
  x: number;
  y: number;
  comment: string;
  createdAt: string;
}

export default function WorkspaceCanvas({ currentUser, activeSeries, activeChapter, onRefreshTasks }: WorkspaceCanvasProps) {
  // Canvas configuration
  const containerRef = useRef<HTMLDivElement>(null);
  const [regions, setRegions] = useState<MangaRegion[]>([
    { id: 'r1', x: 20, y: 20, width: 280, height: 180, type: 'panel', label: 'Intro Splash Landscape', assignedTo: 'u2', status: 'PENDING' },
    { id: 'r2', x: 20, y: 210, width: 130, height: 260, type: 'panel', label: 'Speech Bubble Close Range', assignedTo: 'u3', status: 'PENDING' },
    { id: 'r3', x: 160, y: 210, width: 140, height: 120, type: 'bubble', label: 'Dialogue Box Main Dialogue', assignedTo: 'u2', status: 'COMPLETED' },
  ]);

  const [editorialNotes, setEditorialNotes] = useState<EditorialNote[]>([]);
  const pageId = activeChapter ? activeChapter._id : 'c1';

  useEffect(() => {
    const loadAnnotations = async () => {
      try {
        const list = await apiClient.annotations.getForPage(pageId);
        const mapped: EditorialNote[] = list.map((a: any) => ({
          id: a._id || a.id,
          x: a.coords?.x || 0,
          y: a.coords?.y || 0,
          comment: a.content || '',
          createdAt: a.createdAt ? new Date(a.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : new Date().toLocaleTimeString()
        }));
        setEditorialNotes(mapped);
      } catch (err) {
        console.error("Failed to load annotations:", err);
      }
    };
    loadAnnotations();
  }, [activeChapter]);

  // Drawing state for Manga Regions (Mangaka)
  const [isDrawing, setIsDrawing] = useState(false);
  const [startPos, setStartPos] = useState({ x: 0, y: 0 });
  const [currentBox, setCurrentBox] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [newRegionType, setNewRegionType] = useState<'panel' | 'bubble' | 'character'>('panel');
  const [newRegionLabel, setNewRegionLabel] = useState('');
  const [selectedAssistant, setSelectedAssistant] = useState('u2'); // Default to Kenji Sato
  
  // Editorial state
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [pendingNoteText, setPendingNoteText] = useState('');
  const [clickCoord, setClickCoord] = useState({ x: 0, y: 0 });

  // Assistant interactive state
  const [selectedRegionId, setSelectedRegionId] = useState<string | null>(null);
  const [brushColor, setBrushColor] = useState('#3B82F6');
  const [assistantColoredRegions, setAssistantColoredRegions] = useState<Record<string, string>>({});
  const [isColoringMode, setIsColoringMode] = useState(false);

  // AI Simulated Processing States
  const [isAISegmenting, setIsAISegmenting] = useState(false);
  const [isAIColoring, setIsAIColoring] = useState(false);
  const [colorFilter, setColorFilter] = useState<'bw' | 'ai-colored'>('bw');

  // Trigger tasks refresh inside parent when state changes
  const [assistantsList, setAssistantsList] = useState<User[]>([]);
  const [canvasError, setCanvasError] = useState('');
  useEffect(() => {
    const fetchAssistants = async () => {
      try {
        const fetched = await apiClient.users.getAll('ASSISTANT');
        setAssistantsList(fetched);
        if (fetched.length > 0) {
          if (!fetched.some(a => a._id === selectedAssistant)) {
            setSelectedAssistant(fetched[0]._id);
          }
        }
      } catch (err) {
        console.error("Failed to load assistants in WorkspaceCanvas:", err);
        const users = JSON.parse(localStorage.getItem('m_users') || '[]');
        setAssistantsList(users.filter((u: any) => u.role === 'ASSISTANT'));
      }
    };
    fetchAssistants();
  }, []);

  // Handle click-and-drag mouse drawing for MANGAKA
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (currentUser.role !== 'MANGAKA' || isAddingNote) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    setStartPos({ x, y });
    setIsDrawing(true);
    setCurrentBox({ x, y, width: 0, height: 0 });
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDrawing || !currentBox) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const left = Math.min(startPos.x, x);
    const top = Math.min(startPos.y, y);
    const width = Math.abs(startPos.x - x);
    const height = Math.abs(startPos.y - y);

    setCurrentBox({ x: left, y: top, width, height });
  };

  const handleMouseUp = () => {
    if (!isDrawing) return;
    setIsDrawing(false);
    if (currentBox && (currentBox.width < 15 || currentBox.height < 15)) {
      setCurrentBox(null); // Too small, reset
    }
  };

  // Create workspace task out of the drawn region
  const handleCreateRegionTask = async () => {
    if (!currentBox || !newRegionLabel) return;
    setCanvasError('');
    
    // Assign in mock backend
    const targetSid = activeSeries?._id || 's1';
    const targetCid = activeChapter?._id || 'c1';

    const isLive = apiClient.getConfig().useLiveBackend;
    if (isLive) {
      const isValidObjectId = (id: string) => /^[0-9a-fA-F]{24}$/.test(id);
      if (!targetSid || !isValidObjectId(targetSid)) {
        setCanvasError('❌ Chưa gán Series hợp lệ (24 ký tự Hex). Vui lòng chọn Series khác hoặc tạo mới.');
        return;
      }
      if (!targetCid || !isValidObjectId(targetCid)) {
        setCanvasError('❌ Chưa có Chapter hợp lệ (24 ký tự Hex). Vui lòng tạo Chapter trước trong tab Production Tracker.');
        return;
      }
      if (!selectedAssistant || !isValidObjectId(selectedAssistant)) {
        setCanvasError('❌ Chưa có Trợ lý (ASSISTANT) thực tế. Hãy đăng xuất và đăng ký một tài khoản Assistant để gán việc!');
        return;
      }
    }
    
    try {
      const newTask = await apiClient.tasks.create(
        targetSid,
        targetCid,
        selectedAssistant,
        `Process Segment: ${newRegionLabel} (${newRegionType})`,
        {
          x: Math.round(currentBox.x),
          y: Math.round(currentBox.y),
          width: Math.round(currentBox.width),
          height: Math.round(currentBox.height),
          type: newRegionType
        }
      );

      const newMangaRegion: MangaRegion = {
        id: newTask?._id || `r_${Date.now()}`,
        x: currentBox.x,
        y: currentBox.y,
        width: currentBox.width,
        height: currentBox.height,
        type: newRegionType,
        label: newRegionLabel,
        assignedTo: selectedAssistant,
        status: 'PENDING'
      };

      setRegions([...regions, newMangaRegion]);
      setCurrentBox(null);
      setNewRegionLabel('');
      setCanvasError('');
      onRefreshTasks();
    } catch (err: any) {
      setCanvasError(`❌ Lỗi hệ thống: ${err.message}`);
    }
  };

  // Editor clicks to place note bubble
  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (currentUser.role !== 'EDITOR') return;
    if (isDrawing) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setClickCoord({ x: Math.round(x), y: Math.round(y) });
    setIsAddingNote(true);
  };

  const handleAddEditorialNoteSubmit = async () => {
    if (!pendingNoteText.trim()) return;

    try {
      const res = await apiClient.annotations.create(
        pageId,
        { x: clickCoord.x, y: clickCoord.y },
        pendingNoteText,
        'CORRECTION'
      );
      
      const newNote: EditorialNote = {
        id: res._id || `n_${Date.now()}`,
        x: res.coords?.x || clickCoord.x,
        y: res.coords?.y || clickCoord.y,
        comment: res.content || pendingNoteText,
        createdAt: res.createdAt ? new Date(res.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : new Date().toLocaleTimeString()
      };

      setEditorialNotes([...editorialNotes, newNote]);
      setPendingNoteText('');
      setIsAddingNote(false);
    } catch (err) {
      console.error("Failed to create annotation:", err);
    }
  };

  const handleDeleteEditorialNote = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditorialNotes(editorialNotes.filter(n => n.id !== id));
  };

  // AI Feature Simulation
  const triggerAISegmentation = () => {
    setIsAISegmenting(true);
    setTimeout(() => {
      // Spawn standard automated components
      const aiSpawn: MangaRegion[] = [
        { id: 'ai1', x: 200, y: 220, width: 80, height: 70, type: 'bubble', label: 'AI Bubble Detection: #102', status: 'PENDING' },
        { id: 'ai2', x: 30, y: 30, width: 120, height: 100, type: 'character', label: 'AI Character Core: Mangaka Face', status: 'PENDING' },
      ];
      setRegions([...regions, ...aiSpawn]);
      setIsAISegmenting(false);
    }, 1500);
  };

  const triggerAIColoring = () => {
    setIsAIColoring(true);
    setTimeout(() => {
      setColorFilter('ai-colored');
      setIsAIColoring(false);
    }, 1800);
  };

  // Coloring task segment (Assistant role)
  const handleColorRegion = (color: string) => {
    if (!selectedRegionId) return;
    setAssistantColoredRegions({
      ...assistantColoredRegions,
      [selectedRegionId]: color
    });
  };

  const handleSubmitAssistantProduct = async (regionId: string) => {
    // Set status to complete
    setRegions(regions.map(r => r.id === regionId ? { ...r, status: 'COMPLETED' } : r));
    // Find linked tasks and trigger complete
    const tasks = loadMockTasks();
    const linkedTask = tasks.find(t => t.assignedTo === currentUser._id && t.status === 'PENDING');
    if (linkedTask) {
      await apiClient.tasks.submit(linkedTask._id);
      onRefreshTasks();
    }
  };

  const loadMockTasks = (): Task[] => {
    return JSON.parse(localStorage.getItem('m_tasks') || '[]');
  };

  return (
    <div className="bg-white border-4 border-ink-black rounded-none p-6 shadow-[8px_8px_0px_#141414]">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center border-b-4 border-ink-black pb-5 mb-6 gap-4">
        <div>
          <h3 className="font-syne text-xl font-black uppercase tracking-tight flex items-center gap-2 text-ink-black select-none">
            <Paintbrush className="text-[#E63946] w-5 h-5 animate-pulse" />
            Manga Draft Studio Boards
          </h3>
          <p className="font-sans text-xs text-neutral-500 font-extrabold uppercase mt-1">
            Series: <span className="text-[#E63946]">{activeSeries?.title || "Cyber Ronin 2099"}</span> | 
            Chapter: <span className="text-[#E63946]">#{activeChapter?.chapterNumber || "142"}</span>
          </p>
        </div>

        {/* AI Integration Tools Container */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={triggerAISegmentation}
            disabled={isAISegmenting}
            className="flex items-center gap-1.5 px-4 py-2 bg-ink-black text-white hover:bg-[#E63946] border-2 border-ink-black font-syne text-[10px] font-black uppercase tracking-tight shadow-[3px_3px_0px_#141414] active:translate-y-0.5 active:shadow-none transition-all disabled:opacity-50 select-none cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#FFF3B0]" />
            {isAISegmenting ? 'AI Segmenting...' : 'AI Segment Regions'}
          </button>

          <button
            onClick={triggerAIColoring}
            disabled={isAIColoring}
            className="flex items-center gap-1.5 px-4 py-2 border-2 border-ink-black bg-white text-ink-black hover:bg-[#F5F5F0] font-syne text-[10px] font-black uppercase tracking-tight shadow-[3px_3px_0px_#141414] active:translate-y-0.5 active:shadow-none transition-all disabled:opacity-50 select-none cursor-pointer"
          >
            <Paintbrush className="w-3.5 h-3.5 text-[#E63946]" />
            {isAIColoring ? 'AI Coloring...' : colorFilter === 'ai-colored' ? 'Reset Color Filter' : 'AI Auto-Coloring'}
          </button>
          {colorFilter === 'ai-colored' && (
            <button 
              onClick={() => setColorFilter('bw')}
              className="text-xs text-[#E63946] font-bold underline ml-1 cursor-pointer hover:no-underline"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
        
        {/* Left Interactive Canvas Area */}
        <div className="xl:col-span-8 flex flex-col items-center">
          
          {/* Canvas Guide instructions according to Role */}
          <div className="w-full bg-[#FFF3B0] border-2 border-ink-black p-3.5 mb-4 text-xs font-sans text-ink-black flex items-start gap-2 shadow-[3px_3px_0px_#141414] select-none rounded-none leading-relaxed">
            <AlertCircle className="w-4 h-4 text-[#E63946] flex-shrink-0 mt-0.5" />
            <span className="font-bold">
              {currentUser.role === 'MANGAKA' && "🚀 MANGAKA: Click and drag anywhere on the visual sheet below to draw a selection frame and immediately task assistants!"}
              {currentUser.role === 'ASSISTANT' && "🎨 ASSISTANT: Click on any active highlighted partition on the canvas, select a custom halftone shade, and apply layers."}
              {currentUser.role === 'EDITOR' && "🖋️ EDITOR: Click directly anywhere on the comic sheet layout where you wish to drop structural correction post-it notes."}
              {currentUser.role === 'BOARD_MEMBER' && "📊 BOARD MEMBER: Review segmented canvas components, investigate corrective editor comments and cast your publication vote."}
            </span>
          </div>

          <div 
            ref={containerRef}
            onClick={handleCanvasClick}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            className={`relative border-4 border-ink-black rounded-none bg-white overflow-hidden select-none cursor-crosshair max-w-full w-[360px] h-[520px] transition-shadow duration-300 shadow-[8px_8px_0px_#141414]`}
            style={{
              backgroundImage: 'radial-gradient(#141414 1.2px, transparent 1.2px)',
              backgroundSize: '16px 16px'
            }}
          >
            {/* Visual Manga Page Drafting Layout Mock Background */}
            <div className={`absolute inset-4 border border-ink-black flex flex-col justify-between p-2 divide-y divide-ink-black overflow-hidden pointer-events-none transition-all duration-500 rounded ${colorFilter === 'ai-colored' ? 'bg-orange-50/20 sepia-[20%] hue-rotate-15 saturate-[170%]' : 'bg-white'}`}>
              
              {/* Box Segment 1 */}
              <div className="flex-1 flex justify-between divide-x divide-ink-black pb-1">
                <div className="flex-1 flex flex-col justify-end p-2 relative">
                  <div className="font-syne text-[10px] uppercase font-extrabold tracking-tighter text-stone-300 absolute top-2 right-2">Panel 1</div>
                  {/* Draw mock manga outlines */}
                  <div className="w-full h-8 border border-neutral-300 rounded shadow-inner rotate-3 opacity-30 flex items-center justify-center">
                    <span className="text-[8px] font-mono">Ink Core Details</span>
                  </div>
                </div>
                <div className="w-1/3 flex items-center justify-center p-2 relative bg-zinc-50">
                  <span className="text-[7px] font-mono absolute top-1 left-1 opacity-20">Bubble 1</span>
                  {/* Dialog Speech Balloon outline */}
                  <div className="w-10 h-10 border border-ink-black rounded-full bg-white opacity-65 flex items-center justify-center shadow-sm">
                    <span className="text-[6px] text-center font-sans tracking-tight">Kyah!</span>
                  </div>
                </div>
              </div>

              {/* Box Segment 2 */}
              <div className="flex-1 flex divide-x divide-ink-black pt-1">
                <div className="w-1/2 p-2 relative">
                  <div className="font-syne text-[10px] uppercase font-extrabold text-stone-300 absolute bottom-2 left-2">Panel 2</div>
                  <div className="absolute top-4 right-4 w-12 h-20 bg-neutral-100 border border-zinc-300 rounded opacity-40"></div>
                </div>
                <div className="flex-1 p-2 bg-stone-50 relative flex flex-col justify-between">
                  <div className="w-6 h-6 rounded-full border border-ink-black bg-white opacity-80 flex items-center justify-center text-[5px] font-bold self-end shadow-sm">HUH?</div>
                  <div className="w-full h-12 border-b border-t border-neutral-200 divide-x divide-neutral-200 flex opacity-40">
                    <div className="flex-1"></div>
                    <div className="flex-1"></div>
                  </div>
                </div>
              </div>
            </div>

            {/* AI Auto-Color overlay layer */}
            {colorFilter === 'ai-colored' && (
              <div className="absolute inset-0 bg-gradient-to-tr from-sky-400/20 via-pink-400/10 to-amber-300/20 mix-blend-color pointer-events-none animate-pulse duration-[4000ms]"></div>
            )}

            {/* Render Bounding Regions */}
            {regions.map((region) => {
              const rectColor = 
                region.type === 'panel' ? 'border-action-blue bg-action-blue/10 text-action-blue' :
                region.type === 'bubble' ? 'border-creative-orange bg-creative-orange/10 text-creative-orange' :
                'border-status-success bg-status-success/10 text-status-success';

              const isUserAssigned = region.assignedTo === currentUser._id;
              const isSelected = selectedRegionId === region.id;
              const hasColorOverride = assistantColoredRegions[region.id];

              return (
                <div
                  key={region.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (currentUser.role === 'ASSISTANT' && isUserAssigned) {
                      setSelectedRegionId(region.id);
                      setIsColoringMode(true);
                    } else {
                      setSelectedRegionId(region.id === selectedRegionId ? null : region.id);
                    }
                  }}
                  className={`absolute border-2 rounded shadow-sm flex flex-col justify-between p-1 transition-all ${rectColor} ${
                    isSelected ? 'ring-2 ring-ink-black scale-[1.01] z-30' : 'hover:scale-[1.005] z-10'
                  }`}
                  style={{
                    left: `${region.x}px`,
                    top: `${region.y}px`,
                    width: `${region.width}px`,
                    height: `${region.height}px`,
                    backgroundColor: hasColorOverride ? `${hasColorOverride}44` : undefined
                  }}
                >
                  <div className="flex justify-between items-start select-none">
                    <span className="font-mono text-[9px] uppercase px-1 bg-white border border-current rounded font-bold">
                      {region.type}
                    </span>
                    {region.status === 'COMPLETED' ? (
                      <span className="bg-status-success text-white rounded-full p-0.5 shadow-sm">
                        <Check className="w-2.5 h-2.5" />
                      </span>
                    ) : (
                      isUserAssigned && (
                        <span className="bg-action-blue text-white rounded font-mono text-[8px] px-1 font-bold animate-pulse">
                          YOUR TASK
                        </span>
                      )
                    )}
                  </div>
                  
                  <div className="bg-neutral-900/85 text-white font-mono text-[8px] py-0.5 px-1 truncate rounded leading-none">
                    {region.label}
                  </div>
                </div>
              );
            })}

            {/* Current Drawing Box (Mangaka) */}
            {currentBox && (
              <div 
                className={`absolute border-2 border-dashed rounded z-45 bg-action-blue/15 flex flex-col justify-between p-1 ${
                  newRegionType === 'panel' ? 'border-action-blue' :
                  newRegionType === 'bubble' ? 'border-creative-orange' :
                  'border-status-success'
                }`}
                style={{
                  left: `${currentBox.x}px`,
                  top: `${currentBox.y}px`,
                  width: `${currentBox.width}px`,
                  height: `${currentBox.height}px`
                }}
              >
                <span className="font-mono text-[8px] text-white bg-ink-black px-1 rounded uppercase w-max">
                  {newRegionType}
                </span>
              </div>
            )}

            {/* Editorial Correction Note Markers */}
            {editorialNotes.map((note) => (
              <div
                key={note.id}
                className="absolute z-40 group"
                style={{ left: `${note.x - 12}px`, top: `${note.y - 12}px` }}
              >
                {/* Marker Pin */}
                <div className="w-6 h-6 rounded-full bg-status-error border-2 border-white text-white font-bold flex items-center justify-center text-xs shadow-lg cursor-pointer transform hover:scale-110 active:scale-95 transition-all">
                  !
                </div>

                {/* Hover Comment Tooltip bubble */}
                <div className="absolute top-8 left-1/2 -translate-x-1/2 hidden group-hover:block bg-ink-black text-white p-3 rounded-lg text-xs w-48 shadow-xl z-50 manga-shadow border border-neutral-700">
                  <div className="flex justify-between items-center pb-1 mb-1 border-b border-neutral-800 font-mono text-[9px] text-neutral-400">
                    <span>Note by Editor</span>
                    <button 
                      onClick={(e) => handleDeleteEditorialNote(note.id, e)}
                      className="text-status-error hover:text-white transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                  <p className="font-sans leading-normal">{note.comment}</p>
                  <span className="text-[8px] font-mono text-neutral-500 block text-right mt-1.5">{note.createdAt}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Canvas status details / metadata layout feedback */}
          <div className="w-full flex items-center justify-between text-xs text-on-surface-variant font-mono mt-3 px-1">
            <span>Grid Resolution: 16px</span>
            <span>Total Active Panels: {regions.filter(r => r.type === 'panel').length}</span>
            <span>Editorial Notes: {editorialNotes.length}</span>
          </div>
        </div>

        {/* Right Task Context Sidebar / Annotation Submission Forms */}
        <div className="xl:col-span-4 flex flex-col gap-5">
          
          {/* MANGAKA: Set up New Region Task Assignment */}
          {currentUser.role === 'MANGAKA' && (
            <div className="bg-manuscript-gray border border-border-muted rounded-lg p-4">
              <h4 className="font-syne text-md font-bold text-ink-black mb-3 border-b border-border-muted pb-2 flex items-center gap-1.5">
                <Scissors className="text-action-blue w-4 h-4" />
                Assign Selected Region
              </h4>
              
              {canvasError && (
                <div className="mb-3 p-3 bg-red-50 border border-red-200 text-red-600 text-xs rounded font-sans font-medium">
                  {canvasError}
                </div>
              )}
              
              {currentBox ? (
                <div className="space-y-4 animate-fadeIn">
                  <div className="text-xs font-mono text-neutral-600 bg-white border border-border-muted p-2 rounded">
                    <div>📐 X: {Math.round(currentBox.x)} px, Y: {Math.round(currentBox.y)} px</div>
                    <div>📏 Size: {Math.round(currentBox.width)} x {Math.round(currentBox.height)} px</div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono text-on-surface-variant uppercase mb-1">Region Type</label>
                    <div className="grid grid-cols-3 gap-1">
                      {(['panel', 'bubble', 'character'] as const).map((t) => (
                        <button
                          key={t}
                          onClick={() => setNewRegionType(t)}
                          className={`py-1 rounded font-mono text-[10px] uppercase border transition-all cursor-pointer ${
                            newRegionType === t 
                              ? 'bg-ink-black text-white border-ink-black font-bold' 
                              : 'bg-white text-on-surface-variant border-border-muted hover:bg-neutral-50'
                          }`}
                        >
                          {t}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono text-on-surface-variant uppercase mb-1" htmlFor="regionLabel">Task Title/Detail</label>
                    <input
                      id="regionLabel"
                      type="text"
                      className="w-full bg-white border border-border-muted rounded py-1.5 px-3 text-xs focus:outline-none focus:border-action-blue font-sans"
                      placeholder="e.g. Draw dynamic vector background"
                      value={newRegionLabel}
                      onChange={(e) => setNewRegionLabel(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-mono text-on-surface-variant uppercase mb-1" htmlFor="assistantSelect">Delegated Assistant</label>
                    <select
                      id="assistantSelect"
                      className="w-full bg-white border border-border-muted rounded py-1.5 px-3 text-xs focus:outline-none focus:border-action-blue cursor-pointer"
                      value={selectedAssistant}
                      onChange={(e) => setSelectedAssistant(e.target.value)}
                    >
                      {assistantsList.map(a => (
                        <option key={a._id} value={a._id}>{a.name}</option>
                      ))}
                      {assistantsList.length === 0 && (
                        <>
                          <option value="u2">Kenji Sato (Backgrounds)</option>
                          <option value="u3">Mei Lin (Inking & Details)</option>
                        </>
                      )}
                    </select>
                  </div>

                  <button
                    onClick={handleCreateRegionTask}
                    disabled={!newRegionLabel}
                    className="w-full bg-action-blue text-white py-2 font-mono text-xs font-bold rounded shadow-sm hover:bg-secondary transition-colors cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Dispatch Task
                  </button>
                </div>
              ) : (
                <div className="py-8 text-center text-xs text-on-surface-variant font-mono">
                  <div className="w-10 h-10 rounded-full border-2 border-dashed border-border-muted flex items-center justify-center mx-auto mb-2 text-neutral-400 font-bold">
                    +
                  </div>
                  Draw a selection box on the canvas image on the left to start!
                </div>
              )}
            </div>
          )}

          {/* EDITOR: Review Annotation Form Drawer */}
          {currentUser.role === 'EDITOR' && (
            <div className="bg-white border-2 border-ink-black rounded-none p-5 shadow-[4px_4px_0px_#141414]">
              <h4 className="font-syne text-xs font-black uppercase text-ink-black mb-3 border-b-2 border-ink-black pb-2 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <MessageSquare className="text-[#E63946] w-4 h-4" />
                  Add Editorial Annotation
                </span>
                <span className="bg-[#E63946] text-white text-[9px] px-1 py-0.5">CORRECTIONS</span>
              </h4>

              {isAddingNote ? (
                <div className="space-y-4 animate-fadeIn">
                  <div className="text-[10px] font-mono text-neutral-500 bg-[#F5F5F0] border-2 border-ink-black p-1.5 font-bold">
                    📌 Location coordinates: {clickCoord.x} , {clickCoord.y}
                  </div>
                  
                  <div>
                    <label className="block text-[10px] font-mono text-ink-black font-extrabold uppercase mb-1" htmlFor="annote">Notes for mangaka/editorial script changes</label>
                    <textarea
                      id="annote"
                      rows={4}
                      className="w-full bg-white border-2 border-ink-black rounded-none p-2 text-xs focus:outline-none focus:border-[#E63946] leading-normal resize-none font-bold placeholder:text-neutral-400"
                      placeholder="Provide directives for layout, sizing, facial detail adjustments or script corrections..."
                      value={pendingNoteText}
                      onChange={(e) => setPendingNoteText(e.target.value)}
                    ></textarea>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => {
                        setIsAddingNote(false);
                        setPendingNoteText('');
                      }}
                      className="flex-1 border-2 border-ink-black bg-white text-ink-black py-2 font-syne text-[10px] font-black uppercase transition-all shadow-[2px_2px_0px_#141414] active:shadow-none cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleAddEditorialNoteSubmit}
                      disabled={!pendingNoteText.trim()}
                      className="flex-1 bg-[#E63946] text-white py-2 border-2 border-ink-black font-syne text-[10px] font-black uppercase tracking-tight shadow-[2px_2px_0px_#141414] active:shadow-none transition-colors disabled:opacity-50 cursor-pointer"
                    >
                      Place Note
                    </button>
                  </div>
                </div>
              ) : (
                <div className="py-6 text-center text-xs text-neutral-500 font-mono">
                  <div className="w-8 h-8 rounded-full border-2 border-dashed border-[#E63946] text-[#E63946] flex items-center justify-center mx-auto mb-2 text-md font-bold animate-pulse">
                    🖋️
                  </div>
                  Click anywhere directly on the manga page panel drafts to spawn correction notes.
                </div>
              )}
            </div>
          )}

          {/* ASSISTANT: Paint Toolbox / Segment submission panel */}
          {currentUser.role === 'ASSISTANT' && (
            <div className="bg-white border-2 border-ink-black rounded-none p-5 shadow-[4px_4px_0px_#141414]">
              <h4 className="font-syne text-xs font-black uppercase text-ink-black mb-3 border-b-2 border-ink-black pb-2 flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Paintbrush className="text-[#E63946] w-4 h-4" />
                  Assistant Workspace
                </span>
                <span className="bg-ink-black text-white text-[9px] px-1 py-0.5">DRAFT OPERATIONS</span>
              </h4>

              {selectedRegionId ? (
                (() => {
                  const region = regions.find(r => r.id === selectedRegionId);
                  if (!region) return null;
                  
                  return (
                    <div className="space-y-4 animate-fadeIn">
                      <div className="border-2 border-ink-black bg-[#F5F5F0] p-3 rounded-none text-xs select-none shadow-[2px_2px_0px_#141414]">
                        <div className="font-black text-ink-black text-sm mb-1">{region.label}</div>
                        <div className="text-neutral-500 font-mono text-[10px] font-bold uppercase">Type: <span className="text-[#E63946]">{region.type}</span></div>
                        <div className="text-neutral-500 font-mono text-[10px] font-bold uppercase mt-0.5">Status: <span className={region.status === 'COMPLETED' ? 'text-status-success' : 'text-[#F39C12]'}>{region.status}</span></div>
                      </div>

                      {region.status !== 'COMPLETED' && (
                        <>
                          <div>
                            <label className="block text-[10px] font-mono text-ink-black font-black uppercase mb-2">Toner Ink Palette Selection</label>
                            <div className="flex items-center gap-2">
                              {['#3B82F6', '#EF4444', '#F39C12', '#2ECC71', '#141414', '#E5E7EB'].map((col) => (
                                <button
                                  key={col}
                                  onClick={() => handleColorRegion(col)}
                                  className={`w-6 h-6 rounded-full border-2 cursor-pointer transition-all ${
                                    assistantColoredRegions[region.id] === col ? 'border-ink-black ring-2 ring-[#E63946] scale-110 shadow-sm' : 'border-white hover:scale-105'
                                  }`}
                                  style={{ backgroundColor: col }}
                                />
                              ))}
                            </div>
                            <span className="text-[9px] font-mono text-neutral-500 mt-2.5 block font-semibold uppercase">Pick a dynamic screen-tone shade to color this segment.</span>
                          </div>

                          <button
                            onClick={() => handleSubmitAssistantProduct(region.id)}
                            className="w-full bg-[#2ECC71] text-white py-3 border-2 border-ink-black font-syne text-xs font-black uppercase tracking-tight shadow-[3px_3px_0px_#141414] active:shadow-none hover:bg-emerald-600 transition-colors cursor-pointer flex items-center justify-center gap-1.5"
                          >
                            <Check className="w-4 h-4" />
                            Submit Work Item
                          </button>
                        </>
                      )}
                    </div>
                  );
                })()
              ) : (
                <div className="py-6 text-center text-xs text-neutral-500 font-mono select-none">
                  <div className="w-8 h-8 rounded-full border-2 border-dashed border-[#E63946] text-[#E63946] flex items-center justify-center mx-auto mb-2 text-md font-bold animate-bounce">
                    🎨
                  </div>
                  Click directly on any highlighting panel task outline assigned to your user account to begin work operations.
                </div>
              )}

              {/* Monthly Assistant Stats summary widget */}
              <div className="border-2 border-ink-black bg-white p-3 rounded-none divide-y-2 divide-ink-black mt-4 font-sans shadow-[2px_2px_0px_#141414] font-extrabold select-none">
                <div className="flex justify-between items-center py-1.5 text-xs">
                  <span className="font-mono text-[9px] uppercase tracking-wider text-neutral-500">Monthly Approved:</span>
                  <span className="font-mono font-bold">14 Pages</span>
                </div>
                <div className="flex justify-between items-center py-1.5 text-xs text-neutral-800">
                  <span className="font-mono text-[9px] uppercase tracking-wider text-neutral-500">Current Earnings:</span>
                  <span className="text-[#2ECC71] font-mono font-bold">$1,400.00 USD</span>
                </div>
              </div>
            </div>
          )}

          {/* BOARD_MEMBER: Display Region breakdown data cards */}
          {currentUser.role === 'BOARD_MEMBER' && (
            <div className="bg-white border-2 border-ink-black rounded-none p-5 shadow-[4px_4px_0px_#141414]">
              <h4 className="font-syne text-xs font-black uppercase text-ink-black mb-3 border-b-2 border-ink-black pb-2 flex items-center gap-1.5">
                <Check className="text-[#E63946] w-4 h-4" />
                Editorial Review Meta
              </h4>
              <p className="text-[11px] font-sans text-neutral-600 leading-relaxed font-bold">
                Evaluating physical components. Inspect panel configurations and sticky notes left by editorial groups to verify release.
              </p>
              <div className="mt-4 space-y-2">
                <div className="bg-[#F5F5F0] p-2.5 border-2 border-ink-black text-xs flex justify-between items-center text-ink-black font-mono font-bold">
                  <span>Detected Dialogs:</span>
                  <span>2 Bubble regions</span>
                </div>
                <div className="bg-[#F5F5F0] p-2.5 border-2 border-ink-black text-xs flex justify-between items-center text-ink-black font-mono font-bold font-black">
                  <span>Critical Red Notes:</span>
                  <span className="text-[#E63946]">{editorialNotes.length} note(s)</span>
                </div>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
