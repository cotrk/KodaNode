import { useState, useRef, useEffect } from "react";
import { useAssistantMessages, useAssistantChat, useClearAssistant } from "@/hooks/use-assistant";
import { useSettings } from "@/hooks/use-settings";
import { useModels } from "@/hooks/use-settings";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bot, Send, Trash2, Loader2, User, Cpu, Sparkles, Library, Tag,
  AlertCircle, CheckCircle2, XCircle, Square, ArrowRight, Terminal,
  Wifi, WifiOff, Settings, ChevronRight, Zap,
} from "lucide-react";
import { Link } from "wouter";

const SUGGESTIONS = [
  { icon: Library, text: "What's in my prompt library?" },
  { icon: Sparkles, text: "How do I write a better persona prompt?" },
  { icon: Tag, text: "What are good tags for organizing AI prompts?" },
  { icon: Bot, text: "Tips for structuring system prompts for local LLMs?" },
];

const SETUP_STEPS = [
  {
    step: 1,
    title: "Install Ollama",
    description: "Download and install Ollama for Windows from ollama.com",
    code: null,
    link: "https://ollama.com/download",
  },
  {
    step: 2,
    title: "Start Ollama",
    description: "Run Ollama — it starts a local server at port 11434",
    code: "ollama serve",
    link: null,
  },
  {
    step: 3,
    title: "Pull a model",
    description: "Download a model to run locally (llama3.2 is a good start)",
    code: "ollama pull llama3.2",
    link: null,
  },
  {
    step: 4,
    title: "Configure in Settings",
    description: "Set the Ollama URL and select your assistant model",
    code: null,
    link: "/settings",
  },
];

function PipelineDiagram({ connected, model }: { connected: boolean; model: string }) {
  return (
    <div className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-secondary/30 border border-border/40 text-xs">
      <div className="flex items-center gap-1.5 text-foreground/70">
        <div className="w-6 h-6 rounded-lg bg-primary/15 border border-primary/20 flex items-center justify-center">
          <User className="w-3 h-3 text-primary" />
        </div>
        <span>You</span>
      </div>
      <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/50" />
      <div className="flex items-center gap-1.5 text-foreground/70">
        <div className="w-6 h-6 rounded-lg bg-secondary border border-border/50 flex items-center justify-center">
          <Zap className="w-3 h-3 text-yellow-400" />
        </div>
        <span>Prompt Vault</span>
      </div>
      <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/50" />
      <div className={`flex items-center gap-1.5 ${connected ? "text-emerald-400" : "text-muted-foreground/50"}`}>
        <div className={`w-6 h-6 rounded-lg flex items-center justify-center border ${
          connected ? "bg-emerald-500/10 border-emerald-500/20" : "bg-secondary border-border/50"
        }`}>
          <Cpu className="w-3 h-3" />
        </div>
        <span>{connected ? model : "Ollama (offline)"}</span>
      </div>
      {connected && (
        <>
          <ArrowRight className="w-3.5 h-3.5 text-muted-foreground/50" />
          <div className="flex items-center gap-1.5 text-foreground/70">
            <div className="w-6 h-6 rounded-lg bg-secondary border border-border/50 flex items-center justify-center">
              <Bot className="w-3 h-3 text-primary" />
            </div>
            <span>Response</span>
          </div>
        </>
      )}
    </div>
  );
}

function SetupGuide({ ollamaUrl }: { ollamaUrl: string }) {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="max-w-2xl mx-auto w-full">
      <div className="text-center mb-6">
        <div className="w-14 h-14 rounded-2xl bg-yellow-500/10 border border-yellow-500/20 flex items-center justify-center mx-auto mb-3">
          <WifiOff className="w-7 h-7 text-yellow-400" />
        </div>
        <h2 className="text-lg font-bold text-foreground mb-1">Ollama Not Detected</h2>
        <p className="text-sm text-muted-foreground">
          No local models found at <code className="text-xs bg-secondary px-1.5 py-0.5 rounded">{ollamaUrl}</code>.
          Follow these steps to get set up:
        </p>
      </div>

      <div className="space-y-3 mb-6">
        {SETUP_STEPS.map(({ step, title, description, code, link }) => (
          <div key={step} className="flex gap-3 p-4 rounded-xl glass-panel border-border/50">
            <div className="w-7 h-7 rounded-lg bg-primary/15 border border-primary/20 flex items-center justify-center shrink-0 text-xs font-bold text-primary">
              {step}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm text-foreground mb-0.5">{title}</div>
              <p className="text-xs text-muted-foreground mb-2">{description}</p>
              {code && (
                <div className="flex items-center gap-2 bg-background/60 border border-border/50 rounded-lg px-3 py-1.5">
                  <Terminal className="w-3 h-3 text-muted-foreground shrink-0" />
                  <code className="text-xs text-foreground/80 font-mono">{code}</code>
                </div>
              )}
              {link && link.startsWith("/") && (
                <Link href={link} className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-1">
                  Go to Settings <ChevronRight className="w-3 h-3" />
                </Link>
              )}
              {link && link.startsWith("http") && (
                <a href={link} target="_blank" rel="noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-1">
                  Visit ollama.com <ChevronRight className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-center gap-3">
        <Link href="/settings" className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
          <Settings className="w-4 h-4" /> Open Settings
        </Link>
        <p className="text-xs text-muted-foreground">Once Ollama is running, refresh this page</p>
      </div>
    </motion.div>
  );
}

export default function Assistant() {
  const { data: messages = [], isLoading } = useAssistantMessages();
  const { sendMessage, cancelStream, streamingContent, isStreaming, error } = useAssistantChat();
  const clearHistory = useClearAssistant();
  const { data: settings } = useSettings();
  const { data: models = [], isLoading: modelsLoading } = useModels();

  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const ollamaModels = models.filter((m) => m.provider === "ollama");
  const isConnected = ollamaModels.length > 0;
  const assistantModel = settings?.assistantModel ?? "llama3.2";
  const ollamaUrl = settings?.ollamaUrl ?? "http://localhost:11434";

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  const handleSend = async () => {
    const msg = input.trim();
    if (!msg || isStreaming || !isConnected) return;
    setInput("");
    await sendMessage(msg);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-border/50 glass-panel border-x-0 border-t-0">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/20 to-blue-500/20 border border-primary/20 flex items-center justify-center">
            <Bot className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="font-sans font-bold text-foreground">AI Assistant</h1>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
              {modelsLoading ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : isConnected ? (
                <>
                  <Wifi className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-400">Connected</span>
                  <span className="text-muted-foreground/40">·</span>
                  <Cpu className="w-3 h-3 text-muted-foreground" />
                  <span>{assistantModel}</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3 h-3 text-yellow-400" />
                  <span className="text-yellow-400">Ollama not detected</span>
                </>
              )}
              {isStreaming && <span className="text-primary animate-pulse ml-1">• responding…</span>}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isStreaming && (
            <button onClick={cancelStream}
              data-testid="button-cancel-stream"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-destructive/10 border border-destructive/30 text-xs text-destructive hover:bg-destructive/20 transition-all">
              <Square className="w-3 h-3" /> Stop
            </button>
          )}
          {messages.length > 0 && !isStreaming && (
            <button onClick={() => clearHistory.mutate()}
              disabled={clearHistory.isPending}
              data-testid="button-clear-chat"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary border border-border/50 text-xs text-muted-foreground hover:text-destructive hover:border-destructive/30 transition-all">
              <Trash2 className="w-3.5 h-3.5" /> Clear chat
            </button>
          )}
        </div>
      </div>

      {/* Connection status banner */}
      {!modelsLoading && !isConnected && (
        <div className="px-4 pt-3">
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-yellow-500/8 border border-yellow-500/20 text-sm max-w-3xl mx-auto">
            <AlertCircle className="w-4 h-4 text-yellow-400 shrink-0" />
            <span className="text-yellow-200/80 flex-1">
              Ollama is not running. Chat is unavailable until you connect a local model.
            </span>
            <Link href="/settings" className="text-xs text-yellow-400 hover:underline whitespace-nowrap flex items-center gap-0.5">
              Configure <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      )}

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-4 py-6 space-y-4">
        {isLoading && (
          <div className="flex justify-center"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div>
        )}

        {/* Setup guide — shown when not connected and no messages */}
        {!modelsLoading && !isConnected && messages.length === 0 && (
          <SetupGuide ollamaUrl={ollamaUrl} />
        )}

        {/* Empty state — connected but no messages */}
        {!isLoading && isConnected && messages.length === 0 && !isStreaming && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto">
            <div className="text-center mb-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/15 to-blue-500/15 border border-primary/20 flex items-center justify-center mx-auto mb-4">
                <Bot className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-xl font-bold text-foreground mb-2">Your Prompt Library Assistant</h2>
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                Powered by your local Ollama model. Ask me to help name prompts, suggest tags, improve your prompts, or anything about prompt engineering.
              </p>
              <PipelineDiagram connected={isConnected} model={assistantModel} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {SUGGESTIONS.map(({ icon: Icon, text }) => (
                <button key={text} onClick={() => { setInput(text); inputRef.current?.focus(); }}
                  className="flex items-center gap-3 px-4 py-3.5 rounded-xl glass-panel border-border/50 text-left text-sm text-foreground/80 hover:text-foreground hover:border-border transition-all group">
                  <Icon className="w-4 h-4 text-primary shrink-0 group-hover:scale-110 transition-transform" />
                  <span>{text}</span>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Message history */}
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div key={msg.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className={`flex gap-3 max-w-3xl mx-auto w-full ${msg.role === "user" ? "flex-row-reverse" : ""}`}>
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
                msg.role === "user" ? "bg-primary/15 border border-primary/20" : "bg-secondary border border-border/50"
              }`}>
                {msg.role === "user"
                  ? <User className="w-4 h-4 text-primary" />
                  : <Bot className="w-4 h-4 text-muted-foreground" />}
              </div>
              <div className={`flex-1 px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-primary/10 border border-primary/15 text-foreground"
                  : "bg-secondary/40 border border-border/40 text-foreground"
              }`}>
                {msg.role === "assistant"
                  ? <div className="prose-custom prose-sm"><ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown></div>
                  : <p className="whitespace-pre-wrap">{msg.content}</p>}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Streaming response */}
        {isStreaming && (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
            className="flex gap-3 max-w-3xl mx-auto w-full">
            <div className="w-8 h-8 rounded-xl bg-secondary border border-border/50 flex items-center justify-center shrink-0 mt-0.5">
              <Bot className="w-4 h-4 text-primary animate-pulse" />
            </div>
            <div className="flex-1 px-4 py-3 rounded-2xl bg-secondary/40 border border-primary/20 text-sm">
              {streamingContent ? (
                <div className="prose-custom prose-sm">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{streamingContent}</ReactMarkdown>
                  <span className="inline-block w-1.5 h-4 bg-primary/70 animate-pulse ml-0.5 translate-y-0.5" />
                </div>
              ) : (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Thinking…</span>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {error && (
          <div className="max-w-3xl mx-auto w-full">
            <div className="flex items-start gap-2 px-4 py-3 rounded-2xl bg-destructive/10 border border-destructive/30 text-sm text-destructive">
              <XCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-medium">Error communicating with Ollama</p>
                <p className="text-xs mt-0.5 text-destructive/80">{error}</p>
                <p className="text-xs mt-1 text-destructive/60">Make sure Ollama is running and the model <code className="bg-destructive/10 px-1 rounded">{assistantModel}</code> is available.</p>
              </div>
            </div>
          </div>
        )}

        <div ref={endRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border/50">
        <div className="max-w-3xl mx-auto">
          {/* Pipeline status row — only visible when connected */}
          {isConnected && (
            <div className="mb-3 hidden sm:block">
              <PipelineDiagram connected={isConnected} model={assistantModel} />
            </div>
          )}

          <div className={`flex gap-3 items-end glass-panel rounded-2xl p-3 transition-colors ${
            !isConnected ? "opacity-60 pointer-events-none" : "border-border/60"
          }`}>
            <textarea ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={isConnected ? "Ask me anything about your prompts…" : "Connect Ollama to start chatting…"}
              rows={1} disabled={isStreaming || !isConnected}
              data-testid="input-assistant-message"
              className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground/50 resize-none outline-none text-sm leading-relaxed max-h-32 overflow-y-auto"
              style={{ fieldSizing: "content" } as React.CSSProperties} />

            {isStreaming ? (
              <button onClick={cancelStream}
                data-testid="button-stop-inline"
                className="w-9 h-9 rounded-xl bg-destructive/80 text-white flex items-center justify-center hover:bg-destructive transition-colors shrink-0">
                <Square className="w-4 h-4" />
              </button>
            ) : (
              <button onClick={handleSend} disabled={!input.trim() || isStreaming || !isConnected}
                data-testid="button-assistant-send"
                className="w-9 h-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0">
                <Send className="w-4 h-4" />
              </button>
            )}
          </div>

          <div className="flex items-center justify-between mt-2">
            <p className="text-xs text-muted-foreground">
              {isConnected ? "Enter to send · Shift+Enter for new line" : "Ollama must be running to chat"}
            </p>
            {isConnected && (
              <div className="flex items-center gap-1 text-xs text-emerald-400">
                <CheckCircle2 className="w-3 h-3" />
                <span>{ollamaModels.length} model{ollamaModels.length !== 1 ? "s" : ""} available</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
