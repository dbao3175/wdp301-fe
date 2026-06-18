import { 
  User, 
  Series, 
  Chapter, 
  Task, 
  Rating, 
  Vote, 
  Directive,
  DirectiveAction,
  UserRole,
  SeriesStatus,
  PubSchedule
} from '../types';

// Global state config
const CONFIG_KEY = 'mangaflow_config';
const USER_KEY = 'mangaflow_user';
const TOKEN_KEY = 'mangaflow_token';

interface ClientConfig {
  baseUrl: string;
  useLiveBackend: boolean;
}

const DEFAULT_CONFIG: ClientConfig = {
  baseUrl: '',
  useLiveBackend: true // Default to live full-stack backend
};

// Initial data for simulated state
const INITIAL_SERIES: Series[] = [
  {
    _id: "s1",
    title: "Neon Genesis",
    synopsis: "In a post-apocalyptic future, young pilots navigate giant biomechanical suits to defend the remaining strongholds of humanity.",
    mangakaId: { _id: "u1", name: "Kenji Sato", email: "kenji@example.com" },
    status: "IN_PRODUCTION",
    pubSchedule: "WEEKLY",
    createdAt: new Date(Date.now() - 30 * 24 * 3600 * 1000).toISOString()
  },
  {
    _id: "s2",
    title: "Cyberpunk Drifter",
    synopsis: "A rogue courier with a bionic heart gets entangled in a corporate warfare while delivering a mysterious quantum flash drive.",
    mangakaId: { _id: "u3", name: "Mei Lin", email: "mei@example.com" },
    status: "IN_PRODUCTION",
    pubSchedule: "MONTHLY",
    createdAt: new Date(Date.now() - 15 * 24 * 3600 * 1000).toISOString()
  },
  {
    _id: "s3",
    title: "Dragon's Ascent",
    synopsis: "A young monk sets off on a perilous mountain climb to awaken the final ancient dragon deity and break a centuries-old curse.",
    mangakaId: { _id: "u1", name: "Kenji Sato", email: "kenji@example.com" },
    status: "APPROVED",
    pubSchedule: "MONTHLY",
    createdAt: new Date(Date.now() - 10 * 24 * 3600 * 1000).toISOString()
  },
  {
    _id: "s4",
    title: "Neon Samurai",
    synopsis: "A synthesis of classical swordsmanship and futuristic neon augmentations in a neo-shogunate under siege by deep cybernetic invaders.",
    mangakaId: { _id: "u11", name: "Studio Kaze", email: "kaze@example.com" },
    status: "PENDING",
    createdAt: new Date().toISOString()
  },
  {
    _id: "s5",
    title: "Whispering Petals",
    synopsis: "An elegant, heartwarming slice-of-life romance depicting two aspiring botanical artists finding their voice together in Tokyo.",
    mangakaId: { _id: "u12", name: "Yumi Art", email: "yumi@example.com" },
    status: "PENDING",
    createdAt: new Date().toISOString()
  },
  {
    _id: "s6",
    title: "Cyber Core",
    synopsis: "A brutalist cyberpunk detective noir about artificial intelligence crime syndicates in corporate basements.",
    mangakaId: { _id: "u13", name: "Taro Yamada", email: "taro@example.com" },
    status: "CANCELLED",
    createdAt: new Date(Date.now() - 60 * 24 * 3600 * 1000).toISOString()
  }
];

const INITIAL_CHAPTERS: Chapter[] = [
  { _id: "c1", seriesId: "s1", chapterNumber: 142, status: "IN_PROGRESS", deadline: "2026-06-12" },
  { _id: "c2", seriesId: "s2", chapterNumber: 8, status: "IN_PROGRESS", deadline: "2026-06-10" },
  { _id: "c3", seriesId: "s1", chapterNumber: 141, status: "COMPLETED", deadline: "2026-06-05" },
  { _id: "c4", seriesId: "s3", chapterNumber: 42, status: "IN_PROGRESS", deadline: "2026-06-15" }
];

const INITIAL_TASKS: Task[] = [
  { _id: "t1", seriesId: "s1", chapterId: "c1", assignedTo: "u2", title: "Shading Backgrounds on Page 12", status: "PENDING", region: { x: 50, y: 50, width: 300, height: 200, type: 'panel' } },
  { _id: "t2", seriesId: "s1", chapterId: "c1", assignedTo: "u2", title: "Adding Speed Lines to Action Panels", status: "PENDING", region: { x: 400, y: 50, width: 250, height: 250, type: 'panel' } },
  { _id: "t3", seriesId: "s2", chapterId: "c2", assignedTo: "u3", title: "Inking Character Face Detail, Chapter 8", status: "PENDING", region: { x: 100, y: 350, width: 200, height: 180, type: 'character' } },
  { _id: "t4", seriesId: "s1", chapterId: "c3", assignedTo: "u2", title: "Toning Background Scene 141", status: "COMPLETED", completedAt: new Date().toISOString() }
];

const INITIAL_RATINGS: Rating[] = [
  { _id: "r1", seriesId: "s4", voteCount: 92450, source: "Web Platform", submittedBy: "u4" },
  { _id: "r2", seriesId: "s5", voteCount: 85120, source: "Mobile App", submittedBy: "u4" },
  { _id: "r3", seriesId: "s6", voteCount: 12050, source: "Print Magazine", submittedBy: "u4" }
];

const INITIAL_VOTES: Vote[] = [];

// Helper functions for LocalStorage management
export const getClientConfig = (): ClientConfig => {
  const config = localStorage.getItem(CONFIG_KEY);
  return config ? JSON.parse(config) : DEFAULT_CONFIG;
};

export const setClientConfig = (config: ClientConfig) => {
  localStorage.setItem(CONFIG_KEY, JSON.stringify(config));
};

export const getStoredUser = (): User | null => {
  const user = localStorage.getItem(USER_KEY);
  return user ? JSON.parse(user) : null;
};

export const getStoredToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

export const setStoredUserSession = (user: User | null, token: string | null) => {
  if (user) {
    localStorage.setItem(USER_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(USER_KEY);
  }
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
};

// Initialize Mock database in Local Storage if not present
const initMockDB = () => {
  if (!localStorage.getItem('m_series')) {
    localStorage.setItem('m_series', JSON.stringify(INITIAL_SERIES));
  }
  if (!localStorage.getItem('m_chapters')) {
    localStorage.setItem('m_chapters', JSON.stringify(INITIAL_CHAPTERS));
  }
  if (!localStorage.getItem('m_tasks')) {
    localStorage.setItem('m_tasks', JSON.stringify(INITIAL_TASKS));
  }
  if (!localStorage.getItem('m_ratings')) {
    localStorage.setItem('m_ratings', JSON.stringify(INITIAL_RATINGS));
  }
  if (!localStorage.getItem('m_votes')) {
    localStorage.setItem('m_votes', JSON.stringify(INITIAL_VOTES));
  }
  if (!localStorage.getItem('m_users')) {
    const defaultUsers = [
      { _id: "u1", name: "Minh Tuấn (Mangaka)", email: "mangaka@example.com", role: "MANGAKA", avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuCHg4AqOzqTV4dewyU1i46CaCUf4pdWEGhiU2lW3liCFs9JIde6fE9uwaRXVueKT86jIlGpymMPHJCh6-Coee4I6o2JxMGU-b-ts2Dmy6dKXtzK6RPgJ9XIL-1TYRm1JkqG8CkCx_ZgdB3cBNUUJyT9pvzu7uKesV0D55DoIMkLIv6PspHUrWtqKEj3H2tBogMUnEDiuCIIKF5mSpOCdwVfdskbQpvNQx3V_lA8OtcIk6q8LZ9AmfiRwuw0bF5K5naoU52pMuRXDiP2" },
      { _id: "u2", name: "Kenji Sato (Assistant)", email: "assistant@example.com", role: "ASSISTANT", avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuByWi6Zl9Aq5qImGVzCM9dhGi2im5oNDHcYKm7_gdy-y_OSg-Pknn0o2Seu12-bt1ZlvW5mUwYsHbUzshmDVAh9HLeU2zsF4S5qvBZcASl2N4mHoV4QkyO3oaBVVg5I3WsU787UzwLfvdhrTVpYwQpRHM10fQ67X_0IXkIfhdkBbM5hGfouxY6d_0YEaDvNbGo2xqh8PeDhZhx73aSK3GLz-B8_C9WMamYLJXcYZShKrPQs9cA-qJJWPqKe3zVBhGuEz1CkezmEZARm" },
      { _id: "u3", name: "Mei Lin", email: "assistant2@example.com", role: "ASSISTANT", avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuDb75LL8ZWct7hOj_Lpk8YxqEv5BjlWa2mgnocgPm9ezXoHO2Eo7INteNIxv3zb59h68u5MrIsX4qE02NGXmancNIhDRjuLuw8cxldllyVXH8ZRRLi01owyzX7zHvC-NGEEnQuQDiF5_9C8BO2AJvtFze4KTeSuHEeW4eoMhlvbPbvZtfDUx1qbYDwAmHMmL2Wnf9Ue9jyCn5WnL98U1dHFJYXetVyECwx5fpaqDoerU6KxLWjbM5TxO2vJ4bceFRnggczcCiKg-8R0" },
      { _id: "u4", name: "Quốc Anh (Editor)", email: "editor@example.com", role: "EDITOR", avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuAVi7aFSbo-LyrCWDY1XT3sJ8w7jPP5GQRbTdz4nvQMQWPmEme3f92cnzxzIb7YzKn3JOkYN8m5-Z6Ek55flh7p2pvz3X5oM5-VpM-xDDxX4A--79wtyhSZ_J97mQJvZm82ptTfjkLRQvCyVJ1h0xoxsS_T8kHsj2bKKKC2BGIoTEB5uXKqQ-njmmYbZnSXJPOQhHkEcA-6DBmGAgsPaEj-M3_Nw0STUg5cJu56ITbBHbw9s3efEj4urYplhuRmgKwPmBMATWNqf5T-" },
      { _id: "u5", name: "Akihiro T. (Board)", email: "board@example.com", role: "BOARD_MEMBER", avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuB-Y24_KFTU88hcNYomZqWcHloXlbLaqXPH9qMM3qQn4JMyBC7d50DZ4LmEG4B9uq6CvbDNBBtjvW5szNUZxcvPIZygGA_lUFjAmfd2czkfAVQnVQ4FHF4r5Y1oLYjls7Gc1pnSNvNU7Ovy_FjExXjNdDdxl2n8ncBlJSM8RV8AtaqfenpxoWuDukWYHrkD-fzzpdwugHREE3WTNbEbBHIlPgbjzVnKg_Uv_LCB5l4OO5vsDNgHwEsOH3yEkK1QkUfwYEWlnlWPHIoV" }
    ];
    localStorage.setItem('m_users', JSON.stringify(defaultUsers));
  }
};

initMockDB();

// Dynamic State Getters
const loadMockData = <T>(key: string): T[] => {
  initMockDB();
  return JSON.parse(localStorage.getItem(key) || '[]');
};

const saveMockData = <T>(key: string, data: T[]) => {
  localStorage.setItem(key, JSON.stringify(data));
};

// Global API Helper for real HTTP backend communication
async function makeFetchRequest(
  endpoint: string, 
  method: string, 
  body?: any, 
  token?: string | null
) {
  const config = getClientConfig();
  const url = `${config.baseUrl}${endpoint}`;
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json'
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  } else {
    const storedToken = getStoredToken();
    if (storedToken) {
      headers['Authorization'] = `Bearer ${storedToken}`;
    }
  }

  try {
    const response = await fetch(url, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined
    });

    const responseData = await response.json();
    if (!response.ok) {
      throw new Error(responseData.message || `Request failed with status ${response.status}`);
    }
    return responseData;
  } catch (error: any) {
    const errText = error?.message || '';
    if (
      errText.toLowerCase().includes('failed to fetch') || 
      errText.toLowerCase().includes('network error') ||
      errText.toLowerCase().includes('fetch failed')
    ) {
      console.warn("⚠️ API backend unreachable, dynamically switching this operation to local emulator...");
      // Let the client keep working by disabling useLiveBackend
      setClientConfig({
        baseUrl: config.baseUrl,
        useLiveBackend: false
      });
      throw new Error("Mất kết nối máy chủ/Cổng không khớp! Hệ thống đã TỰ ĐỘNG CHUYỂN sang chế độ LOCAL EMULATOR (Offline) để không bị gián đoạn. Hãy bấm nút thực hiện lại một lần nữa.");
    }
    throw error;
  }
}

// ----------------------------------------------------
// UNIFIED FRONTEND API CLIENT HANDLERS
// ----------------------------------------------------
export const apiClient = {
  // CONFIG
  getConfig: getClientConfig,
  updateConfig: (config: ClientConfig) => {
    setClientConfig(config);
  },

  // AUTH
  auth: {
    register: async (name: string, email: string, role: UserRole, password?: string): Promise<{ success: boolean; data: User }> => {
      const config = getClientConfig();
      const actualPassword = password || 'password123';
      if (config.useLiveBackend) {
        // Real API Call
        const res = await makeFetchRequest('/api/auth/register', 'POST', { 
          name, 
          email, 
          password: actualPassword, 
          role 
        });
        setStoredUserSession(res.data, res.data.token);
        return { success: true, data: res.data };
      } else {
        // Simulated Model Store
        const users = loadMockData<any>('m_users');
        const exists = users.find((u: any) => u.email.toLowerCase() === email.toLowerCase());
        if (exists) {
          throw new Error('Email already registered');
        }
        const newUser: User = {
          _id: `u_${Date.now()}`,
          name,
          email,
          role,
          avatar: "https://lh3.googleusercontent.com/aida-public/AB6AXuCHg4AqOzqTV4dewyU1i46CaCUf4pdWEGhiU2lW3liCFs9JIde6fE9uwaRXVueKT86jIlGpymMPHJCh6-Coee4I6o2JxMGU-b-ts2Dmy6dKXtzK6RPgJ9XIL-1TYRm1JkqG8CkCx_ZgdB3cBNUUJyT9pvzu7uKesV0D55DoIMkLIv6PspHUrWtqKEj3H2tBogMUnEDiuCIIKF5mSpOCdwVfdskbQpvNQx3V_lA8OtcIk6q8LZ9AmfiRwuw0bF5K5naoU52pMuRXDiP2",
          token: `token_${Date.now()}`
        };
        users.push(newUser);
        saveMockData('m_users', users);
        setStoredUserSession(newUser, newUser.token!);
        return { success: true, data: newUser };
      }
    },

    login: async (email: string, password?: string): Promise<{ success: boolean; data: User }> => {
      const config = getClientConfig();
      const actualPassword = password || 'password123';
      if (config.useLiveBackend) {
        const res = await makeFetchRequest('/api/auth/login', 'POST', { 
          email, 
          password: actualPassword 
        });
        setStoredUserSession(res.data, res.data.token);
        return { success: true, data: res.data };
      } else {
        const users = loadMockData<User>('m_users');
        const found = users.find(u => u.email.toLowerCase() === email.toLowerCase());
        if (!found) {
          throw new Error('Invalid credentials or user not found. Tip: Register a new workspace account or use quick login roles.');
        }
        const userWithToken = { ...found, token: `token_${Date.now()}` };
        setStoredUserSession(userWithToken, userWithToken.token);
        return { success: true, data: userWithToken };
      }
    },

    getMe: async (): Promise<{ success: boolean; data: User }> => {
      const config = getClientConfig();
      if (config.useLiveBackend) {
        const res = await makeFetchRequest('/api/auth/me', 'GET');
        return { success: true, data: res.data };
      } else {
        const user = getStoredUser();
        if (!user) throw new Error('Not authorized');
        return { success: true, data: user };
      }
    },

    logout: () => {
      setStoredUserSession(null, null);
    }
  },

  users: {
    getAll: async (role?: string): Promise<User[]> => {
      const config = getClientConfig();
      if (config.useLiveBackend) {
        const res = await makeFetchRequest(`/api/users${role ? `?role=${role}` : ''}`, 'GET');
        return res.data;
      } else {
        const list = loadMockData<User>('m_users');
        if (role) {
          return list.filter(u => u.role === role);
        }
        return list;
      }
    }
  },

  // SERIES MANAGEMENT
  series: {
    getAll: async (status?: string): Promise<Series[]> => {
      const config = getClientConfig();
      if (config.useLiveBackend) {
        const res = await makeFetchRequest(`/api/series${status ? `?status=${status}` : ''}`, 'GET');
        return res.data;
      } else {
        const list = loadMockData<Series>('m_series');
        if (status) {
          return list.filter(s => s.status === status);
        }
        return list;
      }
    },

    create: async (title: string, synopsis: string): Promise<Series> => {
      const config = getClientConfig();
      const currentUser = getStoredUser();
      
      if (config.useLiveBackend) {
        const res = await makeFetchRequest('/api/series', 'POST', { title, synopsis });
        return res.data;
      } else {
        const list = loadMockData<Series>('m_series');
        const newSeries: Series = {
          _id: `s_${Date.now()}`,
          title,
          synopsis,
          mangakaId: currentUser ? { _id: currentUser._id, name: currentUser.name, email: currentUser.email } : { _id: 'u1', name: 'Minh Tuấn (Mangaka)', email: 'mangaka@example.com' },
          status: 'PENDING',
          createdAt: new Date().toISOString()
        };
        list.splice(0, 0, newSeries);
        saveMockData('m_series', list);
        return newSeries;
      }
    },

    review: async (seriesId: string, action: 'APPROVED' | 'REJECTED', note: string, pubSchedule?: PubSchedule): Promise<Series> => {
      const config = getClientConfig();
      if (config.useLiveBackend) {
        const res = await makeFetchRequest(`/api/series/${seriesId}/review`, 'PUT', { action, note, pubSchedule });
        return res.data;
      } else {
        const list = loadMockData<Series>('m_series');
        const index = list.findIndex(s => s._id === seriesId);
        if (index === -1) throw new Error('Series not found');
        
        list[index] = {
          ...list[index],
          status: action,
          reviewNote: note,
          pubSchedule: action === 'APPROVED' ? (pubSchedule || 'MONTHLY') : null,
          reviewedAt: new Date().toISOString()
        };
        saveMockData('m_series', list);
        return list[index];
      }
    },

    updateStatus: async (seriesId: string, status: SeriesStatus): Promise<Series> => {
      const config = getClientConfig();
      if (config.useLiveBackend) {
        const res = await makeFetchRequest(`/api/series/${seriesId}/status`, 'PUT', { status });
        return res.data;
      } else {
        const list = loadMockData<Series>('m_series');
        const index = list.findIndex(s => s._id === seriesId);
        if (index === -1) throw new Error('Series not found');
        
        list[index] = {
          ...list[index],
          status: status
        };
        saveMockData('m_series', list);
        return list[index];
      }
    }
  },

  // CHAPTERS INDEXING
  chapters: {
    getAll: async (seriesId?: string): Promise<Chapter[]> => {
      const config = getClientConfig();
      if (config.useLiveBackend) {
        const res = await makeFetchRequest(`/api/chapters${seriesId ? `?seriesId=${seriesId}` : ''}`, 'GET');
        return res.data;
      } else {
        const list = loadMockData<Chapter>('m_chapters');
        if (seriesId) {
          return list.filter(c => c.seriesId === seriesId);
        }
        return list;
      }
    },

    create: async (seriesId: string, chapterNumber: number, deadline: string): Promise<Chapter> => {
      const config = getClientConfig();
      if (config.useLiveBackend) {
        const res = await makeFetchRequest('/api/chapters', 'POST', { seriesId, chapterNumber, deadline });
        return res.data;
      } else {
        const list = loadMockData<Chapter>('m_chapters');
        const newChapter: Chapter = {
          _id: `c_${Date.now()}`,
          seriesId,
          chapterNumber,
          status: 'IN_PROGRESS',
          deadline
        };
        list.splice(0, 0, newChapter);
        saveMockData('m_chapters', list);
        return newChapter;
      }
    },
    
    toggleStatus: async (chapterId: string): Promise<Chapter> => {
      const config = getClientConfig();
      if (config.useLiveBackend) {
        // Find current status first by fetching chapters
        const resList = await makeFetchRequest('/api/chapters', 'GET');
        const list: Chapter[] = resList.data;
        const found = list.find(c => c._id === chapterId);
        if (!found) throw new Error('Chapter not found');
        const nextStatus = found.status === 'IN_PROGRESS' ? 'COMPLETED' : 'IN_PROGRESS';
        
        const res = await makeFetchRequest(`/api/chapters/${chapterId}`, 'PUT', { status: nextStatus });
        return res.data;
      } else {
        const list = loadMockData<Chapter>('m_chapters');
        const index = list.findIndex(c => c._id === chapterId);
        if (index === -1) throw new Error('Chapter not found');
        
        const nextStatus = list[index].status === 'IN_PROGRESS' ? 'COMPLETED' : 'IN_PROGRESS';
        list[index] = {
          ...list[index],
          status: nextStatus
        };
        saveMockData('m_chapters', list);
        return list[index];
      }
    }
  },

  // TASCH ORCHESTRATION
  tasks: {
    getAll: async (userId?: string): Promise<Task[]> => {
      const config = getClientConfig();
      if (config.useLiveBackend) {
        const res = await makeFetchRequest(`/api/tasks${userId ? `?userId=${userId}` : ''}`, 'GET');
        return res.data;
      } else {
        const list = loadMockData<Task>('m_tasks');
        if (userId) {
          return list.filter(t => t.assignedTo === userId);
        }
        return list;
      }
    },

    create: async (seriesId: string, chapterId: string, assignedTo: string, title: string, region?: any): Promise<Task> => {
      const config = getClientConfig();
      if (config.useLiveBackend) {
        const res = await makeFetchRequest('/api/tasks', 'POST', { seriesId, chapterId, assignedTo, title, region });
        return res.data;
      } else {
        const list = loadMockData<Task>('m_tasks');
        const newTask: Task = {
          _id: `t_${Date.now()}`,
          seriesId,
          chapterId,
          assignedTo,
          title,
          status: 'PENDING',
          region: region || null
        };
        list.splice(0, 0, newTask);
        saveMockData('m_tasks', list);
        return newTask;
      }
    },

    submit: async (taskId: string): Promise<Task> => {
      const config = getClientConfig();
      if (config.useLiveBackend) {
        const res = await makeFetchRequest(`/api/assistant/tasks/${taskId}/submit`, 'PUT', {});
        return res.data;
      } else {
        const list = loadMockData<Task>('m_tasks');
        const index = list.findIndex(t => t._id === taskId);
        if (index === -1) throw new Error('Task not found');
        
        list[index] = {
          ...list[index],
          status: 'COMPLETED',
          completedAt: new Date().toISOString()
        };
        saveMockData('m_tasks', list);
        return list[index];
      }
    }
  },

  // READER RATINGS / INGESTION
  ratings: {
    getAll: async (seriesId?: string): Promise<Rating[]> => {
      const config = getClientConfig();
      if (config.useLiveBackend) {
        const res = await makeFetchRequest(`/api/ratings${seriesId ? `/${seriesId}` : ''}`, 'GET');
        return res.data;
      } else {
        const list = loadMockData<Rating>('m_ratings');
        if (seriesId) {
          return list.filter(r => r.seriesId === seriesId);
        }
        return list;
      }
    },

    submit: async (seriesId: string, voteCount: number, source: string): Promise<Rating> => {
      const config = getClientConfig();
      const user = getStoredUser();
      
      if (config.useLiveBackend) {
        const res = await makeFetchRequest('/api/ratings', 'POST', { seriesId, voteCount, source, submittedBy: user?._id });
        return res.data;
      } else {
        const list = loadMockData<Rating>('m_ratings');
        const newRating: Rating = {
          _id: `r_${Date.now()}`,
          seriesId,
          voteCount,
          source,
          submittedBy: user?._id || 'u4'
        };
        list.splice(0, 0, newRating);
        saveMockData('m_ratings', list);
        
        // Also simulate updating rankings if necessary
        return newRating;
      }
    }
  },

  // BOARD VOTING ON SERIES PROPOSALS
  votes: {
    submit: async (submissionId: string, decision: 'ACCEPT' | 'REJECT', comment: string, schedule?: string): Promise<Vote> => {
      const config = getClientConfig();
      const currentUser = getStoredUser();
      
      if (config.useLiveBackend) {
        const res = await makeFetchRequest('/api/votes', 'POST', { 
          submissionId, 
          voterId: currentUser?._id, 
          decision, 
          comment,
          schedule
        });
        return res.data;
      } else {
        const list = loadMockData<Vote>('m_votes');
        const newVote: Vote = {
          _id: `v_${Date.now()}`,
          submissionId,
          voterId: currentUser?._id || 'u5',
          decision,
          schedule: (schedule as 'WEEKLY' | 'MONTHLY') || null,
          comment,
          createdAt: new Date().toISOString()
        };
        list.splice(0, 0, newVote);
        saveMockData('m_votes', list);
        return newVote;
      }
    },
    
    getForSubmission: async (submissionId: string): Promise<Vote[]> => {
      const config = getClientConfig();
      if (config.useLiveBackend) {
        const res = await makeFetchRequest(`/api/votes/submission/${submissionId}`, 'GET');
        return res.data;
      } else {
        const list = loadMockData<Vote>('m_votes');
        return list.filter(v => v.submissionId === submissionId);
      }
    }
  },

  // BOARD DIRECTIVE PROPOSALS (Cancel series / Change publication format)
  directives: {
    getAll: async (): Promise<Directive[]> => {
      const config = getClientConfig();
      if (config.useLiveBackend) {
        const res = await makeFetchRequest('/api/directives', 'GET');
        return res.data;
      } else {
        const list = JSON.parse(localStorage.getItem('m_directives') || '[]');
        return list.filter((d: Directive) => d.status === 'PENDING');
      }
    },

    create: async (seriesId: string, actionType: DirectiveAction, reason: string, newSchedule?: 'WEEKLY' | 'MONTHLY'): Promise<Directive> => {
      const config = getClientConfig();
      const currentUser = getStoredUser();
      if (config.useLiveBackend) {
        const res = await makeFetchRequest('/api/directives', 'POST', { seriesId, actionType, reason, newSchedule });
        return res.data;
      } else {
        const list: Directive[] = JSON.parse(localStorage.getItem('m_directives') || '[]');
        const newDir: Directive = {
          _id: `dir_${Date.now()}`,
          seriesId,
          seriesTitle: '',
          actionType,
          newSchedule: actionType === 'CHANGE_FORMAT' ? (newSchedule || 'MONTHLY') : null,
          reason,
          status: 'PENDING',
          proposedBy: currentUser?._id || 'u5',
          proposedByName: currentUser?.name || 'Board Member',
          votes: [],
          createdAt: new Date().toISOString()
        };
        list.push(newDir);
        localStorage.setItem('m_directives', JSON.stringify(list));
        return newDir;
      }
    },

    vote: async (directiveId: string, decision: 'ACCEPT' | 'REJECT', comment: string): Promise<Directive> => {
      const config = getClientConfig();
      if (config.useLiveBackend) {
        const res = await makeFetchRequest(`/api/directives/${directiveId}/vote`, 'POST', { decision, comment });
        return res.data;
      } else {
        const list: Directive[] = JSON.parse(localStorage.getItem('m_directives') || '[]');
        const idx = list.findIndex(d => d._id === directiveId);
        if (idx === -1) throw new Error('Directive not found');
        if (!list[idx].votes) list[idx].votes = [];
        const currentUser = getStoredUser();
        const existing = list[idx].votes.find(v => v.voterId === currentUser?._id);
        if (existing) throw new Error('You have already voted on this directive.');
        list[idx].votes.push({
          _id: `dv_${Date.now()}`,
          voterId: currentUser?._id || 'u5',
          voterName: currentUser?.name || 'Board Member',
          decision,
          comment,
          createdAt: new Date().toISOString()
        });
        localStorage.setItem('m_directives', JSON.stringify(list));
        return list[idx];
      }
    }
  },

  // MANUSCRIPT ANNOTATIONS
  annotations: {
    getForPage: async (pageId: string): Promise<any[]> => {
      const config = getClientConfig();
      if (config.useLiveBackend) {
        const res = await makeFetchRequest(`/api/annotations/page/${pageId}`, 'GET');
        return res.data;
      } else {
        const list = JSON.parse(localStorage.getItem('m_annotations') || '[]');
        return list.filter((a: any) => a.pageId === pageId);
      }
    },
    create: async (pageId: string, coords: { x: number; y: number }, content: string, type: string): Promise<any> => {
      const config = getClientConfig();
      if (config.useLiveBackend) {
        const res = await makeFetchRequest('/api/annotations', 'POST', { pageId, coords, content, type });
        return res.data;
      } else {
        const list = JSON.parse(localStorage.getItem('m_annotations') || '[]');
        const newAnn = {
          _id: `ann_${Date.now()}`,
          pageId,
          coords,
          content,
          type,
          createdAt: new Date().toISOString()
        };
        list.push(newAnn);
        localStorage.setItem('m_annotations', JSON.stringify(list));
        return newAnn;
      }
    }
  }
};
