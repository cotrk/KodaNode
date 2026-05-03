import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createPersonaSchema } from "@shared/routes";
import { StreamingResult } from "@/components/streaming-result";
import { ModelSelector } from "@/components/model-selector";
import { useStreamGeneration } from "@/hooks/use-stream-generation";
import { useSelectedModel } from "@/hooks/use-settings";
import { Loader2, UserPlus, AlertCircle } from "lucide-react";
import { z } from "zod";
import { motion } from "framer-motion";

type FormData = z.infer<typeof createPersonaSchema>;

export default function CreatePersona() {
  const { generate, result, isStreaming, error, reset } = useStreamGeneration();
  const { selectedModel, selectedProvider } = useSelectedModel();

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(createPersonaSchema),
    defaultValues: { roleName: "", purpose: "", userProfile: "", communicationStyle: "", constraints: "" },
  });

  const onSubmit = async (data: FormData) => {
    reset();
    await generate({
      mode: "create",
      inputData: data as Record<string, unknown>,
      model: selectedModel,
      provider: selectedProvider,
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-4xl md:text-5xl font-sans font-bold text-gradient mb-4">Create New Persona</h1>
        <p className="text-lg text-muted-foreground mb-10 max-w-2xl">
          Design a highly specialized AI persona. Provide the role, context, and constraints to generate a robust system prompt.
        </p>
      </motion.div>

      <motion.form initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
        onSubmit={handleSubmit(onSubmit)}
        className="glass-panel rounded-3xl p-6 md:p-8 space-y-8 relative">

        {isStreaming && (
          <div className="absolute inset-0 bg-background/40 backdrop-blur-sm z-10 rounded-3xl flex flex-col items-center justify-center pointer-events-none">
            <Loader2 className="w-10 h-10 text-primary animate-spin mb-3" />
            <p className="text-base font-medium text-foreground animate-pulse">Architecting Persona…</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground/90 uppercase tracking-wide">Role Name</label>
            <input {...register("roleName")} data-testid="input-role-name"
              placeholder="e.g. Senior Frontend Engineer, Creative Writer"
              className="w-full px-4 py-3 rounded-xl glass-input text-foreground placeholder:text-muted-foreground/50" />
            {errors.roleName && <p className="text-destructive text-sm">{errors.roleName.message}</p>}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground/90 uppercase tracking-wide">Communication Style</label>
            <input {...register("communicationStyle")} data-testid="input-communication-style"
              placeholder="e.g. Professional, witty, concise"
              className="w-full px-4 py-3 rounded-xl glass-input text-foreground placeholder:text-muted-foreground/50" />
            {errors.communicationStyle && <p className="text-destructive text-sm">{errors.communicationStyle.message}</p>}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-foreground/90 uppercase tracking-wide">Primary Purpose</label>
          <textarea {...register("purpose")} data-testid="input-purpose"
            placeholder="What is this persona trying to achieve? What is their main goal?" rows={3}
            className="w-full px-4 py-3 rounded-xl glass-input text-foreground placeholder:text-muted-foreground/50 resize-y" />
          {errors.purpose && <p className="text-destructive text-sm">{errors.purpose.message}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-foreground/90 uppercase tracking-wide">Target User Profile</label>
          <textarea {...register("userProfile")} data-testid="input-user-profile"
            placeholder="Who is this persona interacting with? (e.g. Beginners learning to code)" rows={3}
            className="w-full px-4 py-3 rounded-xl glass-input text-foreground placeholder:text-muted-foreground/50 resize-y" />
          {errors.userProfile && <p className="text-destructive text-sm">{errors.userProfile.message}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-foreground/90 uppercase tracking-wide">Key Constraints</label>
          <textarea {...register("constraints")} data-testid="input-constraints"
            placeholder="What should this persona NEVER do? Formatting rules?" rows={3}
            className="w-full px-4 py-3 rounded-xl glass-input text-foreground placeholder:text-muted-foreground/50 resize-y" />
          {errors.constraints && <p className="text-destructive text-sm">{errors.constraints.message}</p>}
        </div>

        <div className="pt-4 flex flex-wrap items-center gap-3 justify-between">
          <ModelSelector />
          <button type="submit" disabled={isStreaming} data-testid="button-generate-persona"
            className="flex items-center gap-2 px-8 py-3.5 rounded-xl font-bold bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/40 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed disabled:transform-none">
            <UserPlus className="w-5 h-5" />
            Generate Persona
          </button>
        </div>
      </motion.form>

      {error && (
        <div className="mt-6 flex items-center gap-3 p-4 rounded-xl bg-destructive/10 border border-destructive/30 text-destructive">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p className="text-sm">{error}</p>
        </div>
      )}

      {(result || isStreaming) && <StreamingResult result={result} isStreaming={isStreaming} />}
    </div>
  );
}
