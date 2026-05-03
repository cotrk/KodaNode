import OpenAI from "openai";
import { storage } from "./storage";
import type { CloudProvider } from "@shared/schema";

export interface ModelInfo {
  id: string;
  name: string;
  provider: string;
  providerId?: string;
}

export interface StreamChunk {
  content: string;
  done: boolean;
}

async function getOllamaUrl(): Promise<string> {
  const settings = await storage.getProviderSettings();
  return settings?.ollamaUrl ?? "http://localhost:11434";
}

export async function listModels(): Promise<ModelInfo[]> {
  const models: ModelInfo[] = [];
  try {
    const ollamaUrl = await getOllamaUrl();
    const res = await fetch(`${ollamaUrl}/api/tags`, { signal: AbortSignal.timeout(5000) });
    if (res.ok) {
      const data = (await res.json()) as { models?: { name: string }[] };
      for (const m of data.models ?? []) {
        models.push({ id: m.name, name: m.name, provider: "ollama" });
      }
    }
  } catch { /* not reachable */ }

  try {
    const settings = await storage.getProviderSettings();
    const cloudProviders = (settings?.cloudProviders ?? []) as CloudProvider[];
    for (const cp of cloudProviders) {
      for (const modelId of cp.models) {
        models.push({ id: `${cp.id}::${modelId}`, name: modelId, provider: cp.name, providerId: cp.id });
      }
    }
  } catch { /* ignore */ }

  return models;
}

export async function testOllama(ollamaUrl: string): Promise<boolean> {
  try {
    const res = await fetch(`${ollamaUrl}/api/tags`, { signal: AbortSignal.timeout(5000) });
    return res.ok;
  } catch {
    return false;
  }
}

async function getCloudClient(provider: string, providerId?: string): Promise<{ client: OpenAI; modelName: string } | null> {
  const settings = await storage.getProviderSettings();
  const cloudProviders = (settings?.cloudProviders ?? []) as CloudProvider[];
  const cp = cloudProviders.find((p) => p.id === (providerId ?? provider));

  if (cp) {
    return { client: new OpenAI({ apiKey: cp.apiKey, baseURL: cp.baseUrl }), modelName: provider };
  }
  if (provider === "openai") {
    return {
      client: new OpenAI({
        apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
        baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
      }),
      modelName: provider,
    };
  }
  return null;
}

export async function* streamGenerate(
  provider: string,
  model: string,
  messages: Array<{ role: string; content: string }>,
  providerId?: string
): AsyncGenerator<StreamChunk> {
  if (provider === "ollama") {
    const ollamaUrl = await getOllamaUrl();
    const res = await fetch(`${ollamaUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model, messages, stream: true }),
    });
    if (!res.ok) throw new Error(`Ollama error: ${await res.text()}`);

    const reader = res.body?.getReader();
    if (!reader) throw new Error("No response body");
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";
      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const json = JSON.parse(line) as { message?: { content?: string }; done?: boolean };
          if (json.message?.content) yield { content: json.message.content, done: false };
          if (json.done) yield { content: "", done: true };
        } catch { /* skip */ }
      }
    }
    return;
  }

  const cloudInfo = await getCloudClient(provider, providerId);
  if (!cloudInfo) throw new Error(`Unknown provider: ${provider}`);

  const stream = await cloudInfo.client.chat.completions.create({
    model,
    messages: messages.map((m) => ({ role: m.role as "system" | "user" | "assistant", content: m.content })),
    stream: true,
    max_completion_tokens: 8192,
  });

  for await (const chunk of stream) {
    const content = chunk.choices[0]?.delta?.content ?? "";
    if (content) yield { content, done: false };
    if (chunk.choices[0]?.finish_reason) yield { content: "", done: true };
  }
}

export async function generateText(
  model: string,
  messages: Array<{ role: string; content: string }>,
  ollamaUrl?: string
): Promise<string> {
  const url = ollamaUrl ?? (await getOllamaUrl());
  const res = await fetch(`${url}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model, messages, stream: false }),
    signal: AbortSignal.timeout(30000),
  });
  if (!res.ok) throw new Error(`Ollama error: ${await res.text()}`);
  const data = (await res.json()) as { message?: { content?: string } };
  return data.message?.content ?? "";
}
