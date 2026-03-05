import { z } from 'zod';
import { insertGenerationSchema, generations } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  internal: z.object({
    message: z.string(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
};

// Input schemas for each mode
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

export const api = {
  generations: {
    list: {
      method: 'GET' as const,
      path: '/api/generations' as const,
      responses: {
        200: z.array(z.custom<typeof generations.$inferSelect>()),
      },
    },
    get: {
      method: 'GET' as const,
      path: '/api/generations/:id' as const,
      responses: {
        200: z.custom<typeof generations.$inferSelect>(),
        404: errorSchemas.notFound,
      },
    },
    create: {
      method: 'POST' as const,
      path: '/api/generations' as const,
      input: z.object({
        mode: z.enum(['create', 'refactor', 'template']),
        inputData: z.record(z.string(), z.any()),
      }),
      responses: {
        201: z.custom<typeof generations.$inferSelect>(),
        400: errorSchemas.validation,
        500: errorSchemas.internal,
      },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/generations/:id' as const,
      responses: {
        204: z.void(),
        404: errorSchemas.notFound,
      },
    }
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}

export type GenerationResponse = z.infer<typeof api.generations.get.responses[200]>;
export type GenerationsListResponse = z.infer<typeof api.generations.list.responses[200]>;
