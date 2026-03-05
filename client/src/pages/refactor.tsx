import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { refactorPromptSchema } from "@shared/routes";
import { useCreateGeneration } from "@/hooks/use-generations";
import { PromptResult } from "@/components/prompt-result";
import { Loader2, Wand2 } from "lucide-react";
import { z } from "zod";
import { motion } from "framer-motion";

type FormData = z.infer<typeof refactorPromptSchema>;

export default function RefactorPrompt() {
  const [result, setResult] = useState<string | null>(null);
  const { mutate, isPending } = useCreateGeneration();
  
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(refactorPromptSchema),
    defaultValues: {
      currentPrompt: "",
      issues: "",
      improvements: "",
      targetLlm: "",
    }
  });

  const onSubmit = (data: FormData) => {
    mutate({
      mode: "refactor",
      inputData: data,
    }, {
      onSuccess: (res) => {
        if (res.result) setResult(res.result);
      }
    });
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-4xl md:text-5xl font-display font-bold text-gradient mb-4">Refactor Prompt</h1>
        <p className="text-lg text-muted-foreground mb-10 max-w-2xl">
          Paste an underperforming prompt. Describe what's going wrong, and let the Architect rebuild it for maximum effectiveness.
        </p>
      </motion.div>

      <motion.form 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        onSubmit={handleSubmit(onSubmit)} 
        className="glass-panel rounded-3xl p-6 md:p-8 space-y-8 relative"
      >
        {isPending && (
          <div className="absolute inset-0 bg-background/50 backdrop-blur-sm z-10 rounded-3xl flex flex-col items-center justify-center">
            <Loader2 className="w-12 h-12 text-primary animate-spin mb-4" />
            <p className="text-lg font-medium text-foreground animate-pulse">Refactoring Prompt...</p>
          </div>
        )}

        <div className="space-y-2">
          <label className="text-sm font-semibold text-foreground/90 uppercase tracking-wide">Current Prompt</label>
          <textarea 
            {...register("currentPrompt")}
            placeholder="Paste the exact prompt you are currently using..."
            rows={6}
            className="w-full px-4 py-3 rounded-xl glass-input font-mono text-sm text-foreground placeholder:text-muted-foreground/50 resize-y bg-[#0a0a0c]"
          />
          {errors.currentPrompt && <p className="text-destructive text-sm mt-1">{errors.currentPrompt.message}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground/90 uppercase tracking-wide">Observed Issues</label>
            <textarea 
              {...register("issues")}
              placeholder="What is going wrong? e.g. Too verbose, misses instructions, hallucinates."
              rows={4}
              className="w-full px-4 py-3 rounded-xl glass-input text-foreground placeholder:text-muted-foreground/50 resize-y"
            />
            {errors.issues && <p className="text-destructive text-sm mt-1">{errors.issues.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground/90 uppercase tracking-wide">Desired Improvements</label>
            <textarea 
              {...register("improvements")}
              placeholder="What do you want it to do instead? e.g. Output strictly JSON, be more concise."
              rows={4}
              className="w-full px-4 py-3 rounded-xl glass-input text-foreground placeholder:text-muted-foreground/50 resize-y"
            />
            {errors.improvements && <p className="text-destructive text-sm mt-1">{errors.improvements.message}</p>}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-foreground/90 uppercase tracking-wide flex items-center gap-2">
            Target LLM <span className="text-xs text-muted-foreground font-normal normal-case">(Optional)</span>
          </label>
          <input 
            {...register("targetLlm")}
            placeholder="e.g. GPT-4, Claude 3 Opus, Llama 3"
            className="w-full md:w-1/2 px-4 py-3 rounded-xl glass-input text-foreground placeholder:text-muted-foreground/50"
          />
        </div>

        <div className="pt-4 flex justify-end">
          <button
            type="submit"
            disabled={isPending}
            className="flex items-center gap-2 px-8 py-4 rounded-xl font-bold bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/40 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
          >
            <Wand2 className="w-5 h-5" />
            Refactor Magic
          </button>
        </div>
      </motion.form>

      {result && <PromptResult result={result} />}
    </div>
  );
}
