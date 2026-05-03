import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { refactorPromptSchema } from "@shared/routes";
import { StreamingResult } from "@/components/streaming-result";
import { ModelSelector } from "@/components/model-selector";
import { useStreamGeneration } from "@/hooks/use-stream-generation";
import { useSelectedModel } from "@/hooks/use-settings";
import { useAutoTitle, useAutoTags } from "@/hooks/use-prompts";
import { Loader2, Wand2, AlertCircle, Tag, Library } from "lucide-react";
import { z } from "zod";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "wouter";

type FormData = z.infer<typeof refactorPromptSchema>;

export default function RefactorPrompt() {
  const { generate, result, isStreaming, error, savedId, reset } = useStreamGeneration();
  const { selectedModel, selectedProvider } = useSelectedModel();
  const autoTitle = useAutoTitle();
  const autoTags = useAutoTags();

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(refactorPromptSchema),
    defaultValues: { currentPrompt: "", issues: "", improvements: "", targetLlm: "" },
  });

  const onSubmit = async (data: FormData) => {
    reset();
    await generate({ mode: "refactor", inputData: data as Record<string, unknown>, model: selectedModel, provider: selectedProvider });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-2 mb-3">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest px-2 py-0.5 rounded-md bg-secondary/60 border border-border/40">Create</span>
        </div>
        <h1 className="text-4xl md:text-5xl font-sans font-bold text-gradient mb-3">Refactor Prompt</h1>
        <p className="text-lg text-muted-foreground mb-8 max-w-2xl">
          Paste an underperforming prompt and describe what's going wrong. Your AI will rebuild it for maximum effectiveness.
        </p>
      </motion.div>

      <motion.form initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
        onSubmit={handleSubmit(onSubmit)} className="glass-panel rounded-3xl p-6 md:p-8 space-y-8 relative">
        {isStreaming && (
          <div className="absolute inset-0 bg-background/40 backdrop-blur-sm z-10 rounded-3xl flex flex-col items-center justify-center pointer-events-none">
            <Loader2 className="w-10 h-10 text-primary animate-spin mb-3" />
            <p className="text-base font-medium text-foreground animate-pulse">Refactoring Prompt…</p>
          </div>
        )}

        <div className="space-y-2">
          <label className="text-sm font-semibold text-foreground/90 uppercase tracking-wide">Current Prompt</label>
          <textarea {...register("currentPrompt")} data-testid="input-current-prompt"
            placeholder="Paste the exact prompt you are currently using…" rows={6}
            className="w-full px-4 py-3 rounded-xl glass-input font-mono text-sm text-foreground placeholder:text-muted-foreground/50 resize-y bg-[#0a0a0c]" />
          {errors.currentPrompt && <p className="text-destructive text-sm">{errors.currentPrompt.message}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground/90 uppercase tracking-wide">Observed Issues</label>
            <textarea {...register("issues")} data-testid="input-issues" rows={4}
              placeholder="What is going wrong? e.g. Too verbose, misses instructions."
              className="w-full px-4 py-3 rounded-xl glass-input text-foreground placeholder:text-muted-foreground/50 resize-y" />
            {errors.issues && <p className="text-destructive text-sm">{errors.issues.message}</p>}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground/90 uppercase tracking-wide">Desired Improvements</label>
            <textarea {...register("improvements")} data-testid="input-improvements" rows={4}
              placeholder="What do you want it to do instead?"
              className="w-full px-4 py-3 rounded-xl glass-input text-foreground placeholder:text-muted-foreground/50 resize-y" />
            {errors.improvements && <p className="text-destructive text-sm">{errors.improvements.message}</p>}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-foreground/90 uppercase tracking-wide flex items-center gap-2">
            Target LLM <span className="text-xs text-muted-foreground font-normal normal-case">(Optional)</span>
          </label>
          <input {...register("targetLlm")} data-testid="input-target-llm"
            placeholder="e.g. GPT-4o, Claude 3.7 Sonnet, Llama 3.3, Mistral Large"
            className="w-full md:w-1/2 px-4 py-3 rounded-xl glass-input text-foreground placeholder:text-muted-foreground/50" />
        </div>

        <div className="pt-2 flex flex-wrap items-center gap-3 justify-between">
          <ModelSelector />
          <button type="submit" disabled={isStreaming} data-testid="button-refactor"
            className="flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/40 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none">
            <Wand2 className="w-5 h-5" /> Refactor Magic
          </button>
        </div>
      </motion.form>

      {error && (
        <div className="mt-6 flex items-center gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive">
          <AlertCircle className="w-5 h-5 shrink-0" /><p className="text-sm">{error}</p>
        </div>
      )}

      <AnimatePresence>
        {savedId && !isStreaming && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
            className="mt-6 flex flex-wrap items-center gap-3 p-4 rounded-xl bg-secondary/50 border border-border/50">
            <span className="text-sm text-muted-foreground flex-1">Saved to your library.</span>
            <button onClick={() => autoTitle.mutate(savedId)} disabled={autoTitle.isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 border border-primary/20">
              {autoTitle.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Wand2 className="w-3 h-3" />} Auto-name
            </button>
            <button onClick={() => autoTags.mutate(savedId)} disabled={autoTags.isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-400 text-xs font-medium hover:bg-blue-500/20 border border-blue-500/20">
              {autoTags.isPending ? <Loader2 className="w-3 h-3 animate-spin" /> : <Tag className="w-3 h-3" />} Suggest tags
            </button>
            <Link href={`/library/${savedId}`}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary text-foreground text-xs font-medium hover:bg-secondary/80 border border-border/50">
              <Library className="w-3 h-3" /> View in Library
            </Link>
          </motion.div>
        )}
      </AnimatePresence>

      {(result || isStreaming) && <StreamingResult result={result} isStreaming={isStreaming} />}
    </div>
  );
}
