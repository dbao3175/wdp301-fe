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
      const rawTasks = await apiClient.assistant.getMyTasks();
      const mapped: AssistantTask[] = rawTasks.map((t: any) => {
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
        const imageUrl = firstPage ? (firstPage.imageUrl || '') : '';
        const assistantImageUrl = firstPage ? (firstPage.assistantImageUrl || '') : '';
        return {
          _id: t._id,
          title: t.title,
          type: t.type || t.regions?.[0]?.type || t.region?.type || 'Background',
          status: status,
          chapter: t.chapterId?._id || '',
          chapterNumber: t.chapterId?.chapterNumber || 0,
          series: t.seriesId?.title || 'Unknown Series',
          deadline: t.dueAt || t.chapterId?.dueAt || new Date().toISOString(),
          urgency: urgency,
          assigneeName: currentUser.name,
          assigneeAvatar: currentUser.avatar || 'https://i.pravatar.cc/150?u=kenji',
          assigneeInitials: currentUser.name.split(' ').map((w: string) => w[0]).join('').toUpperCase().substring(0, 2),
          description: t.description || '',
          progress: t.status === 'APPROVED'
            ? 100
            : t.status === 'MANGAKA_APPROVED'
              ? 90
              : t.status === 'SUBMITTED'
                ? 75
                : t.status === 'IN_PROGRESS' ? 50 : 20,
          pageCount: t.pageIds?.length || 1,
          earnings: t.status === 'APPROVED' ? 50000 : 0,
          submittedAt: t.submittedAt,
          approvedAt: t.reviewedAt,
          region: t.regions?.[0] || t.region || null,
          reviewNote: t.reviewNote,
          regions: t.regions || [],
          imageUrl: imageUrl,
          assistantImageUrl: assistantImageUrl,
          pages: t.pageIds || []
        };
      });
      setTasksList(mapped);
      
      // Keep selected task sync'ed or select first
      setWorkspaceTask((selected) => {
        if (mapped.length === 0) return null;
        if (!selected) return mapped[0];
        return mapped.find((task) => task._id === selected._id) ?? mapped[0];
      });
    } catch (err) {
      console.error("Failed to load assistant tasks:", err);
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
    const targetId = (n as any).targetId || n.taskId;
    if (targetId) {
      const task =
        tasksList.find((t) => t._id === targetId) ??
        ({ ...tasksList[0], _id: targetId, title: n.message } as AssistantTask);
      handleOpenWorkspace(task);
    } else if (n.type === 'payment') {
      onChangeTab('assistant-income');
    }
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
