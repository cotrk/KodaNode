import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api, generateStreamSchema, assistantChatSchema, importMarkdownSchema, insertCollectionSchema, updateCollectionSchema } from "@shared/routes";
import { updateProviderSettingsSchema, updateGenerationSchema } from "@shared/schema";
import { z } from "zod";
import { streamGenerate, listModels, testOllama, generateText } from "./ai-provider";
import { discoverToolsStdio, discoverToolsHttp, buildMcpContext } from "./mcp-client";
import { insertMcpServerSchema } from "@shared/schema";

function buildPrompt(mode: "create" | "refactor" | "template", inputData: Record<string, string>, mcpContext: string) {
  const system =
    "You are THE PERSONA ARCHITECT — Master Prompt Engineer & AI Persona Specialist inside Prompt Vault. " +
    "Your expertise lies in crafting high-performance AI personas and refactoring prompts using cutting-edge " +
    "prompt engineering standards. Apply specificity, chain-of-thought reasoning, role-based framing, " +
    "output format specification, and constraint-based behavior control." + mcpContext;

  let user = "";
  if (mode === "create") {
    user = `Create a complete, production-ready AI persona prompt.\n\nRole/specialty: ${inputData.roleName}\nPurpose: ${inputData.purpose}\nTarget user: ${inputData.userProfile}\nCommunication style: ${inputData.communicationStyle}\nConstraints: ${inputData.constraints}\n\nStructure:\n# AI PERSONA: [ROLE NAME]\n## Role Definition\n## Core Responsibilities\n## Context & Background\n## Communication Style\n## Output Format\n## Operating Constraints\n**ALWAYS:** ...\n**NEVER:** ...\n## Decision Framework\n## Example Interactions\n---\n**Version:** 1.0 | **Best For:** [use case] | **Date:** ${new Date().toISOString().slice(0, 10)}`;
  } else if (mode === "refactor") {
    user = `Refactor this underperforming prompt.\n\nCurrent prompt:\n\`\`\`\n${inputData.currentPrompt}\n\`\`\`\nIssues: ${inputData.issues}\nImprovements wanted: ${inputData.improvements}\nTarget LLM: ${inputData.targetLlm || "Any"}\n\nProduce:\n1. The complete refactored prompt\n2. A before/after comparison table\n3. Explanation of key changes\n4. Performance notes`;
  } else {
    user = `Create a reusable prompt template.\n\nPersona type: ${inputData.personaType}\nVariables needed: ${inputData.variables}\nReusability requirements: ${inputData.reusability}\n\nProduce:\n1. Reusable template with [VARIABLE] placeholders\n2. Customization guide\n3. Three filled-in examples`;
  }
  return [{ role: "system", content: system }, { role: "user", content: user }];
}

async function getAssistantSystemPrompt() {
  const prompts = await storage.getPrompts();
  const starred = prompts.filter((p) => p.starred).length;
  const byMode = prompts.reduce<Record<string, number>>((a, p) => { a[p.mode] = (a[p.mode] ?? 0) + 1; return a; }, {});
  return `You are the built-in AI assistant for Prompt Vault, an AI prompt management library.\n\nLibrary: ${prompts.length} prompts total | ${starred} starred | Personas: ${byMode.create ?? 0} | Refactors: ${byMode.refactor ?? 0} | Templates: ${byMode.template ?? 0}\n\nHelp users name, tag, improve, and organize their prompts. Be concise and direct.`;
}

export async function registerRoutes(httpServer: Server, app: Express): Promise<Server> {

  // ─── Models ──────────────────────────────────────────────────────────────
  app.get(api.models.list.path, async (_req, res) => {
    try { res.json(await listModels()); } catch { res.json([]); }
  });

  // ─── Settings ────────────────────────────────────────────────────────────
  app.get(api.settings.get.path, async (_req, res) => {
    const s = await storage.getProviderSettings();
    res.json(s ?? { ollamaUrl: "http://localhost:11434", defaultModel: "llama3.2", defaultProvider: "ollama", assistantModel: "llama3.2", cloudProviders: [] });
  });

  app.put(api.settings.update.path, async (req, res) => {
    try { res.json(await storage.upsertProviderSettings(updateProviderSettingsSchema.parse(req.body))); }
    catch (e) {
      if (e instanceof z.ZodError) return res.status(400).json({ message: e.errors[0].message });
      console.error("Settings update error:", e);
      res.status(500).json({ message: e instanceof Error ? e.message : "Failed to update settings" });
    }
  });

  app.post(api.settings.testOllama.path, async (req, res) => {
    const { url } = req.body as { url: string };
    const ok = await testOllama(url);
    res.json({ ok, message: ok ? "Connected successfully" : "Could not reach Ollama at that URL" });
  });

  // ─── Collections ─────────────────────────────────────────────────────────
  app.get(api.collections.list.path, async (_req, res) => {
    res.json(await storage.getCollections());
  });

  app.post(api.collections.create.path, async (req, res) => {
    try { res.status(201).json(await storage.createCollection(insertCollectionSchema.parse(req.body))); }
    catch (e) { if (e instanceof z.ZodError) return res.status(400).json({ message: e.errors[0].message }); throw e; }
  });

  app.put(api.collections.update.path, async (req, res) => {
    const id = Number(req.params.id);
    try { res.json(await storage.updateCollection(id, updateCollectionSchema.parse(req.body))); }
    catch (e) { if (e instanceof z.ZodError) return res.status(400).json({ message: e.errors[0].message }); throw e; }
  });

  app.delete(api.collections.delete.path, async (req, res) => {
    await storage.deleteCollection(Number(req.params.id));
    res.status(204).end();
  });

  // ─── Prompts ─────────────────────────────────────────────────────────────
  app.get(api.prompts.list.path, async (req, res) => {
    const { search, mode, starred, tag, collectionId } = req.query as Record<string, string>;
    res.json(await storage.getPrompts({
      search: search || undefined,
      mode: mode || undefined,
      starred: starred === "true" ? true : undefined,
      tag: tag || undefined,
      collectionId: collectionId === "null" ? null : collectionId ? Number(collectionId) : undefined,
    }));
  });

  app.get(api.prompts.get.path, async (req, res) => {
    const p = await storage.getPrompt(Number(req.params.id));
    if (!p) return res.status(404).json({ message: "Prompt not found" });
    res.json(p);
  });

  app.put(api.prompts.update.path, async (req, res) => {
    const id = Number(req.params.id);
    const existing = await storage.getPrompt(id);
    if (!existing) return res.status(404).json({ message: "Not found" });
    try { res.json(await storage.updatePrompt(id, updateGenerationSchema.parse(req.body))); }
    catch (e) { if (e instanceof z.ZodError) return res.status(400).json({ message: e.errors[0].message }); throw e; }
  });

  app.delete(api.prompts.delete.path, async (req, res) => {
    const id = Number(req.params.id);
    if (!await storage.getPrompt(id)) return res.status(404).json({ message: "Not found" });
    await storage.deletePrompt(id);
    res.status(204).end();
  });

  app.post(api.prompts.toggleStar.path, async (req, res) => {
    try { res.json(await storage.toggleStar(Number(req.params.id))); }
    catch (e) { res.status(404).json({ message: (e as Error).message }); }
  });

  app.post(api.prompts.moveCollection.path, async (req, res) => {
    const id = Number(req.params.id);
    const { collectionId } = req.body as { collectionId: number | null };
    const existing = await storage.getPrompt(id);
    if (!existing) return res.status(404).json({ message: "Not found" });
    res.json(await storage.updatePrompt(id, { collectionId }));
  });

  app.post(api.prompts.autoTitle.path, async (req, res) => {
    const id = Number(req.params.id);
    const prompt = await storage.getPrompt(id);
    if (!prompt) return res.status(404).json({ message: "Not found" });
    try {
      const settings = await storage.getProviderSettings();
      const model = settings?.assistantModel ?? "llama3.2";
      const snippet = (prompt.result ?? "").slice(0, 600);
      const title = (await generateText(model, [
        { role: "system", content: "Respond with ONLY a title — 2-6 words, no quotes, no punctuation at end." },
        { role: "user", content: `Name this AI prompt:\n\n${snippet}` },
      ])).trim().replace(/['"]/g, "").slice(0, 80);
      await storage.updatePrompt(id, { title });
      res.json({ title });
    } catch (e) { res.status(500).json({ message: (e as Error).message }); }
  });

  app.post(api.prompts.autoTags.path, async (req, res) => {
    const id = Number(req.params.id);
    const prompt = await storage.getPrompt(id);
    if (!prompt) return res.status(404).json({ message: "Not found" });
    try {
      const settings = await storage.getProviderSettings();
      const model = settings?.assistantModel ?? "llama3.2";
      const snippet = (prompt.result ?? "").slice(0, 600);
      const raw = (await generateText(model, [
        { role: "system", content: 'Respond with ONLY a JSON array of 3-6 lowercase tags. Example: ["react","frontend","code-review"]' },
        { role: "user", content: `Suggest tags for:\n\n${snippet}` },
      ])).trim();
      const match = raw.match(/\[[\s\S]*\]/);
      const tags: string[] = match ? JSON.parse(match[0]) : [];
      await storage.updatePrompt(id, { tags: tags.slice(0, 6) });
      res.json({ tags });
    } catch (e) { res.status(500).json({ message: (e as Error).message }); }
  });

  // ─── Markdown Import ──────────────────────────────────────────────────────
  app.post(api.import.markdown.path, async (req, res) => {
    try {
      const { files, collectionId } = importMarkdownSchema.parse(req.body);
      const result = await storage.bulkImportMarkdown(files, collectionId);
      res.json(result);
    } catch (e) {
      if (e instanceof z.ZodError) return res.status(400).json({ message: e.errors[0].message });
      throw e;
    }
  });

  // ─── Markdown Export (single prompt) ─────────────────────────────────────
  app.get("/api/prompts/:id/export", async (req, res) => {
    const p = await storage.getPrompt(Number(req.params.id));
    if (!p) return res.status(404).json({ message: "Not found" });
    const frontmatter = [
      "---",
      `title: "${(p.title ?? "").replace(/"/g, '\\"')}"`,
      `tags: [${(p.tags ?? []).join(", ")}]`,
      `mode: ${p.mode}`,
      `starred: ${p.starred}`,
      `created: ${p.createdAt?.toISOString() ?? ""}`,
      "---",
      "",
    ].join("\n");
    const content = frontmatter + (p.result ?? "");
    res.setHeader("Content-Type", "text/markdown; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename="${encodeURIComponent(p.title ?? "prompt")}.md"`);
    res.send(content);
  });

  // ─── AI Assistant ─────────────────────────────────────────────────────────
  app.get(api.assistant.messages.path, async (_req, res) => res.json(await storage.getAssistantMessages()));
  app.delete(api.assistant.clear.path, async (_req, res) => { await storage.clearAssistantMessages(); res.status(204).end(); });

  app.post(api.assistant.chat.path, async (req, res) => {
    let input: z.infer<typeof assistantChatSchema>;
    try { input = assistantChatSchema.parse(req.body); }
    catch (e) { if (e instanceof z.ZodError) return res.status(400).json({ message: e.errors[0].message }); throw e; }
    const { message, promptContext, clearHistory } = input;
    if (clearHistory) await storage.clearAssistantMessages();
    await storage.addAssistantMessage("user", message);
    const history = await storage.getAssistantMessages();
    const systemPrompt = await getAssistantSystemPrompt();
    const messages = [
      { role: "system", content: systemPrompt + (promptContext ? `\n\nPrompt context:\n${promptContext}` : "") },
      ...history.map((m) => ({ role: m.role, content: m.content })),
    ];
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();
    const settings = await storage.getProviderSettings();
    const model = settings?.assistantModel ?? "llama3.2";
    const ollamaUrl = settings?.ollamaUrl ?? "http://localhost:11434";
    let fullResponse = "";
    try {
      const ollamaRes = await fetch(`${ollamaUrl}/api/chat`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model, messages, stream: true }),
      });
      if (!ollamaRes.ok) throw new Error(`Ollama error: ${await ollamaRes.text()}`);
      const reader = ollamaRes.body?.getReader();
      if (!reader) throw new Error("No response body");
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n"); buffer = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.trim()) continue;
          try {
            const json = JSON.parse(line) as { message?: { content?: string }; done?: boolean };
            if (json.message?.content) { fullResponse += json.message.content; res.write(`data: ${JSON.stringify({ content: json.message.content })}\n\n`); }
            if (json.done) { await storage.addAssistantMessage("assistant", fullResponse); res.write(`data: ${JSON.stringify({ done: true })}\n\n`); res.end(); return; }
          } catch { /* skip */ }
        }
      }
    } catch (e) { res.write(`data: ${JSON.stringify({ error: (e as Error).message })}\n\n`); res.end(); }
  });

  // ─── Generation Streaming ─────────────────────────────────────────────────
  app.post(api.generate.stream.path, async (req, res) => {
    let input: z.infer<typeof generateStreamSchema>;
    try { input = generateStreamSchema.parse(req.body); }
    catch (e) { if (e instanceof z.ZodError) return res.status(400).json({ message: e.errors[0].message }); throw e; }
    const { mode, inputData, model, provider, providerId } = input;
    const mcpContext = buildMcpContext(await storage.getEnabledMcpTools());
    const messages = buildPrompt(mode, inputData as Record<string, string>, mcpContext);
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.flushHeaders();
    let fullResult = "";
    try {
      for await (const chunk of streamGenerate(provider, model, messages, providerId)) {
        if (chunk.content) { fullResult += chunk.content; res.write(`data: ${JSON.stringify({ content: chunk.content })}\n\n`); }
        if (chunk.done) {
          const saved = await storage.createPrompt({ mode, inputData, result: fullResult, model, provider, title: "Untitled Prompt", tags: [], starred: false });
          res.write(`data: ${JSON.stringify({ done: true, id: saved.id })}\n\n`); res.end(); return;
        }
      }
    } catch (e) { res.write(`data: ${JSON.stringify({ error: (e as Error).message })}\n\n`); res.end(); }
  });

  // ─── MCP Servers ─────────────────────────────────────────────────────────
  app.get(api.mcp.list.path, async (_req, res) => res.json(await storage.getMcpServers()));
  app.get(api.mcp.get.path, async (req, res) => {
    const s = await storage.getMcpServer(Number(req.params.id));
    if (!s) return res.status(404).json({ message: "Not found" });
    res.json(s);
  });
  app.post(api.mcp.create.path, async (req, res) => {
    try { res.status(201).json(await storage.createMcpServer(insertMcpServerSchema.parse(req.body))); }
    catch (e) { if (e instanceof z.ZodError) return res.status(400).json({ message: e.errors[0].message }); throw e; }
  });
  app.put(api.mcp.update.path, async (req, res) => {
    const id = Number(req.params.id);
    if (!await storage.getMcpServer(id)) return res.status(404).json({ message: "Not found" });
    res.json(await storage.updateMcpServer(id, req.body as Parameters<typeof storage.updateMcpServer>[1]));
  });
  app.delete(api.mcp.delete.path, async (req, res) => {
    const id = Number(req.params.id);
    if (!await storage.getMcpServer(id)) return res.status(404).json({ message: "Not found" });
    await storage.deleteMcpServer(id); res.status(204).end();
  });
  app.post(api.mcp.test.path, async (req, res) => {
    const id = Number(req.params.id);
    const server = await storage.getMcpServer(id);
    if (!server) return res.status(404).json({ message: "Not found" });
    try {
      const env = (server.envVars ?? {}) as Record<string, string>;
      let tools;
      if (server.type === "http" && server.url) tools = await discoverToolsHttp(server.url);
      else if (server.command) tools = await discoverToolsStdio(server.command, (server.args ?? []) as string[], env);
      else return res.json({ ok: false, tools: [], message: "No command or URL configured" });
      await storage.updateMcpServer(id, { discoveredTools: tools, lastTestedAt: new Date() });
      res.json({ ok: true, tools, message: `Discovered ${tools.length} tool(s)` });
    } catch (e) { res.json({ ok: false, tools: [], message: (e as Error).message }); }
  });
  app.get(api.mcp.allTools.path, async (_req, res) => res.json(await storage.getEnabledMcpTools()));

  return httpServer;
}
