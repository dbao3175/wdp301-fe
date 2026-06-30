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
  PubSchedule,
  ChapterStatus
} from '../types';

import {
  getClientConfig,
  setClientConfig,
  getStoredUser,
  getStoredToken,
  setStoredUserSession,
  makeFetchRequest
} from './base';

export { getStoredUser, setStoredUserSession, getClientConfig, setClientConfig };

export const apiClient = {
  // CONFIG
  getConfig: getClientConfig,
  updateConfig: (config: any) => {
    setClientConfig(config);
  },

  // AUTH
  auth: {
    sendVerificationCode: async (email: string): Promise<any> => {
      return await makeFetchRequest('/api/auth/send-verification-code', 'POST', { email });
    },

    register: async (name: string, email: string, role: UserRole, password?: string, verificationCode?: string): Promise<{ success: boolean; data: User }> => {
      const actualPassword = password || 'password123';
      const res = await makeFetchRequest('/api/auth/register', 'POST', { 
        name, 
        email, 
        password: actualPassword, 
        role,
        verificationCode
      });
      setStoredUserSession(res.data, res.data.token);
      return { success: true, data: res.data };
    },

    login: async (email: string, password?: string): Promise<{ success: boolean; data: User }> => {
      const actualPassword = password || 'password123';
      const res = await makeFetchRequest('/api/auth/login', 'POST', { 
        email, 
        password: actualPassword 
      });
      setStoredUserSession(res.data, res.data.token);
      return { success: true, data: res.data };
    },

    getMe: async (): Promise<{ success: boolean; data: User }> => {
      const res = await makeFetchRequest('/api/auth/me', 'GET');
      return { success: true, data: res.data };
    },

    logout: () => {
      setStoredUserSession(null, null);
    }
  },



  // SERIES MANAGEMENT
  series: {
    getAll: async (status?: string): Promise<Series[]> => {
      const res = await makeFetchRequest(`/api/series${status ? `?status=${status}` : ''}`, 'GET');
      return res.data;
    },

    create: async (title: string, synopsis: string): Promise<Series> => {
      const res = await makeFetchRequest('/api/series', 'POST', { title, synopsis });
      return res.data;
    },

    review: async (seriesId: string, action: 'APPROVED' | 'REJECTED', note: string, pubSchedule?: PubSchedule): Promise<Series> => {
      const res = await makeFetchRequest(`/api/series/${seriesId}/review`, 'PUT', { action, note, pubSchedule });
      return res.data;
    },

    updateStatus: async (seriesId: string, status: SeriesStatus): Promise<Series> => {
      const res = await makeFetchRequest(`/api/series/${seriesId}/status`, 'PUT', { status });
      return res.data;
    }
  },

  proposals: {
    create: async (title: string, genre: string, synopsis: string, storyboard: File): Promise<any> => {
      const config = getClientConfig();
      const url = `${config.baseUrl}/api/series/proposal`;
      const fd = new FormData();
      fd.append('title', title);
      fd.append('genre', genre);
      fd.append('synopsis', synopsis);
      fd.append('storyboard', storyboard);

      const headers: HeadersInit = {};
      const storedToken = getStoredToken();
      if (storedToken) {
        headers['Authorization'] = `Bearer ${storedToken}`;
      }

      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: fd
      });

      const responseText = await response.text();
      let responseData;
      try {
        responseData = responseText ? JSON.parse(responseText) : {};
      } catch (e) {
        responseData = { message: responseText || `Proposal failed with status ${response.status}` };
      }

      if (!response.ok) {
        throw new Error(responseData.message || `Proposal failed with status ${response.status}`);
      }
      return responseData.data;
    },

    getAll: async (): Promise<any[]> => {
      const res = await makeFetchRequest('/api/series/proposal', 'GET');
      return res.data;
    },

    forward: async (id: string, comment: string): Promise<any> => {
      return await makeFetchRequest(`/api/series/proposal/${id}/forward`, 'PUT', { comment });
    },

    reject: async (id: string, comment: string): Promise<any> => {
      return await makeFetchRequest(`/api/series/proposal/${id}/reject`, 'PUT', { comment });
    }
  },

  // CHAPTERS INDEXING
  chapters: {
    getAll: async (seriesId?: string): Promise<Chapter[]> => {
      const res = await makeFetchRequest(`/api/chapters${seriesId ? `?seriesId=${seriesId}` : ''}`, 'GET');
      return res.data;
    },

    create: async (seriesId: string, chapterNumber: number, deadline: string, title?: string): Promise<Chapter> => {
      const payload: any = { seriesId, chapterNumber, deadline };
      if (title) payload.title = title;
      const res = await makeFetchRequest('/api/chapters', 'POST', payload);
      return res.data;
    },
    
    update: async (chapterId: string, payload: { chapterNumber?: number; title?: string; deadline?: string; status?: ChapterStatus }): Promise<Chapter> => {
      const res = await makeFetchRequest(`/api/chapters/${chapterId}`, 'PUT', payload);
      return res.data;
    },

    delete: async (chapterId: string): Promise<void> => {
      await makeFetchRequest(`/api/chapters/${chapterId}`, 'DELETE');
    },

    toggleStatus: async (chapterId: string): Promise<Chapter> => {
      const resList = await makeFetchRequest('/api/chapters', 'GET');
      const list: Chapter[] = resList.data;
      const found = list.find(c => c._id === chapterId);
      if (!found) throw new Error('Chapter not found');
      const nextStatus = found.status === 'IN_PROGRESS' ? 'COMPLETED' : 'IN_PROGRESS';
      const res = await makeFetchRequest(`/api/chapters/${chapterId}`, 'PUT', { status: nextStatus });
      return res.data;
    },

    publish: async (chapterId: string): Promise<Chapter> => {
      const res = await makeFetchRequest(`/api/chapters/publish/${chapterId}`, 'POST', {});
      return res.data;
    }
  },

  // TASK ORCHESTRATION
  tasks: {
    getAll: async (userId?: string): Promise<Task[]> => {
      const res = await makeFetchRequest(`/api/tasks${userId ? `?userId=${userId}` : ''}`, 'GET');
      return res.data;
    },

    create: async (
      seriesId: string,
      chapterId: string,
      assignedTo: string,
      title: string,
      region?: any,
      description?: string,
      pageIds?: string[]
    ): Promise<Task> => {
      const res = await makeFetchRequest('/api/tasks', 'POST', {
        seriesId,
        chapterId,
        assignedTo,
        title,
        region,
        regions: region ? [region] : [],
        description,
        pageIds
      });
      return res.data;
    },

    submit: async (taskId: string): Promise<Task> => {
      const res = await makeFetchRequest(`/api/assistant/tasks/${taskId}/submit`, 'PUT', {});
      return res.data;
    },

    review: async (taskId: string, action: 'APPROVE' | 'REVISION_REQUESTED', reviewNote: string): Promise<any> => {
      const res = await makeFetchRequest(`/api/tasks/${taskId}/review`, 'PUT', { action, reviewNote });
      return res.data;
    }
  },

  // READER RATINGS / INGESTION
  ratings: {
    getAll: async (seriesId?: string): Promise<Rating[]> => {
      const res = await makeFetchRequest(`/api/ratings${seriesId ? `/${seriesId}` : ''}`, 'GET');
      return res.data;
    },

    submit: async (seriesId: string, voteCount: number, source: string): Promise<Rating> => {
      const user = getStoredUser();
      const res = await makeFetchRequest('/api/ratings', 'POST', { seriesId, voteCount, source, submittedBy: user?._id });
      return res.data;
    }
  },

  // BOARD VOTING ON SERIES PROPOSALS
  votes: {
    submit: async (submissionId: string, decision: 'ACCEPT' | 'REJECT', comment: string, schedule?: string): Promise<Vote> => {
      const currentUser = getStoredUser();
      const res = await makeFetchRequest('/api/votes', 'POST', { 
        submissionId, 
        voterId: currentUser?._id, 
        decision, 
        comment,
        schedule
      });
      return res.data;
    },
    
    getForSubmission: async (submissionId: string): Promise<Vote[]> => {
      const res = await makeFetchRequest(`/api/votes/submission/${submissionId}`, 'GET');
      return res.data;
    }
  },

  // BOARD DIRECTIVE PROPOSALS (Cancel series / Change publication format)
  directives: {
    getAll: async (): Promise<Directive[]> => {
      const res = await makeFetchRequest('/api/directives', 'GET');
      return res.data;
    },

    create: async (seriesId: string, actionType: DirectiveAction, reason: string, newSchedule?: 'WEEKLY' | 'MONTHLY'): Promise<Directive> => {
      const res = await makeFetchRequest('/api/directives', 'POST', { seriesId, actionType, reason, newSchedule });
      return res.data;
    },

    vote: async (directiveId: string, decision: 'ACCEPT' | 'REJECT', comment: string): Promise<Directive> => {
      const res = await makeFetchRequest(`/api/directives/${directiveId}/vote`, 'POST', { decision, comment });
      return res.data;
    }
  },

  // MANUSCRIPT ANNOTATIONS
  annotations: {
    getForPage: async (pageId: string): Promise<any[]> => {
      const res = await makeFetchRequest(`/api/annotations/page/${pageId}`, 'GET');
      return res.data;
    },
    create: async (pageId: string, coords: { x: number; y: number }, content: string, type: string): Promise<any> => {
      const res = await makeFetchRequest('/api/annotations', 'POST', { pageId, coords, content, type });
      return res.data;
    }
  },
  
  assistant: {
    getIncomeTasks: async (): Promise<any> => {
      const res = await makeFetchRequest('/api/assistant/income/tasks', 'GET');
      return res.data;
    },
    getIncomeAnalytics: async (): Promise<any> => {
      const res = await makeFetchRequest('/api/assistant/income/analytics', 'GET');
      return res.data;
    },
    getPayoutAccount: async (): Promise<any> => {
      const res = await makeFetchRequest('/api/assistant/payout-account', 'GET');
      return res.data;
    }
  },

  users: {
    getAll: async (role?: string): Promise<User[]> => {
      const res = await makeFetchRequest(`/api/users${role ? `?role=${role}` : ''}`, 'GET');
      return res.data;
    },
    create: async (payload: any): Promise<User> => {
      const res = await makeFetchRequest('/api/users', 'POST', payload);
      return res.data;
    },
    update: async (userId: string, payload: any): Promise<User> => {
      const res = await makeFetchRequest(`/api/users/${userId}`, 'PUT', payload);
      return res.data;
    },
    delete: async (userId: string): Promise<void> => {
      await makeFetchRequest(`/api/users/${userId}`, 'DELETE');
    }
  },

  submissions: {
    create: async (seriesId: string, submissionType: 'PITCH' | 'POST_DECISION' | 'CHANGE_EDITOR', action: 'APPROVE_WEEKLY' | 'APPROVE_MONTHLY' | 'CANCEL' | 'CHANGE_FORMAT'): Promise<any> => {
      return await makeFetchRequest('/api/submissions', 'POST', { seriesId, submissionType, action });
    },
    getAll: async (): Promise<any[]> => {
      const res = await makeFetchRequest('/api/submissions/all', 'GET');
      return res.data;
    },
    getBySeries: async (seriesId: string): Promise<any[]> => {
      const res = await makeFetchRequest(`/api/submissions/series/${seriesId}`, 'GET');
      return res.data;
    },
    getById: async (submissionId: string): Promise<any> => {
      const res = await makeFetchRequest(`/api/submissions/${submissionId}`, 'GET');
      return res.data;
    },
    assignVoters: async (submissionId: string, userIds: string[]): Promise<any> => {
      const res = await makeFetchRequest(`/api/submissions/${submissionId}/voters`, 'POST', { userIds });
      return res.data;
    },
    getVotingStatus: async (submissionId: string): Promise<any> => {
      const res = await makeFetchRequest(`/api/submissions/${submissionId}/voters`, 'GET');
      return res.data;
    }
  },
  
  notifications: {
    getAll: async (userId: string): Promise<any[]> => {
      return await makeFetchRequest(`/api/notifications/${userId}`, 'GET');
    },
    getUnread: async (userId: string): Promise<any[]> => {
      return await makeFetchRequest(`/api/notifications/${userId}/unread`, 'GET');
    },
    markRead: async (id: string): Promise<any> => {
      return await makeFetchRequest(`/api/notifications/${id}/read`, 'PATCH');
    },
    markAllRead: async (userId: string): Promise<any> => {
      return await makeFetchRequest(`/api/notifications/${userId}/read-all`, 'PATCH');
    },
    create: async (userId: string, title: string, content: string, type: 'INFO' | 'WARNING' | 'ERROR'): Promise<any> => {
      return await makeFetchRequest('/api/notifications', 'POST', { userId, title, content, type });
    }
  },
  
  files: {
    upload: async (file: File, chapterId?: string): Promise<any> => {
      const config = getClientConfig();
      const url = `${config.baseUrl}/api/files/upload`;
      const fd = new FormData();
      fd.append('file', file);
      if (chapterId) {
        fd.append('chapterId', chapterId);
      }
      
      const headers: HeadersInit = {};
      const storedToken = getStoredToken();
      if (storedToken) {
        headers['Authorization'] = `Bearer ${storedToken}`;
      }
      
      const response = await fetch(url, {
        method: 'POST',
        headers,
        body: fd
      });
      
      const responseText = await response.text();
      let responseData;
      try {
        responseData = responseText ? JSON.parse(responseText) : {};
      } catch (e) {
        responseData = { message: responseText || `Upload failed with status ${response.status}` };
      }

      if (!response.ok) {
        throw new Error(responseData.message || `Upload failed with status ${response.status}`);
      }
      return responseData;
    }
  }
};
