import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { createPersonaSchema } from "@shared/routes";
import { useCreateGeneration } from "@/hooks/use-generations";
import { PromptResult } from "@/components/prompt-result";
import { Loader2, UserPlus } from "lucide-react";
import { z } from "zod";
import { motion } from "framer-motion";

type FormData = z.infer<typeof createPersonaSchema>;

export default function CreatePersona() {
  const [result, setResult] = useState<string | null>(null);
  const { mutate, isPending } = useCreateGeneration();
  
  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(createPersonaSchema),
    defaultValues: {
      roleName: "",
      purpose: "",
      userProfile: "",
      communicationStyle: "",
      constraints: "",
    }
  });

  const onSubmit = (data: FormData) => {
    mutate({
      mode: "create",
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
        <h1 className="text-4xl md:text-5xl font-display font-bold text-gradient mb-4">Create New Persona</h1>
        <p className="text-lg text-muted-foreground mb-10 max-w-2xl">
          Design a highly specialized AI persona. Provide the role, context, and constraints to generate a robust system prompt.
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
            <p className="text-lg font-medium text-foreground animate-pulse">Architecting Persona...</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground/90 uppercase tracking-wide">Role Name</label>
            <input 
              {...register("roleName")}
              placeholder="e.g. Senior Frontend Engineer, Creative Writer"
              className="w-full px-4 py-3 rounded-xl glass-input text-foreground placeholder:text-muted-foreground/50"
            />
            {errors.roleName && <p className="text-destructive text-sm mt-1">{errors.roleName.message}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground/90 uppercase tracking-wide">Communication Style</label>
            <input 
              {...register("communicationStyle")}
              placeholder="e.g. Professional, witty, concise"
              className="w-full px-4 py-3 rounded-xl glass-input text-foreground placeholder:text-muted-foreground/50"
            />
            {errors.communicationStyle && <p className="text-destructive text-sm mt-1">{errors.communicationStyle.message}</p>}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-foreground/90 uppercase tracking-wide">Primary Purpose</label>
          <textarea 
            {...register("purpose")}
            placeholder="What is this persona trying to achieve? What is their main goal?"
            rows={3}
            className="w-full px-4 py-3 rounded-xl glass-input text-foreground placeholder:text-muted-foreground/50 resize-y"
          />
          {errors.purpose && <p className="text-destructive text-sm mt-1">{errors.purpose.message}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-foreground/90 uppercase tracking-wide">Target User Profile</label>
          <textarea 
            {...register("userProfile")}
            placeholder="Who is this persona interacting with? (e.g. Beginners learning to code)"
            rows={3}
            className="w-full px-4 py-3 rounded-xl glass-input text-foreground placeholder:text-muted-foreground/50 resize-y"
          />
          {errors.userProfile && <p className="text-destructive text-sm mt-1">{errors.userProfile.message}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-semibold text-foreground/90 uppercase tracking-wide">Key Constraints</label>
          <textarea 
            {...register("constraints")}
            placeholder="What should this persona NEVER do? Formatting rules?"
            rows={3}
            className="w-full px-4 py-3 rounded-xl glass-input text-foreground placeholder:text-muted-foreground/50 resize-y"
          />
          {errors.constraints && <p className="text-destructive text-sm mt-1">{errors.constraints.message}</p>}
        </div>

        <div className="pt-4 flex justify-end">
          <button
            type="submit"
            disabled={isPending}
            className="flex items-center gap-2 px-8 py-4 rounded-xl font-bold bg-gradient-to-r from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/40 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200"
          >
            <UserPlus className="w-5 h-5" />
            Generate Persona Prompt
          </button>
        </div>
      </motion.form>

      {result && <PromptResult result={result} />}
    </div>
  );
}
