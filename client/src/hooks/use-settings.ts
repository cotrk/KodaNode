import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { useState, useEffect } from "react";

export function useSettings() {
  return useQuery({
    queryKey: [api.settings.get.path],
    queryFn: async () => {
      const res = await fetch(api.settings.get.path);
      if (!res.ok) throw new Error("Failed to fetch settings");
      return res.json();
    },
  });
}

export function useUpdateSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Record<string, unknown>) => {
      const res = await fetch(api.settings.update.path, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || `Server error ${res.status}`);
      }
      return res.json();
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: [api.settings.get.path] }),
  });
}

export function useModels() {
  return useQuery({
    queryKey: [api.models.list.path],
    queryFn: async () => {
      const res = await fetch(api.models.list.path);
      if (!res.ok) return [];
      return res.json() as Promise<Array<{ id: string; name: string; provider: string; providerId?: string }>>;
    },
    staleTime: 30000,
  });
}

export function useTestOllama() {
  return useMutation({
    mutationFn: async (url: string) => {
      const res = await fetch(api.settings.testOllama.path, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      return res.json() as Promise<{ ok: boolean; message: string }>;
    },
  });
}

const MODEL_KEY = "pa_selected_model";
const PROVIDER_KEY = "pa_selected_provider";

export function useSelectedModel() {
  const { data: models } = useModels();
  const { data: settings } = useSettings();

  const [selectedModel, setSelectedModelState] = useState<string>(() => {
    return localStorage.getItem(MODEL_KEY) ?? "";
  });
  const [selectedProvider, setSelectedProviderState] = useState<string>(() => {
    return localStorage.getItem(PROVIDER_KEY) ?? "ollama";
  });

  // Initialise from settings once loaded
  useEffect(() => {
    if (!localStorage.getItem(MODEL_KEY) && settings?.defaultModel) {
      setSelectedModelState(settings.defaultModel);
      setSelectedProviderState(settings.defaultProvider ?? "ollama");
    }
  }, [settings]);

  // If current selection not in list, fall back to first available
  useEffect(() => {
    if (models && models.length > 0 && !models.find((m) => m.id === selectedModel)) {
      const first = models[0];
      setSelectedModelState(first.id);
      setSelectedProviderState(first.provider);
    }
  }, [models, selectedModel]);

  const setSelectedModel = (id: string, provider: string) => {
    setSelectedModelState(id);
    setSelectedProviderState(provider);
    localStorage.setItem(MODEL_KEY, id);
    localStorage.setItem(PROVIDER_KEY, provider);
  };

  return { selectedModel, selectedProvider, setSelectedModel, models: models ?? [] };
}
