import { pgTable, serial, text, timestamp, jsonb, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const collections = pgTable("collections", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  color: text("color").notNull().default("#8b5cf6"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const generations = pgTable("generations", {
  id: serial("id").primaryKey(),
  title: text("title").notNull().default("Untitled Prompt"),
  mode: text("mode").notNull(),
  category: text("category"),
  tags: text("tags").array().notNull().default([]),
  inputData: jsonb("input_data").notNull(),
  result: text("result"),
  notes: text("notes"),
  starred: boolean("starred").notNull().default(false),
  model: text("model"),
  provider: text("provider"),
  collectionId: integer("collection_id"),
  sourceFile: text("source_file"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const assistantMessages = pgTable("assistant_messages", {
  id: serial("id").primaryKey(),
  role: text("role").notNull(),
  content: text("content").notNull(),
  promptId: integer("prompt_id"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const providerSettings = pgTable("provider_settings", {
  id: serial("id").primaryKey(),
  ollamaUrl: text("ollama_url").notNull().default("http://localhost:11434"),
  defaultModel: text("default_model").notNull().default("llama3.2"),
  defaultProvider: text("default_provider").notNull().default("ollama"),
  assistantModel: text("assistant_model").notNull().default("llama3.2"),
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
  updatedAt: true,
});

export const updateGenerationSchema = z.object({
  title: z.string().min(1).optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().optional(),
  starred: z.boolean().optional(),
  category: z.string().optional(),
  result: z.string().optional(),
  collectionId: z.number().nullable().optional(),
});

export const insertCollectionSchema = createInsertSchema(collections).omit({ id: true, createdAt: true });
export const updateCollectionSchema = insertCollectionSchema.partial();

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
  assistantModel: z.string().optional(),
  cloudProviders: z
    .array(z.object({ id: z.string(), name: z.string(), baseUrl: z.string(), apiKey: z.string(), models: z.array(z.string()) }))
    .optional(),
});

export const importMarkdownSchema = z.object({
  files: z.array(z.object({
    name: z.string(),
    relativePath: z.string(),
    content: z.string(),
  })),
  collectionId: z.number().optional(),
});

export type Generation = typeof generations.$inferSelect;
export type InsertGeneration = z.infer<typeof insertGenerationSchema>;
export type UpdateGeneration = z.infer<typeof updateGenerationSchema>;

export type AssistantMessage = typeof assistantMessages.$inferSelect;

export type Collection = typeof collections.$inferSelect;
export type InsertCollection = z.infer<typeof insertCollectionSchema>;
export type UpdateCollection = z.infer<typeof updateCollectionSchema>;

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
