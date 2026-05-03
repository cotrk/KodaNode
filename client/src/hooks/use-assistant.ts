import { useQuery, useMutation, useQueryClient, useIsMutating } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { useState, useCallback } from "react";

const MSG_KEY = api.assistant.messages.path;

export function useAssistantMessages() {
  return useQuery({
    queryKey: [MSG_KEY],
    queryFn: async () => {
      const res = await fetch(MSG_KEY);
      if (!res.ok) throw new Error("Failed to fetch messages");
      return res.json() as Promise<Array<{ id: number; role: string; content: string; createdAt: string }>>;
    },
  });
}

export function useClearAssistant() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await fetch(api.assistant.clear.path, { method: "DELETE" });
      if (!res.ok) throw new Error("Failed to clear messages");
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [MSG_KEY] }),
  });
}

export function useAssistantChat() {
  const qc = useQueryClient();
  const [streamingContent, setStreamingContent] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(async (message: string, promptContext?: string) => {
    setError(null);
    setStreamingContent("");
    setIsStreaming(true);

    try {
      const res = await fetch(api.assistant.chat.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, promptContext }),
      });

      if (!res.ok) {
        const data = await res.json() as { message?: string };
        throw new Error(data.message ?? "Chat failed");
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No response stream");
      const decoder = new TextDecoder();
      let buf = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buf += decoder.decode(value, { stream: true });
        const lines = buf.split("\n");
        buf = lines.pop() ?? "";
        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const event = JSON.parse(line.slice(6)) as { content?: string; done?: boolean; error?: string };
            if (event.error) throw new Error(event.error);
            if (event.content) setStreamingContent((s) => s + event.content);
            if (event.done) qc.invalidateQueries({ queryKey: [MSG_KEY] });
          } catch (e) {
            if (e instanceof SyntaxError) continue;
            throw e;
          }
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setIsStreaming(false);
      setStreamingContent("");
    }
  }, [qc]);

  return { sendMessage, streamingContent, isStreaming, error };
}
