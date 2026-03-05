import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import { z } from "zod";

// Helper for safe parsing and logging
function parseWithLogging<T>(schema: z.ZodSchema<T>, data: unknown, label: string): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    console.error(`[Zod] ${label} validation failed:`, result.error.format());
    throw result.error;
  }
  return result.data;
}

export function useGenerations() {
  return useQuery({
    queryKey: [api.generations.list.path],
    queryFn: async () => {
      const res = await fetch(api.generations.list.path, { credentials: "include" });
      if (!res.ok) throw new Error('Failed to fetch generations');
      const data = await res.json();
      return parseWithLogging(api.generations.list.responses[200], data, "generations.list");
    },
  });
}

export function useGeneration(id: number) {
  return useQuery({
    queryKey: [api.generations.get.path, id],
    queryFn: async () => {
      if (!id) return null;
      const url = buildUrl(api.generations.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error('Failed to fetch generation');
      const data = await res.json();
      return parseWithLogging(api.generations.get.responses[200], data, "generations.get");
    },
    enabled: !!id,
  });
}

export function useCreateGeneration() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (input: z.infer<typeof api.generations.create.input>) => {
      const validated = api.generations.create.input.parse(input);
      const res = await fetch(api.generations.create.path, {
        method: api.generations.create.method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(validated),
        credentials: "include",
      });
      
      if (!res.ok) {
        if (res.status === 400) {
          const data = await res.json();
          const error = api.generations.create.responses[400].parse(data);
          throw new Error(error.message);
        }
        if (res.status === 500) {
          const data = await res.json();
          const error = api.generations.create.responses[500].parse(data);
          throw new Error(error.message);
        }
        throw new Error('Failed to generate prompt');
      }
      
      const data = await res.json();
      return parseWithLogging(api.generations.create.responses[201], data, "generations.create");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.generations.list.path] });
    },
  });
}

export function useDeleteGeneration() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.generations.delete.path, { id });
      const res = await fetch(url, { 
        method: api.generations.delete.method, 
        credentials: "include" 
      });
      
      if (res.status === 404) throw new Error('Generation not found');
      if (!res.ok) throw new Error('Failed to delete generation');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [api.generations.list.path] });
    },
  });
}
