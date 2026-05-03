import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";

const KEY = api.collections.list.path;

export function useCollections() {
  return useQuery({
    queryKey: [KEY],
    queryFn: async () => {
      const res = await fetch(KEY);
      if (!res.ok) throw new Error("Failed to fetch collections");
      return res.json() as Promise<Array<{ id: number; name: string; color: string; createdAt: string }>>;
    },
  });
}

export function useCreateCollection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: { name: string; color: string }) => {
      const res = await fetch(api.collections.create.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to create collection");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useUpdateCollection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: number; name?: string; color?: string }) => {
      const res = await fetch(buildUrl(api.collections.update.path, { id }), {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update collection");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [KEY] }),
  });
}

export function useDeleteCollection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(buildUrl(api.collections.delete.path, { id }), { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete collection");
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [KEY] });
      qc.invalidateQueries({ queryKey: [api.prompts.list.path] });
    },
  });
}

export function useMoveToCollection() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ promptId, collectionId }: { promptId: number; collectionId: number | null }) => {
      const res = await fetch(buildUrl(api.prompts.moveCollection.path, { id: promptId }), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ collectionId }),
      });
      if (!res.ok) throw new Error("Failed to move prompt");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [api.prompts.list.path] }),
  });
}

export function useImportMarkdown() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { files: Array<{ name: string; relativePath: string; content: string }>; collectionId?: number }) => {
      const res = await fetch(api.import.markdown.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Import failed");
      return res.json() as Promise<{ imported: number; skipped: number; errors: string[] }>;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [api.prompts.list.path] }),
  });
}
