import { useState, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";

interface StreamOptions {
  mode: "create" | "refactor" | "template";
  inputData: Record<string, unknown>;
  model: string;
  provider: string;
  providerId?: string;
}

export function useStreamGeneration() {
  const [result, setResult] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [savedId, setSavedId] = useState<number | null>(null);
  const qc = useQueryClient();

  const generate = useCallback(async (opts: StreamOptions) => {
    setResult("");
    setError(null);
    setSavedId(null);
    setIsStreaming(true);

    try {
      const res = await fetch(api.generate.stream.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(opts),
      });
      if (!res.ok) {
        const data = await res.json() as { message?: string };
        throw new Error(data.message ?? "Generation failed");
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
            const event = JSON.parse(line.slice(6)) as { content?: string; done?: boolean; id?: number; error?: string };
            if (event.error) throw new Error(event.error);
            if (event.content) setResult((r) => r + event.content);
            if (event.done && event.id) {
              setSavedId(event.id);
              qc.invalidateQueries({ queryKey: [api.prompts.list.path] });
            }
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
    }
  }, [qc]);

  const reset = useCallback(() => {
    setResult("");
    setError(null);
    setSavedId(null);
    setIsStreaming(false);
  }, []);

  return { generate, result, isStreaming, error, savedId, reset };
}
