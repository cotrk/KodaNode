import { useGenerations, useDeleteGeneration } from "@/hooks/use-generations";
import { Link } from "wouter";
import { format } from "date-fns";
import { 
  History as HistoryIcon, 
  Trash2, 
  ChevronRight,
  Sparkles,
  PenTool,
  LayoutTemplate,
  Loader2
} from "lucide-react";
import { motion } from "framer-motion";

export default function History() {
  const { data: generations, isLoading, error } = useGenerations();
  const deleteMutation = useDeleteGeneration();

  const getModeIcon = (mode: string) => {
    switch(mode) {
      case 'create': return <Sparkles className="w-4 h-4" />;
      case 'refactor': return <PenTool className="w-4 h-4" />;
      case 'template': return <LayoutTemplate className="w-4 h-4" />;
      default: return <Sparkles className="w-4 h-4" />;
    }
  };

  const getTitle = (item: any) => {
    if (!item.inputData) return "Unknown Generation";
    if (item.mode === 'create') return item.inputData.roleName || "New Persona";
    if (item.mode === 'refactor') return "Prompt Refactor";
    if (item.mode === 'template') return item.inputData.personaType || "Template";
    return "Generation";
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center text-destructive">
        Failed to load history.
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-16">
      <div className="flex items-center gap-3 mb-10">
        <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center border border-border/50">
          <HistoryIcon className="w-6 h-6 text-foreground" />
        </div>
        <div>
          <h1 className="text-3xl font-display font-bold text-foreground">Generation History</h1>
          <p className="text-muted-foreground">Your previously architected prompts.</p>
        </div>
      </div>

      {!generations?.length ? (
        <div className="text-center py-20 glass-panel rounded-3xl">
          <HistoryIcon className="w-12 h-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="text-xl font-semibold text-foreground">No history yet</h3>
          <p className="text-muted-foreground mt-2 mb-6">Start building your first persona to see it here.</p>
          <Link href="/create" className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors inline-block">
            Create Persona
          </Link>
        </div>
      ) : (
        <div className="grid gap-4">
          {generations.map((gen, i) => (
            <motion.div 
              key={gen.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="group glass-panel rounded-2xl p-4 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all hover:bg-secondary/40 hover:border-border"
            >
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className={`
                  w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-inner
                  ${gen.mode === 'create' ? 'bg-primary/20 text-primary border border-primary/30' : 
                    gen.mode === 'refactor' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 
                    'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'}
                `}>
                  {getModeIcon(gen.mode)}
                </div>
                <div className="truncate">
                  <h3 className="font-semibold text-lg text-foreground truncate">
                    {getTitle(gen)}
                  </h3>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                    <span className="capitalize px-2 py-0.5 bg-background rounded-md border border-border">
                      {gen.mode}
                    </span>
                    <span>•</span>
                    {gen.createdAt && <span>{format(new Date(gen.createdAt), "MMM d, yyyy • h:mm a")}</span>}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto shrink-0 mt-4 sm:mt-0">
                <button 
                  onClick={(e) => {
                    e.preventDefault();
                    if(confirm("Are you sure you want to delete this generation?")) {
                      deleteMutation.mutate(gen.id);
                    }
                  }}
                  disabled={deleteMutation.isPending}
                  className="p-3 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  title="Delete"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
                <Link 
                  href={`/history/${gen.id}`}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-foreground font-medium border border-white/5 hover:border-white/10 transition-all"
                >
                  View Details
                  <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-colors" />
                </Link>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
