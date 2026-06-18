/**
 * AssistantApp — root shell for ASSISTANT role
 */

import React, { useState } from 'react';
import { User } from '../../types';
import AssistantLayout from './AssistantLayout';
import AssistantTaskManagement from './AssistantTaskManagement';
import AssistantWorkspace from './AssistantWorkspace';
import AssistantIncome from './AssistantIncome';
import { AssistantTask, AssistantNotification } from './assistantTypes';
import { ASSIGNED_TASKS } from './assistantMockData';

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
  const [workspaceTask, setWorkspaceTask] = useState<AssistantTask | null>(ASSIGNED_TASKS[0]);

  const handleOpenWorkspace = (task: AssistantTask) => {
    setWorkspaceTask(task);
    onChangeTab('assistant-workspace');
  };

  const handleNotificationClick = (n: AssistantNotification) => {
    if (n.taskId) {
      const task =
        ASSIGNED_TASKS.find((t) => t._id === n.taskId) ??
        ({ ...ASSIGNED_TASKS[0], _id: n.taskId, title: n.message } as AssistantTask);
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
        />
      )}
      {activeTab === 'assistant-workspace' && (
        <AssistantWorkspace activeTask={workspaceTask} />
      )}
      {activeTab === 'assistant-income' && (
        <AssistantIncome />
      )}
    </AssistantLayout>
  );
}
