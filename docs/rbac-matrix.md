# 6. Role Permissions Matrix

Roles map to spec: **Mangaka**, **Assistant**, **Tantou Editor** (`EDITOR`), **Editorial Board** (`BOARD_MEMBER`).

Implementation: `src/auth/permissions.ts` (`ROLE_PERMISSIONS`).

## Capability matrix

| Capability | Mangaka | Assistant | Tantou Editor | Editorial Board |
|------------|:-------:|:---------:|:-------------:|:---------------:|
| Submit series proposal | ✅ | — | — | — |
| Upload initial draft | ✅ | — | — | — |
| Revise proposal after editor feedback | ✅ | — | — | — |
| Review proposal (approve/reject/revision) | — | — | ✅ | — |
| Send proposal to board | — | — | ✅ | — |
| Vote on new series | — | — | — | ✅ |
| Decide pub schedule (Weekly/Monthly) | — | — | — | ✅ |
| Cancel low-performing series | — | — | — | ✅ |
| Change publishing frequency | — | — | — | ✅ |
| Create chapter / set deadline | — | — | ✅ | — |
| Publish chapter (final) | — | — | ✅ | ✅ |
| Annotate pages | — | — | ✅ | — |
| Story pacing / draft notes | — | — | ✅ | — |
| Assign artwork tasks (regions) | ✅ | — | — | — |
| View assigned tasks | — | ✅ | — | — |
| Submit completed artwork | — | ✅ | — | — |
| Review assistant work | ✅ | — | — | — |
| Send work to editor | ✅ | — | — | — |
| Editor final publish approval | — | — | ✅ | — |
| Board final PUBLISHED | — | — | — | ✅ |
| View own rankings | ✅ | — | — | — |
| View all rankings | — | — | ✅ | ✅ |
| Enter reader survey data | — | — | — | ✅ |
| View studio progress | — | — | ✅ | — |
| Track monthly earnings | — | ✅ | — | — |

## UI surface matrix (current FE)

| UI module | Mangaka | Assistant | Editor | Board |
|-----------|:-------:|:---------:|:------:|:-----:|
| TaskBoard: kanban | ✅ | ✅ | ✅ | — |
| TaskBoard: reviews | — | — | ✅ | ✅ |
| TaskBoard: ratings | ✅ | — | — | ✅ |
| TaskBoard: chapters | — | — | ✅ | — |
| CreateForm: proposal | ✅ | — | — | — |
| CreateForm: chapter | — | — | ✅ | — |
| CreateForm: task | ✅ | — | — | — |

## Spring Security authorities (target BE)

```java
// Example @PreAuthorize mappings
@PreAuthorize("hasRole('MANGAKA')")      // POST /api/series
@PreAuthorize("hasRole('EDITOR')")      // PUT /api/series/{id}/review
@PreAuthorize("hasRole('BOARD_MEMBER')") // POST /api/votes, /api/surveys
@PreAuthorize("hasRole('ASSISTANT')")   // PUT /api/tasks/{id}/submit
```

JWT claim: `"roles": ["ROLE_MANGAKA"]` (Spring default prefix).

## Workflow action × role

| Action | Allowed roles |
|--------|----------------|
| `submitProposal` | MANGAKA |
| `requestRevision` | EDITOR |
| `sendToBoard` | EDITOR |
| `boardVotePublish` | BOARD_MEMBER |
| `boardReject` | BOARD_MEMBER |
| `assignTask` | MANGAKA |
| `submitTask` | ASSISTANT |
| `manuscriptReview` | MANGAKA |
| `editorApprovePublish` | EDITOR |
| `boardFinalPublish` | BOARD_MEMBER |
| `enterSurvey` | BOARD_MEMBER |

## Dynamic RBAC (demo)

`RolePermissionManager` persists overrides to `localStorage` key `wdp301_role_permissions`. Production should use server-side role management only; remove or gate behind `ADMIN` in production builds.
