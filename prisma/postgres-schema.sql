-- Postgres DDL (Supabase / Neon / أي Postgres)
-- نفّذ هذا مرة واحدة في SQL Editor في Supabase، أو عبر: psql "$DATABASE_URL" -f prisma/postgres-schema.sql

CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'editor',
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS sections (
  id SERIAL PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT NOT NULL DEFAULT '📂',
  "order" INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS subsections (
  id SERIAL PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  section_id INTEGER NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL DEFAULT 'articles',
  "order" INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS content_items (
  id SERIAL PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  excerpt TEXT,
  body TEXT NOT NULL DEFAULT '',
  tool_key TEXT,
  section_id INTEGER NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
  subsection_id INTEGER NOT NULL REFERENCES subsections(id) ON DELETE CASCADE,
  meta_title TEXT,
  meta_description TEXT,
  featured_image TEXT,
  tags TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  published_at TIMESTAMPTZ,
  views INTEGER NOT NULL DEFAULT 0,
  "order" INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS page_views (
  id SERIAL PRIMARY KEY,
  content_id INTEGER REFERENCES content_items(id) ON DELETE CASCADE,
  path TEXT NOT NULL,
  section_id INTEGER,
  type TEXT NOT NULL DEFAULT 'other',
  referrer TEXT,
  user_agent TEXT,
  device TEXT,
  browser TEXT,
  session_id TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pv_created ON page_views(created_at);
CREATE INDEX IF NOT EXISTS idx_pv_path ON page_views(path);
CREATE INDEX IF NOT EXISTS idx_pv_content ON page_views(content_id);
CREATE INDEX IF NOT EXISTS idx_pv_session ON page_views(session_id);
CREATE INDEX IF NOT EXISTS idx_ci_section ON content_items(section_id);
CREATE INDEX IF NOT EXISTS idx_ci_subsection ON content_items(subsection_id);

CREATE TABLE IF NOT EXISTS settings (
  key TEXT PRIMARY KEY,
  value TEXT
);
