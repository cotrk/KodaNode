import { useState, useCallback } from "react";
import { useRoute, Link } from "wouter";
import { usePrompt, useUpdatePrompt, useAutoTitle, useAutoTags, useToggleStar, useDeletePrompt } from "@/hooks/use-prompts";
import { useCollections, useMoveToCollection } from "@/hooks/use-collections";
import { MarkdownEditor } from "@/components/markdown-editor";
import { motion } from "framer-motion";
import {
  ArrowLeft, Star, Loader2, Sparkles, Wand2, Tag, Save,
  Trash2, Edit3, X, Bot, PenTool, LayoutTemplate, Download, FolderOpen, Check
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
  const moveToCollection = useMoveToCollection();
  const { data: collections = [] } = useCollections();

  const [editTitle, setEditTitle] = useState(false);
  const [title, setTitle] = useState("");
  const [tagInput, setTagInput] = useState("");
  const [editNotes, setEditNotes] = useState(false);
  const [notes, setNotes] = useState("");
  const [editorContent, setEditorContent] = useState<string | null>(null);

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

  const handleSaveContent = useCallback(async (value: string) => {
    await updatePrompt.mutateAsync({ id, result: value });
  }, [id, updatePrompt]);

  const handleDelete = async () => {
    if (!confirm("Permanently delete this prompt?")) return;
    await deletePrompt.mutateAsync(id);
    navigate("/library");
  };

  const handleExport = async () => {
    const res = await fetch(`/api/prompts/${id}/export`);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${(prompt?.title as string) ?? "prompt"}.md`; a.click();
    URL.revokeObjectURL(url);
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
  const currentContent = editorContent ?? (prompt.result as string) ?? "";
  const currentCollection = collections.find((c) => c.id === prompt.collectionId);

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Top bar */}
      <div className="flex items-center gap-3 px-4 sm:px-6 py-3 border-b border-border/50 bg-background/50 backdrop-blur-sm shrink-0 flex-wrap gap-y-2">
        <Link href="/library" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ArrowLeft className="w-4 h-4" /> Library
        </Link>
        <div className="w-px h-4 bg-border/50" />

        {/* Editable title */}
        {editTitle ? (
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <input value={title} onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleSaveTitle(); if (e.key === "Escape") setEditTitle(false); }}
              className="flex-1 px-3 py-1.5 rounded-lg glass-input text-foreground font-semibold text-sm" autoFocus />
            <button onClick={handleSaveTitle} className="p-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20"><Save className="w-3.5 h-3.5" /></button>
            <button onClick={() => setEditTitle(false)} className="p-1.5 rounded-lg bg-secondary text-muted-foreground"><X className="w-3.5 h-3.5" /></button>
          </div>
        ) : (
          <button onClick={() => { setTitle((prompt.title as string) ?? ""); setEditTitle(true); }}
            className="group flex items-center gap-1.5 flex-1 min-w-0 text-left">
            <span className="font-semibold text-foreground truncate">{(prompt.title as string) || "Untitled Prompt"}</span>
            <Edit3 className="w-3.5 h-3.5 text-muted-foreground/40 group-hover:text-muted-foreground transition-colors shrink-0" />
          </button>
        )}

        <div className="flex items-center gap-2 shrink-0 ml-auto">
          <span className={`hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border ${meta.badge}`}>
            <meta.Icon className="w-3 h-3" />{meta.label}
          </span>
          <button onClick={handleExport} title="Export as .md"
            className="p-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
            <Download className="w-4 h-4" />
          </button>
          <button onClick={() => toggleStar.mutate(id)}
            className={`p-2 rounded-xl transition-colors ${(prompt.starred as boolean) ? "text-yellow-400 bg-yellow-500/10" : "text-muted-foreground hover:text-yellow-400 hover:bg-yellow-500/10"}`}>
            <Star className={`w-4 h-4 ${(prompt.starred as boolean) ? "fill-yellow-400" : ""}`} />
          </button>
          <button onClick={handleDelete} className="p-2 rounded-xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors">
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main layout */}
      <div className="flex flex-1 min-h-0">
        {/* Editor — takes most of the space */}
        <div className="flex-1 min-w-0 p-4">
          <MarkdownEditor
            value={currentContent}
            onChange={(v) => setEditorContent(v)}
            onSave={handleSaveContent}
            autoSave
          />
        </div>

        {/* Right panel — metadata */}
        <div className="w-64 shrink-0 border-l border-border/40 overflow-y-auto custom-scrollbar p-4 space-y-4 hidden lg:block">

          {/* AI Actions */}
          <div className="space-y-1.5">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Bot className="w-3.5 h-3.5" /> AI Actions
            </p>
            <button onClick={() => autoTitle.mutate(id)} disabled={autoTitle.isPending}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-secondary/60 border border-border/40 text-xs text-foreground/80 hover:bg-secondary hover:text-foreground transition-all">
              {autoTitle.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Wand2 className="w-3.5 h-3.5 text-primary" />}
              Auto-name
            </button>
            <button onClick={() => autoTags.mutate(id)} disabled={autoTags.isPending}
              className="w-full flex items-center gap-2 px-3 py-2 rounded-xl bg-secondary/60 border border-border/40 text-xs text-foreground/80 hover:bg-secondary hover:text-foreground transition-all">
              {autoTags.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Tag className="w-3.5 h-3.5 text-blue-400" />}
              Suggest tags
            </button>
            {(autoTitle.isSuccess || autoTags.isSuccess) && (
              <p className="text-xs text-emerald-400 flex items-center gap-1"><Check className="w-3 h-3" /> Updated</p>
            )}
          </div>

          <div className="border-t border-border/30" />

          {/* Collection */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <FolderOpen className="w-3.5 h-3.5" /> Collection
            </p>
            <select
              value={(prompt.collectionId as number | null) ?? ""}
              onChange={(e) => moveToCollection.mutate({ promptId: id, collectionId: e.target.value ? Number(e.target.value) : null })}
              className="w-full px-2 py-1.5 rounded-lg glass-input text-xs text-foreground bg-transparent">
              <option value="">No collection</option>
              {collections.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div className="border-t border-border/30" />

          {/* Tags */}
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5" /> Tags
            </p>
            <div className="flex flex-wrap gap-1">
              {tags.map((t) => (
                <span key={t} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-secondary/60 text-xs text-foreground/80 border border-border/40">
                  {t}
                  <button onClick={() => handleRemoveTag(t)} className="text-muted-foreground hover:text-destructive ml-0.5">
                    <X className="w-2.5 h-2.5" />
                  </button>
                </span>
              ))}
              {tags.length === 0 && <span className="text-xs text-muted-foreground">None</span>}
            </div>
            <input value={tagInput} onChange={(e) => setTagInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter" || e.key === ",") { e.preventDefault(); handleAddTag(tagInput); } }}
              placeholder="Add tag, press Enter…"
              className="w-full px-2 py-1.5 rounded-lg glass-input text-xs text-foreground placeholder:text-muted-foreground/40" />
          </div>

          <div className="border-t border-border/30" />

          {/* Notes */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Notes</p>
              {!editNotes
                ? <button onClick={() => { setNotes((prompt.notes as string) ?? ""); setEditNotes(true); }} className="text-xs text-muted-foreground hover:text-foreground"><Edit3 className="w-3 h-3" /></button>
                : <div className="flex gap-1.5">
                    <button onClick={handleSaveNotes} className="text-xs text-emerald-400"><Save className="w-3 h-3" /></button>
                    <button onClick={() => setEditNotes(false)} className="text-xs text-muted-foreground"><X className="w-3 h-3" /></button>
                  </div>}
            </div>
            {editNotes
              ? <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={4} autoFocus
                  className="w-full px-2 py-1.5 rounded-lg glass-input text-xs text-foreground resize-y" />
              : <p className="text-xs text-muted-foreground whitespace-pre-wrap">{(prompt.notes as string) || "No notes."}</p>}
          </div>

          <div className="border-t border-border/30" />

          {/* Metadata */}
          <div className="space-y-1.5 text-xs text-muted-foreground">
            <p>Mode: <span className="text-foreground/70">{meta.label}</span></p>
            {(prompt.model as string) && <p>Model: <span className="text-foreground/70">{prompt.model as string}</span></p>}
            {(prompt.sourceFile as string) && <p title={prompt.sourceFile as string}>Source: <span className="text-foreground/70 truncate block">{(prompt.sourceFile as string).split("/").pop()}</span></p>}
            <p>Created: <span className="text-foreground/70">{prompt.createdAt ? format(new Date(prompt.createdAt as string), "MMM d, yyyy") : ""}</span></p>
          </div>
        </div>
      </div>
    </div>
  );
}
