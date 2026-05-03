import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";

const LIST_KEY = api.prompts.list.path;

export function usePrompts(filters?: { search?: string; mode?: string; starred?: boolean; tag?: string }) {
  const params = new URLSearchParams();
  if (filters?.search) params.set("search", filters.search);
  if (filters?.mode) params.set("mode", filters.mode);
  if (filters?.starred) params.set("starred", "true");
  if (filters?.tag) params.set("tag", filters.tag);
  const url = `${LIST_KEY}${params.toString() ? `?${params}` : ""}`;

  return useQuery({
    queryKey: [LIST_KEY, filters],
    queryFn: async () => {
      const res = await fetch(url);
      if (!res.ok) throw new Error("Failed to fetch prompts");
      return res.json() as Promise<Record<string, unknown>[]>;
    },
  });
}

export function usePrompt(id: number) {
  return useQuery({
    queryKey: [api.prompts.get.path, id],
    queryFn: async () => {
      if (!id) return null;
      const res = await fetch(buildUrl(api.prompts.get.path, { id }));
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch prompt");
      return res.json();
    },
    enabled: !!id,
  });
}

export function useUpdatePrompt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: number } & Record<string, unknown>) => {
      const res = await fetch(buildUrl(api.prompts.update.path, { id }), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update prompt");
      return res.json();
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: [LIST_KEY] });
      qc.invalidateQueries({ queryKey: [api.prompts.get.path, vars.id] });
    },
  });
}

export function useDeletePrompt() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(buildUrl(api.prompts.delete.path, { id }), { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete prompt");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [LIST_KEY] }),
  });
}

export function useToggleStar() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(buildUrl(api.prompts.toggleStar.path, { id }), { method: "POST" });
      if (!res.ok) throw new Error("Failed to toggle star");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [LIST_KEY] }),
  });
}

export function useAutoTitle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(buildUrl(api.prompts.autoTitle.path, { id }), { method: "POST" });
      if (!res.ok) throw new Error("Auto-title failed");
      return res.json() as Promise<{ title: string }>;
    },
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: [LIST_KEY] });
      qc.invalidateQueries({ queryKey: [api.prompts.get.path, id] });
    },
  });
}

export function useAutoTags() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(buildUrl(api.prompts.autoTags.path, { id }), { method: "POST" });
      if (!res.ok) throw new Error("Auto-tags failed");
      return res.json() as Promise<{ tags: string[] }>;
    },
    onSuccess: (_data, id) => {
      qc.invalidateQueries({ queryKey: [LIST_KEY] });
      qc.invalidateQueries({ queryKey: [api.prompts.get.path, id] });
    },
  });
}
