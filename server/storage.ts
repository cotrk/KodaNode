import { db } from "./db";
import {
  generations,
  assistantMessages,
  providerSettings,
  mcpServers,
  type Generation,
  type InsertGeneration,
  type UpdateGeneration,
  type AssistantMessage,
  type ProviderSettings,
  type UpdateProviderSettings,
  type McpServer,
  type InsertMcpServer,
  type McpTool,
} from "@shared/schema";
import { eq, desc, ilike, or, sql } from "drizzle-orm";

export interface IStorage {
  // Prompts (generations)
  getPrompts(opts?: { search?: string; mode?: string; starred?: boolean; tag?: string }): Promise<Generation[]>;
  getPrompt(id: number): Promise<Generation | undefined>;
  createPrompt(g: InsertGeneration): Promise<Generation>;
  updatePrompt(id: number, g: UpdateGeneration): Promise<Generation>;
  deletePrompt(id: number): Promise<void>;
  toggleStar(id: number): Promise<Generation>;
  // Assistant
  getAssistantMessages(): Promise<AssistantMessage[]>;
  addAssistantMessage(role: string, content: string, promptId?: number): Promise<AssistantMessage>;
  clearAssistantMessages(): Promise<void>;
  // Provider Settings
  getProviderSettings(): Promise<ProviderSettings | undefined>;
  upsertProviderSettings(s: UpdateProviderSettings): Promise<ProviderSettings>;
  // MCP Servers
  getMcpServers(): Promise<McpServer[]>;
  getMcpServer(id: number): Promise<McpServer | undefined>;
  createMcpServer(s: InsertMcpServer): Promise<McpServer>;
  updateMcpServer(id: number, s: Partial<InsertMcpServer> & { discoveredTools?: McpTool[]; lastTestedAt?: Date }): Promise<McpServer>;
  deleteMcpServer(id: number): Promise<void>;
  getEnabledMcpTools(): Promise<McpTool[]>;
}

export class DatabaseStorage implements IStorage {
  async getPrompts(opts?: { search?: string; mode?: string; starred?: boolean; tag?: string }) {
    let query = db.select().from(generations).orderBy(desc(generations.createdAt));
    const results = await query;

    return results.filter((g) => {
      if (opts?.mode && g.mode !== opts.mode) return false;
      if (opts?.starred && !g.starred) return false;
      if (opts?.tag && !(g.tags ?? []).includes(opts.tag)) return false;
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
    const [updated] = await db
      .update(generations)
      .set({ ...g, updatedAt: new Date() })
      .where(eq(generations.id, id))
      .returning();
    return updated;
  }

  async deletePrompt(id: number) {
    await db.delete(generations).where(eq(generations.id, id));
  }

  async toggleStar(id: number) {
    const existing = await this.getPrompt(id);
    if (!existing) throw new Error("Prompt not found");
    const [updated] = await db
      .update(generations)
      .set({ starred: !existing.starred, updatedAt: new Date() })
      .where(eq(generations.id, id))
      .returning();
    return updated;
  }

  async getAssistantMessages() {
    return db.select().from(assistantMessages).orderBy(assistantMessages.createdAt);
  }

  async addAssistantMessage(role: string, content: string, promptId?: number) {
    const [msg] = await db
      .insert(assistantMessages)
      .values({ role, content, promptId: promptId ?? null })
      .returning();
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
      const [updated] = await db
        .update(providerSettings)
        .set({ ...s, updatedAt: new Date() })
        .where(eq(providerSettings.id, existing.id))
        .returning();
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
    const [updated] = await db
      .update(mcpServers)
      .set(s as Record<string, unknown>)
      .where(eq(mcpServers.id, id))
      .returning();
    return updated;
  }

  async deleteMcpServer(id: number) {
    await db.delete(mcpServers).where(eq(mcpServers.id, id));
  }

  async getEnabledMcpTools(): Promise<McpTool[]> {
    const servers = await db.select().from(mcpServers).where(eq(mcpServers.enabled, true));
    const tools: McpTool[] = [];
    for (const s of servers) {
      tools.push(...((s.discoveredTools ?? []) as McpTool[]));
    }
    return tools;
  }
}

export const storage = new DatabaseStorage();
