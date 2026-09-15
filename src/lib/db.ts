/**
 * Lightweight data layer (better-sqlite3) exposing a Prisma-like API for the
 * subset used by this platform. Swappable with Prisma later by replacing
 * this file only (call sites already use prisma.<model>.<method> style).
 */
import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import fs from 'fs';
import type { ContentItem, PageView, Section, Setting, Subsection, User } from './types';

// ---------------- schema ----------------
// The SQL DDL lives in prisma/schema.sql so the app (this file) and the seed
// script share one source of truth.

const SCHEMA = fs.readFileSync(path.join(process.cwd(), 'prisma', 'schema.sql'), 'utf8');

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
  fk: string; // column in THIS table (forward) or in TARGET table (reverse), SQL name
  ref: string; // column in target (forward) / this table (reverse)
  camel: string; // camel key on the row holding the fk value (forward)
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

// ---------------- connection ----------------

const dbPath = path.join(process.cwd(), 'prisma', 'dev.db');
fs.mkdirSync(path.dirname(dbPath), { recursive: true });
const db = new DatabaseSync(dbPath);
db.exec('PRAGMA journal_mode = WAL');
db.exec('PRAGMA foreign_keys = ON');
db.exec(SCHEMA);

// ---------------- helpers ----------------

type SqlValue = string | number | null;

function toSqlValue(v: unknown): SqlValue {
  if (v instanceof Date) return v.toISOString();
  if (typeof v === 'boolean') return v ? 1 : 0;
  if (v == null) return null;
  if (typeof v === 'number') return v;
  return String(v);
}

function mapRowOut(model: string, row: Record<string, unknown> | undefined): Record<string, unknown> | undefined {
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
}

function mapDataIn(model: string, data: Record<string, unknown>): { cols: string[]; params: SqlValue[] } {
  const meta = MODELS[model];
  const cols: string[] = [];
  const params: SqlValue[] = [];
  for (const [key, v] of Object.entries(data)) {
    if (v === undefined) continue;
    const sqlCol = meta.cols[key];
    if (!sqlCol) continue;
    cols.push(sqlCol);
    params.push(toSqlValue(v));
  }
  return { cols, params };
}

interface WhereArgs {
  model: string;
  where?: Record<string, unknown>;
}

function buildWhere({ model, where }: WhereArgs, alias = ''): { sql: string; params: SqlValue[] } {
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

    // relation filter (e.g. { section: { isActive: true } })
    const rel = RELS[model]?.forward[key];
    if (rel && typeof value === 'object' && value !== null) {
      const inner = buildWhere({ model: rel.model, where: value as Record<string, unknown> }, 'r');
      const fk = meta.cols[rel.camel];
      const innerCond = inner.sql.replace(/^\s*WHERE\s+/, '');
      conds.push(`EXISTS (SELECT 1 FROM ${MODELS[rel.model].table} r WHERE r.id = ${t}${fk}${innerCond ? ' AND ' + innerCond : ''})`);
      params.push(...inner.params);
      continue;
    }

    const sqlCol = meta.cols[key];
    if (!sqlCol) continue;
    if (typeof value === 'object' && value !== null) {
      const ops = value as Record<string, unknown>;
      if ('contains' in ops) {
        conds.push(`${t}${sqlCol} LIKE ?`);
        params.push(`%${ops.contains}%`);
      } else if ('gte' in ops) {
        conds.push(`${t}${sqlCol} >= ?`);
        params.push(toSqlValue(ops.gte));
      } else if ('gt' in ops) {
        conds.push(`${t}${sqlCol} > ?`);
        params.push(toSqlValue(ops.gt));
      } else if ('lte' in ops) {
        conds.push(`${t}${sqlCol} <= ?`);
        params.push(toSqlValue(ops.lte));
      } else if ('not' in ops) {
        conds.push(`${t}${sqlCol} != ?`);
        params.push(toSqlValue(ops.not));
      } else if ('in' in ops) {
        const arr = ops.in as unknown[];
        conds.push(`${t}${sqlCol} IN (${arr.map(() => '?').join(',')})`);
        params.push(...arr.map(toSqlValue));
      }
    } else {
      conds.push(`${t}${sqlCol} = ?`);
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

// ---------------- includes ----------------

interface IncludeOpts {
  where?: Record<string, unknown>;
  orderBy?: string | Record<string, string> | Array<Record<string, string>>;
  take?: number;
  include?: Record<string, IncludeOpts | boolean>;
}

function resolveIncludes(model: string, rows: Record<string, unknown>[], include?: Record<string, IncludeOpts | boolean>) {
  if (!include || rows.length === 0) return rows;
  const meta = MODELS[model];

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
        const rawTargets = db.prepare(sql).all(...w.params, ...ids) as Record<string, unknown>[];
        const mapped = rawTargets.map((t) => mapRowOut(fwd.model, t)!);
        if (opts.include) resolveIncludes(fwd.model, mapped, opts.include);
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
        const rawTargets = db.prepare(sql).all(...w.params, ...ids) as Record<string, unknown>[];
        const mapped = rawTargets.map((t) => mapRowOut(rev.model, t)!);
        if (opts.include) resolveIncludes(rev.model, mapped, opts.include);
        // pair raw fk values with their mapped rows (order preserved)
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
    void meta;
  }
  return rows;
}

// ---------------- model client ----------------

function createModel(model: string) {
  const meta = MODELS[model];

  function findMany(args?: { where?: Record<string, unknown>; orderBy?: string | Record<string, string> | Array<Record<string, string>>; take?: number; include?: Record<string, IncludeOpts | boolean>; select?: Record<string, boolean> }) {
    const w = buildWhere({ model, where: args?.where });
    const selectCols = args?.select ? Object.keys(args.select) : undefined;
    const sqlCols = selectCols ? selectCols.map((c) => meta.cols[c] || c) : ['*'];
    const sql = `SELECT ${sqlCols.join(', ')} FROM ${meta.table}${w.sql}${buildOrderBy(model, args?.orderBy)}${args?.take != null ? ` LIMIT ${args.take}` : ''}`;
    let rows = db.prepare(sql).all(...w.params) as Record<string, unknown>[];
    if (selectCols) {
      rows = rows.map((r) => {
        const o: Record<string, unknown> = {};
        for (const c of selectCols) o[c] = r[meta.cols[c] || c];
        return o;
      });
    } else {
      rows = rows.map((r) => mapRowOut(model, r)!) ;
      if (args?.include) resolveIncludes(model, rows, args.include);
    }
    return Promise.resolve(rows);
  }

  function findUnique(args: { where: Record<string, unknown>; include?: Record<string, IncludeOpts | boolean> }) {
    const w = buildWhere({ model, where: args.where });
    const sql = `SELECT * FROM ${meta.table}${w.sql} LIMIT 1`;
    const row = db.prepare(sql).get(...w.params) as Record<string, unknown> | undefined;
    if (!row) return Promise.resolve(null);
    const out = mapRowOut(model, row)!;
    if (args.include) resolveIncludes(model, [out], args.include);
    return Promise.resolve(out);
  }

  function create(args: { data: Record<string, unknown> }) {
    if (model === 'setting') {
      const { cols, params } = mapDataIn(model, args.data);
      // key is the PK
      db.prepare(`INSERT INTO ${meta.table} (${cols.join(',')}) VALUES (${cols.map(() => '?').join(',')})`).run(...params);
      const row = db.prepare(`SELECT * FROM ${meta.table} WHERE key = ?`).get(String(args.data.key)) as Record<string, unknown>;
      return Promise.resolve(mapRowOut(model, row));
    }
    const { cols, params } = mapDataIn(model, args.data);
    const res = db.prepare(`INSERT INTO ${meta.table} (${cols.join(',')}) VALUES (${cols.map(() => '?').join(',')})`).run(...params);
    const row = db.prepare(`SELECT * FROM ${meta.table} WHERE id = ?`).get(res.lastInsertRowid) as Record<string, unknown>;
    return Promise.resolve(mapRowOut(model, row));
  }

  function update(args: { where: Record<string, unknown>; data: Record<string, unknown> }) {
    const sets: string[] = [];
    const params: SqlValue[] = [];
    for (const [key, v] of Object.entries(args.data)) {
      const sqlCol = meta.cols[key];
      if (!sqlCol || v === undefined) continue;
      // Prisma-style numeric ops: { increment: n } / { decrement: n }
      if (v && typeof v === 'object' && !Array.isArray(v) && (typeof (v as { increment?: number }).increment === 'number' || typeof (v as { decrement?: number }).decrement === 'number')) {
        const inc = (v as { increment?: number }).increment ?? 0;
        const dec = (v as { decrement?: number }).decrement ?? 0;
        sets.push(`${sqlCol} = ${sqlCol} + ?`);
        params.push(inc - dec);
        continue;
      }
      sets.push(`${sqlCol} = ?`);
      params.push(toSqlValue(v));
    }
    if (!sets.length) return Promise.resolve(findUnique({ where: args.where }));
    const w = buildWhere({ model, where: args.where });
    db.prepare(`UPDATE ${meta.table} SET ${sets.join(', ')}${w.sql}`).run(...params, ...w.params);
    if (meta.cols.updatedAt && !(args.data as Record<string, unknown>).updatedAt) {
      db.prepare(`UPDATE ${meta.table} SET updated_at = ?${w.sql}`).run(new Date().toISOString(), ...w.params);
    }
    return findUnique({ where: args.where });
  }

  function upsert(args: { where: Record<string, unknown>; update: Record<string, unknown>; create: Record<string, unknown> }) {
    const existing = (db.prepare(`SELECT * FROM ${meta.table}${buildWhere({ model, where: args.where }).sql}`).all(...buildWhere({ model, where: args.where }).params) as Record<string, unknown>[])?.[0];
    if (existing) return update({ where: args.where, data: args.update });
    return create({ data: args.create });
  }

  function del(args: { where: Record<string, unknown> }) {
    const w = buildWhere({ model, where: args.where });
    db.prepare(`DELETE FROM ${meta.table}${w.sql}`).run(...w.params);
    return Promise.resolve({});
  }

  function count(args?: { where?: Record<string, unknown> }) {
    const w = buildWhere({ model, where: args?.where });
    const row = db.prepare(`SELECT COUNT(*) AS c FROM ${meta.table}${w.sql}`).get(...w.params) as { c: number };
    return Promise.resolve(row.c);
  }

  function groupBy(args: { by: string[]; where?: Record<string, unknown>; _count?: { _all: true }; orderBy?: Record<string, unknown>; take?: number }) {
    const w = buildWhere({ model, where: args.where });
    const cols = args.by.map((c) => meta.cols[c] || c);
    let order = 'ORDER BY c DESC';
    if (args.orderBy) {
      const [[k, dir]] = Object.entries(args.orderBy as Record<string, unknown>)[0] || [];
      if (k && typeof dir === 'object' && dir !== null) {
        const [[f, d]] = Object.entries(dir as Record<string, string>);
        order = `ORDER BY c ${String(d).toUpperCase() === 'ASC' ? 'ASC' : 'DESC'}`;
        void f;
      }
    }
    const rows = db
      .prepare(`SELECT ${cols.join(', ')}, COUNT(*) AS c FROM ${meta.table}${w.sql} GROUP BY ${cols.join(', ')} ${order}${args.take != null ? ` LIMIT ${args.take}` : ''}`)
      .all(...w.params) as Record<string, unknown>[];
    return Promise.resolve(
      rows.map((r) => {
        const out: Record<string, unknown> = {};
        for (const c of args.by) out[c] = r[meta.cols[c] || c];
        out._count = { _all: Number(r.c) };
        return out;
      })
    );
  }

  return { findMany, findUnique, create, update, upsert, delete: del, count, groupBy };
}

const $queryRaw = (strings: TemplateStringsArray, ...values: unknown[]) => {
  let sql = '';
  strings.forEach((s, i) => {
    sql += s;
    if (i < values.length) sql += '?';
  });
  const params: SqlValue[] = values.map((v) => toSqlValue(v));
  return Promise.resolve(db.prepare(sql).all(...params) as Record<string, unknown>[]);
};

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
  count(args?: { where?: Record<string, unknown> }): Promise<number>;
  groupBy(args: {
    by: string[];
    where?: Record<string, unknown>;
    _count?: { _all: true };
    orderBy?: Record<string, unknown>;
    take?: number;
  }): Promise<Array<T & { _count: { _all: number } }>>;
}

const user = createModel('user') as unknown as ModelClient<User>;
const section = createModel('section') as unknown as ModelClient<Section>;
const subsection = createModel('subsection') as unknown as ModelClient<Subsection>;
const contentItem = createModel('contentItem') as unknown as ModelClient<ContentItem>;
const pageView = createModel('pageView') as unknown as ModelClient<PageView>;
const setting = createModel('setting') as unknown as ModelClient<Setting>;

export const prisma = { user, section, subsection, contentItem, pageView, setting, $queryRaw };
