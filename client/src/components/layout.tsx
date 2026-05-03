import { ReactNode, useState, useRef } from "react";
import { Link, useLocation } from "wouter";
import {
  Sparkles, PenTool, LayoutTemplate, BookOpen, Bot, Settings, Wrench,
  Library, Menu, ChevronDown, FolderOpen, Plus, Edit2, Trash2,
  RefreshCw, HardDrive, Loader2, X, CheckCircle, AlertCircle
} from "lucide-react";
import { useCollections, useCreateCollection, useDeleteCollection, useUpdateCollection, useMoveToCollection } from "@/hooks/use-collections";
import { useVault } from "@/hooks/use-vault";
import { formatDistanceToNow } from "date-fns";

interface LayoutProps { children: ReactNode; }

const PALETTE = ["#8b5cf6","#3b82f6","#10b981","#f59e0b","#ef4444","#ec4899","#14b8a6","#f97316"];

export function Layout({ children }: LayoutProps) {
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(["/create","/refactor","/template"].includes(location) || location === "/");
  const [newColName, setNewColName] = useState("");
  const [newColColor, setNewColColor] = useState(PALETTE[0]);
  const [showNewCol, setShowNewCol] = useState(false);
  const [editingColId, setEditingColId] = useState<number | null>(null);
  const [editingColName, setEditingColName] = useState("");
  const [draggingPromptId, setDraggingPromptId] = useState<number | null>(null);
  const [dragOverColId, setDragOverColId] = useState<number | null>(null);

  const { data: collections = [] } = useCollections();
  const createCollection = useCreateCollection();
  const deleteCollection = useDeleteCollection();
  const updateCollection = useUpdateCollection();
  const moveToCollection = useMoveToCollection();
  const { status: vault, openVault, syncNow, disconnectVault, isSupported } = useVault();

  const isActive = (href: string) => location === href || (location === "/" && href === "/library");
  const isLibrarySection = location.startsWith("/library");

  const navLink = (href: string, Icon: typeof Sparkles, label: string, sub = false) => (
    <Link key={href} href={href} onClick={() => setMobileOpen(false)}
      className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group ${sub ? "ml-3" : ""}
        ${isActive(href)
          ? "bg-primary/10 text-primary border border-primary/20"
          : "text-foreground/65 hover:bg-secondary/80 hover:text-foreground border border-transparent"}`}>
      <Icon className={`w-4 h-4 shrink-0 ${isActive(href) ? "text-primary" : "text-muted-foreground group-hover:text-foreground"}`} />
      <span className={`font-medium ${sub ? "text-sm" : ""}`}>{label}</span>
    </Link>
  );

  const handleAddCollection = async () => {
    if (!newColName.trim()) return;
    await createCollection.mutateAsync({ name: newColName.trim(), color: newColColor });
    setNewColName(""); setShowNewCol(false);
  };

  const handleRenameCollection = async (id: number) => {
    if (!editingColName.trim()) return;
    await updateCollection.mutateAsync({ id, name: editingColName.trim() });
    setEditingColId(null);
  };

  const handleDrop = async (collectionId: number | null) => {
    if (draggingPromptId === null) return;
    await moveToCollection.mutateAsync({ promptId: draggingPromptId, collectionId });
    setDraggingPromptId(null);
    setDragOverColId(null);
  };

  // Expose drag state globally for library cards to set
  (window as Record<string, unknown>).__setDraggingPromptId = setDraggingPromptId;

  return (
    <div className="min-h-screen flex bg-background text-foreground overflow-hidden relative">
      <div className="absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-primary/5 to-transparent pointer-events-none -z-10" />
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-primary/10 rounded-full blur-[100px] pointer-events-none -z-10" />
      <div className="absolute top-40 -left-40 w-96 h-96 bg-blue-500/8 rounded-full blur-[100px] pointer-events-none -z-10" />

      {mobileOpen && <div className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm" onClick={() => setMobileOpen(false)} />}

      <aside className={`fixed md:static inset-y-0 left-0 z-50 flex flex-col glass-panel border-y-0 border-l-0
        transition-transform duration-300 ${mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}`}
        style={{ width: "17.5rem" }}>

        {/* Brand */}
        <div className="p-5 flex items-center gap-3 border-b border-border/50">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary to-blue-500 flex items-center justify-center shadow-lg shadow-primary/20 shrink-0">
            <Library className="w-4.5 h-4.5 text-white" style={{ width: "1.1rem", height: "1.1rem" }} />
          </div>
          <div>
            <h1 className="font-sans font-bold text-lg leading-tight text-gradient">Prompt Vault</h1>
            <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">AI Prompt Library</p>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto custom-scrollbar">

          {/* Library (primary) */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragOverColId(-999); }}
            onDragLeave={() => setDragOverColId(null)}
            onDrop={() => handleDrop(null)}>
            <Link href="/library" onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group mb-1 ${
                isLibrarySection && !new URLSearchParams(location).get("collectionId")
                  ? "bg-primary/10 text-primary border border-primary/20"
                  : dragOverColId === -999
                  ? "bg-secondary border border-dashed border-primary/40"
                  : "text-foreground/80 hover:bg-secondary/80 hover:text-foreground border border-transparent"
              }`}>
              <BookOpen className="w-5 h-5 shrink-0" />
              <span className="font-semibold">My Library</span>
            </Link>
          </div>

          {/* Collections */}
          <div className="px-4 pt-2 pb-1 flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Collections</span>
            <button onClick={() => setShowNewCol((v) => !v)}
              className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors">
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* New collection input */}
          {showNewCol && (
            <div className="mx-3 p-2 rounded-xl bg-secondary/40 border border-border/50 space-y-2">
              <input value={newColName} onChange={(e) => setNewColName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleAddCollection(); if (e.key === "Escape") setShowNewCol(false); }}
                placeholder="Collection name" autoFocus
                className="w-full px-2 py-1.5 text-sm rounded-lg glass-input text-foreground" />
              <div className="flex items-center gap-1.5">
                {PALETTE.map((c) => (
                  <button key={c} onClick={() => setNewColColor(c)}
                    className={`w-4 h-4 rounded-full transition-all ${newColColor === c ? "ring-2 ring-white/60 scale-110" : "opacity-60 hover:opacity-100"}`}
                    style={{ backgroundColor: c }} />
                ))}
                <button onClick={handleAddCollection} disabled={!newColName.trim() || createCollection.isPending}
                  className="ml-auto text-xs text-primary hover:underline font-medium">Add</button>
              </div>
            </div>
          )}

          {/* Collection list */}
          {collections.map((col) => (
            <div key={col.id}
              onDragOver={(e) => { e.preventDefault(); setDragOverColId(col.id); }}
              onDragLeave={() => setDragOverColId(null)}
              onDrop={() => handleDrop(col.id)}>
              {editingColId === col.id ? (
                <div className="flex items-center gap-1 px-3 py-1.5 mx-1">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: col.color }} />
                  <input value={editingColName} onChange={(e) => setEditingColName(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleRenameCollection(col.id); if (e.key === "Escape") setEditingColId(null); }}
                    autoFocus className="flex-1 px-2 py-1 text-sm rounded-lg glass-input text-foreground" />
                  <button onClick={() => setEditingColId(null)} className="p-1 text-muted-foreground"><X className="w-3 h-3" /></button>
                </div>
              ) : (
                <Link href={`/library?collectionId=${col.id}`} onClick={() => setMobileOpen(false)}
                  className={`group flex items-center gap-3 px-4 py-2 rounded-xl transition-all ml-1 ${
                    dragOverColId === col.id
                      ? "bg-primary/10 border border-dashed border-primary/40"
                      : location === `/library?collectionId=${col.id}`
                      ? "bg-primary/8 text-primary border border-primary/15"
                      : "text-foreground/65 hover:bg-secondary/60 border border-transparent"
                  }`}>
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: col.color }} />
                  <span className="text-sm font-medium flex-1 truncate">{col.name}</span>
                  <div className="hidden group-hover:flex items-center gap-1">
                    <button onClick={(e) => { e.preventDefault(); setEditingColId(col.id); setEditingColName(col.name); }}
                      className="p-1 rounded text-muted-foreground hover:text-foreground">
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <button onClick={(e) => { e.preventDefault(); if (confirm(`Delete "${col.name}"? Prompts won't be deleted.`)) deleteCollection.mutate(col.id); }}
                      className="p-1 rounded text-muted-foreground hover:text-destructive">
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </Link>
              )}
            </div>
          ))}

          {collections.length === 0 && !showNewCol && (
            <p className="text-xs text-muted-foreground/50 px-4 py-1">No collections yet</p>
          )}

          <div className="border-t border-border/30 my-3" />

          {/* AI Assistant */}
          <Link href="/assistant" onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group mb-1 ${
              location === "/assistant" ? "bg-primary/10 text-primary border border-primary/20" : "text-foreground/80 hover:bg-secondary/80 hover:text-foreground border border-transparent"
            }`}>
            <Bot className={`w-5 h-5 shrink-0 ${location === "/assistant" ? "text-primary" : "text-muted-foreground group-hover:text-foreground"}`} />
            <span className="font-semibold">AI Assistant</span>
          </Link>

          <div className="border-t border-border/30 my-3" />

          {/* Create tools */}
          <button onClick={() => setCreateOpen((o) => !o)}
            className="w-full flex items-center justify-between px-4 py-2 rounded-xl text-muted-foreground hover:text-foreground hover:bg-secondary/50 transition-all">
            <span className="text-xs font-semibold uppercase tracking-widest">Create</span>
            <ChevronDown className={`w-3.5 h-3.5 transition-transform ${createOpen ? "rotate-180" : ""}`} />
          </button>
          {createOpen && (
            <div className="space-y-0.5 pt-1">
              {navLink("/create", Sparkles, "Persona Architect", true)}
              {navLink("/refactor", PenTool, "Refactor Prompt", true)}
              {navLink("/template", LayoutTemplate, "Template Builder", true)}
            </div>
          )}

          <div className="border-t border-border/30 my-3" />

          {/* Configuration */}
          <div className="px-4 py-1 text-xs font-semibold text-muted-foreground uppercase tracking-widest">Configuration</div>
          {navLink("/mcp", Wrench, "MCP Servers")}
          {navLink("/settings", Settings, "AI Providers")}
        </nav>

        {/* Vault status */}
        <div className="p-3 border-t border-border/50 space-y-2">
          {vault.connected ? (
            <div className="bg-secondary/40 rounded-xl p-3 border border-border/30">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <HardDrive className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-xs font-semibold text-foreground truncate max-w-[130px]">{vault.dirName}</span>
                </div>
                <div className="flex items-center gap-1">
                  <button onClick={syncNow} disabled={vault.isSyncing} title="Sync now"
                    className="p-1 rounded text-muted-foreground hover:text-foreground transition-colors">
                    <RefreshCw className={`w-3 h-3 ${vault.isSyncing ? "animate-spin text-primary" : ""}`} />
                  </button>
                  <button onClick={disconnectVault} title="Disconnect vault"
                    className="p-1 rounded text-muted-foreground hover:text-destructive transition-colors">
                    <X className="w-3 h-3" />
                  </button>
                </div>
              </div>
              {vault.error ? (
                <p className="text-xs text-yellow-400 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{vault.error}</p>
              ) : (
                <div className="text-xs text-muted-foreground space-y-0.5">
                  <p>{vault.fileCount} .md files · {vault.newFiles > 0 ? <span className="text-emerald-400">+{vault.newFiles} new</span> : "up to date"}</p>
                  {vault.lastSync && <p>Synced {formatDistanceToNow(vault.lastSync, { addSuffix: true })}</p>}
                </div>
              )}
            </div>
          ) : (
            <button onClick={openVault} disabled={!isSupported}
              className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl bg-secondary/50 border border-dashed border-border/60 text-xs text-muted-foreground hover:text-foreground hover:border-border transition-all group disabled:opacity-40">
              <HardDrive className="w-3.5 h-3.5 group-hover:text-primary transition-colors" />
              Connect Vault Folder
            </button>
          )}
          {!isSupported && (
            <p className="text-xs text-muted-foreground/50 text-center">Use Chrome/Edge for vault sync</p>
          )}
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
        <header className="md:hidden flex items-center justify-between p-4 border-b border-border/50 glass-panel border-x-0 border-t-0 z-30">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-blue-500 flex items-center justify-center">
              <Library className="w-4 h-4 text-white" />
            </div>
            <h1 className="font-sans font-bold text-lg text-gradient">Prompt Vault</h1>
          </div>
          <button onClick={() => setMobileOpen(true)} className="p-2 rounded-lg bg-secondary text-foreground">
            <Menu className="w-5 h-5" />
          </button>
        </header>
        <div className="flex-1 overflow-y-auto custom-scrollbar relative">{children}</div>
      </main>
    </div>
  );
}
