import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api, generateStreamSchema } from "@shared/routes";
import { insertMcpServerSchema, updateProviderSettingsSchema } from "@shared/schema";
import { z } from "zod";
import { streamGenerate, listModels, testOllama } from "./ai-provider";
import { discoverToolsStdio, discoverToolsHttp, buildMcpContext } from "./mcp-client";

function buildPrompt(
  mode: "create" | "refactor" | "template",
  inputData: Record<string, string>,
  mcpContext: string
): Array<{ role: string; content: string }> {
  const system =
    "You are THE PERSONA ARCHITECT - Master Prompt Engineer & AI Persona Specialist. " +
    "Your expertise lies in crafting high-performance AI personas and refactoring existing prompts " +
    "using cutting-edge prompt engineering standards. Apply specificity, chain-of-thought reasoning, " +
    "role-based framing, output format specification, and constraint-based behavior control." +
    mcpContext;

  let user = "";
  if (mode === "create") {
    user = `MODE 1: Create New Persona
Role/specialty name: ${inputData.roleName}
Primary function/purpose: ${inputData.purpose}
Target user profile: ${inputData.userProfile}
Desired communication style: ${inputData.communicationStyle}
Key constraints or requirements: ${inputData.constraints}

Produce a complete, production-ready persona prompt following this structure:
# AI PERSONA: [ROLE NAME]
## Role Definition
## Core Responsibilities
## Context & Background
**Domain Knowledge:** ...
**User Profile:** ...
## Communication Style
**Tone:** | **Approach:** | **Language Level:**
## Output Format
## Operating Constraints
**ALWAYS:** - ...
**NEVER:** - ...
## Decision Framework
## Example Interactions
---
**Version:** 1.0 | **Best For:** [use case] | **Created:** ${new Date().toISOString().slice(0, 10)}`;
  } else if (mode === "refactor") {
    user = `MODE 2: Refactor Existing Prompt
Current prompt:
\`\`\`
${inputData.currentPrompt}
\`\`\`
Observed issues: ${inputData.issues}
Desired improvements: ${inputData.improvements}
Target LLM: ${inputData.targetLlm || "Any"}

Produce:
1. The refactored prompt (clearly marked)
2. A before/after comparison table
3. Explanation of key changes
4. Performance optimization notes`;
  } else {
    user = `MODE 3: Template Creation
Persona type/category: ${inputData.personaType}
Variable customization needs: ${inputData.variables}
Reusability requirements: ${inputData.reusability}

Produce:
1. A reusable prompt template with [VARIABLE] placeholders
2. Customization instructions for each variable
3. Three concrete use-case examples filled in with different values`;
  }

  return [
    { role: "system", content: system },
    { role: "user", content: user },
  ];
}

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {
  // ─── Models ──────────────────────────────────────────────────────────────
  app.get(api.models.list.path, async (_req, res) => {
    try {
      const models = await listModels();
      res.json(models);
    } catch {
      res.json([]);
    }
  });

  // ─── Settings ────────────────────────────────────────────────────────────
  app.get(api.settings.get.path, async (_req, res) => {
    const s = await storage.getProviderSettings();
    res.json(
      s ?? {
        ollamaUrl: "http://localhost:11434",
        defaultModel: "llama3.2",
        defaultProvider: "ollama",
        cloudProviders: [],
      }
    );
  });

  app.put(api.settings.update.path, async (req, res) => {
    try {
      const input = updateProviderSettingsSchema.parse(req.body);
      const s = await storage.upsertProviderSettings(input);
      res.json(s);
    } catch (e) {
      if (e instanceof z.ZodError) return res.status(400).json({ message: e.errors[0].message });
      throw e;
    }
  });

  app.post(api.settings.testOllama.path, async (req, res) => {
    const { url } = req.body as { url: string };
    const ok = await testOllama(url);
    res.json({ ok, message: ok ? "Connected successfully" : "Could not reach Ollama at that URL" });
  });

  // ─── MCP Servers ─────────────────────────────────────────────────────────
  app.get(api.mcp.list.path, async (_req, res) => {
    res.json(await storage.getMcpServers());
  });

  app.get(api.mcp.get.path, async (req, res) => {
    const s = await storage.getMcpServer(Number(req.params.id));
    if (!s) return res.status(404).json({ message: "MCP server not found" });
    res.json(s);
  });

  app.post(api.mcp.create.path, async (req, res) => {
    try {
      const input = insertMcpServerSchema.parse(req.body);
      const s = await storage.createMcpServer(input);
      res.status(201).json(s);
    } catch (e) {
      if (e instanceof z.ZodError) return res.status(400).json({ message: e.errors[0].message });
      throw e;
    }
  });

  app.put(api.mcp.update.path, async (req, res) => {
    const id = Number(req.params.id);
    const existing = await storage.getMcpServer(id);
    if (!existing) return res.status(404).json({ message: "MCP server not found" });
    const s = await storage.updateMcpServer(id, req.body as Parameters<typeof storage.updateMcpServer>[1]);
    res.json(s);
  });

  app.delete(api.mcp.delete.path, async (req, res) => {
    const id = Number(req.params.id);
    const existing = await storage.getMcpServer(id);
    if (!existing) return res.status(404).json({ message: "MCP server not found" });
    await storage.deleteMcpServer(id);
    res.status(204).end();
  });

  app.post(api.mcp.test.path, async (req, res) => {
    const id = Number(req.params.id);
    const server = await storage.getMcpServer(id);
    if (!server) return res.status(404).json({ message: "MCP server not found" });

    try {
      const env = (server.envVars ?? {}) as Record<string, string>;
      let tools;

      if (server.type === "http" && server.url) {
        tools = await discoverToolsHttp(server.url);
      } else if (server.command) {
        tools = await discoverToolsStdio(
          server.command,
          (server.args ?? []) as string[],
          env
        );
      } else {
        return res.json({ ok: false, tools: [], message: "Server has no command or URL configured" });
      }

      await storage.updateMcpServer(id, { discoveredTools: tools, lastTestedAt: new Date() });
      res.json({ ok: true, tools, message: `Discovered ${tools.length} tool(s)` });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      res.json({ ok: false, tools: [], message: msg });
    }
  });

  app.get(api.mcp.allTools.path, async (_req, res) => {
    res.json(await storage.getEnabledMcpTools());
  });

  // ─── Generations ─────────────────────────────────────────────────────────
  app.get(api.generations.list.path, async (_req, res) => {
    res.json(await storage.getGenerations());
  });

  app.get(api.generations.get.path, async (req, res) => {
    const g = await storage.getGeneration(Number(req.params.id));
    if (!g) return res.status(404).json({ message: "Generation not found" });
    res.json(g);
  });

  app.delete(api.generations.delete.path, async (req, res) => {
    const id = Number(req.params.id);
    const g = await storage.getGeneration(id);
    if (!g) return res.status(404).json({ message: "Generation not found" });
    await storage.deleteGeneration(id);
    res.status(204).end();
  });

  // ─── Streaming Generation ────────────────────────────────────────────────
  app.post(api.generations.stream.path, async (req, res) => {
    let input: z.infer<typeof generateStreamSchema>;
    try {
      input = generateStreamSchema.parse(req.body);
    } catch (e) {
      if (e instanceof z.ZodError)
        return res.status(400).json({ message: e.errors[0].message });
      throw e;
    }

    const { mode, inputData, model, provider, providerId } = input;

    // Get MCP tool context for all enabled servers
    const mcpTools = await storage.getEnabledMcpTools();
    const mcpContext = buildMcpContext(mcpTools);

    const messages = buildPrompt(
      mode,
      inputData as Record<string, string>,
      mcpContext
    );

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();

    let fullResult = "";
    try {
      for await (const chunk of streamGenerate(provider, model, messages, providerId)) {
        if (chunk.content) {
          fullResult += chunk.content;
          res.write(`data: ${JSON.stringify({ content: chunk.content })}\n\n`);
        }
        if (chunk.done) {
          // Save generation
          const saved = await storage.createGeneration({ mode, inputData, result: fullResult, model, provider });
          res.write(`data: ${JSON.stringify({ done: true, id: saved.id })}\n\n`);
          res.end();
          return;
        }
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Generation failed";
      console.error("Stream error:", e);
      res.write(`data: ${JSON.stringify({ error: msg })}\n\n`);
      res.end();
    }
  });

  return httpServer;
}
