import { useSelectedModel, useModels } from "@/hooks/use-settings";
import { ChevronDown, Cpu, Cloud, RefreshCw } from "lucide-react";
import { useState, useRef, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";

export function ModelSelector() {
  const { selectedModel, selectedProvider, setSelectedModel, models } = useSelectedModel();
  const { isLoading, refetch } = useModels();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const grouped = models.reduce<Record<string, typeof models>>((acc, m) => {
    const key = m.provider;
    if (!acc[key]) acc[key] = [];
    acc[key].push(m);
    return acc;
  }, {});

  const current = models.find((m) => m.id === selectedModel);
  const displayName = current?.name ?? selectedModel ?? "Select model…";
  const isOllama = (current?.provider ?? selectedProvider) === "ollama";

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        data-testid="button-model-selector"
        className="flex items-center gap-2 px-3 py-2 rounded-xl glass-input text-sm font-medium text-foreground min-w-[200px] justify-between"
      >
        <span className="flex items-center gap-2 truncate">
          {isOllama ? (
            <Cpu className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <Cloud className="w-4 h-4 text-blue-400 shrink-0" />
          )}
          <span className="truncate">{displayName}</span>
        </span>
        <ChevronDown className={`w-4 h-4 text-muted-foreground shrink-0 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 w-72 glass-panel rounded-xl border border-border/60 shadow-2xl overflow-hidden">
          <div className="flex items-center justify-between px-3 py-2 border-b border-border/50">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Available Models</span>
            <button
              type="button"
              onClick={() => {
                qc.invalidateQueries({ queryKey: [api.models.list.path] });
                refetch();
              }}
              className="p-1 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
              title="Refresh models"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            </button>
          </div>

          <div className="max-h-72 overflow-y-auto custom-scrollbar">
            {models.length === 0 ? (
              <div className="px-4 py-6 text-center">
                <Cpu className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No models found.</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Start Ollama locally or add a cloud provider in Settings.
                </p>
              </div>
            ) : (
              Object.entries(grouped).map(([providerName, providerModels]) => (
                <div key={providerName}>
                  <div className="px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-widest bg-secondary/30 border-b border-border/30 flex items-center gap-1.5">
                    {providerName === "ollama" ? (
                      <Cpu className="w-3 h-3 text-emerald-400" />
                    ) : (
                      <Cloud className="w-3 h-3 text-blue-400" />
                    )}
                    {providerName}
                  </div>
                  {providerModels.map((m) => (
                    <button
                      key={m.id}
                      type="button"
                      data-testid={`button-model-${m.id}`}
                      onClick={() => {
                        setSelectedModel(m.id, m.provider);
                        setOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 text-sm transition-colors flex items-center gap-2 ${
                        m.id === selectedModel
                          ? "bg-primary/15 text-primary font-medium"
                          : "text-foreground/80 hover:bg-secondary hover:text-foreground"
                      }`}
                    >
                      <span className="truncate">{m.name}</span>
                      {m.id === selectedModel && (
                        <span className="ml-auto text-xs text-primary">active</span>
                      )}
                    </button>
                  ))}
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
