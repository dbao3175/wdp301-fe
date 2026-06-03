# 3. API Specification

Base URL: `https://api.example.com` (local: `http://localhost:8080`)

All protected routes: `Authorization: Bearer <access_token>`

Content-Type: `application/json`

## Auth

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| POST | `/api/auth/register` | Public | `{ name, email, password, role }` → 201 |
| POST | `/api/auth/login` | Public | Returns `{ accessToken, refreshToken?, user }` |
| POST | `/api/auth/refresh` | Public | Rotate access token |
| GET | `/api/auth/me` | Any | Current user profile |

### Login response

```json
{
  "accessToken": "eyJ...",
  "user": {
    "id": 1,
    "email": "oda@manga.jp",
    "fullName": "Oda",
    "role": "MANGAKA"
  }
}
```

## Series & proposals

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| GET | `/api/series` | All authenticated | List (filtered by role) |
| GET | `/api/series/{id}` | Owner/Editor/Board | Detail + workflow |
| POST | `/api/series` | MANGAKA | Create proposal `{ title, synopsis, initialDraftUrl? }` |
| PUT | `/api/series/{id}` | MANGAKA | Update draft fields |
| POST | `/api/series/{id}/submit` | MANGAKA | `DRAFT` → `SUBMITTED` |
| PUT | `/api/series/{id}/review` | EDITOR | `{ action: APPROVE\|REJECT\|REVISION, note }` |
| POST | `/api/series/{id}/send-to-board` | EDITOR | → `BOARD_REVIEW` |
| PUT | `/api/series/{id}/status` | EDITOR, BOARD | Production transition |
| POST | `/api/series/{id}/initial-draft` | MANGAKA | Multipart upload → URL |

### Review actions (editor)

```json
{
  "action": "REVISION",
  "note": "Pacing too slow in act 1"
}
```

## Board

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| GET | `/api/votes?seriesId=` | BOARD | List votes for series |
| POST | `/api/votes` | BOARD | `{ seriesId, decision, comment, pubSchedule? }` |
| POST | `/api/series/{id}/board-decision` | BOARD | Aggregate votes → approve/reject |

## Chapters & publishing

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| GET | `/api/chapters?seriesId=` | Scoped | Chapter list |
| POST | `/api/chapters` | EDITOR | `{ seriesId, chapterNumber, title, dueAt }` |
| PUT | `/api/chapters/{id}` | EDITOR, MANGAKA | Partial update |
| DELETE | `/api/chapters/{id}` | EDITOR | Remove draft chapter |
| PUT | `/api/chapters/{id}/publish` | EDITOR, BOARD | Publish chapter |

## Pages & annotations

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| GET | `/api/chapters/{id}/pages` | EDITOR, MANGAKA | Page list |
| POST | `/api/pages` | MANGAKA | Upload page image |
| GET | `/api/pages/{id}/annotations` | EDITOR, MANGAKA | List markers |
| POST | `/api/pages/{id}/annotations` | EDITOR | `{ xPercent, yPercent, markerType, body }` |
| PATCH | `/api/annotations/{id}` | EDITOR | Resolve / edit |

## Artwork tasks

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| GET | `/api/tasks` | Scoped | Filter `assignedTo`, `seriesId` |
| POST | `/api/tasks` | MANGAKA | Assign region task |
| PUT | `/api/tasks/{id}/submit` | ASSISTANT | Submit artwork |
| PUT | `/api/tasks/{id}/review` | MANGAKA | `{ status: APPROVED\|REVISION_REQUESTED, note }` |
| POST | `/api/tasks/bulk/send-to-editor` | MANGAKA | `{ taskIds[] }` |

### Create task with region

```json
{
  "seriesId": 10,
  "chapterId": 3,
  "pageId": 42,
  "assignedTo": 7,
  "taskType": "BACKGROUND",
  "title": "Cityscape BG p.12",
  "region": { "x": 12.5, "y": 30.0, "w": 55.0, "h": 40.0 }
}
```

## Rankings & surveys

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| GET | `/api/rankings?type=WEEKLY\|MONTHLY` | BOARD, EDITOR, MANGAKA* | Top 20 (*own series for mangaka) |
| POST | `/api/ratings` | BOARD | Survey entry (alias: reader survey) |
| POST | `/api/surveys` | BOARD | `{ seriesId, rankingType, readerVotes, salesUnits, engagementScore, surveyScore, surveyPeriod }` |
| GET | `/api/rankings/reports` | BOARD | PDF/JSON ranking report |
| GET | `/api/rankings/cancellation-risks` | BOARD, MANGAKA | Series in bottom tier |

## Notifications

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| GET | `/api/notifications` | Any | Inbox for current user/role |
| PATCH | `/api/notifications/{id}/read` | Any | Mark read |
| POST | `/api/notifications/read-all` | Any | Bulk read |

## Assistant earnings

| Method | Path | Roles | Description |
|--------|------|-------|-------------|
| GET | `/api/assistants/me/earnings?month=YYYY-MM` | ASSISTANT | Monthly breakdown |

## Error format

```json
{
  "timestamp": "2026-06-03T10:00:00Z",
  "status": 403,
  "error": "Forbidden",
  "message": "BOARD_MEMBER role required",
  "path": "/api/votes"
}
```

## WebSocket (STOMP / Socket.io bridge)

Events (existing FE listeners in `App.tsx`):

| Event | Payload | Trigger |
|-------|---------|---------|
| `task_assigned` | `Task` | New artwork task |
| `task_done` | `Task` | Assistant submit |
| `rating_created` | `Rating` | Survey submitted → recalc ranks |
| `vote_submitted` | `Vote` | Board vote |
| `series_status_changed` | `{ seriesId, proposalStatus }` | Workflow |
| `notification` | `AppNotification` | Any push |

Spring recommendation: **STOMP over WebSocket** with topic `/user/{id}/notifications` and `/topic/rankings`.

## Compatibility layer (current Node BE)

The React app already calls:

- `POST /api/auth/login`, `/api/auth/register`
- `GET/POST `/api/series`, `PUT /api/series/:id/review`, `PUT /api/series/:id/status`
- `GET/POST/PUT/DELETE `/api/chapters`, `PUT .../publish`
- `GET/POST `/api/tasks`, `PUT /api/tasks/:id/submit`
- `GET /api/ranks` or `/api/rankings`
- `POST /api/ratings`, `POST /api/votes`

Spring Boot should implement the same paths during migration, then deprecate Mongo-specific `_id` in favor of numeric `id`.
