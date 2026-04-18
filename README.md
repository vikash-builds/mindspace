# MindSpace — AI-Powered Personal Knowledge Workspace

> A fully private, self-hosted, multimodal RAG (Retrieval-Augmented Generation) assistant that adapts to your profession and workflow.

![MindSpace](UI/src/assets/logos/logo.png)

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Project Structure](#project-structure)
- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
  - [1. Clone & Setup](#1-clone--setup)
  - [2. RAG Engine (Python)](#2-rag-engine-python)
  - [3. API Server (Node.js)](#3-api-server-nodejs)
  - [4. UI (Vite + React)](#4-ui-vite--react)
- [Environment Variables](#environment-variables)
- [RAG Engine Deep Dive](#rag-engine-deep-dive)
  - [Supported File Types](#supported-file-types)
  - [Embedding Model](#embedding-model)
  - [Vector Storage](#vector-storage)
  - [OCR Support](#ocr-support)
  - [LLM Integration](#llm-integration)
- [API Reference](#api-reference)
- [Profession-Based Tuning](#profession-based-tuning)
- [File System Watcher](#file-system-watcher)
- [Document Re-digestion](#document-re-digestion)
- [Authentication](#authentication)
- [UI Screens](#ui-screens)
- [Contributing](#contributing)

---

## Overview

MindSpace is a **100% local-first** personal AI assistant that lets you build a private knowledge base from your own documents and query it using a conversational interface. Everything runs on your machine — no external AI APIs required.

It is built as a **3-tier monorepo**:

```
MindSpace
├── UI       → React 18 + Vite frontend
├── API      → Node.js + Express middleware layer
└── RAG      → Python Flask RAG engine (FAISS + Ollama)
```

---

## Key Features

| Feature | Description |
|---|---|
| **Multimodal Ingestion** | Ingest PDFs, DOCX, XLSX, PPTX, TXT, and Images (JPG/PNG/WEBP) |
| **OCR Support** | Extracts text from images using Tesseract locally |
| **Private LLM** | All inference runs through [Ollama](https://ollama.com) — no cloud API calls |
| **Profession Tuning** | RAG parameters auto-configured per profession (Doctor, Engineer, Lawyer, etc.) |
| **File Watcher** | Drop files into `storage/uploads/` and they are auto-ingested without UI interaction |
| **Re-digest Library** | Reprocess all documents with new chunk settings from the Settings panel |
| **Proactive Reminders** | Set time-based reminders with recurrence — notified in-app or via email |
| **Chat Sessions** | Persistent, titled chat sessions with full history |
| **Temporary Chats** | Private, unsaved chat sessions that are never written to database |
| **Multi-document Upload** | Upload multiple files in parallel with individual status tracking |
| **Bulk Deletion** | Select multiple documents via checkboxes and delete concurrently |
| **Error Tooltips** | Hover over a failed document's Error chip to see the exact ingestion failure reason |
| **Dark Theme** | Premium charcoal + neon green design system throughout |
| **Custom Auth** | Clerk-based authentication with fully dark-themed, standalone login/register pages |

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         Browser (React UI)                          │
│  Landing → Auth → Onboarding → Dashboard → Documents → Settings     │
└───────────────────────────┬─────────────────────────────────────────┘
                            │ HTTP (Vite proxy → :3000)
┌───────────────────────────▼─────────────────────────────────────────┐
│                     Node.js Express API (:3000)                     │
│                                                                     │
│  Routes: /api/profile  /api/documents  /api/chat  /api/reminders   │
│  Middleware: Clerk Auth JWT verification                             │
│  DB: SQLite (better-sqlite3)                                        │
│  Services: rag-bridge.js, scheduler.js (cron), watcher.js           │
└───────────────────────────┬─────────────────────────────────────────┘
                            │ HTTP (:5001)
┌───────────────────────────▼─────────────────────────────────────────┐
│                   Python Flask RAG Engine (:5001)                   │
│                                                                     │
│  Routes: POST /ingest  POST /query  DELETE /delete                  │
│  Parser: PDF, DOCX, XLSX, PPTX, TXT, Images (Tesseract OCR)        │
│  Chunker: Sliding window with configurable size + overlap           │
│  Embeddings: sentence-transformers (all-MiniLM-L6-v2)              │
│  Vector Store: FAISS IndexFlatL2 (per-user indexes)                 │
│  LLM: Ollama (llama3.2) — local inference                          │
└─────────────────────────────────────────────────────────────────────┘
```

### Data Flow for a Query

```
User types question
       ↓
Express API → validates JWT → fetch user profile (chunk_size, top_k, temperature)
       ↓
rag-bridge.js → POST /query to Python Flask
       ↓
Embed question (sentence-transformers)
       ↓
FAISS similarity search → retrieve top_k chunks
       ↓
Build prompt: [system context + retrieved chunks + user question]
       ↓
Ollama LLM → generate answer
       ↓
Return answer + source chunks to UI
```

---

## Tech Stack

### Frontend (UI)
| Technology | Version | Purpose |
|---|---|---|
| React | 18 | UI framework |
| Vite | 5 | Build tool & dev server |
| MUI (Material UI) | 5 | Component library |
| Clerk | 5 | Authentication |
| React Router | 6 | Client-side routing |
| Axios | 1.6 | HTTP client |
| Google Fonts — **Inter** + **Space Grotesk** | — | Typography |

### API (Backend)
| Technology | Version | Purpose |
|---|---|---|
| Node.js | 18+ | Runtime |
| Express | 4.18 | HTTP framework |
| better-sqlite3 | 9 | Local SQLite database |
| Multer | 1.4 | File upload handling |
| Chokidar | 5 | Filesystem watcher daemon |
| node-cron | 3 | Reminder scheduler |
| Nodemailer | 6.9 | Email notifications |
| @clerk/clerk-sdk-node | 4 | JWT auth middleware |

### RAG Engine (Python)
| Technology | Version | Purpose |
|---|---|---|
| Flask | 3.0 | HTTP framework |
| FAISS (CPU) | 1.7.4 | Vector similarity search |
| sentence-transformers | 2.2.2 | Text embeddings |
| Ollama | — | Local LLM inference |
| PyPDF2 | 3.0.1 | PDF text extraction |
| python-docx | 1.1.0 | DOCX parsing |
| openpyxl | 3.1.2 | XLSX parsing |
| python-pptx | 0.6.21 | PPTX parsing |
| pytesseract + Pillow | 0.3.13 / 11 | Image OCR |

---

## Project Structure

```
mindspace/
├── UI/                          # Vite React frontend
│   ├── src/
│   │   ├── assets/logos/        # Brand logo assets
│   │   ├── components/
│   │   │   ├── Sidebar.jsx      # Navigation drawer with chat sessions
│   │   │   ├── ChatWindow.jsx   # Main chat interface
│   │   │   ├── MessageBubble.jsx# Individual message renderer
│   │   │   ├── DocumentList.jsx # Documents table with bulk actions
│   │   │   └── FileUploader.jsx # Multi-file drag & drop uploader
│   │   ├── pages/
│   │   │   ├── Landing.jsx      # Public marketing page
│   │   │   ├── Dashboard.jsx    # Main layout wrapper
│   │   │   ├── Documents.jsx    # Document library page
│   │   │   ├── Reminders.jsx    # Reminder management page
│   │   │   ├── Settings.jsx     # Profile & RAG configuration
│   │   │   └── Onboarding.jsx   # First-run profession setup
│   │   ├── professions.js       # Profession configs & RAG boundaries
│   │   ├── App.jsx              # Router + Clerk auth guards
│   │   ├── main.jsx             # MUI Theme + Clerk provider
│   │   └── index.css            # Global design tokens
│   ├── index.html
│   └── vite.config.js
│
├── API/                         # Node.js Express server
│   ├── routes/
│   │   ├── documents.routes.js  # Upload, list, delete, redigest
│   │   ├── chat.routes.js       # Sessions, history, chat completions
│   │   ├── profile.routes.js    # User profile CRUD
│   │   └── reminders.routes.js  # Reminder CRUD
│   ├── services/
│   │   ├── rag-bridge.js        # Proxy to Python RAG engine
│   │   ├── scheduler.js         # Cron-based reminder firing
│   │   └── email.service.js     # Nodemailer email sender
│   ├── middleware/
│   │   └── auth.js              # Clerk JWT middleware
│   ├── storage/uploads/         # User uploaded files (per-user dirs)
│   ├── watcher.js               # Chokidar filesystem daemon
│   ├── database.js              # SQLite schema + migrations
│   ├── config.js                # Environment configuration
│   └── server.js                # App bootstrap
│
└── RAG/                         # Python Flask RAG engine
    ├── parsers/
    │   └── image_parser.py      # Tesseract OCR for images
    ├── routes/
    │   └── ingest.py            # /ingest /query /delete endpoints
    ├── services/
    │   ├── parser.py            # File-type routing to parsers
    │   ├── chunker.py           # Sliding window text chunker
    │   ├── embeddings.py        # sentence-transformers wrapper
    │   ├── vector_store.py      # FAISS index management (per-user)
    │   ├── rag_engine.py        # Full query pipeline
    │   └── llm.py               # Ollama HTTP client
    ├── storage/
    │   ├── faiss_indexes/       # Per-user FAISS index files
    │   └── chunk_maps/          # Per-user chunk metadata pickles
    ├── app.py                   # Flask app factory
    ├── config.py                # RAG config & env vars
    └── requirements.txt
```

---

## Prerequisites

Before running MindSpace, ensure you have:

| Dependency | Install | Notes |
|---|---|---|
| **Node.js** ≥ 18 | [nodejs.org](https://nodejs.org) | For the API and UI |
| **Python** ≥ 3.10 | [python.org](https://python.org) | For the RAG engine |
| **Ollama** | [ollama.com](https://ollama.com) | Local LLM runtime |
| **Tesseract OCR** | `brew install tesseract` (macOS) | For image ingestion |
| **Clerk Account** | [clerk.com](https://clerk.com) | For authentication |

### Pull the LLM model
```bash
ollama pull llama3.2
```

---

## Getting Started

### 1. Clone & Setup

```bash
git clone <your-repo-url> mindspace
cd mindspace
```

### 2. RAG Engine (Python)

```bash
cd RAG
python -m venv venv
source venv/bin/activate       # Windows: venv\Scripts\activate
pip install -r requirements.txt
python app.py
```

> The RAG engine starts on **http://localhost:5001**

### 3. API Server (Node.js)

```bash
cd API
cp .env.example .env           # Configure your environment variables
npm install
npm run dev
```

> The API starts on **http://localhost:3000**

### 4. UI (Vite + React)

```bash
cd UI
npm install
npm run dev
```

> The UI starts on **http://localhost:5173**

---

## Environment Variables

### API (`API/.env`)

```env
PORT=3000

# Clerk Authentication
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Python RAG engine URL
PYTHON_RAG_URL=http://127.0.0.1:5001

# Email (optional, for reminder notifications)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@email.com
SMTP_PASS=your_app_password
```

### RAG (`RAG/.env`)

```env
PORT=5001
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.2
```

### UI (`UI/.env`)

```env
VITE_CLERK_PUBLISHABLE_KEY=pk_test_...
```

---

## RAG Engine Deep Dive

### Supported File Types

| Extension | Parser | Method |
|---|---|---|
| `.pdf` | PyPDF2 | Page-by-page text extraction |
| `.docx` | python-docx | Paragraph extraction |
| `.xlsx`, `.xls` | openpyxl | Cell-by-cell per worksheet |
| `.pptx`, `.ppt` | python-pptx | Slide text frames |
| `.txt` | Built-in | Direct read |
| `.jpg`, `.jpeg`, `.png`, `.webp` | Tesseract + Pillow | OCR text extraction |

### Embedding Model

The engine uses **`all-MiniLM-L6-v2`** from `sentence-transformers`:
- **384-dimensional** dense vector embeddings
- Runs entirely **offline** after initial model download
- Cached locally in `~/.cache/huggingface`

### Vector Storage

FAISS `IndexFlatL2` (Euclidean distance) with **per-user isolation**:

```
RAG/storage/
├── faiss_indexes/
│   ├── user_abc.index      ← FAISS binary index per user
│   └── user_xyz.index
└── chunk_maps/
    ├── user_abc.pkl        ← Python pickle: [{doc_id, text}, ...]
    └── user_xyz.pkl
```

When a document is deleted, the index is rebuilt from scratch (excluding deleted chunks). This is acceptable for personal-scale workloads.

### OCR Support

Image OCR requires **Tesseract** installed on the system. On Apple Silicon:

```bash
brew install tesseract
```

The engine automatically detects the Homebrew path (`/opt/homebrew/bin/tesseract`) and configures `pytesseract` accordingly.

### LLM Integration

All language model inference is handled through **Ollama**. The RAG engine constructs a prompt combining:

1. A system instruction with retrieved document context
2. The user's question

And sends it to Ollama's local HTTP API (`/api/generate`). No data ever leaves your machine.

Default model: `llama3.2` — configurable via `OLLAMA_MODEL` env var.

---

## API Reference

### Profile

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/profile` | Fetch user profile & RAG settings |
| `POST` | `/api/profile` | Create or update user profile |

### Documents

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/documents/upload` | Upload one or more files |
| `GET` | `/api/documents` | List all documents for authenticated user |
| `DELETE` | `/api/documents/:id` | Delete a specific document |
| `POST` | `/api/documents/redigest` | Re-ingest all documents with current settings |

### Chat

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/chat` | Send a message, receive RAG-powered answer |
| `GET` | `/api/chat/sessions` | List all chat sessions |
| `GET` | `/api/chat/history/:chatId` | Fetch message history for a session |
| `DELETE` | `/api/chat/sessions/:id` | Delete a chat session |

### Reminders

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/reminders` | List all reminders |
| `POST` | `/api/reminders` | Create a reminder |
| `PUT` | `/api/reminders/:id` | Update a reminder |
| `DELETE` | `/api/reminders/:id` | Delete a reminder |

All endpoints require `Authorization: Bearer <clerk_token>` header.

---

## Profession-Based Tuning

MindSpace ships with pre-configured RAG parameters for common professions, allowing the engine to behave differently without manual tuning:

| Profession | Chunk Size | Overlap | Top K | Temperature |
|---|---|---|---|---|
| Doctor / Medical | Small | High | High K | Low |
| Lawyer / Legal | Medium | High | High K | Low |
| Software Engineer | Medium | Medium | Medium K | Medium |
| Researcher | Large | Medium | High K | Low |
| Custom | User-defined | User-defined | User-defined | User-defined |

Users can override any parameter via the **Settings → RAG Engine Configuration** panel.

---

## File System Watcher

MindSpace runs a background `chokidar` daemon that monitors `API/storage/uploads/`. This means:

- **Drop a file** into a user's uploads folder via Finder/Explorer → it's automatically ingested into the knowledge base
- **Modify an existing file** → embeddings are automatically rebuilt
- **Delete a file** → it's automatically removed from the FAISS index and database

The watcher respects the same validation rules as the UI uploader (file extension whitelist).

---

## Document Re-digestion

After changing RAG parameters (e.g., increasing chunk size for better context), you can force a full rebuild of your knowledge base:

1. Navigate to **Settings → RAG Engine Configuration**
2. Adjust parameters using the sliders
3. Click **Save Changes**
4. Click **Re-digest Library**

All documents are deleted from FAISS and re-embedded using the new parameters. Progress is tracked in real-time on the Documents page.

---

## Authentication

MindSpace uses **Clerk** for authentication with a fully custom-themed dark interface:

- **Landing page** (`/`) — public marketing page with links to sign in/up
- **Login page** (`/login`) — standalone dark-themed Clerk `<SignIn>` component
- **Register page** (`/register`) — standalone dark-themed Clerk `<SignUp>` component
- **Onboarding** (`/onboarding`) — required first-run profile setup before accessing the app

All protected routes check for a valid Clerk JWT, verified server-side via `@clerk/clerk-sdk-node`.

---

## UI Screens

| Screen | Route | Description |
|---|---|---|
| Landing | `/` | Public marketing page (unauthenticated) |
| Login | `/login` | Clerk sign-in (dark themed) |
| Register | `/register` | Clerk sign-up (dark themed) |
| Onboarding | `/onboarding` | First-run profession selector |
| Chat | `/` or `/chat/:id` | Main AI assistant interface |
| Documents | `/documents` | Upload, manage, and monitor knowledge base |
| Reminders | `/reminders` | Create and track time-based reminders |
| Settings | `/settings` | Profile, profession, and RAG parameter tuning |

---

## Contributing

This is a personal workspace project. For issues or improvements, feel free to fork and adapt to your workflow.

---

*Built with ❤️ — fully local, fully private, fully yours.*