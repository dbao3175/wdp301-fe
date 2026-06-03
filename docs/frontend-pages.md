# 4. Frontend Page Structure

Router: **React Router** (`HashRouter` today; prefer `BrowserRouter` in production behind reverse proxy).

## Route map

| Path | Role | Page | Status in repo |
|------|------|------|----------------|
| `/` | — | Redirect to role home | ✅ |
| `/mangaka` | MANGAKA | Mangaka Dashboard | ✅ `MangakaDashboard` |
| `/assistant` | ASSISTANT | Assistant Dashboard | ✅ `AssistantDashboard` |
| `/editor` | EDITOR | Tantou Editor Dashboard | ✅ `EditorDashboard` |
| `/board` | BOARD_MEMBER | Editorial Board Dashboard | ✅ `BoardDashboard` |
| `/admin/permissions` | Admin* | RBAC config UI | ✅ `RolePermissionManager` |

\*Permissions admin is not in spec; useful for demos.

## Planned sub-routes (target refactor)

```
/mangaka
  /dashboard          → overview, stats, notifications
  /series             → My Series list
  /proposals          → Proposal Management (CRUD + submit)
  /chapters/:seriesId → Chapter Management
  /assignments        → Assistant Assignment (region picker)
  /artwork-review     → Artwork Review queue
  /rankings           → Ranking View (own series)
  /notifications

/assistant
  /dashboard
  /tasks              → Assigned Tasks
  /tasks/:id/submit   → Task Submission + downloads
  /income             → Income Tracking

/editor
  /dashboard
  /proposals          → Proposal Review
  /series             → Series Monitoring
  /chapters/:id       → Chapter Review + Annotation Tool
  /reports            → Performance Reports

/board
  /dashboard
  /voting             → Voting Management
  /proposals          → Proposal Review (read-only detail)
  /publishing         → Publishing Decisions (schedule)
  /surveys            → Survey Data Entry
  /rankings           → Ranking Management
  /cancellations      → Cancellation Decisions
```

Current implementation consolidates these into **tabbed dashboards** (`TaskBoard`, `CreateForm`, `ActivityFeed`) inside each role component — acceptable for MVP; extract routes when file size exceeds ~400 lines per dashboard.

## Page → API dependencies

| Page | Primary APIs |
|------|----------------|
| Proposal Management | `POST/PUT /api/series`, submit, review |
| Chapter Management | `/api/chapters` |
| Assistant Assignment | `POST /api/tasks` + page assets |
| Annotation Tool | `/api/pages/{id}/annotations` |
| Rankings | `GET /api/rankings`, survey POST |
| Income | `GET /api/assistants/me/earnings` |

## Layout shell

```
App
├── Header (auth, connection mode, role switch)
├── StatsGrid (global KPIs)
└── Routes
    └── RoleDashboard shell
        ├── NotificationPanel
        ├── CreateForm (role-filtered tabs)
        ├── TaskBoard (kanban / reviews / ratings / chapters)
        └── ActivityFeed
```

## Access control

`ProtectedRoute` checks `currentUser.role` against `allowedRoles`. Fine-grained actions use `getPermissions(role)` from `src/auth/permissions.ts`.
