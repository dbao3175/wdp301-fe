# 9. Sequence Diagrams

## Workflow 1 — Proposal phase

```mermaid
sequenceDiagram
    actor M as Mangaka
    participant FE as Frontend
    participant API as Spring API
    participant ED as Tantou Editor
    participant BD as Editorial Board

    M->>FE: Create proposal + upload draft
    FE->>API: POST /api/series
    API-->>FE: proposal_status=DRAFT

    M->>FE: Submit
    FE->>API: POST /api/series/{id}/submit
    API-->>FE: SUBMITTED → UNDER_REVIEW
    API->>ED: notification

    alt Revision required
        ED->>FE: Request revision + note
        FE->>API: PUT review REVISION
        API-->>FE: REVISION_REQUIRED
        API->>M: notification
        M->>FE: Revise + resubmit
        FE->>API: PUT /api/series/{id}
    else Editor approves
        ED->>FE: Approve + send to board
        FE->>API: POST send-to-board
        API-->>FE: BOARD_REVIEW
    end

    BD->>FE: Vote ACCEPT + WEEKLY/MONTHLY
    FE->>API: POST /api/votes
    API->>API: tally votes
    API-->>FE: EDITOR_APPROVED / production PLANNING
    API->>M: notification (series in production)
```

## Workflow 2 — Production phase

```mermaid
sequenceDiagram
    actor M as Mangaka
    actor A as Assistant
    participant FE as Frontend
    participant API as Spring API
    actor ED as Tantou Editor

    M->>FE: Story draft + page layout
    FE->>API: POST chapters / pages

    ED->>FE: Review story + annotate page
    FE->>API: POST /api/pages/{id}/annotations
    API->>M: notification

    M->>FE: Assign region tasks
    FE->>API: POST /api/tasks
    API->>A: notification task_assigned

    A->>FE: Upload artwork + submit
    FE->>API: PUT /api/tasks/{id}/submit
    API->>M: notification

    alt Mangaka approves
        M->>FE: Approve manuscript
        FE->>API: PUT review APPROVED
    else Revision
        M->>FE: Request revision
        FE->>API: PUT review REVISION_REQUESTED
        API->>A: notification
    end

    M->>FE: Send bundle to editor
    FE->>API: POST bulk/send-to-editor
    ED->>FE: Final review + publish chapter
    FE->>API: PUT /api/chapters/{id}/publish
```

## Ranking recalculation

```mermaid
sequenceDiagram
    actor BD as Board Member
    participant FE as Frontend
    participant API as Spring API
    participant RE as RankingEngine
    participant WS as WebSocket

    BD->>FE: Enter survey metrics
    FE->>API: POST /api/surveys
    API->>RE: recompute composite scores
    RE->>API: update series_rankings (max 20)
    RE->>API: flag cancellation_reviews if rank>=13
    API-->>FE: rankings JSON
    API->>WS: rating_created
    WS-->>FE: refresh rankings UI
    API->>M: notification if risk tier
```

## JWT authentication (backend mode)

```mermaid
sequenceDiagram
    participant FE as Frontend
    participant API as AuthController
    participant DB as MySQL

    FE->>API: POST /api/auth/login
    API->>DB: validate credentials
    DB-->>API: user + role
    API-->>FE: accessToken + user
    FE->>FE: store token in AuthContext

    FE->>API: GET /api/series (Bearer)
    API->>API: JwtFilter validate
    API-->>FE: 200 scoped list
```

## Sandbox mode (no backend)

Same UI handlers write to `localStorage` and simulate socket delays with `setTimeout` — see `App.tsx` handlers with `[Sandbox Model]` logs.
