import { useState } from "react";
import { useMcpServers, useCreateMcpServer, useUpdateMcpServer, useDeleteMcpServer, useTestMcpServer } from "@/hooks/use-mcp";
import { Plus, Trash2, Play, CheckCircle, XCircle, Loader2, Wrench, ChevronDown, ChevronUp, Terminal, Globe, ToggleLeft, ToggleRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { McpTool } from "@shared/schema";

interface McpServerRow {
  id: number;
  name: string;
  type: string;
  command?: string | null;
  args?: string[] | null;
  url?: string | null;
  enabled: boolean;
  discoveredTools: McpTool[];
  lastTestedAt?: string | null;
  envVars?: Record<string, string>;
}

const emptyForm = { name: "", type: "stdio", command: "", args: "", url: "", envKey: "", envVal: "", envVars: {} as Record<string, string> };

export default function McpManager() {
  const { data: servers = [], isLoading } = useMcpServers();
  const createServer = useCreateMcpServer();
  const updateServer = useUpdateMcpServer();
  const deleteServer = useDeleteMcpServer();
  const testServer = useTestMcpServer();

  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [expanded, setExpanded] = useState<number | null>(null);
  const [testResults, setTestResults] = useState<Record<number, { ok: boolean; message: string }>>({});

  const handleAddEnvVar = () => {
    if (!form.envKey) return;
    setForm((f) => ({ ...f, envVars: { ...f.envVars, [f.envKey]: f.envVal }, envKey: "", envVal: "" }));
  };

  const handleRemoveEnvVar = (key: string) => {
    setForm((f) => {
      const copy = { ...f.envVars };
      delete copy[key];
      return { ...f, envVars: copy };
    });
  };

  const handleCreate = async () => {
    if (!form.name) return;
    const args = form.args ? form.args.split(" ").filter(Boolean) : [];
    await createServer.mutateAsync({
      name: form.name,
      type: form.type,
      command: form.command || null,
      args,
      url: form.url || null,
      envVars: form.envVars,
      enabled: true,
    });
    setForm(emptyForm);
    setShowAdd(false);
  };

  const handleTest = async (id: number) => {
    const r = await testServer.mutateAsync(id);
    setTestResults((p) => ({ ...p, [id]: { ok: r.ok, message: r.message } }));
  };

  const handleToggle = async (server: McpServerRow) => {
    await updateServer.mutateAsync({ id: server.id, enabled: !server.enabled });
  };

  if (isLoading) {
    return <div className="h-full flex items-center justify-center"><Loader2 className="w-8 h-8 text-primary animate-spin" /></div>;
  }

  const serverList = servers as McpServerRow[];

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center border border-border/50">
              <Wrench className="w-6 h-6 text-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-sans font-bold text-foreground">MCP Servers</h1>
              <p className="text-muted-foreground">Manage Model Context Protocol tool servers.</p>
            </div>
          </div>
          <button onClick={() => setShowAdd((v) => !v)} data-testid="button-add-mcp-server"
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors">
            <Plus className="w-4 h-4" /> Add Server
          </button>
        </div>
      </motion.div>

      {/* Info Banner */}
      <div className="mb-6 p-4 rounded-xl bg-blue-500/5 border border-blue-500/20 text-sm text-foreground/80">
        <strong className="text-blue-400">How it works:</strong> Add MCP servers below.
        Click <strong>Test &amp; Discover</strong> to connect and retrieve available tools.
        Enabled servers' tools are automatically included as context when generating prompts —
        the AI persona will know how to reference and describe those tools.
      </div>

      <AnimatePresence>
        {showAdd && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="glass-panel rounded-2xl p-6 mb-6 overflow-hidden">
            <h3 className="font-semibold text-foreground mb-4">New MCP Server</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground/70">Name</label>
                  <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    placeholder="filesystem" data-testid="input-mcp-name"
                    className="w-full px-3 py-2.5 rounded-xl glass-input text-sm text-foreground" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground/70">Type</label>
                  <select value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))}
                    className="w-full px-3 py-2.5 rounded-xl glass-input text-sm text-foreground bg-transparent">
                    <option value="stdio">stdio (local process)</option>
                    <option value="http">HTTP (remote server)</option>
                  </select>
                </div>
              </div>

              {form.type === "stdio" ? (
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-foreground/70 flex items-center gap-1">
                      <Terminal className="w-3 h-3" /> Command
                    </label>
                    <input value={form.command} onChange={(e) => setForm((f) => ({ ...f, command: e.target.value }))}
                      placeholder="npx" className="w-full px-3 py-2.5 rounded-xl glass-input text-sm font-mono text-foreground" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-foreground/70">Args (space-separated)</label>
                    <input value={form.args} onChange={(e) => setForm((f) => ({ ...f, args: e.target.value }))}
                      placeholder="-y @modelcontextprotocol/server-filesystem /path"
                      className="w-full px-3 py-2.5 rounded-xl glass-input text-sm font-mono text-foreground" />
                  </div>
                </div>
              ) : (
                <div className="space-y-1">
                  <label className="text-xs font-medium text-foreground/70 flex items-center gap-1">
                    <Globe className="w-3 h-3" /> URL
                  </label>
                  <input value={form.url} onChange={(e) => setForm((f) => ({ ...f, url: e.target.value }))}
                    placeholder="http://localhost:3000/mcp"
                    className="w-full px-3 py-2.5 rounded-xl glass-input text-sm font-mono text-foreground" />
                </div>
              )}

              {/* Env Vars */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-foreground/70">Environment Variables</label>
                <div className="flex gap-2">
                  <input value={form.envKey} onChange={(e) => setForm((f) => ({ ...f, envKey: e.target.value }))}
                    placeholder="KEY" className="w-32 px-3 py-2 rounded-lg glass-input text-sm font-mono text-foreground" />
                  <input value={form.envVal} onChange={(e) => setForm((f) => ({ ...f, envVal: e.target.value }))}
                    placeholder="value" className="flex-1 px-3 py-2 rounded-lg glass-input text-sm font-mono text-foreground" />
                  <button onClick={handleAddEnvVar} type="button"
                    className="px-3 py-2 rounded-lg bg-secondary border border-border/50 text-sm">Add</button>
                </div>
                {Object.entries(form.envVars).map(([k, v]) => (
                  <div key={k} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-background/40 border border-border/40 text-xs font-mono">
                    <span className="text-primary">{k}</span>=<span className="text-foreground/70 truncate">{v}</span>
                    <button onClick={() => handleRemoveEnvVar(k)} className="ml-auto text-muted-foreground hover:text-destructive"><Trash2 className="w-3 h-3" /></button>
                  </div>
                ))}
              </div>

              <div className="flex gap-2 pt-2">
                <button onClick={handleCreate} disabled={createServer.isPending}
                  className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold">
                  {createServer.isPending ? <Loader2 className="w-4 h-4 animate-spin inline mr-1" /> : null}Save Server
                </button>
                <button onClick={() => setShowAdd(false)} className="px-5 py-2.5 rounded-xl bg-secondary text-foreground text-sm font-medium">Cancel</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {serverList.length === 0 ? (
        <div className="text-center py-20 glass-panel rounded-2xl">
          <Wrench className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-40" />
          <h3 className="text-lg font-semibold text-foreground">No MCP servers yet</h3>
          <p className="text-muted-foreground mt-2 text-sm">Add a server to get started. Tool context will be injected into every generation.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {serverList.map((server) => {
            const tools = (server.discoveredTools ?? []) as McpTool[];
            const tr = testResults[server.id];
            const isTesting = testServer.isPending && testServer.variables === server.id;
            return (
              <motion.div key={server.id} layout className="glass-panel rounded-2xl overflow-hidden">
                <div className="flex items-center gap-3 p-4">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${server.type === "stdio" ? "bg-purple-500/10 text-purple-400" : "bg-blue-500/10 text-blue-400"}`}>
                    {server.type === "stdio" ? <Terminal className="w-4 h-4" /> : <Globe className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-foreground">{server.name}</span>
                      <span className="text-xs px-1.5 py-0.5 rounded bg-secondary text-muted-foreground">{server.type}</span>
                      {tools.length > 0 && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {tools.length} tool{tools.length !== 1 ? "s" : ""}
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate font-mono">
                      {server.command ? `${server.command} ${(server.args ?? []).join(" ")}` : server.url ?? ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button onClick={() => handleToggle(server)} title={server.enabled ? "Disable" : "Enable"}
                      className={`p-1.5 rounded-lg transition-colors ${server.enabled ? "text-emerald-400 hover:text-emerald-300" : "text-muted-foreground hover:text-foreground"}`}>
                      {server.enabled ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                    </button>
                    <button onClick={() => handleTest(server.id)} disabled={isTesting}
                      data-testid={`button-test-mcp-${server.id}`}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-secondary border border-border/50 text-xs font-medium hover:bg-secondary/80 transition-colors">
                      {isTesting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                      Test
                    </button>
                    <button onClick={() => setExpanded(expanded === server.id ? null : server.id)}
                      className="p-1.5 rounded-lg bg-secondary text-muted-foreground hover:text-foreground transition-colors">
                      {expanded === server.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                    <button onClick={() => deleteServer.mutate(server.id)}
                      className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {tr && (
                  <div className={`px-4 pb-3 flex items-center gap-2 text-sm ${tr.ok ? "text-emerald-400" : "text-destructive"}`}>
                    {tr.ok ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                    {tr.message}
                  </div>
                )}

                <AnimatePresence>
                  {expanded === server.id && tools.length > 0 && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-t border-border/40">
                      <div className="px-4 py-4">
                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">Discovered Tools</p>
                        <div className="space-y-2">
                          {tools.map((t) => (
                            <div key={t.name} className="px-3 py-2.5 rounded-lg bg-background/40 border border-border/40">
                              <span className="font-mono text-sm text-primary">{t.name}</span>
                              {t.description && <p className="text-xs text-muted-foreground mt-0.5">{t.description}</p>}
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
