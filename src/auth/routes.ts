/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import type { User } from "../types";

export type DashboardRole = User["role"];

/** Hash/BrowserRouter path for each role dashboard (not raw role.toLowerCase()). */
export function roleToDashboardPath(role: DashboardRole): string {
  switch (role) {
    case "BOARD_MEMBER":
      return "/board";
    case "MANGAKA":
      return "/mangaka";
    case "ASSISTANT":
      return "/assistant";
    case "EDITOR":
      return "/editor";
    default:
      return "/";
  }
}
