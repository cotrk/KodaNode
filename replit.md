# Prompt Vault

A full-stack AI Prompt Knowledge Base for managing, cataloging, and archiving all your AI prompt creations. Built for local desktop use (Windows 11 / multi-drive) with native markdown support, Ollama integration, an AI Assistant, and MCP tool support.

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
- `components/layout.tsx` — Sidebar with collections (drag-to-collect, CRUD inline), vault status panel, "My Library", AI Assistant, Create tools, Configuration. Handles drag-and-drop global state.
- `components/markdown-editor.tsx` — Split-pane editor: Edit / Split / Preview modes, auto-save with debounce, synchronized scroll between panes
- `components/import-modal.tsx` — Import .md files via File System Access API (individual files or folder scan, recursive up to 4 levels), collection assignment, import results
- `components/model-selector.tsx` — Live model dropdown for generation
- `components/streaming-result.tsx` — SSE streaming display
- `hooks/use-prompts.ts` — Library CRUD: usePrompts, usePrompt, useUpdatePrompt, useDeletePrompt, useToggleStar, useAutoTitle, useAutoTags
- `hooks/use-collections.ts` — useCollections, useCreateCollection, useUpdateCollection, useDeleteCollection, useMoveToCollection, useImportMarkdown
- `hooks/use-vault.ts` — Vault folder management via File System Access API + IndexedDB persistence. Polls every 30s for new .md files. Recursive directory scan up to 4 levels deep. Works across multiple drives.
- `hooks/use-assistant.ts` — Assistant streaming chat
- `hooks/use-stream-generation.ts` — SSE generation with auto-save
- `hooks/use-settings.ts` — Settings CRUD + model persistence
- `hooks/use-mcp.ts` — MCP server CRUD
- `pages/library.tsx` — Main library: search, mode filter, starred, sort, grid/list, import modal trigger, export all JSON, export individual .md, drag-to-collection on cards
- `pages/library-detail.tsx` — Full-page markdown editor (split-pane), inline title/tags/notes editing, collection selector, AI actions (auto-name, auto-tags), export .md
- `pages/assistant.tsx` — AI chat powered by local Ollama `assistantModel`
- `pages/create.tsx`, `refactor.tsx`, `template.tsx` — Creation tools with post-save AI banner
- `pages/settings.tsx` — Ollama URL, generation model, assistant model, cloud providers
- `pages/mcp-manager.tsx` — MCP server management

## API Routes

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/models` | All models |
| GET/PUT | `/api/settings` | Provider settings |
| POST | `/api/settings/test-ollama` | Test Ollama |
| GET | `/api/collections` | List collections |
| POST | `/api/collections` | Create collection |
| PUT | `/api/collections/:id` | Rename / recolor |
| DELETE | `/api/collections/:id` | Delete (prompts kept, unassigned) |
| GET | `/api/prompts` | Library list (search, mode, starred, tag, collectionId filters) |
| GET | `/api/prompts/:id` | Single prompt |
| PUT | `/api/prompts/:id` | Update title/tags/notes/starred/result/collectionId |
| DELETE | `/api/prompts/:id` | Delete |
| POST | `/api/prompts/:id/star` | Toggle star |
| POST | `/api/prompts/:id/collection` | Move to collection |
| POST | `/api/prompts/:id/auto-title` | AI auto-name |
| POST | `/api/prompts/:id/auto-tags` | AI auto-tags |
| GET | `/api/prompts/:id/export` | Download as .md with frontmatter |
| POST | `/api/import/markdown` | Bulk import .md files (parses frontmatter) |
| POST | `/api/generate/stream` | SSE streaming generation |
| GET/POST/DELETE | `/api/assistant/*` | Assistant chat |
| GET/POST/PUT/DELETE | `/api/mcp-servers/*` | MCP server management |

## Key Features

1. **Prompt Library** — Browse, search, filter by mode/tags/collection/starred, grid/list view
2. **In-place Markdown Editor** — Split-pane (Edit | Split | Preview) with auto-save. Full markdown editing of any prompt.
3. **Markdown Import** — File System Access API: pick individual .md files or scan entire folders recursively (up to 4 levels). Parses YAML frontmatter (title, tags, mode, starred). Duplicate detection via `sourceFile` path.
4. **Markdown Export** — Export any prompt as a `.md` file with YAML frontmatter. Bulk export library as JSON.
5. **Vault Folder** — Connect a folder on any drive. Auto-syncs every 30 seconds. Handle persisted in IndexedDB across sessions. Supports multi-drive setups (D:\, E:\, etc). Requires Chrome or Edge.
6. **Collections** — Named, colored folder groups. Create/rename/delete inline in sidebar. Drag prompt cards onto collection names to move them. Filter library by collection.
7. **AI Assistant** — Native Ollama chat with streaming, persistent history, library-aware system prompt.
8. **Auto-name & Auto-tag** — Uses `assistantModel` to generate titles and tags for any prompt.
9. **Ollama-native** — Auto-discovers local models. Separate model settings for generation vs assistant.
10. **Cloud providers** — Any OpenAI-compatible endpoint.
11. **MCP Servers** — Tool discovery injected into generation system prompts.

## Markdown Frontmatter Format

Exported prompts use this format:
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

- Requires Chrome or Edge (not Firefox)
- Works on Windows 11 with any drive letter (C:\, D:\, E:\, etc.)
- Vault handle persisted in IndexedDB (re-authorized on next visit)
- Directory scanning is recursive up to 4 levels deep
- Poll interval: 30 seconds for new/changed files

## DB Schema Note

Library table is physically named `generations` in PostgreSQL. Collections are in the `collections` table. `sourceFile` tracks import path for duplicate prevention.

## Running

`Start application` workflow runs `npm run dev` (Express + Vite on port 5000).
Schema managed with `npm run db:push`.
