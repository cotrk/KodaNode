import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createTemplateSchema } from "@shared/routes";
import { useCreateGeneration } from "@/hooks/use-generations";
import { PromptResult } from "@/components/prompt-result";
import { Loader2, LayoutTemplate } from "lucide-react";
import { z } from "zod";
import { motion } from "framer-motion";

type FormData = z.infer<typeof createTemplateSchema>;

export default function TemplateBuilder() {
  const [result, setResult] = useState<string | null>(null);
  const { mutate, isPending } = useCreateGeneration();
  
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(createTemplateSchema),
    defaultValues: {
      personaType: "",
      variables: "",
      reusability: "",
    }
  });

  const onSubmit = (data: FormData) => {
    mutate({
      mode: "template",
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
        <h1 className="text-4xl md:text-5xl font-display font-bold text-gradient mb-4">Template Builder</h1>
        <p className="text-lg text-muted-foreground mb-10 max-w-2xl">
          Create reusable prompt frameworks with variables. Perfect for standardizing workflows across your team or application.
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
            <p className="text-lg font-medium text-foreground animate-pulse">Constructing Template...</p>
          </div>
        )}

        <div className="space-y-2">
          <label className="text-sm font-semibold text-foreground/90 uppercase tracking-wide">Persona Type / Category</label>
          <input 
            {...register("personaType")}
            placeholder="e.g. Code Reviewer, Blog Post Generator, Data Extractor"
            className="w-full px-4 py-3 rounded-xl glass-input text-foreground placeholder:text-muted-foreground/50"
          />
          {errors.personaType && <p className="text-destructive text-sm mt-1">{errors.personaType.message}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-foreground/90 uppercase tracking-wide">Variables Needed</label>
          <textarea 
            {...register("variables")}
            placeholder="List the variables this template needs. e.g. {TONE}, {TOPIC}, {LANGUAGE_FRAMEWORK}"
            rows={4}
            className="w-full px-4 py-3 rounded-xl glass-input text-foreground placeholder:text-muted-foreground/50 resize-y"
          />
          {errors.variables && <p className="text-destructive text-sm mt-1">{errors.variables.message}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-foreground/90 uppercase tracking-wide">Reusability & Structure</label>
          <textarea 
            {...register("reusability")}
            placeholder="How will this be reused? Should it use a specific format like XML tags or Markdown sections?"
            rows={4}
            className="w-full px-4 py-3 rounded-xl glass-input text-foreground placeholder:text-muted-foreground/50 resize-y"
          />
          {errors.reusability && <p className="text-destructive text-sm mt-1">{errors.reusability.message}</p>}
        </div>

        <div className="pt-4 flex justify-end">
          <button
            type="submit"
            disabled={isPending}
            className="flex items-center gap-2 px-8 py-4 rounded-xl font-bold bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/40 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
          >
            <LayoutTemplate className="w-5 h-5" />
            Generate Framework
          </button>
        </div>
      </motion.form>

      {result && <PromptResult result={result} />}
    </div>
  );
}
