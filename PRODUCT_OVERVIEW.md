# MindSpace Product Overview

## What MindSpace Is

MindSpace is an AI-powered knowledge and workflow workspace built to help people think, remember, retrieve, organize, and act from one place.

It combines:
- a personal knowledge base
- a conversational AI assistant
- reminders and task management
- document intelligence
- Google Drive and Gmail integrations
- hosted semantic retrieval over your files and imported content

In simple terms, MindSpace is designed to be the place where your documents, notes, emails, reminders, and actions come together so the assistant can help you find information and turn it into work.

## Core Product Vision

Most tools force users to split their work across different systems:
- files in one app
- email in another
- reminders somewhere else
- chat assistants with no memory of real work

MindSpace brings those workflows together. It allows users to:
- import their knowledge
- ask questions over it
- extract actions from it
- convert those actions into reminders, tasks, and checklists
- manage follow-ups
- draft email responses
- stay grounded in their own information

The goal is not just answering questions. The goal is helping people move from information to action.

## What MindSpace Can Do

### 1. Personal AI Chat Over Your Knowledge

MindSpace lets users chat with an AI assistant that can answer questions using their own imported content.

Users can:
- ask direct factual questions
- request summaries
- compare multiple documents
- ask follow-up questions in the same chat
- create temporary unsaved chats
- keep persistent saved chats with history

The assistant is grounded in imported content rather than answering only from generic model knowledge.

### 2. Knowledge Base and Document Library

MindSpace includes a document library where users can manage the files that power retrieval.

Supported content types include:
- PDF
- DOCX
- XLSX / spreadsheets
- PPTX / presentations
- TXT
- images
- imported Google Drive content

For each document, MindSpace tracks:
- file name
- type
- source
- processing status
- sync status
- upload/import date
- external source links
- extracted action candidates

Users can:
- upload files directly
- import files from Google Drive
- filter documents by search, type, name, date, status, and source
- delete documents
- re-sync documents to hosted vector storage
- re-digest the full library when the embedding/indexing setup changes

### 3. Retrieval-Augmented Generation

MindSpace uses a retrieval pipeline to answer questions from the user’s own knowledge base.

That means:
- documents are parsed into text
- text is split into chunks
- chunks are embedded into vectors
- vectors are stored in Pinecone
- user questions are embedded and matched semantically
- the assistant answers using the most relevant retrieved chunks

This gives MindSpace the ability to:
- answer from specific documents
- cite sources used in answers
- stay grounded in user-provided information
- improve retrieval quality over larger knowledge bases

### 4. Source-Aware Answers and Citations

MindSpace does not just give a plain answer. It can show supporting source material.

Users can view:
- source chunks used in an answer
- source document names
- retrieval confidence indicators
- direct source links for imported items like Google Drive files

This helps with:
- trust
- verification
- auditability
- enterprise-style answer review

### 5. Reminders

MindSpace includes a reminders system that can be created manually or through natural-language chat.

Users can:
- create reminders from the Reminders page
- create reminders from chat using natural language
- edit reminders
- complete reminders
- delete reminders
- snooze reminders
- review active reminders
- review completed reminder history

Example requests:
- `add a reminder for tomorrow 11 o'clock saying that remind suresh to buy jetty`
- `show my reminders for tomorrow`
- `snooze reminder remind suresh to buy jetty for tomorrow 5 pm`
- `delete reminder remind suresh to buy jetty`

Reminder records support:
- title
- description
- reminder time
- recurrence
- category
- priority
- notes
- source references
- optional email delivery

### 6. Tasks and Checklists

MindSpace includes task and checklist management alongside reminders.

Users can:
- create checklists manually
- create checklists from chat
- create tasks from chat
- add tasks into a default task inbox
- mark tasks complete
- edit tasks
- delete tasks
- complete or delete checklists
- review active and history states

This makes it possible for MindSpace to act not only as a knowledge assistant but also as a lightweight work coordination layer.

### 7. Natural-Language Action Creation

One of MindSpace’s strongest features is that the assistant can interpret commands and turn them into real workspace actions.

Instead of only answering conversationally, it can:
- create reminders
- update reminders
- delete reminders
- list reminders
- create checklists
- create tasks
- complete tasks
- edit tasks
- delete tasks
- complete checklists
- delete checklists

This shifts the assistant from “chat only” into “assistant with operational actions.”

### 8. Action Extraction From Documents

MindSpace can automatically scan imported documents and detect potential actions.

Examples include:
- reminders hidden in meeting notes
- follow-up tasks in documents
- checklist items in operational plans
- due-date style phrases

The workflow is:
- import a document
- extract action candidates
- review the candidates
- import them into reminders or checklists

This helps users move from passive storage to active execution.

### 9. Action Extraction From Email

MindSpace can also inspect Gmail messages and pull actionable items from them.

Users can:
- preview inbox messages
- open a message inside the app
- extract reminder/checklist candidates from the email content
- import those actions into the workspace

This turns email from a static inbox into a source of structured follow-up work.

### 10. Google Drive Integration

MindSpace integrates with Google Drive so users can bring their Drive files into the knowledge system.

Capabilities include:
- connect a Google account
- browse Drive files
- search Drive files
- view recent files
- import files from My Drive
- browse shared-drive content
- load more files with pagination
- open original Drive sources

Imported Drive files become part of the knowledge base and can be used for retrieval and action extraction.

### 11. Gmail Integration

MindSpace integrates with Gmail for draft and inbox workflows.

Capabilities include:
- connect Gmail through Google OAuth
- preview inbox messages
- inspect selected messages
- extract actions from those messages
- create Gmail drafts from inside the app
- save draft metadata inside the workspace

This allows MindSpace to support communication workflows without forcing the user to leave the platform.

### 12. Email Drafting

MindSpace includes a Gmail draft feature for users who want to prepare outgoing communication from inside the app.

Users can:
- enter recipient, subject, and body
- create a real Gmail draft
- keep a record of saved Gmail drafts inside the application

This is especially useful for:
- follow-ups
- meeting summaries
- task-driven communication
- response drafting after reviewing imported content

### 13. Notifications

MindSpace supports reminder notifications in multiple ways.

Current delivery modes include:
- in-app reminder notifications
- browser notifications when permission is granted
- optional SMTP-based email delivery for reminders

This makes reminders visible beyond just being stored in the database.

### 14. Image Understanding

MindSpace supports image ingestion as part of the knowledge base.

It can process:
- screenshots
- scanned pages
- images containing text
- other image-based content

Its current image handling combines:
- OCR text extraction
- Gemini-powered vision understanding when configured

This allows MindSpace to go beyond pure text files and work with image-based knowledge too.

### 15. Pinned Messages

Within chat, users can pin messages they want to keep visible.

Capabilities include:
- hover to reveal a pin control
- pin important assistant or user messages
- keep pinned items visible in the chat area
- persist pinned messages across reloads

This helps users keep high-value outputs accessible inside longer conversations.

### 16. Chat Attachments

The chat composer supports attachments directly in the input flow.

Users can:
- attach files inside chat
- send messages with those files attached
- see attachment chips in the composer and chat
- use chat as a richer workspace rather than plain text only

### 17. Temporary Chats

MindSpace supports temporary chats for sessions that should not be saved.

These are useful for:
- one-off questions
- quick brainstorming
- private exploration
- avoiding clutter in saved history

### 18. Persistent Chat Sessions

MindSpace also supports persistent chat sessions.

Saved sessions include:
- generated titles
- chat history
- stored assistant responses
- source chunks for responses
- pinned messages

This gives users a durable working memory layer across sessions.

### 19. Professional Personalization

MindSpace supports profession-aware tuning.

Users can configure their profession and profile during onboarding and settings, which helps shape how the assistant behaves and how retrieval settings are tuned.

This gives the platform a more tailored, domain-oriented feel rather than a one-size-fits-all assistant.

### 20. Onboarding and Auth Experience

MindSpace includes:
- standalone landing page
- login and registration flows
- Google-based auth through Clerk
- onboarding for new users
- custom missing-account handling and guidance

This makes the app usable as a polished product rather than only a dev tool.

## How the System Works

### Application Layer

MindSpace is made of three main layers:
- `UI`: the frontend product experience
- `API`: the business logic and app orchestration layer
- `RAG`: the AI retrieval and document processing engine

### Data Layer

MindSpace separates different kinds of storage:

#### Supabase Postgres
Used for structured app data such as:
- profiles
- document records
- chats
- chat history
- reminders
- checklists
- checklist items
- Google integration accounts
- Gmail draft records

#### Supabase Storage
Used for files such as:
- uploaded documents
- copied Google Drive imports
- chat attachments

#### Pinecone
Used for semantic vector storage:
- document chunk embeddings
- vector metadata for retrieval

#### Gemini
Used for:
- embeddings
- answer generation
- image understanding

## Why This Matters

MindSpace is not just a chatbot.

Its value comes from combining:
- memory
- retrieval
- structured actions
- communications
- personal knowledge
- operational follow-up

That combination makes it useful for:
- professionals managing large amounts of information
- teams that need source-grounded AI assistance
- people who want to turn documents and emails into tracked work
- users who want one AI workspace instead of disconnected tools

## Who MindSpace Is For

MindSpace is valuable for:
- founders
- operators
- analysts
- students
- researchers
- consultants
- legal professionals
- technical teams
- anyone working across documents, email, reminders, and follow-ups

## Example Use Cases

### Use Case 1: Research and Q&A
- Import reports from Drive
- Ask questions across them
- verify answers with citations

### Use Case 2: Meeting Follow-Up
- Import meeting notes
- extract action items
- convert them into reminders and checklists

### Use Case 3: Email Triage
- open inbox previews
- inspect important messages
- extract follow-ups
- draft responses in Gmail

### Use Case 4: Personal Operations
- manage reminders, tasks, and checklists from chat
- receive in-app or browser reminders
- keep everything linked to source material

### Use Case 5: Visual Document Intake
- upload screenshots or scanned images
- extract meaning from them
- include them in the same knowledge workflow

## Enterprise-Relevant Characteristics

MindSpace already includes several product traits that are important in enterprise-style systems:
- source-grounded retrieval
- citations
- document status tracking
- hosted vector storage
- hosted database and object storage
- Google workspace integrations
- action extraction
- reminder and task workflows
- notification delivery
- persistent chat state
- filterable document management

These give it a strong foundation for more advanced governance, admin, and deployment work later.

## Current Product Strengths

MindSpace today is strongest in:
- document-grounded AI chat
- integrated knowledge + action workflows
- Drive import and Gmail draft support
- reminder and checklist orchestration
- hosted retrieval architecture
- multimodal ingestion including image content

## Product Summary

MindSpace is an AI workspace that helps users:
- collect knowledge
- search it semantically
- ask grounded questions
- manage reminders and tasks
- turn documents and emails into action
- draft communication
- keep work connected to real source material

It is best understood as:

**an AI-powered personal knowledge and execution workspace**

not just:
- a document chatbot
- a reminder app
- an email tool
- or a task manager

It combines all of those into one assistant-driven operating layer.
