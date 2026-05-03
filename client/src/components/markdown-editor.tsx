import { useState, useRef, useEffect, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Edit3, Eye, Columns2, Save, Check } from "lucide-react";

type EditorMode = "edit" | "split" | "preview";

interface MarkdownEditorProps {
  value: string;
  onChange: (v: string) => void;
  onSave?: (v: string) => Promise<void>;
  placeholder?: string;
  autoSave?: boolean;
  autoSaveDelay?: number;
}

export function MarkdownEditor({
  value,
  onChange,
  onSave,
  placeholder = "Start writing your prompt in Markdown…",
  autoSave = true,
  autoSaveDelay = 1500,
}: MarkdownEditorProps) {
  const [mode, setMode] = useState<EditorMode>("split");
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const isSyncScrolling = useRef(false);

  const triggerSave = useCallback(async (v: string) => {
    if (!onSave) return;
    setSaving(true);
    try {
      await onSave(v);
      setSavedAt(new Date());
    } finally {
      setSaving(false);
    }
  }, [onSave]);

  const handleChange = (v: string) => {
    onChange(v);
    if (autoSave && onSave) {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
      autoSaveTimer.current = setTimeout(() => triggerSave(v), autoSaveDelay);
    }
  };

  useEffect(() => () => { if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current); }, []);

  // Sync scrolling between editor and preview
  const handleEditorScroll = () => {
    if (isSyncScrolling.current || mode !== "split") return;
    const ta = textareaRef.current;
    const pv = previewRef.current;
    if (!ta || !pv) return;
    isSyncScrolling.current = true;
    const ratio = ta.scrollTop / (ta.scrollHeight - ta.clientHeight || 1);
    pv.scrollTop = ratio * (pv.scrollHeight - pv.clientHeight);
    requestAnimationFrame(() => { isSyncScrolling.current = false; });
  };

  const modeBtn = (m: EditorMode, Icon: typeof Edit3, label: string) => (
    <button key={m} onClick={() => setMode(m)} title={label}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
        mode === m ? "bg-primary/15 text-primary border border-primary/20" : "text-muted-foreground hover:text-foreground hover:bg-secondary/80"
      }`}>
      <Icon className="w-3.5 h-3.5" />{label}
    </button>
  );

  const statusMsg = saving
    ? <span className="text-xs text-muted-foreground flex items-center gap-1 animate-pulse"><Save className="w-3 h-3" /> Saving…</span>
    : savedAt
    ? <span className="text-xs text-emerald-400 flex items-center gap-1"><Check className="w-3 h-3" /> Saved</span>
    : null;

  return (
    <div className="flex flex-col h-full rounded-2xl overflow-hidden border border-border/40 bg-[#0a0a0c]">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-border/40 bg-secondary/20 shrink-0">
        <div className="flex items-center gap-1">
          {modeBtn("edit", Edit3, "Edit")}
          {modeBtn("split", Columns2, "Split")}
          {modeBtn("preview", Eye, "Preview")}
        </div>
        <div className="flex items-center gap-3">
          {statusMsg}
          {onSave && !autoSave && (
            <button onClick={() => triggerSave(value)} disabled={saving}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-xs font-medium hover:bg-primary/20 transition-colors">
              <Save className="w-3.5 h-3.5" /> Save
            </button>
          )}
        </div>
      </div>

      {/* Editor area */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        {/* Raw editor pane */}
        {(mode === "edit" || mode === "split") && (
          <div className={`flex flex-col ${mode === "split" ? "w-1/2 border-r border-border/30" : "w-full"}`}>
            {mode === "split" && (
              <div className="px-4 py-1.5 border-b border-border/20 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
                Markdown
              </div>
            )}
            <textarea
              ref={textareaRef}
              value={value}
              onChange={(e) => handleChange(e.target.value)}
              onScroll={handleEditorScroll}
              placeholder={placeholder}
              spellCheck={false}
              className="flex-1 w-full bg-transparent text-foreground/90 placeholder:text-muted-foreground/30 font-mono text-sm leading-relaxed p-4 resize-none outline-none overflow-y-auto custom-scrollbar"
              style={{ tabSize: 2 }}
            />
          </div>
        )}

        {/* Preview pane */}
        {(mode === "preview" || mode === "split") && (
          <div className={`flex flex-col ${mode === "split" ? "w-1/2" : "w-full"}`}>
            {mode === "split" && (
              <div className="px-4 py-1.5 border-b border-border/20 text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
                Preview
              </div>
            )}
            <div
              ref={previewRef}
              className="flex-1 p-4 md:p-5 overflow-y-auto custom-scrollbar"
            >
              {value ? (
                <div className="prose-custom">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{value}</ReactMarkdown>
                </div>
              ) : (
                <p className="text-muted-foreground/30 text-sm italic">Preview will appear here…</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
