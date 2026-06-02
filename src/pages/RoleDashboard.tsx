/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { MangakaDashboard } from "./mangaka/MangakaDashboard";
import { AssistantDashboard } from "./assistant/AssistantDashboard";
import { EditorDashboard } from "./tantoueditor/EditorDashboard";
import { BoardDashboard } from "./editorialboard/BoardDashboard";
import { DashboardData, DashboardHandlers, User } from "../types";
import { getPermissions } from "../auth/permissions";

type Props = DashboardData & DashboardHandlers;

export function RoleDashboard(props: Props) {
  const { currentUser } = props;
  const permissions = getPermissions(currentUser.role);

  return (
    <div>
      <div className="mb-4 flex items-center gap-2">
        <span className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">
          Vai trò hiện tại
        </span>
        <span className="text-xs font-bold px-3 py-1 rounded-full bg-zinc-900 text-white">
          {permissions.label}
        </span>
      </div>

      {currentUser.role === "MANGAKA" && <MangakaDashboard {...props} />}
      {currentUser.role === "ASSISTANT" && <AssistantDashboard {...props} />}
      {currentUser.role === "EDITOR" && <EditorDashboard {...props} />}
      {currentUser.role === "BOARD_MEMBER" && <BoardDashboard {...props} />}
    </div>
  );
}

export function RoleWelcomeBanner({ user }: { user: User }) {
  const p = getPermissions(user.role);
  return (
    <p className="text-[11px] text-zinc-400 max-w-2xl mt-0.5 leading-relaxed">
      {p.description}. Đổi vai trò ở thanh điều hướng để trải nghiệm quyền khác.
    </p>
  );
}
