import sqlite3 from 'sqlite3';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '../../data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const DB_PATH = path.join(DATA_DIR, 'law.db');
export const db = new sqlite3.Database(DB_PATH);

// Promise wrappers
export const run = (sql, params = []) =>
  new Promise((res, rej) =>
    db.run(sql, params, function (err) {
      err ? rej(err) : res({ id: this.lastID, changes: this.changes });
    })
  );

export const get = (sql, params = []) =>
  new Promise((res, rej) =>
    db.get(sql, params, (err, row) => (err ? rej(err) : res(row)))
  );

export const all = (sql, params = []) =>
  new Promise((res, rej) =>
    db.all(sql, params, (err, rows) => (err ? rej(err) : res(rows)))
  );

// Default laws from UAE Federal Decree-Law No. 26 of 2025
const DEFAULT_LAWS = [
  { id: 'LAW-001', name: 'Under 13 — Full Block', cond: 'age_lt', threshold: 13, action: 'BLOCK', ref: 'UAE Decree-Law 26/2025 · Art. 4' },
  { id: 'LAW-002', name: 'Under 13 — Generative AI Banned', cond: 'age_lt', threshold: 13, action: 'BLOCK', ref: 'UAE Decree-Law 26/2025 · Art. 9' },
  { id: 'LAW-003', name: 'Under 13 — Gambling & Betting Blocked', cond: 'age_lt', threshold: 13, action: 'BLOCK', ref: 'UAE Decree-Law 26/2025 · Art. 5' },
  { id: 'LAW-004', name: 'Under 16 — Guardian Consent for Social & Gaming', cond: 'age_lt', threshold: 16, action: 'REQUIRE_CONSENT', ref: 'UAE Decree-Law 26/2025 · Art. 6' },
  { id: 'LAW-005', name: 'Under 18 — Guardian Consent for All Restricted Services', cond: 'age_lt', threshold: 18, action: 'REQUIRE_CONSENT', ref: 'UAE Decree-Law 26/2025 · Art. 7' },
  { id: 'LAW-006', name: '18 and Above — Standard Access Permitted', cond: 'age_gte', threshold: 18, action: 'ALLOW', ref: 'UAE Decree-Law 26/2025 · Art. 8' },
  { id: 'LAW-007', name: 'High-Risk Services — Must be 21+', cond: 'high_risk_age_gte', threshold: 21, action: 'ALLOW', ref: 'UAE Decree-Law 26/2025 · Art. 10' },
];

export async function initDb() {
  await run(`
    CREATE TABLE IF NOT EXISTS laws (
      id        TEXT PRIMARY KEY,
      name      TEXT NOT NULL,
      cond      TEXT NOT NULL,
      threshold INTEGER NOT NULL,
      action    TEXT NOT NULL,
      active    INTEGER DEFAULT 1,
      version   TEXT DEFAULT 'v1.0',
      added     TEXT,
      ref       TEXT
    )
  `);

  await run(`
    CREATE TABLE IF NOT EXISTS audit_logs (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      type       TEXT NOT NULL,
      eid        TEXT,
      decision   TEXT,
      age        INTEGER,
      svc        TEXT,
      face_score REAL,
      triggered  TEXT,
      hash       TEXT,
      prev_hash  TEXT,
      detail     TEXT,
      timestamp  TEXT NOT NULL
    )
  `);

  // Seed laws on first run
  const { n } = await get(`SELECT COUNT(*) AS n FROM laws`);
  if (n === 0) {
    const today = new Date().toISOString().split('T')[0];
    for (const law of DEFAULT_LAWS) {
      await run(
        `INSERT INTO laws (id, name, cond, threshold, action, active, version, added, ref)
         VALUES (?, ?, ?, ?, ?, 1, 'v1.0', ?, ?)`,
        [law.id, law.name, law.cond, law.threshold, law.action, today, law.ref]
      );
    }
  }
}
