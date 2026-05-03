import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";

export function useMcpServers() {
  return useQuery({
    queryKey: [api.mcp.list.path],
    queryFn: async () => {
      const res = await fetch(api.mcp.list.path);
      if (!res.ok) throw new Error("Failed to fetch MCP servers");
      return res.json();
    },
  });
}

export function useCreateMcpServer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch(api.mcp.create.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message ?? "Failed to create MCP server");
      }
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [api.mcp.list.path] }),
  });
}

export function useUpdateMcpServer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...data }: { id: number } & Record<string, unknown>) => {
      const url = buildUrl(api.mcp.update.path, { id });
      const res = await fetch(url, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update MCP server");
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [api.mcp.list.path] }),
  });
}

export function useDeleteMcpServer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.mcp.delete.path, { id });
      const res = await fetch(url, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to delete MCP server");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [api.mcp.list.path] }),
  });
}

export function useTestMcpServer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      const url = buildUrl(api.mcp.test.path, { id });
      const res = await fetch(url, { method: "POST" });
      if (!res.ok) throw new Error("Failed to test MCP server");
      return res.json() as Promise<{ ok: boolean; tools: unknown[]; message: string }>;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [api.mcp.list.path] }),
  });
}
