/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { 
  Wifi, 
  Sparkles, 
  Database, 
  HelpCircle, 
  AlertTriangle, 
  X,
  RefreshCw,
  Info
} from "lucide-react";
import { Header } from "./components/Header";
import { StatsGrid } from "./components/StatsGrid";
import { RoleDashboard, RoleWelcomeBanner } from "./pages/RoleDashboard";
import {
  Chapter,
  Task,
  Series,
  User,
  SeriesRank,
  ActivityLog,
  Vote,
  ManuscriptReview,
  EditorDraftNote,
  ManuscriptReviewStatus,
  AppNotification,
  TaskDeliveryStatus,
} from "./types";
import { INITIAL_CHAPTERS, INITIAL_TASKS, INITIAL_SERIES, INITIAL_RANKS, MOCK_USERS } from "./data";
import { createNotification } from "./workflow/notifications";
import { withWorkflow, getMangakaId, SeriesWorkflowStatus } from "./workflow/seriesWorkflow";

const EDITOR_USER_ID = "usr-loc";
const BOARD_USER_ID = "usr-bao";

export default function App() {
  // Connection and URL state management
  const [connectionMode, setConnectionMode] = useState<"sandbox" | "backend" | "sandbox">(() => {
    return (localStorage.getItem("wdp301_conn_mode") as "sandbox" | "backend") || "sandbox";
  });
  const [backendUrl, setBackendUrl] = useState(() => {
    return localStorage.getItem("wdp301_backend_url") || "http://localhost:5000";
  });
  const [isBackendConnected, setIsBackendConnected] = useState(false);

  // Authenticated Current User
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem("wdp301_current_user");
    return saved ? JSON.parse(saved) : MOCK_USERS[3]; // Default initially to Lan Chi (Assistant role)
  });
  const [isLoadingAuth, setIsLoadingAuth] = useState(false);

  // Manga Series proposed list
  const [seriesList, setSeriesList] = useState<Series[]>(() => {
    const saved = localStorage.getItem("wdp301_series");
    return saved ? JSON.parse(saved) : INITIAL_SERIES;
  });

  // Chapters list
  const [chapters, setChapters] = useState<Chapter[]>(() => {
    const saved = localStorage.getItem("wdp301_chapters");
    return saved ? JSON.parse(saved) : INITIAL_CHAPTERS;
  });
  
  // Tasks list
  const [tasks, setTasks] = useState<Task[]>(() => {
    const saved = localStorage.getItem("wdp301_tasks");
    return saved ? JSON.parse(saved) : INITIAL_TASKS;
  });

  // Leaderboard ranks list
  const [ranksList, setRanksList] = useState<SeriesRank[]>(() => {
    const saved = localStorage.getItem("wdp301_ranks");
    return saved ? JSON.parse(saved) : INITIAL_RANKS;
  });

  // Votes from board members list
  const [votes, setVotes] = useState<Vote[]>(() => {
    const saved = localStorage.getItem("wdp301_votes");
    return saved ? JSON.parse(saved) : [];
  });

  const [manuscriptReviews, setManuscriptReviews] = useState<Record<string, ManuscriptReview>>(() => {
    const saved = localStorage.getItem("wdp301_manuscript_reviews");
    return saved ? JSON.parse(saved) : {};
  });

  const [editorDraftNotes, setEditorDraftNotes] = useState<Record<string, EditorDraftNote>>(() => {
    const saved = localStorage.getItem("wdp301_editor_notes");
    return saved ? JSON.parse(saved) : {};
  });

  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    const saved = localStorage.getItem("wdp301_notifications");
    return saved ? JSON.parse(saved) : [];
  });

  // Log events list state
  const [logs, setLogs] = useState<ActivityLog[]>(() => {
    const saved = localStorage.getItem("wdp301_logs");
    if (saved) {
      try { return JSON.parse(saved).map((l: any) => ({ ...l, timestamp: new Date(l.timestamp) })); } catch(e) {}
    }
    return [
      {
        id: "log-init-welcome",
        type: "connection_change",
        message: "Hệ thống Quản lý và Đồng thuận Manga WDP301 FE khởi tạo thành công mượt mà!",
        timestamp: new Date()
      }
    ];
  });

  // Operation states
  const [apiError, setApiError] = useState<string | null>(null);

  // Socket reference
  const socketRef = useRef<Socket | null>(null);

  // Persist states to local storage
  useEffect(() => {
    localStorage.setItem("wdp301_conn_mode", connectionMode);
    localStorage.setItem("wdp301_backend_url", backendUrl);
    localStorage.setItem("wdp301_series", JSON.stringify(seriesList));
    localStorage.setItem("wdp301_chapters", JSON.stringify(chapters));
    localStorage.setItem("wdp301_tasks", JSON.stringify(tasks));
    localStorage.setItem("wdp301_ranks", JSON.stringify(ranksList));
    localStorage.setItem("wdp301_votes", JSON.stringify(votes));
    localStorage.setItem("wdp301_manuscript_reviews", JSON.stringify(manuscriptReviews));
    localStorage.setItem("wdp301_editor_notes", JSON.stringify(editorDraftNotes));
    localStorage.setItem("wdp301_notifications", JSON.stringify(notifications));
    localStorage.setItem("wdp301_logs", JSON.stringify(logs));
    if (currentUser) {
      localStorage.setItem("wdp301_current_user", JSON.stringify(currentUser));
    } else {
      localStorage.removeItem("wdp301_current_user");
    }
  }, [connectionMode, backendUrl, seriesList, chapters, tasks, ranksList, votes, manuscriptReviews, editorDraftNotes, notifications, logs, currentUser]);

  const pushNotify = (n: Omit<AppNotification, "id" | "read" | "createdAt">) => {
    setNotifications((prev) => [createNotification(n), ...prev].slice(0, 120));
  };

  const patchSeries = (seriesId: string, ws: SeriesWorkflowStatus, extra?: Partial<Series>) => {
    setSeriesList((prev) =>
      prev.map((s) => (s._id === seriesId ? withWorkflow(s, ws, extra) : s))
    );
  };

  const getSeriesById = (id: string) => seriesList.find((s) => s._id === id);

  // Add system log helper
  const addLog = (type: ActivityLog["type"], message: string, meta?: any) => {
    const newLog: ActivityLog = {
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      type,
      message,
      timestamp: new Date(),
      meta
    };
    setLogs(prev => [newLog, ...prev].slice(0, 50));
  };

  const getMemberName = (id: string): string => {
    return MOCK_USERS.find(u => u._id === id)?.name || id;
  };

  // FETCH ALL DATA (REST WITH JWT AUTH HEADERS)
  const fetchDataFromBackend = async (token?: string) => {
    const targetToken = token || currentUser?.token;
    if (connectionMode !== "backend" || !targetToken) return;

    const headers = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${targetToken}`
    };

    try {
      // 1. Fetch active client Series list
      const sRes = await fetch(`${backendUrl}/api/series`, { headers });
      if (sRes.ok) {
        const sData = await sRes.json();
        setSeriesList(sData);
      }

      // 2. Fetch Chapters
      const cRes = await fetch(`${backendUrl}/api/chapters`, { headers });
      if (cRes.ok) {
        const cData = await cRes.json();
        setChapters(cData);
      }

      // 3. Fetch Tasks
      const tRes = await fetch(`${backendUrl}/api/tasks`, { headers });
      if (tRes.ok) {
        const tData = await tRes.json();
        setTasks(tData);
      }

      // 4. Fetch leaderboards / ranks
      const rRes = await fetch(`${backendUrl}/api/ranks`, { headers });
      if (rRes.ok) {
        const rData = await rRes.json();
        setRanksList(rData);
      } else {
        const rRes2 = await fetch(`${backendUrl}/api/rankings`, { headers });
        if (rRes2.ok) {
          const rData2 = await rRes2.json();
          setRanksList(rData2);
        }
      }

      // 5. Fetch board consensus Votes
      try {
        const vRes = await fetch(`${backendUrl}/api/votes`, { headers });
        if (vRes.ok) {
          const vData = await vRes.json();
          setVotes(vData);
        }
      } catch (err) {
        console.warn("Consensus comments (votes) API is pending setup on backend", err);
      }

      addLog("connection_change", `📥 Đã đồng bộ toàn bộ cơ sở dữ liệu Manga & Ranks từ backend mượt mà!`);
    } catch (err: any) {
      console.error(err);
      addLog("connection_change", `⚠️ Gặp lỗi khi đồng bộ REST API dữ liệu: ${err.message}`);
    }
  };

  // SEAMLESS AUTO REGISTER & LOGIN WITH JWT TOKEN PROVISIONING
  const handleUserAuthentication = async (targetUser: User) => {
    if (connectionMode !== "backend") {
      setCurrentUser(targetUser);
      addLog("connection_change", `👤 Đã đổi vai trò (Sandbox): ${targetUser.name} (${targetUser.role})`);
      return;
    }

    setIsLoadingAuth(true);
    setApiError(null);
    try {
      addLog("connection_change", `🔐 Đang đồng bộ tài khoản và đăng nhập JWT: ${targetUser.name}...`);
      
      const loginPayload = { email: targetUser.email, password: "123456" };
      let res = await fetch(`${backendUrl}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginPayload)
      });

      if (res.status === 401 || res.status === 404) {
        // Automatically attempt to register this user on their local MongoDB inside backend to save steps!
        addLog("connection_change", `🔑 Tài khoản chưa có trên database backend. Tự động gọi Đăng Ký (POST /api/auth/register) cho: ${targetUser.name}...`);
        const regPayload = {
          name: targetUser.name,
          email: targetUser.email,
          password: "123456",
          role: targetUser.role
        };
        const regRes = await fetch(`${backendUrl}/api/auth/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(regPayload)
        });

        if (!regRes.ok) {
          throw new Error(`Tự động đăng ký trên backend bị từ chối: code ${regRes.status}`);
        }

        addLog("connection_change", `✔ Khởi tạo tài khoản ${targetUser.name} thành công. Đang lấy nhận Token...`);
        // Retry logging in
        res = await fetch(`${backendUrl}/api/auth/login`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(loginPayload)
        });
      }

      if (!res.ok) {
        throw new Error(`Đăng nhập thất bại: Máy chủ trả về code ${res.status}`);
      }

      const authData = await res.json();
      const actualToken = authData.token || authData.accessToken || "mock-token-fallback";
      
      const authenticatedUser: User = {
        ...targetUser,
        token: actualToken,
        _id: authData.user?._id || authData.user?.id || targetUser._id
      };

      setCurrentUser(authenticatedUser);
      addLog("connection_change", `🟢 JWT TOKEN ACQUIRED: Đăng nhập thành công! Phiên hoạt động chuẩn hóa qua Bearer Token.`, authData);
      
      // Load all workspace files from Mongo DB
      fetchDataFromBackend(actualToken);
    } catch (err: any) {
      console.error(err);
      setApiError(`Lỗi xác thực và tự động tạo vai trò: ${err.message}. FE sẽ dùng chế độ mô phỏng cho vai trò này.`);
      // Fallback locally
      setCurrentUser(targetUser);
    } finally {
      setIsLoadingAuth(false);
    }
  };

  // SOCKETS SYNC PIPELINE
  useEffect(() => {
    if (connectionMode === "backend") {
      addLog("connection_change", `🔌 Đang bắt tay ghép nối Socket.io ở ${backendUrl}...`);

      const socket = io(backendUrl, {
        transports: ["websocket", "polling"],
        reconnectionDelay: 2000,
        reconnectionDelayMax: 6000,
        reconnectionAttempts: 8
      });

      socketRef.current = socket;

      socket.on("connect", () => {
        setIsBackendConnected(true);
        setApiError(null);
        addLog("connection_change", "🟢 CHUỖI SOCKET HOẠT ĐỘNG: Lắng nghe live event streams thành công!", { socketId: socket.id });
        if (currentUser?.token) {
          fetchDataFromBackend();
        }
      });

      socket.on("disconnect", (reason) => {
        setIsBackendConnected(false);
        addLog("connection_change", `⚪ MẤT KẾT NỐI: Đứt kết nối socket. Lý do: ${reason}`);
      });

      socket.on("connect_error", (error) => {
        setIsBackendConnected(false);
        setApiError(`Lỗi liên lạc WebSockets: ${error.message}.`);
      });

      // Socket feedback listeners
      socket.on("task_assigned", (data: any) => {
        setTasks(prev => {
          if (prev.some(t => t._id === data._id)) return prev;
          return [data, ...prev];
        });
        addLog("task_assigned", `📢 [WEBSOCKET] Đã giao việc: "${data.title}" cho @${getMemberName(data.assignedTo)}!`, data);
      });

      socket.on("task_done", (data: any) => {
        setTasks(prev => prev.map(t => t._id === data._id ? { ...t, status: "DONE" } : t));
        addLog("task_done", `🎉 [WEBSOCKET] Độc lập hoàn thành: "${data.title}" bởi @${getMemberName(data.assignedTo)}!`, data);
      });

      socket.on("rating_created", (data: any) => {
        addLog("rating_created", `🌟 [WEBSOCKET] Độc giả bỏ phiếu mới thành công! Điểm: ${data.voteCount || data.score || ""}`, data);
        fetchDataFromBackend(); // Reload rankings automatically!
      });

      socket.on("vote_submitted", (data: any) => {
        addLog("vote_submitted", `🗳️ [WEBSOCKET] Nhận được phiếu bầu thực tế cho mã truyện!`, data);
        fetchDataFromBackend();
      });

      return () => {
        socket.disconnect();
      };
    } else {
      setIsBackendConnected(false);
      setApiError(null);
    }
  }, [connectionMode, backendUrl, currentUser]);

  // Handle account initial loading on switch modes
  useEffect(() => {
    if (currentUser) {
      handleUserAuthentication(currentUser);
    }
  }, [connectionMode]);

  // REST: PROPOSE NEW SERIES (POST /api/series)
  const handleSeriesCreate = async (title: string, synopsis: string) => {
    const payload = { title, synopsis };
    
    if (connectionMode === "backend" && currentUser?.token) {
      try {
        const res = await fetch(`${backendUrl}/api/series`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${currentUser.token}`
          },
          body: JSON.stringify(payload)
        });
        
        if (!res.ok) throw new Error(`Status code ${res.status}`);
        const data = await res.json();
        setSeriesList(prev => [data, ...prev]);
        addLog("series_proposed", `📝 Đệ văn lên thành công Manga mới: "${title}" trực tiếp trên Mongo!`, data);
      } catch (err: any) {
        addLog("connection_change", `❌ Lỗi lưu đề thảo: ${err.message}`);
        setApiError(`Không thể đề xuất series mới lên máy chủ: ${err.message}`);
        throw err;
      }
    } else {
      // Sandbox Simulator
      const simS: Series = withWorkflow(
        {
          _id: `ser-sim-${Date.now()}`,
          title,
          synopsis,
          mangakaId: currentUser?._id || "usr-oda",
          status: "PENDING",
          createdAt: new Date().toISOString(),
        },
        "DRAFT"
      );
      setSeriesList(prev => [simS, ...prev]);
      addLog("series_proposed", `📝 [Sandbox Model] Đệ trình thành công Manga đề xuất: "${title}" chờ editor duyệt.`, simS);
    }
  };

  // REST: DECLARE CHAPTER (POST /api/chapters)
  const handleChapterCreate = async (seriesId: string, chapterNumber: number, title: string, dueAt?: string) => {
    const payload = { seriesId, chapterNumber, title, dueAt };

    if (connectionMode === "backend" && currentUser?.token) {
      try {
        const res = await fetch(`${backendUrl}/api/chapters`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${currentUser.token}`
          },
          body: JSON.stringify(payload)
        });

        if (!res.ok) throw new Error(`Status code ${res.status}`);
        const data = await res.json();
        setChapters(prev => [...prev, data]);
        addLog("chapter_created", `📦 Khai báo thành công Chapter #${chapterNumber}: "${title}" trên MongoDB!`, data);
      } catch (err: any) {
        setApiError(`Lỗi tạo Chapter backend: ${err.message}`);
        throw err;
      }
    } else {
      const simC: Chapter = {
        _id: `chap-sim-${Date.now()}`,
        seriesId,
        chapterNumber,
        title,
        status: "IN_PROGRESS",
        dueAt: dueAt || new Date(Date.now() + 3600*24*7*1000).toISOString(),
        createdAt: new Date().toISOString()
      };
      setChapters(prev => [...prev, simC]);
      addLog("chapter_created", `📦 [Sandbox Model] Tạo thành công Chapter ${chapterNumber}: "${title}" chuẩn tiến độ.`, simC);
    }
  };

  // REST: ASSIGN TASK (POST /api/tasks)
  const handleTaskCreate = async (seriesId: string, chapterId: string, assignedTo: string, title: string) => {
    const payload = { seriesId, chapterId, assignedTo, title };

    if (connectionMode === "backend" && currentUser?.token) {
      try {
        const res = await fetch(`${backendUrl}/api/tasks`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${currentUser.token}`
          },
          body: JSON.stringify(payload)
        });

        if (!res.ok) throw new Error(`Status code ${res.status}`);
        const data = await res.json();
        setTasks(prev => {
          if (prev.some(t => t._id === data._id)) return prev;
          return [data, ...prev];
        });
        addLog("task_assigned", `📢 API success: Đã giao việc thành công cho ${getMemberName(data.assignedTo)}!`, data);
      } catch (err: any) {
        setApiError(`Giao task thất bại: ${err.message}`);
        throw err;
      }
    } else {
      const simT: Task = {
        _id: `tsk-sim-${Date.now()}`,
        seriesId,
        chapterId,
        assignedTo,
        title,
        status: "PENDING",
        deliveryStatus: "ASSIGNED",
        createdAt: new Date().toISOString(),
      };
      setTasks((prev) => [simT, ...prev]);
      const ser = getSeriesById(seriesId);
      pushNotify({
        recipientUserId: assignedTo,
        recipientRole: "ASSISTANT",
        title: "Công việc mới",
        message: `Mangaka giao: "${title}" — ${ser?.title || "Series"}`,
        seriesId,
        chapterId,
        taskId: simT._id,
      });
      setTimeout(() => {
        addLog("task_assigned", `🔔 [Socket Feedback] Nhiệm vụ "${title}" đã nằm trên hàng chờ của trợ lý @${getMemberName(assignedTo)}!`, simT);
      }, 350);
    }
  };

  // REST: SUBMIT TASK (PUT /api/tasks/:id/submit)
  const handleTaskSubmit = async (taskId: string) => {
    const target = tasks.find(t => t._id === taskId);
    if (!target) return;

    if (connectionMode === "backend" && currentUser?.token) {
      try {
        const res = await fetch(`${backendUrl}/api/tasks/${taskId}/submit`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${currentUser.token}`
          }
        });

        if (!res.ok) throw new Error(`Status code ${res.status}`);
        const data = await res.json();
        setTasks(prev => prev.map(t => t._id === taskId ? { ...t, status: "DONE" } : t));
        addLog("task_done", `🎉 API success: Hoàn thành nộp Task "${data.title}" của ${getMemberName(data.assignedTo)}!`, data);
      } catch (err: any) {
        setApiError(`Lỗi nộp bài lên backend: ${err.message}`);
      }
    } else {
      setTasks((prev) =>
        prev.map((t) =>
          t._id === taskId
            ? { ...t, status: "DONE", deliveryStatus: "SUBMITTED" as TaskDeliveryStatus, updatedAt: new Date().toISOString() }
            : t
        )
      );
      const ser = getSeriesById(target.seriesId);
      const mId = ser ? getMangakaId(ser) : "usr-oda";
      pushNotify({
        recipientUserId: mId,
        recipientRole: "MANGAKA",
        title: "Assistant đã nộp bài",
        message: `"${target.title}" — kiểm duyệt và gửi Editor khi xong.`,
        seriesId: target.seriesId,
        taskId,
      });
      setTimeout(() => {
        addLog("task_done", `🎉 [Sandbox Socket] Trợ lý @${getMemberName(target.assignedTo)} hoàn thành nộp tập sự: "${target.title}"!`, { ...target, status: "DONE" });
      }, 300);
    }
  };

  // REST: REVIEW PROPOSAL (PUT /api/series/:id/review)
  const handleSeriesReview = async (seriesId: string, action: "APPROVED" | "REJECTED", note: string, pubSchedule?: "WEEKLY" | "MONTHLY") => {
    const payload = { status: action, reviewNote: note, pubSchedule };

    if (connectionMode === "backend" && currentUser?.token) {
      try {
        const res = await fetch(`${backendUrl}/api/series/${seriesId}/review`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${currentUser.token}`
          },
          body: JSON.stringify(payload)
        });

        if (!res.ok) throw new Error(`Status code ${res.status}`);
        const data = await res.json();
        
        setSeriesList(prev => prev.map(s => s._id === seriesId ? data : s));
        addLog("series_reviewed", `⚖️ API success: Đã xét duyệt truyện với kết quả [${action}]!`, data);
      } catch (err: any) {
        setApiError(`Lỗi đánh giá: ${err.message}`);
        throw err;
      }
    } else {
      setSeriesList(prev => prev.map(s => {
        if (s._id === seriesId) {
          return {
            ...s,
            status: action,
            reviewedBy: currentUser?._id || "usr-loc",
            reviewNote: note,
            pubSchedule: pubSchedule || null,
            reviewedAt: new Date().toISOString()
          };
        }
        return s;
      }));
      addLog("series_reviewed", `⚖️ [Giả Lập] Phê chuẩn kết quả cho bộ truyện: [${action}]`, { seriesId, action, note });
    }
  };

  // REST: CHANGE STATUS TRANSITION (PUT /api/series/:id/status)
  const handleStatusTransition = async (seriesId: string, status: "APPROVED" | "IN_PRODUCTION" | "PUBLISHED" | "REJECTED" | "CANCELLED") => {
    const payload = { status };

    if (connectionMode === "backend" && currentUser?.token) {
      try {
        const res = await fetch(`${backendUrl}/api/series/${seriesId}/status`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${currentUser.token}`
          },
          body: JSON.stringify(payload)
        });

        if (!res.ok) throw new Error(`Status code ${res.status}`);
        const data = await res.json();

        setSeriesList(prev => prev.map(s => s._id === seriesId ? data : s));
        addLog("series_reviewed", `⚙️ API success: Chuyển tiếp trạng thái thành công sang [${status}]!`, data);
      } catch (err: any) {
        setApiError(`Lỗi chuyển tiếp trạng thái đầu sách: ${err.message}`);
        throw err;
      }
    } else {
      setSeriesList(prev => prev.map(s => s._id === seriesId ? { ...s, status } : s));
      addLog("series_reviewed", `⚙️ [Giả lập] Chuyển tiếp tình trạng làm việc sang: ${status}`);
    }
  };

  // REST: SUBMIT READER RATING / VOTE (POST /api/ratings)
  const handleRatingSubmit = async (seriesId: string, voteCount: number, sourceFrom: string) => {
    const payload = { seriesId, voteCount, score: voteCount, sourceFrom };

    if (connectionMode === "backend" && currentUser?.token) {
      try {
        // Try submitting both ratings & votes endpoint to guarantee success in matching different controller styles!
        await fetch(`${backendUrl}/api/ratings`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${currentUser.token}`
          },
          body: JSON.stringify(payload)
        });
        
        fetchDataFromBackend(); // Force recalculate ranks and lists from mongo
        addLog("rating_created", `🌟 API success: Ghi nhận phiếu chấm điểm từ độc giả (+${voteCount} stars)`);
      } catch (err: any) {
        setApiError(`Ghi phiếu chấm điểm thất bại: ${err.message}`);
      }
    } else {
      addLog("rating_created", `🌟 [Giả Lập] Nhận được biểu quyết chấm điểm: +${voteCount} phiếu từ nguồn [${sourceFrom}]!`);
      // Sim recalculate
      setRanksList(prev => {
        const list = [...prev];
        const matchIdx = list.findIndex(r => r.seriesId === seriesId);
        if (matchIdx !== -1) {
          const target = list[matchIdx];
          if (target.rank > 1) {
            const upperIdx = list.findIndex(r => r.rank === target.rank - 1);
            if (upperIdx !== -1) {
              list[matchIdx].rank -= 1;
              list[upperIdx].rank += 1;
            }
          }
        }
        return list;
      });
    }
  };

  // REST: UPDATE CHAPTER (PUT /api/chapters/:id)
  const handleChapterUpdate = async (id: string, updatedFields: Partial<Chapter>) => {
    if (connectionMode === "backend" && currentUser?.token) {
      try {
        const res = await fetch(`${backendUrl}/api/chapters/${id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${currentUser.token}`
          },
          body: JSON.stringify(updatedFields)
        });
        if (!res.ok) throw new Error(`Code ${res.status}`);
        const data = await res.json();
        setChapters(prev => prev.map(c => c._id === id ? data : c));
        addLog("chapter_created", `⚙️ Cập nhật thành công Chapter: "${data.title}" trên MongoDB!`, data);
      } catch (err: any) {
        setApiError(`Lỗi cập nhật Chapter: ${err.message}`);
        throw err;
      }
    } else {
      setChapters(prev => prev.map(c => c._id === id ? { ...c, ...updatedFields } : c));
      addLog("chapter_created", `⚙️ [Sandbox Model] Đã cập nhật Chapter thành công!`);
    }
  };

  // REST: DELETE CHAPTER (DELETE /api/chapters/:id)
  const handleChapterDelete = async (id: string) => {
    if (connectionMode === "backend" && currentUser?.token) {
      try {
        const res = await fetch(`${backendUrl}/api/chapters/${id}`, {
          method: "DELETE",
          headers: {
            "Authorization": `Bearer ${currentUser.token}`
          }
        });
        if (!res.ok) throw new Error(`Code ${res.status}`);
        setChapters(prev => prev.filter(c => c._id !== id));
        addLog("connection_change", `🗑️ Đã xoá thành công Chapter khỏi MongoDB!`);
      } catch (err: any) {
        setApiError(`Lỗi xoá Chapter: ${err.message}`);
        throw err;
      }
    } else {
      setChapters(prev => prev.filter(c => c._id !== id));
      addLog("connection_change", `🗑️ [Sandbox Model] Đã xoá Chapter`);
    }
  };

  // REST: PUBLISH CHAPTER (PUT /api/chapters/:id/publish)
  const handleChapterPublish = async (id: string) => {
    if (connectionMode === "backend" && currentUser?.token) {
      try {
        const res = await fetch(`${backendUrl}/api/chapters/${id}/publish`, {
          method: "PUT",
          headers: {
            "Authorization": `Bearer ${currentUser.token}`
          }
        });
        if (!res.ok) throw new Error(`Code ${res.status}`);
        const data = await res.json();
        setChapters(prev => prev.map(c => c._id === id ? { ...c, status: "COMPLETED" } : c));
        addLog("chapter_published", `🚀 Đã Xuất Bản và Phát Sóng live sự kiện Chapter thành công!`, data);
      } catch (err: any) {
        setApiError(`Lỗi publish Chapter: ${err.message}`);
        throw err;
      }
    } else {
      setChapters(prev => prev.map(c => c._id === id ? { ...c, status: "COMPLETED" } : c));
      addLog("chapter_published", `🚀 [Sandbox Model] Đã phát sóng live sự kiện Xuất bản Chapter mượt mà!`);
    }
  };

  // REST: SUBMIT VOTE OF BOARD MEMBER (POST /api/votes)
  const handleVoteSubmit = async (seriesId: string, decision: "ACCEPT" | "REJECT", comment: string) => {
    const payload = { submissionId: seriesId, decision, comment };
    if (connectionMode === "backend" && currentUser?.token) {
      try {
        const res = await fetch(`${backendUrl}/api/votes`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${currentUser.token}`
          },
          body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error(`Code ${res.status}`);
        const data = await res.json();
        setVotes(prev => [...prev, data]);
        addLog("vote_submitted", `🗳️ Đã bỏ phiếu biểu quyết [${decision}] cho bộ truyện thành công!`, data);
      } catch (err: any) {
        setApiError(`Gặp lỗi khi lưu phiếu bầu: ${err.message}`);
        throw err;
      }
    } else {
      const simV: Vote = {
        _id: `vote-sim-${Date.now()}`,
        submissionId: seriesId,
        voterId: { _id: currentUser?._id || "usr-bao", name: currentUser?.name || "Chi hội đồng", email: currentUser?.email || "" },
        decision,
        comment,
        createdAt: new Date().toISOString()
      };
      setVotes(prev => [...prev, simV]);
      addLog("vote_submitted", `🗳️ [Sandbox Model] Đã bỏ phiếu biểu quyết [${decision}]: "${comment}"`);
    }
  };

  // REST: LOGIN THỦ CÔNG
  const handleManualLogin = async (email: string, password: string) => {
    setIsLoadingAuth(true);
    setApiError(null);
    try {
      addLog("connection_change", `🔐 Tiến hành Đăng Nhập thủ công: ${email}...`);
      const res = await fetch(`${backendUrl}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });

      if (!res.ok) {
        throw new Error(`Đăng nhập thất bại: Máy chủ trả về code ${res.status}`);
      }

      const authData = await res.json();
      const userData = authData.data || authData.user || authData;
      const actualToken = authData.token || authData.accessToken || authData.data?.token || "mock-token";

      const authenticatedUser: User = {
        _id: userData._id || userData.id || `usr-${Date.now()}`,
        name: userData.name || "Tài khoản của tôi",
        email: userData.email || email,
        role: userData.role || "MANGAKA",
        avatar: userData.name ? userData.name.substring(0, 2).toUpperCase() : "MY",
        token: actualToken
      };

      setCurrentUser(authenticatedUser);
      addLog("connection_change", `🟢 ĐĂNG NHẬP THỦ CÔNG: Đồng bộ tài khoản và token thành công!`, authData);
      fetchDataFromBackend(actualToken);
    } catch (err: any) {
      console.error(err);
      setApiError(`Lỗi đăng nhập: ${err.message}. Hãy kiểm tra kết nối cổng backend và tài khoản mật khẩu.`);
      throw err;
    } finally {
      setIsLoadingAuth(false);
    }
  };

  // REST: ĐĂNG KÝ THỦ CÔNG
  const handleManualRegister = async (name: string, email: string, password: string, role: "MANGAKA" | "ASSISTANT" | "EDITOR" | "BOARD_MEMBER") => {
    setIsLoadingAuth(true);
    setApiError(null);
    try {
      addLog("connection_change", `🔑 Tiến hành tạo tài khoản mới: ${name} (${role})...`);
      const regRes = await fetch(`${backendUrl}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, role })
      });

      if (!regRes.ok) {
        throw new Error(`Đăng ký bị từ chối: Máy chủ trả về code ${regRes.status}`);
      }

      addLog("connection_change", `✔ Đăng ký thành công tài khoản "${name}" trên MongoDB. Tiến hành tự động đăng nhập...`);
      await handleManualLogin(email, password);
    } catch (err: any) {
      console.error(err);
      setApiError(`Lỗi đăng ký: ${err.message}`);
      throw err;
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const handleManuscriptReview = (
    taskId: string,
    status: ManuscriptReviewStatus,
    note: string
  ) => {
    if (!currentUser) return;
    const review: ManuscriptReview = {
      taskId,
      status,
      note,
      reviewedAt: new Date().toISOString(),
      reviewedBy: currentUser._id,
    };
    setManuscriptReviews((prev) => ({ ...prev, [taskId]: review }));
    if (status === "APPROVED") {
      setTasks((prev) =>
        prev.map((t) =>
          t._id === taskId
            ? { ...t, deliveryStatus: "MANGAKA_APPROVED" as TaskDeliveryStatus }
            : t
        )
      );
    }
    const label = status === "APPROVED" ? "phê duyệt" : "yêu cầu chỉnh sửa";
    addLog("manuscript_reviewed", `📝 Mangaka đã ${label} bản tổng hợp task #${taskId.slice(-6)}`, review);
  };

  const handleEditorDraftNote = (
    chapterId: string,
    contentNote: string,
    dialogueNote: string,
    scriptNote: string
  ) => {
    if (!currentUser) return;
    const note: EditorDraftNote = {
      chapterId,
      contentNote,
      dialogueNote,
      scriptNote,
      updatedAt: new Date().toISOString(),
      editorId: currentUser._id,
    };
    setEditorDraftNotes((prev) => ({ ...prev, [chapterId]: note }));
    addLog("draft_note_added", `✏️ Editor gửi yêu cầu chỉnh sửa cho chapter`, note);
  };

  const handleSubmitSeriesToEditor = (seriesId: string) => {
    const ser = getSeriesById(seriesId);
    if (!ser) return;
    patchSeries(seriesId, "PENDING_EDITOR");
    pushNotify({
      recipientUserId: EDITOR_USER_ID,
      recipientRole: "EDITOR",
      title: "Đề xuất series mới",
      message: `Mangaka gửi "${ser.title}" — chờ duyệt và gửi Board.`,
      seriesId,
    });
    addLog("workflow_transition", `📤 Mangaka gửi "${ser.title}" lên Editor`, { seriesId });
  };

  const handleMangakaReviseSeries = (seriesId: string, title: string, synopsis: string) => {
    patchSeries(seriesId, "PENDING_EDITOR", { title, synopsis, revisionNote: undefined });
    const ser = getSeriesById(seriesId);
    pushNotify({
      recipientUserId: EDITOR_USER_ID,
      recipientRole: "EDITOR",
      title: "Mangaka nộp lại sau chỉnh sửa",
      message: `"${title}" đã được cập nhật — vui lòng duyệt lại.`,
      seriesId,
    });
    addLog("workflow_transition", `🔄 Mangaka chỉnh sửa & gửi lại: "${title}"`, { seriesId });
  };

  const handleEditorRequestRevision = (seriesId: string, note: string) => {
    const ser = getSeriesById(seriesId);
    if (!ser) return;
    patchSeries(seriesId, "REVISION_REQUIRED", { revisionNote: note, reviewNote: note, reviewedBy: currentUser?._id });
    pushNotify({
      recipientUserId: getMangakaId(ser),
      recipientRole: "MANGAKA",
      title: "Editor yêu cầu chỉnh sửa",
      message: `"${ser.title}": ${note}`,
      seriesId,
    });
    addLog("workflow_transition", `📝 Editor yêu cầu sửa series`, { seriesId, note });
  };

  const handleEditorSendToBoard = (seriesId: string, note: string) => {
    const ser = getSeriesById(seriesId);
    if (!ser) return;
    patchSeries(seriesId, "AWAITING_BOARD", {
      reviewNote: note,
      reviewedBy: currentUser?._id,
      reviewedAt: new Date().toISOString(),
    });
    pushNotify({
      recipientUserId: BOARD_USER_ID,
      recipientRole: "BOARD_MEMBER",
      title: "Series chờ vote xuất bản",
      message: `Editor gửi "${ser.title}" lên Hội đồng — vote Weekly/Monthly.`,
      seriesId,
    });
    addLog("workflow_transition", `📨 Editor gửi thủ công "${ser.title}" lên Board`, { seriesId });
  };

  const handleBoardVotePublish = (
    seriesId: string,
    pubSchedule: "WEEKLY" | "MONTHLY",
    comment?: string
  ) => {
    const ser = getSeriesById(seriesId);
    if (!ser) return;
    patchSeries(seriesId, "IN_PRODUCTION", {
      pubSchedule,
      reviewNote: comment,
      productionStartedAt: new Date().toISOString(),
    });
    pushNotify({
      recipientUserId: EDITOR_USER_ID,
      recipientRole: "EDITOR",
      title: "Board đã vote xuất bản",
      message: `"${ser.title}" — ${pubSchedule}. Đặt deadline chapter cho Mangaka.`,
      seriesId,
    });
    pushNotify({
      recipientUserId: getMangakaId(ser),
      recipientRole: "MANGAKA",
      title: "Series vào sản xuất",
      message: `"${ser.title}" xuất bản ${pubSchedule}. Chờ Editor giao deadline.`,
      seriesId,
    });
    addLog("workflow_transition", `📅 Board vote ${pubSchedule} → IN_PRODUCTION`, { seriesId });
  };

  const handleBoardRejectSeries = (seriesId: string, comment?: string) => {
    patchSeries(seriesId, "CANCELLED", { reviewNote: comment });
    const ser = getSeriesById(seriesId);
    if (ser) {
      pushNotify({
        recipientUserId: getMangakaId(ser),
        recipientRole: "MANGAKA",
        title: "Series bị huỷ",
        message: `"${ser.title}" không được phê duyệt.`,
        seriesId,
      });
    }
    addLog("workflow_transition", `🚫 Board huỷ series`, { seriesId });
  };

  const handleEditorSetChapterDeadline = (chapterId: string, dueAt: string) => {
    setChapters((prev) =>
      prev.map((c) =>
        c._id === chapterId
          ? { ...c, dueAt, editorDeadlineSet: true, updatedAt: new Date().toISOString() }
          : c
      )
    );
    const chap = chapters.find((c) => c._id === chapterId);
    addLog("workflow_transition", `📆 Editor đặt deadline chapter`, { chapterId, dueAt });
  };

  const handleEditorNotifyMangakaStart = (seriesId: string) => {
    const ser = getSeriesById(seriesId);
    if (!ser) return;
    pushNotify({
      recipientUserId: getMangakaId(ser),
      recipientRole: "MANGAKA",
      title: "Bắt đầu sản xuất",
      message: `Editor đã giao deadline — bắt đầu làm và phân công Assistant cho "${ser.title}".`,
      seriesId,
    });
    addLog("workflow_transition", `▶️ Editor báo Mangaka bắt đầu`, { seriesId });
  };

  const handleMangakaSendWorkToEditor = (seriesId: string, taskIds: string[]) => {
    const ser = getSeriesById(seriesId);
    if (!ser) return;
    setTasks((prev) =>
      prev.map((t) =>
        taskIds.includes(t._id)
          ? { ...t, deliveryStatus: "WITH_EDITOR" as TaskDeliveryStatus, updatedAt: new Date().toISOString() }
          : t
      )
    );
    pushNotify({
      recipientUserId: EDITOR_USER_ID,
      recipientRole: "EDITOR",
      title: "Mangaka gửi bản hoàn chỉnh",
      message: `"${ser.title}" — ${taskIds.length} task chờ duyệt xuất bản.`,
      seriesId,
    });
    addLog("workflow_transition", `📬 Mangaka → Editor duyệt xuất bản`, { seriesId, taskIds });
  };

  const handleEditorApproveForPublish = (seriesId: string, note?: string) => {
    const ser = getSeriesById(seriesId);
    if (!ser) return;
    patchSeries(seriesId, "PENDING_PUBLISH", { reviewNote: note });
    pushNotify({
      recipientUserId: BOARD_USER_ID,
      recipientRole: "BOARD_MEMBER",
      title: "Chờ xuất bản chính thức",
      message: `Editor duyệt "${ser.title}" — Board chốt PUBLISHED.`,
      seriesId,
    });
    addLog("workflow_transition", `✅ Editor duyệt → gửi Board xuất bản`, { seriesId });
  };

  const handleBoardFinalPublish = (seriesId: string) => {
    const ser = getSeriesById(seriesId);
    if (!ser) return;
    patchSeries(seriesId, "PUBLISHED");
    setTasks((prev) =>
      prev.map((t) =>
        t.seriesId === seriesId ? { ...t, deliveryStatus: "PUBLISHED" as TaskDeliveryStatus } : t
      )
    );
    pushNotify({
      recipientUserId: getMangakaId(ser),
      recipientRole: "MANGAKA",
      title: "Đã xuất bản",
      message: `"${ser.title}" đã PUBLISHED trên hệ thống.`,
      seriesId,
    });
    pushNotify({
      recipientUserId: EDITOR_USER_ID,
      recipientRole: "EDITOR",
      title: "Xuất bản hoàn tất",
      message: `"${ser.title}" — Board đã chốt PUBLISHED.`,
      seriesId,
    });
    addLog("workflow_transition", `🚀 PUBLISHED: "${ser.title}"`, { seriesId });
  };

  const handleMarkNotificationRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const handleMarkAllNotificationsRead = () => {
    if (!currentUser) return;
    setNotifications((prev) =>
      prev.map((n) => {
        const mine =
          n.recipientUserId === currentUser._id ||
          n.recipientRole === currentUser.role ||
          n.recipientRole === "ALL";
        return mine ? { ...n, read: true } : n;
      })
    );
  };

  const handleClearLogs = () => setLogs([]);

  const handleResetSandbox = () => {
    localStorage.removeItem("wdp301_series");
    localStorage.removeItem("wdp301_chapters");
    localStorage.removeItem("wdp301_tasks");
    localStorage.removeItem("wdp301_ranks");
    localStorage.removeItem("wdp301_logs");

    setSeriesList(INITIAL_SERIES);
    setChapters(INITIAL_CHAPTERS);
    setTasks(INITIAL_TASKS);
    setRanksList(INITIAL_RANKS);
    setNotifications([]);
    setLogs([
      {
        id: `log-reset-${Date.now()}`,
        type: "connection_change",
        message: "Hệ thống Cát lún vừa được nạp mới dữ liệu hạt giống ban đầu thành công mượt mà!",
        timestamp: new Date()
      }
    ]);
  };

  return (
    <div className="bg-zinc-50 min-h-screen pb-12 text-zinc-900 selection:bg-zinc-900 selection:text-white font-sans" id="app-root">
      
      {/* Dynamic Header */}
      <Header
        connectionMode={connectionMode}
        backendUrl={backendUrl}
        isBackendConnected={isBackendConnected}
        currentUser={currentUser}
        isLoadingAuth={isLoadingAuth}
        onConnectionModeChange={setConnectionMode}
        onBackendUrlChange={setBackendUrl}
        onUserSwitch={handleUserAuthentication}
        onLogout={() => setCurrentUser(null)}
        onManualLogin={handleManualLogin}
        onManualRegister={handleManualRegister}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        
        {/* Error notice banner */}
        {apiError && (
          <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs font-semibold flex items-start gap-2.5 shadow-xs" id="api-error-alert">
            <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
            <div className="flex-1">
              <span className="font-bold">Lưu ý sự tương hợp API:</span> {apiError}
              <p className="mt-1 font-normal text-rose-700 leading-relaxed">
                Đảm bảo máy cá nhân của bạn đang chạy NodeJS dev server (ví dụ trên cổng <code className="font-mono bg-rose-100 rounded px-1.5 text-rose-800">5000</code>), bật mạng MongoDB và cho phép kết nối CORS từ trình duyệt. <strong className="font-bold underline cursor-pointer" onClick={() => setConnectionMode("sandbox")}>Chuyển sang Giả Lập Cát lún (Sandbox)</strong> để test giao diện độc lập với server mượt mà.
              </p>
            </div>
            <button 
              onClick={() => setApiError(null)}
              className="text-rose-500 hover:text-rose-700 outline-none cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Informative Banner about active connection mode */}
        <div className="mb-6 p-4 rounded-2xl bg-zinc-900 text-white flex justify-between items-center flex-wrap gap-4" id="intro-banner">
          <div className="flex gap-3.5 items-center">
            <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center shrink-0 border border-zinc-700/80">
              {connectionMode === "sandbox" ? (
                <Sparkles className="w-5 h-5 text-amber-400" />
              ) : (
                <Database className="w-5 h-5 text-indigo-400" />
              )}
            </div>
            <div>
              <h2 className="text-sm font-bold tracking-tight">
                Liên kết: {connectionMode === "sandbox" ? "Mầm Cát (Sandbox Simulator) thiết kế khép kín" : `MongoDB Live Server (${backendUrl})`}
              </h2>
              {currentUser ? (
                <RoleWelcomeBanner user={currentUser} />
              ) : (
                <p className="text-[11px] text-zinc-400 max-w-2xl mt-0.5 leading-relaxed">
                  {connectionMode === "sandbox"
                    ? "Đăng nhập hoặc chọn tài khoản mẫu ở thanh trên để vào bảng điều khiển theo vai trò."
                    : "Hệ thống đồng bộ JWT khi đổi vai trò. Mỗi role chỉ thấy chức năng được phép."}
                </p>
              )}
            </div>
          </div>

          <div className="flex gap-2">
            {connectionMode === "sandbox" ? (
              <button
                id="reset-sandbox-btn"
                onClick={handleResetSandbox}
                className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-zinc-700 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Nạp lại mẫu Sandbox
              </button>
            ) : (
              <button
                id="sync-backend-btn"
                onClick={() => fetchDataFromBackend()}
                className="bg-zinc-800 hover:bg-zinc-700 text-zinc-350 hover:text-white px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 border border-zinc-700 transition-colors cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Đồng bộ REST API
              </button>
            )}
          </div>
        </div>

        {/* Stats Summary Panel */}
        <StatsGrid
          seriesList={seriesList}
          chapters={chapters}
          tasks={tasks}
          usersCount={MOCK_USERS.length}
        />

        {currentUser ? (
          <RoleDashboard
            currentUser={currentUser}
            seriesList={seriesList}
            chapters={chapters}
            tasks={tasks}
            ranksList={ranksList}
            votes={votes}
            logs={logs}
            notifications={notifications}
            manuscriptReviews={manuscriptReviews}
            editorDraftNotes={editorDraftNotes}
            onSeriesCreate={handleSeriesCreate}
            onSubmitSeriesToEditor={handleSubmitSeriesToEditor}
            onMangakaReviseSeries={handleMangakaReviseSeries}
            onEditorRequestRevision={handleEditorRequestRevision}
            onEditorSendToBoard={handleEditorSendToBoard}
            onBoardVotePublish={handleBoardVotePublish}
            onBoardRejectSeries={handleBoardRejectSeries}
            onEditorSetChapterDeadline={handleEditorSetChapterDeadline}
            onEditorNotifyMangakaStart={handleEditorNotifyMangakaStart}
            onMangakaSendWorkToEditor={handleMangakaSendWorkToEditor}
            onEditorApproveForPublish={handleEditorApproveForPublish}
            onBoardFinalPublish={handleBoardFinalPublish}
            onChapterCreate={handleChapterCreate}
            onTaskCreate={handleTaskCreate}
            onTaskSubmit={handleTaskSubmit}
            onSeriesReview={handleSeriesReview}
            onStatusTransition={handleStatusTransition}
            onRatingSubmit={handleRatingSubmit}
            onChapterUpdate={handleChapterUpdate}
            onChapterDelete={handleChapterDelete}
            onChapterPublish={handleChapterPublish}
            onVoteSubmit={handleVoteSubmit}
            onManuscriptReview={handleManuscriptReview}
            onEditorDraftNote={handleEditorDraftNote}
            onMarkNotificationRead={handleMarkNotificationRead}
            onMarkAllNotificationsRead={handleMarkAllNotificationsRead}
            onClearLogs={handleClearLogs}
          />
        ) : (
          <div className="py-16 text-center border border-dashed border-zinc-300 rounded-2xl bg-white">
            <p className="text-sm font-bold text-zinc-700">Chưa đăng nhập</p>
            <p className="text-xs text-zinc-500 mt-2">
              Chọn tài khoản mẫu (Sandbox) hoặc đăng nhập để truy cập bảng điều khiển theo vai trò.
            </p>
          </div>
        )}

      </main>
    </div>
  );
}
