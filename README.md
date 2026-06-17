# Grimoire

A local-first AI Prompt Knowledge Base for Windows 11. Manage, catalog, and archive your AI prompt library with native markdown support, a split-pane editor, Ollama integration, collections, vault folder sync, and MCP tool support.

---

## Windows 11 Installation Guide

### Step 1 — Extract the downloaded file

Replit exports the project as a `.tar.gz` archive. **Do not** double-click it to open in Windows Explorer — this partially extracts it and the `.bat` files will be missing.

Use one of these methods instead:

**Option A — PowerShell (no extra software needed)**
1. Open the folder containing the downloaded file
2. Hold **Shift** and right-click an empty area → **Open PowerShell window here**
3. Run this command (replace the filename with yours):
   ```powershell
   tar -xzf ReplitExport-grimoire.tar.gz
   ```
4. A folder will appear with all the project files inside — move it wherever you like (e.g. `A:\Grimoire`)

**Option B — 7-Zip**
1. Install 7-Zip from [7-zip.org](https://www.7-zip.org) (free)
2. Right-click the `.tar.gz` file → **7-Zip → Extract Here**

---

### Step 2 — Prerequisites

Install these before running the `.bat` files:

| Requirement | Notes | Link |
|---|---|---|
| **Node.js v18+** | Choose the LTS version | [nodejs.org](https://nodejs.org/en/download) |
| **PostgreSQL database** | Free cloud options below | [neon.tech](https://neon.tech) or [supabase.com](https://supabase.com) |
| **Chrome or Edge** | Required for Vault folder sync | Pre-installed on Windows 11 |
| **Ollama** | Optional — for local AI | [ollama.com/download/windows](https://ollama.com/download/windows) |

> **Free PostgreSQL database**: Sign up at [neon.tech](https://neon.tech) (recommended) or [supabase.com](https://supabase.com). After creating a project, copy the **Connection String** — it looks like `postgresql://user:password@host/dbname`.

---

### Step 3 — Run install.bat (first time only)

Open the extracted folder. You will see these `.bat` files:

```
install.bat        ← Run this first, one time only
start.bat          ← Run this every day to launch the app
setup-ollama.bat   ← Optional: set up local AI
update.bat         ← Optional: update to the latest version
```

**Double-click `install.bat`** and follow the prompts. It will:
- Check that Node.js is installed
- Install all dependencies (`npm install`)
- Create a `.env` file in the same folder
- Open the `.env` file in Notepad automatically

> If Windows asks *"Do you want to allow this app to make changes?"* click **Yes**. If it shows a blue SmartScreen warning, click **More info → Run anyway** — this is normal for unsigned `.bat` files.

---

### Step 4 — Fill in your .env file

When Notepad opens with the `.env` file, replace the `DATABASE_URL` line with your real connection string:

```
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DATABASE
SESSION_SECRET=any-long-random-string-you-choose
```

**Example (Neon):**
```
DATABASE_URL=postgresql://alice:abc123@ep-cool-fog-123456.us-east-2.aws.neon.tech/neondb?sslmode=require
SESSION_SECRET=my-super-secret-key-change-this
```

Save the file (`Ctrl+S`) and close Notepad.

> `SESSION_SECRET` can be any string — just change it from the default. It keeps your session secure.

---

### Step 5 — (Optional) Set up local AI with Ollama

If you want to use the AI Assistant and prompt generation features with a local model:

**Double-click `setup-ollama.bat`**. It will:
1. Check if Ollama is installed (and offer to open the download page if not)
2. Start the Ollama server
3. Let you choose and download a model:

| Model | Size | Best for |
|---|---|---|
| `llama3.2` | 2 GB | General use — recommended starting point |
| `phi3` | 2 GB | Low-RAM systems, very fast |
| `mistral` | 4 GB | Code, reasoning, prompt engineering |
| `llama3.1` | 4 GB | More capable tasks |

After setup, open Grimoire → **AI Providers** in the sidebar → set Ollama URL to `http://localhost:11434` and select your model.

---

### Step 6 — Launch the app

**Double-click `start.bat`** every time you want to use Grimoire. It will:
- Load your `.env` configuration
- Sync the database schema automatically
- Start the server on `http://localhost:5000`
- Open your browser automatically after 3 seconds

> Keep the terminal window open while the app is running. Press **Ctrl+C** to stop the server.

---

### Updating

To pull the latest version, double-click **`update.bat`**. It will update the code (if you have git), refresh dependencies, and sync the database schema. Then run `start.bat` as normal.

---

## Troubleshooting

| Problem | Fix |
|---|---|
| `.bat` files not present after extraction | Re-extract using PowerShell `tar` or 7-Zip — do not use Windows Explorer's built-in extractor |
| Blue SmartScreen warning when running a `.bat` | Click **More info → Run anyway** — expected for unsigned scripts |
| `node` not found | Install Node.js from nodejs.org, restart PowerShell/terminal, then try again |
| `.env` file not created by `install.bat` | Create it manually — see Step 4 above. Make sure the file is named `.env` not `.env.txt` |
| Can't name a file `.env` in Windows | Open Notepad, paste the content, then **File → Save As** → set filename to `.env` and change *Save as type* to **All Files** |
| Database connection error on startup | Check your `DATABASE_URL` in `.env`. Make sure you copied the full connection string including password |
| App starts but shows a blank page | Wait a few seconds and refresh — Vite may still be compiling |
| AI Assistant not working | Make sure Ollama is running. Run `setup-ollama.bat` to start it |
| Vault folder feature not working | Use Chrome or Edge — this feature requires the File System Access API (not available in Firefox) |
| Port 5000 already in use | Another app is using port 5000. Close it or restart your PC, then try again |

---

## Features

1. **Prompt Library** — Browse, search, filter by mode / tags / collection / starred. Grid and list views.
2. **Markdown Editor** — Split-pane Edit / Split / Preview with auto-save and synchronized scroll.
3. **Collections** — Named, colored folder groups. Drag prompt cards onto collection names to move them.
4. **Vault Folder** — Connect any local folder (any drive letter). Auto-syncs new `.md` files every 30 seconds.
5. **Markdown Import/Export** — Import individual `.md` files or entire folder trees. Export with YAML frontmatter.
6. **AI Assistant** — Streaming chat powered by Ollama or any OpenAI-compatible cloud endpoint.
7. **Auto-name & Auto-tag** — AI-powered title and tag generation for any prompt.
8. **MCP Servers** — Connect Model Context Protocol tool servers; tools are injected into generation prompts.
9. **Cloud AI providers** — Any OpenAI-compatible endpoint (OpenAI, Anthropic, Gemini, etc.).

---

## Markdown Frontmatter Format

Exported prompts use YAML frontmatter:

```markdown
---
title: "My Prompt Title"
tags: [react, typescript, code-review]
mode: create
starred: true
created: 2024-01-15T10:30:00Z
---

Prompt content here...
```

---

## Developer Notes

**Stack:** React + Vite + TypeScript · Express.js · Drizzle ORM · PostgreSQL · Wouter · TanStack Query v5 · shadcn/ui · Framer Motion · Ollama / OpenAI SDK · MCP JSON-RPC 2.0 · File System Access API · IndexedDB

**Running in Replit:** The `Start application` workflow runs `npm run dev` (Express + Vite on port 5000). Schema is managed with `npm run db:push`.

**DB note:** The library table is physically named `generations` in PostgreSQL (legacy). Collections are in `collections`. `sourceFile` tracks import paths for duplicate prevention.

**File System Access API** requires Chrome or Edge. Does not work in Firefox or the Replit preview pane.
