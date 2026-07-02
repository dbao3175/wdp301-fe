# Backend prompt for Manga Studio workflow

Please implement/verify backend support for the production flow from Chapter task delegation through ranking and final Editorial Board decisions. Frontend already calls these APIs and expects JSON responses in the shape `{ success: boolean, data: ... }` unless noted.

## 1. Task assignment and notifications

- `POST /api/tasks` for `MANGAKA`
  - Body: `seriesId`, `chapterId`, `assignedTo`, `title`, `description`, `pageIds`, `regions`, `dueAt`.
  - Validate `assignedTo` is role `ASSISTANT`.
  - Create task with status `PENDING`.
  - Update related pages to `HAS_TASK`.
  - Create a `Notification` for the assigned assistant.
  - Emit socket event `task_assigned`.

- `PUT /api/assistant/tasks/:taskId/submit` for `ASSISTANT`
  - Only allow the assigned assistant to submit.
  - Set task status to `SUBMITTED`, `submittedAt`.
  - Update related pages to `COMPLETED` unless already `APPROVED`.
  - Create a `Notification` for the assigning Mangaka.
  - Emit socket event `task_done`.

- `PUT /api/tasks/:id/review` for `MANGAKA`
  - Body: `action: "APPROVE" | "REVISION_REQUESTED"`, `reviewNote`.
  - On approve: task `APPROVED`, pages `APPROVED`, add assistant earning once per approved page, notify assistant.
  - On revision: task `REVISION_REQUESTED`, pages `REVISION_REQUESTED`, notify assistant.
  - Emit `task_approved` or `task_revision_requested`.

## 2. Notification compatibility

- `Notification` should include `userId`, `title`, `content`, `type`, `isRead`, `createdAt`.
- Either return both `isRead` and `read`, or keep `isRead`; FE now normalizes it.
- `GET /api/notifications/:userId` should return an array, or `{ success, data: array }`.
- `PATCH /api/notifications/:id/read` and `PATCH /api/notifications/:userId/read-all` should work for authenticated users.

## 3. Assistant income

- `GET /api/assistant/earnings`
- `GET /api/assistant/income/tasks`
- `GET /api/assistant/income/analytics`
- `GET /api/assistant/payout-account`
- Earnings should update automatically only after a Mangaka approves a task.

## 4. Editorial Board directives

Frontend calls `/api/directives`; please add this route.

- `GET /api/directives` for `BOARD_MEMBER` and `EDITOR`
  - Return directives with fields:
    - `_id`, `seriesId`, `seriesTitle`, `actionType`, `newSchedule`, `reason`, `status`, `proposedBy`, `proposedByName`, `votes`, `createdAt`.

- `POST /api/directives` for `BOARD_MEMBER`
  - Body: `seriesId`, `actionType: "CANCEL" | "CHANGE_FORMAT"`, `reason`, optional `newSchedule: "WEEKLY" | "MONTHLY"`.
  - Create directive with status `PENDING`.

- `POST /api/directives/:id/vote` for `BOARD_MEMBER`
  - Body: `decision: "ACCEPT" | "REJECT"`, `comment`.
  - Prevent duplicate vote by same board member.
  - When accepted by majority, set status `APPROVED`.
  - If `CANCEL`, update series status to `CANCELLED`.
  - If `CHANGE_FORMAT`, update `series.pubSchedule`.
  - Notify Mangaka and Tantou Editor.

## 5. Reader rating and ranking

- `POST /api/ratings` should accept `seriesId`, `voteCount`, `source`, `submittedBy`.
- After rating import, recalculate ranks for the cycle.
- Ranking records should expose current rank, previous rank, and rank change/trend.
- If a series stays low-ranked for multiple cycles, notify Mangaka and Tantou Editor.

## Important acceptance checks

- Mangaka can create chapter/pages, annotate regions, create task, and assistant receives notification.
- Assistant can view task, upload/submit result, and Mangaka receives notification.
- Mangaka approve adds earning exactly once per page.
- Revision returns task to Assistant and can be resubmitted.
- Board can create/vote directives and final decision reaches Mangaka/Editor by notification.
