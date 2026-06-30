import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { User, Series, Chapter, Task, Rating, UserRole } from './types';
import { apiClient, getStoredUser, setStoredUserSession } from './api/client';
import WorkspaceCanvas from './components/WorkspaceCanvas';
import TaskDelegation from './components/TaskDelegation';
import EditorialBoard from './components/EditorialBoard';
import LeaderboardAnalytics from './components/LeaderboardAnalytics';
import ChapterManagement from './components/ChapterManagement';
import AssistantApp from './components/assistant/AssistantApp';
import Navigation from './components/Navigation';
import LoginBackground from './components/LoginBackground';
import { EditorApp } from './features/editor/EditorApp.tsx';
import { Sparkles, Key, Radio, Layers, CloudLightning } from 'lucide-react';

export default function App() {
  // Session Authentication states
  const [currentUser, setCurrentUser] = useState<User | null>(getStoredUser());
  const [authName, setAuthName] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authRole, setAuthRole] = useState<UserRole>('MANGAKA');
  const [authStatusMsg, setAuthStatusMsg] = useState('');
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [authVerificationCode, setAuthVerificationCode] = useState('');
  const [isCodeSent, setIsCodeSent] = useState(false);

  // Active workspace state caching
  const [activeTab, setActiveTabState] = useState<string>(() => {
    return localStorage.getItem('mangaflow_active_tab') || 'workspace';
  });
  const setActiveTab = (tab: string) => {
    localStorage.setItem('mangaflow_active_tab', tab);
    setActiveTabState(tab);
  };

  const [seriesList, setSeriesList] = useState<Series[]>([]);
  const [chapterList, setChapterList] = useState<Chapter[]>([]);
  const [taskList, setTaskList] = useState<Task[]>([]);
  const [ratingList, setRatingList] = useState<Rating[]>([]);
  
  // Selected focusing points inside Workspace
  const [activeSeries, setActiveSeriesState] = useState<Series | null>(() => {
    const raw = localStorage.getItem('mangaflow_active_series');
    try {
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });
  const setActiveSeries = (series: Series | null) => {
    if (series) {
      localStorage.setItem('mangaflow_active_series', JSON.stringify(series));
    } else {
      localStorage.removeItem('mangaflow_active_series');
    }
    setActiveSeriesState(series);
  };

  const [activeChapter, setActiveChapterState] = useState<Chapter | null>(() => {
    const raw = localStorage.getItem('mangaflow_active_chapter');
    try {
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });
  const setActiveChapter = (chapter: Chapter | null) => {
    if (chapter) {
      localStorage.setItem('mangaflow_active_chapter', JSON.stringify(chapter));
    } else {
      localStorage.removeItem('mangaflow_active_chapter');
    }
    setActiveChapterState(chapter);
  };

  // Configuration settings check
  const config = apiClient.getConfig();

  // Load and refresh core DB models from unified client
  const refreshAllModelCaches = async () => {
    try {
      const liveSeries = await apiClient.series.getAll();
      const liveChapters = await apiClient.chapters.getAll();
      const liveTasks = await apiClient.tasks.getAll();
      const liveRatings = await apiClient.ratings.getAll();

      setSeriesList(liveSeries);
      setTaskList(liveTasks);
      setRatingList(liveRatings);

      let currentChapters = liveChapters;
      setChapterList(currentChapters);

      const liveChaptersList = currentChapters;

      // Auto assign active series elements if not set or invalid under live backend data
      let currentActiveSeries = activeSeries;
      const isLive = apiClient.getConfig().useLiveBackend;
      const isValidObjectId = (id: string) => /^[0-9a-fA-F]{24}$/.test(id);

      const approvedSeries = liveSeries.filter(s => s.status !== 'PENDING' && s.status !== 'REJECTED');
      if (approvedSeries.length > 0) {
        const seriesExists = activeSeries && approvedSeries.some(s => s._id === activeSeries._id);
        const seriesValid = activeSeries && (!isLive || isValidObjectId(activeSeries._id));
        if (!activeSeries || !seriesExists || !seriesValid) {
          setActiveSeries(approvedSeries[0]);
          currentActiveSeries = approvedSeries[0];
        }
      } else {
        setActiveSeries(null);
        currentActiveSeries = null;
      }

      if (liveChaptersList.length > 0) {
        const currentSid = currentActiveSeries?._id;
        const validChaptersForSeries = liveChaptersList.filter(c => c.seriesId === currentSid || c.series === currentSid);
        const chapterExists = activeChapter && liveChaptersList.some(c => c._id === activeChapter._id);
        const chapterValid = activeChapter && (!isLive || isValidObjectId(activeChapter._id));
        
        if (!activeChapter || !chapterExists || !chapterValid || (activeChapter && activeChapter.seriesId !== currentSid && activeChapter.series !== currentSid)) {
          if (validChaptersForSeries.length > 0) {
            setActiveChapter(validChaptersForSeries[0]);
          } else {
            setActiveChapter(liveChaptersList[0]);
          }
        }
      } else {
        setActiveChapter(null);
      }
    } catch (err: any) {
      console.warn('REST Synchronization failed - fallback state remains functional', err);
    }
  };

  // Sync cache on authorization and configuration changes
  useEffect(() => {
    if (currentUser) {
      refreshAllModelCaches();
    }
  }, [currentUser]);

  // Auth Submit Handlers
  const handleSendCode = async () => {
    if (!authEmail) {
      setAuthStatusMsg('❌ Email is required to send verification code.');
      return;
    }
    setAuthStatusMsg('⏳ Sending code...');
    try {
      await apiClient.auth.sendVerificationCode(authEmail);
      setIsCodeSent(true);
      setAuthStatusMsg('✅ Verification code sent to your email.');
    } catch (err: any) {
      setAuthStatusMsg(`❌ ${err.message}`);
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthStatusMsg('');

    try {
      if (isRegisterMode) {
        if (!authName) {
          setAuthStatusMsg('❌ Full name is required.');
          return;
        }
        if (!authVerificationCode) {
          setAuthStatusMsg('❌ Verification code is required.');
          return;
        }
        const res = await apiClient.auth.register(authName, authEmail, authRole, authVerificationCode, authPassword);
        setCurrentUser(res.data);
        
        // Auto-focus default appropriate dashboard tab according to role selection
        if (authRole === 'ASSISTANT') {
          setActiveTab('assistant-tasks');
        } else if (authRole === 'MANGAKA') {
          setActiveTab('workspace');
        } else if (authRole === 'EDITOR') {
          setActiveTab('workspace');
        } else {
          setActiveTab('board');
        }
      } else {
        const res = await apiClient.auth.login(authEmail, authPassword);
        setCurrentUser(res.data);
        
        // Auto-focus default appropriate dashboard tab according to role selection
        const role = res.data.role;
        if (role === 'ASSISTANT') {
          setActiveTab('assistant-tasks');
        } else if (role === 'MANGAKA') {
          setActiveTab('workspace');
        } else if (role === 'EDITOR') {
          setActiveTab('workspace');
        } else {
          setActiveTab('board');
        }
      }
    } catch (err: any) {
      setAuthStatusMsg(`❌ ${err.message}`);
    }
  };

  // Logout session
  const handleLogout = () => {
    apiClient.auth.logout();
    setCurrentUser(null);
    localStorage.removeItem('mangaflow_active_tab');
    localStorage.removeItem('mangaflow_active_series');
    localStorage.removeItem('mangaflow_active_chapter');
    setActiveSeriesState(null);
    setActiveChapterState(null);
    setActiveTabState('workspace');
  };

  return (
    <div className="min-h-screen bg-manuscript-gray font-sans selection:bg-action-blue selection:text-white">
      {/* Universal Grid backdrop decoration dots */}
      <div 
        className="fixed top-0 left-0 w-full h-full pointer-events-none z-[-1] opacity-40"
        style={{
          backgroundImage: 'radial-gradient(#c7c6ca 0.75px, transparent 0.75px)',
          backgroundSize: '24px 24px'
        }}
      />

      {!currentUser ? (
        /* ======================== SCREEN 1: AUTHENTICATION CONTAINER ======================== */
        <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
          <LoginBackground />
          <div className="w-full max-w-md bg-white/95 backdrop-blur-md border-4 border-ink-black rounded-none p-8 shadow-[8px_8px_0px_#141414] flex flex-col transition-all duration-300 relative z-10">
            
            {/* Header Title */}
            <div className="text-center mb-8 select-none">
              <h1 className="font-syne text-4xl font-extrabold text-ink-black tracking-tighter flex items-center justify-center gap-2">
                <span className="bg-[#E63946] text-white px-2 py-0.5 rounded-none rotate-[-2deg] shadow-sm font-black">Manga</span>
                <span className="italic font-serif text-3xl font-bold">Studio</span>
              </h1>
              <p className="font-sans text-[11px] text-neutral-500 font-extrabold uppercase tracking-widest mt-2">
                Creation &amp; Publication Workflow Admin
              </p>
            </div>

            {/* Error or status notifications */}
            {authStatusMsg && (
              <div className="mb-5 p-3 rounded-none bg-[#E63946]/10 border-2 border-[#E63946] text-[#E63946] text-xs font-mono font-bold select-none">
                {authStatusMsg}
              </div>
            )}

            {/* Main Auth Form */}
            <form onSubmit={handleAuthSubmit} className="space-y-4">
               
              {isRegisterMode && (
                <div>
                  <label className="block text-[10px] font-mono text-ink-black font-extrabold uppercase mb-1" htmlFor="fullName">Full Name / Studio Group</label>
                  <input
                    id="fullName"
                    type="text"
                    required
                    className="w-full bg-[#F5F5F0] border-2 border-ink-black hover:border-[#E63946] focus:border-[#E63946] focus:bg-white focus:outline-none rounded-none px-4 py-3 font-sans text-xs text-ink-black font-bold transition-all"
                    placeholder="e.g. Studio Kaze, Yumi Art..."
                    value={authName}
                    onChange={(e) => setAuthName(e.target.value)}
                  />
                </div>
              )}

              <div>
                <label className="block text-[10px] font-mono text-ink-black font-extrabold uppercase mb-1" htmlFor="emailAddr">Registered Email Address</label>
                <div className="flex gap-2">
                  <input
                    id="emailAddr"
                    type="email"
                    required
                    className="flex-1 w-full bg-[#F5F5F0] border-2 border-ink-black hover:border-[#E63946] focus:border-[#E63946] focus:bg-white focus:outline-none rounded-none px-4 py-3 font-sans text-xs text-ink-black font-bold transition-all"
                    placeholder="name@example.com"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                  />
                  {isRegisterMode && (
                    <button
                      type="button"
                      onClick={handleSendCode}
                      className="bg-ink-black text-white px-4 py-3 border-2 border-ink-black rounded-none text-[10px] uppercase font-syne font-extrabold hover:bg-[#E63946] hover:border-[#E63946] transition-all whitespace-nowrap"
                    >
                      {isCodeSent ? 'Resend' : 'Send Code'}
                    </button>
                  )}
                </div>
              </div>

              {isRegisterMode && (
                <div>
                  <label className="block text-[10px] font-mono text-ink-black font-extrabold uppercase mb-1" htmlFor="verificationCode">Verification Code</label>
                  <input
                    id="verificationCode"
                    type="text"
                    required
                    className="w-full bg-[#F5F5F0] border-2 border-ink-black hover:border-[#E63946] focus:border-[#E63946] focus:bg-white focus:outline-none rounded-none px-4 py-3 font-sans text-xs text-ink-black font-bold transition-all tracking-[0.2em]"
                    placeholder="123456"
                    value={authVerificationCode}
                    onChange={(e) => setAuthVerificationCode(e.target.value)}
                  />
                </div>
              )}

              <div>
                <label className="block text-[10px] font-mono text-ink-black font-extrabold uppercase mb-1" htmlFor="password">Password</label>
                <input
                  id="password"
                  type="password"
                  required
                  className="w-full bg-[#F5F5F0] border-2 border-ink-black hover:border-[#E63946] focus:border-[#E63946] focus:bg-white focus:outline-none rounded-none px-4 py-3 font-sans text-xs text-ink-black font-bold transition-all"
                  placeholder="••••••••"
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                />
              </div>

              {isRegisterMode && (
                <div>
                  <label className="block text-[10px] font-mono text-ink-black font-extrabold uppercase mb-1">MangaFlow Access Role</label>
                  <div className="grid grid-cols-2 gap-2">
                    {(['MANGAKA', 'ASSISTANT', 'EDITOR', 'BOARD_MEMBER'] as UserRole[]).map((role) => (
                      <button
                        key={role}
                        type="button"
                        onClick={() => setAuthRole(role)}
                        className={`py-2 px-3 border-2 font-mono text-[10px] font-extrabold transition-all select-none cursor-pointer rounded-none uppercase ${
                          authRole === role 
                            ? 'bg-ink-black text-white border-ink-black shadow-[2px_2px_0px_#141414]' 
                            : 'bg-[#F5F5F0] text-neutral-600 border-ink-black hover:bg-neutral-100'
                        }`}
                      >
                        {role === 'BOARD_MEMBER' ? 'BOARD MEMBER' : role}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="w-full bg-[#E63946] hover:bg-red-600 text-white font-syne text-xs uppercase font-extrabold tracking-wider py-4 border-2 border-ink-black rounded-none shadow-[4px_4px_0px_#141414] transition-all flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Key className="w-4 h-4" />
                {isRegisterMode ? 'Register Account ➔' : 'Sign In ➔'}
              </button>
            </form>

            <div className="text-center mt-6 text-xs font-sans text-on-surface-variant font-medium select-none">
              <button 
                onClick={() => setIsRegisterMode(!isRegisterMode)}
                className="text-neutral-600 font-extrabold hover:text-[#E63946] hover:underline cursor-pointer"
              >
                {isRegisterMode ? 'Already have an account? Sign In' : "Don't have an account? Register Profile"}
              </button>
            </div>

            {/* REST status notification details in login screen footer */}
            <div className="mt-8 pt-4 border-t border-dashed border-neutral-300 text-center select-none">
              {config.useLiveBackend ? (
                <span className="text-[9px] font-mono text-[#2ECC71] font-bold inline-flex items-center gap-1">
                  <CloudLightning className="w-3" /> Live Node.js MongoDB Connected
                </span>
              ) : (
                <span className="text-[9px] font-mono text-neutral-500 font-bold inline-flex items-center gap-1">
                  <Radio className="w-3" /> Fallback Client-Side Storage Active
                </span>
              )}
            </div>

          </div>
        </div>
      ) : currentUser.role === 'ASSISTANT' ? (
        <AssistantApp
          currentUser={currentUser}
          activeTab={activeTab}
          onChangeTab={setActiveTab}
          onLogout={handleLogout}
        />
      ) : currentUser.role === 'EDITOR' ? (
        /* ======================== EDITOR ROLE — NEW EDITOR SPA ======================== */
        <Routes>
          <Route path="/editor/*" element={<EditorApp onLogout={handleLogout} />} />
          <Route path="*" element={<Navigate to="/editor/dashboard" replace />} />
        </Routes>
      ) : (
        /* ======================== MAIN APPLICATION WORKSPACE ======================== */
        <div className="min-h-screen pt-16 md:pt-0 md:pl-72">
          
          {/* Main Navigation Sidebar Pane */}
          <Navigation 
            currentUser={currentUser}
            activeTab={activeTab}
            onChangeTab={setActiveTab}
            onLogout={handleLogout}
            onConfigChange={refreshAllModelCaches}
          />

          {/* Core Content canvas viewports */}
          <main className="block">
            
            {activeTab === 'workspace' && currentUser.role !== 'BOARD_MEMBER' && (
              <div className="p-4 md:p-6">
                <WorkspaceCanvas 
                  currentUser={currentUser}
                  activeSeries={activeSeries}
                  activeChapter={activeChapter}
                  onRefreshTasks={refreshAllModelCaches}
                />
              </div>
            )}

            {(activeTab !== 'workspace' || currentUser.role === 'BOARD_MEMBER') && (
              <div className="p-4 md:p-8 lg:p-10 max-w-7xl mx-auto">

            {activeTab === 'chapters' && (
              <ChapterManagement 
                currentUser={currentUser!}
                series={seriesList}
                chapters={chapterList}
                activeSeries={activeSeries}
                onRefreshAll={refreshAllModelCaches}
                onSelectSeries={setActiveSeries}
                onSelectChapter={setActiveChapter}
                onChangeTab={setActiveTab}
              />
            )}

            {activeTab === 'tasks' && (
              <TaskDelegation 
                currentUser={currentUser}
                series={seriesList}
                chapters={chapterList}
                tasks={taskList}
                onRefreshAll={refreshAllModelCaches}
                onSelectSeries={setActiveSeries}
                onSelectChapter={setActiveChapter}
              />
            )}

            {activeTab === 'board' && (
              <EditorialBoard 
                currentUser={currentUser}
                series={seriesList}
                ratings={ratingList}
                onRefreshAll={refreshAllModelCaches}
              />
            )}

            {activeTab === 'analytics' && (
              <LeaderboardAnalytics 
                currentUser={currentUser}
                series={seriesList}
                ratings={ratingList}
                onRefreshAll={refreshAllModelCaches}
              />
            )}

              </div>
            )}

          </main>
        </div>
      )}
    </div>
  );
}
