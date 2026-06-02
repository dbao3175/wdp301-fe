/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { AppNotification, User } from "../types";

export function createNotification(
  partial: Omit<AppNotification, "id" | "read" | "createdAt">
): AppNotification {
  return {
    ...partial,
    id: `ntf-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    read: false,
    createdAt: new Date().toISOString(),
  };
}

export function filterNotificationsForUser(
  list: AppNotification[],
  user: User
): AppNotification[] {
  return list.filter(
    (n) =>
      n.recipientUserId === user._id ||
      n.recipientRole === user.role ||
      n.recipientRole === "ALL"
  );
}

export function countUnread(list: AppNotification[], user: User): number {
  return filterNotificationsForUser(list, user).filter((n) => !n.read).length;
}
