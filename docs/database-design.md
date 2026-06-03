# 1. Database Design

## Overview

Relational model in **MySQL 8** with `utf8mb4` for multilingual manga metadata. Identity uses **JWT** (access) + optional **refresh_tokens**. Business data centers on `series` with dual status columns: **proposal** lifecycle and **production** lifecycle.

Executable DDL: [sql/schema.sql](./sql/schema.sql).

## Entity summary

| Table | Purpose |
|-------|---------|
| `users` | Accounts; `role` enum drives RBAC |
| `refresh_tokens` | Long-lived session rotation |
| `series` | Proposal + production state, schedule, editor assignment |
| `proposal_status_history` | Audit trail for workflow transitions |
| `chapters` | Per-series chapter pipeline |
| `pages` | Page assets for annotation & region tasks |
| `page_annotations` | Click-to-comment + markers (%, not px) |
| `artwork_tasks` | Assistant work units with optional region bbox |
| `manuscript_reviews` | Mangaka approve / revision on tasks |
| `editor_draft_notes` | Tantou script/dialogue/content notes per chapter |
| `board_votes` | Editorial board decisions (unique per voter per series) |
| `reader_survey_entries` | Board-entered metrics per period |
| `series_rankings` | Top 20 slots per `WEEKLY` / `MONTHLY` per day |
| `cancellation_reviews` | Auto/manual low-rank escalation |
| `assistant_earnings` | Monthly income lines tied to approved tasks |
| `notifications` | User or role-targeted inbox |
| `activity_logs` | System audit stream |

## Status enums

### Proposal (`series.proposal_status`)

| Status | Meaning |
|--------|---------|
| `DRAFT` | Mangaka editing locally |
| `SUBMITTED` | Sent to editorial |
| `UNDER_REVIEW` | Tantou editor reviewing |
| `REVISION_REQUIRED` | Returned to mangaka |
| `EDITOR_APPROVED` | Ready for board |
| `BOARD_REVIEW` | Awaiting votes |
| `PUBLISHED` | Approved as ongoing series (proposal phase complete) |
| `REJECTED` | Editor or process rejection |
| `CANCELLED` | Board cancel / low performance |

### Production (`series.production_status`)

`PLANNING` → `SCRIPTING` → `EDITOR_REVIEW` → `ASSIGNING_ASSISTANTS` → `ARTWORK_IN_PROGRESS` → `FINAL_REVIEW` → `READY_TO_PUBLISH` → `PUBLISHED`.

Set when board approves and `pub_schedule` is assigned.

## Ranking engine (DB constraints)

- `series_rankings.rank_position` **CHECK 1–20** — hard cap on active ranked series.
- `tier` derived at write time: ranks 1–5 `HIGH`, 6–12 `NORMAL`, 13–20 `LOW`.
- Composite score computed in application/service layer from survey fields:

```
score = w1*reader_votes + w2*sales_units + w3*engagement_score + w4*survey_score
```

Weights are configurable (`application.yml`); recalculation job runs after each `reader_survey_entries` insert.

## Mapping to current FE sandbox

| FE field | SQL target |
|----------|------------|
| `Series.workflowStatus` | Map to `proposal_status` + `production_status` |
| `Series.status` (legacy) | Computed view or API DTO for backward compatibility |
| `Task` | `artwork_tasks` |
| `SeriesRank` | `series_rankings` |
| `Vote` | `board_votes` |
| `ManuscriptReview` | `manuscript_reviews` |
| `EditorDraftNote` | `editor_draft_notes` |

## Indexes & performance

- Hot paths: tasks by `assigned_to`, series by `mangaka_id`, rankings by `(ranking_type, ranked_on)`.
- Annotation queries: `page_annotations.page_id`.
- History: `proposal_status_history.series_id` for timeline UI.

## Migration from MongoDB (existing Node BE)

1. Export collections → staging CSV/JSON.
2. Map `_id` ObjectIds → new `BIGINT` with `legacy_id` column (temporary).
3. Normalize embedded `mangakaId` objects to FK `mangaka_id`.
4. Split combined status into `proposal_status` + `production_status` using rules in `src/workflow/seriesWorkflow.ts`.
