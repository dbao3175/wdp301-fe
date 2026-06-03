-- Manga Publishing Management System — MySQL 8.x
-- Charset: utf8mb4 for Japanese/Vietnamese titles

CREATE DATABASE IF NOT EXISTS manga_pub
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE manga_pub;

-- ---------------------------------------------------------------------------
-- Identity & RBAC
-- ---------------------------------------------------------------------------

CREATE TABLE users (
  id            BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name     VARCHAR(200) NOT NULL,
  role          ENUM('MANGAKA','ASSISTANT','EDITOR','BOARD_MEMBER') NOT NULL,
  avatar_url    VARCHAR(500) NULL,
  is_active     TINYINT(1) NOT NULL DEFAULT 1,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_users_role (role)
);

CREATE TABLE refresh_tokens (
  id         BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  user_id    BIGINT UNSIGNED NOT NULL,
  token_hash VARCHAR(64) NOT NULL UNIQUE,
  expires_at TIMESTAMP NOT NULL,
  revoked_at TIMESTAMP NULL,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- ---------------------------------------------------------------------------
-- Series & proposal lifecycle
-- ---------------------------------------------------------------------------

CREATE TABLE series (
  id                 BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  title              VARCHAR(300) NOT NULL,
  synopsis           TEXT NOT NULL,
  mangaka_id         BIGINT UNSIGNED NOT NULL,
  tantou_editor_id   BIGINT UNSIGNED NULL,
  proposal_status    ENUM(
    'DRAFT','SUBMITTED','UNDER_REVIEW','REVISION_REQUIRED',
    'EDITOR_APPROVED','BOARD_REVIEW','PUBLISHED','REJECTED','CANCELLED'
  ) NOT NULL DEFAULT 'DRAFT',
  production_status  ENUM(
    'PLANNING','SCRIPTING','EDITOR_REVIEW','ASSIGNING_ASSISTANTS',
    'ARTWORK_IN_PROGRESS','FINAL_REVIEW','READY_TO_PUBLISH','PUBLISHED'
  ) NULL,
  pub_schedule       ENUM('WEEKLY','MONTHLY') NULL,
  initial_draft_url  VARCHAR(500) NULL,
  revision_note      TEXT NULL,
  reviewed_at        TIMESTAMP NULL,
  production_started_at TIMESTAMP NULL,
  created_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (mangaka_id) REFERENCES users(id),
  FOREIGN KEY (tantou_editor_id) REFERENCES users(id),
  INDEX idx_series_proposal (proposal_status),
  INDEX idx_series_production (production_status),
  INDEX idx_series_mangaka (mangaka_id)
);

CREATE TABLE proposal_status_history (
  id          BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  series_id   BIGINT UNSIGNED NOT NULL,
  from_status VARCHAR(40) NULL,
  to_status   VARCHAR(40) NOT NULL,
  actor_id    BIGINT UNSIGNED NOT NULL,
  note        TEXT NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (series_id) REFERENCES series(id) ON DELETE CASCADE,
  FOREIGN KEY (actor_id) REFERENCES users(id)
);

-- ---------------------------------------------------------------------------
-- Chapters, pages, annotations
-- ---------------------------------------------------------------------------

CREATE TABLE chapters (
  id              BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  series_id       BIGINT UNSIGNED NOT NULL,
  chapter_number  INT UNSIGNED NOT NULL,
  title           VARCHAR(300) NOT NULL,
  status          ENUM('IN_PROGRESS','EDITOR_REVIEW','READY_TO_PUBLISH','PUBLISHED') NOT NULL DEFAULT 'IN_PROGRESS',
  due_at          TIMESTAMP NULL,
  published_at    TIMESTAMP NULL,
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uk_chapter (series_id, chapter_number),
  FOREIGN KEY (series_id) REFERENCES series(id) ON DELETE CASCADE
);

CREATE TABLE pages (
  id           BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  chapter_id   BIGINT UNSIGNED NOT NULL,
  page_number  INT UNSIGNED NOT NULL,
  image_url    VARCHAR(500) NOT NULL,
  width_px     INT UNSIGNED NULL,
  height_px    INT UNSIGNED NULL,
  created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_page (chapter_id, page_number),
  FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE CASCADE
);

CREATE TABLE page_annotations (
  id           BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  page_id      BIGINT UNSIGNED NOT NULL,
  author_id    BIGINT UNSIGNED NOT NULL,
  x_percent    DECIMAL(6,3) NOT NULL,
  y_percent    DECIMAL(6,3) NOT NULL,
  marker_type  ENUM('COMMENT','REVISION','HIGHLIGHT') NOT NULL DEFAULT 'COMMENT',
  body         TEXT NOT NULL,
  resolved     TINYINT(1) NOT NULL DEFAULT 0,
  created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE,
  FOREIGN KEY (author_id) REFERENCES users(id),
  INDEX idx_annotations_page (page_id)
);

-- ---------------------------------------------------------------------------
-- Artwork tasks & region assignment
-- ---------------------------------------------------------------------------

CREATE TABLE artwork_tasks (
  id            BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  series_id     BIGINT UNSIGNED NOT NULL,
  chapter_id    BIGINT UNSIGNED NOT NULL,
  page_id       BIGINT UNSIGNED NULL,
  assigned_to   BIGINT UNSIGNED NOT NULL,
  assigned_by   BIGINT UNSIGNED NOT NULL,
  task_type     ENUM('BACKGROUND','SHADING','EFFECTS','CHARACTER_CLEANUP') NOT NULL,
  title         VARCHAR(300) NOT NULL,
  status        ENUM('PENDING','IN_PROGRESS','SUBMITTED','APPROVED','REVISION_REQUIRED') NOT NULL DEFAULT 'PENDING',
  delivery_status ENUM('ASSIGNED','SUBMITTED','MANGAKA_APPROVED','WITH_EDITOR','PUBLISHED') NULL,
  region_x      DECIMAL(6,3) NULL,
  region_y      DECIMAL(6,3) NULL,
  region_w      DECIMAL(6,3) NULL,
  region_h      DECIMAL(6,3) NULL,
  asset_url     VARCHAR(500) NULL,
  due_at        TIMESTAMP NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (series_id) REFERENCES series(id) ON DELETE CASCADE,
  FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE CASCADE,
  FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE SET NULL,
  FOREIGN KEY (assigned_to) REFERENCES users(id),
  FOREIGN KEY (assigned_by) REFERENCES users(id),
  INDEX idx_tasks_assignee (assigned_to, status)
);

CREATE TABLE manuscript_reviews (
  id          BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  task_id     BIGINT UNSIGNED NOT NULL UNIQUE,
  reviewer_id BIGINT UNSIGNED NOT NULL,
  status      ENUM('APPROVED','REVISION_REQUESTED') NOT NULL,
  note        TEXT NULL,
  reviewed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (task_id) REFERENCES artwork_tasks(id) ON DELETE CASCADE,
  FOREIGN KEY (reviewer_id) REFERENCES users(id)
);

CREATE TABLE editor_draft_notes (
  id            BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  chapter_id    BIGINT UNSIGNED NOT NULL UNIQUE,
  editor_id     BIGINT UNSIGNED NOT NULL,
  content_note  TEXT,
  dialogue_note TEXT,
  script_note   TEXT,
  updated_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (chapter_id) REFERENCES chapters(id) ON DELETE CASCADE,
  FOREIGN KEY (editor_id) REFERENCES users(id)
);

-- ---------------------------------------------------------------------------
-- Editorial board
-- ---------------------------------------------------------------------------

CREATE TABLE board_votes (
  id          BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  series_id   BIGINT UNSIGNED NOT NULL,
  voter_id    BIGINT UNSIGNED NOT NULL,
  decision    ENUM('ACCEPT','REJECT') NOT NULL,
  comment     TEXT NULL,
  pub_schedule ENUM('WEEKLY','MONTHLY') NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_vote (series_id, voter_id),
  FOREIGN KEY (series_id) REFERENCES series(id) ON DELETE CASCADE,
  FOREIGN KEY (voter_id) REFERENCES users(id)
);

-- ---------------------------------------------------------------------------
-- Rankings & reader survey
-- ---------------------------------------------------------------------------

CREATE TABLE reader_survey_entries (
  id                BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  series_id         BIGINT UNSIGNED NOT NULL,
  entered_by        BIGINT UNSIGNED NOT NULL,
  ranking_type      ENUM('WEEKLY','MONTHLY') NOT NULL,
  reader_votes      INT UNSIGNED NOT NULL DEFAULT 0,
  sales_units       INT UNSIGNED NOT NULL DEFAULT 0,
  engagement_score  DECIMAL(8,2) NOT NULL DEFAULT 0,
  survey_score      DECIMAL(8,2) NOT NULL DEFAULT 0,
  survey_period     DATE NOT NULL,
  created_at        TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (series_id) REFERENCES series(id) ON DELETE CASCADE,
  FOREIGN KEY (entered_by) REFERENCES users(id),
  INDEX idx_survey_period (ranking_type, survey_period)
);

CREATE TABLE series_rankings (
  id            BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  series_id     BIGINT UNSIGNED NOT NULL,
  ranking_type  ENUM('WEEKLY','MONTHLY') NOT NULL,
  rank_position TINYINT UNSIGNED NOT NULL,
  prev_rank     TINYINT UNSIGNED NULL,
  composite_score DECIMAL(12,4) NOT NULL,
  tier          ENUM('HIGH','NORMAL','LOW') NOT NULL,
  ranked_on     DATE NOT NULL,
  created_at    TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uk_rank_slot (ranking_type, rank_position, ranked_on),
  UNIQUE KEY uk_series_rank_day (series_id, ranking_type, ranked_on),
  FOREIGN KEY (series_id) REFERENCES series(id) ON DELETE CASCADE,
  CHECK (rank_position BETWEEN 1 AND 20)
);

CREATE TABLE cancellation_reviews (
  id          BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  series_id   BIGINT UNSIGNED NOT NULL,
  triggered_by ENUM('AUTO_RANK','MANUAL_BOARD') NOT NULL,
  risk_level  ENUM('WARNING','SCHEDULE_CHANGE','CANCELLATION') NOT NULL,
  board_decision ENUM('KEEP','WARN','CHANGE_SCHEDULE','CANCEL') NULL,
  decided_at  TIMESTAMP NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (series_id) REFERENCES series(id) ON DELETE CASCADE
);

-- ---------------------------------------------------------------------------
-- Assistant earnings & notifications
-- ---------------------------------------------------------------------------

CREATE TABLE assistant_earnings (
  id           BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  assistant_id BIGINT UNSIGNED NOT NULL,
  task_id      BIGINT UNSIGNED NOT NULL,
  amount       DECIMAL(12,2) NOT NULL,
  currency     CHAR(3) NOT NULL DEFAULT 'JPY',
  paid_at      TIMESTAMP NULL,
  created_at   TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (assistant_id) REFERENCES users(id),
  FOREIGN KEY (task_id) REFERENCES artwork_tasks(id)
);

CREATE TABLE notifications (
  id                 BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  recipient_user_id  BIGINT UNSIGNED NULL,
  recipient_role     ENUM('MANGAKA','ASSISTANT','EDITOR','BOARD_MEMBER','ALL') NULL,
  title              VARCHAR(200) NOT NULL,
  message            TEXT NOT NULL,
  series_id          BIGINT UNSIGNED NULL,
  chapter_id         BIGINT UNSIGNED NULL,
  task_id            BIGINT UNSIGNED NULL,
  is_read            TINYINT(1) NOT NULL DEFAULT 0,
  created_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_notif_user (recipient_user_id, is_read)
);

CREATE TABLE activity_logs (
  id         BIGINT UNSIGNED PRIMARY KEY AUTO_INCREMENT,
  actor_id   BIGINT UNSIGNED NULL,
  event_type VARCHAR(60) NOT NULL,
  message    TEXT NOT NULL,
  meta_json  JSON NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);
