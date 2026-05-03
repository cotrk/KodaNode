# Persona Architect

A full-stack AI persona creation tool for building, refactoring, and templating system prompts — powered by Ollama (local LLMs) and any OpenAI-compatible cloud provider, with native MCP (Model Context Protocol) tool server integration.

## Stack

- **Frontend**: React + Vite + TypeScript, Wouter routing, TanStack Query, shadcn/ui, framer-motion, react-markdown
- **Backend**: Express.js + TypeScript
- **Database**: PostgreSQL via Drizzle ORM
- **AI**: Ollama (local), any OpenAI-compatible cloud endpoint
- **Protocol**: MCP (Model Context Protocol) via JSON-RPC 2.0

## Architecture

### Shared (`shared/`)
- `schema.ts` — Drizzle tables: `generations`, `providerSettings`, `mcpServers`. Zod insert schemas and TypeScript types.
- `routes.ts` — Full API contract: typed route definitions, request schemas, response schemas, `buildUrl` helper.

### Server (`server/`)
- `index.ts` — Express server bootstrap
- `db.ts` — Drizzle + postgres connection
- `storage.ts` — `DatabaseStorage` implements `IStorage` for all CRUD
- `routes.ts` — All API route handlers: models, settings, MCP CRUD + test, generation streaming
- `ai-provider.ts` — `listModels()`, `testOllama()`, `streamGenerate()` async generator (Ollama via REST, cloud via OpenAI SDK)
- `mcp-client.ts` — `discoverToolsStdio()`, `discoverToolsHttp()`, `buildMcpContext()` for injecting tool info into prompts
- `vite.ts` — Vite dev server integration

### Client (`client/src/`)
- `App.tsx` — Routes: `/`, `/create`, `/refactor`, `/template`, `/history`, `/history/:id`, `/settings`, `/mcp`
- `components/layout.tsx` — Sidebar with Tools / Library / Configuration sections
- `components/model-selector.tsx` — Live dropdown listing all Ollama + cloud models with refresh
- `components/streaming-result.tsx` — SSE streaming display with blinking cursor + copy button
- `hooks/use-stream-generation.ts` — SSE client hook, streams chunks into state, saves to DB on done
- `hooks/use-settings.ts` — Settings CRUD + `useSelectedModel()` with localStorage persistence
- `hooks/use-mcp.ts` — MCP server CRUD + test mutations
- `hooks/use-generations.ts` — List/get/delete generation history
- `pages/create.tsx` — Create persona form + model selector + streaming output
- `pages/refactor.tsx` — Refactor prompt form + model selector + streaming output
- `pages/template.tsx` — Template builder form + model selector + streaming output
- `pages/settings.tsx` — Ollama URL config, test connection, default model, cloud provider management
- `pages/mcp-manager.tsx` — MCP server list, add (stdio/http), env vars, test & discover tools, enable/disable
- `pages/history.tsx` — Generation history list with delete
- `pages/history-detail.tsx` — Single generation detail view

## API Routes

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/models` | List all available models (Ollama + cloud) |
| GET | `/api/settings` | Get provider settings |
| PUT | `/api/settings` | Update Ollama URL, default model, cloud providers |
| POST | `/api/settings/test-ollama` | Test Ollama connectivity |
| GET | `/api/mcp-servers` | List MCP servers |
| POST | `/api/mcp-servers` | Add MCP server |
| PUT | `/api/mcp-servers/:id` | Update MCP server |
| DELETE | `/api/mcp-servers/:id` | Delete MCP server |
| POST | `/api/mcp-servers/:id/test` | Connect & discover tools |
| GET | `/api/mcp-tools` | All tools from enabled servers |
| POST | `/api/generate/stream` | SSE streaming generation |
| GET | `/api/generations` | List history |
| GET | `/api/generations/:id` | Get single generation |
| DELETE | `/api/generations/:id` | Delete generation |

## Key Features

1. **Ollama-native**: Auto-discovers local models from any Ollama instance. URL configurable in Settings.
2. **Cloud providers**: Add any OpenAI-compatible endpoint (OpenAI, Together AI, OpenRouter, etc.) with API key and model list.
3. **Streaming generation**: Real-time SSE streaming with live cursor, saves completed result to DB.
4. **Model selector**: Per-request model picker in every generation form, persists in localStorage.
5. **MCP Servers**: Add stdio (process) or HTTP MCP servers. Test & discover tools. Enabled servers' tools are auto-injected as context into every generation.
6. **Modes**: Create Persona, Refactor Prompt, Template Builder — all with streaming + model selection.
7. **History**: Full generation history with input parameters, model used, and result.

## Running

The `Start application` workflow runs `npm run dev` which starts both the Express backend and Vite frontend on port 5000.

Database schema is managed with `npm run db:push`.
