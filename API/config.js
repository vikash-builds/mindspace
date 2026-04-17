require('dotenv').config();
const path = require('path');

module.exports = {
  PORT: process.env.PORT || 3000,
  CLERK_PUBLISHABLE_KEY: process.env.VITE_CLERK_PUBLISHABLE_KEY,
  CLERK_SECRET_KEY: process.env.CLERK_SECRET_KEY,
  DB_PATH: path.join(__dirname, 'mindspace.db'),
  UPLOAD_DIR: path.join(__dirname, 'storage/uploads'),
  PYTHON_RAG_URL: process.env.PYTHON_RAG_URL || 'http://127.0.0.1:5001',
  EMAIL_CONFIG: {
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
};
