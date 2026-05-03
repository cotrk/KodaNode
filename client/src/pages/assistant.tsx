import { useState, useRef, useEffect } from "react";
import { useAssistantMessages, useAssistantChat, useClearAssistant } from "@/hooks/use-assistant";
import { useSettings } from "@/hooks/use-settings";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { motion, AnimatePresence } from "framer-motion";
import { Bot, Send, Trash2, Loader2, User, Cpu, Sparkles, Library, Tag } from "lucide-react";

const SUGGESTIONS = [
  { icon: Library, text: "What's in my prompt library?" },
  { icon: Sparkles, text: "How do I write a better persona prompt?" },
  { icon: Tag, text: "What are good tags for organizing AI prompts?" },
  { icon: Bot, text: "Tips for structuring system prompts for local LLMs?" },
];

export default function Assistant() {
  const { data: messages = [], isLoading } = useAssistantMessages();
  const { sendMessage, streamingContent, isStreaming, error } = useAssistantChat();
  const clearHistory = useClearAssistant();
  const { data: settings } = useSettings();

  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  const handleSend = async () => {
    const msg = input.trim();
    if (!msg || isStreaming) return;
    setInput("");
    await sendMessage(msg);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const assistantModel = settings?.assistantModel ?? "llama3.2";

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
              <Cpu className="w-3 h-3 text-emerald-400" />
              <span>{assistantModel}</span>
              {isStreaming && <span className="text-primary animate-pulse ml-1">• responding…</span>}
            </div>
          </div>
        </div>
        {messages.length > 0 && (
          <button onClick={() => clearHistory.mutate()}
            disabled={clearHistory.isPending || isStreaming}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-secondary border border-border/50 text-xs text-muted-foreground hover:text-destructive hover:border-destructive/30 transition-all">
            <Trash2 className="w-3.5 h-3.5" /> Clear chat
          </button>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-4 py-6 space-y-4">
        {isLoading && (
          <div className="flex justify-center"><Loader2 className="w-6 h-6 text-primary animate-spin" /></div>
        )}

        {/* Empty state */}
        {!isLoading && messages.length === 0 && !isStreaming && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            className="max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/15 to-blue-500/15 border border-primary/20 flex items-center justify-center mx-auto mb-4">
                <Bot className="w-8 h-8 text-primary" />
              </div>
              <h2 className="text-xl font-bold text-foreground mb-2">Your Prompt Library Assistant</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Powered by your local Ollama model. Ask me to help name prompts, suggest tags, improve your prompts, or anything about prompt engineering.
              </p>
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
              <Bot className="w-4 h-4 text-primary" />
            </div>
            <div className="flex-1 px-4 py-3 rounded-2xl bg-secondary/40 border border-border/40 text-sm">
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
            <div className="px-4 py-3 rounded-2xl bg-destructive/10 border border-destructive/30 text-sm text-destructive">
              {error}. Make sure Ollama is running and the assistant model is available.
            </div>
          </div>
        )}

        <div ref={endRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-border/50">
        <div className="max-w-3xl mx-auto">
          <div className="flex gap-3 items-end glass-panel rounded-2xl p-3 border-border/60">
            <textarea ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask me anything about your prompts…"
              rows={1} disabled={isStreaming}
              data-testid="input-assistant-message"
              className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground/50 resize-none outline-none text-sm leading-relaxed max-h-32 overflow-y-auto"
              style={{ fieldSizing: "content" } as React.CSSProperties} />
            <button onClick={handleSend} disabled={!input.trim() || isStreaming}
              data-testid="button-assistant-send"
              className="w-9 h-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed shrink-0">
              <Send className="w-4 h-4" />
            </button>
          </div>
          <p className="text-xs text-muted-foreground text-center mt-2">
            Press Enter to send · Shift+Enter for new line
          </p>
        </div>
      </div>
    </div>
  );
}
