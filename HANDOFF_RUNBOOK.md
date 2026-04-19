# MindSpace Handoff Runbook

This file explains how to run, verify, and hand off the current MindSpace stack.

It reflects the current architecture:
- `UI`: React + Vite
- `API`: Express
- `RAG`: Flask
- `Supabase`: app database + file storage
- `Pinecone`: vector database
- `Gemini`: embeddings + answer generation
- `Google Drive / Gmail`: integrations

This document intentionally does not include real secrets.

## 1. Required Services

MindSpace currently expects these external services to be configured:
- `Clerk`
- `Supabase`
- `Pinecone`
- `Google OAuth` with Drive + Gmail API enabled
- `Gemini API`
- Optional: `SMTP` for email reminder delivery

## 2. Required Environment Variables

### `API/.env`

Required:
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
```

Optional for reminder email delivery:
```env
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SMTP_FROM=
```

### `RAG/.env`

Required:
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

Required:
```env
VITE_CLERK_PUBLISHABLE_KEY=
```

## 3. Local Prerequisites

Install:
- `Node.js 22.22.0`
- `npm`
- `Python 3.9+`

Recommended local setup:
```bash
source ~/.zshrc
nvm use 22.22.0
```

Install API deps:
```bash
cd API
npm install
```

Install UI deps:
```bash
cd UI
npm install
```

Install RAG deps:
```bash
cd RAG
pip3 install -r requirements.txt
```

## 4. How To Start Everything

Run all three services in separate terminals.

### Terminal 1: RAG
```bash
cd /path/to/mindspace/RAG
python3 app.py
```

Expected:
- Flask starts on `http://localhost:5001`

Health check:
```bash
curl http://localhost:5001/health
```

Expected important values:
- `deployment_mode: "hosted"`
- `embedding_provider: "gemini"`
- `llm_provider: "gemini"`
- `vector_provider: "pinecone"`

### Terminal 2: API
```bash
cd /path/to/mindspace/API
source ~/.zshrc
nvm use 22.22.0
npm run dev
```

Expected:
- Express starts on `http://localhost:3000`

Health check:
```bash
curl http://localhost:3000/health
```

Expected:
- `status: "ok"`

### Terminal 3: UI
```bash
cd /path/to/mindspace/UI
source ~/.zshrc
nvm use 22.22.0
npm run dev
```

Expected:
- Vite starts on `http://localhost:5173`

## 5. Core URLs

- UI: `http://localhost:5173`
- API: `http://localhost:3000`
- RAG: `http://localhost:5001`
- Google OAuth callback: `http://localhost:3000/api/integrations/google/callback`

## 6. Port Checks and Cleanup

To see which process is using a port:
```bash
lsof -nP -iTCP:3000 -sTCP:LISTEN
lsof -nP -iTCP:5001 -sTCP:LISTEN
lsof -nP -iTCP:5173 -sTCP:LISTEN
```

To stop a process:
```bash
kill <PID>
```

Force kill if needed:
```bash
kill -9 <PID>
```

## 7. What Is Stored Where

### Supabase Postgres
Structured app data:
- profiles
- documents
- chats
- chat history
- reminders
- checklists
- checklist items
- integration accounts
- mail drafts

### Supabase Storage
Binary files:
- uploaded documents
- imported Drive file copies
- chat attachments

### Pinecone
Vector data only:
- document chunk embeddings
- retrieval metadata for those chunks

### Gemini
Used at runtime for:
- embeddings
- answer generation
- image understanding fallback during image ingestion

## 8. Main User Flows To Test

### Authentication
1. Open `http://localhost:5173`
2. Test sign in
3. Test sign up
4. Confirm new users land in onboarding

### Google Integrations
1. Open `/integrations`
2. Click `Connect Google`
3. Complete OAuth
4. Confirm Google status shows connected

### Drive
1. Search Drive files
2. Toggle shared drives
3. Load more results
4. Import a file
5. Confirm it appears in `Documents`
6. Confirm status becomes `Ready`

### Gmail
1. Open Mail tab in `/integrations`
2. Confirm inbox preview loads
3. Open an email
4. Confirm email detail loads
5. Create a Gmail draft
6. Confirm it appears in Gmail Drafts and app drafts list

### Documents / RAG
1. Upload a local file
2. Import a Drive file
3. Ask questions in chat about those files
4. Open sources on the assistant answer
5. Confirm citations/snippets are shown
6. Delete a document
7. Ask again and confirm the deleted source is no longer used

### Reminders / Tasks / Checklists
Test from chat:
```text
add a reminder for tomorrow 11 o'clock saying that remind suresh to buy jetty
show my reminders for tomorrow
snooze reminder remind suresh to buy jetty for tomorrow 5 pm
create a checklist called launch prep: finalize deck, send invite, rehearse demo
add a task to follow up with finance tomorrow at 4 pm
complete task follow up with finance
delete reminder remind suresh to buy jetty
```

Then verify in `/reminders`.

### Action Extraction
1. In `Documents`, click the action-review button on a ready document
2. Review extracted reminder/checklist candidates
3. Import them
4. Verify they appear in Reminders

### Email Action Extraction
1. In `/integrations`, open an inbox message
2. Review detected actions
3. Import them
4. Verify they appear in Reminders / Checklists

### Images
1. Upload an image with text
2. Upload an image with visible contextual content
3. Ask a question from that image
4. Confirm image parsing works through Gemini vision + OCR fallback

## 9. Reminder Delivery Behavior

Currently supported:
- in-app notification polling
- browser notifications if permission is granted
- optional SMTP email reminders if SMTP is configured

Scheduler cadence:
- every `15 seconds`

## 10. Common Failure Points

### API port already in use
Symptom:
- `EADDRINUSE :::3000`

Fix:
```bash
lsof -nP -iTCP:3000 -sTCP:LISTEN
kill <PID>
```

### RAG not reachable
Symptom:
- UI/API chat requests fail

Fix:
- restart `RAG`
- verify `curl http://localhost:5001/health`

### Supabase connection errors
Symptom:
- API startup fails
- scheduler logs DB errors

Fix:
- verify `SUPABASE_DB_URL`
- make sure the password is URL-encoded
- use the exact connection string from Supabase

### Pinecone errors
Symptom:
- ingest fails during vector upsert/query

Fix:
- verify index dimension is `1536`
- verify index name
- verify `PINECONE_INDEX_HOST`
- verify API key belongs to the same Pinecone project

### Gmail draft errors
Symptom:
- draft creation fails

Fix:
- enable Gmail API in Google Cloud
- ensure OAuth scopes include Gmail access

### Google sign-in blocked
Symptom:
- Google says app is in testing / access denied

Fix:
- add the testing email under OAuth consent screen test users

## 11. Build Checks Before Handoff

### UI
```bash
cd UI
npm run build
```

### API syntax
```bash
node --check API/routes/chat.routes.js
node --check API/routes/integrations.routes.js
```

### RAG syntax
```bash
python3 -c "import ast, pathlib; [ast.parse(pathlib.Path(p).read_text()) for p in ['RAG/app.py','RAG/services/rag_engine.py','RAG/services/action_extractor.py','RAG/parsers/image_parser.py']]; print('ok')"
```

## 12. Git Handoff

Current requested branch pattern:
- do not push to `main`
- do not push to `feature/rag-implementation`
- create and use a new branch such as:
```bash
git switch -c pre-final-v
git add -A
git commit -m "Prepare pre-final-v feature set"
git push -u origin pre-final-v
```

## 13. Notes For Next Engineer

The main project docs are now aligned:
- `README.md` for current setup and architecture
- `HANDOFF_RUNBOOK.md` for operational handoff and verification
- `PRODUCT_OVERVIEW.md` for product and stakeholder-facing explanation

Use this file as the most detailed run/verification guide during handoff.

Current stack assumptions:
- hosted Supabase persistence
- Pinecone vectors
- Gemini embeddings and generation
- Google Drive and Gmail integrations
- reminder/task/checklist action flows
- document and email action extraction
- integrations workspace in the UI
