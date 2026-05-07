# Prompt Vault

A full-stack AI Prompt Knowledge Base for managing, cataloging, and archiving AI prompt creations. Built for local desktop use (Windows 11 / multi-drive) with native markdown support, Ollama integration, an AI Assistant, and MCP tool support.

## Stack

- **Frontend**: React + Vite + TypeScript, Wouter routing, TanStack Query v5, shadcn/ui, framer-motion, react-markdown + remark-gfm
- **Backend**: Express.js + TypeScript
- **Database**: PostgreSQL via Drizzle ORM
- **AI**: Ollama (local), any OpenAI-compatible cloud endpoint
- **Protocol**: MCP (Model Context Protocol) via JSON-RPC 2.0
- **File System**: File System Access API (Chrome/Edge) for vault folder sync and .md import/export

## Architecture

### Shared (`shared/`)
- `schema.ts` — Drizzle tables: `collections`, `generations` (with `collectionId`, `sourceFile`), `assistantMessages`, `providerSettings` (with `assistantModel`), `mcpServers`
- `routes.ts` — Full typed API contract with `buildUrl` helper

### Server (`server/`)
- `index.ts` — Express server bootstrap
- `db.ts` — Drizzle + postgres connection
- `storage.ts` — `DatabaseStorage` implements `IStorage`. Includes `bulkImportMarkdown()` with YAML frontmatter parser, `getCollections()`, `createCollection()`, `updateCollection()`, `deleteCollection()`
- `routes.ts` — All API handlers: prompts, streaming generation, assistant chat (SSE), auto-title/tags, collections CRUD, markdown import/export, settings, MCP
- `ai-provider.ts` — `listModels()`, `testOllama()`, `streamGenerate()` (Ollama + OpenAI SDK), `generateText()`
- `mcp-client.ts` — MCP tool discovery and context injection
- `vite.ts` — Vite dev server integration

### Client (`client/src/`)
- `App.tsx` — Routes: `/`, `/library`, `/library/:id`, `/assistant`, `/create`, `/refactor`, `/template`, `/settings`, `/mcp`
- `components/layout.tsx` — Sidebar with collections, vault status panel, library navigation, AI Assistant, and configuration controls
- `components/markdown-editor.tsx` — Split-pane editor: Edit / Split / Preview modes, auto-save with debounce, synchronized scroll between panes
- `components/import-modal.tsx` — Import .md files via File System Access API, collection assignment, import results
- `hooks/use-prompts.ts` — Library CRUD hooks
- `hooks/use-collections.ts` — Collection CRUD and import hooks
- `hooks/use-vault.ts` — Vault folder management via File System Access API + IndexedDB persistence
- `hooks/use-assistant.ts` — Assistant streaming chat
- `hooks/use-stream-generation.ts` — SSE generation with auto-save
- `hooks/use-settings.ts` — Settings CRUD + model persistence
- `hooks/use-mcp.ts` — MCP server CRUD
- `pages/library.tsx` — Main library
- `pages/library-detail.tsx` — Full-page markdown editor
- `pages/assistant.tsx` — AI chat powered by local Ollama `assistantModel`
- `pages/create.tsx`, `refactor.tsx`, `template.tsx` — Creation tools
- `pages/settings.tsx` — Ollama URL, generation model, assistant model, cloud providers
- `pages/mcp-manager.tsx` — MCP server management

## Prompt Pack

The project also includes a dedicated prompt-pack directory:

- `prompts/system-prompt.md` — full specialist system prompt
- `prompts/system-prompt-short.md` — compact production system prompt
- `prompts/kb/` — shared JSON knowledge base files
- `prompts/projects/prompt-vault/` — nested project-specific pack with `system/`, `tools/`, and `kb/`

## Key Features

1. **Prompt Library** — Browse, search, filter by mode/tags/collection/starred, grid/list view
2. **In-place Markdown Editor** — Split-pane editing with auto-save
3. **Markdown Import** — File System Access API with recursive folder scan and frontmatter parsing
4. **Markdown Export** — Export prompts as `.md` with YAML frontmatter
5. **Vault Folder** — Connect a folder on any drive; handle persisted in IndexedDB; Chrome/Edge only
6. **Collections** — Named, colored folder groups with drag-and-drop organization
7. **AI Assistant** — Native Ollama chat with streaming and library-aware context
8. **Auto-name & Auto-tag** — AI-powered prompt enrichment
9. **Cloud providers** — Any OpenAI-compatible endpoint
10. **MCP Servers** — Tool discovery injected into generation system prompts

## Markdown Frontmatter Format

```markdown
---
title: "My Prompt Title"
tags: [react, typescript, code-review]
mode: create
starred: true
created: 2024-01-15T10:30:00Z
---

[Prompt content here]
```

## File System Access API Notes

- Requires Chrome or Edge
- Works on Windows 11 with any drive letter
- Vault handle is persisted in IndexedDB and re-authorized on next visit
- Directory scanning is recursive up to 4 levels deep
- Poll interval: 30 seconds for new/changed files

## DB Schema Note

The library table is physically named `generations` in PostgreSQL. Collections are in the `collections` table. `sourceFile` tracks import path for duplicate prevention.

## Installing on Windows 11

### Step 1 — Extract the downloaded file

Replit exports the project as a `.tar.gz` file. Windows' built-in extractor does not handle this format reliably and may drop files. Use one of these methods instead:

**Option A — PowerShell (recommended, no extra software needed)**
1. Open the folder where you downloaded the file
2. Hold **Shift** and right-click an empty area → select **Open PowerShell window here**
3. Run this command (replace the filename with your actual file):
```powershell
tar -xzf ReplitExport-cotrk.tar.gz
```
4. A new folder will appear with all the project files inside

**Option B — 7-Zip (easiest if you prefer GUI)**
1. Download and install 7-Zip from [7-zip.org](https://www.7-zip.org) (free)
2. Right-click the `.tar.gz` file
3. Select **7-Zip → Extract Here**
4. All files including the `.bat` launchers will be extracted correctly

> **Do not** double-click the file to open it in Windows Explorer — this partially extracts it and causes the `.bat` files to go missing.

---

### Step 2 — Prerequisites

Before running the app you need:

| Requirement | Where to get it |
|---|---|
| **Node.js v18+** | [nodejs.org](https://nodejs.org/en/download) — install the LTS version |
| **PostgreSQL database** | Free cloud options: [neon.tech](https://neon.tech) or [supabase.com](https://supabase.com) — or install locally from [postgresql.org](https://www.postgresql.org/download/windows) |
| **Chrome or Edge browser** | Required for Vault folder sync feature |
| **Ollama** (optional) | [ollama.com/download/windows](https://ollama.com/download/windows) — needed for AI assistant |

---

### Step 3 — First-time setup

Open the extracted project folder. You will see four `.bat` launcher files:

| File | Purpose |
|---|---|
| `install.bat` | First-time setup: checks Node.js, installs dependencies, creates `.env` template |
| `setup-ollama.bat` | Installs/starts Ollama, lets you pick and download a model interactively |
| `start.bat` | Launches the app, syncs DB schema, opens Chrome automatically |
| `update.bat` | Pulls latest code, updates dependencies, syncs DB schema |

**Run these in order the first time:**

1. Double-click **`install.bat`** — checks Node.js, installs all dependencies, and creates a `.env` file
2. Open the `.env` file in Notepad and set your `DATABASE_URL`:
```
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DATABASE
```
3. Double-click **`setup-ollama.bat`** — walks you through downloading Ollama and a model *(skip if you don't want AI features)*
4. Double-click **`start.bat`** — starts the server and opens Chrome at `http://localhost:5000`

**Every day after that:** just double-click **`start.bat`**.

---

### Troubleshooting

| Problem | Fix |
|---|---|
| `.bat` files missing after extraction | Use PowerShell `tar` command or 7-Zip — do not use Windows built-in extractor |
| `node` not found error | Install Node.js from nodejs.org and restart PowerShell |
| Database connection error | Check your `DATABASE_URL` in the `.env` file |
| AI assistant not working | Make sure Ollama is running — run `setup-ollama.bat` |
| Vault folder not working | Use Chrome or Edge — this feature does not work in Firefox |

## Running in Replit

`Start application` workflow runs `npm run dev` (Express + Vite on port 5000).
Schema is managed with `npm run db:push`.
 