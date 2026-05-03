# Prompt Vault

A full-stack AI Prompt Knowledge Base for managing, cataloging, and archiving all your AI prompt creations. Built on Node/Express/React/PostgreSQL with native Ollama (local LLM) integration, an AI Assistant, and MCP (Model Context Protocol) support.

## Stack

- **Frontend**: React + Vite + TypeScript, Wouter routing, TanStack Query v5, shadcn/ui, framer-motion, react-markdown + remark-gfm
- **Backend**: Express.js + TypeScript
- **Database**: PostgreSQL via Drizzle ORM
- **AI**: Ollama (local), any OpenAI-compatible cloud endpoint
- **Protocol**: MCP (Model Context Protocol) via JSON-RPC 2.0

## Architecture

### Shared (`shared/`)
- `schema.ts` — Drizzle tables: `generations` (prompt library), `assistantMessages`, `providerSettings` (with `assistantModel`), `mcpServers`. Zod insert/update schemas and TypeScript types.
- `routes.ts` — Full typed API contract with `buildUrl` helper.

### Server (`server/`)
- `index.ts` — Express server bootstrap
- `db.ts` — Drizzle + postgres connection
- `storage.ts` — `DatabaseStorage` implements `IStorage` with full CRUD for prompts, assistant messages, settings, MCP servers
- `routes.ts` — All API handlers: prompts, streaming generation, assistant chat (SSE), auto-title/tags, settings, MCP
- `ai-provider.ts` — `listModels()`, `testOllama()`, `streamGenerate()` (Ollama REST + OpenAI SDK cloud), `generateText()` for non-streaming AI calls
- `mcp-client.ts` — `discoverToolsStdio()`, `discoverToolsHttp()`, `buildMcpContext()` for injecting tool context into generation prompts
- `vite.ts` — Vite dev server integration

### Client (`client/src/`)
- `App.tsx` — Routes: `/`, `/library`, `/library/:id`, `/assistant`, `/create`, `/refactor`, `/template`, `/settings`, `/mcp`
- `components/layout.tsx` — Sidebar: My Library, AI Assistant (primary); Create section (Persona Architect, Refactor, Template Builder); Configuration section (MCP, AI Providers). Branding: "Prompt Vault".
- `components/model-selector.tsx` — Live model dropdown for generation (Ollama + cloud)
- `components/streaming-result.tsx` — SSE streaming display with cursor + copy button
- `hooks/use-prompts.ts` — Library CRUD: `usePrompts`, `usePrompt`, `useUpdatePrompt`, `useDeletePrompt`, `useToggleStar`, `useAutoTitle`, `useAutoTags`
- `hooks/use-assistant.ts` — `useAssistantMessages`, `useAssistantChat` (SSE stream), `useClearAssistant`
- `hooks/use-stream-generation.ts` — SSE generation hook, saves to DB on done, returns `savedId`
- `hooks/use-settings.ts` — Settings CRUD + `useSelectedModel()` with localStorage persistence
- `hooks/use-mcp.ts` — MCP server CRUD + test mutations
- `pages/library.tsx` — Main library: search, mode filter, starred filter, sort, grid/list view, star/delete inline
- `pages/library-detail.tsx` — Prompt detail: inline title edit, tag add/remove, notes edit, AI actions (auto-title, auto-tags), input params view
- `pages/assistant.tsx` — AI chat powered by local Ollama `assistantModel`; streaming, persistent history, clear chat, suggested prompts
- `pages/create.tsx` — Persona Architect form + streaming + post-save banner (auto-name, auto-tags, view in library)
- `pages/refactor.tsx` — Refactor Prompt form + streaming + post-save banner
- `pages/template.tsx` — Template Builder form + streaming + post-save banner
- `pages/settings.tsx` — Ollama URL, default generation model, **AI assistant model** (separate), cloud provider management
- `pages/mcp-manager.tsx` — MCP server list, add stdio/http servers, test & discover tools, enable/disable

## API Routes

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/models` | All models (Ollama + cloud) |
| GET | `/api/settings` | Provider settings |
| PUT | `/api/settings` | Update Ollama URL, default model, assistant model, cloud providers |
| POST | `/api/settings/test-ollama` | Test Ollama connectivity |
| GET | `/api/prompts` | Library list (search, mode, starred, tag filters) |
| GET | `/api/prompts/:id` | Single prompt |
| PUT | `/api/prompts/:id` | Update title/tags/notes/starred/category |
| DELETE | `/api/prompts/:id` | Delete prompt |
| POST | `/api/prompts/:id/star` | Toggle star |
| POST | `/api/prompts/:id/auto-title` | AI-generate title using `assistantModel` |
| POST | `/api/prompts/:id/auto-tags` | AI-generate tags using `assistantModel` |
| POST | `/api/generate/stream` | SSE streaming generation (persona/refactor/template) |
| GET | `/api/assistant/messages` | Persistent chat history |
| POST | `/api/assistant/chat` | SSE streaming assistant response |
| DELETE | `/api/assistant/messages` | Clear chat history |
| GET | `/api/mcp-servers` | List MCP servers |
| POST | `/api/mcp-servers` | Add MCP server |
| PUT | `/api/mcp-servers/:id` | Update MCP server |
| DELETE | `/api/mcp-servers/:id` | Delete MCP server |
| POST | `/api/mcp-servers/:id/test` | Connect & discover tools |
| GET | `/api/mcp-tools` | All enabled MCP tools |

## Key Features

1. **Prompt Library** — Browse all saved prompts by mode, search, tag, or starred. Grid/list view with sort.
2. **Prompt Detail** — Inline edit title, tags, notes. AI actions: auto-name and suggest tags using local Ollama. Copy prompt content.
3. **AI Assistant** — Native Ollama chat (separate `assistantModel` setting). Library-aware, streaming, persistent per-session history. Helps name, tag, organize, and improve prompts.
4. **Post-generation workflow** — After every generation, a banner offers one-click AI auto-naming, tag suggestion, and "View in Library" shortcuts.
5. **Create Tools** — Persona Architect, Refactor Prompt, Template Builder. All stream via SSE and auto-save to the library.
6. **Ollama-native** — Auto-discovers local models. Two separate model selectors: one for generation, one for the assistant.
7. **Cloud providers** — Any OpenAI-compatible endpoint with custom API key and model list.
8. **MCP Servers** — stdio and HTTP servers. Tool discovery injected into every generation system prompt.

## Running

The `Start application` workflow runs `npm run dev` (Express + Vite on port 5000).  
Schema managed with `npm run db:push`.

## DB Schema Note

The library table is physically named `generations` in PostgreSQL (for migration continuity) but is conceptually the "prompts" library throughout the UI and API.
