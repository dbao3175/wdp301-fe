/**
 * Assistant module types
 */

export type AssistantTaskStatus =
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'SUBMITTED'
  | 'MANGAKA_APPROVED'
  | 'APPROVED'
  | 'REVISING';
export type UrgencyLevel = 'critical' | 'warning' | 'normal';

export interface AssistantTask {
  _id: string;
  title: string;
  type: string;
  status: AssistantTaskStatus;
  chapter: string;
  chapterNumber: number;
  series: string;
  deadline: string;
  urgency: UrgencyLevel;
  assigneeName: string;
  assigneeAvatar: string;
  assigneeInitials: string;
  description: string;
  progress: number;
  pageCount?: number;
  earnings?: number;
  submittedAt?: string;
  approvedAt?: string;
  imageUrl?: string;
  reviewNote?: string;
  regions?: Array<{
    x: number;
    y: number;
    width: number;
    height: number;
    type: string;
    comment?: string;
  }>;
  assistantImageUrl?: string;
  pages?: any[];
  region?: {
    x: number;
    y: number;
    width: number;
    height: number;
    type: string;
  } | null;
}

export type AIToolId = 'sam' | 'yolo';

export interface AIToolConfig {
  id: AIToolId;
  name: string;
  badge?: string;
  description: string;
  color: string;
  borderColor: string;
  bgColor: string;
  defaultPrompt: string;
}

export type NotificationType =
  | 'task_assigned'
  | 'task_revision'
  | 'task_approved'
  | 'deadline'
  | 'comment'
  | 'payment';

export interface AssistantNotification {
  _id: string;
  type: NotificationType;
  actorName: string;
  actorAvatar: string;
  message: string;
  taskId?: string;
  createdAt: string;
  read: boolean;
}
