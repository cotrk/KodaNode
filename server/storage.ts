import { db } from "./db";
import {
  generations,
  providerSettings,
  mcpServers,
  type Generation,
  type InsertGeneration,
  type ProviderSettings,
  type UpdateProviderSettings,
  type McpServer,
  type InsertMcpServer,
  type McpTool,
} from "@shared/schema";
import { eq, desc } from "drizzle-orm";

export interface IStorage {
  // Generations
  getGenerations(): Promise<Generation[]>;
  getGeneration(id: number): Promise<Generation | undefined>;
  createGeneration(g: InsertGeneration): Promise<Generation>;
  deleteGeneration(id: number): Promise<void>;
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
  async getGenerations() {
    return db.select().from(generations).orderBy(desc(generations.createdAt));
  }
  async getGeneration(id: number) {
    const [g] = await db.select().from(generations).where(eq(generations.id, id));
    return g;
  }
  async createGeneration(g: InsertGeneration) {
    const [created] = await db.insert(generations).values(g).returning();
    return created;
  }
  async deleteGeneration(id: number) {
    await db.delete(generations).where(eq(generations.id, id));
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
    const servers = await db
      .select()
      .from(mcpServers)
      .where(eq(mcpServers.enabled, true));
    const tools: McpTool[] = [];
    for (const s of servers) {
      const discovered = (s.discoveredTools ?? []) as McpTool[];
      tools.push(...discovered);
    }
    return tools;
  }
}

export const storage = new DatabaseStorage();
