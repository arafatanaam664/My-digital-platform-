import { Pool } from 'pg';
import path from 'path';
import fs from 'fs';
import type { Driver, SqlValue, Stmt } from './types';

interface Queryable {
  query(text: string, values?: unknown[]): Promise<{ rows: Record<string, unknown>[]; rowCount: number | null }>;
}

/**
 * Create a Postgres driver. Accepts a connection string, or any object with a
 * compatible `query` method (e.g. a pg-mem adapter for tests).
 */
export function createPgDriver(connectionString: string | Queryable, opts?: { autoDdl?: boolean }): Driver {
  const pool: Queryable =
    typeof connectionString === 'string'
      ? new Pool({ connectionString, max: 10, ssl: process.env.PGSSL === '1' ? { rejectUnauthorized: false } : undefined })
      : connectionString;
  const autoDdl = opts?.autoDdl ?? true;

  let ddlPromise: Promise<void> | null = null;
  const ddl = () => {
    if (!autoDdl) return Promise.resolve();
    if (!ddlPromise) {
      ddlPromise = (async () => {
        const sql = await fs.promises.readFile(path.join(process.cwd(), 'prisma', 'postgres-schema.sql'), 'utf8');
        await pool.query(sql);
      })();
    }
    return ddlPromise;
  };

  // Convert `?` placeholders (ORM dialect) to $1,$2,... for Postgres.
  // The platform never uses '?' inside string literals, so a global replace is safe.
  function convert(sql: string): string {
    let n = 0;
    return sql.replace(/\?/g, () => `$${++n}`);
  }

  return {
    kind: 'postgres',
    async exec(sql: string) {
      await ddl();
      await pool.query(sql);
    },
    prepare(sql: string): Stmt {
      const converted = convert(sql);
      return {
        async all(...params: SqlValue[]) {
          await ddl();
          const r = await pool.query(converted, params);
          return r.rows;
        },
        async get(...params: SqlValue[]) {
          await ddl();
          const r = await pool.query(converted, params);
          return r.rows[0];
        },
        async run(...params: SqlValue[]) {
          await ddl();
          let q = converted;
          const isInsert = /^\s*INSERT/i.test(q);
          // only tables with a SERIAL id (settings has none)
          const table = q.match(/^\s*INSERT\s+INTO\s+"?(\w+)"?/i)?.[1] ?? '';
          const hasId = table !== 'settings';
          if (isInsert && hasId) q = `${q.replace(/\s+$/, '')} RETURNING id`;
          const r = await pool.query(q, params);
          return {
            changes: r.rowCount ?? 0,
            lastInsertRowid: isInsert && hasId && r.rows[0] ? (r.rows[0].id as number) : 0,
          };
        },
      };
    },
  };
}
