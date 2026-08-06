/**
 * AssistantApp — root shell for ASSISTANT role
 */

import React, { useState, useEffect } from 'react';
import { User } from '../../types';
import AssistantLayout from './AssistantLayout';
import AssistantTaskManagement from './AssistantTaskManagement';
import AssistantWorkspace from './AssistantWorkspace';
import AssistantIncome from './AssistantIncome';
import { AssistantTask, AssistantNotification } from './assistantTypes';
import { apiClient } from '../../api/client';

interface AssistantAppProps {
  currentUser: User;
  activeTab: string;
  onChangeTab: (tab: string) => void;
  onLogout: () => void;
}

export default function AssistantApp({
  currentUser,
  activeTab,
  onChangeTab,
  onLogout,
}: AssistantAppProps) {
  const [headerSearch, setHeaderSearch] = useState('');
  const [tasksList, setTasksList] = useState<AssistantTask[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [workspaceTask, setWorkspaceTask] = useState<AssistantTask | null>(null);

  const refreshTasks = async () => {
    try {
      const [rawTasks, rawAssignments] = await Promise.all([
        apiClient.assistant.getMyTasks(),
        apiClient.assignments.getMy(),
      ]);

      const taskItems: AssistantTask[] = rawTasks.map((t: any) => {
        const urgency = t.status === 'REVISION_REQUESTED' ? 'critical' : 'normal';
        const status: AssistantTask['status'] =
          t.status === 'REVISION_REQUESTED' || t.status === 'REVISING'
            ? 'REVISING'
            : t.status === 'PENDING' || t.status === 'ASSIGNED'
              ? 'ASSIGNED'
              : t.status === 'MANGAKA_APPROVED'
                ? 'MANGAKA_APPROVED'
                : t.status === 'APPROVED'
                  ? 'APPROVED'
                  : t.status === 'SUBMITTED'
                    ? 'SUBMITTED'
                    : 'IN_PROGRESS';
        const firstPage = t.pageIds?.[0];
        return {
          _id: t._id,
          source: 'TASK',
          title: t.title,
          type: t.type || t.regions?.[0]?.type || t.region?.type || 'Background',
          status,
          chapter: t.chapterId?._id || '',
          chapterNumber: t.chapterId?.chapterNumber || 0,
          series: t.seriesId?.title || 'Unknown Series',
          deadline: t.dueAt || t.chapterId?.dueAt || new Date().toISOString(),
          urgency,
          assigneeName: currentUser.name,
          assigneeAvatar: currentUser.avatar || 'https://i.pravatar.cc/150?u=kenji',
          assigneeInitials: currentUser.name.split(' ').map((word: string) => word[0]).join('').toUpperCase().substring(0, 2),
          description: t.description || '',
          progress: t.status === 'APPROVED' ? 100 : t.status === 'MANGAKA_APPROVED' ? 90 : t.status === 'SUBMITTED' ? 75 : t.status === 'IN_PROGRESS' ? 50 : 20,
          pageCount: t.pageIds?.length || 1,
          earnings: t.status === 'APPROVED' ? 50000 : 0,
          submittedAt: t.submittedAt,
          approvedAt: t.reviewedAt,
          region: t.regions?.[0] || t.region || null,
          reviewNote: t.reviewNote,
          regions: t.regions || [],
          imageUrl: firstPage?.imageUrl || '',
          assistantImageUrl: firstPage?.assistantImageUrl || '',
          pages: t.pageIds || [],
        };
      });

      const assignmentItems = await Promise.all(rawAssignments.map(async (assignment: any) => {
        const chapterId = assignment.chapterId?._id || assignment.chapterId;
        let chapter: any = null;
        try {
          chapter = chapterId ? await apiClient.chapters.getById(chapterId) : null;
        } catch {
          chapter = null;
        }
        const firstPage = chapter?.pages?.[0];
        const feedback = assignment.feedbackId;
        const status: AssistantTask['status'] = assignment.status === 'COMPLETED'
          ? 'APPROVED'
          : assignment.status === 'SUBMITTED'
            ? 'SUBMITTED'
            : assignment.status === 'IN_PROGRESS'
              ? 'IN_PROGRESS'
              : 'ASSIGNED';
        return {
          _id: assignment._id,
          source: 'ASSIGNMENT' as const,
          feedbackId: feedback?._id || feedback || undefined,
          title: assignment.title || `Feedback revision - Chapter ${assignment.chapterId?.chapterNumber || ''}`,
          type: 'Editor Feedback',
          status,
          chapter: chapterId || '',
          chapterNumber: assignment.chapterId?.chapterNumber || chapter?.chapterNumber || 0,
          series: assignment.seriesId?.title || 'Unknown Series',
          deadline: chapter?.dueAt || chapter?.deadline || new Date().toISOString(),
          urgency: 'critical' as const,
          assigneeName: currentUser.name,
          assigneeAvatar: currentUser.avatar || 'https://i.pravatar.cc/150?u=kenji',
          assigneeInitials: currentUser.name.split(' ').map((word: string) => word[0]).join('').toUpperCase().substring(0, 2),
          description: feedback?.message || assignment.description || '',
          progress: assignment.status === 'COMPLETED' ? 100 : assignment.status === 'SUBMITTED' ? 75 : assignment.status === 'IN_PROGRESS' ? 50 : 20,
          pageCount: chapter?.pages?.length || 1,
          submittedAt: assignment.submittedAt,
          approvedAt: assignment.completedAt,
          imageUrl: firstPage?.imageUrl || '',
          assistantImageUrl: firstPage?.assistantImageUrl || '',
          pages: chapter?.pages || [],
          regions: [],
          region: null,
        };
      }));

      const mapped = [...assignmentItems, ...taskItems];
      setTasksList(mapped);
      setWorkspaceTask((selected) => {
        if (mapped.length === 0) return null;
        if (!selected) return mapped[0];
        return mapped.find((task) => task._id === selected._id) ?? mapped[0];
      });
    } catch (err) {
      console.error('Failed to load assistant tasks:', err);
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
    refreshTasks();
  }, []);

  const handleOpenWorkspace = (task: AssistantTask) => {
    setWorkspaceTask(task);
    onChangeTab('assistant-workspace');
  };

  const handleNotificationClick = (n: AssistantNotification) => {
    if (n.type === 'payment') {
      onChangeTab('assistant-income');
      return;
    }

    const targetId = n.targetId || n.taskId;
    const task = n.targetType === 'CHAPTER'
      ? tasksList.find((item) => item.chapter === targetId)
      : tasksList.find((item) => item._id === targetId);

    if (task) {
      handleOpenWorkspace(task);
      return;
    }

    onChangeTab('assistant-tasks');
  };

  return (
    <AssistantLayout
      currentUser={currentUser}
      activeTab={activeTab}
      onChangeTab={onChangeTab}
      onLogout={onLogout}
      headerSearch={headerSearch}
      onHeaderSearchChange={setHeaderSearch}
      onNotificationClick={handleNotificationClick}
    >
      {activeTab === 'assistant-tasks' && (
        <AssistantTaskManagement
          searchQuery={headerSearch}
          onOpenWorkspace={handleOpenWorkspace}
          tasks={tasksList}
          isLoading={isLoading}
        />
      )}
      {activeTab === 'assistant-workspace' && (
        <AssistantWorkspace activeTask={workspaceTask} onRefresh={refreshTasks} />
      )}
      {activeTab === 'assistant-income' && (
        <AssistantIncome />
      )}
    </AssistantLayout>
  );
}
