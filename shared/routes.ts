import { z } from "zod";
import { insertMcpServerSchema, updateProviderSettingsSchema, updateGenerationSchema, insertCollectionSchema, updateCollectionSchema, importMarkdownSchema } from "./schema";

export const errorSchemas = {
  validation: z.object({ message: z.string(), field: z.string().optional() }),
  internal: z.object({ message: z.string() }),
  notFound: z.object({ message: z.string() }),
};

export const createPersonaSchema = z.object({
  roleName: z.string().min(1),
  purpose: z.string().min(1),
  userProfile: z.string().min(1),
  communicationStyle: z.string().min(1),
  constraints: z.string().min(1),
});

export const refactorPromptSchema = z.object({
  currentPrompt: z.string().min(1),
  issues: z.string().min(1),
  improvements: z.string().min(1),
  targetLlm: z.string().optional(),
});

export const createTemplateSchema = z.object({
  personaType: z.string().min(1),
  variables: z.string().min(1),
  reusability: z.string().min(1),
});

export const generateStreamSchema = z.object({
  mode: z.enum(["create", "refactor", "template"]),
  inputData: z.record(z.string(), z.any()),
  model: z.string().min(1),
  provider: z.string().min(1),
  providerId: z.string().optional(),
});

export const assistantChatSchema = z.object({
  message: z.string().min(1),
  promptContext: z.string().optional(),
  clearHistory: z.boolean().optional(),
});

export const api = {
  prompts: {
    list: { method: "GET" as const, path: "/api/prompts" as const },
    get: { method: "GET" as const, path: "/api/prompts/:id" as const },
    update: { method: "PUT" as const, path: "/api/prompts/:id" as const },
    delete: { method: "DELETE" as const, path: "/api/prompts/:id" as const },
    toggleStar: { method: "POST" as const, path: "/api/prompts/:id/star" as const },
    autoTitle: { method: "POST" as const, path: "/api/prompts/:id/auto-title" as const },
    autoTags: { method: "POST" as const, path: "/api/prompts/:id/auto-tags" as const },
    moveCollection: { method: "POST" as const, path: "/api/prompts/:id/collection" as const },
  },
  collections: {
    list: { method: "GET" as const, path: "/api/collections" as const },
    create: { method: "POST" as const, path: "/api/collections" as const },
    update: { method: "PUT" as const, path: "/api/collections/:id" as const },
    delete: { method: "DELETE" as const, path: "/api/collections/:id" as const },
  },
  import: {
    markdown: { method: "POST" as const, path: "/api/import/markdown" as const },
  },
  generate: {
    stream: { method: "POST" as const, path: "/api/generate/stream" as const },
  },
  assistant: {
    messages: { method: "GET" as const, path: "/api/assistant/messages" as const },
    chat: { method: "POST" as const, path: "/api/assistant/chat" as const },
    clear: { method: "DELETE" as const, path: "/api/assistant/messages" as const },
  },
  models: {
    list: { method: "GET" as const, path: "/api/models" as const },
  },
  settings: {
    get: { method: "GET" as const, path: "/api/settings" as const },
    update: { method: "PUT" as const, path: "/api/settings" as const },
    testOllama: { method: "POST" as const, path: "/api/settings/test-ollama" as const },
  },
  mcp: {
    list: { method: "GET" as const, path: "/api/mcp-servers" as const },
    get: { method: "GET" as const, path: "/api/mcp-servers/:id" as const },
    create: { method: "POST" as const, path: "/api/mcp-servers" as const },
    update: { method: "PUT" as const, path: "/api/mcp-servers/:id" as const },
    delete: { method: "DELETE" as const, path: "/api/mcp-servers/:id" as const },
    test: { method: "POST" as const, path: "/api/mcp-servers/:id/test" as const },
    allTools: { method: "GET" as const, path: "/api/mcp-tools" as const },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url = url.replace(`:${key}`, String(value));
    });
  }
  return url;
}

export { importMarkdownSchema, insertCollectionSchema, updateCollectionSchema };
