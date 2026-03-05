import { useRoute } from "wouter";
import { useGeneration } from "@/hooks/use-generations";
import { PromptResult } from "@/components/prompt-result";
import { Link } from "wouter";
import { format } from "date-fns";
import { ArrowLeft, Loader2, Calendar } from "lucide-react";
import { motion } from "framer-motion";

export default function HistoryDetail() {
  const [, params] = useRoute("/history/:id");
  const id = params?.id ? parseInt(params.id, 10) : 0;
  
  const { data: gen, isLoading, error } = useGeneration(id);

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (error || !gen) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <h2 className="text-2xl font-bold text-destructive mb-4">Generation not found</h2>
        <Link href="/history" className="text-primary hover:underline">
          Return to History
        </Link>
      </div>
    );
  }

  const inputs = gen.inputData as Record<string, string>;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
      <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
        <Link href="/history" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8 bg-secondary/50 px-4 py-2 rounded-lg border border-border/50">
          <ArrowLeft className="w-4 h-4" />
          Back to History
        </Link>
      </motion.div>

      <div className="mb-10">
        <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground capitalize mb-4">
          {gen.mode} Generation
        </h1>
        <div className="flex items-center gap-2 text-muted-foreground">
          <Calendar className="w-4 h-4" />
          {gen.createdAt && <span>{format(new Date(gen.createdAt), "MMMM d, yyyy 'at' h:mm a")}</span>}
        </div>
      </div>

      <div className="grid gap-8 mb-10">
        <div className="glass-panel rounded-2xl overflow-hidden">
          <div className="px-6 py-4 bg-secondary/30 border-b border-border/50">
            <h3 className="font-semibold text-foreground">Input Parameters</h3>
          </div>
          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            {Object.entries(inputs).map(([key, value]) => (
              value && (
                <div key={key} className="space-y-1">
                  <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block">
                    {key.replace(/([A-Z])/g, ' $1').trim()}
                  </span>
                  <div className="bg-background/50 rounded-lg p-3 border border-border/50 text-foreground/90 text-sm whitespace-pre-wrap font-mono">
                    {value}
                  </div>
                </div>
              )
            ))}
          </div>
        </div>
      </div>

      <div className="relative">
        {gen.result ? (
          <PromptResult result={gen.result} />
        ) : (
          <div className="p-8 text-center text-muted-foreground border border-dashed border-border rounded-2xl">
            No result data found for this generation.
          </div>
        )}
      </div>
    </div>
  );
}
