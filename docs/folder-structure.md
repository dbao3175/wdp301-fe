# 7. Folder Structure

## Frontend (current + target)

```
wdp301-fe/
├── docs/                          # Architecture pack (this folder)
│   ├── sql/schema.sql
│   └── *.md
├── public/
├── src/
│   ├── main.tsx
│   ├── App.tsx                    # Router, providers, global handlers
│   ├── index.css
│   ├── types.ts                   # Shared DTOs
│   ├── data.ts                    # Mock seed data
│   │
│   ├── domain/
│   │   └── enums.ts               # ProposalStatus, ProductionStatus, …
│   │
│   ├── auth/
│   │   ├── permissions.ts         # RBAC matrix
│   │   └── ProtectedRoute.tsx     # (extract from App.tsx)
│   │
│   ├── api/                       # TARGET: HTTP clients
│   │   ├── client.ts              # fetch + JWT interceptor
│   │   ├── seriesApi.ts
│   │   ├── chaptersApi.ts
│   │   ├── tasksApi.ts
│   │   ├── rankingsApi.ts
│   │   └── authApi.ts
│   │
│   ├── contexts/                  # TARGET: React context
│   │   ├── AuthContext.tsx
│   │   ├── MangaWorkspaceContext.tsx
│   │   └── NotificationContext.tsx
│   │
│   ├── hooks/
│   │   ├── usePermissions.ts
│   │   ├── useSeriesWorkflow.ts
│   │   └── useRankings.ts
│   │
│   ├── workflow/
│   │   ├── seriesWorkflow.ts
│   │   ├── notifications.ts
│   │   └── pubSchedule.ts
│   │
│   ├── services/                  # TARGET: pure business logic
│   │   └── rankingEngine.ts
│   │
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   └── StatsGrid.tsx
│   │   ├── manga/
│   │   │   ├── MangaPageCanvas.tsx
│   │   │   ├── AnnotationMarker.tsx
│   │   │   └── RegionAssignTool.tsx
│   │   ├── workspace/
│   │   │   ├── CreateForm.tsx
│   │   │   ├── TaskBoard.tsx
│   │   │   ├── ActivityFeed.tsx
│   │   │   └── NotificationPanel.tsx
│   │   └── admin/
│   │       └── RolePermissionManager.tsx
│   │
│   └── pages/
│       ├── RoleDashboard.tsx
│       ├── mangaka/
│       ├── assistant/
│       ├── tantoueditor/
│       └── editorialboard/
│
├── package.json
├── vite.config.ts
└── tsconfig.json
```

## Backend — Spring Boot (target)

```
wdp301-be/
├── pom.xml
├── src/main/java/com/wdp301/manga/
│   ├── MangaApplication.java
│   ├── config/
│   │   ├── SecurityConfig.java      # JWT filter chain
│   │   ├── WebSocketConfig.java
│   │   └── CorsConfig.java
│   ├── domain/
│   │   ├── entity/                  # JPA ↔ MySQL
│   │   ├── enums/
│   │   └── repository/
│   ├── service/
│   │   ├── SeriesWorkflowService.java
│   │   ├── RankingEngineService.java
│   │   ├── AnnotationService.java
│   │   └── NotificationService.java
│   ├── web/
│   │   ├── controller/              # REST
│   │   └── dto/
│   ├── security/
│   │   ├── JwtTokenProvider.java
│   │   └── UserDetailsServiceImpl.java
│   └── websocket/
│       └── MangaEventPublisher.java
├── src/main/resources/
│   ├── application.yml
│   └── db/migration/                # Flyway: V1__schema.sql
└── src/test/java/...
```

## Cross-cutting packages

| Package | Responsibility |
|---------|----------------|
| `domain/entity` | JPA models mirroring [schema.sql](./sql/schema.sql) |
| `RankingEngineService` | Recalc top-20, tiers, cancellation flags |
| `SeriesWorkflowService` | Valid transitions on proposal/production enums |
| `MangaEventPublisher` | WebSocket/STOMP after DB commit |
