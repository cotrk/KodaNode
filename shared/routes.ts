import { z } from "zod";
import { insertMcpServerSchema, updateProviderSettingsSchema } from "./schema";

export const errorSchemas = {
  validation: z.object({ message: z.string(), field: z.string().optional() }),
  internal: z.object({ message: z.string() }),
  notFound: z.object({ message: z.string() }),
};

export const createPersonaSchema = z.object({
  roleName: z.string().min(1, "Role/specialty name is required"),
  purpose: z.string().min(1, "Primary function/purpose is required"),
  userProfile: z.string().min(1, "Target user profile is required"),
  communicationStyle: z.string().min(1, "Desired communication style is required"),
  constraints: z.string().min(1, "Key constraints or requirements are required"),
});

export const refactorPromptSchema = z.object({
  currentPrompt: z.string().min(1, "Current prompt text is required"),
  issues: z.string().min(1, "Issues or limitations observed is required"),
  improvements: z.string().min(1, "Desired improvements are required"),
  targetLlm: z.string().optional(),
});

export const createTemplateSchema = z.object({
  personaType: z.string().min(1, "Persona type or category is required"),
  variables: z.string().min(1, "Variable customization needs are required"),
  reusability: z.string().min(1, "Reusability requirements are required"),
});

export const generateStreamSchema = z.object({
  mode: z.enum(["create", "refactor", "template"]),
  inputData: z.record(z.string(), z.any()),
  model: z.string().min(1),
  provider: z.string().min(1),
  providerId: z.string().optional(),
  temperature: z.number().min(0).max(2).optional(),
});

export const api = {
  generations: {
    list: {
      method: "GET" as const,
      path: "/api/generations" as const,
      responses: { 200: z.array(z.any()) },
    },
    get: {
      method: "GET" as const,
      path: "/api/generations/:id" as const,
      responses: { 200: z.any(), 404: errorSchemas.notFound },
    },
    delete: {
      method: "DELETE" as const,
      path: "/api/generations/:id" as const,
      responses: { 204: z.void(), 404: errorSchemas.notFound },
    },
    stream: {
      method: "POST" as const,
      path: "/api/generate/stream" as const,
      input: generateStreamSchema,
      responses: { 200: z.any(), 400: errorSchemas.validation, 500: errorSchemas.internal },
    },
  },
  models: {
    list: {
      method: "GET" as const,
      path: "/api/models" as const,
      responses: { 200: z.array(z.object({ id: z.string(), name: z.string(), provider: z.string(), providerId: z.string().optional() })) },
    },
  },
  settings: {
    get: {
      method: "GET" as const,
      path: "/api/settings" as const,
      responses: { 200: z.any() },
    },
    update: {
      method: "PUT" as const,
      path: "/api/settings" as const,
      input: updateProviderSettingsSchema,
      responses: { 200: z.any(), 400: errorSchemas.validation },
    },
    testOllama: {
      method: "POST" as const,
      path: "/api/settings/test-ollama" as const,
      input: z.object({ url: z.string().url() }),
      responses: { 200: z.object({ ok: z.boolean(), message: z.string() }) },
    },
  },
  mcp: {
    list: {
      method: "GET" as const,
      path: "/api/mcp-servers" as const,
      responses: { 200: z.array(z.any()) },
    },
    get: {
      method: "GET" as const,
      path: "/api/mcp-servers/:id" as const,
      responses: { 200: z.any(), 404: errorSchemas.notFound },
    },
    create: {
      method: "POST" as const,
      path: "/api/mcp-servers" as const,
      input: insertMcpServerSchema,
      responses: { 201: z.any(), 400: errorSchemas.validation },
    },
    update: {
      method: "PUT" as const,
      path: "/api/mcp-servers/:id" as const,
      input: insertMcpServerSchema.partial(),
      responses: { 200: z.any(), 404: errorSchemas.notFound },
    },
    delete: {
      method: "DELETE" as const,
      path: "/api/mcp-servers/:id" as const,
      responses: { 204: z.void(), 404: errorSchemas.notFound },
    },
    test: {
      method: "POST" as const,
      path: "/api/mcp-servers/:id/test" as const,
      responses: { 200: z.object({ ok: z.boolean(), tools: z.array(z.any()), message: z.string() }) },
    },
    allTools: {
      method: "GET" as const,
      path: "/api/mcp-tools" as const,
      responses: { 200: z.array(z.any()) },
    },
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
