# 2. Entity-Relationship Diagram

```mermaid
erDiagram
    users ||--o{ series : "creates (mangaka)"
    users ||--o{ series : "edits (tantou)"
    users ||--o{ artwork_tasks : "assigned_to"
    users ||--o{ artwork_tasks : "assigned_by"
    users ||--o{ board_votes : "votes"
    users ||--o{ page_annotations : "writes"
    users ||--o{ reader_survey_entries : "enters"
    users ||--o{ assistant_earnings : "earns"

    series ||--o{ proposal_status_history : "audits"
    series ||--o{ chapters : "has"
    series ||--o{ board_votes : "receives"
    series ||--o{ reader_survey_entries : "surveyed"
    series ||--o{ series_rankings : "ranked"
    series ||--o{ cancellation_reviews : "risk"
    series ||--o{ artwork_tasks : "contains"

    chapters ||--o{ pages : "contains"
    chapters ||--o| editor_draft_notes : "notes"
    chapters ||--o{ artwork_tasks : "scopes"

    pages ||--o{ page_annotations : "annotated"
    pages ||--o{ artwork_tasks : "region"

    artwork_tasks ||--o| manuscript_reviews : "reviewed"
    artwork_tasks ||--o{ assistant_earnings : "pays"

    users {
        bigint id PK
        string email UK
        enum role
    }

    series {
        bigint id PK
        enum proposal_status
        enum production_status
        enum pub_schedule
    }

    chapters {
        bigint id PK
        int chapter_number
    }

    pages {
        bigint id PK
        int page_number
    }

    page_annotations {
        bigint id PK
        decimal x_percent
        decimal y_percent
    }

    artwork_tasks {
        bigint id PK
        enum task_type
        decimal region_x
    }

    series_rankings {
        bigint id PK
        tinyint rank_position
        enum tier
    }
```

## Cardinality notes

- One **tantou editor** per series (`tantou_editor_id` nullable until assigned).
- One **editor_draft_notes** row per chapter (upsert on save).
- One **manuscript_review** per artwork task (mangaka gate).
- **board_votes**: at most one vote per `(series_id, voter_id)`.
- **series_rankings**: at most 20 rows per `(ranking_type, ranked_on)` via application logic + CHECK.

## Annotation & region model

```
pages (image)
  └── page_annotations (x%, y%, marker_type, body)
  └── artwork_tasks (region_x/y/w/h %, task_type, assignee)
```

Percent coordinates keep annotations responsive across zoom levels in the React canvas overlay.
