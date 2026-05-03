import { pgTable, serial, text, timestamp, jsonb, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const generations = pgTable("generations", {
  id: serial("id").primaryKey(),
  mode: text("mode").notNull(),
  inputData: jsonb("input_data").notNull(),
  result: text("result"),
  model: text("model"),
  provider: text("provider"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const providerSettings = pgTable("provider_settings", {
  id: serial("id").primaryKey(),
  ollamaUrl: text("ollama_url").notNull().default("http://localhost:11434"),
  defaultModel: text("default_model").notNull().default("llama3.2"),
  defaultProvider: text("default_provider").notNull().default("ollama"),
  cloudProviders: jsonb("cloud_providers").notNull().default([]),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const mcpServers = pgTable("mcp_servers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull().default("stdio"),
  command: text("command"),
  args: text("args").array().default([]),
  url: text("url"),
  envVars: jsonb("env_vars").notNull().default({}),
  enabled: boolean("enabled").notNull().default(true),
  discoveredTools: jsonb("discovered_tools").notNull().default([]),
  lastTestedAt: timestamp("last_tested_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertGenerationSchema = createInsertSchema(generations).omit({
  id: true,
  createdAt: true,
});

export const insertMcpServerSchema = createInsertSchema(mcpServers).omit({
  id: true,
  createdAt: true,
  discoveredTools: true,
  lastTestedAt: true,
});

export const updateProviderSettingsSchema = z.object({
  ollamaUrl: z.string().url().optional(),
  defaultModel: z.string().optional(),
  defaultProvider: z.string().optional(),
  cloudProviders: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        baseUrl: z.string(),
        apiKey: z.string(),
        models: z.array(z.string()),
      })
    )
    .optional(),
});

export type Generation = typeof generations.$inferSelect;
export type InsertGeneration = z.infer<typeof insertGenerationSchema>;

export type ProviderSettings = typeof providerSettings.$inferSelect;
export type UpdateProviderSettings = z.infer<typeof updateProviderSettingsSchema>;

export type McpServer = typeof mcpServers.$inferSelect;
export type InsertMcpServer = z.infer<typeof insertMcpServerSchema>;

export interface CloudProvider {
  id: string;
  name: string;
  baseUrl: string;
  apiKey: string;
  models: string[];
}

export interface McpTool {
  name: string;
  description?: string;
  inputSchema?: Record<string, unknown>;
}
