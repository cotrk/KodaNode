import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, FolderOpen, FileText, Upload, Check, AlertCircle,
  Loader2, ChevronRight, FolderSearch
} from "lucide-react";
import { useImportMarkdown } from "@/hooks/use-collections";
import { useCollections } from "@/hooks/use-collections";

interface ImportModalProps {
  open: boolean;
  onClose: () => void;
}

interface FilePreview {
  name: string;
  relativePath: string;
  content: string;
  selected: boolean;
}

async function scanDirectoryHandle(
  handle: FileSystemDirectoryHandle,
  depth = 0,
  maxDepth = 4,
  prefix = ""
): Promise<FilePreview[]> {
  if (depth > maxDepth) return [];
  const files: FilePreview[] = [];
  for await (const [name, entry] of handle.entries()) {
    if (entry.kind === "file" && name.toLowerCase().endsWith(".md")) {
      const file = await (entry as FileSystemFileHandle).getFile();
      const content = await file.text();
      files.push({ name, relativePath: prefix ? `${prefix}/${name}` : name, content, selected: true });
    } else if (entry.kind === "directory" && depth < maxDepth) {
      const sub = await scanDirectoryHandle(
        entry as FileSystemDirectoryHandle, depth + 1, maxDepth,
        prefix ? `${prefix}/${name}` : name
      );
      files.push(...sub);
    }
  }
  return files;
}

export function ImportModal({ open, onClose }: ImportModalProps) {
  const [tab, setTab] = useState<"files" | "folder">("files");
  const [previews, setPreviews] = useState<FilePreview[]>([]);
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<{ imported: number; skipped: number; errors: string[] } | null>(null);
  const [collectionId, setCollectionId] = useState<string>("");
  const importMutation = useImportMarkdown();
  const { data: collections = [] } = useCollections();
  const isSupported = typeof window !== "undefined" && "showDirectoryPicker" in window;

  const handleFiles = useCallback(async () => {
    if (!isSupported) return;
    try {
      const handles = await window.showOpenFilePicker({
        multiple: true,
        types: [{ description: "Markdown files", accept: { "text/markdown": [".md"] } }],
      });
      const files: FilePreview[] = [];
      for (const h of handles) {
        const file = await h.getFile();
        const content = await file.text();
        files.push({ name: file.name, relativePath: file.name, content, selected: true });
      }
      setPreviews(files);
      setResult(null);
    } catch (e) {
      if ((e as Error).name !== "AbortError") console.error(e);
    }
  }, [isSupported]);

  const handleFolder = useCallback(async () => {
    if (!isSupported) return;
    setScanning(true);
    try {
      const handle = await window.showDirectoryPicker({ mode: "read" });
      const files = await scanDirectoryHandle(handle);
      setPreviews(files);
      setResult(null);
    } catch (e) {
      if ((e as Error).name !== "AbortError") console.error(e);
    } finally {
      setScanning(false);
    }
  }, [isSupported]);

  const handleImport = async () => {
    const selected = previews.filter((f) => f.selected);
    if (!selected.length) return;
    const res = await importMutation.mutateAsync({
      files: selected.map(({ name, relativePath, content }) => ({ name, relativePath, content })),
      collectionId: collectionId ? Number(collectionId) : undefined,
    });
    setResult(res);
  };

  const toggleAll = (val: boolean) => setPreviews((p) => p.map((f) => ({ ...f, selected: val })));
  const toggleFile = (idx: number) => setPreviews((p) => p.map((f, i) => i === idx ? { ...f, selected: !f.selected } : f));
  const selectedCount = previews.filter((f) => f.selected).length;

  const close = () => {
    onClose();
    setTimeout(() => { setPreviews([]); setResult(null); setCollectionId(""); }, 300);
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={close} />
          <motion.div initial={{ opacity: 0, scale: 0.96, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96 }}
            className="relative w-full max-w-2xl glass-panel rounded-2xl overflow-hidden z-10 shadow-2xl max-h-[85vh] flex flex-col">

            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-border/50">
              <div>
                <h2 className="font-bold text-foreground text-lg">Import Markdown Files</h2>
                <p className="text-xs text-muted-foreground mt-0.5">Pick individual files or scan an entire folder</p>
              </div>
              <button onClick={close} className="p-2 rounded-xl hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-5">
              {/* Not supported warning */}
              {!isSupported && (
                <div className="flex items-center gap-3 p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-400 text-sm">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  File System Access API requires Chrome or Edge. Firefox is not supported.
                </div>
              )}

              {/* Tab + pick buttons */}
              <div className="flex gap-3">
                <button onClick={handleFiles} disabled={!isSupported}
                  className="flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border border-dashed border-border/60 hover:border-primary/40 hover:bg-primary/5 transition-all group disabled:opacity-50">
                  <FileText className="w-7 h-7 text-muted-foreground group-hover:text-primary transition-colors" />
                  <span className="text-sm font-medium text-foreground">Pick Files</span>
                  <span className="text-xs text-muted-foreground text-center">Select one or more .md files</span>
                </button>
                <button onClick={handleFolder} disabled={!isSupported || scanning}
                  className="flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border border-dashed border-border/60 hover:border-primary/40 hover:bg-primary/5 transition-all group disabled:opacity-50">
                  {scanning
                    ? <Loader2 className="w-7 h-7 text-primary animate-spin" />
                    : <FolderSearch className="w-7 h-7 text-muted-foreground group-hover:text-primary transition-colors" />}
                  <span className="text-sm font-medium text-foreground">Scan Folder</span>
                  <span className="text-xs text-muted-foreground text-center">Pick a folder, scans all .md files recursively</span>
                </button>
              </div>

              {/* Collection selector */}
              {previews.length > 0 && (
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Add to collection (optional)</label>
                  <select value={collectionId} onChange={(e) => setCollectionId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg glass-input text-sm text-foreground bg-transparent">
                    <option value="">No collection</option>
                    {collections.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* File list */}
              {previews.length > 0 && (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-foreground">{previews.length} file{previews.length !== 1 ? "s" : ""} found</span>
                    <div className="flex items-center gap-2">
                      <button onClick={() => toggleAll(true)} className="text-xs text-primary hover:underline">All</button>
                      <button onClick={() => toggleAll(false)} className="text-xs text-muted-foreground hover:underline">None</button>
                    </div>
                  </div>
                  <div className="space-y-1 max-h-48 overflow-y-auto custom-scrollbar rounded-xl border border-border/40 p-1">
                    {previews.map((f, i) => (
                      <label key={f.relativePath} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-secondary/50 cursor-pointer">
                        <input type="checkbox" checked={f.selected} onChange={() => toggleFile(i)}
                          className="rounded border-border/50 accent-primary w-4 h-4" />
                        <div className="min-w-0">
                          <p className="text-sm text-foreground truncate">{f.name}</p>
                          {f.relativePath !== f.name && (
                            <p className="text-xs text-muted-foreground truncate">{f.relativePath}</p>
                          )}
                        </div>
                        <span className="ml-auto text-xs text-muted-foreground shrink-0">
                          {Math.round(f.content.length / 1024 * 10) / 10} KB
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Result */}
              {result && (
                <div className="p-4 rounded-xl bg-secondary/50 border border-border/50 space-y-1">
                  <div className="flex items-center gap-2 text-emerald-400 font-medium">
                    <Check className="w-4 h-4" /> Import complete
                  </div>
                  <p className="text-sm text-foreground">{result.imported} imported · {result.skipped} skipped (already in library)</p>
                  {result.errors.length > 0 && (
                    <div className="mt-2 text-xs text-destructive space-y-0.5">
                      {result.errors.slice(0, 5).map((e, i) => <p key={i}>{e}</p>)}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between p-5 border-t border-border/50">
              <span className="text-sm text-muted-foreground">
                {selectedCount > 0 ? `${selectedCount} file${selectedCount !== 1 ? "s" : ""} selected` : "No files selected"}
              </span>
              <div className="flex items-center gap-3">
                <button onClick={close} className="px-4 py-2 rounded-xl bg-secondary text-foreground text-sm font-medium hover:bg-secondary/80 transition-colors">
                  {result ? "Close" : "Cancel"}
                </button>
                {!result && (
                  <button onClick={handleImport} disabled={selectedCount === 0 || importMutation.isPending}
                    className="flex items-center gap-2 px-5 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-colors disabled:opacity-50">
                    {importMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                    Import {selectedCount > 0 ? selectedCount : ""} File{selectedCount !== 1 ? "s" : ""}
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
