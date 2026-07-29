import {
  User,
  Series,
  Chapter,
  Task,
  Rating,
  ReaderMetricInput,
  BoardPublication,
  PublicationDecision,
  Vote,
  Directive,
  DirectiveAction,
  UserRole,
  SeriesStatus,
  PubSchedule,
  ChapterStatus,
  Notification,
  AuditLog,
} from "../types";

import {
  getClientConfig,
  setClientConfig,
  getStoredUser,
  getStoredToken,
  setStoredUserSession,
  makeFetchRequest,
} from "./base";

export {
  getStoredUser,
  setStoredUserSession,
  getClientConfig,
  setClientConfig,
};

export const apiClient = {
  // CONFIG
  getConfig: getClientConfig,
  updateConfig: (config: any) => {
    setClientConfig(config);
  },

  // AUTH
  auth: {
    sendVerificationCode: async (email: string): Promise<any> => {
      return await makeFetchRequest(
        "/api/auth/send-verification-code",
        "POST",
        { email },
      );
    },

    register: async (
      name: string,
      email: string,
      role: UserRole,
      password?: string,
      verificationCode?: string,
    ): Promise<{ success: boolean; data: User }> => {
      const actualPassword = password || "password123";
      const res = await makeFetchRequest("/api/auth/register", "POST", {
        name,
        email,
        password: actualPassword,
        role,
        verificationCode,
      });
      setStoredUserSession(res.data, res.data.token);
      return { success: true, data: res.data };
    },

    login: async (
      email: string,
      password?: string,
    ): Promise<{ success: boolean; data: User }> => {
      const actualPassword = password || "password123";
      const res = await makeFetchRequest("/api/auth/login", "POST", {
        email,
        password: actualPassword,
      });
      setStoredUserSession(res.data, res.data.token);
      return { success: true, data: res.data };
    },

    getMe: async (): Promise<{ success: boolean; data: User }> => {
      const res = await makeFetchRequest("/api/auth/me", "GET");
      return { success: true, data: res.data };
    },

    logout: () => {
      setStoredUserSession(null, null);
    },
  },

  // SERIES MANAGEMENT
  series: {
    getAll: async (status?: string): Promise<Series[]> => {
      const res = await makeFetchRequest(
        `/api/series${status ? `?status=${status}` : ""}`,
        "GET",
      );
      return res.data;
    },

    create: async (title: string, synopsis: string): Promise<Series> => {
      const res = await makeFetchRequest("/api/series", "POST", {
        title,
        synopsis,
      });
      return res.data;
    },

    review: async (
      seriesId: string,
      action: "APPROVED" | "REJECTED",
      note: string,
      pubSchedule?: PubSchedule,
    ): Promise<Series> => {
      const res = await makeFetchRequest(
        `/api/series/${seriesId}/review`,
        "PUT",
        { action, note, pubSchedule },
      );
      return res.data;
    },

    updateStatus: async (
      seriesId: string,
      status: SeriesStatus,
    ): Promise<Series> => {
      const res = await makeFetchRequest(
        `/api/series/${seriesId}/status`,
        "PUT",
        { status },
      );
      return res.data;
    },
  },

  proposals: {
    create: async (
      title: string,
      genre: string,
      synopsis: string,
      storyboards: File[],
    ): Promise<any> => {
      const config = getClientConfig();
      const url = `${config.baseUrl}/api/series/proposal`;
      const fd = new FormData();
      fd.append("title", title);
      fd.append("genre", genre);
      fd.append("synopsis", synopsis);
      storyboards.forEach((f) => fd.append("storyboards", f));

      const headers: HeadersInit = {};
      const storedToken = getStoredToken();
      if (storedToken) {
        headers["Authorization"] = `Bearer ${storedToken}`;
      }

      const response = await fetch(url, {
        method: "POST",
        headers,
        body: fd,
      });

      const responseText = await response.text();
      let responseData;
      try {
        responseData = responseText ? JSON.parse(responseText) : {};
      } catch (e) {
        responseData = {
          message:
            responseText || `Proposal failed with status ${response.status}`,
        };
      }

      if (!response.ok) {
        throw new Error(
          responseData.message ||
            `Proposal failed with status ${response.status}`,
        );
      }
      return responseData.data;
    },

    getAll: async (status?: string, mangakaId?: string): Promise<any[]> => {
      const params = new URLSearchParams();
      if (status) params.set('status', status);
      if (mangakaId) params.set('mangakaId', mangakaId);
      const query = params.toString();
      const res = await makeFetchRequest(`/api/series/proposal${query ? `?${query}` : ""}`, "GET");
      return res.data;
    },

    getById: async (id: string): Promise<any> => {
      const res = await makeFetchRequest(`/api/series/proposal/${id}`, "GET");
      return res.data;
    },

    addComment: async (
      id: string,
      content: string,
      isInternal?: boolean,
    ): Promise<any> => {
      return await makeFetchRequest(
        `/api/series/proposal/${id}/comment`,
        "PUT",
        { content, isInternal },
      );
    },

    requestRevision: async (id: string, content: string): Promise<any> => {
      return await makeFetchRequest(
        `/api/series/proposal/${id}/revision`,
        "PUT",
        { content },
      );
    },

    forward: async (id: string, content: string): Promise<any> => {
      return await makeFetchRequest(
        `/api/series/proposal/${id}/forward`,
        "PUT",
        { content },
      );
    },

    reject: async (id: string, content: string): Promise<any> => {
      return await makeFetchRequest(
        `/api/series/proposal/${id}/reject`,
        "PUT",
        { content },
      );
    },

    resubmit: async (id: string, files?: File[], removeImageUrls?: string[], synopsis?: string): Promise<any> => {
      if (files && files.length > 0) {
        const config = getClientConfig();
        const url = `${config.baseUrl}/api/series/proposal/${id}/resubmit`;
        const fd = new FormData();
        files.forEach((f) => fd.append('storyboards', f));
        if (removeImageUrls && removeImageUrls.length > 0) {
          fd.append('removeImages', JSON.stringify(removeImageUrls));
        }
        if (synopsis) {
          fd.append('synopsis', synopsis);
        }

        const headers: HeadersInit = {};
        const storedToken = getStoredToken();
        if (storedToken) {
          headers['Authorization'] = `Bearer ${storedToken}`;
        }

        const response = await fetch(url, {
          method: 'PUT',
          headers,
          body: fd,
        });

        const responseText = await response.text();
        let responseData;
        try {
          responseData = responseText ? JSON.parse(responseText) : {};
        } catch (e) {
          responseData = {
            message: responseText || `Resubmit failed with status ${response.status}`,
          };
        }

        if (!response.ok) {
          throw new Error(responseData.message || `Resubmit failed with status ${response.status}`);
        }
        return responseData.data;
      } else if (removeImageUrls && removeImageUrls.length > 0) {
        return await makeFetchRequest(
          `/api/series/proposal/${id}/resubmit`,
          'PUT',
          { removeImages: JSON.stringify(removeImageUrls), synopsis },
        );
      } else {
        return await makeFetchRequest(
          `/api/series/proposal/${id}/resubmit`,
          'PUT',
          { synopsis },
        );
      }
    },

    sendToBoard: async (id: string): Promise<any> => {
      return await makeFetchRequest(
        `/api/series/proposal/${id}/send-to-board`,
        "PUT",
        {},
      );
    },

    approveByBoard: async (id: string): Promise<any> => {
      return await makeFetchRequest(
        `/api/series/proposal/${id}/approve`,
        "PUT",
        {},
      );
    },

    downloadStoryboard: async (id: string): Promise<void> => {
      const config = getClientConfig();
      const url = `${config.baseUrl}/api/series/proposal/${id}/storyboard`;
      const headers: HeadersInit = {};
      const token = getStoredToken();
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const response = await fetch(url, { headers });
      if (!response.ok) {
        throw new Error("Failed to download storyboard");
      }

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      
      const contentDisposition = response.headers.get("Content-Disposition");
      let filename = "storyboard";
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }
      
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);
    },
  },

  // CHAPTERS INDEXING
  chapters: {
    getAll: async (seriesId?: string): Promise<Chapter[]> => {
      const res = await makeFetchRequest(
        `/api/chapters${seriesId ? `?seriesId=${seriesId}` : ""}`,
        "GET",
      );
      return res.data;
    },

    create: async (
      seriesId: string,
      chapterNumber: number,
      deadline: string,
      title?: string,
    ): Promise<Chapter> => {
      const payload: any = { seriesId, chapterNumber, deadline };
      if (title) payload.title = title;
      const res = await makeFetchRequest("/api/chapters", "POST", payload);
      return res.data;
    },

    update: async (
      chapterId: string,
      payload: {
        chapterNumber?: number;
        title?: string;
        deadline?: string;
        status?: ChapterStatus;
      },
    ): Promise<Chapter> => {
      const res = await makeFetchRequest(
        `/api/chapters/${chapterId}`,
        "PUT",
        payload,
      );
      return res.data;
    },

    delete: async (chapterId: string): Promise<void> => {
      await makeFetchRequest(`/api/chapters/${chapterId}`, "DELETE");
    },

    toggleStatus: async (chapterId: string): Promise<Chapter> => {
      const resList = await makeFetchRequest("/api/chapters", "GET");
      const list: Chapter[] = resList.data;
      const found = list.find((c) => c._id === chapterId);
      if (!found) throw new Error("Chapter not found");
      const nextStatus =
        found.status === "IN_PROGRESS" ? "COMPLETED" : "IN_PROGRESS";
      const res = await makeFetchRequest(`/api/chapters/${chapterId}`, "PUT", {
        status: nextStatus,
      });
      return res.data;
    },

    publish: async (chapterId: string): Promise<Chapter> => {
      const res = await makeFetchRequest(
        `/api/chapters/publish/${chapterId}`,
        "POST",
        {},
      );
      return res.data;
    },
  },

  // TASK ORCHESTRATION
  tasks: {
    getAll: async (userId?: string, seriesId?: string, chapterId?: string): Promise<Task[]> => {
      const params = new URLSearchParams();
      if (userId) params.set('userId', userId);
      if (seriesId) params.set('seriesId', seriesId);
      if (chapterId) params.set('chapterId', chapterId);
      const query = params.toString();
      const res = await makeFetchRequest(
        `/api/tasks${query ? `?${query}` : ""}`,
        "GET",
      );
      return res.data;
    },

    create: async (
      seriesId: string,
      chapterId: string,
      assignedTo: string,
      title: string,
      region?: any,
      description?: string,
      pageIds?: string[],
      sourceImageUrl?: string,
      dueAt?: string,
    ): Promise<Task> => {
      const res = await makeFetchRequest("/api/tasks", "POST", {
        seriesId,
        chapterId,
        assignedTo,
        title,
        regions: region ? [region] : [],
        sourceImageUrl,
        description,
        pageIds,
        dueAt,
      });
      return res.data;
    },

    submit: async (taskId: string, assistantImageUrl?: string): Promise<Task> => {
      const res = await makeFetchRequest(
        `/api/assistant/tasks/${taskId}/submit`,
        "PUT",
        { assistantImageUrl },
      );
      return res.data;
    },

    review: async (
      taskId: string,
      action: "APPROVE" | "REVISION_REQUESTED",
      reviewNote: string,
    ): Promise<any> => {
      const res = await makeFetchRequest(`/api/tasks/${taskId}/review`, "PUT", {
        action,
        reviewNote,
      });
      return res.data;
    },
  },

  // READER RATINGS / INGESTION
  ratings: {
    getAll: async (seriesId?: string): Promise<Rating[]> => {
      const res = await makeFetchRequest(
        `/api/ratings${seriesId ? `/${seriesId}` : ""}`,
        "GET",
      );
      return res.data;
    },

    submit: async (entry: ReaderMetricInput): Promise<Rating> => {
      const res = await makeFetchRequest("/api/ratings", "POST", entry);
      return res.data;
    },

    import: async (entries: ReaderMetricInput[]): Promise<{
      data: Rating[];
      summary: { total: number; imported: number; failed: number };
      errors: Array<{ index: number; message: string }>;
    }> => {
      const res = await makeFetchRequest("/api/ratings/import", "POST", {
        entries,
      });
      return {
        data: Array.isArray(res.data) ? res.data : [],
        summary: res.summary || {
          total: entries.length,
          imported: Array.isArray(res.data) ? res.data.length : 0,
          failed: 0,
        },
        errors: Array.isArray(res.errors) ? res.errors : [],
      };
    },
  },

  // EDITORIAL BOARD CHAPTER PUBLICATION REVIEW
  boardPublications: {
    getAll: async (): Promise<BoardPublication[]> => {
      const res = await makeFetchRequest("/api/board/publications", "GET");
      return res.data;
    },

    open: async (
      chapterId: string,
      options: {
        newSchedule?: "WEEKLY" | "MONTHLY";
        voterIds?: string[];
        chairpersonId?: string;
      },
    ): Promise<BoardPublication> => {
      const res = await makeFetchRequest(
        `/api/board/publications/${chapterId}/open`,
        "POST",
        options,
      );
      return res.data;
    },

    vote: async (
      sessionId: string,
      decision: PublicationDecision,
      comment: string,
    ): Promise<BoardPublication> => {
      const res = await makeFetchRequest(
        `/api/board/publications/${sessionId}/vote`,
        "POST",
        { decision, comment },
      );
      return res.data;
    },

    tieBreak: async (
      sessionId: string,
      decision: PublicationDecision,
      comment: string,
    ): Promise<BoardPublication> => {
      const res = await makeFetchRequest(
        `/api/board/publications/${sessionId}/tie-break`,
        "POST",
        { decision, comment },
      );
      return res.data;
    },
  },

  // SERIES RANKINGS
  rankings: {
    getAll: async (type?: "weekly" | "monthly"): Promise<any[]> => {
      const query = type ? `?type=${type}` : "";
      const res = await makeFetchRequest(`/api/rankings${query}`, "GET");
      return res.data || [];
    },

  },

  // BOARD VOTING ON SERIES PROPOSALS
  votes: {
    submit: async (
      submissionId: string,
      decision: "ACCEPT" | "REJECT",
      comment: string,
      schedule?: string,
    ): Promise<Vote> => {
      const res = await makeFetchRequest("/api/votes", "POST", {
        submissionId,
        decision,
        comment,
        schedule,
      });
      return res.data;
    },

    getForSubmission: async (submissionId: string): Promise<Vote[]> => {
      const res = await makeFetchRequest(
        `/api/votes/submission/${submissionId}`,
        "GET",
      );
      return res.data;
    },

    tieBreak: async (
      submissionId: string,
      decision: "ACCEPT" | "REJECT",
      comment: string,
    ): Promise<any> => {
      const res = await makeFetchRequest(
        `/api/votes/submission/${submissionId}/tie-break`,
        "POST",
        { decision, comment },
      );
      return res.data;
    },
  },

  // BOARD DIRECTIVE PROPOSALS (Cancel series / Change publication format)
  directives: {
    getAll: async (): Promise<Directive[]> => {
      const res = await makeFetchRequest("/api/directives", "GET");
      return res.data;
    },

    create: async (
      seriesId: string,
      actionType: DirectiveAction,
      reason: string,
      newSchedule?: "WEEKLY" | "MONTHLY",
    ): Promise<Directive> => {
      const res = await makeFetchRequest("/api/directives", "POST", {
        seriesId,
        actionType,
        reason,
        newSchedule,
      });
      return res.data;
    },

    vote: async (
      directiveId: string,
      decision: "ACCEPT" | "REJECT",
      comment: string,
    ): Promise<Directive> => {
      const res = await makeFetchRequest(
        `/api/directives/${directiveId}/vote`,
        "POST",
        { decision, comment },
      );
      return res.data;
    },

    tieBreak: async (
      directiveId: string,
      decision: "ACCEPT" | "REJECT",
      comment: string,
    ): Promise<Directive> => {
      const res = await makeFetchRequest(
        `/api/directives/${directiveId}/tie-break`,
        "POST",
        { decision, comment },
      );
      return res.data;
    },
  },

  // MANUSCRIPT ANNOTATIONS
  annotations: {
    getForPage: async (pageId: string): Promise<any[]> => {
      const res = await makeFetchRequest(
        `/api/annotations/page/${pageId}`,
        "GET",
      );
      return res.data;
    },
    create: async (
      pageId: string,
      coords: { x: number; y: number },
      content: string,
      type: string,
    ): Promise<any> => {
      const res = await makeFetchRequest("/api/annotations", "POST", {
        pageId,
        coords,
        content,
        type,
      });
      return res.data;
    },
  },

  assistant: {
    getIncomeTasks: async (): Promise<any> => {
      const res = await makeFetchRequest("/api/assistant/income/tasks", "GET");
      return res.data;
    },
    getIncomeAnalytics: async (): Promise<any> => {
      const res = await makeFetchRequest(
        "/api/assistant/income/analytics",
        "GET",
      );
      return res.data;
    },
    getPayoutAccount: async (): Promise<any> => {
      const res = await makeFetchRequest(
        "/api/assistant/payout-account",
        "GET",
      );
      return res.data;
    },
  },

  users: {
    getAll: async (role?: string): Promise<User[]> => {
      const res = await makeFetchRequest(
        `/api/users${role ? `?role=${role}` : ""}`,
        "GET",
      );
      return res.data;
    },
    create: async (payload: any): Promise<User> => {
      const res = await makeFetchRequest("/api/users", "POST", payload);
      return res.data;
    },
    update: async (userId: string, payload: any): Promise<User> => {
      const res = await makeFetchRequest(
        `/api/users/${userId}`,
        "PUT",
        payload,
      );
      return res.data;
    },
    delete: async (userId: string): Promise<void> => {
      await makeFetchRequest(`/api/users/${userId}`, "DELETE");
    },
    toggleStatus: async (userId: string): Promise<User> => {
      const res = await makeFetchRequest(`/api/users/${userId}/status`, "PUT");
      return res.data;
    },
  },

  submissions: {
    create: async (
      seriesId: string,
      submissionType: "PITCH" | "POST_DECISION" | "CHANGE_EDITOR",
      action: "APPROVE_WEEKLY" | "APPROVE_MONTHLY" | "CANCEL" | "CHANGE_FORMAT",
      proposalId?: string,
    ): Promise<any> => {
      const body: any = { seriesId, submissionType, action };
      if (proposalId) body.proposalId = proposalId;
      return await makeFetchRequest("/api/submissions", "POST", body);
    },
    getAll: async (): Promise<any[]> => {
      const res = await makeFetchRequest("/api/submissions/all", "GET");
      return res.data;
    },
    getBySeries: async (seriesId: string): Promise<any[]> => {
      const res = await makeFetchRequest(
        `/api/submissions/series/${seriesId}`,
        "GET",
      );
      return res.data;
    },
    getById: async (submissionId: string): Promise<any> => {
      const res = await makeFetchRequest(
        `/api/submissions/${submissionId}`,
        "GET",
      );
      return res.data;
    },
    assignVoters: async (
      submissionId: string,
      userIds: string[],
    ): Promise<any> => {
      const res = await makeFetchRequest(
        `/api/submissions/${submissionId}/voters`,
        "POST",
        { userIds },
      );
      return res.data;
    },
    getVotingStatus: async (submissionId: string): Promise<any> => {
      const res = await makeFetchRequest(
        `/api/submissions/${submissionId}/voters`,
        "GET",
      );
      return res.data;
    },
  },

  notifications: {
    getAll: async (userId: string): Promise<any[]> => {
      const res = await makeFetchRequest(`/api/notifications/${userId}`, "GET");
      return res.data;
    },
    getUnread: async (userId: string): Promise<any[]> => {
      const res = await makeFetchRequest(
        `/api/notifications/${userId}/unread`,
        "GET",
      );
      return res.data;
    },
    markRead: async (id: string): Promise<any> => {
      const res = await makeFetchRequest(`/api/notifications/${id}/read`, "PATCH");
      return res.data;
    },
    markAllRead: async (userId: string): Promise<any> => {
      const res = await makeFetchRequest(
        `/api/notifications/${userId}/read-all`,
        "PATCH",
      );
      return res.data;
    },
    create: async (
      userId: string,
      title: string,
      content: string,
      type: "INFO" | "WARNING" | "ERROR",
    ): Promise<any> => {
      const res = await makeFetchRequest("/api/notifications", "POST", {
        userId,
        title,
        content,
        type,
      });
      return res.data;
    },
    adminGetAll: async (): Promise<Notification[]> => {
      const res = await makeFetchRequest("/api/notifications", "GET");
      return res.data;
    },
    delete: async (id: string): Promise<void> => {
      await makeFetchRequest(`/api/notifications/${id}`, "DELETE");
    },
  },

  auditLogs: {
    getAll: async (): Promise<AuditLog[]> => {
      const res = await makeFetchRequest("/api/audit-logs", "GET");
      return res.data;
    },
  },

  files: {
    upload: async (file: File, chapterId?: string): Promise<any> => {
      const config = getClientConfig();
      const url = `${config.baseUrl}/api/files/upload`;
      const fd = new FormData();
      fd.append("file", file);
      if (chapterId) {
        fd.append("chapterId", chapterId);
      }

      const headers: HeadersInit = {};
      const storedToken = getStoredToken();
      if (storedToken) {
        headers["Authorization"] = `Bearer ${storedToken}`;
      }

      const response = await fetch(url, {
        method: "POST",
        headers,
        body: fd,
      });

      const responseText = await response.text();
      let responseData;
      try {
        responseData = responseText ? JSON.parse(responseText) : {};
      } catch (e) {
        responseData = {
          message:
            responseText || `Upload failed with status ${response.status}`,
        };
      }

      if (!response.ok) {
        throw new Error(
          responseData.message ||
            `Upload failed with status ${response.status}`,
        );
      }
      return responseData.data;
    },
  },

  // EDITOR DASHBOARD & MANAGEMENT
  editor: {
    getDashboard: async (): Promise<any> => {
      const res = await makeFetchRequest("/api/editor/dashboard", "GET");
      return res.data;
    },
    getProductionOverview: async (): Promise<any> => {
      const res = await makeFetchRequest(
        "/api/editor/dashboard/production-overview",
        "GET",
      );
      return res.data;
    },
    getMySeries: async (): Promise<any[]> => {
      const res = await makeFetchRequest("/api/editor/my-series", "GET");
      return res.data;
    },
    getSeriesStats: async (seriesId: string): Promise<any> => {
      const res = await makeFetchRequest(
        `/api/editor/series/${seriesId}/stats`,
        "GET",
      );
      return res.data;
    },
    getSeriesProgress: async (seriesId: string): Promise<any> => {
      const res = await makeFetchRequest(
        `/api/editor/series/${seriesId}/progress`,
        "GET",
      );
      return res.data;
    },
    getTaskStatistics: async (seriesId: string): Promise<any> => {
      const res = await makeFetchRequest(
        `/api/editor/series/${seriesId}/tasks/statistics`,
        "GET",
      );
      return res.data;
    },
    getOverdueTasks: async (seriesId: string): Promise<any> => {
      const res = await makeFetchRequest(
        `/api/editor/series/${seriesId}/overdue-tasks`,
        "GET",
      );
      return res.data;
    },
  },
};
