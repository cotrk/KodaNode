import { db } from "./db";
import {
  generations, collections, assistantMessages, providerSettings, mcpServers,
  type Generation, type InsertGeneration, type UpdateGeneration,
  type Collection, type InsertCollection, type UpdateCollection,
  type AssistantMessage, type ProviderSettings, type UpdateProviderSettings,
  type McpServer, type InsertMcpServer, type McpTool,
} from "@shared/schema";
import { eq, desc, isNull } from "drizzle-orm";

export interface IStorage {
  getPrompts(opts?: { search?: string; mode?: string; starred?: boolean; tag?: string; collectionId?: number | null }): Promise<Generation[]>;
  getPrompt(id: number): Promise<Generation | undefined>;
  createPrompt(g: InsertGeneration): Promise<Generation>;
  updatePrompt(id: number, g: UpdateGeneration): Promise<Generation>;
  deletePrompt(id: number): Promise<void>;
  toggleStar(id: number): Promise<Generation>;
  getPromptBySourceFile(sourceFile: string): Promise<Generation | undefined>;
  bulkImportMarkdown(files: Array<{ name: string; relativePath: string; content: string }>, collectionId?: number): Promise<{ imported: number; skipped: number; errors: string[] }>;
  getCollections(): Promise<Collection[]>;
  createCollection(c: InsertCollection): Promise<Collection>;
  updateCollection(id: number, c: UpdateCollection): Promise<Collection>;
  deleteCollection(id: number): Promise<void>;
  getAssistantMessages(): Promise<AssistantMessage[]>;
  addAssistantMessage(role: string, content: string, promptId?: number): Promise<AssistantMessage>;
  clearAssistantMessages(): Promise<void>;
  getProviderSettings(): Promise<ProviderSettings | undefined>;
  upsertProviderSettings(s: UpdateProviderSettings): Promise<ProviderSettings>;
  getMcpServers(): Promise<McpServer[]>;
  getMcpServer(id: number): Promise<McpServer | undefined>;
  createMcpServer(s: InsertMcpServer): Promise<McpServer>;
  updateMcpServer(id: number, s: Partial<InsertMcpServer> & { discoveredTools?: McpTool[]; lastTestedAt?: Date }): Promise<McpServer>;
  deleteMcpServer(id: number): Promise<void>;
  getEnabledMcpTools(): Promise<McpTool[]>;
}

function parseFrontmatter(content: string): { metadata: Record<string, unknown>; body: string } {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!match) return { metadata: {}, body: content };
  const metadata: Record<string, unknown> = {};
  for (const line of match[1].split(/\r?\n/)) {
    const colonIdx = line.indexOf(":");
    if (colonIdx === -1) continue;
    const key = line.slice(0, colonIdx).trim();
    let value: unknown = line.slice(colonIdx + 1).trim();
    if (typeof value === "string" && value.startsWith("[") && value.endsWith("]")) {
      value = value.slice(1, -1).split(",").map((s) => s.trim().replace(/['"]/g, "")).filter(Boolean);
    } else if (value === "true") value = true;
    else if (value === "false") value = false;
    else if (typeof value === "string") value = value.replace(/^["']|["']$/g, "");
    if (key) metadata[key] = value;
  }
  return { metadata, body: match[2] };
}

function titleFromContent(content: string, filename: string): string {
  const h1 = content.match(/^#\s+(.+)$/m);
  if (h1) return h1[1].trim();
  return filename.replace(/\.md$/i, "").replace(/[-_]/g, " ").trim();
}

export class DatabaseStorage implements IStorage {
  async getPrompts(opts?: { search?: string; mode?: string; starred?: boolean; tag?: string; collectionId?: number | null }) {
    const all = await db.select().from(generations).orderBy(desc(generations.createdAt));
    return all.filter((g) => {
      if (opts?.mode && g.mode !== opts.mode) return false;
      if (opts?.starred && !g.starred) return false;
      if (opts?.tag && !(g.tags ?? []).includes(opts.tag)) return false;
      if (opts?.collectionId !== undefined) {
        if (opts.collectionId === null) { if (g.collectionId !== null) return false; }
        else if (g.collectionId !== opts.collectionId) return false;
      }
      if (opts?.search) {
        const q = opts.search.toLowerCase();
        const inTitle = g.title?.toLowerCase().includes(q);
        const inResult = g.result?.toLowerCase().includes(q);
        const inTags = (g.tags ?? []).some((t) => t.toLowerCase().includes(q));
        if (!inTitle && !inResult && !inTags) return false;
      }
      return true;
    });
  }

  async getPrompt(id: number) {
    const [g] = await db.select().from(generations).where(eq(generations.id, id));
    return g;
  }

  async createPrompt(g: InsertGeneration) {
    const [created] = await db.insert(generations).values(g).returning();
    return created;
  }

  async updatePrompt(id: number, g: UpdateGeneration) {
    const [updated] = await db.update(generations).set({ ...g, updatedAt: new Date() }).where(eq(generations.id, id)).returning();
    return updated;
  }

  async deletePrompt(id: number) {
    await db.delete(generations).where(eq(generations.id, id));
  }

  async toggleStar(id: number) {
    const existing = await this.getPrompt(id);
    if (!existing) throw new Error("Prompt not found");
    const [updated] = await db.update(generations).set({ starred: !existing.starred, updatedAt: new Date() }).where(eq(generations.id, id)).returning();
    return updated;
  }

  async getPromptBySourceFile(sourceFile: string) {
    const [g] = await db.select().from(generations).where(eq(generations.sourceFile, sourceFile));
    return g;
  }

  async bulkImportMarkdown(files: Array<{ name: string; relativePath: string; content: string }>, collectionId?: number) {
    let imported = 0, skipped = 0;
    const errors: string[] = [];
    for (const file of files) {
      try {
        const existing = await this.getPromptBySourceFile(file.relativePath);
        if (existing) { skipped++; continue; }
        const { metadata, body } = parseFrontmatter(file.content);
        const title = String(metadata.title ?? titleFromContent(body, file.name));
        const tags = Array.isArray(metadata.tags) ? metadata.tags.map(String) : [];
        const starred = Boolean(metadata.starred ?? false);
        const mode = String(metadata.mode ?? "create");
        await this.createPrompt({
          title,
          mode,
          inputData: { imported: true, sourceFile: file.relativePath },
          result: body,
          tags,
          starred,
          notes: "",
          collectionId: collectionId ?? (typeof metadata.collectionId === "number" ? metadata.collectionId : null),
          sourceFile: file.relativePath,
        });
        imported++;
      } catch (e) {
        errors.push(`${file.name}: ${(e as Error).message}`);
      }
    }
    return { imported, skipped, errors };
  }

  async getCollections() {
    return db.select().from(collections).orderBy(collections.name);
  }

  async createCollection(c: InsertCollection) {
    const [created] = await db.insert(collections).values(c).returning();
    return created;
  }

  async updateCollection(id: number, c: UpdateCollection) {
    const [updated] = await db.update(collections).set(c).where(eq(collections.id, id)).returning();
    return updated;
  }

  async deleteCollection(id: number) {
    await db.update(generations).set({ collectionId: null }).where(eq(generations.collectionId, id));
    await db.delete(collections).where(eq(collections.id, id));
  }

  async getAssistantMessages() {
    return db.select().from(assistantMessages).orderBy(assistantMessages.createdAt);
  }

  async addAssistantMessage(role: string, content: string, promptId?: number) {
    const [msg] = await db.insert(assistantMessages).values({ role, content, promptId: promptId ?? null }).returning();
    return msg;
  }

  async clearAssistantMessages() {
    await db.delete(assistantMessages);
  }

  async getProviderSettings() {
    const [s] = await db.select().from(providerSettings).limit(1);
    return s;
  }

  async upsertProviderSettings(s: UpdateProviderSettings) {
    const existing = await this.getProviderSettings();
    if (existing) {
      const [updated] = await db.update(providerSettings).set({ ...s, updatedAt: new Date() }).where(eq(providerSettings.id, existing.id)).returning();
      return updated;
    }
    const [created] = await db.insert(providerSettings).values({ ...s }).returning();
    return created;
  }

  async getMcpServers() {
    return db.select().from(mcpServers).orderBy(mcpServers.createdAt);
  }

  async getMcpServer(id: number) {
    const [s] = await db.select().from(mcpServers).where(eq(mcpServers.id, id));
    return s;
  }

  async createMcpServer(s: InsertMcpServer) {
    const [created] = await db.insert(mcpServers).values(s).returning();
    return created;
  }

  async updateMcpServer(id: number, s: Partial<InsertMcpServer> & { discoveredTools?: McpTool[]; lastTestedAt?: Date }) {
    const [updated] = await db.update(mcpServers).set(s as Record<string, unknown>).where(eq(mcpServers.id, id)).returning();
    return updated;
  }

  async deleteMcpServer(id: number) {
    await db.delete(mcpServers).where(eq(mcpServers.id, id));
  }

  async getEnabledMcpTools(): Promise<McpTool[]> {
    const servers = await db.select().from(mcpServers).where(eq(mcpServers.enabled, true));
    return servers.flatMap((s) => (s.discoveredTools ?? []) as McpTool[]);
  }
}

export const storage = new DatabaseStorage();
