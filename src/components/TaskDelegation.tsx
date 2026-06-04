import React, { useState, useEffect } from 'react';
import { User, Series, Chapter, Task } from '../types';
import { apiClient } from '../api/client';
import { UserPlus, Send, LayoutGrid, Sparkles, Plus, Check } from 'lucide-react';

interface TaskDelegationProps {
  currentUser: User;
  series: Series[];
  chapters: Chapter[];
  tasks: Task[];
  onRefreshAll: () => void;
  onSelectSeries: (series: Series) => void;
  onSelectChapter: (chapter: Chapter) => void;
}

export default function TaskDelegation({
  currentUser,
  series,
  chapters,
  tasks,
  onRefreshAll,
  onSelectSeries,
  onSelectChapter
}: TaskDelegationProps) {
  // Task Assignment form states
  const [taskTitle, setTaskTitle] = useState('');
  const [selectedSeriesId, setSelectedSeriesId] = useState('');
  const [selectedChapterId, setSelectedChapterId] = useState('');
  const [assignedAssistantId, setAssignedAssistantId] = useState('u2'); // Default to Kenji Sato
  const [dueDate, setDueDate] = useState('2026-06-15');
  const [assignStatusMsg, setAssignStatusMsg] = useState('');

  // Series Pitching states
  const [pitchTitle, setPitchTitle] = useState('');
  const [pitchSynopsis, setPitchSynopsis] = useState('');
  const [pitchStatusMsg, setPitchStatusMsg] = useState('');

  // Load chapters when series changes
  const filteredChapters = chapters.filter(c => c.seriesId === selectedSeriesId);

  // Assistants metadata
  const assistants = [
    {
      id: 'u2',
      name: 'Kenji Sato',
      role: 'Backgrounds & Tones',
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuByWi6Zl9Aq5qImGVzCM9dhGi2im5oNDHcYKm7_gdy-y_OSg-Pknn0o2Seu12-bt1ZlvW5mUwYsHbUzshmDVAh9HLeU2zsF4S5qvBZcASl2N4mHoV4QkyO3oaBVVg5I3WsU787UzwLfvdhrTVpYwQpRHM10fQ67X_0IXkIfhdkBbM5hGfouxY6d_0YEaDvNbGo2xqh8PeDhZhx73aSK3GLz-B8_C9WMamYLJXcYZShKrPQs9cA-qJJWPqKe3zVBhGuEz1CkezmEZARm',
      activeCount: tasks.filter(t => t.assignedTo === 'u2' && t.status === 'PENDING').length || 3
    },
    {
      id: 'u3',
      name: 'Mei Lin',
      role: 'Inking & Details',
      avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDb75LL8ZWct7hOj_Lpk8YxqEv5BjlWa2mgnocgPm9ezXoHO2Eo7INteNIxv3zb59h68u5MrIsX4qE02NGXmancNIhDRjuLuw8cxldllyVXH8ZRRLi01owyzX7zHvC-NGEEnQuQDiF5_9C8BO2AJvtFze4KTeSuHEeW4eoMhlvbPbvZtfDUx1qbYDwAmHMmL2Wnf9Ue9jyCn5WnL98U1dHFJYXetVyECwx5fpaqDoerU6KxLWjbM5TxO2vJ4bceFRnggczcCiKg-8R0',
      activeCount: tasks.filter(t => t.assignedTo === 'u3' && t.status === 'PENDING').length || 1
    }
  ];

  // Submit task dispatch details
  const handleAssignTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle || !selectedSeriesId || !selectedChapterId) {
      setAssignStatusMsg('❌ Please fill out all required parameters.');
      return;
    }

    try {
      await apiClient.tasks.create(
        selectedSeriesId,
        selectedChapterId,
        assignedAssistantId,
        taskTitle
      );
      
      setTaskTitle('');
      setAssignStatusMsg('✅ Task successfully assigned to assistant!');
      onRefreshAll();
      setTimeout(() => setAssignStatusMsg(''), 4000);
    } catch (err: any) {
      setAssignStatusMsg(`❌ Error: ${err.message}`);
    }
  };

  // Submit series pitch proposal
  const handlePitchSeries = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pitchTitle || !pitchSynopsis) {
      setPitchStatusMsg('❌ Title and synopsis are mandatory.');
      return;
    }

    try {
      await apiClient.series.create(pitchTitle, pitchSynopsis);
      setPitchTitle('');
      setPitchSynopsis('');
      setPitchStatusMsg('🎉 Series pitch successfully submitted to Editorial Board!');
      onRefreshAll();
      setTimeout(() => setPitchStatusMsg(''), 5000);
    } catch (err: any) {
      setPitchStatusMsg(`❌ Error: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* Upper header section */}
      <header className="mb-8 pb-5 border-b-4 border-ink-black flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="font-syne text-3xl font-black text-ink-black uppercase italic tracking-tight">Task Delegation</h1>
          <p className="font-sans text-xs text-neutral-600 font-bold uppercase tracking-wider mt-1.5 flex items-center gap-2">
            <span className="inline-block w-2.5 h-2.5 bg-[#E63946]"></span>
            Assign workflow tasks to assistants or collaborators. Manage upcoming responsibilities.
          </p>
        </div>
      </header>

      {/* Grid columns */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Column: Primary task delegator form */}
        <div className="lg:col-span-8 space-y-6">
          <section className="bg-white border-4 border-ink-black rounded-none p-6 md:p-8 shadow-[8px_8px_0px_#141414]">
            <h2 className="font-syne text-xl font-black uppercase text-ink-black mb-6 pb-4 border-b-4 border-ink-black flex items-center gap-3 select-none">
              <UserPlus className="text-[#E63946] w-6 h-6 animate-pulse" />
              Assign Task
            </h2>

            {assignStatusMsg && (
              <div className={`p-4 border-2 rounded-none mb-5 text-xs font-mono font-bold uppercase select-none ${assignStatusMsg.startsWith('✅') ? 'bg-[#2ECC71]/10 border-[#2ECC71] text-[#2ECC71]' : 'bg-[#E63946]/10 border-[#E63946] text-[#E63946]'}`}>
                {assignStatusMsg}
              </div>
            )}

            <form onSubmit={handleAssignTask} className="space-y-6">
              <div className="space-y-2">
                <label className="font-mono text-[10px] text-ink-black block font-extrabold uppercase" htmlFor="taskTitle">Task Title</label>
                <input 
                  id="taskTitle"
                  type="text" 
                  className="w-full bg-[#F5F5F0] border-2 border-ink-black focus:border-[#E63946] focus:bg-white rounded-none px-4 py-3 font-sans text-xs text-ink-black font-bold transition-all placeholder:text-neutral-400"
                  placeholder="e.g., Shading Backgrounds, Tones, Rendering Effects"
                  value={taskTitle}
                  onChange={(e) => setTaskTitle(e.target.value)}
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="font-mono text-[10px] text-ink-black block font-extrabold uppercase" htmlFor="targetSeriesS">Target Series</label>
                  <div className="relative">
                    <select 
                      id="targetSeriesS"
                      className="w-full appearance-none bg-[#F5F5F0] border-2 border-ink-black hover:border-[#E63946] focus:border-[#E63946] rounded-none px-4 py-3 font-sans text-xs text-ink-black font-bold transition-all cursor-pointer focus:bg-white focus:outline-none"
                      value={selectedSeriesId}
                      onChange={(e) => {
                        setSelectedSeriesId(e.target.value);
                        const s = series.find(ser => ser._id === e.target.value);
                        if (s) {
                          onSelectSeries(s);
                        }
                      }}
                      required
                    >
                      <option value="">Select Series</option>
                      {series.filter(s => s.status !== 'PENDING' && s.status !== 'REJECTED' && s.status !== 'CANCELLED').map(s => (
                        <option key={s._id} value={s._id}>{s.title}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="font-mono text-[10px] text-ink-black block font-extrabold uppercase" htmlFor="targetChapterS">Chapter / Episode</label>
                  <div className="relative">
                    <select 
                      id="targetChapterS"
                      className="w-full appearance-none bg-[#F5F5F0] border-2 border-ink-black hover:border-[#E63946] focus:border-[#E63946] rounded-none px-4 py-3 font-sans text-xs text-ink-black font-bold transition-all cursor-pointer focus:bg-white focus:outline-none"
                      value={selectedChapterId}
                      onChange={(e) => {
                        setSelectedChapterId(e.target.value);
                        const c = chapters.find(chap => chap._id === e.target.value);
                        if (c) {
                          onSelectChapter(c);
                        }
                      }}
                      required
                      disabled={!selectedSeriesId}
                    >
                      <option value="">Select Chapter</option>
                      {filteredChapters.map(c => (
                        <option key={c._id} value={c._id}>Chapter {c.chapterNumber} - Deadline: {c.deadline}</option>
                      ))}
                      {selectedSeriesId && filteredChapters.length === 0 && (
                        <option value="temp_c1">Chapter 142 - Auto active</option>
                      )}
                    </select>
                  </div>
                </div>
              </div>

              {/* Assignment Radio Selection Grid */}
              <div className="space-y-2">
                <label className="font-mono text-[10px] text-ink-black block font-extrabold uppercase mb-3">Assigned To Assistant</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {assistants.map((assistant) => (
                    <label 
                      key={assistant.id}
                      className={`relative flex cursor-pointer rounded-none border-2 p-4 focus:outline-none transition-all ${
                        assignedAssistantId === assistant.id 
                          ? 'border-ink-black bg-white shadow-[4px_4px_0px_#141414]' 
                          : 'border-ink-black bg-[#F5F5F0] hover:bg-white'
                      }`}
                    >
                      <input 
                        type="radio" 
                        name="assistant" 
                        value={assistant.id}
                        checked={assignedAssistantId === assistant.id}
                        onChange={() => setAssignedAssistantId(assistant.id)}
                        className="sr-only"
                      />
                      <span className="flex items-center gap-4">
                        <img 
                          src={assistant.avatar} 
                          alt={assistant.name} 
                          className="w-10 h-10 rounded-full border-2 border-ink-black object-cover flex-shrink-0"
                        />
                        <span className="flex flex-col select-none">
                          <span className="font-sans text-xs text-ink-black font-black uppercase">{assistant.name}</span>
                          <span className="font-sans text-[10px] text-neutral-500 font-extrabold uppercase mt-0.5">{assistant.role}</span>
                        </span>
                      </span>
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <label className="font-mono text-[10px] text-ink-black block font-extrabold uppercase" htmlFor="duePr">Due Date</label>
                <div className="relative w-full md:w-1/2">
                  <input 
                    id="duePr"
                    type="date" 
                    className="w-full bg-[#F5F5F0] border-2 border-ink-black focus:border-[#E63946] focus:bg-white rounded-none px-4 py-3 font-sans text-xs text-ink-black font-bold transition-all cursor-pointer focus:outline-none"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="pt-5 flex justify-end gap-3 border-t-2 border-ink-black">
                <button 
                  type="button" 
                  onClick={() => {
                    setTaskTitle('');
                    setSelectedSeriesId('');
                    setSelectedChapterId('');
                  }}
                  className="font-mono text-[10px] font-extrabold text-ink-black px-6 py-2 border-2 border-transparent hover:border-ink-black rounded-none uppercase transition-all cursor-pointer"
                >
                  Clear Form
                </button>
                <button 
                  type="submit"
                  className="bg-[#E63946] text-white border-2 border-ink-black font-syne text-xs uppercase font-extrabold tracking-wider px-8 py-3 rounded-none hover:bg-red-600 shadow-[4px_4px_0px_#141414] active:translate-y-0.5 active:shadow-none transition-all flex items-center gap-2 cursor-pointer"
                >
                  <Send className="w-4 h-4" />
                  Assign Task
                </button>
              </div>
            </form>
          </section>
        </div>

        {/* Right Column: Mini Series pitching context form & Team Workload stats */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Pitch Proposal layout */}
          <section className="bg-white border-4 border-ink-black rounded-none p-6 relative overflow-hidden shadow-[4px_4px_0px_#141414]">
            <h3 className="font-syne text-md font-black uppercase text-ink-black mb-4 relative z-10 flex items-center gap-2 select-none">
              <Sparkles className="text-[#E63946] w-5 h-5 animate-bounce" />
              Pitch New Series
            </h3>

            {pitchStatusMsg && (
              <div className={`p-3 rounded-none mb-3 text-xs font-mono select-none leading-normal border-2 font-bold ${pitchStatusMsg.startsWith('🎉') ? 'bg-[#2ECC71]/10 text-[#2ECC71] border-[#2ECC71]' : 'bg-[#E63946]/10 text-[#E63946] border-[#E63946]'}`}>
                {pitchStatusMsg}
              </div>
            )}

            <form onSubmit={handlePitchSeries} className="space-y-4 relative z-10">
              <div>
                <label className="sr-only" htmlFor="pt">Title</label>
                <input 
                  id="pt"
                  type="text" 
                  className="w-full bg-[#F5F5F0] border-2 border-ink-black focus:border-[#E63946] focus:bg-white rounded-none px-3 py-2 font-sans text-xs text-ink-black font-bold placeholder:text-neutral-400 transition-colors"
                  placeholder="Working Title (e.g. Cyber City)"
                  value={pitchTitle}
                  onChange={(e) => setPitchTitle(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="sr-only" htmlFor="synop">Synopsis</label>
                <textarea 
                  id="synop"
                  rows={4} 
                  className="w-full bg-[#F5F5F0] border-2 border-ink-black focus:border-[#E63946] focus:bg-white rounded-none px-3 py-2 font-sans text-xs text-ink-black font-bold resize-none placeholder:text-neutral-400 transition-colors"
                  placeholder="Outline pitch, target demographic, or basic pilot logs..."
                  value={pitchSynopsis}
                  onChange={(e) => setPitchSynopsis(e.target.value)}
                  required
                ></textarea>
              </div>

              <button 
                type="submit"
                className="w-full bg-[#E63946] text-white border-2 border-ink-black font-syne text-xs font-black uppercase py-2.5 rounded-none shadow-[3px_3px_0px_#141414] active:translate-y-0.5 active:shadow-none transition-all cursor-pointer flex items-center justify-center gap-1.5"
              >
                Submit Proposal Idea
              </button>
            </form>
          </section>

          {/* Team Workload stats overview */}
          <section className="bg-white border-4 border-ink-black rounded-none p-6 shadow-[4px_4px_0px_#141414]">
            <h3 className="font-syne text-md font-black uppercase text-ink-black mb-4 select-none">Team Workload</h3>
            <div className="space-y-4">
              {assistants.map((assistant) => (
                <div key={assistant.id} className="flex items-center justify-between border-b-2 border-dashed border-neutral-100 pb-3 last:border-0 last:pb-0 select-none">
                  <div className="flex items-center gap-3">
                    <img 
                      src={assistant.avatar} 
                      alt={assistant.name} 
                      className="w-8 h-8 rounded-full border-2 border-ink-black object-cover"
                    />
                    <span className="font-sans text-xs text-ink-black font-black uppercase">{assistant.name}</span>
                  </div>
                  <span className="bg-neutral-100 text-ink-black border-2 border-ink-black px-2.5 py-0.5 rounded-none font-mono text-[10px] font-black uppercase leading-none">
                    {assistant.activeCount} Active
                  </span>
                </div>
              ))}
            </div>
            
            <div className="text-[10px] font-mono text-neutral-500 flex items-center gap-1 mt-6 pt-4 border-t-2 border-ink-black font-bold uppercase select-none">
              <span>All active tasks queued:</span>
              <span className="text-[#E63946] underline">{tasks.filter(t => t.status === 'PENDING').length} items</span>
            </div>
          </section>

        </div>

      </div>
    </div>
  );
}
