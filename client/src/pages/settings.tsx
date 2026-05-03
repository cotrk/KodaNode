import { useState } from "react";
import { useSettings, useUpdateSettings, useTestOllama } from "@/hooks/use-settings";
import { Settings as SettingsIcon, Plus, Trash2, CheckCircle, XCircle, Loader2, Server, Cloud, Cpu } from "lucide-react";
import { motion } from "framer-motion";
import type { CloudProvider } from "@shared/schema";

export default function Settings() {
  const { data: settings, isLoading } = useSettings();
  const updateSettings = useUpdateSettings();
  const testOllama = useTestOllama();

  const [ollamaUrl, setOllamaUrl] = useState("");
  const [defaultModel, setDefaultModel] = useState("");
  const [testResult, setTestResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [showAddCloud, setShowAddCloud] = useState(false);
  const [newCloud, setNewCloud] = useState({ name: "", baseUrl: "", apiKey: "", models: "" });
  const [savedMsg, setSavedMsg] = useState("");

  const effectiveUrl = ollamaUrl || settings?.ollamaUrl || "http://localhost:11434";
  const cloudProviders: CloudProvider[] = (settings?.cloudProviders ?? []) as CloudProvider[];

  const handleTestOllama = async () => {
    setTestResult(null);
    const r = await testOllama.mutateAsync(effectiveUrl);
    setTestResult(r);
  };

  const handleSaveOllama = async () => {
    await updateSettings.mutateAsync({
      ollamaUrl: effectiveUrl,
      defaultModel: defaultModel || settings?.defaultModel,
    });
    setSavedMsg("Saved!");
    setTimeout(() => setSavedMsg(""), 2000);
  };

  const handleAddCloud = async () => {
    if (!newCloud.name || !newCloud.baseUrl) return;
    const models = newCloud.models.split(",").map((m) => m.trim()).filter(Boolean);
    const cp: CloudProvider = {
      id: crypto.randomUUID(),
      name: newCloud.name,
      baseUrl: newCloud.baseUrl,
      apiKey: newCloud.apiKey,
      models,
    };
    await updateSettings.mutateAsync({ cloudProviders: [...cloudProviders, cp] });
    setNewCloud({ name: "", baseUrl: "", apiKey: "", models: "" });
    setShowAddCloud(false);
  };

  const handleRemoveCloud = async (id: string) => {
    await updateSettings.mutateAsync({ cloudProviders: cloudProviders.filter((p) => p.id !== id) });
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-10">
          <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center border border-border/50">
            <SettingsIcon className="w-6 h-6 text-foreground" />
          </div>
          <div>
            <h1 className="text-3xl font-sans font-bold text-foreground">AI Provider Settings</h1>
            <p className="text-muted-foreground">Configure Ollama and cloud AI providers.</p>
          </div>
        </div>
      </motion.div>

      {/* Ollama Section */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
        className="glass-panel rounded-2xl p-6 mb-6">
        <div className="flex items-center gap-2 mb-6">
          <Cpu className="w-5 h-5 text-emerald-400" />
          <h2 className="font-semibold text-lg text-foreground">Local Ollama</h2>
          <span className="ml-auto text-xs px-2 py-1 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Local</span>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground/80">Ollama URL</label>
            <div className="flex gap-2">
              <input
                value={ollamaUrl || settings?.ollamaUrl || ""}
                onChange={(e) => setOllamaUrl(e.target.value)}
                placeholder="http://localhost:11434"
                data-testid="input-ollama-url"
                className="flex-1 px-4 py-2.5 rounded-xl glass-input text-foreground placeholder:text-muted-foreground/50 text-sm"
              />
              <button
                onClick={handleTestOllama}
                disabled={testOllama.isPending}
                data-testid="button-test-ollama"
                className="px-4 py-2.5 rounded-xl bg-secondary border border-border/50 text-sm font-medium hover:bg-secondary/80 transition-colors flex items-center gap-2"
              >
                {testOllama.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Server className="w-4 h-4" />}
                Test
              </button>
            </div>
            {testResult && (
              <div className={`flex items-center gap-2 text-sm mt-2 ${testResult.ok ? "text-emerald-400" : "text-destructive"}`}>
                {testResult.ok ? <CheckCircle className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                {testResult.message}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground/80">Default Model</label>
            <input
              value={defaultModel || settings?.defaultModel || ""}
              onChange={(e) => setDefaultModel(e.target.value)}
              placeholder="llama3.2"
              data-testid="input-default-model"
              className="w-full px-4 py-2.5 rounded-xl glass-input text-foreground placeholder:text-muted-foreground/50 text-sm"
            />
            <p className="text-xs text-muted-foreground">Used as fallback when no model is explicitly selected.</p>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              onClick={handleSaveOllama}
              disabled={updateSettings.isPending}
              data-testid="button-save-ollama"
              className="px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors flex items-center gap-2"
            >
              {updateSettings.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Save
            </button>
            {savedMsg && <span className="text-sm text-emerald-400 flex items-center gap-1"><CheckCircle className="w-4 h-4" />{savedMsg}</span>}
          </div>
        </div>
      </motion.div>

      {/* Cloud Providers */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
        className="glass-panel rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-6">
          <Cloud className="w-5 h-5 text-blue-400" />
          <h2 className="font-semibold text-lg text-foreground">Cloud Providers</h2>
          <button
            onClick={() => setShowAddCloud((v) => !v)}
            data-testid="button-add-cloud-provider"
            className="ml-auto flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20 text-sm font-medium hover:bg-primary/20 transition-colors"
          >
            <Plus className="w-4 h-4" /> Add Provider
          </button>
        </div>

        <p className="text-sm text-muted-foreground mb-4">
          Add any OpenAI-compatible API endpoint (OpenAI, Together AI, OpenRouter, Anthropic via proxy, etc.).
        </p>

        {showAddCloud && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
            className="bg-secondary/30 rounded-xl p-4 border border-border/50 mb-4 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground/70">Provider Name</label>
                <input value={newCloud.name} onChange={(e) => setNewCloud((p) => ({ ...p, name: e.target.value }))}
                  placeholder="OpenAI" className="w-full px-3 py-2 rounded-lg glass-input text-sm text-foreground" />
              </div>
              <div className="space-y-1">
                <label className="text-xs font-medium text-foreground/70">Base URL</label>
                <input value={newCloud.baseUrl} onChange={(e) => setNewCloud((p) => ({ ...p, baseUrl: e.target.value }))}
                  placeholder="https://api.openai.com/v1" className="w-full px-3 py-2 rounded-lg glass-input text-sm text-foreground" />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground/70">API Key</label>
              <input type="password" value={newCloud.apiKey} onChange={(e) => setNewCloud((p) => ({ ...p, apiKey: e.target.value }))}
                placeholder="sk-…" className="w-full px-3 py-2 rounded-lg glass-input text-sm text-foreground" />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-foreground/70">Models (comma-separated)</label>
              <input value={newCloud.models} onChange={(e) => setNewCloud((p) => ({ ...p, models: e.target.value }))}
                placeholder="gpt-4o, gpt-4o-mini, o1-mini" className="w-full px-3 py-2 rounded-lg glass-input text-sm text-foreground" />
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={handleAddCloud}
                className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium">Add</button>
              <button onClick={() => setShowAddCloud(false)}
                className="px-4 py-2 rounded-lg bg-secondary text-foreground text-sm font-medium">Cancel</button>
            </div>
          </motion.div>
        )}

        {cloudProviders.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground text-sm">
            No cloud providers configured yet.
          </div>
        ) : (
          <div className="space-y-3">
            {cloudProviders.map((cp) => (
              <div key={cp.id}
                className="flex items-center justify-between p-4 rounded-xl bg-secondary/30 border border-border/50">
                <div>
                  <div className="flex items-center gap-2">
                    <Cloud className="w-4 h-4 text-blue-400" />
                    <span className="font-medium text-foreground">{cp.name}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{cp.baseUrl}</p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {cp.models.map((m) => (
                      <span key={m} className="text-xs px-2 py-0.5 rounded-md bg-background/50 border border-border/50 text-foreground/70">{m}</span>
                    ))}
                  </div>
                </div>
                <button onClick={() => handleRemoveCloud(cp.id)}
                  className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors ml-4">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
