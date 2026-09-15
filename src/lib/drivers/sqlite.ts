import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import fs from 'fs';
import type { Driver, SqlValue, Stmt } from './types';

export function createSqliteDriver(dbPath?: string): Driver {
  const p = dbPath ?? path.join(process.cwd(), 'prisma', 'dev.db');
  fs.mkdirSync(path.dirname(p), { recursive: true });
  const db = new DatabaseSync(p);
  db.exec('PRAGMA journal_mode = WAL');
  db.exec('PRAGMA foreign_keys = ON');

  const ddl = fs.readFileSync(path.join(process.cwd(), 'prisma', 'schema.sql'), 'utf8');
  db.exec(ddl);

  // booleans → 1/0 (node:sqlite accepts both; its @types here omit boolean)
  const prep = (params: SqlValue[]): Array<null | number | string> =>
    params.map((v) => (typeof v === 'boolean' ? (v ? 1 : 0) : v)) as Array<null | number | string>;

  return {
    kind: 'sqlite',
    exec(sql) {
      db.exec(sql);
      return Promise.resolve();
    },
    prepare(sql: string): Stmt {
      const stmt = db.prepare(sql);
      return {
        all(...params: SqlValue[]) {
          return Promise.resolve(stmt.all(...prep(params)) as Record<string, unknown>[]);
        },
        get(...params: SqlValue[]) {
          return Promise.resolve((stmt.get(...prep(params)) ?? undefined) as Record<string, unknown> | undefined);
        },
        run(...params: SqlValue[]) {
          const r = stmt.run(...prep(params));
          return Promise.resolve({ changes: Number(r.changes), lastInsertRowid: Number(r.lastInsertRowid) });
        },
      };
    },
    close() {
      try {
        db.close();
      } catch {
        /* ignore */
      }
    },
  };
}
