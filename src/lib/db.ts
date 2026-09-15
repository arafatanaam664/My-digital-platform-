/**
 * Data layer: Prisma-like API over either SQLite (node:sqlite, default local dev)
 * or Postgres (pg — Supabase/Neon in production).
 * The active driver is chosen from DATABASE_URL:
 *   - postgresql://... → Postgres
 *   - anything else    → SQLite (prisma/dev.db)
 * All call sites use prisma.<model>.<method> — swapping the database never
 * touches app code.
 */
import type { ContentItem, PageView, Section, Setting, Subsection, User } from './types';
import type { Driver, SqlValue, Stmt } from './drivers/types';
import { createSqliteDriver } from './drivers/sqlite';
import { createPgDriver } from './drivers/pg';

export function createDriver(): Driver {
  const url = process.env.DATABASE_URL || '';
  if (url.startsWith('postgres://') || url.startsWith('postgresql://')) return createPgDriver(url);
  return createSqliteDriver();
}

// ---------------- model metadata ----------------

type Cols = Record<string, string>;

interface ModelMeta {
  table: string;
  cols: Cols;
  dates: string[];
  bools: string[];
}

const MODELS: Record<string, ModelMeta> = {
  user: {
    table: 'users',
    cols: {
      id: 'id',
      email: 'email',
      name: 'name',
      passwordHash: 'password_hash',
      role: 'role',
      isActive: 'is_active',
      lastLoginAt: 'last_login_at',
      createdAt: 'created_at',
    },
    dates: ['lastLoginAt', 'createdAt'],
    bools: ['isActive'],
  },
  section: {
    table: 'sections',
    cols: {
      id: 'id',
      slug: 'slug',
      name: 'name',
      description: 'description',
      icon: 'icon',
      order: 'order',
      isActive: 'is_active',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
    dates: ['createdAt', 'updatedAt'],
    bools: ['isActive'],
  },
  subsection: {
    table: 'subsections',
    cols: {
      id: 'id',
      slug: 'slug',
      sectionId: 'section_id',
      name: 'name',
      description: 'description',
      type: 'type',
      order: 'order',
      isActive: 'is_active',
      createdAt: 'created_at',
    },
    dates: ['createdAt'],
    bools: ['isActive'],
  },
  contentItem: {
    table: 'content_items',
    cols: {
      id: 'id',
      slug: 'slug',
      type: 'type',
      title: 'title',
      excerpt: 'excerpt',
      body: 'body',
      toolKey: 'tool_key',
      sectionId: 'section_id',
      subsectionId: 'subsection_id',
      metaTitle: 'meta_title',
      metaDescription: 'meta_description',
      featuredImage: 'featured_image',
      tags: 'tags',
      status: 'status',
      publishedAt: 'published_at',
      views: 'views',
      order: 'order',
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
    dates: ['publishedAt', 'createdAt', 'updatedAt'],
    bools: [],
  },
  pageView: {
    table: 'page_views',
    cols: {
      id: 'id',
      contentId: 'content_id',
      path: 'path',
      sectionId: 'section_id',
      type: 'type',
      referrer: 'referrer',
      userAgent: 'user_agent',
      device: 'device',
      browser: 'browser',
      sessionId: 'session_id',
      createdAt: 'created_at',
    },
    dates: ['createdAt'],
    bools: [],
  },
  setting: {
    table: 'settings',
    cols: { key: 'key', value: 'value' },
    dates: [],
    bools: [],
  },
};

interface RelDef {
  model: string;
  fk: string; // column in TARGET table (reverse) or this table (forward)
  ref: string;
  camel: string; // camel key holding the fk value (forward)
}

const RELS: Record<string, { forward: Record<string, RelDef>; reverse: Record<string, RelDef> }> = {
  user: { forward: {}, reverse: {} },
  setting: { forward: {}, reverse: {} },
  section: {
    forward: {},
    reverse: {
      subsections: { model: 'subsection', fk: 'section_id', ref: 'id', camel: 'sectionId' },
      items: { model: 'contentItem', fk: 'section_id', ref: 'id', camel: 'sectionId' },
    },
  },
  subsection: {
    forward: { section: { model: 'section', fk: 'section_id', ref: 'id', camel: 'sectionId' } },
    reverse: { items: { model: 'contentItem', fk: 'subsection_id', ref: 'id', camel: 'subsectionId' } },
  },
  contentItem: {
    forward: {
      section: { model: 'section', fk: 'section_id', ref: 'id', camel: 'sectionId' },
      subsection: { model: 'subsection', fk: 'subsection_id', ref: 'id', camel: 'subsectionId' },
    },
    reverse: {},
  },
  pageView: {
    forward: { content: { model: 'contentItem', fk: 'content_id', ref: 'id', camel: 'contentId' } },
    reverse: {},
  },
};

// ---------------- SQL building (dialect-agnostic) ----------------

function buildWhere({ model, where }: { model: string; where?: Record<string, unknown> }, alias = ''): { sql: string; params: SqlValue[] } {
  if (!where) return { sql: '', params: [] };
  const meta = MODELS[model];
  const conds: string[] = [];
  const params: SqlValue[] = [];
  const t = alias ? `${alias}.` : '';

  for (const [key, value] of Object.entries(where as Record<string, unknown>)) {
    if (key === 'OR') {
      const ors = value as Array<Record<string, unknown>>;
      const orParts = ors.map((o) => buildWhere({ model, where: o }));
      conds.push(`(${orParts.map((p) => p.sql.replace(/^\s*WHERE\s+/, '')).filter(Boolean).join(' OR ')})`);
      for (const p of orParts) params.push(...p.params);
      continue;
    }
    if (key === 'AND') continue;

    // relation filter (e.g. { section: { isActive: true } }) → non-correlated IN subquery
    const rel = RELS[model]?.forward[key];
    if (rel && typeof value === 'object' && value !== null) {
      const inner = buildWhere({ model: rel.model, where: value as Record<string, unknown> });
      const fk = meta.cols[rel.camel];
      const innerCond = inner.sql.replace(/^\s*WHERE\s+/, '');
      conds.push(`${q(fk)} IN (SELECT ${q('id')} FROM ${MODELS[rel.model].table}${innerCond ? ' WHERE ' + innerCond : ''})`);
      params.push(...inner.params);
      continue;
    }

    const sqlCol = meta.cols[key];
    if (!sqlCol) continue;
    const qc = q(sqlCol); // quote identifier (order, key, ... are reserved words in PG)
    if (typeof value === 'object' && value !== null) {
      const ops = value as Record<string, unknown>;
      if ('contains' in ops) {
        conds.push(`${t}${qc} LIKE ?`);
        params.push(`%${ops.contains}%`);
      } else if ('gte' in ops) {
        conds.push(`${t}${qc} >= ?`);
        params.push(toSqlValue(ops.gte));
      } else if ('gt' in ops) {
        conds.push(`${t}${qc} > ?`);
        params.push(toSqlValue(ops.gt));
      } else if ('lte' in ops) {
        conds.push(`${t}${qc} <= ?`);
        params.push(toSqlValue(ops.lte));
      } else if ('not' in ops) {
        conds.push(`${t}${qc} != ?`);
        params.push(toSqlValue(ops.not));
      } else if ('in' in ops) {
        const arr = ops.in as unknown[];
        conds.push(`${t}${qc} IN (${arr.map(() => '?').join(',')})`);
        params.push(...arr.map(toSqlValue));
      }
    } else {
      conds.push(`${t}${qc} = ?`);
      params.push(toSqlValue(value));
    }
  }

  return { sql: conds.length ? ` WHERE ${conds.join(' AND ')}` : '', params };
}

function buildOrderBy(model: string, orderBy?: string | Record<string, string> | Array<Record<string, string>>): string {
  if (!orderBy) return '';
  const meta = MODELS[model];
  const entries = typeof orderBy === 'string' ? [{ [orderBy]: 'asc' }] : Array.isArray(orderBy) ? orderBy : [orderBy];
  const parts = entries.map((e) => {
    const [[cam, dir]] = Object.entries(e);
    const col = meta.cols[cam] || cam;
    return `"${col}" ${String(dir).toUpperCase() === 'DESC' ? 'DESC' : 'ASC'}`;
  });
  return parts.length ? ` ORDER BY ${parts.join(', ')}` : '';
}

function toSqlValue(v: unknown): SqlValue {
  if (v instanceof Date) return v.toISOString();
  if (typeof v === 'boolean') return v; // node:sqlite & pg both accept JS booleans
  if (v == null) return null;
  if (typeof v === 'number') return v;
  return String(v);
}

/** Quote an SQL identifier (safe for reserved words like "order" / "key"). */
function q(col: string): string {
  return `"${col}"`;
}

// ---------------- ORM factory ----------------

interface IncludeOpts {
  where?: Record<string, unknown>;
  orderBy?: string | Record<string, string> | Array<Record<string, string>>;
  take?: number;
  include?: Record<string, IncludeOpts | boolean>;
}

export function createOrm(driver: Driver) {
  const mapRowOut = (model: string, row: Record<string, unknown> | undefined): Record<string, unknown> | undefined => {
    if (!row) return undefined;
    const meta = MODELS[model];
    const out: Record<string, unknown> = {};
    for (const [cam, sqlCol] of Object.entries(meta.cols)) {
      let v = row[sqlCol];
      if (meta.dates.includes(cam) && typeof v === 'string' && v) v = new Date(v);
      if (meta.bools.includes(cam)) v = !!v;
      out[cam] = v;
    }
    return out;
  };

  const mapDataIn = (model: string, data: Record<string, unknown>): { cols: string[]; params: SqlValue[] } => {
    const meta = MODELS[model];
    const cols: string[] = [];
    const params: SqlValue[] = [];
    for (const [key, v] of Object.entries(data)) {
      if (v === undefined) continue;
      const sqlCol = meta.cols[key];
      if (!sqlCol) continue;
      cols.push(q(sqlCol));
      params.push(toSqlValue(v));
    }
    return { cols, params };
  };

  const resolveIncludes = (model: string, rows: Record<string, unknown>[], include?: Record<string, IncludeOpts | boolean>): Promise<void> =>
    (async () => {
      if (!include || rows.length === 0) return;

      for (const [key, rawOpts] of Object.entries(include)) {
        const opts = (rawOpts === true ? {} : rawOpts) as IncludeOpts;
        const fwd = RELS[model]?.forward[key];
        const rev = RELS[model]?.reverse[key];

        if (fwd) {
          const fkCamel = fwd.camel;
          const ids = [...new Set(rows.map((r) => r[fkCamel]).filter(Boolean))] as number[];
          if (ids.length) {
            const w = buildWhere({ model: fwd.model, where: opts.where });
            const sql = `SELECT * FROM ${MODELS[fwd.model].table}${w.sql}${w.sql ? ' AND ' : ' WHERE '}id IN (${ids.map(() => '?').join(',')})${buildOrderBy(fwd.model, opts.orderBy)}`;
            const rawTargets = await driver.prepare(sql).all(...w.params, ...ids);
            const mapped = rawTargets.map((t) => mapRowOut(fwd.model, t)!);
            await resolveIncludes(fwd.model, mapped, opts.include);
            const map = new Map(mapped.map((t) => [t.id as number, t]));
            for (const r of rows) {
              const id = r[fkCamel] as number;
              (r as Record<string, unknown>)[key] = map.get(id) ?? null;
            }
          } else {
            for (const r of rows) (r as Record<string, unknown>)[key] = null;
          }
        } else if (rev) {
          const ids = [...new Set(rows.map((r) => r.id).filter(Boolean))] as number[];
          if (ids.length) {
            const w = buildWhere({ model: rev.model, where: opts.where });
            const fkCol = rev.fk;
            const sql = `SELECT * FROM ${MODELS[rev.model].table}${w.sql}${w.sql ? ' AND ' : ' WHERE '}${fkCol} IN (${ids.map(() => '?').join(',')})${buildOrderBy(rev.model, opts.orderBy)}`;
            const rawTargets = await driver.prepare(sql).all(...w.params, ...ids);
            const mapped = rawTargets.map((t) => mapRowOut(rev.model, t)!);
            await resolveIncludes(rev.model, mapped, opts.include);
            const pairs = rawTargets.map((t, i) => [t[fkCol] as number, mapped[i]] as const);
            for (const r of rows) {
              const mine = pairs.filter(([fk]) => fk === r.id).map(([, m]) => m);
              (r as Record<string, unknown>)[key] = opts.take ? mine.slice(0, opts.take) : mine;
            }
          } else {
            for (const r of rows) (r as Record<string, unknown>)[key] = [];
          }
        } else {
          for (const r of rows) (r as Record<string, unknown>)[key] = undefined;
        }
      }
    })();

  function createModel(model: string) {
    const meta = MODELS[model];

    async function findMany(args?: { where?: Record<string, unknown>; orderBy?: string | Record<string, string> | Array<Record<string, string>>; take?: number; include?: Record<string, IncludeOpts | boolean>; select?: Record<string, boolean> }) {
      const w = buildWhere({ model, where: args?.where });
      const selectCols = args?.select ? Object.keys(args.select) : undefined;
      const sqlCols = selectCols ? selectCols.map((c) => q(meta.cols[c] || c)) : ['*'];
      const sql = `SELECT ${sqlCols.join(', ')} FROM ${meta.table}${w.sql}${buildOrderBy(model, args?.orderBy)}${args?.take != null ? ` LIMIT ${args.take}` : ''}`;
      let rows = await driver.prepare(sql).all(...w.params);
      if (selectCols) {
        rows = rows.map((r) => {
          const o: Record<string, unknown> = {};
          for (const c of selectCols) o[c] = r[meta.cols[c] || c];
          return o;
        });
      } else {
        rows = rows.map((r) => mapRowOut(model, r)!);
        await resolveIncludes(model, rows, args?.include);
      }
      return rows;
    }

    async function findUnique(args: { where: Record<string, unknown>; include?: Record<string, IncludeOpts | boolean> }) {
      const w = buildWhere({ model, where: args.where });
      const sql = `SELECT * FROM ${meta.table}${w.sql} LIMIT 1`;
      const row = await driver.prepare(sql).get(...w.params);
      if (!row) return null;
      const out = mapRowOut(model, row)!;
      await resolveIncludes(model, [out], args.include);
      return out;
    }

    async function create(args: { data: Record<string, unknown> }) {
      const { cols, params } = mapDataIn(model, args.data);
      const res = await driver
        .prepare(`INSERT INTO ${meta.table} (${cols.join(',')}) VALUES (${cols.map(() => '?').join(',')})`)
        .run(...params);
      if (model === 'setting') {
        const row = await driver.prepare(`SELECT * FROM ${meta.table} WHERE ${q('key')} = ?`).get(String(args.data.key));
        return mapRowOut(model, row) as Record<string, unknown>;
      }
      const row = await driver.prepare(`SELECT * FROM ${meta.table} WHERE ${q('id')} = ?`).get(Number(res.lastInsertRowid));
      return mapRowOut(model, row) as Record<string, unknown>;
    }

    async function update(args: { where: Record<string, unknown>; data: Record<string, unknown> }) {
      const sets: string[] = [];
      const params: SqlValue[] = [];
      for (const [key, v] of Object.entries(args.data)) {
        const sqlCol = meta.cols[key];
        if (!sqlCol || v === undefined) continue;
        if (v && typeof v === 'object' && !Array.isArray(v) && (typeof (v as { increment?: number }).increment === 'number' || typeof (v as { decrement?: number }).decrement === 'number')) {
          const inc = (v as { increment?: number }).increment ?? 0;
          const dec = (v as { decrement?: number }).decrement ?? 0;
          sets.push(`${q(sqlCol)} = ${q(sqlCol)} + ?`);
          params.push(inc - dec);
          continue;
        }
        sets.push(`${q(sqlCol)} = ?`);
        params.push(toSqlValue(v));
      }
      if (!sets.length) return findUnique({ where: args.where });
      const w = buildWhere({ model, where: args.where });
      await driver.prepare(`UPDATE ${meta.table} SET ${sets.join(', ')}${w.sql}`).run(...params, ...w.params);
      if (meta.cols.updatedAt && !(args.data as Record<string, unknown>).updatedAt) {
        await driver.prepare(`UPDATE ${meta.table} SET ${q('updated_at')} = ?${w.sql}`).run(new Date().toISOString(), ...w.params);
      }
      return findUnique({ where: args.where });
    }

    async function upsert(args: { where: Record<string, unknown>; update: Record<string, unknown>; create: Record<string, unknown> }) {
      const w = buildWhere({ model, where: args.where });
      const existing = await driver.prepare(`SELECT * FROM ${meta.table}${w.sql} LIMIT 1`).get(...w.params);
      if (existing) return update({ where: args.where, data: args.update });
      return create({ data: args.create });
    }

    async function del(args: { where: Record<string, unknown> }) {
      const w = buildWhere({ model, where: args.where });
      await driver.prepare(`DELETE FROM ${meta.table}${w.sql}`).run(...w.params);
      return {};
    }

    async function deleteMany(args?: { where?: Record<string, unknown> }) {
      const w = buildWhere({ model, where: args?.where });
      await driver.prepare(`DELETE FROM ${meta.table}${w.sql}`).run(...w.params);
      return {};
    }

    async function count(args?: { where?: Record<string, unknown> }) {
      const w = buildWhere({ model, where: args?.where });
      const row = (await driver.prepare(`SELECT COUNT(*) AS c FROM ${meta.table}${w.sql}`).get(...w.params)) as { c: number | string } | undefined;
      return Number(row?.c ?? 0);
    }

    async function groupBy(args: { by: string[]; where?: Record<string, unknown>; _count?: { _all: true }; orderBy?: Record<string, unknown>; take?: number }) {
      const w = buildWhere({ model, where: args.where });
      const cols = args.by.map((c) => q(meta.cols[c] || c));
      let order = 'ORDER BY c DESC';
      if (args.orderBy) {
        const [[k, dir]] = Object.entries(args.orderBy as Record<string, unknown>)[0] || [];
        if (k && typeof dir === 'object' && dir !== null) {
          const [[f, d]] = Object.entries(dir as Record<string, string>);
          order = `ORDER BY c ${String(d).toUpperCase() === 'ASC' ? 'ASC' : 'DESC'}`;
          void f;
        }
      }
      const rows = await driver
        .prepare(`SELECT ${cols.join(', ')}, COUNT(*) AS c FROM ${meta.table}${w.sql} GROUP BY ${cols.join(', ')} ${order}${args.take != null ? ` LIMIT ${args.take}` : ''}`)
        .all(...w.params);
      return rows.map((r) => {
        const out: Record<string, unknown> = {};
        for (const c of args.by) out[c] = r[meta.cols[c] || c];
        out._count = { _all: Number(r.c) };
        return out;
      });
    }

    return { findMany, findUnique, create, update, upsert, delete: del, deleteMany, count, groupBy };
  }

  const $queryRaw = async (strings: TemplateStringsArray, ...values: unknown[]) => {
    let sql = '';
    strings.forEach((s, i) => {
      sql += s;
      if (i < values.length) sql += '?';
    });
    const params: SqlValue[] = values.map((v) => toSqlValue(v));
    return driver.prepare(sql).all(...params);
  };

  const user = createModel('user') as unknown as ModelClient<User>;
  const section = createModel('section') as unknown as ModelClient<Section>;
  const subsection = createModel('subsection') as unknown as ModelClient<Subsection>;
  const contentItem = createModel('contentItem') as unknown as ModelClient<ContentItem>;
  const pageView = createModel('pageView') as unknown as ModelClient<PageView>;
  const setting = createModel('setting') as unknown as ModelClient<Setting>;

  return { user, section, subsection, contentItem, pageView, setting, $queryRaw };
}

// ---------------- typed public API ----------------

export interface ModelClient<T> {
  findMany(args?: {
    where?: Record<string, unknown>;
    orderBy?: string | Record<string, string> | Array<Record<string, string>>;
    take?: number;
    include?: Record<string, unknown>;
    select?: Record<string, boolean>;
  }): Promise<T[]>;
  findUnique(args: { where: Record<string, unknown>; include?: Record<string, unknown> }): Promise<T | null>;
  create(args: { data: Record<string, unknown> }): Promise<T>;
  update(args: { where: Record<string, unknown>; data: Record<string, unknown> }): Promise<T | null>;
  upsert(args: { where: Record<string, unknown>; update: Record<string, unknown>; create: Record<string, unknown> }): Promise<T | null>;
  delete(args: { where: Record<string, unknown> }): Promise<unknown>;
  deleteMany(args?: { where?: Record<string, unknown> }): Promise<unknown>;
  count(args?: { where?: Record<string, unknown> }): Promise<number>;
  groupBy(args: {
    by: string[];
    where?: Record<string, unknown>;
    _count?: { _all: true };
    orderBy?: Record<string, unknown>;
    take?: number;
  }): Promise<Array<T & { _count: { _all: number } }>>;
}

export const driver = createDriver();
export const prisma = createOrm(driver);

/** Dialect-aware expression for bucketing a timestamptz/iso column by day. */
export function dateExpr(col: string): string {
  return driver.kind === 'postgres' ? `${col}::date` : `date(${col})`;
}

/** Normalize a raw day value (string or Date) to YYYY-MM-DD. */
export function dayKey(v: unknown): string {
  if (v instanceof Date) return v.toISOString().slice(0, 10);
  return String(v).slice(0, 10);
}

export type { Stmt };
