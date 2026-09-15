export type SqlValue = string | number | boolean | null;

export interface Stmt {
  all(...params: SqlValue[]): Promise<Record<string, unknown>[]>;
  get(...params: SqlValue[]): Promise<Record<string, unknown> | undefined>;
  run(...params: SqlValue[]): Promise<{ changes: number; lastInsertRowid: number | bigint }>;
}

export interface Driver {
  kind: 'sqlite' | 'postgres';
  exec(sql: string): Promise<void>;
  prepare(sql: string): Stmt;
  close?(): void;
}
