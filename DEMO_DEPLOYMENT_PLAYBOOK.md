# MindSpace Demo + Deployment Playbook

This guide is optimized for a hackathon demo, a company Git submission, and a hosted deployment split across:

- `UI` on Vercel
- `API` on Railway
- `RAG` on Railway

## 1. Demo Strategy

The strongest demo path for MindSpace is not "show every page."
It is:

1. Upload HR files.
2. Ask a policy or onboarding question and show citations.
3. Convert that answer into a reminder or checklist in chat.
4. Show the resulting reminder/checklist in the workspace.
5. Optionally show Gmail draft creation or Drive import as the final proof of extensibility.

## 2. Recommended HR Demo Dataset

Before the demo, prepare 4 to 6 files:

- employee handbook
- leave or attendance policy
- onboarding checklist
- offboarding SOP
- HR email templates
- optional spreadsheet or PPT for mixed-format retrieval

Good examples of questions:

- "What documents should HR collect during onboarding?"
- "What is the leave policy during probation?"
- "Create an onboarding checklist for a new software engineer based on these files."
- "What are the offboarding steps for access revocation and asset return?"
- "Draft a welcome email using the uploaded HR email templates."

## 3. Demo Mode

The UI includes a `Demo Mode` page that acts as a live control center for the pitch.

Environment variables:

```env
VITE_ENABLE_DEMO_MODE=true
VITE_DEMO_PERSONA=hr
```

What it gives you:

- a judge-friendly HR storyline
- a target file checklist
- prompt shortcuts that open directly in chat
- a talk track for the live walkthrough

## 4. Vercel Deployment

Deploy the `UI` directory as a separate Vercel project.

### Build settings

- Root Directory: `UI`
- Build Command: `npm run build`
- Output Directory: `dist`

### Required environment variables

```env
VITE_CLERK_PUBLISHABLE_KEY=
VITE_API_BASE_URL=https://your-api-service.up.railway.app
VITE_ENABLE_DEMO_MODE=true
VITE_DEMO_PERSONA=hr
```

Notes:

- `vercel.json` is included so React Router routes resolve correctly on refresh.
- The UI expects the API to be reachable over HTTPS.

## 5. Railway Deployment

Create two Railway services: one for `API`, one for `RAG`.

### API service

Root directory: `API`

Start command:

```bash
npm start
```

Important environment variables:

```env
PORT=3000
CLERK_SECRET_KEY=
CLERK_PUBLISHABLE_KEY=
PYTHON_RAG_URL=https://your-rag-service.up.railway.app

DEPLOYMENT_MODE=hosted
LLM_PROVIDER=gemini
EMBEDDING_PROVIDER=gemini
VECTOR_DB_PROVIDER=pinecone

GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REDIRECT_URI=https://your-api-service.up.railway.app/api/integrations/google/callback

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

### RAG service

Root directory: `RAG`

Start command:

```bash
python3 app.py
```

Important environment variables:

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
```

## 6. External Services Checklist

### Clerk

- Add your Vercel domain and local domain to allowed origins.
- Set sign-in/sign-up URLs if needed.

### Google OAuth

Add both local and hosted callback URLs:

- `http://localhost:3000/api/integrations/google/callback`
- `https://your-api-service.up.railway.app/api/integrations/google/callback`

### Supabase

- Confirm both storage buckets exist:
  - `documents`
  - `chat-attachments`
- Confirm the Postgres connection string works from Railway.

### Pinecone

- Ensure the index dimension matches the embedding model.
- If the normal index name lookup is flaky, set `PINECONE_INDEX_HOST`.

## 7. Company Git Submission

Recommended flow:

1. Create a clean branch from your company Git account.
2. Push the current repo there.
3. Add this project-level documentation:
   - `README.md`
   - `DEMO_DEPLOYMENT_PLAYBOOK.md`
4. Make one clean commit for the demo-readiness pass.
5. If time allows, add screenshots or the demo video link to the repository description or README.

Suggested commit message:

```text
feat: polish demo experience and add hosted deployment playbook
```

## 8. Demo Video Recommendations

Use Loom, OBS, or QuickTime screen recording.

Best structure for a short judging video:

1. 10s intro:
   - what MindSpace is
   - who it helps
2. 20s knowledge upload:
   - show HR files being uploaded
3. 30s grounded Q&A:
   - ask a policy question
   - open sources
4. 20s action workflow:
   - create a checklist or reminder from chat
5. 15s follow-through:
   - show reminder/checklist page
6. 15s integrations:
   - show Gmail draft or Drive import

Recording tips:

- Zoom browser to 110% or 125%.
- Use a clean seeded account with no noisy data.
- Keep no more than 3 to 4 tabs open.
- Rehearse the exact prompts before recording.

## 9. Night-Before Rehearsal Checklist

- all env vars set locally
- hosted URLs working
- Google OAuth callback confirmed
- at least 4 HR files uploaded
- one chat already tested end-to-end
- one reminder successfully created and visible
- one Gmail draft successfully created if integrations are enabled
- one fallback story ready if Google auth fails during judging

## 10. Recommended Live Pitch Framing

Use language like:

- "MindSpace turns company knowledge into operational follow-through."
- "This is not just chat over documents; it is execution on top of trusted context."
- "In HR, that means policies, onboarding, offboarding, and communication all stay in one grounded assistant workflow."
