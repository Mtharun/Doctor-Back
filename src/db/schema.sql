-- Relational schema for the dental clinic database.
-- SQLite (via Node's built-in node:sqlite module - no external DB server
-- needed for development). Swap this layer for Postgres/MySQL in
-- production if you need multi-writer concurrency at scale.

PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS users (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  name            TEXT NOT NULL,
  email           TEXT NOT NULL UNIQUE,
  password_hash   TEXT NOT NULL,
  role            TEXT NOT NULL CHECK (role IN ('patient','admin')) DEFAULT 'patient',
  phone           TEXT,
  age             INTEGER,
  medical_history TEXT,
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS dentists (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  name          TEXT NOT NULL,
  specialty     TEXT NOT NULL,
  bio           TEXT,
  photo_url     TEXT,
  working_days  TEXT NOT NULL DEFAULT '["Mon","Tue","Wed","Thu","Fri"]',
  start_time    TEXT NOT NULL DEFAULT '09:00',
  end_time      TEXT NOT NULL DEFAULT '17:00',
  slot_minutes  INTEGER NOT NULL DEFAULT 30,
  active        INTEGER NOT NULL DEFAULT 1,
  created_at    TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS services (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  name              TEXT NOT NULL,
  description       TEXT,
  duration_minutes  INTEGER NOT NULL DEFAULT 30,
  price             REAL,
  active            INTEGER NOT NULL DEFAULT 1,
  created_at        TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS appointments (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  patient_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  dentist_id  INTEGER NOT NULL REFERENCES dentists(id),
  service_id  INTEGER NOT NULL REFERENCES services(id),
  date        TEXT NOT NULL,
  time        TEXT NOT NULL,
  reason      TEXT,
  status      TEXT NOT NULL CHECK (status IN ('pending','confirmed','completed','cancelled','rejected')) DEFAULT 'pending',
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE (dentist_id, date, time)
);
CREATE INDEX IF NOT EXISTS idx_appointments_patient ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_date ON appointments(date);

CREATE TABLE IF NOT EXISTS emergency_requests (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  patient_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  phone       TEXT NOT NULL,
  location    TEXT NOT NULL,
  description TEXT NOT NULL,
  priority    TEXT NOT NULL CHECK (priority IN ('critical','high','medium')) DEFAULT 'high',
  status      TEXT NOT NULL CHECK (status IN ('pending','accepted','in_progress','resolved','cancelled')) DEFAULT 'pending',
  image_url   TEXT,
  created_at  TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_emergency_patient ON emergency_requests(patient_id);

CREATE TABLE IF NOT EXISTS reports (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  patient_id  INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  type        TEXT NOT NULL DEFAULT 'Report',
  doctor      TEXT,
  notes       TEXT,
  file_url    TEXT,
  date        TEXT NOT NULL DEFAULT (datetime('now')),
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_reports_patient ON reports(patient_id);

CREATE TABLE IF NOT EXISTS notifications (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id     INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message     TEXT NOT NULL,
  read        INTEGER NOT NULL DEFAULT 0,
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
