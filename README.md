# MindSpace

MindSpace is an AI-powered knowledge and execution workspace that brings together:
- grounded document chat
- reminders, tasks, and checklists
- Google Drive import
- Gmail preview and draft workflows
- hosted semantic retrieval
- image understanding

It is designed to help users move from information to action, not just ask questions.

For demo prep and hosted rollout, see [DEMO_DEPLOYMENT_PLAYBOOK.md](/Users/gmx/Documents/mindspace/DEMO_DEPLOYMENT_PLAYBOOK.md:1).

## What It Does

MindSpace lets users:
- upload and manage documents in a personal knowledge base
- import files from Google Drive
- preview Gmail inbox messages
- create Gmail drafts from inside the app
- ask source-grounded questions across imported content
- view citations and source snippets behind answers
- create, edit, snooze, complete, and delete reminders through chat
- manage tasks and checklists
- extract action items from imported documents and emails
- receive in-app, browser, and optional email reminder notifications
- work with images using OCR plus Gemini vision support

## Current Architecture

MindSpace is a 3-part application:

```text
mindspace/
├── UI   -> React + Vite frontend
├── API  -> Express application layer
└── RAG  -> Flask retrieval and ingestion engine
```

Hosted services used by the current stack:
- `Supabase Postgres` for structured app data
- `Supabase Storage` for uploaded files and attachments
- `Pinecone` for vector storage
- `Gemini` for embeddings, answer generation, and image understanding
- `Google OAuth` for Drive and Gmail integrations
- `Clerk` for authentication

## Data Storage Model

### Supabase Postgres
Stores:
- profiles
- documents
- chats
- chat history
- reminders
- checklists
- checklist items
- integration accounts
- Gmail draft records

### Supabase Storage
Stores:
- uploaded documents
- imported Google Drive file copies
- chat attachments

### Pinecone
Stores:
- vector embeddings for document chunks
- retrieval metadata for those chunks

### Gemini
Used at runtime for:
- embeddings
- answer generation
- image/vision parsing

## Main Features

### Knowledge Base
- Upload local files
- Import Google Drive files
- Filter documents by name, search text, type, date, source, and status
- Review document processing status
- Re-digest the library when retrieval settings change
- Sync documents to hosted vector storage

### Grounded AI Chat
- Persistent chat sessions
- Temporary unsaved chats
- Pinned messages
- File attachments in chat
- Citation-backed answers using retrieved source chunks

### Reminders, Tasks, and Checklists
- Create reminders from UI or chat
- Natural-language reminder actions:
  - create
  - edit
  - snooze
  - complete
  - delete
  - list
- Create and manage checklists
- Create and manage tasks
- Active/history views
- Imported action candidates from docs and emails

### Integrations
- Google Drive:
  - connect account
  - search files
  - browse shared drives
  - paginate through results
  - import into the knowledge base
- Gmail:
  - inbox preview
  - message detail view
  - action extraction from emails
  - Gmail draft creation

### Notifications
- In-app reminder notifications
- Browser notifications
- Optional SMTP email reminders

### Multimodal Ingestion
- PDF
- DOCX
- XLSX
- PPTX
- TXT
- JPG / JPEG / PNG / WEBP

Images are processed with OCR and Gemini vision when configured.

## Tech Stack

### Frontend
- React
- Vite
- MUI
- Clerk
- Axios
- React Router

### API
- Node.js
- Express
- PostgreSQL via Supabase
- Multer
- Nodemailer

### RAG
- Python
- Flask
- Pinecone
- Gemini API
- PyPDF2
- python-docx
- openpyxl
- python-pptx
- pytesseract
- Pillow

## Local Development

### Prerequisites
- Node.js `22.22.0`
- npm
- Python `3.9+`

### Install Dependencies

API:
```bash
cd API
npm install
```

UI:
```bash
cd UI
npm install
```

RAG:
```bash
cd RAG
pip3 install -r requirements.txt
```

## Run The Stack

Run each service in its own terminal.

### 1. RAG
```bash
cd /path/to/mindspace/RAG
python3 app.py
```

Health check:
```bash
curl http://localhost:5001/health
```

### 2. API
```bash
cd /path/to/mindspace/API
source ~/.zshrc
nvm use 22.22.0
npm run dev
```

Health check:
```bash
curl http://localhost:3000/health
```

### 3. UI
```bash
cd /path/to/mindspace/UI
source ~/.zshrc
nvm use 22.22.0
npm run dev
```

Open:
```text
http://localhost:5173
```

## Required Environment Variables

Do not commit real secrets. These are the categories required.

### `API/.env`
```env
CLERK_SECRET_KEY=
CLERK_PUBLISHABLE_KEY=
PYTHON_RAG_URL=http://localhost:5001

LLM_PROVIDER=gemini
EMBEDDING_PROVIDER=gemini
VECTOR_DB_PROVIDER=pinecone

GEMINI_API_KEY=
GEMINI_CHAT_MODEL=gemini-2.5-flash
GEMINI_EMBEDDING_MODEL=gemini-embedding-001
GEMINI_VECTOR_DIMENSION=1536

PINECONE_API_KEY=
PINECONE_INDEX_NAME=
PINECONE_NAMESPACE_PREFIX=mindspace

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:3000/api/integrations/google/callback

SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_DB_URL=
SUPABASE_DOCUMENTS_BUCKET=documents
SUPABASE_CHAT_ATTACHMENTS_BUCKET=chat-attachments

SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM=
```

### `RAG/.env`
```env
PORT=5001
DEPLOYMENT_MODE=hosted

LLM_PROVIDER=gemini
EMBEDDING_PROVIDER=gemini
VECTOR_DB_PROVIDER=pinecone

GEMINI_API_KEY=
GEMINI_CHAT_MODEL=gemini-2.5-flash
GEMINI_EMBEDDING_MODEL=gemini-embedding-001
GEMINI_VECTOR_DIMENSION=1536

PINECONE_API_KEY=
PINECONE_INDEX_NAME=
PINECONE_INDEX_HOST=
PINECONE_NAMESPACE_PREFIX=mindspace

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=http://localhost:3000/api/integrations/google/callback
```

### `UI/.env`
```env
VITE_CLERK_PUBLISHABLE_KEY=
```

## Main Routes

### UI
- `/`
- `/chat/:chatId`
- `/documents`
- `/reminders`
- `/integrations`
- `/settings`
- `/login`
- `/register`
- `/onboarding`

### API
- `/api/profile`
- `/api/documents`
- `/api/chat`
- `/api/reminders`
- `/api/integrations`

### RAG
- `/health`
- `/ingest`
- `/query`
- `/extract-actions`

## Typical User Flow

1. Sign in
2. Complete onboarding
3. Connect Google
4. Import a Drive file or upload a local document
5. Ask questions in chat
6. Review citations and source chunks
7. Extract actions from imported docs or emails
8. Turn them into reminders, tasks, or checklists
9. Receive reminder notifications
10. Draft follow-up emails in Gmail

## Verification Checklist

### Auth
- Sign in works
- Sign up works
- onboarding works

### Drive
- Google connects
- Drive files load
- search works
- shared-drive toggle works
- load more works
- import works

### Gmail
- inbox preview loads
- message detail loads
- action extraction works
- draft creation works

### Documents
- local upload works
- Drive import appears in documents
- filters work
- action-review dialog works

### Chat / RAG
- questions return grounded answers
- citations appear
- source snippets appear
- deleted documents stop contributing to answers

### Reminders / Tasks / Checklists
- chat actions work
- reminders page updates
- history works
- notifications appear

## Important Operational Notes

### Port conflicts
To check which process is using a port:
```bash
lsof -nP -iTCP:3000 -sTCP:LISTEN
lsof -nP -iTCP:5001 -sTCP:LISTEN
lsof -nP -iTCP:5173 -sTCP:LISTEN
```

To stop a process:
```bash
kill <PID>
```

### Supabase issues
If the API fails to start, verify:
- `SUPABASE_DB_URL`
- URL-encoded password
- correct Supabase pooler/host

### Pinecone issues
If ingest/query fails, verify:
- index exists
- dimension is `1536`
- correct API key
- correct `PINECONE_INDEX_HOST`

### Google issues
If OAuth fails, verify:
- Drive API enabled
- Gmail API enabled
- OAuth consent screen configured
- test users added if app is in testing
- redirect URI exactly matches:
  - `http://localhost:3000/api/integrations/google/callback`

## Additional Docs

For deeper docs, see:
- [HANDOFF_RUNBOOK.md](./HANDOFF_RUNBOOK.md)
- [PRODUCT_OVERVIEW.md](./PRODUCT_OVERVIEW.md)

## Summary

MindSpace is not just a document chatbot. It is a unified AI workspace for:
- knowledge retrieval
- reminders and execution
- document intelligence
- email and Drive workflows
- grounded, source-aware AI assistance
