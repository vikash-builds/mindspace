const { Pool } = require('pg');

const config = require('./config');

const pool = config.SUPABASE_DB_URL
  ? new Pool({
      connectionString: config.SUPABASE_DB_URL,
      ssl: { rejectUnauthorized: false },
    })
  : null;

const createTablesSql = `
  CREATE TABLE IF NOT EXISTS profiles (
    user_id TEXT PRIMARY KEY,
    email TEXT NOT NULL DEFAULT '',
    name TEXT NOT NULL,
    profession TEXT NOT NULL,
    chunk_size INTEGER DEFAULT 500,
    chunk_overlap INTEGER DEFAULT 100,
    top_k INTEGER DEFAULT 5,
    temperature REAL DEFAULT 0.7,
    similarity_threshold REAL DEFAULT 0.5,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS documents (
    id BIGSERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    filename TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_path TEXT NOT NULL,
    mime_type TEXT,
    storage_bucket TEXT,
    storage_object_path TEXT,
    chunk_count INTEGER DEFAULT 0,
    category TEXT,
    status TEXT DEFAULT 'pending',
    source_type TEXT DEFAULT 'local',
    source_name TEXT,
    external_id TEXT,
    external_url TEXT,
    sync_status TEXT DEFAULT 'local-only',
    last_synced_at TIMESTAMPTZ,
    action_candidates JSONB,
    error_message TEXT,
    uploaded_at TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS reminders (
    id BIGSERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    remind_at TIMESTAMPTZ NOT NULL,
    recurrence TEXT,
    status TEXT DEFAULT 'pending',
    priority TEXT DEFAULT 'medium',
    category TEXT DEFAULT 'general',
    notes TEXT,
    source_document_id BIGINT,
    source_message_id BIGINT,
    email_notify BOOLEAN DEFAULT FALSE,
    delivered_at TIMESTAMPTZ,
    acknowledged_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS checklists (
    id BIGSERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'active',
    due_date TIMESTAMPTZ,
    source_document_id BIGINT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS checklist_items (
    id BIGSERIAL PRIMARY KEY,
    checklist_id BIGINT NOT NULL REFERENCES checklists(id) ON DELETE CASCADE,
    item_text TEXT NOT NULL,
    is_done BOOLEAN DEFAULT FALSE,
    priority TEXT DEFAULT 'medium',
    due_date TIMESTAMPTZ,
    position INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS chats (
    id BIGSERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS chat_history (
    id BIGSERIAL PRIMARY KEY,
    chat_id BIGINT REFERENCES chats(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    attachments JSONB,
    source_chunks JSONB,
    is_pinned BOOLEAN DEFAULT FALSE,
    pinned_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
  );

  CREATE TABLE IF NOT EXISTS integration_accounts (
    id BIGSERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    provider TEXT NOT NULL,
    email TEXT,
    scopes JSONB DEFAULT '[]'::jsonb,
    tokens JSONB NOT NULL,
    connected_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, provider)
  );

  CREATE TABLE IF NOT EXISTS mail_drafts (
    id BIGSERIAL PRIMARY KEY,
    user_id TEXT NOT NULL,
    provider TEXT NOT NULL DEFAULT 'gmail',
    external_draft_id TEXT,
    recipient TEXT NOT NULL,
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    status TEXT DEFAULT 'draft',
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
  );

  ALTER TABLE reminders ADD COLUMN IF NOT EXISTS delivered_at TIMESTAMPTZ;
  ALTER TABLE reminders ADD COLUMN IF NOT EXISTS acknowledged_at TIMESTAMPTZ;
`;

async function initDatabase() {
  if (!pool) {
    throw new Error('SUPABASE_DB_URL is required for hosted persistence');
  }
  await pool.query(createTablesSql);
}

async function query(text, params = []) {
  if (!pool) {
    throw new Error('Database pool is not configured');
  }
  return pool.query(text, params);
}

async function withTransaction(callback) {
  if (!pool) {
    throw new Error('Database pool is not configured');
  }
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

module.exports = {
  initDatabase,
  query,
  withTransaction,
  pool,
};
