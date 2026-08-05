import React, { useState, useEffect } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { User, Series, Chapter, Task, Rating, UserRole } from "./types";
import { apiClient, getStoredUser, setStoredUserSession } from "./api/client";
import WorkspaceCanvas from "./components/WorkspaceCanvas";
import TaskDelegation from "./components/TaskDelegation";
import EditorialBoard from "./components/EditorialBoard";
import LeaderboardAnalytics from "./components/LeaderboardAnalytics";
import ChapterManagement from "./components/ChapterManagement";
import AssistantApp from "./components/assistant/AssistantApp";
import Navigation from "./components/Navigation";
import AdminPanel from "./components/AdminPanel";
import LoginBackground from "./components/LoginBackground";
import MotionScene from "./components/motion/MotionScene";
import { EditorApp } from "./features/editor/EditorApp.tsx";
import { AuthScreen } from "./features/auth/AuthScreen";
import { LandingPage } from "./features/landing/LandingPage";

export default function App() {
  // Session Authentication states
  const [currentUser, setCurrentUser] = useState<User | null>(getStoredUser());
  const [publicScreen, setPublicScreen] = useState<"landing" | "auth">("landing");
  const [authInitialMode, setAuthInitialMode] = useState<"login" | "register">("login");

  // Active workspace state caching
  const [activeTab, setActiveTabState] = useState<string>(() => {
    return localStorage.getItem("mangaflow_active_tab") || "workspace";
  });
  const setActiveTab = (tab: string) => {
    localStorage.setItem("mangaflow_active_tab", tab);
    setActiveTabState(tab);
  };

  const [seriesList, setSeriesList] = useState<Series[]>([]);
  const [chapterList, setChapterList] = useState<Chapter[]>([]);
  const [taskList, setTaskList] = useState<Task[]>([]);
  const [ratingList, setRatingList] = useState<Rating[]>([]);

  // Selected focusing points inside Workspace
  const [activeSeries, setActiveSeriesState] = useState<Series | null>(() => {
    const raw = localStorage.getItem("mangaflow_active_series");
    try {
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });
  const setActiveSeries = (series: Series | null) => {
    if (series) {
      localStorage.setItem("mangaflow_active_series", JSON.stringify(series));
    } else {
      localStorage.removeItem("mangaflow_active_series");
    }
    setActiveSeriesState(series);
  };

  const [activeChapter, setActiveChapterState] = useState<Chapter | null>(
    () => {
      const raw = localStorage.getItem("mangaflow_active_chapter");
      try {
        return raw ? JSON.parse(raw) : null;
      } catch {
        return null;
      }
    },
  );
  const setActiveChapter = (chapter: Chapter | null) => {
    if (chapter) {
      localStorage.setItem("mangaflow_active_chapter", JSON.stringify(chapter));
    } else {
      localStorage.removeItem("mangaflow_active_chapter");
    }
    setActiveChapterState(chapter);
  };

  // Configuration settings check
  const config = apiClient.getConfig();

  // Load and refresh core DB models from unified client
  const refreshAllModelCaches = async () => {
    try {
      const [liveSeries, liveChapters, liveTasks, liveRatings] = await Promise.all([
        apiClient.series.getAll().catch(() => []),
        apiClient.chapters.getAll().catch(() => []),
        apiClient.tasks.getAll().catch(() => []),
        apiClient.ratings.getAll().catch(() => []),
      ]);

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

      const approvedSeries = liveSeries.filter(
        (s) => s.status !== "PENDING" && s.status !== "REJECTED",
      );
      if (approvedSeries.length > 0) {
        const seriesExists =
          activeSeries &&
          approvedSeries.some((s) => s._id === activeSeries._id);
        const seriesValid =
          activeSeries && (!isLive || isValidObjectId(activeSeries._id));
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
        const getSeriesId = (c: any) => {
          if (!c) return undefined;
          if (typeof c.seriesId === "object" && c.seriesId !== null) return c.seriesId._id;
          return c.seriesId;
        };
        const validChaptersForSeries = liveChaptersList.filter(
          (c) => getSeriesId(c) === currentSid || c.series === currentSid,
        );
        const chapterExists =
          activeChapter &&
          liveChaptersList.some((c) => c._id === activeChapter._id);
        const chapterValid =
          activeChapter && (!isLive || isValidObjectId(activeChapter._id));

        if (
          !activeChapter ||
          !chapterExists ||
          !chapterValid ||
          (activeChapter &&
            getSeriesId(activeChapter) !== currentSid &&
            activeChapter.series !== currentSid)
        ) {
          if (validChaptersForSeries.length > 0) {
            setActiveChapter(validChaptersForSeries[0]);
          } else {
            // No chapters for this series — do NOT pick a chapter from another series
            setActiveChapter(null);
          }
        }
      } else {
        setActiveChapter(null);
      }
    } catch (err: any) {
      console.warn(
        "REST Synchronization failed - fallback state remains functional",
        err,
      );
    }
  };

  // Sync cache on authorization and configuration changes
  useEffect(() => {
    if (currentUser && currentUser.role !== "ASSISTANT") {
      refreshAllModelCaches();
    }
  }, [currentUser]);

  // Auth Submit Handlers
  const handleLoginSuccess = (user: User, role: UserRole) => {
    setCurrentUser(user);
    if (role === "ASSISTANT") {
      setActiveTab("assistant-tasks");
    } else if (role === "MANGAKA" || role === "EDITOR") {
      setActiveTab("workspace");
    } else if (role === "ADMIN") {
      setActiveTab("admin");
    } else {
      setActiveTab("board");
    }
  };

  // Logout session
  const handleLogout = () => {
    apiClient.auth.logout();
    setCurrentUser(null);
    localStorage.removeItem("mangaflow_active_tab");
    localStorage.removeItem("mangaflow_active_series");
    localStorage.removeItem("mangaflow_active_chapter");
    setActiveSeriesState(null);
    setActiveChapterState(null);
    setActiveTabState("workspace");
  };

  return (
    <div className="min-h-screen bg-manuscript-gray font-sans selection:bg-action-blue selection:text-white" style={{ overflowX: "clip" }}>
      {/* Universal Grid backdrop decoration dots */}
      <div
        className="ambient-grid fixed top-0 left-0 w-full h-full pointer-events-none z-[-1] opacity-40"
        style={{
          backgroundImage:
            "radial-gradient(#c7c6ca 0.75px, transparent 0.75px)",
          backgroundSize: "24px 24px",
        }}
      />

      {!currentUser ? (
        /* ======================== PUBLIC SCREENS ======================== */
        publicScreen === "landing" ? (
          <LandingPage 
            onNavigateToAuth={(mode) => {
              setAuthInitialMode(mode);
              setPublicScreen("auth");
            }} 
          />
        ) : (
          <AuthScreen 
            initialMode={authInitialMode}
            onLoginSuccess={handleLoginSuccess} 
            onBackToLanding={() => setPublicScreen("landing")}
          />
        )
      ) : currentUser.role === "ASSISTANT" ? (
        <AssistantApp
          currentUser={currentUser}
          activeTab={activeTab}
          onChangeTab={setActiveTab}
          onLogout={handleLogout}
        />
      ) : currentUser.role === "EDITOR" ? (
        /* ======================== EDITOR ROLE — NEW EDITOR SPA ======================== */
        <Routes>
          <Route
            path="/editor/*"
            element={<EditorApp onLogout={handleLogout} />}
          />
          <Route
            path="*"
            element={<Navigate to="/editor/dashboard" replace />}
          />
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
            <MotionScene sceneKey={`${currentUser.role}:${activeTab}`} className="min-h-[calc(100vh-4rem)]">
            {activeTab === "workspace" &&
              currentUser.role !== "BOARD_MEMBER" && (
                <div className="p-4 md:p-6">
                  <WorkspaceCanvas
                    currentUser={currentUser}
                    activeSeries={activeSeries}
                    activeChapter={activeChapter}
                    onRefreshTasks={refreshAllModelCaches}
                  />
                </div>
              )}

            {(activeTab !== "workspace" ||
              currentUser.role === "BOARD_MEMBER") && (
              <div className="p-4 md:p-8 lg:p-10 max-w-7xl mx-auto">
                {activeTab === "chapters" && (
                  <ChapterManagement
                    currentUser={currentUser!}
                    series={seriesList}
                    chapters={chapterList}
                    tasks={taskList}
                    activeSeries={activeSeries}
                    onRefreshAll={refreshAllModelCaches}
                    onSelectSeries={setActiveSeries}
                    onSelectChapter={setActiveChapter}
                    onChangeTab={setActiveTab}
                  />
                )}

                {activeTab === "tasks" && (
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

                {activeTab === "board" && (
                  <EditorialBoard
                    currentUser={currentUser}
                    series={seriesList}
                    ratings={ratingList}
                    onRefreshAll={refreshAllModelCaches}
                  />
                )}

                {activeTab === "analytics" && (
                  <LeaderboardAnalytics
                    currentUser={currentUser}
                    series={seriesList}
                    ratings={ratingList}
                    onRefreshAll={refreshAllModelCaches}
                  />
                )}

                {activeTab === "admin" && (
                  <AdminPanel
                    currentUser={currentUser!}
                    onRefreshAll={refreshAllModelCaches}
                  />
                )}
              </div>
            )}
            </MotionScene>
          </main>
        </div>
      )}
    </div>
  );
}
