/**
 * SQLite history store. Owns `data/test-suite.db` next to this app —
 * every check result is recorded here, so history survives restarts.
 * Uses Node's built-in node:sqlite (no native builds, no dependencies).
 */
import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { resolve, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const DATA_DIR = join(ROOT, "data");
mkdirSync(DATA_DIR, { recursive: true });

const db = new DatabaseSync(join(DATA_DIR, "test-suite.db"));

db.exec(`
  PRAGMA journal_mode = WAL;
  CREATE TABLE IF NOT EXISTS runs (
    id        INTEGER PRIMARY KEY AUTOINCREMENT,
    check_id  TEXT NOT NULL,
    state     TEXT NOT NULL,
    ms        INTEGER,
    out       TEXT,
    evidence  TEXT,
    at        TEXT NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_runs_check ON runs(check_id, id DESC);
  CREATE INDEX IF NOT EXISTS idx_runs_at ON runs(at DESC);
`);

const insert = db.prepare(
  `INSERT INTO runs (check_id, state, ms, out, evidence, at) VALUES (?, ?, ?, ?, ?, ?)`,
);

export function recordRun(r) {
  insert.run(
    r.id,
    r.state,
    r.ms ?? null,
    (r.out ?? "").slice(0, 20000),
    JSON.stringify(r.evidence ?? []),
    new Date(r.at ?? Date.now()).toISOString(),
  );
}

export function latestPerCheck() {
  const rows = db
    .prepare(
      `SELECT r.check_id, r.state, r.ms, r.out, r.evidence, r.at
       FROM runs r
       JOIN (SELECT check_id, MAX(id) AS mid FROM runs GROUP BY check_id) m
         ON m.check_id = r.check_id AND m.mid = r.id`,
    )
    .all();
  return rows.map((r) => ({
    id: r.check_id,
    state: r.state,
    ms: r.ms,
    out: r.out,
    evidence: safeJson(r.evidence),
    at: Date.parse(r.at),
  }));
}

export function historyFor(checkId, limit = 10) {
  const rows = db
    .prepare(
      `SELECT state, ms, at FROM runs WHERE check_id = ? ORDER BY id DESC LIMIT ?`,
    )
    .all(checkId, Math.min(Number(limit) || 10, 100));
  return rows.map((r) => ({ state: r.state, ms: r.ms, at: Date.parse(r.at) }));
}

export function stats() {
  const row = db
    .prepare(
      `SELECT COUNT(*) AS total,
              SUM(CASE WHEN state = 'pass' THEN 1 ELSE 0 END) AS pass,
              SUM(CASE WHEN state = 'fail' THEN 1 ELSE 0 END) AS fail,
              MAX(at) AS lastAt
       FROM runs`,
    )
    .get();
  return {
    total: row.total ?? 0,
    pass: row.pass ?? 0,
    fail: row.fail ?? 0,
    lastAt: row.lastAt ? Date.parse(row.lastAt) : null,
  };
}

function safeJson(s) {
  try {
    const v = JSON.parse(s ?? "[]");
    return Array.isArray(v) ? v : [];
  } catch {
    return [];
  }
}
