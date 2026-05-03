import { useState, useRef } from "react";
import { useRoute, Link } from "wouter";
import { usePrompt, useUpdatePrompt, useAutoTitle, useAutoTags, useToggleStar, useDeletePrompt } from "@/hooks/use-prompts";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { motion } from "framer-motion";
import {
  ArrowLeft, Star, Copy, Check, Loader2, Sparkles, Wand2, Tag, Save,
  Trash2, Edit3, X, Bot, PenTool, LayoutTemplate
} from "lucide-react";
import { format } from "date-fns";
import { useLocation } from "wouter";

const MODE_META: Record<string, { label: string; Icon: typeof Sparkles; badge: string }> = {
  create: { label: "Persona", Icon: Sparkles, badge: "bg-violet-500/10 text-violet-400 border-violet-500/20" },
  refactor: { label: "Refactor", Icon: PenTool, badge: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  template: { label: "Template", Icon: LayoutTemplate, badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
};

export default function LibraryDetail() {
  const [, params] = useRoute("/library/:id");
  const id = params?.id ? parseInt(params.id, 10) : 0;
  const [, navigate] = useLocation();

  const { data: prompt, isLoading } = usePrompt(id);
  const updatePrompt = useUpdatePrompt();
  const autoTitle = useAutoTitle();
  const autoTags = useAutoTags();
  const toggleStar = useToggleStar();
  const deletePrompt = useDeletePrompt();

  const [editTitle, setEditTitle] = useState(false);
  const [title, setTitle] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [editNotes, setEditNotes] = useState(false);
  const [notes, setNotes] = useState("");
  const [copied, setCopied] = useState(false);

  const titleRef = useRef<HTMLInputElement>(null);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(prompt?.result ?? "");
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveTitle = async () => {
    if (!title.trim()) return;
    await updatePrompt.mutateAsync({ id, title: title.trim() });
    setEditTitle(false);
  };

  const handleAddTag = async (tag: string) => {
    if (!tag.trim()) return;
    const cleaned = tag.trim().toLowerCase().replace(/\s+/g, "-");
    const existing = (prompt?.tags as string[]) ?? [];
    if (!existing.includes(cleaned)) {
      await updatePrompt.mutateAsync({ id, tags: [...existing, cleaned] });
    }
    setTagInput("");
  };

  const handleRemoveTag = async (tag: string) => {
    const existing = (prompt?.tags as string[]) ?? [];
    await updatePrompt.mutateAsync({ id, tags: existing.filter((t) => t !== tag) });
  };

  const handleSaveNotes = async () => {
    await updatePrompt.mutateAsync({ id, notes });
    setEditNotes(false);
  };

  const handleDelete = async () => {
    if (!confirm("Permanently delete this prompt?")) return;
    await deletePrompt.mutateAsync(id);
    navigate("/library");
  };

  if (isLoading) return (
    <div className="h-full flex items-center justify-center">
      <Loader2 className="w-8 h-8 text-primary animate-spin" />
    </div>
  );

  if (!prompt) return (
    <div className="max-w-4xl mx-auto px-4 py-16 text-center">
      <h2 className="text-2xl font-bold text-destructive mb-4">Prompt not found</h2>
      <Link href="/library" className="text-primary hover:underline">Return to Library</Link>
    </div>
  );

  const meta = MODE_META[prompt.mode as string] ?? MODE_META.create;
  const tags = (prompt.tags as string[]) ?? [];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
      <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}>
        <Link href="/library" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6 bg-secondary/50 px-3 py-1.5 rounded-lg border border-border/50">
          <ArrowLeft className="w-4 h-4" /> Back to Library
        </Link>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Title */}
          <div className="glass-panel rounded-2xl p-5">
            <div className="flex items-start justify-between gap-3 mb-1">
              <div className="flex-1 min-w-0">
                {editTitle ? (
                  <div className="flex items-center gap-2">
                    <input ref={titleRef} value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") handleSaveTitle(); if (e.key === "Escape") setEditTitle(false); }}
                      className="flex-1 px-3 py-2 rounded-xl glass-input text-foreground text-xl font-bold"
                      autoFocus onFocus={(e) => e.target.select()} />
                    <button onClick={handleSaveTitle} className="p-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20">
                      <Save className="w-4 h-4" />
                    </button>
                    <button onClick={() => setEditTitle(false)} className="p-2 rounded-lg bg-secondary text-muted-foreground">
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <button onClick={() => { setTitle((prompt.title as string) ?? ""); setEditTitle(true); }}
                    className="group flex items-start gap-2 text-left">
                    <h1 className="text-2xl font-bold text-foreground leading-snug">{(prompt.title as string) || "Untitled Prompt"}</h1>
                    <Edit3 className="w-4 h-4 text-muted-foreground/50 group-hover:text-muted-foreground mt-1.5 shrink-0 transition-colors" />
                  </button>
                )}
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button onClick={() => toggleStar.mutate(id)}
                  className={`p-2 rounded-xl transition-colors ${(prompt.starred as boolean) ? "text-yellow-400 bg-yellow-500/10" : "text-muted-foreground hover:text-yellow-400 hover:bg-yellow-500/10"}`}>
                  <Star className={`w-5 h-5 ${(prompt.starred as boolean) ? "fill-yellow-400" : ""}`} />
                </button>
                <button onClick={handleDelete} className="p-2 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="flex items-center gap-3 mt-3">
              <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border ${meta.badge}`}>
                <meta.Icon className="w-3 h-3" />{meta.label}
              </span>
              <span className="text-xs text-muted-foreground">
                {prompt.createdAt ? format(new Date(prompt.createdAt as string), "MMMM d, yyyy 'at' h:mm a") : ""}
              </span>
            </div>
          </div>

          {/* Prompt Result */}
          <div className="glass-panel rounded-2xl overflow-hidden border border-primary/10">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-border/50 bg-secondary/20">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="font-medium text-sm text-foreground">Prompt Content</span>
              </div>
              <button onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-xs font-medium transition-all border border-white/5">
                {copied ? <><Check className="w-3.5 h-3.5 text-emerald-400" /><span className="text-emerald-400">Copied!</span></>
                  : <><Copy className="w-3.5 h-3.5 text-muted-foreground" /><span className="text-foreground/80">Copy</span></>}
              </button>
            </div>
            <div className="p-5 md:p-6 bg-[#0a0a0c] overflow-x-auto max-h-[60vh] overflow-y-auto custom-scrollbar">
              <div className="prose-custom">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{(prompt.result as string) ?? "_No content_"}</ReactMarkdown>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar — metadata & AI actions */}
        <div className="space-y-4">
          {/* AI Actions */}
          <div className="glass-panel rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-4">
              <Bot className="w-4 h-4 text-primary" />
              <h3 className="font-semibold text-sm text-foreground">AI Actions</h3>
            </div>
            <div className="space-y-2">
              <button onClick={() => autoTitle.mutate(id)} disabled={autoTitle.isPending}
                className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl bg-secondary/60 border border-border/40 text-sm text-foreground/80 hover:bg-secondary hover:text-foreground transition-all">
                {autoTitle.isPending ? <Loader2 className="w-4 h-4 animate-spin shrink-0" /> : <Wand2 className="w-4 h-4 text-primary shrink-0" />}
                Auto-name this prompt
              </button>
              <button onClick={() => autoTags.mutate(id)} disabled={autoTags.isPending}
                className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl bg-secondary/60 border border-border/40 text-sm text-foreground/80 hover:bg-secondary hover:text-foreground transition-all">
                {autoTags.isPending ? <Loader2 className="w-4 h-4 animate-spin shrink-0" /> : <Tag className="w-4 h-4 text-blue-400 shrink-0" />}
                Suggest tags with AI
              </button>
              <Link href="/assistant"
                className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl bg-secondary/60 border border-border/40 text-sm text-foreground/80 hover:bg-secondary hover:text-foreground transition-all">
                <Bot className="w-4 h-4 text-emerald-400 shrink-0" />
                Open in AI Assistant
              </Link>
            </div>
            {(autoTitle.isSuccess || autoTags.isSuccess) && (
              <p className="text-xs text-emerald-400 mt-2 flex items-center gap-1"><Check className="w-3 h-3" /> Updated successfully</p>
            )}
          </div>

          {/* Tags */}
          <div className="glass-panel rounded-2xl p-4">
            <h3 className="font-semibold text-sm text-foreground mb-3 flex items-center gap-2"><Tag className="w-4 h-4 text-muted-foreground" /> Tags</h3>
            <div className="flex flex-wrap gap-1.5 mb-3">
              {tags.map((t) => (
                <span key={t} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-secondary/60 text-xs text-foreground/80 border border-border/40">
                  {t}
                  <button onClick={() => handleRemoveTag(t)} className="text-muted-foreground hover:text-destructive transition-colors ml-0.5">
                    <X className="w-2.5 h-2.5" />
                  </button>
                </span>
              ))}
              {tags.length === 0 && <span className="text-xs text-muted-foreground">No tags yet</span>}
            </div>
            <input value={tagInput} onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); handleAddTag(tagInput); } }}
              placeholder="Add tag, press Enter…"
              className="w-full px-3 py-2 rounded-lg glass-input text-sm text-foreground placeholder:text-muted-foreground/40" />
          </div>

          {/* Notes */}
          <div className="glass-panel rounded-2xl p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-sm text-foreground">Notes</h3>
              {!editNotes ? (
                <button onClick={() => { setNotes((prompt.notes as string) ?? ""); setEditNotes(true); }}
                  className="text-xs text-muted-foreground hover:text-foreground transition-colors flex items-center gap-1">
                  <Edit3 className="w-3 h-3" /> Edit
                </button>
              ) : (
                <div className="flex items-center gap-2">
                  <button onClick={handleSaveNotes} className="text-xs text-emerald-400 flex items-center gap-1"><Save className="w-3 h-3" /> Save</button>
                  <button onClick={() => setEditNotes(false)} className="text-xs text-muted-foreground flex items-center gap-1"><X className="w-3 h-3" /> Cancel</button>
                </div>
              )}
            </div>
            {editNotes ? (
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4}
                className="w-full px-3 py-2 rounded-lg glass-input text-sm text-foreground resize-y" autoFocus />
            ) : (
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {(prompt.notes as string) || "No notes yet. Click Edit to add."}
              </p>
            )}
          </div>

          {/* Input params */}
          {prompt.inputData && Object.keys(prompt.inputData as object).length > 0 && (
            <div className="glass-panel rounded-2xl p-4">
              <h3 className="font-semibold text-sm text-foreground mb-3">Input Parameters</h3>
              <div className="space-y-2">
                {Object.entries(prompt.inputData as Record<string, string>).map(([key, value]) =>
                  value ? (
                    <div key={key}>
                      <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-0.5">
                        {key.replace(/([A-Z])/g, " $1").trim()}
                      </span>
                      <div className="text-xs text-foreground/70 bg-background/50 rounded-lg p-2 border border-border/40 font-mono whitespace-pre-wrap line-clamp-3">{value}</div>
                    </div>
                  ) : null
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
