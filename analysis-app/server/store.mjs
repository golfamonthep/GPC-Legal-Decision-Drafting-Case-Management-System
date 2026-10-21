import { DatabaseSync } from 'node:sqlite';
import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { randomUUID } from 'node:crypto';

export function openStore(dir) {
  mkdirSync(dir,{recursive:true});
  const db = new DatabaseSync(path.join(dir,'analysis.sqlite3'));
  db.exec(`PRAGMA journal_mode=WAL; PRAGMA foreign_keys=ON;
  CREATE TABLE IF NOT EXISTS jobs(id TEXT PRIMARY KEY, title TEXT NOT NULL, version INTEGER NOT NULL, data TEXT NOT NULL, created_at TEXT NOT NULL, updated_at TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS documents(id TEXT PRIMARY KEY,job_id TEXT NOT NULL REFERENCES jobs(id),name TEXT NOT NULL,mime TEXT NOT NULL,sha256 TEXT NOT NULL,bytes BLOB NOT NULL,data TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS revisions(id TEXT PRIMARY KEY,job_id TEXT NOT NULL REFERENCES jobs(id),created_at TEXT NOT NULL,data TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS runs(id TEXT PRIMARY KEY,job_id TEXT NOT NULL REFERENCES jobs(id),created_at TEXT NOT NULL,data TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS proposals(id TEXT PRIMARY KEY,job_id TEXT NOT NULL REFERENCES jobs(id),created_at TEXT NOT NULL,data TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS exports(id TEXT PRIMARY KEY,job_id TEXT NOT NULL REFERENCES jobs(id),revision_id TEXT NOT NULL REFERENCES revisions(id),created_at TEXT NOT NULL,sha256 TEXT NOT NULL,data TEXT NOT NULL);
  CREATE TABLE IF NOT EXISTS events(id TEXT PRIMARY KEY,job_id TEXT,created_at TEXT NOT NULL,kind TEXT NOT NULL,data TEXT NOT NULL);`);
  const now=()=>new Date().toISOString();
  return {db,dir,job(id){const j=db.prepare('SELECT * FROM jobs WHERE id=?').get(id); if(!j)throw Object.assign(new Error('ไม่พบงานวิเคราะห์'),{status:404});return {...j,data:JSON.parse(j.data)};},event(job,kind,data){db.prepare('INSERT INTO events VALUES(?,?,?,?,?)').run(randomUUID(),job,now(),kind,JSON.stringify(data));}, now};
}
