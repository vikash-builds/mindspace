require('dotenv').config();
const path = require('path');

function isTruthy(value, fallback = false) {
  if (value === undefined) {
    return fallback;
  }
  return ['1', 'true', 'yes', 'on'].includes(String(value).toLowerCase());
}

module.exports = {
  PORT: process.env.PORT || 3000,
  CLERK_PUBLISHABLE_KEY: process.env.CLERK_PUBLISHABLE_KEY || process.env.VITE_CLERK_PUBLISHABLE_KEY,
  CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
  ENABLE_CLERK_AUTH: isTruthy(process.env.ENABLE_CLERK_AUTH, true),
  DB_PATH: path.join(__dirname, 'mindspace.db'),
  UPLOAD_DIR: path.join(__dirname, 'storage/uploads'),
  CHAT_ATTACHMENT_DIR: path.join(__dirname, 'storage/chat_attachments'),
  PYTHON_RAG_URL: process.env.PYTHON_RAG_URL || 'http://127.0.0.1:5001',
  DEPLOYMENT_MODE: process.env.DEPLOYMENT_MODE || 'local',
  LLM_PROVIDER: process.env.LLM_PROVIDER || (process.env.DEPLOYMENT_MODE === 'hosted' ? 'gemini' : 'ollama'),
  EMBEDDING_PROVIDER: process.env.EMBEDDING_PROVIDER || (process.env.DEPLOYMENT_MODE === 'hosted' ? 'gemini' : 'local'),
  VECTOR_DB_PROVIDER: process.env.VECTOR_DB_PROVIDER || (process.env.DEPLOYMENT_MODE === 'hosted' ? 'pinecone' : 'faiss'),
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '',
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || '',
  GOOGLE_REDIRECT_URI: process.env.GOOGLE_REDIRECT_URI || '',
  SUPABASE_URL: process.env.SUPABASE_URL || '',
  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  SUPABASE_DB_URL: process.env.SUPABASE_DB_URL || '',
  SUPABASE_DOCUMENTS_BUCKET: process.env.SUPABASE_DOCUMENTS_BUCKET || 'documents',
  SUPABASE_CHAT_ATTACHMENTS_BUCKET: process.env.SUPABASE_CHAT_ATTACHMENTS_BUCKET || 'chat-attachments',
  EMAIL_CONFIG: {
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
};
