import { useState } from "react";
import { Link } from "wouter";
import { usePrompts, useDeletePrompt, useToggleStar } from "@/hooks/use-prompts";
import { format, formatDistanceToNow } from "date-fns";
import {
  Search, Star, Sparkles, PenTool, LayoutTemplate, Trash2, ChevronRight,
  BookOpen, Filter, LayoutGrid, List, SortDesc, Plus
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const MODE_META: Record<string, { label: string; Icon: typeof Sparkles; color: string; badge: string }> = {
  create: { label: "Persona", Icon: Sparkles, color: "text-violet-400", badge: "bg-violet-500/10 text-violet-400 border-violet-500/20" },
  refactor: { label: "Refactor", Icon: PenTool, color: "text-blue-400", badge: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  template: { label: "Template", Icon: LayoutTemplate, color: "text-emerald-400", badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
};

const MODES = ["all", "create", "refactor", "template"];
const SORTS = ["newest", "oldest", "a-z", "starred"];

interface Prompt { id: number; title: string; mode: string; tags: string[]; result?: string | null; starred: boolean; createdAt?: string | null; }

export default function Library() {
  const [search, setSearch] = useState("");
  const [modeFilter, setModeFilter] = useState("all");
  const [starredOnly, setStarredOnly] = useState(false);
  const [sort, setSort] = useState("newest");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  const { data: rawPrompts = [], isLoading } = usePrompts({
    search: debouncedSearch || undefined,
    mode: modeFilter !== "all" ? modeFilter : undefined,
    starred: starredOnly || undefined,
  });

  const deleteMutation = useDeletePrompt();
  const toggleStar = useToggleStar();

  const prompts = (rawPrompts as Prompt[]).slice().sort((a, b) => {
    if (sort === "newest") return new Date(b.createdAt ?? 0).getTime() - new Date(a.createdAt ?? 0).getTime();
    if (sort === "oldest") return new Date(a.createdAt ?? 0).getTime() - new Date(b.createdAt ?? 0).getTime();
    if (sort === "a-z") return (a.title ?? "").localeCompare(b.title ?? "");
    if (sort === "starred") return (b.starred ? 1 : 0) - (a.starred ? 1 : 0);
    return 0;
  });

  let searchTimeout: ReturnType<typeof setTimeout>;
  const handleSearch = (val: string) => {
    setSearch(val);
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(() => setDebouncedSearch(val), 300);
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-3xl md:text-4xl font-sans font-bold text-gradient">My Library</h1>
            <p className="text-muted-foreground mt-1">{(rawPrompts as Prompt[]).length} prompt{(rawPrompts as Prompt[]).length !== 1 ? "s" : ""} saved</p>
          </div>
          <Link href="/create"
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors shadow-lg shadow-primary/20">
            <Plus className="w-4 h-4" /> New Prompt
          </Link>
        </div>
      </motion.div>

      {/* Search + Filters */}
      <div className="mb-6 space-y-3">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={(e) => handleSearch(e.target.value)}
            placeholder="Search by title, content, or tags…"
            data-testid="input-library-search"
            className="w-full pl-11 pr-4 py-3 rounded-xl glass-input text-foreground placeholder:text-muted-foreground/50" />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Mode filters */}
          {MODES.map((m) => (
            <button key={m} onClick={() => setModeFilter(m)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all capitalize ${
                modeFilter === m
                  ? "bg-primary/15 text-primary border border-primary/30"
                  : "bg-secondary/60 text-muted-foreground hover:text-foreground border border-transparent"
              }`}>
              {m === "all" ? "All Modes" : (MODE_META[m]?.label ?? m)}
            </button>
          ))}

          <div className="ml-auto flex items-center gap-2">
            <button onClick={() => setStarredOnly((v) => !v)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                starredOnly ? "bg-yellow-500/15 text-yellow-400 border border-yellow-500/30" : "bg-secondary/60 text-muted-foreground border border-transparent hover:text-foreground"
              }`}>
              <Star className="w-3.5 h-3.5" /> Starred
            </button>

            <select value={sort} onChange={(e) => setSort(e.target.value)}
              className="px-3 py-1.5 rounded-lg bg-secondary/60 border border-transparent text-sm text-muted-foreground hover:text-foreground cursor-pointer">
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="a-z">A → Z</option>
              <option value="starred">Starred First</option>
            </select>

            <div className="flex items-center border border-border/40 rounded-lg overflow-hidden">
              <button onClick={() => setView("grid")}
                className={`p-2 transition-colors ${view === "grid" ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"}`}>
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button onClick={() => setView("list")}
                className={`p-2 transition-colors ${view === "list" ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground"}`}>
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-48 rounded-2xl bg-secondary/30 animate-pulse" />
          ))}
        </div>
      ) : prompts.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="text-center py-24 glass-panel rounded-3xl">
          <BookOpen className="w-14 h-14 text-muted-foreground mx-auto mb-4 opacity-30" />
          <h3 className="text-xl font-semibold text-foreground">
            {search || modeFilter !== "all" || starredOnly ? "No prompts match your filters" : "Your library is empty"}
          </h3>
          <p className="text-muted-foreground mt-2 mb-6 text-sm">
            {search || modeFilter !== "all" || starredOnly ? "Try adjusting your search or filters." : "Create your first prompt to get started."}
          </p>
          {!search && modeFilter === "all" && !starredOnly && (
            <Link href="/create" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-medium hover:bg-primary/90 transition-colors">
              <Plus className="w-4 h-4" /> Create First Prompt
            </Link>
          )}
        </motion.div>
      ) : view === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {prompts.map((p, i) => (
              <PromptCard key={p.id} prompt={p} index={i}
                onDelete={() => confirm("Delete this prompt?") && deleteMutation.mutate(p.id)}
                onStar={() => toggleStar.mutate(p.id)} />
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="space-y-2">
          <AnimatePresence>
            {prompts.map((p, i) => (
              <PromptRow key={p.id} prompt={p} index={i}
                onDelete={() => confirm("Delete this prompt?") && deleteMutation.mutate(p.id)}
                onStar={() => toggleStar.mutate(p.id)} />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}

function PromptCard({ prompt, index, onDelete, onStar }: { prompt: Prompt; index: number; onDelete: () => void; onStar: () => void }) {
  const meta = MODE_META[prompt.mode] ?? MODE_META.create;
  const snippet = (prompt.result ?? "").replace(/#+\s/g, "").replace(/\*+/g, "").slice(0, 120);
  const tags = prompt.tags ?? [];

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
      transition={{ delay: index * 0.03 }}
      className="group glass-panel rounded-2xl p-5 flex flex-col gap-3 hover:border-border transition-all relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/3 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

      <div className="flex items-start justify-between gap-2">
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border ${meta.badge}`}>
          <meta.Icon className="w-3 h-3" />{meta.label}
        </span>
        <button onClick={(e) => { e.preventDefault(); onStar(); }}
          className={`p-1 rounded-lg transition-colors ${prompt.starred ? "text-yellow-400" : "text-muted-foreground/40 hover:text-yellow-400"}`}>
          <Star className={`w-4 h-4 ${prompt.starred ? "fill-yellow-400" : ""}`} />
        </button>
      </div>

      <div>
        <h3 className="font-semibold text-foreground leading-snug line-clamp-2">{prompt.title || "Untitled Prompt"}</h3>
        {snippet && <p className="text-sm text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed">{snippet}</p>}
      </div>

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {tags.slice(0, 4).map((t) => (
            <span key={t} className="text-xs px-2 py-0.5 rounded-md bg-secondary/60 text-muted-foreground border border-border/40">{t}</span>
          ))}
          {tags.length > 4 && <span className="text-xs text-muted-foreground">+{tags.length - 4}</span>}
        </div>
      )}

      <div className="flex items-center justify-between mt-auto pt-1 border-t border-border/30">
        <span className="text-xs text-muted-foreground">{prompt.createdAt ? formatDistanceToNow(new Date(prompt.createdAt), { addSuffix: true }) : ""}</span>
        <div className="flex items-center gap-1">
          <button onClick={(e) => { e.preventDefault(); onDelete(); }}
            className="p-1.5 rounded-lg text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <Link href={`/library/${prompt.id}`}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors">
            View <ChevronRight className="w-3 h-3" />
          </Link>
        </div>
      </div>
    </motion.div>
  );
}

function PromptRow({ prompt, index, onDelete, onStar }: { prompt: Prompt; index: number; onDelete: () => void; onStar: () => void }) {
  const meta = MODE_META[prompt.mode] ?? MODE_META.create;
  const tags = prompt.tags ?? [];

  return (
    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
      transition={{ delay: index * 0.02 }}
      className="group glass-panel rounded-xl px-5 py-4 flex items-center gap-4 hover:border-border transition-all">
      <button onClick={onStar}
        className={`shrink-0 p-1 rounded-lg ${prompt.starred ? "text-yellow-400" : "text-muted-foreground/30 hover:text-yellow-400"}`}>
        <Star className={`w-4 h-4 ${prompt.starred ? "fill-yellow-400" : ""}`} />
      </button>
      <span className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border ${meta.badge}`}>
        <meta.Icon className="w-3 h-3" />{meta.label}
      </span>
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-foreground truncate">{prompt.title || "Untitled Prompt"}</h3>
        <div className="flex items-center gap-2 mt-0.5">
          {tags.slice(0, 3).map((t) => (
            <span key={t} className="text-xs text-muted-foreground/70">{t}</span>
          ))}
        </div>
      </div>
      <span className="text-xs text-muted-foreground shrink-0 hidden sm:block">
        {prompt.createdAt ? format(new Date(prompt.createdAt), "MMM d, yyyy") : ""}
      </span>
      <div className="flex items-center gap-2 shrink-0">
        <button onClick={onDelete}
          className="p-1.5 rounded-lg text-muted-foreground/40 hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-all">
          <Trash2 className="w-4 h-4" />
        </button>
        <Link href={`/library/${prompt.id}`}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-secondary text-foreground text-sm font-medium hover:bg-secondary/80 transition-colors border border-border/40">
          View <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </Link>
      </div>
    </motion.div>
  );
}
