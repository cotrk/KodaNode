import { spawn } from "child_process";
import type { McpTool } from "@shared/schema";

// Minimal JSON-RPC 2.0 MCP client
// Discovers tools from stdio or HTTP MCP servers

async function sendJsonRpc(
  process_: ReturnType<typeof spawn>,
  method: string,
  params: Record<string, unknown> = {},
  id: number = 1
): Promise<unknown> {
  const request = JSON.stringify({ jsonrpc: "2.0", id, method, params }) + "\n";

  return new Promise((resolve, reject) => {
    let buffer = "";
    const timeout = setTimeout(() => reject(new Error("MCP request timeout")), 10000);

    const onData = (data: Buffer) => {
      buffer += data.toString();
      const lines = buffer.split("\n");
      buffer = lines.pop() ?? "";

      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const msg = JSON.parse(line) as { id?: number; result?: unknown; error?: { message: string } };
          if (msg.id === id) {
            clearTimeout(timeout);
            process_.stdout?.removeListener("data", onData);
            if (msg.error) reject(new Error(msg.error.message));
            else resolve(msg.result);
          }
        } catch {
          // not parseable yet, keep buffering
        }
      }
    };

    process_.stdout?.on("data", onData);
    process_.stdin?.write(request);
  });
}

export async function discoverToolsStdio(
  command: string,
  args: string[],
  env: Record<string, string>
): Promise<McpTool[]> {
  const proc = spawn(command, args, {
    env: { ...process.env, ...env },
    stdio: ["pipe", "pipe", "pipe"],
  });

  const errors: string[] = [];
  proc.stderr?.on("data", (d: Buffer) => errors.push(d.toString()));

  try {
    // Initialize handshake
    await sendJsonRpc(
      proc,
      "initialize",
      {
        protocolVersion: "2024-11-05",
        capabilities: {},
        clientInfo: { name: "persona-architect", version: "1.0.0" },
      },
      1
    );

    // List tools
    const result = (await sendJsonRpc(proc, "tools/list", {}, 2)) as {
      tools?: Array<{ name: string; description?: string; inputSchema?: Record<string, unknown> }>;
    };

    return (result?.tools ?? []).map((t) => ({
      name: t.name,
      description: t.description,
      inputSchema: t.inputSchema,
    }));
  } finally {
    proc.kill();
  }
}

export async function discoverToolsHttp(url: string): Promise<McpTool[]> {
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method: "tools/list", params: {} }),
    signal: AbortSignal.timeout(10000),
  });

  if (!res.ok) throw new Error(`HTTP MCP error: ${res.status} ${res.statusText}`);

  const data = (await res.json()) as { result?: { tools?: McpTool[] }; error?: { message: string } };
  if (data.error) throw new Error(data.error.message);
  return data.result?.tools ?? [];
}

export function buildMcpContext(tools: McpTool[]): string {
  if (!tools.length) return "";
  const lines = [
    "\n\n---",
    "## Available MCP Tools",
    "The following tools are available via the Model Context Protocol. Reference them in your persona design when they are relevant to the persona's workflow:\n",
  ];
  for (const t of tools) {
    lines.push(`### ${t.name}`);
    if (t.description) lines.push(t.description);
    if (t.inputSchema) {
      lines.push("```json");
      lines.push(JSON.stringify(t.inputSchema, null, 2));
      lines.push("```");
    }
    lines.push("");
  }
  return lines.join("\n");
}
