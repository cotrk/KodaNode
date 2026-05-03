# Prompt Vault — Agent Prompt Pack

This directory contains the specialist system prompts and modular knowledge base files for the Prompt Vault AI agent.

## Files

### System Prompts

| File | Purpose |
|---|---|
| `system-prompt.md` | Full specialist system prompt — comprehensive context, architecture, history, and guidance |
| `system-prompt-short.md` | Compact production version — fast loading, covers essentials, references KB files for detail |

### Knowledge Base (`kb/`)

Small, focused JSON files loaded on demand when the agent needs depth on a specific area.

| File | Contents |
|---|---|
| `kb/architecture.json` | Layer responsibilities, design principles, file map, feature addition order |
| `kb/schema-and-api.json` | Database table definitions, all API routes and methods |
| `kb/features.json` | Each feature described end-to-end with files, routes, and constraints |
| `kb/debug-guide.json` | Triage order, common issues with symptoms and fixes, commands |
| `kb/prompt-engineering.json` | Prompt structure templates, patterns, quality signals, iteration process |
| `kb/conventions.json` | Hard rules, naming conventions, patterns, state management approach |
| `kb/ai-and-mcp.json` | AI provider config, streaming, MCP server integration details |

## How to Use

### For a general agent session
Load `system-prompt-short.md` as the system prompt. It covers everything needed for most tasks and references the KB files for deeper lookups.

### For a deep technical session
Load `system-prompt.md` as the system prompt. This includes full architecture, file map, project history, and prompt engineering guidance inline.

### Loading KB files on demand
The short system prompt instructs the agent to load files from `prompts/kb/` when it needs deeper information. For example:
- User asks about database columns → load `kb/schema-and-api.json`
- User reports a bug → load `kb/debug-guide.json`
- User asks about a feature → load `kb/features.json`
- User asks about prompt design → load `kb/prompt-engineering.json`

## Keeping These Files Current

Update these files whenever:
- New features are added or removed
- Database schema changes
- New API routes are added
- Coding conventions change
- New AI providers are supported

Outdated context is worse than no context.
